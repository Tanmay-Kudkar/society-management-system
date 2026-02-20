package com.society.android.data.remote.api

import com.society.android.data.remote.dto.society.*
import retrofit2.Response
import retrofit2.http.*

interface SocietyApi {

    @GET("societies")
    suspend fun getAllSocieties(): Response<List<SocietyResponse>>

    @GET("societies/{id}")
    suspend fun getSocietyById(@Path("id") id: Long): Response<SocietyResponse>

    @POST("societies")
    suspend fun createSociety(@Body request: SocietyRequest): Response<SocietyResponse>

    @PUT("societies/{id}")
    suspend fun updateSociety(@Path("id") id: Long, @Body request: SocietyRequest): Response<SocietyResponse>

    @DELETE("societies/{id}")
    suspend fun deleteSociety(@Path("id") id: Long): Response<Unit>
}
