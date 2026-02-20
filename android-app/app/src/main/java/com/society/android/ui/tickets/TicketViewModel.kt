package com.society.android.ui.tickets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.ticket.TicketRequest
import com.society.android.data.remote.dto.ticket.TicketResponse
import com.society.android.domain.repository.TicketRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TicketViewModel @Inject constructor(
    private val repository: TicketRepository
) : ViewModel() {

    private val _tickets = MutableStateFlow(UiState<List<TicketResponse>>())
    val tickets: StateFlow<UiState<List<TicketResponse>>> = _tickets.asStateFlow()

    private val _createState = MutableStateFlow(UiState<TicketResponse>())
    val createState: StateFlow<UiState<TicketResponse>> = _createState.asStateFlow()

    fun loadTickets(societyId: Long) {
        viewModelScope.launch {
            _tickets.value = UiState(isLoading = true)
            when (val result = repository.getTickets(societyId)) {
                is Resource.Success -> _tickets.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _tickets.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun createTicket(societyId: Long, request: TicketRequest) {
        viewModelScope.launch {
            _createState.value = UiState(isLoading = true)
            when (val result = repository.createTicket(societyId, request)) {
                is Resource.Success -> _createState.value = UiState(data = result.data)
                is Resource.Error -> _createState.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun updateTicketStatus(societyId: Long, ticketId: Long, status: String) {
        viewModelScope.launch {
            when (repository.updateTicketStatus(societyId, ticketId, status)) {
                is Resource.Success -> loadTickets(societyId)
                else -> {}
            }
        }
    }

    fun resetCreateState() { _createState.value = UiState() }
}
