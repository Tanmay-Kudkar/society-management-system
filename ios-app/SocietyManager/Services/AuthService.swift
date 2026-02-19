import Foundation

final class AuthService {
    static let shared = AuthService()
    private let api = APIClient.shared
    private init() {}

    func login(email: String, password: String) async throws -> LoginResponse {
        let request = LoginRequest(email: email, password: password)
        return try await api.request(AppConstants.API.Auth.login, method: .post, body: request)
    }

    func register(name: String, email: String, password: String, role: String) async throws -> User {
        let request = RegisterRequest(name: name, email: email, password: password, role: role)
        return try await api.request(AppConstants.API.Auth.register, method: .post, body: request)
    }

    func logout() async throws {
        try await api.requestVoid(AppConstants.API.Auth.logout, method: .post)
    }

    func getCurrentUser() async throws -> CurrentUser {
        return try await api.request(AppConstants.API.Auth.me)
    }

    func forgotPassword(email: String) async throws {
        let request = ForgotPasswordRequest(email: email)
        try await api.requestVoid(AppConstants.API.Auth.forgotPassword, method: .post, body: request)
    }

    func resetPassword(token: String, newPassword: String) async throws {
        let request = ResetPasswordRequest(token: token, newPassword: newPassword)
        try await api.requestVoid(AppConstants.API.Auth.resetPassword, method: .post, body: request)
    }

    func changePassword(currentPassword: String, newPassword: String) async throws {
        let request = ChangePasswordRequest(currentPassword: currentPassword, newPassword: newPassword)
        try await api.requestVoid(AppConstants.API.Auth.changePassword, method: .post, body: request)
    }
}
