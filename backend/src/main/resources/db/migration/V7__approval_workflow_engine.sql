-- V7: Approval Workflow Engine (F18)
-- Generic, reusable approval system for any entity type

-- Approval workflow definitions (templates)
CREATE TABLE IF NOT EXISTS approval_workflows (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,  -- EXPENSE, RATE_CHANGE, VENDOR, VENDOR_BILL, MAINTENANCE, CUSTOM
    description     TEXT,
    min_amount      NUMERIC(15,2) DEFAULT 0,
    max_amount      NUMERIC(15,2),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workflow steps (ordered approval levels)
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id              BIGSERIAL PRIMARY KEY,
    workflow_id     BIGINT NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order      INT NOT NULL,
    approver_role   VARCHAR(50) NOT NULL,  -- CHAIRMAN, SECRETARY, TREASURER, COMMITTEE, SOCIETY_ADMIN
    is_mandatory    BOOLEAN NOT NULL DEFAULT TRUE,
    auto_approve_below NUMERIC(15,2),      -- Auto-approve amounts below this threshold
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Approval requests (actual instances)
CREATE TABLE IF NOT EXISTS approval_requests (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    workflow_id     BIGINT REFERENCES approval_workflows(id) ON DELETE SET NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    amount          NUMERIC(15,2),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_REVIEW, APPROVED, REJECTED, CANCELLED
    current_step    INT NOT NULL DEFAULT 1,
    total_steps     INT NOT NULL DEFAULT 1,
    requested_by    BIGINT NOT NULL REFERENCES users(id),
    final_approver  BIGINT REFERENCES users(id),
    rejection_reason TEXT,
    metadata        TEXT,  -- JSON blob for extra context
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP
);

-- Individual approval actions (audit trail)
CREATE TABLE IF NOT EXISTS approval_actions (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_order      INT NOT NULL,
    action          VARCHAR(20) NOT NULL,  -- APPROVED, REJECTED, RETURNED, ESCALATED
    acted_by        BIGINT NOT NULL REFERENCES users(id),
    comments        TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_workflows_society ON approval_workflows(society_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity ON approval_workflows(entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_society ON approval_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON approval_actions(request_id);
