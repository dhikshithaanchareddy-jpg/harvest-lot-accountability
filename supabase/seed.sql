-- ============================================================================
-- Seed Data: 20261028_seed.sql
-- Title: Harvest Lot Freshness and Spoilage Accountability Register
-- Description: Realistic synthetic demonstration dataset for agricultural produce,
--              cold storage inspections, lineage splits/merges, dispatches,
--              and spoilage accountability records.
-- ============================================================================

-- 1. CROPS SEED
INSERT INTO crops (id, name, category, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max, shelf_life_days, critical_aging_days, unit_price_per_kg, image_slug) VALUES
('CROP-MANGO', 'Alphonso Mango', 'Tropical Fruit', 11.5, 13.0, 85.0, 90.0, 16, 12, 4.80, 'mango'),
('CROP-AVOCADO', 'Hass Avocado', 'Subtropical Fruit', 5.5, 7.5, 85.0, 95.0, 24, 18, 3.90, 'avocado'),
('CROP-BERRY', 'Albion Strawberries', 'Berries', 0.5, 2.0, 90.0, 95.0, 8, 5, 6.50, 'strawberry'),
('CROP-TOMATO', 'Roma Plum Tomatoes', 'Vine Fruit', 12.0, 15.0, 85.0, 90.0, 20, 14, 2.40, 'tomato'),
('CROP-SPINACH', 'Baby Spinach Greens', 'Leafy Greens', 0.5, 2.5, 95.0, 98.0, 10, 6, 5.20, 'spinach'),
('CROP-PEPPER', 'Sweet Bell Peppers', 'Solanaceous Fruit', 7.0, 10.0, 90.0, 95.0, 21, 15, 3.20, 'pepper'),
('CROP-APPLE', 'Honeycrisp Apples', 'Pome Fruit', 1.0, 3.0, 90.0, 95.0, 90, 60, 2.80, 'apple')
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE FACILITIES SEED
INSERT INTO storage_facilities (id, name, facility_type, location_code, target_temperature, target_humidity, capacity_kg, current_occupancy_kg, manager_name, contact_phone) VALUES
('FAC-NORTH-VAULT-A', 'Valley North Cold Vault A', 'Cold Storage Vault', 'LOC-NV-A01', 2.0, 92.0, 45000.00, 18450.00, 'Marcus Vance', '+1 (555) 349-8812'),
('FAC-SIERRA-CA-02', 'Sierra Controlled Atmosphere Unit 2', 'Controlled Atmosphere (CA)', 'LOC-SCA-02', 12.0, 88.0, 60000.00, 31200.00, 'Elena Rostova', '+1 (555) 782-9901'),
('FAC-DELTA-RIPEN-01', 'Delta Precision Ripening Chamber 1', 'Ripening Chamber', 'LOC-DRC-01', 14.5, 85.0, 25000.00, 8400.00, 'Carlos Mendoza', '+1 (555) 412-6634'),
('FAC-PACIFIC-DOCK-04', 'Pacific Maritime Cross-Dock Terminal', 'Cross-Dock Transit', 'LOC-PMD-04', 6.0, 80.0, 35000.00, 11200.00, 'Aisha Al-Mansoor', '+1 (555) 901-4456'),
('FAC-HIGHLAND-PACK-03', 'Highland Ambient Packhouse 3', 'Packhouse Ambient', 'LOC-HAP-03', 18.0, 65.0, 50000.00, 14000.00, 'Liam O''Connor', '+1 (555) 234-7789')
ON CONFLICT (id) DO NOTHING;

-- 3. HARVEST LOTS SEED
-- Fixed UUIDs for predictable relational integrity across seed data
INSERT INTO harvest_lots (id, lot_id, crop_id, origin_farm, harvest_block, harvest_date, initial_quantity_kg, current_quantity_kg, initial_grade, current_facility_id, status, freshness_score, aging_status, days_in_storage, notes, created_by, created_at) VALUES
-- Lot 1: Fresh Alphonso Mangoes, peak condition
('a0000001-0000-0000-0000-000000000001', 'LOT-20261024-MNG-001', 'CROP-MANGO', 'Ratnagiri Suncrest Orchards', 'Block 3-South Terraces', NOW() - INTERVAL '3 days', 1800.00, 1800.00, 'Grade A Premium', 'FAC-SIERRA-CA-02', 'In Storage', 96.50, 'Fresh', 3, 'Export grade harvest, harvested at early breaker stage with brix 9.2%. Pre-cooled for 4 hours.', 'Marcus Vance', NOW() - INTERVAL '3 days'),

