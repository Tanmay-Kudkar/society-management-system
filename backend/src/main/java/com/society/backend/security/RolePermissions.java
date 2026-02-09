package com.society.backend.security;

import com.society.backend.entity.Role;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Defines the strict role hierarchy for user CRUD permissions.
 * 
 * MULTI-SOCIETY SaaS PLATFORM HIERARCHY:
 * ──────────────────────────────────────
 * 
 * PLATFORM_OWNER (Global Platform Creator - Invisible):
 * - Owns source code, infrastructure, pricing
 * - Creates ORGANIZATION_OWNER and SOCIETY_ADMIN
 * - Invisible to end clients
 * 
 * ORGANIZATION_OWNER (Multi-Society Manager):
 * - Manages multiple societies via subscription
 * - Creates SOCIETY_ADMIN for each society
 * - Views organization-level reports
 * 
 * SOCIETY_ADMIN (Single Society Manager):
 * - Full control within one society
 * - Creates Chairman, Secretary, Treasurer
 * 
 * CHAIRMAN (Governing Body Head):
 * - Highest authority in committee
 * - Creates Secretary, Treasurer
 * 
 * SECRETARY (Administrative Head):
 * - Creates Committee, Manager
 * 
 * TREASURER (Financial Head):
 * - Peer to Secretary, financial oversight
 * 
 * COMMITTEE → MEMBER
 * MANAGER → EMPLOYEE
 * MEMBER → TENANT
 * EMPLOYEE → VISITOR
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (no skip-level creation)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access is LIMITED to direct children only
 * 4. EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 5. Organization data is strictly isolated
 * 
 * ROLE LEVELS:
 * ────────────
 * Level 0: PLATFORM_OWNER (Invisible Platform Creator)
 * Level 1: ORGANIZATION_OWNER (Multi-Society Manager)
 * Level 2: SOCIETY_ADMIN (Single Society Manager)
 * Level 3: CHAIRMAN (Governing Body Head)
 * Level 4: SECRETARY, TREASURER (Administrative & Financial Heads)
 * Level 5: COMMITTEE, MANAGER (Committee Members & Operations)
 * Level 6: EMPLOYEE, MEMBER (Staff & Residents)
 * Level 7: TENANT (Renters)
 * Level 8: VISITOR (Temporary Access)
 */
public final class RolePermissions {

        private static final Map<Role, Set<Role>> ALLOWED_CREATIONS = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_UPDATES = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_READS = new EnumMap<>(Role.class);

