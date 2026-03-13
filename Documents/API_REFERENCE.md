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
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/payments/failure`
- `POST /api/payments/cancel`
- `POST /api/payments/{id}/request-refund?userId={userId}`
- `POST /api/payments/webhook` (public; verified via `X-Razorpay-Signature`)
- `GET /api/payments/webhook-events?limit=50` (MASTER_ADMIN only)

### Razorpay Webhook Notes
- Configure endpoint URL as `/api/payments/webhook`.
- Set webhook secret in backend env: `RAZORPAY_WEBHOOK_SECRET`.
- Recommended subscribed events: `payment.captured`, `payment.authorized`, `payment.failed`, `payment.refunded`, `refund.created`, `refund.processed`, `refund.failed`, `settlement.processed`, `settlement.failed`, `order.paid`.
- Duplicate retries are deduplicated when `X-Razorpay-Event-Id` is present.

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
