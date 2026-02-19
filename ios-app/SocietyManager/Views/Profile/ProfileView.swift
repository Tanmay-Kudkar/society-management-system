import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showChangePassword = false
    @State private var showLogoutConfirm = false

    var body: some View {
        NavigationStack {
            List {
                // Header
                Section {
                    HStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(Color.accentColor.gradient)
                                .frame(width: 64, height: 64)
                            Text(initials)
                                .font(.title2.bold())
                                .foregroundStyle(.white)
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text(authViewModel.userName)
                                .font(.title3.bold())
                            Text(authViewModel.userEmail ?? "")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let role = authViewModel.currentUser?.role {
                                Text(role.replacingOccurrences(of: "_", with: " "))
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.accentColor.opacity(0.15))
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Account
                Section("Account") {
                    LabeledContent {
                        Text(authViewModel.userEmail ?? "-")
                            .foregroundStyle(.secondary)
                    } label: {
                        Label("Email", systemImage: "envelope.fill")
                    }

                    LabeledContent {
                        Text(authViewModel.userRole.displayName)
                            .foregroundStyle(.secondary)
                    } label: {
                        Label("Role", systemImage: authViewModel.userRole.icon)
                    }

                    if let societyId = authViewModel.societyId {
                        LabeledContent {
                            Text("\(societyId)")
                                .foregroundStyle(.secondary)
                        } label: {
                            Label("Society ID", systemImage: "building.2.fill")
                        }
                    }
                }

                // Security
                Section("Security") {
                    Button {
                        showChangePassword = true
                    } label: {
                        Label("Change Password", systemImage: "lock.rotation")
                    }
                }

                // App Info
                Section("App Info") {
                    LabeledContent {
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    } label: {
                        Label("Version", systemImage: "info.circle.fill")
                    }

                    LabeledContent {
                        Text(AppConstants.API.baseURL)
                            .foregroundStyle(.secondary)
                            .font(.caption)
                    } label: {
                        Label("Server", systemImage: "server.rack")
                    }
                }

                // Logout
                Section {
                    Button(role: .destructive) {
                        showLogoutConfirm = true
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showChangePassword) {
                ChangePasswordView()
            }
            .alert("Sign Out", isPresented: $showLogoutConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task { await authViewModel.logout() }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }

    private var initials: String {
        let name = authViewModel.userName
        let parts = name.split(separator: " ")
        let first = parts.first?.prefix(1) ?? ""
        let last = parts.count > 1 ? parts.last!.prefix(1) : ""
        return "\(first)\(last)".uppercased()
    }
}

// MARK: - Change Password

struct ChangePasswordView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var showCurrent = false
    @State private var showNew = false
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var successMessage: String?

    private var isValid: Bool {
        !currentPassword.isEmpty &&
        newPassword.count >= 8 &&
        newPassword == confirmPassword
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Current Password") {
                    HStack {
                        if showCurrent {
                            TextField("Current Password", text: $currentPassword)
                        } else {
                            SecureField("Current Password", text: $currentPassword)
                        }
                        Button { showCurrent.toggle() } label: {
                            Image(systemName: showCurrent ? "eye.slash" : "eye")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                Section {
                    HStack {
                        if showNew {
                            TextField("New Password", text: $newPassword)
                        } else {
                            SecureField("New Password", text: $newPassword)
                        }
                        Button { showNew.toggle() } label: {
                            Image(systemName: showNew ? "eye.slash" : "eye")
                                .foregroundStyle(.secondary)
                        }
                    }
                    SecureField("Confirm Password", text: $confirmPassword)
                } header: {
                    Text("New Password")
                } footer: {
                    VStack(alignment: .leading, spacing: 4) {
                        PasswordRule(text: "At least 8 characters", met: newPassword.count >= 8)
                        PasswordRule(text: "Passwords match", met: !confirmPassword.isEmpty && newPassword == confirmPassword)
                    }
                }

                if let error = errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
                if let success = successMessage {
                    Section { Text(success).foregroundStyle(.green) }
                }
            }
            .navigationTitle("Change Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        Task { await changePassword() }
                    }
                    .disabled(!isValid || isLoading)
                    .bold()
                }
            }
        }
    }

    private func changePassword() async {
        isLoading = true
        errorMessage = nil
        let success = await authViewModel.changePassword(
            currentPassword: currentPassword,
            newPassword: newPassword
        )
        isLoading = false
        if success {
            successMessage = "Password changed successfully"
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { dismiss() }
        } else {
            errorMessage = authViewModel.errorMessage ?? "Failed to change password"
        }
    }
}

private struct PasswordRule: View {
    let text: String
    let met: Bool

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: met ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(met ? .green : .secondary)
                .font(.caption)
            Text(text)
                .font(.caption)
                .foregroundStyle(met ? .primary : .secondary)
        }
    }
}
