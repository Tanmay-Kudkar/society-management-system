-- F32: SOS / Emergency Alert Enhancement
-- Create sos_alerts and gate_logs tables if not present,
-- then add enhancement columns for escalation, location, response tracking.

CREATE TABLE IF NOT EXISTS sos_alerts (
    id              SERIAL PRIMARY KEY,
    alert_type      VARCHAR(30)  NOT NULL,
    description     TEXT,
    raised_by_id    INT          NOT NULL REFERENCES users(id),
    flat_id         INT          REFERENCES flats(id),
    society_id      INT          NOT NULL REFERENCES societies(id),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    priority        VARCHAR(10)  NOT NULL DEFAULT 'HIGH',
    resolved_by_id  INT          REFERENCES users(id),
    resolution_notes TEXT,
    acknowledged_at TIMESTAMP,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gate_logs (
    id              SERIAL PRIMARY KEY,
    entry_type      VARCHAR(30)  NOT NULL,
    person_name     VARCHAR(100) NOT NULL,
    person_phone    VARCHAR(20),
    vehicle_number  VARCHAR(30),
    flat_id         INT          REFERENCES flats(id),
    society_id      INT          NOT NULL REFERENCES societies(id),
    entry_time      TIMESTAMP,
    exit_time       TIMESTAMP,
    entry_gate      VARCHAR(50),
    exit_gate       VARCHAR(50),
    purpose         VARCHAR(255),
    status          VARCHAR(10)  NOT NULL DEFAULT 'IN',
    notes           TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enhancement columns for SOS alerts
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS escalation_level INT NOT NULL DEFAULT 0;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS acknowledged_by_id INT REFERENCES users(id);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS response_time_seconds INT;

-- Indexes for SOS query performance
CREATE INDEX IF NOT EXISTS idx_sos_society_status ON sos_alerts(society_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_society_priority ON sos_alerts(society_id, priority);
CREATE INDEX IF NOT EXISTS idx_sos_society_created ON sos_alerts(society_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_raised_by ON sos_alerts(raised_by_id);

-- Indexes for gate log query performance
CREATE INDEX IF NOT EXISTS idx_gatelog_society_status ON gate_logs(society_id, status);
CREATE INDEX IF NOT EXISTS idx_gatelog_society_entry ON gate_logs(society_id, entry_time DESC);
