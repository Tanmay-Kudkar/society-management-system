import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            if authViewModel.userRole.isAdmin || authViewModel.userRole.isCommittee {
                ManagementTabView()
                    .tabItem {
                        Label("Manage", systemImage: "building.2.fill")
                    }
                    .tag(1)
            }

            NoticeListView()
                .tabItem {
                    Label("Notices", systemImage: "megaphone.fill")
                }
                .tag(2)

            if authViewModel.userRole.canManageFinance || authViewModel.flatId != nil {
                FinanceTabView()
                    .tabItem {
                        Label("Finance", systemImage: "indianrupeesign.circle.fill")
                    }
                    .tag(3)
            }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(.blue)
    }
}

// MARK: - Management Tab (Admin/Committee Only)

struct ManagementTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        NavigationStack {
            List {
                if authViewModel.userRole.canManageUsers {
                    NavigationLink {
                        UserListView()
                    } label: {
                        Label("User Management", systemImage: "person.3.fill")
                    }
                }

                NavigationLink {
                    UnitListView()
                } label: {
                    Label("Unit Management", systemImage: "building.fill")
                }

                if authViewModel.userRole.canManageVendors {
                    NavigationLink {
                        VendorListView()
                    } label: {
                        Label("Vendors", systemImage: "wrench.and.screwdriver.fill")
                    }
                }

                if authViewModel.userRole.canManageDocuments {
                    NavigationLink {
                        DocumentListView()
                    } label: {
                        Label("Documents", systemImage: "doc.text.fill")
                    }
                }

                if authViewModel.userRole.isAdmin {
                    NavigationLink {
                        BulkImportView()
                    } label: {
                        Label("Bulk Import", systemImage: "square.and.arrow.down.fill")
                    }
                }
            }
            .navigationTitle("Management")
        }
    }
}

// MARK: - Finance Tab

struct FinanceTabView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        NavigationStack {
            List {
                if authViewModel.userRole.canManageFinance {
                    NavigationLink {
                        TransactionListView()
                    } label: {
                        Label("Transactions", systemImage: "arrow.left.arrow.right")
                    }
                }

                NavigationLink {
                    MaintenanceBillListView()
                } label: {
                    Label("Maintenance Bills", systemImage: "doc.text.fill")
                }

                NavigationLink {
                    ComplaintListView()
                } label: {
                    Label("Complaints", systemImage: "exclamationmark.bubble.fill")
                }

                if authViewModel.userRole.canManageFinance, let societyId = authViewModel.societyId {
                    NavigationLink {
                        FinanceOverviewView(societyId: societyId)
                    } label: {
                        Label("Financial Overview", systemImage: "chart.bar.fill")
                    }
                }
            }
            .navigationTitle("Finance")
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthViewModel())
}
