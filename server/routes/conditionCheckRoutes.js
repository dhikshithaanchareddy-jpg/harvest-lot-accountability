// server/routes/conditionCheckRoutes.js
const express = require('express');
const router = express.Router();
const conditionService = require('../services/conditionService');
const { requireRole } = require('../middleware/auth');
const { validateConditionCheck } = require('../middleware/validator');

router.get('/:lotId', async (req, res, next) => {
  try {
    const checks = await conditionService.getChecksByLot(req.params.lotId);
    res.json({ success: true, count: checks.length, data: checks });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(['operator', 'admin']), validateConditionCheck, async (req, res, next) => {
  try {
    const newCheck = await conditionService.addCheck(req.body, req.user);
    res.status(201).json({
      success: true,
      data: newCheck,
      message: 'Condition inspection recorded and freshness index recalculated'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
