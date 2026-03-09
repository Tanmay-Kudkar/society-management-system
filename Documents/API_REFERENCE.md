# API Reference (Engineering View)

Base URL: `http://localhost:8080`

## Auth
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Societies and Users
- `GET /societies`
- `GET /societies/{id}`
- `GET /users`
- `GET /users/society/{societyId}`

## Unit Domain
- `GET /flats/society/{societyId}`
- `GET /api/wings/society/{societyId}`
- `GET /vehicles`
- `GET /tenants`

## Finance
- `GET /transactions`
- `GET /transactions/society/{societyId}`
- `GET /maintenance-bills`
- `GET /api/reports/dashboard/{societyId}`

## Vendors and Contracts
- `GET /vendors`
- `GET /vendors/society/{societyId}`
- `GET /vendor-bills`
- `GET /vendor-bills/society/{societyId}`
- `GET /contracts`
- `GET /contracts/society/{societyId}`

## Notifications
- `GET /notices/society/{societyId}`
- `GET /notification-preferences/{userId}`
- `PUT /notification-preferences/{userId}`

## Security Notes
- JWT required for protected routes.
- Society-bound endpoints must pass server-side scope checks.
- In browser flows, avoid trusting query params without backend validation.

For exhaustive endpoint payloads and responses, refer to backend controller classes under `backend/src/main/java/com/society/backend/**/controller`.
