import Foundation

enum ValidationError: LocalizedError {
    case emptyField(String)
    case invalidEmail
    case invalidPhone
    case passwordTooShort
    case passwordsDoNotMatch

    var errorDescription: String? {
        switch self {
        case .emptyField(let field):
            return "\(field) is required"
        case .invalidEmail:
            return "Please enter a valid email address"
        case .invalidPhone:
            return "Please enter a valid 10-digit phone number"
        case .passwordTooShort:
            return "Password must be at least 6 characters"
        case .passwordsDoNotMatch:
            return "Passwords do not match"
        }
    }
}

enum Validators {
    static func validateEmail(_ email: String) -> ValidationError? {
        guard !email.trimmed.isEmpty else { return .emptyField("Email") }
        guard email.isValidEmail else { return .invalidEmail }
        return nil
    }

    static func validatePassword(_ password: String) -> ValidationError? {
        guard !password.isEmpty else { return .emptyField("Password") }
        guard password.count >= 6 else { return .passwordTooShort }
        return nil
    }

    static func validatePhone(_ phone: String) -> ValidationError? {
        guard !phone.trimmed.isEmpty else { return .emptyField("Phone") }
        guard phone.isValidPhone else { return .invalidPhone }
        return nil
    }

    static func validateRequired(_ value: String, field: String) -> ValidationError? {
        guard !value.trimmed.isEmpty else { return .emptyField(field) }
        return nil
    }
}
