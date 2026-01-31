-- Fix existing vendors with NULL approval_status
-- Run this SQL command in your PostgreSQL database

-- Update all NULL approval_status to PENDING
UPDATE vendors SET approval_status = 'PENDING' WHERE approval_status IS NULL;

-- Verify the update
SELECT id, name, approval_status FROM vendors;
