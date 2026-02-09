package com.society.backend.service.tenant;

import com.society.backend.dto.tenant.BulkTenantImportResponse;
import com.society.backend.dto.tenant.BulkTenantImportResponse.TenantImportResult;
import com.society.backend.dto.tenant.TenantImportRow;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Society;
import com.society.backend.entity.Tenant;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.tenant.TenantRepository;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkTenantImportService {

    private final TenantRepository tenantRepository;
    private final FlatRepository flatRepository;
    private final SocietyRepository societyRepository;

    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+91)?[6-9]\\d{9}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Set<String> VALID_ID_TYPES = Set.of("AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE",
            "VOTER_ID");

    public List<TenantImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<TenantImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;
            for (Row row : sheet) {
                rowCount++;
                if (rowCount == 1)
                    continue;
                if (isRowEmpty(row))
                    continue;

                TenantImportRow r = new TenantImportRow();
                r.setRowNumber(rowCount);
                r.setFlatNumber(getCellValueAsString(row.getCell(0)));
                r.setName(getCellValueAsString(row.getCell(1)));
                r.setPhone(getCellValueAsString(row.getCell(2)));
                r.setEmail(getCellValueAsString(row.getCell(3)));
                r.setAgreementStartDate(getCellValueAsString(row.getCell(4)));
                r.setAgreementEndDate(getCellValueAsString(row.getCell(5)));

                String rentStr = getCellValueAsString(row.getCell(6));
                if (rentStr != null && !rentStr.isEmpty()) {
                    try {
                        r.setRentAmount(Double.parseDouble(rentStr.replaceAll("[^0-9.]", "")));
                    } catch (NumberFormatException e) {
                        /* handled in validation */ }
                }

                String depositStr = getCellValueAsString(row.getCell(7));
                if (depositStr != null && !depositStr.isEmpty()) {
                    try {
                        r.setDepositAmount(Double.parseDouble(depositStr.replaceAll("[^0-9.]", "")));
                    } catch (NumberFormatException e) {
                        /* handled in validation */ }
                }

                r.setIdProofType(getCellValueAsString(row.getCell(8)));
                r.setIdProofNumber(getCellValueAsString(row.getCell(9)));

                rows.add(r);
            }
        }
        return rows;
    }

    public BulkTenantImportResponse validateImportRows(List<TenantImportRow> rows, Long societyId) {
        Map<String, Flat> flatMap = new HashMap<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat f : societyFlats) {
            flatMap.put(f.getFlatNumber().toUpperCase(), f);
        }

        BulkTenantImportResponse response = new BulkTenantImportResponse();
        response.setTotalRows(rows.size());
        int valid = 0, invalid = 0;

        for (TenantImportRow row : rows) {
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

            // Validate name
            if (row.getName() == null || row.getName().trim().isEmpty()) {
                errors.add("Tenant name is required");
            }

            // Validate phone
            if (row.getPhone() != null && !row.getPhone().isEmpty()) {
                String phone = row.getPhone().replaceAll("\\s+", "");
                if (!PHONE_PATTERN.matcher(phone).matches()) {
                    errors.add("Invalid phone number");
                }
            }

            // Validate email
            if (row.getEmail() != null && !row.getEmail().isEmpty()) {
                if (!EMAIL_PATTERN.matcher(row.getEmail()).matches()) {
                    errors.add("Invalid email format");
                }
            }

            // Validate dates
            if (row.getAgreementStartDate() != null && !row.getAgreementStartDate().isEmpty()) {
                try {
                    LocalDate.parse(row.getAgreementStartDate());
                } catch (DateTimeParseException e) {
                    errors.add("Invalid start date (use yyyy-MM-dd)");
                }
            }
            if (row.getAgreementEndDate() != null && !row.getAgreementEndDate().isEmpty()) {
                try {
                    LocalDate.parse(row.getAgreementEndDate());
                } catch (DateTimeParseException e) {
                    errors.add("Invalid end date (use yyyy-MM-dd)");
                }
            }

            // Validate ID proof type
            if (row.getIdProofType() != null && !row.getIdProofType().isEmpty()) {
                if (!VALID_ID_TYPES.contains(row.getIdProofType().toUpperCase())) {
                    errors.add("Invalid ID type (use: AADHAAR, PAN, PASSPORT, DRIVING_LICENSE, VOTER_ID)");
                }
            }

            TenantImportResult result = new TenantImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());
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
    public BulkTenantImportResponse processImport(List<TenantImportRow> rows, Long societyId) {
        Map<String, Flat> flatMap = new HashMap<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat f : societyFlats) {
            flatMap.put(f.getFlatNumber().toUpperCase(), f);
        }

        BulkTenantImportResponse response = new BulkTenantImportResponse();
        response.setTotalRows(rows.size());
        int success = 0, failure = 0;

        for (TenantImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults().add(TenantImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getFlatNumber(), row.getErrorMessage()));
                failure++;
                continue;
            }
            try {
                Flat flat = flatMap.get(row.getFlatNumber().trim().toUpperCase());
                Tenant tenant = new Tenant();
                tenant.setFlat(flat);
                tenant.setName(row.getName().trim());
                tenant.setPhone(row.getPhone());
                tenant.setEmail(row.getEmail());
                tenant.setIsActive(true);

                if (row.getAgreementStartDate() != null && !row.getAgreementStartDate().isEmpty()) {
                    tenant.setAgreementStartDate(LocalDate.parse(row.getAgreementStartDate()));
                }
                if (row.getAgreementEndDate() != null && !row.getAgreementEndDate().isEmpty()) {
                    tenant.setAgreementEndDate(LocalDate.parse(row.getAgreementEndDate()));
                }
                if (row.getRentAmount() != null) {
                    tenant.setRentAmount(BigDecimal.valueOf(row.getRentAmount()));
                }
                if (row.getDepositAmount() != null) {
                    tenant.setDepositAmount(BigDecimal.valueOf(row.getDepositAmount()));
                }
                if (row.getIdProofType() != null && !row.getIdProofType().isEmpty()) {
                    tenant.setIdProofType(row.getIdProofType().toUpperCase());
                }
                tenant.setIdProofNumber(row.getIdProofNumber());

                Tenant saved = tenantRepository.save(tenant);
                response.getResults().add(TenantImportResult.success(row.getRowNumber(), row.getName(),
                        row.getFlatNumber(), saved.getId()));
                success++;
            } catch (Exception e) {
                response.getResults().add(TenantImportResult.failure(row.getRowNumber(), row.getName(),
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
            Sheet sheet = workbook.createSheet("Tenants");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Unit Number*", "Tenant Name*", "Phone", "Email",
                    "Agreement Start (yyyy-MM-dd)", "Agreement End (yyyy-MM-dd)",
                    "Rent Amount", "Deposit Amount", "ID Proof Type", "ID Proof Number" };

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
                    { "A-101", "Rahul Sharma", "9876543210", "rahul@email.com", "2026-01-01", "2027-01-01", "15000",
                            "45000", "AADHAAR", "1234-5678-9012" },
                    { "A-102", "Priya Patel", "8765432109", "priya@email.com", "2026-02-01", "2027-02-01", "18000",
                            "54000", "PAN", "ABCDE1234F" },
            };
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            Sheet instructions = workbook.createSheet("Instructions");
            String[][] instructionData = {
                    { "Bulk Tenant Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Unit Number: Must match an existing unit in the society (e.g., A-101)" },
                    { "- Tenant Name: Full name of the tenant" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Phone: Indian mobile number (starts with 6-9, 10 digits)" },
                    { "- Email: Valid email address" },
                    { "- Agreement Start/End: Date in yyyy-MM-dd format" },
                    { "- Rent/Deposit Amount: Numeric value" },
                    { "- ID Proof Type: AADHAAR, PAN, PASSPORT, DRIVING_LICENSE, or VOTER_ID" },
                    { "- ID Proof Number: ID document number" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify column names" },
                    { "- Delete sample data rows before adding your data" },
                    { "- Multiple tenants can be added to the same unit" },
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
        for (int i = 0; i < 10; i++) {
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
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
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
