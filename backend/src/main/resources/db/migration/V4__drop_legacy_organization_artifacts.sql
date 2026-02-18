-- Drop legacy organization artifacts that may still exist in upgraded databases
-- Safe/idempotent cleanup after organization concept removal

-- Ensure no old role/account_type constraints remain with deprecated values
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;

-- Normalize legacy role/account_type values that may still exist in upgraded DBs
UPDATE users
SET role = 'MASTER_ADMIN'
WHERE role = 'ORGANIZATION_OWNER';

UPDATE users
SET role = 'MASTER_ADMIN'
WHERE role IS NULL
   OR role NOT IN (
       'MASTER_ADMIN', 'PLATFORM_OWNER', 'SOCIETY_ADMIN',
       'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE',
       'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'
   );

UPDATE users
SET account_type = 'SOCIETY_ADMIN'
WHERE account_type = 'ORGANIZATION_OWNER';

UPDATE users
SET account_type = NULL
WHERE account_type IS NOT NULL
    AND account_type <> 'SOCIETY_ADMIN';

ALTER TABLE IF EXISTS users ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'MASTER_ADMIN', 'PLATFORM_OWNER', 'SOCIETY_ADMIN',
        'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE',
        'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'
    ));

ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_account_type_check;
ALTER TABLE IF EXISTS users ADD CONSTRAINT users_account_type_check
    CHECK (account_type IN ('SOCIETY_ADMIN') OR account_type IS NULL);

-- Drop legacy organization columns that may survive older migrations
ALTER TABLE IF EXISTS security_logs DROP COLUMN IF EXISTS organization_id CASCADE;
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
ALTER TABLE IF EXISTS complaints DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS vehicles DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS tenants DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS maintenance_bills DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS notification_preferences DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE IF EXISTS document_templates DROP COLUMN IF EXISTS organization_id CASCADE;

-- Drop legacy organizations table and any dependent objects
DROP TABLE IF EXISTS organizations CASCADE;
