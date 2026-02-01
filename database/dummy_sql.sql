-- Dummy Data Insertion (30+ rows per table)
-- Safe to run on empty DB. If tables already have data, IDs will continue from sequences.

-- 1) Societies
WITH ins_soc AS (
  INSERT INTO societies (name, address, city, state, pincode, registration_number, email, phone)
  SELECT
    'Society ' || g,
    'Address ' || g,
    'City ' || ((g - 1) % 5 + 1),
    'State ' || ((g - 1) % 3 + 1),
    LPAD((400000 + g)::text, 6, '0'),
    'REG-' || LPAD(g::text, 5, '0'),
    'society' || g || '@example.com',
    '900000' || LPAD(g::text, 4, '0')
  FROM generate_series(1, 30) g
  RETURNING id
)
SELECT id INTO TEMP TABLE tmp_societies FROM ins_soc;

-- 2) Users (30)
WITH ins_users AS (
  INSERT INTO users (name, email, password, phone, society_id, role, is_active)
  SELECT
    'User ' || g,
    'user' || g || '@example.com',
    '1234',
    '910000' || LPAD(g::text, 4, '0'),
    (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
    CASE
      WHEN g = 1 THEN 'MASTER_ADMIN'
      WHEN g % 7 = 0 THEN 'SOCIETY_ADMIN'
      WHEN g % 6 = 0 THEN 'CHAIRMAN'
      WHEN g % 5 = 0 THEN 'SECRETARY'
      WHEN g % 4 = 0 THEN 'TREASURER'
      WHEN g % 3 = 0 THEN 'COMMITTEE'
      WHEN g % 2 = 0 THEN 'EMPLOYEE'
      ELSE 'MEMBER'
    END,
    TRUE
  FROM generate_series(1, 30) g
  RETURNING id
)
SELECT id INTO TEMP TABLE tmp_users FROM ins_users;

-- 3) Flats (30)
WITH ins_flats AS (
  INSERT INTO flats (society_id, flat_number, flat_type, floor, area, owner_name, owner_email, owner_phone, is_occupied)
  SELECT
    (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
    'A-' || LPAD(g::text, 3, '0'),
    CASE WHEN g % 3 = 0 THEN '3BHK' WHEN g % 2 = 0 THEN '2BHK' ELSE '1BHK' END,
    (g % 10),
    800 + (g * 10),
    'Owner ' || g,
    'owner' || g || '@example.com',
    '920000' || LPAD(g::text, 4, '0'),
    (g % 4) <> 0
  FROM generate_series(1, 30) g
  RETURNING id
)
SELECT id INTO TEMP TABLE tmp_flats FROM ins_flats;

-- 4) Tenants (30)
INSERT INTO tenants (flat_id, name, phone, email, id_proof_type, id_proof_number, agreement_start_date, agreement_end_date, is_active)
SELECT
  (SELECT id FROM tmp_flats ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  'Tenant ' || g,
  '930000' || LPAD(g::text, 4, '0'),
  'tenant' || g || '@example.com',
  'AADHAR',
  'AAD' || LPAD(g::text, 8, '0'),
  DATE '2025-01-01' + (g || ' days')::interval,
  DATE '2026-01-01' + (g || ' days')::interval,
  TRUE
FROM generate_series(1, 30) g;

-- 5) Vehicles (30)
INSERT INTO vehicles (flat_id, vehicle_type, vehicle_number, brand, model, color)
SELECT
  (SELECT id FROM tmp_flats ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  CASE WHEN g % 2 = 0 THEN 'FOUR_WHEELER' ELSE 'TWO_WHEELER' END,
  'MH-04-' || LPAD(g::text, 4, '0'),
  CASE WHEN g % 2 = 0 THEN 'Hyundai' ELSE 'Honda' END,
  CASE WHEN g % 2 = 0 THEN 'Creta' ELSE 'Activa' END,
  CASE WHEN g % 3 = 0 THEN 'White' WHEN g % 3 = 1 THEN 'Black' ELSE 'Red' END
FROM generate_series(1, 30) g;

-- 6) Vendors (30)
WITH ins_vendors AS (
  INSERT INTO vendors (society_id, name, service_type, contact_person, contact_person_phone, contact_person_email, phone, email, address, gst_number, pan_number, bank_name, account_number, ifsc_code, approval_status, is_active)
  SELECT
    (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
    'Vendor ' || g,
    CASE WHEN g % 3 = 0 THEN 'Security' WHEN g % 3 = 1 THEN 'Cleaning' ELSE 'Water Tank' END,
    'Contact ' || g,
    '940000' || LPAD(g::text, 4, '0'),
    'contact' || g || '@vendors.com',
    '950000' || LPAD(g::text, 4, '0'),
    'vendor' || g || '@vendors.com',
    'Vendor Address ' || g,
    'GST' || LPAD(g::text, 6, '0'),
    'PAN' || LPAD(g::text, 6, '0'),
    'Bank ' || ((g - 1) % 5 + 1),
    'ACCT' || LPAD(g::text, 8, '0'),
    'IFSC' || LPAD(g::text, 5, '0'),
    CASE WHEN g % 4 = 0 THEN 'REJECTED' WHEN g % 3 = 0 THEN 'PENDING' ELSE 'APPROVED' END,
    TRUE
  FROM generate_series(1, 30) g
  RETURNING id
)
SELECT id INTO TEMP TABLE tmp_vendors FROM ins_vendors;

-- 7) Contracts (30)
INSERT INTO contracts (society_id, vendor_id, contract_type, title, description, start_date, end_date, reminder_days, document_url, is_active)
SELECT
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  (SELECT id FROM tmp_vendors ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  CASE WHEN g % 2 = 0 THEN 'AMC' ELSE 'Service' END,
  'Contract ' || g,
  'Contract description ' || g,
  DATE '2025-01-01' + (g || ' days')::interval,
  DATE '2026-01-01' + (g || ' days')::interval,
  30,
  'https://example.com/contracts/' || g,
  TRUE
FROM generate_series(1, 30) g;

-- 8) Vendor Bills (30)
INSERT INTO vendor_bills (vendor_id, society_id, bill_number, amount, paid_amount, status, bill_date, due_date, description, payment_mode, reference_number)
SELECT
  (SELECT id FROM tmp_vendors ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  'VB-' || LPAD(g::text, 5, '0'),
  1000 + (g * 50),
  CASE WHEN g % 3 = 0 THEN 1000 + (g * 50) ELSE 0 END,
  CASE WHEN g % 3 = 0 THEN 'PAID' ELSE 'PENDING' END,
  DATE '2026-01-01' + (g || ' days')::interval,
  DATE '2026-01-15' + (g || ' days')::interval,
  'Vendor bill description ' || g,
  CASE WHEN g % 2 = 0 THEN 'ONLINE' ELSE 'CASH' END,
  'REF' || LPAD(g::text, 6, '0')
FROM generate_series(1, 30) g;

-- 9) Maintenance Bills (30)
INSERT INTO maintenance_bills (flat_id, bill_month, amount, paid_amount, due_date, payment_date, status, payment_mode, receipt_number, reference_number)
SELECT
  (SELECT id FROM tmp_flats ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  TO_CHAR(DATE '2026-01-01' + (g || ' days')::interval, 'YYYY-MM'),
  1500 + (g * 20),
  CASE WHEN g % 4 = 0 THEN 1500 + (g * 20) ELSE 0 END,
  DATE '2026-01-15' + (g || ' days')::interval,
  CASE WHEN g % 4 = 0 THEN DATE '2026-01-20' + (g || ' days')::interval ELSE NULL END,
  CASE WHEN g % 4 = 0 THEN 'PAID' ELSE 'PENDING' END,
  CASE WHEN g % 2 = 0 THEN 'ONLINE' ELSE 'CASH' END,
  'REC' || LPAD(g::text, 6, '0'),
  'MB' || LPAD(g::text, 6, '0')
FROM generate_series(1, 30) g;

-- 10) Transactions (30)
INSERT INTO transactions (society_id, transaction_type, payment_mode, amount, category, description, transaction_date, reference_number, bank_name)
SELECT
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  CASE WHEN g % 2 = 0 THEN 'INCOME' ELSE 'EXPENSE' END,
  CASE WHEN g % 2 = 0 THEN 'ONLINE' ELSE 'CASH' END,
  2000 + (g * 15),
  CASE WHEN g % 2 = 0 THEN 'Maintenance' ELSE 'Vendor Payment' END,
  'Transaction ' || g,
  DATE '2026-01-01' + (g || ' days')::interval,
  'TXN' || LPAD(g::text, 6, '0'),
  'Bank ' || ((g - 1) % 3 + 1)
