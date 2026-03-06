# Phase 2 Move List (Society + Flat)

This phase continues after `PHASE1_MOVE_LIST.md` and consolidates the core resident-management domain.

## Preconditions
- Phase 1 (`auth` + `user`) compiles and tests pass.
- Endpoint paths from existing controllers remain unchanged.
- Global `entity/` package is still in use (no entity relocation yet).

---

## Scope of Phase 2
In scope:
- Consolidate `society`, `societysetting`, `asset`, `staff`, `commonarea` into `society` ownership.
- Consolidate `flat`, `tenant`, `wing` and related root-level housing classes into `flat` ownership.
- Remove root-level placement for society/flat-related controllers/services/repositories/DTOs.

Out of scope:
- `ticket`, `notice`, `vendor`, `finance`, `security`, `file` module migrations.
- DB schema changes.
- API payload redesign.

---

## Current Inventory (Verified)

### Society side
Controllers:
- `controller/society/SocietyController.java`
- `controller/society/SocietySettingController.java`
- `controller/SocietyRuleController.java`

Services:
- `service/society/SocietyService.java`
- `service/society/SocietyServiceImpl.java`
- `service/societysetting/SocietySettingService.java`
- `service/societysetting/SocietySettingServiceImpl.java`
- `service/SocietyRuleService.java`
- `service/SocietyRuleServiceImpl.java`
- `service/asset/**`
- `service/staff/**`
- `service/commonarea/**`

Repositories:
- `repository/society/SocietyRepository.java`
- `repository/society/SocietySettingRepository.java`
- `repository/SocietyRuleRepository.java`
- `repository/asset/**`
- `repository/CommonAreaScheduleRepository.java`

DTOs:
- `dto/society/SocietyRequest.java`
- `dto/society/SocietyResponse.java`
- `dto/societysetting/SocietySettingRequest.java`
- `dto/societysetting/SocietySettingResponse.java`
- `dto/SocietyRuleRequest.java`
- `dto/SocietyRuleResponse.java`
- `dto/asset/**`
- `dto/staff/**`

### Flat side
Controllers:
- `controller/flat/FlatController.java`
- `controller/tenant/TenantController.java`
- `controller/WingController.java`
- `controller/MoveRecordController.java`
- `controller/PetRegistrationController.java`
- `controller/RenovationNocController.java`
- `controller/FacilityBookingController.java`
- `controller/CommonAreaScheduleController.java`

Services:
- `service/flat/FlatService.java`
- `service/flat/FlatServiceImpl.java`
- `service/flat/BulkFlatImportService.java`
- `service/tenant/TenantService.java`
- `service/tenant/TenantServiceImpl.java`
- `service/tenant/BulkTenantImportService.java`
- `service/wing/WingService.java`
- `service/wing/WingServiceImpl.java`
- `service/wing/BulkWingImportService.java`
- `service/MoveRecordService.java`
- `service/PetRegistrationService.java`
- `service/PetRegistrationServiceImpl.java`
- `service/RenovationNocService.java`
- `service/FacilityBookingService.java`

Repositories:
- `repository/flat/FlatRepository.java`
- `repository/tenant/TenantRepository.java`
- `repository/WingRepository.java`
- `repository/MoveRecordRepository.java`
- `repository/PetRegistrationRepository.java`
- `repository/RenovationNocRepository.java`
- `repository/FacilityBookingRepository.java`

DTOs:
- `dto/flat/FlatRequest.java`
- `dto/flat/FlatResponse.java`
- `dto/flat/FlatImportRow.java`
- `dto/flat/BulkFlatImportResponse.java`
- `dto/tenant/TenantRequest.java`
- `dto/tenant/TenantResponse.java`
- `dto/tenant/TenantImportRow.java`
- `dto/tenant/BulkTenantImportResponse.java`
- `dto/wing/WingRequest.java`
- `dto/wing/WingResponse.java`
- `dto/wing/WingImportRow.java`
- `dto/wing/BulkWingImportResponse.java`
- `dto/PetRegistrationRequest.java`
- `dto/PetRegistrationResponse.java`

---

## Target Placement After Phase 2

### Society-owned package namespace
- `com.society.backend.society.controller`
- `com.society.backend.society.service`
- `com.society.backend.society.repository`
- `com.society.backend.society.dto`

### Flat-owned package namespace
- `com.society.backend.flat.controller`
- `com.society.backend.flat.service`
- `com.society.backend.flat.repository`
- `com.society.backend.flat.dto`

---

## Exact Execution Checklist

1. Create society package placeholders:
- `society/controller`
- `society/service`
- `society/repository`
- `society/dto`

2. Move society controllers:
- `controller/society/SocietyController.java` -> `society/controller/SocietyController.java`
- `controller/society/SocietySettingController.java` -> `society/controller/SocietySettingController.java`
- `controller/SocietyRuleController.java` -> `society/controller/SocietyRuleController.java`

3. Move society services:
- `service/society/*` -> `society/service/*`
- `service/societysetting/*` -> `society/service/*`
- `service/SocietyRuleService.java` -> `society/service/SocietyRuleService.java`
- `service/SocietyRuleServiceImpl.java` -> `society/service/SocietyRuleServiceImpl.java`
- `service/asset/**` -> `society/service/**`
- `service/staff/**` -> `society/service/**`
- `service/commonarea/**` -> `society/service/**`

