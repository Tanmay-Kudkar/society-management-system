package com.society.backend.service.user;

import com.society.backend.dto.user.BulkUserImportResponse;
import com.society.backend.dto.user.BulkUserImportResponse.UserImportResult;
import com.society.backend.dto.user.UserImportRow;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Role;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.security.RolePermissions;
import com.society.backend.service.common.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkUserImportService {

    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+91)?[6-9]\\d{9}$");

    /**
     * Get the current authenticated user's role
     */
    private Role getCurrentUserRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        String roleString = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "No role found"));

        return Role.valueOf(roleString);
    }

    /**
     * Parse Excel file and extract user data
     */
    public List<UserImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<UserImportRow> rows = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> headerIndex = resolveHeaderIndex(sheet.getRow(0));
            int rowCount = 0;

            for (Row row : sheet) {
                rowCount++;
                // Skip header row
                if (rowCount == 1)
                    continue;

                UserImportRow importRow = new UserImportRow();
                importRow.setRowNumber(rowCount);

                // Column A: Name
                importRow.setName(getCellValueAsString(row.getCell(headerIndex.getOrDefault("name", 0))));

                // Column B: Email
                importRow.setEmail(getCellValueAsString(row.getCell(headerIndex.getOrDefault("email", 1))));

                // Column C: Flat Number
                importRow.setFlatNumber(getCellValueAsString(row.getCell(headerIndex.getOrDefault("flat_number", 2))));

                // Column D: Phone (optional)
                importRow.setPhone(getCellValueAsString(row.getCell(headerIndex.getOrDefault("phone", 3))));

                // Column E: Role (optional, defaults to MEMBER)
                String roleStr = getCellValueAsString(row.getCell(headerIndex.getOrDefault("role", 4)));
                importRow.setRole(roleStr != null && !roleStr.isEmpty() ? roleStr.toUpperCase() : "MEMBER");

                // Skip legacy sample row from older templates
                if (isSampleRow(importRow)) {
                    continue;
                }

                // Skip empty rows
                if (importRow.getName() == null && importRow.getEmail() == null) {
                    continue;
                }

                rows.add(importRow);
            }
        }

        return rows;
    }

    /**
     * Validate user import rows and return a response with validation results
     */
    public BulkUserImportResponse validateImportRows(List<UserImportRow> rows, Long societyId) {
        Set<String> seenEmails = new HashSet<>();
        Set<String> seenFlatNumbers = new HashSet<>();

        // Pre-fetch all flats for the society for efficient lookup
        Map<String, Flat> flatMap = new HashMap<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat flat : societyFlats) {
            flatMap.put(flat.getFlatNumber().toUpperCase(), flat);
        }

        BulkUserImportResponse response = new BulkUserImportResponse();
        response.setTotalRows(rows.size());
        int validCount = 0;
        int invalidCount = 0;

        for (UserImportRow row : rows) {
            List<String> errors = new ArrayList<>();

            // Validate name
            if (row.getName() == null || row.getName().trim().isEmpty()) {
                errors.add("Name is required");
            }

            // Validate email
            if (row.getEmail() == null || row.getEmail().trim().isEmpty()) {
                errors.add("Email is required");
            } else if (!EMAIL_PATTERN.matcher(row.getEmail()).matches()) {
                errors.add("Invalid email format");
            } else {
                // Check for duplicate in file
                if (seenEmails.contains(row.getEmail().toLowerCase())) {
                    errors.add("Duplicate email in file");
                } else {
                    seenEmails.add(row.getEmail().toLowerCase());
                    // Check if email already exists in database
                    if (userRepository.findByEmail(row.getEmail()).isPresent()) {
                        errors.add("Email already exists in system");
                    }
                }
            }

            // Validate flat number based on role
            // Roles that can own units (any type: FLAT, SHOP, OFFICE):
            // - MEMBER, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE, TENANT
            // Roles that cannot be assigned to units:
            // - EMPLOYEE, VISITOR
            String roleUpper = row.getRole() != null ? row.getRole().toUpperCase() : "MEMBER";
            List<Flat> validatedFlats = new ArrayList<>();

            // Define roles that can be assigned to units
            boolean canOccupyUnit = roleUpper.equals("MEMBER") || roleUpper.equals("TENANT")
                    || roleUpper.equals("CHAIRMAN") || roleUpper.equals("SECRETARY")
                    || roleUpper.equals("TREASURER") || roleUpper.equals("COMMITTEE");

            if (!canOccupyUnit) {
                // Non-unit roles (EMPLOYEE, VISITOR) should not have a unit assigned
                if (row.getFlatNumber() != null && !row.getFlatNumber().trim().isEmpty()) {
                    errors.add(roleUpper
                            + " role cannot be assigned to a unit. Only MEMBER, TENANT, CHAIRMAN, SECRETARY, TREASURER, and COMMITTEE can own units. Leave Flat Number empty.");
                }
            } else {
                // Unit-assignable roles require at least one flat number
                // Support comma-separated flat numbers (e.g., "A-101, S-001")
                if (row.getFlatNumber() == null || row.getFlatNumber().trim().isEmpty()) {
                    errors.add("Flat number is required for " + roleUpper);
                } else {
                    // Parse comma-separated flat numbers
                    String[] flatNumbers = row.getFlatNumber().split(",");

                    for (String flatNumRaw : flatNumbers) {
                        String flatNumberUpper = flatNumRaw.trim().toUpperCase();
                        if (flatNumberUpper.isEmpty())
                            continue;

                        // Check for duplicate flat numbers in file
                        if (seenFlatNumbers.contains(flatNumberUpper)) {
                            errors.add("Duplicate flat number in file: " + flatNumberUpper);
                        } else {
                            seenFlatNumbers.add(flatNumberUpper);

                            // Check if flat exists in the society
                            Flat flat = flatMap.get(flatNumberUpper);
                            if (flat == null) {
                                errors.add("Unit '" + flatNumRaw.trim() + "' does not exist in this society");
                            } else {
                                validatedFlats.add(flat);
                                // Check if flat already has a user assigned
                                if (userRepository.existsByFlatId(flat.getId())) {
                                    errors.add("Unit '" + flatNumRaw.trim() + "' already has a user assigned");
                                }
                                // All unit types (FLAT, SHOP, OFFICE) are allowed for all unit-assignable roles
                            }
                        }
                    }

                    if (validatedFlats.isEmpty() && errors.isEmpty()) {
                        errors.add("No valid flat numbers found");
                    }
                }
            }

            // Validate phone (optional but must be valid if provided)
            if (row.getPhone() != null && !row.getPhone().trim().isEmpty()) {
                String cleanPhone = row.getPhone().replaceAll("[\\s\\-()]", "");
                if (!PHONE_PATTERN.matcher(cleanPhone).matches()) {
                    errors.add("Invalid phone number format");
                }
            }

            // Validate role
            if (row.getRole() != null && !row.getRole().isEmpty()) {
                try {
                    Role targetRole = Role.valueOf(row.getRole().toUpperCase());
                    // Check if current user can create this role based on RolePermissions
                    Role currentUserRole = getCurrentUserRole();
                    Set<Role> allowedRoles = RolePermissions.getAllowedRolesToCreate(currentUserRole);
                    if (!allowedRoles.contains(targetRole)) {
                        String allowedRoleNames = allowedRoles.stream()
                                .map(Role::name)
                                .reduce((a, b) -> a + ", " + b)
                                .orElse("none");
                        errors.add("You can only create: " + allowedRoleNames + ". Role '" + row.getRole()
                                + "' is not allowed.");
                    }
                } catch (IllegalArgumentException e) {
                    errors.add("Invalid role: " + row.getRole());
                }
            }

            // Build result for this row
            UserImportResult result = new UserImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());
            result.setEmail(row.getEmail());
            result.setFlatNumber(row.getFlatNumber());

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
     * Process and create users from validated rows.
     * Supports partial success - valid rows are processed even if some fail.
     */
    @Transactional
    public BulkUserImportResponse processImport(List<UserImportRow> rows, Long societyId) {
        // Get the society for the users
        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));

        // Pre-fetch all flats for efficient lookup
        Map<String, Flat> flatMap = new HashMap<>();
        List<Flat> societyFlats = flatRepository.findBySocietyId(societyId);
        for (Flat flat : societyFlats) {
            flatMap.put(flat.getFlatNumber().toUpperCase(), flat);
        }

        BulkUserImportResponse response = new BulkUserImportResponse();
        response.setTotalRows(rows.size());

        int successCount = 0;
        int failureCount = 0;

        for (UserImportRow row : rows) {
            UserImportResult result = new UserImportResult();
            result.setRowNumber(row.getRowNumber());
            result.setName(row.getName());
            result.setEmail(row.getEmail());
            result.setFlatNumber(row.getFlatNumber());

            if (!row.isValid()) {
                result.setSuccess(false);
                result.setErrorMessage(row.getErrorMessage());
                failureCount++;
                log.debug("Skipping invalid row {}: {}", row.getRowNumber(), row.getErrorMessage());
            } else {
                try {
                    String roleUpper = row.getRole() != null ? row.getRole().toUpperCase() : "MEMBER";
                    Role userRole = Role.valueOf(roleUpper);

                    // Create user
                    User user = new User();
                    user.setName(row.getName().trim());
                    user.setEmail(row.getEmail().trim().toLowerCase());
                    user.setRole(userRole);
                    user.setSociety(society);
                    user.setIsActive(true);
                    user.setCreatedAt(java.time.LocalDateTime.now());

                    if (row.getPhone() != null && !row.getPhone().trim().isEmpty()) {
                        user.setPhone(row.getPhone().trim());
                    }

                    // Handle flat assignment based on role
                    // All unit-assignable roles can own any unit type (FLAT, SHOP, OFFICE)
                    // Supports comma-separated multiple units
                    // EMPLOYEE, VISITOR → No unit
                    boolean canOccupyUnit = roleUpper.equals("MEMBER") || roleUpper.equals("TENANT")
                            || roleUpper.equals("CHAIRMAN") || roleUpper.equals("SECRETARY")
                            || roleUpper.equals("TREASURER") || roleUpper.equals("COMMITTEE");

                    if (!canOccupyUnit) {
                        // Non-unit roles (EMPLOYEE, VISITOR) do not get assigned to a unit
                        user.setFlat(null);
                        // Use email prefix as default password for non-resident roles
                        String emailPrefix = row.getEmail().split("@")[0];
                        user.setPassword(passwordEncoder.encode(emailPrefix));
                        log.info("Created {} {} in society {}", roleUpper, user.getEmail(), societyId);
                    } else {
                        // Unit-assignable roles get assigned to unit(s)
                        // Parse comma-separated flat numbers for multiple ownership
                        String[] flatNumbers = row.getFlatNumber().split(",");
                        List<Flat> flatsToAssign = new ArrayList<>();
                        Flat primaryFlat = null;
                        StringBuilder assignedUnits = new StringBuilder();

                        // First pass: validate and collect flats
                        for (String flatNumRaw : flatNumbers) {
                            String flatNumberUpper = flatNumRaw.trim().toUpperCase();
                            if (flatNumberUpper.isEmpty())
                                continue;

                            Flat flat = flatMap.get(flatNumberUpper);
                            if (flat == null) {
                                throw new IllegalArgumentException("Unit not found: " + flatNumRaw.trim());
                            }

                            // Double-check flat doesn't already have a user (safety check)
                            if (userRepository.existsByFlatId(flat.getId())) {
                                throw new IllegalArgumentException(
                                        "Unit '" + flatNumRaw.trim() + "' already has a user assigned");
                            }

                            // First flat becomes primary (user.flat)
                            if (primaryFlat == null) {
                                primaryFlat = flat;
                            }

                            flatsToAssign.add(flat);
                            if (assignedUnits.length() > 0)
                                assignedUnits.append(", ");
                            assignedUnits.append(flat.getFlatNumber());
                        }

                        user.setFlat(primaryFlat); // Primary unit for user
                        user.setPassword(passwordEncoder.encode(primaryFlat.getFlatNumber()));

                        log.info("Created user {} for unit(s) {} in society {}",
                                row.getEmail(), assignedUnits.toString(), societyId);
                    }

                    // Save user first (need ID for flat ownership)
                    User savedUser = userRepository.save(user);

                    // Second pass: update flats with saved user as owner
                    if (row.getFlatNumber() != null && !row.getFlatNumber().trim().isEmpty()
                            && (roleUpper.equals("MEMBER") || roleUpper.equals("TENANT")
                                    || roleUpper.equals("CHAIRMAN") || roleUpper.equals("SECRETARY")
                                    || roleUpper.equals("TREASURER") || roleUpper.equals("COMMITTEE"))) {
                        String[] flatNumbers = row.getFlatNumber().split(",");
                        for (String flatNumRaw : flatNumbers) {
                            String flatNumberUpper = flatNumRaw.trim().toUpperCase();
                            if (flatNumberUpper.isEmpty())
                                continue;

                            Flat flat = flatMap.get(flatNumberUpper);
                            if (flat != null) {
                                flat.setIsOccupied(true);
                                flat.setOwnerEmail(row.getEmail().trim().toLowerCase());
                                flat.setOwner(savedUser); // Link flat to saved user
                                flatRepository.save(flat);
                            }
                        }
                    }

                    result.setSuccess(true);
                    result.setUserId(savedUser.getId());
                    successCount++;
                } catch (Exception e) {
                    result.setSuccess(false);
                    result.setErrorMessage("Failed to create user: " + e.getMessage());
                    failureCount++;
                    log.warn("Failed to create user at row {}: {}", row.getRowNumber(), e.getMessage());
                }
            }

            response.getResults().add(result);
        }

        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        response.setMessage(String.format("Import completed: %d successful, %d failed out of %d total",
                successCount, failureCount, rows.size()));

        log.info("Bulk import completed for society {}: {} success, {} failed",
                societyId, successCount, failureCount);

        return response;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // Handle numeric values (could be phone numbers, flat numbers, etc.)
                double numValue = cell.getNumericCellValue();
                if (numValue == Math.floor(numValue)) {
                    return String.valueOf((long) numValue);
                }
                return String.valueOf(numValue);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case BLANK:
            default:
                return null;
        }
    }

    private Map<String, Integer> resolveHeaderIndex(Row headerRow) {
        Map<String, Integer> headerIndex = new HashMap<>();
        if (headerRow == null) {
            return headerIndex;
        }

        for (Cell cell : headerRow) {
            String header = getCellValueAsString(cell);
            if (header == null)
                continue;
            String normalized = header.replace("*", "").trim().toLowerCase().replaceAll("\\s+", " ");

            switch (normalized) {
                case "name":
                    headerIndex.put("name", cell.getColumnIndex());
                    break;
                case "email":
                    headerIndex.put("email", cell.getColumnIndex());
                    break;
                case "flat number":
                case "flat no":
                case "flat":
                    headerIndex.put("flat_number", cell.getColumnIndex());
                    break;
                case "phone":
                case "mobile":
                    headerIndex.put("phone", cell.getColumnIndex());
                    break;
                case "role":
                    headerIndex.put("role", cell.getColumnIndex());
                    break;
                default:
                    // Ignore extra columns (e.g., Wing Code in older templates)
            }
        }

        return headerIndex;
    }

    private boolean isSampleRow(UserImportRow row) {
        if (row == null)
            return false;

        return "john doe".equals(normalize(row.getName()))
                && "john.doe@example.com".equals(normalize(row.getEmail()))
                && "101".equals(normalize(row.getFlatNumber()))
                && "9876543210".equals(normalize(row.getPhone()))
                && "member".equals(normalize(row.getRole()));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    /**
     * Generate an Excel template for bulk user import.
     */
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Users");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Name*", "Email*", "Flat Number*", "Phone", "Role" };

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
                sheet.setColumnWidth(i, 5000);
            }

            // Add instructions sheet
            Sheet instructionsSheet = workbook.createSheet("Instructions");
            String[][] instructions = {
                    { "Bulk User Import Instructions" },
                    { "" },
                    { "Required Fields (marked with *):" },
                    { "- Name: Full name of the user" },
                    { "- Email: Valid email address (will be used as username)" },
                    { "- Flat Number: The flat/unit number" },
                    { "" },
                    { "Optional Fields:" },
                    { "- Phone: 10-digit phone number" },
                    { "- Role: MEMBER (default) or TENANT" },
                    { "" },
                    { "Notes:" },
                    { "- Default password will be the flat number" },
                    { "- Users will be prompted to change password on first login" },
                    { "- Duplicate emails will be rejected" },
                    { "- Invalid phone numbers will be flagged" },
                    { "" },
                    { "Example Row (Users sheet):" },
                    { "John Doe | john.doe@example.com | 101 | 9876543210 | MEMBER" }
            };

            for (int i = 0; i < instructions.length; i++) {
                Row row = instructionsSheet.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(instructions[i].length > 0 ? instructions[i][0] : "");
                if (i == 0) {
                    cell.setCellStyle(headerStyle);
                }
            }
            instructionsSheet.setColumnWidth(0, 15000);

            // Write to byte array
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate template: " + e.getMessage(), e);
        }
    }
}
