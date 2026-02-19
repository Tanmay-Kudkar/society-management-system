import Foundation

struct MaintenanceBill: Codable, Identifiable {
    let id: Int
    let flatId: Int?
    let flatNumber: String?
    let wingName: String?
    let societyId: Int?
    let societyName: String?
    let billNumber: String?
    let billMonth: String?
    let amount: Double?
    let subtotal: Double?
    let taxAmount: Double?
    let interestAmount: Double?
    let penaltyAmount: Double?
    let totalAmount: Double?
    let previousBalance: Double?
    let advanceBalance: Double?
    let paidAmount: Double?
    let status: String?
    let dueDate: String?
    let paymentDate: String?
    let receiptNumber: String?
    let referenceNumber: String?
    let lineItems: [BillLineItem]?
    let createdAt: String?
    let paidAt: String?

    var isPaid: Bool {
        status?.uppercased() == "PAID"
    }

    var outstandingAmount: Double {
        (totalAmount ?? 0) - (paidAmount ?? 0)
    }
}

struct BillLineItem: Codable, Identifiable {
    let id: Int
    let chargeType: String?
    let description: String?
    let rate: Double?
    let quantity: Double?
    let amount: Double?
    let isTaxable: Bool?
    let displayOrder: Int?
}

struct MaintenanceBillRequest: Encodable {
    let flatId: Int
    let societyId: Int
    let billMonth: String?
    let amount: Double
    let dueDate: String?
}

struct Complaint: Codable, Identifiable {
    let id: Int
    let complaintNumber: String?
    let userId: Int?
    let userName: String?
    let societyId: Int?
    let societyName: String?
    let subject: String?
    let description: String?
    let category: String?
    let status: String?
    let resolution: String?
    let createdAt: String?
}

struct ComplaintRequest: Encodable {
    let societyId: Int
    let subject: String
    let description: String
    let category: String?
}

struct Ticket: Codable, Identifiable {
    let id: Int
    let title: String?
    let description: String?
    let status: String?
    let priority: String?
    let resolution: String?
    let raisedById: Int?
    let raisedByName: String?
    let assignedToId: Int?
    let assignedToName: String?
    let societyId: Int?
    let isOverdue: Bool?
    let overdueDays: Int?
    let createdAt: String?
    let updatedAt: String?
    let resolvedAt: String?
}

struct DocumentTemplate: Codable, Identifiable {
    let id: Int
    let societyId: Int?
    let title: String?
    let templateType: String?
    let content: String?
    let isActive: Bool?
    let createdAt: String?
    let updatedAt: String?
}

struct DocumentTemplateRequest: Encodable {
    let societyId: Int?
    let title: String
    let templateType: String?
    let content: String?
    let isActive: Bool
}

// MARK: - Bulk Import Response

struct BulkImportResponse: Codable {
    let successCount: Int?
    let failureCount: Int?
    let totalCount: Int?
    let errors: [ImportError]?
    let successRows: [ImportSuccessRow]?
}

struct ImportError: Codable, Identifiable {
    var id: String { "\(row ?? 0)-\(field ?? "")" }
    let row: Int?
    let field: String?
    let message: String?
    let value: String?
}

struct ImportSuccessRow: Codable, Identifiable {
    var id: Int { row ?? 0 }
    let row: Int?
    let name: String?
    let email: String?
}

// MARK: - Dashboard Report

struct DashboardReport: Codable {
    let totalFlats: Int?
    let occupiedFlats: Int?
    let totalMembers: Int?
    let totalTenants: Int?
    let pendingBills: Int?
    let totalIncome: Double?
    let totalExpense: Double?
    let openTickets: Int?
    let activeNotices: Int?
    let pendingVendors: Int?
    let overdueTickets: Int?
}
