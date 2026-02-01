CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    society_id INT REFERENCES societies(id),
    role VARCHAR(50) CHECK (role IN ('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    registration_number VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flats (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    flat_number VARCHAR(20),
    flat_type VARCHAR(50),
    floor INT DEFAULT 0,
    area DECIMAL(10,2),
    owner_name VARCHAR(100),
    owner_email VARCHAR(100),
    owner_phone VARCHAR(20),
    is_occupied BOOLEAN DEFAULT FALSE
);

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    title VARCHAR(200),
    content TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table for flat vehicle details
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id),
    vehicle_type VARCHAR(20),
    vehicle_number VARCHAR(20),
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenants table for rental agreements
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id),
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    agreement_start_date DATE,
    agreement_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table for complaints, requests, issues
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    raised_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    society_id INT REFERENCES societies(id),
    type VARCHAR(20),
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Vendors table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    name VARCHAR(100),
    service_type VARCHAR(50),
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

-- Vendor bills table
CREATE TABLE vendor_bills (
    id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES vendors(id),
    society_id INT REFERENCES societies(id),
    bill_number VARCHAR(50),
    amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    bill_date DATE,
    due_date DATE,
    description TEXT,
    payment_mode VARCHAR(20),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Contracts table for AMC, insurance, etc.
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    vendor_id INT REFERENCES vendors(id),
    contract_type VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    start_date DATE,
    end_date DATE,
    reminder_days INT DEFAULT 30,
    document_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance bills table
CREATE TABLE maintenance_bills (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id),
    bill_month VARCHAR(7),
    amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_mode VARCHAR(20),
    receipt_number VARCHAR(50),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Transactions table for income/expense tracking
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    transaction_type VARCHAR(10),
    payment_mode VARCHAR(20),
    amount DECIMAL(12,2),
    category VARCHAR(50),
    description TEXT,
    transaction_date DATE,
    reference_number VARCHAR(50),
    cheque_number VARCHAR(30),
    bank_name VARCHAR(100),
    cheque_date DATE,
    related_bill_id INT,
    related_bill_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts table
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    contact_type VARCHAR(50),
    name VARCHAR(100),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document templates table
CREATE TABLE document_templates (
    id SERIAL PRIMARY KEY,
    template_type VARCHAR(50),
    title VARCHAR(200),
    content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Banners table
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    title VARCHAR(200),
    image_url VARCHAR(500),
    redirect_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences table
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) UNIQUE,
    email_tickets BOOLEAN DEFAULT TRUE,
    email_complaints BOOLEAN DEFAULT TRUE,
    email_payments BOOLEAN DEFAULT TRUE,
    email_contracts BOOLEAN DEFAULT TRUE
);

-- Security Logs table
CREATE TABLE security_logs (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    type VARCHAR(20) NOT NULL,
    event VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
