# Setup Guide

## Prerequisites
- Java 21
- Node.js 18+ and npm
- PostgreSQL 16
- Maven Wrapper (already in repo)
- Optional: Android Studio, Xcode

## 1. Database
Create database `society_db` in PostgreSQL.

If needed, apply schema:
```sql
-- run from psql or your DB client
\i database/schema.sql
```

## 2. Backend Environment Variables
Use `backend/ENV_SETUP.md` for full details.

Minimum required values:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `APP_FRONTEND_URL`

## 3. Run Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Backend default URL: `http://localhost:8080`

## 4. Run Frontend
```powershell
cd frontend
npm install
npm run dev
```
Frontend default URL: `http://localhost:5173`

## 5. Mobile Apps (Optional)
- Android: see `android-app/README.md`
- iOS: see `ios-app/README.md`

## 6. Build Validation
```powershell
cd frontend; npm run build
cd ../backend; .\mvnw.cmd -DskipTests compile
```
