import Foundation

final class FlatService {
    static let shared = FlatService()
    private let api = APIClient.shared
    private init() {}

    func getAll() async throws -> [Flat] {
        try await api.request(AppConstants.API.Flats.base)
    }

    func getById(_ id: Int) async throws -> Flat {
        try await api.request(AppConstants.API.Flats.byId(id))
    }

    func getBySociety(_ societyId: Int) async throws -> [Flat] {
        try await api.request(AppConstants.API.Flats.bySociety(societyId))
    }

    func create(_ request: FlatRequest) async throws -> Flat {
        try await api.request(AppConstants.API.Flats.base, method: .post, body: request)
    }

    func update(id: Int, request: FlatRequest) async throws -> Flat {
        try await api.request(AppConstants.API.Flats.byId(id), method: .put, body: request)
    }

    func delete(id: Int) async throws {
        try await api.requestVoid(AppConstants.API.Flats.byId(id), method: .delete)
    }
}
