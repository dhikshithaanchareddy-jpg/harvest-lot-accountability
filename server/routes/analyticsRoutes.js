// server/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await analyticsService.getMetrics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
