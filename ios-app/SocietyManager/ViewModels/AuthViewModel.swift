import Foundation
import SwiftUI

@MainActor
final class AuthViewModel: ObservableObject {

    // MARK: - Published State

    @Published var isAuthenticated = false
    @Published var isCheckingAuth = true
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    @Published var currentUser: CurrentUser?
    @Published var userRole: UserRole = .visitor

    // Login form
    @Published var loginEmail = ""
    @Published var loginPassword = ""

    // Forgot password
    @Published var forgotEmail = ""
    @Published var resetToken = ""
    @Published var newPassword = ""
    @Published var confirmPassword = ""

    // MARK: - Computed

    var userId: Int { currentUser?.id ?? 0 }
    var societyId: Int? { currentUser?.societyId ?? storedSocietyId }
    var flatId: Int? { currentUser?.flatId ?? storedFlatId }
    var userName: String { currentUser?.name ?? storedUserName ?? "User" }
    var userEmail: String? { currentUser?.email ?? UserDefaults.standard.string(forKey: AppConstants.StorageKeys.userEmail) }

    private var storedSocietyId: Int? {
        let val = UserDefaults.standard.integer(forKey: AppConstants.StorageKeys.societyId)
        return val == 0 ? nil : val
    }
    private var storedFlatId: Int? {
        let val = UserDefaults.standard.integer(forKey: AppConstants.StorageKeys.flatId)
        return val == 0 ? nil : val
    }
    private var storedUserName: String? {
        UserDefaults.standard.string(forKey: AppConstants.StorageKeys.userName)
    }

    private let authService = AuthService.shared

    // MARK: - Init

    init() {
        NotificationCenter.default.addObserver(
            forName: .authTokenExpired, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.handleTokenExpired()
            }
        }
    }

    // MARK: - Check Existing Auth

    func checkExistingAuth() async {
        isCheckingAuth = true
        defer { isCheckingAuth = false }

        guard KeychainManager.shared.hasValidToken else {
            isAuthenticated = false
            return
        }

        do {
            let user = try await authService.getCurrentUser()
            currentUser = user
            userRole = user.role
            persistUserInfo(user)
            isAuthenticated = true
        } catch {
            KeychainManager.shared.clearAll()
            isAuthenticated = false
        }
    }

    // MARK: - Login

    func login() async {
        guard validateLoginFields() else { return }

        isLoading = true
        errorMessage = nil

        do {
            let response = try await authService.login(
                email: loginEmail.trimmed,
                password: loginPassword
            )

            KeychainManager.shared.save(response.token, for: .jwtToken)
            userRole = response.role

            UserDefaults.standard.set(response.id, forKey: AppConstants.StorageKeys.userId)
            UserDefaults.standard.set(response.role.rawValue, forKey: AppConstants.StorageKeys.userRole)
            UserDefaults.standard.set(response.name, forKey: AppConstants.StorageKeys.userName)
            UserDefaults.standard.set(response.email, forKey: AppConstants.StorageKeys.userEmail)

            if let sid = response.societyId {
                UserDefaults.standard.set(sid, forKey: AppConstants.StorageKeys.societyId)
            }
            if let fid = response.flatId {
                UserDefaults.standard.set(fid, forKey: AppConstants.StorageKeys.flatId)
            }

            // Fetch full profile
            let user = try await authService.getCurrentUser()
            currentUser = user

            loginEmail = ""
            loginPassword = ""
            isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Login failed. Please try again."
        }

        isLoading = false
    }

    // MARK: - Logout

    func logout() async {
        isLoading = true
        try? await authService.logout()
        performLogout()
        isLoading = false
    }

    func performLogout() {
        KeychainManager.shared.clearAll()
        clearStoredUserInfo()
        currentUser = nil
        userRole = .visitor
        isAuthenticated = false
    }

    // MARK: - Forgot Password

    func forgotPassword() async {
        guard !forgotEmail.trimmed.isEmpty else {
            errorMessage = "Please enter your email"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authService.forgotPassword(email: forgotEmail.trimmed)
            successMessage = "Password reset link has been sent to your email"
            forgotEmail = ""
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to send reset email"
        }

        isLoading = false
    }

    // MARK: - Reset Password

    func resetPassword() async {
        guard !resetToken.isEmpty else {
            errorMessage = "Reset token is required"
            return
        }
        guard newPassword.count >= 6 else {
            errorMessage = "Password must be at least 6 characters"
            return
        }
        guard newPassword == confirmPassword else {
            errorMessage = "Passwords do not match"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            try await authService.resetPassword(token: resetToken, newPassword: newPassword)
            successMessage = "Password has been reset successfully. Please login."
            resetToken = ""
            newPassword = ""
            confirmPassword = ""
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Password reset failed"
        }

        isLoading = false
    }

    // MARK: - Change Password

    func changePassword(currentPassword: String, newPassword: String) async -> Bool {
        isLoading = true
        errorMessage = nil

        do {
            try await authService.changePassword(
                currentPassword: currentPassword,
                newPassword: newPassword
            )
            successMessage = "Password changed successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Password change failed"
        }

        isLoading = false
        return false
    }

    // MARK: - Role Access

    func hasAccess(to requiredRoles: [UserRole]) -> Bool {
        requiredRoles.contains(userRole)
    }

    func hasMinimumRole(_ role: UserRole) -> Bool {
        userRole.level <= role.level
    }

    // MARK: - Private

    private func validateLoginFields() -> Bool {
        if loginEmail.trimmed.isEmpty {
            errorMessage = "Please enter your email"
            return false
        }
        if !loginEmail.isValidEmail {
            errorMessage = "Please enter a valid email"
            return false
        }
        if loginPassword.isEmpty {
            errorMessage = "Please enter your password"
            return false
        }
        return true
    }

    private func persistUserInfo(_ user: CurrentUser) {
        UserDefaults.standard.set(user.id, forKey: AppConstants.StorageKeys.userId)
        UserDefaults.standard.set(user.role.rawValue, forKey: AppConstants.StorageKeys.userRole)
        UserDefaults.standard.set(user.name, forKey: AppConstants.StorageKeys.userName)
        UserDefaults.standard.set(user.email, forKey: AppConstants.StorageKeys.userEmail)
        if let sid = user.societyId {
            UserDefaults.standard.set(sid, forKey: AppConstants.StorageKeys.societyId)
        }
        if let fid = user.flatId {
            UserDefaults.standard.set(fid, forKey: AppConstants.StorageKeys.flatId)
        }
    }

    private func clearStoredUserInfo() {
        let keys = [
            AppConstants.StorageKeys.userId,
            AppConstants.StorageKeys.userRole,
            AppConstants.StorageKeys.societyId,
            AppConstants.StorageKeys.flatId,
            AppConstants.StorageKeys.userName,
            AppConstants.StorageKeys.userEmail
        ]
        keys.forEach { UserDefaults.standard.removeObject(forKey: $0) }
    }

    private func handleTokenExpired() {
        performLogout()
        errorMessage = "Your session has expired. Please log in again."
    }
}
