package com.society.android.ui.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.finance.*
import com.society.android.domain.repository.FinanceRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FinanceViewModel @Inject constructor(
    private val repository: FinanceRepository
) : ViewModel() {

    private val _bills = MutableStateFlow(UiState<List<MaintenanceBillResponse>>())
    val bills: StateFlow<UiState<List<MaintenanceBillResponse>>> = _bills.asStateFlow()

    private val _transactions = MutableStateFlow(UiState<List<TransactionResponse>>())
    val transactions: StateFlow<UiState<List<TransactionResponse>>> = _transactions.asStateFlow()

    private val _payments = MutableStateFlow(UiState<List<PaymentResponse>>())
    val payments: StateFlow<UiState<List<PaymentResponse>>> = _payments.asStateFlow()

    fun loadBills(societyId: Long) {
        viewModelScope.launch {
            _bills.value = UiState(isLoading = true)
            when (val result = repository.getBills(societyId)) {
                is Resource.Success -> _bills.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _bills.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun loadTransactions(societyId: Long) {
        viewModelScope.launch {
            _transactions.value = UiState(isLoading = true)
            when (val result = repository.getTransactions(societyId)) {
                is Resource.Success -> _transactions.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _transactions.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun loadPayments(societyId: Long) {
        viewModelScope.launch {
            _payments.value = UiState(isLoading = true)
            when (val result = repository.getPayments(societyId)) {
                is Resource.Success -> _payments.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _payments.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun createBill(societyId: Long, request: MaintenanceBillRequest) {
        viewModelScope.launch {
            when (repository.createBill(societyId, request)) {
                is Resource.Success -> loadBills(societyId)
                else -> {}
            }
        }
    }
}
