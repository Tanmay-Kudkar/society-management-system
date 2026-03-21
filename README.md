<div align="center">

# 🏘️ Society Management System

### *A Multi-Tenant Housing Society Administration Platform*

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.10-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Web_|_Mobile-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-Monorepo-orange?style=flat-square)
![RBAC](https://img.shields.io/badge/RBAC-12_Roles-purple?style=flat-square)

*End-to-end management platform for residential housing societies — finances, residents, vendors, security, and more.*

</div>

---

## 📋 Table of Contents

1. [🔭 Overview](#-overview)
2. [🛠️ Tech Stack](#️-tech-stack)
3. [👥 Role Hierarchy](#-role-hierarchy)
4. [✨ Features](#-features)
5. [📂 Project Structure](#-project-structure)
6. [🚀 Getting Started](#-getting-started)
7. [🌍 Environment Variables](#-environment-variables)
8. [☁️ Deployment](#️-deployment)
9. [🤝 Contributing](#-contributing)
10. [📄 License](#-license)

---

## 🔭 Overview

| Category | Details |
|----------|---------|
| **Purpose** | End-to-end management platform for residential housing societies |
| **Admin Web** | React 19 SPA with Vite — dashboards, finance, RBAC, bulk operations |
| **Mobile Apps** | Native Android (Kotlin) + iOS (Swift) apps for residents |
| **Backend** | Spring Boot 3.5 REST API — JWT auth, RBAC, email, Razorpay |
| **Database** | PostgreSQL 16 with 46 relational tables |
| **Roles** | 12-role RBAC hierarchy (Master Admin → Visitor) |
| **Payments** | Razorpay payment gateway integration (INR) |
| **Notifications** | Email via Gmail SMTP |
| **Bulk Operations** | Excel import/export for users, flats, wings, vendors, tenants, vehicles |
| **Deployment** | Render Blueprint — backend + static frontend + managed PostgreSQL |

---

## 🛠️ Tech Stack

### 🖥️ Frontend (Admin Web Panel)

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | `19.2.0` | UI component library |
| Vite | `7.2.4` | Build tool & dev server |
| React Router | `7.13.0` | Client-side routing with lazy loading |
| TanStack Query | `5.90.20` | Server state management & caching |
| Axios | `1.13.3` | HTTP client with JWT interceptors |
| Recharts | `3.7.0` | Dashboard charts and graphs |
| Lucide React | `0.563.0` | Icon library |
| SheetJS (xlsx) | `0.18.5` | Excel file parsing for bulk imports |
| Tailwind CSS | `3.4.17` | Utility-first CSS framework |
| clsx | `2.1.1` | Conditional className utility |

### ⚙️ Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | `21` | Language runtime (LTS) |
| Spring Boot | `3.5.10` | Application framework |
| Spring Security | `6.x` | Authentication & authorization |
| Spring Data JPA | `3.5.x` | ORM & repository pattern |
| PostgreSQL Driver | `42.x` | JDBC driver |
| JWT (jjwt) | `0.12.5` | Token creation & validation |
| Apache POI | `5.2.5` | Excel export |
| Razorpay Java SDK | `1.4.6` | Payment gateway |
| Lombok | `1.18.32` | Boilerplate reduction |
| Spring Mail | `3.5.x` | SMTP email service |
| Spring Actuator | `3.5.x` | Health checks |
| Maven | `3.9.x` | Build & dependency management |

### 📱 Mobile Apps

| Technology | Platform | Purpose |
|-----------|---------|---------|
| Kotlin / Jetpack Compose | Android | Native Android app |
| Swift / SwiftUI | iOS | Native iOS app |

### 🗄️ Infrastructure

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary relational database |
| Render (Blueprint) | Cloud hosting — backend, static frontend, managed DB |

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
- JWT-based login with optional "Remember Me"
- Email-based forgot / reset password flow
- Role-based access control enforced on every API endpoint
- Society-scoped data isolation via backend interceptors

### 🏢 Society & Unit Management
- Multi-society support under a single platform
- Wing / building management with bulk import
- Flat management (CRUD + bulk import/export)
- Tenant registry with lease tracking
- Vehicle registration & parking management

### 👤 User Management
- Full user CRUD with role assignment
- Bulk user creation for all units in a society
- Excel bulk import / export with template download
- Creatable/updatable role enforcement per caller's own role

### 💰 Finance
- Maintenance bill generation with line items
- Bill payment recording & Razorpay online payment
- Vendor bill tracking with payment status
- Contract lifecycle management
- Income/expense transaction ledger
- Financial reports: MTD, YTD, custom range, category breakdown
- Excel export for transactions, bills, and financial reports

### 🏪 Vendor Management
- Vendor directory with approval workflow (pending → approved / rejected)
- Vendor profile linked to login-capable `VENDOR` role
- Vendor bill submission and payment tracking

### 📣 Communication
- Society notice board (CRUD, active/inactive)
- Banner management (image banners)
- Support ticket system with status workflow and assignment
- Complaint management with resolution tracking
- Emergency contact directory
- Document template generator

### 🛡️ Security & Access
- Visitor pre-approval and gate log tracking
- Domestic staff management with attendance and shift scheduling
- Guard patrol checkpoints and patrol logs
- Safety alerts and SOS log management
- Vehicle access tracking

### 🔧 Operations & Maintenance
- Work order creation and assignment
- Asset registry with maintenance tracking
- Common area schedule management
- Facility booking system
- Renovation NOC requests
- Staff shift management

### 🏠 Resident Services
- Move-in / move-out tracking
- Penalty management
- Pet registration
- Classifieds board
- Society rules / bylaws

### 📊 Dashboard & Analytics
- Role-specific dashboards with statistics and charts
- Financial comparison reports
- Backend health status monitoring

---

## 📂 Project Structure

```
society-management-system/          ← Monorepo root
├── frontend/                       ← React SPA (admin web panel)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── public/                     ← Static assets
│   └── src/
│       ├── App.jsx                 ← Root component (routing + auth)
│       ├── main.jsx                ← React DOM entry point
│       ├── assets/icons/           ← SVG icon assets
│       ├── components/             ← Shared UI components
│       │   ├── Layout.jsx
│       │   ├── AsyncButton.jsx
│       │   ├── BulkImportModal.jsx
│       │   ├── FormComponents.jsx
│       │   ├── PageShell.jsx
│       │   ├── PermissionDenied.jsx
│       │   ├── SkeletonLoaders.jsx
│       │   └── Toggle.jsx
│       ├── context/                ← React context providers
│       │   ├── AuthContext.jsx
│       │   ├── ThemeContext.jsx
│       │   ├── ToastContext.jsx
│       │   ├── SettingsContext.jsx
│       │   └── ConfirmDialogContext.jsx
│       ├── hooks/                  ← Custom React hooks
│       │   ├── useBackendStatus.js
│       │   ├── useMinLoadingTime.js
│       │   └── useRazorpay.js
│       ├── pages/                  ← Lazy-loaded page components
│       │   ├── auth/               ← Welcome, Login, ForgotPassword, ResetPassword
│       │   ├── core/               ← Dashboard, Settings, Reports, Assets, WorkOrders,
│       │   │                          CommonAreas, StaffShifts, FacilityBooking,
│       │   │                          RenovationNocs, MoveTracking, Penalties,
│       │   │                          PetRegistrations, Classifieds, SocietyRules
│       │   ├── users/              ← Users, RolesPermissions
│       │   ├── society/            ← SocietyAdmins
│       │   ├── unit/               ← UnitManagement, Wings, Tenants, Vehicles
│       │   ├── finance/            ← VendorBills, Contracts, MaintenanceBills,
│       │   │                          Transactions, Payments, MyBills, SocietySettings
│       │   ├── communication/      ← Notices, Banners, Tickets, Complaints,
│       │   │                          EmergencyContacts, Documents, Approvals
│       │   ├── vendors/            ← Vendors
│       │   ├── security/           ← Visitors, DomesticStaff, Safety, GuardPatrol
│       │   └── footer/             ← About, Privacy, Terms, Contact, Pricing, Blog, Demo, Help
│       ├── styles/                 ← CSS architecture (global.css + component styles)
│       └── utils/                  ← Utilities (validation, formatUtils, deviceDetect)
│
├── backend/                        ← Spring Boot REST API
│   ├── pom.xml
│   ├── Dockerfile
│   ├── ENV_SETUP.md
│   └── src/main/java/com/society/backend/
│       ├── auth/                   ← AuthController, JWT filter, auth services
│       ├── user/                   ← UserController, Role enum, User entity
│       ├── society/                ← SocietyController, AssetController,
│       │                              DocumentTemplateController, SocietyRuleController,
│       │                              SocietySettingController
│       ├── flat/                   ← FlatController, WingController, TenantController,
│       │                              VehicleController, MoveRecordController,
│       │                              PetRegistrationController, RenovationNocController,
│       │                              FacilityBookingController, CommonAreaScheduleController
│       ├── finance/                ← MaintenanceBillController, TransactionController,
│       │                              PaymentController, ReportController, PenaltyController
│       ├── vendor/                 ← VendorController, VendorBillController,
│       │                              ContractController, DomesticStaffController,
│       │                              StaffShiftController
│       ├── ticket/                 ← TicketController, ComplaintController,
│       │                              ApprovalController, EmergencyContactController,
│       │                              WorkOrderController
│       ├── security/               ← VisitorController, VehicleController,
│       │                              SecurityLogController, PatrolController, SafetyController
│       ├── notification/           ← Notification preferences service
│       ├── enquiry/                ← Public enquiry endpoint
│       ├── common/                 ← Config (CORS, Security, Razorpay, Scheduler),
│       │                              DataInitializer, interceptors
│       └── infrastructure/         ← Scheduled tasks
│
├── api/                            ← Shared Axios API layer (consumed by frontend)
│   └── index.js
│
├── android-app/                    ← Native Android app (Kotlin / Jetpack Compose)
│   ├── app/
│   ├── build.gradle.kts
│   └── settings.gradle.kts
│
├── ios-app/                        ← Native iOS app (Swift / SwiftUI)
│   ├── SocietyManager/
│   └── SocietyManager.xcodeproj/
│
├── database/
│   └── schema.sql                  ← Full PostgreSQL schema (46 tables)
│
├── Documents/                      ← Supplementary documentation
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md
│   ├── SETUP.md
│   ├── TESTING.md
│   └── TROUBLESHOOTING.md
│
└── render.yaml                     ← Render deployment blueprint
```

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
