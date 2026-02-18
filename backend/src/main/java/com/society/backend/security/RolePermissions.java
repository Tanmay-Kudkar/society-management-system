package com.society.backend.security;

import com.society.backend.entity.Role;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Defines the strict role hierarchy for user CRUD permissions.
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
 * Note: MANAGER role exists for operational management but has NO user CRUD
 * rights.
 * MANAGER is created by SOCIETY_ADMIN (who has full access to all below).
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
 * MANAGER - Operational Manager: Handles day-to-day management tasks
 * EMPLOYEE - Staff/Security: Handles visitors, basic operations
 * MEMBER - Flat Owner: Views own data, raises tickets/complaints
 * TENANT - Renter: Limited access to own profile & bills
 * VISITOR - Guest: Minimal access, read-only
 * 
 * ROLE LEVELS:
 * ────────────
 * Level 0: PLATFORM_OWNER (Invisible Platform Creator)
 * Level 1: ORGANIZATION_OWNER (Multi-Society Manager)
 * Level 2: SOCIETY_ADMIN (Single Society Manager - Full CRUD on all below)
 * Level 3: CHAIRMAN (Governing Body Head)
 * Level 4: SECRETARY, TREASURER (Administrative & Financial Heads)
 * Level 5: COMMITTEE, MANAGER (Committee Members & Operations)
 * Level 6: EMPLOYEE, MEMBER (Staff & Residents)
 * Level 7: TENANT (Renters)
 * Level 8: VISITOR (Temporary Access)
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (per matrix above)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access is LIMITED to direct children only
 * 4. EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 5. MANAGER has NO user CRUD rights (only SOCIETY_ADMIN can create MANAGER)
 * 6. Organization data is strictly isolated
 * 7. Least-privilege access enforced
 */
public final class RolePermissions {

        private static final Map<Role, Set<Role>> ALLOWED_CREATIONS = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_UPDATES = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_READS = new EnumMap<>(Role.class);