FROM generate_series(1, 30) g;

-- 11) Complaints (30)
INSERT INTO complaints (user_id, title, description, status)
SELECT
  (SELECT id FROM tmp_users ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  'Complaint ' || g,
  'Complaint description ' || g,
  CASE WHEN g % 3 = 0 THEN 'RESOLVED' WHEN g % 3 = 1 THEN 'PENDING' ELSE 'IN_PROGRESS' END
FROM generate_series(1, 30) g;

-- 12) Notices (30)
INSERT INTO notices (society_id, title, content, priority, expiry_date, is_active)
SELECT
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  'Notice ' || g,
  'Notice content ' || g,
  CASE WHEN g % 3 = 0 THEN 'HIGH' WHEN g % 3 = 1 THEN 'MEDIUM' ELSE 'LOW' END,
  DATE '2026-02-01' + (g || ' days')::interval,
  TRUE
FROM generate_series(1, 30) g;

-- 13) Tickets (30)
INSERT INTO tickets (raised_by, assigned_to, society_id, type, title, description, status, priority)
SELECT
  (SELECT id FROM tmp_users ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  (SELECT id FROM tmp_users ORDER BY id LIMIT 1 OFFSET ((g) % 30)),
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  CASE WHEN g % 2 = 0 THEN 'MAINTENANCE' ELSE 'ELECTRICAL' END,
  'Ticket ' || g,
  'Ticket description ' || g,
  CASE WHEN g % 3 = 0 THEN 'CLOSED' WHEN g % 3 = 1 THEN 'OPEN' ELSE 'IN_PROGRESS' END,
  CASE WHEN g % 2 = 0 THEN 'HIGH' ELSE 'MEDIUM' END
FROM generate_series(1, 30) g;

-- 14) Emergency Contacts (30)
INSERT INTO emergency_contacts (society_id, contact_type, name, phone, alternate_phone, address, notes, is_active)
SELECT
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  CASE WHEN g % 4 = 0 THEN 'Fire' WHEN g % 4 = 1 THEN 'Police' WHEN g % 4 = 2 THEN 'Ambulance' ELSE 'Plumber' END,
  'Contact ' || g,
  '960000' || LPAD(g::text, 4, '0'),
  '970000' || LPAD(g::text, 4, '0'),
  'Emergency Address ' || g,
  'Notes ' || g,
  TRUE
