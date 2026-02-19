import XCTest
@testable import SocietyManager

// MARK: - Role Permission Tests

final class RoleTests: XCTestCase {

    // MARK: - Role Hierarchy

    func testMasterAdminIsHighestLevel() {
        XCTAssertEqual(UserRole.masterAdmin.level, 0)
    }

    func testVisitorIsLowestLevel() {
        XCTAssertEqual(UserRole.visitor.level, 6)
    }

    func testRoleHierarchyOrder() {
        let orderedRoles: [UserRole] = [
            .masterAdmin, .societyAdmin, .chairman, .secretary,
            .treasurer, .committee, .manager, .employee,
            .member, .tenant, .vendor, .visitor
        ]
        for i in 0..<orderedRoles.count - 1 {
            XCTAssertLessThanOrEqual(
                orderedRoles[i].level,
                orderedRoles[i + 1].level,
                "\(orderedRoles[i]) should be >= \(orderedRoles[i + 1]) in hierarchy"
            )
        }
    }

    // MARK: - Admin Access

    func testAdminRolesAreAdmin() {
        XCTAssertTrue(UserRole.masterAdmin.isAdmin)
        XCTAssertTrue(UserRole.societyAdmin.isAdmin)
    }

    func testNonAdminRoles() {
        let nonAdmins: [UserRole] = [.chairman, .secretary, .treasurer, .committee, .manager, .employee, .member, .tenant, .vendor, .visitor]
        for role in nonAdmins {
            XCTAssertFalse(role.isAdmin, "\(role) should not be admin")
        }
    }

    // MARK: - Committee Access

    func testCommitteeAccess() {
        let committeeRoles: [UserRole] = [.masterAdmin, .societyAdmin, .chairman, .secretary, .treasurer, .committee, .manager]
        for role in committeeRoles {
            XCTAssertTrue(role.isCommittee, "\(role) should have committee access")
        }
    }

    func testNonCommitteeAccess() {
        let nonCommittee: [UserRole] = [.employee, .member, .tenant, .vendor, .visitor]
        for role in nonCommittee {
            XCTAssertFalse(role.isCommittee, "\(role) should not have committee access")
        }
    }

    // MARK: - User Management

    func testCanManageUsers() {
        let allowed: [UserRole] = [.masterAdmin, .societyAdmin, .chairman, .secretary, .treasurer, .committee]
        for role in allowed {
            XCTAssertTrue(role.canManageUsers, "\(role) should manage users")
        }
    }

    func testManagerCannotManageUsers() {
        XCTAssertFalse(UserRole.manager.canManageUsers, "Manager should not manage users")
    }

    func testMemberCannotManageUsers() {
        XCTAssertFalse(UserRole.member.canManageUsers)
    }

    // MARK: - Finance Management

    func testCanManageFinance() {
        let allowed: [UserRole] = [.masterAdmin, .societyAdmin, .chairman, .secretary, .treasurer]
        for role in allowed {
            XCTAssertTrue(role.canManageFinance, "\(role) should manage finance")
        }
    }

    func testCommitteeCannotManageFinance() {
        XCTAssertFalse(UserRole.committee.canManageFinance)
    }

    func testMemberCannotManageFinance() {
        XCTAssertFalse(UserRole.member.canManageFinance)
    }

    // MARK: - Vendor Management

    func testCanManageVendors() {
        let allowed: [UserRole] = [.masterAdmin, .societyAdmin, .chairman, .secretary, .treasurer, .committee, .manager]
        for role in allowed {
            XCTAssertTrue(role.canManageVendors, "\(role) should manage vendors")
        }
    }

    func testMemberCannotManageVendors() {
        XCTAssertFalse(UserRole.member.canManageVendors)
    }

    // MARK: - Notice Creation

    func testCanCreateNotices() {
        let allowed: [UserRole] = [.masterAdmin, .societyAdmin, .chairman, .secretary, .treasurer, .committee, .manager]
        for role in allowed {
            XCTAssertTrue(role.canCreateNotices, "\(role) should create notices")
        }
    }

    func testMemberCannotCreateNotices() {
        XCTAssertFalse(UserRole.member.canCreateNotices)
    }

