# Testing and Validation

## Build Gates
```powershell
cd frontend; npm run build
cd ../backend; .\mvnw.cmd -DskipTests compile
```

## Backend Tests
```powershell
cd backend
.\mvnw.cmd test
```

## Smoke Scripts
```powershell
cd Test
.\focused-role-smoke.ps1
.\test-endpoints.ps1
node test-frontend-api.mjs
```

## Scoped Mode Regression Checklist
1. Login as `MASTER_ADMIN`.
2. Open `/?society=<id>`.
3. Verify dashboard shows society-scoped operational metrics (not platform totals).
4. Verify `/unit-management?society=<id>` allows expected add/edit user actions.
5. Verify finance/vendor pages do not show cross-society records.
6. Try URL tampering with another society id as non-master user and confirm reset/denial.

## Security Validation
- Verify unauthorized `GET/PUT /notification-preferences/{otherUserId}` returns 403 for non-master users.
- Verify master can access own and required admin-target user preferences.

## CI Recommendation
Automate at minimum:
- Frontend build
- Backend compile + tests
- Focused role smoke test against ephemeral environment
