package com.society.android.data.remote.dto.notice

data class NoticeRequest(
    val societyId: Long,
    val title: String,
    val content: String,
    val expiryDate: String? = null
)

data class NoticeResponse(
    val id: Long,
    val societyId: Long?,
    val societyName: String?,
    val title: String,
    val content: String?,
    val priority: String?,
    val expiryDate: String?,
    val isActive: Boolean?,
    val createdAt: String?
)