        static {
                // ═══════════════════════════════════════════════════════════════
                // CREATE PERMISSIONS - Direct children only
                // ═══════════════════════════════════════════════════════════════

                // PLATFORM_OWNER - Creates ORG_OWNER and SOCIETY_ADMIN (both signup paths)
                ALLOWED_CREATIONS.put(Role.PLATFORM_OWNER, EnumSet.of(
                                Role.ORGANIZATION_OWNER,
                                Role.SOCIETY_ADMIN));

                // ORGANIZATION_OWNER - Creates SOCIETY_ADMIN for each of their societies
                ALLOWED_CREATIONS.put(Role.ORGANIZATION_OWNER, EnumSet.of(Role.SOCIETY_ADMIN));

                // SOCIETY_ADMIN - EXCEPTION: Full CRUD on all roles below (special privilege)
                ALLOWED_CREATIONS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER));

                // CHAIRMAN - Creates Secretary, Treasurer (governing body appointments)
                ALLOWED_CREATIONS.put(Role.CHAIRMAN, EnumSet.noneOf(Role.class));

                // SECRETARY - Administrative head, creates COMMITTEE and MANAGER
                ALLOWED_CREATIONS.put(Role.SECRETARY, EnumSet.of(
                                Role.COMMITTEE,
                                Role.MANAGER,
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // TREASURER - Financial head, cannot create
                ALLOWED_CREATIONS.put(Role.TREASURER, EnumSet.noneOf(Role.class));

                // COMMITTEE - Creates MEMBER (flat owners)
                ALLOWED_CREATIONS.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // MANAGER - Creates EMPLOYEE (operations staff)
                ALLOWED_CREATIONS.put(Role.MANAGER, EnumSet.of(Role.EMPLOYEE));

                // EMPLOYEE - Creates VISITOR only
                ALLOWED_CREATIONS.put(Role.EMPLOYEE, EnumSet.of(Role.VISITOR));

                // MEMBER - Creates TENANT only (for their flat)
                ALLOWED_CREATIONS.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT and VISITOR - Cannot create anyone
                ALLOWED_CREATIONS.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_CREATIONS.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // UPDATE/DELETE PERMISSIONS
                // ═══════════════════════════════════════════════════════════════

                // PLATFORM_OWNER - Can update/delete ORGANIZATION_OWNER and SOCIETY_ADMIN
                ALLOWED_UPDATES.put(Role.PLATFORM_OWNER, EnumSet.of(
                                Role.ORGANIZATION_OWNER,
                                Role.SOCIETY_ADMIN));

                // ORGANIZATION_OWNER - Can update/delete SOCIETY_ADMIN only
                ALLOWED_UPDATES.put(Role.ORGANIZATION_OWNER, EnumSet.of(Role.SOCIETY_ADMIN));

                // SOCIETY_ADMIN - Can update/delete governing body
                ALLOWED_UPDATES.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER));

                // CHAIRMAN - Can update/delete Secretary, Treasurer, Committee
                ALLOWED_UPDATES.put(Role.CHAIRMAN, EnumSet.of(
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE));

                // SECRETARY - Can update/delete Committee, Manager, Employee, Member
                ALLOWED_UPDATES.put(Role.SECRETARY, EnumSet.of(
                                Role.COMMITTEE,
                                Role.MANAGER,
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // TREASURER - Can approve/reject Committee only
                ALLOWED_UPDATES.put(Role.TREASURER, EnumSet.of(Role.COMMITTEE));

                // COMMITTEE - Can update/delete Employee and Member
                ALLOWED_UPDATES.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // MANAGER - Can update/delete Employee
                ALLOWED_UPDATES.put(Role.MANAGER, EnumSet.of(Role.EMPLOYEE));

                // EMPLOYEE - Can update/delete Visitor only
                ALLOWED_UPDATES.put(Role.EMPLOYEE, EnumSet.of(Role.VISITOR));

                // MEMBER - Can update/delete Tenant only
                ALLOWED_UPDATES.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT and VISITOR - Cannot update/delete anyone
                ALLOWED_UPDATES.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_UPDATES.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // READ PERMISSIONS - All descendants (downward flow)
                // ═══════════════════════════════════════════════════════════════

                // PLATFORM_OWNER - Can read ALL roles
                ALLOWED_READS.put(Role.PLATFORM_OWNER, EnumSet.allOf(Role.class));

                // ORGANIZATION_OWNER - Can read all below (within their org)
                ALLOWED_READS.put(Role.ORGANIZATION_OWNER, EnumSet.of(
                                Role.ORGANIZATION_OWNER,
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.MANAGER,
                                Role.EMPLOYEE,
                                Role.MEMBER,
                                Role.TENANT,
                                Role.VISITOR));

                // SOCIETY_ADMIN - Can read all below
                ALLOWED_READS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.MANAGER,
                                Role.EMPLOYEE,
                                Role.MEMBER,
                                Role.TENANT,
                                Role.VISITOR));

                // CHAIRMAN - Can read all committee and below
                ALLOWED_READS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // SECRETARY - Can read Committee, Manager and below
                ALLOWED_READS.put(Role.SECRETARY, EnumSet.of(
                                Role.SECRETARY, Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // TREASURER - Can read Committee and below
                ALLOWED_READS.put(Role.TREASURER, EnumSet.of(
                                Role.TREASURER, Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // COMMITTEE - Can read Employee, Member and below
                ALLOWED_READS.put(Role.COMMITTEE, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // MANAGER - Can read Employee and below
                ALLOWED_READS.put(Role.MANAGER, EnumSet.of(
                                Role.MANAGER, Role.EMPLOYEE, Role.VISITOR));

                // EMPLOYEE - Can read Visitor
                ALLOWED_READS.put(Role.EMPLOYEE, EnumSet.of(Role.EMPLOYEE, Role.VISITOR));

                // MEMBER - Can read Tenant
                ALLOWED_READS.put(Role.MEMBER, EnumSet.of(Role.MEMBER, Role.TENANT));

                // TENANT - Can only read themselves
                ALLOWED_READS.put(Role.TENANT, EnumSet.of(Role.TENANT));

                // VISITOR - Can only read themselves
                ALLOWED_READS.put(Role.VISITOR, EnumSet.of(Role.VISITOR));
        }

        private RolePermissions() {
                // Utility class, prevent instantiation
        }

        /**
         * Check if a user with the given role can CREATE a user with the target role.
         */
        public static boolean canCreate(Role creatorRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_CREATIONS.get(creatorRole);
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Check if a user with the given role can UPDATE a user with the target role.
         */
        public static boolean canUpdate(Role updaterRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_UPDATES.get(updaterRole);
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Check if a user with the given role can DELETE a user with the target role.
         */
        public static boolean canDelete(Role deleterRole, Role targetRole) {
                return canUpdate(deleterRole, targetRole);
        }

        /**
         * Check if a user with the given role can READ a user with the target role.
         */
        public static boolean canRead(Role readerRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_READS.get(readerRole);
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Get the set of roles that a user with the given role can CREATE.
         */
        public static Set<Role> getAllowedRolesToCreate(Role creatorRole) {
                return ALLOWED_CREATIONS.getOrDefault(creatorRole, EnumSet.noneOf(Role.class));
        }

        /**
         * Get the set of roles that a user with the given role can UPDATE/DELETE.
         */
        public static Set<Role> getAllowedRolesToUpdate(Role updaterRole) {
                return ALLOWED_UPDATES.getOrDefault(updaterRole, EnumSet.noneOf(Role.class));
        }

        /**
         * Get the set of roles that a user with the given role can READ.
         */
        public static Set<Role> getAllowedRolesToRead(Role readerRole) {
                return ALLOWED_READS.getOrDefault(readerRole, EnumSet.noneOf(Role.class));
        }

        /**
         * Check if self-registration is allowed for the given role.
         * Only MEMBER can self-register (residents joining a society).
         */
        public static boolean canSelfRegister(Role role) {
                return role == Role.MEMBER;
        }

        /**
         * Get a descriptive message for CREATE permission denied.
         */
        public static String getPermissionDeniedMessage(Role creatorRole, Role targetRole) {
                Set<Role> allowed = getAllowedRolesToCreate(creatorRole);
                if (allowed.isEmpty()) {
                        return String.format("Users with role %s cannot create other users", creatorRole);
                }
                return String.format(
                                "Users with role %s cannot create %s. Allowed roles: %s",
                                creatorRole, targetRole, allowed);
        }

        /**
         * Get a descriptive message for UPDATE permission denied.
         */
        public static String getUpdatePermissionDeniedMessage(Role updaterRole, Role targetRole) {
                Set<Role> allowed = getAllowedRolesToUpdate(updaterRole);
                if (allowed.isEmpty()) {
                        return String.format("Users with role %s cannot update other users", updaterRole);
                }
                return String.format(
                                "Users with role %s cannot update %s. Allowed roles to update: %s",
                                updaterRole, targetRole, allowed);
        }

        /**
         * Get a descriptive message for DELETE permission denied.
         */
        public static String getDeletePermissionDeniedMessage(Role deleterRole, Role targetRole) {
                Set<Role> allowed = getAllowedRolesToUpdate(deleterRole);
                if (allowed.isEmpty()) {
                        return String.format("Users with role %s cannot delete other users", deleterRole);
                }
                return String.format(
                                "Users with role %s cannot delete %s. Allowed roles to delete: %s",
                                deleterRole, targetRole, allowed);
        }
}
