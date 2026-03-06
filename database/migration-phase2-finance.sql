-- ============================================================
-- Phase 2 Finance Engine Migration
-- F08: Society Rate Configuration
-- F09: Itemized Bill Line Items
-- F12: Penalty & Interest on Maintenance Bills
-- F13: Sequential Bill/Receipt Number Counters
-- ============================================================

-- ─── Sequence Counters (F13) ───────────────────────────────
CREATE TABLE IF NOT EXISTS sequence_counters (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT       NOT NULL,
    counter_type    VARCHAR(20)  NOT NULL,  -- 'BILL' | 'RECEIPT'
    financial_year  VARCHAR(10)  NOT NULL,  -- e.g. '2026'
    current_value   BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT uq_seq_counter UNIQUE (society_id, counter_type, financial_year)
);

CREATE INDEX IF NOT EXISTS idx_seq_counter_society ON sequence_counters (society_id, counter_type, financial_year);

-- ─── Society Rate Configs (F08) ────────────────────────────
CREATE TABLE IF NOT EXISTS society_rate_configs (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT          NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    charge_type     VARCHAR(50)     NOT NULL,   -- e.g. 'MAINTENANCE', 'WATER', 'PARKING', 'SINKING_FUND'
    description     VARCHAR(255)    NOT NULL,
    amount          NUMERIC(12,2)   NOT NULL CHECK (amount >= 0),
    applicable_to   VARCHAR(20)     NOT NULL DEFAULT 'ALL',  -- 'ALL' | 'FLAT' | 'SHOP' | 'OFFICE'
    is_per_sqft     BOOLEAN         NOT NULL DEFAULT FALSE,
    display_order   INT             NOT NULL DEFAULT 0,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rate_config UNIQUE (society_id, charge_type, applicable_to)
);

CREATE INDEX IF NOT EXISTS idx_rate_config_society ON society_rate_configs (society_id);
CREATE INDEX IF NOT EXISTS idx_rate_config_active   ON society_rate_configs (society_id, is_active);

-- ─── Alter maintenance_bills (F12, F13) ────────────────────
-- F13: Sequential bill number
ALTER TABLE maintenance_bills
    ADD COLUMN IF NOT EXISTS bill_number VARCHAR(50) UNIQUE;

-- F12: Penalty and interest
ALTER TABLE maintenance_bills
    ADD COLUMN IF NOT EXISTS penalty_amount  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00;

-- Index on bill_number for quick lookup
CREATE INDEX IF NOT EXISTS idx_mb_bill_number ON maintenance_bills (bill_number);

-- ─── Bill Line Items (F09) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_line_items (
    id          BIGSERIAL PRIMARY KEY,
    bill_id     BIGINT          NOT NULL REFERENCES maintenance_bills(id) ON DELETE CASCADE,
    charge_type VARCHAR(50)     NOT NULL,
    description VARCHAR(255)    NOT NULL,
    unit_price  NUMERIC(12,2),
    quantity    NUMERIC(10,4)   NOT NULL DEFAULT 1.0000,
    amount      NUMERIC(12,2)   NOT NULL CHECK (amount >= 0),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bli_bill_id ON bill_line_items (bill_id);

-- ─── Trigger: update updated_at on rate_config changes ─────
CREATE OR REPLACE FUNCTION update_rate_config_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_config_updated_at ON society_rate_configs;
CREATE TRIGGER trg_rate_config_updated_at
    BEFORE UPDATE ON society_rate_configs
    FOR EACH ROW EXECUTE FUNCTION update_rate_config_updated_at();
