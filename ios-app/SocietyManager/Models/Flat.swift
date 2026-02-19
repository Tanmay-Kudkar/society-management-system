import Foundation

struct Flat: Codable, Identifiable, Hashable {
    let id: Int
    let societyId: Int?
    let societyName: String?
    let wingId: Int?
    let wingName: String?
    let flatNumber: String
    let unitType: String?
    let floor: Int?
    let ownerName: String?
    let ownerEmail: String?
    let ownerPhone: String?
    let ownerId: Int?
    let isOccupied: Bool?
    let createdAt: String?

    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    static func == (lhs: Flat, rhs: Flat) -> Bool { lhs.id == rhs.id }
}

struct FlatRequest: Encodable {
    let societyId: Int
    let wingId: Int?
    let flatNumber: String
    let unitType: String?
    let floor: Int?
    let ownerName: String?
    let ownerEmail: String?
    let ownerPhone: String?
    let ownerId: Int?
}

struct Wing: Codable, Identifiable {
    let id: Int
    let societyId: Int?
    let name: String?
    let description: String?
    let totalFloors: Int?
    let createdAt: String?
}
