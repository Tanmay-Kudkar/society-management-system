import Foundation

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case unauthorized
    case forbidden(String)
    case notFound
    case conflict(String)
    case validationError(String)
    case serverError(String)
    case networkError(Error)
    case unknown(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid request URL"
        case .noData:
            return "No data received from server"
        case .decodingError(let error):
            return "Data format error: \(error.localizedDescription)"
        case .unauthorized:
            return "Your session has expired. Please log in again."
        case .forbidden(let msg):
            return msg.isEmpty ? "You don't have permission to perform this action" : msg
        case .notFound:
            return "The requested resource was not found"
        case .conflict(let msg):
            return msg
        case .validationError(let msg):
            return msg
        case .serverError(let msg):
            return msg.isEmpty ? "An unexpected server error occurred. Please try again." : msg
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unknown(let code, let msg):
            return "Error (\(code)): \(msg)"
        }
    }
}

// MARK: - HTTP Method

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - API Response Wrapper

struct APIErrorResponse: Codable {
    let message: String?
    let error: String?
    let status: Int?

    var displayMessage: String {
        message ?? error ?? "Unknown error"
    }
}

// MARK: - API Client

final class APIClient {

    static let shared = APIClient()
    private let session: URLSession
    private let decoder = JSONDecoder.apiDecoder
    private let encoder = JSONEncoder.apiEncoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = AppConstants.API.timeout
        config.timeoutIntervalForResource = 60
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        self.session = URLSession(configuration: config)
    }

    // MARK: - Core Request

    func request<T: Decodable>(
        _ path: String,
        method: HTTPMethod = .get,
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        let data = try await rawRequest(path, method: method, body: body, queryItems: queryItems)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Request returning Void

    func requestVoid(
        _ path: String,
        method: HTTPMethod = .get,
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws {
        _ = try await rawRequest(path, method: method, body: body, queryItems: queryItems)
    }

    // MARK: - Upload (multipart/form-data)

    func upload<T: Decodable>(
        _ path: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        fieldName: String = "file",
        additionalFields: [String: String] = [:]
    ) async throws -> T {
        guard var components = URLComponents(string: AppConstants.API.baseURL + path) else {
            throw APIError.invalidURL
        }

        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.post.rawValue

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let token = KeychainManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()

        // File part
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)

        // Additional fields
        for (key, value) in additionalFields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await session.data(for: request)
        try handleHTTPResponse(response, data: data)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Download

    func download(_ path: String) async throws -> Data {
        return try await rawRequest(path, method: .get)
    }

    // MARK: - Private Helpers

    private func rawRequest(
        _ path: String,
        method: HTTPMethod,
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> Data {
        guard var components = URLComponents(string: AppConstants.API.baseURL + path) else {
            throw APIError.invalidURL
        }
        if let queryItems = queryItems, !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = KeychainManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        try handleHTTPResponse(response, data: data)
        return data
    }

    private func handleHTTPResponse(_ response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown(0, "Invalid response")
        }

        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .authTokenExpired, object: nil)
            }
            throw APIError.unauthorized
        case 403:
            let msg = parseErrorMessage(from: data) ?? "Access denied"
            throw APIError.forbidden(msg)
        case 404:
            throw APIError.notFound
        case 409:
            let msg = parseErrorMessage(from: data) ?? "Conflict"
            throw APIError.conflict(msg)
        case 400, 422:
            let msg = parseErrorMessage(from: data) ?? "Validation error"
            throw APIError.validationError(msg)
        case 500...599:
            let msg = parseErrorMessage(from: data) ?? ""
            throw APIError.serverError(msg)
        default:
            let msg = parseErrorMessage(from: data) ?? "Unknown error"
            throw APIError.unknown(httpResponse.statusCode, msg)
        }
    }

    private func parseErrorMessage(from data: Data) -> String? {
        if let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
            return errorResponse.displayMessage
        }
        return String(data: data, encoding: .utf8)
    }
}
