-- ═══════════════════════════════════════════════════════════════
-- SOCIETY MANAGEMENT SYSTEM — COMPLETE DATABASE SCHEMA
-- PostgreSQL 18+
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. SOCIETIES (root entity)
-- ───────────────────────────────────────────────────────────────
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
    total_flats     INT DEFAULT 0,
    total_shops     INT DEFAULT 0,
    total_offices   INT DEFAULT 0,
    total_wings     INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 2. WINGS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wings (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    total_floors    INT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 3. FLATS (owner_user_id FK added after users table)
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 4. USERS
-- ───────────────────────────────────────────────────────────────
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

-- Add deferred FK from flats → users
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

-- ───────────────────────────────────────────────────────────────
-- 5. PASSWORD RESET TOKENS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              BIGSERIAL PRIMARY KEY,
    token           VARCHAR(255) NOT NULL UNIQUE,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    expiry_date     TIMESTAMP NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 6. SOCIETY SETTINGS
-- ───────────────────────────────────────────────────────────────
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
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 7. COMPLAINTS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 8. NOTICES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT REFERENCES societies(id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT,
    priority        VARCHAR(255) DEFAULT 'MEDIUM',
    expiry_date     DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 9. VEHICLES
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 10. TENANTS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 11. TICKETS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id                  BIGSERIAL PRIMARY KEY,
    raised_by           BIGINT NOT NULL REFERENCES users(id),
    assigned_to         BIGINT REFERENCES users(id),
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    type                VARCHAR(255) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    status              VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    priority            VARCHAR(255) DEFAULT 'MEDIUM',
    resolution          TEXT,
    progress_percent    INT DEFAULT 0,
    is_overdue          BOOLEAN DEFAULT FALSE,
    overdue_days        INT DEFAULT 0,
    escalation_level    INT DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    resolved_at         TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────
-- 12. VENDORS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 13. VENDOR BILLS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 14. CONTRACTS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 15. MAINTENANCE BILLS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 16. BILL LINE ITEMS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 17. TRANSACTIONS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 18. PAYMENTS (Razorpay)
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 19. EMERGENCY CONTACTS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 20. DOCUMENT TEMPLATES
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 21. BANNERS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT REFERENCES societies(id),
    title           VARCHAR(255) NOT NULL,
    image_url       VARCHAR(255),
    redirect_url    VARCHAR(255),
    start_date      DATE,
    end_date        DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    display_order   INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 22. NOTIFICATION PREFERENCES
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 23. SECURITY LOGS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_logs (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT,
    event           VARCHAR(255) NOT NULL,
    type            VARCHAR(255) NOT NULL,
    status          VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 24. VISITORS
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 25. GATE LOGS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gate_logs (
    id              BIGSERIAL PRIMARY KEY,
    entry_type      VARCHAR(255) NOT NULL,
    person_name     VARCHAR(255) NOT NULL,
    person_phone    VARCHAR(255),
    vehicle_number  VARCHAR(255),
    flat_id         BIGINT REFERENCES flats(id),
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    entry_time      TIMESTAMP,
    exit_time       TIMESTAMP,
    entry_gate      VARCHAR(255),
    exit_gate       VARCHAR(255),
    purpose         VARCHAR(255),
    status          VARCHAR(255) NOT NULL DEFAULT 'IN',
    notes           TEXT,
    image_url       VARCHAR(255),
    visitor_id      BIGINT REFERENCES visitors(id),
    approved_by_id  BIGINT REFERENCES users(id),
    id_type         VARCHAR(255),
    id_number       VARCHAR(255),
    company_name    VARCHAR(255),
    items_carried   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 26. SOS ALERTS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_alerts (
    id                      BIGSERIAL PRIMARY KEY,
    alert_type              VARCHAR(255) NOT NULL,
    description             TEXT,
    raised_by_id            BIGINT NOT NULL REFERENCES users(id),
    flat_id                 BIGINT REFERENCES flats(id),
    society_id              BIGINT NOT NULL REFERENCES societies(id),
    status                  VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    priority                VARCHAR(255) NOT NULL DEFAULT 'HIGH',
    resolved_by_id          BIGINT REFERENCES users(id),
    resolution_notes        TEXT,
    location                VARCHAR(255),
    escalation_level        INT NOT NULL DEFAULT 0,
    escalated_at            TIMESTAMP,
    acknowledged_by_id      BIGINT REFERENCES users(id),
    response_time_seconds   INT,
    acknowledged_at         TIMESTAMP,
    resolved_at             TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 27. DOMESTIC STAFF
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS domestic_staff (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(255),
    staff_type      VARCHAR(255) NOT NULL,
    id_proof_type   VARCHAR(255),
    id_proof_number VARCHAR(255),
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    address         VARCHAR(255),
    rating          DOUBLE PRECISION,
    is_active       BOOLEAN DEFAULT TRUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 28. STAFF ATTENDANCE
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_attendance (
    id                  BIGSERIAL PRIMARY KEY,
    staff_id            BIGINT NOT NULL REFERENCES domestic_staff(id),
    flat_id             BIGINT REFERENCES flats(id),
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    attendance_date     DATE NOT NULL,
    check_in_time       TIMESTAMP,
    check_out_time      TIMESTAMP,
    status              VARCHAR(255) NOT NULL DEFAULT 'PRESENT',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 29. STAFF SHIFTS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_shifts (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    staff_user_id   BIGINT NOT NULL REFERENCES users(id),
    shift_date      DATE NOT NULL,
    shift_type      VARCHAR(30) NOT NULL DEFAULT 'MORNING',
    start_time      VARCHAR(20),
    end_time        VARCHAR(20),
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    status          VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    location        VARCHAR(200),
    notes           TEXT,
    overtime_hours  NUMERIC(5,2) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 30. PATROL CHECKPOINTS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patrol_checkpoints (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    checkpoint_name     VARCHAR(255) NOT NULL,
    location            VARCHAR(255),
    description         TEXT,
    qr_code             VARCHAR(255),
    display_order       INT DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 31. PATROL LOGS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patrol_logs (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    guard_id        BIGINT NOT NULL REFERENCES users(id),
    checkpoint_id   BIGINT NOT NULL REFERENCES patrol_checkpoints(id),
    scanned_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    status          VARCHAR(255) NOT NULL DEFAULT 'ON_TIME',
    notes           TEXT,
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 32. DUTY ROSTERS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duty_rosters (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    guard_id        BIGINT NOT NULL REFERENCES users(id),
    shift_name      VARCHAR(255) NOT NULL,
    shift_start     TIME NOT NULL,
    shift_end       TIME NOT NULL,
    duty_date       DATE NOT NULL,
    status          VARCHAR(255) NOT NULL DEFAULT 'SCHEDULED',
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 33. APPROVAL WORKFLOWS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_workflows (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    name            VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    description     TEXT,
    min_amount      NUMERIC DEFAULT 0,
    max_amount      NUMERIC,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 34. APPROVAL WORKFLOW STEPS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id                      BIGSERIAL PRIMARY KEY,
    workflow_id             BIGINT NOT NULL REFERENCES approval_workflows(id),
    step_order              INT NOT NULL,
    approver_role           VARCHAR(50) NOT NULL,
    is_mandatory            BOOLEAN NOT NULL DEFAULT TRUE,
    auto_approve_below      NUMERIC,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 35. APPROVAL REQUESTS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_requests (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    workflow_id         BIGINT REFERENCES approval_workflows(id),
    entity_type         VARCHAR(50) NOT NULL,
    entity_id           BIGINT NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    amount              NUMERIC,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    current_step        INT NOT NULL DEFAULT 1,
    total_steps         INT NOT NULL DEFAULT 1,
    requested_by        BIGINT NOT NULL REFERENCES users(id),
    final_approver      BIGINT REFERENCES users(id),
    rejection_reason    TEXT,
    metadata            TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────
-- 36. APPROVAL ACTIONS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_actions (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT NOT NULL REFERENCES approval_requests(id),
    step_order      INT NOT NULL,
    action          VARCHAR(20) NOT NULL,
    acted_by        BIGINT NOT NULL REFERENCES users(id),
    comments        TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 37. ASSETS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    asset_name      VARCHAR(200) NOT NULL,
    asset_code      VARCHAR(50),
    category        VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    description     TEXT,
    location        VARCHAR(255),
    status          VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    "condition"     VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    purchase_date   DATE,
    purchase_cost   NUMERIC(12,2),
    current_value   NUMERIC(12,2),
    warranty_expiry DATE,
    vendor_name     VARCHAR(200),
    assigned_to_id  BIGINT REFERENCES users(id),
    quantity        INT NOT NULL DEFAULT 1,
    min_quantity    INT DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 38. WORK ORDERS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_orders (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    category            VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    requested_by_id     BIGINT NOT NULL REFERENCES users(id),
    assigned_to_id      BIGINT REFERENCES users(id),
    flat_id             BIGINT REFERENCES flats(id),
    location            VARCHAR(255),
    estimated_cost      NUMERIC(12,2),
    actual_cost         NUMERIC(12,2),
    scheduled_date      DATE,
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    notes               TEXT,
    resolution_notes    TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 39. COMMON AREA SCHEDULES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS common_area_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    area_name           VARCHAR(200) NOT NULL,
    area_type           VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    description         TEXT,
    maintenance_type    VARCHAR(50) NOT NULL DEFAULT 'CLEANING',
    frequency           VARCHAR(30) NOT NULL DEFAULT 'DAILY',
    day_of_week         VARCHAR(20),
    day_of_month        INT,
    time_slot           VARCHAR(50),
    assigned_to         VARCHAR(200),
    vendor_name         VARCHAR(200),
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_completed_at   TIMESTAMP,
    next_due_date       DATE,
    cost_per_service    NUMERIC(12,2),
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 40. FACILITY BOOKINGS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facility_bookings (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    booked_by_id        BIGINT NOT NULL REFERENCES users(id),
    facility_name       VARCHAR(200) NOT NULL,
    facility_type       VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    booking_date        DATE NOT NULL,
    start_time          VARCHAR(20) NOT NULL,
    end_time            VARCHAR(20) NOT NULL,
    purpose             VARCHAR(500),
    attendees           INT DEFAULT 1,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    amount              NUMERIC(12,2) DEFAULT 0,
    payment_status      VARCHAR(30) DEFAULT 'UNPAID',
    admin_notes         TEXT,
    cancelled_reason    TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 41. RENOVATION NOCs
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS renovation_nocs (
    id                      BIGSERIAL PRIMARY KEY,
    society_id              BIGINT NOT NULL REFERENCES societies(id),
    requested_by_id         BIGINT NOT NULL REFERENCES users(id),
    flat_number             VARCHAR(50),
    wing                    VARCHAR(50),
    renovation_type         VARCHAR(50) NOT NULL DEFAULT 'INTERIOR',
    description             TEXT,
    contractor_name         VARCHAR(200),
    contractor_phone        VARCHAR(20),
    estimated_start_date    DATE,
    estimated_end_date      DATE,
    actual_start_date       DATE,
    actual_end_date         DATE,
    estimated_cost          NUMERIC(12,2),
    deposit_amount          NUMERIC(12,2) DEFAULT 0,
    deposit_status          VARCHAR(20) DEFAULT 'UNPAID',
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by_id          BIGINT REFERENCES users(id),
    approved_at             TIMESTAMP,
    rejection_reason        TEXT,
    terms_accepted          BOOLEAN DEFAULT FALSE,
    admin_notes             TEXT,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 42. MOVE RECORDS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS move_records (
    id                  BIGSERIAL PRIMARY KEY,
    society_id          BIGINT NOT NULL REFERENCES societies(id),
    user_id             BIGINT NOT NULL REFERENCES users(id),
    flat_number         VARCHAR(50),
    wing                VARCHAR(50),
    move_type           VARCHAR(20) NOT NULL DEFAULT 'MOVE_IN',
    move_date           DATE NOT NULL,
    scheduled_time      VARCHAR(20),
    actual_time         VARCHAR(20),
    vehicle_number      VARCHAR(30),
    vehicle_type        VARCHAR(30),
    movers_company      VARCHAR(200),
    movers_phone        VARCHAR(20),
    number_of_helpers   INT DEFAULT 0,
    items_description   TEXT,
    elevator_required   BOOLEAN DEFAULT FALSE,
    deposit_amount      NUMERIC(12,2) DEFAULT 0,
    deposit_status      VARCHAR(20) DEFAULT 'UNPAID',
    status              VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    admin_notes         TEXT,
    inspection_done     BOOLEAN DEFAULT FALSE,
    damage_reported     TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 43. PENALTIES
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- 44. PET REGISTRATIONS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_registrations (
    id                      BIGSERIAL PRIMARY KEY,
    society_id              BIGINT NOT NULL REFERENCES societies(id),
    owner_id                BIGINT NOT NULL REFERENCES users(id),
    flat_number             VARCHAR(50),
    wing                    VARCHAR(50),
    pet_name                VARCHAR(100) NOT NULL,
    pet_type                VARCHAR(50) NOT NULL DEFAULT 'DOG',
    breed                   VARCHAR(100),
    color                   VARCHAR(50),
    age_years               INT,
    gender                  VARCHAR(10),
    weight_kg               NUMERIC(5,2),
    vaccinated              BOOLEAN NOT NULL DEFAULT FALSE,
    vaccination_date        DATE,
    vaccination_expiry      DATE,
    registration_number     VARCHAR(100),
    microchip_id            VARCHAR(100),
    photo_url               VARCHAR(500),
    special_notes           TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by_id          BIGINT REFERENCES users(id),
    approved_at             TIMESTAMP,
    rejected_reason         TEXT,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 45. CLASSIFIEDS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classifieds (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id),
    posted_by_id    BIGINT NOT NULL REFERENCES users(id),
    flat_number     VARCHAR(50),
    wing            VARCHAR(50),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    listing_type    VARCHAR(20) NOT NULL DEFAULT 'SELL',
    price           NUMERIC(12,2),
    negotiable      BOOLEAN NOT NULL DEFAULT FALSE,
    "condition"     VARCHAR(30),
    image_urls      TEXT,
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(200),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at      TIMESTAMP,
    flagged         BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason     TEXT,
    views           INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 46. SOCIETY RULES
-- ───────────────────────────────────────────────────────────────
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

