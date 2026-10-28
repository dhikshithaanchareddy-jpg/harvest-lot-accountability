// server/services/auditService.js
const { supabase, isConfigured, localStore } = require('../config/database');

class AuditService {
  async log(entityType, entityId, action, performedBy, role, details, ipAddress = '127.0.0.1') {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_events')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            action: action,
            performed_by: performedBy || 'Operator',
            role: role || 'operator',
            details: details || {},
            ip_address: ipAddress
          })
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[AuditService] Supabase audit write failed, logging locally:', err.message);
      }
    }

    return localStore.logAuditEvent(entityType, entityId, action, performedBy, role, details);
  }

  async getRecentEvents(limit = 50) {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) return data;
      } catch (err) {
        console.warn('[AuditService] Supabase audit read failed, falling back to local:', err.message);
      }
    }

    return localStore.auditEvents.slice(0, limit);
  }
}

module.exports = new AuditService();
