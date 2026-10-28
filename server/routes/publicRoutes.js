// server/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const lotService = require('../services/lotService');
const auditService = require('../services/auditService');

router.get('/verify/:lotCode', async (req, res, next) => {
  try {
    const lot = await lotService.getLotDetails(req.params.lotCode);
    if (!lot) {
      return res.status(404).json({
        success: false,
        error: `Lot code '${req.params.lotCode}' was not found in the official harvest register.`
      });
    }

    // Public transparency passport representation (masks sensitive internal cost breakdowns if visitor)
    res.json({
      success: true,
      passport: {
        lot_id: lot.lot_id,
        crop_name: lot.crop ? lot.crop.name : 'Produce',
        crop_category: lot.crop ? lot.crop.category : 'Fresh Produce',
        origin_farm: lot.origin_farm,
        harvest_block: lot.harvest_block,
        harvest_date: lot.harvest_date,
        initial_grade: lot.initial_grade,
        freshness_score: lot.freshness_score,
        aging_status: lot.aging_status,
        current_status: lot.status,
        inspection_count: lot.condition_checks ? lot.condition_checks.length : 0,
        latest_inspection: lot.condition_checks && lot.condition_checks.length > 0 ? {
          timestamp: lot.condition_checks[0].check_timestamp,
          temperature_c: lot.condition_checks[0].temperature_c,
          decay_stage: lot.condition_checks[0].decay_stage
        } : null,
        provenance: {
          has_parent_lineage: lot.lineage && lot.lineage.parents.length > 0,
          parents: lot.lineage ? lot.lineage.parents.map(p => p.parent_lot_code) : [],
          children: lot.lineage ? lot.lineage.children.map(c => c.child_lot_code) : []
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-log', async (req, res, next) => {
  try {
    const logs = await auditService.getRecentEvents(30);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