    // MARK: - Display Properties

    func testAllRolesHaveDisplayNames() {
        for role in UserRole.allCases {
            XCTAssertFalse(role.displayName.isEmpty, "\(role) should have a display name")
        }
    }

    func testAllRolesHaveIcons() {
        for role in UserRole.allCases {
            XCTAssertFalse(role.icon.isEmpty, "\(role) should have an icon")
        }
    }

    // MARK: - Raw Value Encoding

    func testRoleRawValues() {
        XCTAssertEqual(UserRole.masterAdmin.rawValue, "MASTER_ADMIN")
        XCTAssertEqual(UserRole.societyAdmin.rawValue, "SOCIETY_ADMIN")
        XCTAssertEqual(UserRole.member.rawValue, "MEMBER")
        XCTAssertEqual(UserRole.vendor.rawValue, "VENDOR")
    }

    func testRoleDecodingFromRawValue() {
        XCTAssertEqual(UserRole(rawValue: "MASTER_ADMIN"), .masterAdmin)
        XCTAssertEqual(UserRole(rawValue: "MEMBER"), .member)
        XCTAssertNil(UserRole(rawValue: "INVALID"))
    }
}

// MARK: - Model Encoding Tests

final class ModelTests: XCTestCase {

    func testLoginRequestEncoding() throws {
        let request = LoginRequest(email: "test@example.com", password: "pass123", rememberMe: true)
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        XCTAssertEqual(json["email"] as? String, "test@example.com")
        XCTAssertEqual(json["password"] as? String, "pass123")
        XCTAssertEqual(json["rememberMe"] as? Bool, true)
    }

    func testLoginResponseDecoding() throws {
        let json = """
        {"token":"jwt123","role":"SOCIETY_ADMIN","userId":1,"email":"admin@test.com","name":"Admin"}
        """
        let data = json.data(using: .utf8)!
        let response = try JSONDecoder().decode(LoginResponse.self, from: data)
        XCTAssertEqual(response.token, "jwt123")
        XCTAssertEqual(response.role, "SOCIETY_ADMIN")
        XCTAssertEqual(response.userId, 1)
        XCTAssertEqual(response.email, "admin@test.com")
        XCTAssertEqual(response.name, "Admin")
    }

    func testUserDecoding() throws {
        let json = """
        {"id":1,"name":"John Doe","email":"john@test.com","role":"MEMBER","phone":"1234567890","societyId":1}
        """
        let data = json.data(using: .utf8)!
        let user = try JSONDecoder().decode(User.self, from: data)
        XCTAssertEqual(user.id, 1)
        XCTAssertEqual(user.name, "John Doe")
        XCTAssertEqual(user.email, "john@test.com")
        XCTAssertEqual(user.role, "MEMBER")
    }

    func testTransactionDecoding() throws {
        let json = """
        {"id":1,"type":"INCOME","amount":5000.0,"description":"Maintenance","category":"Maintenance","transactionDate":"2025-01-15","societyId":1}
        """
        let data = json.data(using: .utf8)!
        let txn = try JSONDecoder().decode(Transaction.self, from: data)
        XCTAssertEqual(txn.id, 1)
        XCTAssertEqual(txn.type, "INCOME")
        XCTAssertEqual(txn.amount, 5000.0)
        XCTAssertEqual(txn.description, "Maintenance")
    }

    func testMaintenanceBillComputedProperties() throws {
        let json = """
        {"id":1,"totalAmount":5000.0,"paidAmount":3000.0,"description":"Jan Maintenance","societyId":1}
        """
        let data = json.data(using: .utf8)!
        let bill = try JSONDecoder().decode(MaintenanceBill.self, from: data)
        XCTAssertFalse(bill.isPaid)
        XCTAssertEqual(bill.outstandingAmount, 2000.0)
    }

    func testFullyPaidBill() throws {
        let json = """
        {"id":2,"totalAmount":5000.0,"paidAmount":5000.0,"description":"Feb Maintenance","societyId":1}
        """
        let data = json.data(using: .utf8)!
        let bill = try JSONDecoder().decode(MaintenanceBill.self, from: data)
        XCTAssertTrue(bill.isPaid)
        XCTAssertEqual(bill.outstandingAmount, 0.0)
    }

