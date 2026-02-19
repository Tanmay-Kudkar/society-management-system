import Foundation

@MainActor
final class VendorViewModel: ObservableObject {
    @Published var vendors: [Vendor] = []
    @Published var pendingVendors: [Vendor] = []
    @Published var selectedVendor: Vendor?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var searchText = ""

    private let vendorService = VendorService.shared

    var filteredVendors: [Vendor] {
        guard !searchText.isEmpty else { return vendors }
        return vendors.filter { vendor in
            vendor.name.localizedCaseInsensitiveContains(searchText) ||
            (vendor.serviceType?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (vendor.contactPerson?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    func loadVendors(societyId: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            vendors = try await vendorService.getBySociety(societyId)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load vendors"
        }
        isLoading = false
    }

    func loadPendingVendors() async {
        do {
            pendingVendors = try await vendorService.getPending()
        } catch {
            // Silently fail
        }
    }

    func createVendor(request: VendorRequest) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            let vendor = try await vendorService.create(request)
            vendors.insert(vendor, at: 0)
            successMessage = "Vendor created successfully"
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create vendor"
        }
        isLoading = false
        return false
    }

    func approveVendor(id: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            let updated = try await vendorService.approve(id: id)
            if let index = vendors.firstIndex(where: { $0.id == id }) {
                vendors[index] = updated
            }
            pendingVendors.removeAll { $0.id == id }
            successMessage = "Vendor approved"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to approve vendor"
        }
        isLoading = false
    }

    func rejectVendor(id: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            let updated = try await vendorService.reject(id: id)
            if let index = vendors.firstIndex(where: { $0.id == id }) {
                vendors[index] = updated
            }
            pendingVendors.removeAll { $0.id == id }
            successMessage = "Vendor rejected"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to reject vendor"
        }
        isLoading = false
    }

    func deleteVendor(id: Int) async {
        isLoading = true
        do {
            try await vendorService.delete(id: id)
            vendors.removeAll { $0.id == id }
            successMessage = "Vendor deleted"
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to delete vendor"
        }
        isLoading = false
    }
}
