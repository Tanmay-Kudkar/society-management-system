# Society Manager - Android App

A production-ready Android mobile application built with **Kotlin** and **Jetpack Compose** for the Society Management System. Integrates with the existing Spring Boot backend API.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Kotlin 2.1.0 |
| UI Framework | Jetpack Compose (BOM 2024.12.01) |
| Architecture | MVVM + Repository Pattern |
| DI | Hilt 2.53.1 |
| Networking | Retrofit 2.11.0 + OkHttp 4.12.0 |
| Serialization | Gson 2.11.0 |
| Navigation | Compose Navigation 2.8.5 |
| Local Storage | DataStore + EncryptedSharedPreferences |
| Push Notifications | Firebase Cloud Messaging |
| Async | Kotlin Coroutines + Flow |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 35 (Android 15) |

## Architecture

```
┌─────────────────────────────────────────────┐
│                  UI Layer                    │
│  Screens (Compose) ← ViewModels (StateFlow) │
├─────────────────────────────────────────────┤
│               Domain Layer                   │
│          Repositories (safeApiCall)           │
├─────────────────────────────────────────────┤
│                Data Layer                    │
│  Retrofit APIs │ DTOs │ TokenManager │ DI    │
└─────────────────────────────────────────────┘
```

## Project Structure

```
app/src/main/java/com/society/android/
├── SocietyApp.kt                   # Application class (@HiltAndroidApp)
├── MainActivity.kt                 # Entry point with splash + navigation
├── data/
│   ├── local/
│   │   ├── TokenManager.kt         # Encrypted JWT storage
│   │   └── SettingsDataStore.kt    # Dark mode preferences
│   └── remote/
│       ├── AuthInterceptor.kt      # OkHttp Bearer token interceptor
│       ├── api/                    # Retrofit API interfaces
│       │   ├── AuthApi.kt
│       │   ├── UserApi.kt
│       │   ├── SocietyApi.kt
│       │   ├── FlatApi.kt
│       │   ├── NoticeApi.kt
│       │   ├── ComplaintTicketApi.kt
│       │   ├── VendorApi.kt
│       │   ├── FinanceApi.kt
│       │   └── VisitorApi.kt
│       └── dto/                    # Data Transfer Objects
│           ├── auth/AuthDtos.kt
│           ├── user/UserDtos.kt
│           ├── society/SocietyDtos.kt
│           ├── flat/FlatDtos.kt
│           ├── notice/NoticeDtos.kt
│           ├── complaint/ComplaintDtos.kt
│           ├── ticket/TicketDtos.kt
│           ├── vendor/VendorDtos.kt
│           ├── finance/FinanceDtos.kt
│           ├── visitor/VisitorDtos.kt
│           └── common/CommonDtos.kt
├── di/
│   └── AppModule.kt                # Hilt dependency injection
├── domain/
│   └── repository/
│       ├── BaseRepository.kt       # Safe API call wrapper
│       ├── AuthRepository.kt
│       ├── ManagementRepository.kt
│       └── Repositories.kt         # Notice, Complaint, Ticket, etc.
├── services/
│   └── SocietyFCMService.kt       # Firebase push notifications
├── ui/
│   ├── auth/
│   │   ├── LoginScreen.kt
│   │   └── LoginViewModel.kt
│   ├── components/
│   │   └── CommonComponents.kt     # Reusable UI components
│   ├── complaints/
│   │   ├── ComplaintListScreen.kt
│   │   ├── CreateComplaintScreen.kt
│   │   └── ComplaintViewModel.kt
│   ├── dashboard/
│   │   ├── DashboardScreen.kt
│   │   └── DashboardViewModel.kt
│   ├── finance/
│   │   ├── FinanceScreen.kt
│   │   └── FinanceViewModel.kt
│   ├── management/
│   │   ├── UnitListScreen.kt
│   │   ├── UserListScreen.kt
│   │   └── ManagementViewModel.kt
│   ├── navigation/
│   │   ├── AppNavigation.kt       # NavHost + bottom navigation
│   │   └── Screen.kt              # Route definitions
│   ├── notices/
│   │   ├── NoticeListScreen.kt
│   │   ├── CreateNoticeScreen.kt
│   │   └── NoticeViewModel.kt
│   ├── settings/
│   │   ├── SettingsScreen.kt
│   │   ├── ProfileScreen.kt
│   │   ├── ChangePasswordScreen.kt
│   │   └── SettingsViewModel.kt
│   ├── theme/
│   │   ├── Color.kt
│   │   ├── Theme.kt
│   │   └── Type.kt
│   ├── tickets/
│   │   ├── TicketListScreen.kt
│   │   ├── CreateTicketScreen.kt
│   │   └── TicketViewModel.kt
│   ├── vendors/
│   │   ├── VendorListScreen.kt
│   │   ├── CreateVendorScreen.kt
│   │   └── VendorViewModel.kt
│   └── visitors/
│       ├── VisitorListScreen.kt
│       ├── CreateVisitorScreen.kt
│       └── VisitorViewModel.kt
└── utils/
    ├── Constants.kt                # Roles, permissions, RBAC
    ├── Formatters.kt               # Currency, date, status
    └── Resource.kt                 # Sealed class for API states
```

