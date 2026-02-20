package com.society.android.data.remote.api

import com.society.android.data.remote.dto.vendor.*
import retrofit2.Response
import retrofit2.http.*

interface VendorApi {

    @GET("vendors/society/{societyId}")
    suspend fun getVendorsBySociety(@Path("societyId") societyId: Long): Response<List<VendorResponse>>

    @GET("vendors/{id}")
    suspend fun getVendorById(@Path("id") id: Long): Response<VendorResponse>

    @POST("vendors")
    suspend fun createVendor(@Body request: VendorRequest): Response<VendorResponse>

    @PUT("vendors/{id}")
    suspend fun updateVendor(@Path("id") id: Long, @Body request: VendorRequest): Response<VendorResponse>

    @PATCH("vendors/{id}/approve")
    suspend fun approveVendor(@Path("id") id: Long): Response<VendorResponse>

    @PATCH("vendors/{id}/reject")
    suspend fun rejectVendor(@Path("id") id: Long): Response<VendorResponse>

    @PATCH("vendors/{id}/deactivate")
    suspend fun deactivateVendor(@Path("id") id: Long): Response<VendorResponse>

    @GET("vendors/pending")
    suspend fun getPendingVendors(): Response<List<VendorResponse>>

    @DELETE("vendors/{id}")
    suspend fun deleteVendor(@Path("id") id: Long): Response<Unit>

    // Vendor Bills
    @GET("vendor-bills/society/{societyId}")
    suspend fun getVendorBillsBySociety(@Path("societyId") societyId: Long): Response<List<VendorBillResponse>>

    @POST("vendor-bills")
    suspend fun createVendorBill(@Body request: VendorBillRequest): Response<VendorBillResponse>
}
