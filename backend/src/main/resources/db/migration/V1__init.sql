-- Initial schema aligned with current entities

CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100),
    owner_email VARCHAR(100) UNIQUE,
    owner_phone VARCHAR(20),
    subscription_type VARCHAR(20) DEFAULT 'FREE' CHECK (subscription_type IN ('FREE', 'BASIC', 'PREMIUM', 'LIFETIME')),
    subscription_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED')),
    subscription_start_date DATE,
    subscription_end_date DATE,
    max_societies INT DEFAULT 1,
    is_founding_member BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS societies (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    registration_number VARCHAR(50),
    email VARCHAR(100),
    telephone VARCHAR(20),
    total_flats INT DEFAULT 0,
    total_shops INT DEFAULT 0,
    total_offices INT DEFAULT 0,
    total_wings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    flat_id BIGINT,
    account_type VARCHAR(30) CHECK (account_type IN ('SOCIETY_ADMIN', 'ORGANIZATION_OWNER')),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN',
        'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER',
        'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'
    )),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wings (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    total_floors INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flats (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    wing_id BIGINT REFERENCES wings(id),
    flat_number VARCHAR(20) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'FLAT',
    flat_type VARCHAR(50),
    floor INT,
    area DECIMAL(10,2),
    owner_name VARCHAR(100),
    owner_email VARCHAR(100),
    owner_phone VARCHAR(20),
    owner_user_id BIGINT,
    is_occupied BOOLEAN DEFAULT FALSE
);

ALTER TABLE users
    ADD CONSTRAINT users_flat_fk FOREIGN KEY (flat_id) REFERENCES flats(id);

ALTER TABLE flats
    ADD CONSTRAINT flats_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    complaint_number VARCHAR(50) UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    flat_id BIGINT NOT NULL REFERENCES flats(id),
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    vehicle_type VARCHAR(20) NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    owner_name VARCHAR(100),
    parking_slot VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    flat_id BIGINT NOT NULL REFERENCES flats(id),
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    agreement_start_date DATE,
    agreement_end_date DATE,
    rent_amount DECIMAL(12,2),
    deposit_amount DECIMAL(12,2),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    raised_by BIGINT NOT NULL REFERENCES users(id),
    assigned_to BIGINT REFERENCES users(id),
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    resolution TEXT,
    progress_percent INT DEFAULT 0,
    is_overdue BOOLEAN DEFAULT FALSE,
    overdue_days INT DEFAULT 0,
    escalation_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    contact_person VARCHAR(100),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    bank_name VARCHAR(100),
    account_number VARCHAR(30),
    ifsc_code VARCHAR(20),
    approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_bills (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id),
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    bill_number VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    bill_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    description TEXT,
    payment_mode VARCHAR(20),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    vendor_id BIGINT REFERENCES vendors(id),
    contract_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reminder_days INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    document_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_bills (
    id BIGSERIAL PRIMARY KEY,
    flat_id BIGINT NOT NULL REFERENCES flats(id),
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    bill_month VARCHAR(7) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'UNPAID',
    payment_date DATE,
    payment_mode VARCHAR(20),
    receipt_number VARCHAR(50),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    flat_id BIGINT REFERENCES flats(id),
    transaction_type VARCHAR(10) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50),
    cheque_number VARCHAR(30),
    bank_name VARCHAR(100),
    cheque_date DATE,
    related_bill_id BIGINT,
    related_bill_type VARCHAR(20),
    transaction_date DATE NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    created_by_id BIGINT REFERENCES users(id),
    contact_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_templates (
    id BIGSERIAL PRIMARY KEY,
    template_type VARCHAR(50) NOT NULL,
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    title VARCHAR(200) NOT NULL,
    image_url VARCHAR(500),
    redirect_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    email_tickets BOOLEAN DEFAULT TRUE,
    email_complaints BOOLEAN DEFAULT TRUE,
    email_payments BOOLEAN DEFAULT TRUE,
    email_contracts BOOLEAN DEFAULT TRUE,
    email_tenants BOOLEAN DEFAULT TRUE,
    email_notices BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS security_logs (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT REFERENCES societies(id),
    organization_id BIGINT REFERENCES organizations(id),
    event VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
