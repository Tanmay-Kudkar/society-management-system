-- F35: Work Order System
CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    requested_by_id BIGINT NOT NULL REFERENCES users(id),
    assigned_to_id BIGINT REFERENCES users(id),
    flat_id BIGINT REFERENCES flats(id),
    location VARCHAR(255),
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    scheduled_date DATE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_orders_society ON work_orders(society_id);
CREATE INDEX idx_work_orders_status ON work_orders(society_id, status);
CREATE INDEX idx_work_orders_category ON work_orders(society_id, category);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to_id);
CREATE INDEX idx_work_orders_requested ON work_orders(requested_by_id);
