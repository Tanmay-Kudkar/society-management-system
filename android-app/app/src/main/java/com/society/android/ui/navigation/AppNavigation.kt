package com.society.android.ui.navigation

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.society.android.ui.auth.LoginScreen
import com.society.android.ui.auth.LoginViewModel
import com.society.android.ui.complaints.ComplaintListScreen
import com.society.android.ui.complaints.CreateComplaintScreen
import com.society.android.ui.dashboard.DashboardScreen
import com.society.android.ui.finance.FinanceScreen
import com.society.android.ui.management.UserListScreen
import com.society.android.ui.management.UnitListScreen
import com.society.android.ui.notices.NoticeListScreen
import com.society.android.ui.notices.CreateNoticeScreen
import com.society.android.ui.settings.ProfileScreen
import com.society.android.ui.settings.SettingsScreen
import com.society.android.ui.settings.ChangePasswordScreen
import com.society.android.ui.tickets.TicketListScreen
import com.society.android.ui.tickets.CreateTicketScreen
import com.society.android.ui.vendors.VendorListScreen
import com.society.android.ui.vendors.CreateVendorScreen
import com.society.android.ui.visitors.VisitorListScreen
import com.society.android.ui.visitors.CreateVisitorScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(
    isLoggedIn: Boolean,
    onLogout: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in Screen.bottomNavItems.map { it.route }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    Screen.bottomNavItems.forEach { screen ->
                        val selected = currentRoute == screen.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(Screen.Dashboard.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = if (selected) screen.selectedIcon!! else screen.icon!!,
                                    contentDescription = screen.title
                                )
                            },
                            label = { Text(screen.title, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = if (isLoggedIn) Screen.Dashboard.route else Screen.Login.route,
            modifier = Modifier.padding(padding)
        ) {
            // ─── Auth ────────────────────────────────
            composable(Screen.Login.route) {
                val viewModel: LoginViewModel = hiltViewModel()
                LoginScreen(
                    viewModel = viewModel,
                    onLoginSuccess = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // ─── Dashboard ──────────────────────────
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    navController = navController,
                    onLogout = {
                        onLogout()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // ─── Notices ────────────────────────────
            composable(Screen.Notices.route) {
                NoticeListScreen(
                    navController = navController,
                    onCreateNotice = { navController.navigate(Screen.CreateNotice.route) }
                )
            }
            composable(Screen.CreateNotice.route) {
                CreateNoticeScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }

            // ─── Complaints ─────────────────────────
            composable(Screen.Complaints.route) {
                ComplaintListScreen(
                    navController = navController,
                    onCreateComplaint = { navController.navigate(Screen.CreateComplaint.route) }
                )
            }
            composable(Screen.CreateComplaint.route) {
                CreateComplaintScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }

            // ─── Tickets ────────────────────────────
            composable(Screen.Tickets.route) {
                TicketListScreen(
                    navController = navController,
                    onCreateTicket = { navController.navigate(Screen.CreateTicket.route) }
                )
            }
            composable(Screen.CreateTicket.route) {
                CreateTicketScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }

            // ─── Vendors ────────────────────────────
            composable(Screen.Vendors.route) {
                VendorListScreen(
                    navController = navController,
                    onCreateVendor = { navController.navigate(Screen.CreateVendor.route) }
                )
            }
            composable(Screen.CreateVendor.route) {
                CreateVendorScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }

            // ─── Finance ────────────────────────────
            composable(Screen.Finance.route) {
                FinanceScreen(navController = navController)
            }

            // ─── Visitors ───────────────────────────
            composable(Screen.Visitors.route) {
                VisitorListScreen(
                    navController = navController,
                    onCreateVisitor = { navController.navigate(Screen.CreateVisitor.route) }
                )
            }
            composable(Screen.CreateVisitor.route) {
                CreateVisitorScreen(
                    onBack = { navController.popBackStack() },
                    onSuccess = { navController.popBackStack() }
                )
            }

            // ─── Management ─────────────────────────
            composable(Screen.Users.route) {
                UserListScreen(navController = navController)
            }
            composable(Screen.Units.route) {
                UnitListScreen(navController = navController)
            }

            // ─── Settings ───────────────────────────
            composable(Screen.Settings.route) {
                SettingsScreen(
                    navController = navController,
                    onLogout = {
                        onLogout()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Profile.route) {
                ProfileScreen(navController = navController)
            }
            composable(Screen.ChangePassword.route) {
                ChangePasswordScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}
