import Foundation

// MARK: - Login

struct LoginRequest: Encodable {
    let email: String
    let password: String
    let portalType: String = "MOBILE"
    let rememberMe: Bool = true
}

struct LoginResponse: Decodable {
    let id: Int
    let name: String
    let email: String
    let role: UserRole
    let accountType: String?
    let societyId: Int?
    let flatId: Int?
    let token: String
    let tokenType: String?
}

// MARK: - Register

struct RegisterRequest: Encodable {
    let name: String
    let email: String
    let password: String
    let role: String
}

// MARK: - Password

struct ForgotPasswordRequest: Encodable {
    let email: String
}

struct ResetPasswordRequest: Encodable {
    let token: String
    let newPassword: String
}

struct ChangePasswordRequest: Encodable {
    let currentPassword: String
    let newPassword: String
}

// MARK: - Current User

struct CurrentUser: Decodable, Identifiable {
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
    let isActive: Bool?
    let createdAt: String?
}
