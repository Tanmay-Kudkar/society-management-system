# Backend Refactor Plan (Module Consolidation)

## Objective
Consolidate current backend feature sprawl into 10 maintainable modules while preserving existing behavior, JWT auth, and RBAC.

Target modules:
- `auth`
- `user`
- `society`
- `flat`
- `ticket`
- `notice`
- `vendor`
- `finance`
- `security`
- `file`

---

## Current State (Observed)
Current code is split across many feature folders under:
- `backend/src/main/java/com/society/backend/controller`
- `backend/src/main/java/com/society/backend/service`
- `backend/src/main/java/com/society/backend/repository`
- `backend/src/main/java/com/society/backend/dto`
- `backend/src/main/java/com/society/backend/entity`

Examples of scattered root-level files that should be folded into modules:
- Controllers: `ClassifiedController.java`, `CommonAreaScheduleController.java`, `FacilityBookingController.java`, `MoveRecordController.java`, `PenaltyController.java`, `PetRegistrationController.java`, `RenovationNocController.java`, `SecurityLogController.java`, `SocietyRuleController.java`, `StaffShiftController.java`, `WingController.java`
- Services: `ClassifiedService*.java`, `FacilityBookingService.java`, `MoveRecordService.java`, `PenaltyService.java`, `PetRegistrationService*.java`, `RenovationNocService.java`, `SecurityLogService.java`, `SocietyRuleService*.java`
- Repositories: `ClassifiedRepository.java`, `CommonAreaScheduleRepository.java`, `FacilityBookingRepository.java`, `MoveRecordRepository.java`, `PenaltyRepository.java`, `PetRegistrationRepository.java`, `RenovationNocRepository.java`, `SecurityLogRepository.java`, `SocietyRuleRepository.java`, `StaffShiftRepository.java`, `WingRepository.java`

---

## Merge Map (Old -> New)

### `auth`
Move/keep:
- `controller/auth/**`
- `service/auth/**`
- `repository/user/PasswordResetTokenRepository.java` (or split under `auth`)
- `dto/auth/**`
- Security config/JWT helpers currently in `security/**` that are authentication-only

### `user`
Move/keep:
- `controller/user/**`
- `service/user/**`
- `repository/user/**` (except auth token/reset-specific pieces)
- `dto/user/**`
- `entity/User.java`, `entity/Role.java`

### `society`
Move/merge:
- `controller/society/**`, `SocietyRuleController.java`
- `service/society/**`, `service/societysetting/**`, `SocietyRuleService*.java`, `service/staff/**`, `service/asset/**`, `service/commonarea/**`
- `repository/society/**`, `SocietyRuleRepository.java`, `repository/asset/**`
- `dto/society/**`, `dto/societysetting/**`, `dto/staff/**`, `dto/asset/**`
- `entity/Society.java`, `entity/SocietySetting.java`, `entity/SocietyRule.java`, `entity/Asset.java`, `entity/CommonAreaSchedule.java`, `entity/DomesticStaff.java`, `entity/StaffAttendance.java`, `entity/StaffShift.java`

### `flat`
Move/merge:
- `controller/flat/**`, `controller/tenant/**`, `WingController.java`, `MoveRecordController.java`, `PetRegistrationController.java`, `RenovationNocController.java`, `FacilityBookingController.java`, `CommonAreaScheduleController.java`
- `service/flat/**`, `service/tenant/**`, `service/wing/**`, `MoveRecordService.java`, `PetRegistrationService*.java`, `RenovationNocService.java`, `FacilityBookingService.java`
- `repository/flat/**`, `repository/tenant/**`, `WingRepository.java`, `MoveRecordRepository.java`, `PetRegistrationRepository.java`, `RenovationNocRepository.java`, `FacilityBookingRepository.java`, `CommonAreaScheduleRepository.java`
- `dto/flat/**`, `dto/tenant/**`, `dto/wing/**`, root DTOs for pet/society-rule only where applicable
- `entity/Flat.java`, `entity/Tenant.java`, `entity/Wing.java`, `entity/MoveRecord.java`, `entity/PetRegistration.java`, `entity/RenovationNoc.java`, `entity/FacilityBooking.java`

### `ticket`
Move/merge:
- `controller/ticket/**`, `controller/complaint/**`, `controller/workorder/**`, `controller/approval/**`
- `service/ticket/**`, `service/complaint/**`, `service/workorder/**`, `service/approval/**`, `service/emergency/**`
- `repository/ticket/**`, `repository/complaint/**`, `repository/workorder/**`, `repository/approval/**`, `repository/emergency/**`
- `dto/ticket/**`, `dto/complaint/**`, `dto/approval/**`, `dto/emergency/**`, `dto/workorder/**`
- `entity/Ticket.java`, `entity/Complaint.java`, `entity/WorkOrder.java`, `entity/ApprovalRequest.java`, `entity/ApprovalAction.java`, `entity/ApprovalWorkflow.java`, `entity/ApprovalWorkflowStep.java`, `entity/SOSAlert.java`, `entity/EmergencyContact.java`

### `notice`
Move/merge:
- `controller/notice/**`, `controller/notification/**`, `controller/banner/**`, plus `ClassifiedController.java`
- `service/notice/**`, `service/notification/**`, `service/banner/**`, `ClassifiedService*.java`
- `repository/notice/**`, `repository/banner/**`, `NotificationPreferenceRepository.java`, `ClassifiedRepository.java`
- `dto/notice/**`, `dto/notification/**`, `dto/banner/**`, `ClassifiedRequest.java`, `ClassifiedResponse.java`
- `entity/Notice.java`, `entity/Banner.java`, `entity/NotificationPreference.java`, `entity/Classified.java`

