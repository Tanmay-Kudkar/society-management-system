package com.society.android.data.remote.api

import com.society.android.data.remote.dto.user.*
import retrofit2.Response
import retrofit2.http.*

interface UserApi {

    @GET("users")
    suspend fun getAllUsers(): Response<List<UserResponse>>

    @GET("users/society/{societyId}")
    suspend fun getUsersBySociety(@Path("societyId") societyId: Long): Response<List<UserResponse>>

    @GET("users/{id}")
    suspend fun getUserById(@Path("id") id: Long): Response<UserResponse>

    @POST("users")
    suspend fun createUser(@Body request: UserRequest): Response<UserResponse>

    @PUT("users/{id}")
    suspend fun updateUser(@Path("id") id: Long, @Body request: UserRequest): Response<UserResponse>

    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") id: Long): Response<Unit>

    @GET("users/creatable-roles")
    suspend fun getCreatableRoles(): Response<List<String>>

    @POST("users/bulk-import")
    suspend fun bulkImportUsers(@Body request: BulkUserImportRequest): Response<BulkUserImportResponse>

    @POST("users/bulk-import/validate")
    suspend fun validateBulkImport(@Body request: BulkUserImportRequest): Response<BulkUserImportResponse>
}
