package com.society.android.domain.repository

import com.society.android.data.remote.api.*
import com.society.android.data.remote.dto.notice.*
import com.society.android.data.remote.dto.complaint.*
import com.society.android.data.remote.dto.ticket.*
import com.society.android.data.remote.dto.vendor.*
import com.society.android.data.remote.dto.finance.*
import com.society.android.data.remote.dto.visitor.*
import com.society.android.data.remote.dto.common.*
import com.society.android.utils.Resource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NoticeRepository @Inject constructor(
    private val noticeApi: NoticeApi
) : BaseRepository() {
    suspend fun getNoticesBySociety(societyId: Long): Resource<List<NoticeResponse>> =
        safeApiCall { noticeApi.getNoticesBySociety(societyId) }

    suspend fun getNoticeById(id: Long): Resource<NoticeResponse> =
        safeApiCall { noticeApi.getNoticeById(id) }

    suspend fun createNotice(request: NoticeRequest): Resource<NoticeResponse> =
        safeApiCall { noticeApi.createNotice(request) }

    suspend fun updateNotice(id: Long, request: NoticeRequest): Resource<NoticeResponse> =
        safeApiCall { noticeApi.updateNotice(id, request) }

    suspend fun deleteNotice(id: Long): Resource<Unit> =
        safeApiCall { noticeApi.deleteNotice(id) }
}

@Singleton
class ComplaintRepository @Inject constructor(
    private val complaintApi: ComplaintApi
) : BaseRepository() {
    suspend fun getComplaintsBySociety(societyId: Long): Resource<List<ComplaintResponse>> =
        safeApiCall { complaintApi.getComplaintsBySociety(societyId) }

    suspend fun getComplaintsByUser(userId: Long): Resource<List<ComplaintResponse>> =
        safeApiCall { complaintApi.getComplaintsByUser(userId) }

    suspend fun createComplaint(request: ComplaintRequest): Resource<ComplaintResponse> =
        safeApiCall { complaintApi.createComplaint(request) }

    suspend fun updateStatus(id: Long, status: String): Resource<ComplaintResponse> =
        safeApiCall { complaintApi.updateComplaintStatus(id, status) }

    suspend fun deleteComplaint(id: Long): Resource<Unit> =
        safeApiCall { complaintApi.deleteComplaint(id) }
}

@Singleton
class TicketRepository @Inject constructor(
    private val ticketApi: TicketApi
) : BaseRepository() {
    suspend fun getTicketsBySociety(societyId: Long): Resource<List<TicketResponse>> =
        safeApiCall { ticketApi.getTicketsBySociety(societyId) }

    suspend fun getTicketsByUser(userId: Long): Resource<List<TicketResponse>> =
        safeApiCall { ticketApi.getTicketsByUser(userId) }

    suspend fun createTicket(request: TicketRequest): Resource<TicketResponse> =
        safeApiCall { ticketApi.createTicket(request) }

    suspend fun updateTicket(id: Long, request: TicketRequest): Resource<TicketResponse> =
        safeApiCall { ticketApi.updateTicket(id, request) }

    suspend fun updateStatus(id: Long, status: String): Resource<TicketResponse> =
        safeApiCall { ticketApi.updateTicketStatus(id, status) }

    suspend fun deleteTicket(id: Long): Resource<Unit> =
        safeApiCall { ticketApi.deleteTicket(id) }
}

@Singleton
class VendorRepository @Inject constructor(
    private val vendorApi: VendorApi
) : BaseRepository() {
    suspend fun getVendorsBySociety(societyId: Long): Resource<List<VendorResponse>> =
        safeApiCall { vendorApi.getVendorsBySociety(societyId) }

    suspend fun getVendorById(id: Long): Resource<VendorResponse> =
        safeApiCall { vendorApi.getVendorById(id) }

    suspend fun createVendor(request: VendorRequest): Resource<VendorResponse> =
        safeApiCall { vendorApi.createVendor(request) }

    suspend fun updateVendor(id: Long, request: VendorRequest): Resource<VendorResponse> =
        safeApiCall { vendorApi.updateVendor(id, request) }

    suspend fun approveVendor(id: Long): Resource<VendorResponse> =
        safeApiCall { vendorApi.approveVendor(id) }

    suspend fun rejectVendor(id: Long): Resource<VendorResponse> =
        safeApiCall { vendorApi.rejectVendor(id) }

    suspend fun getPendingVendors(): Resource<List<VendorResponse>> =
        safeApiCall { vendorApi.getPendingVendors() }

    suspend fun deleteVendor(id: Long): Resource<Unit> =
        safeApiCall { vendorApi.deleteVendor(id) }
}

@Singleton
class FinanceRepository @Inject constructor(
    private val financeApi: FinanceApi
) : BaseRepository() {
    suspend fun getBillsByFlat(flatId: Long): Resource<List<MaintenanceBillResponse>> =
        safeApiCall { financeApi.getBillsByFlat(flatId) }

    suspend fun getAllBills(): Resource<List<MaintenanceBillResponse>> =
        safeApiCall { financeApi.getAllBills() }

    suspend fun getPendingBills(): Resource<List<MaintenanceBillResponse>> =
        safeApiCall { financeApi.getPendingBills() }

    suspend fun createBill(request: MaintenanceBillRequest): Resource<MaintenanceBillResponse> =
        safeApiCall { financeApi.createBill(request) }

    suspend fun getPaymentsByUser(userId: Long): Resource<List<PaymentResponse>> =
        safeApiCall { financeApi.getPaymentsByUser(userId) }

    suspend fun getTransactions(societyId: Long): Resource<List<TransactionResponse>> =
        safeApiCall { financeApi.getTransactions(societyId) }

    suspend fun getDashboardReport(societyId: Long): Resource<Map<String, Any>> =
        safeApiCall { financeApi.getDashboardReport(societyId) }
}

@Singleton
class VisitorRepository @Inject constructor(
    private val visitorApi: VisitorApi
) : BaseRepository() {
    suspend fun getVisitorsBySociety(societyId: Long): Resource<List<VisitorResponse>> =
        safeApiCall { visitorApi.getVisitorsBySociety(societyId) }

    suspend fun getTodaysVisitors(societyId: Long): Resource<List<VisitorResponse>> =
        safeApiCall { visitorApi.getTodaysVisitors(societyId) }

    suspend fun createVisitor(request: VisitorRequest): Resource<VisitorResponse> =
        safeApiCall { visitorApi.createVisitor(request) }

    suspend fun checkInVisitor(id: Long): Resource<VisitorResponse> =
        safeApiCall { visitorApi.checkInVisitor(id) }

    suspend fun checkOutVisitor(id: Long): Resource<VisitorResponse> =
        safeApiCall { visitorApi.checkOutVisitor(id) }

    suspend fun getDocumentTemplates(): Resource<List<DocumentTemplateResponse>> =
        safeApiCall { visitorApi.getDocumentTemplates() }

    suspend fun getEmergencyContacts(societyId: Long): Resource<List<EmergencyContactResponse>> =
        safeApiCall { visitorApi.getEmergencyContacts(societyId) }

    suspend fun getActiveBanners(societyId: Long): Resource<List<BannerResponse>> =
        safeApiCall { visitorApi.getActiveBanners(societyId) }
}
