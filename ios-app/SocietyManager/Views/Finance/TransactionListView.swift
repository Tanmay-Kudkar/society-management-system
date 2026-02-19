import SwiftUI

struct TransactionListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = FinanceViewModel()
    @State private var showCreateSheet = false
    @State private var searchText = ""
    @State private var filterType: String? = nil

    private let types = ["INCOME", "EXPENSE"]

    var filteredTransactions: [Transaction] {
        var results = viewModel.transactions
        if let filter = filterType {
            results = results.filter { $0.type?.uppercased() == filter }
        }
        if !searchText.isEmpty {
            results = results.filter {
                ($0.description?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                ($0.category?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
        return results
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.transactions.isEmpty {
                LoadingView()
            } else if let error = viewModel.errorMessage, viewModel.transactions.isEmpty {
                ErrorView(message: error) {
                    Task { await loadData() }
                }
            } else if filteredTransactions.isEmpty {
                EmptyStateView(
                    icon: "arrow.left.arrow.right",
                    title: "No Transactions",
                    message: "No transactions recorded yet.",
                    actionTitle: authViewModel.userRole.canManageFinance ? "Add Transaction" : nil,
                    action: authViewModel.userRole.canManageFinance ? { showCreateSheet = true } : nil
                )
            } else {
                VStack(spacing: 0) {
                    // Filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChipView(label: "All", isSelected: filterType == nil) {
                                filterType = nil
                            }
                            ForEach(types, id: \.self) { type in
                                FilterChipView(
                                    label: type.capitalized,
                                    isSelected: filterType == type
                                ) {
                                    filterType = filterType == type ? nil : type
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                    }

                    // Summary bar
                    if let summary = viewModel.transactionSummary {
                        HStack {
                            Label("\((summary.totalIncome ?? 0).currencyFormatted)", systemImage: "arrow.down.circle")
                                .foregroundStyle(.green)
                            Spacer()
                            Label("\((summary.totalExpense ?? 0).currencyFormatted)", systemImage: "arrow.up.circle")
                                .foregroundStyle(.red)
                        }
                        .font(.caption.bold())
                        .padding(.horizontal)
                        .padding(.bottom, 8)
                    }

                    List {
                        ForEach(filteredTransactions) { txn in
                            NavigationLink {
                                TransactionDetailView(transaction: txn, viewModel: viewModel)
                            } label: {
                                TransactionRowView(transaction: txn)
                            }
                        }
                        .onDelete { indexSet in
                            guard authViewModel.userRole.canManageFinance else { return }
                            if let index = indexSet.first {
                                let txn = filteredTransactions[index]
                                Task { await viewModel.deleteTransaction(id: txn.id) }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
                .searchable(text: $searchText, prompt: "Search transactions...")
                .refreshable { await loadData() }
            }
        }
        .navigationTitle("Transactions")
        .toolbar {
            if authViewModel.userRole.canManageFinance {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCreateSheet = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            TransactionFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
        }
        .toast(message: $viewModel.successMessage)
        .toast(message: $viewModel.errorMessage, isError: true)
        .task { await loadData() }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadTransactions(societyId: societyId)
    }
}

// MARK: - Filter Chip

struct FilterChipView: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.caption.bold())
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor : Color(.systemGray5))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

// MARK: - Row

struct TransactionRowView: View {
    let transaction: Transaction

    private var isIncome: Bool { transaction.type?.uppercased() == "INCOME" }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isIncome ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                .font(.title3)
                .foregroundStyle(isIncome ? .green : .red)

            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.description ?? "Transaction")
                    .font(.subheadline.bold())
                    .lineLimit(1)
                if let category = transaction.category {
                    Text(category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text((transaction.amount ?? 0).currencyFormatted)
                    .font(.subheadline.bold())
                    .foregroundStyle(isIncome ? .green : .red)
                if let date = transaction.transactionDate {
                    Text(date)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct TransactionDetailView: View {
    let transaction: Transaction
    @ObservedObject var viewModel: FinanceViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showEditSheet = false

    private var isIncome: Bool { transaction.type?.uppercased() == "INCOME" }

    var body: some View {
        List {
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: isIncome ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(isIncome ? .green : .red)
                        Text((transaction.amount ?? 0).currencyFormatted)
                            .font(.title.bold())
                        StatusBadge(status: transaction.type ?? "")
                    }
                    Spacer()
                }
                .listRowBackground(Color.clear)
            }

            Section("Details") {
                LabeledContent("Description", value: transaction.description ?? "-")
                LabeledContent("Category", value: transaction.category ?? "-")
                LabeledContent("Date", value: transaction.transactionDate ?? "-")
                if let mode = transaction.paymentMode {
                    LabeledContent("Payment Mode", value: mode)
                }
                if let ref = transaction.referenceNumber {
                    LabeledContent("Reference", value: ref)
                }
            }

            if let notes = transaction.notes, !notes.isEmpty {
                Section("Notes") {
                    Text(notes)
                }
            }
        }
        .navigationTitle("Transaction")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if authViewModel.userRole.canManageFinance {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Edit") { showEditSheet = true }
                        Button("Delete", role: .destructive) {
                            Task { await viewModel.deleteTransaction(id: transaction.id) }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .sheet(isPresented: $showEditSheet) {
            TransactionFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0, editingTransaction: transaction)
        }
    }
}

// MARK: - Form

struct TransactionFormView: View {
    @ObservedObject var viewModel: FinanceViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int
    var editingTransaction: Transaction?

    @State private var type = "INCOME"
    @State private var amount = ""
    @State private var description = ""
    @State private var category = ""
    @State private var date = Date()
    @State private var paymentMode = ""
    @State private var referenceNumber = ""
    @State private var notes = ""

    private let types = ["INCOME", "EXPENSE"]
    private let categories = ["Maintenance", "Repairs", "Utilities", "Salary", "Insurance", "Events", "Miscellaneous"]
    private let paymentModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Online"]

    var isEditing: Bool { editingTransaction != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section("Transaction Type") {
                    Picker("Type", selection: $type) {
                        ForEach(types, id: \.self) { Text($0.capitalized).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Amount") {
                    HStack {
                        Text("₹")
                        TextField("0.00", text: $amount)
                            .keyboardType(.decimalPad)
                    }
                }

                Section("Details") {
                    TextField("Description *", text: $description)
                    Picker("Category", selection: $category) {
                        Text("Select...").tag("")
                        ForEach(categories, id: \.self) { Text($0).tag($0) }
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section("Payment") {
                    Picker("Payment Mode", selection: $paymentMode) {
                        Text("Select...").tag("")
                        ForEach(paymentModes, id: \.self) { Text($0).tag($0) }
                    }
                    TextField("Reference Number", text: $referenceNumber)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 60)
                }
            }
            .navigationTitle(isEditing ? "Edit Transaction" : "New Transaction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Save" : "Create") {
                        Task { await save() }
                    }
                    .disabled(description.isEmpty || amount.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
            .onAppear { loadEditData() }
        }
    }

    private func loadEditData() {
        guard let txn = editingTransaction else { return }
        type = txn.type ?? "INCOME"
        amount = txn.amount != nil ? String(txn.amount!) : ""
        description = txn.description ?? ""
        category = txn.category ?? ""
        paymentMode = txn.paymentMode ?? ""
        referenceNumber = txn.referenceNumber ?? ""
        notes = txn.notes ?? ""
        if let dateStr = txn.transactionDate {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let d = formatter.date(from: dateStr) { date = d }
        }
    }

    private func save() async {
        guard let amountVal = Double(amount) else { return }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let request = TransactionRequest(
            societyId: societyId,
            type: type,
            amount: amountVal,
            description: description,
            category: category.isEmpty ? nil : category,
            transactionDate: formatter.string(from: date),
            paymentMode: paymentMode.isEmpty ? nil : paymentMode,
            referenceNumber: referenceNumber.isEmpty ? nil : referenceNumber,
            notes: notes.isEmpty ? nil : notes
        )

        let success: Bool
        if let txn = editingTransaction {
            success = await viewModel.updateTransaction(id: txn.id, request: request)
        } else {
            success = await viewModel.createTransaction(request: request)
        }
        if success { dismiss() }
    }
}
