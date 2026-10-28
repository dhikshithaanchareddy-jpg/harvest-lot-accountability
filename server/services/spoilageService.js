// server/services/spoilageService.js
const { supabase, isConfigured, localStore } = require('../config/database');
const auditService = require('./auditService');

class SpoilageService {
  async getAllSpoilageRecords() {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('spoilage_records')
          .select('*, lot:harvest_lots(lot_id, crop:crops(name)), facility:storage_facilities(name)')
          .order('discard_date', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('[SpoilageService] Supabase get spoilage failed:', err.message);
      }
    }

    return localStore.spoilageRecords.map(s => {
      const lot = localStore.harvestLots.find(l => l.id === s.lot_id);
      const crop = lot ? localStore.getCropById(lot.crop_id) : null;
      const facility = localStore.getFacilityById(s.responsible_facility_id);
      return {
        ...s,
        lot_code: lot ? lot.lot_id : 'Unknown',
        crop_name: crop ? crop.name : 'Unknown',
        facility_name: facility ? facility.name : 'Unknown'
      };
    });
  }

  async createSpoilageRecord(spoilageData, user) {
    if (isConfigured && supabase) {
      try {
        const { data: lot } = await supabase
          .from('harvest_lots')
          .select('*, crop:crops(*)')
          .eq('id', spoilageData.lot_id)
          .single();

        if (lot) {
          const qty = Number(spoilageData.quantity_spoiled_kg);
          if (qty > lot.current_quantity_kg) {
            throw new Error(`Spoilage write-off (${qty} kg) exceeds remaining lot inventory (${lot.current_quantity_kg} kg)`);
          }

          const unitPrice = lot.crop ? lot.crop.unit_price_per_kg : 3.00;
          const financialLoss = Number((qty * unitPrice).toFixed(2));

          const { data: newSpoilage, error } = await supabase
            .from('spoilage_records')
            .insert({
              spoilage_id: spoilageData.spoilage_id || `SPL-${Date.now()}`,
              lot_id: lot.id,
              quantity_spoiled_kg: qty,
              spoilage_reason: spoilageData.spoilage_reason || 'Over-Ripeness / Senescence',
              severity_grade: spoilageData.severity_grade || 'Minor Sorting Loss (< 5%)',
              financial_loss_estimate: financialLoss,
              responsible_facility_id: spoilageData.responsible_facility_id || lot.current_facility_id,
              root_cause_analysis: spoilageData.root_cause_analysis || 'Cold storage degradation',
              corrective_action: spoilageData.corrective_action || 'Inspect atmosphere sensors',
              logged_by: user?.full_name || 'QA Staff'
            })
            .select()
            .single();

          if (!error && newSpoilage) {
            const newQty = Number((lot.current_quantity_kg - qty).toFixed(2));
            const newStatus = newQty === 0 ? 'Spoiled/Condemned' : 'Quality Warning';

            await supabase
              .from('harvest_lots')
              .update({
                current_quantity_kg: newQty,
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', lot.id);

            await auditService.log('SPOILAGE', newSpoilage.spoilage_id, 'SPOILAGE_WRITEOFF', user?.full_name, user?.role, {
              lot_id: lot.lot_id,
              quantity_spoiled_kg: qty,
              loss_amount: financialLoss,
              reason: newSpoilage.spoilage_reason
            });

            return { spoilage: newSpoilage, lot };
          }
        }
      } catch (err) {
        console.warn('[SpoilageService] Supabase create spoilage failed, falling back:', err.message);
      }
    }

    return localStore.createSpoilageRecord(spoilageData, user);
  }
}

module.exports = new SpoilageService();
