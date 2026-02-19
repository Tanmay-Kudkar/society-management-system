-- V22: Society Rules / Bylaws Repository
CREATE TABLE society_rules (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT        NOT NULL REFERENCES societies(id),
    created_by_id   BIGINT        NOT NULL REFERENCES users(id),
    title           VARCHAR(200)  NOT NULL,
    category        VARCHAR(50)   NOT NULL DEFAULT 'GENERAL',
    description     TEXT,
    content         TEXT          NOT NULL,
    effective_date  DATE,
    expiry_date     DATE,
    version         VARCHAR(20)   DEFAULT '1.0',
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    is_mandatory    BOOLEAN       NOT NULL DEFAULT FALSE,
    attachment_url  VARCHAR(500),
    sort_order      INT           NOT NULL DEFAULT 0,
    approved_by_id  BIGINT        REFERENCES users(id),
    approved_at     TIMESTAMP,
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_society_rules_society ON society_rules(society_id);
CREATE INDEX idx_society_rules_status  ON society_rules(status);
CREATE INDEX idx_society_rules_category ON society_rules(category);
