package com.society.android.data.remote.api

import com.society.android.data.remote.dto.flat.*
import retrofit2.Response
import retrofit2.http.*

interface FlatApi {

    @GET("flats/society/{societyId}")
    suspend fun getFlatsBySociety(@Path("societyId") societyId: Long): Response<List<FlatResponse>>

    @GET("flats/{id}")
    suspend fun getFlatById(@Path("id") id: Long): Response<FlatResponse>

    @POST("flats")
    suspend fun createFlat(@Body request: FlatRequest): Response<FlatResponse>

    @PUT("flats/{id}")
    suspend fun updateFlat(@Path("id") id: Long, @Body request: FlatRequest): Response<FlatResponse>

    @DELETE("flats/{id}")
    suspend fun deleteFlat(@Path("id") id: Long): Response<Unit>

    @GET("api/wings/society/{societyId}")
    suspend fun getWingsBySociety(@Path("societyId") societyId: Long): Response<List<WingResponse>>

    @POST("api/wings")
    suspend fun createWing(@Body request: WingRequest): Response<WingResponse>
}
