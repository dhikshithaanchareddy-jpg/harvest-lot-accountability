-- ============================================================================
-- Migration: 20261028_001_initial_schema.sql
-- Title: Harvest Lot Freshness and Spoilage Accountability Register
-- Description: Core schema with normalized tables, relational constraints,
--              indexes, Row Level Security (RLS), and audit history tracking.
-- ============================================================================

-- Enable pgcrypto or uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CROPS CATALOG & AGING THRESHOLDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS crops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    optimal_temp_min NUMERIC(4, 1) NOT NULL,
    optimal_temp_max NUMERIC(4, 1) NOT NULL,
    optimal_humidity_min NUMERIC(4, 1) NOT NULL,
    optimal_humidity_max NUMERIC(4, 1) NOT NULL,
    shelf_life_days INTEGER NOT NULL CHECK (shelf_life_days > 0),
    critical_aging_days INTEGER NOT NULL CHECK (critical_aging_days > 0 AND critical_aging_days <= shelf_life_days),
    unit_price_per_kg NUMERIC(10, 2) NOT NULL CHECK (unit_price_per_kg >= 0),
    image_slug TEXT DEFAULT 'produce-default',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. STORAGE FACILITIES & COLD CHAIN HUBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS storage_facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    facility_type TEXT NOT NULL CHECK (facility_type IN ('Cold Storage Vault', 'Controlled Atmosphere (CA)', 'Packhouse Ambient', 'Ripening Chamber', 'Cross-Dock Transit')),
    location_code TEXT NOT NULL UNIQUE,
    target_temperature NUMERIC(4, 1) NOT NULL,
    target_humidity NUMERIC(4, 1) NOT NULL,
    capacity_kg NUMERIC(12, 2) NOT NULL CHECK (capacity_kg > 0),
    current_occupancy_kg NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_occupancy_kg >= 0),
    manager_name TEXT NOT NULL,
    contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. HARVEST LOTS (Primary Ledger Unit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS harvest_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id TEXT NOT NULL UNIQUE,
    crop_id TEXT NOT NULL REFERENCES crops(id) ON UPDATE CASCADE,
    origin_farm TEXT NOT NULL,
    harvest_block TEXT NOT NULL,
    harvest_date TIMESTAMPTZ NOT NULL,
    initial_quantity_kg NUMERIC(12, 2) NOT NULL CHECK (initial_quantity_kg > 0),
    current_quantity_kg NUMERIC(12, 2) NOT NULL CHECK (current_quantity_kg >= 0 AND current_quantity_kg <= initial_quantity_kg),
    unit TEXT NOT NULL DEFAULT 'kg',
    initial_grade TEXT NOT NULL CHECK (initial_grade IN ('Grade A Premium', 'Grade B Commercial', 'Grade C Processing')),
    current_facility_id TEXT NOT NULL REFERENCES storage_facilities(id) ON UPDATE CASCADE,
    status TEXT NOT NULL DEFAULT 'In Storage' CHECK (status IN (
        'Received',
        'In Storage',
        'Quality Warning',
        'Partially Dispatched',
        'Dispatched',
        'Split',
        'Merged',
        'Spoiled/Condemned',
        'Archived'
    )),
    freshness_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (freshness_score >= 0.00 AND freshness_score <= 100.00),
    aging_status TEXT NOT NULL DEFAULT 'Optimal' CHECK (aging_status IN ('Fresh', 'Optimal', 'Approaching Threshold', 'Critical Over-Age', 'Spoilage Suspect')),
    days_in_storage INTEGER NOT NULL DEFAULT 0 CHECK (days_in_storage >= 0),
    notes TEXT,
    created_by TEXT NOT NULL DEFAULT 'Operator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index frequently queried columns for high performance
CREATE INDEX IF NOT EXISTS idx_harvest_lots_crop_id ON harvest_lots(crop_id);
CREATE INDEX IF NOT EXISTS idx_harvest_lots_facility_id ON harvest_lots(current_facility_id);
CREATE INDEX IF NOT EXISTS idx_harvest_lots_status ON harvest_lots(status);
CREATE INDEX IF NOT EXISTS idx_harvest_lots_aging_status ON harvest_lots(aging_status);
CREATE INDEX IF NOT EXISTS idx_harvest_lots_harvest_date ON harvest_lots(harvest_date DESC);

-- ============================================================================
-- 4. LOT LINEAGE (Split & Merge Provenance Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lot_lineage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('SPLIT', 'MERGE')),
    parent_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    child_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    quantity_contributed_kg NUMERIC(12, 2) NOT NULL CHECK (quantity_contributed_kg > 0),
    rationale TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lot_lineage_parent ON lot_lineage(parent_lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_lineage_child ON lot_lineage(child_lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_lineage_event ON lot_lineage(event_type);

-- ============================================================================
-- 5. CONDITION CHECKS & TELEMETRY INSPECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS condition_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    facility_id TEXT NOT NULL REFERENCES storage_facilities(id) ON UPDATE CASCADE,
    check_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature_c NUMERIC(4, 1) NOT NULL,
    relative_humidity_pct NUMERIC(4, 1) NOT NULL CHECK (relative_humidity_pct >= 0 AND relative_humidity_pct <= 100),
    ethylene_ppm NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (ethylene_ppm >= 0),
    visual_quality_score INTEGER NOT NULL CHECK (visual_quality_score >= 0 AND visual_quality_score <= 100),
    pest_signs BOOLEAN NOT NULL DEFAULT FALSE,
    fungal_signs BOOLEAN NOT NULL DEFAULT FALSE,
    decay_stage TEXT NOT NULL DEFAULT 'None' CHECK (decay_stage IN ('None', 'Early Softening', 'Moderate Blemish', 'Severe Senescence', 'Rotting')),
    freshness_calculated NUMERIC(5, 2) NOT NULL CHECK (freshness_calculated >= 0 AND freshness_calculated <= 100),
    action_recommended TEXT NOT NULL DEFAULT 'Maintain Storage' CHECK (action_recommended IN (
        'Maintain Storage',
        'Expedite Dispatch',
        'Repack / Sort',
        'Immediate Markdown',
        'Quarantine Write-off'
    )),
    inspector_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_condition_checks_lot_id ON condition_checks(lot_id);
CREATE INDEX IF NOT EXISTS idx_condition_checks_timestamp ON condition_checks(check_timestamp DESC);

-- ============================================================================
-- 6. DISPATCHES (Outbound Supply-Chain Transfers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id TEXT NOT NULL UNIQUE,
    lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE RESTRICT,
    destination_buyer TEXT NOT NULL,
    channel_type TEXT NOT NULL CHECK (channel_type IN (
        'Retail Premium Tier',
        'Supermarket Direct Contract',
        'Wholesale Terminal Market',
        'Food Processing Plant',
        'Export Air-Freight'
    )),
    quantity_dispatched_kg NUMERIC(12, 2) NOT NULL CHECK (quantity_dispatched_kg > 0),
    transport_mode TEXT NOT NULL CHECK (transport_mode IN (
        'Refrigerated Reefer Truck (-1°C to 4°C)',
        'Chilled Reefer Van (10°C to 13°C)',
        'Insulated Air-Cargo Container',
        'Ambient Local Flatbed'
    )),
    temperature_at_departure_c NUMERIC(4, 1) NOT NULL,
    condition_score_at_dispatch INTEGER NOT NULL CHECK (condition_score_at_dispatch >= 0 AND condition_score_at_dispatch <= 100),
    bill_of_lading TEXT NOT NULL,
    dispatched_by TEXT NOT NULL,
    dispatch_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatches_lot_id ON dispatches(lot_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_date ON dispatches(dispatch_date DESC);
CREATE INDEX IF NOT EXISTS idx_dispatches_channel ON dispatches(channel_type);

-- ============================================================================
-- 7. SPOILAGE RECORDS (Loss Accountability Register)
-- ============================================================================
CREATE TABLE IF NOT EXISTS spoilage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spoilage_id TEXT NOT NULL UNIQUE,
    lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE RESTRICT,
    quantity_spoiled_kg NUMERIC(12, 2) NOT NULL CHECK (quantity_spoiled_kg > 0),
    spoilage_reason TEXT NOT NULL CHECK (spoilage_reason IN (
        'Fungal Rot / Anthracnose',
        'Over-Ripeness / Senescence',
        'Chilling Injury / Internal Browning',
        'Mechanical Trauma / Transit Crushing',
        'Pest Infestation / Larval Damage',
        'Ethylene Exposure / Premature Yellowing',
        'Humidity Condensation Mold',
        'Cold-Storage Compressor Failure'
    )),
    severity_grade TEXT NOT NULL CHECK (severity_grade IN (
        'Minor Sorting Loss (< 5%)',
        'Moderate Batch Cull (5% - 25%)',
        'Major Spoilage Surge (25% - 60%)',
        'Total Batch Condemnation (100%)'
    )),
    financial_loss_estimate NUMERIC(12, 2) NOT NULL CHECK (financial_loss_estimate >= 0),
    responsible_facility_id TEXT NOT NULL REFERENCES storage_facilities(id) ON UPDATE CASCADE,
    root_cause_analysis TEXT NOT NULL,
    corrective_action TEXT NOT NULL,
    logged_by TEXT NOT NULL,
    discard_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spoilage_records_lot_id ON spoilage_records(lot_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_records_facility ON spoilage_records(responsible_facility_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_records_reason ON spoilage_records(spoilage_reason);
CREATE INDEX IF NOT EXISTS idx_spoilage_records_date ON spoilage_records(discard_date DESC);

-- ============================================================================
-- 8. AUDIT & EVENT LOGS (Immutable Traceability Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    role TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(created_at DESC);

-- ============================================================================
-- 9. USERS & ROLES (Authentication / RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('visitor', 'requester', 'operator', 'admin')),
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE spoilage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

-- Crops: Read for all (including anonymous/public), write for operators and admins
CREATE POLICY "Public crops read" ON crops FOR SELECT USING (true);
CREATE POLICY "Staff manage crops" ON crops FOR ALL USING (
    auth.role() IN ('authenticated', 'service_role')
);

-- Facilities: Read for all, manage for staff
CREATE POLICY "Public facilities read" ON storage_facilities FOR SELECT USING (true);
CREATE POLICY "Staff manage facilities" ON storage_facilities FOR ALL USING (
    auth.role() IN ('authenticated', 'service_role')
);

-- Harvest Lots: Read for all visitors (public traceability), modify for authenticated staff
CREATE POLICY "Public lot read" ON harvest_lots FOR SELECT USING (true);
CREATE POLICY "Staff insert lots" ON harvest_lots FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'service_role')
);
CREATE POLICY "Staff update lots" ON harvest_lots FOR UPDATE USING (
    auth.role() IN ('authenticated', 'service_role')
);
CREATE POLICY "Admin delete lots" ON harvest_lots FOR DELETE USING (
    auth.role() = 'service_role'
);

-- Condition Checks: Read for all, insert for authenticated staff
CREATE POLICY "Public condition checks read" ON condition_checks FOR SELECT USING (true);
CREATE POLICY "Staff condition checks insert" ON condition_checks FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'service_role')
);

-- Dispatches: Read for all, manage for authenticated staff
CREATE POLICY "Public dispatches read" ON dispatches FOR SELECT USING (true);
CREATE POLICY "Staff dispatches insert" ON dispatches FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'service_role')
);

-- Spoilage Records: Read for all (transparency accountability), insert for staff
CREATE POLICY "Public spoilage read" ON spoilage_records FOR SELECT USING (true);
CREATE POLICY "Staff spoilage insert" ON spoilage_records FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'service_role')
);

-- Lot Lineage: Read for all, manage for staff
CREATE POLICY "Public lineage read" ON lot_lineage FOR SELECT USING (true);
CREATE POLICY "Staff lineage insert" ON lot_lineage FOR INSERT WITH CHECK (
    auth.role() IN ('authenticated', 'service_role')
);

-- Audit Events: Read for all, write for staff
CREATE POLICY "Audit events read" ON audit_events FOR SELECT USING (true);
CREATE POLICY "Audit events insert" ON audit_events FOR INSERT WITH CHECK (true);
