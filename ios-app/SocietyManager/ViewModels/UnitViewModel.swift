import Foundation

@MainActor
final class UnitViewModel: ObservableObject {
    @Published var flats: [Flat] = []
    @Published var selectedFlat: Flat?
    @Published var wings: [Wing] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var searchText = ""

    private let flatService = FlatService.shared

    var filteredFlats: [Flat] {
        guard !searchText.isEmpty else { return flats }
        return flats.filter { flat in
            flat.flatNumber.localizedCaseInsensitiveContains(searchText) ||
            (flat.ownerName?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (flat.wingName?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    func loadFlats(societyId: Int) async {
        isLoading = true
        errorMessage = nil

        do {
            flats = try await flatService.getBySociety(societyId)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load units"
        }

        isLoading = false
    }

    func createFlat(request: FlatRequest) async -> Bool {
        isLoading = true
        errorMessage = nil

        do {
            let flat = try await flatService.create(request)
            flats.insert(flat, at: 0)
            successMessage = "Unit created successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create unit"
        }

        isLoading = false
        return false
    }

    func updateFlat(id: Int, request: FlatRequest) async -> Bool {
        isLoading = true
        errorMessage = nil

        do {
            let updated = try await flatService.update(id: id, request: request)
            if let index = flats.firstIndex(where: { $0.id == id }) {
                flats[index] = updated
            }
            successMessage = "Unit updated successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to update unit"
        }

        isLoading = false
        return false
    }

    func deleteFlat(id: Int) async {
        isLoading = true
        errorMessage = nil

        do {
            try await flatService.delete(id: id)
            flats.removeAll { $0.id == id }
            successMessage = "Unit deleted"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to delete unit"
        }

        isLoading = false
    }
}
