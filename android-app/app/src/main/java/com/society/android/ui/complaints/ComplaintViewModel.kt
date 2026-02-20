package com.society.android.ui.complaints

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.complaint.ComplaintRequest
import com.society.android.data.remote.dto.complaint.ComplaintResponse
import com.society.android.domain.repository.ComplaintRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ComplaintViewModel @Inject constructor(
    private val repository: ComplaintRepository
) : ViewModel() {

    private val _complaints = MutableStateFlow(UiState<List<ComplaintResponse>>())
    val complaints: StateFlow<UiState<List<ComplaintResponse>>> = _complaints.asStateFlow()

    private val _createState = MutableStateFlow(UiState<ComplaintResponse>())
    val createState: StateFlow<UiState<ComplaintResponse>> = _createState.asStateFlow()

    fun loadComplaints(societyId: Long) {
        viewModelScope.launch {
            _complaints.value = UiState(isLoading = true)
            when (val result = repository.getComplaints(societyId)) {
                is Resource.Success -> _complaints.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _complaints.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun createComplaint(societyId: Long, request: ComplaintRequest) {
        viewModelScope.launch {
            _createState.value = UiState(isLoading = true)
            when (val result = repository.createComplaint(societyId, request)) {
                is Resource.Success -> _createState.value = UiState(data = result.data)
                is Resource.Error -> _createState.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun updateComplaintStatus(societyId: Long, complaintId: Long, status: String) {
        viewModelScope.launch {
            when (repository.updateComplaintStatus(societyId, complaintId, status)) {
                is Resource.Success -> loadComplaints(societyId)
                else -> {}
            }
        }
    }

    fun resetCreateState() { _createState.value = UiState() }
}
