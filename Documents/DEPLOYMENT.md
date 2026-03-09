# Deployment (Render)

## Source of Truth
- `render.yaml`

## Services
1. Backend web service (`society-backend`)
2. Frontend static site (`societyhub-webapp`)
3. Managed PostgreSQL (`society-db`)

## Backend Build/Run
- Build: `./mvnw clean package -DskipTests`
- Start: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
- Health: `/actuator/health`

## Frontend Build/Publish
- Build: `npm ci ; npm run build`
- Publish directory: `dist`

## Required Environment Variables
Backend:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `MAIL_USERNAME`, `MAIL_PASSWORD`
- `APP_ADMIN_EMAIL`, `APP_FRONTEND_URL`

Frontend:
- `VITE_API_URL`

## Deployment Checklist
1. Provision DB and verify connection variables.
2. Deploy backend and wait for health check pass.
3. Deploy frontend with correct `VITE_API_URL`.
4. Run smoke tests post-deploy.
5. Validate auth, scoped mode, and billing/report endpoints.
