// server/services/analyticsService.js
const { supabase, isConfigured, localStore } = require('../config/database');

class AnalyticsService {
  async getMetrics() {
    return localStore.getAnalytics();
  }
}

module.exports = new AnalyticsService();
