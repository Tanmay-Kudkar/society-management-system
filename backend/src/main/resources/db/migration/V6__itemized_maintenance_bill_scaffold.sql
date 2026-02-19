CREATE TABLE IF NOT EXISTS bill_line_items (
    id BIGSERIAL PRIMARY KEY,
    maintenance_bill_id BIGINT NOT NULL REFERENCES maintenance_bills(id) ON DELETE CASCADE,
    charge_type VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_taxable BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bill_line_items_bill_id ON bill_line_items(maintenance_bill_id);

ALTER TABLE IF EXISTS maintenance_bills
    ADD COLUMN IF NOT EXISTS bill_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS previous_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS advance_balance NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE maintenance_bills
SET subtotal = COALESCE(amount, 0),
    total_amount = COALESCE(amount, 0)
WHERE subtotal = 0 AND total_amount = 0;