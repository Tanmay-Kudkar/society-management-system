package com.society.backend.vendor.service;

import com.society.backend.vendor.dto.BulkVendorImportResponse;
import com.society.backend.vendor.dto.BulkVendorImportResponse.VendorImportResult;
import com.society.backend.vendor.dto.VendorImportRow;
import com.society.backend.entity.Society;
import com.society.backend.entity.Vendor;
import com.society.backend.exception.ApiException;
import com.society.backend.society.repository.SocietyRepository;
import com.society.backend.vendor.repository.VendorRepository;
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
public class BulkVendorImportService {

    private final VendorRepository vendorRepository;
    private final SocietyRepository societyRepository;

    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+91)?[6-9]\\d{9}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern GST_PATTERN = Pattern
            .compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");
    private static final Set<String> VALID_SERVICE_TYPES = Set.of(
            "PLUMBER", "ELECTRICIAN", "SECURITY", "HOUSEKEEPING", "GARDENER",
            "PEST_CONTROL", "ELEVATOR", "PAINTING", "CARPENTRY", "AC_REPAIR",
            "CCTV", "FIRE_SAFETY", "WATER_SUPPLY", "GARBAGE", "OTHER");

    public List<VendorImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<VendorImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;
            for (Row row : sheet) {
                rowCount++;
                if (rowCount == 1)
                    continue;
                if (isRowEmpty(row))
                    continue;

                VendorImportRow r = new VendorImportRow();
                r.setRowNumber(rowCount);
                r.setName(getCellValueAsString(row.getCell(0)));
                r.setServiceType(getCellValueAsString(row.getCell(1)));
                r.setContactPerson(getCellValueAsString(row.getCell(2)));
                r.setPhone(getCellValueAsString(row.getCell(3)));
                r.setEmail(getCellValueAsString(row.getCell(4)));
                r.setAddress(getCellValueAsString(row.getCell(5)));
                r.setGstNumber(getCellValueAsString(row.getCell(6)));
                r.setPanNumber(getCellValueAsString(row.getCell(7)));

                rows.add(r);
            }
        }
        return rows;
    }

    public BulkVendorImportResponse validateImportRows(List<VendorImportRow> rows, Long societyId) {
        Set<String> seenNames = new HashSet<>();

        BulkVendorImportResponse response = new BulkVendorImportResponse();
        response.setTotalRows(rows.size());
        int valid = 0, invalid = 0;

        for (VendorImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            if (row.getName() == null || row.getName().trim().isEmpty()) {
                errors.add("Vendor name is required");
            } else {
                String nameKey = row.getName().trim().toUpperCase();
                if (seenNames.contains(nameKey)) {
                    errors.add("Duplicate vendor name in file");
                } else {
                    seenNames.add(nameKey);
                }
            }

            if (row.getServiceType() == null || row.getServiceType().trim().isEmpty()) {
                errors.add("Service type is required");
            } else if (!VALID_SERVICE_TYPES.contains(row.getServiceType().trim().toUpperCase())) {
                errors.add(
                        "Invalid service type (valid: PLUMBER, ELECTRICIAN, SECURITY, HOUSEKEEPING, GARDENER, PEST_CONTROL, ELEVATOR, PAINTING, CARPENTRY, AC_REPAIR, CCTV, FIRE_SAFETY, WATER_SUPPLY, GARBAGE, OTHER)");
            }

            if (row.getPhone() != null && !row.getPhone().isEmpty()) {
                String phone = row.getPhone().replaceAll("\\s+", "");
                if (!PHONE_PATTERN.matcher(phone).matches()) {
                    errors.add("Invalid phone number");
                }
            }

            if (row.getEmail() != null && !row.getEmail().isEmpty()) {
                if (!EMAIL_PATTERN.matcher(row.getEmail()).matches()) {
                    errors.add("Invalid email format");
                }
            }

            if (row.getGstNumber() != null && !row.getGstNumber().isEmpty()) {
                if (!GST_PATTERN.matcher(row.getGstNumber().trim().toUpperCase()).matches()) {
                    errors.add("Invalid GST number format");
                }
            }

            if (row.getPanNumber() != null && !row.getPanNumber().isEmpty()) {
                if (!PAN_PATTERN.matcher(row.getPanNumber().trim().toUpperCase()).matches()) {
                    errors.add("Invalid PAN number format");
                }
            }

            VendorImportResult result = new VendorImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());
            result.setServiceType(row.getServiceType());

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
    public BulkVendorImportResponse processImport(List<VendorImportRow> rows, Long societyId) {
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        BulkVendorImportResponse response = new BulkVendorImportResponse();
        response.setTotalRows(rows.size());
        int success = 0, failure = 0;

        for (VendorImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults().add(VendorImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getServiceType(), row.getErrorMessage()));
                failure++;
                continue;
            }
            try {
                Vendor vendor = new Vendor();
                vendor.setSociety(society);
                vendor.setName(row.getName().trim());
                vendor.setServiceType(row.getServiceType().trim().toUpperCase());
                vendor.setContactPerson(row.getContactPerson());
                vendor.setPhone(row.getPhone());
                vendor.setEmail(row.getEmail());
                vendor.setAddress(row.getAddress());
                vendor.setApprovalStatus("APPROVED");
                vendor.setIsActive(true);

                if (row.getGstNumber() != null && !row.getGstNumber().isEmpty()) {
                    vendor.setGstNumber(row.getGstNumber().trim().toUpperCase());
                }
                if (row.getPanNumber() != null && !row.getPanNumber().isEmpty()) {
                    vendor.setPanNumber(row.getPanNumber().trim().toUpperCase());
                }

                Vendor saved = vendorRepository.save(vendor);
                response.getResults().add(VendorImportResult.success(row.getRowNumber(), row.getName(),
                        row.getServiceType(), saved.getId()));
                success++;
            } catch (Exception e) {
                response.getResults().add(VendorImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getServiceType(), e.getMessage()));
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
            Sheet sheet = workbook.createSheet("Vendors");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Vendor Name*", "Service Type*", "Contact Person", "Phone", "Email", "Address",
                    "GST Number", "PAN Number" };

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
                    { "Quick Fix Plumbing", "PLUMBER", "Rajesh Kumar", "9876543210", "rajesh@quickfix.com",
                            "Shop 10, Main Road", "27AABCU9603R1ZM", "AABCU9603R" },
                    { "Bright Spark Electric", "ELECTRICIAN", "Suresh Patil", "8765432109", "suresh@bright.com",
                            "Office 5, Market Area", "", "BSPKE1234A" },
                    { "Safe Guard Security", "SECURITY", "Amit Singh", "7654321098", "amit@safeguard.com",
                            "Block B, Industrial Area", "", "" },
            };
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            Sheet instructions = workbook.createSheet("Instructions");
            String[][] instructionData = {
                    { "Bulk Vendor Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Vendor Name: Company/business name" },
                    { "- Service Type: PLUMBER, ELECTRICIAN, SECURITY, HOUSEKEEPING, GARDENER," },
                    { "  PEST_CONTROL, ELEVATOR, PAINTING, CARPENTRY, AC_REPAIR, CCTV, FIRE_SAFETY, WATER_SUPPLY, GARBAGE, OTHER" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Contact Person: Name of the point of contact" },
                    { "- Phone: Indian mobile number (10 digits, starts with 6-9)" },
                    { "- Email: Valid email address" },
                    { "- Address: Business address" },
                    { "- GST Number: 15-character GST number" },
                    { "- PAN Number: 10-character PAN number" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify" },
                    { "- Delete sample rows before adding your data" },
                    { "- All imported vendors will be auto-approved" },
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
