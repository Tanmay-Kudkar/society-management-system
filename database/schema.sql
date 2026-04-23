-- ----------------------------------------------------------------
-- SOCIETY MANAGEMENT SYSTEM COMPLETE DATABASE SCHEMA
-- PostgreSQL 18+
-- ----------------------------------------------------------------
-- ----------------------------------------------------------------
-- 1. SOCIETIES (root entity)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS societies (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    address         TEXT,
    city            VARCHAR(255),
    state           VARCHAR(255),
    pincode         VARCHAR(255),
    registration_number VARCHAR(255),
    email           VARCHAR(255),
    telephone       VARCHAR(255),
    exact_latitude  DOUBLE PRECISION,
    exact_longitude DOUBLE PRECISION,
    total_flats     INT DEFAULT 0,
    total_shops     INT DEFAULT 0,
    total_offices   INT DEFAULT 0,
    total_wings     INT DEFAULT 0,
    total_floors    INT DEFAULT 1,
    has_wings       BOOLEAN DEFAULT TRUE,
    two_wheeler_parking_capacity INT DEFAULT NULL,
    four_wheeler_parking_capacity INT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 2. WINGS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wings (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    total_floors    INT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 3. FLATS (owner_user_id FK added after users table)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flats (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    wing_id         BIGINT REFERENCES wings(id),
    flat_number     VARCHAR(255) NOT NULL,
    unit_type       VARCHAR(255) DEFAULT 'FLAT',
    flat_type       VARCHAR(255),
    floor           INT,
    area            NUMERIC,
    owner_name      VARCHAR(255),
    owner_email     VARCHAR(255),
    owner_phone     VARCHAR(255),
    owner_user_id   BIGINT,
    is_occupied     BOOLEAN DEFAULT FALSE
);

-- ----------------------------------------------------------------
-- 4. USERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(255),
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL CHECK (role IN (
                        'MASTER_ADMIN','SOCIETY_ADMIN','CHAIRMAN','SECRETARY',
                        'TREASURER','COMMITTEE','MANAGER','EMPLOYEE',
                        'MEMBER','TENANT','VENDOR','VISITOR')),
    account_type    VARCHAR(255),
    society_id      BIGINT REFERENCES societies(id),
    flat_id         BIGINT REFERENCES flats(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add deferred FK from flats  users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_flats_owner_user'
    ) THEN
        ALTER TABLE flats
            ADD CONSTRAINT fk_flats_owner_user
            FOREIGN KEY (owner_user_id) REFERENCES users(id);
    END IF;
END $$;

-- ----------------------------------------------------------------
-- 5. PASSWORD RESET TOKENS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              BIGSERIAL PRIMARY KEY,
    token           VARCHAR(255) NOT NULL UNIQUE,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    expiry_date     TIMESTAMP NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 6. SOCIETY SETTINGS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_settings (
    id                              BIGSERIAL PRIMARY KEY,
    society_id                      BIGINT NOT NULL UNIQUE REFERENCES societies(id),
    maintenance_rate_per_sqft       NUMERIC(12,2) NOT NULL DEFAULT 0,
    water_charges_fixed             NUMERIC(12,2) NOT NULL DEFAULT 0,
    water_charges_per_person        NUMERIC(12,2) NOT NULL DEFAULT 0,
    sinking_fund_per_sqft           NUMERIC(12,2) NOT NULL DEFAULT 0,
    repair_fund_per_sqft            NUMERIC(12,2) NOT NULL DEFAULT 0,
    parking_charge_open             NUMERIC(12,2) NOT NULL DEFAULT 0,
    parking_charge_covered          NUMERIC(12,2) NOT NULL DEFAULT 0,
    parking_charge_stilt            NUMERIC(12,2) NOT NULL DEFAULT 0,
    parking_charge_two_wheeler      NUMERIC(12,2) NOT NULL DEFAULT 0,
    lift_maintenance_charge         NUMERIC(12,2) NOT NULL DEFAULT 0,
    electricity_common_charge       NUMERIC(12,2) NOT NULL DEFAULT 0,
    security_charge                 NUMERIC(12,2) NOT NULL DEFAULT 0,
    insurance_charge                NUMERIC(12,2) NOT NULL DEFAULT 0,
    club_house_charge               NUMERIC(12,2) NOT NULL DEFAULT 0,
    property_tax_share              NUMERIC(12,2) NOT NULL DEFAULT 0,
    non_occupancy_surcharge_pct     NUMERIC(5,2)  NOT NULL DEFAULT 0,
    gst_percentage                  NUMERIC(5,2)  NOT NULL DEFAULT 0,
    late_payment_interest_pct       NUMERIC(5,2)  NOT NULL DEFAULT 0,
    grace_period_days               INT NOT NULL DEFAULT 5,
    penalty_fixed                   NUMERIC(12,2) NOT NULL DEFAULT 0,
    bill_generation_day             INT NOT NULL DEFAULT 1,
    due_date_day                    INT NOT NULL DEFAULT 10,
    financial_year_start_month      INT NOT NULL DEFAULT 4,
    bill_number_prefix              VARCHAR(20) NOT NULL DEFAULT 'BILL',
    receipt_number_prefix           VARCHAR(20) NOT NULL DEFAULT 'RCT',
    account_holder_name             VARCHAR(255),
    bank_name                       VARCHAR(255),
    account_number                  VARCHAR(255),
    ifsc_code                       VARCHAR(32),
    upi_id                          VARCHAR(255),
    payment_link                    VARCHAR(512),
    committee_election_start_date   DATE,
    committee_election_end_date     DATE,
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 7. COMPLAINTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
    id                  BIGSERIAL PRIMARY KEY,
    complaint_number    VARCHAR(255) UNIQUE,
    user_id             BIGINT NOT NULL REFERENCES users(id),
    society_id          BIGINT REFERENCES societies(id),
    subject             VARCHAR(255) NOT NULL,
    description         TEXT,
    category            VARCHAR(255),
    status              VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    resolution          TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 8. NOTICES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT REFERENCES societies(id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT,
    priority        VARCHAR(255) DEFAULT 'MEDIUM',
    notice_type     VARCHAR(255) DEFAULT 'GENERAL',
    expiry_date     DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 9. NOTICE ATTENDANCE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notice_attendance (
    id              BIGSERIAL PRIMARY KEY,
    notice_id       BIGINT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(255) NOT NULL DEFAULT 'PRESENT',
    marked_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_notice_attendance_notice_user UNIQUE (notice_id, user_id)
);

-- ----------------------------------------------------------------
-- 10. VEHICLES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id              BIGSERIAL PRIMARY KEY,
    flat_id         BIGINT NOT NULL REFERENCES flats(id),
    society_id      BIGINT REFERENCES societies(id),
    vehicle_type    VARCHAR(255) NOT NULL,
    vehicle_number  VARCHAR(255) NOT NULL,
    brand           VARCHAR(255),
    model           VARCHAR(255),
    color           VARCHAR(255),
    owner_name      VARCHAR(255),
    parking_slot    VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 11. TENANTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id                      BIGSERIAL PRIMARY KEY,
    flat_id                 BIGINT NOT NULL REFERENCES flats(id),
    society_id              BIGINT REFERENCES societies(id),
    user_id                 BIGINT UNIQUE REFERENCES users(id),
    name                    VARCHAR(255) NOT NULL,
    phone                   VARCHAR(255),
    email                   VARCHAR(255),
    agreement_start_date    DATE,
    agreement_end_date      DATE,
    rent_amount             NUMERIC,
    deposit_amount          NUMERIC,
    id_proof_type           VARCHAR(255),
    id_proof_number         VARCHAR(255),
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 12. TICKETS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_number       VARCHAR(255) UNIQUE,
    raised_by           BIGINT NOT NULL REFERENCES users(id),
    assigned_to         BIGINT REFERENCES users(id),
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    type                VARCHAR(255) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    status              VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    priority            VARCHAR(255) DEFAULT 'MEDIUM',
    resolution          TEXT,
    last_reply_by       VARCHAR(255),
    last_reply_at       TIMESTAMP,
    progress_percent    INT DEFAULT 0,
    is_overdue          BOOLEAN DEFAULT FALSE,
    overdue_days        INT DEFAULT 0,
    escalation_level    INT DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    resolved_at         TIMESTAMP,
    close_undo_previous_status VARCHAR(255),
    close_undo_expires_at TIMESTAMP
);

-- ----------------------------------------------------------------
-- 13. TICKET REPLIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_replies (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT NOT NULL REFERENCES tickets(id),
    replied_by          BIGINT NOT NULL REFERENCES users(id),
    message             TEXT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 14. VENDORS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
    id                      BIGSERIAL PRIMARY KEY,
    society_id              BIGINT REFERENCES societies(id),
    user_id                 BIGINT UNIQUE REFERENCES users(id),
    name                    VARCHAR(255) NOT NULL,
    service_type            VARCHAR(255) NOT NULL,
    contact_person          VARCHAR(255),
    contact_person_phone    VARCHAR(255),
    contact_person_email    VARCHAR(255),
    phone                   VARCHAR(255),
    email                   VARCHAR(255),
    address                 TEXT,
    gst_number              VARCHAR(255),
    pan_number              VARCHAR(255),
    bank_name               VARCHAR(255),
    account_number          VARCHAR(255),
    ifsc_code               VARCHAR(255),
    approval_status         VARCHAR(255) DEFAULT 'PENDING',
    created_by_user_id      BIGINT,
    created_by_role         VARCHAR(255),
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 15. VENDOR BILLS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_bills (
    id                  BIGSERIAL PRIMARY KEY,
    vendor_id           BIGINT NOT NULL REFERENCES vendors(id),
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    bill_number         VARCHAR(255),
    amount              NUMERIC NOT NULL,
    paid_amount         NUMERIC DEFAULT 0,
    bill_date           DATE NOT NULL,
    due_date            DATE,
    status              VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    description         TEXT,
    payment_mode        VARCHAR(255),
    reference_number    VARCHAR(255),
    created_at          TIMESTAMP DEFAULT NOW(),
    paid_at             TIMESTAMP
);

-- ----------------------------------------------------------------
-- MIGRATION: VENDOR BILL PAYMENT METADATA (for existing databases)
-- ----------------------------------------------------------------
ALTER TABLE IF EXISTS vendor_bills
    ADD COLUMN IF NOT EXISTS received_by_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- ----------------------------------------------------------------
-- 16. CONTRACTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    vendor_id       BIGINT REFERENCES vendors(id),
    contract_type   VARCHAR(255) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reminder_days   INT DEFAULT 30,
    is_active       BOOLEAN DEFAULT TRUE,
    document_url    VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 17. MAINTENANCE BILLS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_bills (
    id                  BIGSERIAL PRIMARY KEY,
    flat_id             BIGINT NOT NULL REFERENCES flats(id),
    society_id          BIGINT REFERENCES societies(id),
    bill_month          VARCHAR(255) NOT NULL,
    bill_number         VARCHAR(255),
    amount              NUMERIC NOT NULL,
    subtotal            NUMERIC NOT NULL DEFAULT 0,
    tax_amount          NUMERIC NOT NULL DEFAULT 0,
    interest_amount     NUMERIC NOT NULL DEFAULT 0,
    penalty_amount      NUMERIC NOT NULL DEFAULT 0,
    total_amount        NUMERIC NOT NULL DEFAULT 0,
    previous_balance    NUMERIC NOT NULL DEFAULT 0,
    advance_balance     NUMERIC NOT NULL DEFAULT 0,
    paid_amount         NUMERIC DEFAULT 0,
    due_date            DATE,
    status              VARCHAR(255) NOT NULL DEFAULT 'UNPAID',
    payment_date        DATE,
    payment_mode        VARCHAR(255),
    receipt_number      VARCHAR(255),
    reference_number    VARCHAR(255),
    created_at          TIMESTAMP DEFAULT NOW(),
    paid_at             TIMESTAMP
);

-- ----------------------------------------------------------------
-- 18. BILL LINE ITEMS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bill_line_items (
    id                      BIGSERIAL PRIMARY KEY,
    maintenance_bill_id     BIGINT NOT NULL REFERENCES maintenance_bills(id),
    charge_type             VARCHAR(64) NOT NULL,
    description             VARCHAR(255),
    rate                    NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity                NUMERIC(12,2) NOT NULL DEFAULT 1,
    amount                  NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_taxable              BOOLEAN NOT NULL DEFAULT FALSE,
    display_order           INT NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------
-- 19. TRANSACTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id                      BIGSERIAL PRIMARY KEY,
    society_id              BIGINT NOT NULL REFERENCES societies(id),
    transaction_type        VARCHAR(255) NOT NULL,
    payment_mode            VARCHAR(255) NOT NULL,
    amount                  NUMERIC NOT NULL,
    category                VARCHAR(255) NOT NULL,
    description             TEXT,
    reference_number        VARCHAR(255),
    cheque_number           VARCHAR(255),
    bank_name               VARCHAR(255),
    cheque_date             DATE,
    upi_id                  VARCHAR(255),
    utr_number              VARCHAR(255),
    card_type               VARCHAR(255),
    card_last_four_digits   VARCHAR(4),
    payment_month           VARCHAR(7),
    late_fee                NUMERIC(12,2),
    discount                NUMERIC(12,2),
    tax_amount              NUMERIC(12,2),
    receipt_number          VARCHAR(255),
    invoice_number          VARCHAR(255),
    related_bill_id         BIGINT,
    related_bill_type       VARCHAR(255),
    flat_id                 BIGINT REFERENCES flats(id),
    transaction_date        DATE NOT NULL,
    created_by              BIGINT,
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 20. PAYMENTS (Razorpay)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id                      BIGSERIAL PRIMARY KEY,
    razorpay_order_id       VARCHAR(255) UNIQUE,
    razorpay_payment_id     VARCHAR(255),
    razorpay_signature      VARCHAR(255),
    maintenance_bill_id     BIGINT REFERENCES maintenance_bills(id),
    user_id                 BIGINT REFERENCES users(id),
    society_id              BIGINT REFERENCES societies(id),
    amount                  NUMERIC NOT NULL,
    currency                VARCHAR(255) NOT NULL DEFAULT 'INR',
    status                  VARCHAR(255) NOT NULL DEFAULT 'CREATED',
    payment_type            VARCHAR(255),
    payment_method          VARCHAR(255),
    description             TEXT,
    receipt_number          VARCHAR(255),
    error_code              VARCHAR(255),
    error_description       VARCHAR(255),
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),
    paid_at                 TIMESTAMP
);

-- ----------------------------------------------------------------
-- 21. EMERGENCY CONTACTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    created_by_id       BIGINT REFERENCES users(id),
    contact_type        VARCHAR(255) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    phone               VARCHAR(255) NOT NULL,
    alternate_phone     VARCHAR(255),
    address             TEXT,
    notes               TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 22. DOCUMENT TEMPLATES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_templates (
    id              BIGSERIAL PRIMARY KEY,
    template_type   VARCHAR(255) NOT NULL,
    society_id      BIGINT REFERENCES societies(id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 23. NOTIFICATION PREFERENCES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id),
    society_id          BIGINT REFERENCES societies(id),
    email_tickets       BOOLEAN NOT NULL DEFAULT TRUE,
    email_complaints    BOOLEAN NOT NULL DEFAULT TRUE,
    email_payments      BOOLEAN NOT NULL DEFAULT TRUE,
    email_contracts     BOOLEAN NOT NULL DEFAULT TRUE,
    email_tenants       BOOLEAN NOT NULL DEFAULT TRUE,
    email_notices       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ----------------------------------------------------------------
-- 24. VISITORS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitors (
    id                      BIGSERIAL PRIMARY KEY,
    visitor_name            VARCHAR(255) NOT NULL,
    visitor_phone           VARCHAR(255),
    visitor_type            VARCHAR(255) NOT NULL,
    purpose                 VARCHAR(255),
    flat_id                 BIGINT REFERENCES flats(id),
    society_id              BIGINT NOT NULL REFERENCES societies(id),
    vehicle_number          VARCHAR(255),
    expected_arrival        TIMESTAMP,
    check_in_time           TIMESTAMP,
    check_out_time          TIMESTAMP,
    status                  VARCHAR(255) NOT NULL DEFAULT 'EXPECTED',
    is_pre_approved         BOOLEAN DEFAULT FALSE,
    approved_by_id          BIGINT REFERENCES users(id),
    approval_code           VARCHAR(255),
    otp_code                VARCHAR(10),
    otp_expires_at          TIMESTAMP,
    otp_verified_at         TIMESTAMP,
    otp_attempts            INT NOT NULL DEFAULT 0,
    otp_last_generated_at   TIMESTAMP,
    notes                   TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- APPROVAL MODULE TABLES REMOVED FROM BASE SCHEMA (UNUSED IN CURRENT CODEBASE)
-- approval_workflows, approval_workflow_steps, approval_requests, approval_actions

-- 25. PENALTIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS penalties (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    issued_to_id    BIGINT NOT NULL REFERENCES users(id),
    issued_by_id    BIGINT NOT NULL REFERENCES users(id),
    flat_number     VARCHAR(50),
    wing            VARCHAR(50),
    penalty_type    VARCHAR(50) NOT NULL DEFAULT 'VIOLATION',
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_date        DATE,
    payment_status  VARCHAR(20) DEFAULT 'UNPAID',
    paid_amount     NUMERIC(12,2) DEFAULT 0,
    paid_at         TIMESTAMP,
    status          VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    waived_reason   TEXT,
    appeal_notes    TEXT,
    admin_notes     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 26. SOCIETY RULES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_rules (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    created_by_id   BIGINT NOT NULL REFERENCES users(id),
    title           VARCHAR(200) NOT NULL,
    category        VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    description     TEXT,
    content         TEXT NOT NULL,
    effective_date  DATE,
    expiry_date     DATE,
    version         VARCHAR(20) DEFAULT '1.0',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_mandatory    BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url  VARCHAR(500),
    sort_order      INT NOT NULL DEFAULT 0,
    approved_by_id  BIGINT REFERENCES users(id),
    approved_at     TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 27. EMPLOYEES (HR Records)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL UNIQUE REFERENCES users(id),
    society_id                  BIGINT NOT NULL REFERENCES societies(id),
    employee_code               VARCHAR(30),
    department                  VARCHAR(50) NOT NULL,
    designation                 VARCHAR(100) NOT NULL,
    joining_date                DATE,
    termination_date            DATE,
    employment_type             VARCHAR(30) DEFAULT 'FULL_TIME',
    shift_timing                VARCHAR(100),
    monthly_salary              NUMERIC(12,2) DEFAULT 0,
    salary_account_number       VARCHAR(30),
    salary_ifsc                 VARCHAR(20),
    salary_bank_name            VARCHAR(100),
    id_proof_type               VARCHAR(30),
    id_proof_number             VARCHAR(50),
    id_proof_document_url       VARCHAR(500),
    id_proof_metadata_encrypted TEXT,
    id_proof_metadata_version   VARCHAR(20),
    id_proof_metadata_updated_at TIMESTAMP,
    id_proof_document_data      BYTEA,
    id_proof_document_file_name VARCHAR(255),
    id_proof_document_content_type VARCHAR(120),
    id_proof_document_size      BIGINT,
    id_proof_document_checksum  VARCHAR(128),
    photo_url                   VARCHAR(500),
    emergency_contact_name      VARCHAR(100),
    emergency_contact_phone     VARCHAR(20),
    address                     TEXT,
    advance_balance             NUMERIC(12,2) DEFAULT 0,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    notes                       TEXT,
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 28. EMPLOYEE ATTENDANCE (HR Records)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_attendance (
    id                          BIGSERIAL PRIMARY KEY,
    employee_id                 BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    society_id                  BIGINT NOT NULL REFERENCES societies(id),
    attendance_date             DATE NOT NULL,
    status                      VARCHAR(20) NOT NULL,
    check_in_time               TIME,
    check_out_time              TIME,
    remarks                     TEXT,
    marked_by                   BIGINT REFERENCES users(id),
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uk_employee_attendance_employee_date UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_society_date
    ON employee_attendance(society_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_date
    ON employee_attendance(employee_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_status
    ON employee_attendance(status);

-- ----------------------------------------------------------------
-- 29. EMPLOYEE SALARY PAYMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_salary_payments (
    id                          BIGSERIAL PRIMARY KEY,
    employee_id                 BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    society_id                  BIGINT NOT NULL REFERENCES societies(id),
    salary_month                DATE NOT NULL,
    base_salary                 NUMERIC(12,2) NOT NULL,
    deduction_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_paid                    NUMERIC(12,2) NOT NULL,
    payment_date                DATE NOT NULL,
    payment_mode                VARCHAR(30),
    reference_number            VARCHAR(100),
    deduction_reason            TEXT,
    notes                       TEXT,
    recorded_by                 BIGINT REFERENCES users(id),
    paid_at                     TIMESTAMP DEFAULT NOW(),
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_salary_society_month
    ON employee_salary_payments(society_id, salary_month);

CREATE INDEX IF NOT EXISTS idx_emp_salary_employee_month
    ON employee_salary_payments(employee_id, salary_month);

CREATE INDEX IF NOT EXISTS idx_emp_salary_paid_at
    ON employee_salary_payments(paid_at);

-- ----------------------------------------------------------------
-- 30. ENQUIRIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    reason          VARCHAR(50) NOT NULL,
    submitted_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 31. LOGIN AUDITS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_audits (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL REFERENCES users(id),
    action                      VARCHAR(20) NOT NULL,
    timestamp                   TIMESTAMP NOT NULL,
    ip_address                  VARCHAR(255),
    user_agent                  VARCHAR(255),
    latitude                    DOUBLE PRECISION,
    longitude                   DOUBLE PRECISION,
    is_nearby                   BOOLEAN,
    distance_meters             DOUBLE PRECISION,
    proximity_threshold_meters  DOUBLE PRECISION,
    used_fallback_location      BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_login_audit_user
    ON login_audits(user_id);

CREATE INDEX IF NOT EXISTS idx_login_audit_timestamp
    ON login_audits(timestamp);

-- ----------------------------------------------------------------
-- 32. PAYMENT WEBHOOK EVENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id                  BIGSERIAL PRIMARY KEY,
    event_id            VARCHAR(128) NOT NULL UNIQUE,
    event_type          VARCHAR(80),
    processing_status   VARCHAR(32),
    processing_details  VARCHAR(255),
    received_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 33. COMPLAINT ATTACHMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_attachments (
    complaint_id     BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_url         TEXT
);

-- ----------------------------------------------------------------
-- 34. COMPLAINT COMMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_comments (
    id              BIGSERIAL PRIMARY KEY,
    complaint_id    BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    message         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 35. COMPLAINT HISTORY
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_history (
    id              BIGSERIAL PRIMARY KEY,
    complaint_id    BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_user_id   BIGINT REFERENCES users(id),
    action_type     VARCHAR(64) NOT NULL,
    from_status     VARCHAR(32),
    to_status       VARCHAR(32),
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 36. COMPLAINT UPLOADS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_uploads (
    id                      BIGSERIAL PRIMARY KEY,
    society_id              BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    uploaded_by_user_id     BIGINT NOT NULL REFERENCES users(id),
    original_file_name      VARCHAR(255) NOT NULL,
    stored_file_name        VARCHAR(255) NOT NULL UNIQUE,
    content_type            VARCHAR(255),
    file_size               BIGINT NOT NULL,
    file_data               BYTEA,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