    func testVendorApprovalStatus() throws {
        let json = """
        {"id":1,"name":"ABC Corp","approvalStatus":"PENDING","email":"abc@test.com","societyId":1}
        """
        let data = json.data(using: .utf8)!
        let vendor = try JSONDecoder().decode(Vendor.self, from: data)
        XCTAssertEqual(vendor.approvalStatus, "PENDING")
    }

    func testNoticeDecoding() throws {
        let json = """
        {"id":1,"title":"Water Shutdown","content":"Water supply will be shut","isActive":true,"societyId":1}
        """
        let data = json.data(using: .utf8)!
        let notice = try JSONDecoder().decode(Notice.self, from: data)
        XCTAssertEqual(notice.title, "Water Shutdown")
        XCTAssertTrue(notice.isActive ?? false)
    }
}

// MARK: - Validator Tests

final class ValidatorTests: XCTestCase {

    func testValidEmails() {
        XCTAssertTrue(Validators.isValidEmail("test@example.com"))
        XCTAssertTrue(Validators.isValidEmail("user.name@domain.co.in"))
        XCTAssertTrue(Validators.isValidEmail("a@b.co"))
    }

    func testInvalidEmails() {
        XCTAssertFalse(Validators.isValidEmail(""))
        XCTAssertFalse(Validators.isValidEmail("notanemail"))
        XCTAssertFalse(Validators.isValidEmail("@domain.com"))
        XCTAssertFalse(Validators.isValidEmail("test@"))
    }

    func testValidPasswords() {
        XCTAssertTrue(Validators.isValidPassword("password123"))
        XCTAssertTrue(Validators.isValidPassword("12345678"))
    }

    func testInvalidPasswords() {
        XCTAssertFalse(Validators.isValidPassword(""))
        XCTAssertFalse(Validators.isValidPassword("short"))
        XCTAssertFalse(Validators.isValidPassword("1234567")) // 7 chars
    }

    func testValidPhones() {
        XCTAssertTrue(Validators.isValidPhone("1234567890"))
        XCTAssertTrue(Validators.isValidPhone("+911234567890"))
    }

    func testInvalidPhones() {
        XCTAssertFalse(Validators.isValidPhone(""))
        XCTAssertFalse(Validators.isValidPhone("123"))
        XCTAssertFalse(Validators.isValidPhone("abcdefghij"))
    }

    func testRequiredFieldValidation() {
        XCTAssertTrue(Validators.isNotEmpty("hello"))
        XCTAssertFalse(Validators.isNotEmpty(""))
        XCTAssertFalse(Validators.isNotEmpty("   "))
    }
}

// MARK: - Currency Formatting Tests

final class ExtensionTests: XCTestCase {

    func testCurrencyFormatting() {
        let amount: Double = 1500.50
        let formatted = amount.currencyFormatted
        XCTAssertTrue(formatted.contains("₹"), "Should contain rupee symbol")
        XCTAssertTrue(formatted.contains("1,500") || formatted.contains("1500"), "Should contain amount")
    }

    func testZeroCurrencyFormatting() {
        let zero: Double = 0.0
        let formatted = zero.currencyFormatted
        XCTAssertTrue(formatted.contains("₹"))
    }
}

// MARK: - API Configuration Tests

final class ConstantsTests: XCTestCase {

    func testBaseURLIsConfigured() {
        XCTAssertFalse(AppConstants.API.baseURL.isEmpty)
        XCTAssertTrue(AppConstants.API.baseURL.hasPrefix("http"))
    }

    func testAuthEndpoints() {
        XCTAssertEqual(AppConstants.API.Auth.login, "/api/auth/login")
        XCTAssertEqual(AppConstants.API.Auth.register, "/api/auth/register")
        XCTAssertEqual(AppConstants.API.Auth.logout, "/api/auth/logout")
    }

    func testStorageKeys() {
        XCTAssertFalse(AppConstants.StorageKeys.userId.isEmpty)
        XCTAssertFalse(AppConstants.StorageKeys.userRole.isEmpty)
    }
}
