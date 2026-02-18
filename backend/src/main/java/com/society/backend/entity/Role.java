package com.society.backend.entity;

/**
 * Role Hierarchy (12 roles):
 *
 * Level 0 ─── MASTER_ADMIN          (Platform-wide full access)
 * Level 1 ─── SOCIETY_ADMIN         (Full access within own society)
 * Level 2 ─┬─ CHAIRMAN  ──┬─        Same level, shared CRUD
 *           ├─ SECRETARY ──┤         on all society modules
 *           └─ TREASURER ──┘         (cannot manage each other)
 * Level 3 ─┬─ COMMITTEE             View all + limited write
 *           └─ MANAGER               Operational management
 * Level 4 ─┬─ EMPLOYEE              Staff/Security (visitors, gate logs)
 *           └─ MEMBER                Flat owner (own bills, tickets, profile)
 * Level 5 ─┬─ TENANT                Renter (own profile, raise tickets)
 *           └─ VENDOR                External vendor (own bills, invoices)
 * Level 6 ─── VISITOR                Minimal access (own profile only)
 *
 * PERMISSION MATRIX (User Management):
 * ─────────────────────────────────────
 * MASTER_ADMIN    → Create/Update/Delete: ALL roles
 * SOCIETY_ADMIN   → Create/Update/Delete: CHAIRMAN → VISITOR + VENDOR
 * CHAIRMAN        → Create/Update/Delete: COMMITTEE, MANAGER, EMPLOYEE, MEMBER, TENANT, VISITOR
 * SECRETARY       → Same as CHAIRMAN
 * TREASURER       → Same as CHAIRMAN
 * COMMITTEE       → Create/Update/Delete: EMPLOYEE, MEMBER
 * EMPLOYEE        → Create/Update/Delete: VISITOR
 * MEMBER          → Create/Update/Delete: TENANT
 * VENDOR          → None
 * MANAGER         → None
 * TENANT          → None
 * VISITOR         → None
 *
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (per matrix above)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 4. CHAIRMAN/SECRETARY/TREASURER share the same write access scope
 * 5. MANAGER has NO user CRUD rights (only SOCIETY_ADMIN can create MANAGER)
 * 6. VENDOR is a login-capable role linked to a vendor profile
 * 7. Society data is strictly isolated
 * 8. Least-privilege access enforced
 */

public enum Role {
    MASTER_ADMIN,  // Level 0: Platform-wide full access
    SOCIETY_ADMIN, // Level 1: Full control within own society
    CHAIRMAN,      // Level 2: Highest Committee Authority - final approval, bank signatory
    SECRETARY,     // Level 2: Administrative Head - documentation, records, operations
    TREASURER,     // Level 2: Financial Head - finances, billing, payments, accounts
    COMMITTEE,     // Level 3: Committee Member - intermediate management, assigns tasks
    MANAGER,       // Level 3: Operational Manager - day-to-day tasks (NO user CRUD)
    EMPLOYEE,      // Level 4: Staff/Security - handles visitors, basic operations
    MEMBER,        // Level 4: Flat Owner - views own data, raises tickets/complaints
    TENANT,        // Level 5: Renter - limited access to own profile & bills
    VENDOR,        // Level 5: External vendor - own bills, invoices, work status
    VISITOR        // Level 6: Guest - minimal access, read-only
}
