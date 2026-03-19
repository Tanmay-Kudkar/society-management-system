package com.society.backend.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.society.backend.society.entity.Society;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Employee HR record — stores attendance, salary, identity documents
 * and advance payment information for society staff.
 * <p>
 * Linked to a {@link User} with role EMPLOYEE.
 * Employees do not interact with operational modules;
 * this entity functions as a simple HR database.
 */
@Entity
@Table(name = "employees", indexes = {
        @Index(name = "idx_employee_society", columnList = "society_id"),
        @Index(name = "idx_employee_user", columnList = "user_id"),
        @Index(name = "idx_employee_department", columnList = "department")
})
@Getter
@Setter
@NoArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    // ─── Employment Details ───────────────────────────────────────

    @Column(name = "employee_code", length = 30)
    private String employeeCode;

    @Column(nullable = false, length = 50)
    private String department; // SECURITY, HOUSEKEEPING, MAINTENANCE, GARDENING, ADMIN, OTHER

    @Column(nullable = false, length = 100)
    private String designation;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Column(name = "employment_type", length = 30)
    private String employmentType = "FULL_TIME"; // FULL_TIME, PART_TIME, CONTRACT

    @Column(name = "shift_timing", length = 100)
    private String shiftTiming; // e.g. "10 PM - 6 AM", "9 AM - 5 PM"

    // ─── Salary Details ───────────────────────────────────────────

    @Column(name = "monthly_salary", precision = 12, scale = 2)
    private BigDecimal monthlySalary = BigDecimal.ZERO;

    @Column(name = "salary_account_number", length = 30)
    private String salaryAccountNumber;

    @Column(name = "salary_ifsc", length = 20)
    private String salaryIfsc;

    @Column(name = "salary_bank_name", length = 100)
    private String salaryBankName;

    // ─── Identity Documents ───────────────────────────────────────

    @Column(name = "id_proof_type", length = 30)
    private String idProofType; // AADHAAR, PAN, VOTER_ID, PASSPORT, DRIVING_LICENSE

    @Column(name = "id_proof_number", length = 50)
    private String idProofNumber;

    @Column(name = "id_proof_document_url", length = 500)
    private String idProofDocumentUrl;

    @Column(name = "id_proof_metadata_encrypted", columnDefinition = "TEXT")
    private String idProofMetadataEncrypted;

    @Column(name = "id_proof_metadata_version", length = 20)
    private String idProofMetadataVersion;

    @Column(name = "id_proof_metadata_updated_at")
    private LocalDateTime idProofMetadataUpdatedAt;

    @Basic(fetch = FetchType.LAZY)
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "id_proof_document_data", columnDefinition = "BYTEA")
    private byte[] idProofDocumentData;

    @Column(name = "id_proof_document_file_name", length = 255)
    private String idProofDocumentFileName;

    @Column(name = "id_proof_document_content_type", length = 120)
    private String idProofDocumentContentType;

    @Column(name = "id_proof_document_size")
    private Long idProofDocumentSize;

    @Column(name = "id_proof_document_checksum", length = 128)
    private String idProofDocumentChecksum;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ─── Emergency / Personal ─────────────────────────────────────

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    // ─── Advance Payments ─────────────────────────────────────────

    @Column(name = "advance_balance", precision = 12, scale = 2)
    private BigDecimal advanceBalance = BigDecimal.ZERO;

    // ─── Status ───────────────────────────────────────────────────

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ─── Timestamps ───────────────────────────────────────────────

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
