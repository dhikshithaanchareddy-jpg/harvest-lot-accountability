// server/services/dispatchService.js
const { supabase, isConfigured, localStore } = require('../config/database');
const auditService = require('./auditService');

class DispatchService {
  async getAllDispatches() {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('dispatches')
          .select('*, lot:harvest_lots(lot_id, crop_id)')
          .order('dispatch_date', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('[DispatchService] Supabase get dispatches failed:', err.message);
      }
    }

    return localStore.dispatches.map(d => {
      const lot = localStore.harvestLots.find(l => l.id === d.lot_id);
      const crop = lot ? localStore.getCropById(lot.crop_id) : null;
      return {
        ...d,
        lot_code: lot ? lot.lot_id : 'Unknown',
        crop_name: crop ? crop.name : 'Unknown'
      };
    });
  }

  async createDispatch(dispatchData, user) {
    if (isConfigured && supabase) {
      try {
        const { data: lot } = await supabase
          .from('harvest_lots')
          .select('*')
          .eq('id', dispatchData.lot_id)
          .single();

        if (lot) {
          const qty = Number(dispatchData.quantity_dispatched_kg);
          if (qty > lot.current_quantity_kg) {
            throw new Error(`Requested dispatch (${qty} kg) exceeds available stock (${lot.current_quantity_kg} kg)`);
          }

          const { data: newDispatch, error } = await supabase
            .from('dispatches')
            .insert({
              dispatch_id: dispatchData.dispatch_id || `DSP-${Date.now()}`,
              lot_id: lot.id,
              destination_buyer: dispatchData.destination_buyer,
              channel_type: dispatchData.channel_type || 'Supermarket Direct Contract',
              quantity_dispatched_kg: qty,
              transport_mode: dispatchData.transport_mode || 'Refrigerated Reefer Truck (-1°C to 4°C)',
              temperature_at_departure_c: Number(dispatchData.temperature_at_departure_c || 4.0),
              condition_score_at_dispatch: Number(dispatchData.condition_score_at_dispatch || Math.round(lot.freshness_score)),
              bill_of_lading: dispatchData.bill_of_lading || `BOL-${Date.now().toString().slice(-6)}`,
              dispatched_by: user?.full_name || 'Dispatcher',
              notes: dispatchData.notes || ''
            })
            .select()
            .single();

          if (!error && newDispatch) {
            const newQty = Number((lot.current_quantity_kg - qty).toFixed(2));
            const newStatus = newQty === 0 ? 'Dispatched' : 'Partially Dispatched';

            await supabase
              .from('harvest_lots')
              .update({
                current_quantity_kg: newQty,
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', lot.id);

            await auditService.log('DISPATCH', newDispatch.dispatch_id, 'DISPATCH', user?.full_name, user?.role, {
              lot_id: lot.lot_id,
              quantity_kg: qty,
              buyer: newDispatch.destination_buyer
            });

            return { dispatch: newDispatch, lot };
          }
        }
      } catch (err) {
        console.warn('[DispatchService] Supabase create dispatch failed, falling back:', err.message);
      }
    }

    return localStore.createDispatch(dispatchData, user);
  }
}

module.exports = new DispatchService();
