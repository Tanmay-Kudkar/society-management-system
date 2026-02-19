-- F33: Guard Patrol & Duty Roster
-- Tables for guard patrol checkpoints, patrol logs, and duty rosters

CREATE TABLE IF NOT EXISTS patrol_checkpoints (
    id              SERIAL PRIMARY KEY,
    society_id      INT          NOT NULL REFERENCES societies(id),
    checkpoint_name VARCHAR(100) NOT NULL,
    location        VARCHAR(255),
    description     TEXT,
    qr_code         VARCHAR(100),
    display_order   INT          DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patrol_logs (
    id                  SERIAL PRIMARY KEY,
    society_id          INT          NOT NULL REFERENCES societies(id),
    guard_id            INT          NOT NULL REFERENCES users(id),
    checkpoint_id       INT          NOT NULL REFERENCES patrol_checkpoints(id),
    scanned_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(20)  NOT NULL DEFAULT 'ON_TIME',  -- ON_TIME, LATE, MISSED
    notes               TEXT,
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS duty_rosters (
    id              SERIAL PRIMARY KEY,
    society_id      INT          NOT NULL REFERENCES societies(id),
    guard_id        INT          NOT NULL REFERENCES users(id),
    shift_name      VARCHAR(50)  NOT NULL,  -- MORNING, AFTERNOON, NIGHT, CUSTOM
    shift_start     TIME         NOT NULL,
    shift_end       TIME         NOT NULL,
    duty_date       DATE         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED, ON_DUTY, COMPLETED, ABSENT, LEAVE
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    notes           TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkpoint_society ON patrol_checkpoints(society_id);
CREATE INDEX IF NOT EXISTS idx_patrol_log_society ON patrol_logs(society_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_patrol_log_guard ON patrol_logs(guard_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_duty_roster_society ON duty_rosters(society_id, duty_date);
CREATE INDEX IF NOT EXISTS idx_duty_roster_guard ON duty_rosters(guard_id, duty_date);
