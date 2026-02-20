package com.society.android.ui.visitors

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.visitor.VisitorRequest
import com.society.android.data.remote.dto.visitor.VisitorResponse
import com.society.android.domain.repository.VisitorRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VisitorViewModel @Inject constructor(
    private val repository: VisitorRepository
) : ViewModel() {

    private val _visitors = MutableStateFlow(UiState<List<VisitorResponse>>())
    val visitors: StateFlow<UiState<List<VisitorResponse>>> = _visitors.asStateFlow()

    private val _createState = MutableStateFlow(UiState<VisitorResponse>())
    val createState: StateFlow<UiState<VisitorResponse>> = _createState.asStateFlow()

    fun loadVisitors(societyId: Long) {
        viewModelScope.launch {
            _visitors.value = UiState(isLoading = true)
            when (val result = repository.getVisitors(societyId)) {
                is Resource.Success -> _visitors.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _visitors.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun createVisitor(societyId: Long, request: VisitorRequest) {
        viewModelScope.launch {
            _createState.value = UiState(isLoading = true)
            when (val result = repository.createVisitor(societyId, request)) {
                is Resource.Success -> _createState.value = UiState(data = result.data)
                is Resource.Error -> _createState.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun approveVisitor(societyId: Long, visitorId: Long) {
        viewModelScope.launch {
            when (repository.approveVisitor(societyId, visitorId)) {
                is Resource.Success -> loadVisitors(societyId)
                else -> {}
            }
        }
    }

    fun rejectVisitor(societyId: Long, visitorId: Long) {
        viewModelScope.launch {
            when (repository.rejectVisitor(societyId, visitorId)) {
                is Resource.Success -> loadVisitors(societyId)
                else -> {}
            }
        }
    }

    fun resetCreateState() { _createState.value = UiState() }
}
