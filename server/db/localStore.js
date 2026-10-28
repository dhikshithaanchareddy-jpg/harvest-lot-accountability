// server/db/localStore.js
// In-engine persistent store mirroring the Supabase schema and business logic
// Guarantees zero-friction execution when external Supabase keys are pending.

const crypto = require('crypto');

class LocalStore {
  constructor() {
    this.crops = [];
    this.storageFacilities = [];
    this.harvestLots = [];
    this.lotLineage = [];
    this.conditionChecks = [];
    this.dispatches = [];
    this.spoilageRecords = [];
    this.auditEvents = [];
    this.systemUsers = [];
    this.initSeedData();
  }

  initSeedData() {
    // 1. Crops
    this.crops = [
      {
        id: 'CROP-MANGO',
        name: 'Alphonso Mango',
        category: 'Tropical Fruit',
        optimal_temp_min: 11.5,
        optimal_temp_max: 13.0,
        optimal_humidity_min: 85.0,
        optimal_humidity_max: 90.0,
        shelf_life_days: 16,
        critical_aging_days: 12,
        unit_price_per_kg: 4.80,
        image_slug: 'mango',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'CROP-AVOCADO',
        name: 'Hass Avocado',
        category: 'Subtropical Fruit',
        optimal_temp_min: 5.5,
        optimal_temp_max: 7.5,
        optimal_humidity_min: 85.0,
        optimal_humidity_max: 95.0,
        shelf_life_days: 24,
        critical_aging_days: 18,
        unit_price_per_kg: 3.90,
        image_slug: 'avocado',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'CROP-BERRY',
        name: 'Albion Strawberries',
        category: 'Berries',
        optimal_temp_min: 0.5,
        optimal_temp_max: 2.0,
        optimal_humidity_min: 90.0,
        optimal_humidity_max: 95.0,
        shelf_life_days: 8,
        critical_aging_days: 5,
        unit_price_per_kg: 6.50,
        image_slug: 'strawberry',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'CROP-TOMATO',
        name: 'Roma Plum Tomatoes',
        category: 'Vine Fruit',
        optimal_temp_min: 12.0,
        optimal_temp_max: 15.0,
        optimal_humidity_min: 85.0,
        optimal_humidity_max: 90.0,
        shelf_life_days: 20,
        critical_aging_days: 14,
        unit_price_per_kg: 2.40,
        image_slug: 'tomato',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'CROP-SPINACH',
        name: 'Baby Spinach Greens',
        category: 'Leafy Greens',
        optimal_temp_min: 0.5,
        optimal_temp_max: 2.5,
        optimal_humidity_min: 95.0,
        optimal_humidity_max: 98.0,
        shelf_life_days: 10,
        critical_aging_days: 6,
        unit_price_per_kg: 5.20,
        image_slug: 'spinach',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'CROP-PEPPER',
        name: 'Sweet Bell Peppers',
        category: 'Solanaceous Fruit',
        optimal_temp_min: 7.0,
        optimal_temp_max: 10.0,
        optimal_humidity_min: 90.0,
        optimal_humidity_max: 95.0,
        shelf_life_days: 21,
        critical_aging_days: 15,
        unit_price_per_kg: 3.20,
        image_slug: 'pepper',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'CROP-APPLE',
        name: 'Honeycrisp Apples',
        category: 'Pome Fruit',
        optimal_temp_min: 1.0,
        optimal_temp_max: 3.0,
        optimal_humidity_min: 90.0,
        optimal_humidity_max: 95.0,
        shelf_life_days: 90,
        critical_aging_days: 60,
        unit_price_per_kg: 2.80,
        image_slug: 'apple',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      }
    ];

    // 2. Facilities
    this.storageFacilities = [
      {
        id: 'FAC-NORTH-VAULT-A',
        name: 'Valley North Cold Vault A',
        facility_type: 'Cold Storage Vault',
        location_code: 'LOC-NV-A01',
        target_temperature: 2.0,
        target_humidity: 92.0,
        capacity_kg: 45000.0,
        current_occupancy_kg: 18450.0,
        manager_name: 'Marcus Vance',
        contact_phone: '+1 (555) 349-8812',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'FAC-SIERRA-CA-02',
        name: 'Sierra Controlled Atmosphere Unit 2',
        facility_type: 'Controlled Atmosphere (CA)',
        location_code: 'LOC-SCA-02',
        target_temperature: 12.0,
        target_humidity: 88.0,
        capacity_kg: 60000.0,
        current_occupancy_kg: 31200.0,
        manager_name: 'Elena Rostova',
        contact_phone: '+1 (555) 782-9901',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'FAC-DELTA-RIPEN-01',
        name: 'Delta Precision Ripening Chamber 1',
        facility_type: 'Ripening Chamber',
        location_code: 'LOC-DRC-01',
        target_temperature: 14.5,
        target_humidity: 85.0,
        capacity_kg: 25000.0,
        current_occupancy_kg: 8400.0,
        manager_name: 'Carlos Mendoza',
        contact_phone: '+1 (555) 412-6634',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'FAC-PACIFIC-DOCK-04',
        name: 'Pacific Maritime Cross-Dock Terminal',
        facility_type: 'Cross-Dock Transit',
        location_code: 'LOC-PMD-04',
        target_temperature: 6.0,
        target_humidity: 80.0,
        capacity_kg: 35000.0,
        current_occupancy_kg: 11200.0,
        manager_name: 'Aisha Al-Mansoor',
        contact_phone: '+1 (555) 901-4456',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'FAC-HIGHLAND-PACK-03',
        name: 'Highland Ambient Packhouse 3',
        facility_type: 'Packhouse Ambient',
        location_code: 'LOC-HAP-03',
        target_temperature: 18.0,
        target_humidity: 65.0,
        capacity_kg: 50000.0,
        current_occupancy_kg: 14000.0,
        manager_name: 'Liam O\'Connor',
        contact_phone: '+1 (555) 234-7789',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      }
    ];

    // 3. Harvest Lots
    const now = Date.now();
    this.harvestLots = [
      {
        id: 'a0000001-0000-0000-0000-000000000001',
        lot_id: 'LOT-20261024-MNG-001',
        crop_id: 'CROP-MANGO',
        origin_farm: 'Ratnagiri Suncrest Orchards',
        harvest_block: 'Block 3-South Terraces',
        harvest_date: new Date(now - 3 * 86400000).toISOString(),
        initial_quantity_kg: 1800.00,
        current_quantity_kg: 1800.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-SIERRA-CA-02',
        status: 'In Storage',
        freshness_score: 96.50,
        aging_status: 'Fresh',
        days_in_storage: 3,
        notes: 'Export grade harvest, harvested at early breaker stage with brix 9.2%. Pre-cooled for 4 hours.',
        created_by: 'Marcus Vance',
        created_at: new Date(now - 3 * 86400000).toISOString(),
        updated_at: new Date(now - 3 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000002',
        lot_id: 'LOT-20261011-AVO-004',
        crop_id: 'CROP-AVOCADO',
        origin_farm: 'Michoacan Highland Growers Co-op',
        harvest_block: 'Sector 9 Mesa',
        harvest_date: new Date(now - 16 * 86400000).toISOString(),
        initial_quantity_kg: 3200.00,
        current_quantity_kg: 2030.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-PACIFIC-DOCK-04',
        status: 'Partially Dispatched',
        freshness_score: 68.20,
        aging_status: 'Approaching Threshold',
        days_in_storage: 16,
        notes: 'Firm ripe state. Initial shipment dispatched to wholesale; remaining volume needs expedited buyer matching.',
        created_by: 'Elena Rostova',
        created_at: new Date(now - 16 * 86400000).toISOString(),
        updated_at: new Date(now - 1 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000003',
        lot_id: 'LOT-20261021-BER-008',
        crop_id: 'CROP-BERRY',
        origin_farm: 'Watsonville Coastal Berry Ranch',
        harvest_block: 'Tunnel Patch 12',
        harvest_date: new Date(now - 6 * 86400000).toISOString(),
        initial_quantity_kg: 950.00,
        current_quantity_kg: 580.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-NORTH-VAULT-A',
        status: 'Quality Warning',
        freshness_score: 42.00,
        aging_status: 'Critical Over-Age',
        days_in_storage: 6,
        notes: 'Exceeded 5-day optimal window. Mild calyx drying observed. Immediate dispatch or juice processing required.',
        created_by: 'Marcus Vance',
        created_at: new Date(now - 6 * 86400000).toISOString(),
        updated_at: new Date(now - 12 * 3600000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000004',
        lot_id: 'LOT-20261020-TOM-012',
        crop_id: 'CROP-TOMATO',
        origin_farm: 'San Joaquin Sun Valley Farms',
        harvest_block: 'Field 7-B Center Pivot',
        harvest_date: new Date(now - 7 * 86400000).toISOString(),
        initial_quantity_kg: 4500.00,
        current_quantity_kg: 4500.00,
        unit: 'kg',
        initial_grade: 'Grade B Commercial',
        current_facility_id: 'FAC-SIERRA-CA-02',
        status: 'In Storage',
        freshness_score: 84.00,
        aging_status: 'Optimal',
        days_in_storage: 7,
        notes: 'Commercial canning grade. High firmness, steady humidity maintenance in CA chamber.',
        created_by: 'Carlos Mendoza',
        created_at: new Date(now - 7 * 86400000).toISOString(),
        updated_at: new Date(now - 7 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000005',
        lot_id: 'LOT-20261026-SPN-019',
        crop_id: 'CROP-SPINACH',
        origin_farm: 'Salinas Green Valley Organics',
        harvest_block: 'Hydro Block A-2',
        harvest_date: new Date(now - 1 * 86400000).toISOString(),
        initial_quantity_kg: 1200.00,
        current_quantity_kg: 1200.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-NORTH-VAULT-A',
        status: 'In Storage',
        freshness_score: 98.00,
        aging_status: 'Fresh',
        days_in_storage: 1,
        notes: 'Washed, hydro-cooled, packed at 1.5°C within 90 minutes of harvest.',
        created_by: 'Aisha Al-Mansoor',
        created_at: new Date(now - 1 * 86400000).toISOString(),
        updated_at: new Date(now - 1 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000006',
        lot_id: 'LOT-20261015-PEP-002',
        crop_id: 'CROP-PEPPER',
        origin_farm: 'Bakersfield Arid Plains Nursery',
        harvest_block: 'Greenhouse 4',
        harvest_date: new Date(now - 12 * 86400000).toISOString(),
        initial_quantity_kg: 2800.00,
        current_quantity_kg: 0.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-PACIFIC-DOCK-04',
        status: 'Split',
        freshness_score: 82.00,
        aging_status: 'Optimal',
        days_in_storage: 12,
        notes: 'Original harvest batch split on Day 4 into Retail Packaged Lot 2A and Foodservice Bulk Lot 2B.',
        created_by: 'Marcus Vance',
        created_at: new Date(now - 12 * 86400000).toISOString(),
        updated_at: new Date(now - 8 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000007',
        lot_id: 'LOT-20261015-PEP-002-S1',
        crop_id: 'CROP-PEPPER',
        origin_farm: 'Bakersfield Arid Plains Nursery',
        harvest_block: 'Greenhouse 4',
        harvest_date: new Date(now - 12 * 86400000).toISOString(),
        initial_quantity_kg: 1600.00,
        current_quantity_kg: 1600.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-PACIFIC-DOCK-04',
        status: 'In Storage',
        freshness_score: 74.50,
        aging_status: 'Optimal',
        days_in_storage: 12,
        notes: 'Split Child: Selected premium 3-color retail 3-packs.',
        created_by: 'Marcus Vance',
        created_at: new Date(now - 8 * 86400000).toISOString(),
        updated_at: new Date(now - 8 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000008',
        lot_id: 'LOT-20261015-PEP-002-S2',
        crop_id: 'CROP-PEPPER',
        origin_farm: 'Bakersfield Arid Plains Nursery',
        harvest_block: 'Greenhouse 4',
        harvest_date: new Date(now - 12 * 86400000).toISOString(),
        initial_quantity_kg: 1200.00,
        current_quantity_kg: 0.00,
        unit: 'kg',
        initial_grade: 'Grade B Commercial',
        current_facility_id: 'FAC-PACIFIC-DOCK-04',
        status: 'Dispatched',
        freshness_score: 79.00,
        aging_status: 'Optimal',
        days_in_storage: 12,
        notes: 'Split Child: Commercial bulk crates dispatched to Regional Commissary Kitchen.',
        created_by: 'Marcus Vance',
        created_at: new Date(now - 8 * 86400000).toISOString(),
        updated_at: new Date(now - 3 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000009',
        lot_id: 'LOT-20261005-APL-MRG-01',
        crop_id: 'CROP-APPLE',
        origin_farm: 'Wenatchee River Valley Orchards',
        harvest_block: 'Combined Lots M1 & M2',
        harvest_date: new Date(now - 22 * 86400000).toISOString(),
        initial_quantity_kg: 5000.00,
        current_quantity_kg: 4100.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-NORTH-VAULT-A',
        status: 'Partially Dispatched',
        freshness_score: 91.00,
        aging_status: 'Optimal',
        days_in_storage: 22,
        notes: 'Merged lot combining 2800kg Lot APL-09 and 2200kg Lot APL-10 for unified export palletization.',
        created_by: 'Elena Rostova',
        created_at: new Date(now - 22 * 86400000).toISOString(),
        updated_at: new Date(now - 2 * 86400000).toISOString()
      },
      {
        id: 'a0000001-0000-0000-0000-000000000010',
        lot_id: 'LOT-20261018-MNG-009',
        crop_id: 'CROP-MANGO',
        origin_farm: 'Devgad Coastal Groves',
        harvest_block: 'South Ridge 5',
        harvest_date: new Date(now - 9 * 86400000).toISOString(),
        initial_quantity_kg: 2200.00,
        current_quantity_kg: 1650.00,
        unit: 'kg',
        initial_grade: 'Grade A Premium',
        current_facility_id: 'FAC-DELTA-RIPEN-01',
        status: 'Quality Warning',
        freshness_score: 54.00,
        aging_status: 'Approaching Threshold',
        days_in_storage: 9,
        notes: 'Partial spoilage write-off of 550kg due to localized ethylene surge and soft rot in Ripening Chamber 1.',
        created_by: 'Carlos Mendoza',
        created_at: new Date(now - 9 * 86400000).toISOString(),
        updated_at: new Date(now - 5 * 86400000).toISOString()
      }
    ];

    // 4. Lineage
    this.lotLineage = [
      {
        id: 'b0000001-0000-0000-0000-000000000001',
        event_type: 'SPLIT',
        parent_lot_id: 'a0000001-0000-0000-0000-000000000006',
        child_lot_id: 'a0000001-0000-0000-0000-000000000007',
        quantity_contributed_kg: 1600.00,
        rationale: 'Segregated 1600kg unblemished bell peppers for branded retail 3-pack sleeves.',
        performed_by: 'Marcus Vance',
        created_at: new Date(now - 8 * 86400000).toISOString()
      },
      {
        id: 'b0000001-0000-0000-0000-000000000002',
        event_type: 'SPLIT',
        parent_lot_id: 'a0000001-0000-0000-0000-000000000006',
        child_lot_id: 'a0000001-0000-0000-0000-000000000008',
        quantity_contributed_kg: 1200.00,
        rationale: 'Allocated 1200kg food-service grade peppers for fast-turnaround commissary delivery.',
        performed_by: 'Marcus Vance',
        created_at: new Date(now - 8 * 86400000).toISOString()
      }
    ];

    // 5. Condition Checks
    this.conditionChecks = [
      {
        id: 'c0000001-0000-0000-0000-000000000001',
        lot_id: 'a0000001-0000-0000-0000-000000000001',
        facility_id: 'FAC-SIERRA-CA-02',
        check_timestamp: new Date(now - 2 * 86400000).toISOString(),
        temperature_c: 12.1,
        relative_humidity_pct: 88.5,
        ethylene_ppm: 0.05,
        visual_quality_score: 98,
        pest_signs: false,
        fungal_signs: false,
        decay_stage: 'None',
        freshness_calculated: 97.2,
        action_recommended: 'Maintain Storage',
        inspector_name: 'Elena Rostova',
        notes: 'Exemplary condition. Skin luster optimal, no latex burn or mechanical bruising.',
        created_at: new Date(now - 2 * 86400000).toISOString()
      },
      {
        id: 'c0000001-0000-0000-0000-000000000002',
        lot_id: 'a0000001-0000-0000-0000-000000000001',
        facility_id: 'FAC-SIERRA-CA-02',
        check_timestamp: new Date(now - 6 * 3600000).toISOString(),
        temperature_c: 12.4,
        relative_humidity_pct: 87.8,
        ethylene_ppm: 0.08,
        visual_quality_score: 96,
        pest_signs: false,
        fungal_signs: false,
        decay_stage: 'None',
        freshness_calculated: 96.5,
        action_recommended: 'Maintain Storage',
        inspector_name: 'Marcus Vance',
        notes: 'Steady atmosphere readings. Firmness index holding at 14.2 lbs.',
        created_at: new Date(now - 6 * 3600000).toISOString()
      },
      {
        id: 'c0000001-0000-0000-0000-000000000003',
        lot_id: 'a0000001-0000-0000-0000-000000000002',
        facility_id: 'FAC-PACIFIC-DOCK-04',
        check_timestamp: new Date(now - 10 * 86400000).toISOString(),
        temperature_c: 6.2,
        relative_humidity_pct: 90.1,
        ethylene_ppm: 0.12,
        visual_quality_score: 92,
        pest_signs: false,
        fungal_signs: false,
        decay_stage: 'None',
        freshness_calculated: 88.0,
        action_recommended: 'Maintain Storage',
        inspector_name: 'Aisha Al-Mansoor',
        notes: 'Color turning from dark green to forest green. Good dry matter test.',
        created_at: new Date(now - 10 * 86400000).toISOString()
      },
      {
        id: 'c0000001-0000-0000-0000-000000000004',
        lot_id: 'a0000001-0000-0000-0000-000000000002',
        facility_id: 'FAC-PACIFIC-DOCK-04',
        check_timestamp: new Date(now - 1 * 86400000).toISOString(),
        temperature_c: 7.1,
        relative_humidity_pct: 86.4,
        ethylene_ppm: 0.45,
        visual_quality_score: 71,
        pest_signs: false,
        fungal_signs: false,
        decay_stage: 'Early Softening',
        freshness_calculated: 68.2,
        action_recommended: 'Expedite Dispatch',
        inspector_name: 'Marcus Vance',
        notes: 'Softening detected on 12% sample. Must clear facility within 72 hours.',
        created_at: new Date(now - 1 * 86400000).toISOString()
      },
      {
        id: 'c0000001-0000-0000-0000-000000000005',
        lot_id: 'a0000001-0000-0000-0000-000000000003',
        facility_id: 'FAC-NORTH-VAULT-A',
        check_timestamp: new Date(now - 4 * 86400000).toISOString(),
        temperature_c: 1.8,
        relative_humidity_pct: 93.0,
        ethylene_ppm: 0.02,
        visual_quality_score: 80,
        pest_signs: false,
        fungal_signs: false,
        decay_stage: 'None',
        freshness_calculated: 78.5,
        action_recommended: 'Maintain Storage',
        inspector_name: 'Liam O\'Connor',
        notes: 'Fresh berries, sugar levels high. Cold chain unbroken.',
        created_at: new Date(now - 4 * 86400000).toISOString()
      },
      {
        id: 'c0000001-0000-0000-0000-000000000006',
        lot_id: 'a0000001-0000-0000-0000-000000000003',
        facility_id: 'FAC-NORTH-VAULT-A',
        check_timestamp: new Date(now - 12 * 3600000).toISOString(),
        temperature_c: 2.9,
        relative_humidity_pct: 91.2,
        ethylene_ppm: 0.18,
        visual_quality_score: 48,
        pest_signs: false,
        fungal_signs: true,
        decay_stage: 'Moderate Blemish',
        freshness_calculated: 42.0,
        action_recommended: 'Repack / Sort',
        inspector_name: 'Marcus Vance',
        notes: 'Botrytis mold flecks on 4 crates in lower pallet tier. Temperature spike detected overnight.',
        created_at: new Date(now - 12 * 3600000).toISOString()
      },
      {
        id: 'c0000001-0000-0000-0000-000000000007',
        lot_id: 'a0000001-0000-0000-0000-000000000010',
        facility_id: 'FAC-DELTA-RIPEN-01',
        check_timestamp: new Date(now - 4 * 86400000).toISOString(),
        temperature_c: 16.8,
        relative_humidity_pct: 92.4,
        ethylene_ppm: 1.80,
        visual_quality_score: 56,
        pest_signs: false,
        fungal_signs: true,
        decay_stage: 'Moderate Blemish',
        freshness_calculated: 54.0,
        action_recommended: 'Quarantine Write-off',
        inspector_name: 'Carlos Mendoza',
        notes: 'Ethylene spike due to sensor drift. Premature yellowing and stem end rot identified.',
        created_at: new Date(now - 4 * 86400000).toISOString()
      }
    ];

    // 6. Dispatches
    this.dispatches = [
      {
        id: 'd0000001-0000-0000-0000-000000000001',
        dispatch_id: 'DSP-20261022-001',
        lot_id: 'a0000001-0000-0000-0000-000000000002',
        destination_buyer: 'Grand Marche Fresh Outlets',
        channel_type: 'Supermarket Direct Contract',
        quantity_dispatched_kg: 1050.00,
        transport_mode: 'Refrigerated Reefer Truck (-1°C to 4°C)',
        temperature_at_departure_c: 5.2,
        condition_score_at_dispatch: 84,
        bill_of_lading: 'BOL-GMF-99021',
        dispatched_by: 'Aisha Al-Mansoor',
        dispatch_date: new Date(now - 5 * 86400000).toISOString(),
        notes: 'Priority chilled transport. Temperature logger unit #SN-441 included inside Pallet 2.',
        created_at: new Date(now - 5 * 86400000).toISOString()
      },
      {
        id: 'd0000001-0000-0000-0000-000000000002',
        dispatch_id: 'DSP-20261023-002',
        lot_id: 'a0000001-0000-0000-0000-000000000003',
        destination_buyer: 'Smoothie King Valley Processing Hub',
        channel_type: 'Food Processing Plant',
        quantity_dispatched_kg: 330.00,
        transport_mode: 'Chilled Reefer Van (10°C to 13°C)',
        temperature_at_departure_c: 3.8,
        condition_score_at_dispatch: 65,
        bill_of_lading: 'BOL-SKV-33104',
        dispatched_by: 'Marcus Vance',
        dispatch_date: new Date(now - 4 * 86400000).toISOString(),
        notes: 'Diverted aging berry crates for immediate fruit purée conversion at discounted salvage price.',
        created_at: new Date(now - 4 * 86400000).toISOString()
      },
      {
        id: 'd0000001-0000-0000-0000-000000000003',
        dispatch_id: 'DSP-20261024-003',
        lot_id: 'a0000001-0000-0000-0000-000000000008',
        destination_buyer: 'Pacific Commissary Gourmet Kitchens',
        channel_type: 'Wholesale Terminal Market',
        quantity_dispatched_kg: 1200.00,
        transport_mode: 'Refrigerated Reefer Truck (-1°C to 4°C)',
        temperature_at_departure_c: 8.0,
        condition_score_at_dispatch: 80,
        bill_of_lading: 'BOL-PCG-10298',
        dispatched_by: 'Elena Rostova',
        dispatch_date: new Date(now - 3 * 86400000).toISOString(),
        notes: 'Full batch dispatch of split Lot PEP-002-S2. Delivered on schedule with zero transit rejects.',
        created_at: new Date(now - 3 * 86400000).toISOString()
      },
      {
        id: 'd0000001-0000-0000-0000-000000000004',
        dispatch_id: 'DSP-20261025-004',
        lot_id: 'a0000001-0000-0000-0000-000000000009',
        destination_buyer: 'Apex Tokyo Export Cargo Hub',
        channel_type: 'Export Air-Freight',
        quantity_dispatched_kg: 900.00,
        transport_mode: 'Insulated Air-Cargo Container',
        temperature_at_departure_c: 2.0,
        condition_score_at_dispatch: 93,
        bill_of_lading: 'BOL-APX-88219',
        dispatched_by: 'Elena Rostova',
        dispatch_date: new Date(now - 2 * 86400000).toISOString(),
        notes: 'First air cargo tranche of Honeycrisp Apples dispatched to Narita international gateway.',
        created_at: new Date(now - 2 * 86400000).toISOString()
      }
    ];

    // 7. Spoilage Records
    this.spoilageRecords = [
      {
        id: 'e0000001-0000-0000-0000-000000000001',
        spoilage_id: 'SPL-20261022-001',
        lot_id: 'a0000001-0000-0000-0000-000000000010',
        quantity_spoiled_kg: 550.00,
        spoilage_reason: 'Ethylene Exposure / Premature Yellowing',
        severity_grade: 'Major Spoilage Surge (25% - 60%)',
        financial_loss_estimate: 2640.00,
        responsible_facility_id: 'FAC-DELTA-RIPEN-01',
        root_cause_analysis: 'Exhaust fan damper stuck in 20% open position causing ethylene gas recirculation over 48 hours instead of scheduled purge.',
        corrective_action: 'Damper actuator replaced, dual redundant ethylene scrubber sensor installed with hourly alert threshold of 0.8 ppm.',
        logged_by: 'Carlos Mendoza',
        discard_date: new Date(now - 5 * 86400000).toISOString(),
        created_at: new Date(now - 5 * 86400000).toISOString()
      },
      {
        id: 'e0000001-0000-0000-0000-000000000002',
        spoilage_id: 'SPL-20261023-002',
        lot_id: 'a0000001-0000-0000-0000-000000000003',
        quantity_spoiled_kg: 40.00,
        spoilage_reason: 'Fungal Rot / Anthracnose',
        severity_grade: 'Minor Sorting Loss (< 5%)',
        financial_loss_estimate: 260.00,
        responsible_facility_id: 'FAC-NORTH-VAULT-A',
        root_cause_analysis: 'Pallet corner crushing during forklift staging exposed bottom berry clamshells to moisture condensation and Botrytis germination.',
        corrective_action: 'Restricted stacking limit to 4 tiers high on berry pallets; added corner board protectors for all transit moves.',
        logged_by: 'Marcus Vance',
        discard_date: new Date(now - 3 * 86400000).toISOString(),
        created_at: new Date(now - 3 * 86400000).toISOString()
      },
      {
        id: 'e0000001-0000-0000-0000-000000000003',
        spoilage_id: 'SPL-20261014-003',
        lot_id: 'a0000001-0000-0000-0000-000000000002',
        quantity_spoiled_kg: 120.00,
        spoilage_reason: 'Chilling Injury / Internal Browning',
        severity_grade: 'Minor Sorting Loss (< 5%)',
        financial_loss_estimate: 468.00,
        responsible_facility_id: 'FAC-PACIFIC-DOCK-04',
        root_cause_analysis: 'Avocado lot staged too close to cold air discharge nozzle (temperature measured at 3.1°C vs 6.0°C threshold) for 36 hours.',
        corrective_action: 'Installed thermal baffles directly beneath refrigeration discharge vents; updated staging grid buffer zones.',
        logged_by: 'Aisha Al-Mansoor',
        discard_date: new Date(now - 13 * 86400000).toISOString(),
        created_at: new Date(now - 13 * 86400000).toISOString()
      }
    ];

    // 8. Audit Events
    this.auditEvents = [
      {
        id: 'f0000001-0000-0000-0000-000000000001',
        entity_type: 'LOT',
        entity_id: 'LOT-20261024-MNG-001',
        action: 'CREATE',
        performed_by: 'Marcus Vance',
        role: 'operator',
        details: { initial_quantity_kg: 1800, crop: 'Alphonso Mango', origin: 'Ratnagiri Suncrest Orchards' },
        created_at: new Date(now - 3 * 86400000).toISOString()
      },
      {
        id: 'f0000001-0000-0000-0000-000000000002',
        entity_type: 'LINEAGE',
        entity_id: 'LOT-20261015-PEP-002',
        action: 'SPLIT',
        performed_by: 'Marcus Vance',
        role: 'operator',
        details: { parent_lot: 'LOT-20261015-PEP-002', children: ['LOT-20261015-PEP-002-S1', 'LOT-20261015-PEP-002-S2'], total_qty: 2800 },
        created_at: new Date(now - 8 * 86400000).toISOString()
      },
      {
        id: 'f0000001-0000-0000-0000-000000000003',
        entity_type: 'SPOILAGE',
        entity_id: 'SPL-20261022-001',
        action: 'SPOILAGE_WRITEOFF',
        performed_by: 'Carlos Mendoza',
        role: 'operator',
        details: { lot_id: 'LOT-20261018-MNG-009', quantity_spoiled_kg: 550, loss_amount: 2640, reason: 'Ethylene Exposure / Premature Yellowing' },
        created_at: new Date(now - 5 * 86400000).toISOString()
      },
      {
        id: 'f0000001-0000-0000-0000-000000000004',
        entity_type: 'DISPATCH',
        entity_id: 'DSP-20261022-001',
        action: 'DISPATCH',
        performed_by: 'Aisha Al-Mansoor',
        role: 'operator',
        details: { lot_id: 'LOT-20261011-AVO-004', quantity_kg: 1050, buyer: 'Grand Marche Fresh Outlets' },
        created_at: new Date(now - 5 * 86400000).toISOString()
      }
    ];

    // 9. System Users
    this.systemUsers = [
      {
        id: 'u0000001-0000-0000-0000-000000000001',
        email: 'admin@harvestledger.ag',
        full_name: 'Dr. Elena Rostova',
        role: 'admin',
        department: 'Quality & Cold Chain Direction'
      },
      {
        id: 'u0000001-0000-0000-0000-000000000002',
        email: 'marcus.vance@harvestledger.ag',
        full_name: 'Marcus Vance',
        role: 'operator',
        department: 'Cold Storage Logistics & QA'
      },
      {
        id: 'u0000001-0000-0000-0000-000000000003',
        email: 'carlos.m@harvestledger.ag',
        full_name: 'Carlos Mendoza',
        role: 'operator',
        department: 'Ripening & Packhouse Operations'
      },
      {
        id: 'u0000001-0000-0000-0000-000000000004',
        email: 'sophie.buyer@freshmarkets.com',
        full_name: 'Sophie Chen',
        role: 'requester',
        department: 'Supermarket Procurement'
      },
      {
        id: 'u0000001-0000-0000-0000-000000000005',
        email: 'visitor@public.ag',
        full_name: 'Public Traceability Visitor',
        role: 'visitor',
        department: 'Consumer / External Auditor'
      }
    ];
  }

  // Helper to log audit events
  logAuditEvent(entityType, entityId, action, performedBy, role, details) {
    const event = {
      id: crypto.randomUUID(),
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      performed_by: performedBy || 'Operator',
      role: role || 'operator',
      details: details || {},
      created_at: new Date().toISOString()
    };
    this.auditEvents.unshift(event);
    return event;
  }

  // --- CROPS ---
  getCrops() {
    return [...this.crops];
  }

  getCropById(id) {
    return this.crops.find(c => c.id === id) || null;
  }

  // --- STORAGE FACILITIES ---
  getFacilities() {
    return [...this.storageFacilities];
  }

  getFacilityById(id) {
    return this.storageFacilities.find(f => f.id === id) || null;
  }

  // --- HARVEST LOTS ---
  getLots(filters = {}) {
    let result = this.harvestLots.map(lot => {
      const crop = this.getCropById(lot.crop_id);
      const facility = this.getFacilityById(lot.current_facility_id);
      return {
        ...lot,
        crop_name: crop ? crop.name : 'Unknown Crop',
        crop_category: crop ? crop.category : '',
        facility_name: facility ? facility.name : 'Unknown Facility',
        unit_price_per_kg: crop ? crop.unit_price_per_kg : 0,
        total_value: crop ? Number((lot.current_quantity_kg * crop.unit_price_per_kg).toFixed(2)) : 0
      };
    });

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(l =>
        l.lot_id.toLowerCase().includes(q) ||
        l.crop_name.toLowerCase().includes(q) ||
        l.origin_farm.toLowerCase().includes(q) ||
        l.facility_name.toLowerCase().includes(q)
      );
    }

    if (filters.crop_id) {
      result = result.filter(l => l.crop_id === filters.crop_id);
    }

    if (filters.facility_id) {
      result = result.filter(l => l.current_facility_id === filters.facility_id);
    }

    if (filters.status) {
      result = result.filter(l => l.status === filters.status);
    }

    if (filters.aging_status) {
      result = result.filter(l => l.aging_status === filters.aging_status);
    }

    // Sort
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * sortOrder;
      }
      return ((valA || 0) - (valB || 0)) * sortOrder;
    });

    return result;
  }

  getLotById(idOrLotId) {
    const lot = this.harvestLots.find(l => l.id === idOrLotId || l.lot_id === idOrLotId);
    if (!lot) return null;

    const crop = this.getCropById(lot.crop_id);
    const facility = this.getFacilityById(lot.current_facility_id);
    const checks = this.getConditionChecksByLotId(lot.id);
    const lotDispatches = this.dispatches.filter(d => d.lot_id === lot.id);
    const lotSpoilage = this.spoilageRecords.filter(s => s.lot_id === lot.id);

    // Get lineage relationships
    const parentLinks = this.lotLineage.filter(link => link.child_lot_id === lot.id);
    const childLinks = this.lotLineage.filter(link => link.parent_lot_id === lot.id);

    return {
      ...lot,
      crop,
      facility,
      condition_checks: checks,
      dispatches: lotDispatches,
      spoilage_records: lotSpoilage,
      lineage: {
        parents: parentLinks.map(p => {
          const parentLot = this.harvestLots.find(l => l.id === p.parent_lot_id);
          return {
            ...p,
            parent_lot_code: parentLot ? parentLot.lot_id : 'Unknown'
          };
        }),
        children: childLinks.map(c => {
          const childLot = this.harvestLots.find(l => l.id === c.child_lot_id);
          return {
            ...c,
            child_lot_code: childLot ? childLot.lot_id : 'Unknown'
          };
        })
      }
    };
  }

  createLot(lotData, user) {
    // Generate lot ID if not provided
    const crop = this.getCropById(lotData.crop_id);
    if (!crop) throw new Error('Invalid crop specified');

    const facility = this.getFacilityById(lotData.current_facility_id);
    if (!facility) throw new Error('Invalid storage facility specified');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = crop.name.slice(0, 3).toUpperCase();
    const count = this.harvestLots.length + 1;
    const lot_id = lotData.lot_id || `LOT-${dateStr}-${prefix}-${String(count).padStart(3, '0')}`;

    // Verify uniqueness
    if (this.harvestLots.some(l => l.lot_id === lot_id)) {
      throw new Error(`Lot ID ${lot_id} already exists`);
    }

    const initialQty = Number(lotData.initial_quantity_kg);
    if (isNaN(initialQty) || initialQty <= 0) {
      throw new Error('Initial quantity must be greater than zero');
    }

    const newLot = {
      id: crypto.randomUUID(),
      lot_id,
      crop_id: lotData.crop_id,
      origin_farm: lotData.origin_farm,
      harvest_block: lotData.harvest_block || 'Default Block',
      harvest_date: lotData.harvest_date || new Date().toISOString(),
      initial_quantity_kg: initialQty,
      current_quantity_kg: initialQty,
      unit: lotData.unit || 'kg',
      initial_grade: lotData.initial_grade || 'Grade A Premium',
      current_facility_id: lotData.current_facility_id,
      status: 'In Storage',
      freshness_score: 100.00,
      aging_status: 'Fresh',
      days_in_storage: 0,
      notes: lotData.notes || '',
      created_by: (user && user.full_name) || 'Operator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.harvestLots.unshift(newLot);

    // Initial baseline condition check
    const initialCheck = {
      id: crypto.randomUUID(),
      lot_id: newLot.id,
      facility_id: newLot.current_facility_id,
      check_timestamp: newLot.created_at,
      temperature_c: facility.target_temperature,
      relative_humidity_pct: facility.target_humidity,
      ethylene_ppm: 0.01,
      visual_quality_score: 100,
      pest_signs: false,
      fungal_signs: false,
      decay_stage: 'None',
      freshness_calculated: 100.00,
      action_recommended: 'Maintain Storage',
      inspector_name: (user && user.full_name) || 'Receiving Staff',
      notes: 'Initial receipt and induction condition inspection.',
      created_at: newLot.created_at
    };
    this.conditionChecks.unshift(initialCheck);

    this.logAuditEvent('LOT', newLot.lot_id, 'CREATE', (user && user.full_name) || 'Operator', (user && user.role) || 'operator', {
      initial_quantity_kg: newLot.initial_quantity_kg,
      crop_id: newLot.crop_id,
      origin_farm: newLot.origin_farm
    });

    return this.getLotById(newLot.id);
  }

  // --- CONDITION CHECKS ---
  getConditionChecksByLotId(lotId) {
    return this.conditionChecks
      .filter(c => c.lot_id === lotId)
      .sort((a, b) => new Date(b.check_timestamp) - new Date(a.check_timestamp));
  }

  addConditionCheck(checkData, user) {
    const lot = this.harvestLots.find(l => l.id === checkData.lot_id);
    if (!lot) throw new Error('Target lot not found');

    const crop = this.getCropById(lot.crop_id);
    const facility = this.getFacilityById(checkData.facility_id || lot.current_facility_id);

    // Calculate freshness degradation based on:
    // 1. Age vs shelf life
    // 2. Temperature deviation from optimal range
    // 3. Humidity deviation
    // 4. Ethylene ppm
    // 5. Visual quality score and decay signs
    const harvestDate = new Date(lot.harvest_date);
    const checkDate = checkData.check_timestamp ? new Date(checkData.check_timestamp) : new Date();
    const daysInStorage = Math.max(0, Math.floor((checkDate - harvestDate) / 86400000));

    let freshness = 100;

    // Age decay factor
    if (crop) {
      const ageRatio = daysInStorage / crop.shelf_life_days;
      freshness -= Math.min(50, ageRatio * 50);

      // Temperature penalty
      const temp = Number(checkData.temperature_c);
      if (temp < crop.optimal_temp_min) {
        freshness -= (crop.optimal_temp_min - temp) * 4; // Chilling stress
      } else if (temp > crop.optimal_temp_max) {
        freshness -= (temp - crop.optimal_temp_max) * 5; // Heat acceleration
      }

      // Ethylene penalty
      const ethylene = Number(checkData.ethylene_ppm || 0);
      if (ethylene > 0.5) {
        freshness -= (ethylene - 0.5) * 8;
      }
    }

    // Visual score weighting (35% impact)
    const visualScore = Number(checkData.visual_quality_score);
    freshness = (freshness * 0.65) + (visualScore * 0.35);

    // Disease penalties
    if (checkData.fungal_signs) freshness -= 25;
    if (checkData.pest_signs) freshness -= 20;

    freshness = Math.max(0, Math.min(100, Number(freshness.toFixed(2))));

    // Determine aging status
    let agingStatus = 'Fresh';
    if (crop) {
      if (freshness < 30 || checkData.decay_stage === 'Rotting') {
        agingStatus = 'Spoilage Suspect';
      } else if (daysInStorage >= crop.shelf_life_days || freshness < 50) {
        agingStatus = 'Critical Over-Age';
      } else if (daysInStorage >= crop.critical_aging_days || freshness < 75) {
        agingStatus = 'Approaching Threshold';
      } else if (daysInStorage > 2) {
        agingStatus = 'Optimal';
      }
    }

    const newCheck = {
      id: crypto.randomUUID(),
      lot_id: lot.id,
      facility_id: facility ? facility.id : lot.current_facility_id,
      check_timestamp: checkDate.toISOString(),
      temperature_c: Number(checkData.temperature_c),
      relative_humidity_pct: Number(checkData.relative_humidity_pct),
      ethylene_ppm: Number(checkData.ethylene_ppm || 0),
      visual_quality_score: visualScore,
      pest_signs: Boolean(checkData.pest_signs),
      fungal_signs: Boolean(checkData.fungal_signs),
      decay_stage: checkData.decay_stage || 'None',
      freshness_calculated: freshness,
      action_recommended: checkData.action_recommended || 'Maintain Storage',
      inspector_name: checkData.inspector_name || (user && user.full_name) || 'Quality Inspector',
      notes: checkData.notes || '',
      created_at: new Date().toISOString()
    };

    this.conditionChecks.unshift(newCheck);

    // Update lot status and scores
    lot.freshness_score = freshness;
    lot.aging_status = agingStatus;
    lot.days_in_storage = daysInStorage;
    lot.updated_at = new Date().toISOString();

    if (agingStatus === 'Critical Over-Age' || agingStatus === 'Spoilage Suspect') {
      if (lot.status === 'In Storage') {
        lot.status = 'Quality Warning';
      }
    }

    this.logAuditEvent('CONDITION_CHECK', lot.lot_id, 'INSPECTION', (user && user.full_name) || 'Inspector', (user && user.role) || 'operator', {
      freshness_score: freshness,
      aging_status: agingStatus,
      decay_stage: newCheck.decay_stage,
      action_recommended: newCheck.action_recommended
    });

    return newCheck;
  }

  // --- SPLIT & MERGE LINEAGE ---
  splitLot(splitData, user) {
    const parentLot = this.harvestLots.find(l => l.id === splitData.parent_lot_id || l.lot_id === splitData.parent_lot_id);
    if (!parentLot) throw new Error('Parent lot not found');

    if (parentLot.current_quantity_kg <= 0) {
      throw new Error('Parent lot has no remaining quantity available to split');
    }

    const children = splitData.children; // Array of { portion_kg, rationale, initial_grade, notes }
    if (!Array.isArray(children) || children.length < 2) {
      throw new Error('Split operation requires at least two child portions');
    }

    const totalSplitQty = children.reduce((sum, c) => sum + Number(c.portion_kg), 0);
    if (totalSplitQty > parentLot.current_quantity_kg + 0.001) {
      throw new Error(`Total split quantity (${totalSplitQty} kg) exceeds parent available quantity (${parentLot.current_quantity_kg} kg)`);
    }

    const createdChildren = [];
    const createdLineage = [];

    children.forEach((childConfig, idx) => {
      const portion = Number(childConfig.portion_kg);
      const childLotCode = `${parentLot.lot_id}-S${idx + 1}`;

      const childLot = {
        id: crypto.randomUUID(),
        lot_id: childLotCode,
        crop_id: parentLot.crop_id,
        origin_farm: parentLot.origin_farm,
        harvest_block: parentLot.harvest_block,
        harvest_date: parentLot.harvest_date,
        initial_quantity_kg: portion,
        current_quantity_kg: portion,
        unit: parentLot.unit,
        initial_grade: childConfig.initial_grade || parentLot.initial_grade,
        current_facility_id: childConfig.facility_id || parentLot.current_facility_id,
        status: 'In Storage',
        freshness_score: parentLot.freshness_score,
        aging_status: parentLot.aging_status,
        days_in_storage: parentLot.days_in_storage,
        notes: `Child split from ${parentLot.lot_id}. ${childConfig.notes || ''}`.trim(),
        created_by: (user && user.full_name) || 'Operator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.harvestLots.unshift(childLot);
      createdChildren.push(childLot);

      const lineageRecord = {
        id: crypto.randomUUID(),
        event_type: 'SPLIT',
        parent_lot_id: parentLot.id,
        child_lot_id: childLot.id,
        quantity_contributed_kg: portion,
        rationale: childConfig.rationale || splitData.rationale || 'Batch segregation split',
        performed_by: (user && user.full_name) || 'Operator',
        created_at: new Date().toISOString()
      };

      this.lotLineage.unshift(lineageRecord);
      createdLineage.push(lineageRecord);
    });

    // Deduct quantity from parent
    parentLot.current_quantity_kg = Number((parentLot.current_quantity_kg - totalSplitQty).toFixed(2));
    if (parentLot.current_quantity_kg === 0) {
      parentLot.status = 'Split';
    }
    parentLot.updated_at = new Date().toISOString();

    this.logAuditEvent('LINEAGE', parentLot.lot_id, 'SPLIT', (user && user.full_name) || 'Operator', (user && user.role) || 'operator', {
      parent_lot: parentLot.lot_id,
      children: createdChildren.map(c => c.lot_id),
      total_split_kg: totalSplitQty
    });

    return {
      parent: parentLot,
      children: createdChildren,
      lineage: createdLineage
    };
  }

  mergeLots(mergeData, user) {
    const parentLotIds = mergeData.parent_lot_ids; // Array of IDs
    if (!Array.isArray(parentLotIds) || parentLotIds.length < 2) {
      throw new Error('Merge requires at least two parent lots');
    }

    const parents = [];
    for (const pid of parentLotIds) {
      const lot = this.harvestLots.find(l => l.id === pid || l.lot_id === pid);
      if (!lot) throw new Error(`Source lot ${pid} not found`);
      if (lot.current_quantity_kg <= 0) {
        throw new Error(`Source lot ${lot.lot_id} has zero remaining quantity`);
      }
      parents.push(lot);
    }

    // Verify all lots share the same crop
    const firstCropId = parents[0].crop_id;
    const sameCrop = parents.every(p => p.crop_id === firstCropId);
    if (!sameCrop) {
      throw new Error('Cannot merge lots with different crop types');
    }

    const crop = this.getCropById(firstCropId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = crop ? crop.name.slice(0, 3).toUpperCase() : 'CRP';
    const newLotCode = mergeData.lot_id || `LOT-${dateStr}-${prefix}-MRG-${String(this.harvestLots.length + 1).padStart(2, '0')}`;

    // Sum quantities and compute weighted freshness score
    let totalQty = 0;
    let weightedFreshnessSum = 0;
    let earliestHarvest = new Date();

    parents.forEach(p => {
      totalQty += p.current_quantity_kg;
      weightedFreshnessSum += p.freshness_score * p.current_quantity_kg;
      const hDate = new Date(p.harvest_date);
      if (hDate < earliestHarvest) earliestHarvest = hDate;
    });

    const mergedFreshness = Number((weightedFreshnessSum / totalQty).toFixed(2));
    const mergedFacility = mergeData.facility_id || parents[0].current_facility_id;

    const mergedLot = {
      id: crypto.randomUUID(),
      lot_id: newLotCode,
      crop_id: firstCropId,
      origin_farm: `Merged batch (${parents.map(p => p.origin_farm).join(' + ')})`,
      harvest_block: `Merged (${parents.map(p => p.harvest_block).join(', ')})`,
      harvest_date: earliestHarvest.toISOString(),
      initial_quantity_kg: totalQty,
      current_quantity_kg: totalQty,
      unit: parents[0].unit,
      initial_grade: mergeData.initial_grade || 'Grade A Premium',
      current_facility_id: mergedFacility,
      status: 'In Storage',
      freshness_score: mergedFreshness,
      aging_status: parents[0].aging_status,
      days_in_storage: Math.floor((Date.now() - earliestHarvest) / 86400000),
      notes: `Consolidated merge from parents: ${parents.map(p => p.lot_id).join(', ')}. ${mergeData.notes || ''}`.trim(),
      created_by: (user && user.full_name) || 'Operator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.harvestLots.unshift(mergedLot);

    const createdLineage = [];
    parents.forEach(p => {
      const link = {
        id: crypto.randomUUID(),
        event_type: 'MERGE',
        parent_lot_id: p.id,
        child_lot_id: mergedLot.id,
        quantity_contributed_kg: p.current_quantity_kg,
        rationale: mergeData.rationale || 'Consolidation of compatible partial lots',
        performed_by: (user && user.full_name) || 'Operator',
        created_at: new Date().toISOString()
      };
      this.lotLineage.unshift(link);
      createdLineage.push(link);

      // Deplete parent lot
      p.current_quantity_kg = 0;
      p.status = 'Merged';
      p.updated_at = new Date().toISOString();
    });

    this.logAuditEvent('LINEAGE', mergedLot.lot_id, 'MERGE', (user && user.full_name) || 'Operator', (user && user.role) || 'operator', {
      merged_lot: mergedLot.lot_id,
      parents: parents.map(p => p.lot_id),
      total_qty_kg: totalQty
    });

    return {
      merged_lot: mergedLot,
      parents,
      lineage: createdLineage
    };
  }

  // --- DISPATCHES ---
  createDispatch(dispatchData, user) {
    const lot = this.harvestLots.find(l => l.id === dispatchData.lot_id || l.lot_id === dispatchData.lot_id);
    if (!lot) throw new Error('Target lot not found');

    const qty = Number(dispatchData.quantity_dispatched_kg);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Dispatched quantity must be greater than zero');
    }

    if (qty > lot.current_quantity_kg + 0.001) {
      throw new Error(`Requested dispatch quantity (${qty} kg) exceeds available stock (${lot.current_quantity_kg} kg)`);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = this.dispatches.length + 1;
    const dispatchId = dispatchData.dispatch_id || `DSP-${dateStr}-${String(count).padStart(3, '0')}`;

    const newDispatch = {
      id: crypto.randomUUID(),
      dispatch_id: dispatchId,
      lot_id: lot.id,
      destination_buyer: dispatchData.destination_buyer,
      channel_type: dispatchData.channel_type || 'Supermarket Direct Contract',
      quantity_dispatched_kg: qty,
      transport_mode: dispatchData.transport_mode || 'Refrigerated Reefer Truck (-1°C to 4°C)',
      temperature_at_departure_c: Number(dispatchData.temperature_at_departure_c || 4.0),
      condition_score_at_dispatch: Number(dispatchData.condition_score_at_dispatch || Math.round(lot.freshness_score)),
      bill_of_lading: dispatchData.bill_of_lading || `BOL-${Math.floor(100000 + Math.random() * 900000)}`,
      dispatched_by: (user && user.full_name) || 'Dispatch Manager',
      dispatch_date: dispatchData.dispatch_date || new Date().toISOString(),
      notes: dispatchData.notes || '',
      created_at: new Date().toISOString()
    };

    this.dispatches.unshift(newDispatch);

    // Adjust lot stock
    lot.current_quantity_kg = Number((lot.current_quantity_kg - qty).toFixed(2));
    if (lot.current_quantity_kg === 0) {
      lot.status = 'Dispatched';
    } else {
      lot.status = 'Partially Dispatched';
    }
    lot.updated_at = new Date().toISOString();

    this.logAuditEvent('DISPATCH', newDispatch.dispatch_id, 'DISPATCH', (user && user.full_name) || 'Dispatcher', (user && user.role) || 'operator', {
      lot_id: lot.lot_id,
      quantity_kg: qty,
      buyer: newDispatch.destination_buyer,
      bill_of_lading: newDispatch.bill_of_lading
    });

    return {
      dispatch: newDispatch,
      lot
    };
  }

  // --- SPOILAGE WRITE-OFFS ---
  createSpoilageRecord(spoilageData, user) {
    const lot = this.harvestLots.find(l => l.id === spoilageData.lot_id || l.lot_id === spoilageData.lot_id);
    if (!lot) throw new Error('Target lot not found');

    const qty = Number(spoilageData.quantity_spoiled_kg);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Spoilage write-off quantity must be greater than zero');
    }

    if (qty > lot.current_quantity_kg + 0.001) {
      throw new Error(`Write-off quantity (${qty} kg) exceeds remaining inventory (${lot.current_quantity_kg} kg)`);
    }

    const crop = this.getCropById(lot.crop_id);
    const unitPrice = crop ? crop.unit_price_per_kg : 3.00;
    const financialLoss = Number((qty * unitPrice).toFixed(2));

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = this.spoilageRecords.length + 1;
    const spoilageId = spoilageData.spoilage_id || `SPL-${dateStr}-${String(count).padStart(3, '0')}`;

    // Determine severity grade
    const pctOfInitial = (qty / lot.initial_quantity_kg) * 100;
    let severity = 'Minor Sorting Loss (< 5%)';
    if (pctOfInitial >= 99) severity = 'Total Batch Condemnation (100%)';
    else if (pctOfInitial >= 25) severity = 'Major Spoilage Surge (25% - 60%)';
    else if (pctOfInitial >= 5) severity = 'Moderate Batch Cull (5% - 25%)';

    const newSpoilage = {
      id: crypto.randomUUID(),
      spoilage_id: spoilageId,
      lot_id: lot.id,
      quantity_spoiled_kg: qty,
      spoilage_reason: spoilageData.spoilage_reason || 'Over-Ripeness / Senescence',
      severity_grade: spoilageData.severity_grade || severity,
      financial_loss_estimate: financialLoss,
      responsible_facility_id: spoilageData.responsible_facility_id || lot.current_facility_id,
      root_cause_analysis: spoilageData.root_cause_analysis || 'Unanticipated quality decline during cold storage window.',
      corrective_action: spoilageData.corrective_action || 'Review atmospheric sensor logs and expedite FIFO rotation.',
      logged_by: (user && user.full_name) || 'QA Staff',
      discard_date: spoilageData.discard_date || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.spoilageRecords.unshift(newSpoilage);

    // Adjust lot stock
    lot.current_quantity_kg = Number((lot.current_quantity_kg - qty).toFixed(2));
    if (lot.current_quantity_kg === 0) {
      lot.status = 'Spoiled/Condemned';
      lot.freshness_score = 0;
      lot.aging_status = 'Spoilage Suspect';
    } else {
      lot.status = 'Quality Warning';
    }
    lot.updated_at = new Date().toISOString();

    this.logAuditEvent('SPOILAGE', newSpoilage.spoilage_id, 'SPOILAGE_WRITEOFF', (user && user.full_name) || 'QA Staff', (user && user.role) || 'operator', {
      lot_id: lot.lot_id,
      quantity_spoiled_kg: qty,
      financial_loss: financialLoss,
      reason: newSpoilage.spoilage_reason,
      facility: newSpoilage.responsible_facility_id
    });

    return {
      spoilage: newSpoilage,
      lot
    };
  }

  // --- ANALYTICS & ACCOUNTABILITY METRICS ---
  getAnalytics() {
    // 1. Loss Rate by Crop
    const cropLossMap = {};
    this.crops.forEach(crop => {
      cropLossMap[crop.id] = {
        crop_id: crop.id,
        crop_name: crop.name,
        category: crop.category,
        total_harvested_kg: 0,
        total_dispatched_kg: 0,
        total_spoiled_kg: 0,
        total_loss_value: 0,
        loss_rate_pct: 0
      };
    });

    this.harvestLots.forEach(lot => {
      if (cropLossMap[lot.crop_id]) {
        cropLossMap[lot.crop_id].total_harvested_kg += lot.initial_quantity_kg;
      }
    });

    this.dispatches.forEach(disp => {
      const lot = this.harvestLots.find(l => l.id === disp.lot_id);
      if (lot && cropLossMap[lot.crop_id]) {
        cropLossMap[lot.crop_id].total_dispatched_kg += disp.quantity_dispatched_kg;
      }
    });

    this.spoilageRecords.forEach(spl => {
      const lot = this.harvestLots.find(l => l.id === spl.lot_id);
      if (lot && cropLossMap[lot.crop_id]) {
        cropLossMap[lot.crop_id].total_spoiled_kg += spl.quantity_spoiled_kg;
        cropLossMap[lot.crop_id].total_loss_value += spl.financial_loss_estimate;
      }
    });

    const lossByCrop = Object.values(cropLossMap).map(item => {
      const rate = item.total_harvested_kg > 0 ? (item.total_spoiled_kg / item.total_harvested_kg) * 100 : 0;
      return {
        ...item,
        loss_rate_pct: Number(rate.toFixed(2)),
        total_harvested_kg: Number(item.total_harvested_kg.toFixed(2)),
        total_dispatched_kg: Number(item.total_dispatched_kg.toFixed(2)),
        total_spoiled_kg: Number(item.total_spoiled_kg.toFixed(2)),
        total_loss_value: Number(item.total_loss_value.toFixed(2))
      };
    });

    // 2. Loss Rate by Location / Facility
    const facilityLossMap = {};
    this.storageFacilities.forEach(fac => {
      facilityLossMap[fac.id] = {
        facility_id: fac.id,
        facility_name: fac.name,
        facility_type: fac.facility_type,
        capacity_kg: fac.capacity_kg,
        current_occupancy_kg: 0,
        total_spoiled_kg: 0,
        total_loss_value: 0,
        incident_count: 0
      };
    });

    this.harvestLots.forEach(lot => {
      if (facilityLossMap[lot.current_facility_id]) {
        facilityLossMap[lot.current_facility_id].current_occupancy_kg += lot.current_quantity_kg;
      }
    });

    this.spoilageRecords.forEach(spl => {
      if (facilityLossMap[spl.responsible_facility_id]) {
        facilityLossMap[spl.responsible_facility_id].total_spoiled_kg += spl.quantity_spoiled_kg;
        facilityLossMap[spl.responsible_facility_id].total_loss_value += spl.financial_loss_estimate;
        facilityLossMap[spl.responsible_facility_id].incident_count += 1;
      }
    });

    const lossByLocation = Object.values(facilityLossMap).map(fac => {
      return {
        ...fac,
        current_occupancy_kg: Number(fac.current_occupancy_kg.toFixed(2)),
        total_spoiled_kg: Number(fac.total_spoiled_kg.toFixed(2)),
        total_loss_value: Number(fac.total_loss_value.toFixed(2))
      };
    });

    // 3. Spoilage Driver Breakdown (Reasons)
    const reasonMap = {};
    this.spoilageRecords.forEach(spl => {
      if (!reasonMap[spl.spoilage_reason]) {
        reasonMap[spl.spoilage_reason] = {
          reason: spl.spoilage_reason,
          quantity_kg: 0,
          loss_value: 0,
          incident_count: 0
        };
      }
      reasonMap[spl.spoilage_reason].quantity_kg += spl.quantity_spoiled_kg;
      reasonMap[spl.spoilage_reason].loss_value += spl.financial_loss_estimate;
      reasonMap[spl.spoilage_reason].incident_count += 1;
    });

    const spoilageDrivers = Object.values(reasonMap).sort((a, b) => b.loss_value - a.loss_value);

    // 4. Time Series Trend (Monthly / Weekly)
    const monthlyMap = {};
    this.spoilageRecords.forEach(spl => {
      const monthKey = spl.discard_date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          period: monthKey,
          spoiled_kg: 0,
          loss_value: 0,
          dispatched_kg: 0
        };
      }
      monthlyMap[monthKey].spoiled_kg += spl.quantity_spoiled_kg;
      monthlyMap[monthKey].loss_value += spl.financial_loss_estimate;
    });

    this.dispatches.forEach(disp => {
      const monthKey = disp.dispatch_date.slice(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          period: monthKey,
          spoiled_kg: 0,
          loss_value: 0,
          dispatched_kg: 0
        };
      }
      monthlyMap[monthKey].dispatched_kg += disp.quantity_dispatched_kg;
    });

    const timeTrend = Object.values(monthlyMap).sort((a, b) => a.period.localeCompare(b.period));

    // 5. Executive Summary Totals
    const totalHarvestedVolumeKg = this.harvestLots.reduce((sum, l) => sum + l.initial_quantity_kg, 0);
    const activeInventoryVolumeKg = this.harvestLots.reduce((sum, l) => sum + l.current_quantity_kg, 0);
    const totalDispatchedVolumeKg = this.dispatches.reduce((sum, d) => sum + d.quantity_dispatched_kg, 0);
    const totalSpoiledVolumeKg = this.spoilageRecords.reduce((sum, s) => sum + s.quantity_spoiled_kg, 0);
    const totalFinancialLoss = this.spoilageRecords.reduce((sum, s) => sum + s.financial_loss_estimate, 0);

    const overallLossRatePct = totalHarvestedVolumeKg > 0 ? (totalSpoiledVolumeKg / totalHarvestedVolumeKg) * 100 : 0;

    // Freshness status counts
    const freshnessBreakdown = {
      Fresh: this.harvestLots.filter(l => l.aging_status === 'Fresh').length,
      Optimal: this.harvestLots.filter(l => l.aging_status === 'Optimal').length,
      ApproachingThreshold: this.harvestLots.filter(l => l.aging_status === 'Approaching Threshold').length,
      CriticalOverAge: this.harvestLots.filter(l => l.aging_status === 'Critical Over-Age').length,
      SpoilageSuspect: this.harvestLots.filter(l => l.aging_status === 'Spoilage Suspect').length
    };

    return {
      summary: {
        total_lots: this.harvestLots.length,
        total_harvested_kg: Number(totalHarvestedVolumeKg.toFixed(2)),
        active_inventory_kg: Number(activeInventoryVolumeKg.toFixed(2)),
        total_dispatched_kg: Number(totalDispatchedVolumeKg.toFixed(2)),
        total_spoiled_kg: Number(totalSpoiledVolumeKg.toFixed(2)),
        overall_loss_rate_pct: Number(overallLossRatePct.toFixed(2)),
        total_financial_loss: Number(totalFinancialLoss.toFixed(2)),
        currency: 'USD'
      },
      freshness_breakdown: freshnessBreakdown,
      loss_by_crop: lossByCrop,
      loss_by_location: lossByLocation,
      spoilage_drivers: spoilageDrivers,
      time_trend: timeTrend
    };
  }
}

// Singleton local store instance
const localStore = new LocalStore();
module.exports = localStore;
