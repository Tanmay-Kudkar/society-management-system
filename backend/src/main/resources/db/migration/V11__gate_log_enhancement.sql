-- F34: Gate Log Enhancement
-- Add columns for vehicle photo, visitor linking, gate management, and analytics.

ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS visitor_id INT REFERENCES visitors(id);
ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS approved_by_id INT REFERENCES users(id);
ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS id_type VARCHAR(30);        -- AADHAAR, PAN, DRIVING_LICENSE, PASSPORT, OTHER
ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS company_name VARCHAR(100);
ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS items_carried TEXT;

-- Gate names table for preconfigured gates
CREATE TABLE IF NOT EXISTS society_gates (
    id              SERIAL PRIMARY KEY,
    society_id      INT          NOT NULL REFERENCES societies(id),
    gate_name       VARCHAR(50)  NOT NULL,
    gate_type       VARCHAR(20)  NOT NULL DEFAULT 'MAIN',  -- MAIN, SERVICE, PARKING, EMERGENCY
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_society_gates ON society_gates(society_id);
CREATE INDEX IF NOT EXISTS idx_gatelog_visitor ON gate_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_gatelog_entry_type ON gate_logs(society_id, entry_type);
