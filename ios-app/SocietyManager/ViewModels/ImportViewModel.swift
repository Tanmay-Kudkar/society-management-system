import Foundation
import UniformTypeIdentifiers

@MainActor
final class ImportViewModel: ObservableObject {
    @Published var importResult: BulkImportResponse?
    @Published var isLoading = false
    @Published var isValidating = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var selectedFileName: String?
    @Published var selectedFileURL: URL?
    @Published var showFilePicker = false
    @Published var validationPassed = false
    @Published var fileData: Data?

    private let userService = UserService.shared

    var hasFile: Bool { fileData != nil }

    func selectFile(url: URL) {
        guard url.startAccessingSecurityScopedResource() else {
            errorMessage = "Cannot access file"
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }

        do {
            fileData = try Data(contentsOf: url)
            selectedFileName = url.lastPathComponent
            selectedFileURL = url
            importResult = nil
            errorMessage = nil
            validationPassed = false
        } catch {
            errorMessage = "Failed to read file: \(error.localizedDescription)"
        }
    }

    func clearFile() {
        fileData = nil
        selectedFileName = nil
        selectedFileURL = nil
        importResult = nil
        errorMessage = nil
        validationPassed = false
    }

    // MARK: - Validate

    func validateFile(societyId: Int) async {
        guard let data = fileData, let name = selectedFileName else {
            errorMessage = "Please select a file first"
            return
        }

        isValidating = true
        isLoading = true
        errorMessage = nil

        do {
            importResult = try await userService.bulkImportValidate(fileData: data, fileName: name)
            if let result = importResult, (result.failureCount ?? 0) == 0 {
                validationPassed = true
                successMessage = "Validation passed. \(result.successCount ?? 0) rows ready to import."
            } else {
                validationPassed = false
            }
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Validation failed"
        }

        isValidating = false
        isLoading = false
    }

    // MARK: - Execute Import

    func executeImport(societyId: Int) async -> Bool {
        guard let data = fileData, let name = selectedFileName else {
            errorMessage = "Please select a file first"
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            importResult = try await userService.bulkImport(fileData: data, fileName: name)
            let result = importResult
            successMessage = "Import complete: \(result?.successCount ?? 0) succeeded, \(result?.failureCount ?? 0) failed"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Import failed"
        }

        isLoading = false
        return false
    }

    // MARK: - Download Template

    func downloadTemplate(societyId: Int) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let _ = try await userService.downloadTemplate()
            successMessage = "Template downloaded"
        } catch {
            errorMessage = "Failed to download template"
        }
    }
}
