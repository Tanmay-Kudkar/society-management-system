package com.society.android.domain.repository

import com.google.gson.Gson
import com.society.android.data.remote.dto.common.ErrorResponse
import com.society.android.utils.Resource
import retrofit2.Response

/**
 * Base repository with safe API call handling.
 */
abstract class BaseRepository {

    protected suspend fun <T> safeApiCall(apiCall: suspend () -> Response<T>): Resource<T> {
        return try {
            val response = apiCall()
            if (response.isSuccessful) {
                response.body()?.let {
                    Resource.Success(it)
                } ?: Resource.Error("Empty response body")
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    val error = Gson().fromJson(errorBody, ErrorResponse::class.java)
                    error?.message ?: "Unknown error"
                } catch (e: Exception) {
                    errorBody ?: "Unknown error"
                }
                Resource.Error(errorMsg, response.code())
            }
        } catch (e: java.net.ConnectException) {
            Resource.Error("Unable to connect to server. Please check your connection.")
        } catch (e: java.net.SocketTimeoutException) {
            Resource.Error("Request timed out. Please try again.")
        } catch (e: Exception) {
            Resource.Error(e.localizedMessage ?: "An unexpected error occurred")
        }
    }
}
