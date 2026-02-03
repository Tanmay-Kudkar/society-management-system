package com.society.backend.security;

import com.society.backend.entity.Role;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Defines the strict role hierarchy for user CRUD permissions.
 * 
 * HOUSING SOCIETY HIERARCHY (Based on real-world structure):
 * ──────────────────────────────────────────────────────────
 * 
 * CHAIRMAN (Head/Superintendent):
 * - Holds overall control and guidance
 * - Presides over meetings
 * - Possesses final veto/consent power on committee decisions
 * - Primary signatory for bank accounts
 * - Can manage SECRETARY, TREASURER, and all below
 * 
 * SECRETARY (Administrative Head):
 * - Manages documentation, records, member details
 * - Handles day-to-day operations and correspondence
 * - Acts on decisions authorized by committee/chairman
 * - Can manage COMMITTEE and below
 * 
 * TREASURER (Financial Head):
 * - Handles finances, billing, payments
 * - Can manage COMMITTEE and below
 * 
 * HIERARCHY RULES:
 * ────────────────
 * 1. Parent creates DIRECT CHILDREN only (no skip-level creation)
 * 2. Read access flows DOWNWARD (parents can read all descendants)
 * 3. Update/Delete access is LIMITED to direct children only
 * 4. EXCEPTION: SOCIETY_ADMIN has FULL CRUD rights to ALL roles below
 * 
 * ROLE LEVELS:
 * ────────────
 * Level 1: MASTER_ADMIN (Platform Owner)
 * Level 2: SOCIETY_ADMIN (Society Manager - Full CRUD Exception)
 * Level 3: CHAIRMAN (Committee Head - Highest Committee Authority)
 * Level 4: SECRETARY, TREASURER (Administrative & Financial Heads)
 * Level 5: COMMITTEE (General Committee Members)
 * Level 6: EMPLOYEE, MEMBER (Staff & Residents)
 * Level 7: TENANT, VISITOR (Renters & Temporary Access)
 * 
 * CREATION HIERARCHY (Direct Children Only):
 * ──────────────────────────────────────────
 * MASTER_ADMIN → SOCIETY_ADMIN only
 * SOCIETY_ADMIN → ALL below (exception: full CRUD rights)
 * CHAIRMAN → SECRETARY, TREASURER (direct children - committee leadership)
 * SECRETARY → COMMITTEE (direct child - administrative subordinates)
 * TREASURER → COMMITTEE (direct child - financial subordinates)
 * COMMITTEE → EMPLOYEE, MEMBER (direct children)
 * EMPLOYEE → VISITOR only (direct child)
 * MEMBER → TENANT only (direct child)
 * TENANT → cannot create anyone
 * VISITOR → cannot create anyone
 */
public final class RolePermissions {

        private static final Map<Role, Set<Role>> ALLOWED_CREATIONS = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_UPDATES = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_READS = new EnumMap<>(Role.class);

