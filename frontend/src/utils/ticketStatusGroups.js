export const OPEN_TICKET_STATUSES = new Set(["OPEN", "PENDING", "APPROVED"]);
export const ACTIVE_TICKET_STATUSES = new Set(["OPEN", "PENDING", "APPROVED", "IN_PROGRESS", "IN_REVIEW"]);
export const WORKFLOW_TICKET_STATUSES = new Set(["IN_PROGRESS", "IN_REVIEW"]);
export const RESOLVED_TICKET_STATUSES = new Set(["RESOLVED", "CLOSED", "REJECTED", "COMPLETED"]);

export const normalizeTicketStatus = (status) => String(status || "").toUpperCase();

export const isOpenTicketStatus = (status) => OPEN_TICKET_STATUSES.has(normalizeTicketStatus(status));
export const isActiveTicketStatus = (status) => ACTIVE_TICKET_STATUSES.has(normalizeTicketStatus(status));
export const isWorkflowTicketStatus = (status) => WORKFLOW_TICKET_STATUSES.has(normalizeTicketStatus(status));
export const isResolvedTicketStatus = (status) => RESOLVED_TICKET_STATUSES.has(normalizeTicketStatus(status));
