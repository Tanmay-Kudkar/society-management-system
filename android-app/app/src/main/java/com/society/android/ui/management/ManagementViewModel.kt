package com.society.android.ui.management

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.flat.FlatResponse
import com.society.android.data.remote.dto.flat.WingResponse
import com.society.android.data.remote.dto.user.UserResponse
import com.society.android.domain.repository.ManagementRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ManagementViewModel @Inject constructor(
    private val repository: ManagementRepository
) : ViewModel() {

    private val _users = MutableStateFlow(UiState<List<UserResponse>>())
    val users: StateFlow<UiState<List<UserResponse>>> = _users.asStateFlow()

    private val _flats = MutableStateFlow(UiState<List<FlatResponse>>())
    val flats: StateFlow<UiState<List<FlatResponse>>> = _flats.asStateFlow()

    private val _wings = MutableStateFlow(UiState<List<WingResponse>>())
    val wings: StateFlow<UiState<List<WingResponse>>> = _wings.asStateFlow()

    fun loadUsers(societyId: Long) {
        viewModelScope.launch {
            _users.value = UiState(isLoading = true)
            when (val result = repository.getUsers(societyId)) {
                is Resource.Success -> _users.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _users.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun loadFlats(societyId: Long) {
        viewModelScope.launch {
            _flats.value = UiState(isLoading = true)
            when (val result = repository.getFlats(societyId)) {
                is Resource.Success -> _flats.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _flats.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun loadWings(societyId: Long) {
        viewModelScope.launch {
            _wings.value = UiState(isLoading = true)
            when (val result = repository.getWings(societyId)) {
                is Resource.Success -> _wings.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _wings.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun deleteUser(societyId: Long, userId: Long) {
        viewModelScope.launch {
            when (repository.deleteUser(societyId, userId)) {
                is Resource.Success -> loadUsers(societyId)
                else -> {}
            }
        }
    }
}
