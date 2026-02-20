package com.society.android.ui.notices

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.society.android.data.remote.dto.notice.NoticeRequest
import com.society.android.data.remote.dto.notice.NoticeResponse
import com.society.android.domain.repository.NoticeRepository
import com.society.android.utils.Resource
import com.society.android.utils.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NoticeViewModel @Inject constructor(
    private val repository: NoticeRepository
) : ViewModel() {

    private val _notices = MutableStateFlow(UiState<List<NoticeResponse>>())
    val notices: StateFlow<UiState<List<NoticeResponse>>> = _notices.asStateFlow()

    private val _createState = MutableStateFlow(UiState<NoticeResponse>())
    val createState: StateFlow<UiState<NoticeResponse>> = _createState.asStateFlow()

    fun loadNotices(societyId: Long) {
        viewModelScope.launch {
            _notices.value = UiState(isLoading = true)
            when (val result = repository.getNotices(societyId)) {
                is Resource.Success -> _notices.value = UiState(data = result.data ?: emptyList())
                is Resource.Error -> _notices.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun createNotice(societyId: Long, request: NoticeRequest) {
        viewModelScope.launch {
            _createState.value = UiState(isLoading = true)
            when (val result = repository.createNotice(societyId, request)) {
                is Resource.Success -> _createState.value = UiState(data = result.data)
                is Resource.Error -> _createState.value = UiState(error = result.message)
                is Resource.Loading -> {}
            }
        }
    }

    fun deleteNotice(societyId: Long, noticeId: Long) {
        viewModelScope.launch {
            when (repository.deleteNotice(societyId, noticeId)) {
                is Resource.Success -> loadNotices(societyId)
                else -> {}
            }
        }
    }

    fun resetCreateState() {
        _createState.value = UiState()
    }
}
