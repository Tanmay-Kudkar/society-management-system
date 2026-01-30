# Member API Endpoints Documentation

This document describes the backend API endpoints accessible to **MEMBER** role users (flat owners/residents). These are the APIs that regular members can use to interact with the society management system through the mobile app or web interface.

## Base URL
The backend API is typically accessible at: `http://localhost:8080/api` (or your deployed URL)

## Table of Contents
1. [Authentication](#authentication)
2. [Complaints](#complaints)
3. [Notices](#notices)
4. [Maintenance Bills](#maintenance-bills)
5. [Vehicles](#vehicles)
6. [Tenants](#tenants)
7. [Flats](#flats)
8. [Banners](#banners)
9. [Emergency Contacts](#emergency-contacts)
10. [Transactions](#transactions)
11. [Tickets](#tickets)
12. [Notification Preferences](#notification-preferences)
13. [Vendors (View Only)](#vendors-view-only)
14. [Document Templates (View Only)](#document-templates-view-only)
15. [Contracts (View Only)](#contracts-view-only)

---

## Authentication

### Register New Account
**Endpoint:** `POST /auth/register`

**Description:** Register a new user account in the system.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "role": "MEMBER",
  "societyId": "long"
}
```

**Response:** `UserResponse` object

**Access:** Public (no authentication required)

---

### Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token for subsequent requests.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "userId": "long",
  "email": "string",
  "role": "string"
}
```

**Access:** Public (no authentication required)

---

## Complaints

Members can file and track complaints about issues in their society.

### Create Complaint
**Endpoint:** `POST /complaints`

**Description:** File a new complaint regarding any issue in the society.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "priority": "LOW | MEDIUM | HIGH",
  "societyId": "long",
  "raisedById": "long"
}
```

**Response:** `ComplaintResponse` object

**Access:** Authenticated members (MEMBER, EMPLOYEE, COMMITTEE, etc.)

---

### View Complaint Details
**Endpoint:** `GET /complaints/{id}`

**Description:** Get details of a specific complaint.

**Path Parameters:**
- `id` - Complaint ID

**Response:** `ComplaintResponse` object with status, resolution, timestamps, etc.

**Access:** Authenticated users

---

### View My Complaints
**Endpoint:** `GET /complaints/user/{targetUserId}`

**Description:** Get all complaints filed by a specific user. Members can view their own complaints.

**Path Parameters:**
- `targetUserId` - User ID

**Query Parameters:**
- `userId` - Current user's ID (for authorization)

**Response:** Array of `ComplaintResponse` objects

**Access:** Authenticated users (can view own complaints)

---

## Notices

Members can view notices and announcements posted by the society management.

### View All Notices
**Endpoint:** `GET /notices`

**Description:** Get all notices for authenticated user's society.

**Response:** Array of `NoticeResponse` objects

**Access:** Authenticated users

---

### View Notice Details
**Endpoint:** `GET /notices/{id}`

**Description:** Get details of a specific notice.

**Path Parameters:**
- `id` - Notice ID

**Response:** `NoticeResponse` object with title, content, priority, posted date, etc.

**Access:** Authenticated users

---

### View Society Notices
**Endpoint:** `GET /notices/society/{societyId}`

**Description:** Get all notices for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `NoticeResponse` objects

**Access:** Authenticated users

---

## Maintenance Bills

Members can view their maintenance bills and make payments.

### View Bill Details
**Endpoint:** `GET /maintenance-bills/{id}`

**Description:** Get details of a specific maintenance bill.

**Path Parameters:**
- `id` - Bill ID

**Response:** `MaintenanceBillResponse` object with amount, due date, status, etc.

**Access:** Authenticated users

---

### View Flat's Bills
**Endpoint:** `GET /maintenance-bills/flat/{flatId}`

**Description:** Get all maintenance bills for a specific flat.

**Path Parameters:**
- `flatId` - Flat ID

**Response:** Array of `MaintenanceBillResponse` objects

**Access:** Authenticated users

---

### View Bills by Month
**Endpoint:** `GET /maintenance-bills/month/{billMonth}`

**Description:** Get all bills for a specific billing month.

**Path Parameters:**
- `billMonth` - Month in format (e.g., "2024-01")

**Response:** Array of `MaintenanceBillResponse` objects

**Access:** Authenticated users

---

### View Bills by Status
**Endpoint:** `GET /maintenance-bills/status/{status}`

**Description:** Filter bills by payment status.

**Path Parameters:**
- `status` - Status value: `PENDING`, `PAID`, `OVERDUE`

**Response:** Array of `MaintenanceBillResponse` objects

**Access:** Authenticated users

---

### View Pending Bills
**Endpoint:** `GET /maintenance-bills/pending`

**Description:** Get all pending (unpaid) maintenance bills.

**Response:** Array of `MaintenanceBillResponse` objects

**Access:** Authenticated users

---

### View All Bills
**Endpoint:** `GET /maintenance-bills`

**Description:** Get all maintenance bills (typically filtered by user's flats).

**Response:** Array of `MaintenanceBillResponse` objects

**Access:** Authenticated users

---

### Record Payment
**Endpoint:** `POST /maintenance-bills/{id}/payment`

**Description:** Record a payment for a maintenance bill.

**Path Parameters:**
- `id` - Bill ID

**Query Parameters:**
- `amount` - Payment amount (BigDecimal)
- `paymentMode` - Payment method: `CASH`, `ONLINE`, `CHEQUE`, `UPI`
- `referenceNumber` - Optional reference number for the payment

**Response:** Updated `MaintenanceBillResponse` object

**Access:** Authenticated users

---

## Vehicles

Members can register and manage their vehicles for parking and security purposes.

### Register Vehicle
**Endpoint:** `POST /vehicles`

**Description:** Register a new vehicle for a flat.

**Request Body:**
```json
{
  "vehicleNumber": "string",
  "vehicleType": "TWO_WHEELER | FOUR_WHEELER",
  "model": "string",
  "color": "string",
  "flatId": "long"
}
```

**Response:** `VehicleResponse` object

**Access:** Authenticated users

---

### View Vehicle Details
**Endpoint:** `GET /vehicles/{id}`

**Description:** Get details of a specific vehicle.

**Path Parameters:**
- `id` - Vehicle ID

**Response:** `VehicleResponse` object

**Access:** Authenticated users

---

### View Flat's Vehicles
**Endpoint:** `GET /vehicles/flat/{flatId}`

**Description:** Get all vehicles registered for a specific flat.

**Path Parameters:**
- `flatId` - Flat ID

**Response:** Array of `VehicleResponse` objects

**Access:** Authenticated users

---

### View All Vehicles
**Endpoint:** `GET /vehicles`

**Description:** Get all vehicles in the society.

**Response:** Array of `VehicleResponse` objects

**Access:** Authenticated users

---

### Update Vehicle
**Endpoint:** `PUT /vehicles/{id}`

**Description:** Update vehicle information.

**Path Parameters:**
- `id` - Vehicle ID

**Request Body:** `VehicleRequest` object

**Response:** Updated `VehicleResponse` object

**Access:** Authenticated users

---

### Delete Vehicle
**Endpoint:** `DELETE /vehicles/{id}`

**Description:** Remove a vehicle registration.

**Path Parameters:**
- `id` - Vehicle ID

**Response:** 204 No Content

**Access:** Authenticated users

---

## Tenants

Members can manage tenant information for their flats.

### Add Tenant
**Endpoint:** `POST /tenants`

**Description:** Add a new tenant to a flat.

**Request Body:**
```json
{
  "userId": "long",
  "flatId": "long",
  "startDate": "date",
  "endDate": "date (optional)",
  "agreementDocument": "string (optional)"
}
```

**Response:** `TenantResponse` object

**Access:** Authenticated users

---

### View Tenant Details
**Endpoint:** `GET /tenants/{id}`

**Description:** Get details of a specific tenant.

**Path Parameters:**
- `id` - Tenant ID

**Response:** `TenantResponse` object with user details, flat, dates, etc.

**Access:** Authenticated users

---

### View Flat's Tenants
**Endpoint:** `GET /tenants/flat/{flatId}`

**Description:** Get all tenants for a specific flat.

**Path Parameters:**
- `flatId` - Flat ID

**Response:** Array of `TenantResponse` objects

**Access:** Authenticated users

---

### View All Tenants
**Endpoint:** `GET /tenants`

**Description:** Get all tenants in the society.

**Response:** Array of `TenantResponse` objects

**Access:** Authenticated users

---

### View Active Tenants
**Endpoint:** `GET /tenants/active`

**Description:** Get all currently active tenants.

**Response:** Array of `TenantResponse` objects

**Access:** Authenticated users

---

### Update Tenant
**Endpoint:** `PUT /tenants/{id}`

**Description:** Update tenant information.

**Path Parameters:**
- `id` - Tenant ID

**Request Body:** `TenantRequest` object

**Response:** Updated `TenantResponse` object

**Access:** Authenticated users

---

### Deactivate Tenant
**Endpoint:** `PATCH /tenants/{id}/deactivate`

**Description:** Mark a tenant as inactive (when they move out).

**Path Parameters:**
- `id` - Tenant ID

**Response:** Updated `TenantResponse` object

**Access:** Authenticated users

---

### Delete Tenant
**Endpoint:** `DELETE /tenants/{id}`

**Description:** Remove a tenant record.

**Path Parameters:**
- `id` - Tenant ID

**Response:** 204 No Content

**Access:** Authenticated users

---

## Flats

Members can view information about flats in the society.

### View All Flats
**Endpoint:** `GET /flats`

**Description:** Get all flats in the society.

**Response:** Array of `FlatResponse` objects

**Access:** Authenticated users

---

### View Society's Flats
**Endpoint:** `GET /flats/society/{societyId}`

**Description:** Get all flats in a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `FlatResponse` objects

**Access:** Authenticated users

---

### View Flat Details
**Endpoint:** `GET /flats/{id}`

**Description:** Get details of a specific flat.

**Path Parameters:**
- `id` - Flat ID

**Response:** `FlatResponse` object with flat number, floor, area, owner details, etc.

**Access:** Authenticated users

---

## Banners

Members can view promotional banners and announcements displayed in the society app.

### View Banner Details
**Endpoint:** `GET /banners/{id}`

**Description:** Get details of a specific banner.

**Path Parameters:**
- `id` - Banner ID

**Response:** `BannerResponse` object

**Access:** Authenticated users

---

### View Society Banners
**Endpoint:** `GET /banners/society/{societyId}`

**Description:** Get all banners for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `BannerResponse` objects

**Access:** Authenticated users

---

### View Active Banners
**Endpoint:** `GET /banners/active/{societyId}`

**Description:** Get all currently active banners for a society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of active `BannerResponse` objects

**Access:** Authenticated users

---

### View All Banners
**Endpoint:** `GET /banners`

**Description:** Get all banners.

**Response:** Array of `BannerResponse` objects

**Access:** Authenticated users

---

## Emergency Contacts

Members can view emergency contact information for the society.

### View Contact Details
**Endpoint:** `GET /emergency-contacts/{id}`

**Description:** Get details of a specific emergency contact.

**Path Parameters:**
- `id` - Contact ID

**Response:** `EmergencyContactResponse` object

**Access:** Authenticated users

---

### View Society Contacts
**Endpoint:** `GET /emergency-contacts/society/{societyId}`

**Description:** Get all emergency contacts for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `EmergencyContactResponse` objects

**Access:** Authenticated users

---

### View Contacts by Type
**Endpoint:** `GET /emergency-contacts/type/{contactType}`

**Description:** Filter emergency contacts by type.

**Path Parameters:**
- `contactType` - Type of contact (e.g., POLICE, FIRE, HOSPITAL, AMBULANCE)

**Response:** Array of `EmergencyContactResponse` objects

**Access:** Authenticated users

---

### View All Contacts
**Endpoint:** `GET /emergency-contacts`

**Description:** Get all emergency contacts.

**Response:** Array of `EmergencyContactResponse` objects

**Access:** Authenticated users

---

## Transactions

Members can view financial transactions for their society.

### View Transaction Details
**Endpoint:** `GET /transactions/{id}`

**Description:** Get details of a specific transaction.

**Path Parameters:**
- `id` - Transaction ID

**Response:** `TransactionResponse` object

**Access:** Authenticated users

---

### View Society Transactions
**Endpoint:** `GET /transactions/society/{societyId}`

**Description:** Get all transactions for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `TransactionResponse` objects

**Access:** Authenticated users

---

### View Transactions by Type
**Endpoint:** `GET /transactions/type/{transactionType}`

**Description:** Filter transactions by type.

**Path Parameters:**
- `transactionType` - Type: `INCOME`, `EXPENSE`

**Response:** Array of `TransactionResponse` objects

**Access:** Authenticated users

---

### View Transactions by Payment Mode
**Endpoint:** `GET /transactions/payment-mode/{paymentMode}`

**Description:** Filter transactions by payment method.

**Path Parameters:**
- `paymentMode` - Payment mode: `CASH`, `ONLINE`, `CHEQUE`, `UPI`

**Response:** Array of `TransactionResponse` objects

**Access:** Authenticated users

---

### View Transactions by Date Range
**Endpoint:** `GET /transactions/date-range/{societyId}`

**Description:** Get transactions within a specific date range.

**Path Parameters:**
- `societyId` - Society ID

**Query Parameters:**
- `start` - Start date (ISO format: YYYY-MM-DD)
- `end` - End date (ISO format: YYYY-MM-DD)

**Response:** Array of `TransactionResponse` objects

**Access:** Authenticated users

---

### View All Transactions
**Endpoint:** `GET /transactions`

**Description:** Get all transactions.

**Response:** Array of `TransactionResponse` objects

**Access:** Authenticated users

---

### View Financial Summary
**Endpoint:** `GET /transactions/summary/{societyId}`

**Description:** Get financial summary for a society (total income, expense, balance).

**Path Parameters:**
- `societyId` - Society ID

**Response:**
```json
{
  "totalIncome": "BigDecimal",
  "totalExpense": "BigDecimal",
  "balance": "BigDecimal"
}
```

**Access:** Authenticated users

---

### View Summary by Category
**Endpoint:** `GET /transactions/summary/{societyId}/by-category`

**Description:** Get financial summary grouped by category.

**Path Parameters:**
- `societyId` - Society ID

**Query Parameters:**
- `start` - Start date (ISO format: YYYY-MM-DD)
- `end` - End date (ISO format: YYYY-MM-DD)

**Response:** Map of category names to amounts

**Access:** Authenticated users

---

## Tickets

Members can create and track support tickets for various issues.

### Create Ticket
**Endpoint:** `POST /tickets`

**Description:** Create a new support ticket.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "ticketType": "string",
  "priority": "LOW | MEDIUM | HIGH",
  "societyId": "long",
  "raisedById": "long"
}
```

**Response:** `TicketResponse` object

**Access:** Authenticated users

---

### View Ticket Details
**Endpoint:** `GET /tickets/{id}`

**Description:** Get details of a specific ticket.

**Path Parameters:**
- `id` - Ticket ID

**Response:** `TicketResponse` object

**Access:** Authenticated users

---

### View Society Tickets
**Endpoint:** `GET /tickets/society/{societyId}`

**Description:** Get all tickets for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `TicketResponse` objects

**Access:** Authenticated users

---

### View Tickets Raised by User
**Endpoint:** `GET /tickets/raised-by/{userId}`

**Description:** Get all tickets created by a specific user.

**Path Parameters:**
- `userId` - User ID

**Response:** Array of `TicketResponse` objects

**Access:** Authenticated users

---

### View Assigned Tickets
**Endpoint:** `GET /tickets/assigned-to/{userId}`

**Description:** Get all tickets assigned to a specific user.

**Path Parameters:**
- `userId` - User ID

**Response:** Array of `TicketResponse` objects

**Access:** Authenticated users

---

### View Tickets by Status
**Endpoint:** `GET /tickets/status/{status}`

**Description:** Filter tickets by status.

**Path Parameters:**
- `status` - Status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

**Response:** Array of `TicketResponse` objects

**Access:** Authenticated users

---

### View All Tickets
**Endpoint:** `GET /tickets`

**Description:** Get all tickets.

**Response:** Array of `TicketResponse` objects

**Access:** Authenticated users

---

### Update Ticket
**Endpoint:** `PUT /tickets/{id}`

**Description:** Update ticket information.

**Path Parameters:**
- `id` - Ticket ID

**Request Body:** `TicketRequest` object

**Response:** Updated `TicketResponse` object

**Access:** Authenticated users

---

### Update Ticket Status
**Endpoint:** `PATCH /tickets/{id}/status`

**Description:** Update the status and resolution of a ticket.

**Path Parameters:**
- `id` - Ticket ID

**Query Parameters:**
- `status` - New status
- `resolution` - Optional resolution text

**Response:** Updated `TicketResponse` object

**Access:** Authenticated users

---

### Assign Ticket
**Endpoint:** `PATCH /tickets/{id}/assign`

**Description:** Assign a ticket to a user.

**Path Parameters:**
- `id` - Ticket ID

**Query Parameters:**
- `assignedToId` - User ID to assign the ticket to

**Response:** Updated `TicketResponse` object

**Access:** Authenticated users

---

### Delete Ticket
**Endpoint:** `DELETE /tickets/{id}`

**Description:** Delete a ticket.

**Path Parameters:**
- `id` - Ticket ID

**Response:** 204 No Content

**Access:** Authenticated users

---

## Notification Preferences

Members can manage their notification settings.

### View Notification Preferences
**Endpoint:** `GET /notification-preferences/{userId}`

**Description:** Get notification preferences for a user.

**Path Parameters:**
- `userId` - User ID

**Response:** `NotificationPreferenceResponse` object with email/SMS preferences

**Access:** Authenticated users

---

### Update Notification Preferences
**Endpoint:** `PUT /notification-preferences/{userId}`

**Description:** Update notification preferences.

**Path Parameters:**
- `userId` - User ID

**Request Body:**
```json
{
  "emailNotifications": "boolean",
  "smsNotifications": "boolean",
  "pushNotifications": "boolean"
}
```

**Response:** Updated `NotificationPreferenceResponse` object

**Access:** Authenticated users

---

## Vendors (View Only)

Members can view vendor information but cannot create or modify vendors.

### View Vendor Details
**Endpoint:** `GET /vendors/{id}`

**Description:** Get details of a specific vendor.

**Path Parameters:**
- `id` - Vendor ID

**Response:** `VendorResponse` object

**Access:** Authenticated users

---

### View Society Vendors
**Endpoint:** `GET /vendors/society/{societyId}`

**Description:** Get all vendors for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `VendorResponse` objects

**Access:** Authenticated users

---

### View Common Vendors
**Endpoint:** `GET /vendors/common`

**Description:** Get vendors available across multiple societies.

**Response:** Array of `VendorResponse` objects

**Access:** Authenticated users

---

### View Vendors by Service Type
**Endpoint:** `GET /vendors/service-type/{serviceType}`

**Description:** Filter vendors by service type.

**Path Parameters:**
- `serviceType` - Service type (e.g., PLUMBER, ELECTRICIAN, CARPENTER)

**Response:** Array of `VendorResponse` objects

**Access:** Authenticated users

---

### View All Vendors
**Endpoint:** `GET /vendors`

**Description:** Get all vendors.

**Response:** Array of `VendorResponse` objects

**Access:** Authenticated users

---

## Document Templates (View Only)

Members can view and generate documents from templates.

### View Template Details
**Endpoint:** `GET /document-templates/{id}`

**Description:** Get details of a specific document template.

**Path Parameters:**
- `id` - Template ID

**Response:** `DocumentTemplateResponse` object

**Access:** Authenticated users

---

### View Templates by Type
**Endpoint:** `GET /document-templates/type/{templateType}`

**Description:** Filter templates by type.

**Path Parameters:**
- `templateType` - Template type (e.g., NOC, AGREEMENT, RECEIPT)

**Response:** Array of `DocumentTemplateResponse` objects

**Access:** Authenticated users

---

### View All Templates
**Endpoint:** `GET /document-templates`

**Description:** Get all document templates.

**Response:** Array of `DocumentTemplateResponse` objects

**Access:** Authenticated users

---

### Generate Document
**Endpoint:** `POST /document-templates/{id}/generate`

**Description:** Generate a document from a template with provided data.

**Path Parameters:**
- `id` - Template ID

**Request Body:** Map of placeholder keys to values
```json
{
  "name": "John Doe",
  "flatNumber": "A-101",
  "date": "2024-01-30",
  "...": "..."
}
```

**Response:** Generated document as string

**Access:** Authenticated users

---

## Contracts (View Only)

Members can view contracts but cannot create or modify them.

### View Contract Details
**Endpoint:** `GET /contracts/{id}`

**Description:** Get details of a specific contract.

**Path Parameters:**
- `id` - Contract ID

**Response:** `ContractResponse` object

**Access:** Authenticated users

---

### View Society Contracts
**Endpoint:** `GET /contracts/society/{societyId}`

**Description:** Get all contracts for a specific society.

**Path Parameters:**
- `societyId` - Society ID

**Response:** Array of `ContractResponse` objects

**Access:** Authenticated users

---

### View Contracts by Type
**Endpoint:** `GET /contracts/type/{contractType}`

**Description:** Filter contracts by type.

**Path Parameters:**
- `contractType` - Contract type (e.g., MAINTENANCE, SERVICE, SUPPLY)

**Response:** Array of `ContractResponse` objects

**Access:** Authenticated users

---

### View Expiring Contracts
**Endpoint:** `GET /contracts/expiring/{societyId}`

**Description:** Get contracts that are expiring soon.

**Path Parameters:**
- `societyId` - Society ID

**Query Parameters:**
- `days` - Number of days to look ahead (default: 30)

**Response:** Array of `ContractResponse` objects

**Access:** Authenticated users

---

### View All Contracts
**Endpoint:** `GET /contracts`

**Description:** Get all contracts.

**Response:** Array of `ContractResponse` objects

**Access:** Authenticated users

---

## Common Response Codes

- **200 OK** - Successful GET/PUT/PATCH request
- **201 Created** - Successful POST request
- **204 No Content** - Successful DELETE request
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - User doesn't have permission for this action
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Authentication

Most endpoints require authentication. Include the JWT token in the request header:

```
Authorization: Bearer <your-jwt-token>
```

The token is obtained from the `/auth/login` endpoint after successful authentication.

---

## Notes

- All date parameters should be in ISO 8601 format (YYYY-MM-DD)
- All endpoints return JSON responses unless otherwise specified
- Query parameters like `userId` are often required for authorization checks
- Members can typically only access data related to their own society
- Some endpoints may have additional business logic restrictions based on the user's relationship to the data (e.g., only viewing their own flat's information)
