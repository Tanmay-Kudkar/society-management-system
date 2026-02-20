package com.society.android.data.remote.dto.user

import com.google.gson.annotations.SerializedName

data class UserRequest(
    val name: String,
    val email: String,
    val role: String,
    val phone: String? = null
)

data class UserResponse(
    val id: Long,
    val name: String,
    val email: String,
    val role: String,
    val accountType: String?,
    val phone: String?,
    val isActive: Boolean,
    val societyId: Long?,
    val societyName: String?,
    val flatId: Long?,
    val flatNumber: String?
)

data class BulkUserImportRequest(
    val societyId: Long,
    val users: List<UserImportRow>
)

data class UserImportRow(
    val rowNumber: Int,
    val name: String,
    val email: String,
    val flatNumber: String?,
    val phone: String?,
    val role: String,
    val valid: Boolean = true,
    val errorMessage: String? = null
)

data class BulkUserImportResponse(
    val totalRows: Int,
    val successCount: Int,
    val failureCount: Int,
    val results: List<UserImportResult>?,
    val message: String?
)

data class UserImportResult(
    val rowNumber: Int,
    val email: String?,
    val success: Boolean,
    val message: String?
)
