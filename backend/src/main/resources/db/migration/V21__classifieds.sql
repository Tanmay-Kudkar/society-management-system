-- V21: Classified / Internal Marketplace
CREATE TABLE classifieds (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT        NOT NULL REFERENCES societies(id),
    posted_by_id    BIGINT        NOT NULL REFERENCES users(id),
    flat_number     VARCHAR(50),
    wing            VARCHAR(50),
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    category        VARCHAR(50)   NOT NULL DEFAULT 'GENERAL',
    listing_type    VARCHAR(20)   NOT NULL DEFAULT 'SELL',
    price           DECIMAL(12,2),
    negotiable      BOOLEAN       NOT NULL DEFAULT FALSE,
    condition       VARCHAR(30),
    image_urls      TEXT,
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(200),
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    expires_at      TIMESTAMP,
    flagged         BOOLEAN       NOT NULL DEFAULT FALSE,
    flag_reason     TEXT,
    views           INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classifieds_society  ON classifieds(society_id);
CREATE INDEX idx_classifieds_posted   ON classifieds(posted_by_id);
CREATE INDEX idx_classifieds_status   ON classifieds(status);
CREATE INDEX idx_classifieds_category ON classifieds(category);
