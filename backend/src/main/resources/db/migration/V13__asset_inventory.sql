-- F36: Asset / Inventory Management
CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id),
    asset_name VARCHAR(200) NOT NULL,
    asset_code VARCHAR(50),
    category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    description TEXT,
    location VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    condition VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    purchase_date DATE,
    purchase_cost DECIMAL(12,2),
    current_value DECIMAL(12,2),
    warranty_expiry DATE,
    vendor_name VARCHAR(200),
    assigned_to_id BIGINT REFERENCES users(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    min_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_society ON assets(society_id);
CREATE INDEX idx_assets_status ON assets(society_id, status);
CREATE INDEX idx_assets_category ON assets(society_id, category);
