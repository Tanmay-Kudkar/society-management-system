import Foundation

final class UserService {
    static let shared = UserService()
    private let api = APIClient.shared
    private init() {}

    func getAll() async throws -> [User] {
        try await api.request(AppConstants.API.Users.base)
    }

    func getById(_ id: Int) async throws -> User {
        try await api.request(AppConstants.API.Users.byId(id))
    }

    func getBySociety(_ societyId: Int) async throws -> [User] {
        try await api.request(AppConstants.API.Users.bySociety(societyId))
    }

    func create(_ request: UserRequest) async throws -> User {
        try await api.request(AppConstants.API.Users.base, method: .post, body: request)
    }

    func update(id: Int, request: UserRequest) async throws -> User {
        try await api.request(AppConstants.API.Users.byId(id), method: .put, body: request)
    }

    func delete(id: Int) async throws {
        try await api.requestVoid(AppConstants.API.Users.byId(id), method: .delete)
    }

    func getCreatableRoles() async throws -> [String] {
        try await api.request(AppConstants.API.Users.creatableRoles)
    }

    func getUpdatableRoles() async throws -> [String] {
        try await api.request(AppConstants.API.Users.updatableRoles)
    }

    func bulkImportValidate(fileData: Data, fileName: String) async throws -> BulkImportResponse {
        try await api.upload(
            AppConstants.API.Users.bulkImportValidate,
            fileData: fileData,
            fileName: fileName,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    }

    func bulkImport(fileData: Data, fileName: String) async throws -> BulkImportResponse {
        try await api.upload(
            AppConstants.API.Users.bulkImport,
            fileData: fileData,
            fileName: fileName,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    }

    func downloadTemplate() async throws -> Data {
        try await api.download(AppConstants.API.Users.bulkImportTemplate)
    }
}
