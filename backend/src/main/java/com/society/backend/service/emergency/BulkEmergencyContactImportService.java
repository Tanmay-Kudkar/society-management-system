package com.society.backend.service.emergency;

import com.society.backend.dto.emergency.BulkEmergencyContactImportResponse;
import com.society.backend.dto.emergency.BulkEmergencyContactImportResponse.EmergencyContactImportResult;
import com.society.backend.dto.emergency.EmergencyContactImportRow;
import com.society.backend.entity.EmergencyContact;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.emergency.EmergencyContactRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
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
public class BulkEmergencyContactImportService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_TYPES = Set.of(
            "POLICE", "FIRE", "AMBULANCE", "HOSPITAL", "DOCTOR",
            "SECURITY", "ELECTRICIAN", "PLUMBER", "GAS", "WATER", "OTHER");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{3,15}$");

    public List<EmergencyContactImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<EmergencyContactImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;
            for (Row row : sheet) {
                rowCount++;
                if (rowCount == 1)
                    continue;
                if (isRowEmpty(row))
                    continue;

                EmergencyContactImportRow r = new EmergencyContactImportRow();
                r.setRowNumber(rowCount);
                r.setContactType(getCellValueAsString(row.getCell(0)));
                r.setName(getCellValueAsString(row.getCell(1)));
                r.setPhone(getCellValueAsString(row.getCell(2)));
                r.setAlternatePhone(getCellValueAsString(row.getCell(3)));
                r.setAddress(getCellValueAsString(row.getCell(4)));
                r.setNotes(getCellValueAsString(row.getCell(5)));

                rows.add(r);
            }
        }
        return rows;
    }

    public BulkEmergencyContactImportResponse validateImportRows(List<EmergencyContactImportRow> rows, Long societyId) {
        BulkEmergencyContactImportResponse response = new BulkEmergencyContactImportResponse();
        response.setTotalRows(rows.size());
        int valid = 0, invalid = 0;

        for (EmergencyContactImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            // Validate contact type
            if (row.getContactType() == null || row.getContactType().trim().isEmpty()) {
                errors.add("Contact type is required");
            } else if (!VALID_TYPES.contains(row.getContactType().trim().toUpperCase())) {
                errors.add("Invalid contact type (use: " + String.join(", ", VALID_TYPES) + ")");
            }

            // Validate name
            if (row.getName() == null || row.getName().trim().isEmpty()) {
                errors.add("Name is required");
            }

            // Validate phone
            if (row.getPhone() == null || row.getPhone().trim().isEmpty()) {
                errors.add("Phone number is required");
            } else {
                String cleanPhone = row.getPhone().trim().replaceAll("[\\s\\-\\+]", "");
                if (!PHONE_PATTERN.matcher(cleanPhone).matches()) {
                    errors.add("Invalid phone number format");
                }
            }

            // Validate alternate phone
            if (row.getAlternatePhone() != null && !row.getAlternatePhone().trim().isEmpty()) {
                String cleanAlt = row.getAlternatePhone().trim().replaceAll("[\\s\\-\\+]", "");
                if (!PHONE_PATTERN.matcher(cleanAlt).matches()) {
                    errors.add("Invalid alternate phone number format");
                }
            }

            EmergencyContactImportResult result = new EmergencyContactImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());
            result.setContactType(row.getContactType());

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
    public BulkEmergencyContactImportResponse processImport(List<EmergencyContactImportRow> rows, Long societyId,
            Long userId) {
        Society society = societyRepository.findById(societyId)
<<<<<<< HEAD
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        BulkEmergencyContactImportResponse response = new BulkEmergencyContactImportResponse();
        response.setTotalRows(rows.size());
        int success = 0, failure = 0;

        for (EmergencyContactImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults().add(EmergencyContactImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getContactType(), row.getErrorMessage()));
                failure++;
                continue;
            }
            try {
                EmergencyContact contact = new EmergencyContact();
                contact.setSociety(society);
                contact.setCreatedBy(user);
                contact.setContactType(row.getContactType().trim().toUpperCase());
                contact.setName(row.getName().trim());
                contact.setPhone(row.getPhone().trim());
                contact.setAlternatePhone(row.getAlternatePhone() != null ? row.getAlternatePhone().trim() : null);
                contact.setAddress(row.getAddress() != null ? row.getAddress().trim() : null);
                contact.setNotes(row.getNotes() != null ? row.getNotes().trim() : null);
                contact.setIsActive(true);

                EmergencyContact saved = emergencyContactRepository.save(contact);
                response.getResults().add(EmergencyContactImportResult.success(row.getRowNumber(), row.getName(),
                        row.getContactType(), saved.getId()));
                success++;
            } catch (Exception e) {
                response.getResults().add(EmergencyContactImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getContactType(), e.getMessage()));
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
            Sheet sheet = workbook.createSheet("Emergency Contacts");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Contact Type*", "Name*", "Phone*", "Alternate Phone", "Address", "Notes" };

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
                    { "POLICE", "Local Police Station", "100", "", "Sector 5, Main Road", "Available 24/7" },
                    { "FIRE", "Fire Brigade", "101", "022-23456789", "Station Road", "" },
                    { "AMBULANCE", "City Hospital Ambulance", "108", "022-87654321", "Hospital Road", "24 hr service" },
                    { "SECURITY", "Society Security Office", "9876543210", "", "Gate No. 1",
                            "Night shift: 10 PM - 6 AM" },
                    { "PLUMBER", "Rajesh Plumbing Services", "9898989898", "", "Local Market", "" },
            };
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            Sheet instructions = workbook.createSheet("Instructions");
            String[][] instructionData = {
                    { "Bulk Emergency Contact Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Contact Type: POLICE, FIRE, AMBULANCE, HOSPITAL, DOCTOR, SECURITY, ELECTRICIAN, PLUMBER, GAS, WATER, or OTHER" },
                    { "- Name: Contact name / organization name" },
                    { "- Phone: Phone number (3-15 digits, can include +, -, spaces)" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Alternate Phone: Secondary phone number" },
                    { "- Address: Contact address" },
                    { "- Notes: Any additional information" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify" },
                    { "- Delete sample rows before adding your data" },
                    { "- Contact types are case-insensitive" },
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
        for (int i = 0; i < 6; i++) {
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

package com.society.backend.service.emergency;

import com.society.backend.dto.emergency.BulkEmergencyContactImportResponse;
import com.society.backend.dto.emergency.BulkEmergencyContactImportResponse.EmergencyContactImportResult;
import com.society.backend.dto.emergency.EmergencyContactImportRow;
import com.society.backend.entity.EmergencyContact;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.emergency.EmergencyContactRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
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
public class BulkEmergencyContactImportService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_TYPES = Set.of(
            "POLICE", "FIRE", "AMBULANCE", "HOSPITAL", "DOCTOR",
            "SECURITY", "ELECTRICIAN", "PLUMBER", "GAS", "WATER", "OTHER");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{3,15}$");

    public List<EmergencyContactImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<EmergencyContactImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = 0;
            for (Row row : sheet) {
                rowCount++;
                if (rowCount == 1)
                    continue;
                if (isRowEmpty(row))
                    continue;

                EmergencyContactImportRow r = new EmergencyContactImportRow();
                r.setRowNumber(rowCount);
                r.setContactType(getCellValueAsString(row.getCell(0)));
                r.setName(getCellValueAsString(row.getCell(1)));
                r.setPhone(getCellValueAsString(row.getCell(2)));
                r.setAlternatePhone(getCellValueAsString(row.getCell(3)));
                r.setAddress(getCellValueAsString(row.getCell(4)));
                r.setNotes(getCellValueAsString(row.getCell(5)));

                rows.add(r);
            }
        }
        return rows;
    }

    public BulkEmergencyContactImportResponse validateImportRows(List<EmergencyContactImportRow> rows, Long societyId) {
        BulkEmergencyContactImportResponse response = new BulkEmergencyContactImportResponse();
        response.setTotalRows(rows.size());
        int valid = 0, invalid = 0;

        for (EmergencyContactImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            // Validate contact type
            if (row.getContactType() == null || row.getContactType().trim().isEmpty()) {
                errors.add("Contact type is required");
            } else if (!VALID_TYPES.contains(row.getContactType().trim().toUpperCase())) {
                errors.add("Invalid contact type (use: " + String.join(", ", VALID_TYPES) + ")");
            }

            // Validate name
            if (row.getName() == null || row.getName().trim().isEmpty()) {
                errors.add("Name is required");
            }

            // Validate phone
            if (row.getPhone() == null || row.getPhone().trim().isEmpty()) {
                errors.add("Phone number is required");
            } else {
                String cleanPhone = row.getPhone().trim().replaceAll("[\\s\\-\\+]", "");
                if (!PHONE_PATTERN.matcher(cleanPhone).matches()) {
                    errors.add("Invalid phone number format");
                }
            }

            // Validate alternate phone
            if (row.getAlternatePhone() != null && !row.getAlternatePhone().trim().isEmpty()) {
                String cleanAlt = row.getAlternatePhone().trim().replaceAll("[\\s\\-\\+]", "");
                if (!PHONE_PATTERN.matcher(cleanAlt).matches()) {
                    errors.add("Invalid alternate phone number format");
                }
            }

            EmergencyContactImportResult result = new EmergencyContactImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());
            result.setContactType(row.getContactType());

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
    public BulkEmergencyContactImportResponse processImport(List<EmergencyContactImportRow> rows, Long societyId,
            Long userId) {
        Society society = societyRepository.findById(societyId)
=======
>>>>>>> 53e86a3 (Added bulk import services for vehicles, vendors, and wings)
                .orElseThrow(() -> new ApiException("Society not found", HttpStatus.NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        BulkEmergencyContactImportResponse response = new BulkEmergencyContactImportResponse();
        response.setTotalRows(rows.size());
        int success = 0, failure = 0;

        for (EmergencyContactImportRow row : rows) {
            if (!row.isValid()) {
                response.getResults().add(EmergencyContactImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getContactType(), row.getErrorMessage()));
                failure++;
                continue;
            }
            try {
                EmergencyContact contact = new EmergencyContact();
                contact.setSociety(society);
                contact.setCreatedBy(user);
                contact.setContactType(row.getContactType().trim().toUpperCase());
                contact.setName(row.getName().trim());
                contact.setPhone(row.getPhone().trim());
                contact.setAlternatePhone(row.getAlternatePhone() != null ? row.getAlternatePhone().trim() : null);
                contact.setAddress(row.getAddress() != null ? row.getAddress().trim() : null);
                contact.setNotes(row.getNotes() != null ? row.getNotes().trim() : null);
                contact.setIsActive(true);

                EmergencyContact saved = emergencyContactRepository.save(contact);
                response.getResults().add(EmergencyContactImportResult.success(row.getRowNumber(), row.getName(),
                        row.getContactType(), saved.getId()));
                success++;
            } catch (Exception e) {
                response.getResults().add(EmergencyContactImportResult.failure(row.getRowNumber(), row.getName(),
                        row.getContactType(), e.getMessage()));
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
            Sheet sheet = workbook.createSheet("Emergency Contacts");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Contact Type*", "Name*", "Phone*", "Alternate Phone", "Address", "Notes" };

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
                    { "POLICE", "Local Police Station", "100", "", "Sector 5, Main Road", "Available 24/7" },
                    { "FIRE", "Fire Brigade", "101", "022-23456789", "Station Road", "" },
                    { "AMBULANCE", "City Hospital Ambulance", "108", "022-87654321", "Hospital Road", "24 hr service" },
                    { "SECURITY", "Society Security Office", "9876543210", "", "Gate No. 1",
                            "Night shift: 10 PM - 6 AM" },
                    { "PLUMBER", "Rajesh Plumbing Services", "9898989898", "", "Local Market", "" },
            };
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    row.createCell(j).setCellValue(sampleData[i][j]);
                }
            }

            Sheet instructions = workbook.createSheet("Instructions");
            String[][] instructionData = {
                    { "Bulk Emergency Contact Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Contact Type: POLICE, FIRE, AMBULANCE, HOSPITAL, DOCTOR, SECURITY, ELECTRICIAN, PLUMBER, GAS, WATER, or OTHER" },
                    { "- Name: Contact name / organization name" },
                    { "- Phone: Phone number (3-15 digits, can include +, -, spaces)" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Alternate Phone: Secondary phone number" },
                    { "- Address: Contact address" },
                    { "- Notes: Any additional information" },
                    { "" },
                    { "Notes:" },
                    { "- First row is header - do not modify" },
                    { "- Delete sample rows before adding your data" },
                    { "- Contact types are case-insensitive" },
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
        for (int i = 0; i < 6; i++) {
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
