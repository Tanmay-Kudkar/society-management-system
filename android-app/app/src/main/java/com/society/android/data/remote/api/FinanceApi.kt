package com.society.android.data.remote.api

import com.society.android.data.remote.dto.finance.*
import com.society.android.data.remote.dto.common.*
import retrofit2.Response
import retrofit2.http.*

interface FinanceApi {

    // Maintenance Bills
    @GET("maintenance-bills/flat/{flatId}")
    suspend fun getBillsByFlat(@Path("flatId") flatId: Long): Response<List<MaintenanceBillResponse>>

    @GET("maintenance-bills/{id}")
    suspend fun getBillById(@Path("id") id: Long): Response<MaintenanceBillResponse>

    @GET("maintenance-bills")
    suspend fun getAllBills(): Response<List<MaintenanceBillResponse>>

    @POST("maintenance-bills")
    suspend fun createBill(@Body request: MaintenanceBillRequest): Response<MaintenanceBillResponse>

    @GET("maintenance-bills/pending")
    suspend fun getPendingBills(): Response<List<MaintenanceBillResponse>>

    // Transactions
    @GET("transactions/society/{societyId}")
    suspend fun getTransactions(@Path("societyId") societyId: Long): Response<List<TransactionResponse>>

    @GET("transactions/summary/{societyId}")
    suspend fun getTransactionSummary(@Path("societyId") societyId: Long): Response<Map<String, Any>>

    // Payments
    @GET("api/payments/user/{userId}")
    suspend fun getPaymentsByUser(@Path("userId") userId: Long): Response<List<PaymentResponse>>

    @GET("api/payments/society/{societyId}")
    suspend fun getPaymentsBySociety(@Path("societyId") societyId: Long): Response<List<PaymentResponse>>

    // Reports
    @GET("api/reports/dashboard/{societyId}")
    suspend fun getDashboardReport(@Path("societyId") societyId: Long): Response<Map<String, Any>>

    @GET("api/reports/mtd/{societyId}")
    suspend fun getMtdReport(@Path("societyId") societyId: Long): Response<FinancialReportResponse>
}
