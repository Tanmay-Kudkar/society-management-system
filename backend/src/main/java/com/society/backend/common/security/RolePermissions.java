package com.society.backend.common.security;

import com.society.backend.user.entity.Role;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.society.backend.flat.entity.Tenant;
import com.society.backend.security.entity.Visitor;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
import com.society.backend.vendor.entity.Vendor;
/**
 * Defines the strict role hierarchy for user CRUD permissions.
 *
 * 12-ROLE PERMISSION MATRIX:
 * ──────────────────────────
 * MASTER_ADMIN    → Create/Update/Delete: ALL roles
 * SOCIETY_ADMIN   → CHAIRMAN, SECRETARY, TREASURER, COMMITTEE, MANAGER, EMPLOYEE, MEMBER, TENANT, VENDOR, VISITOR
 * CHAIRMAN        → COMMITTEE, MANAGER, EMPLOYEE, MEMBER, TENANT, VISITOR
 * SECRETARY       → Same as CHAIRMAN
 * TREASURER       → Same as CHAIRMAN
 * COMMITTEE       → EMPLOYEE, MEMBER
 * EMPLOYEE        → None
 * MEMBER          → TENANT
 * VENDOR          → None
 * MANAGER         → None
 * TENANT          → None
 * VISITOR         → None
 *
 * READ flows downward. MASTER_ADMIN reads all.
 */
public final class RolePermissions {

        private static final Map<Role, Set<Role>> ALLOWED_CREATIONS = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_UPDATES = new EnumMap<>(Role.class);
        private static final Map<Role, Set<Role>> ALLOWED_READS = new EnumMap<>(Role.class);

        static {
                // ═══════════════════════════════════════════════════════════════
                // CREATE PERMISSIONS
                // ═══════════════════════════════════════════════════════════════

                // MASTER_ADMIN — full CRUD on all roles
                ALLOWED_CREATIONS.put(Role.MASTER_ADMIN, EnumSet.of(
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // SOCIETY_ADMIN — full access within own society
                ALLOWED_CREATIONS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // CHAIRMAN — manages committee level and below
                ALLOWED_CREATIONS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // SECRETARY — same scope as Chairman
                ALLOWED_CREATIONS.put(Role.SECRETARY, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // TREASURER — same scope as Chairman
                ALLOWED_CREATIONS.put(Role.TREASURER, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                // COMMITTEE — creates EMPLOYEE and MEMBER
                ALLOWED_CREATIONS.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE, Role.MEMBER));

                // MANAGER — same scope as SOCIETY_ADMIN (alternate admin designation)
                ALLOWED_CREATIONS.put(Role.MANAGER, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // EMPLOYEE — no operational user CRUD rights
                ALLOWED_CREATIONS.put(Role.EMPLOYEE, EnumSet.noneOf(Role.class));

                // MEMBER — creates TENANT only
                ALLOWED_CREATIONS.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                // TENANT, VENDOR, VISITOR — cannot create anyone
                ALLOWED_CREATIONS.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_CREATIONS.put(Role.VENDOR, EnumSet.noneOf(Role.class));
                ALLOWED_CREATIONS.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // UPDATE/DELETE PERMISSIONS — mirrors CREATE
                // ═══════════════════════════════════════════════════════════════

                ALLOWED_UPDATES.put(Role.MASTER_ADMIN, EnumSet.of(
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                ALLOWED_UPDATES.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                ALLOWED_UPDATES.put(Role.CHAIRMAN, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                ALLOWED_UPDATES.put(Role.SECRETARY, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                ALLOWED_UPDATES.put(Role.TREASURER, EnumSet.of(
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VISITOR));

                ALLOWED_UPDATES.put(Role.COMMITTEE, EnumSet.of(
                                Role.EMPLOYEE, Role.MEMBER));

                ALLOWED_UPDATES.put(Role.MANAGER, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                ALLOWED_UPDATES.put(Role.EMPLOYEE, EnumSet.noneOf(Role.class));

                ALLOWED_UPDATES.put(Role.MEMBER, EnumSet.of(Role.TENANT));

                ALLOWED_UPDATES.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_UPDATES.put(Role.VENDOR, EnumSet.noneOf(Role.class));
                ALLOWED_UPDATES.put(Role.VISITOR, EnumSet.noneOf(Role.class));

                // ═══════════════════════════════════════════════════════════════
                // READ PERMISSIONS — downward flow
                // ═══════════════════════════════════════════════════════════════

                // MASTER_ADMIN — reads all
                ALLOWED_READS.put(Role.MASTER_ADMIN, EnumSet.allOf(Role.class));

                // SOCIETY_ADMIN — reads all in society
                ALLOWED_READS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // CHAIRMAN — reads all below in society
                ALLOWED_READS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // SECRETARY — reads committee and below
                ALLOWED_READS.put(Role.SECRETARY, EnumSet.of(
                                Role.SECRETARY,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // TREASURER — reads committee and below
                ALLOWED_READS.put(Role.TREASURER, EnumSet.of(
                                Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // COMMITTEE — reads employee, member, and below
                ALLOWED_READS.put(Role.COMMITTEE, EnumSet.of(
                                Role.COMMITTEE,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // MANAGER — reads all in society, same as SOCIETY_ADMIN
                ALLOWED_READS.put(Role.MANAGER, EnumSet.of(
                                Role.SOCIETY_ADMIN,
                                Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER,
                                Role.COMMITTEE, Role.MANAGER,
                                Role.EMPLOYEE, Role.MEMBER,
                                Role.TENANT, Role.VENDOR, Role.VISITOR));

                // EMPLOYEE — no system access
                ALLOWED_READS.put(Role.EMPLOYEE, EnumSet.of(Role.EMPLOYEE));

                // MEMBER — reads tenant
                ALLOWED_READS.put(Role.MEMBER, EnumSet.of(Role.MEMBER, Role.TENANT));

                // TENANT, VENDOR, VISITOR — own profile only
                ALLOWED_READS.put(Role.TENANT, EnumSet.of(Role.TENANT));
                ALLOWED_READS.put(Role.VENDOR, EnumSet.of(Role.VENDOR));
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
