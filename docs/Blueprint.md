<div align="center">

# 🏘️ Society Management System
## Complete Feature Blueprint & Implementation Roadmap

[![Status](https://img.shields.io/badge/Status-In%20Development-blue)](#)
[![Features](https://img.shields.io/badge/Features-67-brightgreen)](#feature-index)
[![Phases](https://img.shields.io/badge/Phases-12-orange)](#implementation-phases)
[![Stack](https://img.shields.io/badge/Stack-Spring%20Boot%20%7C%20React%20%7C%20PostgreSQL-purple)](#tech-stack)

*A comprehensive digital platform for Indian Housing Society Management — from bill generation to elections, from visitor OTP to bank reconciliation.*

</div>

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Role Hierarchy](#-role-hierarchy)
- [Implementation Phases](#-implementation-phases)
- [Feature Index](#-feature-index)
- [Phase 1 — Core Foundation](#-phase-1--core-foundation-week-1-3)
- [Phase 2 — Finance Engine](#-phase-2--finance-engine-week-4-8)
- [Phase 3 — Approval & Governance](#-phase-3--approval--governance-week-9-11)
- [Phase 4 — Communication & Tickets](#-phase-4--communication--tickets-week-12-14)
- [Phase 5 — Security & Visitor Management](#-phase-5--security--visitor-management-week-15-16)
- [Phase 6 — Operations & Maintenance](#-phase-6--operations--maintenance-week-17-19)
- [Phase 7 — Resident Services](#-phase-7--resident-services-week-20-21)
- [Phase 8 — Vendor Ecosystem](#-phase-8--vendor-ecosystem-week-22-23)
- [Phase 9 — Advanced Finance & Compliance](#-phase-9--advanced-finance--compliance-week-24-26)
- [Phase 10 — Documents & Reports](#-phase-10--documents--reports-week-27-28)
- [Phase 11 — Platform Infrastructure](#-phase-11--platform-infrastructure-week-29-31)
- [Phase 12 — Modern Enhancements](#-phase-12--modern-enhancements-week-32-35)
- [Database Schema Overview](#-database-schema-overview)
- [API Endpoint Summary](#-api-endpoint-summary)
- [Scalability Notes](#-scalability-notes)

---

## 🛠 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend** | Spring Boot | 3.5.x | REST API, Security, Scheduling |
| **Language** | Java | 21 (LTS) | Backend logic |
| **Frontend (Web)** | React + Vite | 19.x | Admin & Member portal |
| **Frontend (Mobile)** | React Native / Expo | — | Member & Staff mobile app |
| **Database** | PostgreSQL | 16.x | Primary datastore |
| **ORM** | Hibernate / JPA | 6.x | Object-relational mapping |
| **Migrations** | Flyway | 11.x | Schema versioning |
| **Auth** | JWT + Spring Security | — | Stateless auth, HTTP-only cookies |
| **Payments** | Razorpay Java SDK | 1.4.x | Online payment gateway |
| **Email** | Spring Mail + Gmail SMTP | — | Transactional emails |
| **Excel** | Apache POI | 5.2.x | Excel export/import |
| **PDF** | OpenPDF | 2.0.x | Bill & receipt PDF generation |
| **Charts** | Recharts | 3.x | Dashboard visualizations |
| **Push** | Firebase Admin SDK | — | Mobile push notifications |
| **Rate Limit** | Bucket4j | — | API abuse prevention |
| **State Mgmt** | TanStack React Query | 5.x | Server state caching |

---

## 👥 Role Hierarchy

```
Level 0 ─── MASTER_ADMIN          (Platform-wide full access)
            │
Level 1 ─── SOCIETY_ADMIN         (Full access within own society)
            │
Level 2 ─┬─ CHAIRMAN  ──┬─        Same level, shared CRUD
          ├─ SECRETARY ──┤         on all society modules
          └─ TREASURER ──┘         (cannot manage each other)
            │
Level 3 ─┬─ COMMITTEE ───         View all + limited write (tickets, notices — NO finance writes)
          └─ MANAGER   ───         Operational management
            │
Level 4 ─┬─ EMPLOYEE ────         Staff/Security (visitors, gate logs)
          └─ MEMBER   ────         Flat owner (own bills, tickets, profile)
            │
Level 5 ─┬─ TENANT ──────         Renter (own profile, raise tickets)
          └─ VENDOR ──────         External vendor (own bills, invoices, work status)
            │
Level 6 ─── VISITOR ──────         Minimal access (own profile only)
```

> **12 roles total.** Legacy `PLATFORM_OWNER` and `ORGANIZATION_OWNER` are removed. `MASTER_ADMIN` is the sole top role.

---

## 📅 Implementation Phases

| Phase | Name | Weeks | Features | Priority |
|-------|------|-------|----------|----------|
| **1** | Core Foundation | Week 1–3 | 7 features | 🔴 Critical |
| **2** | Finance Engine | Week 4–8 | 10 features | 🔴 Critical |
| **3** | Approval & Governance | Week 9–11 | 6 features | 🔴 Critical |
| **4** | Communication & Tickets | Week 12–14 | 6 features | 🟡 High |
| **5** | Security & Visitor Mgmt | Week 15–16 | 5 features | 🟡 High |
| **6** | Operations & Maintenance | Week 17–19 | 6 features | 🟡 High |
| **7** | Resident Services | Week 20–21 | 5 features | 🟢 Medium |
| **8** | Vendor Ecosystem | Week 22–23 | 5 features | 🟢 Medium |
| **9** | Adv. Finance & Compliance | Week 24–26 | 6 features | 🟢 Medium |
| **10** | Documents & Reports | Week 27–28 | 5 features | 🟢 Medium |
| **11** | Platform Infrastructure | Week 29–31 | 7 features | 🟡 High |
| **12** | Modern Enhancements | Week 32–35 | 9 features | 🔵 Low |

**Total: ~35 weeks for 77 features** (includes 10 sub-features counted separately)

---

## 📑 Feature Index

<details>
<summary><strong>Click to expand full feature list (67 features)</strong></summary>

| # | Feature | Phase | Priority | Est. Time |
|---|---------|-------|----------|-----------|
| F01 | Role Redesign (12 roles) | 1 | 🔴 Critical | 3 days |
| F02 | Legacy Role Cleanup | 1 | 🔴 Critical | 2 days |
| F03 | Permission Matrix Rebuild | 1 | 🔴 Critical | 2 days |
| F04 | Head Role Write Access Restore | 1 | 🔴 Critical | 1 day |
| F05 | Controller @PreAuthorize Alignment | 1 | 🔴 Critical | 3 days |
| F06 | Frontend Auth Alignment | 1 | 🔴 Critical | 2 days |
| F07 | Shared Format Utilities | 1 | 🔴 Critical | 1 day |
| F08 | Society Rate Configuration | 2 | 🔴 Critical | 4 days |
| F09 | Itemized Bill Line Items | 2 | 🔴 Critical | 5 days |
| F10 | Professional Bill Generation | 2 | 🔴 Critical | 5 days |
| F11 | Parking Slot Management | 2 | 🔴 Critical | 3 days |
| F12 | Interest & Penalty Calculation | 2 | 🔴 Critical | 3 days |
| F13 | Sequential Receipt/Bill Numbers | 2 | 🔴 Critical | 2 days |
| F14 | PDF Generation (Bills/Receipts) | 2 | 🔴 Critical | 5 days |
| F15 | Export to Excel Everywhere | 2 | 🟡 High | 4 days |
| F16 | Print to PDF Everywhere | 2 | 🟡 High | 3 days |
| F17 | Multi-Bank Account Management | 2 | 🟡 High | 3 days |
| F18 | Approval Workflow Engine | 3 | 🔴 Critical | 5 days |
| F19 | Expense Approval Chain | 3 | 🔴 Critical | 3 days |
| F20 | Rate Change Proposals | 3 | 🟡 High | 3 days |
| F21 | Polls & Voting | 3 | 🟡 High | 4 days |
| F22 | AGM / Meeting Management | 3 | 🟡 High | 4 days |
| F23 | Committee Elections | 3 | 🟢 Medium | 4 days |
| F24 | Unified Ticket System | 4 | 🔴 Critical | 4 days |
| F25 | Configurable Deadline Reminders | 4 | 🟡 High | 4 days |
| F26 | Internal Messaging / Helpdesk | 4 | 🟢 Medium | 4 days |
| F27 | Notice Read Receipts | 4 | 🟢 Medium | 2 days |
| F28 | Event Management | 4 | 🟢 Medium | 3 days |
| F29 | Demand Notice & Legal Recovery | 4 | 🟡 High | 3 days |
| F30 | Visitor Management Enhancement | 5 | 🟡 High | 2 days |
| F31 | Delivery & Cab OTP | 5 | 🟡 High | 3 days |
| F32 | SOS / Emergency Alert | 5 | 🟡 High | 3 days |
| F33 | Guard Patrol & Duty Roster | 5 | 🟢 Medium | 4 days |
| F34 | Gate Log Enhancement | 5 | 🟢 Medium | 2 days |
| F35 | Work Order System | 6 | 🔴 Critical | 5 days |
| F36 | Asset / Inventory Management | 6 | 🟡 High | 3 days |
| F37 | Common Area Maintenance Schedule | 6 | 🟡 High | 3 days |
| F38 | Staff Attendance & Shifts | 6 | 🟢 Medium | 3 days |
| F39 | Facility / Amenity Booking | 6 | 🟢 Medium | 4 days |
| F40 | Renovation NOC | 6 | 🟢 Medium | 3 days |
| F41 | Move-In / Move-Out Tracking | 7 | 🟡 High | 3 days |
| F42 | Penalty & Fine System | 7 | 🟡 High | 3 days |
| F43 | Pet Registration | 7 | 🟢 Medium | 2 days |
| F44 | Classified / Internal Marketplace | 7 | 🔵 Low | 3 days |
| F45 | Society Rules / Bylaws Repository | 7 | 🟢 Medium | 3 days |
| F46 | Vendor Login & Portal | 8 | 🟡 High | 4 days |
| F47 | Vendor Rating & Review | 8 | 🟢 Medium | 2 days |
| F48 | Vendor Invoice Submission | 8 | 🟡 High | 3 days |
| F49 | Vendor Work Status Tracking | 8 | 🟡 High | 2 days |
| F50 | Vendor Bill TDS Compliance | 8 | 🟢 Medium | 3 days |
| F51 | Bank Reconciliation | 9 | 🟡 High | 5 days |
| F52 | Accounting Statements | 9 | 🟡 High | 4 days |
| F53 | Annual Budget Planning | 9 | 🟡 High | 4 days |
| F54 | Treasurer Dashboard & Ledger | 9 | 🟡 High | 4 days |
| F55 | Receipt Book | 9 | 🟢 Medium | 2 days |
| F56 | Collection Report & Defaulters | 9 | 🟡 High | 3 days |
| F57 | Society Document Repository | 10 | 🟡 High | 3 days |
| F58 | Meeting Minutes PDF | 10 | 🟢 Medium | 2 days |
| F59 | Dashboard Enhancements | 10 | 🟢 Medium | 4 days |
| F60 | Report Module Extensions | 10 | 🟢 Medium | 4 days |
| F61 | Export Module Extensions | 10 | 🟢 Medium | 3 days |
| F62 | Two-Factor Authentication | 11 | 🟡 High | 3 days |
| F63 | Rate Limiting | 11 | 🟡 High | 2 days |
| F64 | Comprehensive Audit Trail | 11 | 🟡 High | 4 days |
| F65 | Firebase Push Notifications | 11 | 🟡 High | 4 days |
| F66 | Multi-language (i18n) | 11 | 🟢 Medium | 5 days |
| F67 | Data Export & Right to Erasure | 11 | 🟢 Medium | 3 days |
| F68 | Automated Backup | 11 | 🟡 High | 2 days |
| F69 | WhatsApp / SMS Integration | 12 | 🟢 Medium | 4 days |
| F70 | OAuth / Social Login | 12 | 🔵 Low | 2 days |
| F71 | EV Charging Management | 12 | 🔵 Low | 3 days |
| F72 | Township / Federation Mode | 12 | 🔵 Low | 5 days |
| F73 | AI-powered Insights | 12 | 🔵 Low | 5 days |
| F74 | Offline Mode (Mobile) | 12 | 🔵 Low | 4 days |
| F75 | SaaS / Subscription Billing | 12 | 🔵 Low | 4 days |
| F76 | Deep Linking (Mobile) | 12 | 🔵 Low | 2 days |
| F77 | Mobile Vendor Portal | 12 | 🔵 Low | 3 days |

</details>

---

## 🔴 Phase 1 — Core Foundation (Week 1–3)

> **Goal:** Clean up the role system, restore correct permissions, align frontend and backend. This is the foundation everything else builds on.

---

### F01 · Role Redesign (12 Roles)

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | High — every feature depends on correct roles |

**Description:**
Remove legacy `PLATFORM_OWNER` and `ORGANIZATION_OWNER` roles. Add `VENDOR` as a new login-capable role. Consolidate to exactly 12 roles.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `backend/src/main/java/com/society/backend/entity/Role.java` | **MODIFY** | Remove `PLATFORM_OWNER`, `ORGANIZATION_OWNER`. Add `VENDOR`. Final: 12 enum values |
| `backend/src/main/java/com/society/backend/entity/User.java` | **MODIFY** | Remove `isPlatformOwner()`, `isOrganizationOwner()`. Add `isMasterAdmin()`, `isVendor()` |
| `backend/src/main/java/com/society/backend/config/SchemaMigrationRunner.java` | **MODIFY** | Update migration logic to handle new role set |

**Database Changes:**

| Table | Action | Details |
|-------|--------|---------|
| `users` | **ALTER** | Update role CHECK constraint to new 12-role set |

**Migration File:** `V5__role_redesign.sql`

```sql
-- Migrate legacy roles
UPDATE users SET role = 'MASTER_ADMIN' WHERE role IN ('PLATFORM_OWNER', 'ORGANIZATION_OWNER');

-- Update CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
    'MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER',
    'COMMITTEE', 'MANAGER', 'EMPLOYEE', 'MEMBER', 'TENANT', 'VENDOR', 'VISITOR'
));
```

**Frontend Changes:**

| File | Action | Details |
|------|--------|---------|
| `admin-web/src/context/AuthContext.jsx` | **MODIFY** | Remove `isPlatformOwner()`, add `isMasterAdmin()`, `isVendor()` |
| `admin-web/src/pages/users/RolesPermissions.jsx` | **MODIFY** | Update role display table |

**Scalability:** This is a one-time migration. New roles can be added to the enum and CHECK constraint without schema redesign.

---

### F02 · Legacy Role Cleanup

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 2 days |
| **Complexity** | High (wide blast radius — 30+ files) |
| **Scalability Impact** | Low — one-time cleanup |

**Description:**
Global find-and-replace `Role.PLATFORM_OWNER` → `Role.MASTER_ADMIN` and remove all `Role.ORGANIZATION_OWNER` references across the entire backend.

**Backend Changes:**

| File Category | Files Affected | Action |
|---------------|----------------|--------|
| Controllers | ~15 files (UserController, VendorController, TicketController, TransactionController, etc.) | Replace `PLATFORM_OWNER` with `MASTER_ADMIN` in all `@PreAuthorize` annotations |
| Services | ~10 files (RoleService, AuthServiceImpl, UserServiceImpl, VendorServiceImpl, etc.) | Replace role references |
| Entities | ~15 files (all entities with `@Transient Organization`) | Remove organization field entirely |
| Security | `RolePermissions.java`, `SecurityConfig.java` | Remove `PLATFORM_OWNER`/`ORGANIZATION_OWNER` entries |
| Config | `AuthController.java` (login portal map) | Update portal → role mapping |

**Risk:** High — touching 30+ files. Must compile and test after every batch of changes.

---

### F03 · Permission Matrix Rebuild

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 2 days |
| **Complexity** | Medium |
| **Scalability Impact** | High — all authorization flows depend on this |

**Description:**
Rebuild `RolePermissions.java` with the new role hierarchy. Chairman/Secretary/Treasurer get full user CRUD on roles below them. Committee gets limited scope.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `backend/src/main/java/com/society/backend/security/RolePermissions.java` | **REWRITE** | Complete rebuild of `ALLOWED_CREATIONS`, `ALLOWED_UPDATES`, `ALLOWED_READS` maps |

**New Permission Matrix:**

```
MASTER_ADMIN    → Create/Update/Delete: ALL roles
SOCIETY_ADMIN   → Create/Update/Delete: CHAIRMAN → VISITOR + VENDOR
CHAIRMAN        → Create/Update/Delete: COMMITTEE, MANAGER, EMPLOYEE, MEMBER, TENANT, VISITOR
SECRETARY       → Same as CHAIRMAN
TREASURER       → Same as CHAIRMAN
COMMITTEE       → Create/Update/Delete: EMPLOYEE, MEMBER
EMPLOYEE        → Create/Update/Delete: VISITOR
MEMBER          → Create/Update/Delete: TENANT
VENDOR          → None
MANAGER         → None
TENANT          → None
VISITOR         → None
```

---

### F04 · Head Role Write Access Restore

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 1 day |
| **Complexity** | Low |
| **Scalability Impact** | High — unblocks all write operations for head roles |

**Description:**
Delete the `ReadOnlyHeadRoleWriteBlockFilter` that currently blocks ALL POST/PUT/PATCH/DELETE requests for Chairman, Secretary, and Treasurer.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `backend/.../security/ReadOnlyHeadRoleWriteBlockFilter.java` | **DELETE** | Remove entire file |
| `backend/.../config/SecurityConfig.java` | **MODIFY** | Remove filter field, constructor param, and `.addFilterAfter(...)` |

**Database Changes:** None

**Frontend Changes:** None

---

### F05 · Controller @PreAuthorize Alignment

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 3 days |
| **Complexity** | High (repetitive, 100+ annotations) |
| **Scalability Impact** | Medium |

**Description:**
Audit every `@PreAuthorize` annotation across all controllers. Ensure Chairman/Secretary/Treasurer have write access. Ensure Committee is excluded from financial write endpoints.

**Backend Changes:**

| Controller | Write Roles | Read Roles |
|------------|------------|------------|
| UserController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE (for EMPLOYEE/MEMBER only) | All roles (scoped) |
| VendorController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, MANAGER | + COMMITTEE (read) |
| VendorBillController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER | + COMMITTEE (read) |
| MaintenanceBillController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER | + COMMITTEE, MEMBER (own) |
| TransactionController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER | + COMMITTEE (read) |
| TicketController | MASTER_ADMIN → EMPLOYEE (create), MASTER_ADMIN → MANAGER (manage) | All authenticated |
| NoticeController | MASTER_ADMIN → MANAGER | All authenticated |
| WingController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, MANAGER | All authenticated |
| BannerController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, MANAGER | All authenticated |
| ContractController | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER | + COMMITTEE (read) |
| EmergencyContactController | MASTER_ADMIN → MANAGER | All authenticated |

**Also update `RoleService.java`:**

- `requireAdminOrCommittee()` → includes CHAIRMAN, SECRETARY, TREASURER
- `requireStaff()` → includes CHAIRMAN, SECRETARY, TREASURER
- New `canManageFinancials()` → SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER only

---

### F06 · Frontend Auth Alignment

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 2 days |
| **Complexity** | Medium |
| **Scalability Impact** | High — all UI conditionals depend on this |

**Description:**
Update all frontend capability helpers to match the new role matrix.

**Frontend Changes:**

| File | Action | Details |
|------|--------|---------|
| `admin-web/src/context/AuthContext.jsx` | **MODIFY** | Rebuild all 30+ `canManage*` functions per new matrix |

**Updated Capability Map:**

| Function | Roles Allowed |
|----------|--------------|
| `canManageUsers()` | MASTER_ADMIN, SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE |
| `canManageVendors()` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, MANAGER |
| `canManageFinancials()` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER |
| `canManageTickets()` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, COMMITTEE, MANAGER |
| `canManageWings()` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER, MANAGER |
| `canViewAll()` | SOCIETY_ADMIN → COMMITTEE (read-only for COMMITTEE on finance) |
| `isVendor()` | VENDOR |

---

### F07 · Shared Format Utilities

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 1 day |
| **Complexity** | Low |
| **Scalability Impact** | Medium — eliminates code duplication across 10+ pages |

**Description:**
Currently `formatCurrency()` and `formatDate()` are duplicated in 5+ page components. Centralize into shared utilities.

**Frontend Changes:**

| File | Action | Details |
|------|--------|---------|
| `admin-web/src/utils/formatUtils.js` | **CREATE** | Shared formatting functions |

**Functions:**

```
formatCurrency(amount)      → ₹1,23,456.00 (Indian numbering)
formatDate(date)            → 18 Feb 2026
formatDateTime(datetime)    → 18 Feb 2026, 2:30 PM
formatMonth(billMonth)      → January 2026
formatPhone(phone)          → +91 98765 43210
formatStatus(status)        → { label, color, icon }
formatReceiptNumber(rcpt)   → formatted receipt string
formatPercentage(value)     → 21.5%
formatArea(sqft)            → 1,250 sq.ft
```

---

## 🔴 Phase 2 — Finance Engine (Week 4–8)

> **Goal:** Transform the single-amount billing system into a professional itemized maintenance bill with 20+ charge types, parking management, interest/penalty calculation, PDF generation, and export capabilities everywhere.

---

### F08 · Society Rate Configuration

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | High — foundation for all bill calculations |

**Description:**
Create a per-society configuration entity storing all rates, interest percentages, penalty slabs, GST rates, and billing schedule preferences. Currently, bill amounts are passed as API parameters each time with no stored default rates.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `backend/.../entity/SocietySetting.java` | **CREATE** | New entity with 25+ configurable fields |
| `backend/.../repository/SocietySettingRepository.java` | **CREATE** | JPA repository |
| `backend/.../service/SocietySettingService.java` | **CREATE** | Service interface |
| `backend/.../service/SocietySettingServiceImpl.java` | **CREATE** | Service implementation with defaults |
| `backend/.../controller/SocietySettingController.java` | **CREATE** | CRUD endpoints |

**Database Changes:**

| Table | Action | Columns |
|-------|--------|---------|
| `society_settings` | **CREATE** | id, society_id (FK UNIQUE), maintenance_rate_per_sqft, water_charges_fixed, water_charges_per_person, sinking_fund_per_sqft, repair_fund_per_sqft, parking_charge_open, parking_charge_covered, parking_charge_stilt, parking_charge_two_wheeler, lift_maintenance_charge, electricity_common_charge, security_charge, insurance_charge, club_house_charge, property_tax_share, non_occupancy_surcharge_pct, gst_percentage, late_payment_interest_pct, grace_period_days, penalty_fixed, bill_generation_day, due_date_day, financial_year_start_month, bill_number_prefix, receipt_number_prefix, created_at, updated_at |
| `flat_rate_overrides` | **CREATE** | id, flat_id (FK), charge_type, custom_amount, reason, effective_from, effective_until, created_by, created_at |

**Frontend Changes:**

| File | Action | Details |
|------|--------|---------|
| `admin-web/src/pages/finance/SocietySettings.jsx` | **CREATE** | Rate configuration form with sections |

**API Endpoints:**

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/society-settings/{societyId}` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER |
| PUT | `/api/society-settings/{societyId}` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER |
| GET | `/api/flat-rate-overrides/flat/{flatId}` | SOCIETY_ADMIN+ |
| POST | `/api/flat-rate-overrides` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER |
| DELETE | `/api/flat-rate-overrides/{id}` | SOCIETY_ADMIN, CHAIRMAN, SECRETARY, TREASURER |

---

### F09 · Itemized Bill Line Items

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 5 days |
| **Complexity** | High |
| **Scalability Impact** | High — transforms the entire billing model |

**Description:**
Replace the single `amount` field on `MaintenanceBill` with a `@OneToMany` relationship to `BillLineItem` entities. Each bill will have 10-20+ line items showing the exact breakdown.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `backend/.../entity/BillLineItem.java` | **CREATE** | Line item entity |
| `backend/.../entity/MaintenanceBill.java` | **MODIFY** | Add lineItems, subtotal, taxAmount, interestAmount, penaltyAmount, totalAmount, previousBalance, advanceBalance, billNumber |
| `backend/.../repository/BillLineItemRepository.java` | **CREATE** | JPA repository |
| `backend/.../service/maintenance/MaintenanceBillServiceImpl.java` | **MAJOR REFACTOR** | Rewrite `generateBillsForSociety()` with itemized calculation |

**Database Changes:**

| Table | Action | Key Columns |
|-------|--------|-------------|
| `bill_line_items` | **CREATE** | id, maintenance_bill_id (FK), charge_type, description, rate, quantity, amount, is_taxable, display_order |
| `maintenance_bills` | **ALTER** | Add bill_number, subtotal, tax_amount, interest_amount, penalty_amount, total_amount, previous_balance, advance_balance |

**Charge Types (22 total):**

| Charge Type | Calc Basis | Taxable? |
|-------------|-----------|----------|
| MAINTENANCE | rate × area (sqft) | Yes |
| SINKING_FUND | rate × area | No |
| REPAIR_FUND | rate × area | No |
| WATER_CHARGES | fixed per unit or per person | Yes |
| PARKING_OPEN | rate × count | Yes |
| PARKING_COVERED | rate × count | Yes |
| PARKING_STILT | rate × count | Yes |
| PARKING_TWO_WHEELER | rate × count | Yes |
| LIFT_MAINTENANCE | fixed per unit | Yes |
| ELECTRICITY_COMMON | fixed per unit | Yes |
| SECURITY_CHARGE | fixed per unit | Yes |
| INSURANCE | fixed per unit | No |
| CLUB_HOUSE | fixed per unit | Yes |
| PROPERTY_TAX | fixed per unit | No |
| NON_OCCUPANCY | % of subtotal (if tenant) | Yes |
| GST | % of taxable total | — |
| INTEREST | overdue × rate × months | No |
| PENALTY | fixed or slab | No |
| ARREARS | previous unpaid balance | No |
| ADVANCE_ADJUSTMENT | negative (deduction) | No |
| SPECIAL_ASSESSMENT | custom one-time levy | Yes |
| OTHER | custom amount | Configurable |

**Bill Generation Algorithm:**

```
For each flat in society:
  1.  Read SocietySetting rates
  2.  Apply FlatRateOverrides (if any)
  3.  Calculate each charge type → create BillLineItem
  4.  Query parking_slots for vehicle-based parking charges
  5.  Check if flat has active tenant → apply Non-Occupancy surcharge
  6.  Sum taxable items → apply GST
  7.  Query previous month bill → carry forward arrears
  8.  Calculate interest on overdue beyond grace period
  9.  Apply penalty if applicable
  10. Deduct advance balance (if any)
  11. Generate sequential bill number
  12. Save MaintenanceBill + all BillLineItems
```

---

### F10 · Professional Bill Generation

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 5 days |
| **Complexity** | High |
| **Scalability Impact** | Medium |

**Description:**
Refactor the bulk generation UI and backend to support the new itemized system. Add preview before generation, individual flat customization, and auto-generation scheduling.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `MaintenanceBillServiceImpl.java` | **MODIFY** | New `previewBillGeneration()` that returns itemized preview per flat without saving |
| `MaintenanceBillController.java` | **MODIFY** | Add `POST /generate/preview-detailed` for full itemized preview |

**Frontend Changes:**

| File | Action | Details |
|------|--------|---------|
| `admin-web/src/pages/finance/MaintenanceBills.jsx` | **MAJOR MODIFY** | New generation modal with itemized preview, per-flat customization, confirmation step |
| `admin-web/src/pages/finance/MyBills.jsx` | **MODIFY** | Show line item breakdown (expand/collapse per bill), download bill PDF, download receipt |

**Scalability:** Generating 500 bills (large society) with 20 line items each = 10,000 `bill_line_items` rows per month. Index on `maintenance_bill_id`. Pagination on API responses.

---

### F11 · Parking Slot Management

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Description:**
Structured parking slot entity to precisely calculate parking charges. Replaces counting vehicles from vehicles table.

**Database Changes:**

| Table | Action | Key Columns |
|-------|--------|-------------|
| `parking_slots` | **CREATE** | id, society_id (FK), flat_id (FK nullable), slot_number, slot_type (OPEN/COVERED/STILT/TWO_WHEELER/EV), vehicle_id (FK nullable), location, is_active, created_at |

**Backend:** New entity + controller + service. CRUD restricted to SOCIETY_ADMIN/Head roles.

**Frontend:** New parking management section within UnitManagement or dedicated page. Assign slots to flats, link vehicles.

---

### F12 · Interest & Penalty Calculation

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Medium |

**Description:**
Auto-calculate late payment interest and penalties during bill generation. Uses rates from `SocietySetting`.

**Frontend:** Show interest warning on MyBills: *"If you pay after {date}, interest of ₹{amount} will apply"*

---

### F13 · Sequential Receipt/Bill Numbers

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 2 days |
| **Complexity** | Low |
| **Scalability Impact** | Low |

**Description:**
Replace UUID-based receipt numbers (`RCP-XXXXXXXX`) with professional sequential numbers: `{PREFIX}-RCP-{FY}-{5-digit}` (e.g., `SMS-RCP-2025-00142`).

**Database Changes:**

| Table | Action | Key Columns |
|-------|--------|-------------|
| `number_sequences` | **CREATE** | id, society_id, sequence_type (BILL/RECEIPT/TICKET), financial_year, last_number, prefix |

**Backend:** `SequenceGeneratorService` — thread-safe `@Transactional` method using `SELECT ... FOR UPDATE` to guarantee unique sequential numbers.

---

### F14 · PDF Generation (Bills / Receipts)

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 5 days |
| **Complexity** | High |
| **Scalability Impact** | Medium |

**Description:**
Generate professional PDF documents for maintenance bills, payment receipts, vendor bills, and ticket acknowledgments.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `pom.xml` | **MODIFY** | Add `com.github.librepdf:openpdf:2.0.3` dependency |
| `backend/.../service/PdfGeneratorService.java` | **CREATE** | All PDF generation methods |
| `backend/.../controller/PdfExportController.java` | **CREATE** | PDF download endpoints |

**PDF Templates:**

| PDF Type | Content | Layout |
|----------|---------|--------|
| Maintenance Bill | Society header, bill#, date, member details, itemized charges table (Sl / Particular / Rate / Qty / Amount), subtotal, GST, interest, penalty, arrears, total, due date, payment status | A4 portrait, professional header with society logo |
| Payment Receipt | Society header, receipt#, date, received from (name/flat), amount in words + figures, payment mode, bill reference, received by | A5 half-page, duplicate copy layout |
| Vendor Bill | Vendor details, bill#, items, GST, total, payment status | A4 portrait |
| Ticket Receipt | Ticket token (TKT-YYYY-NNNNN), raised by, date, description, status, assigned to | A5 acknowledgment slip |
| Financial Report | Period, income/expense breakdown, category totals, charts | A4 landscape, multi-page |
| Collection Report | Flat-wise table, paid/unpaid, totals, efficiency % | A4 landscape |
| Defaulter List | Name, flat, outstanding, overdue days, last payment date | A4 portrait |

**API Endpoints:**

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/pdf/maintenance-bill/{id}` | application/pdf |
| GET | `/api/pdf/receipt/{billId}` | application/pdf |
| GET | `/api/pdf/vendor-bill/{id}` | application/pdf |
| GET | `/api/pdf/ticket-receipt/{id}` | application/pdf |
| GET | `/api/pdf/financial-report/{societyId}?period&start&end` | application/pdf |
| GET | `/api/pdf/collection-report/{societyId}?month` | application/pdf |
| GET | `/api/pdf/defaulter-list/{societyId}` | application/pdf |
| GET | `/api/pdf/demand-notice/{noticeId}` | application/pdf |

---

### F15 · Export to Excel Everywhere

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Description:**
Add Excel export capability to every data table across the application. Extend existing `ExportController` and `ExcelExportServiceImpl` with missing exports.

**New Export Endpoints:**

| Endpoint | Data |
|----------|------|
| `GET /api/export/payments/{societyId}` | Payment history |
| `GET /api/export/vendors/{societyId}` | Vendor directory |
| `GET /api/export/contracts/{societyId}` | Contract list |
| `GET /api/export/vehicles/{societyId}` | Vehicle register |
| `GET /api/export/tenants/{societyId}` | Tenant list |
| `GET /api/export/collection-report/{societyId}?month` | Month-wise collection |
| `GET /api/export/defaulter-list/{societyId}` | Defaulter report |
| `GET /api/export/parking-slots/{societyId}` | Parking allocation |
| `GET /api/export/attendance/{societyId}?month` | Staff attendance |

**Frontend Changes:**

| File | Action |
|------|--------|
| `admin-web/src/components/ExportToolbar.jsx` | **CREATE** — reusable [Excel ⬇] [PDF ⬇] [🖨 Print] toolbar |
| All 15+ data pages | **MODIFY** — add `<ExportToolbar>` component |

---

### F16 · Print to PDF Everywhere

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Description:**
Add client-side Print button on every page + print-optimized CSS.

**Frontend Changes:**

| File | Action | Details |
|------|--------|---------|
| `admin-web/package.json` | **MODIFY** | Add `jspdf` + `jspdf-autotable` dependencies |
| `admin-web/src/styles/print.css` | **CREATE** | `@media print` rules — hide UI chrome, format tables for A4 |
| `admin-web/src/components/ExportToolbar.jsx` | **MODIFY** | Add Print button using `window.print()` |

---

### F17 · Multi-Bank Account Management

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Medium — foundation for bank reconciliation (F51) |

**Description:**
Societies typically have 3-5 bank accounts (operating, sinking fund FD, repair fund FD). Replace the plain `bankName` string on transactions with a proper bank account entity.

**Database Changes:**

| Table | Action | Key Columns |
|-------|--------|-------------|
| `bank_accounts` | **CREATE** | id, society_id (FK), account_name, bank_name, branch, account_number, ifsc_code, account_type (SAVINGS/CURRENT/FD), opening_balance, current_balance, is_primary, is_active, created_at |
| `transactions` | **ALTER** | Add bank_account_id (FK nullable) |

---

## 🔴 Phase 3 — Approval & Governance (Week 9–11)

---

### F18 · Approval Workflow Engine

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 5 days |
| **Complexity** | Very High |
| **Scalability Impact** | Very High — used by expenses, rate changes, vendors, tickets, NOCs, refunds |

**Description:**
A generic multi-step approval chain engine. One system handles all approval flows: expenses, rate changes, vendor onboarding, ticket escalation, special assessments, and refunds.

**Database Changes (4 tables):**

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `approval_workflows` | id, society_id, workflow_type (EXPENSE/RATE_CHANGE/VENDOR/TICKET_ESCALATION/SPECIAL_ASSESSMENT/REFUND/NOC), name, is_active | Workflow definitions |
| `approval_steps` | id, workflow_id (FK), step_order, approver_role, approver_user_id (nullable), is_mandatory, auto_approve_below (amount threshold) | Steps in chain |
| `approval_requests` | id, workflow_id, entity_type, entity_id, requested_by, current_step, status (PENDING/IN_PROGRESS/APPROVED/REJECTED/CANCELLED), created_at, completed_at | Submitted items |
| `approval_actions` | id, request_id, step_id, acted_by, action (APPROVED/REJECTED/RETURNED/ESCALATED), comments, acted_at | Audit trail |

**Default Workflows:**

| Workflow | Step 1 | Step 2 | Step 3 | Auto-approve |
|----------|--------|--------|--------|-------------|
| EXPENSE | Manager/Committee submits | Treasurer verifies | Chairman/Secretary approves | < ₹5,000 |
| RATE_CHANGE | Treasurer proposes | Chairman reviews | Secretary confirms | Never |
| VENDOR | Creator submits | Chairman/Secretary approves | — | Auto if creator is head role |
| TICKET_ESCALATION | Committee assigns | Manager resolves | Raiser confirms | — |
| REFUND | Treasurer initiates | Chairman/Secretary approves | — | < ₹1,000 |
| NOC | Member applies | Committee reviews | Chairman approves | — |

**Backend:** 4 new entities + `ApprovalService` (complex state machine) + `ApprovalController` (7 endpoints).

**Frontend:** `admin-web/src/pages/finance/Approvals.jsx` — tabbed view (Pending / My Submissions / All), timeline visualization per request.

---

### F19 · Expense Approval Chain

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 3 days |
| **Complexity** | Medium (builds on F18) |
| **Scalability Impact** | High |

**Description:**
Integrate expense transactions with the approval engine. EXPENSE transactions start as DRAFT → pending verification → pending approval → approved.

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `Transaction.java` | **MODIFY** | Add `approval_status` (DRAFT/PENDING_VERIFICATION/PENDING_APPROVAL/APPROVED/REJECTED) |
| `TransactionServiceImpl.java` | **MODIFY** | On create EXPENSE → auto-submit to approval workflow. On final approval → mark APPROVED |

---

### F20 · Rate Change Proposals

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Medium |

**Description:**
When rates change (e.g., "interest changed from 21% to 25%"), it goes through an approval chain with full audit trail.

**Database:**

| Table | Key Columns |
|-------|-------------|
| `rate_change_proposals` | id, society_id, proposed_by, setting_field, old_value, new_value, reason, effective_from, approval_request_id (FK), status, applied_at, created_at |

On approval → auto-updates `society_settings` with new value.

---

### F21 · Polls & Voting

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Description:**
Digital polls for AGM resolutions, budget approvals, rule changes. Single or multi-choice with optional anonymity.

**Database (3 tables):**

| Table | Key Columns |
|-------|-------------|
| `polls` | id, society_id, created_by, question, description, poll_type (SINGLE/MULTI), is_anonymous, deadline, status (DRAFT/ACTIVE/CLOSED), min_quorum_pct, created_at |
| `poll_options` | id, poll_id, option_text, display_order |
| `poll_votes` | id, poll_id, option_id, user_id, voted_at (unique: poll_id + user_id) |

---

### F22 · AGM / Meeting Management

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Description:**
AGMs are legally mandatory for Indian registered societies. Track meetings, agenda, attendance, minutes, and resolutions.

**Database (4 tables):**

| Table | Key Columns |
|-------|-------------|
| `meetings` | id, society_id, title, meeting_type (AGM/SGM/COMMITTEE/EMERGENCY), date, start_time, end_time, venue, agenda (TEXT), quorum_required, status (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED), created_by |
| `meeting_attendance` | meeting_id, user_id, attended (BOOLEAN), proxy_for_user_id |
| `meeting_minutes` | meeting_id, content (TEXT), recorded_by, approved_by, approved_at |
| `meeting_resolutions` | id, meeting_id, resolution_text, proposed_by, seconded_by, votes_for, votes_against, votes_abstained, status (PASSED/REJECTED/DEFERRED), linked_poll_id |

**PDF:** Auto-generate formatted minutes document with attendance list and resolution outcomes.

---

### F23 · Committee Elections

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 4 days |
| **Complexity** | High |
| **Scalability Impact** | Low |

**Description:**
Digital elections for committee positions with nomination, campaigning, and secret ballot.

**Database (3 tables):**

| Table | Key Columns |
|-------|-------------|
| `elections` | id, society_id, position, nomination_start, nomination_end, voting_start, voting_end, status (UPCOMING/NOMINATIONS_OPEN/VOTING_OPEN/COMPLETED/CANCELLED), created_by |
| `nominations` | id, election_id, candidate_user_id, proposer_id, seconder_id, manifesto (TEXT), status (SUBMITTED/APPROVED/REJECTED/WITHDRAWN) |
| `election_votes` | id, election_id, voter_id, candidate_id, voted_at (unique: election_id + voter_id) |

---

## 🟡 Phase 4 — Communication & Tickets (Week 12–14)

---

### F24 · Unified Ticket System

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | High |

**Description:**
Merge tickets and complaints into one system with human-readable token numbers (`TKT-2026-00001`).

**Backend Changes:**

| File | Action | Details |
|------|--------|---------|
| `Ticket.java` | **MODIFY** | Add `ticketNumber` (unique), `category`, expand type to include MAINTENANCE/GENERAL/VENDOR_DISPUTE |
| `Complaint.java` | **DEPRECATE** | Mark `@Deprecated`, migrate data |
| `TicketController.java` | **MODIFY** | Add `/by-number/{ticketNumber}`, `/my-tickets` |

**Migration:** `INSERT INTO tickets (...) SELECT ... FROM complaints` with generated ticket numbers.

---

### F25 · Configurable Deadline Reminders

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | High |

**Database (2 tables):**

| Table | Key Columns |
|-------|-------------|
| `reminder_configs` | id, society_id, reminder_type, days_before (int[]), email_enabled, push_enabled, target_roles |
| `reminder_logs` | id, reminder_type, entity_id, entity_type, days_before_sent, sent_at, recipient_email (unique: type+entity+days_before) |

**Refactor:** `ReminderScheduler.java` — replace hard-coded 30d/7d with per-society config.

---

### F26 · Internal Messaging / Helpdesk

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | Medium (message volume can grow) |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `messages` | id, sender_id, recipient_id (nullable for broadcast), society_id, wing_id (nullable), content, message_type (DIRECT/BROADCAST/WING), read_at, created_at |

---

### F27 · Notice Read Receipts

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 2 days |
| **Complexity** | Low |
| **Scalability Impact** | Low |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `notice_acknowledgments` | notice_id (FK), user_id (FK), acknowledged_at (unique: notice+user) |

---

### F28 · Event Management

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Database (2 tables):**

| Table | Key Columns |
|-------|-------------|
| `society_events` | id, society_id, title, description, event_type (FESTIVAL/SPORTS/CULTURAL/MEETING/WORKSHOP), date, start_time, end_time, venue, budget_allocated, budget_spent, max_attendees, organizer_id, status |
| `event_rsvps` | event_id, user_id, rsvp_status (YES/NO/MAYBE), guests_count |

---

### F29 · Demand Notice & Legal Recovery

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |
| **Complexity** | Medium |
| **Scalability Impact** | Low |

**Description:**
Formal demand notices for chronic defaulters with escalation tracking. Auto-generates legal-format PDF notices per the Co-operative Societies Act.

**Database:**

| Table | Key Columns |
|-------|-------------|
| `demand_notices` | id, society_id, member_id, flat_id, outstanding_amount, notice_type (FIRST_REMINDER/SECOND_REMINDER/LEGAL_NOTICE/DISCONNECTION_WARNING), notice_number, generated_at, sent_via (EMAIL/POST/HAND), acknowledged_at, response, escalated_from_id (self-FK) |

**Escalation Rules:**

```
30 days overdue  → FIRST_REMINDER (email)
60 days overdue  → SECOND_REMINDER (email + letter)
90 days overdue  → LEGAL_NOTICE (registered post format)
120 days overdue → DISCONNECTION_WARNING (water/amenity)
```

---

## 🟡 Phase 5 — Security & Visitor Management (Week 15–16)

---

### F30 · Visitor Management Enhancement

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 2 days |

Already partially implemented. Enhance `Visitor.java` with OTP and host tracking.

**Database:** ALTER `visitors` — add `otp_code`, `otp_verified_at`, `host_member_id`

---

### F31 · Delivery & Cab OTP

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

Auto-generate 6-digit OTP for DELIVERY/CAB visitors. Push to host member for verification.

**Backend:** Update `VisitorService` + push notification trigger.

---

### F32 · SOS / Emergency Alert

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

Frontend already exists (`Safety.jsx`). Create backend entity + push broadcast.

**Database:** `emergency_alerts` table (12 columns)

---

### F33 · Guard Patrol & Duty Roster

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 4 days |

**Database (3 tables):**

| Table | Key Columns |
|-------|-------------|
| `patrol_checkpoints` | id, society_id, name, location, qr_code (unique) |
| `patrol_logs` | id, checkpoint_id, guard_user_id, scanned_at |
| `duty_roster` | id, society_id, employee_id, shift_id, date, status (SCHEDULED/PRESENT/ABSENT/LEAVE) |

---

### F34 · Gate Log Enhancement

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 2 days |

Gate logs exist in `safety_api`. Add vehicle number tracking and photo capture.

---

## 🟡 Phase 6 — Operations & Maintenance (Week 17–19)

---

### F35 · Work Order System

| Property | Detail |
|----------|--------|
| **Priority** | 🔴 Critical |
| **Estimated Time** | 5 days |
| **Complexity** | High |
| **Scalability Impact** | High — links tickets → vendors → expenses |

**Description:**
The missing link between "something is broken" (ticket) and "someone fixed it" (vendor payment). Work orders track vendor assignment, scheduling, cost estimates, completion verification, and auto-create expense transactions.

**Database:**

| Table | Key Columns |
|-------|-------------|
| `work_orders` | id, ticket_id (FK), society_id, vendor_id (FK), assigned_employee_id (FK), description, scheduled_date, completion_date, cost_estimate, actual_cost, materials_used (TEXT), before_photo_url, after_photo_url, warranty_until, status (CREATED/ASSIGNED/SCHEDULED/IN_PROGRESS/COMPLETED/VERIFIED/CANCELLED), verified_by, created_by, created_at |

**Flow:**

```
Ticket raised → Committee creates Work Order → Assigns to Vendor
→ Vendor updates status (IN_PROGRESS) → Vendor marks COMPLETED
→ Committee/Head verifies (VERIFIED) → Auto-creates EXPENSE transaction
→ Links to vendor bill for payment
```

---

### F36 · Asset / Inventory Management

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `society_assets` | id, society_id, name, category (GENERATOR/PUMP/FIRE_EXTINGUISHER/CCTV/LIFT/FURNITURE/OTHER), location, purchase_date, purchase_cost, warranty_expiry, condition (GOOD/FAIR/NEEDS_REPAIR/OUT_OF_SERVICE), contract_id (FK), serial_number, notes, is_active |

---

### F37 · Common Area Maintenance Schedule

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `maintenance_schedules` | id, society_id, task_name, area, frequency (DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY), assigned_to_role, assigned_to_user_id, vendor_id, next_due_date, last_completed |
| `maintenance_logs` | id, schedule_id, completed_by, completed_at, notes, photo_url |

---

### F38 · Staff Attendance & Shifts

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 3 days |

**Database:** `employee_attendance` + `shifts` tables

---

### F39 · Facility / Amenity Booking

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 4 days |

**Database:** `amenities` + `bookings` tables

---

### F40 · Renovation NOC

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 3 days |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `noc_requests` | id, flat_id, member_id, work_type (INTERIOR/PLUMBING/ELECTRICAL/STRUCTURAL/FLOORING/PAINTING), description, contractor_name, contractor_phone, estimated_duration_days, start_date, end_date, deposit_amount, deposit_refunded, status, approved_by, conditions (TEXT), approval_request_id (FK), created_at |

---

## 🟢 Phase 7 — Resident Services (Week 20–21)

---

### F41 · Move-In / Move-Out Tracking

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Table:** `move_records` (flat_id, user_id, move_type, noc_status, dues_cleared, etc.)

---

### F42 · Penalty & Fine System

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Table:** `penalties` (member_id, flat_id, reason, amount, rule_reference, linked_bill_id, status)

---

### F43 · Pet Registration

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 2 days |

**Table:** `pet_registrations` (flat_id, pet_type, breed, name, vaccination_status, vaccination_due_date, photo_url)

---

### F44 · Classified / Internal Marketplace

| Property | Detail |
|----------|--------|
| **Priority** | 🔵 Low |
| **Estimated Time** | 3 days |

**Table:** `classifieds` (posted_by, category, title, description, price, photos, status, expires_at)

---

### F45 · Society Rules / Bylaws Repository

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 3 days |

**Tables:** `society_rules` + `rule_acknowledgments` (versioned rules with member acknowledgment)

---

## 🟢 Phase 8 — Vendor Ecosystem (Week 22–23)

---

### F46 · Vendor Login & Portal

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |
| **Complexity** | Medium |
| **Scalability Impact** | Medium |

**Description:**
Give vendors a User account linked to their Vendor profile. They can log in to view bills, submit invoices, and update work status.

**Database Changes:**

| Table | Action | Details |
|-------|--------|---------|
| `users` | **ALTER** | Add `vendor_id INT REFERENCES vendors(id)` |
| `vendors` | **ALTER** | Add `user_id INT REFERENCES users(id)` |

**Backend:** New `VendorPortalController` with 5 endpoints scoped to own vendor profile. Auth portal type: `vendor`.

**Frontend:** Vendor-specific nav and pages (bills, contracts, invoices, work orders).

---

### F47 · Vendor Rating & Review

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 2 days |

**Table:** `vendor_reviews` (vendor_id, work_order_id, rating 1-5, timeliness/quality/value sub-ratings, review_text)

---

### F48 · Vendor Invoice Submission

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Modify:** Add `work_status`, `invoice_url`, `invoice_notes` to `VendorBill.java`

---

### F49 · Vendor Work Status Tracking

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 2 days |

Links to Work Order system (F35).

---

### F50 · Vendor Bill TDS Compliance

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 3 days |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `tds_records` | id, vendor_bill_id, tds_section (194C/194J/194H), tds_rate, tds_amount, deposited, challan_number, quarter, created_at |

Auto-flag vendor payments > ₹30,000. Generate Form 26Q data.

---

## 🟢 Phase 9 — Advanced Finance & Compliance (Week 24–26)

---

### F51 · Bank Reconciliation

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 5 days |
| **Complexity** | Very High |
| **Scalability Impact** | Medium |

**Description:**
Upload bank statement CSV/Excel → auto-match with system transactions → highlight discrepancies.

**Database (2 tables):**

| Table | Key Columns |
|-------|-------------|
| `bank_statements` | id, society_id, bank_account_id, upload_date, period_start, period_end, file_url |
| `bank_statement_entries` | id, statement_id, date, description, debit, credit, balance, matched_transaction_id (FK nullable), match_status (UNMATCHED/AUTO_MATCHED/MANUALLY_MATCHED/DISPUTED), match_confidence |

**Matching Algorithm:**

```
For each bank entry:
  1. Exact match: referenceNumber matches transaction.referenceNumber
  2. Amount + date match: same amount ± same day
  3. Fuzzy match: same amount ± 3 days + description contains keywords
  4. Unmatched: flag for manual review
```

---

### F52 · Accounting Statements

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |

Generate: Balance Sheet, P&L (Income & Expenditure), Trial Balance, Cash Flow. PDF + Excel. Per Indian Co-op Society standards.

---

### F53 · Annual Budget Planning

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |

**Tables:** `budgets` + `budget_line_items`. Budget vs actual variance reports.

---

### F54 · Treasurer Dashboard & Ledger

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |

New `Ledger.jsx` page: double-entry view (Date/Particulars/Debit/Credit/Balance). Treasurer-specific dashboard widgets.

---

### F55 · Receipt Book

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 2 days |

New `ReceiptBook.jsx` page: sequential receipt listing, individual/bulk PDF print.

---

### F56 · Collection Report & Defaulters

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

New `CollectionReport.jsx`: flat-wise paid/pending/overdue table with defaulter highlighting.

---

## 🟢 Phase 10 — Documents & Reports (Week 27–28)

---

### F57 · Society Document Repository

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Database:**

| Table | Key Columns |
|-------|-------------|
| `society_documents` | id, society_id, title, document_type (REGISTRATION_CERT/BYLAWS/INSURANCE_POLICY/NOC/TAX_RECEIPT/AUDIT_REPORT/COMPLETION_CERT/7_12_EXTRACT/OTHER), file_url, file_size, uploaded_by, expiry_date, is_public, version, created_at |

---

### F58 · Meeting Minutes PDF

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 2 days |

Auto-generate from meeting data.

---

### F59–F61 · Dashboard, Report, Export Enhancements

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 11 days total |

New report endpoints: collection efficiency %, ticket SLA %, vendor aging, YoY comparison, budget variance. New dashboard widgets per role. CSV export option alongside existing Excel.

---

## 🟡 Phase 11 — Platform Infrastructure (Week 29–31)

---

### F62 · Two-Factor Authentication

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 3 days |

**Dependency:** `com.warrenstrange:googleauth`. Add `totp_secret`, `is_2fa_enabled`, `backup_codes` to `users`.

---

### F63 · Rate Limiting

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 2 days |

**Dependency:** `bucket4j-spring-boot-starter`. Login: 5/min/IP. Forgot-password: 3/hr/IP. Default: 100/min/user.

---

### F64 · Comprehensive Audit Trail

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |

AOP `@Aspect` intercepting `@Audited` service methods. Before/after JSON diff in `security_logs`.

---

### F65 · Firebase Push Notifications

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 4 days |

**Dependency:** `firebase-admin` SDK. Add `fcm_token` to `users`. Replace Expo Push in mobile app.

---

### F66 · Multi-language (i18n)

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 5 days |

**Backend:** `messages.properties` + `messages_hi.properties`. **Frontend:** `react-i18next`.

---

### F67 · Data Export & Right to Erasure

| Property | Detail |
|----------|--------|
| **Priority** | 🟢 Medium |
| **Estimated Time** | 3 days |

`GET /api/my-data/export` → ZIP. `DELETE /api/my-data/delete-account` → soft-delete with 30-day grace.

---

### F68 · Automated Backup

| Property | Detail |
|----------|--------|
| **Priority** | 🟡 High |
| **Estimated Time** | 2 days |

Scheduled `pg_dump` (daily). Offsite upload (S3/GCS). Retention policy. Status on admin dashboard.

---

## 🔵 Phase 12 — Modern Enhancements (Week 32–35)

| Feature | Est. Time | Description |
|---------|-----------|-------------|
| **F69** WhatsApp/SMS Integration | 4 days | MSG91/Twilio. Critical: bill reminders, SOS, OTP |
| **F70** OAuth / Social Login | 2 days | Google Sign-In alongside email+password |
| **F71** EV Charging Management | 3 days | `ev_chargers` + `charging_sessions`. Per-unit billing |
| **F72** Township / Federation Mode | 5 days | `federations` linking multiple societies. Shared amenities |
| **F73** AI-powered Insights | 5 days | Pattern detection, cash flow prediction, auto-categorization |
| **F74** Offline Mode (Mobile) | 4 days | Cache bills, notices, emergency contacts. Sync queue |
| **F75** SaaS / Subscription Billing | 4 days | `subscription_plans` + `society_subscriptions`. Razorpay recurring |
| **F76** Deep Linking (Mobile) | 2 days | `society-app://tickets/TKT-2026-00001` |
| **F77** Mobile Vendor Portal | 3 days | Vendor tab navigator in mobile app |

---

## 🗄 Database Schema Overview

### New Tables by Phase

| Phase | Tables Created | Total New Tables |
|-------|---------------|-----------------|
| Phase 1 | (migration only) | 0 |
| Phase 2 | society_settings, flat_rate_overrides, bill_line_items, parking_slots, number_sequences, bank_accounts | 6 |
| Phase 3 | approval_workflows, approval_steps, approval_requests, approval_actions, rate_change_proposals, polls, poll_options, poll_votes, meetings, meeting_attendance, meeting_minutes, meeting_resolutions, elections, nominations, election_votes | 15 |
| Phase 4 | reminder_configs, reminder_logs, messages, notice_acknowledgments, society_events, event_rsvps, demand_notices | 7 |
| Phase 5 | emergency_alerts, patrol_checkpoints, patrol_logs, duty_roster | 4 |
| Phase 6 | work_orders, society_assets, maintenance_schedules, maintenance_logs, employee_attendance, shifts, amenities, bookings, noc_requests | 9 |
| Phase 7 | move_records, penalties, pet_registrations, classifieds, society_rules, rule_acknowledgments | 6 |
| Phase 8 | vendor_reviews, tds_records | 2 |
| Phase 9 | bank_statements, bank_statement_entries, budgets, budget_line_items | 4 |
| Phase 10 | society_documents | 1 |
| Phase 11 | (alterations only: users table) | 0 |
| Phase 12 | ev_chargers, charging_sessions, federations, subscription_plans, society_subscriptions | 5 |
| **TOTAL** | | **59 new tables** |

### Existing Tables (Modified)

| Table | Modifications |
|-------|--------------|
| `users` | New: vendor_id, totp_secret, is_2fa_enabled, backup_codes, fcm_token. Role CHECK updated. |
| `vendors` | New: user_id |
| `maintenance_bills` | New: bill_number, subtotal, tax_amount, interest_amount, penalty_amount, total_amount, previous_balance, advance_balance |
| `tickets` | New: ticket_number, category. Expanded type enum |
| `transactions` | New: approval_status, bank_account_id |
| `vendor_bills` | New: work_status, invoice_url, invoice_notes |
| `visitors` | New: otp_code, otp_verified_at, host_member_id |
| `contracts` | New: contract_amount, auto_renewal |
| `security_logs` | New: entity_type, entity_id, action, old_value, new_value, user_id, ip_address |

---

## 🔌 API Endpoint Summary

### Total New Endpoints by Phase

| Phase | New Endpoints | Key Controllers |
|-------|--------------|----------------|
| 1 | ~0 (modifications) | All existing controllers |
| 2 | ~25 | SocietySettingController, PdfExportController, ParkingSlotController |
| 3 | ~30 | ApprovalController, PollController, MeetingController, ElectionController, RateChangeController |
| 4 | ~20 | MessageController, EventController, DemandNoticeController |
| 5 | ~15 | EmergencyAlertController, PatrolController, DutyRosterController |
| 6 | ~25 | WorkOrderController, AssetController, ScheduleController, AmenityController, BookingController, NocController |
| 7 | ~15 | MoveRecordController, PenaltyController, PetController, ClassifiedController, RuleController |
| 8 | ~15 | VendorPortalController, ReviewController, TdsController |
| 9 | ~20 | ReconciliationController, BudgetController, LedgerController |
| 10 | ~10 | DocumentController extensions, ReportController extensions |
| 11 | ~10 | TwoFactorController, DataExportController |
| 12 | ~15 | EvChargingController, FederationController |
| **TOTAL** | **~200 new endpoints** | |

---

## 📈 Scalability Notes

### Database Scalability

| Concern | Solution |
|---------|---------|
| `bill_line_items` grows fast (500 units × 20 items × 12 months = 120K/year) | Index on `maintenance_bill_id`. Partition by year if > 1M rows |
| `messages` can explode with broadcasts | Pagination. Archive messages > 6 months. Index on `recipient_id` + `read_at` |
| `patrol_logs` high-frequency inserts | Index on `guard_user_id` + `scanned_at`. Archive quarterly |
| `security_logs` with audit JSON | Store old/new value as JSONB. Partition by month. Consider Elasticsearch for search |
| `bank_statement_entries` matching queries | Index on `statement_id`, `matched_transaction_id`, `match_status` |
| `approval_requests` across many workflows | Composite index on (`workflow_id`, `status`, `current_step`) |

### Application Scalability

| Concern | Solution |
|---------|---------|
| Bill generation for 500+ units | Batch processing with `@Async`. Progress tracking via SSE or polling |
| PDF generation under load | Queue PDFs via Spring `@Async`. Cache generated PDFs for 1 hour |
| Reminder scheduler across 100+ societies | Chunk processing: 10 societies per scheduler run. Stagger cron |
| Excel exports for large datasets | Stream using `SXSSFWorkbook` (Apache POI streaming) for > 10K rows |
| Real-time messaging | Start with polling (5s). Upgrade to WebSocket if scale demands |
| Firebase push to 1000+ users | Use FCM topic messaging for broadcast. Individual for direct |

### Infrastructure Scalability

| Scale | Recommendation |
|-------|---------------|
| Single society (< 500 units) | Single server, PostgreSQL on same host |
| 10 societies (< 5000 units) | Separate DB server, Spring Boot with connection pooling (HikariCP) |
| 50+ societies | Read replicas, Redis caching for settings/roles, CDN for PDFs |
| 100+ societies (SaaS) | Multi-tenant schema (schema-per-society or discriminator column), Kubernetes, S3 for files |

---

## 🔑 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PDF library | OpenPDF | LGPL license (free for commercial). iText 7+ is AGPL |
| Approval engine | Generic workflow | One system for expenses, vendors, rate changes, NOCs, refunds |
| Bill structure | Line items table (not columns) | Flexible, extensible, clean. Adding a new charge = new row, not schema change |
| Receipt numbers | Sequential per FY | Professional, auditable, legally compliant |
| Push notifications | Firebase (not Expo) | Production-grade, works outside Expo ecosystem |
| Rate limiting | Bucket4j | Spring Boot native, in-memory (no Redis needed initially) |
| i18n | Backend: MessageSource. Frontend: react-i18next | Industry standard, well-supported |
| Bank reconciliation | Auto-match + manual review | Fully automated matching is error-prone. Human verification for unmatched |
| VENDOR role | User + Vendor profile (two tables) | Keeps User table clean. Vendor-specific data (GST, bank) in vendor table |
| Role count | 12 (down from 13) | Removed 2 legacy, added 1 new. Clean hierarchy |

---

<div align="center">

**Total: 77 Features · 59 New Tables · ~200 New API Endpoints · ~35 Weeks**

*Built for Indian Housing Societies — RERA compliant, GST-ready, Co-operative Society Act aligned*

</div>