## Features

### Authentication
- JWT-based login with secure token storage (EncryptedSharedPreferences)
- Auto-redirect based on auth state
- Forgot password flow
- Change password

### Role-Based Access Control (RBAC)
12 roles with hierarchical permissions:
- **MASTER_ADMIN** / **SOCIETY_ADMIN** - Full access
- **CHAIRMAN** / **SECRETARY** / **TREASURER** - Management + Finance
- **COMMITTEE_MEMBER** / **MANAGER** - Moderate access
- **EMPLOYEE** / **MEMBER** - Standard access
- **TENANT** / **VENDOR** / **VISITOR** - Limited access

### Modules
| Module | Features |
|--------|----------|
| **Dashboard** | Role-based stats, recent notices, complaints, quick actions |
| **Notices** | CRUD with priority levels (Low/Normal/High/Urgent) |
| **Complaints** | Create, track, categorize (Maintenance/Security/Noise/etc.) |
| **Tickets** | Service tickets with priority and status tracking |
| **Finance** | Bills, transactions, payments with INR formatting |
| **Vendors** | Directory with approval workflow (Approve/Reject) |
| **Visitors** | Log, approve/reject visitors with unit assignment |
| **Members** | User directory with role badges |
| **Units** | Flat and wing management with tab navigation |
| **Settings** | Profile, dark mode, change password, logout |

### UI/UX
- Material Design 3 with dynamic color (Android 12+)
- Light/Dark theme with system-wide toggle
- Edge-to-edge design with splash screen
- Pull-to-refresh, loading states, error handling
- Empty state screens with action prompts
- Status chips with color coding

### Push Notifications (FCM)
- Categorized notification channels: Notices, Bills, Complaints, General
- Deep linking to relevant screens

## Setup & Build

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 35

### Configuration

1. **Set backend URL** in `utils/Constants.kt`:
   ```kotlin
   const val BASE_URL = "http://10.0.2.2:8080/" // Emulator → localhost
   // For physical device, use your machine's IP:
   // const val BASE_URL = "http://192.168.x.x:8080/"
   ```

2. **Firebase setup** (optional, for push notifications):
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Download `google-services.json` and place it in `app/`
   - If skipping FCM, remove `id("com.google.gms.google-services")` from `app/build.gradle.kts`

### Build

```bash
cd android-app

# Debug build
./gradlew assembleDebug

# Release build (requires signing config)
./gradlew assembleRelease

# Run tests
./gradlew test

# Install on connected device
./gradlew installDebug
```

### Running with Backend

1. Start the Spring Boot backend:
   ```bash
   cd ../backend && ./mvnw spring-boot:run
   ```

2. Run the Android app from Android Studio or:
   ```bash
   ./gradlew installDebug
   ```

3. Login with existing credentials from the database.

## Security Features

- JWT tokens stored in EncryptedSharedPreferences
- Auth interceptor adds Bearer token to all API calls
- Network security config allows cleartext only for development
- ProGuard rules for production builds
- Role-based UI visibility controls

## Testing

```bash
# Unit tests
./gradlew test

# Specific test class
./gradlew test --tests "com.society.android.ConstantsTest"
./gradlew test --tests "com.society.android.AuthRepositoryTest"
```

### Test Coverage
- **ConstantsTest** - Role-based permission functions (isAdmin, canManage, canViewFinance, canCreateNotice, canImportData)
- **FormattersTest** - Currency/date/status formatting with null handling
- **AuthRepositoryTest** - Login flow, session management, logout

## API Integration

The app integrates with 10 backend API groups across 42+ endpoints:

| API | Endpoints |
|-----|-----------|
| Auth | login, logout, me, forgot-password, change-password |
| Users | CRUD, bulk import |
| Societies | CRUD |
| Flats/Wings | CRUD |
| Notices | CRUD by society |
| Complaints | CRUD, status updates |
| Tickets | CRUD, status updates |
| Vendors | CRUD, approve/reject, pending list |
| Finance | Bills, transactions, payments, reports |
| Visitors | CRUD, approve/reject, documents, contacts |
