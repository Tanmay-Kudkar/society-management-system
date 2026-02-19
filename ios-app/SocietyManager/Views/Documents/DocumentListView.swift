import SwiftUI

struct DocumentListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = FinanceViewModel()
    @State private var showCreateSheet = false
    @State private var searchText = ""

    var filteredDocuments: [DocumentTemplate] {
        if searchText.isEmpty { return viewModel.documents }
        return viewModel.documents.filter {
            ($0.title?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            ($0.templateType?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.documents.isEmpty {
                LoadingView()
            } else if let error = viewModel.errorMessage, viewModel.documents.isEmpty {
                ErrorView(message: error) {
                    Task { await loadData() }
                }
            } else if filteredDocuments.isEmpty {
                EmptyStateView(
                    icon: "doc.text.fill",
                    title: "No Documents",
                    message: "No document templates found.",
                    actionTitle: authViewModel.userRole.isAdmin ? "Add Document" : nil,
                    action: authViewModel.userRole.isAdmin ? { showCreateSheet = true } : nil
                )
            } else {
                List {
                    ForEach(filteredDocuments) { doc in
                        NavigationLink {
                            DocumentDetailView(document: doc)
                        } label: {
                            DocumentRowView(document: doc)
                        }
                    }
                }
                .searchable(text: $searchText, prompt: "Search documents...")
                .refreshable { await loadData() }
            }
        }
        .navigationTitle("Documents")
        .toolbar {
            if authViewModel.userRole.isAdmin {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCreateSheet = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            DocumentFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
        }
        .toast(message: $viewModel.successMessage)
        .toast(message: $viewModel.errorMessage, isError: true)
        .task { await loadData() }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadDocuments(societyId: societyId)
    }
}

// MARK: - Row

struct DocumentRowView: View {
    let document: DocumentTemplate

    private var icon: String {
        let name = (document.title ?? "").lowercased()
        switch name {
        case let n where n.contains("noc"): return "checkmark.seal.fill"
        case let n where n.contains("certificate"): return "rosette"
        case let n where n.contains("receipt"): return "receipt.fill"
        default: return "doc.text.fill"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.blue)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 4) {
                Text(document.title ?? "Document")
                    .font(.subheadline.bold())
                if let type = document.templateType {
                    Text(type)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct DocumentDetailView: View {
    let document: DocumentTemplate

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: "doc.text.fill")
                        .font(.largeTitle)
                        .foregroundStyle(.blue)
                    Text(document.title ?? "Document")
                        .font(.title2.bold())
                }
                .padding()

                if let type = document.templateType {
                    GroupBox("Type") {
                        Text(type)
                            .font(.body)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal)
                }

                if let content = document.content {
                    GroupBox("Content") {
                        Text(content)
                            .font(.body)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal)
                }

                if document.societyId != nil {
                    HStack {
                        Image(systemName: "building.2.fill")
                        Text("Society-specific document")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
                }
            }
        }
        .navigationTitle("Document")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Form

struct DocumentFormView: View {
    @ObservedObject var viewModel: FinanceViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int

    @State private var name = ""
    @State private var templateType = ""
    @State private var content = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Document Template") {
                    TextField("Title *", text: $name)
                    TextField("Template Type", text: $templateType)
                }
                Section("Content") {
                    TextEditor(text: $content)
                        .frame(minHeight: 200)
                }

                if let error = viewModel.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("New Document")
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
        let success = await viewModel.createDocument(
            societyId: societyId,
            name: name,
            description: templateType.isEmpty ? nil : templateType,
            content: content.isEmpty ? nil : content
        )
        if success { dismiss() }
    }
}
