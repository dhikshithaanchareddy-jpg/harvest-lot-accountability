// server/middleware/validator.js

function validateLotCreation(req, res, next) {
  const { crop_id, origin_farm, initial_quantity_kg, current_facility_id } = req.body;
  const errors = [];

  if (!crop_id || typeof crop_id !== 'string') errors.push('crop_id is required and must be a valid crop identifier');
  if (!origin_farm || typeof origin_farm !== 'string' || origin_farm.trim().length < 2) {
    errors.push('origin_farm is required (minimum 2 characters)');
  }
  const qty = Number(initial_quantity_kg);
  if (isNaN(qty) || qty <= 0) {
    errors.push('initial_quantity_kg must be a positive number greater than zero');
  }
  if (!current_facility_id) {
    errors.push('current_facility_id is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateConditionCheck(req, res, next) {
  const { lot_id, temperature_c, relative_humidity_pct, visual_quality_score } = req.body;
  const errors = [];

  if (!lot_id) errors.push('lot_id is required');
  if (temperature_c === undefined || isNaN(Number(temperature_c))) errors.push('temperature_c is required and must be numeric');
  
  const rh = Number(relative_humidity_pct);
  if (isNaN(rh) || rh < 0 || rh > 100) errors.push('relative_humidity_pct must be between 0 and 100');

  const vq = Number(visual_quality_score);
  if (isNaN(vq) || vq < 0 || vq > 100) errors.push('visual_quality_score must be between 0 and 100');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateSplit(req, res, next) {
  const { parent_lot_id, children } = req.body;
  const errors = [];

  if (!parent_lot_id) errors.push('parent_lot_id is required');
  if (!Array.isArray(children) || children.length < 2) {
    errors.push('children array with at least two target portions is required');
  } else {
    children.forEach((c, i) => {
      const p = Number(c.portion_kg);
      if (isNaN(p) || p <= 0) errors.push(`Child portion #${i + 1} must have a portion_kg greater than 0`);
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateMerge(req, res, next) {
  const { parent_lot_ids } = req.body;
  const errors = [];

  if (!Array.isArray(parent_lot_ids) || parent_lot_ids.length < 2) {
    errors.push('parent_lot_ids array with at least two source lot IDs is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateDispatch(req, res, next) {
  const { lot_id, destination_buyer, quantity_dispatched_kg } = req.body;
  const errors = [];

  if (!lot_id) errors.push('lot_id is required');
  if (!destination_buyer || typeof destination_buyer !== 'string' || destination_buyer.trim().length < 2) {
    errors.push('destination_buyer is required');
  }
  const qty = Number(quantity_dispatched_kg);
  if (isNaN(qty) || qty <= 0) {
    errors.push('quantity_dispatched_kg must be greater than zero');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateSpoilage(req, res, next) {
  const { lot_id, quantity_spoiled_kg, spoilage_reason } = req.body;
  const errors = [];

  if (!lot_id) errors.push('lot_id is required');
  const qty = Number(quantity_spoiled_kg);
  if (isNaN(qty) || qty <= 0) {
    errors.push('quantity_spoiled_kg must be greater than zero');
  }
  if (!spoilage_reason) {
    errors.push('spoilage_reason is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

module.exports = {
  validateLotCreation,
  validateConditionCheck,
  validateSplit,
  validateMerge,
  validateDispatch,
  validateSpoilage
};
