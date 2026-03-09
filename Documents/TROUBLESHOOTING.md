# Troubleshooting

## Frontend
### Build fails with module/import errors
- Run `npm install` in `frontend`.
- Check route/page import paths after refactors.

### Scoped mode not applying
- Confirm URL contains valid `?society=<id>`.
- Verify page uses `effectiveSocietyId` in query keys and API calls.

## Backend
### 401/403 unexpectedly
- Check JWT cookie/token and role.
- Validate route-level and service-level role checks.

### Notification preferences endpoint fails
- Verify `notification_preferences` data integrity for user mapping.
- Ensure controller authorization allows only self/master access.

### Database connection errors
- Validate `DB_*` environment values.
- Confirm PostgreSQL service is running.

## Test Scripts return code 0 for all checks
- Backend likely not running or wrong base URL.
- Ensure API is reachable at `http://localhost:8080` before executing scripts.

## General Diagnostics
```powershell
# Backend health
Invoke-WebRequest http://localhost:8080/health

# Frontend build
cd frontend; npm run build

# Backend compile
cd ../backend; .\mvnw.cmd -DskipTests compile
```
