# 🏢 Society Management System - Complete Documentation

<div align="center">

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-brightgreen)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A comprehensive platform for managing residential societies with role-based access control, financial tracking, and communication tools.**

</div>

---

## 📑 Table of Contents

1. [System Overview](#-system-overview)
2. [Architecture](#-architecture)
3. [Role-Based Access Control](#-role-based-access-control)
4. [Frontend (admin-web)](#-frontend-admin-web)
5. [Backend](#-backend)
6. [Database Schema](#-database-schema)
7. [API Reference](#-api-reference)
8. [Scalability Features](#-scalability-features)

---

## 🌟 System Overview

The Society Management System is a full-stack web application designed to streamline the administration of residential housing societies. It provides tools for:

- 👥 **User Management** - Role-based user hierarchy with 10 different roles
- 🏠 **Property Management** - Flats, tenants, and vehicle registration
- 💰 **Financial Management** - Maintenance bills, vendor payments, transactions
- 📢 **Communication** - Notices, banners, tickets, and complaints
- 📊 **Reporting** - MTD/YTD financial reports with Excel export
- 🔐 **Security** - JWT authentication with role-based permissions

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├──────────────────────────────┬──────────────────────────────────────┤
│      Admin Web (React)       │        Mobile App (Future)          │
│      Port: 5173              │        React Native                 │
└──────────────────────────────┴──────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                    │
│                    Spring Boot Backend                               │
│                       Port: 8080                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Controllers │ │  Security   │ │  Services   │ │ Schedulers  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ JPA/Hibernate
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                     │
│                   PostgreSQL Database                                │
│                       Port: 5432                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 👑 Role-Based Access Control

The system implements a **10-tier role hierarchy** based on **real housing society structure**:

### 🏛️ Housing Society Hierarchy (Real-World)

| Role | Authority | Responsibilities |
|------|-----------|------------------|
| **CHAIRMAN** | Highest Committee Authority | Presides over meetings, final veto/consent power, primary bank signatory |
| **SECRETARY** | Administrative Head | Manages documentation, records, day-to-day operations |
| **TREASURER** | Financial Head | Handles finances, billing, payments, accounts |

### 🔐 Access Control Rules

1. **Parent creates DIRECT CHILDREN only** - No skip-level creation
2. **Read access flows DOWNWARD** - Parents can read all descendants  
3. **Update/Delete is LIMITED to direct children** - No skip-level modification
4. **Grandchildren = READ-ONLY** - Can view but not modify
5. **EXCEPTION: SOCIETY_ADMIN has FULL CRUD** - Can create/update/delete all roles below

```
                    ╔══════════════════╗
                    ║   MASTER_ADMIN   ║ ← Platform Owner (You)
                    ║   (Level 1)      ║   Creates ONLY → SOCIETY_ADMIN
                    ╚════════╦═════════╝   Read access to ALL
                             │ Creates (Direct Child Only)
                             ▼
                    ╔══════════════════╗
                    ║  SOCIETY_ADMIN   ║ ← EXCEPTION: Full CRUD below
                    ║   (Level 2)      ║   Manages ONE society
                    ╚════════╦═════════╝
                             │ Creates (All Below - Exception)
                             ▼
                    ╔══════════════════╗
                    ║    CHAIRMAN      ║ ← Committee HEAD (Highest Authority)
                    ║   (Level 3)      ║   Creates → SECRETARY, TREASURER
                    ╚════════╦═════════╝
                             │ Creates (Direct Children)
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ╔═══════════════╗             ╔═══════════════╗
     ║   SECRETARY   ║             ║   TREASURER   ║
     ║  (Level 4)    ║             ║   (Level 4)   ║
     ║  Admin Head   ║             ║ Financial Head║
     ╚═══════╦═══════╝             ╚═══════╦═══════╝
             │                             │
             └──────────┬──────────────────┘
                        │ Creates (Direct Child)
                        ▼
                ╔══════════════════╗
                ║    COMMITTEE     ║ ← General committee members
                ║   (Level 5)      ║
                ╚════════╦═════════╝
                         │ Creates (Direct Children)
              ┌──────────┴──────────┐
              ▼                     ▼
     ╔═══════════════╗     ╔═══════════════╗
     ║   EMPLOYEE    ║     ║    MEMBER     ║
     ║  (Level 6)    ║     ║   (Level 6)   ║
     ╚═══════╦═══════╝     ╚═══════╦═══════╝
             │ Creates              │ Creates
             ▼                      ▼
     ╔═══════════════╗     ╔═══════════════╗
     ║   VISITOR     ║     ║    TENANT     ║
     ║  (Level 7)    ║     ║   (Level 7)   ║
     ╚═══════════════╝     ╚═══════════════╝
```

### User CRUD Permissions Matrix

| Role | Can CREATE | Can UPDATE/DELETE | Can READ |
|------|------------|-------------------|----------|
| `MASTER_ADMIN` | SOCIETY_ADMIN only | SOCIETY_ADMIN only | ALL roles |
| `SOCIETY_ADMIN` | ALL below (exception) | ALL below (exception) | ALL in society |
| `CHAIRMAN` | SECRETARY, TREASURER | SECRETARY, TREASURER | All below |
| `SECRETARY` | COMMITTEE only | COMMITTEE only | COMMITTEE and below |
| `TREASURER` | COMMITTEE only | COMMITTEE only | COMMITTEE and below |
| `COMMITTEE` | EMPLOYEE, MEMBER | EMPLOYEE, MEMBER | EMPLOYEE, MEMBER and below |
| `EMPLOYEE` | VISITOR only | VISITOR only | VISITOR |
| `MEMBER` | TENANT only | TENANT only | TENANT |
| `TENANT` | ❌ None | ❌ None | Own profile |
| `VISITOR` | ❌ None | ❌ None | Own profile |

---

## 🎨 Frontend (admin-web)

The frontend is built with **React 18** + **Vite** + **Tailwind CSS** with full dark mode support.

### 📁 Directory Structure

```
admin-web/
├── 📄 index.html           # Entry HTML file
├── 📄 package.json         # Dependencies & scripts
├── 📄 vite.config.js       # Vite bundler configuration
├── 📄 eslint.config.js     # ESLint rules
├── 📁 public/              # Static assets
└── 📁 src/                 # Source code
    ├── 📄 main.jsx         # React entry point
    ├── 📄 App.jsx          # Main router component
    ├── 📄 App.css          # Global styles
    ├── 📄 index.css        # Tailwind imports
    ├── 📁 api/             # API layer
    ├── 📁 assets/          # Images, icons
    ├── 📁 components/      # Reusable components
    ├── 📁 context/         # React Context providers
    └── 📁 pages/           # Page components
```

---

### 📂 Root Files

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `index.html` | HTML entry point that loads the React app | Required by browsers to start the application | Minimal changes needed; add meta tags for SEO |
| `package.json` | Defines dependencies, scripts, and project metadata | NPM/Yarn uses this to install packages and run commands | Add new dependencies as features grow; use semantic versioning |
| `vite.config.js` | Configures Vite bundler (proxy, plugins, build options) | Enables hot reload, optimized builds, API proxying | Add plugins for code splitting, PWA support, bundle analysis |
| `eslint.config.js` | Defines code linting rules for consistent code style | Enforces best practices across the team | Extend with custom rules as codebase grows |

---

### 📂 src/ Directory Files

#### Entry Files

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `main.jsx` | Bootstraps React app, wraps with providers (Router, Auth, Settings) | Entry point that mounts React to DOM and sets up global providers | Add new providers (Redux, Theme, i18n) as wrappers here |
| `App.jsx` | Defines all routes and protected route logic | Central routing hub connecting URLs to page components | Add new routes easily; supports nested routing for modules |
| `App.css` | Global CSS styles and animations | App-wide styling not covered by Tailwind | Migrate to CSS modules for component isolation |
| `index.css` | Tailwind CSS imports and base styles | Loads Tailwind's utility classes | Add custom Tailwind config for design tokens |

---

#### 📂 api/ Folder

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `index.js` | **Centralized API layer** with Axios instance and all API functions | Single source of truth for all HTTP requests; includes auth interceptors | Add new API modules (auditApi, mobileApi); easy to add caching, retry logic |

**Key Features:**
- 🔐 **Auto-authentication**: Attaches JWT token to all requests
- 🔄 **Token refresh handling**: Redirects to login on 401
- 📦 **Organized API modules**: Separate objects for each resource (userApi, flatApi, etc.)
- 📊 **Export functionality**: Blob downloads for Excel files

---

#### 📂 components/ Folder

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `Layout.jsx` | Main application layout with sidebar/navbar, responsive design | Provides consistent navigation and structure for all pages | Add new menu groups, notification center, breadcrumbs |
| `Toggle.jsx` | Reusable toggle switch component | Used for boolean settings (dark mode, notifications) | Extend with sizes, colors, disabled states |

**Layout.jsx Features:**
- 📱 Responsive design (mobile drawer + desktop navbar)
- 🎨 Dark mode support with system preference detection
- 👤 User profile dropdown with logout
- 🏷️ Role-based menu visibility
- 📊 Grouped navigation menu structure

---

#### 📂 context/ Folder

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `AuthContext.jsx` | **Authentication state management** - stores user, token, login/logout functions | Provides auth state to entire app via React Context | Add refresh tokens, remember me, multi-tab sync |
| `SettingsContext.jsx` | **App settings state** - dark mode, accent color, compact mode | Allows users to customize their experience | Add language, timezone, notification preferences |

**AuthContext.jsx Features:**
- 🔑 `login(email, password)` - Authenticates user
- 🚪 `logout()` - Clears session
- 🎭 `hasRole(...roles)` - Check if user has specific role(s)
- 👔 `isAdminLevel()` - Check if MASTER_ADMIN or SOCIETY_ADMIN
- 🏛️ `isCommitteeLevel()` - Check if any committee role

---

#### 📂 pages/ Folder

| File | Purpose | Features | Scalability |
|------|---------|----------|-------------|
| `Login.jsx` | User authentication page | Email/password form, error handling, redirect after login | Add SSO, forgot password, 2FA |
| `Dashboard.jsx` | Main dashboard with stats overview | Summary cards (flats, members, tickets), MTD/YTD financial stats, recent activities | Add charts, widgets, customizable layout |
| `Users.jsx` | User management CRUD | Create/edit/delete users, role selection based on permissions, society assignment | Add bulk import, filters, export |
| `Societies.jsx` | Society management (MASTER_ADMIN only) | Create/edit societies with all details | Add society settings, statistics |
| `Flats.jsx` | Flat/apartment management | CRUD with owner details, occupancy status, type filtering | Add floor plans, bulk assignment |
| `Tenants.jsx` | Tenant record management | Agreement dates, rent details, ID proof, active/inactive toggle | Add document upload, reminders |
| `Vehicles.jsx` | Vehicle registration | Vehicle details, parking slot, flat association | Add parking management, visitor vehicles |
| `Vendors.jsx` | Vendor/service provider management | Contact info, banking details, service type | Add vendor ratings, contract linking |
| `VendorBills.jsx` | Vendor bill tracking | Bill status, partial payments, payment recording | Add recurring bills, approval workflow |
| `Contracts.jsx` | AMC/Contract management | Start/end dates, reminder days, vendor linking | Add renewal alerts, document storage |
| `MaintenanceBills.jsx` | Maintenance bill generation | Monthly generation for society, payment tracking | Add auto-generation, penalties |
| `Transactions.jsx` | Income/expense tracking | Category-wise tracking, payment modes, Excel export | Add bank reconciliation, reports |
| `Reports.jsx` | Financial reports (MTD/YTD) | Summary cards, comparison charts, Excel export | Add custom date ranges, PDF export |
| `Notices.jsx` | Society notice board | Priority levels, expiry dates, active/inactive | Add push notifications, read receipts |
| `Banners.jsx` | Banner/promotional content | Image URL, display order, date range | Add image upload, carousel preview |
| `Tickets.jsx` | Issue/request ticketing | Status workflow, assignment, progress bar, overdue tracking | Add escalation, SLA tracking |
| `Complaints.jsx` | User complaints | Similar to tickets but user-facing | Add anonymous complaints, ratings |
| `EmergencyContacts.jsx` | Emergency contact directory | Categorized contacts (doctor, plumber, etc.) | Add quick dial, location integration |
| `Documents.jsx` | Document templates | Template management for common documents | Add PDF generation, e-signatures |
| `Settings.jsx` | User preferences | Dark mode, accent color, notification preferences, password change | Add profile photo, language |

---

## ⚙️ Backend

The backend is built with **Spring Boot 3.5.10** + **Java 21** + **PostgreSQL** with layered architecture.

### 📁 Directory Structure

```
backend/
├── 📄 pom.xml                    # Maven dependencies
├── 📄 mvnw, mvnw.cmd             # Maven wrapper scripts
└── 📁 src/
    ├── 📁 main/
    │   ├── 📁 java/com/society/backend/
    │   │   ├── 📄 BackendApplication.java   # Main class
    │   │   ├── 📄 PasswordHasher.java       # Utility
    │   │   ├── 📁 config/                   # Configuration classes
    │   │   ├── 📁 controller/               # REST endpoints
    │   │   ├── 📁 dto/                      # Data Transfer Objects
    │   │   ├── 📁 entity/                   # JPA entities
    │   │   ├── 📁 exception/                # Custom exceptions
    │   │   ├── 📁 repository/               # JPA repositories
    │   │   ├── 📁 scheduler/                # Scheduled tasks
    │   │   ├── 📁 security/                 # JWT & auth
    │   │   └── 📁 service/                  # Business logic
    │   └── 📁 resources/
    │       └── 📄 application.properties    # App configuration
    └── 📁 test/                             # Unit tests
```

---

### 📂 Root Files

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `pom.xml` | Maven project configuration with all dependencies | Manages dependencies, build plugins, project metadata | Add new starters (Redis, Kafka, etc.) as needed |
| `mvnw` / `mvnw.cmd` | Maven wrapper scripts | Ensures consistent Maven version across environments | No changes needed |
| `BackendApplication.java` | Spring Boot main class with `@SpringBootApplication` | Entry point that bootstraps the application | Add profile-specific beans |
| `PasswordHasher.java` | CLI utility to generate BCrypt hashes | Helps create hashed passwords for manual DB entries | Utility - rarely changes |

---

### 📂 config/ Folder

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `CorsConfig.java` | CORS configuration for cross-origin requests | Allows frontend (different port) to call backend APIs | Add production domains |
| `DataInitializer.java` | Creates MASTER_ADMIN on startup | Ensures platform owner exists on first run | Add more seed data |
| `PasswordConfig.java` | Configures BCryptPasswordEncoder bean | Standard password hashing | Switch to Argon2 if needed |
| `SchedulerConfig.java` | Enables scheduled tasks | Required for `@Scheduled` annotations | Configure thread pool size |
| `SecurityConfig.java` | Spring Security configuration | Defines auth rules, JWT filter chain, endpoint protection | Add OAuth2, 2FA |

---

### 📂 security/ Folder

| File | Purpose | Why It's Needed | Scalability |
|------|---------|-----------------|-------------|
| `JwtUtils.java` | JWT token generation and validation | Creates and parses JWT tokens | Add refresh tokens, token blacklist |
| `JwtAuthenticationFilter.java` | Filter that validates JWT on each request | Extracts user from token for authorization | Add rate limiting |
| `JwtAuthenticationEntryPoint.java` | Handles unauthorized access (401) | Returns proper JSON error for unauthenticated requests | Customize error format |
| `CustomUserDetails.java` | Implements UserDetails interface | Bridges our User entity to Spring Security | Add additional fields |
| `CustomUserDetailsService.java` | Loads user from database for authentication | Required by Spring Security for login | Add caching |
| `RolePermissions.java` | **Role hierarchy logic** - defines who can create whom | Enforces user creation rules based on role | Central place to modify permissions |

---

### 📂 entity/ Folder

JPA entities map to database tables. Each uses Lombok for boilerplate reduction.

| File | Database Table | Purpose | Key Fields | Scalability |
|------|---------------|---------|------------|-------------|
| `User.java` | `users` | System users | name, email, password, role, society_id | Add profile photo, preferences |
| `Role.java` | (enum) | Role definitions | 10 roles from MASTER_ADMIN to VISITOR | Add new roles as needed |
| `Society.java` | `societies` | Housing societies | name, address, city, registration_number | Add GPS coords, settings |
| `Flat.java` | `flats` | Apartments/units | flat_number, type, floor, owner, society_id | Add amenities, documents |
| `Tenant.java` | `tenants` | Rental tenants | name, flat_id, agreement dates, rent | Add document storage |
| `Vehicle.java` | `vehicles` | Registered vehicles | vehicle_number, flat_id, parking_slot | Add RFID, entry logs |
| `Vendor.java` | `vendors` | Service providers | name, service_type, banking details | Add ratings, contracts |
| `VendorBill.java` | `vendor_bills` | Vendor invoices | vendor_id, amount, status, due_date | Add approval workflow |
| `Contract.java` | `contracts` | AMC/insurance contracts | vendor_id, start/end dates, reminder_days | Add document URL |
| `MaintenanceBill.java` | `maintenance_bills` | Monthly maintenance | flat_id, bill_month, amount, status | Add line items |
| `Transaction.java` | `transactions` | Income/expense records | society_id, type, amount, category | Add receipt upload |
| `Notice.java` | `notices` | Society announcements | society_id, title, content, priority | Add attachments |
| `Banner.java` | `banners` | Promotional banners | image_url, display_order, dates | Add click tracking |
| `Ticket.java` | `tickets` | Issues/requests | raised_by, assigned_to, status, progress | Add SLA, escalation |
| `Complaint.java` | `complaints` | User complaints | user_id, title, status | Add escalation |
| `EmergencyContact.java` | `emergency_contacts` | Emergency directory | society_id, type, name, phone | Add geo-location |
| `DocumentTemplate.java` | `document_templates` | Document templates | type, title, content | Add PDF generation |
| `NotificationPreference.java` | `notification_preferences` | Email preferences | user_id, email_tickets, email_payments | Add push preferences |

---

### 📂 dto/ Folder

DTOs (Data Transfer Objects) separate API contracts from internal entities.

**Structure per module:**
```
dto/
├── 📁 auth/
│   ├── LoginRequest.java      # Email + password
│   ├── LoginResponse.java     # Token + user info
│   └── RegisterRequest.java   # Registration data
├── 📁 user/
│   ├── CreateUserRequest.java
│   ├── UpdateUserRequest.java
│   └── UserResponse.java
├── 📁 flat/
│   ├── CreateFlatRequest.java
│   └── FlatResponse.java
... (similar structure for all modules)
```

| Why DTOs? |
|-----------|
| 🔒 **Security**: Never expose entity directly (hides sensitive fields) |
| 📝 **Validation**: Add `@NotNull`, `@Size` annotations on DTOs |
| 🔄 **Versioning**: Change DTO without affecting database |
| 📊 **Optimization**: Return only needed fields |

---

### 📂 repository/ Folder

JPA repositories extend `JpaRepository` for database operations.

| Module | Key Custom Queries | Scalability |
|--------|-------------------|-------------|
| `UserRepository` | `findByEmail()`, `findBySocietyId()` | Add specification for dynamic queries |
| `FlatRepository` | `findBySocietyId()`, `findByOwnerId()` | Add pagination |
| `TransactionRepository` | `findByDateRange()`, `findBySocietyIdAndType()` | Add aggregation queries |
| `TicketRepository` | `findByStatus()`, `findByAssignedTo()`, `findOverdue()` | Add full-text search |
| `MaintenanceBillRepository` | `findByMonth()`, `findPending()` | Add summary queries |

---

### 📂 service/ Folder

Services contain business logic. Each module has:
- `XxxService.java` - Interface
- `XxxServiceImpl.java` - Implementation

| Service | Key Responsibilities | Scalability |
|---------|---------------------|-------------|
| `AuthService` | Login validation, JWT generation | Add OAuth2, LDAP |
| `UserService` | CRUD + role permission validation | Add bulk operations |
| `SocietyService` | Society CRUD, admin assignment | Add statistics |
| `FlatService` | Flat CRUD, occupancy management | Add bulk import |
| `VendorBillService` | Bill lifecycle, payment recording | Add approval workflow |
| `MaintenanceBillService` | Bill generation, payment tracking | Add auto-generation |
| `TransactionService` | Financial records, summaries | Add reconciliation |
| `TicketService` | Ticket workflow, assignment, progress | Add SLA tracking |
| `ReportService` | MTD/YTD calculations | Add caching |
| `ExcelExportService` | Excel file generation | Add PDF export |

---

### 📂 controller/ Folder

REST controllers organized by module:

```
controller/
├── 📁 auth/
│   └── AuthController.java        # POST /auth/login, /auth/register
├── 📁 user/
│   └── UserController.java        # /users CRUD
├── 📁 society/
│   └── SocietyController.java     # /societies CRUD
├── 📁 flat/
│   └── FlatController.java        # /flats CRUD
├── 📁 vendor/
│   └── VendorController.java      # /vendors CRUD
│   └── VendorBillController.java  # /vendor-bills CRUD + payments
├── 📁 maintenance/
│   └── MaintenanceBillController.java  # /maintenance-bills + generate
├── 📁 transaction/
│   └── TransactionController.java # /transactions + summaries
├── 📁 report/
│   └── ReportController.java      # /api/reports (MTD/YTD)
├── 📁 export/
│   └── ExportController.java      # /api/export (Excel downloads)
├── 📁 ticket/
│   └── TicketController.java      # /tickets + assign + progress
├── 📁 notice/
│   └── NoticeController.java      # /notices CRUD
├── 📁 banner/
│   └── BannerController.java      # /banners CRUD
├── 📁 emergency/
│   └── EmergencyContactController.java
├── 📁 document/
│   └── DocumentTemplateController.java
├── 📁 tenant/
│   └── TenantController.java
├── 📁 vehicle/
│   └── VehicleController.java
├── 📁 health/
│   └── HealthController.java      # GET /health
└── 📁 notification/
    └── NotificationPreferenceController.java
```

---

### 📂 scheduler/ Folder

| File | Purpose | Schedule |
|------|---------|----------|
| `ContractReminderScheduler.java` | Sends expiry reminders for contracts | Daily at midnight |
| `OverdueBillScheduler.java` | Marks bills as overdue | Daily |

---

### 📂 exception/ Folder

| File | Purpose |
|------|---------|
| `ResourceNotFoundException.java` | Thrown when entity not found (404) |
| `UnauthorizedException.java` | Thrown for permission issues (403) |
| `GlobalExceptionHandler.java` | Catches all exceptions, returns consistent JSON |

---

## 🗄️ Database Schema

The system uses **17 PostgreSQL tables** with carefully designed relationships.

---

### 📊 Entity-Relationship Diagram

```
                                    ┌─────────────────┐
                                    │    SOCIETIES    │
                                    │─────────────────│
                                    │ id (PK)         │
                                    │ name            │
                                    │ address         │
                                    │ city, state     │
                                    │ registration_no │
                                    └────────┬────────┘
                                             │
         ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
         │               │                   │                   │               │
         ▼               ▼                   ▼                   ▼               ▼
┌─────────────────┐ ┌──────────┐    ┌──────────────┐    ┌─────────────┐  ┌──────────────┐
│     USERS       │ │  FLATS   │    │   NOTICES    │    │  CONTRACTS  │  │ TRANSACTIONS │
│─────────────────│ │──────────│    │──────────────│    │─────────────│  │──────────────│
│ id (PK)         │ │ id (PK)  │    │ id (PK)      │    │ id (PK)     │  │ id (PK)      │
│ society_id (FK)─┼─│society_id│◄───│ society_id   │    │ society_id  │  │ society_id   │
│ name, email     │ │flat_number│   │ title        │    │ vendor_id   │  │ type (IN/EX) │
│ role (enum)     │ │ type     │    │ content      │    │ start_date  │  │ amount       │
│ is_active       │ │ floor    │    │ priority     │    │ end_date    │  │ category     │
└─────────────────┘ │ owner_*  │    │ expiry_date  │    └─────────────┘  │ payment_mode │
        │           └────┬─────┘    └──────────────┘           │         └──────────────┘
        │                │                                     │
        │                ├──────────────────┐                  │
        │                │                  │                  │
        │                ▼                  ▼                  ▼
        │       ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │       │   TENANTS    │   │   VEHICLES   │   │   VENDORS    │
        │       │──────────────│   │──────────────│   │──────────────│
        │       │ id (PK)      │   │ id (PK)      │   │ id (PK)      │
        │       │ flat_id (FK) │   │ flat_id (FK) │   │ society_id   │
        │       │ name         │   │ vehicle_no   │   │ name         │
        │       │ agreement_*  │   │ type         │   │ service_type │
        │       │ rent_amount  │   │ parking_slot │   │ bank_details │
        │       └──────────────┘   └──────────────┘   └──────┬───────┘
        │                                                     │
        │           ┌────────────────────────────────────────┤
        │           │                                        │
        │           ▼                                        ▼
        │   ┌──────────────────┐                    ┌──────────────┐
        │   │ MAINTENANCE_BILLS │                   │ VENDOR_BILLS │
        │   │──────────────────│                    │──────────────│
        │   │ id (PK)          │                    │ id (PK)      │
        │   │ flat_id (FK)     │                    │ vendor_id FK │
        │   │ bill_month       │                    │ society_id   │
        │   │ amount           │                    │ amount       │
        │   │ status           │                    │ status       │
        │   │ due_date         │                    │ due_date     │
        │   └──────────────────┘                    └──────────────┘
        │
        ├───────────────────────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────┐                   ┌──────────────┐
│   TICKETS    │                   │  COMPLAINTS  │
│──────────────│                   │──────────────│
│ id (PK)      │                   │ id (PK)      │
│ raised_by FK │                   │ user_id (FK) │
│ assigned_to  │                   │ title        │
│ society_id   │                   │ description  │
│ type         │                   │ status       │
│ status       │                   └──────────────┘
│ priority     │
│ progress_%   │
└──────────────┘

Other Tables:
┌──────────────────────┐  ┌─────────────────┐  ┌────────────────────────────┐
│  EMERGENCY_CONTACTS  │  │     BANNERS     │  │  NOTIFICATION_PREFERENCES  │
│──────────────────────│  │─────────────────│  │────────────────────────────│
│ id, society_id       │  │ id, society_id  │  │ id, user_id (FK)           │
│ contact_type         │  │ title, image_url│  │ email_tickets              │
│ name, phone          │  │ display_order   │  │ email_complaints           │
└──────────────────────┘  │ start/end_date  │  │ email_payments             │
                          └─────────────────┘  └────────────────────────────┘

┌────────────────────────┐
│   DOCUMENT_TEMPLATES   │
│────────────────────────│
│ id (PK)                │
│ template_type          │
│ title, content         │
└────────────────────────┘
```

---

### 📋 Complete Table Reference

---

#### 1. 👤 `users` - System Users

Stores all users from MASTER_ADMIN to VISITOR with role-based access.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Auto-increment primary key |
| `name` | VARCHAR(100) | ❌ | User's full name |
| `email` | VARCHAR(100) | ❌ UNIQUE | Login email address |
| `password` | VARCHAR(255) | ❌ | BCrypt hashed password |
| `phone` | VARCHAR(20) | ✅ | Contact number |
| `society_id` | INT | ✅ FK→societies | NULL for MASTER_ADMIN, required for others |
| `role` | VARCHAR(50) | ❌ | One of 10 roles (MASTER_ADMIN...VISITOR) |
| `is_active` | BOOLEAN | ❌ | Soft delete flag (default: true) |
| `created_at` | TIMESTAMP | ❌ | Account creation time |

**Foreign Keys:**
- `society_id` → `societies(id)` - Links user to their society

**Role-Based Access:**
- `MASTER_ADMIN` has `society_id = NULL` (access to all)
- All other roles must have a valid `society_id`

---

#### 2. 🏢 `societies` - Housing Societies

Master list of all managed housing societies.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Society identifier |
| `name` | VARCHAR(100) | ❌ | Society name |
| `address` | TEXT | ✅ | Full address |
| `city` | VARCHAR(100) | ✅ | City name |
| `state` | VARCHAR(100) | ✅ | State/province |
| `pincode` | VARCHAR(10) | ✅ | Postal code |
| `registration_number` | VARCHAR(50) | ✅ | Official registration ID |
| `email` | VARCHAR(100) | ✅ | Society contact email |
| `phone` | VARCHAR(20) | ✅ | Society contact phone |
| `created_at` | TIMESTAMP | ❌ | When society was onboarded |

**Access Control:**
- Only `MASTER_ADMIN` can create/edit/delete societies
- All other roles are restricted to their assigned society

---

#### 3. 🏠 `flats` - Apartments/Units

All residential units within societies.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Flat identifier |
| `society_id` | INT | ❌ FK | Which society this belongs to |
| `flat_number` | VARCHAR(20) | ❌ | Unit number (e.g., "A-101") |
| `flat_type` | VARCHAR(50) | ✅ | 1BHK, 2BHK, 3BHK, STUDIO, PENTHOUSE |
| `floor` | INT | ✅ | Floor number (0 = ground) |
| `area` | DECIMAL(10,2) | ✅ | Area in square feet |
| `owner_name` | VARCHAR(100) | ✅ | Property owner name |
| `owner_email` | VARCHAR(100) | ✅ | Owner contact email |
| `owner_phone` | VARCHAR(20) | ✅ | Owner contact phone |
| `owner_user_id` | INT | ✅ FK | Link to users table if registered |
| `is_occupied` | BOOLEAN | ❌ | Whether flat has active tenant |

**Foreign Keys:**
- `society_id` → `societies(id)`
- `owner_user_id` → `users(id)` (optional)

---

#### 4. 🧾 `complaints` - User Complaints

General complaints raised by society members.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Complaint ID |
| `user_id` | INT | ❌ FK | Who raised the complaint |
| `title` | VARCHAR(200) | ❌ | Short description |
| `description` | TEXT | ✅ | Detailed explanation |
| `status` | VARCHAR(20) | ❌ | PENDING, IN_PROGRESS, RESOLVED, REJECTED |
| `created_at` | TIMESTAMP | ❌ | When complaint was filed |

**Foreign Keys:**
- `user_id` → `users(id)`

---

#### 5. 📢 `notices` - Society Announcements

Notices and announcements for society members.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Notice ID |
| `society_id` | INT | ❌ FK | Target society |
| `title` | VARCHAR(200) | ❌ | Notice headline |
| `content` | TEXT | ✅ | Full notice content |
| `priority` | VARCHAR(20) | ❌ | LOW, MEDIUM, HIGH, URGENT |
| `expiry_date` | DATE | ✅ | When notice becomes inactive |
| `is_active` | BOOLEAN | ❌ | Manual on/off toggle |
| `created_at` | TIMESTAMP | ❌ | Publication date |

**Foreign Keys:**
- `society_id` → `societies(id)`

---

#### 6. 🚗 `vehicles` - Registered Vehicles

Vehicles registered to flats for parking management.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Vehicle record ID |
| `flat_id` | INT | ❌ FK | Which flat owns this vehicle |
| `vehicle_type` | VARCHAR(20) | ❌ | TWO_WHEELER, FOUR_WHEELER |
| `vehicle_number` | VARCHAR(20) | ❌ | License plate number |
| `brand` | VARCHAR(50) | ✅ | Vehicle manufacturer |
| `model` | VARCHAR(50) | ✅ | Vehicle model |
| `color` | VARCHAR(30) | ✅ | Vehicle color |
| `parking_slot` | VARCHAR(20) | ✅ | Assigned parking space |
| `created_at` | TIMESTAMP | ❌ | Registration date |

**Foreign Keys:**
- `flat_id` → `flats(id)` - Links to owning flat

---

#### 7. 🏠 `tenants` - Rental Tenants

Tenants renting flats with agreement details.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Tenant record ID |
| `flat_id` | INT | ❌ FK | Which flat they're renting |
| `name` | VARCHAR(100) | ❌ | Tenant full name |
| `phone` | VARCHAR(20) | ✅ | Contact number |
| `email` | VARCHAR(100) | ✅ | Email address |
| `id_proof_type` | VARCHAR(50) | ✅ | AADHAR, PAN, PASSPORT, etc. |
| `id_proof_number` | VARCHAR(50) | ✅ | ID document number |
| `agreement_start_date` | DATE | ✅ | Lease start date |
| `agreement_end_date` | DATE | ✅ | Lease end date |
| `rent_amount` | DECIMAL(12,2) | ✅ | Monthly rent |
| `deposit_amount` | DECIMAL(12,2) | ✅ | Security deposit |
| `is_active` | BOOLEAN | ❌ | Current tenant status |
| `created_at` | TIMESTAMP | ❌ | Record creation |

**Foreign Keys:**
- `flat_id` → `flats(id)`

---

#### 8. 🎫 `tickets` - Issue Tracking

Internal ticketing system for complaints, requests, and issues.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Ticket ID |
| `raised_by` | INT | ❌ FK | User who created ticket |
| `assigned_to` | INT | ✅ FK | Staff assigned to resolve |
| `society_id` | INT | ❌ FK | Society context |
| `type` | VARCHAR(20) | ❌ | COMPLAINT, REQUEST, ISSUE |
| `title` | VARCHAR(200) | ❌ | Brief description |
| `description` | TEXT | ✅ | Detailed explanation |
| `status` | VARCHAR(20) | ❌ | PENDING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED |
| `priority` | VARCHAR(10) | ❌ | LOW, MEDIUM, HIGH, URGENT |
| `resolution` | TEXT | ✅ | How it was resolved |
| `progress_percent` | INT | ✅ | 0-100 completion percentage |
| `created_at` | TIMESTAMP | ❌ | When raised |
| `updated_at` | TIMESTAMP | ✅ | Last modification |
| `resolved_at` | TIMESTAMP | ✅ | When marked complete |

**Foreign Keys:**
- `raised_by` → `users(id)`
- `assigned_to` → `users(id)` (nullable)
- `society_id` → `societies(id)`

---

#### 9. 🏪 `vendors` - Service Providers

External vendors and service providers.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Vendor ID |
| `society_id` | INT | ✅ FK | Specific society (NULL = common vendor) |
| `name` | VARCHAR(100) | ❌ | Business/person name |
| `service_type` | VARCHAR(50) | ❌ | PLUMBER, ELECTRICIAN, SECURITY, etc. |
| `phone` | VARCHAR(20) | ✅ | Contact number |
| `email` | VARCHAR(100) | ✅ | Email address |
| `address` | TEXT | ✅ | Business address |
| `gst_number` | VARCHAR(20) | ✅ | GST registration |
| `pan_number` | VARCHAR(20) | ✅ | PAN number |
| `bank_name` | VARCHAR(100) | ✅ | Bank name for payments |
| `account_number` | VARCHAR(30) | ✅ | Bank account |
| `ifsc_code` | VARCHAR(20) | ✅ | IFSC code |
| `is_common` | BOOLEAN | ❌ | Shared across societies |
| `is_active` | BOOLEAN | ❌ | Active status |
| `created_at` | TIMESTAMP | ❌ | Registration date |

**Foreign Keys:**
- `society_id` → `societies(id)` (nullable for common vendors)

---

#### 10. 📃 `vendor_bills` - Vendor Invoices

Bills received from vendors.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Bill ID |
| `vendor_id` | INT | ❌ FK | Which vendor |
| `society_id` | INT | ❌ FK | Which society |
| `bill_number` | VARCHAR(50) | ✅ | Vendor's invoice number |
| `amount` | DECIMAL(12,2) | ❌ | Total bill amount |
| `paid_amount` | DECIMAL(12,2) | ❌ | Amount paid so far |
| `status` | VARCHAR(20) | ❌ | PENDING, PARTIAL, PAID |
| `bill_date` | DATE | ✅ | Invoice date |
| `due_date` | DATE | ✅ | Payment deadline |
| `description` | TEXT | ✅ | Bill details |
| `payment_mode` | VARCHAR(20) | ✅ | CASH, CHEQUE, ONLINE |
| `reference_number` | VARCHAR(50) | ✅ | Payment reference |
| `created_at` | TIMESTAMP | ❌ | Record creation |
| `paid_at` | TIMESTAMP | ✅ | Full payment date |

**Foreign Keys:**
- `vendor_id` → `vendors(id)`
- `society_id` → `societies(id)`

---

#### 11. 📜 `contracts` - AMC & Contracts

Annual maintenance contracts and insurance policies.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Contract ID |
| `society_id` | INT | ❌ FK | Society |
| `vendor_id` | INT | ✅ FK | Service provider |
| `contract_type` | VARCHAR(50) | ❌ | AMC, INSURANCE, PEST_CONTROL, etc. |
| `title` | VARCHAR(200) | ❌ | Contract name |
| `description` | TEXT | ✅ | Details |
| `start_date` | DATE | ❌ | Contract begins |
| `end_date` | DATE | ❌ | Contract expires |
| `reminder_days` | INT | ❌ | Days before expiry to remind |
| `document_url` | VARCHAR(500) | ✅ | Link to contract document |
| `is_active` | BOOLEAN | ❌ | Active status |
| `created_at` | TIMESTAMP | ❌ | Created date |

**Foreign Keys:**
- `society_id` → `societies(id)`
- `vendor_id` → `vendors(id)` (nullable)

---

#### 12. 💳 `maintenance_bills` - Monthly Maintenance

Monthly maintenance charges per flat.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Bill ID |
| `flat_id` | INT | ❌ FK | Target flat |
| `bill_month` | VARCHAR(7) | ❌ | Format: YYYY-MM (e.g., 2026-01) |
| `amount` | DECIMAL(12,2) | ❌ | Total due |
| `paid_amount` | DECIMAL(12,2) | ❌ | Amount received |
| `due_date` | DATE | ✅ | Payment deadline |
| `payment_date` | DATE | ✅ | When paid |
| `status` | VARCHAR(20) | ❌ | PENDING, PARTIAL, PAID, OVERDUE |
| `payment_mode` | VARCHAR(20) | ✅ | CASH, CHEQUE, ONLINE |
| `receipt_number` | VARCHAR(50) | ✅ | Receipt for payment |
| `reference_number` | VARCHAR(50) | ✅ | Transaction reference |
| `created_at` | TIMESTAMP | ❌ | Bill generation date |
| `paid_at` | TIMESTAMP | ✅ | Full payment timestamp |

**Foreign Keys:**
- `flat_id` → `flats(id)` - Which flat owes this bill

---

#### 13. 💰 `transactions` - Financial Records

All income and expense transactions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Transaction ID |
| `society_id` | INT | ❌ FK | Society |
| `transaction_type` | VARCHAR(10) | ❌ | INCOME or EXPENSE |
| `payment_mode` | VARCHAR(20) | ❌ | CASH, CHEQUE, ONLINE |
| `amount` | DECIMAL(12,2) | ❌ | Transaction amount |
| `category` | VARCHAR(50) | ❌ | MAINTENANCE, VENDOR_PAYMENT, SALARY, etc. |
| `description` | TEXT | ✅ | Transaction details |
| `transaction_date` | DATE | ❌ | When it occurred |
| `reference_number` | VARCHAR(50) | ✅ | Bank reference |
| `cheque_number` | VARCHAR(30) | ✅ | If paid by cheque |
| `bank_name` | VARCHAR(100) | ✅ | Bank name |
| `cheque_date` | DATE | ✅ | Cheque date |
| `related_bill_id` | INT | ✅ | Link to source bill |
| `related_bill_type` | VARCHAR(20) | ✅ | MAINTENANCE, VENDOR |
| `created_at` | TIMESTAMP | ❌ | Record creation |

**Foreign Keys:**
- `society_id` → `societies(id)`

---

#### 14. 🚨 `emergency_contacts` - Emergency Directory

Important contact numbers for emergencies.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Contact ID |
| `society_id` | INT | ❌ FK | Society |
| `contact_type` | VARCHAR(50) | ❌ | DOCTOR, PLUMBER, ELECTRICIAN, POLICE, etc. |
| `name` | VARCHAR(100) | ❌ | Contact name |
| `phone` | VARCHAR(20) | ❌ | Primary phone |
| `alternate_phone` | VARCHAR(20) | ✅ | Backup number |
| `address` | TEXT | ✅ | Location |
| `notes` | TEXT | ✅ | Additional info |
| `is_active` | BOOLEAN | ❌ | Active flag |
| `created_at` | TIMESTAMP | ❌ | Added date |

**Foreign Keys:**
- `society_id` → `societies(id)`

---

#### 15. 📄 `document_templates` - Document Templates

Templates for NOC, certificates, and other documents.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Template ID |
| `template_type` | VARCHAR(50) | ❌ | NOC, MEMBERSHIP_CERT, etc. |
| `title` | VARCHAR(200) | ❌ | Template name |
| `content` | TEXT | ✅ | Template body with placeholders |
| `is_active` | BOOLEAN | ❌ | Active status |
| `created_at` | TIMESTAMP | ❌ | Created date |
| `updated_at` | TIMESTAMP | ✅ | Last modified |

**No Foreign Keys** - Global templates

---

#### 16. 🖼️ `banners` - Promotional Banners

Display banners for announcements and promotions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Banner ID |
| `society_id` | INT | ✅ FK | Target society (NULL = all) |
| `title` | VARCHAR(200) | ❌ | Banner title |
| `image_url` | VARCHAR(500) | ✅ | Image location |
| `redirect_url` | VARCHAR(500) | ✅ | Click destination |
| `start_date` | DATE | ✅ | Display start |
| `end_date` | DATE | ✅ | Display end |
| `display_order` | INT | ❌ | Sort priority |
| `is_active` | BOOLEAN | ❌ | Active flag |
| `created_at` | TIMESTAMP | ❌ | Created date |

**Foreign Keys:**
- `society_id` → `societies(id)` (nullable for global banners)

---

#### 17. 🔔 `notification_preferences` - Email Preferences

User preferences for email notifications.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | SERIAL | ❌ PK | Preference ID |
| `user_id` | INT | ❌ FK UNIQUE | One preference per user |
| `email_tickets` | BOOLEAN | ❌ | Receive ticket emails |
| `email_complaints` | BOOLEAN | ❌ | Receive complaint emails |
| `email_payments` | BOOLEAN | ❌ | Receive payment emails |
| `email_contracts` | BOOLEAN | ❌ | Receive contract emails |

**Foreign Keys:**
- `user_id` → `users(id)` - Links to user

---

## 🔗 Foreign Key Relationship Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    FOREIGN KEY RELATIONSHIPS                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  societies (1) ◄──────────┬─────────────► (N) users            │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) flats            │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) notices          │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) tickets          │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) transactions     │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) vendors          │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) vendor_bills     │
│                           │                                     │
│  societies (1) ◄──────────┼─────────────► (N) contracts        │
│                           │                                     │
│  societies (1) ◄──────────┴─────────────► (N) emergency_contacts│
│                                                                 │
│  flats (1) ◄─────────────────────────────► (N) tenants         │
│                                                                 │
│  flats (1) ◄─────────────────────────────► (N) vehicles        │
│                                                                 │
│  flats (1) ◄─────────────────────────────► (N) maintenance_bills│
│                                                                 │
│  users (1) ◄─────────────────────────────► (N) tickets (raised)│
│                                                                 │
│  users (1) ◄─────────────────────────────► (N) tickets (assign)│
│                                                                 │
│  users (1) ◄─────────────────────────────► (N) complaints      │
│                                                                 │
│  users (1) ◄─────────────────────────────► (1) notification_pref│
│                                                                 │
│  vendors (1) ◄───────────────────────────► (N) vendor_bills    │
│                                                                 │
│  vendors (1) ◄───────────────────────────► (N) contracts       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

### Base URL
```
Development: http://localhost:8080
Production: https://api.yourdomain.com
```

### Authentication
All endpoints (except `/auth/login`) require JWT token:
```
Authorization: Bearer <token>
```

### Main Endpoints

| Module | Endpoints | Methods |
|--------|-----------|---------|
| Auth | `/auth/login`, `/auth/register` | POST |
| Users | `/users`, `/users/{id}` | GET, POST, PUT, DELETE |
| Societies | `/societies`, `/societies/{id}` | GET, POST, PUT, DELETE |
| Flats | `/flats`, `/flats/{id}`, `/flats/society/{id}` | GET, POST, PUT, DELETE |
| Tenants | `/tenants`, `/tenants/flat/{flatId}` | GET, POST, PUT, DELETE |
| Vehicles | `/vehicles`, `/vehicles/flat/{flatId}` | GET, POST, PUT, DELETE |
| Vendors | `/vendors`, `/vendors/society/{id}` | GET, POST, PUT, DELETE |
| Vendor Bills | `/vendor-bills`, `/vendor-bills/{id}/payment` | GET, POST, PUT, DELETE, POST |
| Contracts | `/contracts`, `/contracts/expiring/{societyId}` | GET, POST, PUT, DELETE |
| Maintenance Bills | `/maintenance-bills`, `/maintenance-bills/generate` | GET, POST, PUT, DELETE |
| Transactions | `/transactions`, `/transactions/society/{id}/summary` | GET, POST, PUT, DELETE |
| Notices | `/notices`, `/notices/society/{id}` | GET, POST, PUT, DELETE |
| Banners | `/banners`, `/banners/active` | GET, POST, PUT, DELETE |
| Tickets | `/tickets`, `/tickets/{id}/status`, `/tickets/{id}/progress` | GET, POST, PUT, PATCH, DELETE |
| Complaints | `/complaints`, `/complaints/{id}/status` | GET, POST, PATCH, DELETE |
| Emergency | `/emergency-contacts`, `/emergency-contacts/society/{id}` | GET, POST, PUT, DELETE |
| Documents | `/document-templates`, `/document-templates/type/{type}` | GET, POST, PUT, DELETE |
| Reports | `/api/reports/mtd/{societyId}`, `/api/reports/ytd/{societyId}` | GET |
| Export | `/api/export/transactions/{societyId}`, `/api/export/tickets/{societyId}` | GET (blob) |

---

## 🚀 Scalability Features

### Current Architecture Benefits

| Feature | Implementation | Future Enhancement |
|---------|---------------|-------------------|
| **Modular Design** | Separate controllers/services per module | Extract to microservices |
| **Role-Based Access** | Centralized in `RolePermissions.java` | Add ABAC (Attribute-Based) |
| **DTO Pattern** | Separates API from entities | Add API versioning |
| **Repository Pattern** | JPA abstraction | Add Redis caching |
| **Scheduled Tasks** | Spring `@Scheduled` | Add job queue (Quartz) |
| **Excel Export** | Apache POI | Add async generation |

### Recommended Future Improvements

1. **Caching**: Redis for frequently accessed data (societies, flats)
2. **Message Queue**: RabbitMQ/Kafka for notifications
3. **File Storage**: AWS S3 for documents and images
4. **Search**: Elasticsearch for full-text search
5. **Monitoring**: Prometheus + Grafana
6. **API Gateway**: Rate limiting, request validation
7. **Microservices**: Split into auth, billing, tickets services

---

## 📞 Support

For issues or questions:
- 📧 Email: support@societymanagement.com
- 📖 Documentation: `/docs` folder
- 🐛 Bug Reports: GitHub Issues

---

<div align="center">

**Built with ❤️ using Spring Boot + React + PostgreSQL**

</div>
