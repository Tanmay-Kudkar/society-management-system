-- V17: Renovation NOC (No Objection Certificate)
CREATE TABLE IF NOT EXISTS renovation_nocs (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    requested_by_id BIGINT NOT NULL REFERENCES users(id),
    flat_number VARCHAR(50),
    wing VARCHAR(50),
    renovation_type VARCHAR(50) NOT NULL DEFAULT 'INTERIOR',
    description TEXT,
    contractor_name VARCHAR(200),
    contractor_phone VARCHAR(20),
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    estimated_cost DECIMAL(12,2),
    deposit_amount DECIMAL(12,2) DEFAULT 0,
    deposit_status VARCHAR(20) DEFAULT 'UNPAID',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by_id BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    terms_accepted BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_renovation_nocs_society ON renovation_nocs(society_id);
CREATE INDEX idx_renovation_nocs_requested_by ON renovation_nocs(requested_by_id);
CREATE INDEX idx_renovation_nocs_status ON renovation_nocs(status);
