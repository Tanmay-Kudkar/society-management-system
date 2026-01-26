package com.society.backend.entity;

/**
 * Role Hierarchy (highest to lowest):
 * 
 * 1. MASTER_ADMIN - Platform owner (you), manages all societies
 * - Only receives escalated issues from SOCIETY_ADMIN
 * - Can enable/disable societies
 * - Has access to all societies
 * 
 * 2. SOCIETY_ADMIN - Society-level admin
 * - Manages one specific society
 * - Receives all society notifications
 * - Can escalate issues to MASTER_ADMIN
 * - More rights than COMMITTEE
 * 
 * 3. CHAIRMAN - Head of committee
 * 4. SECRETARY - Society secretary
 * 5. TREASURER - Handles finances
 * 6. COMMITTEE - General committee member
 * 
 * 7. EMPLOYEE - Society staff (security, housekeeping, etc.)
 * 
 * 8. MEMBER - Flat owner/resident
 * 
 * 9. TENANT - Renter (limited access)
 * 
 * 10. VISITOR - Temporary access
 */

public enum Role {
    MASTER_ADMIN, // Platform Owner
    SOCIETY_ADMIN, // Society-level admin
    CHAIRMAN, // Committee head
    SECRETARY, // Society secretary
    TREASURER, // Finance handler
    COMMITTEE, // General committee member
    EMPLOYEE, // Society staff
    MEMBER, // Flat owner
    TENANT, // Renter
    VISITOR // Temporary access
}
