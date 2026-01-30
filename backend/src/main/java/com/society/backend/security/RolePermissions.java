package com.society.backend.security;

import com.society.backend.entity.Role;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Defines the role hierarchy for user creation permissions.
 * 
 * User Creation Hierarchy:
 * ────────────────────────
 * MASTER_ADMIN → can create: SOCIETY_ADMIN
 * SOCIETY_ADMIN → can create: CHAIRMAN, SECRETARY, TREASURER, COMMITTEE,
 * EMPLOYEE, MEMBER
 * CHAIRMAN → can create: SECRETARY, TREASURER,EMPLOYEE, COMMITTEE,  MEMBER
 * SECRETARY → can create: COMMITTEE, EMPLOYEE, MEMBER
 * TREASURER → can create: MEMBER
 * COMMITTEE → can create: MEMBER
 * EMPLOYEE → can create: VISITOR
 * MEMBER → can create: TENANT (for their flat only)
 * TENANT → cannot create anyone
 * VISITOR → cannot create anyone
 */
public final class RolePermissions {

        private static final Map<Role, Set<Role>> ALLOWED_CREATIONS = new EnumMap<>(Role.class);

        static {
                // MASTER_ADMIN - Platform owner, can create any role
                ALLOWED_CREATIONS.put(Role.MASTER_ADMIN, EnumSet.allOf(Role.class));

                // SOCIETY_ADMIN - Can create committee members and staff for their society
                ALLOWED_CREATIONS.put(Role.SOCIETY_ADMIN, EnumSet.of(
                                Role.CHAIRMAN,
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // CHAIRMAN - Committee head, similar to Society Admin but cannot create Society
                // Admin
                ALLOWED_CREATIONS.put(Role.CHAIRMAN, EnumSet.of(
                                Role.SECRETARY,
                                Role.TREASURER,
                                Role.COMMITTEE,
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // SECRETARY - Can manage committee members and staff
                ALLOWED_CREATIONS.put(Role.SECRETARY, EnumSet.of(
                                Role.COMMITTEE,
                                Role.EMPLOYEE,
                                Role.MEMBER));

                // TREASURER - Limited creation, mainly for financial users
                ALLOWED_CREATIONS.put(Role.TREASURER, EnumSet.of(
                                Role.MEMBER));

                // COMMITTEE - Can add members
                ALLOWED_CREATIONS.put(Role.COMMITTEE, EnumSet.of(
                                Role.MEMBER));

                // EMPLOYEE - Can create visitors (temporary access)
                ALLOWED_CREATIONS.put(Role.EMPLOYEE, EnumSet.of(
                                Role.VISITOR));

                // MEMBER - Can add tenants to their flat
                ALLOWED_CREATIONS.put(Role.MEMBER, EnumSet.of(
                                Role.TENANT));

                // TENANT and VISITOR - Cannot create anyone
                ALLOWED_CREATIONS.put(Role.TENANT, EnumSet.noneOf(Role.class));
                ALLOWED_CREATIONS.put(Role.VISITOR, EnumSet.noneOf(Role.class));
        }

        private RolePermissions() {
                // Utility class, prevent instantiation
        }

        /**
         * Check if a user with the given role can create a user with the target role.
         * 
         * @param creatorRole The role of the user attempting to create
         * @param targetRole  The role of the user being created
         * @return true if allowed, false otherwise
         */
        public static boolean canCreate(Role creatorRole, Role targetRole) {
                Set<Role> allowed = ALLOWED_CREATIONS.get(creatorRole);
                return allowed != null && allowed.contains(targetRole);
        }

        /**
         * Get the set of roles that a user with the given role can create.
         * 
         * @param creatorRole The role of the user
         * @return Set of roles that can be created, empty set if none
         */
        public static Set<Role> getAllowedRolesToCreate(Role creatorRole) {
                return ALLOWED_CREATIONS.getOrDefault(creatorRole, EnumSet.noneOf(Role.class));
        }

        /**
         * Check if self-registration is allowed for the given role.
         * Only MEMBER can self-register (residents joining a society).
         * 
         * @param role The role attempting to self-register
         * @return true if self-registration is allowed
         */
        public static boolean canSelfRegister(Role role) {
                return role == Role.MEMBER;
        }

        /**
         * Get a descriptive message for permission denied.
         * 
         * @param creatorRole The role attempting to create
         * @param targetRole  The target role being created
         * @return User-friendly error message
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
}
