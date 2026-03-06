# Phase 3 Move List (Ticket + Notice)

This phase continues after `PHASE2_MOVE_LIST.md` and consolidates issue-management and communication domains.

## Preconditions
- Phase 1 and Phase 2 compile and tests pass.
- Existing endpoint URLs and DTO JSON contracts remain unchanged.
- Global `entity/` package is still in use for transition.

---

## Scope of Phase 3
In scope:
- Consolidate `ticket`, `complaint`, `workorder`, `approval`, `emergency` under `ticket` ownership.
- Consolidate `notice`, `notification`, `banner`, and root-level `classified` artifacts under `notice` ownership.
- Eliminate root-level placement for these domains in controller/service/repository/dto packages.

Out of scope:
- `vendor`, `finance`, `security`, `file` module migrations.
- DB schema changes.
- Request/response payload redesign.

---

## Current Inventory (Verified)

### Ticket side
Controllers:
- `controller/ticket/TicketController.java`
- `controller/complaint/ComplaintController.java`
- `controller/workorder/WorkOrderController.java`
- `controller/approval/ApprovalController.java`
- `controller/emergency/EmergencyContactController.java`

Services:
- `service/ticket/TicketService.java`
- `service/ticket/TicketServiceImpl.java`
- `service/complaint/ComplaintService.java`
- `service/complaint/ComplaintServiceImpl.java`
- `service/workorder/WorkOrderService.java`
- `service/workorder/WorkOrderServiceImpl.java`
- `service/approval/ApprovalService.java`
- `service/approval/ApprovalServiceImpl.java`
- `service/emergency/EmergencyContactService.java`
- `service/emergency/EmergencyContactServiceImpl.java`
- `service/emergency/BulkEmergencyContactImportService.java`

Repositories:
- `repository/ticket/TicketRepository.java`
- `repository/complaint/ComplaintRepository.java`
- `repository/workorder/WorkOrderRepository.java`
- `repository/approval/ApprovalActionRepository.java`
- `repository/approval/ApprovalRequestRepository.java`
- `repository/approval/ApprovalWorkflowRepository.java`
- `repository/emergency/EmergencyContactRepository.java`

DTOs:
- `dto/ticket/TicketRequest.java`
- `dto/ticket/TicketResponse.java`
- `dto/complaint/ComplaintRequest.java`
- `dto/complaint/ComplaintResponse.java`
- `dto/workorder/WorkOrderRequest.java`
- `dto/workorder/WorkOrderResponse.java`
- `dto/approval/ApprovalActionRequest.java`
- `dto/approval/ApprovalActionResponse.java`
- `dto/approval/ApprovalRequestCreateDTO.java`
- `dto/approval/ApprovalRequestResponse.java`
- `dto/approval/ApprovalWorkflowRequest.java`
- `dto/approval/ApprovalWorkflowResponse.java`
- `dto/approval/WorkflowStepRequest.java`
- `dto/approval/WorkflowStepResponse.java`
- `dto/emergency/EmergencyContactRequest.java`
- `dto/emergency/EmergencyContactResponse.java`
- `dto/emergency/EmergencyContactImportRow.java`
- `dto/emergency/BulkEmergencyContactImportResponse.java`

### Notice side
Controllers:
- `controller/notice/NoticeController.java`
- `controller/notification/NotificationPreferenceController.java`
- `controller/banner/BannerController.java`
- `controller/ClassifiedController.java`

Services:
- `service/notice/NoticeService.java`
- `service/notice/NoticeServiceImpl.java`
- `service/notification/NotificationPreferenceService.java`
- `service/banner/BannerService.java`
- `service/banner/BannerServiceImpl.java`
- `service/ClassifiedService.java`
- `service/ClassifiedServiceImpl.java`

Repositories:
- `repository/notice/NoticeRepository.java`
- `repository/banner/BannerRepository.java`
- `repository/NotificationPreferenceRepository.java`
- `repository/ClassifiedRepository.java`

DTOs:
- `dto/notice/NoticeRequest.java`
- `dto/notice/NoticeResponse.java`
- `dto/notification/NotificationPreferenceRequest.java`
- `dto/notification/NotificationPreferenceResponse.java`
- `dto/banner/BannerRequest.java`
- `dto/banner/BannerResponse.java`
- `dto/ClassifiedRequest.java`
- `dto/ClassifiedResponse.java`

---

## Target Placement After Phase 3

### Ticket-owned namespace
- `com.society.backend.ticket.controller`
- `com.society.backend.ticket.service`
- `com.society.backend.ticket.repository`
- `com.society.backend.ticket.dto`

### Notice-owned namespace
- `com.society.backend.notice.controller`
- `com.society.backend.notice.service`
- `com.society.backend.notice.repository`
- `com.society.backend.notice.dto`

---

## Exact Execution Checklist

1. Create ticket package placeholders:
- `ticket/controller`
- `ticket/service`
- `ticket/repository`
- `ticket/dto`

