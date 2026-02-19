import Foundation

struct Notice: Codable, Identifiable {
    let id: Int
    let societyId: Int?
    let societyName: String?
    let title: String
    let content: String?
    let expiryDate: String?
    let isActive: Bool?
    let createdAt: String?
}

struct NoticeRequest: Encodable {
    let societyId: Int
    let title: String
    let content: String
    let expiryDate: String?
    let isActive: Bool
}
