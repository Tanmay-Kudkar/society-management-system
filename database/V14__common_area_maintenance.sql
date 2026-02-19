-- V14: Common Area Maintenance Schedule
CREATE TABLE common_area_schedules (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    area_name VARCHAR(200) NOT NULL,
    area_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    description TEXT,
    maintenance_type VARCHAR(50) NOT NULL DEFAULT 'CLEANING',
    frequency VARCHAR(30) NOT NULL DEFAULT 'DAILY',
    day_of_week VARCHAR(20),
    day_of_month INTEGER,
    time_slot VARCHAR(50),
    assigned_to VARCHAR(200),
    vendor_name VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_completed_at TIMESTAMP,
    next_due_date DATE,
    cost_per_service DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_common_area_society ON common_area_schedules(society_id);
CREATE INDEX idx_common_area_status ON common_area_schedules(status);
CREATE INDEX idx_common_area_type ON common_area_schedules(area_type);
