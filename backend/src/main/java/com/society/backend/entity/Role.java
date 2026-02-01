package com.society.backend.entity;

/**
 * Role Hierarchy based on Real Housing Society Structure:
 * 
 * HOUSING SOCIETY HIERARCHY:
 * ──────────────────────────
 * 
 * CHAIRMAN (Head/Superintendent):
 * - Holds overall control and guidance
 * - Presides over ALL meetings
 * - Possesses final VETO/CONSENT power on committee decisions
 * - Primary signatory for bank accounts
 * - HIGHEST authority in the committee
 * 
 * SECRETARY (Administrative Head):
 * - Manages documentation, records, member details
 * - Handles day-to-day operations and correspondence
 * - Acts on decisions authorized by committee/chairman
 * - Operational executive (not ultimate decision-maker)
 * 
 * TREASURER (Financial Head):
 * - Handles all finances, billing, payments
 * - Manages society accounts and financial records
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (no skip-level creation)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access LIMITED to direct children only
 * 4. EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 
 * ROLE LEVELS:
 * ────────────
 * Level 1: MASTER_ADMIN - Platform owner, manages ALL societies
 * Level 2: SOCIETY_ADMIN - Society manager (EXCEPTION: full CRUD below)
 * Level 3: CHAIRMAN - Committee HEAD (highest committee authority)
 * Level 4: SECRETARY - Administrative head (reports to Chairman)
 * TREASURER - Financial head (reports to Chairman)
 * Level 5: COMMITTEE - General committee members
 * Level 6: EMPLOYEE, MEMBER - Staff & Residents
 * Level 7: TENANT, VISITOR - Renters & Temporary access
 */

public enum Role {
    MASTER_ADMIN, // Level 1: Platform Owner - creates SOCIETY_ADMIN only
    SOCIETY_ADMIN, // Level 2: Society Admin - FULL CRUD on all below (exception)
    CHAIRMAN, // Level 3: Committee HEAD - creates SECRETARY, TREASURER
    SECRETARY, // Level 4: Administrative head - creates COMMITTEE
    TREASURER, // Level 4: Financial head - creates COMMITTEE
    COMMITTEE, // Level 5: Committee member - creates EMPLOYEE, MEMBER
    EMPLOYEE, // Level 6: Society staff - creates VISITOR only
    MEMBER, // Level 6: Flat owner - creates TENANT only
    TENANT, // Level 7: Renter - cannot create anyone
    VISITOR // Level 7: Temporary access - cannot create anyone
}