-- Lot 2: Hass Avocado, approaching threshold
('a0000001-0000-0000-0000-000000000002', 'LOT-20261011-AVO-004', 'CROP-AVOCADO', 'Michoacan Highland Growers Co-op', 'Sector 9 Mesa', NOW() - INTERVAL '16 days', 3200.00, 2150.00, 'Grade A Premium', 'FAC-PACIFIC-DOCK-04', 'Partially Dispatched', 68.20, 'Approaching Threshold', 16, 'Firm ripe state. Initial shipment dispatched to wholesale; remaining volume needs expedited buyer matching.', 'Elena Rostova', NOW() - INTERVAL '16 days'),

-- Lot 3: Albion Strawberries, critical aging risk
('a0000001-0000-0000-0000-000000000003', 'LOT-20261021-BER-008', 'CROP-BERRY', 'Watsonville Coastal Berry Ranch', 'Tunnel Patch 12', NOW() - INTERVAL '6 days', 950.00, 620.00, 'Grade A Premium', 'FAC-NORTH-VAULT-A', 'Quality Warning', 42.00, 'Critical Over-Age', 6, 'Exceeded 5-day optimal window. Mild calyx drying observed. Immediate dispatch or juice processing required.', 'Marcus Vance', NOW() - INTERVAL '6 days'),

-- Lot 4: Roma Tomatoes, optimal condition
('a0000001-0000-0000-0000-000000000004', 'LOT-20261020-TOM-012', 'CROP-TOMATO', 'San Joaquin Sun Valley Farms', 'Field 7-B Center Pivot', NOW() - INTERVAL '7 days', 4500.00, 4500.00, 'Grade B Commercial', 'FAC-SIERRA-CA-02', 'In Storage', 84.00, 'Optimal', 7, 'Commercial canning grade. High firmness, steady humidity maintenance in CA chamber.', 'Carlos Mendoza', NOW() - INTERVAL '7 days'),

-- Lot 5: Baby Spinach, fresh harvest
('a0000001-0000-0000-0000-000000000005', 'LOT-20261026-SPN-019', 'CROP-SPINACH', 'Salinas Green Valley Organics', 'Hydro Block A-2', NOW() - INTERVAL '1 day', 1200.00, 1200.00, 'Grade A Premium', 'FAC-NORTH-VAULT-A', 'In Storage', 98.00, 'Fresh', 1, 'Washed, hydro-cooled, packed at 1.5°C within 90 minutes of harvest.', 'Aisha Al-Mansoor', NOW() - INTERVAL '1 day'),

-- Lot 6: Sweet Bell Peppers (Parent lot that was split)
('a0000001-0000-0000-0000-000000000006', 'LOT-20261015-PEP-002', 'CROP-PEPPER', 'Bakersfield Arid Plains Nursery', 'Greenhouse 4', NOW() - INTERVAL '12 days', 2800.00, 0.00, 'Grade A Premium', 'FAC-PACIFIC-DOCK-04', 'Split', 82.00, 'Optimal', 12, 'Original harvest batch split on Day 4 into Retail Packaged Lot 2A and Foodservice Bulk Lot 2B.', 'Marcus Vance', NOW() - INTERVAL '12 days'),

-- Lot 7: Sweet Bell Peppers (Child lot 1 from split)
('a0000001-0000-0000-0000-000000000007', 'LOT-20261015-PEP-002-S1', 'CROP-PEPPER', 'Bakersfield Arid Plains Nursery', 'Greenhouse 4', NOW() - INTERVAL '12 days', 1600.00, 1600.00, 'Grade A Premium', 'FAC-PACIFIC-DOCK-04', 'In Storage', 74.50, 'Optimal', 12, 'Split Child: Selected premium 3-color retail 3-packs.', 'Marcus Vance', NOW() - INTERVAL '8 days'),

