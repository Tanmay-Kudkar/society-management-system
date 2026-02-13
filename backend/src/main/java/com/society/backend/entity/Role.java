package com.society.backend.entity;

/**
 * Role Hierarchy for Multi-Society SaaS Platform:
 * 
 * PERMISSION MATRIX (User Management):
 * ─────────────────────────────────────
 * 
 * | Role | Can CREATE | Can UPDATE/DELETE | Can READ |
 * |--------------------|---------------------------|---------------------------|---------------------|
 * | PLATFORM_OWNER | ORG_OWNER, SOCIETY_ADMIN | ORG_OWNER, SOCIETY_ADMIN | ALL
 * roles |
 * | ORGANIZATION_OWNER | SOCIETY_ADMIN (own org) | SOCIETY_ADMIN (own org) |
 * Own org roles |
 * | SOCIETY_ADMIN | ALL below (full access) | ALL below (full access) | ALL in
 * society |
 * | CHAIRMAN | SECRETARY, TREASURER | SECRETARY, TREASURER | All below |
 * | SECRETARY | COMMITTEE only | COMMITTEE only | COMMITTEE and below |
 * | TREASURER | COMMITTEE only | COMMITTEE only | COMMITTEE and below |
 * | COMMITTEE | EMPLOYEE, MEMBER | EMPLOYEE, MEMBER | EMPLOYEE, MEMBER + |
 * | EMPLOYEE | VISITOR only | VISITOR only | VISITOR |
 * | MEMBER | TENANT only | TENANT only | TENANT |
 * | TENANT | None | None | Own profile only |
 * | VISITOR | None | None | Own profile only |
 * 
 * ROLE RESPONSIBILITIES:
 * ──────────────────────
 * PLATFORM_OWNER - Platform Owner: Manages all societies and organizations
 * ORGANIZATION_OWNER - Organization Owner: Manages multiple societies under an
 * organization
 * SOCIETY_ADMIN - Society Super Admin: Full control over society, all CRUD
 * operations
 * CHAIRMAN - Highest Committee Authority: Presides meetings, final approval,
 * bank signatory
 * SECRETARY - Administrative Head: Documentation, records, day-to-day
 * operations
 * TREASURER - Financial Head: Finances, billing, payments, accounts
 * COMMITTEE - Committee Member: Intermediate management, assigns tasks
 * MANAGER - Operational Manager: Handles day-to-day management tasks (no user
 * CRUD)
 * EMPLOYEE - Staff/Security: Handles visitors, basic operations
 * MEMBER - Flat Owner: Views own data, raises tickets/complaints
 * TENANT - Renter: Limited access to own profile & bills
 * VISITOR - Guest: Minimal access, read-only
 * 
 * SOCIETY-LEVEL HIERARCHY:
 * ────────────────────────
 * SocietyAdmin (Full CRUD on ALL below)
 * └── Chairman (Elected governing body head)
 * ├── Secretary (Administrative head)
 * │ └── Committee (Intermediate management)
 * │ ├── Employee (Staff) → Visitor
 * │ └── Member (Flat owner) → Tenant
 * └── Treasurer (Financial head)
 * └── Committee (Intermediate management)
 * 
 * Note: Manager is created ONLY by Society Admin.
 * Manager has NO user creation/update/delete rights.
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (per permission matrix)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access LIMITED to direct children only
 * 4. EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 5. MANAGER has NO user CRUD rights (only operational management)
 * 6. One organization CANNOT see another
 * 7. Society data is strictly isolated
 * 8. Least-privilege access enforced
 * 
 * ROLE LEVELS:
 * ────────────
 * Level 0: PLATFORM_OWNER - Platform Owner (invisible to clients)
 * Level 1: ORGANIZATION_OWNER - Multi-society manager (subscription)
 * Level 2: SOCIETY_ADMIN - Single society manager (full CRUD)
 * Level 3: CHAIRMAN - Elected governing body head
 * Level 4: SECRETARY - Administrative head | TREASURER - Financial head
 * Level 5: COMMITTEE - Committee members | MANAGER - Operations (no user CRUD)
 * Level 6: EMPLOYEE - Staff / security | MEMBER - Flat owner
 * Level 7: TENANT - Renter without ownership rights
 * Level 8: VISITOR - Temporary access only
 */

public enum Role {
    PLATFORM_OWNER, // Level 0: Platform Owner - manages all societies and organizations
    ORGANIZATION_OWNER, // Level 1: Organization Owner - manages multiple societies
    SOCIETY_ADMIN, // Level 2: Society Super Admin - full control, all CRUD operations
    CHAIRMAN, // Level 3: Highest Committee Authority - final approval, bank signatory
    SECRETARY, // Level 4: Administrative Head - documentation, records, operations
    TREASURER, // Level 4: Financial Head - finances, billing, payments, accounts
    COMMITTEE, // Level 5: Committee Member - intermediate management, assigns tasks
    MANAGER, // Level 5: Operational Manager - day-to-day tasks (NO user CRUD)
    EMPLOYEE, // Level 6: Staff/Security - handles visitors, basic operations
    MEMBER, // Level 6: Flat Owner - views own data, raises tickets/complaints
    TENANT, // Level 7: Renter - limited access to own profile & bills
    VISITOR, // Level 8: Guest - minimal access, read-only
    MASTER_ADMIN // Legacy role - mapped to PLATFORM_OWNER (for backward compatibility)
}
