// server/routes/lotRoutes.js
const express = require('express');
const router = express.Router();
const lotService = require('../services/lotService');
const { requireRole } = require('../middleware/auth');
const { validateLotCreation } = require('../middleware/validator');

// List lots with filtering & sorting
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      crop_id: req.query.crop_id,
      facility_id: req.query.facility_id,
      status: req.query.status,
      aging_status: req.query.aging_status,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    const lots = await lotService.getAllLots(filters);
    res.json({ success: true, count: lots.length, data: lots });
  } catch (err) {
    next(err);
  }
});

// Get single lot with full details
router.get('/:id', async (req, res, next) => {
  try {
    const lot = await lotService.getLotDetails(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Harvest lot not found' });
    }
    res.json({ success: true, data: lot });
  } catch (err) {
    next(err);
  }
});

// Create new harvest lot (Operator / Admin)
router.post('/', requireRole(['operator', 'admin']), validateLotCreation, async (req, res, next) => {
  try {
    const created = await lotService.createLot(req.body, req.user);
    res.status(201).json({ success: true, data: created, message: 'Harvest lot successfully inducted and registered' });
  } catch (err) {
    next(err);
  }
});

// List crop profiles & thresholds
router.get('/meta/crops', async (req, res, next) => {
  try {
    const crops = await lotService.getCrops();
    res.json({ success: true, data: crops });
  } catch (err) {
    next(err);
  }
});

// List cold storage facilities
router.get('/meta/facilities', async (req, res, next) => {
  try {
    const facilities = await lotService.getFacilities();
    res.json({ success: true, data: facilities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
