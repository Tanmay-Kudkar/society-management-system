# 📋 Client Requirements Analysis

## Overview

This document maps the client's requirements to the current implementation status and provides an implementation roadmap.

---

## � Client Expectations (From Handwritten Notes)

### Page 1 - Left Side:
- **Multi Society to one Manager** - One manager handles multiple societies
- **Staff Reporting** - What staff has done, instructions given
- **Ticket Raising** - With priority mask, progress bar of completion
- **Even manager should be raising ticket**
- **Website - Admin, Mobile login for Others**
- **Platform Owner (invisible super admin)**

### Page 1 - Right Side:
- **Manager allotted, Secretary, Treasurer, Chairman and Committee members should be able to raise tickets**
- **AMCs Notifications** - About Housekeeping, Pest Control, etc. FD Renewal, Dues and Insurance
- **Vendor Management** - A society should be able to manage vendors and who can register/partner with us

### Page 2 - Left Side:
- **Reference should be available**
- **Maintenance Bill Raise** - Components, payment update
- **Pay Statement not received/expected yet** - Track pending payments
- **Income Expense, A/C Cash Balance, on the date, MTD, YTD, upcoming month expense - till date**
- **Notices, Gmail order** - Eg: TDS filing, ITR Filing reminders

### Page 2 - Right Side:
- **Banner ad on main page**
- **Emergency contact for each society (specific)**
- **Ready Templates** - Only managers have access of all, various NOC, letters

---

## �📊 Requirements Matrix

| # | Requirement | Status | Priority | Effort |
|---|-------------|--------|----------|--------|
| 1 | Ticket overdue system for main staff | 🟡 Partial | High | Medium |
| 2 | Overdue status systems | 🟡 Partial | High | Medium |
| 3 | MTD, YTD implementation | 🔴 Not Started | High | High |
| 4 | Login, logout, reports systems | 🟢 Implemented | - | - |
| 5 | Logs system (Audit logs) | 🔴 Not Started | Medium | High |
| 6 | Distance edit implementation (like UTS) | 🔴 Not Started | Low | High |
| 7 | GPS access implementation | 🔴 Not Started | Medium | High |
| 8 | Member login only thru mobile app | 🔴 Not Started | High | Medium |
| 9 | Cross platform implementation | 🟡 Partial | High | High |
| 10 | Notice, notifications, banner works | 🟢 Implemented | - | - |
| 11 | Expense tracking | 🟢 Implemented | - | - |
| 12 | Staff detail implementation for master login | 🟡 Partial | Medium | Medium |
| 13 | Hierarchical login credential implementation | 🟢 Implemented | - | - |
| 14 | Excel generation for past/present expenses | 🔴 Not Started | High | Medium |
| 15 | Excel sheet upload implementation | 🔴 Not Started | High | Medium |

**Legend:** 🟢 Implemented | 🟡 Partial | 🔴 Not Started

---

## 📝 Detailed Analysis

### 1. Ticket Overdue System for Main Staff ⚡ 🟡 PARTIAL

