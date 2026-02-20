package com.society.android.data.remote.dto.complaint

data class ComplaintRequest(
    val societyId: Long,
    val subject: String,
    val description: String,
    val category: String? = null
)

data class ComplaintResponse(
    val id: Long,
    val complaintNumber: String?,
    val userId: Long?,
    val raisedByName: String?,
    val societyId: Long?,
    val societyName: String?,
    val subject: String?,
    val description: String?,
    val category: String?,
    val status: String?,
    val resolution: String?,
    val createdAt: String?
)
