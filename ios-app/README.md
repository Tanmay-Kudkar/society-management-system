# Society Manager - iOS App

A production-ready iOS application built with **Swift** and **SwiftUI** using **MVVM architecture** for the Society Management System. Connects to the existing Spring Boot backend APIs.

## Requirements

- **Xcode 15+**
- **iOS 15.0+** deployment target
- **Swift 5.9+**
- Backend server running at `http://localhost:8080` (configurable)

## Project Structure

```
SocietyManager/
├── App/                    # App entry point, delegate, root view
├── Models/                 # Data models (Codable structs/enums)
├── Services/               # API client and service layer
├── ViewModels/             # MVVM ViewModels (@MainActor)
├── Views/
│   ├── Auth/               # Login, Forgot Password
│   ├── Components/         # Shared UI components
│   ├── Complaints/         # Complaint list, detail, form
│   ├── Dashboard/          # Main tab view, dashboard
│   ├── Documents/          # Document templates
│   ├── Finance/            # Transactions, bills, overview
│   ├── Import/             # Bulk user import
│   ├── Management/         # Units, Users management
│   ├── Notices/            # Notice board
│   ├── Profile/            # User profile, change password
│   └── Vendors/            # Vendor management, approvals
├── Utilities/              # Keychain, constants, extensions, validators
└── Tests/                  # Unit tests
```

## Setup Instructions

### 1. Create Xcode Project

1. Open **Xcode** → File → New → Project
2. Select **iOS → App**
3. Configure:
   - Product Name: `SocietyManager`
   - Organization Identifier: `com.societymanager`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None**
4. Choose location (doesn't matter, we'll replace files)
5. Delete the auto-generated files

### 2. Add Source Files

Copy all files from this `SocietyManager/` directory into the Xcode project:

```bash
# From the ios-app directory, drag files into Xcode project navigator
# Or use:
cp -R SocietyManager/* /path/to/XcodeProject/SocietyManager/
```

Make sure all `.swift` files are added to the **SocietyManager** target.

### 3. Configure Backend URL

Edit `Utilities/Constants.swift` and update the base URL:

```swift
struct API {
    static let baseURL = "http://YOUR_BACKEND_IP:8080"  // Change this
}
```

**For Simulator**: Use `http://localhost:8080`
**For Physical Device**: Use your machine's local IP (e.g., `http://192.168.1.100:8080`)

### 4. Configure App Transport Security

Add to `Info.plist` to allow HTTP connections (development only):

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 5. Build & Run

1. Select target device (Simulator or physical iPhone)
2. Press `Cmd + R` to build and run
3. Login with your backend credentials

## Features

### Authentication
- Email/password login with JWT tokens
- Secure token storage in iOS Keychain
- Auto-login on app restart
- Forgot password / reset password flow
- Change password from profile

### Role-Based Access (12 Roles)
| Level | Roles | Capabilities |
|-------|-------|-------------|
| 0 | Master Admin | Full system access |
| 1 | Society Admin | Full society management |
| 2 | Chairman, Secretary, Treasurer | Committee-level management + finance |
| 3 | Committee, Manager | Notices, vendors, units |
| 4 | Employee, Member | View access, raise complaints |
| 5 | Tenant, Vendor | Limited access |
| 6 | Visitor | Minimal access |

### Dashboard
- Admin: Statistics grid, financial summary, quick actions
- Member: Unit info, quick links to frequently used features

### Unit Management
- List all flats/units with search
- Create, edit, delete units (admin)
- View unit details with resident info

### User Management
- Role-based filtering with horizontal chips
- Create users with role assignment
- View/edit/delete user profiles

### Vendor Management
- Vendor directory with search
- Pending approval queue (admin)
- Approve/reject with inline actions
- Full CRUD for vendor records

### Notice Board
- Society-wide announcements
- Create/edit notices with expiry dates
- Active/inactive toggle

### Finance
- **Transactions**: Income/expense tracking with filters
- **Maintenance Bills**: Generate, track payments, record receipts
- **Financial Overview**: Summary dashboard with charts
- **Payment Recording**: Partial/full payment support

### Complaints
- Raise complaints with category & priority
- Status tracking (Open → In Progress → Resolved → Closed)
- Filter by status

### Documents
- Document template library
- Upload new templates (admin)

### Bulk Import
- Excel file upload for batch user creation
- Validation before import
- Download import template
- Error reporting per row

## Architecture

### MVVM Pattern
- **Models**: Codable structs mapped to backend DTOs
- **ViewModels**: `@MainActor` ObservableObjects, async/await API calls
- **Views**: Pure SwiftUI, declarative UI

### Networking
- Custom `APIClient` singleton using `URLSession`
- Automatic JWT injection from Keychain
- Centralized error handling (401 → logout, 403 → permission denied)
- Support for GET, POST, PUT, PATCH, DELETE, multipart upload, download

### Security
- JWT tokens stored in iOS Keychain (not UserDefaults)
- Token expiry checking with automatic logout
- No sensitive data in plain storage
- Role-based UI element visibility

## Testing

Run tests in Xcode: `Cmd + U`

Test coverage:
- Role hierarchy and permission matrix
- Model serialization/deserialization
- Input validation (email, phone, password)
- Currency formatting
- API endpoint configuration

## Configuration

| Setting | File | Default |
|---------|------|---------|
| Backend URL | `Constants.swift` | `http://localhost:8080` |
| JWT Token Key | `Constants.swift` | `jwt_token` |
| Token Refresh | `KeychainManager.swift` | Via expiry check |
| Date Format | `Extensions.swift` | `yyyy-MM-dd` |

## Troubleshooting

### "Network connection failed"
- Ensure backend is running at the configured URL
- For simulator: `http://localhost:8080`
- For device: use machine's IP, ensure same WiFi

### "Unauthorized" after login
- Check backend JWT configuration
- Ensure clock sync between device and server
- Try logging out and back in

### Build errors with missing types
- Ensure all `.swift` files are added to the SocietyManager target
- Check File Inspector → Target Membership for each file

## License

Part of the Society Management System project.
