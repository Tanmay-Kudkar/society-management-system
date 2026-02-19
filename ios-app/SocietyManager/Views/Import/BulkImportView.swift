import SwiftUI
import UniformTypeIdentifiers

struct BulkImportView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = ImportViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.down.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.blue)
                    Text("Bulk Import Users")
                        .font(.title2.bold())
                    Text("Upload an Excel file to import multiple users at once")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top)

                // Download template
                GroupBox {
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "doc.text.fill")
                                .foregroundStyle(.green)
                            Text("Download Template")
                                .font(.subheadline.bold())
                            Spacer()
                        }
                        Text("Start with our pre-formatted template to ensure your data is in the correct format.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Button {
                            Task {
                                guard let societyId = authViewModel.societyId else { return }
                                await viewModel.downloadTemplate(societyId: societyId)
                            }
                        } label: {
                            Label("Download Template", systemImage: "arrow.down.doc.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(viewModel.isLoading)
                    }
                }
                .padding(.horizontal)

                // File picker
                GroupBox {
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "folder.fill")
                                .foregroundStyle(.orange)
                            Text("Select File")
                                .font(.subheadline.bold())
                            Spacer()
                        }

                        if let fileName = viewModel.selectedFileName {
                            HStack {
                                Image(systemName: "doc.fill")
                                    .foregroundStyle(.blue)
                                Text(fileName)
                                    .font(.caption)
                                Spacer()
                                Button { viewModel.clearFile() } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(8)
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        } else {
                            Button {
                                viewModel.showFilePicker = true
                            } label: {
                                VStack(spacing: 8) {
                                    Image(systemName: "arrow.up.doc.fill")
                                        .font(.title2)
                                    Text("Choose Excel File")
                                        .font(.subheadline)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [5]))
                                        .foregroundStyle(.secondary)
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal)

                // Actions
                if viewModel.selectedFileURL != nil {
                    VStack(spacing: 12) {
                        // Validate
                        Button {
                            Task {
                                guard let societyId = authViewModel.societyId else { return }
                                await viewModel.validateFile(societyId: societyId)
                            }
                        } label: {
                            Label("Validate", systemImage: "checkmark.shield.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(viewModel.isLoading)

                        // Import
                        if viewModel.validationPassed {
                            Button {
                                Task {
                                    guard let societyId = authViewModel.societyId else { return }
                                    await viewModel.executeImport(societyId: societyId)
                                }
                            } label: {
                                Label("Import Users", systemImage: "person.3.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(viewModel.isLoading)
                        }
                    }
                    .padding(.horizontal)
                }

                // Loading
                if viewModel.isLoading {
                    ProgressView("Processing...")
                        .padding()
                }

                // Results
                if let result = viewModel.importResult {
                    ImportResultView(result: result)
                        .padding(.horizontal)
                }

                // Errors
                if let error = viewModel.errorMessage {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                        Text(error)
                            .font(.caption)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.red.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal)
                }

                Spacer(minLength: 40)
            }
        }
        .navigationTitle("Bulk Import")
        .navigationBarTitleDisplayMode(.inline)
        .fileImporter(
            isPresented: $viewModel.showFilePicker,
            allowedContentTypes: [
                UTType(filenameExtension: "xlsx") ?? .data,
                UTType(filenameExtension: "xls") ?? .data,
                .commaSeparatedText
            ],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                if let url = urls.first {
                    viewModel.selectFile(url: url)
                }
            case .failure(let error):
                viewModel.errorMessage = error.localizedDescription
            }
        }
        .toast(message: $viewModel.successMessage)
    }
}

// MARK: - Import Result

struct ImportResultView: View {
    let result: BulkImportResponse

    var body: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .foregroundStyle(.blue)
                    Text("Import Results")
                        .font(.subheadline.bold())
                    Spacer()
                }

                if let total = result.totalCount {
                    LabeledContent("Total Rows", value: "\(total)")
                }
                if let success = result.successCount {
                    LabeledContent("Successful") {
                        Text("\(success)")
                            .foregroundStyle(.green)
                            .bold()
                    }
                }
                if let failed = result.failureCount {
                    LabeledContent("Failed") {
                        Text("\(failed)")
                            .foregroundStyle(failed > 0 ? .red : .primary)
                            .bold()
                    }
                }

                // Errors
                if let errors = result.errors, !errors.isEmpty {
                    Divider()
                    Text("Errors:")
                        .font(.caption.bold())
                        .foregroundStyle(.red)
                    ForEach(errors) { error in
                        HStack(alignment: .top) {
                            Text("Row \(error.row ?? 0):")
                                .font(.caption.bold())
                            Text(error.message ?? "Unknown error")
                                .font(.caption)
                        }
                        .foregroundStyle(.red)
                    }
                }

                // Success
                if let rows = result.successRows, !rows.isEmpty {
                    Divider()
                    Text("Imported Users:")
                        .font(.caption.bold())
                        .foregroundStyle(.green)
                    ForEach(rows.prefix(10)) { row in
                        HStack {
                            Text(row.name ?? "")
                                .font(.caption)
                            Spacer()
                            Text(row.email ?? "")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    if rows.count > 10 {
                        Text("... and \(rows.count - 10) more")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}
