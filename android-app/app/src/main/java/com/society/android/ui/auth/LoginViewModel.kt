package com.society.android.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.auth.LoginRequest
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
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _loginState = MutableStateFlow(UiState<Unit>())
    val loginState: StateFlow<UiState<Unit>> = _loginState.asStateFlow()

    val isLoggedIn: Boolean get() = authRepository.isLoggedIn()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _loginState.value = UiState(error = "Please enter email and password")
            return
        }
        viewModelScope.launch {
            _loginState.value = UiState(isLoading = true)
            when (val result = authRepository.login(LoginRequest(email.trim(), password))) {
                is Resource.Success -> _loginState.value = UiState(data = Unit)
                is Resource.Error -> _loginState.value = UiState(error = result.message ?: "Login failed")
                is Resource.Loading -> {}
            }
        }
    }

    fun forgotPassword(email: String) {
        if (email.isBlank()) return
        viewModelScope.launch {
            authRepository.forgotPassword(email.trim())
        }
    }

    fun clearError() {
        _loginState.value = _loginState.value.copy(error = null)
    }
}
