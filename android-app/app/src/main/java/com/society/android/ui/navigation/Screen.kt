package com.society.android.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(
    val route: String,
    val title: String,
    val icon: ImageVector? = null,
    val selectedIcon: ImageVector? = null
) {
    // Auth
    data object Login : Screen("login", "Login")

    // Main tabs
    data object Dashboard : Screen("dashboard", "Home", Icons.Outlined.Home, Icons.Filled.Home)
    data object Notices : Screen("notices", "Notices", Icons.Outlined.Notifications, Icons.Filled.Notifications)
    data object Finance : Screen("finance", "Finance", Icons.Outlined.AccountBalance, Icons.Filled.AccountBalance)
    data object Settings : Screen("settings", "Settings", Icons.Outlined.Settings, Icons.Filled.Settings)

    // Sub-screens
    data object CreateNotice : Screen("notices/create", "Create Notice")
    data object NoticeDetail : Screen("notices/{noticeId}", "Notice Detail")

    data object Complaints : Screen("complaints", "Complaints")
    data object CreateComplaint : Screen("complaints/create", "Raise Complaint")

    data object Tickets : Screen("tickets", "Tickets")
    data object CreateTicket : Screen("tickets/create", "Create Ticket")

    data object Vendors : Screen("vendors", "Vendors")
    data object CreateVendor : Screen("vendors/create", "Add Vendor")
    data object VendorDetail : Screen("vendors/{vendorId}", "Vendor Detail")

    data object Visitors : Screen("visitors", "Visitors")
    data object CreateVisitor : Screen("visitors/create", "Log Visitor")

    data object Users : Screen("users", "Users")
    data object Units : Screen("units", "Units")

    data object Profile : Screen("profile", "Profile")
    data object ChangePassword : Screen("change-password", "Change Password")

    data object Bills : Screen("bills", "Bills")
    data object Payments : Screen("payments", "Payments")
    data object Transactions : Screen("transactions", "Transactions")

    companion object {
        val bottomNavItems = listOf(Dashboard, Notices, Finance, Settings)
    }
}
