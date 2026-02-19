import SwiftUI

struct NoticeListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = NoticeViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.notices.isEmpty {
                    LoadingView()
                } else if let error = viewModel.errorMessage, viewModel.notices.isEmpty {
                    ErrorView(message: error) {
                        Task { await loadData() }
                    }
                } else if viewModel.filteredNotices.isEmpty {
                    EmptyStateView(
                        icon: "megaphone.fill",
                        title: "No Notices",
                        message: "No notices have been posted yet.",
                        actionTitle: authViewModel.userRole.canCreateNotices ? "Create Notice" : nil,
                        action: authViewModel.userRole.canCreateNotices ? { showCreateSheet = true } : nil
                    )
                } else {
                    List {
                        ForEach(viewModel.filteredNotices) { notice in
                            NavigationLink {
                                NoticeDetailView(notice: notice, viewModel: viewModel)
                            } label: {
                                NoticeRowView(notice: notice)
                            }
                        }
                        .onDelete { indexSet in
                            guard authViewModel.userRole.canCreateNotices else { return }
                            if let index = indexSet.first {
                                let notice = viewModel.filteredNotices[index]
                                Task { await viewModel.deleteNotice(id: notice.id) }
                            }
                        }
                    }
                    .searchable(text: $viewModel.searchText, prompt: "Search notices...")
                    .refreshable { await loadData() }
                }
            }
            .navigationTitle("Notices")
            .toolbar {
                if authViewModel.userRole.canCreateNotices {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showCreateSheet = true } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                NoticeFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
            }
            .toast(message: $viewModel.successMessage)
            .toast(message: $viewModel.errorMessage, isError: true)
            .task { await loadData() }
        }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadNotices(societyId: societyId)
    }
}

// MARK: - Row

struct NoticeRowView: View {
    let notice: Notice

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "megaphone.fill")
                    .foregroundStyle(.orange)
                Text(notice.title)
                    .font(.subheadline.bold())
                    .lineLimit(2)
                Spacer()
                if let active = notice.isActive {
                    StatusBadge(status: active ? "ACTIVE" : "INACTIVE")
                }
            }

            if let content = notice.content {
                Text(content)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            HStack {
                if let date = notice.createdAt {
                    Text(date)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                Spacer()
                if let expiry = notice.expiryDate {
                    Text("Expires: \(expiry)")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct NoticeDetailView: View {
    let notice: Notice
    @ObservedObject var viewModel: NoticeViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showEditSheet = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    if let active = notice.isActive {
                        StatusBadge(status: active ? "ACTIVE" : "INACTIVE")
                    }
                    Text(notice.title)
                        .font(.title2.bold())

                    HStack {
                        if let date = notice.createdAt {
                            Label(date, systemImage: "calendar")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let society = notice.societyName {
                            Text(society)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding()

                Divider()

                if let content = notice.content {
                    Text(content)
                        .font(.body)
                        .padding(.horizontal)
                }

                if let expiry = notice.expiryDate {
                    HStack {
                        Image(systemName: "clock.fill")
                        Text("Expires: \(expiry)")
                    }
                    .font(.caption)
                    .foregroundStyle(.orange)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.orange.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                }
            }
        }
        .navigationTitle("Notice")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if authViewModel.userRole.canCreateNotices {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Edit") { showEditSheet = true }
                        Button("Delete", role: .destructive) {
                            Task { await viewModel.deleteNotice(id: notice.id) }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .sheet(isPresented: $showEditSheet) {
            NoticeFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0, editingNotice: notice)
        }
    }
}

// MARK: - Form

struct NoticeFormView: View {
    @ObservedObject var viewModel: NoticeViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int
    var editingNotice: Notice?

    @State private var title = ""
    @State private var content = ""
    @State private var expiryDate = Date().addingTimeInterval(30 * 24 * 3600)
    @State private var hasExpiry = false
    @State private var isActive = true

    var isEditing: Bool { editingNotice != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Notice Details") {
                    TextField("Title *", text: $title)
                    TextEditor(text: $content)
                        .frame(minHeight: 120)
                }

                Section("Settings") {
                    Toggle("Active", isOn: $isActive)
                    Toggle("Set Expiry", isOn: $hasExpiry)
                    if hasExpiry {
                        DatePicker("Expiry Date", selection: $expiryDate, displayedComponents: .date)
                    }
                }

                if let error = viewModel.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle(isEditing ? "Edit Notice" : "New Notice")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Save" : "Create") {
                        Task { await save() }
                    }
                    .disabled(title.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
            .onAppear { loadEditData() }
        }
    }

    private func loadEditData() {
        guard let notice = editingNotice else { return }
        title = notice.title
        content = notice.content ?? ""
        isActive = notice.isActive ?? true
        if let expiry = notice.expiryDate {
            hasExpiry = true
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: expiry) {
                expiryDate = date
            }
        }
    }

    private func save() async {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let request = NoticeRequest(
            societyId: societyId,
            title: title,
            content: content,
            expiryDate: hasExpiry ? formatter.string(from: expiryDate) : nil,
            isActive: isActive
        )

        let success: Bool
        if let notice = editingNotice {
            success = await viewModel.updateNotice(id: notice.id, request: request)
        } else {
            success = await viewModel.createNotice(request: request)
        }
        if success { dismiss() }
    }
}
