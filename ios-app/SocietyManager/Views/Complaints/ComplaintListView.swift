import SwiftUI

struct ComplaintListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = FinanceViewModel()
    @State private var showCreateSheet = false
    @State private var searchText = ""
    @State private var filterStatus: String? = nil

    private let statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]

    var filteredComplaints: [Complaint] {
        var results = viewModel.complaints
        if let filter = filterStatus {
            results = results.filter { $0.status?.uppercased() == filter }
        }
        if !searchText.isEmpty {
            results = results.filter {
                ($0.subject?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                ($0.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
        return results
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.complaints.isEmpty {
                LoadingView()
            } else if let error = viewModel.errorMessage, viewModel.complaints.isEmpty {
                ErrorView(message: error) {
                    Task { await loadData() }
                }
            } else if filteredComplaints.isEmpty {
                EmptyStateView(
                    icon: "exclamationmark.bubble.fill",
                    title: "No Complaints",
                    message: "No complaints have been raised.",
                    actionTitle: "Raise Complaint",
                    action: { showCreateSheet = true }
                )
            } else {
                VStack(spacing: 0) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChipView(label: "All", isSelected: filterStatus == nil) {
                                filterStatus = nil
                            }
                            ForEach(statuses, id: \.self) { status in
                                FilterChipView(
                                    label: status.replacingOccurrences(of: "_", with: " ").capitalized,
                                    isSelected: filterStatus == status
                                ) {
                                    filterStatus = filterStatus == status ? nil : status
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                    }

                    List {
                        ForEach(filteredComplaints) { complaint in
                            NavigationLink {
                                ComplaintDetailView(complaint: complaint)
                            } label: {
                                ComplaintRowView(complaint: complaint)
                            }
                        }
                    }
                    .listStyle(.plain)
                }
                .searchable(text: $searchText, prompt: "Search complaints...")
                .refreshable { await loadData() }
            }
        }
        .navigationTitle("Complaints")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreateSheet = true } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            ComplaintFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
        }
        .toast(message: $viewModel.successMessage)
        .toast(message: $viewModel.errorMessage, isError: true)
        .task { await loadData() }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadComplaints(societyId: societyId)
    }
}

// MARK: - Row

struct ComplaintRowView: View {
    let complaint: Complaint

    private var statusColor: Color {
        switch complaint.status?.uppercased() {
        case "OPEN": return .orange
        case "IN_PROGRESS": return .blue
        case "RESOLVED": return .green
        case "CLOSED": return .gray
        default: return .secondary
        }
    }

    private var statusIcon: String {
        switch complaint.status?.uppercased() {
        case "OPEN": return "exclamationmark.circle.fill"
        case "IN_PROGRESS": return "wrench.fill"
        case "RESOLVED": return "checkmark.circle.fill"
        case "CLOSED": return "xmark.circle.fill"
        default: return "questionmark.circle"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: statusIcon)
                .font(.title3)
                .foregroundStyle(statusColor)

            VStack(alignment: .leading, spacing: 4) {
                Text(complaint.subject ?? "Complaint")
                    .font(.subheadline.bold())
                    .lineLimit(1)
                if let desc = complaint.description {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                if let date = complaint.createdAt {
                    Text(date)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer()

            if let status = complaint.status {
                StatusBadge(status: status)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct ComplaintDetailView: View {
    let complaint: Complaint

    var body: some View {
        List {
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "exclamationmark.bubble.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.orange)
                        Text(complaint.subject ?? "Complaint")
                            .font(.title3.bold())
                            .multilineTextAlignment(.center)
                        if let status = complaint.status {
                            StatusBadge(status: status)
                        }
                    }
                    Spacer()
                }
                .listRowBackground(Color.clear)
            }

            if let desc = complaint.description {
                Section("Description") {
                    Text(desc)
                }
            }

            Section("Details") {
                if let category = complaint.category {
                    LabeledContent("Category", value: category)
                }
                if let date = complaint.createdAt {
                    LabeledContent("Raised On", value: date)
                }
                if let user = complaint.userName {
                    LabeledContent("Reported By", value: user)
                }
            }

            if let resolution = complaint.resolution, !resolution.isEmpty {
                Section("Resolution") {
                    Text(resolution)
                }
            }
        }
        .navigationTitle("Complaint")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Form

struct ComplaintFormView: View {
    @ObservedObject var viewModel: FinanceViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int

    @State private var title = ""
    @State private var description = ""
    @State private var category = ""
    @State private var priority = "MEDIUM"

    private let categories = ["Plumbing", "Electrical", "Structural", "Cleanliness", "Security", "Parking", "Noise", "Other"]
    private let priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Complaint Details") {
                    TextField("Title *", text: $title)
                    TextEditor(text: $description)
                        .frame(minHeight: 100)
                        .overlay(alignment: .topLeading) {
                            if description.isEmpty {
                                Text("Describe your complaint...")
                                    .foregroundStyle(.tertiary)
                                    .padding(.top, 8)
                                    .padding(.leading, 4)
                            }
                        }
                }

                Section("Classification") {
                    Picker("Category", selection: $category) {
                        Text("Select...").tag("")
                        ForEach(categories, id: \.self) { Text($0).tag($0) }
                    }
                    Picker("Priority", selection: $priority) {
                        ForEach(priorities, id: \.self) { p in
                            Label(p.capitalized, systemImage: priorityIcon(p))
                                .tag(p)
                        }
                    }
                }
            }
            .navigationTitle("Raise Complaint")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Submit") {
                        Task { await save() }
                    }
                    .disabled(title.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
        }
    }

    private func priorityIcon(_ priority: String) -> String {
        switch priority {
        case "LOW": return "arrow.down"
        case "MEDIUM": return "minus"
        case "HIGH": return "arrow.up"
        case "URGENT": return "exclamationmark.2"
        default: return "minus"
        }
    }

    private func save() async {
        let success = await viewModel.createComplaint(
            societyId: societyId,
            title: title,
            description: description.isEmpty ? nil : description,
            category: category.isEmpty ? nil : category,
            priority: priority
        )
        if success { dismiss() }
    }
}
