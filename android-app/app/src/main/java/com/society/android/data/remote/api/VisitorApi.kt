package com.society.android.data.remote.api

import com.society.android.data.remote.dto.visitor.*
import com.society.android.data.remote.dto.common.*
import retrofit2.Response
import retrofit2.http.*

interface VisitorApi {

    @GET("visitors/society/{societyId}")
    suspend fun getVisitorsBySociety(@Path("societyId") societyId: Long): Response<List<VisitorResponse>>

    @GET("visitors/society/{societyId}/today")
    suspend fun getTodaysVisitors(@Path("societyId") societyId: Long): Response<List<VisitorResponse>>

    @GET("visitors/{id}")
    suspend fun getVisitorById(@Path("id") id: Long): Response<VisitorResponse>

    @POST("visitors")
    suspend fun createVisitor(@Body request: VisitorRequest): Response<VisitorResponse>

    @PATCH("visitors/{id}/check-in")
    suspend fun checkInVisitor(@Path("id") id: Long): Response<VisitorResponse>

    @PATCH("visitors/{id}/check-out")
    suspend fun checkOutVisitor(@Path("id") id: Long): Response<VisitorResponse>

    @DELETE("visitors/{id}")
    suspend fun deleteVisitor(@Path("id") id: Long): Response<Unit>

    // Documents
    @GET("document-templates")
    suspend fun getDocumentTemplates(): Response<List<DocumentTemplateResponse>>

    @GET("document-templates/{id}")
    suspend fun getDocumentTemplate(@Path("id") id: Long): Response<DocumentTemplateResponse>

    // Emergency Contacts
    @GET("emergency-contacts/society/{societyId}")
    suspend fun getEmergencyContacts(@Path("societyId") societyId: Long): Response<List<EmergencyContactResponse>>

    // Banners
    @GET("banners/active/{societyId}")
    suspend fun getActiveBanners(@Path("societyId") societyId: Long): Response<List<BannerResponse>>
}