        static {
                // ═══════════════════════════════════════════════════════════════
                // CREATE PERMISSIONS - Per Permission Matrix
                // ═══════════════════════════════════════════════════════════════

                // PLATFORM_OWNER - Full CRUD on all roles below
                ALLOWED_CREATIONS.put(Role.PLATFORM_OWNER, EnumSet.of(
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

                // ORGANIZATION_OWNER - Creates SOCIETY_ADMIN in own org
                ALLOWED_CREATIONS.put(Role.ORGANIZATION_OWNER, EnumSet.of(Role.SOCIETY_ADMIN));

                // SOCIETY_ADMIN - ALL below (full access) - can create every role below Level 2
                ALLOWED_CREATIONS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.MANAGER,
                                Role.EMPLOYEE,
                                Role.MEMBER,
                                Role.TENANT,
                                Role.VISITOR));

                // CHAIRMAN - Can create SECRETARY and TREASURER
                ALLOWED_CREATIONS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.SECRETARY,
                                Role.TREASURER));

                // SECRETARY - Can create COMMITTEE
                ALLOWED_CREATIONS.put(Role.SECRETARY, EnumSet.of(Role.COMMITTEE));

                // TREASURER - Can create COMMITTEE
                ALLOWED_CREATIONS.put(Role.TREASURER, EnumSet.of(Role.COMMITTEE));

                // COMMITTEE - Creates EMPLOYEE and MEMBER
                ALLOWED_CREATIONS.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // MANAGER - No user CRUD rights (not in permission matrix)
                ALLOWED_CREATIONS.put(Role.MANAGER, EnumSet.noneOf(Role.class));

                // EMPLOYEE - Creates VISITOR only
                ALLOWED_CREATIONS.put(Role.EMPLOYEE, EnumSet.of(Role.VISITOR));

                // MEMBER - Creates TENANT only
                ALLOWED_CREATIONS.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT and VISITOR - Cannot create anyone
                ALLOWED_CREATIONS.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_CREATIONS.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // UPDATE/DELETE PERMISSIONS - Per Permission Matrix
                // ═══════════════════════════════════════════════════════════════

                // PLATFORM_OWNER - Full CRUD on all roles below
                ALLOWED_UPDATES.put(Role.PLATFORM_OWNER, EnumSet.of(
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

                // ORGANIZATION_OWNER - Can update/delete SOCIETY_ADMIN in own org
                ALLOWED_UPDATES.put(Role.ORGANIZATION_OWNER, EnumSet.of(Role.SOCIETY_ADMIN));

                // SOCIETY_ADMIN - ALL below (full access)
                ALLOWED_UPDATES.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.MANAGER,
                                Role.EMPLOYEE,
                                Role.MEMBER,
                                Role.TENANT,
                                Role.VISITOR));

                // CHAIRMAN - Can update/delete SECRETARY and TREASURER
                ALLOWED_UPDATES.put(Role.CHAIRMAN, EnumSet.of(
                                Role.SECRETARY,
                                Role.TREASURER));

                // SECRETARY - Can update/delete COMMITTEE
                ALLOWED_UPDATES.put(Role.SECRETARY, EnumSet.of(Role.COMMITTEE));

                // TREASURER - Can update/delete COMMITTEE
                ALLOWED_UPDATES.put(Role.TREASURER, EnumSet.of(Role.COMMITTEE));

                // COMMITTEE - Can update/delete EMPLOYEE and MEMBER
                ALLOWED_UPDATES.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // MANAGER - No user CRUD rights
                ALLOWED_UPDATES.put(Role.MANAGER, EnumSet.noneOf(Role.class));

                // EMPLOYEE - Can update/delete VISITOR only
                ALLOWED_UPDATES.put(Role.EMPLOYEE, EnumSet.of(Role.VISITOR));

                // MEMBER - Can update/delete TENANT only
                ALLOWED_UPDATES.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT and VISITOR - Cannot update/delete anyone
                ALLOWED_UPDATES.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_UPDATES.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // READ PERMISSIONS - Downward flow per Permission Matrix
                // ═══════════════════════════════════════════════════════════════

                // PLATFORM_OWNER - Can read ALL roles
                ALLOWED_READS.put(Role.PLATFORM_OWNER, EnumSet.allOf(Role.class));

                // ORGANIZATION_OWNER - Can read own org roles (all below within org)
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

                // SOCIETY_ADMIN - Can read ALL in society
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

                // CHAIRMAN - Can read all below
                ALLOWED_READS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // SECRETARY - Can read COMMITTEE and below
                ALLOWED_READS.put(Role.SECRETARY, EnumSet.of(
                                Role.SECRETARY, Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // TREASURER - Can read COMMITTEE and below
                ALLOWED_READS.put(Role.TREASURER, EnumSet.of(
                                Role.TREASURER, Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // COMMITTEE - Can read EMPLOYEE, MEMBER, and below
                ALLOWED_READS.put(Role.COMMITTEE, EnumSet.of(
                                Role.COMMITTEE, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // MANAGER - Can read EMPLOYEE and below (operational visibility)
                ALLOWED_READS.put(Role.MANAGER, EnumSet.of(
                                Role.MANAGER, Role.EMPLOYEE, Role.VISITOR));

                // EMPLOYEE - Can read VISITOR
                ALLOWED_READS.put(Role.EMPLOYEE, EnumSet.of(Role.EMPLOYEE, Role.VISITOR));

                // MEMBER - Can read TENANT
                ALLOWED_READS.put(Role.MEMBER, EnumSet.of(Role.MEMBER, Role.TENANT));

                // TENANT - Can only read own profile
                ALLOWED_READS.put(Role.TENANT, EnumSet.of(Role.TENANT));

                // VISITOR - Can only read own profile
                ALLOWED_READS.put(Role.VISITOR, EnumSet.of(Role.VISITOR));
        }

        private RolePermissions() {
                // Utility class, prevent instantiation
        }

        private static Role normalizeRole(Role role) {
                if (role == null) {
                        return null;
                }
                if (role == Role.MASTER_ADMIN) {
                        return Role.PLATFORM_OWNER;
                }
                return role;
        }

        /**
         * Check if a user with the given role can CREATE a user with the target role.
         */
        public static boolean canCreate(Role creatorRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_CREATIONS.get(normalizeRole(creatorRole));
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Check if a user with the given role can UPDATE a user with the target role.
         */
        public static boolean canUpdate(Role updaterRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_UPDATES.get(normalizeRole(updaterRole));
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
                Set<Role> allowed = ALLOWED_READS.get(normalizeRole(readerRole));
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Get the set of roles that a user with the given role can CREATE.
         */
        public static Set<Role> getAllowedRolesToCreate(Role creatorRole) {
                return ALLOWED_CREATIONS.getOrDefault(normalizeRole(creatorRole), EnumSet.noneOf(Role.class));
        }

        /**
         * Get the set of roles that a user with the given role can UPDATE/DELETE.
         */
        public static Set<Role> getAllowedRolesToUpdate(Role updaterRole) {
                return ALLOWED_UPDATES.getOrDefault(normalizeRole(updaterRole), EnumSet.noneOf(Role.class));
        }

        /**
         * Get the set of roles that a user with the given role can READ.
         */
        public static Set<Role> getAllowedRolesToRead(Role readerRole) {
                return ALLOWED_READS.getOrDefault(normalizeRole(readerRole), EnumSet.noneOf(Role.class));
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
