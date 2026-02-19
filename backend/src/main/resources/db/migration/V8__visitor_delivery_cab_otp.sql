ALTER TABLE visitors
    ADD COLUMN otp_code VARCHAR(10),
    ADD COLUMN otp_expires_at TIMESTAMP,
    ADD COLUMN otp_verified_at TIMESTAMP,
    ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN otp_last_generated_at TIMESTAMP;

CREATE INDEX idx_visitors_otp_code ON visitors(otp_code);
CREATE INDEX idx_visitors_otp_expires_at ON visitors(otp_expires_at);
