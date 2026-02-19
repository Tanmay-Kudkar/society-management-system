import Foundation

@MainActor
final class NoticeViewModel: ObservableObject {
    @Published var notices: [Notice] = []
    @Published var selectedNotice: Notice?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var searchText = ""

    private let noticeService = NoticeService.shared

    var filteredNotices: [Notice] {
        guard !searchText.isEmpty else { return notices }
        return notices.filter { notice in
            notice.title.localizedCaseInsensitiveContains(searchText) ||
            (notice.content?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    func loadNotices(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            notices = try await noticeService.getBySociety(societyId)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load notices"
        }
        isLoading = false
    }

    func createNotice(request: NoticeRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let notice = try await noticeService.create(request)
            notices.insert(notice, at: 0)
            successMessage = "Notice created successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create notice"
        }
        isLoading = false
        return false
    }

    func updateNotice(id: Int, request: NoticeRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let updated = try await noticeService.update(id: id, request: request)
            if let index = notices.firstIndex(where: { $0.id == id }) {
                notices[index] = updated
            }
            successMessage = "Notice updated"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to update notice"
        }
        isLoading = false
        return false
    }

    func deleteNotice(id: Int) async {
        isLoading = true
        do {
            try await noticeService.delete(id: id)
            notices.removeAll { $0.id == id }
            successMessage = "Notice deleted"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to delete notice"
        }
        isLoading = false
    }
}
