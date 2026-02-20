package com.society.android.ui.visitors

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.society.android.ui.components.*
import com.society.android.ui.dashboard.DashboardViewModel
import com.society.android.utils.Constants
import com.society.android.utils.Formatters

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VisitorListScreen(
    navController: NavController,
    onCreateVisitor: () -> Unit,
    viewModel: VisitorViewModel = hiltViewModel(),
    dashboardViewModel: DashboardViewModel = hiltViewModel()
) {
    val state by viewModel.visitors.collectAsState()
    val societyId = dashboardViewModel.getSocietyId()
    val userRole = dashboardViewModel.getUserRole()
    val canManage = Constants.canManage(userRole)

    LaunchedEffect(societyId) {
        if (societyId > 0) viewModel.loadVisitors(societyId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Visitors") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateVisitor) {
                Icon(Icons.Default.PersonAdd, contentDescription = "Log Visitor")
            }
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingScreen(Modifier.padding(padding))
            state.error != null -> ErrorScreen(
                message = state.error!!,
                onRetry = { viewModel.loadVisitors(societyId) },
                modifier = Modifier.padding(padding)
            )
            state.data?.isEmpty() == true -> EmptyStateScreen(
                icon = Icons.Default.People,
                title = "No visitors",
                subtitle = "Visitor logs will appear here",
                actionLabel = "Log Visitor",
                onAction = onCreateVisitor,
                modifier = Modifier.padding(padding)
            )
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.data ?: emptyList()) { visitor ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = visitor.name ?: "Unknown",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.weight(1f)
                                    )
                                    StatusChip(status = visitor.status ?: "PENDING")
                                }
                                Spacer(Modifier.height(8.dp))
                                visitor.purpose?.let { InfoRow(label = "Purpose", value = it) }
                                visitor.phoneNumber?.let { InfoRow(label = "Phone", value = it) }
                                visitor.flatNumber?.let { InfoRow(label = "Visiting Unit", value = it) }
                                InfoRow(label = "Date", value = Formatters.formatDateTime(visitor.visitDate))

                                // Action buttons for pending visitors
                                if (canManage && visitor.status?.uppercase() == "PENDING") {
                                    Spacer(Modifier.height(12.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End
                                    ) {
                                        OutlinedButton(
                                            onClick = { viewModel.rejectVisitor(societyId, visitor.id ?: 0L) },
                                            colors = ButtonDefaults.outlinedButtonColors(
                                                contentColor = MaterialTheme.colorScheme.error
                                            )
                                        ) { Text("Reject") }
                                        Spacer(Modifier.width(8.dp))
                                        Button(
                                            onClick = { viewModel.approveVisitor(societyId, visitor.id ?: 0L) }
                                        ) { Text("Approve") }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
