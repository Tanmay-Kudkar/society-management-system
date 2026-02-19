-- Align SOS/gate/security table ID & FK types with Long-based JPA entities

-- Drop FKs for gate_logs
ALTER TABLE IF EXISTS gate_logs
    DROP CONSTRAINT IF EXISTS gate_logs_flat_id_fkey,
    DROP CONSTRAINT IF EXISTS gate_logs_society_id_fkey,
    DROP CONSTRAINT IF EXISTS gate_logs_visitor_id_fkey,
    DROP CONSTRAINT IF EXISTS gate_logs_approved_by_id_fkey;

-- Drop FKs for sos_alerts
ALTER TABLE IF EXISTS sos_alerts
    DROP CONSTRAINT IF EXISTS sos_alerts_raised_by_id_fkey,
    DROP CONSTRAINT IF EXISTS sos_alerts_flat_id_fkey,
    DROP CONSTRAINT IF EXISTS sos_alerts_society_id_fkey,
    DROP CONSTRAINT IF EXISTS sos_alerts_resolved_by_id_fkey,
    DROP CONSTRAINT IF EXISTS sos_alerts_acknowledged_by_id_fkey;

-- Drop FKs for society_gates
ALTER TABLE IF EXISTS society_gates
    DROP CONSTRAINT IF EXISTS society_gates_society_id_fkey;

-- Upcast sos_alerts
ALTER TABLE IF EXISTS sos_alerts
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN raised_by_id TYPE BIGINT,
    ALTER COLUMN flat_id TYPE BIGINT,
    ALTER COLUMN society_id TYPE BIGINT,
    ALTER COLUMN resolved_by_id TYPE BIGINT,
    ALTER COLUMN acknowledged_by_id TYPE BIGINT;

-- Upcast gate_logs
ALTER TABLE IF EXISTS gate_logs
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN flat_id TYPE BIGINT,
    ALTER COLUMN society_id TYPE BIGINT,
    ALTER COLUMN visitor_id TYPE BIGINT,
    ALTER COLUMN approved_by_id TYPE BIGINT;

-- Upcast society_gates
ALTER TABLE IF EXISTS society_gates
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN society_id TYPE BIGINT;

-- Recreate FKs for sos_alerts
ALTER TABLE IF EXISTS sos_alerts
    ADD CONSTRAINT sos_alerts_raised_by_id_fkey
        FOREIGN KEY (raised_by_id) REFERENCES users(id),
    ADD CONSTRAINT sos_alerts_flat_id_fkey
        FOREIGN KEY (flat_id) REFERENCES flats(id),
    ADD CONSTRAINT sos_alerts_society_id_fkey
        FOREIGN KEY (society_id) REFERENCES societies(id),
    ADD CONSTRAINT sos_alerts_resolved_by_id_fkey
        FOREIGN KEY (resolved_by_id) REFERENCES users(id),
    ADD CONSTRAINT sos_alerts_acknowledged_by_id_fkey
        FOREIGN KEY (acknowledged_by_id) REFERENCES users(id);

-- Recreate FKs for gate_logs
ALTER TABLE IF EXISTS gate_logs
    ADD CONSTRAINT gate_logs_flat_id_fkey
        FOREIGN KEY (flat_id) REFERENCES flats(id),
    ADD CONSTRAINT gate_logs_society_id_fkey
        FOREIGN KEY (society_id) REFERENCES societies(id),
    ADD CONSTRAINT gate_logs_visitor_id_fkey
        FOREIGN KEY (visitor_id) REFERENCES visitors(id),
    ADD CONSTRAINT gate_logs_approved_by_id_fkey
        FOREIGN KEY (approved_by_id) REFERENCES users(id);

-- Recreate FK for society_gates
ALTER TABLE IF EXISTS society_gates
    ADD CONSTRAINT society_gates_society_id_fkey
        FOREIGN KEY (society_id) REFERENCES societies(id);
