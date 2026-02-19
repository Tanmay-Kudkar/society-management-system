import Foundation

final class VendorService {
    static let shared = VendorService()
    private let api = APIClient.shared
    private init() {}

    func getAll() async throws -> [Vendor] {
        try await api.request(AppConstants.API.Vendors.base)
    }

    func getById(_ id: Int) async throws -> Vendor {
        try await api.request(AppConstants.API.Vendors.byId(id))
    }

    func getBySociety(_ societyId: Int) async throws -> [Vendor] {
        try await api.request(AppConstants.API.Vendors.bySociety(societyId))
    }

    func create(_ request: VendorRequest) async throws -> Vendor {
        try await api.request(AppConstants.API.Vendors.base, method: .post, body: request)
    }

    func update(id: Int, request: VendorRequest) async throws -> Vendor {
        try await api.request(AppConstants.API.Vendors.byId(id), method: .put, body: request)
    }

    func delete(id: Int) async throws {
        try await api.requestVoid(AppConstants.API.Vendors.byId(id), method: .delete)
    }

    func approve(id: Int) async throws -> Vendor {
        try await api.request(AppConstants.API.Vendors.approve(id), method: .patch)
    }

    func reject(id: Int) async throws -> Vendor {
        try await api.request(AppConstants.API.Vendors.reject(id), method: .patch)
    }

    func getPending() async throws -> [Vendor] {
        try await api.request(AppConstants.API.Vendors.pending)
    }
}
