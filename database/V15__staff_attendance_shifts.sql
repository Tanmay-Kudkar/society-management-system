-- V15: Staff Attendance & Shifts
CREATE TABLE staff_shifts (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    staff_user_id BIGINT NOT NULL REFERENCES users(id),
    shift_date DATE NOT NULL,
    shift_type VARCHAR(30) NOT NULL DEFAULT 'MORNING',
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    location VARCHAR(200),
    notes TEXT,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_shift_society ON staff_shifts(society_id);
CREATE INDEX idx_staff_shift_user ON staff_shifts(staff_user_id);
CREATE INDEX idx_staff_shift_date ON staff_shifts(shift_date);
CREATE INDEX idx_staff_shift_status ON staff_shifts(status);
