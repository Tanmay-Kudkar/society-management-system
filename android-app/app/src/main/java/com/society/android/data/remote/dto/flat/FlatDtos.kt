package com.society.android.data.remote.dto.flat

data class FlatRequest(
    val societyId: Long,
    val wingId: Long?,
    val flatNumber: String,
    val unitType: String = "FLAT",
    val flatType: String? = null,
    val floor: Int? = null,
    val area: Double? = null,
    val ownerName: String? = null,
    val ownerEmail: String? = null,
    val ownerPhone: String? = null
)

data class FlatResponse(
    val id: Long,
    val societyId: Long,
    val societyName: String?,
    val wingId: Long?,
    val wingName: String?,
    val flatNumber: String,
    val unitType: String?,
    val flatType: String?,
    val floor: Int?,
    val area: Double?,
    val ownerName: String?,
    val ownerEmail: String?,
    val ownerPhone: String?,
    val ownerUserId: Long?,
    val isOccupied: Boolean?
)

data class WingRequest(
    val societyId: Long,
    val name: String,
    val description: String? = null,
    val totalFloors: Int? = null
)

data class WingResponse(
    val id: Long,
    val societyId: Long?,
    val societyName: String?,
    val name: String,
    val description: String?,
    val totalFloors: Int?,
    val flatCount: Int?,
    val shopCount: Int?,
    val officeCount: Int?,
    val createdAt: String?
)