        static {
                // ═══════════════════════════════════════════════════════════════
                // CREATE PERMISSIONS - Direct children only
                // ═══════════════════════════════════════════════════════════════

                // MASTER_ADMIN - Can ONLY create SOCIETY_ADMIN (direct child)
                ALLOWED_CREATIONS.put(Role.MASTER_ADMIN, EnumSet.of(Role.SOCIETY_ADMIN));

                // SOCIETY_ADMIN - EXCEPTION: Full CRUD on all roles below (special privilege)
                ALLOWED_CREATIONS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER));

                // CHAIRMAN - Cannot create anyone (only approves COMMITTEE)
                ALLOWED_CREATIONS.put(Role.CHAIRMAN, EnumSet.noneOf(Role.class));

                // SECRETARY - Administrative head, can nominate/create COMMITTEE members
                ALLOWED_CREATIONS.put(Role.SECRETARY, EnumSet.of(
                                Role.COMMITTEE,
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // TREASURER - Financial head, cannot create (only approve/reject COMMITTEE)
                ALLOWED_CREATIONS.put(Role.TREASURER, EnumSet.noneOf(Role.class));

                // COMMITTEE - Can create EMPLOYEE and MEMBER (direct children)
                ALLOWED_CREATIONS.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // EMPLOYEE - Can create VISITOR only (direct child)
                ALLOWED_CREATIONS.put(Role.EMPLOYEE, EnumSet.of(Role.VISITOR));

                // MEMBER - Can create TENANT only (direct child, for their flat)
                ALLOWED_CREATIONS.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT and VISITOR - Cannot create anyone
                ALLOWED_CREATIONS.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_CREATIONS.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // UPDATE/DELETE PERMISSIONS - Same as create (direct children only)
                // ═══════════════════════════════════════════════════════════════

                // MASTER_ADMIN - Can update/delete SOCIETY_ADMIN only
                ALLOWED_UPDATES.put(Role.MASTER_ADMIN, EnumSet.of(Role.SOCIETY_ADMIN));

                // SOCIETY_ADMIN - Can update/delete CHAIRMAN, SECRETARY, TREASURER only
                ALLOWED_UPDATES.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER));

                // CHAIRMAN - Can update/delete SECRETARY, TREASURER, and approve/reject
                // COMMITTEE
                ALLOWED_UPDATES.put(Role.CHAIRMAN, EnumSet.of(
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE));

                // SECRETARY - Cannot update COMMITTEE (only nominates, CHAIRMAN/TREASURER
                // approve)
                ALLOWED_UPDATES.put(Role.SECRETARY, EnumSet.noneOf(Role.class));

                // TREASURER - Can approve/reject COMMITTEE only
                ALLOWED_UPDATES.put(Role.TREASURER, EnumSet.of(Role.COMMITTEE));

                // COMMITTEE - Can update/delete EMPLOYEE and MEMBER
                ALLOWED_UPDATES.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // EMPLOYEE - Can update/delete VISITOR only
                ALLOWED_UPDATES.put(Role.EMPLOYEE, EnumSet.of(Role.VISITOR));

                // MEMBER - Can update/delete TENANT only
                ALLOWED_UPDATES.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT and VISITOR - Cannot update/delete anyone
                ALLOWED_UPDATES.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_UPDATES.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // READ PERMISSIONS - All descendants (downward flow)
                // ═══════════════════════════════════════════════════════════════

                // MASTER_ADMIN - Can read ALL roles
                ALLOWED_READS.put(Role.MASTER_ADMIN, EnumSet.allOf(Role.class));

                // SOCIETY_ADMIN - Can read all below
                ALLOWED_READS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.EMPLOYEE,
                                Role.MEMBER,
                                Role.TENANT,
                                Role.VISITOR));

                // CHAIRMAN - Can read SECRETARY, TREASURER and all below (highest committee
                // authority)
                ALLOWED_READS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // SECRETARY - Can read COMMITTEE and below
                ALLOWED_READS.put(Role.SECRETARY, EnumSet.of(
                                Role.SECRETARY, Role.COMMITTEE, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // TREASURER - Can read COMMITTEE and below
                ALLOWED_READS.put(Role.TREASURER, EnumSet.of(
                                Role.TREASURER, Role.COMMITTEE, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // COMMITTEE - Can read EMPLOYEE, MEMBER and below
                ALLOWED_READS.put(Role.COMMITTEE, EnumSet.of(
                                Role.COMMITTEE, Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // EMPLOYEE - Can read VISITOR
                ALLOWED_READS.put(Role.EMPLOYEE, EnumSet.of(Role.EMPLOYEE, Role.VISITOR));

                // MEMBER - Can read TENANT
                ALLOWED_READS.put(Role.MEMBER, EnumSet.of(Role.MEMBER, Role.TENANT));

                // TENANT and VISITOR - Can only read themselves
                ALLOWED_READS.put(Role.TENANT, EnumSet.of(Role.TENANT));
                ALLOWED_READS.put(Role.VISITOR, EnumSet.of(Role.VISITOR));
        }

        private RolePermissions() {
                // Utility class, prevent instantiation
        }

        /**
         * Check if a user with the given role can CREATE a user with the target role.
         * Only direct children can be created (except SOCIETY_ADMIN who can create
         * all).
         */
        public static boolean canCreate(Role creatorRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_CREATIONS.get(creatorRole);
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Check if a user with the given role can UPDATE a user with the target role.
         * Only direct children can be updated (except SOCIETY_ADMIN who can update
         * all).
         */
        public static boolean canUpdate(Role updaterRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_UPDATES.get(updaterRole);
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Check if a user with the given role can DELETE a user with the target role.
         * Only direct children can be deleted (except SOCIETY_ADMIN who can delete
         * all).
         */
        public static boolean canDelete(Role deleterRole, Role targetRole) {
                // Delete permissions are same as update permissions
                return canUpdate(deleterRole, targetRole);
        }

        /**
         * Check if a user with the given role can READ a user with the target role.
         * Parents can read all descendants (downward flow).
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