4. Move society repositories:
- `repository/society/SocietyRepository.java` -> `society/repository/SocietyRepository.java`
- `repository/society/SocietySettingRepository.java` -> `society/repository/SocietySettingRepository.java`
- `repository/SocietyRuleRepository.java` -> `society/repository/SocietyRuleRepository.java`
- `repository/asset/**` -> `society/repository/**`
- `repository/CommonAreaScheduleRepository.java` -> `society/repository/CommonAreaScheduleRepository.java`

5. Move society DTOs:
- `dto/society/*` -> `society/dto/*`
- `dto/societysetting/*` -> `society/dto/*`
- `dto/SocietyRuleRequest.java` -> `society/dto/SocietyRuleRequest.java`
- `dto/SocietyRuleResponse.java` -> `society/dto/SocietyRuleResponse.java`
- `dto/asset/**` -> `society/dto/**`
- `dto/staff/**` -> `society/dto/**`

6. Create flat package placeholders:
- `flat/controller`
- `flat/service`
- `flat/repository`
- `flat/dto`

7. Move flat controllers:
- `controller/flat/FlatController.java` -> `flat/controller/FlatController.java`
- `controller/tenant/TenantController.java` -> `flat/controller/TenantController.java`
- `controller/WingController.java` -> `flat/controller/WingController.java`
- `controller/MoveRecordController.java` -> `flat/controller/MoveRecordController.java`
- `controller/PetRegistrationController.java` -> `flat/controller/PetRegistrationController.java`
- `controller/RenovationNocController.java` -> `flat/controller/RenovationNocController.java`
- `controller/FacilityBookingController.java` -> `flat/controller/FacilityBookingController.java`
- `controller/CommonAreaScheduleController.java` -> `flat/controller/CommonAreaScheduleController.java`

8. Move flat services:
- `service/flat/*` -> `flat/service/*`
- `service/tenant/*` -> `flat/service/*`
- `service/wing/*` -> `flat/service/*`
- `service/MoveRecordService.java` -> `flat/service/MoveRecordService.java`
- `service/PetRegistrationService.java` -> `flat/service/PetRegistrationService.java`
- `service/PetRegistrationServiceImpl.java` -> `flat/service/PetRegistrationServiceImpl.java`
- `service/RenovationNocService.java` -> `flat/service/RenovationNocService.java`
- `service/FacilityBookingService.java` -> `flat/service/FacilityBookingService.java`

9. Move flat repositories:
- `repository/flat/FlatRepository.java` -> `flat/repository/FlatRepository.java`
- `repository/tenant/TenantRepository.java` -> `flat/repository/TenantRepository.java`
- `repository/WingRepository.java` -> `flat/repository/WingRepository.java`
- `repository/MoveRecordRepository.java` -> `flat/repository/MoveRecordRepository.java`
- `repository/PetRegistrationRepository.java` -> `flat/repository/PetRegistrationRepository.java`
- `repository/RenovationNocRepository.java` -> `flat/repository/RenovationNocRepository.java`
- `repository/FacilityBookingRepository.java` -> `flat/repository/FacilityBookingRepository.java`

10. Move flat DTOs:
- `dto/flat/*` -> `flat/dto/*`
- `dto/tenant/*` -> `flat/dto/*`
- `dto/wing/*` -> `flat/dto/*`
- `dto/PetRegistrationRequest.java` -> `flat/dto/PetRegistrationRequest.java`
- `dto/PetRegistrationResponse.java` -> `flat/dto/PetRegistrationResponse.java`

11. Import/package update strategy:
- Use IDE refactor move for package declaration and import updates.
- Avoid manual wide search/replace on package strings.

12. API compatibility rule:
- Keep existing `@RequestMapping` values unchanged.
- Keep existing request/response JSON fields unchanged.

13. Build and test gates:
- `backend/mvnw.cmd -q -DskipTests compile`
- `backend/mvnw.cmd test`

14. Functional smoke checks:
- Society create/update/get flows
- Society settings CRUD
- Society rules CRUD
- Flat CRUD and import flows
- Tenant CRUD and import flows
- Wing CRUD/import
- Move record, pet registration, renovation NOC, facility booking endpoints

15. Delete empty legacy folders only after tests pass:
- Controllers: `controller/society`, `controller/flat`, `controller/tenant` and moved root-level controller files
- Services: `service/society`, `service/societysetting`, `service/flat`, `service/tenant`, `service/wing`, `service/asset`, `service/staff`, `service/commonarea` and moved root-level service files
- Repositories: `repository/society`, `repository/flat`, `repository/tenant`, moved root-level repository files
- DTOs: `dto/society`, `dto/societysetting`, `dto/flat`, `dto/tenant`, `dto/wing`, and moved root-level DTO files

---

## Done Criteria (Phase 2)
- Society and Flat domain classes are no longer split across many root-level files and micro-folders.
- Existing society/flat APIs remain contract-compatible.
- Import and package structure clearly reflects two ownership domains: `society` and `flat`.
- Compile and tests are green after folder cleanup.

---

## Phase 3 Preview
- `ticket` + `notice` consolidation (including `complaint`, `workorder`, `approval`, `notification`, `banner`, `classified`).
