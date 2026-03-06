# Phase 4 Move List (Vendor + Finance + Security + File)

This phase completes the migration roadmap after `PHASE3_MOVE_LIST.md`.

## Preconditions
- Phase 1 to Phase 3 compile and tests pass.
- Endpoint URLs and DTO JSON contracts are preserved.
- Global `entity/` package is still in transition mode.

---

## Scope of Phase 4
In scope:
- Consolidate contract/vendor operations under `vendor`.
- Consolidate billing/payment/transaction/reporting under `finance`.
- Consolidate visitor/vehicle/patrol/safety under `security`.
- Consolidate document/export under `file`.
- Absorb remaining root-level classes tied to these domains.

Out of scope:
- Deep data-model redesign.
- DB schema/table renames.
- API payload redesign.

---

## Current Inventory (Verified)

### Vendor side
Controllers:
- `controller/vendor/VendorController.java`
- `controller/vendor/VendorBillController.java`
- `controller/contract/ContractController.java`
- `controller/staff/DomesticStaffController.java`
- `controller/StaffShiftController.java`

Services:
- `service/vendor/VendorService.java`
- `service/vendor/VendorServiceImpl.java`
- `service/vendor/VendorBillService.java`
- `service/vendor/VendorBillServiceImpl.java`
- `service/vendor/BulkVendorImportService.java`
- `service/contract/ContractService.java`
- `service/contract/ContractServiceImpl.java`
- `service/staffshift/StaffShiftService.java`
- `service/staffshift/StaffShiftServiceImpl.java`

Repositories:
- `repository/vendor/VendorRepository.java`
- `repository/vendor/VendorBillRepository.java`
- `repository/contract/ContractRepository.java`
- `repository/staff/DomesticStaffRepository.java`
- `repository/StaffShiftRepository.java`

DTOs:
- `dto/vendor/VendorRequest.java`
- `dto/vendor/VendorResponse.java`
- `dto/vendor/VendorBillRequest.java`
- `dto/vendor/VendorBillResponse.java`
- `dto/vendor/VendorImportRow.java`
- `dto/vendor/BulkVendorImportResponse.java`
- `dto/contract/ContractRequest.java`
- `dto/contract/ContractResponse.java`
- `dto/staff/DomesticStaffRequest.java`
- `dto/staff/DomesticStaffResponse.java`

### Finance side
Controllers:
- `controller/payment/PaymentController.java`
- `controller/transaction/TransactionController.java`
- `controller/maintenance/MaintenanceBillController.java`
- `controller/report/ReportController.java`
- `controller/PenaltyController.java`

Services:
- `service/payment/PaymentService.java`
- `service/transaction/TransactionService.java`
- `service/transaction/TransactionServiceImpl.java`
- `service/maintenance/MaintenanceBillService.java`
- `service/maintenance/MaintenanceBillServiceImpl.java`
- `service/report/ReportService.java`
- `service/report/ReportServiceImpl.java`
- `service/PenaltyService.java`

Repositories:
- `repository/payment/PaymentRepository.java`
- `repository/transaction/TransactionRepository.java`
- `repository/maintenance/MaintenanceBillRepository.java`
- `repository/maintenance/BillLineItemRepository.java`
- `repository/PenaltyRepository.java`

DTOs:
- `dto/payment/CreateOrderRequest.java`
- `dto/payment/CreateOrderResponse.java`
- `dto/payment/PaymentResponse.java`
- `dto/payment/VerifyPaymentRequest.java`
- `dto/transaction/TransactionRequest.java`
- `dto/transaction/TransactionResponse.java`
- `dto/maintenance/MaintenanceBillRequest.java`
- `dto/maintenance/MaintenanceBillResponse.java`
- `dto/maintenance/BillLineItemRequest.java`
- `dto/maintenance/BillLineItemResponse.java`
- `dto/report/FinancialReportResponse.java`

### Security side
Controllers:
- `controller/safety/SafetyController.java`
- `controller/patrol/PatrolController.java`
- `controller/visitor/VisitorController.java`
- `controller/vehicle/VehicleController.java`
- `controller/SecurityLogController.java`

Services:
- `service/safety/SafetyService.java`
- `service/safety/SafetyServiceImpl.java`
- `service/patrol/PatrolService.java`
- `service/patrol/PatrolServiceImpl.java`
- `service/visitor/VisitorService.java`
- `service/visitor/VisitorServiceImpl.java`
- `service/vehicle/VehicleService.java`
- `service/vehicle/VehicleServiceImpl.java`
- `service/vehicle/BulkVehicleImportService.java`
- `service/SecurityLogService.java`

Repositories:
- `repository/safety/GateLogRepository.java`
- `repository/safety/SOSAlertRepository.java`
- `repository/patrol/PatrolCheckpointRepository.java`
- `repository/patrol/PatrolLogRepository.java`
- `repository/patrol/DutyRosterRepository.java`
- `repository/visitor/VisitorRepository.java`
- `repository/vehicle/VehicleRepository.java`
- `repository/SecurityLogRepository.java`

