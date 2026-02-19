import Foundation

enum AppConstants {
    // MARK: - API
    enum API {
        /// Change to your backend URL. For physical device use your Mac's IP, not localhost.
        #if DEBUG
        static let baseURL = "http://172.20.10.3:8080"
        #else
        static let baseURL = "https://your-production-url.com"
        #endif

        static let timeout: TimeInterval = 30

        enum Auth {
            static let login       = "/auth/login"
            static let register    = "/auth/register"
            static let logout      = "/auth/logout"
            static let me          = "/auth/me"
            static let forgotPassword  = "/auth/forgot-password"
            static let resetPassword   = "/auth/reset-password"
            static let changePassword  = "/auth/change-password"
        }

        enum Users {
            static let base            = "/users"
            static func byId(_ id: Int) -> String { "/users/\(id)" }
            static func bySociety(_ id: Int) -> String { "/users/society/\(id)" }
            static let creatableRoles  = "/users/creatable-roles"
            static let updatableRoles  = "/users/updatable-roles"
            static func bulkCreate(_ societyId: Int) -> String { "/users/bulk-create/\(societyId)" }
            static let bulkImportValidate = "/users/bulk-import/validate"
            static let bulkImport      = "/users/bulk-import"
            static let bulkImportTemplate = "/users/bulk-import/template"
        }

        enum Societies {
            static let base = "/societies"
            static func byId(_ id: Int) -> String { "/societies/\(id)" }
        }

        enum SocietySettings {
            static func byId(_ societyId: Int) -> String { "/society-settings/\(societyId)" }
        }

        enum Flats {
            static let base = "/flats"
            static func byId(_ id: Int) -> String { "/flats/\(id)" }
            static func bySociety(_ id: Int) -> String { "/flats/society/\(id)" }
            static let bulkImportValidate = "/flats/bulk-import/validate"
            static let bulkImport = "/flats/bulk-import"
            static let bulkImportTemplate = "/flats/bulk-import/template"
        }

        enum Wings {
            static let base = "/api/wings"
            static func byId(_ id: Int) -> String { "/api/wings/\(id)" }
            static func bySociety(_ id: Int) -> String { "/api/wings/society/\(id)" }
        }

        enum Notices {
            static let base = "/notices"
            static func byId(_ id: Int) -> String { "/notices/\(id)" }
            static func bySociety(_ id: Int) -> String { "/notices/society/\(id)" }
        }

        enum Tickets {
            static let base = "/tickets"
            static func byId(_ id: Int) -> String { "/tickets/\(id)" }
            static func bySociety(_ id: Int) -> String { "/tickets/society/\(id)" }
        }

        enum Complaints {
            static let base = "/complaints"
            static func byId(_ id: Int) -> String { "/complaints/\(id)" }
            static func bySociety(_ id: Int) -> String { "/complaints/society/\(id)" }
        }

        enum Vendors {
            static let base = "/vendors"
            static func byId(_ id: Int) -> String { "/vendors/\(id)" }
            static func bySociety(_ id: Int) -> String { "/vendors/society/\(id)" }
            static let pending = "/vendors/pending"
            static func approve(_ id: Int) -> String { "/vendors/\(id)/approve" }
            static func reject(_ id: Int) -> String { "/vendors/\(id)/reject" }
        }

        enum Transactions {
            static let base = "/transactions"
            static func byId(_ id: Int) -> String { "/transactions/\(id)" }
            static func bySociety(_ id: Int) -> String { "/transactions/society/\(id)" }
            static func summary(_ societyId: Int) -> String { "/transactions/summary/\(societyId)" }
            static func summaryByCategory(_ societyId: Int) -> String { "/transactions/summary/\(societyId)/by-category" }
        }

        enum MaintenanceBills {
            static let base = "/maintenance-bills"
            static func byId(_ id: Int) -> String { "/maintenance-bills/\(id)" }
            static func byFlat(_ flatId: Int) -> String { "/maintenance-bills/flat/\(flatId)" }
            static let pending = "/maintenance-bills/pending"
            static func payment(_ id: Int) -> String { "/maintenance-bills/\(id)/payment" }
        }

        enum Payments {
            static let createOrder = "/api/payments/create-order"
            static let verify      = "/api/payments/verify"
            static func byUser(_ userId: Int) -> String { "/api/payments/user/\(userId)" }
            static func bySociety(_ societyId: Int) -> String { "/api/payments/society/\(societyId)" }
        }

        enum Documents {
            static let base = "/document-templates"
            static func byId(_ id: Int) -> String { "/document-templates/\(id)" }
            static func generate(_ id: Int) -> String { "/document-templates/\(id)/generate" }
        }

        enum Reports {
            static func dashboard(_ societyId: Int) -> String { "/api/reports/dashboard/\(societyId)" }
            static func mtd(_ societyId: Int) -> String { "/api/reports/mtd/\(societyId)" }
            static func ytd(_ societyId: Int) -> String { "/api/reports/ytd/\(societyId)" }
        }
    }

    // MARK: - Storage Keys
    enum StorageKeys {
        static let userId = "user_id"
        static let userRole = "user_role"
        static let societyId = "society_id"
        static let flatId = "flat_id"
        static let userName = "user_name"
        static let userEmail = "user_email"
        static let hasCompletedOnboarding = "has_completed_onboarding"
    }

    // MARK: - UI
    enum UI {
        static let cornerRadius: CGFloat = 12
        static let cardPadding: CGFloat = 16
        static let animationDuration: Double = 0.3
    }
}
