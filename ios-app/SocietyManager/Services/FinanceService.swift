import Foundation

final class FinanceService {
    static let shared = FinanceService()
    private let api = APIClient.shared
    private init() {}

    // MARK: - Transactions

    func getAllTransactions() async throws -> [Transaction] {
        try await api.request(AppConstants.API.Transactions.base)
    }

    func getTransactionsBySociety(_ societyId: Int) async throws -> [Transaction] {
        try await api.request(AppConstants.API.Transactions.bySociety(societyId))
    }

    func getTransactionSummary(_ societyId: Int) async throws -> TransactionSummary {
        try await api.request(AppConstants.API.Transactions.summary(societyId))
    }

    func createTransaction(_ request: TransactionRequest) async throws -> Transaction {
        try await api.request(AppConstants.API.Transactions.base, method: .post, body: request)
    }

    // MARK: - Maintenance Bills

    func getAllBills() async throws -> [MaintenanceBill] {
        try await api.request(AppConstants.API.MaintenanceBills.base)
    }

    func getBillsByFlat(_ flatId: Int) async throws -> [MaintenanceBill] {
        try await api.request(AppConstants.API.MaintenanceBills.byFlat(flatId))
    }

    func getPendingBills() async throws -> [MaintenanceBill] {
        try await api.request(AppConstants.API.MaintenanceBills.pending)
    }

    func getBillById(_ id: Int) async throws -> MaintenanceBill {
        try await api.request(AppConstants.API.MaintenanceBills.byId(id))
    }

    func recordPayment(billId: Int, paymentData: [String: Any]) async throws -> MaintenanceBill {
        struct PaymentPayload: Encodable {
            let amount: Double
            let paymentMode: String
            let referenceNumber: String?
        }
        let payload = PaymentPayload(
            amount: paymentData["amount"] as? Double ?? 0,
            paymentMode: paymentData["paymentMode"] as? String ?? "ONLINE",
            referenceNumber: paymentData["referenceNumber"] as? String
        )
        return try await api.request(
            AppConstants.API.MaintenanceBills.payment(billId),
            method: .post,
            body: payload
        )
    }

    // MARK: - Complaints

    func getComplaintsBySociety(_ societyId: Int) async throws -> [Complaint] {
        try await api.request(AppConstants.API.Complaints.bySociety(societyId))
    }

    func createComplaint(_ request: ComplaintRequest) async throws -> Complaint {
        try await api.request(AppConstants.API.Complaints.base, method: .post, body: request)
    }

    // MARK: - Documents

    func getAllDocuments() async throws -> [DocumentTemplate] {
        try await api.request(AppConstants.API.Documents.base)
    }

    func createDocument(_ request: DocumentTemplateRequest) async throws -> DocumentTemplate {
        try await api.request(AppConstants.API.Documents.base, method: .post, body: request)
    }

    // MARK: - Dashboard

    func getDashboard(_ societyId: Int) async throws -> DashboardReport {
        try await api.request(AppConstants.API.Reports.dashboard(societyId))
    }
}
