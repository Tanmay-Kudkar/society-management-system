package com.society.android.data.remote.dto.visitor

data class VisitorRequest(
    val visitorName: String,
    val visitorPhone: String? = null,
    val visitorType: String = "GUEST",
    val purpose: String? = null,
    val flatId: Long? = null,
    val societyId: Long,
    val vehicleNumber: String? = null,
    val expectedArrival: String? = null,
    val isPreApproved: Boolean = false,
    val notes: String? = null
)

data class VisitorResponse(
    val id: Long,
    val visitorName: String?,
    val visitorPhone: String?,
    val visitorType: String?,
    val purpose: String?,
    val flatId: Long?,
    val flatNumber: String?,
    val societyId: Long?,
    val societyName: String?,
    val vehicleNumber: String?,
    val expectedArrival: String?,
    val checkInTime: String?,
    val checkOutTime: String?,
    val status: String?,
    val isPreApproved: Boolean?,
    val approvalCode: String?,
    val approvedByName: String?,
    val notes: String?,
    val createdAt: String?
)
