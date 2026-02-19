import Foundation

struct User: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let email: String
    let phone: String?
    let role: UserRole
    let accountType: String?
    let societyId: Int?
    let societyName: String?
    let flatId: Int?
    let flatNumber: String?
    let wingName: String?
    let isActive: Bool?
    let createdAt: String?

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    static func == (lhs: User, rhs: User) -> Bool { lhs.id == rhs.id }
}

struct UserRequest: Encodable {
    let name: String
    let email: String
    let password: String?
    let phone: String?
    let role: String
    let societyId: Int?
    let flatId: Int?
}
