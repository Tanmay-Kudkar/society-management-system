# Architecture Deep-Dive

## High-Level Topology
- Admin web app (`frontend`) calls backend REST APIs through shared client (`api/index.js`).
- Backend (`backend`) is Spring Boot + Spring Security JWT + JPA/Hibernate.
- Data persisted in PostgreSQL.
- Native Android/iOS apps consume backend APIs.

## Frontend Design
- React + React Router + TanStack Query.
- Context providers for auth, toasts, dialogs, theme/settings.
- Route-level lazy loading and shared components.
- Scoped-society routing convention: `?society=<id>`.

## Backend Design
- Layered modules: controller -> service -> repository -> entity.
- JWT auth filter populates security context.
- Role-based access enforced by route config and service checks.
- Society scope enforcement uses central validation (`RoleService.enforceSocietyScope`) and request interceptor.

## Security Model
- RBAC with hierarchy from `MASTER_ADMIN` to resident/staff roles.
- Defense-in-depth:
1. Frontend URL guard for UX and tamper feedback.
2. Backend authorization/scope checks for actual protection.

## Data Boundaries
- All society-bound reads/writes must verify society context server-side.
- In scoped mode, platform role UI must switch to society operational behavior.

## Key Technical Risks
- Cross-society leakage when frontend calls unscoped `getAll()` endpoints.
- Inconsistent scoped mode handling across pages.
- Lazy relation access in backend response mapping if fetch strategy is wrong.
