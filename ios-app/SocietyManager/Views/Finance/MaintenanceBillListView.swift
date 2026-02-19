import SwiftUI

struct MaintenanceBillListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = FinanceViewModel()
    @State private var showCreateSheet = false
    @State private var searchText = ""
    @State private var showPendingOnly = false

    var filteredBills: [MaintenanceBill] {
        var results = viewModel.bills
        if showPendingOnly {
            results = results.filter { !$0.isPaid }
        }
        if !searchText.isEmpty {
            results = results.filter {
                ($0.flatNumber?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                ($0.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }
        return results
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.bills.isEmpty {
                LoadingView()
            } else if let error = viewModel.errorMessage, viewModel.bills.isEmpty {
                ErrorView(message: error) {
                    Task { await loadData() }
                }
            } else if filteredBills.isEmpty {
                EmptyStateView(
                    icon: "doc.text.fill",
                    title: "No Bills",
                    message: showPendingOnly ? "No pending bills." : "No maintenance bills found.",
                    actionTitle: authViewModel.userRole.canManageFinance ? "Create Bill" : nil,
                    action: authViewModel.userRole.canManageFinance ? { showCreateSheet = true } : nil
                )
            } else {
                VStack(spacing: 0) {
                    // Toggle filter
                    HStack {
                        Toggle("Pending Only", isOn: $showPendingOnly)
                            .font(.subheadline)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)

                    // Summary
                    HStack {
                        let totalAmount = filteredBills.compactMap(\.totalAmount).reduce(0, +)
                        let paidAmount = filteredBills.compactMap(\.paidAmount).reduce(0, +)

                        VStack(alignment: .leading) {
                            Text("Total").font(.caption).foregroundStyle(.secondary)
                            Text(totalAmount.currencyFormatted).font(.caption.bold())
                        }
                        Spacer()
                        VStack(alignment: .center) {
                            Text("Paid").font(.caption).foregroundStyle(.secondary)
                            Text(paidAmount.currencyFormatted).font(.caption.bold()).foregroundStyle(.green)
                        }
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text("Pending").font(.caption).foregroundStyle(.secondary)
                            Text((totalAmount - paidAmount).currencyFormatted).font(.caption.bold()).foregroundStyle(.red)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 8)

                    List {
                        ForEach(filteredBills) { bill in
                            NavigationLink {
                                BillDetailView(bill: bill, viewModel: viewModel)
                            } label: {
                                BillRowView(bill: bill)
                            }
                        }
                    }
                    .listStyle(.plain)
                }
                .searchable(text: $searchText, prompt: "Search bills...")
                .refreshable { await loadData() }
            }
        }
        .navigationTitle("Maintenance Bills")
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
            BillFormView(viewModel: viewModel, societyId: authViewModel.societyId ?? 0)
        }
        .toast(message: $viewModel.successMessage)
        .toast(message: $viewModel.errorMessage, isError: true)
        .task { await loadData() }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadBills(societyId: societyId)
    }
}

// MARK: - Row

