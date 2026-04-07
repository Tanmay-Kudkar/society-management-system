<div align="center">

# 🏘️ Society Management System

### *A Multi-Tenant Housing Society Administration Platform*

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.10-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Web_|_Android_|_iOS-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-Monorepo-orange?style=flat-square)
![RBAC](https://img.shields.io/badge/RBAC-12_Roles-purple?style=flat-square)
![Files](https://img.shields.io/badge/Files-612+-red?style=flat-square)

*End-to-end management platform for residential housing societies — finances, residents, vendors, security, and more.*

</div>

---

## 📋 Table of Contents

1. [🔭 Overview](#-overview)
2. [🛠️ Tech Stack](#️-tech-stack)
3. [👥 Role Hierarchy](#-role-hierarchy)
4. [✨ Features](#-features)
5. [📂 Project Structure](#-project-structure)
   - [Backend Architecture](#backend-architecture)
   - [Frontend Architecture](#frontend-architecture)
   - [Mobile Apps](#mobile-apps-architecture)
   - [API Layer](#api-layer)
   - [Database Schema](#database-schema)
6. [🚀 Getting Started](#-getting-started)
7. [🌍 Environment Variables](#-environment-variables)
8. [☁️ Deployment](#️-deployment)
9. [🏗️ Architecture & Scalability](#️-architecture--scalability)
10. [🤝 Contributing](#-contributing)
11. [📄 License](#-license)

---

## 🔭 Overview

| Category | Details |
|----------|---------|
| **Purpose** | End-to-end management platform for residential housing societies |
| **Admin Web** | React 19 SPA with Vite — dashboards, finance, RBAC, bulk operations |
| **Mobile Apps** | Native Android (Kotlin) + iOS (Swift) apps for residents |
| **Backend** | Spring Boot 3.5 REST API — JWT auth, RBAC, email, Razorpay |
| **Database** | PostgreSQL 16 with 46+ relational tables |
| **Roles** | 12-role RBAC hierarchy (Master Admin → Visitor) |
| **Payments** | Razorpay payment gateway integration (INR) |
| **Notifications** | Email via Gmail SMTP |
| **Bulk Operations** | Excel import/export for users, flats, wings, vendors, tenants, vehicles |
| **Deployment** | Render Blueprint — backend + static frontend + managed PostgreSQL |
| **Total Files** | 612+ files across all modules |

---

## 🛠️ Tech Stack

### 🖥️ Frontend (Admin Web Panel)

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | `19.2.0` | UI component library with latest features |
| Vite | `7.2.4` | Lightning-fast build tool & HMR dev server |
| React Router | `7.13.0` | Client-side routing with lazy loading & code splitting |
| TanStack Query | `5.90.20` | Server state management, caching & background refetching |
| Axios | `1.13.3` | HTTP client with JWT interceptors & request/response handling |
| Recharts | `3.7.0` | Composable dashboard charts and data visualization |
| Leaflet | `1.9.4` | Interactive maps for location selection |
| React Leaflet | `5.0.0` | React components for Leaflet |
| Framer Motion | `12.36.0` | Production-ready animation library |
| Lucide React | `0.563.0` | Beautiful & consistent icon library |
| SheetJS (xlsx) | `0.18.5` | Excel file parsing & generation for bulk operations |
| Tailwind CSS | `3.4.17` | Utility-first CSS framework for rapid UI development |
| clsx | `2.1.1` | Conditional className utility |
| Vitest | Latest | Unit testing framework |

### ⚙️ Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | `21` | Language runtime (LTS with modern features) |
| Spring Boot | `3.5.10` | Enterprise application framework |
| Spring Security | `6.x` | Authentication, authorization & security |
| Spring Data JPA | `3.5.x` | ORM & repository pattern with Hibernate |
| PostgreSQL Driver | `42.x` | JDBC driver for PostgreSQL |
| JWT (jjwt) | `0.12.5` | Token creation, parsing & validation |
| Apache POI | `5.2.5` | Excel file generation for reports & exports |
| OpenPDF | `1.3.39` | PDF generation for documents |
| ZXing | `3.5.3` | QR code generation for visitor passes |
| Razorpay Java SDK | `1.4.6` | Payment gateway integration |
| Lombok | `1.18.32` | Boilerplate reduction annotations |
| Spring Mail | `3.5.x` | SMTP email service with templates |
| Spring Actuator | `3.5.x` | Production-ready health checks & monitoring |
| Maven | `3.9.x` | Build automation & dependency management |

### 📱 Mobile Apps

| Technology | Platform | Purpose |
|-----------|---------|---------|
| Kotlin | Android | Modern language for Android development |
| Jetpack Compose | Android | Declarative UI framework |
| Retrofit | Android | Type-safe HTTP client |
| Hilt/Dagger | Android | Dependency injection |
| Firebase FCM | Android | Push notifications |
| Swift | iOS | Native iOS language |
| SwiftUI | iOS | Declarative UI framework |
| Combine | iOS | Reactive framework for async events |

### 🗄️ Infrastructure

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary relational database with ACID compliance |
| Render (Blueprint) | Cloud hosting — backend, static frontend, managed DB |
| Docker | Containerization for consistent deployments |

---

## 👥 Role Hierarchy

The system uses a **12-role RBAC hierarchy** with strict society-scoped data isolation.

```
Level 0 ── MASTER_ADMIN       Platform-wide full access
Level 1 ── SOCIETY_ADMIN      Full access within own society
Level 2 ── CHAIRMAN           Final approval, bank signatory
           SECRETARY           Administrative head, records
           TREASURER           Financial head, billing, accounts
Level 3 ── COMMITTEE          Intermediate management
           MANAGER             Day-to-day operations (no user CRUD)
Level 4 ── EMPLOYEE           Staff/security — visitors, gate logs
           MEMBER              Flat owner — ownership/occupancy records, tenant/vehicle mapping,
                               reminders/notices, and ticket-based issue flow
Level 5 ── TENANT             Renter — owner-approved requests, visitor permissions,
                               notices, tenancy and vehicle records
           VENDOR              AMC/service provider — contract terms, service logs,
                               payment tracking, and maintenance history
Level 6 ── VISITOR            Security-entered visitor logs with member approval flow
```

**Key rules:**
- Parents can read all descendant data; write access follows the matrix above.
- Society data is strictly isolated — no cross-society leakage.
- `SOCIETY_ADMIN` has full CRUD over all roles below them within their society.
- `MANAGER` has no user CRUD rights.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based stateless authentication with refresh tokens
- Email-based forgot/reset password flow with token expiry
- Role-based access control (RBAC) enforced on every API endpoint
- Society-scoped data isolation via backend interceptors
- Login audit trail with device & location tracking
- Secure password hashing with BCrypt
- CORS configuration for cross-origin requests

### 🏢 Society & Unit Management
- Multi-society support under a single platform
- Wing/building management with bulk import
- Flat management (CRUD + bulk import/export)
- Tenant registry with lease tracking
- Vehicle registration & parking management
- Move-in/move-out tracking
- Pet registration system
- Document template management

### 👤 User Management
- Full user CRUD with role assignment
- Bulk user creation for all units in a society
- Excel bulk import/export with template download
- Creatable/updatable role enforcement per caller's role
- Employee management with salary tracking
- Employee advance & attendance management
- Login audit & session management

### 💰 Finance
- Maintenance bill generation with customizable line items
- Bill payment recording & Razorpay online payment integration
- Payment webhook handling for automatic status updates
- Vendor bill tracking with payment status
- Contract lifecycle management
- Income/expense transaction ledger
- Penalty management with auto-calculation
- Financial reports: MTD, YTD, custom range, category breakdown
- Excel export for transactions, bills, and financial reports

### 🏪 Vendor Management
- Vendor directory with approval workflow (pending → approved/rejected)
- Vendor profile linked to login-capable `VENDOR` role
- Vendor bill submission and payment tracking
- Contract management with renewal reminders
- Bulk vendor import/export

### 📣 Communication
- Society notice board (CRUD, active/inactive)
- Notice attendance tracking
- Support ticket system with status workflow and assignment
- Ticket reply threading
- Complaint management with resolution tracking
- Complaint comment system & SLA tracking
- Emergency contact directory with bulk import
- Document template generator
- Notification preferences per user

### 🛡️ Security & Access
- Visitor pre-approval and gate log tracking
- Visitor management with member linking
- Vehicle access tracking & bulk import
- Domestic staff management (planned)
- Guard patrol checkpoints (planned)
- Safety alerts and SOS management (planned)

### 🔧 Operations & Maintenance
- Work order creation and assignment (planned)
- Asset registry with maintenance tracking (planned)
- Common area schedule management (planned)
- Facility booking system (planned)
- Renovation NOC requests (planned)
- Staff shift management (planned)

### 🏠 Resident Services
- Move-in/move-out tracking (planned)
- Penalty management
- Pet registration (planned)
- Classifieds board (planned)
- Society rules/bylaws management

### 📊 Dashboard & Analytics
- Role-specific dashboards with real-time statistics
- Financial comparison charts
- Metric panels with trend indicators
- Activity feeds & progress boards
- Weather integration
- Clock & datetime displays
- Backend health status monitoring

---

## 📂 Project Structure

This is a **comprehensive monorepo** containing 612+ files organized into modular packages:

### Root Level Files

```
society-management-system/
├── .gitignore                    # Git ignore patterns for all platforms
├── .vscode/                      # VS Code workspace settings
│   └── extensions.json           # Recommended extensions
├── README.md                     # This file
├── render.yaml                   # Render deployment blueprint
└── Documents/                    # Supplementary documentation
```

---

## Backend Architecture

**Location:** `/backend/`
**Language:** Java 21
**Framework:** Spring Boot 3.5.10
**Build Tool:** Maven
**Total Classes:** 200+ Java files

### Backend Root Configuration

```
backend/
├── pom.xml                       # Maven dependencies & build configuration
├── Dockerfile                    # Docker containerization
├── mvnw, mvnw.cmd               # Maven wrapper scripts (platform-specific)
├── .mvn/wrapper/                # Maven wrapper JAR & properties
└── package-lock.json            # Legacy npm lock file (cleanup candidate)
```

### Source Code Organization

**Location:** `/backend/src/main/`

#### Java Packages (`java/com/society/backend/`)

The backend follows a **layered architecture** pattern with domain-driven design:

```
Controller Layer → Service Layer → Repository Layer → Entity Layer
     ↓                  ↓                ↓                ↓
  REST API      Business Logic    Data Access      Database Models
```

### 📦 Package: `auth/` — Authentication & Authorization

**Purpose:** User authentication, JWT token management, password reset

| File | Type | Purpose |
|------|------|---------|
| `AuthController.java` | Controller | REST endpoints for login, register, forgot/reset password, logout |
| `AuthService.java` | Interface | Authentication business logic contract |
| `AuthServiceImpl.java` | Service | Implementation of auth operations |
| **DTOs** | | |
| `LoginRequest.java` | DTO | Login credentials (email, password, rememberMe) |
| `LoginResponse.java` | DTO | JWT token & user details |
| `RegisterRequest.java` | DTO | New user registration data |
| `ForgotPasswordRequest.java` | DTO | Email for password reset |
| `ResetPasswordRequest.java` | DTO | New password & reset token |
| `ChangePasswordRequest.java` | DTO | Old & new password for logged-in users |
| `LogoutRequest.java` | DTO | Logout request data |
| `UpdateLocationRequest.java` | DTO | User location update |
| `LoginAuditResponse.java` | DTO | Login history details |
| **Entities** | | |
| `LoginAudit.java` | Entity | Tracks login attempts with device, IP, location |
| `PasswordResetToken.java` | Entity | Temporary tokens for password reset |
| **Repositories** | | |
| `LoginAuditRepository.java` | Repository | JPA repository for login audit logs |
| `PasswordResetTokenRepository.java` | Repository | JPA repository for reset tokens |

**Key Features:**
- JWT-based stateless authentication
- Login audit trail with device fingerprinting
- Email-based password reset with token expiry
- Remember me functionality

---

### 📦 Package: `common/` — Core Configuration & Utilities

**Purpose:** Cross-cutting concerns, security, configuration, utilities

#### Configuration (`config/`)

| File | Purpose | Scalability Impact |
|------|---------|-------------------|
| `CorsConfig.java` | CORS policy for frontend origins | Supports multiple frontend deployments |
| `DataInitializer.java` | Seeds initial admin user & test data | Idempotent initialization |
| `DeleteForceCleanupInterceptor.java` | Soft delete handling | Prevents orphaned records |
| `PasswordConfig.java` | BCrypt password encoder bean | Secure password hashing |
| `RazorpayConfig.java` | Payment gateway configuration | Supports multiple payment modes |
| `SchedulerConfig.java` | Task scheduling configuration | Background job management |
| `SchemaMigrationRunner.java` | Database schema auto-migration | Zero-downtime deployments |
| `SecurityConfig.java` | Spring Security setup & JWT filter chain | Stateless security for horizontal scaling |
| `SocietyScopeInterceptor.java` | Multi-tenancy data isolation | Society-scoped queries |
| `WebMvcConfig.java` | MVC configuration & interceptors | Request/response handling |

#### Controllers

| File | Purpose |
|------|---------|
| `EmailTestController.java` | Test email sending functionality |
| `ExportController.java` | Excel/PDF export endpoints for all modules |
| `HealthController.java` | Custom health check endpoints |

#### Security (`security/`)

| File | Purpose | Scalability |
|------|---------|-------------|
| `CustomUserDetails.java` | UserDetails implementation | Stateless auth |
| `CustomUserDetailsService.java` | Loads user by email for auth | Cacheable |
| `DocumentMetadataCryptoService.java` | Document encryption/decryption | Secure file handling |
| `JwtAuthenticationEntryPoint.java` | Handles unauthorized access | Consistent error responses |
| `JwtAuthenticationFilter.java` | Validates JWT on every request | Stateless filter |
| `JwtUtils.java` | JWT token creation & validation | Supports distributed systems |
| `RolePermissions.java` | RBAC permission definitions | 12-role hierarchy |

#### Services

| File | Purpose |
|------|---------|
| `EmailService.java` | SMTP email with templates |
| `ExcelExportService.java` | Excel generation for bulk exports |
| `ExcelExportServiceImpl.java` | Implementation with Apache POI |
| `ReferenceCleanupService.java` | Cleans orphaned references |
| `RoleService.java` | Role hierarchy & permission checks |
| `SecureDocumentMetadataService.java` | Encrypted document metadata |

#### Exceptions

| File | Purpose |
|------|---------|
| `AccessDeniedException.java` | 403 Forbidden errors |
| `ApiException.java` | Generic API exceptions |
| `GlobalExceptionHandler.java` | Centralized exception handling |
| `LinkedRecordsConflictException.java` | Prevent deletes with dependencies |
| `ResourceNotFoundException.java` | 404 errors |
| `ErrorResponse.java` | Standardized error response DTO |

**Scalability Features:**
- Stateless JWT authentication (horizontal scaling)
- Society-scoped interceptor (multi-tenancy)
- Background task scheduling
- Centralized exception handling

---

### 📦 Package: `enquiry/` — Public Enquiry Management

**Purpose:** Handle contact form submissions from public website

| File | Type | Purpose |
|------|------|---------|
| `EnquiryController.java` | Controller | Public POST endpoint for enquiries |
| `EnquiryService.java` | Interface | Enquiry business logic |
| `EnquiryServiceImpl.java` | Service | Save enquiry & send notification |
| `EnquiryRequest.java` | DTO | Name, email, phone, message |
| `EnquiryResponse.java` | DTO | Enquiry details |
| `Enquiry.java` | Entity | Enquiry database model |
| `EnquiryRepository.java` | Repository | JPA repository |

---

### 📦 Package: `finance/` — Financial Management

**Purpose:** Maintenance bills, payments, transactions, penalties, reports

| File | Type | Purpose |
|------|------|---------|
| **Controllers** | | |
| `MaintenanceBillController.java` | Controller | CRUD for maintenance bills |
| `PaymentController.java` | Controller | Razorpay payment order creation & verification |
| `PenaltyController.java` | Controller | Penalty management |
| `ReportController.java` | Controller | Financial reports (MTD, YTD, custom) |
| `TransactionController.java` | Controller | Income/expense transactions |
| **Services** | | |
| `MaintenanceBillService.java` | Service | Bill generation with line items |
| `PaymentService.java` | Service | Payment processing & webhook handling |
| `PenaltyService.java` | Service | Penalty calculation |
| `ReportService.java` | Service | Financial analytics |
| `TransactionService.java` | Service | Transaction ledger |
| **Entities** | | |
| `MaintenanceBill.java` | Entity | Bill header with due date, amount |
| `BillLineItem.java` | Entity | Individual bill charges |
| `Payment.java` | Entity | Payment records with Razorpay order ID |
| `PaymentWebhookEvent.java` | Entity | Razorpay webhook events |
| `Penalty.java` | Entity | Late payment penalties |
| `Transaction.java` | Entity | Income/expense ledger |
| **DTOs** | | |
| Request DTOs | | MaintenanceBillRequest, TransactionRequest, PenaltyRequest, etc. |
| Response DTOs | | MaintenanceBillResponse, PaymentResponse, FinancialReportResponse, etc. |
| **Repositories** | | JPA repositories for all entities |

**Key Features:**
- Line-item based billing
- Razorpay payment gateway integration
- Webhook handling for payment status
- Comprehensive financial reporting
- Excel export capabilities

---

### 📦 Package: `flat/` — Unit & Tenant Management

**Purpose:** Flats, wings, tenants, vehicles

| File | Type | Purpose |
|------|------|---------|
| **Controllers** | | |
| `FlatController.java` | Controller | CRUD + bulk import/export for flats |
| `WingController.java` | Controller | Building/wing management |
| `TenantController.java` | Controller | Tenant registry with lease tracking |
| **Services** | | |
| `FlatService.java` | Service | Flat business logic |
| `WingService.java` | Service | Wing management |
| `TenantService.java` | Service | Tenant operations |
| `BulkFlatImportService.java` | Service | Excel bulk import for flats |
| `BulkTenantImportService.java` | Service | Excel bulk import for tenants |
| **Entities** | | |
| `Flat.java` | Entity | Unit number, floor, wing, owner, area |
| `Wing.java` | Entity | Building/wing with flat count |
| `Tenant.java` | Entity | Tenant with lease dates, flat reference |
| **DTOs** | | Request/Response DTOs + Import row models |
| **Repositories** | | JPA repositories |

**Bulk Operations:**
- Excel template download
- Validation with detailed error reporting
- Atomic batch processing

---

### 📦 Package: `infrastructure/` — Background Jobs

| File | Purpose |
|------|---------|
| `ReminderScheduler.java` | Scheduled tasks for bill reminders, payment notifications |

---

### 📦 Package: `notification/` — Notices & Preferences

**Purpose:** Society notices, notification settings

| File | Type | Purpose |
|------|------|---------|
| `NoticeController.java` | Controller | Notice board CRUD |
| `NotificationPreferenceController.java` | Controller | User notification settings |
| `NoticeService.java` | Service | Notice management |
| `NotificationPreferenceService.java` | Service | Preference management |
| `Notice.java` | Entity | Notice with active status, priority |
| `NoticeAttendance.java` | Entity | Tracks who read the notice |
| `NotificationPreference.java` | Entity | Email/SMS preferences |

---

### 📦 Package: `security/` — Visitor & Vehicle Management

**Purpose:** Visitor tracking, vehicle registration

| File | Type | Purpose |
|------|------|---------|
| `VisitorController.java` | Controller | Visitor gate logs |
| `VehicleController.java` | Controller | Vehicle registration + bulk import |
| `VisitorService.java` | Service | Visitor operations |
| `VehicleService.java` | Service | Vehicle management |
| `BulkVehicleImportService.java` | Service | Excel import for vehicles |
| `Visitor.java` | Entity | Visitor with entry/exit time, member |
| `Vehicle.java` | Entity | Vehicle number, type, owner |

---

### 📦 Package: `society/` — Society Management

**Purpose:** Society settings, rules, documents

| File | Type | Purpose |
|------|------|---------|
| `SocietyController.java` | Controller | Society CRUD |
| `SocietySettingController.java` | Controller | Financial settings |
| `SocietyRuleController.java` | Controller | Rules & bylaws |
| `DocumentTemplateController.java` | Controller | Document templates |
| `Society.java` | Entity | Society master with name, address |
| `SocietySetting.java` | Entity | Maintenance amount, GST rate |
| `SocietyRule.java` | Entity | Bylaws & regulations |
| `DocumentTemplate.java` | Entity | Reusable document templates |

---

### 📦 Package: `ticket/` — Ticket & Complaint System

**Purpose:** Support tickets, complaints, emergency contacts

| File | Type | Purpose |
|------|------|---------|
| **Controllers** | | |
| `TicketController.java` | Controller | Ticket CRUD with status workflow |
| `ComplaintController.java` | Controller | Complaint management |
| `EmergencyContactController.java` | Controller | Emergency directory |
| **Services** | | |
| `TicketService.java` | Service | Ticket operations & assignment |
| `ComplaintService.java` | Service | Complaint handling & SLA tracking |
| `EmergencyContactService.java` | Service | Contact management |
| `BulkEmergencyContactImportService.java` | Service | Excel import |
| **Entities** | | |
| `Ticket.java` | Entity | Support ticket with status, priority |
| `TicketReply.java` | Entity | Thread replies |
| `Complaint.java` | Entity | Complaint with category, resolution |
| `ComplaintComment.java` | Entity | Complaint discussion thread |
| `ComplaintHistory.java` | Entity | Status change audit trail |
| `EmergencyContact.java` | Entity | Emergency phone numbers |

**Features:**
- Status workflow (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- Assignment to staff
- SLA tracking
- Comment threading

---

### 📦 Package: `user/` — User & Employee Management

**Purpose:** User CRUD, roles, employees, payroll

| File | Type | Purpose |
|------|------|---------|
| **Controllers** | | |
| `UserController.java` | Controller | User CRUD + bulk import/export |
| `RoleController.java` | Controller | Role hierarchy & permissions |
| `EmployeeController.java` | Controller | Employee & payroll management |
| **Services** | | |
| `UserService.java` | Service | User operations with RBAC |
| `RoleServiceImpl.java` | Service | Role permission checks |
| `EmployeeService.java` | Service | Employee management |
| `EmployeeAdvanceService.java` | Service | Salary advance tracking |
| `EmployeeAttendanceService.java` | Service | Attendance management |
| `BulkUserImportService.java` | Service | Excel user import |
| **Entities** | | |
| `User.java` | Entity | Core user with email, password, role, society |
| `Role.java` | Enum | 12 roles (MASTER_ADMIN, SOCIETY_ADMIN, etc.) |
| `Employee.java` | Entity | Employee with salary, joining date |
| `EmployeeAdvance.java` | Entity | Salary advances |
| `EmployeeAttendance.java` | Entity | Daily attendance |
| `EmployeeSalaryPayment.java` | Entity | Monthly salary payments |

**RBAC Features:**
- Hierarchical role system
- Society-scoped data access
- Creatable role restrictions
- Permission matrix enforcement

---

### 📦 Package: `vendor/` — Vendor Management

**Purpose:** Vendor directory, contracts, bills

| File | Type | Purpose |
|------|------|---------|
| **Controllers** | | |
| `VendorController.java` | Controller | Vendor CRUD + approval workflow |
| `VendorBillController.java` | Controller | Vendor bill submission |
| `ContractController.java` | Controller | AMC contract management |
| **Services** | | |
| `VendorService.java` | Service | Vendor operations |
| `VendorBillService.java` | Service | Bill processing |
| `ContractService.java` | Service | Contract lifecycle |
| `BulkVendorImportService.java` | Service | Excel import |
| **Entities** | | |
| `Vendor.java` | Entity | Vendor with approval status |
| `VendorBill.java` | Entity | Service bill with payment tracking |
| `Contract.java` | Entity | AMC contract with renewal date |

---

### Resources

**Location:** `/backend/src/main/resources/`

| File | Purpose |
|------|---------|
| `application.properties` | Spring Boot configuration (DB, JWT, Mail, Razorpay) |

---

## Frontend Architecture

**Location:** `/frontend/`
**Framework:** React 19.2 + Vite 7.2.4
**Styling:** Tailwind CSS 3.4.17
**Total Components:** 100+ pages & components

### Frontend Root Configuration

```
frontend/
├── index.html                    # HTML entry point with meta tags
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Locked dependency versions
├── vite.config.js                # Vite build configuration
├── tailwind.config.js            # Tailwind CSS customization
├── postcss.config.js             # PostCSS plugins
├── eslint.config.js              # ESLint rules
├── README.md                     # Frontend documentation
├── public/                       # Static assets
│   ├── favicon.svg               # Site icon
│   └── _redirects                # SPA routing for hosting
└── scripts/
    └── postbuild.mjs             # Post-build processing
```

### Source Code (`/frontend/src/`)

**Architecture Pattern:** Component-based with Context API for global state

```
Presentation Layer → Business Logic → API Layer → Backend
       ↓                    ↓              ↓
  Components            Contexts        Axios Client
   + Pages              + Hooks
```

### Main Entry Points

| File | Purpose |
|------|---------|
| `main.jsx` | React DOM render & TanStack Query setup |
| `App.jsx` | Root component with routing, auth guard, lazy loading |

### 📁 `assets/` — Static Resources

**Icons organized by category:**

```
assets/icons/
├── browsers/                     # Browser icons
│   ├── chrome.svg, firefox.svg, safari.svg, edge.svg
│   ├── brave.svg, opera.svg, vivaldi.svg, unknown.svg
├── os/                           # Operating system icons
│   ├── windows.svg, macos.svg, linux.svg
│   ├── ios.svg, android.svg, chromeos.svg, unknown.svg
└── Social & misc icons
    ├── github.svg, linkedin.svg, twitter-logo.svg
    ├── youtube.svg, app-store.svg, google-play.svg
```

**Purpose:** Device detection for login audit UI

---

### 📁 `components/` — Reusable UI Components

| Component | Purpose | Reusability |
|-----------|---------|-------------|
| `Layout.jsx` | Main app layout with sidebar & navbar | App-wide |
| `PageShell.jsx` | Page container with title & breadcrumbs | All pages |
| `AsyncButton.jsx` | Button with loading state | Forms |
| `FormComponents.jsx` | Input, Select, Textarea, Checkbox components | All forms |
| `BulkImportModal.jsx` | Excel import modal with validation | Bulk operations |
| `Toggle.jsx` | Switch component for boolean values | Settings |
| `SkeletonLoaders.jsx` | Loading skeletons for data fetch | Data pages |
| `PermissionDenied.jsx` | 403 access denied page | Authorization |
| `EmptyStateSection.jsx` | Empty state UI with actions | List pages |
| `PaginationControls.jsx` | Pagination UI with page size selector | Tables |
| `InfoTooltip.jsx` | Tooltip for help text | Forms |
| `LocationPickerMap.jsx` | Leaflet map for location selection | Location input |
| `AnimatedModal.jsx` | Modal with Framer Motion animations | Dialogs |
| `NeonSweepButton.jsx` | Animated button with neon effect | CTAs |
| `PublicNavbar.jsx` | Public site navigation | Footer pages |
| `PublicFooter.jsx` | Public site footer | Footer pages |
| `PublicOutlineButton.jsx` | Button variant for public pages | Public CTAs |
| `PublicSweepButton.jsx` | Animated button for public pages | Hero sections |

**Design Patterns:**
- Composition over inheritance
- Controlled components
- Props destructuring
- Consistent prop naming

---

### 📁 `context/` — Global State Management

| Context | Purpose | Scope |
|---------|---------|-------|
| `AuthContext.jsx` | User authentication state, login/logout | App-wide |
| `ThemeContext.jsx` | Dark/light mode toggle | App-wide |
| `ToastContext.jsx` | Toast notification queue | App-wide |
| `SettingsContext.jsx` | App settings & preferences | App-wide |
| `ConfirmDialogContext.jsx` | Confirmation dialogs for destructive actions | App-wide |

**Pattern:** Provider pattern with custom hooks (`useAuth`, `useTheme`, etc.)

---

### 📁 `hooks/` — Custom React Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useBackendStatus.js` | Backend health check polling | `{ isHealthy, lastChecked }` |
| `useMinLoadingTime.js` | Minimum loading duration for UX | `isLoading` state |
| `useRazorpay.js` | Razorpay SDK initialization | `{ handlePayment }` |

---

### 📁 `pages/` — Page Components

Pages are organized by feature domain and lazy-loaded via React Router.

#### `auth/` — Authentication Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Welcome.jsx` | `/` | Landing page with login redirect |
| `Login.jsx` | `/login` | Login form with remember me |
| `ForgotPassword.jsx` | `/forgot-password` | Email input for password reset |
| `ResetPassword.jsx` | `/reset-password/:token` | New password form |

#### `core/` — Core Application Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Dashboard.jsx` | `/dashboard` | Role-specific dashboard with stats & charts |
| `Settings.jsx` | `/settings` | User profile & app settings |
| `Reports.jsx` | `/reports` | Financial & operational reports |
| `Penalties.jsx` | `/penalties` | Penalty management |
| `SocietyRules.jsx` | `/society-rules` | Rules & bylaws |

**Dashboard Architecture (`core/dashboard/`):**

```
dashboard/
├── Dashboard.jsx                 # Main dashboard component
├── components/                   # Reusable dashboard widgets
│   ├── StatCard.jsx              # Metric card with trend
│   ├── MetricPanel.jsx           # Multi-metric panel
│   ├── AlertCard.jsx             # Alert notifications
│   ├── FeedPanel.jsx             # Activity feed
│   ├── ProgressBoard.jsx         # Progress tracking
│   ├── NoticeRail.jsx            # Notice sidebar
│   ├── ClockDisplay.jsx          # Date/time display
│   ├── HeroSection.jsx           # Hero header
│   └── SectionHeader.jsx         # Section titles
├── sections/                     # Dashboard sections
│   ├── HeroSection.jsx           # Top hero section
│   ├── PrimaryStatsSection.jsx  # Main statistics
│   ├── OverviewSection.jsx       # Overview widgets
│   ├── RolePrioritySection.jsx  # Role-specific priorities
│   ├── AlertsSection.jsx         # System alerts
│   └── FeedSection.jsx           # Recent activity
├── config/
│   └── dashboardRoles.js         # Role-specific dashboard config
├── hooks/
│   ├── useDashboardData.js       # Data fetching hook
│   ├── useDashboardStats.js      # Statistics hook
│   └── useWeather.js             # Weather API integration
└── utils/
    └── dashboardUtils.js         # Helper functions
```

**Scalability:** Dashboard is component-based and role-configurable

#### `communication/` — Communication Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Notices.jsx` | `/notices` | Notice board with CRUD |
| `Tickets.jsx` | `/tickets` | Support ticket system |
| `Complaints.jsx` | `/complaints` | Complaint management |
| `Documents.jsx` | `/documents` | Document templates |
| `EmergencyContacts.jsx` | `/emergency-contacts` | Emergency directory |

#### `finance/` — Financial Pages

| Page | Route | Purpose |
|------|-------|---------|
| `MaintenanceBills.jsx` | `/maintenance-bills` | Bill generation & management |
| `MyBills.jsx` | `/my-bills` | Member's bill view with payment |
| `Payments.jsx` | `/payments` | Payment history |
| `Transactions.jsx` | `/transactions` | Income/expense ledger |
| `VendorBills.jsx` | `/vendor-bills` | Vendor bill tracking |
| `Contracts.jsx` | `/contracts` | AMC contract management |
| `SocietySettings.jsx` | `/society-settings` | Financial settings |

#### `society/` — Society Administration

| Page | Route | Purpose |
|------|-------|---------|
| `SocietyAdmins.jsx` | `/society-admins` | Society admin management |
| `LoginAudit.jsx` | `/login-audit` | Login history with device info |

#### `unit/` — Unit Management Pages

| Page | Route | Purpose |
|------|-------|---------|
| `UnitManagement.jsx` | `/units` | Flat overview |
| `Flats.jsx` | `/flats` | Flat CRUD + bulk import |
| `Tenants.jsx` | `/tenants` | Tenant registry |
| `Vehicles.jsx` | `/vehicles` | Vehicle registration |

#### `users/` — User Management Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Users.jsx` | `/users` | User CRUD + bulk import |
| `Employees.jsx` | `/employees` | Employee & payroll |
| `RolesPermissions.jsx` | `/roles` | Role hierarchy & permissions |

#### `vendors/` — Vendor Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Vendors.jsx` | `/vendors` | Vendor directory with approval |

#### `security/` — Security Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Visitors.jsx` | `/visitors` | Visitor gate logs |

#### `footer/` — Public Footer Pages

| Page | Route | Purpose |
|------|-------|---------|
| `About.jsx` | `/about` | About the platform |
| `Contact.jsx` | `/contact` | Contact form |
| `Demo.jsx` | `/demo` | Demo request |
| `Help.jsx` | `/help` | Help center |
| `Pricing.jsx` | `/pricing` | Pricing plans |
| `Privacy.jsx` | `/privacy` | Privacy policy |
| `Terms.jsx` | `/terms` | Terms of service |

---

### 📁 `styles/` — CSS Architecture

| File | Purpose |
|------|---------|
| `global.css` | Tailwind directives, CSS variables, global styles |

**Tailwind Config:** Custom colors, fonts, animations, breakpoints

---

### 📁 `utils/` — Utility Functions

| File | Purpose |
|------|---------|
| `validation.js` | Form validation rules (email, phone, etc.) |
| `formatUtils.js` | Date, currency, number formatting |
| `deviceDetect.js` | Browser & OS detection from user agent |
| `scrollLock.js` | Disable scroll for modals |
| `ticketStatusGroups.js` | Ticket status grouping logic |
| `ticketStatusGroups.test.js` | Unit tests for ticket utilities |

---

## Mobile Apps Architecture

### Android App (`/android-app/`)

**Language:** Kotlin
**UI Framework:** Jetpack Compose
**Architecture:** MVVM with Clean Architecture

#### Android Root Configuration

```
android-app/
├── build.gradle.kts              # Project-level Gradle build
├── settings.gradle.kts           # Gradle settings & modules
├── gradle.properties             # Gradle configuration
├── gradle/wrapper/               # Gradle wrapper files
└── app/                          # Main app module
```

#### App Module (`app/`)

**Configuration:**
```
app/
├── build.gradle.kts              # App module build with dependencies
├── proguard-rules.pro            # ProGuard/R8 obfuscation rules
├── google-services.json          # Firebase configuration
└── src/main/
```

#### Android Source (`src/main/`)

**Manifest:**
- `AndroidManifest.xml` — App permissions, activities, services

**Package Structure (`java/com/society/android/`):**

```
com.society.android/
├── MainActivity.kt               # Main activity entry point
├── SocietyApp.kt                 # Application class
├── data/                         # Data layer
│   ├── local/
│   │   ├── SettingsDataStore.kt  # Preferences storage
│   │   └── TokenManager.kt       # JWT token management
│   ├── remote/
│   │   ├── AuthInterceptor.kt    # Auth header injection
│   │   └── api/                  # Retrofit API interfaces
│   │       ├── AuthApi.kt
│   │       ├── ComplaintTicketApi.kt
│   │       ├── FinanceApi.kt
│   │       ├── FlatApi.kt
│   │       ├── NoticeApi.kt
│   │       ├── SocietyApi.kt
│   │       ├── UserApi.kt
│   │       ├── VendorApi.kt
│   │       └── VisitorApi.kt
│   └── dto/                      # Data transfer objects
│       ├── auth/, common/, complaint/
│       ├── finance/, flat/, notice/
│       ├── society/, ticket/, user/
│       ├── vendor/, visitor/
├── domain/                       # Domain layer
│   └── repository/
│       ├── AuthRepository.kt     # Auth repository
│       ├── ManagementRepository.kt # Data repository
│       └── BaseRepository.kt     # Base repository
├── di/                           # Dependency injection
│   └── AppModule.kt              # Hilt/Dagger modules
├── services/
│   └── SocietyFCMService.kt      # Firebase Cloud Messaging
├── ui/                           # UI layer
│   ├── theme/                    # Material Design 3 theme
│   │   ├── Color.kt, Theme.kt, Type.kt
│   ├── navigation/
│   │   ├── AppNavigation.kt      # Nav graph
│   │   └── Screen.kt             # Screen routes
│   ├── components/
│   │   └── CommonComponents.kt   # Reusable composables
│   ├── auth/
│   │   ├── LoginScreen.kt
│   │   └── LoginViewModel.kt
│   ├── dashboard/
│   │   ├── DashboardScreen.kt
│   │   └── DashboardViewModel.kt
│   ├── complaints/
│   │   ├── ComplaintListScreen.kt
│   │   ├── CreateComplaintScreen.kt
│   │   └── ComplaintViewModel.kt
│   ├── finance/
│   │   ├── FinanceScreen.kt
│   │   └── FinanceViewModel.kt
│   ├── management/
│   │   ├── UnitListScreen.kt
│   │   ├── UserListScreen.kt
│   │   └── ManagementViewModel.kt
│   ├── notices/
│   │   ├── NoticeListScreen.kt
│   │   ├── CreateNoticeScreen.kt
│   │   └── NoticeViewModel.kt
│   ├── settings/
│   │   ├── SettingsScreen.kt
│   │   ├── ProfileScreen.kt
│   │   ├── ChangePasswordScreen.kt
│   │   └── SettingsViewModel.kt
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
    ├── Constants.kt              # App constants
    ├── Formatters.kt             # Data formatting
    └── Resource.kt               # Result wrapper
```

**Resources (`res/`):**
- `drawable/` — Vector drawables
- `mipmap-*/` — App launcher icons
- `values/` — Strings, themes, colors
- `xml/` — Network security config

**Tests:**
- `AuthRepositoryTest.kt` — Repository unit tests
- `UtilsTest.kt` — Utility tests

**Key Features:**
- Material Design 3
- Jetpack Compose declarative UI
- MVVM architecture
- Retrofit for networking
- Hilt dependency injection
- Firebase push notifications

---

### iOS App (`/ios-app/`)

**Language:** Swift
**UI Framework:** SwiftUI
**Architecture:** MVVM

#### iOS Root Configuration

```
ios-app/
├── project.yml                   # XcodeGen project spec
├── SocietyManager.xcodeproj/     # Xcode project files
│   ├── project.pbxproj
│   └── project.xcworkspace/
└── SocietyManager/               # Main app source
```

#### iOS Source (`SocietyManager/`)

**Configuration:**
- `Info.plist` — App info, permissions, URL schemes

**Package Structure:**

```
SocietyManager/
├── App/
│   ├── SocietyManagerApp.swift   # SwiftUI app entry point
│   ├── AppDelegate.swift         # UIKit app delegate
│   └── ContentView.swift         # Root content view
├── Models/
│   ├── AuthModels.swift          # Auth DTOs
│   ├── CoreModels.swift          # Core models
│   ├── User.swift, Society.swift
│   ├── Flat.swift, Vendor.swift
│   ├── Notice.swift, Transaction.swift
│   └── Role.swift
├── Services/
│   ├── APIClient.swift           # URLSession HTTP client
│   ├── AuthService.swift         # Auth API
│   ├── SocietyService.swift      # Society API
│   ├── UserService.swift         # User API
│   ├── FlatService.swift         # Flat API
│   ├── NoticeService.swift       # Notice API
│   ├── FinanceService.swift      # Finance API
│   └── VendorService.swift       # Vendor API
├── ViewModels/
│   ├── AuthViewModel.swift       # Auth logic
│   ├── DashboardViewModel.swift  # Dashboard data
│   ├── UserViewModel.swift       # User management
│   ├── UnitViewModel.swift       # Unit management
│   ├── NoticeViewModel.swift     # Notice logic
│   ├── FinanceViewModel.swift    # Finance logic
│   ├── VendorViewModel.swift     # Vendor logic
│   └── ImportViewModel.swift     # Bulk import
├── Views/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   └── ForgotPasswordView.swift
│   ├── Dashboard/
│   │   ├── MainTabView.swift     # Tab navigation
│   │   └── DashboardView.swift
│   ├── Management/
│   │   ├── UserListView.swift
│   │   └── UnitListView.swift
│   ├── Finance/
│   │   ├── FinanceOverviewView.swift
│   │   ├── MaintenanceBillListView.swift
│   │   └── TransactionListView.swift
│   ├── Notices/
│   │   └── NoticeListView.swift
│   ├── Vendors/
│   │   └── VendorListView.swift
│   ├── Documents/
│   │   └── DocumentListView.swift
│   ├── Complaints/
│   │   └── ComplaintListView.swift
│   ├── Import/
│   │   └── BulkImportView.swift
│   ├── Profile/
│   │   └── ProfileView.swift
│   └── Components/
│       └── SharedComponents.swift
├── Utilities/
│   ├── Constants.swift           # App constants
│   ├── Extensions.swift          # Swift extensions
│   ├── KeychainManager.swift     # Secure storage
│   └── Validators.swift          # Input validation
└── Tests/
    └── SocietyManagerTests.swift # Unit tests
```

**Key Features:**
- SwiftUI declarative UI
- MVVM architecture
- Combine for reactive programming
- URLSession networking
- Keychain for secure token storage

---

## API Layer

**Location:** `/api/`

**File:** `index.js` — Centralized Axios HTTP client

**Purpose:** Shared API layer consumed by React frontend

**Key Features:**
- Base URL configuration from environment
- JWT token injection via interceptors
- Token refresh on 401
- Request/response logging
- Standardized error handling

**API Modules Exported:**
```javascript
export const enquiryAPI = {
  create: (data) => POST /api/enquiries
}

export const authAPI = {
  login: (credentials) => POST /api/auth/login
  register: (data) => POST /api/auth/register
  forgotPassword: (email) => POST /api/auth/forgot-password
  resetPassword: (token, password) => POST /api/auth/reset-password
  changePassword: (passwords) => PUT /api/auth/change-password
  logout: () => POST /api/auth/logout
  getLoginAudit: () => GET /api/auth/login-audit
  updateLocation: (location) => PUT /api/auth/update-location
}

export const societyAPI = {
  getAll, getById, create, update, delete
  getSocietySettings, updateSocietySettings
}

export const userAPI = {
  getAll, getById, create, update, delete
  getBulkImportTemplate, bulkImport
  exportToExcel
}

export const flatAPI = {
  getAll, getById, create, update, delete
  getBulkImportTemplate, bulkImport
}

export const wingAPI = { ... }
export const vendorAPI = { ... }
export const vendorBillAPI = { ... }
export const contractAPI = { ... }
export const maintenanceBillAPI = { ... }
export const transactionAPI = { ... }
export const noticeAPI = { ... }
export const ticketAPI = { ... }
export const complaintAPI = { ... }
export const emergencyContactAPI = { ... }
export const documentTemplateAPI = { ... }
export const tenantAPI = { ... }
export const vehicleAPI = { ... }
export const notificationPreferenceAPI = { ... }
export const paymentAPI = {
  createOrder, verifyPayment, getAll, getById
}
export const reportAPI = {
  getFinancialReport, exportExcel
}
export const visitorAPI = { ... }
export const penaltyAPI = { ... }
export const societyRuleAPI = { ... }
export const employeeAPI = { ... }
export const attendanceAPI = { ... }

// Utility
export const downloadBlob = (blob, filename) => { ... }
```

**Scalability:**
- Token refresh prevents session expiry
- Request interceptors for auth headers
- Centralized error handling
- Environment-based configuration

---

## Database Schema

**Location:** `/database/`

**File:** `schema.sql` (755 lines)

**Database:** PostgreSQL 16

**Tables:** 46+ relational tables with foreign keys, indexes, constraints

**Schema Organization:**

```sql
-- Core tables
CREATE TABLE societies (...);
CREATE TABLE users (...);
CREATE TABLE roles (enum);
CREATE TABLE login_audit (...);
CREATE TABLE password_reset_tokens (...);

-- Unit management
CREATE TABLE wings (...);
CREATE TABLE flats (...);
CREATE TABLE tenants (...);
CREATE TABLE vehicles (...);

-- Finance
CREATE TABLE maintenance_bills (...);
CREATE TABLE bill_line_items (...);
CREATE TABLE payments (...);
CREATE TABLE payment_webhook_events (...);
CREATE TABLE transactions (...);
CREATE TABLE penalties (...);

-- Vendor
CREATE TABLE vendors (...);
CREATE TABLE contracts (...);
CREATE TABLE vendor_bills (...);

-- Communication
CREATE TABLE notices (...);
CREATE TABLE notice_attendance (...);
CREATE TABLE tickets (...);
CREATE TABLE ticket_replies (...);
CREATE TABLE complaints (...);
CREATE TABLE complaint_comments (...);
CREATE TABLE complaint_history (...);
CREATE TABLE emergency_contacts (...);
CREATE TABLE document_templates (...);

-- Employee
CREATE TABLE employees (...);
CREATE TABLE employee_advances (...);
CREATE TABLE employee_attendance (...);
CREATE TABLE employee_salary_payments (...);

-- Settings
CREATE TABLE society_settings (...);
CREATE TABLE society_rules (...);
CREATE TABLE notification_preferences (...);

-- Visitors
CREATE TABLE visitors (...);

-- Public
CREATE TABLE enquiries (...);
```

**Key Features:**
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns
- TIMESTAMP columns for audit trail
- ON DELETE CASCADE for dependent records
- Soft delete support via `deleted` flags

**Scalability:**
- Society ID partition key for multi-tenancy
- Indexed foreign keys for fast joins
- JSONB columns for flexible metadata
- Read replicas support (planned)

---

## Documents

**Location:** `/Documents/`

| File | Purpose |
|------|---------|
| `README.md` | Role architecture & permissions documentation |
| `Role-Access-Matrix.jpg` | Visual RBAC diagram |

**Future Documentation (planned):**
- API_REFERENCE.md — API endpoint documentation
- ARCHITECTURE.md — System architecture diagrams
- CONTRIBUTING.md — Contribution guidelines
- DEPLOYMENT.md — Deployment instructions
- SETUP.md — Detailed setup guide
- TESTING.md — Testing strategy
- TROUBLESHOOTING.md — Common issues & solutions

---

## 🚀 Getting Started

### Prerequisites

- **Java 21** (JDK)
- **Node.js 20+** and **npm 10+**
- **PostgreSQL 16** running locally
- **Maven** (or use the included `mvnw` wrapper)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for email sending

### 1. Clone the Repository

```bash
git clone https://github.com/Tanmay-Kudkar/society-management-system.git
cd society-management-system
```

### 2. Configure Environment Variables

See [`backend/ENV_SETUP.md`](backend/ENV_SETUP.md) for full instructions.

**Quick setup (PowerShell — Windows):**

```powershell
# Database
[System.Environment]::SetEnvironmentVariable("DB_URL", "jdbc:postgresql://localhost:5432/society_db", "User")
[System.Environment]::SetEnvironmentVariable("DB_USERNAME", "postgres", "User")
[System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "YOUR_DB_PASSWORD", "User")

# JWT secret — FOR LOCAL DEVELOPMENT ONLY. Generate a new secret for production:
# [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "VGhpc0lzQVN1ZmZpY2llbnRseUxvbmdSYW5kb21TZWN1cmVLZXk=", "User")

# Email (Gmail App Password)
[System.Environment]::SetEnvironmentVariable("MAIL_USERNAME", "your-email@gmail.com", "User")
[System.Environment]::SetEnvironmentVariable("MAIL_PASSWORD", "your-app-password", "User")

# App settings
[System.Environment]::SetEnvironmentVariable("APP_ADMIN_EMAIL", "your-email@gmail.com", "User")
[System.Environment]::SetEnvironmentVariable("APP_FRONTEND_URL", "http://localhost:5173", "User")
```

**Quick setup (bash — Linux/macOS):**

```bash
export DB_URL=jdbc:postgresql://localhost:5432/society_db
export DB_USERNAME=postgres
export DB_PASSWORD=YOUR_DB_PASSWORD
# JWT secret — FOR LOCAL DEVELOPMENT ONLY. Generate a new secret for production:
# openssl rand -base64 32
export JWT_SECRET=VGhpc0lzQVN1ZmZpY2llbnRseUxvbmdSYW5kb21TZWN1cmVLZXk=
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
export APP_ADMIN_EMAIL=your-email@gmail.com
export APP_FRONTEND_URL=http://localhost:5173
```

### 3. Create the Database

```sql
CREATE DATABASE society_db;
```

> The schema is applied automatically on first start via `SchemaMigrationRunner`.
> You can also apply it manually: `psql -U postgres -d society_db -f database/schema.sql`

### 4. Start the Backend

```bash
cd backend

# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.
Health check: `http://localhost:8080/actuator/health`

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The web panel will be available at `http://localhost:5173`.

### 6. Build Mobile Apps (Optional)

**Android:**
```bash
cd android-app
./gradlew assembleDebug
```

**iOS:**
```bash
cd ios-app
xcodegen generate
open SocietyManager.xcodeproj
# Build in Xcode
```

---

## 🌍 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_URL` | ✅ | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/society_db` |
| `DB_USERNAME` | ✅ | Database user | `postgres` |
| `DB_PASSWORD` | ✅ | Database password | `secret` |
| `JWT_SECRET` | ✅ | Base64 JWT signing key (≥ 256 bits). **Generate a fresh secret for production — never reuse the dev default.** | `VGhpc0lzQ...` |
| `MAIL_USERNAME` | ✅ | Gmail address for outbound email | `app@gmail.com` |
| `MAIL_PASSWORD` | ✅ | Gmail App Password (not your login password) | `abcd efgh ijkl mnop` |
| `APP_ADMIN_EMAIL` | ✅ | Recipient for system notifications | `admin@gmail.com` |
| `APP_FRONTEND_URL` | ✅ | Frontend origin for CORS & email links | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Optional | Razorpay API key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay API secret | `...` |
| `VITE_API_URL` | Optional | Backend URL used by the frontend build | `http://localhost:8080` |

> **Security note:** Never commit real secrets to source control. Use environment variables or a secrets manager in production.

---

## ☁️ Deployment

The project ships with a **Render Blueprint** (`render.yaml`) that provisions:

| Service | Type | Details |
|---------|------|---------|
| `society-backend` | Web service (Java) | Spring Boot API — free plan |
| `societyhub-webapp` | Static site | Vite-built React SPA — free plan |
| `society-db` | Managed PostgreSQL | `society_db` / `society_user` |

### Deploy to Render

1. Fork / push this repository to GitHub.
2. Go to [render.com](https://render.com) → **New Blueprint**.
3. Connect your repository and select `render.yaml`.
4. Add the required environment variables (see above) in the Render dashboard.
5. Deploy — Render will build and start all three services automatically.

### Manual Build

**Backend:**
```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

**Frontend:**
```bash
cd frontend
npm ci
npm run build          # outputs to frontend/dist/
```

Serve `frontend/dist/` from any static hosting provider or CDN.

---

## 🏗️ Architecture & Scalability

### Architecture Patterns

#### Backend

| Pattern | Implementation | Scalability Benefit |
|---------|---------------|---------------------|
| **Layered Architecture** | Controller → Service → Repository → Entity | Separation of concerns, testable |
| **DTO Pattern** | Request/Response DTOs | API contract stability |
| **Repository Pattern** | Spring Data JPA repositories | Data access abstraction |
| **Service Layer** | Business logic separation | Reusable business rules |
| **Dependency Injection** | Spring IoC container | Loose coupling, testable |
| **Multi-tenancy** | Society-scoped interceptor | Data isolation per society |
| **RBAC** | Role-based access control | Granular permissions |
| **Soft Delete** | Deletion flag + cleanup service | Data recovery, audit trail |
| **Stateless Auth** | JWT tokens | Horizontal scaling |
| **API Versioning** | URL versioning (planned) | Backward compatibility |

#### Frontend

| Pattern | Implementation | Scalability Benefit |
|---------|---------------|---------------------|
| **Component-Based** | Reusable React components | Code reuse, maintainability |
| **Context API** | Global state management | Avoid prop drilling |
| **Custom Hooks** | Reusable logic | Logic sharing |
| **Lazy Loading** | React.lazy + Suspense | Reduced bundle size |
| **Code Splitting** | Route-based splitting | Faster initial load |
| **Centralized API** | Axios instance in `/api/` | Consistent API calls |
| **Feature Modules** | Organized by domain | Modularity |

#### Mobile Apps

| Pattern | Implementation | Scalability Benefit |
|---------|---------------|---------------------|
| **MVVM** | Model-View-ViewModel | Testable, separation |
| **Repository Pattern** | Data layer abstraction | Clean architecture |
| **Dependency Injection** | Hilt (Android) | Decoupled modules |
| **DTOs** | Data transfer objects | API contract |

### Scalability Features

#### Horizontal Scaling

✅ **Stateless Backend**
- JWT authentication (no server-side sessions)
- No in-memory state
- Supports load balancing

✅ **Database Connection Pooling**
- HikariCP connection pool
- Configurable pool size

✅ **Caching (Planned)**
- Redis for frequently accessed data
- Cache invalidation strategy

#### Multi-Tenancy

✅ **Society-Scoped Data Isolation**
- `SocietyScopeInterceptor` enforces society filter
- No cross-society data leakage
- Row-level security

#### Performance Optimizations

✅ **Database Indexes**
- Foreign key indexes
- Composite indexes on query patterns

✅ **Frontend Optimizations**
- Lazy loading routes
- Code splitting
- Image optimization
- Tailwind CSS purging

✅ **API Optimizations**
- Pagination on list endpoints
- Query parameter filtering
- Excel export streaming (planned)

#### Monitoring & Observability

✅ **Spring Actuator**
- `/actuator/health` endpoint
- Application metrics

🔄 **Planned:**
- Structured logging (JSON logs)
- APM integration (New Relic, Datadog)
- Error tracking (Sentry)
- Analytics dashboard

### Technology Choices for Scalability

| Technology | Scalability Justification |
|-----------|---------------------------|
| **PostgreSQL** | ACID compliance, read replicas, partitioning |
| **Spring Boot** | Production-ready, embedded server, clustering |
| **React 19** | Virtual DOM, concurrent rendering |
| **Vite** | Fast HMR, optimized builds |
| **JWT** | Stateless auth for distributed systems |
| **Docker** | Container orchestration (Kubernetes-ready) |
| **Render Blueprint** | Infrastructure as code, auto-scaling |

### Future Scalability Enhancements

🔄 **Planned:**
- Microservices architecture (if needed)
- Event-driven architecture (Kafka/RabbitMQ)
- Read/write database replicas
- CDN for static assets
- GraphQL API (alternative to REST)
- WebSocket for real-time updates
- Elasticsearch for full-text search

---

## 🤝 Contributing

Contributions are welcome! Please follow the guidelines in [`Documents/CONTRIBUTING.md`](Documents/CONTRIBUTING.md).

**Quick checklist:**
- Create a focused branch (`feat/...`, `fix/...`).
- Frontend: `npm run build` must pass.
- Backend: `.\mvnw.cmd -DskipTests compile` must pass.
- No cross-society data leakage in scoped mode.
- Update `Documents/` if behaviour changes.

**Commit message style:**
```
feat: add bulk import for vehicles
fix: correct penalty calculation for partial months
refactor: extract payment service interface
docs: update API reference for /payments
```

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Tanmay Kudkar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Built with ❤️ for Housing Society Management**

[Report Bug](https://github.com/Tanmay-Kudkar/society-management-system/issues) · [Request Feature](https://github.com/Tanmay-Kudkar/society-management-system/issues) · [Documentation](https://github.com/Tanmay-Kudkar/society-management-system/tree/main/Documents)

</div>
