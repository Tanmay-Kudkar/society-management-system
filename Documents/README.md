# 🏢 Society Management System  
## 📊 Role Architecture, Permissions & Operational Model

A **structured role-based governance system** designed for **housing society management platforms**.  
The platform ensures **clear responsibilities, structured approval workflows, and controlled data visibility** across different user roles.

---

# 🧩 1. Role Hierarchy Overview

The platform operates using a **multi-level role hierarchy** that separates:

- ⚙️ Platform Control  
- 🏛 Society Governance  
- 🧑‍💼 Operational Staff  
- 🏠 Residents & Service Providers  

| 👤 Role | 🔐 Access Level | 📦 Main Modules |
|------|------|------|
| 🧠 **MASTER_ADMIN** | Platform Level | User Management, Society Management, Tickets, Documents, Reports |
| 🏢 **SOCIETY_ADMIN / MANAGER** | Society Level | Tickets, Accounting, Documents, Audit Records |
| 👑 **CHAIRMAN** | Governing Body | Tasks, Notices, Tickets View |
| 📝 **SECRETARY** | Governing Body | Tasks, Notices, Tickets View |
| 💰 **TREASURER** | Finance Governance | Financial View, Tickets, Notices |
| 👥 **COMMITTEE** | Limited Governance | Tickets Dashboard, Meeting Attendance |
| 👨‍🔧 **EMPLOYEE** | Operational Staff | Profile Records |
| 🏠 **MEMBER** | Flat Owner | Profile, Tickets, Notices, Vehicles, Penalty Records |
| 🛠 **VENDOR** | Service Provider | AMC Records, Payment Logs |
| 🧍 **TENANT** | Resident (Limited) | Visitor Entry, Notices, Rental Info |
| 🚶 **VISITOR** | Guest | Entry Logs |

---

# 🔁 2. Role Action Flow & Approval System

Each role operates under a **controlled approval workflow** to maintain **governance transparency and accountability**.

| ⚙️ Allowed Actions | ✅ Approval Required From |
|------|------|
| Create/Edit/Delete users, onboard societies, assign managers, manage tickets, upload templates | ❌ None |
| Create/Resolve tickets, maintain member ledger, upload audit sheets, record expenses | 👑 Chairman / 📝 Secretary / 💰 Treasurer |
| Create tasks, raise instructions, issue circulars, finance instructions, view accounts | ❌ None |
| Create tasks, raise instructions, issue circulars, finance instructions, view accounts | ❌ None |
| Create tasks, raise instructions, issue circulars, finance instructions, view accounts | ❌ None |
| Raise member-related tickets, view issue status | 🏢 Admin / Governing Body |
| No operational system actions (HR records only) | 🏢 Manager / Admin |
| Create requests, update profile information | 🏢 Admin |
| View/update own contract details | 🏢 Admin |
| Raise requests (with owner approval), allow visitors | 🏠 Member (Flat Owner) |
| Entry created by security; no direct system access | 🏠 Member Approval |

---

# 👁️ 3. Data Visibility Scope

The platform restricts data access based on **role responsibility and governance authority**.

| 📊 Data Visibility Scope | 📝 Notes |
|------|------|
| 🌐 All Data | Super admin override permissions; proximity login tracking for managers |
| 🏢 Full Specific Society Data | CRUD operations allowed except governance approvals |
| 📊 Operational + Financial Data | Read-heavy governance role focused on expenses & ledgers |
| 📊 Operational + Financial Data | Read-heavy governance role focused on expenses & ledgers |
| 📊 Operational + Financial Data | Read-heavy governance role focused on expenses & ledgers |
| 🎫 Society Issue Status Only | No financial editing rights |
| 👤 Own Record Only | Attendance & salary stored; no login actions required |
| 🏠 Own Flat Data | Ownership chain, tenant mapping, maintenance reminders |
| 🛠 Own Vendor Data | No access to member data |
| 📄 Own Rental Data | Owner-linked permissions required |
| 🚪 Entry Record Only | Security role acts as data creator |

---

# 📋 4. Detailed Role Responsibilities

---

## 🧠 4.1 MASTER ADMIN

The **Master Admin** controls the **entire platform infrastructure**.

### Responsibilities

- ➕ Create, edit, or delete users and records  
- 🎫 Add and manage tickets  
- 💬 Reply to tickets and resolve issues  
- 📂 Upload templates and documents  
- 🏢 Onboard new societies  
- 👨‍💼 Assign societies to managers  
- 🕒 Track manager login and logout activity  
- 📍 Monitor manager location using **proximity login tracking**

⚡ **This role has complete system control.**

---

## 🏢 4.2 SOCIETY ADMIN / MANAGER

The **Society Admin / Manager** manages **daily society operations and records**.

### Responsibilities

