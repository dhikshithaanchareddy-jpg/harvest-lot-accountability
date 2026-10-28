// tests/api.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    if (server.closeAllConnections) {
      server.closeAllConnections();
    }
    server.close(resolve);
  });
  setTimeout(() => process.exit(0), 100);
});

// Helper for fetch requests
async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetch(url, {
    ...options,
    headers
  });
  const data = await response.json();
  return { status: response.status, data };
}

test('1. Health Check Endpoint returns 200 and healthy status', async () => {
  const { status, data } = await request('/api/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'healthy');
  assert.equal(data.service, 'Harvest Lot Freshness and Spoilage Accountability Register');
});

test('2. Meta endpoints return seeded crops and facilities', async () => {
  const cropsRes = await request('/api/lots/meta/crops');
  assert.equal(cropsRes.status, 200);
  assert.ok(Array.isArray(cropsRes.data.data));
  assert.ok(cropsRes.data.data.length >= 5);

  const facRes = await request('/api/lots/meta/facilities');
  assert.equal(facRes.status, 200);
  assert.ok(Array.isArray(facRes.data.data));
  assert.ok(facRes.data.data.length >= 3);
});

test('3. GET /api/lots returns lots with freshness scores and joined metadata', async () => {
  const { status, data } = await request('/api/lots');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length > 0);

  const lot = data.data[0];
  assert.ok(lot.lot_id);
  assert.ok(lot.crop_name);
  assert.ok(lot.freshness_score !== undefined);
  assert.ok(lot.aging_status);
});

test('4. POST /api/lots validates input and creates a new lot', async () => {
  // Invalid payload test (negative quantity)
  const invalidRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-MANGO',
      origin_farm: 'Test Farm',
      initial_quantity_kg: -50,
      current_facility_id: 'FAC-SIERRA-CA-02'
    })
  });
  assert.equal(invalidRes.status, 400);
  assert.equal(invalidRes.data.success, false);

  // Valid payload test
  const validRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-MANGO',
      origin_farm: 'Alibaug Valley Orchards',
      harvest_block: 'Block 12 West',
      initial_quantity_kg: 1500,
      initial_grade: 'Grade A Premium',
      current_facility_id: 'FAC-SIERRA-CA-02',
      notes: 'Test harvest creation'
    })
  });
  assert.equal(validRes.status, 201);
  assert.ok(validRes.data.data.lot_id);
  assert.equal(validRes.data.data.initial_quantity_kg, 1500);
  assert.equal(validRes.data.data.current_quantity_kg, 1500);
});

test('5. POST /api/condition-checks updates freshness score and degradation', async () => {
  // Find a lot
  const { data: lotsData } = await request('/api/lots');
  const targetLot = lotsData.data.find(l => l.current_quantity_kg > 0);

  const checkRes = await request('/api/condition-checks', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      lot_id: targetLot.id,
      facility_id: targetLot.current_facility_id,
      temperature_c: 12.5,
      relative_humidity_pct: 88,
      ethylene_ppm: 0.1,
      visual_quality_score: 95,
      pest_signs: false,
      fungal_signs: false,
      decay_stage: 'None',
      action_recommended: 'Maintain Storage',
      inspector_name: 'Marcus Vance'
    })
  });

  assert.equal(checkRes.status, 201);
  assert.ok(checkRes.data.data.freshness_calculated > 0);
});

test('6. POST /api/lineage/split divides lot and establishes child records', async () => {
  // Create a dedicated parent lot
  const createParentRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-PEPPER',
      origin_farm: 'Desert Sunfields',
      harvest_block: 'Bay 3',
      initial_quantity_kg: 800,
      initial_grade: 'Grade A Premium',
      current_facility_id: 'FAC-PACIFIC-DOCK-04'
    })
  });
  const parent = createParentRes.data.data;

  // Split into 500kg and 300kg
  const splitRes = await request('/api/lineage/split', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      parent_lot_id: parent.id,
      rationale: 'Portion segregation for premium client',
      children: [
        { portion_kg: 500, initial_grade: 'Grade A Premium', rationale: 'Retail packaged' },
        { portion_kg: 300, initial_grade: 'Grade B Commercial', rationale: 'Wholesale batch' }
      ]
    })
  });

  assert.equal(splitRes.status, 201);
  assert.equal(splitRes.data.data.children.length, 2);
  assert.equal(splitRes.data.data.parent.current_quantity_kg, 0);
  assert.equal(splitRes.data.data.parent.status, 'Split');
});

