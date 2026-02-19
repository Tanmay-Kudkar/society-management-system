import Foundation

// MARK: - Role

enum UserRole: String, Codable, CaseIterable, Identifiable {
    case masterAdmin = "MASTER_ADMIN"
    case societyAdmin = "SOCIETY_ADMIN"
    case chairman = "CHAIRMAN"
    case secretary = "SECRETARY"
    case treasurer = "TREASURER"
    case committee = "COMMITTEE"
    case manager = "MANAGER"
    case employee = "EMPLOYEE"
    case member = "MEMBER"
    case tenant = "TENANT"
    case vendor = "VENDOR"
    case visitor = "VISITOR"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .masterAdmin: return "Super Admin"
        case .societyAdmin: return "Society Admin"
        case .chairman: return "Chairman"
        case .secretary: return "Secretary"
        case .treasurer: return "Treasurer"
        case .committee: return "Committee"
        case .manager: return "Manager"
        case .employee: return "Employee"
        case .member: return "Member"
        case .tenant: return "Tenant"
        case .vendor: return "Vendor"
        case .visitor: return "Visitor"
        }
    }

    var icon: String {
        switch self {
        case .masterAdmin: return "shield.checkered"
        case .societyAdmin: return "person.badge.shield.checkmark"
        case .chairman: return "crown.fill"
        case .secretary: return "doc.text.fill"
        case .treasurer: return "indianrupeesign.circle.fill"
        case .committee: return "person.3.fill"
        case .manager: return "briefcase.fill"
        case .employee: return "person.badge.key.fill"
        case .member: return "house.fill"
        case .tenant: return "key.fill"
        case .vendor: return "wrench.and.screwdriver.fill"
        case .visitor: return "figure.wave"
        }
    }

    var level: Int {
        switch self {
        case .masterAdmin: return 0
        case .societyAdmin: return 1
        case .chairman, .secretary, .treasurer: return 2
        case .committee, .manager: return 3
        case .employee, .member: return 4
        case .tenant, .vendor: return 5
        case .visitor: return 6
        }
    }

    var isAdmin: Bool { level <= 1 }
    var isCommittee: Bool { level <= 3 }
    var canManageUsers: Bool { level <= 3 && self != .manager }
    var canManageFinance: Bool { [.masterAdmin, .societyAdmin, .chairman, .secretary, .treasurer].contains(self) }
    var canManageVendors: Bool { level <= 3 }
    var canCreateNotices: Bool { level <= 3 }
    var canManageDocuments: Bool { level <= 3 }
}
