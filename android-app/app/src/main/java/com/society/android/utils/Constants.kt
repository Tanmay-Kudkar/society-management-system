package com.society.android.utils

/**
 * Constants used across the application.
 */
object Constants {
    // DataStore keys
    const val PREFS_NAME = "society_prefs"
    const val KEY_TOKEN = "jwt_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_EMAIL = "user_email"
    const val KEY_USER_ROLE = "user_role"
    const val KEY_SOCIETY_ID = "society_id"
    const val KEY_FLAT_ID = "flat_id"
    const val KEY_IS_LOGGED_IN = "is_logged_in"
    const val KEY_DARK_MODE = "dark_mode"
    const val KEY_FCM_TOKEN = "fcm_token"

    // Roles
    const val ROLE_MASTER_ADMIN = "MASTER_ADMIN"
    const val ROLE_SOCIETY_ADMIN = "SOCIETY_ADMIN"
    const val ROLE_CHAIRMAN = "CHAIRMAN"
    const val ROLE_SECRETARY = "SECRETARY"
    const val ROLE_TREASURER = "TREASURER"
    const val ROLE_COMMITTEE = "COMMITTEE"
    const val ROLE_MANAGER = "MANAGER"
    const val ROLE_EMPLOYEE = "EMPLOYEE"
    const val ROLE_MEMBER = "MEMBER"
    const val ROLE_TENANT = "TENANT"
    const val ROLE_VENDOR = "VENDOR"
    const val ROLE_VISITOR = "VISITOR"

    // Admin-level roles
    val ADMIN_ROLES = setOf(
        ROLE_MASTER_ADMIN, ROLE_SOCIETY_ADMIN, ROLE_CHAIRMAN,
        ROLE_SECRETARY, ROLE_TREASURER
    )

    val MANAGEMENT_ROLES = setOf(
        ROLE_MASTER_ADMIN, ROLE_SOCIETY_ADMIN, ROLE_CHAIRMAN,
        ROLE_SECRETARY, ROLE_TREASURER, ROLE_COMMITTEE, ROLE_MANAGER
    )

    val FINANCE_ROLES = setOf(
        ROLE_MASTER_ADMIN, ROLE_SOCIETY_ADMIN, ROLE_CHAIRMAN,
        ROLE_SECRETARY, ROLE_TREASURER
    )

    fun isAdmin(role: String): Boolean = role in ADMIN_ROLES
    fun canManage(role: String): Boolean = role in MANAGEMENT_ROLES
    fun canViewFinance(role: String): Boolean = role in FINANCE_ROLES
    fun canCreateNotice(role: String): Boolean = role in MANAGEMENT_ROLES
    fun canImportData(role: String): Boolean = role in ADMIN_ROLES
}
