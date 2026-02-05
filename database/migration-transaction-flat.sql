-- Migration: Add flat_id column to transactions table for maintenance income tracking
-- This allows linking transactions to specific units/flats, especially for maintenance income

-- Add flat_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS flat_id INT REFERENCES flats(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_flat_id ON transactions(flat_id);

-- Add created_by_id column to emergency_contacts for ownership tracking
ALTER TABLE emergency_contacts 
ADD COLUMN IF NOT EXISTS created_by_id INT REFERENCES users(id);

-- Comment explaining the changes
COMMENT ON COLUMN transactions.flat_id IS 'Links transaction to a specific flat/unit, required for MAINTENANCE income type';
COMMENT ON COLUMN emergency_contacts.created_by_id IS 'User who created this emergency contact, used for ownership-based deletion';
