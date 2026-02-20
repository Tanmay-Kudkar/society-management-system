package com.society.android.data.remote.dto.common

data class ErrorResponse(
    val timestamp: String?,
    val status: Int?,
    val error: String?,
    val message: String?,
    val path: String?
)

data class DocumentTemplateResponse(
    val id: Long,
    val templateType: String?,
    val title: String?,
    val content: String?,
    val isActive: Boolean?,
    val createdAt: String?,
    val updatedAt: String?
)

data class EmergencyContactResponse(
    val id: Long,
    val societyId: Long?,
    val societyName: String?,
    val name: String?,
    val phone: String?,
    val alternatePhone: String?,
    val address: String?,
    val notes: String?,
    val contactType: String?,
    val isActive: Boolean?,
    val createdAt: String?
)

data class BannerResponse(
    val id: Long,
    val title: String?,
    val imageUrl: String?,
    val redirectUrl: String?,
    val startDate: String?,
    val endDate: String?,
    val isActive: Boolean?,
    val displayOrder: Int?,
    val societyId: Long?,
    val societyName: String?,
    val createdAt: String?
)

data class TenantResponse(
    val id: Long,
    val flatId: Long?,
    val flatNumber: String?,
    val societyId: Long?,
    val name: String?,
    val phone: String?,
    val email: String?,
    val agreementStartDate: String?,
    val agreementEndDate: String?,
    val rentAmount: Double?,
    val depositAmount: Double?,
    val idProofType: String?,
    val idProofNumber: String?,
    val isActive: Boolean?,
    val createdAt: String?
)

data class VehicleResponse(
    val id: Long,
    val flatId: Long?,
    val flatNumber: String?,
    val societyId: Long?,
    val vehicleType: String?,
    val vehicleNumber: String?,
    val brand: String?,
    val model: String?,
    val color: String?,
    val ownerName: String?,
    val parkingSlot: String?,
    val createdAt: String?
)

data class FinancialReportResponse(
    val societyId: Long?,
    val societyName: String?,
    val startDate: String?,
    val endDate: String?,
    val totalIncome: Double?,
    val totalExpense: Double?,
    val netBalance: Double?
)