DTOs:
- `dto/safety/GateLogRequest.java`
- `dto/safety/GateLogResponse.java`
- `dto/safety/SOSAlertRequest.java`
- `dto/safety/SOSAlertResponse.java`
- `dto/patrol/CheckpointRequest.java`
- `dto/patrol/CheckpointResponse.java`
- `dto/patrol/DutyRosterRequest.java`
- `dto/patrol/DutyRosterResponse.java`
- `dto/patrol/PatrolLogRequest.java`
- `dto/patrol/PatrolLogResponse.java`
- `dto/visitor/VisitorRequest.java`
- `dto/visitor/VisitorResponse.java`
- `dto/vehicle/VehicleRequest.java`
- `dto/vehicle/VehicleResponse.java`
- `dto/vehicle/VehicleImportRow.java`
- `dto/vehicle/BulkVehicleImportResponse.java`

### File side
Controllers:
- `controller/document/DocumentTemplateController.java`
- `controller/export/ExportController.java`

Services:
- `service/document/DocumentTemplateService.java`
- `service/document/DocumentTemplateServiceImpl.java`
- `service/export/ExcelExportService.java`
- `service/export/ExcelExportServiceImpl.java`

Repositories:
- `repository/document/DocumentTemplateRepository.java`

DTOs:
- `dto/document/DocumentTemplateRequest.java`
- `dto/document/DocumentTemplateResponse.java`

Cross-cutting DTO to keep shared:
- `dto/common/ErrorResponse.java` (keep in shared/common)

---

## Target Placement After Phase 4

### Vendor-owned namespace
- `com.society.backend.vendor.controller`
- `com.society.backend.vendor.service`
- `com.society.backend.vendor.repository`
- `com.society.backend.vendor.dto`

### Finance-owned namespace
- `com.society.backend.finance.controller`
- `com.society.backend.finance.service`
- `com.society.backend.finance.repository`
- `com.society.backend.finance.dto`

### Security-owned namespace
- `com.society.backend.security.controller`
- `com.society.backend.security.service`
- `com.society.backend.security.repository`
- `com.society.backend.security.dto`

### File-owned namespace
- `com.society.backend.file.controller`
- `com.society.backend.file.service`
- `com.society.backend.file.repository`
- `com.society.backend.file.dto`

---

## Exact Execution Checklist

1. Create package placeholders:
- `vendor/controller`, `vendor/service`, `vendor/repository`, `vendor/dto`
- `finance/controller`, `finance/service`, `finance/repository`, `finance/dto`
- `security/controller`, `security/service`, `security/repository`, `security/dto`
- `file/controller`, `file/service`, `file/repository`, `file/dto`

2. Move vendor controllers/services/repositories/DTOs:
- `controller/vendor/*` -> `vendor/controller/*`
- `controller/contract/ContractController.java` -> `vendor/controller/ContractController.java`
- `controller/staff/DomesticStaffController.java` -> `vendor/controller/DomesticStaffController.java`
- `controller/StaffShiftController.java` -> `vendor/controller/StaffShiftController.java`
- `service/vendor/*` -> `vendor/service/*`
- `service/contract/*` -> `vendor/service/*`
- `service/staffshift/*` -> `vendor/service/*`
- `repository/vendor/*` -> `vendor/repository/*`
- `repository/contract/ContractRepository.java` -> `vendor/repository/ContractRepository.java`
- `repository/staff/DomesticStaffRepository.java` -> `vendor/repository/DomesticStaffRepository.java`
- `repository/StaffShiftRepository.java` -> `vendor/repository/StaffShiftRepository.java`
- `dto/vendor/*` -> `vendor/dto/*`
- `dto/contract/*` -> `vendor/dto/*`
- `dto/staff/DomesticStaff*.java` -> `vendor/dto/*`

3. Move finance controllers/services/repositories/DTOs:
- `controller/payment/PaymentController.java` -> `finance/controller/PaymentController.java`
- `controller/transaction/TransactionController.java` -> `finance/controller/TransactionController.java`
- `controller/maintenance/MaintenanceBillController.java` -> `finance/controller/MaintenanceBillController.java`
- `controller/report/ReportController.java` -> `finance/controller/ReportController.java`
- `controller/PenaltyController.java` -> `finance/controller/PenaltyController.java`
- `service/payment/*` -> `finance/service/*`
- `service/transaction/*` -> `finance/service/*`
- `service/maintenance/*` -> `finance/service/*`
- `service/report/*` -> `finance/service/*`
- `service/PenaltyService.java` -> `finance/service/PenaltyService.java`
- `repository/payment/*` -> `finance/repository/*`
- `repository/transaction/*` -> `finance/repository/*`
- `repository/maintenance/*` -> `finance/repository/*`
- `repository/PenaltyRepository.java` -> `finance/repository/PenaltyRepository.java`
- `dto/payment/*` -> `finance/dto/*`
- `dto/transaction/*` -> `finance/dto/*`
- `dto/maintenance/*` -> `finance/dto/*`
- `dto/report/*` -> `finance/dto/*`

