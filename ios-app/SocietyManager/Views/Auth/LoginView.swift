import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showForgotPassword = false
    @State private var isPasswordVisible = false
    @FocusState private var focusedField: Field?

    enum Field: Hashable {
        case email, password
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Logo / Header
                    VStack(spacing: 12) {
                        Image(systemName: "building.2.fill")
                            .font(.system(size: 72))
                            .foregroundStyle(.blue.gradient)

                        Text("Society Manager")
                            .font(.largeTitle.bold())

                        Text("Sign in to your account")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 40)

                    // Form
                    VStack(spacing: 16) {
                        // Email
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Email")
                                .font(.subheadline.bold())
                                .foregroundStyle(.secondary)

                            HStack {
                                Image(systemName: "envelope.fill")
                                    .foregroundStyle(.secondary)
                                TextField("your@email.com", text: $authViewModel.loginEmail)
                                    .textContentType(.emailAddress)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .autocorrectionDisabled()
                                    .focused($focusedField, equals: .email)
                                    .submitLabel(.next)
                                    .onSubmit { focusedField = .password }
                            }
                            .padding()
                            .background(.quaternary.opacity(0.5))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        // Password
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Password")
                                .font(.subheadline.bold())
                                .foregroundStyle(.secondary)

                            HStack {
                                Image(systemName: "lock.fill")
                                    .foregroundStyle(.secondary)
                                if isPasswordVisible {
                                    TextField("Password", text: $authViewModel.loginPassword)
                                        .focused($focusedField, equals: .password)
                                } else {
                                    SecureField("Password", text: $authViewModel.loginPassword)
                                        .focused($focusedField, equals: .password)
                                }
                                Button {
                                    isPasswordVisible.toggle()
                                } label: {
                                    Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding()
                            .background(.quaternary.opacity(0.5))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        // Forgot Password
                        HStack {
                            Spacer()
                            Button("Forgot Password?") {
                                showForgotPassword = true
                            }
                            .font(.subheadline)
                        }
                    }
                    .padding(.horizontal)

                    // Error
                    if let error = authViewModel.errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.circle.fill")
                            Text(error)
                        }
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                    }

                    // Login Button
                    Button {
                        Task { await authViewModel.login() }
                    } label: {
                        HStack {
                            if authViewModel.isLoading {
                                ProgressView()
                                    .tint(.white)
                            }
                            Text("Sign In")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(authViewModel.isLoading ? .gray : .blue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .disabled(authViewModel.isLoading)
                    .padding(.horizontal)

                    Spacer()
                }
            }
            .background(Color.appBackground)
            .sheet(isPresented: $showForgotPassword) {
                ForgotPasswordView()
                    .environmentObject(authViewModel)
            }
            .onTapGesture { hideKeyboard() }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthViewModel())
}