struct BillRowView: View {
    let bill: MaintenanceBill

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: bill.isPaid ? "checkmark.circle.fill" : "clock.fill")
                .font(.title3)
                .foregroundStyle(bill.isPaid ? .green : .orange)

            VStack(alignment: .leading, spacing: 4) {
                Text(bill.description ?? "Maintenance Bill")
                    .font(.subheadline.bold())
                    .lineLimit(1)
                if let flat = bill.flatNumber {
                    Text("Unit: \(flat)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text((bill.totalAmount ?? 0).currencyFormatted)
                    .font(.subheadline.bold())
                if bill.isPaid {
                    Text("PAID")
                        .font(.caption2.bold())
                        .foregroundStyle(.green)
                } else {
                    Text(bill.outstandingAmount.currencyFormatted)
                        .font(.caption2)
                        .foregroundStyle(.red)
                }
                if let due = bill.dueDate {
                    Text(due)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Detail

struct BillDetailView: View {
    let bill: MaintenanceBill
    @ObservedObject var viewModel: FinanceViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showPaymentSheet = false

    var body: some View {
        List {
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: bill.isPaid ? "checkmark.seal.fill" : "doc.text.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(bill.isPaid ? .green : .orange)
                        Text((bill.totalAmount ?? 0).currencyFormatted)
                            .font(.title.bold())
                        StatusBadge(status: bill.isPaid ? "PAID" : "PENDING")
                    }
                    Spacer()
                }
                .listRowBackground(Color.clear)
            }

            Section("Bill Details") {
                LabeledContent("Description", value: bill.description ?? "-")
                if let flat = bill.flatNumber {
                    LabeledContent("Unit", value: flat)
                }
                if let month = bill.billMonth {
                    LabeledContent("Bill Month", value: month)
                }
                if let due = bill.dueDate {
                    LabeledContent("Due Date", value: due)
                }
            }

            Section("Payment") {
                LabeledContent("Total Amount", value: (bill.totalAmount ?? 0).currencyFormatted)
                LabeledContent("Paid Amount", value: (bill.paidAmount ?? 0).currencyFormatted)
                LabeledContent("Outstanding", value: bill.outstandingAmount.currencyFormatted)
            }

            if let items = bill.lineItems, !items.isEmpty {
                Section("Line Items") {
                    ForEach(items) { item in
                        HStack {
                            Text(item.description ?? "Item")
                            Spacer()
                            Text((item.amount ?? 0).currencyFormatted)
                                .foregroundStyle(.secondary)
                        }
                        .font(.subheadline)
                    }
                }
            }

            if !bill.isPaid {
                Section {
                    Button {
                        showPaymentSheet = true
                    } label: {
                        Label("Record Payment", systemImage: "creditcard.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .listRowBackground(Color.clear)
                }
            }
        }
        .navigationTitle("Bill Details")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPaymentSheet) {
            PaymentFormView(bill: bill, viewModel: viewModel)
        }
    }
}

// MARK: - Payment Form

struct PaymentFormView: View {
    let bill: MaintenanceBill
    @ObservedObject var viewModel: FinanceViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var amount = ""
    @State private var paymentMode = "UPI"
    @State private var referenceNumber = ""
    private let paymentModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Online"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Payment Amount") {
                    HStack {
                        Text("₹")
                        TextField("Amount", text: $amount)
                            .keyboardType(.decimalPad)
                    }
                    Text("Outstanding: \(bill.outstandingAmount.currencyFormatted)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Section("Payment Details") {
                    Picker("Mode", selection: $paymentMode) {
                        ForEach(paymentModes, id: \.self) { Text($0).tag($0) }
                    }
                    TextField("Reference Number", text: $referenceNumber)
                }
            }
            .navigationTitle("Record Payment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Pay") {
                        Task { await pay() }
                    }
                    .disabled(amount.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
            .onAppear {
                amount = String(bill.outstandingAmount)
            }
        }
    }

    private func pay() async {
        guard let amountVal = Double(amount) else { return }
        let success = await viewModel.recordPayment(
            billId: bill.id,
            amount: amountVal,
            paymentMode: paymentMode,
            referenceNumber: referenceNumber.isEmpty ? nil : referenceNumber
        )
        if success { dismiss() }
    }
}

// MARK: - Bill Form

struct BillFormView: View {
    @ObservedObject var viewModel: FinanceViewModel
    @Environment(\.dismiss) private var dismiss

    let societyId: Int

    @State private var description = "Monthly Maintenance"
    @State private var amount = ""
    @State private var dueDate = Date().addingTimeInterval(15 * 24 * 3600)
    @State private var billMonth = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Bill Details") {
                    TextField("Description *", text: $description)
                    HStack {
                        Text("₹")
                        TextField("Amount *", text: $amount)
                            .keyboardType(.decimalPad)
                    }
                }

                Section("Schedule") {
                    TextField("Bill Month (e.g. 2025-01)", text: $billMonth)
                    DatePicker("Due Date", selection: $dueDate, displayedComponents: .date)
                }
            }
            .navigationTitle("Create Bill")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Create") {
                        Task { await save() }
                    }
                    .disabled(description.isEmpty || amount.isEmpty || viewModel.isLoading)
                    .bold()
                }
            }
        }
    }

    private func save() async {
        guard let amountVal = Double(amount) else { return }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let success = await viewModel.createBill(
            societyId: societyId,
            description: description,
            amount: amountVal,
            dueDate: formatter.string(from: dueDate),
            billMonth: billMonth.isEmpty ? nil : billMonth
        )
        if success { dismiss() }
    }
}
