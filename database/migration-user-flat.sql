-- Migration: Add flat_id column to users table for user-unit association
-- This migration links users (MEMBER and TENANT roles) to their respective units

-- Add flat_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_id INT REFERENCES flats(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_flat_id ON users(flat_id);

-- Add comment for documentation
COMMENT ON COLUMN users.flat_id IS 'Associated flat/unit for MEMBER and TENANT roles';
