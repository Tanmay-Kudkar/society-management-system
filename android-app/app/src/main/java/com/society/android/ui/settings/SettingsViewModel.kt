package com.society.android.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.local.SettingsDataStore
import com.society.android.data.remote.dto.auth.ChangePasswordRequest
import com.society.android.data.remote.dto.user.UserResponse
import com.society.android.domain.repository.AuthRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    val settingsDataStore: SettingsDataStore
) : ViewModel() {

    private val _profile = MutableStateFlow(UiState<UserResponse>())
    val profile: StateFlow<UiState<UserResponse>> = _profile.asStateFlow()

    private val _changePasswordState = MutableStateFlow(UiState<Unit>())
    val changePasswordState: StateFlow<UiState<Unit>> = _changePasswordState.asStateFlow()

    val isDarkMode = settingsDataStore.isDarkMode

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _profile.value = UiState(isLoading = true)
            when (val result = authRepository.getCurrentUser()) {
                is Resource.Success -> _profile.value = UiState(data = result.data)
                is Resource.Error -> _profile.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun changePassword(currentPassword: String, newPassword: String, confirmPassword: String) {
        if (newPassword != confirmPassword) {
            _changePasswordState.value = UiState(error = "Passwords don't match")
            return
        }
        if (newPassword.length < 6) {
            _changePasswordState.value = UiState(error = "Password must be at least 6 characters")
            return
        }
        viewModelScope.launch {
            _changePasswordState.value = UiState(isLoading = true)
            when (val result = authRepository.changePassword(
                ChangePasswordRequest(currentPassword, newPassword, confirmPassword)
            )) {
                is Resource.Success -> _changePasswordState.value = UiState(data = Unit)
                is Resource.Error -> _changePasswordState.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun toggleDarkMode(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setDarkMode(enabled)
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun resetChangePasswordState() { _changePasswordState.value = UiState() }
}