FROM generate_series(1, 30) g;

-- 15) Document Templates (30)
INSERT INTO document_templates (template_type, title, content, is_active)
SELECT
  CASE WHEN g % 2 = 0 THEN 'NOC' ELSE 'AGREEMENT' END,
  'Template ' || g,
  'Template content ' || g,
  TRUE
FROM generate_series(1, 30) g;

-- 16) Banners (30)
INSERT INTO banners (society_id, title, image_url, redirect_url, start_date, end_date, display_order, is_active)
SELECT
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  'Banner ' || g,
  'https://example.com/banner/' || g || '.png',
  'https://example.com/redirect/' || g,
  DATE '2026-02-01' + (g || ' days')::interval,
  DATE '2026-03-01' + (g || ' days')::interval,
  g,
  TRUE
FROM generate_series(1, 30) g;

-- 17) Notification Preferences (30)
INSERT INTO notification_preferences (user_id, email_tickets, email_complaints, email_payments, email_contracts)
SELECT
  (SELECT id FROM tmp_users ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM generate_series(1, 30) g;

-- 18) Security Logs (30)
INSERT INTO security_logs (society_id, type, event, status, created_at)
SELECT
  (SELECT id FROM tmp_societies ORDER BY id LIMIT 1 OFFSET ((g - 1) % 30)),
  CASE WHEN g % 4 = 0 THEN 'ALERT' WHEN g % 4 = 1 THEN 'SECURITY' WHEN g % 4 = 2 THEN 'SYSTEM' ELSE 'MAINTENANCE' END,
  'Security event ' || g,
  CASE WHEN g % 3 = 0 THEN 'Blocked' WHEN g % 3 = 1 THEN 'Approved' ELSE 'Info' END,
  NOW() - (g || ' minutes')::interval
FROM generate_series(1, 30) g;
