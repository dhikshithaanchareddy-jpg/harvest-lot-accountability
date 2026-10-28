// server/routes/spoilageRoutes.js
const express = require('express');
const router = express.Router();
const spoilageService = require('../services/spoilageService');
const { requireRole } = require('../middleware/auth');
const { validateSpoilage } = require('../middleware/validator');

router.get('/', async (req, res, next) => {
  try {
    const records = await spoilageService.getAllSpoilageRecords();
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(['operator', 'admin']), validateSpoilage, async (req, res, next) => {
  try {
    const result = await spoilageService.createSpoilageRecord(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: `Spoilage loss registered. Write-off: ${result.spoilage.quantity_spoiled_kg} kg ($${result.spoilage.financial_loss_estimate})`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
