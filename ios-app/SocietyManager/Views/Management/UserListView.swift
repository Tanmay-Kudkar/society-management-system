import SwiftUI

struct UserListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = UserViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        Group {
            if !authViewModel.userRole.canManageUsers {
                PermissionDeniedView()
            } else if viewModel.isLoading && viewModel.users.isEmpty {
                LoadingView()
            } else if let error = viewModel.errorMessage, viewModel.users.isEmpty {
                ErrorView(message: error) {
                    Task { await loadData() }
                }
            } else if viewModel.filteredUsers.isEmpty {
                EmptyStateView(
                    icon: "person.3.fill",
                    title: "No Users",
                    message: "No users found.",
                    actionTitle: "Add User",
                    action: { showCreateSheet = true }
                )
            } else {
                List {
                    // Role Filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            FilterChip(title: "All", isSelected: viewModel.filterRole == nil) {
                                viewModel.filterRole = nil
                            }
                            ForEach(UserRole.allCases) { role in
                                FilterChip(title: role.displayName, isSelected: viewModel.filterRole == role) {
                                    viewModel.filterRole = viewModel.filterRole == role ? nil : role
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)

                    ForEach(viewModel.filteredUsers) { user in
                        NavigationLink {
                            UserDetailView(user: user, viewModel: viewModel)
                        } label: {
                            UserRowView(user: user)
                        }
                    }
                    .onDelete { indexSet in
                        if let index = indexSet.first {
                            let user = viewModel.filteredUsers[index]
                            Task { await viewModel.deleteUser(id: user.id) }
                        }
                    }
                }
                .searchable(text: $viewModel.searchText, prompt: "Search users...")
                .refreshable { await loadData() }
            }
        }
        .navigationTitle("Users")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreateSheet = true } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            UserFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
        }
        .toast(message: $viewModel.successMessage)
        .toast(message: $viewModel.errorMessage, isError: true)
        .task { await loadData() }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadUsers(societyId: societyId)
        await viewModel.loadCreatableRoles()
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.bold())
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color.secondary.opacity(0.15))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

// MARK: - Row

struct UserRowView: View {
    let user: User

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: user.role.icon)
                .font(.title3)
                .foregroundStyle(.blue)
                .frame(width: 36, height: 36)
                .background(.blue.opacity(0.1))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(user.name)
                    .font(.subheadline.bold())
                Text(user.email)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack(spacing: 6) {
                    StatusBadge(status: user.role.displayName)
                    if let flat = user.flatNumber {
                        Text("Unit \(flat)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            if let isActive = user.isActive {
                Circle()
                    .fill(isActive ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Detail

struct UserDetailView: View {
    let user: User
    @ObservedObject var viewModel: UserViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showEditSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Avatar
                VStack(spacing: 8) {
                    Image(systemName: user.role.icon)
                        .font(.system(size: 48))
                        .foregroundStyle(.blue.gradient)
                        .frame(width: 80, height: 80)
                        .background(.blue.opacity(0.1))
                        .clipShape(Circle())
                    Text(user.name)
                        .font(.title2.bold())
                    StatusBadge(status: user.role.displayName)
                }
                .padding()

                GroupBox("Contact") {
                    DetailRow(label: "Email", value: user.email)
                    DetailRow(label: "Phone", value: user.phone ?? "N/A")
                }
                .padding(.horizontal)

                GroupBox("Details") {
                    DetailRow(label: "Role", value: user.role.displayName)
                    DetailRow(label: "Society", value: user.societyName ?? "N/A")
                    DetailRow(label: "Unit", value: user.flatNumber ?? "N/A")
                    DetailRow(label: "Wing", value: user.wingName ?? "N/A")
                    DetailRow(label: "Status", value: (user.isActive ?? true) ? "Active" : "Inactive")
                }
                .padding(.horizontal)
            }
        }
        .navigationTitle("User Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if authViewModel.userRole.canManageUsers {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { showEditSheet = true }
                }
            }
        }
        .sheet(isPresented: $showEditSheet) {
            UserFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0, editingUser: user)
        }
    }
}

// MARK: - Form

struct UserFormView: View {
    @ObservedObject var viewModel: UserViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int
    var editingUser: User?

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var selectedRole = "MEMBER"

    var isEditing: Bool { editingUser != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Personal Info") {
                    TextField("Full Name *", text: $name)
                    TextField("Email *", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                }

                if !isEditing {
                    Section("Account") {
                        SecureField("Password *", text: $password)
                    }
                }

                Section("Role") {
                    Picker("Role", selection: $selectedRole) {
                        if viewModel.creatableRoles.isEmpty {
                            ForEach(UserRole.allCases) { role in
                                Text(role.displayName).tag(role.rawValue)
                            }
                        } else {
                            ForEach(viewModel.creatableRoles, id: \.self) { role in
                                Text(role.replacingOccurrences(of: "_", with: " ").capitalized)
                                    .tag(role)
                            }
                        }
                    }
                }

                if let error = viewModel.errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit User" : "New User")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Save" : "Create") {
                        Task { await save() }
                    }
                    .disabled(name.isEmpty || email.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
            .onAppear { loadEditData() }
        }
    }

    private func loadEditData() {
        guard let user = editingUser else { return }
        name = user.name
        email = user.email
        phone = user.phone ?? ""
        selectedRole = user.role.rawValue
    }

    private func save() async {
        let request = UserRequest(
            name: name,
            email: email,
            password: isEditing ? nil : password,
            phone: phone.isEmpty ? nil : phone,
            role: selectedRole,
            societyId: societyId,
            flatId: editingUser?.flatId
        )

        let success: Bool
        if let user = editingUser {
            success = await viewModel.updateUser(id: user.id, request: request)
        } else {
            success = await viewModel.createUser(request: request)
        }
        if success { dismiss() }
    }
}
