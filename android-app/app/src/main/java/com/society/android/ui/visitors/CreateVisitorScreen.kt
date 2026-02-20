package com.society.android.ui.visitors

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.society.android.data.remote.dto.visitor.VisitorRequest
import com.society.android.ui.components.LoadingButton
import com.society.android.ui.dashboard.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateVisitorScreen(
    onBack: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: VisitorViewModel = hiltViewModel(),
    dashboardViewModel: DashboardViewModel = hiltViewModel()
) {
    var name by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var purpose by remember { mutableStateOf("") }
    var flatNumber by remember { mutableStateOf("") }

    val createState by viewModel.createState.collectAsState()
    val societyId = dashboardViewModel.getSocietyId()

    LaunchedEffect(createState.data) {
        if (createState.data != null) {
            viewModel.resetCreateState()
            onSuccess()
        }
    }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(createState.error) {
        createState.error?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Log Visitor") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Visitor Name") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            OutlinedTextField(
                value = phoneNumber,
                onValueChange = { phoneNumber = it },
                label = { Text("Phone Number") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            OutlinedTextField(
                value = purpose,
                onValueChange = { purpose = it },
                label = { Text("Purpose of Visit") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            OutlinedTextField(
                value = flatNumber,
                onValueChange = { flatNumber = it },
                label = { Text("Visiting Unit (e.g., A-101)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )

            Spacer(Modifier.height(8.dp))

            LoadingButton(
                text = "Log Visitor",
                isLoading = createState.isLoading,
                enabled = name.isNotBlank() && purpose.isNotBlank(),
                onClick = {
                    viewModel.createVisitor(
                        societyId,
                        VisitorRequest(
                            name = name,
                            phoneNumber = phoneNumber.ifBlank { null },
                            purpose = purpose,
                            flatNumber = flatNumber.ifBlank { null }
                        )
                    )
                }
            )
        }
    }
}
