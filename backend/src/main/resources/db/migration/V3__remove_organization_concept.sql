-- Remove organization concept (hard migration)
-- 1) Migrate admin roles to MASTER_ADMIN
-- 2) Drop organization_id columns and organizations table

-- Relax users role/account_type constraints before data migration
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_account_type_check;

-- Role migration
UPDATE users
SET role = 'MASTER_ADMIN'
WHERE role IN ('PLATFORM_OWNER', 'ORGANIZATION_OWNER');

-- Account type cleanup
UPDATE users
SET account_type = 'SOCIETY_ADMIN'
WHERE account_type = 'ORGANIZATION_OWNER';

-- Recreate constraints without organization role concepts
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'MASTER_ADMIN', 'SOCIETY_ADMIN',
        'CHAIRMAN', 'SECRETARY', 'TREASURER',
        'COMMITTEE', 'MANAGER', 'EMPLOYEE',
        'MEMBER', 'TENANT', 'VISITOR'
    ));

ALTER TABLE users
    ADD CONSTRAINT users_account_type_check
    CHECK (account_type IN ('SOCIETY_ADMIN') OR account_type IS NULL);

-- Drop all organization_id columns (if present)
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS societies DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS flats DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS wings DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS notices DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS tickets DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS vendors DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS vendor_bills DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS contracts DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS emergency_contacts DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS banners DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS security_logs DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS complaints DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS vehicles DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS tenants DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS maintenance_bills DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS notification_preferences DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS document_templates DROP COLUMN IF EXISTS organization_id CASCADE;

-- Drop organizations table last
DROP TABLE IF EXISTS organizations CASCADE;
