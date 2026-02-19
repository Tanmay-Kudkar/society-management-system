-- Align patrol/duty roster tables with Long IDs in JPA entities
-- Fixes schema validation errors like:
--   wrong column type in duty_rosters.id (serial/int) vs expected bigint

-- Drop dependent foreign keys first
ALTER TABLE IF EXISTS patrol_logs
    DROP CONSTRAINT IF EXISTS patrol_logs_society_id_fkey,
    DROP CONSTRAINT IF EXISTS patrol_logs_guard_id_fkey,
    DROP CONSTRAINT IF EXISTS patrol_logs_checkpoint_id_fkey;

ALTER TABLE IF EXISTS duty_rosters
    DROP CONSTRAINT IF EXISTS duty_rosters_society_id_fkey,
    DROP CONSTRAINT IF EXISTS duty_rosters_guard_id_fkey;

ALTER TABLE IF EXISTS patrol_checkpoints
    DROP CONSTRAINT IF EXISTS patrol_checkpoints_society_id_fkey;

-- Upcast integer columns to bigint
ALTER TABLE IF EXISTS patrol_checkpoints
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN society_id TYPE BIGINT;

ALTER TABLE IF EXISTS patrol_logs
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN society_id TYPE BIGINT,
    ALTER COLUMN guard_id TYPE BIGINT,
    ALTER COLUMN checkpoint_id TYPE BIGINT;

ALTER TABLE IF EXISTS duty_rosters
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN society_id TYPE BIGINT,
    ALTER COLUMN guard_id TYPE BIGINT;

-- Recreate foreign keys
ALTER TABLE IF EXISTS patrol_checkpoints
    ADD CONSTRAINT patrol_checkpoints_society_id_fkey
        FOREIGN KEY (society_id) REFERENCES societies(id);

ALTER TABLE IF EXISTS patrol_logs
    ADD CONSTRAINT patrol_logs_society_id_fkey
        FOREIGN KEY (society_id) REFERENCES societies(id),
    ADD CONSTRAINT patrol_logs_guard_id_fkey
        FOREIGN KEY (guard_id) REFERENCES users(id),
    ADD CONSTRAINT patrol_logs_checkpoint_id_fkey
        FOREIGN KEY (checkpoint_id) REFERENCES patrol_checkpoints(id);

ALTER TABLE IF EXISTS duty_rosters
    ADD CONSTRAINT duty_rosters_society_id_fkey
        FOREIGN KEY (society_id) REFERENCES societies(id),
    ADD CONSTRAINT duty_rosters_guard_id_fkey
        FOREIGN KEY (guard_id) REFERENCES users(id);
