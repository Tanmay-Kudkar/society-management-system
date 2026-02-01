-- Migration: Add wings and unit types support
-- Date: 2026-02-01

-- Add new columns to societies table
ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_flats INTEGER DEFAULT 0;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_shops INTEGER DEFAULT 0;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_offices INTEGER DEFAULT 0;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_wings INTEGER DEFAULT 0;

-- Create wings table
CREATE TABLE IF NOT EXISTS wings (
    id SERIAL PRIMARY KEY,
    society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    total_floors INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add wing_id and unit_type to flats table
ALTER TABLE flats ADD COLUMN IF NOT EXISTS wing_id INT REFERENCES wings(id) ON DELETE SET NULL;
ALTER TABLE flats ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'FLAT';

-- Update existing flats to have unit_type based on flat_type
UPDATE flats SET unit_type = 'FLAT' WHERE unit_type IS NULL;
UPDATE flats SET unit_type = 'SHOP' WHERE LOWER(flat_type) LIKE '%shop%';
UPDATE flats SET unit_type = 'OFFICE' WHERE LOWER(flat_type) LIKE '%office%';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wings_society_id ON wings(society_id);
CREATE INDEX IF NOT EXISTS idx_flats_wing_id ON flats(wing_id);
CREATE INDEX IF NOT EXISTS idx_flats_unit_type ON flats(unit_type);
CREATE INDEX IF NOT EXISTS idx_flats_society_unit_type ON flats(society_id, unit_type);
