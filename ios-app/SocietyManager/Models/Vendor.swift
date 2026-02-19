import Foundation

struct Vendor: Codable, Identifiable {
    let id: Int
    let name: String
    let contactPerson: String?
    let contactPersonPhone: String?
    let contactPersonEmail: String?
    let phone: String?
    let email: String?
    let address: String?
    let gstNumber: String?
    let panNumber: String?
    let bankName: String?
    let accountNumber: String?
    let ifscCode: String?
    let serviceType: String?
    let societyId: Int?
    let societyName: String?
    let approvalStatus: String?
    let createdByUserId: Int?
    let createdByRole: String?
    let isActive: Bool?
    let createdAt: String?
}

struct VendorRequest: Encodable {
    let name: String
    let contactPerson: String?
    let contactPersonPhone: String?
    let contactPersonEmail: String?
    let phone: String?
    let email: String?
    let address: String?
    let gstNumber: String?
    let panNumber: String?
    let serviceType: String?
    let societyId: Int?
}
