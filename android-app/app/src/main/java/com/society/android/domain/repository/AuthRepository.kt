package com.society.android.domain.repository

import com.society.android.data.local.TokenManager
import com.society.android.data.remote.api.AuthApi
import com.society.android.data.remote.dto.auth.*
import com.society.android.data.remote.dto.user.UserResponse
import com.society.android.utils.Resource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager
) : BaseRepository() {

    suspend fun login(email: String, password: String): Resource<LoginResponse> {
        val result = safeApiCall {
            authApi.login(LoginRequest(email = email, password = password))
        }
        if (result is Resource.Success) {
            val data = result.data
            tokenManager.saveSession(
                token = data.token,
                userId = data.id,
                name = data.name,
                email = data.email,
                role = data.role,
                societyId = data.societyId,
                flatId = data.flatId
            )
        }
        return result
    }

    suspend fun logout(): Resource<Unit> {
        val result = safeApiCall { authApi.logout() }
        tokenManager.clearSession()
        return result
    }

    suspend fun getCurrentUser(): Resource<UserResponse> =
        safeApiCall { authApi.getCurrentUser() }

    suspend fun forgotPassword(email: String): Resource<Map<String, String>> =
        safeApiCall { authApi.forgotPassword(ForgotPasswordRequest(email)) }

    suspend fun changePassword(current: String, newPass: String): Resource<Map<String, String>> =
        safeApiCall { authApi.changePassword(ChangePasswordRequest(current, newPass)) }

    fun isLoggedIn(): Boolean = tokenManager.hasValidToken()

    fun getUserRole(): String = tokenManager.userRole ?: ""
    fun getUserId(): Long = tokenManager.userId
    fun getSocietyId(): Long = tokenManager.societyId
    fun getFlatId(): Long = tokenManager.flatId
    fun getUserName(): String = tokenManager.userName ?: ""
    fun getUserEmail(): String = tokenManager.userEmail ?: ""
}
