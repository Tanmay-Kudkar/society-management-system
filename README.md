# 🏢 Proficient Housing Society Management System

<p align="left">
  <img src="https://skillicons.dev/icons?i=git,github,react,tailwind,npm,java,spring,postgresql,androidstudio,apple" />
</p>

![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-blue)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20React%20Native-61dafb)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot-brightgreen)
![Database](https://img.shields.io/badge/database-PostgreSQL-blue)
![Security](https://img.shields.io/badge/security-JWT-orange)

A **centralized Society Management System** designed to manage **multiple housing societies** using a **web-based platform for administrators and committee members** and a **mobile application for members and employees**, backed by a **secure and scalable backend**.

---

## 📌 Problem Statement

Housing societies are required to manage member records, complaints, vendor coordination, maintenance billing, contract renewals, and financial accounts. Most societies rely on manual registers, spreadsheets, and informal communication methods, leading to delays, missed renewals, lack of accountability, and poor transparency.

There is no unified system to manage **role-based access**, **task tracking**, **AMC reminders**, **vendor payments**, **maintenance billing**, and **financial reporting** across societies. This project aims to solve these issues through a **centralized, role-driven digital platform**.

---

## 🎯 Solution Overview

The system provides:
- A **web application** for administrators, committee members, and society managers
- A **mobile application** for members and employees
- Centralized handling of complaints, tasks, billing, vendors, notifications, and accounts
- Real-time tracking, reminders, and reporting

---

## 👥 User Roles & Login System

### 🔐 Login Types
- **Master Login** – Access to all societies and employees  
- **Employee Login** – Access only to allotted society  
- **Committee Login** – Chairman, Secretary, Treasurer, and other committee members  
- **Member Login** – Society members and tenants  

---

## 🧩 Core Functional Modules

### 🧾 1. Member & Society Data Management
- Flat / Shop number  
- Flat area  
- Member contact details (Phone, Email)  
- Vehicle details (Two-wheeler / Four-wheeler)  
- Tenant details (Name, contact, agreement period)  
- Occupant details  
- **Bulk data update support**

---

### 🛠️ 2. Ticket Raising & Task Management
Tickets can be raised by:
- Members  
- Committee Members  
- Employees  
- Super Admin  

Supported ticket types:
- Complaints  
- Requests  
- Issues  
- Work assignment and supervision  

Ticket status tracking:
- Approval Status  
- Progress Status  
- Completed Status  
- Pending for X days  

---

### 🔔 3. Notifications & Reminders
Automated reminders for:
- AMC expiry dates  
- Fixed Deposit renewals  
- Leave & License agreement due  
- Insurance renewal  
- Pest control contract  
- Housekeeping contract  
- CCTV maintenance  
- Lift maintenance  
- Generator maintenance  
- Electrician & Security contracts  

---

### 🏢 4. Vendor Management
- Vendor registration  
  - Common / Partner Vendors  
  - Society-specific Vendors  
- Bill tracking (Received / Paid / Pending)  
- Partial payment support  
- Automatic pending-days calculation  
- Direct linkage with:
  - Cash Register  
  - Cheque Register  

---

### 💰 5. Maintenance Bill Management
- Bill component configuration  
- Monthly bill generation  
- Bill delivery via:
  - Email  
  - Mobile App  
  - Hard Copy  
- Payment status updates  
- Individual member ledger maintenance  
- Receipt generation and storage  

---

### 📊 6. Income & Expenditure Accounting
- Cash payment register  
- Cheque payment register  
- Financial views:
  - Daily  
  - Month-to-Date (MTD)  
  - Year-to-Date (YTD)  
- Budgeted vs actual expenditure  
- Income and Profit/Loss tracking  

---

### 📢 7. Notices & Announcements
- Society-wide notices  
- Scrolling notifications  
- Updates visible on web and mobile  

---

### 📣 8. Banner Advertisements
- Promotional banners on main dashboard  
- Society-level visibility control  

---

### 🚨 9. Emergency Contact Directory
Society-wise emergency contacts:
- Doctor  
- Plumber  
- Electrician  
- Housekeeping  
- Other essential services  

---

### 📄 10. Ready-Made Templates
- NOC templates  
- Letters  
- Meeting agenda formats  
- Official society documents  

---

## 🏗️ System Architecture

- Client–Server architecture  
- Web and Mobile clients consume REST APIs  
- Centralized authentication and authorization  
- Single PostgreSQL database shared across platforms  

---

## 🛠️ Technology Stack

### Frontend
- **React** – Admin & Committee Web Portal  
- **React Native** – Mobile Application for Members & Employees  

### Backend
- **Spring Boot** – Business logic, validation, APIs  

### Database
- **PostgreSQL** – Structured and reliable data storage  

### Security
- **JWT Authentication**
- Role-based access control  

---

```
📂 Project Structure

Society-Management-System/
│
├── admin-web/ # Web portal for admin & committee
├── mobile-app/ # Mobile app for members & employees
├── backend/ # Spring Boot backend services
├── database/ # Database schema and scripts
├── docs/ # Requirement & design documents
└── README.md
```
---

## 🚀 Key Benefits

- Centralized management for multiple societies  
- Role-based secure access  
- Automated reminders and notifications  
- Transparent billing and accounting  
- Improved accountability and governance  
- Scalable and maintainable architecture  

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

This project is developed strictly for academic purposes.

