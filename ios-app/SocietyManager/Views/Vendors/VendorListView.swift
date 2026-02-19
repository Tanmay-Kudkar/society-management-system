import SwiftUI

struct VendorListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = VendorViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.vendors.isEmpty {
                    LoadingView()
                } else if let error = viewModel.errorMessage, viewModel.vendors.isEmpty {
                    ErrorView(message: error) {
                        Task { await loadData() }
                    }
                } else if viewModel.filteredVendors.isEmpty {
                    EmptyStateView(
                        icon: "wrench.and.screwdriver.fill",
                        title: "No Vendors",
                        message: "No vendors found.",
                        actionTitle: authViewModel.userRole.canManageVendors ? "Add Vendor" : nil,
                        action: authViewModel.userRole.canManageVendors ? { showCreateSheet = true } : nil
                    )
                } else {
                    List {
                        // Pending approvals section
                        if !viewModel.pendingVendors.isEmpty && authViewModel.userRole.isAdmin {
                            Section("Pending Approval") {
                                ForEach(viewModel.pendingVendors) { vendor in
                                    PendingVendorRow(vendor: vendor, viewModel: viewModel)
                                }
                            }
                        }

                        // All vendors
                        Section("All Vendors") {
                            ForEach(viewModel.filteredVendors) { vendor in
                                NavigationLink {
                                    VendorDetailView(vendor: vendor, viewModel: viewModel)
                                } label: {
                                    VendorRowView(vendor: vendor)
                                }
                            }
                            .onDelete { indexSet in
                                if let index = indexSet.first {
                                    let vendor = viewModel.filteredVendors[index]
                                    Task { await viewModel.deleteVendor(id: vendor.id) }
                                }
                            }
                        }
                    }
                    .searchable(text: $viewModel.searchText, prompt: "Search vendors...")
                    .refreshable { await loadData() }
                }
            }
            .navigationTitle("Vendors")
            .toolbar {
                if authViewModel.userRole.canManageVendors {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showCreateSheet = true } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                VendorFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
            }
            .toast(message: $viewModel.successMessage)
            .toast(message: $viewModel.errorMessage, isError: true)
            .task { await loadData() }
        }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadVendors(societyId: societyId)
        if authViewModel.userRole.isAdmin {
            await viewModel.loadPendingVendors()
        }
    }
}

// MARK: - Row

struct VendorRowView: View {
    let vendor: Vendor

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "wrench.and.screwdriver.fill")
                .font(.title3)
                .foregroundStyle(.teal)
                .frame(width: 36, height: 36)
                .background(.teal.opacity(0.1))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(vendor.name)
                    .font(.subheadline.bold())
                if let service = vendor.serviceType {
                    Text(service)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if let contact = vendor.contactPerson {
                    Text(contact)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if let status = vendor.approvalStatus {
                StatusBadge(status: status)
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Pending Row

struct PendingVendorRow: View {
    let vendor: Vendor
    @ObservedObject var viewModel: VendorViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(vendor.name)
                    .font(.subheadline.bold())
                Spacer()
                StatusBadge(status: "PENDING")
            }
            if let service = vendor.serviceType {
                Text(service)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack {
                Button {
                    Task { await viewModel.approveVendor(id: vendor.id) }
                } label: {
                    Label("Approve", systemImage: "checkmark")
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.green)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)

                Button {
                    Task { await viewModel.rejectVendor(id: vendor.id) }
                } label: {
                    Label("Reject", systemImage: "xmark")
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.red)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Detail

struct VendorDetailView: View {
    let vendor: Vendor
    @ObservedObject var viewModel: VendorViewModel
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                VStack(spacing: 8) {
                    Image(systemName: "wrench.and.screwdriver.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.teal.gradient)
                    Text(vendor.name)
                        .font(.title2.bold())
                    if let status = vendor.approvalStatus {
                        StatusBadge(status: status)
                    }
                }
                .padding()

                GroupBox("Contact") {
                    DetailRow(label: "Contact Person", value: vendor.contactPerson ?? "N/A")
                    DetailRow(label: "Phone", value: vendor.phone ?? "N/A")
                    DetailRow(label: "Email", value: vendor.email ?? "N/A")
                    DetailRow(label: "Address", value: vendor.address ?? "N/A")
                }
                .padding(.horizontal)

                GroupBox("Business") {
                    DetailRow(label: "Service Type", value: vendor.serviceType ?? "N/A")
                    DetailRow(label: "GST Number", value: vendor.gstNumber ?? "N/A")
                    DetailRow(label: "PAN Number", value: vendor.panNumber ?? "N/A")
                }
                .padding(.horizontal)

                if vendor.bankName != nil {
                    GroupBox("Bank Details") {
                        DetailRow(label: "Bank", value: vendor.bankName ?? "N/A")
                        DetailRow(label: "Account", value: vendor.accountNumber ?? "N/A")
                        DetailRow(label: "IFSC", value: vendor.ifscCode ?? "N/A")
                    }
                    .padding(.horizontal)
                }

                // Admin actions
                if authViewModel.userRole.isAdmin && vendor.approvalStatus?.uppercased() == "PENDING" {
                    HStack(spacing: 16) {
                        Button {
                            Task { await viewModel.approveVendor(id: vendor.id) }
                        } label: {
                            Label("Approve", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(.green)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        Button {
                            Task { await viewModel.rejectVendor(id: vendor.id) }
                        } label: {
                            Label("Reject", systemImage: "xmark.circle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(.red)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .navigationTitle("Vendor Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Form

struct VendorFormView: View {
    @ObservedObject var viewModel: VendorViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int

    @State private var name = ""
    @State private var contactPerson = ""
    @State private var contactPhone = ""
    @State private var contactEmail = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var address = ""
    @State private var gstNumber = ""
    @State private var panNumber = ""
    @State private var serviceType = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Vendor Details") {
                    TextField("Vendor Name *", text: $name)
                    TextField("Service Type", text: $serviceType)
                }

                Section("Contact Person") {
                    TextField("Name", text: $contactPerson)
                    TextField("Phone", text: $contactPhone)
                        .keyboardType(.phonePad)
                    TextField("Email", text: $contactEmail)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section("Business Contact") {
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Address", text: $address)
                }

                Section("Tax Info") {
                    TextField("GST Number", text: $gstNumber)
                        .autocapitalization(.allCharacters)
                    TextField("PAN Number", text: $panNumber)
                        .autocapitalization(.allCharacters)
                }

                if let error = viewModel.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("New Vendor")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Create") {
                        Task { await save() }
                    }
                    .disabled(name.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
        }
    }

    private func save() async {
        let request = VendorRequest(
            name: name,
            contactPerson: contactPerson.isEmpty ? nil : contactPerson,
            contactPersonPhone: contactPhone.isEmpty ? nil : contactPhone,
            contactPersonEmail: contactEmail.isEmpty ? nil : contactEmail,
            phone: phone.isEmpty ? nil : phone,
            email: email.isEmpty ? nil : email,
            address: address.isEmpty ? nil : address,
            gstNumber: gstNumber.isEmpty ? nil : gstNumber,
            panNumber: panNumber.isEmpty ? nil : panNumber,
            serviceType: serviceType.isEmpty ? nil : serviceType,
            societyId: societyId
        )
        let success = await viewModel.createVendor(request: request)
        if success { dismiss() }
    }
}
