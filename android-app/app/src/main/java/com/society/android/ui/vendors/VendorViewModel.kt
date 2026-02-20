package com.society.android.ui.vendors

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.vendor.VendorRequest
import com.society.android.data.remote.dto.vendor.VendorResponse
import com.society.android.domain.repository.VendorRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VendorViewModel @Inject constructor(
    private val repository: VendorRepository
) : ViewModel() {

    private val _vendors = MutableStateFlow(UiState<List<VendorResponse>>())
    val vendors: StateFlow<UiState<List<VendorResponse>>> = _vendors.asStateFlow()

    private val _createState = MutableStateFlow(UiState<VendorResponse>())
    val createState: StateFlow<UiState<VendorResponse>> = _createState.asStateFlow()

    fun loadVendors(societyId: Long) {
        viewModelScope.launch {
            _vendors.value = UiState(isLoading = true)
            when (val result = repository.getVendors(societyId)) {
                is Resource.Success -> _vendors.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _vendors.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun loadPendingVendors(societyId: Long) {
        viewModelScope.launch {
            _vendors.value = UiState(isLoading = true)
            when (val result = repository.getPendingVendors(societyId)) {
                is Resource.Success -> _vendors.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _vendors.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun createVendor(societyId: Long, request: VendorRequest) {
        viewModelScope.launch {
            _createState.value = UiState(isLoading = true)
            when (val result = repository.createVendor(societyId, request)) {
                is Resource.Success -> _createState.value = UiState(data = result.data)
                is Resource.Error -> _createState.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun approveVendor(societyId: Long, vendorId: Long) {
        viewModelScope.launch {
            when (repository.approveVendor(societyId, vendorId)) {
                is Resource.Success -> loadVendors(societyId)
                else -> {}
            }
        }
    }

    fun rejectVendor(societyId: Long, vendorId: Long) {
        viewModelScope.launch {
            when (repository.rejectVendor(societyId, vendorId)) {
                is Resource.Success -> loadVendors(societyId)
                else -> {}
            }
        }
    }

    fun resetCreateState() { _createState.value = UiState() }
}
