// public/js/api.js
// Centralized API client for all REST endpoints

class ApiClient {
  constructor() {
    this.baseUrl = '/api';
    this.currentRole = localStorage.getItem('harvest_active_role') || 'operator';
    this.currentUserId = localStorage.getItem('harvest_active_user_id') || '';
  }

  setRole(role, userId = '') {
    this.currentRole = role;
    this.currentUserId = userId;
    localStorage.setItem('harvest_active_role', role);
    if (userId) localStorage.setItem('harvest_active_user_id', userId);
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-user-role': this.currentRole,
      ...(this.currentUserId ? { 'x-user-id': this.currentUserId } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || (data.errors ? data.errors.join(', ') : `HTTP ${response.status}`);
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${path}]:`, err);
      throw err;
    }
  }

  // Health
  getHealth() {
    return this.request('/health');
  }

  // Auth / Personas
  getMe() {
    return this.request('/auth/me');
  }

  switchRole(role, userId) {
    return this.request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role, user_id: userId })
    });
  }

  // Lots
  getLots(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/lots${query ? `?${query}` : ''}`);
  }

  getLotById(id) {
    return this.request(`/lots/${id}`);
  }

  createLot(lotData) {
    return this.request('/lots', {
      method: 'POST',
      body: JSON.stringify(lotData)
    });
  }

  getCrops() {
    return this.request('/lots/meta/crops');
  }

  getFacilities() {
    return this.request('/lots/meta/facilities');
  }

  // Condition Checks
  getConditionChecks(lotId) {
    return this.request(`/condition-checks/${lotId}`);
  }

  addConditionCheck(checkData) {
    return this.request('/condition-checks', {
      method: 'POST',
      body: JSON.stringify(checkData)
    });
  }

  // Lineage Split & Merge
  splitLot(splitData) {
    return this.request('/lineage/split', {
      method: 'POST',
      body: JSON.stringify(splitData)
    });
  }

  mergeLots(mergeData) {
    return this.request('/lineage/merge', {
      method: 'POST',
      body: JSON.stringify(mergeData)
    });
  }

  getLineageTree(lotId) {
    return this.request(`/lineage/tree/${lotId}`);
  }

  // Dispatches
  getDispatches() {
    return this.request('/dispatches');
  }

  createDispatch(dispatchData) {
    return this.request('/dispatches', {
      method: 'POST',
      body: JSON.stringify(dispatchData)
    });
  }

  // Spoilage Records
  getSpoilage() {
    return this.request('/spoilage');
  }

  createSpoilage(spoilageData) {
    return this.request('/spoilage', {
      method: 'POST',
      body: JSON.stringify(spoilageData)
    });
  }

  // Analytics
  getAnalytics() {
    return this.request('/analytics/dashboard');
  }

  // Public Transparency
  verifyLot(lotCode) {
    return this.request(`/public/verify/${encodeURIComponent(lotCode)}`);
  }

  getAuditLogs() {
    return this.request('/public/audit-log');
  }
}

window.api = new ApiClient();
