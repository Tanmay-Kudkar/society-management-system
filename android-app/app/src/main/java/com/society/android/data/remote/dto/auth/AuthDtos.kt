package com.society.android.data.remote.dto.auth

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String,
    @SerializedName("portalType") val portalType: String = "MOBILE",
    val rememberMe: Boolean = true
)

data class LoginResponse(
    val id: Long,
    val name: String,
    val email: String,
    val role: String,
    val accountType: String?,
    val societyId: Long?,
    val flatId: Long?,
    val token: String,
    val tokenType: String = "Bearer"
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val token: String,
    val newPassword: String
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)
