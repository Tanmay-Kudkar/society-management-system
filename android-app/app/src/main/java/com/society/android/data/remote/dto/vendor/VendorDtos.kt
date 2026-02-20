package com.society.android.data.remote.dto.vendor

data class VendorRequest(
    val societyId: Long?,
    val name: String,
    val serviceType: String,
    val contactPerson: String? = null,
    val contactPersonPhone: String? = null,
    val contactPersonEmail: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val address: String? = null,
    val gstNumber: String? = null,
    val panNumber: String? = null,
    val bankName: String? = null,
    val accountNumber: String? = null,
    val ifscCode: String? = null
)

data class VendorResponse(
    val id: Long,
    val societyId: Long?,
    val societyName: String?,
    val name: String,
    val serviceType: String?,
    val contactPerson: String?,
    val contactPersonPhone: String?,
    val contactPersonEmail: String?,
    val phone: String?,
    val email: String?,
    val address: String?,
    val gstNumber: String?,
    val panNumber: String?,
    val bankName: String?,
    val accountNumber: String?,
    val ifscCode: String?,
    val approvalStatus: String?,
    val isActive: Boolean?,
    val createdAt: String?,
    val createdByUserId: Long?,
    val createdByRole: String?
)

data class VendorBillRequest(
    val vendorId: Long,
    val societyId: Long,
    val billNumber: String? = null,
    val amount: Double,
    val paidAmount: Double = 0.0,
    val billDate: String? = null,
    val dueDate: String? = null,
    val description: String? = null,
    val paymentMode: String? = null,
    val referenceNumber: String? = null
)

data class VendorBillResponse(
    val id: Long,
    val vendorId: Long?,
    val vendorName: String?,
    val societyId: Long?,
    val societyName: String?,
    val billNumber: String?,
    val amount: Double?,
    val paidAmount: Double?,
    val pendingAmount: Double?,
    val billDate: String?,
    val dueDate: String?,
    val description: String?,
    val status: String?,
    val paymentMode: String?,
    val referenceNumber: String?,
    val pendingDays: Int?,
    val createdAt: String?,
    val paidAt: String?
)