2. Move ticket controllers:
- `controller/ticket/TicketController.java` -> `ticket/controller/TicketController.java`
- `controller/complaint/ComplaintController.java` -> `ticket/controller/ComplaintController.java`
- `controller/workorder/WorkOrderController.java` -> `ticket/controller/WorkOrderController.java`
- `controller/approval/ApprovalController.java` -> `ticket/controller/ApprovalController.java`
- `controller/emergency/EmergencyContactController.java` -> `ticket/controller/EmergencyContactController.java`

3. Move ticket services:
- `service/ticket/*` -> `ticket/service/*`
- `service/complaint/*` -> `ticket/service/*`
- `service/workorder/*` -> `ticket/service/*`
- `service/approval/*` -> `ticket/service/*`
- `service/emergency/*` -> `ticket/service/*`

4. Move ticket repositories:
- `repository/ticket/TicketRepository.java` -> `ticket/repository/TicketRepository.java`
- `repository/complaint/ComplaintRepository.java` -> `ticket/repository/ComplaintRepository.java`
- `repository/workorder/WorkOrderRepository.java` -> `ticket/repository/WorkOrderRepository.java`
- `repository/approval/*` -> `ticket/repository/*`
- `repository/emergency/EmergencyContactRepository.java` -> `ticket/repository/EmergencyContactRepository.java`

5. Move ticket DTOs:
- `dto/ticket/*` -> `ticket/dto/*`
- `dto/complaint/*` -> `ticket/dto/*`
- `dto/workorder/*` -> `ticket/dto/*`
- `dto/approval/*` -> `ticket/dto/*`
- `dto/emergency/*` -> `ticket/dto/*`

6. Create notice package placeholders:
- `notice/controller`
- `notice/service`
- `notice/repository`
- `notice/dto`

7. Move notice controllers:
- `controller/notice/NoticeController.java` -> `notice/controller/NoticeController.java`
- `controller/notification/NotificationPreferenceController.java` -> `notice/controller/NotificationPreferenceController.java`
- `controller/banner/BannerController.java` -> `notice/controller/BannerController.java`
- `controller/ClassifiedController.java` -> `notice/controller/ClassifiedController.java`

8. Move notice services:
- `service/notice/*` -> `notice/service/*`
- `service/notification/NotificationPreferenceService.java` -> `notice/service/NotificationPreferenceService.java`
- `service/banner/*` -> `notice/service/*`
- `service/ClassifiedService.java` -> `notice/service/ClassifiedService.java`
- `service/ClassifiedServiceImpl.java` -> `notice/service/ClassifiedServiceImpl.java`

9. Move notice repositories:
- `repository/notice/NoticeRepository.java` -> `notice/repository/NoticeRepository.java`
- `repository/banner/BannerRepository.java` -> `notice/repository/BannerRepository.java`
- `repository/NotificationPreferenceRepository.java` -> `notice/repository/NotificationPreferenceRepository.java`
- `repository/ClassifiedRepository.java` -> `notice/repository/ClassifiedRepository.java`

10. Move notice DTOs:
- `dto/notice/*` -> `notice/dto/*`
- `dto/notification/*` -> `notice/dto/*`
- `dto/banner/*` -> `notice/dto/*`
- `dto/ClassifiedRequest.java` -> `notice/dto/ClassifiedRequest.java`
- `dto/ClassifiedResponse.java` -> `notice/dto/ClassifiedResponse.java`

11. Package/import updates:
- Use IDE refactor move for package declaration and import updates.
- Avoid bulk manual search/replace for package names.

12. API compatibility rules:
- Keep existing `@RequestMapping` values unchanged.
- Keep existing request/response JSON payload shape unchanged.

13. Build and test gates:
- `backend/mvnw.cmd -q -DskipTests compile`
- `backend/mvnw.cmd test`

14. Functional smoke checks:
- Ticket CRUD and status lifecycle
- Complaint create/assign/resolve flow
- Work order creation and tracking
- Approval workflow and approval request lifecycle
- Emergency contact import and CRUD
- Notice CRUD and listing
- Notification preference updates
- Banner and classified management

15. Delete empty legacy folders only after tests pass:
- Controllers: `controller/ticket`, `controller/complaint`, `controller/workorder`, `controller/approval`, `controller/emergency`, `controller/notice`, `controller/notification`, `controller/banner`, and moved root-level controller files
- Services: `service/ticket`, `service/complaint`, `service/workorder`, `service/approval`, `service/emergency`, `service/notice`, `service/notification`, `service/banner`, and moved root-level service files
- Repositories: `repository/ticket`, `repository/complaint`, `repository/workorder`, `repository/approval`, `repository/emergency`, `repository/notice`, `repository/banner`, and moved root-level repository files
- DTOs: `dto/ticket`, `dto/complaint`, `dto/workorder`, `dto/approval`, `dto/emergency`, `dto/notice`, `dto/notification`, `dto/banner`, and moved root-level DTO files

---

## Done Criteria (Phase 3)
- Ticket-related capabilities (tickets, complaints, work orders, approvals, emergency contacts) are consolidated under `ticket` ownership.
- Communication capabilities (notices, notification preferences, banners, classifieds) are consolidated under `notice` ownership.
- Existing API contracts remain stable.
- Compile and tests pass after cleanup.

---

## Phase 4 Preview
- Consolidate `vendor + finance + security + file` into remaining final modules.
