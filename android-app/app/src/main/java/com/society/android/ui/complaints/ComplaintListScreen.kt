package com.society.android.ui.complaints

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
import com.society.android.utils.Formatters

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComplaintListScreen(
    navController: NavController,
    onCreateComplaint: () -> Unit,
    viewModel: ComplaintViewModel = hiltViewModel(),
    dashboardViewModel: DashboardViewModel = hiltViewModel()
) {
    val state by viewModel.complaints.collectAsState()
    val societyId = dashboardViewModel.getSocietyId()

    LaunchedEffect(societyId) {
        if (societyId > 0) viewModel.loadComplaints(societyId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Complaints") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateComplaint) {
                Icon(Icons.Default.Add, contentDescription = "Raise Complaint")
            }
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingScreen(Modifier.padding(padding))
            state.error != null -> ErrorScreen(
                message = state.error!!,
                onRetry = { viewModel.loadComplaints(societyId) },
                modifier = Modifier.padding(padding)
            )
            state.data?.isEmpty() == true -> EmptyStateScreen(
                icon = Icons.Default.BugReport,
                title = "No complaints",
                subtitle = "Everything seems to be running smoothly!",
                actionLabel = "Raise Complaint",
                onAction = onCreateComplaint,
                modifier = Modifier.padding(padding)
            )
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.data ?: emptyList()) { complaint ->
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
                                        text = complaint.title ?: "Untitled",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.weight(1f)
                                    )
                                    StatusChip(status = complaint.status ?: "PENDING")
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = complaint.description ?: "",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                    maxLines = 2
                                )
                                Spacer(Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    complaint.category?.let {
                                        AssistChip(
                                            onClick = {},
                                            label = { Text(it, style = MaterialTheme.typography.labelSmall) },
                                            modifier = Modifier.height(28.dp)
                                        )
                                    }
                                    Text(
                                        text = Formatters.formatDate(complaint.createdAt),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