test('7. POST /api/lineage/merge merges compatible lots into single lot', async () => {
  // Create two lots of same crop
  const lotARes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-TOMATO',
      origin_farm: 'Valley Farm A',
      initial_quantity_kg: 400,
      current_facility_id: 'FAC-SIERRA-CA-02'
    })
  });
  const lotBRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-TOMATO',
      origin_farm: 'Valley Farm B',
      initial_quantity_kg: 600,
      current_facility_id: 'FAC-SIERRA-CA-02'
    })
  });

  const mergeRes = await request('/api/lineage/merge', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      parent_lot_ids: [lotARes.data.data.id, lotBRes.data.data.id],
      rationale: 'Combined small harvests for bulk container shipment'
    })
  });

  assert.equal(mergeRes.status, 201);
  assert.equal(mergeRes.data.data.merged_lot.initial_quantity_kg, 1000);
  assert.equal(mergeRes.data.data.merged_lot.current_quantity_kg, 1000);
});

test('8. POST /api/dispatches validates stock and decreases inventory', async () => {
  // Create fresh lot
  const createRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-AVOCADO',
      origin_farm: 'Highland Co-op',
      initial_quantity_kg: 1000,
      current_facility_id: 'FAC-PACIFIC-DOCK-04'
    })
  });
  const lot = createRes.data.data;

  // Dispatch 400kg
  const dispRes = await request('/api/dispatches', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      lot_id: lot.id,
      destination_buyer: 'Supermarket Central Hub',
      channel_type: 'Supermarket Direct Contract',
      quantity_dispatched_kg: 400,
      transport_mode: 'Refrigerated Reefer Truck (-1°C to 4°C)'
    })
  });

  assert.equal(dispRes.status, 201);
  assert.equal(dispRes.data.data.lot.current_quantity_kg, 600);
  assert.equal(dispRes.data.data.lot.status, 'Partially Dispatched');
});

test('9. POST /api/spoilage accounts for financial loss and adjusts lot inventory', async () => {
  // Create lot
  const createRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      crop_id: 'CROP-BERRY',
      origin_farm: 'Coast Patch',
      initial_quantity_kg: 200,
      current_facility_id: 'FAC-NORTH-VAULT-A'
    })
  });
  const lot = createRes.data.data;

  // Write-off 50kg due to fungal rot
  const spoilRes = await request('/api/spoilage', {
    method: 'POST',
    headers: { 'x-user-role': 'operator' },
    body: JSON.stringify({
      lot_id: lot.id,
      quantity_spoiled_kg: 50,
      spoilage_reason: 'Fungal Rot / Anthracnose',
      root_cause_analysis: 'Condensation during stage pre-cooling',
      corrective_action: 'Increase air circulation and pallet spacing'
    })
  });

  assert.equal(spoilRes.status, 201);
  assert.equal(spoilRes.data.data.lot.current_quantity_kg, 150);
  assert.ok(spoilRes.data.data.spoilage.financial_loss_estimate > 0);
});

test('10. GET /api/analytics/dashboard computes accountability metrics and loss rates', async () => {
  const { status, data } = await request('/api/analytics/dashboard');
  assert.equal(status, 200);
  assert.ok(data.data.summary);
  assert.ok(data.data.summary.total_harvested_kg > 0);
  assert.ok(Array.isArray(data.data.loss_by_crop));
  assert.ok(Array.isArray(data.data.loss_by_location));
  assert.ok(Array.isArray(data.data.spoilage_drivers));
  assert.ok(data.data.freshness_breakdown);
});

test('11. GET /api/public/verify/:lotCode provides consumer traceability without auth', async () => {
  const { data: lotsData } = await request('/api/lots');
  const sampleLot = lotsData.data[0];

  const verifyRes = await request(`/api/public/verify/${sampleLot.lot_id}`, {
    headers: { 'x-user-role': 'visitor' }
  });
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.data.success, true);
  assert.equal(verifyRes.data.passport.lot_id, sampleLot.lot_id);
  assert.ok(verifyRes.data.passport.origin_farm);
});

test('12. Role-Based Access Control restricts unauthorized modifications for visitors', async () => {
  const unauthRes = await request('/api/lots', {
    method: 'POST',
    headers: { 'x-user-role': 'visitor' },
    body: JSON.stringify({
      crop_id: 'CROP-MANGO',
      origin_farm: 'Unauthorized Farm',
      initial_quantity_kg: 100,
      current_facility_id: 'FAC-SIERRA-CA-02'
    })
  });

  assert.equal(unauthRes.status, 403);
  assert.equal(unauthRes.data.success, false);
});
