# Backend Setup and API Usage Guide

This guide explains how to set up and run the backend server, and how to use the register and login endpoints.

---

## 📋 Prerequisites

Before running the backend, ensure you have the following installed:

1. **Java Development Kit (JDK) 21**
   - Download from: https://www.oracle.com/java/technologies/downloads/#java21
   - Or use OpenJDK: https://adoptium.net/
   - Verify installation: `java -version`
   - **Note:** If you only have Java 17 available, see the "Alternative: Using Java 17" section below.

2. **PostgreSQL Database**
   - Download from: https://www.postgresql.org/download/
   - Version 12 or higher recommended
   - Verify installation: `psql --version`

3. **Maven** (included with the project via mvnw)
   - Verify: `./mvnw -version`

### Alternative: Using Java 17

If you don't have Java 21 and want to use Java 17 instead, modify `backend/pom.xml`:

```xml
<properties>
    <java.version>17</java.version>  <!-- Change from 21 to 17 -->
    <lombok.version>1.18.32</lombok.version>
</properties>
```

**Note:** The application should work with Java 17, but Java 21 is the officially supported version.

---

## 🗄️ Database Setup

### Step 1: Create Database

Start PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE society_db;

# Verify database was created
\l

# Exit psql
\q
```

### Step 2: Configure Database Connection

Edit the file `backend/src/main/resources/application.properties`:

```properties
# Update these values according to your PostgreSQL setup
spring.datasource.url=jdbc:postgresql://localhost:5432/society_db
spring.datasource.username=postgres
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

**Important:** Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password.

---

## 🚀 Running the Backend

### Using Maven Wrapper (Recommended)

Navigate to the backend directory and run:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:
```bash
cd backend
mvnw.cmd spring-boot:run
```

### Using Maven (if installed globally)

```bash
cd backend
mvn spring-boot:run
```

The server will start on **http://localhost:8080**

You should see output like:
```
Started BackendApplication in X.XXX seconds
```

---

## 🔐 Authentication API Usage

### Register a New User

**Endpoint:** `POST http://localhost:8080/auth/register`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "MEMBER"
}
```

**Available Roles:**
- `MASTER_ADMIN` - Platform owner with access to all societies
- `SOCIETY_ADMIN` - Society-level administrator
- `CHAIRMAN` - Head of committee
- `SECRETARY` - Society secretary
- `TREASURER` - Handles finances
- `COMMITTEE` - General committee member
- `EMPLOYEE` - Society staff (security, housekeeping, etc.)
- `MEMBER` - Flat owner/resident
- `TENANT` - Renter with limited access
- `VISITOR` - Temporary access

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "MEMBER",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00"
}
```

**Validation Rules:**
- **name**: Required, cannot be blank
- **email**: Required, must be unique, valid email format
- **password**: Required, minimum 6 characters
- **role**: Required, must be one of the valid roles listed above

---

### Login

**Endpoint:** `POST http://localhost:8080/auth/login`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "MEMBER",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer"
}
```

**Validation Rules:**
- **email**: Required, cannot be blank
- **password**: Required, cannot be blank

**Using the JWT Token:**

After successful login, use the returned token for authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token expires after 24 hours (86400000 milliseconds).

---

## 🧪 Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "MEMBER"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

### Using Postman

**Quick Start:** Import the provided Postman collection file: [`Society-Management-API.postman_collection.json`](Society-Management-API.postman_collection.json)

**Manual Setup:**

1. **Set Request Type:** POST
2. **Enter URL:** 
   - Register: `http://localhost:8080/auth/register`
   - Login: `http://localhost:8080/auth/login`
3. **Set Headers:**
   - Key: `Content-Type`
   - Value: `application/json`
4. **Set Body:**
   - Select "raw" and "JSON"
   - Paste the request body examples above
5. **Click Send**

### Using HTTPie

**Register:**
```bash
http POST http://localhost:8080/auth/register \
  name="John Doe" \
  email="john.doe@example.com" \
  password="password123" \
  role="MEMBER"
```

**Login:**
```bash
http POST http://localhost:8080/auth/login \
  email="john.doe@example.com" \
  password="password123"
```

---

## 📝 Example User Registration Scenarios

### 1. Register a Master Admin (Platform Owner)

```json
{
  "name": "Admin User",
  "email": "admin@society.com",
  "password": "admin@123",
  "role": "MASTER_ADMIN"
}
```

### 2. Register a Society Administrator

```json
{
  "name": "Society Admin",
  "email": "admin@skyview.com",
  "password": "skyview@123",
  "role": "SOCIETY_ADMIN"
}
```

