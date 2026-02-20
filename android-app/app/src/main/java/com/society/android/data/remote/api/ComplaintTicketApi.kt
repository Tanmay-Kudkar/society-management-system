package com.society.android.data.remote.api

import com.society.android.data.remote.dto.complaint.*
import com.society.android.data.remote.dto.ticket.*
import retrofit2.Response
import retrofit2.http.*

interface ComplaintApi {

    @GET("complaints/society/{societyId}")
    suspend fun getComplaintsBySociety(@Path("societyId") societyId: Long): Response<List<ComplaintResponse>>

    @GET("complaints/user/{userId}")
    suspend fun getComplaintsByUser(@Path("userId") userId: Long): Response<List<ComplaintResponse>>

    @GET("complaints/{id}")
    suspend fun getComplaintById(@Path("id") id: Long): Response<ComplaintResponse>

    @POST("complaints")
    suspend fun createComplaint(@Body request: ComplaintRequest): Response<ComplaintResponse>

    @PATCH("complaints/{id}/status")
    suspend fun updateComplaintStatus(
        @Path("id") id: Long,
        @Query("status") status: String
    ): Response<ComplaintResponse>

    @DELETE("complaints/{id}")
    suspend fun deleteComplaint(@Path("id") id: Long): Response<Unit>
}

interface TicketApi {

    @GET("tickets/society/{societyId}")
    suspend fun getTicketsBySociety(@Path("societyId") societyId: Long): Response<List<TicketResponse>>

    @GET("tickets/raised-by/{userId}")
    suspend fun getTicketsByUser(@Path("userId") userId: Long): Response<List<TicketResponse>>

    @GET("tickets/{id}")
    suspend fun getTicketById(@Path("id") id: Long): Response<TicketResponse>

    @POST("tickets")
    suspend fun createTicket(@Body request: TicketRequest): Response<TicketResponse>

    @PUT("tickets/{id}")
    suspend fun updateTicket(@Path("id") id: Long, @Body request: TicketRequest): Response<TicketResponse>

    @PATCH("tickets/{id}/status")
    suspend fun updateTicketStatus(
        @Path("id") id: Long,
        @Query("status") status: String
    ): Response<TicketResponse>

    @PATCH("tickets/{id}/assign")
    suspend fun assignTicket(
        @Path("id") id: Long,
        @Query("assigneeId") assigneeId: Long
    ): Response<TicketResponse>

    @DELETE("tickets/{id}")
    suspend fun deleteTicket(@Path("id") id: Long): Response<Unit>
}
