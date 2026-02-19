import Foundation

final class SocietyService {
    static let shared = SocietyService()
    private let api = APIClient.shared
    private init() {}

    func getAll() async throws -> [Society] {
        try await api.request(AppConstants.API.Societies.base)
    }

    func getById(_ id: Int) async throws -> Society {
        try await api.request(AppConstants.API.Societies.byId(id))
    }

    func create(_ request: SocietyRequest) async throws -> Society {
        try await api.request(AppConstants.API.Societies.base, method: .post, body: request)
    }

    func update(id: Int, request: SocietyRequest) async throws -> Society {
        try await api.request(AppConstants.API.Societies.byId(id), method: .put, body: request)
    }

    func delete(id: Int) async throws {
        try await api.requestVoid(AppConstants.API.Societies.byId(id), method: .delete)
    }

    func getSettings(_ societyId: Int) async throws -> SocietySetting {
        try await api.request(AppConstants.API.SocietySettings.byId(societyId))
    }
}