**Current State:**
- ✅ Ticket entity has `pendingDays` calculation
- ✅ Tickets have status tracking (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- ✅ Tickets can be assigned to staff
- ❌ No dedicated overdue dashboard for staff
- ❌ No automatic escalation for overdue tickets
- ❌ No overdue alerts/notifications

**Required Implementation:**
```
Backend:
- Add TicketOverdueScheduler to mark tickets overdue after X days
- Add escalation logic (escalate to manager after N days)
- Add overdue notification emails to assigned staff
- Add /tickets/overdue endpoint
- Add /tickets/staff/{staffId}/overdue endpoint

Frontend:
- Add "Overdue Tickets" dashboard widget
- Add overdue indicator (red badge) on ticket cards
- Add overdue filter in tickets list
- Add escalation history in ticket details
```

**Files to Create/Modify:**
- `backend/src/main/java/com/society/backend/scheduler/TicketOverdueScheduler.java` (NEW)
- `backend/src/main/java/com/society/backend/entity/Ticket.java` (add isOverdue, overdueLevel)
- `backend/src/main/java/com/society/backend/controller/ticket/TicketController.java` (add endpoints)
- `admin-web/src/pages/Dashboard.jsx` (add overdue widget)
- `admin-web/src/pages/Tickets.jsx` (add overdue filter)

---

### 2. Overdue Status Systems ⚡ 🟡 PARTIAL

**Current State:**
- ✅ Maintenance bills have due_date field
- ✅ Vendor bills have due_date field
- ✅ Dashboard shows overdue bills count
- ❌ No centralized overdue tracking system
- ❌ No overdue status on individual records

**Required Implementation:**
```
Backend:
- Add isOverdue calculated field to MaintenanceBill
- Add isOverdue calculated field to VendorBill
- Add overdue days calculation
- Add /overdue/summary endpoint for all overdue items

Frontend:
- Add overdue badges on bill cards
- Add overdue days display
- Add overdue summary in dashboard
```

---

### 3. MTD, YTD Implementation 📊 🔴 NOT STARTED

**Current State:**
- ✅ Transaction entity exists with dates
- ✅ Basic income/expense totals available
- ❌ No MTD (Month-to-Date) calculations
- ❌ No YTD (Year-to-Date) calculations
- ❌ No period-based financial reports

**Required Implementation:**
```
Backend:
- Create ReportService with MTD/YTD calculations
- Add endpoints:
  - GET /reports/mtd/{societyId}
  - GET /reports/ytd/{societyId}
  - GET /reports/period/{societyId}?start=&end=
  - GET /reports/comparison/{societyId} (current vs previous)
- Create ReportResponse DTOs

Frontend:
- Create Reports.jsx page
- Add MTD/YTD cards in Dashboard
- Add period selector for reports
- Add charts for income/expense trends
```

**Files to Create:**
- `backend/src/main/java/com/society/backend/service/report/ReportService.java` (NEW)
- `backend/src/main/java/com/society/backend/service/report/ReportServiceImpl.java` (NEW)
- `backend/src/main/java/com/society/backend/controller/report/ReportController.java` (NEW)
- `backend/src/main/java/com/society/backend/dto/report/ReportResponse.java` (NEW)
- `admin-web/src/pages/Reports.jsx` (NEW)

---

### 4. Login, Logout, Reports Systems 🟢 IMPLEMENTED

**Current State:**
- ✅ JWT-based authentication
- ✅ Login functionality (web)
- ✅ Logout functionality
- ✅ Role-based access control
- ✅ Basic reports available

**Notes:** Core authentication is complete. Reports need enhancement (see #3).

---

### 5. Logs System (Audit Logs) 📋 🔴 NOT STARTED

**Current State:**
- ✅ Basic console logging exists
- ❌ No audit log table
- ❌ No user action tracking
- ❌ No login/logout history
- ❌ No activity log viewer

**Required Implementation:**
```
Database:
- Create audit_logs table

Backend:
- Create AuditLog entity
- Create AuditLogRepository
- Create AuditLogService
- Add @Audited annotation for auto-logging
- Create AuditLogInterceptor for automatic logging
- Add endpoints:
  - GET /audit-logs (admin only)
  - GET /audit-logs/user/{userId}
  - GET /audit-logs/entity/{entityType}/{entityId}

Frontend:
- Create AuditLogs.jsx page
- Add activity log section in user details
- Add "Recent Activity" widget in dashboard
```

**Database Schema:**
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(50), -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity_type VARCHAR(50), -- USER, TICKET, BILL, etc.
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 6. Distance Edit Implementation (like UTS) 📍 🔴 NOT STARTED

**Current State:**
- ❌ No GPS/location tracking
- ❌ No distance-based access control

**Required Implementation:**
```
This feature allows editing only when user is within a certain distance
from the society location (like UTS ticket booking).

Backend:
- Add latitude/longitude to Society entity
- Create LocationService for distance calculations
- Add @RequireProximity annotation for endpoints
- Create LocationVerificationFilter

Mobile:
- Add location permission request
- Add GPS coordinate capture
- Send location with API requests
```

**Note:** This is a complex feature requiring mobile app implementation first.

---

### 7. GPS Access Implementation 📍 🔴 NOT STARTED

**Current State:**
- ❌ Society has no location coordinates
- ❌ No GPS integration

**Required Implementation:**
```
Database:
- Add latitude, longitude to societies table

Backend:
- Update Society entity with coordinates
- Create GeofenceService
- Add GPS validation endpoints

Mobile (Required):
- Request location permissions
- Capture GPS coordinates
- Validate user location before certain actions
```

---

### 8. Member Login Only Through Mobile App 📱 🔴 NOT STARTED

**Current State:**
- ✅ Web login works for all roles
- ❌ No platform-based login restriction
- ❌ No mobile app yet

**Required Implementation:**
```
Backend:
- Add login_platform field to JWT claims
- Create PlatformValidationFilter
- Restrict MEMBER and TENANT roles to mobile-only login
- Add device registration table

Frontend:
- Show "Please use mobile app" for restricted roles
- Add download app links

Mobile (Required):
- Implement complete mobile authentication
- Add device registration
```

---

### 9. Cross Platform Implementation 🌐 🟡 PARTIAL

**Current State:**
- ✅ Admin Web Portal (React)
- ✅ Backend API (Spring Boot)
- ❌ Mobile App (only README exists)
- ❌ No React Native implementation

**Required Implementation:**
```
Mobile App:
- Initialize React Native project
- Implement authentication
- Implement core features:
  - Dashboard
  - Complaints/Tickets
  - Bills & Payments
  - Notices
  - Profile
- Push notifications
- GPS integration
```

**Files to Create:**
- `mobile-app/App.js`
- `mobile-app/src/screens/*`
- `mobile-app/src/components/*`
- `mobile-app/src/api/*`
- `mobile-app/src/context/*`

---

### 10. Notice, Notifications, Banner Works 📢 🟢 IMPLEMENTED

**Current State:**
- ✅ Notices CRUD implemented
- ✅ Banners CRUD implemented
- ✅ Email notifications for key events
- ✅ Scheduler for automated reminders
- ✅ Priority levels for notices

**Enhancements Possible:**
- Push notifications for mobile
- Real-time notifications (WebSocket)
- Notification center in UI

---

### 11. Expense Tracking 💰 🟢 IMPLEMENTED

**Current State:**
- ✅ Transaction entity with INCOME/EXPENSE types
- ✅ Transaction CRUD operations
- ✅ Income/Expense summary in frontend
- ✅ Payment mode tracking (Cash, Cheque, UPI, etc.)
- ✅ Category-based tracking

**Enhancements Possible:**
- Budget vs actual comparison
- Category-wise reports
- Trend charts

---

### 12. Staff Detail Implementation for Master Login 👥 🟡 PARTIAL

**Current State:**
- ✅ User management with roles
- ✅ PLATFORM_OWNER can view all users
- ❌ No dedicated staff management page
- ❌ No staff attendance tracking
- ❌ No staff performance metrics

**Required Implementation:**
```
Backend:
- Create StaffService
- Add staff-specific endpoints
- Track staff assignments to societies
- Staff attendance tracking (optional)

Frontend:
- Create Staff.jsx page
- Add staff assignment to societies
- Staff activity dashboard
- Staff performance metrics
```

---

### 13. Hierarchical Login Credential Implementation 🔐 🟢 IMPLEMENTED

**Current State:**
- ✅ Role-based hierarchy implemented:
  - PLATFORM_OWNER (highest)
  - ORGANIZATION_OWNER
  - SOCIETY_ADMIN
  - CHAIRMAN, SECRETARY, TREASURER, COMMITTEE
  - EMPLOYEE
  - MEMBER
  - TENANT
  - VISITOR (lowest)
- ✅ Role-based access control
- ✅ Permission checking in RoleService

---

### 14. Excel Generation for Past/Present Expenses 📊 🔴 NOT STARTED

**Current State:**
- ✅ Transaction data available via API
- ❌ No Excel export functionality
- ❌ No PDF export

**Required Implementation:**
```
Backend:
- Add Apache POI dependency
- Create ExcelService
- Add export endpoints:
  - GET /export/transactions/{societyId}/excel
  - GET /export/bills/{societyId}/excel
  - GET /export/reports/{societyId}/excel
- Add date range filtering

Frontend:
- Add "Export to Excel" buttons
- Add date range picker for exports
- Download file handling
```

**Dependencies:**
```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.3</version>
</dependency>
```

---

### 15. Excel Sheet Upload Implementation 📤 🔴 NOT STARTED

**Current State:**
- ❌ No bulk import functionality
- ❌ No Excel parsing

**Required Implementation:**
```
Backend:
- Create ExcelImportService
- Add import endpoints:
  - POST /import/flats (bulk flat import)
  - POST /import/members (bulk member import)
  - POST /import/transactions (bulk transaction import)
- Add validation and error handling
- Add import preview before commit

Frontend:
- Add file upload components
- Add import preview table
- Add validation error display
- Add import progress indicator
```

**Template Downloads:**
- Provide Excel templates for each import type

---

## 🚀 Implementation Roadmap

### Phase 1: Core Enhancements (2-3 weeks)
1. **MTD/YTD Reports** - High impact for financial tracking
2. **Excel Export** - Required for accounting
3. **Ticket Overdue System** - Staff productivity
4. **Overdue Status Systems** - Bill tracking

### Phase 2: Audit & Logging (1-2 weeks)
5. **Audit Logs System** - Compliance & tracking
6. **Staff Management** - For platform owner

### Phase 3: Data Import (1 week)
7. **Excel Import** - Bulk data entry

### Phase 4: Mobile App Foundation (4-6 weeks)
8. **React Native Setup** - Cross-platform
9. **Mobile Authentication** - With device binding
10. **Core Mobile Features** - Dashboard, Complaints, Bills

### Phase 5: Location Features (2-3 weeks)
11. **GPS Integration** - Location tracking
12. **Distance-based Access** - Security feature
13. **Member Mobile-only Login** - Platform restriction

---

## 📁 New Files to Create

### Backend
```
src/main/java/com/society/backend/
├── entity/
│   └── AuditLog.java
├── repository/
│   └── AuditLogRepository.java
├── service/
│   ├── audit/
│   │   ├── AuditLogService.java
│   │   └── AuditLogServiceImpl.java
│   ├── report/
│   │   ├── ReportService.java
│   │   └── ReportServiceImpl.java
│   └── excel/
│       ├── ExcelExportService.java
│       └── ExcelImportService.java
├── controller/
│   ├── audit/
│   │   └── AuditLogController.java
│   ├── report/
│   │   └── ReportController.java
│   └── excel/
│       └── ExcelController.java
├── scheduler/
│   └── TicketOverdueScheduler.java
└── dto/
    ├── audit/
    │   └── AuditLogResponse.java
    └── report/
        ├── MTDReportResponse.java
        ├── YTDReportResponse.java
        └── FinancialSummaryResponse.java
```

### Frontend
```
admin-web/src/pages/
├── Reports.jsx
├── AuditLogs.jsx
└── Staff.jsx
```

### Mobile App
```
mobile-app/
├── App.js
├── package.json
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── ComplaintsScreen.js
│   │   ├── BillsScreen.js
│   │   ├── NoticesScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   ├── api/
│   ├── context/
│   └── navigation/
```

---

## 📝 Database Migrations Required

```sql
-- Migration: Add audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Add location to societies
ALTER TABLE societies ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE societies ADD COLUMN longitude DECIMAL(11, 8);

-- Migration: Add overdue fields to tickets
ALTER TABLE tickets ADD COLUMN is_overdue BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN overdue_days INT DEFAULT 0;
ALTER TABLE tickets ADD COLUMN escalation_level INT DEFAULT 0;

-- Migration: Add device registration
CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    device_id VARCHAR(255),
    device_type VARCHAR(50),
    fcm_token VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Migration: Add login history
CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP,
    ip_address VARCHAR(50),
    device_type VARCHAR(50),
    platform VARCHAR(50),
    status VARCHAR(20)
);
```

---

## ⏱️ 15-DAY SPRINT PLAN

### 🎯 Priority Matrix (What We CAN Deliver in 15 Days)

| Priority | Feature | Days | Impact |
|----------|---------|------|--------|
| 🔴 P0 | MTD/YTD Reports | 2 | High - Financial visibility |
| 🔴 P0 | Excel Export | 2 | High - Accounting requirement |
| 🔴 P0 | Ticket Overdue System | 1 | High - Staff accountability |
| 🔴 P0 | Overdue Status (Bills) | 1 | High - Payment tracking |
| 🟠 P1 | Audit Logs System | 2 | Medium - Compliance |
| 🟠 P1 | Excel Import | 2 | Medium - Bulk data entry |
| 🟠 P1 | Staff Management Page | 1 | Medium - Admin visibility |
| 🟡 P2 | Login History/Logs | 1 | Low - Security tracking |
| 🟡 P2 | Enhanced Reports Page | 2 | Medium - Better UI |
| ⬜ Buffer | Testing & Bug Fixes | 1 | Critical |

### 📅 Day-by-Day Schedule

```
┌─────────────────────────────────────────────────────────────┐
│  WEEK 1: CORE FINANCIAL & REPORTING                        │
├─────────────────────────────────────────────────────────────┤
│  Day 1-2:  MTD/YTD Implementation (Backend + Frontend)      │
│  Day 3-4:  Excel Export (Transactions, Bills, Reports)      │
│  Day 5:    Ticket Overdue System + Scheduler                │
│  Day 6:    Bill Overdue Status + Dashboard Updates          │
│  Day 7:    Audit Logs Backend                               │
├─────────────────────────────────────────────────────────────┤
│  WEEK 2: IMPORT, LOGS & POLISH                              │
├─────────────────────────────────────────────────────────────┤
│  Day 8:    Audit Logs Frontend                              │
│  Day 9-10: Excel Import (Flats, Members, Transactions)      │
│  Day 11:   Staff Management Page                            │
│  Day 12:   Login History & Session Tracking                 │
│  Day 13:   Enhanced Reports Page with Charts                │
│  Day 14:   Integration Testing & Bug Fixes                  │
│  Day 15:   Final Testing & Deployment                       │
└─────────────────────────────────────────────────────────────┘
```

### ❌ Features DEFERRED (Require Mobile App - Future Phase)

| Feature | Reason | Future Timeline |
|---------|--------|-----------------|
| GPS Access Implementation | Requires mobile app | Phase 2 (4-6 weeks) |
| Distance Edit (UTS-like) | Requires GPS + mobile | Phase 2 |
| Member Mobile-Only Login | Mobile app needed | Phase 2 |
| Cross-Platform Mobile App | Major undertaking | Phase 2 (4-6 weeks) |
| Push Notifications | Mobile app needed | Phase 2 |

**Note:** Mobile app features require a separate 4-6 week development phase.

---

## 🚀 IMMEDIATE ACTION ITEMS

### Day 1-2: MTD/YTD Implementation
- [ ] Create ReportService & ReportController
- [ ] Add MTD/YTD calculation endpoints
- [ ] Create Reports.jsx page with period selector
- [ ] Add MTD/YTD cards to Dashboard

### Day 3-4: Excel Export
- [ ] Add Apache POI dependency
- [ ] Create ExcelExportService
- [ ] Add export endpoints for transactions, bills
- [ ] Add "Export" buttons in frontend

### Day 5: Ticket Overdue System
- [ ] Add isOverdue field to Ticket entity
- [ ] Create TicketOverdueScheduler
- [ ] Add overdue indicators in Tickets page
- [ ] Add overdue filter

### Day 6: Bill Overdue Status
- [ ] Add overdue calculation to MaintenanceBill
- [ ] Add overdue calculation to VendorBill
- [ ] Update Dashboard with overdue summary
- [ ] Add overdue badges in bill lists

### Day 7-8: Audit Logs
- [ ] Create AuditLog entity & repository
- [ ] Create AuditLogService with interceptor
- [ ] Create AuditLogs.jsx page
- [ ] Track login/logout, CRUD operations

### Day 9-10: Excel Import
- [ ] Create ExcelImportService
- [ ] Add import endpoints
- [ ] Create import UI with preview
- [ ] Add template downloads

### Day 11: Staff Management
- [ ] Create Staff.jsx page
- [ ] List all employees with society assignments
- [ ] Add staff activity summary

### Day 12: Login History
- [ ] Create login_history table
- [ ] Track login/logout events
- [ ] Add login history in Settings page

### Day 13: Enhanced Reports
- [ ] Add charts (recharts library)
- [ ] Period comparison reports
- [ ] Category-wise breakdowns

### Day 14-15: Testing & Deployment
- [ ] Integration testing
- [ ] Bug fixes
- [ ] Documentation update
- [ ] Deployment

---

## ✅ Deliverables After 15 Days

| # | Feature | Status |
|---|---------|--------|
| 1 | MTD/YTD Financial Reports | ✅ |
| 2 | Excel Export (Transactions, Bills) | ✅ |
| 3 | Excel Import (Bulk Data) | ✅ |
| 4 | Ticket Overdue System | ✅ |
| 5 | Bill Overdue Tracking | ✅ |
| 6 | Audit Logs System | ✅ |
| 7 | Staff Management | ✅ |
| 8 | Login History | ✅ |
| 9 | Enhanced Reports Page | ✅ |

### Features for Phase 2 (Post-15 Days)
- Mobile App (React Native)
- GPS/Location Features
- Member Mobile-Only Login
- Push Notifications
- Distance-based Access Control

