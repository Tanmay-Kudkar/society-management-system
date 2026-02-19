import Foundation

final class NoticeService {
    static let shared = NoticeService()
    private let api = APIClient.shared
    private init() {}

    func getAll() async throws -> [Notice] {
        try await api.request(AppConstants.API.Notices.base)
    }

    func getById(_ id: Int) async throws -> Notice {
        try await api.request(AppConstants.API.Notices.byId(id))
    }

    func getBySociety(_ societyId: Int) async throws -> [Notice] {
        try await api.request(AppConstants.API.Notices.bySociety(societyId))
    }

    func create(_ request: NoticeRequest) async throws -> Notice {
        try await api.request(AppConstants.API.Notices.base, method: .post, body: request)
    }

    func update(id: Int, request: NoticeRequest) async throws -> Notice {
        try await api.request(AppConstants.API.Notices.byId(id), method: .put, body: request)
    }

    func delete(id: Int) async throws {
        try await api.requestVoid(AppConstants.API.Notices.byId(id), method: .delete)
    }
}
