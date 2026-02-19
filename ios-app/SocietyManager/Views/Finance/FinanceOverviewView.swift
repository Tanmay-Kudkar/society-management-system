import SwiftUI

struct FinanceOverviewView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = FinanceViewModel()
    var societyId: Int

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if viewModel.isLoading && viewModel.transactionSummary == nil {
                    LoadingView()
                } else {
                    if let summary = viewModel.transactionSummary {
                        SummarySection(summary: summary)
                    }

                    QuickActionsSection()

                    RecentTransactionsSection(transactions: Array(viewModel.transactions.prefix(5)))
                }
            }
            .padding()
        }
        .navigationTitle("Finance")
        .refreshable { await loadData() }
        .toast(message: $viewModel.errorMessage, isError: true)
        .task { await loadData() }
    }

    private func loadData() async {
        await viewModel.loadAll(societyId: societyId)
    }
}

// MARK: - Summary

private struct SummarySection: View {
    let summary: TransactionSummary

    var body: some View {
        VStack(spacing: 12) {
            SectionHeaderView(title: "Financial Summary", icon: "chart.bar.fill")

            LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 12) {
                StatCard(
                    title: "Total Income",
                    value: (summary.totalIncome ?? 0).currencyFormatted,
                    icon: "arrow.down.circle.fill",
                    color: .green
                )
                StatCard(
                    title: "Total Expense",
                    value: (summary.totalExpense ?? 0).currencyFormatted,
                    icon: "arrow.up.circle.fill",
                    color: .red
                )
                StatCard(
                    title: "Net Balance",
                    value: ((summary.totalIncome ?? 0) - (summary.totalExpense ?? 0)).currencyFormatted,
                    icon: "banknote.fill",
                    color: .blue
                )
                StatCard(
                    title: "Transactions",
                    value: "\(summary.totalTransactions ?? 0)",
                    icon: "list.bullet.rectangle",
                    color: .purple
                )
            }
        }
    }
}

// MARK: - Quick Actions

private struct QuickActionsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeaderView(title: "Quick Actions", icon: "bolt.fill")

            LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 12) {
                NavigationLink {
                    TransactionListView()
                } label: {
                    QuickActionCard(title: "Transactions", icon: "arrow.left.arrow.right", color: .blue)
                }

                NavigationLink {
                    MaintenanceBillListView()
                } label: {
                    QuickActionCard(title: "Bills", icon: "doc.text.fill", color: .orange)
                }

                NavigationLink {
                    ComplaintListView()
                } label: {
                    QuickActionCard(title: "Complaints", icon: "exclamationmark.bubble.fill", color: .red)
                }
            }
        }
    }
}

private struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(title)
                .font(.caption.bold())
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Recent Transactions

private struct RecentTransactionsSection: View {
    let transactions: [Transaction]

    var body: some View {
        if !transactions.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    SectionHeaderView(title: "Recent Transactions", icon: "clock.fill")
                    Spacer()
                    NavigationLink("See All") {
                        TransactionListView()
                    }
                    .font(.caption)
                }

                ForEach(transactions) { txn in
                    TransactionRowView(transaction: txn)
                    if txn.id != transactions.last?.id {
                        Divider()
                    }
                }
            }
            .padding()
            .background(.background)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.05), radius: 4)
        }
    }
}
