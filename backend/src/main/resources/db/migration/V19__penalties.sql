-- V19: Penalty & Fine System
CREATE TABLE IF NOT EXISTS penalties (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    issued_to_id BIGINT NOT NULL REFERENCES users(id),
    issued_by_id BIGINT NOT NULL REFERENCES users(id),
    flat_number VARCHAR(50),
    wing VARCHAR(50),
    penalty_type VARCHAR(50) NOT NULL DEFAULT 'VIOLATION',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date DATE,
    payment_status VARCHAR(20) DEFAULT 'UNPAID',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    waived_reason TEXT,
    appeal_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_penalties_society ON penalties(society_id);
CREATE INDEX idx_penalties_issued_to ON penalties(issued_to_id);
CREATE INDEX idx_penalties_status ON penalties(status);
CREATE INDEX idx_penalties_payment ON penalties(payment_status);
