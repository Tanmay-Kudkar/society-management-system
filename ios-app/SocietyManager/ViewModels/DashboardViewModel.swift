import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var report: DashboardReport?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let financeService = FinanceService.shared

    func loadDashboard(societyId: Int) async {
        isLoading = true
        errorMessage = nil

        do {
            report = try await financeService.getDashboard(societyId)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load dashboard"
        }

        isLoading = false
    }

    func refresh(societyId: Int) async {
        await loadDashboard(societyId: societyId)
    }
}
