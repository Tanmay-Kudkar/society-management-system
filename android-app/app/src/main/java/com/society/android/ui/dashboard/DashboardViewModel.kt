package com.society.android.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.notice.NoticeResponse
import com.society.android.data.remote.dto.complaint.ComplaintResponse
import com.society.android.data.remote.dto.visitor.VisitorResponse
import com.society.android.domain.repository.*
import com.society.android.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardState(
    val isLoading: Boolean = false,
    val userName: String = "",
    val userRole: String = "",
    val societyId: Long = 0L,
    val notices: List<NoticeResponse> = emptyList(),
    val complaints: List<ComplaintResponse> = emptyList(),
    val visitors: List<VisitorResponse> = emptyList(),
    val totalUsers: Int = 0,
    val totalFlats: Int = 0,
    val pendingComplaints: Int = 0,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val noticeRepository: NoticeRepository,
    private val complaintRepository: ComplaintRepository,
    private val visitorRepository: VisitorRepository,
    private val managementRepository: ManagementRepository
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardState())
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)

            // Load current user info
            when (val user = authRepository.getCurrentUser()) {
                is Resource.Success -> {
                    val u = user.data!!
                    _state.value = _state.value.copy(
                        userName = "${u.firstName ?: ""} ${u.lastName ?: ""}".trim(),
                        userRole = u.role ?: "",
                        societyId = u.societyId ?: 0L
                    )
                    loadModuleData(u.societyId ?: 0L)
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = user.message)
                }
                else -> {}
            }
        }
    }

    private suspend fun loadModuleData(societyId: Long) {
        if (societyId <= 0L) {
            _state.value = _state.value.copy(isLoading = false)
            return
        }

        // Load notices
        when (val notices = noticeRepository.getNotices(societyId)) {
            is Resource.Success -> _state.value = _state.value.copy(
                notices = notices.data?.take(5) ?: emptyList()
            )
            else -> {}
        }

        // Load complaints
        when (val complaints = complaintRepository.getComplaints(societyId)) {
            is Resource.Success -> {
                val list = complaints.data ?: emptyList()
                _state.value = _state.value.copy(
                    complaints = list.take(5),
                    pendingComplaints = list.count { it.status?.uppercase() == "PENDING" || it.status?.uppercase() == "IN_PROGRESS" }
                )
            }
            else -> {}
        }

        // Load visitors
        when (val visitors = visitorRepository.getVisitors(societyId)) {
            is Resource.Success -> _state.value = _state.value.copy(
                visitors = visitors.data?.take(5) ?: emptyList()
            )
            else -> {}
        }

        // Load users count
        when (val users = managementRepository.getUsers(societyId)) {
            is Resource.Success -> _state.value = _state.value.copy(
                totalUsers = users.data?.size ?: 0
            )
            else -> {}
        }

        // Load flats count
        when (val flats = managementRepository.getFlats(societyId)) {
            is Resource.Success -> _state.value = _state.value.copy(
                totalFlats = flats.data?.size ?: 0
            )
            else -> {}
        }

        _state.value = _state.value.copy(isLoading = false)
    }

    fun getUserRole() = authRepository.getCurrentRole()
    fun getSocietyId() = authRepository.getCurrentSocietyId()

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
