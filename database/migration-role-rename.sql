-- Migration: Rename MASTER_ADMIN role to PLATFORM_OWNER
-- This fixes the startup error: "No enum constant com.society.backend.entity.Role.MASTER_ADMIN"
-- The Role enum was updated but the database still contains the old value.

UPDATE users SET role = 'PLATFORM_OWNER' WHERE role = 'MASTER_ADMIN';
