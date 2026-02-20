package com.society.android.data.remote.dto.ticket

data class TicketRequest(
    val societyId: Long,
    val title: String,
    val description: String,
    val assignedToId: Long? = null
)

data class TicketResponse(
    val id: Long,
    val societyId: Long?,
    val societyName: String?,
    val raisedById: Long?,
    val raisedByName: String?,
    val assignedToId: Long?,
    val assignedToName: String?,
    val type: String?,
    val title: String?,
    val description: String?,
    val status: String?,
    val priority: String?,
    val resolution: String?,
    val progressPercent: Int?,
    val pendingDays: Int?,
    val isOverdue: Boolean?,
    val overdueDays: Int?,
    val escalationLevel: Int?,
    val createdAt: String?,
    val updatedAt: String?,
    val resolvedAt: String?
)
