package com.society.backend.flat.service;

import com.society.backend.flat.dto.BulkWingImportResponse;
import com.society.backend.flat.dto.BulkWingImportResponse.WingImportResult;
import com.society.backend.flat.dto.WingImportRow;
import com.society.backend.entity.Society;
import com.society.backend.entity.Wing;
import com.society.backend.exception.ApiException;
import com.society.backend.flat.repository.WingRepository;
import com.society.backend.society.repository.SocietyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkWingImportService {

    private final WingRepository wingRepository;
    private final SocietyRepository societyRepository;

    public List<WingImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<WingImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;
            for (Row row : sheet) {
                rowCount++;
                if (rowCount == 1)
                    continue;
                if (isRowEmpty(row))
                    continue;

                WingImportRow importRow = new WingImportRow();
                importRow.setRowNumber(rowCount);
                importRow.setName(getCellValueAsString(row.getCell(0)));
                importRow.setDescription(getCellValueAsString(row.getCell(1)));
                String floorsStr = getCellValueAsString(row.getCell(2));
                if (floorsStr != null && !floorsStr.isEmpty()) {
                    try {
                        importRow.setTotalFloors(Integer.parseInt(floorsStr.replaceAll("[^0-9]", "")));
                    } catch (NumberFormatException e) {
                        importRow.setTotalFloors(null);
                    }
                }
                rows.add(importRow);
            }
        }
        return rows;
    }

    public BulkWingImportResponse validateImportRows(List<WingImportRow> rows, Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Set<String> existingNames = new HashSet<>();
        List<Wing> societyWings = wingRepository.findBySocietyId(societyId);
        for (Wing w : societyWings) {
            existingNames.add(w.getName().toUpperCase());
        }
        Set<String> seenNames = new HashSet<>();

        Integer totalWings = society.getTotalWings();
        int maxAllowed = (totalWings != null && totalWings > 0) ? totalWings : Integer.MAX_VALUE;
        int remainingSlots = Math.max(maxAllowed - societyWings.size(), 0);
        int acceptedNewWings = 0;

        BulkWingImportResponse response = new BulkWingImportResponse();
        response.setTotalRows(rows.size());
        int valid = 0, invalid = 0;

        for (WingImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            if (row.getName() == null || row.getName().trim().isEmpty()) {
                errors.add("Wing name is required");
            } else {
                String nameUpper = row.getName().trim().toUpperCase();
                if (seenNames.contains(nameUpper)) {
                    errors.add("Duplicate wing name in file");
                } else {
                    seenNames.add(nameUpper);
                    if (existingNames.contains(nameUpper)) {
                        errors.add("Wing '" + row.getName().trim() + "' already exists in society");
                    }
                }
            }

            if (row.getTotalFloors() != null && (row.getTotalFloors() < 1 || row.getTotalFloors() > 200)) {
                errors.add("Total floors must be between 1 and 200");
            }

            if (errors.isEmpty() && acceptedNewWings >= remainingSlots) {
                errors.add("Wing capacity reached for this society");
            }

            WingImportResult result = new WingImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());

            if (!errors.isEmpty()) {
                row.setValid(false);
                row.setErrorMessage(String.join("; ", errors));
                result.setSuccess(false);
                result.setErrorMessage(row.getErrorMessage());
                invalid++;
            } else {
                row.setValid(true);
                result.setSuccess(true);
                acceptedNewWings++;
                valid++;
            }
            response.getResults().add(result);
        }

        response.setSuccessCount(valid);
        response.setFailureCount(invalid);
        response.setMessage(String.format("Validation complete: %d valid, %d invalid", valid, invalid));
        return response;
    }

    @Transactional
    public BulkWingImportResponse processImport(List<WingImportRow> rows, Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        Integer totalWings = society.getTotalWings();
        int maxAllowed = (totalWings != null && totalWings > 0) ? totalWings : Integer.MAX_VALUE;

        BulkWingImportResponse response = new BulkWingImportResponse();
        response.setTotalRows(rows.size());
        int success = 0, failure = 0;

        for (WingImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults()
                        .add(WingImportResult.failure(row.getRowNumber(), row.getName(), row.getErrorMessage()));
                failure++;
                continue;
            }
            try {
                long currentWingCount = wingRepository.countBySocietyId(societyId);
                if (currentWingCount >= maxAllowed) {
                    response.getResults().add(
                            WingImportResult.failure(
                                    row.getRowNumber(),
                                    row.getName(),
                                    "Wing capacity reached for this society"));
                    failure++;
                    continue;
                }

                Wing wing = new Wing();
                wing.setSociety(society);
                wing.setName(row.getName().trim());
                wing.setDescription(row.getDescription());
                wing.setTotalFloors(row.getTotalFloors());
                Wing saved = wingRepository.save(wing);
                response.getResults().add(WingImportResult.success(row.getRowNumber(), row.getName(), saved.getId()));
                success++;
            } catch (Exception e) {
                response.getResults().add(WingImportResult.failure(row.getRowNumber(), row.getName(), e.getMessage()));
                failure++;
            }
        }

        response.setSuccessCount(success);
        response.setFailureCount(failure);
        response.setMessage(String.format("Import complete: %d created, %d failed", success, failure));
        return response;
    }

    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Wings");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Wing Name*", "Description", "Total Floors" };

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            String[][] sampleData = {
                    { "A", "Tower A - Main Building", "15" },
                    { "B", "Tower B - East Wing", "12" },
                    { "C", "Tower C - Commercial", "5" },
            };
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            Sheet instructions = workbook.createSheet("Instructions");
            String[][] instructionData = {
                    { "Bulk Wing Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Wing Name: Unique name/code for the wing (e.g., A, B, Tower-1)" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Description: Brief description of the wing" },
                    { "- Total Floors: Number of floors in this wing" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify column names" },
                    { "- Delete sample data rows before adding your data" },
                    { "- Wing names must be unique within the society" },
            };
            for (int i = 0; i < instructionData.length; i++) {
                Row row = instructions.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(instructionData[i][0]);
                if (i == 0)
                    cell.setCellStyle(headerStyle);
            }
            instructions.setColumnWidth(0, 18000);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate template: " + e.getMessage(), e);
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int i = 0; i < 3; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellValueAsString(cell);
                if (val != null && !val.trim().isEmpty())
                    return false;
            }
        }
        return true;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> null;
        };
    }
}
