import Foundation

struct Society: Codable, Identifiable {
    let id: Int
    let name: String
    let address: String?
    let city: String?
    let state: String?
    let pincode: String?
    let registrationNumber: String?
    let email: String?
    let telephone: String?
    let totalFlats: Int?
    let totalShops: Int?
    let totalOffices: Int?
    let totalWings: Int?
    let createdAt: String?
}

struct SocietyRequest: Encodable {
    let name: String
    let address: String?
    let city: String?
    let state: String?
    let pincode: String?
    let registrationNumber: String?
    let email: String?
    let telephone: String?
    let totalFlats: Int?
    let totalShops: Int?
    let totalOffices: Int?
    let totalWings: Int?
}

struct SocietySetting: Codable {
    let id: Int?
    let societyId: Int?
    let maintenanceRatePerSqft: Double?
    let waterChargesFixed: Double?
    let sinkingFundPerSqft: Double?
    let gstPercentage: Double?
    let latePaymentInterestPct: Double?
    let gracePeriodDays: Int?
    let billGenerationDay: Int?
    let dueDateDay: Int?
}
