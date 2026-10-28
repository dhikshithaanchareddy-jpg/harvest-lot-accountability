// server/services/conditionService.js
const { supabase, isConfigured, localStore } = require('../config/database');
const auditService = require('./auditService');

class ConditionService {
  async addCheck(checkData, user) {
    if (isConfigured && supabase) {
      try {
        // Fetch crop and lot
        const { data: lot } = await supabase.from('harvest_lots').select('*, crop:crops(*)').eq('id', checkData.lot_id).single();
        if (lot) {
          const daysInStorage = Math.max(0, Math.floor((new Date() - new Date(lot.harvest_date)) / 86400000));
          let freshness = 100;
          if (lot.crop) {
            const ageRatio = daysInStorage / lot.crop.shelf_life_days;
            freshness -= Math.min(50, ageRatio * 50);
            const temp = Number(checkData.temperature_c);
            if (temp < lot.crop.optimal_temp_min) freshness -= (lot.crop.optimal_temp_min - temp) * 4;
            else if (temp > lot.crop.optimal_temp_max) freshness -= (temp - lot.crop.optimal_temp_max) * 5;
            const ethylene = Number(checkData.ethylene_ppm || 0);
            if (ethylene > 0.5) freshness -= (ethylene - 0.5) * 8;
          }
          const visualScore = Number(checkData.visual_quality_score);
          freshness = (freshness * 0.65) + (visualScore * 0.35);
          if (checkData.fungal_signs) freshness -= 25;
          if (checkData.pest_signs) freshness -= 20;
          freshness = Math.max(0, Math.min(100, Number(freshness.toFixed(2))));

          let agingStatus = 'Fresh';
          if (lot.crop) {
            if (freshness < 30 || checkData.decay_stage === 'Rotting') agingStatus = 'Spoilage Suspect';
            else if (daysInStorage >= lot.crop.shelf_life_days || freshness < 50) agingStatus = 'Critical Over-Age';
            else if (daysInStorage >= lot.crop.critical_aging_days || freshness < 75) agingStatus = 'Approaching Threshold';
            else if (daysInStorage > 2) agingStatus = 'Optimal';
          }

          const { data: newCheck, error } = await supabase
            .from('condition_checks')
            .insert({
              lot_id: lot.id,
              facility_id: checkData.facility_id || lot.current_facility_id,
              temperature_c: Number(checkData.temperature_c),
              relative_humidity_pct: Number(checkData.relative_humidity_pct),
              ethylene_ppm: Number(checkData.ethylene_ppm || 0),
              visual_quality_score: visualScore,
              pest_signs: Boolean(checkData.pest_signs),
              fungal_signs: Boolean(checkData.fungal_signs),
              decay_stage: checkData.decay_stage || 'None',
              freshness_calculated: freshness,
              action_recommended: checkData.action_recommended || 'Maintain Storage',
              inspector_name: checkData.inspector_name || user?.full_name || 'Inspector',
              notes: checkData.notes || ''
            })
            .select()
            .single();

          if (!error && newCheck) {
            await supabase
              .from('harvest_lots')
              .update({
                freshness_score: freshness,
                aging_status: agingStatus,
                days_in_storage: daysInStorage,
                status: (agingStatus === 'Critical Over-Age' || agingStatus === 'Spoilage Suspect') && lot.status === 'In Storage' ? 'Quality Warning' : lot.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', lot.id);

            await auditService.log('CONDITION_CHECK', lot.lot_id, 'INSPECTION', user?.full_name, user?.role, {
              freshness_score: freshness,
              aging_status: agingStatus
            });

            return newCheck;
          }
        }
      } catch (err) {
        console.warn('[ConditionService] Supabase add check failed, falling back:', err.message);
      }
    }

    return localStore.addConditionCheck(checkData, user);
  }

  async getChecksByLot(lotId) {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('condition_checks')
          .select('*, facility:storage_facilities(name)')
          .eq('lot_id', lotId)
          .order('check_timestamp', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('[ConditionService] Supabase get checks failed:', err.message);
      }
    }

    return localStore.getConditionChecksByLotId(lotId);
  }
}

module.exports = new ConditionService();
