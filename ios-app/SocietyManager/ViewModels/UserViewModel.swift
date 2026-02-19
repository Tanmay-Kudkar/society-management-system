import Foundation

@MainActor
final class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var selectedUser: User?
    @Published var creatableRoles: [String] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var searchText = ""
    @Published var filterRole: UserRole?

    private let userService = UserService.shared

    var filteredUsers: [User] {
        var results = users
        if !searchText.isEmpty {
            results = results.filter { user in
                user.name.localizedCaseInsensitiveContains(searchText) ||
                user.email.localizedCaseInsensitiveContains(searchText) ||
                (user.phone?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
        if let role = filterRole {
            results = results.filter { $0.role == role }
        }
        return results
    }

    func loadUsers(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            users = try await userService.getBySociety(societyId)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load users"
        }
        isLoading = false
    }

    func loadCreatableRoles() async {
        do {
            creatableRoles = try await userService.getCreatableRoles()
        } catch {
            // Silent fail — roles may not be available
        }
    }

    func createUser(request: UserRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let user = try await userService.create(request)
            users.insert(user, at: 0)
            successMessage = "User created successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create user"
        }
        isLoading = false
        return false
    }

    func updateUser(id: Int, request: UserRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let updated = try await userService.update(id: id, request: request)
            if let index = users.firstIndex(where: { $0.id == id }) {
                users[index] = updated
            }
            successMessage = "User updated successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to update user"
        }
        isLoading = false
        return false
    }

    func deleteUser(id: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            try await userService.delete(id: id)
            users.removeAll { $0.id == id }
            successMessage = "User deleted"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to delete user"
        }
        isLoading = false
    }
}
