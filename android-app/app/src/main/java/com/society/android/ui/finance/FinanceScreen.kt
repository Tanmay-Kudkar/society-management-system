package com.society.android.ui.finance

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
fun FinanceScreen(
    navController: NavController,
    viewModel: FinanceViewModel = hiltViewModel(),
    dashboardViewModel: DashboardViewModel = hiltViewModel()
) {
    val billState by viewModel.bills.collectAsState()
    val transactionState by viewModel.transactions.collectAsState()
    val paymentState by viewModel.payments.collectAsState()
    val societyId = dashboardViewModel.getSocietyId()

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Bills", "Transactions", "Payments")

    LaunchedEffect(societyId) {
        if (societyId > 0) {
            viewModel.loadBills(societyId)
            viewModel.loadTransactions(societyId)
            viewModel.loadPayments(societyId)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Finance") })
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            TabRow(selectedTabIndex = selectedTab) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title) }
                    )
                }
            }

            when (selectedTab) {
                0 -> BillsList(billState)
                1 -> TransactionsList(transactionState)
                2 -> PaymentsList(paymentState)
            }
        }
    }
}

@Composable
private fun BillsList(state: com.society.android.utils.UiState<List<com.society.android.data.remote.dto.finance.MaintenanceBillResponse>>) {
    when {
        state.isLoading -> LoadingScreen()
        state.error != null -> ErrorScreen(message = state.error!!)
        state.data?.isEmpty() == true -> EmptyStateScreen(
            icon = Icons.Default.Receipt,
            title = "No bills",
            subtitle = "Maintenance bills will appear here"
        )
        else -> {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.data ?: emptyList()) { bill ->
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
                                    text = bill.title ?: "Bill #${bill.id}",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                StatusChip(status = bill.status ?: "UNPAID")
                            }
                            Spacer(Modifier.height(8.dp))
                            InfoRow(label = "Amount", value = Formatters.formatCurrency(bill.totalAmount))
                            InfoRow(label = "Due Date", value = Formatters.formatDate(bill.dueDate))
                            bill.flatNumber?.let { InfoRow(label = "Unit", value = it) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TransactionsList(state: com.society.android.utils.UiState<List<com.society.android.data.remote.dto.finance.TransactionResponse>>) {
    when {
        state.isLoading -> LoadingScreen()
        state.error != null -> ErrorScreen(message = state.error!!)
        state.data?.isEmpty() == true -> EmptyStateScreen(
            icon = Icons.Default.SwapHoriz,
            title = "No transactions",
            subtitle = "Transaction history will appear here"
        )
        else -> {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.data ?: emptyList()) { txn ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = txn.description ?: "Transaction",
                                    style = MaterialTheme.typography.titleSmall
                                )
                                Text(
                                    text = Formatters.formatDate(txn.date),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = Formatters.formatCurrency(txn.amount),
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (txn.type?.uppercase() == "CREDIT")
                                        com.society.android.ui.theme.StatusApproved
                                    else MaterialTheme.colorScheme.error
                                )
                                StatusChip(status = txn.status ?: "COMPLETED")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentsList(state: com.society.android.utils.UiState<List<com.society.android.data.remote.dto.finance.PaymentResponse>>) {
    when {
        state.isLoading -> LoadingScreen()
        state.error != null -> ErrorScreen(message = state.error!!)
        state.data?.isEmpty() == true -> EmptyStateScreen(
            icon = Icons.Default.Payment,
            title = "No payments",
            subtitle = "Payment records will appear here"
        )
        else -> {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.data ?: emptyList()) { payment ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = payment.paymentMethod ?: "Payment",
                                    style = MaterialTheme.typography.titleSmall
                                )
                                Text(
                                    text = Formatters.formatDate(payment.paymentDate),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                            Text(
                                text = Formatters.formatCurrency(payment.amount),
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
