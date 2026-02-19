import Foundation

struct Transaction: Codable, Identifiable {
    let id: Int
    let societyId: Int?
    let societyName: String?
    let amount: Double?
    let transactionType: String?
    let paymentMode: String?
    let description: String?
    let chequeNumber: String?
    let bankName: String?
    let chequeDate: String?
    let relatedBillId: Int?
    let relatedBillType: String?
    let transactionDate: String?
    let createdBy: String?
    let createdAt: String?
}

struct TransactionRequest: Encodable {
    let societyId: Int
    let amount: Double
    let transactionType: String
    let paymentMode: String
    let description: String?
    let transactionDate: String?
}

struct TransactionSummary: Codable {
    let totalIncome: Double?
    let totalExpense: Double?
    let netBalance: Double?
    let transactionCount: Int?
}
