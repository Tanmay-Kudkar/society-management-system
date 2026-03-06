# Phase 1 Move List (Auth + User First)

This is the first executable refactor phase from `ARCHITECTURE_REFACTOR_PLAN.md`.

## Locked Decisions For Start
- `staff` and `staffshift` will be owned by `society` later (not in Phase 1).
- `approval` stays under `ticket` for now (no split in Phase 1).
- Keep global `entity/` package during transition; do not move entities to module-local `model/` yet.

These defaults minimize risk and avoid DB/schema and API contract changes in the first pass.

---

## Scope of Phase 1
Only consolidate identity and user management boundaries.

In scope:
- `auth` module hardening
- `user` module cleanup
- Security config ownership clarity (`auth` owns JWT/authn internals)

Out of scope:
- Any endpoint URL changes
- Entity relocation
- DTO redesign
- Non-auth modules (`society`, `flat`, `ticket`, `finance`, etc.)

---

## Current Inventory (Verified)

### Controllers
- `controller/auth/AuthController.java`
- `controller/user/UserController.java`

### Services
- `service/auth/AuthService.java`
- `service/auth/AuthServiceImpl.java`
- `service/user/UserService.java`
- `service/user/UserServiceImpl.java`
- `service/user/BulkUserImportService.java`

### Repositories
- `repository/user/UserRepository.java`

### DTOs
- `dto/auth/ChangePasswordRequest.java`
- `dto/auth/ForgotPasswordRequest.java`
- `dto/auth/LoginRequest.java`
- `dto/auth/LoginResponse.java`
- `dto/auth/RegisterRequest.java`
- `dto/auth/ResetPasswordRequest.java`
- `dto/user/BulkCreateUsersResponse.java`
- `dto/user/BulkUserImportRequest.java`
- `dto/user/BulkUserImportResponse.java`
- `dto/user/UserImportRow.java`
- `dto/user/UserRequest.java`
- `dto/user/UserResponse.java`

### Security/Auth Infrastructure
- `security/CustomUserDetails.java`
- `security/CustomUserDetailsService.java`
- `security/JwtAuthenticationEntryPoint.java`
- `security/JwtAuthenticationFilter.java`
- `security/JwtUtils.java`
- `security/RolePermissions.java`
- `config/SecurityConfig.java`

### Identity Entities (No Move in Phase 1)
- `entity/User.java`
- `entity/Role.java`
- `entity/PasswordResetToken.java`

---

## Target Placement After Phase 1

Keep top-level package as `com.society.backend` for now, but enforce ownership:

- Auth-owned:
  - `controller/auth/**`
  - `service/auth/**`
  - `dto/auth/**`
  - JWT/authn classes (`security/Jwt*`, `security/CustomUserDetails*`, auth parts of `SecurityConfig`)
- User-owned:
  - `controller/user/**`
  - `service/user/**`
  - `dto/user/**`
  - `repository/user/UserRepository.java`
- Shared security authorization map:
  - `security/RolePermissions.java` (or move later to `auth/authorization` in Phase 2)

---

## Exact Execution Checklist

1. Create package placeholders for final direction (no behavior change):
- `com.society.backend.auth.controller`
- `com.society.backend.auth.service`
- `com.society.backend.auth.dto`
- `com.society.backend.auth.security`
- `com.society.backend.user.controller`
- `com.society.backend.user.service`
- `com.society.backend.user.dto`
- `com.society.backend.user.repository`

2. Move auth controller/service/dto classes:
- Move `controller/auth/AuthController.java` -> `auth/controller/AuthController.java`
- Move `service/auth/AuthService.java` -> `auth/service/AuthService.java`
- Move `service/auth/AuthServiceImpl.java` -> `auth/service/AuthServiceImpl.java`
- Move all files from `dto/auth/*` -> `auth/dto/*`

3. Move user controller/service/dto/repository classes:
- Move `controller/user/UserController.java` -> `user/controller/UserController.java`
- Move `service/user/UserService.java` -> `user/service/UserService.java`
- Move `service/user/UserServiceImpl.java` -> `user/service/UserServiceImpl.java`
- Move `service/user/BulkUserImportService.java` -> `user/service/BulkUserImportService.java`
- Move all files from `dto/user/*` -> `user/dto/*`
- Move `repository/user/UserRepository.java` -> `user/repository/UserRepository.java`

4. Move auth security internals:
- Move `security/CustomUserDetails.java` -> `auth/security/CustomUserDetails.java`
- Move `security/CustomUserDetailsService.java` -> `auth/security/CustomUserDetailsService.java`
- Move `security/JwtAuthenticationEntryPoint.java` -> `auth/security/JwtAuthenticationEntryPoint.java`
- Move `security/JwtAuthenticationFilter.java` -> `auth/security/JwtAuthenticationFilter.java`
- Move `security/JwtUtils.java` -> `auth/security/JwtUtils.java`
- Keep `security/RolePermissions.java` in place for now

5. Update imports and package declarations via IDE refactor move (not manual copy-paste).

6. Keep API paths unchanged:
- Do not change `@RequestMapping` values in `AuthController` and `UserController`.

7. Compile and run tests:
- `backend/mvnw.cmd -q -DskipTests compile`
- `backend/mvnw.cmd test`

8. Run authorization smoke checks:
- Login flow still issues JWT
- Protected endpoints still require authentication
- Role-gated endpoints still enforce role matrix

9. Delete empty old folders only after green compile/tests:
- `controller/auth`, `controller/user`
- `service/auth`, `service/user`
- `dto/auth`, `dto/user`
- `repository/user` (if empty)
- `security` (only if no remaining classes; likely keep due to `RolePermissions`)

---

## Done Criteria (Phase 1)
- No endpoint path changes.
- JWT auth still works end-to-end.
- Role checks unchanged for all existing roles:
  - `MASTER_ADMIN`, `SOCIETY_ADMIN`, `CHAIRMAN`, `SECRETARY`, `TREASURER`, `COMMITTEE`, `EMPLOYEE`, `MEMBER`, `TENANT`, `VENDOR`, `VISITOR`
- All moved classes compile with updated imports.
- Old auth/user folders removed only when empty.

---

## Immediate Next Phase (Phase 2 Preview)
- Move `society` + `flat` into new module packages.
- Pull `PasswordResetToken` repository ownership into `auth` if currently coupled under user repository package.
- Decide whether to move `RolePermissions` to `auth/authorization`.
