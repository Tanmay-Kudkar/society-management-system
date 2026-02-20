package com.society.android.data.remote.dto.finance

data class MaintenanceBillRequest(
    val flatId: Long,
    val amount: Double,
    val dueDate: String? = null,
    val lineItems: List<BillLineItemRequest>? = null,
    val paidAmount: Double? = null,
    val paymentMode: String? = null,
    val referenceNumber: String? = null
)

data class BillLineItemRequest(
    val chargeType: String,
    val description: String? = null,
    val rate: Double? = null,
    val quantity: Double? = null,
    val amount: Double,
    val isTaxable: Boolean = false,
    val displayOrder: Int = 0
)

data class MaintenanceBillResponse(
    val id: Long,
    val flatId: Long?,
    val flatNumber: String?,
    val ownerName: String?,
    val societyId: Long?,
    val societyName: String?,
    val billMonth: String?,
    val billNumber: String?,
    val amount: Double?,
    val subtotal: Double?,
    val taxAmount: Double?,
    val interestAmount: Double?,
    val penaltyAmount: Double?,
    val totalAmount: Double?,
    val previousBalance: Double?,
    val advanceBalance: Double?,
    val paidAmount: Double?,
    val pendingAmount: Double?,
    val dueDate: String?,
    val paymentDate: String?,
    val status: String?,
    val paymentMode: String?,
    val receiptNumber: String?,
    val referenceNumber: String?,
    val createdAt: String?,
    val paidAt: String?,
    val lineItems: List<BillLineItemResponse>?
)

data class BillLineItemResponse(
    val id: Long,
    val chargeType: String?,
    val description: String?,
    val rate: Double?,
    val quantity: Double?,
    val amount: Double?,
    val isTaxable: Boolean?,
    val displayOrder: Int?
)

data class TransactionResponse(
    val id: Long,
    val societyId: Long?,
    val societyName: String?,
    val amount: Double?,
    val description: String?,
    val transactionDate: String?,
    val transactionType: String?,
    val paymentMode: String?,
    val category: String?,
    val referenceNumber: String?,
    val flatId: Long?,
    val createdAt: String?
)

data class PaymentResponse(
    val id: Long,
    val razorpayOrderId: String?,
    val razorpayPaymentId: String?,
    val amount: Double?,
    val currency: String?,
    val status: String?,
    val paymentType: String?,
    val paymentMethod: String?,
    val description: String?,
    val receiptNumber: String?,
    val maintenanceBillId: Long?,
    val userId: Long?,
    val userName: String?,
    val societyId: Long?,
    val societyName: String?,
    val createdAt: String?,
    val paidAt: String?,
    val errorCode: String?,
    val errorDescription: String?
)
