# Society Management System - Backend API

## Overview
Spring Boot 3.5.10 REST API for Society Management System with role-based access control.

## Tech Stack
- Java 21
- Spring Boot 3.5.10
- PostgreSQL
- Lombok
- Jakarta Validation
- BCrypt Password Encoding

## Roles
- **MASTER_ADMIN** - Full system access
- **COMMITTEE** - Society management access  
- **EMPLOYEE** - Task/ticket management access
- **MEMBER** - Member-level access
- **VISITOR** - Read-only access

## Running the Application
```bash
./mvnw spring-boot:run
```

Server runs on `http://localhost:8080`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Societies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/societies` | Get all societies |
| GET | `/societies/{id}` | Get society by ID |
| POST | `/societies?userId=` | Create society |
| PUT | `/societies/{id}?userId=` | Update society |
| DELETE | `/societies/{id}?userId=` | Delete society |

### Flats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flats` | Get all flats |
| GET | `/flats/{id}` | Get flat by ID |
| GET | `/flats/society/{societyId}` | Get flats by society |
| POST | `/flats?userId=` | Create flat |
| PUT | `/flats/{id}?userId=` | Update flat |
| DELETE | `/flats/{id}?userId=` | Delete flat |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles` | Get all vehicles |
| GET | `/vehicles/{id}` | Get vehicle by ID |
| GET | `/vehicles/flat/{flatId}` | Get vehicles by flat |
| POST | `/vehicles?userId=` | Create vehicle |
| PUT | `/vehicles/{id}?userId=` | Update vehicle |
| DELETE | `/vehicles/{id}?userId=` | Delete vehicle |

### Tenants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants` | Get all tenants |
| GET | `/tenants/{id}` | Get tenant by ID |
| GET | `/tenants/flat/{flatId}` | Get tenants by flat |
| GET | `/tenants/active` | Get active tenants |
| POST | `/tenants?userId=` | Create tenant |
| PUT | `/tenants/{id}?userId=` | Update tenant |
| PATCH | `/tenants/{id}/deactivate?userId=` | Deactivate tenant |
| DELETE | `/tenants/{id}?userId=` | Delete tenant |

### Tickets (Complaints/Requests/Issues)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | Get all tickets |
| GET | `/tickets/{id}` | Get ticket by ID |
| GET | `/tickets/society/{societyId}` | Get tickets by society |
| GET | `/tickets/raised-by/{userId}` | Get tickets raised by user |
| GET | `/tickets/assigned-to/{userId}` | Get tickets assigned to user |
| GET | `/tickets/status/{status}` | Get tickets by status |
| POST | `/tickets?userId=` | Create ticket |
| PUT | `/tickets/{id}?userId=` | Update ticket |
| PATCH | `/tickets/{id}/status?status=&resolution=&userId=` | Update ticket status |
| PATCH | `/tickets/{id}/assign?assignedToId=&userId=` | Assign ticket |
| DELETE | `/tickets/{id}?userId=` | Delete ticket |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/complaints` | Get all complaints |
| GET | `/complaints/{id}` | Get complaint by ID |
| POST | `/complaints?userId=` | Create complaint |
| PATCH | `/complaints/{id}/status?status=&userId=` | Update status |
| DELETE | `/complaints/{id}?userId=` | Delete complaint |

### Notices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notices` | Get all notices |
| GET | `/notices/{id}` | Get notice by ID |
| GET | `/notices/active` | Get active notices |
| POST | `/notices?userId=` | Create notice |
| PUT | `/notices/{id}?userId=` | Update notice |
| PATCH | `/notices/{id}/deactivate?userId=` | Deactivate notice |
| DELETE | `/notices/{id}?userId=` | Delete notice |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendors` | Get all vendors |
| GET | `/vendors/{id}` | Get vendor by ID |
| GET | `/vendors/society/{societyId}` | Get vendors by society |
| GET | `/vendors/common` | Get common vendors |
| GET | `/vendors/service-type/{type}` | Get by service type |
| POST | `/vendors?userId=` | Create vendor |
| PUT | `/vendors/{id}?userId=` | Update vendor |
| PATCH | `/vendors/{id}/deactivate?userId=` | Deactivate vendor |
| DELETE | `/vendors/{id}?userId=` | Delete vendor |

### Vendor Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendor-bills` | Get all bills |
| GET | `/vendor-bills/{id}` | Get bill by ID |
| GET | `/vendor-bills/vendor/{vendorId}` | Get bills by vendor |
| GET | `/vendor-bills/society/{societyId}` | Get bills by society |
| GET | `/vendor-bills/status/{status}` | Get bills by status |
| GET | `/vendor-bills/pending/{societyId}` | Get pending bills |
| POST | `/vendor-bills?userId=` | Create bill |
| PUT | `/vendor-bills/{id}?userId=` | Update bill |
| POST | `/vendor-bills/{id}/payment?amount=&paymentMode=&userId=` | Record payment |
| DELETE | `/vendor-bills/{id}?userId=` | Delete bill |

### Contracts (AMC/Insurance/etc.)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contracts` | Get all contracts |
| GET | `/contracts/{id}` | Get contract by ID |
| GET | `/contracts/society/{societyId}` | Get contracts by society |
| GET | `/contracts/type/{contractType}` | Get contracts by type |
| GET | `/contracts/expiring/{societyId}?days=` | Get expiring soon |
| POST | `/contracts?userId=` | Create contract |
| PUT | `/contracts/{id}?userId=` | Update contract |
| PATCH | `/contracts/{id}/deactivate?userId=` | Deactivate contract |
| DELETE | `/contracts/{id}?userId=` | Delete contract |

