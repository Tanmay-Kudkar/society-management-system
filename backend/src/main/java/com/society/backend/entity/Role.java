package com.society.backend.entity;

/**
 * Role Hierarchy for Multi-Society SaaS Platform:
 * 
 * PLATFORM OWNERSHIP MODEL:
 * ─────────────────────────
 * 
 * PLATFORM_OWNER (Global Platform Creator):
 * - Owns source code, infrastructure, pricing & subscriptions
 * - Invisible to end clients
 * - No involvement in day-to-day society governance
 * 
 * CLIENT ACCESS TYPES (Signup Options):
 * ─────────────────────────────────────
 * 
 * ORGANIZATION_OWNER (Multi-Society Management):
 * - Builders, property managers, large housing groups
 * - Manages multiple societies via subscription
 * - Creates and controls SocietyAdmins
 * - Views organization-level reports
 * - One founding client may have free lifetime access
 * 
 * SOCIETY_ADMIN (Single Society Management):
 * - Individual societies, small/medium apartments
 * - Full control within one society
 * - Cannot create additional societies (upgrade to Org Owner)
 * 
 * SOCIETY-LEVEL HIERARCHY:
 * ────────────────────────
 * SocietyAdmin
 * └── Chairman (Elected governing body head)
 * ├── Secretary (Administrative head)
 * │ └── Manager (Operations)
 * │ └── Employee (Execution)
 * ├── Treasurer (Financial head)
 * └── Committee (General committee members)
 * └── Member (Flat owner with voting rights)
 * └── Tenant (Resident without ownership)
 * └── Visitor (Temporary access only)
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (no skip-level creation)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access LIMITED to direct children only
 * 4. EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 5. One organization CANNOT see another
 * 6. Society data is strictly isolated
 * 7. Least-privilege access enforced
 * 
 * ROLE LEVELS:
 * ────────────
 * Level 0: PLATFORM_OWNER - Invisible platform creator
 * Level 1: ORGANIZATION_OWNER - Multi-society manager (subscription)
 * Level 2: SOCIETY_ADMIN - Single society manager
 * Level 3: CHAIRMAN - Elected governing body head
 * Level 4: SECRETARY - Administrative head (reports to Chairman)
 * TREASURER - Financial head (reports to Chairman)
 * Level 5: COMMITTEE - General committee members
 * MANAGER - Operations management (reports to Secretary)
 * Level 6: EMPLOYEE - Staff / execution (reports to Manager)
 * MEMBER - Flat owner with voting rights
 * Level 7: TENANT - Renter without ownership rights
 * Level 8: VISITOR - Temporary access only
 */

public enum Role {
    PLATFORM_OWNER, // Level 0: Global platform creator - invisible to clients
    ORGANIZATION_OWNER, // Level 1: Multi-society manager - creates SOCIETY_ADMIN
    SOCIETY_ADMIN, // Level 2: Single society manager - FULL CRUD on all below
    CHAIRMAN, // Level 3: Governing body head - creates SECRETARY, TREASURER
    SECRETARY, // Level 4: Administrative head - creates COMMITTEE, MANAGER
    TREASURER, // Level 4: Financial head - peer to Secretary
    COMMITTEE, // Level 5: Committee member - creates MEMBER
    MANAGER, // Level 5: Operations management - creates EMPLOYEE
    EMPLOYEE, // Level 6: Society staff - creates VISITOR only
    MEMBER, // Level 6: Flat owner - creates TENANT only
    TENANT, // Level 7: Renter - cannot create anyone
    VISITOR // Level 8: Temporary access - cannot create anyone
}
