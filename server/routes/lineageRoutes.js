// server/routes/lineageRoutes.js
const express = require('express');
const router = express.Router();
const lineageService = require('../services/lineageService');
const { requireRole } = require('../middleware/auth');
const { validateSplit, validateMerge } = require('../middleware/validator');

router.post('/split', requireRole(['operator', 'admin']), validateSplit, async (req, res, next) => {
  try {
    const result = await lineageService.splitLot(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully split parent lot into ${result.children.length} child lots with full provenance`
    });
  } catch (err) {
    next(err);
  }
});

router.post('/merge', requireRole(['operator', 'admin']), validateMerge, async (req, res, next) => {
  try {
    const result = await lineageService.mergeLots(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully merged ${result.parents.length} source lots into unified lot ${result.merged_lot.lot_id}`
    });
  } catch (err) {
    next(err);
  }
});

router.get('/tree/:lotId', async (req, res, next) => {
  try {
    const tree = await lineageService.getLineageTree(req.params.lotId);
    if (!tree) {
      return res.status(404).json({ success: false, error: 'Target lot not found for lineage tree traversal' });
    }
    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
