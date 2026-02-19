-- V18: Move-In / Move-Out Tracking
CREATE TABLE IF NOT EXISTS move_records (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    flat_number VARCHAR(50),
    wing VARCHAR(50),
    move_type VARCHAR(20) NOT NULL DEFAULT 'MOVE_IN',
    move_date DATE NOT NULL,
    scheduled_time VARCHAR(20),
    actual_time VARCHAR(20),
    vehicle_number VARCHAR(30),
    vehicle_type VARCHAR(30),
    movers_company VARCHAR(200),
    movers_phone VARCHAR(20),
    number_of_helpers INT DEFAULT 0,
    items_description TEXT,
    elevator_required BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(12,2) DEFAULT 0,
    deposit_status VARCHAR(20) DEFAULT 'UNPAID',
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    admin_notes TEXT,
    inspection_done BOOLEAN DEFAULT false,
    damage_reported TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_move_records_society ON move_records(society_id);
CREATE INDEX idx_move_records_user ON move_records(user_id);
CREATE INDEX idx_move_records_type ON move_records(move_type);
CREATE INDEX idx_move_records_status ON move_records(status);
CREATE INDEX idx_move_records_date ON move_records(move_date);
