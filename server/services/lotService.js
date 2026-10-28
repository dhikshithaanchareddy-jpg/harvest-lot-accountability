// server/services/lotService.js
const { supabase, isConfigured, localStore } = require('../config/database');
const auditService = require('./auditService');

class LotService {
  async getAllLots(filters = {}) {
    if (isConfigured && supabase) {
      try {
        let query = supabase
          .from('harvest_lots')
          .select(`
            *,
            crop:crops(*),
            facility:storage_facilities(*)
          `);

        if (filters.crop_id) query = query.eq('crop_id', filters.crop_id);
        if (filters.facility_id) query = query.eq('current_facility_id', filters.facility_id);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.aging_status) query = query.eq('aging_status', filters.aging_status);
        if (filters.search) {
          query = query.or(`lot_id.ilike.%${filters.search}%,origin_farm.ilike.%${filters.search}%`);
        }

        const sortBy = filters.sort_by || 'created_at';
        const ascending = filters.sort_order === 'asc';
        query = query.order(sortBy, { ascending });

        const { data, error } = await query;
        if (!error && data) {
          return data.map(lot => ({
            ...lot,
            crop_name: lot.crop ? lot.crop.name : 'Unknown',
            crop_category: lot.crop ? lot.crop.category : '',
            facility_name: lot.facility ? lot.facility.name : 'Unknown',
            unit_price_per_kg: lot.crop ? lot.crop.unit_price_per_kg : 0,
            total_value: lot.crop ? Number((lot.current_quantity_kg * lot.crop.unit_price_per_kg).toFixed(2)) : 0
          }));
        }
      } catch (err) {
        console.warn('[LotService] Supabase get lots query failed, falling back:', err.message);
      }
    }

    return localStore.getLots(filters);
  }

  async getLotDetails(idOrLotId) {
    if (isConfigured && supabase) {
      try {
        let query = supabase
          .from('harvest_lots')
          .select(`
            *,
            crop:crops(*),
            facility:storage_facilities(*),
            condition_checks(*),
            dispatches(*),
            spoilage_records(*)
          `);

        if (idOrLotId.includes('-') && idOrLotId.length === 36) {
          query = query.eq('id', idOrLotId);
        } else {
          query = query.eq('lot_id', idOrLotId);
        }

        const { data, error } = await query.single();
        if (!error && data) {
          // fetch lineage
          const { data: parentLinks } = await supabase
            .from('lot_lineage')
            .select('*, parent:harvest_lots!parent_lot_id(lot_id)')
            .eq('child_lot_id', data.id);

          const { data: childLinks } = await supabase
            .from('lot_lineage')
            .select('*, child:harvest_lots!child_lot_id(lot_id)')
            .eq('parent_lot_id', data.id);

          return {
            ...data,
            lineage: {
              parents: (parentLinks || []).map(p => ({
                ...p,
                parent_lot_code: p.parent ? p.parent.lot_id : 'Unknown'
              })),
              children: (childLinks || []).map(c => ({
                ...c,
                child_lot_code: c.child ? c.child.lot_id : 'Unknown'
              }))
            }
          };
        }
      } catch (err) {
        console.warn('[LotService] Supabase get lot detail failed, falling back:', err.message);
      }
    }

    return localStore.getLotById(idOrLotId);
  }

  async createLot(lotData, user) {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('harvest_lots')
          .insert({
            lot_id: lotData.lot_id,
            crop_id: lotData.crop_id,
            origin_farm: lotData.origin_farm,
            harvest_block: lotData.harvest_block || 'Default Block',
            harvest_date: lotData.harvest_date || new Date().toISOString(),
            initial_quantity_kg: Number(lotData.initial_quantity_kg),
            current_quantity_kg: Number(lotData.initial_quantity_kg),
            unit: lotData.unit || 'kg',
            initial_grade: lotData.initial_grade || 'Grade A Premium',
            current_facility_id: lotData.current_facility_id,
            status: 'In Storage',
            freshness_score: 100.00,
            aging_status: 'Fresh',
            notes: lotData.notes || '',
            created_by: (user && user.full_name) || 'Operator'
          })
          .select()
          .single();

        if (!error && data) {
          await auditService.log('LOT', data.lot_id, 'CREATE', user?.full_name, user?.role, {
            initial_quantity_kg: data.initial_quantity_kg,
            crop_id: data.crop_id
          });
          return this.getLotDetails(data.id);
        }
      } catch (err) {
        console.warn('[LotService] Supabase create lot failed, using local store:', err.message);
      }
    }

    return localStore.createLot(lotData, user);
  }

  async getCrops() {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('crops').select('*').order('name');
        if (!error && data) return data;
      } catch (err) {
        console.warn('[LotService] Supabase crops fetch failed:', err.message);
      }
    }
    return localStore.getCrops();
  }

  async getFacilities() {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('storage_facilities').select('*').order('name');
        if (!error && data) return data;
      } catch (err) {
        console.warn('[LotService] Supabase facilities fetch failed:', err.message);
      }
    }
    return localStore.getFacilities();
  }
}

module.exports = new LotService();
