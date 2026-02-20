package com.society.android.domain.repository

import com.society.android.data.remote.api.*
import com.society.android.data.remote.dto.society.*
import com.society.android.data.remote.dto.flat.*
import com.society.android.data.remote.dto.user.*
import com.society.android.utils.Resource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ManagementRepository @Inject constructor(
    private val userApi: UserApi,
    private val flatApi: FlatApi,
    private val societyApi: SocietyApi
) : BaseRepository() {

    // Users
    suspend fun getUsersBySociety(societyId: Long): Resource<List<UserResponse>> =
        safeApiCall { userApi.getUsersBySociety(societyId) }

    suspend fun getUserById(id: Long): Resource<UserResponse> =
        safeApiCall { userApi.getUserById(id) }

    suspend fun createUser(request: UserRequest): Resource<UserResponse> =
        safeApiCall { userApi.createUser(request) }

    suspend fun updateUser(id: Long, request: UserRequest): Resource<UserResponse> =
        safeApiCall { userApi.updateUser(id, request) }

    suspend fun deleteUser(id: Long): Resource<Unit> =
        safeApiCall { userApi.deleteUser(id) }

    suspend fun getCreatableRoles(): Resource<List<String>> =
        safeApiCall { userApi.getCreatableRoles() }

    suspend fun bulkImportUsers(request: BulkUserImportRequest): Resource<BulkUserImportResponse> =
        safeApiCall { userApi.bulkImportUsers(request) }

    suspend fun validateBulkImport(request: BulkUserImportRequest): Resource<BulkUserImportResponse> =
        safeApiCall { userApi.validateBulkImport(request) }

    // Flats
    suspend fun getFlatsBySociety(societyId: Long): Resource<List<FlatResponse>> =
        safeApiCall { flatApi.getFlatsBySociety(societyId) }

    suspend fun getFlatById(id: Long): Resource<FlatResponse> =
        safeApiCall { flatApi.getFlatById(id) }

    suspend fun createFlat(request: FlatRequest): Resource<FlatResponse> =
        safeApiCall { flatApi.createFlat(request) }

    suspend fun updateFlat(id: Long, request: FlatRequest): Resource<FlatResponse> =
        safeApiCall { flatApi.updateFlat(id, request) }

    suspend fun deleteFlat(id: Long): Resource<Unit> =
        safeApiCall { flatApi.deleteFlat(id) }

    // Wings
    suspend fun getWingsBySociety(societyId: Long): Resource<List<WingResponse>> =
        safeApiCall { flatApi.getWingsBySociety(societyId) }

    // Society
    suspend fun getSocietyById(id: Long): Resource<SocietyResponse> =
        safeApiCall { societyApi.getSocietyById(id) }

    suspend fun getAllSocieties(): Resource<List<SocietyResponse>> =
        safeApiCall { societyApi.getAllSocieties() }
}
