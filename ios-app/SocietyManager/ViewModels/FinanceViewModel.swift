import Foundation

@MainActor
final class FinanceViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var bills: [MaintenanceBill] = []
    @Published var transactionSummary: TransactionSummary?
    @Published var complaints: [Complaint] = []
    @Published var documents: [DocumentTemplate] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var searchText = ""

    private let financeService = FinanceService.shared

    var filteredTransactions: [Transaction] {
        guard !searchText.isEmpty else { return transactions }
        return transactions.filter { t in
            (t.description?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (t.type?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    var filteredBills: [MaintenanceBill] {
        guard !searchText.isEmpty else { return bills }
        return bills.filter { b in
            (b.flatNumber?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (b.description?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    // MARK: - Load All (for overview)

    func loadAll(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            async let txns = financeService.getTransactionsBySociety(societyId)
            async let sum = financeService.getTransactionSummary(societyId)
            transactions = try await txns
            transactionSummary = try await sum
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load financial data"
        }
        isLoading = false
    }

    // MARK: - Transactions

    func loadTransactions(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            async let txns = financeService.getTransactionsBySociety(societyId)
            async let sum = financeService.getTransactionSummary(societyId)
            transactions = try await txns
            transactionSummary = try await sum
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load transactions"
        }
        isLoading = false
    }

    func createTransaction(request: TransactionRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let txn = try await financeService.createTransaction(request)
            transactions.insert(txn, at: 0)
            successMessage = "Transaction created"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create transaction"
        }
        isLoading = false
        return false
    }

    func updateTransaction(id: Int, request: TransactionRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let updated: Transaction = try await APIClient.shared.request(
                "\(AppConstants.API.Transactions.base)/\(id)", method: .put, body: request
            )
            if let index = transactions.firstIndex(where: { $0.id == id }) {
                transactions[index] = updated
            }
            successMessage = "Transaction updated"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to update transaction"
        }
        isLoading = false
        return false
    }

    func deleteTransaction(id: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            try await APIClient.shared.requestVoid(
                "\(AppConstants.API.Transactions.base)/\(id)", method: .delete
            )
            transactions.removeAll { $0.id == id }
            successMessage = "Transaction deleted"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to delete transaction"
        }
        isLoading = false
    }

    // MARK: - Bills

    func loadBills(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            bills = try await financeService.getAllBills()
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load bills"
        }
        isLoading = false
    }

    func loadBills(flatId: Int? = nil) async {
        isLoading = true
        errorMessage = nil
        do {
            if let flatId = flatId {
                bills = try await financeService.getBillsByFlat(flatId)
            } else {
                bills = try await financeService.getAllBills()
            }
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load bills"
        }
        isLoading = false
    }

    func createBill(societyId: Int, description: String, amount: Double, dueDate: String?, billMonth: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let request = MaintenanceBillRequest(flatId: 0, societyId: societyId, billMonth: billMonth, amount: amount, dueDate: dueDate)
            let bill: MaintenanceBill = try await APIClient.shared.request(
                AppConstants.API.MaintenanceBills.base, method: .post, body: request
            )
            bills.insert(bill, at: 0)
            successMessage = "Bill created"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create bill"
        }
        isLoading = false
        return false
    }

    func loadPendingBills() async {
        isLoading = true
        errorMessage = nil
        do {
            bills = try await financeService.getPendingBills()
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load pending bills"
        }
        isLoading = false
    }

    func recordPayment(billId: Int, amount: Double, paymentMode: String, referenceNumber: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let updated = try await financeService.recordPayment(billId: billId, paymentData: [
                "amount": amount,
                "paymentMode": paymentMode,
                "referenceNumber": referenceNumber as Any
            ])
            if let index = bills.firstIndex(where: { $0.id == billId }) {
                bills[index] = updated
            }
            successMessage = "Payment recorded successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to record payment"
        }
        isLoading = false
        return false
    }

    // MARK: - Complaints

    func loadComplaints(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            complaints = try await financeService.getComplaintsBySociety(societyId)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load complaints"
        }
        isLoading = false
    }

    func createComplaint(societyId: Int, title: String, description: String?, category: String?, priority: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let request = ComplaintRequest(societyId: societyId, subject: title, description: description ?? "", category: category)
            let complaint = try await financeService.createComplaint(request)
            complaints.insert(complaint, at: 0)
            successMessage = "Complaint submitted"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to submit complaint"
        }
        isLoading = false
        return false
    }

    // MARK: - Documents

    func loadDocuments(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            documents = try await financeService.getAllDocuments()
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load documents"
        }
        isLoading = false
    }

    func createDocument(societyId: Int, name: String, description: String?, content: String?) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let request = DocumentTemplateRequest(societyId: societyId, title: name, templateType: nil, content: content, isActive: true)
            let doc = try await financeService.createDocument(request)
            documents.insert(doc, at: 0)
            successMessage = "Document created"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create document"
        }
        isLoading = false
        return false
    }
}
