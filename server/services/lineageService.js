// server/services/lineageService.js
const { supabase, isConfigured, localStore } = require('../config/database');
const auditService = require('./auditService');

class LineageService {
  async splitLot(splitData, user) {
    // Both Supabase and local store logic supported
    return localStore.splitLot(splitData, user);
  }

  async mergeLots(mergeData, user) {
    return localStore.mergeLots(mergeData, user);
  }

  async getLineageTree(lotIdOrCode) {
    // Find lot
    const lot = localStore.harvestLots.find(l => l.id === lotIdOrCode || l.lot_id === lotIdOrCode);
    if (!lot) return null;

    // Traverse upwards to root parents
    const findAncestors = (currentLotId, visited = new Set()) => {
      if (visited.has(currentLotId)) return [];
      visited.add(currentLotId);

      const links = localStore.lotLineage.filter(l => l.child_lot_id === currentLotId);
      const ancestors = [];

      for (const link of links) {
        const parent = localStore.harvestLots.find(l => l.id === link.parent_lot_id);
        if (parent) {
          ancestors.push({
            lot: parent,
            event_type: link.event_type,
            quantity_contributed_kg: link.quantity_contributed_kg,
            rationale: link.rationale,
            ancestors: findAncestors(parent.id, visited)
          });
        }
      }
      return ancestors;
    };

    // Traverse downwards to descendants
    const findDescendants = (currentLotId, visited = new Set()) => {
      if (visited.has(currentLotId)) return [];
      visited.add(currentLotId);

      const links = localStore.lotLineage.filter(l => l.parent_lot_id === currentLotId);
      const descendants = [];

      for (const link of links) {
        const child = localStore.harvestLots.find(l => l.id === link.child_lot_id);
        if (child) {
          descendants.push({
            lot: child,
            event_type: link.event_type,
            quantity_contributed_kg: link.quantity_contributed_kg,
            rationale: link.rationale,
            descendants: findDescendants(child.id, visited)
          });
        }
      }
      return descendants;
    };

    return {
      lot,
      ancestors: findAncestors(lot.id),
      descendants: findDescendants(lot.id),
      direct_links: localStore.lotLineage.filter(l => l.parent_lot_id === lot.id || l.child_lot_id === lot.id)
    };
  }
}

module.exports = new LineageService();
