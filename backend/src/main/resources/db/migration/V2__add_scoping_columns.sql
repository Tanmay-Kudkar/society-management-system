-- Add organization_id and society_id scoping columns across domain tables

-- Societies (ensure organization_id exists for backfill operations)
ALTER TABLE societies ADD COLUMN IF NOT EXISTS organization_id BIGINT;

-- Flats
ALTER TABLE flats ADD COLUMN IF NOT EXISTS organization_id INT;

-- Wings
ALTER TABLE wings ADD COLUMN IF NOT EXISTS organization_id INT;

-- Notices
ALTER TABLE notices ADD COLUMN IF NOT EXISTS organization_id INT;

-- Tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS organization_id INT;

-- Vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS organization_id INT;

-- Vendor bills
ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS organization_id INT;

-- Contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id INT;

-- Transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id INT;

-- Emergency contacts
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS organization_id INT;

-- Banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS organization_id INT;

-- Security logs
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS organization_id INT;

-- Complaints
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS organization_id INT;

-- Vehicles (derive from flat)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS society_id INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS organization_id INT;

-- Tenants (derive from flat)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS society_id INT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS organization_id INT;

-- Maintenance bills (derive from flat)
ALTER TABLE maintenance_bills ADD COLUMN IF NOT EXISTS society_id INT;
ALTER TABLE maintenance_bills ADD COLUMN IF NOT EXISTS organization_id INT;

-- Notification preferences (derive from user)
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS society_id INT;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS organization_id INT;

-- Document templates (optional scoping)
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS society_id INT;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS organization_id INT;

-- Backfill organization_id from society_id
UPDATE flats f
SET organization_id = s.organization_id
FROM societies s
WHERE f.society_id = s.id AND f.organization_id IS NULL;

UPDATE wings w
SET organization_id = s.organization_id
FROM societies s
WHERE w.society_id = s.id AND w.organization_id IS NULL;

UPDATE notices n
SET organization_id = s.organization_id
FROM societies s
WHERE n.society_id = s.id AND n.organization_id IS NULL;

UPDATE tickets t
SET organization_id = s.organization_id
FROM societies s
WHERE t.society_id = s.id AND t.organization_id IS NULL;

UPDATE vendors v
SET organization_id = s.organization_id
FROM societies s
WHERE v.society_id = s.id AND v.organization_id IS NULL;

UPDATE vendor_bills vb
SET organization_id = s.organization_id
FROM societies s
WHERE vb.society_id = s.id AND vb.organization_id IS NULL;

UPDATE contracts c
SET organization_id = s.organization_id
FROM societies s
WHERE c.society_id = s.id AND c.organization_id IS NULL;

UPDATE transactions tr
SET organization_id = s.organization_id
FROM societies s
WHERE tr.society_id = s.id AND tr.organization_id IS NULL;

UPDATE emergency_contacts ec
SET organization_id = s.organization_id
FROM societies s
WHERE ec.society_id = s.id AND ec.organization_id IS NULL;

UPDATE banners b
SET organization_id = s.organization_id
FROM societies s
WHERE b.society_id = s.id AND b.organization_id IS NULL;

UPDATE security_logs sl
SET organization_id = s.organization_id
FROM societies s
WHERE sl.society_id = s.id AND sl.organization_id IS NULL;

UPDATE complaints c
SET organization_id = s.organization_id
FROM societies s
WHERE c.society_id = s.id AND c.organization_id IS NULL;

-- Backfill from flats
UPDATE vehicles v
SET society_id = f.society_id,
    organization_id = s.organization_id
FROM flats f
JOIN societies s ON s.id = f.society_id
WHERE v.flat_id = f.id AND (v.society_id IS NULL OR v.organization_id IS NULL);

UPDATE tenants t
SET society_id = f.society_id,
    organization_id = s.organization_id
FROM flats f
JOIN societies s ON s.id = f.society_id
WHERE t.flat_id = f.id AND (t.society_id IS NULL OR t.organization_id IS NULL);

UPDATE maintenance_bills mb
SET society_id = f.society_id,
    organization_id = s.organization_id
FROM flats f
JOIN societies s ON s.id = f.society_id
WHERE mb.flat_id = f.id AND (mb.society_id IS NULL OR mb.organization_id IS NULL);

-- Backfill from users
UPDATE notification_preferences np
SET society_id = u.society_id,
    organization_id = u.organization_id
FROM users u
WHERE np.user_id = u.id AND (np.society_id IS NULL OR np.organization_id IS NULL);

-- Foreign keys (guarded)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flats_organization_fk') THEN
    ALTER TABLE flats ADD CONSTRAINT flats_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wings_organization_fk') THEN
    ALTER TABLE wings ADD CONSTRAINT wings_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_organization_fk') THEN
    ALTER TABLE notices ADD CONSTRAINT notices_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_organization_fk') THEN
    ALTER TABLE tickets ADD CONSTRAINT tickets_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendors_organization_fk') THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_bills_organization_fk') THEN
    ALTER TABLE vendor_bills ADD CONSTRAINT vendor_bills_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_organization_fk') THEN
    ALTER TABLE contracts ADD CONSTRAINT contracts_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_organization_fk') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'emergency_contacts_organization_fk') THEN
    ALTER TABLE emergency_contacts ADD CONSTRAINT emergency_contacts_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'banners_organization_fk') THEN
    ALTER TABLE banners ADD CONSTRAINT banners_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_logs_organization_fk') THEN
    ALTER TABLE security_logs ADD CONSTRAINT security_logs_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_organization_fk') THEN
    ALTER TABLE complaints ADD CONSTRAINT complaints_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_society_fk') THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_society_fk FOREIGN KEY (society_id) REFERENCES societies(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_organization_fk') THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_society_fk') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_society_fk FOREIGN KEY (society_id) REFERENCES societies(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_organization_fk') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_bills_society_fk') THEN
    ALTER TABLE maintenance_bills ADD CONSTRAINT maintenance_bills_society_fk FOREIGN KEY (society_id) REFERENCES societies(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_bills_organization_fk') THEN
    ALTER TABLE maintenance_bills ADD CONSTRAINT maintenance_bills_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_prefs_society_fk') THEN
    ALTER TABLE notification_preferences ADD CONSTRAINT notification_prefs_society_fk FOREIGN KEY (society_id) REFERENCES societies(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_prefs_organization_fk') THEN
    ALTER TABLE notification_preferences ADD CONSTRAINT notification_prefs_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_templates_society_fk') THEN
    ALTER TABLE document_templates ADD CONSTRAINT document_templates_society_fk FOREIGN KEY (society_id) REFERENCES societies(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_templates_organization_fk') THEN
    ALTER TABLE document_templates ADD CONSTRAINT document_templates_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
END $$;
