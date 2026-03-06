package com.society.backend.security.service;

import com.society.backend.security.dto.BulkVehicleImportResponse;
import com.society.backend.security.dto.BulkVehicleImportResponse.VehicleImportResult;
import com.society.backend.security.dto.VehicleImportRow;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Vehicle;
import com.society.backend.exception.ApiException;
import com.society.backend.flat.repository.FlatRepository;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.security.repository.VehicleRepository;
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
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkVehicleImportService {

    private final VehicleRepository vehicleRepository;
    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;

    private static final Set<String> VALID_TYPES = Set.of("TWO_WHEELER", "FOUR_WHEELER");
    private static final Pattern VEHICLE_NUMBER_PATTERN = Pattern.compile("^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$");

    public List<VehicleImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<VehicleImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;
            for (Row row : sheet) {
                rowCount++;
                if (rowCount == 1)
                    continue;
                if (isRowEmpty(row))
                    continue;

                VehicleImportRow r = new VehicleImportRow();
                r.setRowNumber(rowCount);
                r.setFlatNumber(getCellValueAsString(row.getCell(0)));
                r.setVehicleType(getCellValueAsString(row.getCell(1)));
                r.setVehicleNumber(getCellValueAsString(row.getCell(2)));
                r.setBrand(getCellValueAsString(row.getCell(3)));
                r.setModel(getCellValueAsString(row.getCell(4)));
                r.setColor(getCellValueAsString(row.getCell(5)));
                r.setOwnerName(getCellValueAsString(row.getCell(6)));
                r.setParkingSlot(getCellValueAsString(row.getCell(7)));

                rows.add(r);
            }
        }
        return rows;
    }

    public BulkVehicleImportResponse validateImportRows(List<VehicleImportRow> rows, Long societyId) {
        Map<String, Flat> flatMap = new HashMap<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat f : societyFlats) {
            flatMap.put(f.getFlatNumber().toUpperCase(), f);
        }

        // Check existing vehicle numbers
        Set<String> existingVehicleNumbers = new HashSet<>();
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        for (Vehicle v : allVehicles) {
            existingVehicleNumbers.add(v.getVehicleNumber().toUpperCase().replaceAll("\\s+", ""));
        }

        Set<String> seenNumbers = new HashSet<>();

        BulkVehicleImportResponse response = new BulkVehicleImportResponse();
        response.setTotalRows(rows.size());
        int valid = 0, invalid = 0;

        for (VehicleImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            // Validate flat number
            if (row.getFlatNumber() == null || row.getFlatNumber().trim().isEmpty()) {
                errors.add("Unit number is required");
            } else {
                Flat flat = flatMap.get(row.getFlatNumber().trim().toUpperCase());
                if (flat == null) {
                    errors.add("Unit '" + row.getFlatNumber() + "' not found in society");
                }
            }

            // Validate vehicle type
            if (row.getVehicleType() == null || row.getVehicleType().trim().isEmpty()) {
                errors.add("Vehicle type is required");
            } else if (!VALID_TYPES.contains(row.getVehicleType().trim().toUpperCase())) {
                errors.add("Invalid vehicle type (use TWO_WHEELER or FOUR_WHEELER)");
            }

            // Validate vehicle number
            if (row.getVehicleNumber() == null || row.getVehicleNumber().trim().isEmpty()) {
                errors.add("Vehicle number is required");
            } else {
                String numClean = row.getVehicleNumber().trim().toUpperCase().replaceAll("\\s+", "");
                if (seenNumbers.contains(numClean)) {
                    errors.add("Duplicate vehicle number in file");
                } else {
                    seenNumbers.add(numClean);
                    if (existingVehicleNumbers.contains(numClean)) {
                        errors.add("Vehicle number already registered");
                    }
                }
            }

            VehicleImportResult result = new VehicleImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setVehicleNumber(row.getVehicleNumber());
            result.setFlatNumber(row.getFlatNumber());

            if (!errors.isEmpty()) {
                row.setValid(false);
                row.setErrorMessage(String.join("; ", errors));
                result.setSuccess(false);
                result.setErrorMessage(row.getErrorMessage());
                invalid++;
            } else {
                row.setValid(true);
                result.setSuccess(true);
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
    public BulkVehicleImportResponse processImport(List<VehicleImportRow> rows, Long societyId) {
        Map<String, Flat> flatMap = new HashMap<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat f : societyFlats) {
            flatMap.put(f.getFlatNumber().toUpperCase(), f);
        }

        BulkVehicleImportResponse response = new BulkVehicleImportResponse();
        response.setTotalRows(rows.size());
        int success = 0, failure = 0;

        for (VehicleImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults().add(VehicleImportResult.failure(row.getRowNumber(), row.getVehicleNumber(),
                        row.getFlatNumber(), row.getErrorMessage()));
                failure++;
                continue;
            }
            try {
                Flat flat = flatMap.get(row.getFlatNumber().trim().toUpperCase());
                Vehicle vehicle = new Vehicle();
                vehicle.setFlat(flat);
                vehicle.setVehicleType(row.getVehicleType().trim().toUpperCase());
                vehicle.setVehicleNumber(row.getVehicleNumber().trim().toUpperCase());
                vehicle.setBrand(row.getBrand());
                vehicle.setModel(row.getModel());
                vehicle.setColor(row.getColor());
                vehicle.setOwnerName(row.getOwnerName());
                vehicle.setParkingSlot(row.getParkingSlot());

                Vehicle saved = vehicleRepository.save(vehicle);
                response.getResults().add(VehicleImportResult.success(row.getRowNumber(), row.getVehicleNumber(),
                        row.getFlatNumber(), saved.getId()));
                success++;
            } catch (Exception e) {
                response.getResults().add(VehicleImportResult.failure(row.getRowNumber(), row.getVehicleNumber(),
                        row.getFlatNumber(), e.getMessage()));
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
            Sheet sheet = workbook.createSheet("Vehicles");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Unit Number*", "Vehicle Type*", "Vehicle Number*", "Brand", "Model", "Color",
                    "Owner Name", "Parking Slot" };

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
                    { "A-101", "FOUR_WHEELER", "MH02AB1234", "Honda", "City", "White", "Rahul Sharma", "P-101" },
                    { "A-101", "TWO_WHEELER", "MH02CD5678", "Honda", "Activa", "Black", "Rahul Sharma", "B-15" },
                    { "A-102", "FOUR_WHEELER", "MH04EF9012", "Hyundai", "Creta", "Silver", "Priya Patel", "P-102" },
            };
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            Sheet instructions = workbook.createSheet("Instructions");
            String[][] instructionData = {
                    { "Bulk Vehicle Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Unit Number: Must match an existing unit (e.g., A-101)" },
                    { "- Vehicle Type: TWO_WHEELER or FOUR_WHEELER" },
                    { "- Vehicle Number: Indian vehicle registration number (e.g., MH02AB1234)" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Brand: Vehicle manufacturer (e.g., Honda, Hyundai)" },
                    { "- Model: Vehicle model name" },
                    { "- Color: Vehicle color" },
                    { "- Owner Name: Name of the vehicle owner" },
                    { "- Parking Slot: Assigned parking slot number" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify" },
                    { "- Delete sample rows before adding your data" },
                    { "- Multiple vehicles can be added per unit" },
                    { "- Vehicle numbers must be unique" },
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
        for (int i = 0; i < 8; i++) {
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