-- Lot 8: Sweet Bell Peppers (Child lot 2 from split, fully dispatched)
('a0000001-0000-0000-0000-000000000008', 'LOT-20261015-PEP-002-S2', 'CROP-PEPPER', 'Bakersfield Arid Plains Nursery', 'Greenhouse 4', NOW() - INTERVAL '12 days', 1200.00, 0.00, 'Grade B Commercial', 'FAC-PACIFIC-DOCK-04', 'Dispatched', 79.00, 'Optimal', 12, 'Split Child: Commercial bulk crates dispatched to Regional Commissary Kitchen.', 'Marcus Vance', NOW() - INTERVAL '8 days'),

-- Lot 9: Honeycrisp Apples (Merged Lot from two regional orchards)
('a0000001-0000-0000-0000-000000000009', 'LOT-20261005-APL-MRG-01', 'CROP-APPLE', 'Wenatchee River Valley Orchards', 'Combined Lots M1 & M2', NOW() - INTERVAL '22 days', 5000.00, 4100.00, 'Grade A Premium', 'FAC-NORTH-VAULT-A', 'Partially Dispatched', 91.00, 'Optimal', 22, 'Merged lot combining 2800kg Lot APL-09 and 2200kg Lot APL-10 for unified export palletization.', 'Elena Rostova', NOW() - INTERVAL '22 days'),