### `vendor`
Move/merge:
- `controller/vendor/**`, `controller/contract/**`, `controller/staff/**`, `StaffShiftController.java`
- `service/vendor/**`, `service/contract/**`, `service/staffshift/**`
- `repository/vendor/**`, `repository/contract/**`, `StaffShiftRepository.java`
- `dto/vendor/**`, `dto/contract/**`
- `entity/Vendor.java`, `entity/Contract.java`, `entity/StaffShift.java`, `entity/DutyRoster.java`

### `finance`
Move/merge:
- `controller/payment/**`, `controller/transaction/**`, `controller/maintenance/**`, `controller/report/**`, `PenaltyController.java`
- `service/payment/**`, `service/transaction/**`, `service/maintenance/**`, `service/report/**`, `PenaltyService.java`
- `repository/payment/**`, `repository/transaction/**`, `repository/maintenance/**`, `PenaltyRepository.java`
- `dto/payment/**`, `dto/transaction/**`, `dto/maintenance/**`, `dto/report/**`
- `entity/Payment.java`, `entity/Transaction.java`, `entity/MaintenanceBill.java`, `entity/BillLineItem.java`, `entity/VendorBill.java`, `entity/Penalty.java`

### `security`
Move/merge:
- `controller/security/**`, `controller/safety/**`, `controller/patrol/**`, `controller/visitor/**`, `controller/vehicle/**`, `SecurityLogController.java`
- `service/security/**`, `service/safety/**`, `service/patrol/**`, `service/visitor/**`, `service/vehicle/**`, `SecurityLogService.java`
- `repository/safety/**`, `repository/patrol/**`, `repository/visitor/**`, `repository/vehicle/**`, `SecurityLogRepository.java`
- `dto/safety/**`, `dto/patrol/**`, `dto/visitor/**`, `dto/vehicle/**`
- `entity/Visitor.java`, `entity/Vehicle.java`, `entity/SecurityLog.java`, `entity/PatrolLog.java`, `entity/PatrolCheckpoint.java`, `entity/GateLog.java`

### `file`
Move/merge:
- `controller/document/**`, `controller/export/**`
- `service/document/**`, `service/export/**`
- `repository/document/**`
- `dto/document/**`, `dto/export/**`
- `entity/DocumentTemplate.java`

---

## Final Package Layout (Recommended)

```text
backend/src/main/java/com/society/backend/
  shared/
    config/
    exception/
    util/
    validation/
  auth/
    controller/
    service/
    repository/
    dto/
    model/
    security/
  user/
    controller/
    service/
    repository/
    dto/
    model/
  society/
    controller/
    service/
    repository/
    dto/
    model/
  flat/
    controller/
    service/
    repository/
    dto/
    model/
  ticket/
    controller/
    service/
    repository/
    dto/
    model/
  notice/
    controller/
    service/
    repository/
    dto/
    model/
  vendor/
    controller/
    service/
    repository/
    dto/
    model/
  finance/
    controller/
    service/
    repository/
    dto/
    model/
  security/
    controller/
    service/
    repository/
    dto/
    model/
  file/
    controller/
    service/
    repository/
    dto/
    model/
```

Note: `model/` is the module-local replacement for broad global `entity/` where feasible. Shared core identity models can remain centralized if needed during transition.

---

## Delete/Deprecate Checklist
Delete only after compilation and API regression tests pass.

Candidate folders to remove:
- `service/approval`, `service/asset`, `service/banner`, `service/common`, `service/commonarea`, `service/complaint`, `service/contract`, `service/document`, `service/emergency`, `service/export`, `service/maintenance`, `service/notification`, `service/patrol`, `service/payment`, `service/report`, `service/safety`, `service/societysetting`, `service/staff`, `service/staffshift`, `service/tenant`, `service/transaction`, `service/vehicle`, `service/visitor`, `service/wing`, `service/workorder`
- Equivalent folders under `controller/**`, `repository/**`, `dto/**` once merged
- Loose root-level files listed in "Current State" once absorbed

---

## Capability Preservation Checklist

Keep verified after each phase:
- Roles and RBAC: `MASTER_ADMIN`, `SOCIETY_ADMIN`, `CHAIRMAN`, `SECRETARY`, `TREASURER`, `COMMITTEE`, `EMPLOYEE`, `MEMBER`, `TENANT`, `VENDOR`, `VISITOR`
- JWT auth flow remains unchanged at API boundary
- Ticket and complaint flows still support assignment, status, escalation, closure
- Society and flat lifecycles still support tenant/unit operations
- Vendor + maintenance still support contracts, bills, payments, work orders
- Visitor logs, gate/security logs, patrol/safety actions remain queryable

---

## Phased Migration Sequence

1. **Create new module packages**
   - Add target package tree without moving endpoints yet.

2. **Move repositories and entities first**
   - Keep old package facades/adapters where imports are widespread.

3. **Move services module by module**
   - `auth` and `user` first, then `society`/`flat`, then `ticket`/`notice`, then `vendor`/`finance`/`security`/`file`.

4. **Move controllers last**
   - Preserve existing request mappings to avoid frontend breakage.

5. **Consolidate DTOs**
   - Collapse duplicate request/response shapes into module DTOs.

6. **Delete deprecated folders**
   - Remove old packages only after compile + smoke + authz regression checks.

---

## Notes on Risk Control
- Preserve endpoint paths during package moves.
- Keep DB table names unchanged during structural refactor.
- Add temporary bridge services where old interfaces are used widely.
- Re-run role-based authorization tests after each module migration.
