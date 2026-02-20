package com.society.android.ui.notices

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
fun NoticeListScreen(
    navController: NavController,
    onCreateNotice: () -> Unit,
    viewModel: NoticeViewModel = hiltViewModel(),
    dashboardViewModel: DashboardViewModel = hiltViewModel()
) {
    val state by viewModel.notices.collectAsState()
    val societyId = dashboardViewModel.getSocietyId()

    LaunchedEffect(societyId) {
        if (societyId > 0) viewModel.loadNotices(societyId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notices") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateNotice) {
                Icon(Icons.Default.Add, contentDescription = "Create Notice")
            }
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingScreen(Modifier.padding(padding))
            state.error != null -> ErrorScreen(
                message = state.error!!,
                onRetry = { viewModel.loadNotices(societyId) },
                modifier = Modifier.padding(padding)
            )
            state.data?.isEmpty() == true -> EmptyStateScreen(
                icon = Icons.Default.Notifications,
                title = "No notices yet",
                subtitle = "Create a notice to keep everyone informed",
                actionLabel = "Create Notice",
                onAction = onCreateNotice,
                modifier = Modifier.padding(padding)
            )
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.data ?: emptyList()) { notice ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = notice.title ?: "Untitled",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.weight(1f)
                                    )
                                    notice.priority?.let {
                                        StatusChip(status = it)
                                    }
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = notice.content ?: "",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                    maxLines = 3
                                )
                                Spacer(Modifier.height(12.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "By ${notice.createdByName ?: "Admin"}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                    Text(
                                        text = Formatters.formatDateTime(notice.createdAt),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
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
