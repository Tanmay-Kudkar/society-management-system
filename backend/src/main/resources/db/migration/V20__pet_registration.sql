-- V20: Pet Registration
CREATE TABLE pet_registrations (
    id              BIGSERIAL PRIMARY KEY,
    society_id      BIGINT        NOT NULL REFERENCES societies(id),
    owner_id        BIGINT        NOT NULL REFERENCES users(id),
    flat_number     VARCHAR(50),
    wing            VARCHAR(50),
    pet_name        VARCHAR(100)  NOT NULL,
    pet_type        VARCHAR(50)   NOT NULL DEFAULT 'DOG',
    breed           VARCHAR(100),
    color           VARCHAR(50),
    age_years       INT,
    gender          VARCHAR(10),
    weight_kg       DECIMAL(5,2),
    vaccinated      BOOLEAN       NOT NULL DEFAULT FALSE,
    vaccination_date DATE,
    vaccination_expiry DATE,
    registration_number VARCHAR(100),
    microchip_id    VARCHAR(100),
    photo_url       VARCHAR(500),
    special_notes   TEXT,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    approved_by_id  BIGINT        REFERENCES users(id),
    approved_at     TIMESTAMP,
    rejected_reason TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pet_reg_society ON pet_registrations(society_id);
CREATE INDEX idx_pet_reg_owner   ON pet_registrations(owner_id);
CREATE INDEX idx_pet_reg_status  ON pet_registrations(status);
