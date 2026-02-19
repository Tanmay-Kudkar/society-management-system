import SwiftUI

struct UnitListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = UnitViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.flats.isEmpty {
                    LoadingView()
                } else if let error = viewModel.errorMessage, viewModel.flats.isEmpty {
                    ErrorView(message: error) {
                        Task { await loadData() }
                    }
                } else if viewModel.filteredFlats.isEmpty {
                    EmptyStateView(
                        icon: "building.fill",
                        title: "No Units",
                        message: "No units found in this society.",
                        actionTitle: authViewModel.userRole.isAdmin ? "Add Unit" : nil,
                        action: authViewModel.userRole.isAdmin ? { showCreateSheet = true } : nil
                    )
                } else {
                    List {
                        ForEach(viewModel.filteredFlats) { flat in
                            NavigationLink {
                                UnitDetailView(flat: flat, viewModel: viewModel)
                            } label: {
                                UnitRowView(flat: flat)
                            }
                        }
                        .onDelete { indexSet in
                            if let index = indexSet.first {
                                let flat = viewModel.filteredFlats[index]
                                Task { await viewModel.deleteFlat(id: flat.id) }
                            }
                        }
                    }
                    .searchable(text: $viewModel.searchText, prompt: "Search units...")
                    .refreshable { await loadData() }
                }
            }
            .navigationTitle("Units")
            .toolbar {
                if authViewModel.userRole.isAdmin {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showCreateSheet = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                UnitFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
            }
            .toast(message: $viewModel.successMessage)
            .toast(message: $viewModel.errorMessage, isError: true)
            .task { await loadData() }
        }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadFlats(societyId: societyId)
    }
}

// MARK: - Row

struct UnitRowView: View {
    let flat: Flat

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "door.left.hand.closed")
                .font(.title2)
                .foregroundStyle(.blue)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(flat.flatNumber)
                    .font(.headline)
                if let wing = flat.wingName {
                    Text("Wing \(wing)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if let owner = flat.ownerName {
                    Text(owner)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if let occupied = flat.isOccupied {
                StatusBadge(status: occupied ? "ACTIVE" : "INACTIVE")
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct UnitDetailView: View {
    let flat: Flat
    @ObservedObject var viewModel: UnitViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showEditSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "building.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.blue.gradient)
                    Text("Unit \(flat.flatNumber)")
                        .font(.title2.bold())
                    if let wing = flat.wingName {
                        Text("Wing \(wing)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()

                // Details
                GroupBox("Unit Information") {
                    DetailRow(label: "Unit Number", value: flat.flatNumber)
                    DetailRow(label: "Type", value: flat.unitType ?? "N/A")
                    DetailRow(label: "Floor", value: flat.floor.map { "\($0)" } ?? "N/A")
                    DetailRow(label: "Wing", value: flat.wingName ?? "N/A")
                    DetailRow(label: "Occupied", value: (flat.isOccupied ?? false) ? "Yes" : "No")
                }
                .padding(.horizontal)

                if flat.ownerName != nil {
                    GroupBox("Owner Details") {
                        DetailRow(label: "Name", value: flat.ownerName ?? "N/A")
                        DetailRow(label: "Email", value: flat.ownerEmail ?? "N/A")
                        DetailRow(label: "Phone", value: flat.ownerPhone ?? "N/A")
                    }
                    .padding(.horizontal)
                }
            }
        }
        .navigationTitle("Unit Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if authViewModel.userRole.isAdmin {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { showEditSheet = true }
                }
            }
        }
        .sheet(isPresented: $showEditSheet) {
            UnitFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0, editingFlat: flat)
        }
    }
}

// MARK: - Detail Row

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
        .padding(.vertical, 2)
    }
}

// MARK: - Form

struct UnitFormView: View {
    @ObservedObject var viewModel: UnitViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int
    var editingFlat: Flat?

    @State private var flatNumber = ""
    @State private var unitType = "FLAT"
    @State private var floor = ""
    @State private var ownerName = ""
    @State private var ownerEmail = ""
    @State private var ownerPhone = ""

    let unitTypes = ["FLAT", "SHOP", "OFFICE"]

    var isEditing: Bool { editingFlat != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Unit Details") {
                    TextField("Unit Number *", text: $flatNumber)
                    Picker("Type", selection: $unitType) {
                        ForEach(unitTypes, id: \.self) { Text($0) }
                    }
                    TextField("Floor", text: $floor)
                        .keyboardType(.numberPad)
                }

                Section("Owner (Optional)") {
                    TextField("Owner Name", text: $ownerName)
                    TextField("Owner Email", text: $ownerEmail)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Owner Phone", text: $ownerPhone)
                        .keyboardType(.phonePad)
                }

                if let error = viewModel.errorMessage {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Unit" : "New Unit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Save" : "Create") {
                        Task { await save() }
                    }
                    .disabled(flatNumber.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
            .onAppear { loadEditData() }
        }
    }

    private func loadEditData() {
        guard let flat = editingFlat else { return }
        flatNumber = flat.flatNumber
        unitType = flat.unitType ?? "FLAT"
        floor = flat.floor.map { "\($0)" } ?? ""
        ownerName = flat.ownerName ?? ""
        ownerEmail = flat.ownerEmail ?? ""
        ownerPhone = flat.ownerPhone ?? ""
    }

    private func save() async {
        let request = FlatRequest(
            societyId: societyId,
            wingId: editingFlat?.wingId,
            flatNumber: flatNumber,
            unitType: unitType,
            floor: Int(floor),
            ownerName: ownerName.isEmpty ? nil : ownerName,
            ownerEmail: ownerEmail.isEmpty ? nil : ownerEmail,
            ownerPhone: ownerPhone.isEmpty ? nil : ownerPhone,
            ownerId: editingFlat?.ownerId
        )

        let success: Bool
        if let flat = editingFlat {
            success = await viewModel.updateFlat(id: flat.id, request: request)
        } else {
            success = await viewModel.createFlat(request: request)
        }
        if success { dismiss() }
    }
}