4. Move security controllers/services/repositories/DTOs:
- `controller/safety/SafetyController.java` -> `security/controller/SafetyController.java`
- `controller/patrol/PatrolController.java` -> `security/controller/PatrolController.java`
- `controller/visitor/VisitorController.java` -> `security/controller/VisitorController.java`
- `controller/vehicle/VehicleController.java` -> `security/controller/VehicleController.java`
- `controller/SecurityLogController.java` -> `security/controller/SecurityLogController.java`
- `service/safety/*` -> `security/service/*`
- `service/patrol/*` -> `security/service/*`
- `service/visitor/*` -> `security/service/*`
- `service/vehicle/*` -> `security/service/*`
- `service/SecurityLogService.java` -> `security/service/SecurityLogService.java`
- `repository/safety/*` -> `security/repository/*`
- `repository/patrol/*` -> `security/repository/*`
- `repository/visitor/*` -> `security/repository/*`
- `repository/vehicle/*` -> `security/repository/*`
- `repository/SecurityLogRepository.java` -> `security/repository/SecurityLogRepository.java`
- `dto/safety/*` -> `security/dto/*`
- `dto/patrol/*` -> `security/dto/*`
- `dto/visitor/*` -> `security/dto/*`
- `dto/vehicle/*` -> `security/dto/*`

5. Move file controllers/services/repositories/DTOs:
- `controller/document/*` -> `file/controller/*`
- `controller/export/*` -> `file/controller/*`
- `service/document/*` -> `file/service/*`
- `service/export/*` -> `file/service/*`
- `repository/document/*` -> `file/repository/*`
- `dto/document/*` -> `file/dto/*`

6. Keep shared DTOs in common/shared:
- Keep `dto/common/ErrorResponse.java` as shared cross-module contract DTO.

7. Package/import updates:
- Use IDE refactor move for all class moves.
- Avoid global string replacement for package names.

8. API compatibility rules:
- Keep all existing `@RequestMapping` values unchanged.
- Keep request/response JSON shape unchanged.

9. Build and test gates:
- `backend/mvnw.cmd -q -DskipTests compile`
- `backend/mvnw.cmd test`

10. Functional smoke checks:
- Vendor CRUD/import + vendor bill + contract flows
- Maintenance bill, payment, transaction, report flows
- Visitor/vehicle registration, patrol logs/checkpoints, safety alerts, gate logs
- Document template and export endpoints

11. Delete empty legacy folders/files only after tests pass:
- Controllers: `controller/vendor`, `controller/contract`, `controller/staff`, `controller/payment`, `controller/transaction`, `controller/maintenance`, `controller/report`, `controller/safety`, `controller/patrol`, `controller/visitor`, `controller/vehicle`, `controller/document`, `controller/export`, plus root-level `PenaltyController.java`, `SecurityLogController.java`, `StaffShiftController.java`
- Services: `service/vendor`, `service/contract`, `service/staffshift`, `service/payment`, `service/transaction`, `service/maintenance`, `service/report`, `service/safety`, `service/patrol`, `service/visitor`, `service/vehicle`, `service/document`, `service/export`, plus root-level `PenaltyService.java`, `SecurityLogService.java`
- Repositories: `repository/vendor`, `repository/contract`, `repository/staff`, `repository/payment`, `repository/transaction`, `repository/maintenance`, `repository/safety`, `repository/patrol`, `repository/visitor`, `repository/vehicle`, `repository/document`, plus root-level `PenaltyRepository.java`, `SecurityLogRepository.java`, `StaffShiftRepository.java`
- DTOs: `dto/vendor`, `dto/contract`, `dto/staff`, `dto/payment`, `dto/transaction`, `dto/maintenance`, `dto/report`, `dto/safety`, `dto/patrol`, `dto/visitor`, `dto/vehicle`, `dto/document` (keep `dto/common`)

---

## Done Criteria (Phase 4)
- Remaining operational modules are fully consolidated into `vendor`, `finance`, `security`, and `file`.
- No behavior regressions in role-gated operations and endpoint contracts.
- Legacy micro-folders are removed once empty and validated.
- The backend now matches the 10-module architecture target.

---

## Final Validation Checklist (All Phases)
- All role paths still enforce: `MASTER_ADMIN`, `SOCIETY_ADMIN`, `CHAIRMAN`, `SECRETARY`, `TREASURER`, `COMMITTEE`, `EMPLOYEE`, `MEMBER`, `TENANT`, `VENDOR`, `VISITOR`.
- Ticket/complaint/work order flow intact.
- Society/flat lifecycle intact.
- Vendor and maintenance tracking intact.
- Visitor/security logs intact.
- Compile + tests green.
