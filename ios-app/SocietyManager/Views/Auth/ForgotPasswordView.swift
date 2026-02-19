import SwiftUI

struct ForgotPasswordView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "key.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(.orange.gradient)
                    .padding(.top, 40)

                Text("Reset Password")
                    .font(.title2.bold())

                Text("Enter your email address and we'll send you a link to reset your password.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Email")
                        .font(.subheadline.bold())
                        .foregroundStyle(.secondary)

                    HStack {
                        Image(systemName: "envelope.fill")
                            .foregroundStyle(.secondary)
                        TextField("your@email.com", text: $authViewModel.forgotEmail)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .autocorrectionDisabled()
                    }
                    .padding()
                    .background(.quaternary.opacity(0.5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.horizontal)

                if let error = authViewModel.errorMessage {
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .padding(.horizontal)
                }

                if let success = authViewModel.successMessage {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text(success)
                    }
                    .font(.subheadline)
                    .foregroundStyle(.green)
                    .padding(.horizontal)
                }

                Button {
                    Task { await authViewModel.forgotPassword() }
                } label: {
                    HStack {
                        if authViewModel.isLoading {
                            ProgressView().tint(.white)
                        }
                        Text("Send Reset Link")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(authViewModel.isLoading ? .gray : .orange)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(authViewModel.isLoading)
                .padding(.horizontal)

                Spacer()
            }
            .background(Color.appBackground)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
            .onTapGesture { hideKeyboard() }
        }
    }
}
