import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Header
                    welcomeHeader

                    if viewModel.isLoading && viewModel.report == nil {
                        LoadingView(message: "Loading dashboard...")
                            .frame(height: 300)
                    } else if let error = viewModel.errorMessage, viewModel.report == nil {
                        ErrorView(message: error) {
                            Task { await loadData() }
                        }
                        .frame(height: 300)
                    } else if authViewModel.userRole.isAdmin || authViewModel.userRole.isCommittee {
                        adminDashboard
                    } else {
                        memberDashboard
                    }
                }
                .padding()
            }
            .background(Color.appBackground)
            .navigationTitle("Dashboard")
            .refreshable { await loadData() }
            .task { await loadData() }
        }
    }

    // MARK: - Welcome

    private var welcomeHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Welcome back,")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(authViewModel.userName)
                    .font(.title2.bold())
            }
            Spacer()
            VStack(alignment: .trailing) {
                Image(systemName: authViewModel.userRole.icon)
                    .font(.title2)
                    .foregroundStyle(.blue)
                Text(authViewModel.userRole.displayName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .cardStyle()
    }

    // MARK: - Admin Dashboard

    private var adminDashboard: some View {
        VStack(spacing: 16) {
            // Stats Grid
            if let report = viewModel.report {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 12) {
                    StatCard(
                        title: "Total Units",
                        value: "\(report.totalFlats ?? 0)",
                        icon: "building.fill",
                        color: .blue
                    )
                    StatCard(
                        title: "Occupied",
                        value: "\(report.occupiedFlats ?? 0)",
                        icon: "house.fill",
                        color: .green
                    )
                    StatCard(
                        title: "Members",
                        value: "\(report.totalMembers ?? 0)",
                        icon: "person.3.fill",
                        color: .indigo
                    )
                    StatCard(
                        title: "Pending Bills",
                        value: "\(report.pendingBills ?? 0)",
                        icon: "doc.text.fill",
                        color: .orange
                    )
                    StatCard(
                        title: "Open Tickets",
                        value: "\(report.openTickets ?? 0)",
                        icon: "ticket.fill",
                        color: .purple
                    )
                    StatCard(
                        title: "Pending Vendors",
                        value: "\(report.pendingVendors ?? 0)",
                        icon: "wrench.fill",
                        color: .teal
                    )
                }

                // Financial Summary
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeaderView(title: "Financial Summary")

                    HStack(spacing: 16) {
                        VStack(alignment: .leading) {
                            Text("Income")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text((report.totalIncome ?? 0).currencyFormatted)
                                .font(.headline)
                                .foregroundStyle(.green)
                        }
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text("Expense")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text((report.totalExpense ?? 0).currencyFormatted)
                                .font(.headline)
                                .foregroundStyle(.red)
                        }
                    }
                    .cardStyle()
                }

                // Quick Actions
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeaderView(title: "Quick Actions")

                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        QuickActionButton(icon: "person.badge.plus", title: "Add User", color: .blue)
                        QuickActionButton(icon: "megaphone.fill", title: "Notice", color: .orange)
                        QuickActionButton(icon: "doc.badge.plus", title: "Document", color: .green)
                    }
                }
            }
        }
    }

    // MARK: - Member Dashboard

    private var memberDashboard: some View {
        VStack(spacing: 16) {
            // Unit Info
            if let flatId = authViewModel.flatId {
                HStack {
                    Image(systemName: "house.fill")
                        .font(.title2)
                        .foregroundStyle(.blue)
                    VStack(alignment: .leading) {
                        Text("My Unit")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("Unit #\(flatId)")
                            .font(.headline)
                    }
                    Spacer()
                }
                .cardStyle()
            }

            // Quick Links for Members
            VStack(alignment: .leading, spacing: 12) {
                SectionHeaderView(title: "Quick Access")

                NavigationLink {
                    MaintenanceBillListView()
                } label: {
                    QuickLinkRow(icon: "doc.text.fill", title: "My Bills", subtitle: "View maintenance bills", color: .blue)
                }

                NavigationLink {
                    ComplaintListView()
                } label: {
                    QuickLinkRow(icon: "exclamationmark.bubble.fill", title: "Complaints", subtitle: "Raise or view complaints", color: .orange)
                }

                NavigationLink {
                    NoticeListView()
                } label: {
                    QuickLinkRow(icon: "megaphone.fill", title: "Notices", subtitle: "Society announcements", color: .purple)
                }

                NavigationLink {
                    VendorListView()
                } label: {
                    QuickLinkRow(icon: "wrench.and.screwdriver.fill", title: "Vendors", subtitle: "Service providers", color: .teal)
                }

                NavigationLink {
                    DocumentListView()
                } label: {
                    QuickLinkRow(icon: "doc.fill", title: "Documents", subtitle: "Society documents", color: .green)
                }
            }
        }
    }

    private func loadData() async {
        guard let societyId = authViewModel.societyId else { return }
        await viewModel.loadDashboard(societyId: societyId)
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let icon: String
    let title: String
    var color: Color = .blue

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(title)
                .font(.caption2)
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Quick Link Row

struct QuickLinkRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var color: Color = .blue

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