### 3. Register a Committee Member

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "secure123",
  "role": "SECRETARY"
}
```

### 4. Register a Regular Member

```json
{
  "name": "Bob Wilson",
  "email": "bob.wilson@example.com",
  "password": "member123",
  "role": "MEMBER"
}
```

### 5. Register an Employee

```json
{
  "name": "Security Guard",
  "email": "guard@society.com",
  "password": "guard123",
  "role": "EMPLOYEE"
}
```

---

## ⚠️ Common Errors

### 1. Java Version Error
```
Error: release version 21 not supported
```
**Solution:** 
- Install Java 21 (see Prerequisites section)
- Or modify `pom.xml` to use Java 17 (see "Alternative: Using Java 17" section)

### 2. Database Connection Error
```
Error: Could not open JPA EntityManager for transaction
```
**Solution:** 
- Verify PostgreSQL is running
- Check database credentials in `application.properties`
- Ensure database `society_db` exists

### 3. Port Already in Use
```
Error: Web server failed to start. Port 8080 was already in use.
```
**Solution:**
- Stop other applications using port 8080
- Or change the port in `application.properties`:
  ```properties
  server.port=8081
  ```

### 4. Email Already Exists
```json
{
  "error": "Email already registered"
}
```
**Solution:** Use a different email address for registration.

### 5. Invalid Role
```json
{
  "error": "Invalid role specified"
}
```
**Solution:** Use one of the valid roles listed in the "Available Roles" section.

### 6. Password Too Short
```json
{
  "password": "Password must be at least 6 characters"
}
```
**Solution:** Ensure password is at least 6 characters long.

---

## 🔍 Verifying Backend is Running

### Health Check

Check if the backend is running:

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "UP"
}
```

Or open in browser: http://localhost:8080/health

---

## 🎯 Next Steps

After successfully registering and logging in:

1. **Save the JWT token** from the login response
2. **Use the token** in subsequent API requests by adding the header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```
3. **Explore other endpoints** as documented in the main [README.md](README.md)
4. **Create societies, flats, and other resources** using the appropriate APIs

---

## 📚 Additional Resources

- [Main Backend README](README.md) - Full API documentation
- [Main Project README](../README.md) - Project overview
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 💡 Tips

1. **Development Mode:** The backend is configured to show SQL queries in the console, which is helpful for debugging.

2. **Auto-Restart:** Use Spring Boot DevTools for automatic restart during development:
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-devtools</artifactId>
       <scope>runtime</scope>
   </dependency>
   ```

3. **Database Viewer:** Use tools like pgAdmin or DBeaver to view and manage your PostgreSQL database.

4. **API Testing:** Consider using tools like Postman, Insomnia, or Thunder Client (VS Code extension) for easier API testing.

5. **Log Files:** Check the console output for detailed error messages if something goes wrong.

---

## 📦 Postman Collection

A ready-to-use Postman collection is provided in the backend directory:
- **File:** [`Society-Management-API.postman_collection.json`](Society-Management-API.postman_collection.json)
- **How to use:**
  1. Open Postman
  2. Click "Import"
  3. Select the collection file
  4. Update the `base_url` variable if needed (default: `http://localhost:8080`)
  5. Start making requests!

The collection includes:
- Register endpoints for all user roles
- Login endpoint
- Health check endpoint

---

## 📋 Quick Reference

### Available Roles
- `MASTER_ADMIN` - Platform owner
- `SOCIETY_ADMIN` - Society administrator
- `CHAIRMAN` - Committee head
- `SECRETARY` - Society secretary
- `TREASURER` - Finance handler
- `COMMITTEE` - Committee member
- `EMPLOYEE` - Society staff
- `MEMBER` - Flat owner
- `TENANT` - Renter
- `VISITOR` - Temporary access

### API Base URL
```
http://localhost:8080
```

### Authentication Endpoints
- **Register:** `POST /auth/register`
- **Login:** `POST /auth/login`

### Health Check
- **Endpoint:** `GET /health`
- **Expected Response:** `{"status": "UP"}`

---

## 🆘 Getting Help

If you encounter issues:

1. Check the console output for error messages
2. Verify all prerequisites are installed correctly
3. Ensure PostgreSQL is running and accessible
4. Review the application.properties configuration
5. Check that the database `society_db` exists
6. Verify port 8080 is not in use by another application

For more help, create an issue in the repository with:
- Error message
- Steps to reproduce
- Your environment details (OS, Java version, PostgreSQL version)