### Maintenance Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/maintenance-bills` | Get all bills |
| GET | `/maintenance-bills/{id}` | Get bill by ID |
| GET | `/maintenance-bills/flat/{flatId}` | Get bills by flat |
| GET | `/maintenance-bills/month/{billMonth}` | Get bills by month |
| GET | `/maintenance-bills/status/{status}` | Get bills by status |
| GET | `/maintenance-bills/pending` | Get pending bills |
| POST | `/maintenance-bills?userId=` | Create bill |
| PUT | `/maintenance-bills/{id}?userId=` | Update bill |
| POST | `/maintenance-bills/{id}/payment?amount=&paymentMode=&userId=` | Record payment |
| POST | `/maintenance-bills/generate?societyId=&billMonth=&amount=&userId=` | Generate bills for society |
| DELETE | `/maintenance-bills/{id}?userId=` | Delete bill |

### Transactions (Income/Expense)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | Get all transactions |
| GET | `/transactions/{id}` | Get transaction by ID |
| GET | `/transactions/society/{societyId}` | Get by society |
| GET | `/transactions/type/{type}` | Get by type (INCOME/EXPENSE) |
| GET | `/transactions/payment-mode/{mode}` | Get by payment mode |
| GET | `/transactions/date-range/{societyId}?start=&end=` | Get by date range |
| GET | `/transactions/summary/{societyId}` | Get summary (income/expense/balance) |
| GET | `/transactions/summary/{societyId}/by-category?start=&end=` | Get by category |
| POST | `/transactions?userId=` | Create transaction |
| PUT | `/transactions/{id}?userId=` | Update transaction |
| DELETE | `/transactions/{id}?userId=` | Delete transaction |

### Emergency Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/emergency-contacts` | Get all contacts |
| GET | `/emergency-contacts/{id}` | Get contact by ID |
| GET | `/emergency-contacts/society/{societyId}` | Get by society |
| GET | `/emergency-contacts/type/{contactType}` | Get by type |
| POST | `/emergency-contacts?userId=` | Create contact |
| PUT | `/emergency-contacts/{id}?userId=` | Update contact |
| PATCH | `/emergency-contacts/{id}/deactivate?userId=` | Deactivate |
| DELETE | `/emergency-contacts/{id}?userId=` | Delete contact |

### Document Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/document-templates` | Get all templates |
| GET | `/document-templates/{id}` | Get template by ID |
| GET | `/document-templates/type/{templateType}` | Get by type |
| POST | `/document-templates?userId=` | Create template |
| PUT | `/document-templates/{id}?userId=` | Update template |
| PATCH | `/document-templates/{id}/deactivate?userId=` | Deactivate |
| DELETE | `/document-templates/{id}?userId=` | Delete template |
| POST | `/document-templates/{id}/generate` | Generate document from template |

### Banners
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/banners` | Get all banners |
| GET | `/banners/{id}` | Get banner by ID |
| GET | `/banners/society/{societyId}` | Get banners by society |
| GET | `/banners/active/{societyId}` | Get active banners |
| POST | `/banners?userId=` | Create banner |
| PUT | `/banners/{id}?userId=` | Update banner |
| PATCH | `/banners/{id}/deactivate?userId=` | Deactivate banner |
| DELETE | `/banners/{id}?userId=` | Delete banner |

## Role-Based Access Control

### 🏛️ Housing Society Hierarchy (Real-World Structure)

| Role | Authority Level | Responsibilities |
|------|-----------------|------------------|
| **CHAIRMAN** | Highest Committee Authority | Presides over meetings, final veto/consent power, primary bank signatory |
| **SECRETARY** | Administrative Head | Manages documentation, records, day-to-day operations |
| **TREASURER** | Financial Head | Handles finances, billing, payments, accounts |

### 🔐 STRICT Hierarchy Rules

1. **Parent creates DIRECT CHILDREN only** - No skip-level creation
2. **Read access flows DOWNWARD** - Parents can read all descendants
3. **Update/Delete LIMITED to direct children** - No skip-level modification
4. **EXCEPTION: SOCIETY_ADMIN has FULL CRUD** - Can manage all roles below

### User CRUD Permissions

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

### Feature Access Matrix

All write operations require `userId` parameter for role verification:

| Feature | MASTER_ADMIN | SOCIETY_ADMIN | CHAIRMAN | SECRETARY | TREASURER | COMMITTEE | EMPLOYEE | MEMBER |
|---------|:------------:|:-------------:|:--------:|:---------:|:---------:|:---------:|:--------:|:------:|
| Manage Societies | ✓ | - | - | - | - | - | - | - |
| Manage Users | Direct child | ALL below | Direct child | Direct child | Direct child | Direct child | Direct child | Direct child |
| Manage Flats | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Manage Vehicles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage Tenants | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage Tickets | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign Tickets | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Manage Vendors | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Manage Billing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Manage Contracts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Manage Templates | ✓ | - | - | - | - | - | - | - |
| Manage Banners | ✓ | - | - | - | - | - | - | - |

## Database Configuration

Configure in `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/society_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
```
