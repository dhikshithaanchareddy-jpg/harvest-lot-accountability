// server/routes/dispatchRoutes.js
const express = require('express');
const router = express.Router();
const dispatchService = require('../services/dispatchService');
const { requireRole } = require('../middleware/auth');
const { validateDispatch } = require('../middleware/validator');

router.get('/', async (req, res, next) => {
  try {
    const dispatches = await dispatchService.getAllDispatches();
    res.json({ success: true, count: dispatches.length, data: dispatches });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(['operator', 'admin']), validateDispatch, async (req, res, next) => {
  try {
    const result = await dispatchService.createDispatch(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: `Outbound dispatch recorded. Bill of lading: ${result.dispatch.bill_of_lading}`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
