<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.5.10-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java"/>
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1.18-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Latest-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Axios-1.13.3-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios"/>
  <img src="https://img.shields.io/badge/React_Query-5.90.20-FF4154?style=for-the-badge&logo=react-query&logoColor=white" alt="React Query"/>
  <img src="https://img.shields.io/badge/React_Router-7.13.0-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router"/>
  <img src="https://img.shields.io/badge/JWT-0.12.5-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Apache_POI-5.2.5-A22846?style=for-the-badge&logo=apache&logoColor=white" alt="Apache POI"/>
  <img src="https://img.shields.io/badge/Lucide_React-0.563.0-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License"/>
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-green?style=for-the-badge" alt="Platform"/>
</p>

---

<h1 align="center">🏢 Society Management System</h1>

<p align="center">
  <strong>A comprehensive full-stack platform for managing residential housing societies with role-based access control, financial tracking, communication tools, and cross-platform mobile app support.</strong>
</p>

---

## 📑 Table of Contents

1. [System Overview](#-system-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture](#-architecture)
4. [Role-Based Access Control](#-role-based-access-control)
5. [Frontend - Admin Web Portal](#-frontend---admin-web-portal)
6. [Mobile Application](#-mobile-application)
7. [Backend API](#-backend-api)
8. [Database Schema](#-database-schema)
9. [API Reference](#-api-reference)
10. [Features & Capabilities](#-features--capabilities)
11. [Getting Started](#-getting-started)
12. [Project Structure](#-project-structure)

---

## 🌟 System Overview

The **Society Management System** is an enterprise-grade, full-stack web and mobile application designed to streamline the administration of residential housing societies. Built with modern technologies and following best practices, it provides a complete suite of tools for:

| Category | Features |
|----------|----------|
| 👥 **User Management** | 10-tier role hierarchy, bulk import/export, role-based permissions |
| 🏠 **Property Management** | Units (Flats/Shops/Offices), wings, tenants, vehicle registration |
| 💰 **Financial Management** | Maintenance bills, vendor payments, transactions, income/expense tracking |
| 📢 **Communication** | Notices, banners, tickets, complaints, emergency contacts |
| 📊 **Reporting** | MTD/YTD financial reports, Excel export, dashboard analytics |
| 🔐 **Security** | JWT authentication with HTTP-only cookies, role-based permissions |
| 📱 **Mobile App** | Cross-platform React Native app for iOS & Android |
| 📦 **Bulk Operations** | Import/export for users and units via Excel templates |

---

## 💻 Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Spring Boot** | 3.5.10 | Main application framework |
| **Java** | 21 (LTS) | Programming language |
| **Spring Security** | 6.x | Authentication & authorization |
| **Spring Data JPA** | 3.x | Database ORM & repositories |
| **PostgreSQL** | Latest | Relational database |
| **JWT (jjwt)** | 0.12.5 | Token-based authentication |
| **Lombok** | 1.18.32 | Boilerplate code reduction |
| **Apache POI** | 5.2.5 | Excel file generation/parsing |
| **Spring Mail** | 3.x | Email notifications |
| **Jakarta Validation** | 3.x | Input validation |

### Frontend Technologies (Admin Web)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI library |
| **Vite** | 7.2.4 | Build tool & dev server |
| **Tailwind CSS** | 4.1.18 | Utility-first CSS framework |
| **React Router** | 7.13.0 | Client-side routing |
| **TanStack React Query** | 5.90.20 | Server state management |
| **Axios** | 1.13.3 | HTTP client |
| **Lucide React** | 0.563.0 | Icon library |
| **clsx** | 2.1.1 | Conditional classnames |

### Mobile Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | 54.0.32 | Development platform |
| **React Navigation** | 7.x | Navigation library |
| **Expo Notifications** | 0.32.16 | Push notifications |
| **Expo Secure Store** | 15.0.8 | Secure storage |
| **React Native Reanimated** | 4.1.1 | Animations |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├────────────────────────────────┬────────────────────────────────────────────┤
│     Admin Web (React 19)       │         Mobile App (React Native)          │
│        Port: 5173              │            Expo SDK 54                      │
│   Vite 7.2.4 + Tailwind CSS    │       iOS + Android Support                │
│   TanStack Query + Axios       │     React Navigation + Axios               │
└────────────────────────────────┴────────────────────────────────────────────┘
                                        │
                                        ▼ HTTP/REST + JWT
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│                     Spring Boot 3.5.10 Backend                               │
│                           Port: 8080                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Controllers │  │   Security   │  │   Services   │  │  Schedulers  │    │
│  │   22+ REST   │  │  JWT + RBAC  │  │   Business   │  │   Cron Jobs  │    │
│  │  Endpoints   │  │   Filters    │  │    Logic     │  │   Reminders  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │     DTOs     │  │   Entities   │  │ Repositories │  │  Exceptions  │    │
│  │  Data Xfer   │  │  JPA Models  │  │  Data Access │  │   Handlers   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ JPA/Hibernate
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
│                      PostgreSQL Database                                     │
│                          Port: 5432                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  20 Tables: users, societies, flats, wings, tenants, vehicles,      │    │
│  │  vendors, vendor_bills, contracts, maintenance_bills, transactions, │    │
│  │  tickets, complaints, notices, banners, emergency_contacts,         │    │
│  │  document_templates, notification_preferences, security_logs        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 👑 Role-Based Access Control

The system implements a **10-tier role hierarchy** based on real housing society governance structure:

### 🏛️ Role Hierarchy

```
                         ╔═══════════════════════╗
                         ║   PLATFORM_OWNER      ║  ← Platform Super Admin
                         ║  (Platform Owner)     ║
                         ╚═══════════╤═══════════╝
                                     │
                         ╔═══════════╧═══════════╗
                         ║    SOCIETY_ADMIN      ║  ← Society Super Admin
                         ║  (Society Manager)    ║    Full CRUD on all below
                         ╚═══════════╤═══════════╝
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ╔═════════╧═════════╗  ╔════════╧════════╗  ╔═════════╧═════════╗
    ║     CHAIRMAN      ║  ║    SECRETARY    ║  ║    TREASURER      ║
    ║ (Meeting Chair)   ║  ║ (Admin Head)    ║  ║ (Finance Head)    ║
    ╚═════════╤═════════╝  ╚════════╤════════╝  ╚═════════╤═════════╝
              └──────────────────────┼──────────────────────┘
                         ╔═══════════╧═══════════╗
                         ║      COMMITTEE        ║  ← Committee Members
                         ╚═══════════╤═══════════╝
              ┌──────────────────────┴──────────────────────┐
              │                                             │
    ╔═════════╧═════════╗                         ╔═════════╧═════════╗
    ║     EMPLOYEE      ║                         ║      MEMBER       ║
    ║   (Staff/Guard)   ║                         ║   (Flat Owner)    ║
    ╚═════════╤═════════╝                         ╚═════════╤═════════╝
              │                                             │
    ╔═════════╧═════════╗                         ╔═════════╧═════════╗
    ║     VISITOR       ║                         ║      TENANT       ║
    ╚═══════════════════╝                         ╚═══════════════════╝
```

### 📋 Role Responsibilities

| Role | Authority | Primary Responsibilities |
|------|-----------|--------------------------|
| **PLATFORM_OWNER** | Platform Owner | Manages all societies and organizations |
| **ORGANIZATION_OWNER** | Organization Owner | Manages multiple societies under an organization |
| **MANAGER** | Operational Manager | Handles day-to-day management tasks |
| **SOCIETY_ADMIN** | Society Super Admin | Full control over society, all CRUD operations |
| **CHAIRMAN** | Highest Committee Authority | Presides meetings, final approval, bank signatory |
| **SECRETARY** | Administrative Head | Documentation, records, day-to-day operations |
| **TREASURER** | Financial Head | Finances, billing, payments, accounts |
| **COMMITTEE** | Committee Member | Intermediate management, assigns tasks |
| **EMPLOYEE** | Staff/Security | Handles visitors, basic operations |
| **MEMBER** | Flat Owner | Views own data, raises tickets/complaints |
| **TENANT** | Renter | Limited access to own profile & bills |
| **VISITOR** | Guest | Minimal access, read-only |

### 🔐 Permission Matrix

| Role | Can CREATE | Can UPDATE/DELETE | Can READ |
|------|------------|-------------------|----------|
| `PLATFORM_OWNER` | ORGANIZATION_OWNER, SOCIETY_ADMIN | ORGANIZATION_OWNER, SOCIETY_ADMIN | ALL roles |
| `ORGANIZATION_OWNER` | SOCIETY_ADMIN in own org | SOCIETY_ADMIN in own org | Own org roles |
| `SOCIETY_ADMIN` | ALL below (full access) | ALL below (full access) | ALL in society |
| `CHAIRMAN` | SECRETARY, TREASURER | SECRETARY, TREASURER | All below |
| `SECRETARY` | COMMITTEE only | COMMITTEE only | COMMITTEE and below |
| `TREASURER` | COMMITTEE only | COMMITTEE only | COMMITTEE and below |
| `COMMITTEE` | EMPLOYEE, MEMBER | EMPLOYEE, MEMBER | EMPLOYEE, MEMBER, below |
| `EMPLOYEE` | VISITOR only | VISITOR only | VISITOR |
| `MEMBER` | TENANT only | TENANT only | TENANT |
| `TENANT` | ❌ None | ❌ None | Own profile only |
| `VISITOR` | ❌ None | ❌ None | Own profile only |

### 🔑 Access Control Rules

1. **Parent creates DIRECT CHILDREN only** - No skip-level creation
2. **Read access flows DOWNWARD** - Parents can read all descendants
3. **Update/Delete LIMITED to direct children** - No skip-level modification
4. **Grandchildren = READ-ONLY** - Can view but not modify
5. **EXCEPTION: SOCIETY_ADMIN** - Has full CRUD on all roles below

---

## 🎨 Frontend - Admin Web Portal

### 📁 Directory Structure

```
admin-web/
├── 📄 index.html                 # HTML entry point
├── 📄 package.json               # Dependencies (React 19, Vite 7, Tailwind 4)
├── 📄 vite.config.js             # Vite configuration with API proxy
├── 📄 eslint.config.js           # ESLint flat config
└── 📁 src/
    ├── 📄 main.jsx               # App bootstrap with providers
    ├── 📄 App.jsx                # Route definitions & protected routes
    ├── 📄 App.css                # Global styles
    ├── 📄 index.css              # Tailwind imports
    ├── 📁 api/
    │   └── 📄 index.js           # Centralized API layer (Axios)
    ├── 📁 components/
    │   ├── 📄 Layout.jsx         # Main layout with responsive sidebar
    │   ├── 📄 Toggle.jsx         # Toggle switch component
    │   └── 📄 FormComponents.jsx # Reusable form inputs
    ├── 📁 context/
    │   ├── 📄 AuthContext.jsx    # Authentication state & methods
    │   ├── 📄 SettingsContext.jsx # App settings (theme, preferences)
    │   ├── 📄 ThemeContext.jsx   # Dark/Light mode management
    │   └── 📄 ToastContext.jsx   # Toast notification system
    ├── 📁 pages/                  # 24 page components
    │   ├── 📄 Login.jsx          # Authentication page
    │   ├── 📄 Welcome.jsx        # Landing page
    │   ├── 📄 Dashboard.jsx      # Main dashboard with analytics
    │   ├── 📄 Users.jsx          # User management CRUD
    │   ├── 📄 Societies.jsx      # Society management
    │   ├── 📄 SocietyDetail.jsx  # Individual society view
    │   ├── 📄 Flats.jsx          # Unit/Flat management
    │   ├── 📄 Wings.jsx          # Wing/Tower management
    │   ├── 📄 UnitManagement.jsx # Combined unit operations
    │   ├── 📄 Tenants.jsx        # Tenant record management
    │   ├── 📄 Vehicles.jsx       # Vehicle registration
    │   ├── 📄 Vendors.jsx        # Vendor/Service provider management
    │   ├── 📄 VendorBills.jsx    # Vendor bill tracking
    │   ├── 📄 Contracts.jsx      # AMC/Contract management
    │   ├── 📄 MaintenanceBills.jsx # Maintenance billing
    │   ├── 📄 Transactions.jsx   # Income/Expense tracking
    │   ├── 📄 Reports.jsx        # Financial reports (MTD/YTD)
    │   ├── 📄 Tickets.jsx        # Issue/Request ticketing
    │   ├── 📄 Complaints.jsx     # Complaint management
    │   ├── 📄 Notices.jsx        # Notice board
    │   ├── 📄 Banners.jsx        # Banner management
    │   ├── 📄 EmergencyContacts.jsx # Emergency contacts
    │   ├── 📄 Documents.jsx      # Document templates
    │   ├── 📄 Settings.jsx       # User preferences
    │   └── 📁 footer/            # Static pages (About, Terms, Privacy)
    ├── 📁 styles/                # CSS modules & component styles
    └── 📁 utils/
        └── 📄 validation.js      # Input validation utilities
```

### 🔧 Key Features

#### API Layer (`api/index.js`)

```javascript
// Axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // HTTP-only cookie support
})

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 auto-logout
api.interceptors.response.use(response => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.clear()
    window.location.href = '/login'
  }
  return Promise.reject(error)
})
```

#### API Modules Available

| Module | Endpoints | Features |
|--------|-----------|----------|
| `authApi` | login, register, logout, me | JWT authentication |
| `societyApi` | CRUD operations | Society management |
| `userApi` | CRUD + bulk import/export | User management with templates |
| `flatApi` | CRUD + bulk import/export | Unit management |
| `wingApi` | CRUD by society | Wing/Tower management |
| `vendorApi` | CRUD + approve/reject | Vendor approval workflow |
| `vendorBillApi` | CRUD + recordPayment | Partial payment support |
| `contractApi` | CRUD + getExpiringSoon | Contract reminders |
| `maintenanceBillApi` | CRUD + generateForSociety | Bulk bill generation |
| `transactionApi` | CRUD + summaries | Category-wise tracking |
| `ticketApi` | CRUD + status/assign | Issue tracking |
| `complaintApi` | CRUD + updateStatus | Complaint resolution |
| `noticeApi` | CRUD + getActive | Notice board |
| `bannerApi` | CRUD + getActive | Banner rotation |
| `emergencyContactApi` | CRUD by society | Emergency directory |
| `tenantApi` | CRUD + deactivate | Tenant agreements |
| `vehicleApi` | CRUD by flat | Vehicle registry |
| `reportApi` | MTD/YTD/Custom/Dashboard | Financial analytics |
| `exportApi` | Excel downloads | Data export |
| `notificationPreferenceApi` | get/update | User notifications |
| `securityLogApi` | getRecent | Activity logs |

#### Authentication Context

```javascript
// Role checking utilities
const hasRole = (...roles) => roles.includes(user.role)
const isAdminLevel = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN')
const isCommitteeLevel = () => hasRole('PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 
  'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER')
const canManageNotices = () => isCommitteeLevel() || hasRole('EMPLOYEE')
const canViewFinancials = () => isCommitteeLevel()
```

### 🎯 Page Components

| Page | Route | Features |
|------|-------|----------|
| **Dashboard** | `/dashboard` | Stats cards, MTD/YTD graphs, recent activities, quick actions |
| **Users** | `/users` | CRUD with role-based creation, bulk import/export, society filter |
| **Societies** | `/societies` | Full society management (PLATFORM_OWNER / ORGANIZATION_OWNER) |
| **Flats** | `/units` | Unit management with bulk operations, wing organization |
| **Wings** | `/wings` | Tower/Building management |
| **Tenants** | `/tenants` | Agreement tracking, rent details, ID proof |
| **Vehicles** | `/vehicles` | Vehicle registration with parking slots |
| **Vendors** | `/vendors` | Vendor approval workflow, banking details |
| **VendorBills** | `/vendor-bills` | Bill tracking, partial payments |
| **Contracts** | `/contracts` | AMC management, expiry reminders |
| **MaintenanceBills** | `/maintenance-bills` | Bulk generation, payment recording |
| **Transactions** | `/transactions` | Income/Expense with categories, Excel export |
| **Reports** | `/reports` | MTD/YTD comparison, charts, Excel export |
| **Tickets** | `/tickets` | Issue tracking with assignment, priority |
| **Complaints** | `/complaints` | Complaint workflow with resolution |
| **Notices** | `/notices` | Notice board with priority, expiry |
| **Banners** | `/banners` | Banner rotation management |
| **Emergency** | `/emergency-contacts` | Emergency directory |
| **Documents** | `/documents` | Document template management |
| **Settings** | `/settings` | User preferences, notifications |

---

## 📱 Mobile Application

### 📁 Directory Structure

```
mobile-app/
├── 📄 App.js                     # App entry with navigation
├── 📄 app.json                   # Expo configuration
├── 📄 babel.config.js            # Babel with Expo preset
├── 📄 package.json               # Dependencies (Expo 54, RN 0.81)
└── 📁 src/
    ├── 📁 components/
    │   └── 📁 common/            # Reusable UI components
    │       ├── 📄 Avatar.js      # User avatars
    │       ├── 📄 Badge.js       # Status badges
    │       ├── 📄 Button.js      # Styled buttons
    │       ├── 📄 Card.js        # Card containers
    │       ├── 📄 EmptyState.js  # Empty list states
    │       ├── 📄 ErrorState.js  # Error displays
    │       ├── 📄 Header.js      # Screen headers
    │       ├── 📄 Input.js       # Form inputs
    │       ├── 📄 ListItem.js    # List items
    │       ├── 📄 Loading.js     # Loading indicators
    │       └── 📄 index.js       # Component exports
    ├── 📁 constants/
    │   ├── 📄 Colors.js          # Color palette & themes
    │   ├── 📄 Layout.js          # Responsive scaling
    │   └── 📄 index.js           # API config, storage keys, enums
    ├── 📁 context/
    │   ├── 📄 AuthContext.js     # Authentication state
    │   ├── 📄 NotificationContext.js # Push notifications
    │   └── 📄 ThemeContext.js    # Dark/Light mode
    ├── 📁 navigation/
    │   └── 📄 AppNavigator.js    # Stack & Tab navigation
    ├── 📁 screens/
    │   ├── 📄 SplashScreen.js    # Animated splash
    │   ├── 📄 index.js           # Screen exports
    │   ├── 📁 auth/
    │   │   ├── 📄 LoginScreen.js
    │   │   └── 📄 OTPVerificationScreen.js
    │   ├── 📁 dashboard/
    │   │   ├── 📄 AdminDashboard.js
    │   │   ├── 📄 MemberDashboard.js
    │   │   └── 📄 StaffDashboard.js
    │   ├── 📁 complaints/
    │   │   └── 📄 ComplaintsScreen.js
    │   ├── 📁 notices/
    │   │   └── 📄 NoticesScreen.js
    │   ├── 📁 notifications/
    │   │   └── 📄 NotificationsScreen.js
    │   ├── 📁 payments/
    │   │   └── 📄 PaymentHistoryScreen.js
    │   ├── 📁 profile/
    │   │   └── 📄 ProfileScreen.js
    │   ├── 📁 settings/
    │   │   └── 📄 SettingsScreen.js
    │   ├── 📁 visitors/
    │   │   └── 📄 VisitorsScreen.js
    │   ├── 📁 vehicles/
    │   ├── 📁 maintenance/
    │   ├── 📁 documents/
    │   └── 📁 emergency/
    └── 📁 services/
        └── 📄 api.js             # API service layer
```

### 🔧 Key Features

| Feature | Description |
|---------|-------------|
| **Cross-Platform** | Single codebase for iOS & Android |
| **Role-Based Dashboards** | Admin, Member, Staff specific views |
| **Push Notifications** | Expo Notifications integration |
| **Secure Storage** | expo-secure-store for tokens |
| **Theme Support** | Light/Dark mode with system preference |
| **Responsive Design** | Device-aware scaling utilities |
| **Animated Splash** | Linear gradient animated splash screen |

### 📱 Screen Components

| Screen Category | Screens | Features |
|-----------------|---------|----------|
| **Auth** | Login, OTP Verification | Secure authentication flow |
| **Dashboard** | Admin, Member, Staff | Role-specific home screens |
| **Complaints** | List, Create, Detail | Complaint management |
| **Notices** | List, Detail | Society announcements |
| **Payments** | History, Pay | Maintenance bill payments |
| **Profile** | View, Edit | User profile management |
| **Settings** | Preferences | Notification & app settings |
| **Visitors** | Log | Visitor entry management |

---

## ⚙️ Backend API

### 📁 Directory Structure

```
backend/
├── 📄 pom.xml                    # Maven dependencies
├── 📄 mvnw / mvnw.cmd            # Maven wrapper
└── 📁 src/
    ├── 📁 main/
    │   ├── 📁 java/com/society/backend/
    │   │   ├── 📄 BackendApplication.java    # Spring Boot main
    │   │   ├── 📄 PasswordHasher.java        # CLI utility
    │   │   ├── 📁 config/                    # Configuration
    │   │   │   ├── 📄 CorsConfig.java
    │   │   │   ├── 📄 DataInitializer.java
    │   │   │   ├── 📄 PasswordConfig.java
    │   │   │   ├── 📄 SchedulerConfig.java
    │   │   │   └── 📄 SecurityConfig.java
    │   │   ├── 📁 security/                  # JWT & Auth
    │   │   │   ├── 📄 JwtUtils.java
    │   │   │   ├── 📄 JwtAuthenticationFilter.java
    │   │   │   ├── 📄 JwtAuthenticationEntryPoint.java
    │   │   │   ├── 📄 CustomUserDetails.java
    │   │   │   ├── 📄 CustomUserDetailsService.java
    │   │   │   └── 📄 RolePermissions.java
    │   │   ├── 📁 entity/                    # JPA Entities (20)
    │   │   ├── 📁 dto/                       # Data Transfer Objects
    │   │   ├── 📁 repository/                # JPA Repositories
    │   │   ├── 📁 service/                   # Business Logic
    │   │   ├── 📁 controller/                # REST Controllers (22+)
    │   │   ├── 📁 scheduler/                 # Scheduled Tasks
    │   │   └── 📁 exception/                 # Exception Handlers
    │   └── 📁 resources/
    │       └── 📄 application.properties
    └── 📁 test/                              # Unit tests
```

### 🔧 Configuration Classes

| Class | Purpose |
|-------|---------|
| `SecurityConfig.java` | Spring Security with JWT filter chain, endpoint protection |
| `CorsConfig.java` | CORS for frontend (port 5173) & mobile |
| `DataInitializer.java` | Creates PLATFORM_OWNER on first run |
| `PasswordConfig.java` | BCrypt password encoder bean |
| `SchedulerConfig.java` | Enables `@Scheduled` annotations |

### 🔐 Security Classes

| Class | Purpose |
|-------|---------|
| `JwtUtils.java` | JWT token generation & validation |
| `JwtAuthenticationFilter.java` | Request filter for JWT extraction |
| `JwtAuthenticationEntryPoint.java` | 401 error handler |
| `CustomUserDetails.java` | UserDetails implementation |
| `CustomUserDetailsService.java` | UserDetailsService for auth |
| `RolePermissions.java` | Role hierarchy & permission logic |

### 📦 Entity Classes

| Entity | Table | Key Fields |
|--------|-------|------------|
| `User` | users | id, name, email, password, phone, role, societyId, isActive |
| `Society` | societies | id, name, address, city, state, pincode, registrationNumber |
| `Flat` | flats | id, flatNumber, flatType, floor, area, ownerName, wingId |
| `Wing` | wings | id, name, societyId, description |
| `Tenant` | tenants | id, flatId, name, agreementStart/End, rentAmount |
| `Vehicle` | vehicles | id, flatId, vehicleNumber, type, brand, model |
| `Vendor` | vendors | id, societyId, name, serviceType, approvalStatus |
| `VendorBill` | vendor_bills | id, vendorId, amount, paidAmount, status |
| `Contract` | contracts | id, vendorId, startDate, endDate, reminderDays |
| `MaintenanceBill` | maintenance_bills | id, flatId, billMonth, amount, paidAmount |
| `Transaction` | transactions | id, societyId, type, category, amount, date |
| `Ticket` | tickets | id, raisedBy, assignedTo, status, priority |
| `Complaint` | complaints | id, userId, title, status, resolution |
| `Notice` | notices | id, societyId, title, content, priority, expiryDate |
| `Banner` | banners | id, societyId, title, imageUrl, startDate, endDate |
| `EmergencyContact` | emergency_contacts | id, societyId, contactType, name, phone |
| `DocumentTemplate` | document_templates | id, templateType, title, content |
| `NotificationPreference` | notification_preferences | id, userId, emailTickets, etc. |
| `SecurityLog` | security_logs | id, societyId, type, event, status |

### 🎯 Controller Packages

| Package | Controllers | Endpoints |
|---------|-------------|-----------|
| `auth/` | AuthController | POST /auth/login, /auth/logout, GET /auth/me |
| `user/` | UserController | CRUD /users, bulk import/export |
| `society/` | SocietyController | CRUD /societies |
| `flat/` | FlatController | CRUD /flats, bulk import/export |
| `wing/` | WingController | CRUD /api/wings |
| `vendor/` | VendorController | CRUD /vendors, approve/reject |
| `vendor/` | VendorBillController | CRUD /vendor-bills, payment |
| `contract/` | ContractController | CRUD /contracts, expiring |
| `maintenance/` | MaintenanceBillController | CRUD, generate for society |
| `transaction/` | TransactionController | CRUD, summaries, date range |
| `ticket/` | TicketController | CRUD, assign, status update |
| `complaint/` | ComplaintController | CRUD, status update |
| `notice/` | NoticeController | CRUD, active notices |
| `banner/` | BannerController | CRUD, active banners |
| `emergency/` | EmergencyContactController | CRUD by society |
| `document/` | DocumentTemplateController | CRUD by type |
| `tenant/` | TenantController | CRUD, deactivate |
| `vehicle/` | VehicleController | CRUD by flat |
| `notification/` | NotificationPreferenceController | get/update |
| `report/` | ReportController | MTD/YTD/Custom/Dashboard |
| `export/` | ExportController | Excel downloads |
| `health/` | HealthController | API health check |
| `-` | SecurityLogController | Recent logs |

### 📊 Service Layer Features

| Service | Key Methods |
|---------|-------------|
| `UserService` | CRUD with role validation, bulk import/export |
| `FlatService` | CRUD with wing association, bulk operations |
| `MaintenanceBillService` | Generate for society, record payments |
| `VendorBillService` | Partial payment tracking |
| `TransactionService` | Category summaries, date range queries |
| `ReportService` | MTD/YTD calculations, dashboard aggregation |
| `ExportService` | Excel generation via Apache POI |
| `TicketService` | Assignment, status workflow |

---

## 🗄️ Database Schema

### Entity Relationship Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  societies  │────<│    users    │     │   vendors   │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                   │                    │
       │            ┌──────┴──────┐            │
       │            │             │            │
       ▼            ▼             ▼            ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    wings    │  │   tickets   │  │    flats    │  │vendor_bills │
└──────┬──────┘  └─────────────┘  └──────┬──────┘  └─────────────┘
       │                                  │
       └──────────────┬───────────────────┤
                      │                   │
              ┌───────┴────────┐   ┌──────┴──────┐
              │                │   │             │
              ▼                ▼   ▼             ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │   tenants   │  │  vehicles   │  │maintenance_ │
       └─────────────┘  └─────────────┘  │   bills     │
                                         └─────────────┘
```

### Table Definitions

#### Core Tables

```sql
-- Users: 10-tier role system
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),          -- BCrypt hashed
    phone VARCHAR(20),
    society_id INT REFERENCES societies(id),
    role VARCHAR(50) CHECK (role IN (
        'PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 
        'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER',
        'EMPLOYEE', 'MEMBER', 'TENANT', 'VISITOR'
    )),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Societies: Housing society details
CREATE TABLE societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    registration_number VARCHAR(50),
    email VARCHAR(100),
    telephone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flats: Units with wing organization
CREATE TABLE flats (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    wing_id INT REFERENCES wings(id),
    flat_number VARCHAR(20),
    flat_type VARCHAR(50),          -- 1BHK, 2BHK, SHOP, OFFICE
    floor INT DEFAULT 0,
    area DECIMAL(10,2),
    owner_name VARCHAR(100),
    owner_email VARCHAR(100),
    owner_phone VARCHAR(20),
    is_occupied BOOLEAN DEFAULT FALSE
);
```

#### Financial Tables

```sql
-- Maintenance Bills: Monthly charges
CREATE TABLE maintenance_bills (
    id SERIAL PRIMARY KEY,
    flat_id INT REFERENCES flats(id),
    bill_month VARCHAR(7),          -- YYYY-MM format
    amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_mode VARCHAR(20),
    receipt_number VARCHAR(50),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Transactions: Income/Expense ledger
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    transaction_type VARCHAR(10),   -- INCOME, EXPENSE
    payment_mode VARCHAR(20),       -- CASH, CHEQUE, ONLINE, UPI
    amount DECIMAL(12,2),
    category VARCHAR(50),
    description TEXT,
    transaction_date DATE,
    reference_number VARCHAR(50),
    cheque_number VARCHAR(30),
    bank_name VARCHAR(100),
    cheque_date DATE,
    related_bill_id INT,
    related_bill_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Communication Tables

```sql
-- Tickets: Issue tracking with assignment
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    raised_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),
    society_id INT REFERENCES societies(id),
    type VARCHAR(20),               -- COMPLAINT, REQUEST, ISSUE
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Notices: Society announcements
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    title VARCHAR(200),
    content TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | Clear session | Yes |
| GET | `/auth/me` | Get current user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | List all accessible users | Yes |
| GET | `/users/{id}` | Get user by ID | Yes |
| GET | `/users/society/{societyId}` | Users by society | Yes |
| POST | `/users` | Create user | Yes |
| PUT | `/users/{id}` | Update user | Yes |
| DELETE | `/users/{id}` | Delete user | Yes |
| GET | `/users/creatable-roles` | Roles current user can create | Yes |
| POST | `/users/bulk-create/{societyId}` | Create users for units | Yes |
| POST | `/users/bulk-import/validate` | Validate import file | Yes |
| POST | `/users/bulk-import` | Process import | Yes |
| GET | `/users/bulk-import/template` | Download template | Yes |

### Financial Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/mtd/{societyId}` | Month-to-date report |
| GET | `/api/reports/ytd/{societyId}` | Year-to-date report |
| GET | `/api/reports/custom/{societyId}` | Custom date range |
| GET | `/api/reports/dashboard/{societyId}` | Dashboard stats |
| GET | `/api/export/transactions/{societyId}` | Excel export |
| POST | `/maintenance-bills/generate` | Generate bulk bills |

### Response Format

```json
// Success Response
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "MEMBER",
  "societyId": 1
}

// Error Response
{
  "timestamp": "2026-02-05T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already exists",
  "path": "/users"
}

// Login Response
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "PLATFORM_OWNER",
  "societyId": null
}
```

---

## ✨ Features & Capabilities

### 🏠 Property Management

- **Multi-Society Support**: Single platform manages multiple housing societies
- **Wing/Tower Organization**: Flats organized by buildings/towers
- **Unit Types**: Support for Flats, Shops, Offices with different configurations
- **Bulk Import/Export**: Excel templates for mass data operations
- **Tenant Management**: Agreement tracking with automatic reminders

### 💰 Financial Management

- **Maintenance Billing**: Bulk bill generation for all units
- **Partial Payments**: Track payment progress on bills
- **Vendor Management**: Approval workflow for service providers
- **Expense Tracking**: Category-wise income/expense ledger
- **Financial Reports**: MTD/YTD with comparison charts
- **Excel Export**: Download reports in Excel format

### 📢 Communication

- **Notice Board**: Priority-based announcements with expiry
- **Ticket System**: Issue tracking with assignment workflow
- **Complaint Management**: Resolution workflow with status updates
- **Banner Management**: Rotating banners for announcements
- **Emergency Contacts**: Society-wide emergency directory

### 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **HTTP-Only Cookies**: CSRF protection
- **Role-Based Access**: 10-tier permission system
- **Password Hashing**: BCrypt encryption
- **Activity Logging**: Security event tracking

### 📊 Reporting & Analytics

- **Dashboard Analytics**: Real-time statistics
- **MTD/YTD Reports**: Monthly and yearly comparisons
- **Custom Date Range**: Flexible reporting periods
- **Excel Export**: All reports downloadable
- **Visual Charts**: Graphical data representation

---

## 🚀 Getting Started

### Prerequisites

```bash
# Backend
Java 21+
Maven 3.8+
PostgreSQL 14+

# Frontend
Node.js 18+
npm 9+

# Mobile
Node.js 18+
Expo CLI
Expo Go app (for testing)
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Configure database (application.properties)
spring.datasource.url=jdbc:postgresql://localhost:5432/society_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# Run with Maven
./mvnw spring-boot:run
```

### Frontend Setup

```bash
# Navigate to admin-web
cd admin-web

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev
```

### Mobile Setup

```bash
# Navigate to mobile-app
cd mobile-app

# Install dependencies
npm install

# Configure API endpoint (src/constants/index.js)
BASE_URL: 'http://your-backend-url:8080'

# Start Expo
npm start
# or
expo start
```

---

## 📂 Project Structure

```
society-management-system/
├── 📁 admin-web/                 # React Admin Portal
│   ├── 📁 src/
│   │   ├── 📁 api/               # API layer
│   │   ├── 📁 components/        # UI components
│   │   ├── 📁 context/           # React Context
│   │   ├── 📁 pages/             # Page components (24)
│   │   ├── 📁 styles/            # CSS modules
│   │   └── 📁 utils/             # Utilities
│   └── 📄 package.json
├── 📁 backend/                   # Spring Boot API
│   └── 📁 src/main/java/
│       └── 📁 com/society/backend/
│           ├── 📁 config/        # Configuration
│           ├── 📁 controller/    # REST Controllers (22+)
│           ├── 📁 dto/           # DTOs
│           ├── 📁 entity/        # JPA Entities (20)
│           ├── 📁 exception/     # Exception handlers
│           ├── 📁 repository/    # Repositories
│           ├── 📁 scheduler/     # Scheduled tasks
│           ├── 📁 security/      # JWT & Auth
│           └── 📁 service/       # Business logic
├── 📁 mobile-app/                # React Native App
│   └── 📁 src/
│       ├── 📁 components/        # UI components
│       ├── 📁 constants/         # Config & constants
│       ├── 📁 context/           # React Context
│       ├── 📁 navigation/        # Navigation
│       ├── 📁 screens/           # Screen components
│       └── 📁 services/          # API services
├── 📁 database/                  # SQL scripts
│   ├── 📄 schema.sql             # Main schema
│   └── 📄 migration-*.sql        # Migrations
├── 📁 docs/                      # Documentation
│   ├── 📄 SYSTEM_DOCUMENTATION.md
│   ├── 📄 requirements.md
│   └── 📄 Enhancements.md
└── 📄 README.md
```

---

## 🎓 Academic Details

- **Project Type:** Mini Project
- **Class:** SE-3
- **Department:** Computer Engineering

---

## 👨‍💻 Project Team

- Tanmay Kudkar
- Nidhish Vartak
- Parth Waghe
- Atharva Raut

---

## 📜 License

This project is licensed under the **MIT License**.

---

<p align="center">
  <strong>Built with ❤️ for Modern Housing Society Management</strong>
</p>

<p align="center">
  <a href="#-system-overview">Overview</a> •
  <a href="#-technology-stack">Tech Stack</a> •
  <a href="#-getting-started">Get Started</a> •
  <a href="#-api-reference">API Reference</a>
</p>