-- Lot 10: Mango Lot with Spoilage incident (Compressor thermal event)
('a0000001-0000-0000-0000-000000000010', 'LOT-20261018-MNG-009', 'CROP-MANGO', 'Devgad Coastal Groves', 'South Ridge 5', NOW() - INTERVAL '9 days', 2200.00, 1650.00, 'Grade A Premium', 'FAC-DELTA-RIPEN-01', 'Quality Warning', 54.00, 'Approaching Threshold', 9, 'Partial spoilage write-off of 550kg due to localized ethylene surge and soft rot in Ripening Chamber 1.', 'Carlos Mendoza', NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- 4. LOT LINEAGE SEED
INSERT INTO lot_lineage (id, event_type, parent_lot_id, child_lot_id, quantity_contributed_kg, rationale, performed_by, created_at) VALUES
('b0000001-0000-0000-0000-000000000001', 'SPLIT', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000007', 1600.00, 'Segregated 1600kg unblemished bell peppers for branded retail 3-pack sleeves.', 'Marcus Vance', NOW() - INTERVAL '8 days'),
('b0000001-0000-0000-0000-000000000002', 'SPLIT', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', 1200.00, 'Allocated 1200kg food-service grade peppers for fast-turnaround commissary delivery.', 'Marcus Vance', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- 5. CONDITION CHECKS SEED
INSERT INTO condition_checks (id, lot_id, facility_id, check_timestamp, temperature_c, relative_humidity_pct, ethylene_ppm, visual_quality_score, pest_signs, fungal_signs, decay_stage, freshness_calculated, action_recommended, inspector_name, notes) VALUES
('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'FAC-SIERRA-CA-02', NOW() - INTERVAL '2 days', 12.1, 88.5, 0.05, 98, false, false, 'None', 97.2, 'Maintain Storage', 'Elena Rostova', 'Exemplary condition. Skin luster optimal, no latex burn or mechanical bruising.'),
('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'FAC-SIERRA-CA-02', NOW() - INTERVAL '6 hours', 12.4, 87.8, 0.08, 96, false, false, 'None', 96.5, 'Maintain Storage', 'Marcus Vance', 'Steady atmosphere readings. Firmness index holding at 14.2 lbs.'),

('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'FAC-PACIFIC-DOCK-04', NOW() - INTERVAL '10 days', 6.2, 90.1, 0.12, 92, false, false, 'None', 88.0, 'Maintain Storage', 'Aisha Al-Mansoor', 'Color turning from dark green to forest green. Good dry matter test.'),
('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'FAC-PACIFIC-DOCK-04', NOW() - INTERVAL '1 day', 7.1, 86.4, 0.45, 71, false, false, 'Early Softening', 68.2, 'Expedite Dispatch', 'Marcus Vance', 'Softening detected on 12% sample. Must clear facility within 72 hours.'),

('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'FAC-NORTH-VAULT-A', NOW() - INTERVAL '4 days', 1.8, 93.0, 0.02, 80, false, false, 'None', 78.5, 'Maintain Storage', 'Liam O''Connor', 'Fresh berries, sugar levels high. Cold chain unbroken.'),
('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'FAC-NORTH-VAULT-A', NOW() - INTERVAL '12 hours', 2.9, 91.2, 0.18, 48, false, true, 'Moderate Blemish', 42.0, 'Repack / Sort', 'Marcus Vance', 'Botrytis mold flecks on 4 crates in lower pallet tier. Temperature spike detected overnight.'),

('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000010', 'FAC-DELTA-RIPEN-01', NOW() - INTERVAL '4 days', 16.8, 92.4, 1.80, 56, false, true, 'Moderate Blemish', 54.0, 'Quarantine Write-off', 'Carlos Mendoza', 'Ethylene spike due to sensor drift. Premature yellowing and stem end rot identified.')
ON CONFLICT (id) DO NOTHING;

-- 6. DISPATCHES SEED
INSERT INTO dispatches (id, dispatch_id, lot_id, destination_buyer, channel_type, quantity_dispatched_kg, transport_mode, temperature_at_departure_c, condition_score_at_dispatch, bill_of_lading, dispatched_by, dispatch_date, notes) VALUES
('d0000001-0000-0000-0000-000000000001', 'DSP-20261022-001', 'a0000001-0000-0000-0000-000000000002', 'Grand Marche Fresh Outlets', 'Supermarket Direct Contract', 1050.00, 'Refrigerated Reefer Truck (-1°C to 4°C)', 5.2, 84, 'BOL-GMF-99021', 'Aisha Al-Mansoor', NOW() - INTERVAL '5 days', 'Priority chilled transport. Temperature logger unit #SN-441 included inside Pallet 2.'),
('d0000001-0000-0000-0000-000000000002', 'DSP-20261023-002', 'a0000001-0000-0000-0000-000000000003', 'Smoothie King Valley Processing Hub', 'Food Processing Plant', 330.00, 'Chilled Reefer Van (10°C to 13°C)', 3.8, 65, 'BOL-SKV-33104', 'Marcus Vance', NOW() - INTERVAL '4 days', 'Diverted aging berry crates for immediate fruit purée conversion at discounted salvage price.'),
('d0000001-0000-0000-0000-000000000003', 'DSP-20261024-003', 'a0000001-0000-0000-0000-000000000008', 'Pacific Commissary Gourmet Kitchens', 'Wholesale Terminal Market', 1200.00, 'Refrigerated Reefer Truck (-1°C to 4°C)', 8.0, 80, 'BOL-PCG-10298', 'Elena Rostova', NOW() - INTERVAL '3 days', 'Full batch dispatch of split Lot PEP-002-S2. Delivered on schedule with zero transit rejects.'),
('d0000001-0000-0000-0000-000000000004', 'DSP-20261025-004', 'a0000001-0000-0000-0000-000000000009', 'Apex Tokyo Export Cargo Hub', 'Export Air-Freight', 900.00, 'Insulated Air-Cargo Container', 2.0, 93, 'BOL-APX-88219', 'Elena Rostova', NOW() - INTERVAL '2 days', 'First air cargo tranche of Honeycrisp Apples dispatched to Narita international gateway.')
ON CONFLICT (id) DO NOTHING;

-- 7. SPOILAGE RECORDS SEED
INSERT INTO spoilage_records (id, spoilage_id, lot_id, quantity_spoiled_kg, spoilage_reason, severity_grade, financial_loss_estimate, responsible_facility_id, root_cause_analysis, corrective_action, logged_by, discard_date) VALUES
('e0000001-0000-0000-0000-000000000001', 'SPL-20261022-001', 'a0000001-0000-0000-0000-000000000010', '550.00', 'Ethylene Exposure / Premature Yellowing', 'Major Spoilage Surge (25% - 60%)', 2640.00, 'FAC-DELTA-RIPEN-01', 'Exhaust fan damper stuck in 20% open position causing ethylene gas recirculation over 48 hours instead of scheduled purge.', 'Damper actuator replaced, dual redundant ethylene scrubber sensor installed with hourly alert threshold of 0.8 ppm.', 'Carlos Mendoza', NOW() - INTERVAL '5 days'),
('e0000001-0000-0000-0000-000000000002', 'SPL-20261023-002', 'a0000001-0000-0000-0000-000000000003', '40.00', 'Fungal Rot / Anthracnose', 'Minor Sorting Loss (< 5%)', 260.00, 'FAC-NORTH-VAULT-A', 'Pallet corner crushing during forklift staging exposed bottom berry clamshells to moisture condensation and Botrytis germination.', 'Restricted stacking limit to 4 tiers high on berry pallets; added corner board protectors for all transit moves.', 'Marcus Vance', NOW() - INTERVAL '3 days'),
('e0000001-0000-0000-0000-000000000003', 'SPL-20261014-003', 'a0000001-0000-0000-0000-000000000002', '120.00', 'Chilling Injury / Internal Browning', 'Minor Sorting Loss (< 5%)', 468.00, 'FAC-PACIFIC-DOCK-04', 'Avocado lot staged too close to cold air discharge nozzle (temperature measured at 3.1°C vs 6.0°C threshold) for 36 hours.', 'Installed thermal baffles directly beneath refrigeration discharge vents; updated staging grid buffer zones.', 'Aisha Al-Mansoor', NOW() - INTERVAL '13 days')
ON CONFLICT (id) DO NOTHING;

-- 8. AUDIT EVENTS SEED
INSERT INTO audit_events (id, entity_type, entity_id, action, performed_by, role, details, created_at) VALUES
('f0000001-0000-0000-0000-000000000001', 'LOT', 'LOT-20261024-MNG-001', 'CREATE', 'Marcus Vance', 'operator', '{"initial_quantity_kg": 1800, "crop": "Alphonso Mango", "origin": "Ratnagiri Suncrest Orchards"}'::jsonb, NOW() - INTERVAL '3 days'),
('f0000001-0000-0000-0000-000000000002', 'LINEAGE', 'LOT-20261015-PEP-002', 'SPLIT', 'Marcus Vance', 'operator', '{"parent_lot": "LOT-20261015-PEP-002", "children": ["LOT-20261015-PEP-002-S1", "LOT-20261015-PEP-002-S2"], "total_qty": 2800}'::jsonb, NOW() - INTERVAL '8 days'),
('f0000001-0000-0000-0000-000000000003', 'SPOILAGE', 'SPL-20261022-001', 'SPOILAGE_WRITEOFF', 'Carlos Mendoza', 'operator', '{"lot_id": "LOT-20261018-MNG-009", "quantity_spoiled_kg": 550, "loss_amount": 2640, "reason": "Ethylene Exposure / Premature Yellowing"}'::jsonb, NOW() - INTERVAL '5 days'),
('f0000001-0000-0000-0000-000000000004', 'DISPATCH', 'DSP-20261022-001', 'DISPATCH', 'Aisha Al-Mansoor', 'operator', '{"lot_id": "LOT-20261011-AVO-004", "quantity_kg": 1050, "buyer": "Grand Marche Fresh Outlets"}'::jsonb, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 9. SYSTEM USERS SEED (Persona Accounts for Testing & Evaluation)
INSERT INTO system_users (id, email, full_name, role, department) VALUES
('u0000001-0000-0000-0000-000000000001', 'admin@harvestledger.ag', 'Dr. Elena Rostova', 'admin', 'Quality & Cold Chain Direction'),
('u0000001-0000-0000-0000-000000000002', 'marcus.vance@harvestledger.ag', 'Marcus Vance', 'operator', 'Cold Storage Logistics & QA'),
('u0000001-0000-0000-0000-000000000003', 'carlos.m@harvestledger.ag', 'Carlos Mendoza', 'operator', 'Ripening & Packhouse Operations'),
('u0000001-0000-0000-0000-000000000004', 'sophie.buyer@freshmarkets.com', 'Sophie Chen', 'requester', 'Supermarket Procurement'),
('u0000001-0000-0000-0000-000000000005', 'visitor@public.ag', 'Public Traceability Visitor', 'visitor', 'Consumer / External Auditor')
ON CONFLICT (id) DO NOTHING;
