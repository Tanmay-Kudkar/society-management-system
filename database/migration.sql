-- Migration Script for Society Management System
-- Run this script to add new columns to existing tables

-- =====================================================
-- USERS TABLE UPDATES
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS society_id INT REFERENCES societies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update role constraint to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'));

-- =====================================================
-- SOCIETIES TABLE UPDATES
-- =====================================================
ALTER TABLE societies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- =====================================================
-- FLATS TABLE UPDATES
-- =====================================================
ALTER TABLE flats ADD COLUMN IF NOT EXISTS flat_type VARCHAR(50);
ALTER TABLE flats ADD COLUMN IF NOT EXISTS floor INT DEFAULT 0;
ALTER TABLE flats ADD COLUMN IF NOT EXISTS area DECIMAL(10,2);
ALTER TABLE flats ADD COLUMN IF NOT EXISTS owner_email VARCHAR(100);
ALTER TABLE flats ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20);
ALTER TABLE flats ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN DEFAULT FALSE;

-- =====================================================
-- NOTICES TABLE UPDATES
-- =====================================================
-- Rename 'message' to 'content' if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'message') THEN
        ALTER TABLE notices RENAME COLUMN message TO content;
    ELSE
        ALTER TABLE notices ADD COLUMN IF NOT EXISTS content TEXT;
    END IF;
END $$;

ALTER TABLE notices ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- =====================================================
-- MAINTENANCE_BILLS TABLE UPDATES
-- =====================================================
ALTER TABLE maintenance_bills ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE maintenance_bills ADD COLUMN IF NOT EXISTS payment_date DATE;

-- =====================================================
-- Verify all columns exist by selecting sample data
-- =====================================================
-- SELECT 'Migration completed successfully!' as status;
