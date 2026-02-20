package com.society.android.data.remote.api

import com.society.android.data.remote.dto.notice.*
import retrofit2.Response
import retrofit2.http.*

interface NoticeApi {

    @GET("notices/society/{societyId}")
    suspend fun getNoticesBySociety(@Path("societyId") societyId: Long): Response<List<NoticeResponse>>

    @GET("notices/{id}")
    suspend fun getNoticeById(@Path("id") id: Long): Response<NoticeResponse>

    @POST("notices")
    suspend fun createNotice(@Body request: NoticeRequest): Response<NoticeResponse>

    @PUT("notices/{id}")
    suspend fun updateNotice(@Path("id") id: Long, @Body request: NoticeRequest): Response<NoticeResponse>

    @DELETE("notices/{id}")
    suspend fun deleteNotice(@Path("id") id: Long): Response<Unit>
}
