package com.society.android.data.remote.dto.society

data class SocietyRequest(
    val name: String,
    val address: String,
    val city: String,
    val state: String,
    val pincode: String,
    val registrationNumber: String? = null,
    val email: String? = null,
    val telephone: String? = null,
    val totalFlats: Int,
    val totalShops: Int = 0,
    val totalOffices: Int = 0,
    val totalWings: Int = 1
)

data class SocietyResponse(
    val id: Long,
    val name: String,
    val address: String?,
    val city: String?,
    val state: String?,
    val pincode: String?,
    val registrationNumber: String?,
    val email: String?,
    val telephone: String?,
    val totalFlats: Int,
    val totalShops: Int,
    val totalOffices: Int,
    val totalWings: Int,
    val actualFlats: Int?,
    val actualShops: Int?,
    val actualOffices: Int?,
    val actualWings: Int?,
    val occupiedFlats: Int?,
    val occupiedShops: Int?,
    val occupiedOffices: Int?
)
