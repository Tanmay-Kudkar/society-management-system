package com.society.android.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.society.android.utils.Constants
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Secure token storage using EncryptedSharedPreferences.
 * Never stores passwords — only JWT tokens and user session data.
 */
@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        Constants.PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var token: String?
        get() = prefs.getString(Constants.KEY_TOKEN, null)
        set(value) = prefs.edit().putString(Constants.KEY_TOKEN, value).apply()

    var userId: Long
        get() = prefs.getLong(Constants.KEY_USER_ID, -1)
        set(value) = prefs.edit().putLong(Constants.KEY_USER_ID, value).apply()

    var userName: String?
        get() = prefs.getString(Constants.KEY_USER_NAME, null)
        set(value) = prefs.edit().putString(Constants.KEY_USER_NAME, value).apply()

    var userEmail: String?
        get() = prefs.getString(Constants.KEY_USER_EMAIL, null)
        set(value) = prefs.edit().putString(Constants.KEY_USER_EMAIL, value).apply()

    var userRole: String?
        get() = prefs.getString(Constants.KEY_USER_ROLE, null)
        set(value) = prefs.edit().putString(Constants.KEY_USER_ROLE, value).apply()

    var societyId: Long
        get() = prefs.getLong(Constants.KEY_SOCIETY_ID, -1)
        set(value) = prefs.edit().putLong(Constants.KEY_SOCIETY_ID, value).apply()

    var flatId: Long
        get() = prefs.getLong(Constants.KEY_FLAT_ID, -1)
        set(value) = prefs.edit().putLong(Constants.KEY_FLAT_ID, value).apply()

    var isLoggedIn: Boolean
        get() = prefs.getBoolean(Constants.KEY_IS_LOGGED_IN, false)
        set(value) = prefs.edit().putBoolean(Constants.KEY_IS_LOGGED_IN, value).apply()

    var fcmToken: String?
        get() = prefs.getString(Constants.KEY_FCM_TOKEN, null)
        set(value) = prefs.edit().putString(Constants.KEY_FCM_TOKEN, value).apply()

    fun saveSession(
        token: String,
        userId: Long,
        name: String,
        email: String,
        role: String,
        societyId: Long?,
        flatId: Long?
    ) {
        prefs.edit().apply {
            putString(Constants.KEY_TOKEN, token)
            putLong(Constants.KEY_USER_ID, userId)
            putString(Constants.KEY_USER_NAME, name)
            putString(Constants.KEY_USER_EMAIL, email)
            putString(Constants.KEY_USER_ROLE, role)
            putLong(Constants.KEY_SOCIETY_ID, societyId ?: -1)
            putLong(Constants.KEY_FLAT_ID, flatId ?: -1)
            putBoolean(Constants.KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }

    fun hasValidToken(): Boolean = !token.isNullOrBlank() && isLoggedIn
}
