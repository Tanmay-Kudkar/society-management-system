package com.society.backend.service.flat;

import com.society.backend.dto.flat.BulkFlatImportResponse;
import com.society.backend.dto.flat.BulkFlatImportResponse.FlatImportResult;
import com.society.backend.dto.flat.FlatImportRow;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Society;
import com.society.backend.entity.Wing;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.WingRepository;
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
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkFlatImportService {

    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;
    private final WingRepository wingRepository;

    private static final Set<String> VALID_UNIT_TYPES = Set.of("FLAT", "SHOP", "OFFICE");
    private static final Set<String> VALID_FLAT_TYPES = Set.of(
            "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "PENTHOUSE", "DUPLEX", "STUDIO");
    private static final Set<String> VALID_SHOP_TYPES = Set.of(
            "RETAIL", "SHOWROOM", "RESTAURANT", "KIOSK", "WAREHOUSE");
    private static final Set<String> VALID_OFFICE_TYPES = Set.of(
            "STANDARD", "CABIN", "COWORKING", "SUITE", "FLOOR");

    /**
     * Parse Excel file and extract unit data
     */
    public List<FlatImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<FlatImportRow> rows = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;

            for (Row row : sheet) {
                rowCount++;
                // Skip header row
                if (rowCount == 1)
                    continue;

                // Skip empty rows
                if (isRowEmpty(row))
                    continue;

                FlatImportRow importRow = new FlatImportRow();
                importRow.setRowNumber(rowCount);

                // Column A: Unit Type
                String unitType = getCellValueAsString(row.getCell(0));
                importRow.setUnitType(unitType != null && !unitType.isEmpty() ? unitType.toUpperCase() : "FLAT");

                // Column B: Wing Code (optional)
                importRow.setWingCode(getCellValueAsString(row.getCell(1)));

                // Column C: Unit Number
                importRow.setFlatNumber(getCellValueAsString(row.getCell(2)));

                // Column D: Configuration/Type
                importRow.setFlatType(getCellValueAsString(row.getCell(3)));

                // Column E: Floor
                String floorStr = getCellValueAsString(row.getCell(4));
                if (floorStr != null && !floorStr.isEmpty()) {
                    try {
                        importRow.setFloor(Integer.parseInt(floorStr.replaceAll("[^0-9-]", "")));
                    } catch (NumberFormatException e) {
                        importRow.setFloor(0);
                    }
                }

                // Column F: Area (sq.ft)
                String areaStr = getCellValueAsString(row.getCell(5));
                if (areaStr != null && !areaStr.isEmpty()) {
                    try {
                        importRow.setArea(Double.parseDouble(areaStr.replaceAll("[^0-9.]", "")));
                    } catch (NumberFormatException e) {
                        importRow.setArea(null);
                    }
                }

                rows.add(importRow);
            }
        }

        return rows;
    }

    /**
     * Validate import rows and return validation results
     */
    public BulkFlatImportResponse validateImportRows(List<FlatImportRow> rows, Long societyId) {
        // Pre-fetch wings for the society (case-sensitive matching)
        Map<String, Wing> wingMap = new HashMap<>();
        List<Wing> societyWings = wingRepository.findBySocietyId(societyId);
        for (Wing wing : societyWings) {
            wingMap.put(wing.getName(), wing);
        }

        // Pre-fetch existing flat numbers to check duplicates
        Set<String> existingFlatNumbers = new HashSet<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat flat : societyFlats) {
            existingFlatNumbers.add(flat.getFlatNumber().toUpperCase());
        }

        // Track flat numbers in the import file for internal duplicate check
        Set<String> seenFlatNumbers = new HashSet<>();

        BulkFlatImportResponse response = new BulkFlatImportResponse();
        response.setTotalRows(rows.size());
        int validCount = 0;
        int invalidCount = 0;

        for (FlatImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            // Validate unit type
            if (row.getUnitType() == null || !VALID_UNIT_TYPES.contains(row.getUnitType())) {
                errors.add("Invalid unit type (must be FLAT, SHOP, or OFFICE)");
            }

            // Validate unit number
            if (row.getFlatNumber() == null || row.getFlatNumber().trim().isEmpty()) {
                errors.add("Unit number is required");
            } else {
                String flatNumberUpper = row.getFlatNumber().trim().toUpperCase();

                // Check for duplicates in file
                if (seenFlatNumbers.contains(flatNumberUpper)) {
                    errors.add("Duplicate unit number in file");
                } else {
                    seenFlatNumbers.add(flatNumberUpper);

                    // Check if unit already exists in database
                    if (existingFlatNumbers.contains(flatNumberUpper)) {
                        errors.add("Unit number already exists in society");
                    }
                }
            }

            // Validate wing code if provided (case-sensitive)
            Wing selectedWing = null;
            if (row.getWingCode() != null && !row.getWingCode().trim().isEmpty()) {
                selectedWing = wingMap.get(row.getWingCode().trim());
                if (selectedWing == null) {
                    errors.add("Wing not found: " + row.getWingCode() + " (wing names are case-sensitive)");
                }
            }

            // Validate floor
            if (row.getFloor() == null) {
                errors.add("Floor is required");
            } else if (row.getFloor() < -10 || row.getFloor() > 200) {
                errors.add("Floor must be between -10 and 200");
            } else if (selectedWing != null && selectedWing.getTotalFloors() != null) {
                // Validate floor against wing's total floors
                if (row.getFloor() > selectedWing.getTotalFloors()) {
                    errors.add("Floor " + row.getFloor() + " exceeds wing's total floors ("
                            + selectedWing.getTotalFloors() + ")");
                }
            }

            // Validate configuration based on unit type
            if (row.getFlatType() != null && !row.getFlatType().trim().isEmpty()) {
                String type = row.getFlatType().trim().toUpperCase();
                String unitType = row.getUnitType() != null ? row.getUnitType() : "FLAT";

                boolean validType = switch (unitType) {
                    case "FLAT" -> VALID_FLAT_TYPES.contains(type);
                    case "SHOP" -> VALID_SHOP_TYPES.contains(type);
                    case "OFFICE" -> VALID_OFFICE_TYPES.contains(type);
                    default -> false;
                };

                if (!validType) {
                    errors.add("Invalid configuration '" + row.getFlatType() + "' for unit type " + unitType);
                }
            }

            // Validate area if provided
            if (row.getArea() != null && (row.getArea() < 0 || row.getArea() > 100000)) {
                errors.add("Area must be between 0 and 100,000 sq.ft");
            }

            // Set validation result
            FlatImportResult result = new FlatImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setFlatNumber(row.getFlatNumber());
            result.setUnitType(row.getUnitType());
            result.setWingCode(row.getWingCode());

            if (!errors.isEmpty()) {
                row.setValid(false);
                row.setErrorMessage(String.join("; ", errors));
                result.setSuccess(false);
                result.setErrorMessage(row.getErrorMessage());
                invalidCount++;
            } else {
                row.setValid(true);
                result.setSuccess(true);
                validCount++;
            }

            response.getResults().add(result);
        }

        response.setSuccessCount(validCount);
        response.setFailureCount(invalidCount);
        response.setMessage(String.format("Validation complete: %d valid, %d invalid", validCount, invalidCount));

        return response;
    }

    /**
     * Process and create units from validated rows
     */
    @Transactional
    public BulkFlatImportResponse processImport(List<FlatImportRow> rows, Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        // Pre-fetch wings (case-sensitive matching)
        Map<String, Wing> wingMap = new HashMap<>();
        List<Wing> societyWings = wingRepository.findBySocietyId(societyId);
        for (Wing wing : societyWings) {
            wingMap.put(wing.getName(), wing);
        }

        BulkFlatImportResponse response = new BulkFlatImportResponse();
        response.setTotalRows(rows.size());

        int successCount = 0;
        int failureCount = 0;

        for (FlatImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults().add(FlatImportResult.failure(
                        row.getRowNumber(), row.getFlatNumber(), row.getUnitType(), row.getErrorMessage()));
                failureCount++;
                continue;
            }

            try {
                Flat flat = new Flat();
                flat.setSociety(society);
                flat.setFlatNumber(row.getFlatNumber().trim());
                flat.setUnitType(row.getUnitType());
                flat.setFlatType(row.getFlatType() != null ? row.getFlatType().trim().toUpperCase() : null);
                flat.setFloor(row.getFloor());
                flat.setArea(row.getArea() != null ? BigDecimal.valueOf(row.getArea()) : null);
                flat.setIsOccupied(false);

                // Set wing if provided (case-sensitive)
                if (row.getWingCode() != null && !row.getWingCode().trim().isEmpty()) {
                    Wing wing = wingMap.get(row.getWingCode().trim());
                    if (wing != null) {
                        flat.setWing(wing);
                    }
                }

                Flat savedFlat = flatRepository.save(flat);

                response.getResults().add(FlatImportResult.success(
                        row.getRowNumber(), row.getFlatNumber(), row.getUnitType(), savedFlat.getId()));
                successCount++;

                log.info("Created unit {} (type: {}) in society {}",
                        savedFlat.getFlatNumber(), savedFlat.getUnitType(), societyId);

            } catch (Exception e) {
                log.error("Error creating unit {}: {}", row.getFlatNumber(), e.getMessage());
                response.getResults().add(FlatImportResult.failure(
                        row.getRowNumber(), row.getFlatNumber(), row.getUnitType(), e.getMessage()));
                failureCount++;
            }
        }

        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        response.setMessage(String.format("Import complete: %d created, %d failed out of %d total",
                successCount, failureCount, rows.size()));

        log.info("Bulk unit import completed: {}", response.getMessage());

        return response;
    }

    /**
     * Generate Excel template for bulk unit import
     */
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Units");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Unit Type*", "Wing", "Unit Number*", "Configuration", "Floor*", "Area (sq.ft)" };

            // Create header style
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
                sheet.setColumnWidth(i, 4500);
            }

            // Add sample data rows
            String[][] sampleData = {
                    { "FLAT", "A", "A-101", "2BHK", "1", "950" },
                    { "FLAT", "A", "A-102", "3BHK", "1", "1200" },
                    { "SHOP", "B", "S-01", "RETAIL", "0", "500" },
                    { "OFFICE", "B", "O-201", "STANDARD", "2", "800" },
            };

            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            // Add instructions sheet
            Sheet instructionsSheet = workbook.createSheet("Instructions");
            String[][] instructions = {
                    { "Bulk Unit Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Unit Type: FLAT, SHOP, or OFFICE" },
                    { "- Unit Number: Unique identifier for the unit (e.g., A-101, S-01)" },
                    { "- Floor: Floor number (0 for ground floor)" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Wing: Wing name/code (must exist in the system)" },
                    { "- Configuration: Based on unit type:" },
                    { "    FLAT: 1RK, 1BHK, 2BHK, 3BHK, 4BHK, 5BHK, PENTHOUSE, DUPLEX, STUDIO" },
                    { "    SHOP: RETAIL, SHOWROOM, RESTAURANT, KIOSK, WAREHOUSE" },
                    { "    OFFICE: STANDARD, CABIN, COWORKING, SUITE, FLOOR" },
                    { "- Area: Size in square feet" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify column names" },
                    { "- Delete sample data rows before adding your data" },
                    { "- Unit numbers must be unique within the society" },
                    { "- Wing codes are case-insensitive" },
            };

            for (int i = 0; i < instructions.length; i++) {
                Row row = instructionsSheet.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(instructions[i].length > 0 ? instructions[i][0] : "");
                if (i == 0) {
                    cell.setCellStyle(headerStyle);
                }
            }
            instructionsSheet.setColumnWidth(0, 18000);

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate template: " + e.getMessage(), e);
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int i = 0; i < 6; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueAsString(cell);
                if (value != null && !value.trim().isEmpty()) {
                    return false;
                }
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
                double value = cell.getNumericCellValue();
                if (value == Math.floor(value)) {
                    yield String.valueOf((long) value);
                }
                yield String.valueOf(value);
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
