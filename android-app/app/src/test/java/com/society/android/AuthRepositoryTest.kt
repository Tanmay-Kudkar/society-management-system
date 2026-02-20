package com.society.android

import com.society.android.data.remote.dto.auth.LoginRequest
import com.society.android.data.remote.dto.auth.LoginResponse
import com.society.android.data.remote.api.AuthApi
import com.society.android.data.local.TokenManager
import com.society.android.domain.repository.AuthRepository
import com.society.android.utils.Resource
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import retrofit2.Response

class AuthRepositoryTest {

    @Mock
    private lateinit var authApi: AuthApi

    @Mock
    private lateinit var tokenManager: TokenManager

    private lateinit var repository: AuthRepository

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        repository = AuthRepository(authApi, tokenManager)
    }

    @Test
    fun `login success saves session`() = runTest {
        val loginResponse = LoginResponse(
            token = "test-token",
            userId = 1L,
            email = "test@test.com",
            role = "MEMBER",
            firstName = "Test",
            lastName = "User",
            societyId = 1L
        )
        `when`(authApi.login(LoginRequest("test@test.com", "password")))
            .thenReturn(Response.success(loginResponse))

        val result = repository.login(LoginRequest("test@test.com", "password"))

        assertTrue(result is Resource.Success)
        verify(tokenManager).saveSession("test-token", 1L, "MEMBER", 1L)
    }

    @Test
    fun `logout clears session`() = runTest {
        repository.logout()
        verify(tokenManager).clearSession()
    }

    @Test
    fun `isLoggedIn delegates to tokenManager`() {
        `when`(tokenManager.hasValidToken()).thenReturn(true)
        assertTrue(repository.isLoggedIn())

        `when`(tokenManager.hasValidToken()).thenReturn(false)
        assertFalse(repository.isLoggedIn())
    }
}