- 👁 View tickets raised by Members, Chairman, Secretary, or Treasurer  
- 🛠 Provide solutions to tickets  
- ✅ Close tickets after approval  
- 📄 Upload official communications, minutes, and letters  
- 💰 Maintain member billing and individual ledgers  
- 🧾 Record cheque and cash expenses  
- 📊 Upload audit sheets and financial reports  
- 📜 Maintain society rules, regulations, and penalties  
- 🚨 Raise issues if rules are violated  

### 🎫 Ticket Approval Flow

1️⃣ Tickets created by **Admin** become visible to  
- 👑 Chairman  
- 📝 Secretary  
- 💰 Treasurer  

2️⃣ After resolution, **approval from them is required before final closure**

---

## 👑 4.3 CHAIRMAN / SECRETARY / TREASURER

These roles form the **governing body of the society**.

### Capabilities

- 🎫 Create tickets or issue instructions to Admin  
- 📋 Create and assign tasks  
- 📊 View society operational records  
- 💰 Monitor financial data  
- 📢 Issue notices or circulars to members  
- ✅ Approve ticket closures  

Members can raise **requests and issues** through them.

---

## 👥 4.4 COMMITTEE MEMBERS

Committee members hold **limited governance authority**.

### Responsibilities

- 🎫 Create tickets related to their own flats  
- 👁 View society issues, solved cases, and pending cases  
- 📅 Access meeting notices  
- ✔ Record attendance for committee meetings  

They act as **community representatives**.

---

## 👨‍🔧 4.5 EMPLOYEE

Employees **do not interact with operational modules**.

The system only stores **HR related records**.

### Stored Information

- 📅 Attendance records  
- 💰 Salary details  
- 🪪 Identity documents  
- 💳 Advance payment records (if applicable)

This module functions as a **simple HR database**.

---

## 🏠 4.6 MEMBER (Flat Owner)

Members represent **flat owners within the society system**.

### 🏢 Ownership Records

- Owner name as per sale agreement  
- Sale agreement date  
- Complete ownership chain from builder to current owner  

### 📞 Contact Details

- Phone number  
- Email ID  

### 🏠 Occupancy Details

- Self-occupied  
- Tenant occupied  
- Vacant  

### 👥 Tenant Records

- Tenant details  
- Tenancy duration  

### 🚗 Vehicle Records

- Two-wheelers  
- Four-wheelers  

### 📢 Communication

- Maintenance reminders  
- Notices  
- Penalty notifications  
- Issue related communication  

### ⚠ Penalty Management

Members can upload evidence such as:

- 📷 Photographs  
- 📅 Date and description  

### 🔄 Interaction Flow

- 💬 One-to-one communication allowed during **office hours**  
- 🎫 Outside office hours → **ticket must be raised**

---

## 🛠 4.7 VENDOR

The **Vendor module** tracks service providers and **AMC contracts**.

### Stored Information

- Vendor contact details  
- AMC contract details  
- Contract value  
- Renewal date  
- Expiry date  
- Service logs (entry / exit records)  
- Payment history  
- Pending payments  
- Service activity history  

---

## 🧍 4.8 TENANT

Tenants have **restricted system permissions**.

### Capabilities

- 🎫 Raise requests with owner approval  
- 🚪 Allow visitors linked to their flat  
- 📢 View society notices  
- 📄 Access rental agreement information  

### Stored Details

- Tenancy duration  
- Rental agreements  
- Vehicle records for identification  

---

## 🚶 4.9 VISITOR

Visitors **do not access the system directly**.

Visitor entries are created by **security personnel using dedicated devices**.

### Stored Information

- Entry and exit records  
- Flat visited  
- Timestamp of entry  

Entries are forwarded to the **respective member for approval**.

This helps maintain accurate records for:

- 📦 Deliveries  
- 🚶 Visitors  
- 🏢 Movement inside the society

---

# 🏛 5. Governance Model Summary

The system is built around **four governance layers**.

### ⚙ Platform Layer
Managed by **Master Admin**

### 🏢 Society Operations Layer
Handled by **Society Admin / Manager**

### 🏛 Governing Body Layer
Includes

- 👑 Chairman  
- 📝 Secretary  
- 💰 Treasurer  
- 👥 Committee  

### 🏠 Resident & Service Layer
Includes

- 🏠 Members  
- 🧍 Tenants  
- 🛠 Vendors  
- 🚶 Visitors  

---

# 🚀 6. Key Platform Features

- 🔐 Role Based Access Control (RBAC)  
- 🎫 Ticket and Issue Management  
- 🏛 Society Governance Workflow  
- 📊 Financial Audit & Ledger Tracking  
- 🛠 Vendor & AMC Management  
- 🚪 Visitor Entry System  
- 📂 Document Storage & Notices  
- 🏠 Ownership & Tenancy Management  
