// public/js/app.js
// Main client application logic for Harvest Lot Freshness and Spoilage Accountability Register

document.addEventListener('DOMContentLoaded', () => {
  const App = {
    state: {
      crops: [],
      facilities: [],
      lots: [],
      activeLot: null,
      analytics: null,
      dispatches: [],
      spoilageRecords: [],
      activeTab: 'overview',
      filters: {
        search: '',
        crop_id: '',
        facility_id: '',
        status: '',
        aging_status: '',
        sort_by: 'created_at',
        sort_order: 'desc'
      },
      currentUser: null,
      availablePersonas: []
    },

    async init() {
      try {
        await this.checkHealth();
        await this.loadAuthContext();
        await this.loadMetadata();
        await this.loadDashboardMetrics();
        await this.loadLots();
        await this.loadDispatches();
        await this.loadSpoilage();
        this.bindEvents();
        this.setupLiveConditionCalculator();
      } catch (err) {
        console.error('Initialization error:', err);
        this.showToast('Failed to initialize application data', 'error');
      }
    },

    // 1. Health & DB Status
    async checkHealth() {
      try {
        const health = await api.getHealth();
        const indicator = document.getElementById('db-status-badge');
        if (indicator) {
          const isSupa = health.database && health.database.supabase_connected;
          indicator.innerHTML = `
            <span class="db-indicator-dot" style="background-color: ${isSupa ? '#10B981' : '#F77F00'}"></span>
            <span>${health.database ? health.database.provider : 'Local PostgreSQL Engine'}</span>
          `;
        }
      } catch (e) {
        console.warn('Health check failed', e);
      }
    },

    // 2. Auth & Persona Context
    async loadAuthContext() {
      try {
        const res = await api.getMe();
        if (res.success) {
          this.state.currentUser = res.user;
          this.state.availablePersonas = res.available_personas || [];
          this.renderPersonaSelector();
          this.applyRbacUI();
        }
      } catch (e) {
        console.warn('Could not load auth context', e);
      }
    },

    renderPersonaSelector() {
      const select = document.getElementById('persona-select');
      if (!select) return;

      select.innerHTML = this.state.availablePersonas.map(p => `
        <option value="${p.role}" data-id="${p.id}" ${p.role === api.currentRole ? 'selected' : ''}>
          ${p.full_name} (${p.role.toUpperCase()})
        </option>
      `).join('');

      select.addEventListener('change', async (e) => {
        const selectedOption = select.options[select.selectedIndex];
        const newRole = selectedOption.value;
        const newUserId = selectedOption.getAttribute('data-id');
        api.setRole(newRole, newUserId);
        await api.switchRole(newRole, newUserId);
        this.state.currentUser = this.state.availablePersonas.find(p => p.role === newRole);
        this.applyRbacUI();
        this.showToast(`Switched active persona to ${selectedOption.text}`, 'success');
        this.loadLots();
      });
    },

    applyRbacUI() {
      const role = api.currentRole;
      const operatorControls = document.querySelectorAll('.operator-only');
      operatorControls.forEach(el => {
        if (role === 'visitor') {
          el.style.display = 'none';
        } else {
          el.style.display = '';
        }
      });
    },

    // 3. Metadata: Crops and Storage Facilities
    async loadMetadata() {
      try {
        const [cropsRes, facRes] = await Promise.all([
          api.getCrops(),
          api.getFacilities()
        ]);

        this.state.crops = cropsRes.data || [];
        this.state.facilities = facRes.data || [];

        this.populateCropDropdowns();
        this.populateFacilityDropdowns();
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    },

    populateCropDropdowns() {
      const cropFilters = document.querySelectorAll('.crop-select-populate');
      cropFilters.forEach(sel => {
        const currentVal = sel.value;
        const defaultOption = sel.firstElementChild ? sel.firstElementChild.outerHTML : '<option value="">All Crop Varieties</option>';
        sel.innerHTML = defaultOption + this.state.crops.map(c => `
          <option value="${c.id}">${c.name} (${c.category}) - $${Number(c.unit_price_per_kg).toFixed(2)}/kg</option>
        `).join('');
        if (currentVal) sel.value = currentVal;
      });
    },

    populateFacilityDropdowns() {
      const facFilters = document.querySelectorAll('.facility-select-populate');
      facFilters.forEach(sel => {
        const currentVal = sel.value;
        const defaultOption = sel.firstElementChild ? sel.firstElementChild.outerHTML : '<option value="">All Storage Facilities</option>';
        sel.innerHTML = defaultOption + this.state.facilities.map(f => `
          <option value="${f.id}">${f.name} (${f.facility_type})</option>
        `).join('');
        if (currentVal) sel.value = currentVal;
      });
    },

    // 4. Dashboard KPIs & Accountability Analytics
    async loadDashboardMetrics() {
      try {
        const res = await api.getAnalytics();
        if (res.success && res.data) {
          this.state.analytics = res.data;
          this.renderDashboardKPIs(res.data.summary);
          this.renderAnalyticsCharts(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    },

    renderDashboardKPIs(summary) {
      if (!summary) return;
      document.getElementById('kpi-active-inventory').textContent = `${Number(summary.active_inventory_kg).toLocaleString()} kg`;
      document.getElementById('kpi-total-harvested').textContent = `${Number(summary.total_harvested_kg).toLocaleString()} kg`;
      document.getElementById('kpi-dispatched-volume').textContent = `${Number(summary.total_dispatched_kg).toLocaleString()} kg`;
      document.getElementById('kpi-loss-rate').textContent = `${summary.overall_loss_rate_pct}%`;
      document.getElementById('kpi-financial-loss').textContent = `$${Number(summary.total_financial_loss).toLocaleString()}`;
    },

    renderAnalyticsCharts(analytics) {
      // 1. Loss by Crop Bar Chart
      const cropContainer = document.getElementById('chart-loss-by-crop');
      if (cropContainer && analytics.loss_by_crop) {
        cropContainer.innerHTML = analytics.loss_by_crop.map(c => {
          const isHigh = c.loss_rate_pct > 5.0;
          return `
            <div class="bar-chart-row">
              <span class="bar-label" title="${c.crop_name}">${c.crop_name}</span>
              <div class="bar-track">
                <div class="bar-fill ${isHigh ? 'warning' : ''}" style="width: ${Math.min(100, c.loss_rate_pct * 5)}%"></div>
              </div>
              <span class="bar-val" style="color: ${isHigh ? 'var(--color-mango-dark)' : 'var(--color-green-deep)'};">
                ${c.loss_rate_pct}%
              </span>
            </div>
          `;
        }).join('');
      }

      // 2. Loss by Facility
      const facContainer = document.getElementById('chart-loss-by-facility');
      if (facContainer && analytics.loss_by_location) {
        facContainer.innerHTML = analytics.loss_by_location.map(f => `
          <div class="bar-chart-row">
            <span class="bar-label" title="${f.facility_name}">${f.facility_name}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${Math.min(100, (f.total_spoiled_kg / 600) * 100)}%"></div>
            </div>
            <span class="bar-val">${f.total_spoiled_kg} kg</span>
          </div>
        `).join('');
      }

      // 3. Spoilage Root Drivers
      const driverContainer = document.getElementById('chart-spoilage-drivers');
      if (driverContainer && analytics.spoilage_drivers) {
        driverContainer.innerHTML = analytics.spoilage_drivers.map(d => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--border-ledger); font-size: 0.82rem;">
            <div>
              <strong>${d.reason}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${d.incident_count} incident(s) logged</div>
            </div>
            <div style="text-align: right;">
              <span style="font-weight: 700; color: var(--color-danger);">$${Number(d.loss_value).toLocaleString()}</span>
              <div style="font-size: 0.74rem; color: var(--text-secondary);">${d.quantity_kg} kg loss</div>
            </div>
          </div>
        `).join('');
      }
    },

    // 5. Active Lots
    async loadLots() {
      const container = document.getElementById('lots-container');
      if (!container) return;

      container.innerHTML = `<div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted);">Scanning harvest registry...</div>`;

      try {
        const res = await api.getLots(this.state.filters);
        this.state.lots = res.data || [];
        this.renderLotsList(this.state.lots);
        this.populateLotSelects(this.state.lots);
      } catch (err) {
        container.innerHTML = `<div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--color-danger);">Failed to load harvest lots: ${err.message}</div>`;
      }
    },

    renderLotsList(lots) {
      const container = document.getElementById('lots-container');
      if (!container) return;

      if (!lots || lots.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; background: var(--bg-card); border: 2px dashed var(--border-ledger); border-radius: var(--radius-md); padding: 3rem; text-align: center;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌾</div>
            <h3 style="font-family: var(--font-serif); margin-bottom: 0.5rem;">No Harvest Lots Found</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 400px; margin: 0 auto 1.25rem;">
              No lots match your current search/filter parameters. Try clearing the filters or register a new harvest batch.
            </p>
            <button class="btn-primary operator-only" onclick="App.openCreateLotModal()">+ Register First Harvest Lot</button>
          </div>
        `;
        return;
      }

      container.innerHTML = lots.map(lot => {
        const crop = this.state.crops.find(c => c.id === lot.crop_id);
        const shelfLife = crop ? crop.shelf_life_days : 14;
        const freshnessHtml = FreshnessMeter.render(lot.freshness_score, lot.aging_status, lot.days_in_storage, shelfLife);

        return `
          <article class="lot-card" data-id="${lot.id}">
            <div class="lot-card-header">
              <div>
                <span class="lot-id-badge">
                  <span>🏷️</span>
                  <span>${lot.lot_id}</span>
                </span>
                <div class="lot-crop-title">${lot.crop_name}</div>
              </div>
              <span class="badge" style="background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border-ledger);">
                ${lot.initial_grade}
              </span>
            </div>

            ${freshnessHtml}

            <div class="lot-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Origin Farm & Block</span>
                <span class="meta-val" title="${lot.origin_farm}">${lot.origin_farm} (${lot.harvest_block})</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Storage Facility</span>
                <span class="meta-val" title="${lot.facility_name}">${lot.facility_name}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Current / Initial Stock</span>
                <span class="meta-val" style="color: ${lot.current_quantity_kg === 0 ? 'var(--text-muted)' : 'var(--color-green-deep)'};">
                  ${lot.current_quantity_kg.toLocaleString()} / ${lot.initial_quantity_kg.toLocaleString()} kg
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Batch Valuation</span>
                <span class="meta-val">$${lot.total_value ? lot.total_value.toLocaleString() : '0'}</span>
              </div>
            </div>

            <div class="lot-card-actions">
              <button class="btn-action" onclick="App.openPassportModal('${lot.lot_id}')" title="Inspect Digital Passport">
                🔍 Passport
              </button>
              <button class="btn-action" onclick="App.viewLotLineage('${lot.id}')" title="Trace Lineage Provenance">
                🌳 Lineage
              </button>
              <button class="btn-action operator-only" onclick="App.openConditionModal('${lot.id}')" title="Record Condition Check">
                🔬 Inspect
              </button>
              ${lot.current_quantity_kg > 0 ? `
                <button class="btn-action operator-only" onclick="App.openSplitModal('${lot.id}')" title="Split into multiple child lots">
                  ✂️ Split
                </button>
                <button class="btn-action operator-only" onclick="App.openDispatchModal('${lot.id}')" title="Create Outbound Dispatch">
                  🚚 Dispatch
                </button>
                <button class="btn-action operator-only" onclick="App.openSpoilageModal('${lot.id}')" title="Write-off Spoilage Loss" style="color: var(--color-danger);">
                  ⚠️ Spoilage
                </button>
              ` : `
                <span style="font-size: 0.72rem; color: var(--text-muted); padding: 0.35rem 0.5rem; font-style: italic;">
                  Lot Depleted (${lot.status})
                </span>
              `}
            </div>
          </article>
        `;
      }).join('');
    },

    populateLotSelects(lots) {
      const inspectSelect = document.getElementById('inspect-form-lot-select');
      if (inspectSelect) {
        const cur = inspectSelect.value;
        inspectSelect.innerHTML = lots.map(l => `
          <option value="${l.id}">${l.lot_id} - ${l.crop_name} (${l.current_quantity_kg} kg in stock)</option>
        `).join('');
        if (cur) inspectSelect.value = cur;
      }

      const lineageSelect = document.getElementById('lineage-lot-selector');
      if (lineageSelect) {
        const cur = lineageSelect.value;
        lineageSelect.innerHTML = `<option value="">-- Choose a Harvest Lot to Trace --</option>` + lots.map(l => `
          <option value="${l.id}">${l.lot_id} - ${l.crop_name} (${l.status})</option>
        `).join('');
        if (cur) lineageSelect.value = cur;
      }
    },
    async loadDispatches() {
      const container = document.getElementById('dispatches-table-body');
      if (!container) return;

      try {
        const res = await api.getDispatches();
        this.state.dispatches = res.data || [];
        container.innerHTML = this.state.dispatches.map(d => `
          <tr>
            <td class="barcode-text">${d.dispatch_id}</td>
            <td class="barcode-text">${d.lot_code || d.lot_id}</td>
            <td><strong>${d.destination_buyer}</strong><br><span style="font-size: 0.72rem; color: var(--text-muted);">${d.channel_type}</span></td>
            <td><strong>${d.quantity_dispatched_kg.toLocaleString()} kg</strong></td>
            <td>${d.transport_mode}<br><span style="font-size: 0.72rem; color: var(--text-muted);">Departure: ${d.temperature_at_departure_c}°C</span></td>
            <td><span class="badge badge-optimal">${d.condition_score_at_dispatch}% Quality</span></td>
            <td class="barcode-text" style="font-size: 0.76rem;">${d.bill_of_lading}</td>
            <td style="font-size: 0.76rem; color: var(--text-muted);">${new Date(d.dispatch_date).toLocaleDateString()}</td>
          </tr>
        `).join('');
      } catch (e) {
        console.warn('Failed to load dispatches', e);
      }
    },

    // 7. Spoilage Accountability Register
    async loadSpoilage() {
      const container = document.getElementById('spoilage-table-body');
      if (!container) return;

      try {
        const res = await api.getSpoilage();
        this.state.spoilageRecords = res.data || [];
        container.innerHTML = this.state.spoilageRecords.map(s => `
          <tr>
            <td class="barcode-text">${s.spoilage_id}</td>
            <td class="barcode-text">${s.lot_code || s.lot_id}</td>
            <td>
              <strong style="color: var(--color-danger);">${s.spoilage_reason}</strong>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${s.severity_grade}</div>
            </td>
            <td><strong>${s.quantity_spoiled_kg.toLocaleString()} kg</strong></td>
            <td><strong style="color: var(--color-danger); font-family: var(--font-mono);">$${Number(s.financial_loss_estimate).toLocaleString()}</strong></td>
            <td>${s.facility_name || s.responsible_facility_id}</td>
            <td style="max-width: 250px; font-size: 0.76rem;">
              <strong>Root Cause:</strong> ${s.root_cause_analysis}<br>
              <strong style="color: var(--color-green-deep);">Action:</strong> ${s.corrective_action}
            </td>
            <td style="font-size: 0.76rem; color: var(--text-muted);">${new Date(s.discard_date).toLocaleDateString()}</td>
          </tr>
        `).join('');
      } catch (e) {
        console.warn('Failed to load spoilage', e);
      }
    },

    // 8. Event Bindings
    bindEvents() {
      // Navigation tab switching
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = btn.getAttribute('data-tab');
          this.switchTab(tab);
        });
      });

      // Filter events
      const searchInput = document.getElementById('filter-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.state.filters.search = e.target.value.trim();
          this.loadLots();
        });
      }

      const cropFilter = document.getElementById('filter-crop');
      if (cropFilter) {
        cropFilter.addEventListener('change', (e) => {
          this.state.filters.crop_id = e.target.value;
          this.loadLots();
        });
      }

      const facilityFilter = document.getElementById('filter-facility');
      if (facilityFilter) {
        facilityFilter.addEventListener('change', (e) => {
          this.state.filters.facility_id = e.target.value;
          this.loadLots();
        });
      }

      const statusFilter = document.getElementById('filter-status');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          this.state.filters.status = e.target.value;
          this.loadLots();
        });
      }

      const sortFilter = document.getElementById('filter-sort');
      if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
          const [field, order] = e.target.value.split(':');
          this.state.filters.sort_by = field;
          this.state.filters.sort_order = order;
          this.loadLots();
        });
      }

      // Close modal on escape or background click
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeAllModals();
        });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeAllModals();
      });
    },

    switchTab(tabId) {
      this.state.activeTab = tabId;
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
      });
      document.querySelectorAll('.view-panel').forEach(p => {
        p.classList.toggle('active', p.id === `view-${tabId}`);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    },

    // 9. Condition Inspection Live Calculator
    setupLiveConditionCalculator() {
      const tempInput = document.getElementById('inspect-temp');
      const rhInput = document.getElementById('inspect-rh');
      const ethyleneInput = document.getElementById('inspect-ethylene');
      const visualInput = document.getElementById('inspect-visual');
      const previewEl = document.getElementById('inspect-preview-score');

      const updatePreview = () => {
        if (!previewEl) return;
        const temp = Number(tempInput?.value || 12);
        const visual = Number(visualInput?.value || 90);
        const ethylene = Number(ethyleneInput?.value || 0.1);

        let score = (visual * 0.4) + 60;
        if (temp > 14) score -= (temp - 14) * 4;
        if (ethylene > 0.5) score -= (ethylene - 0.5) * 10;
        score = Math.max(0, Math.min(100, Math.round(score)));

        previewEl.textContent = `${score}% Freshness`;
        previewEl.className = `badge ${FreshnessMeter.getBadgeClass(score > 80 ? 'Fresh' : score > 60 ? 'Optimal' : score > 40 ? 'Approaching Threshold' : 'Critical Over-Age')}`;
      };

      [tempInput, rhInput, ethyleneInput, visualInput].forEach(inp => {
        if (inp) inp.addEventListener('input', updatePreview);
      });
    },

    // 10. Modals & Action Controllers
    openCreateLotModal() {
      this.closeAllModals();
      document.getElementById('modal-create-lot').classList.add('active');
    },

    async submitCreateLot(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const payload = {
        lot_id: formData.get('lot_id') || undefined,
        crop_id: formData.get('crop_id'),
        origin_farm: formData.get('origin_farm'),
        harvest_block: formData.get('harvest_block'),
        initial_quantity_kg: Number(formData.get('initial_quantity_kg')),
        initial_grade: formData.get('initial_grade'),
        current_facility_id: formData.get('current_facility_id'),
        notes: formData.get('notes')
      };

      try {
        const res = await api.createLot(payload);
        this.showToast(`Registered Lot: ${res.data.lot_id}`, 'success');
        this.closeAllModals();
        form.reset();
        await this.loadLots();
        await this.loadDashboardMetrics();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openConditionModal(lotId) {
      this.closeAllModals();
      const lot = this.state.lots.find(l => l.id === lotId);
      if (!lot) return;

      document.getElementById('inspect-lot-id').value = lot.id;
      document.getElementById('inspect-lot-title').textContent = `${lot.lot_id} (${lot.crop_name})`;
      document.getElementById('modal-condition').classList.add('active');
    },

    async submitConditionCheck(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const payload = {
        lot_id: formData.get('lot_id'),
        temperature_c: Number(formData.get('temperature_c')),
        relative_humidity_pct: Number(formData.get('relative_humidity_pct')),
        ethylene_ppm: Number(formData.get('ethylene_ppm')),
        visual_quality_score: Number(formData.get('visual_quality_score')),
        pest_signs: formData.get('pest_signs') === 'true',
        fungal_signs: formData.get('fungal_signs') === 'true',
        decay_stage: formData.get('decay_stage'),
        action_recommended: formData.get('action_recommended'),
        inspector_name: formData.get('inspector_name') || api.currentRole,
        notes: formData.get('notes')
      };

      try {
        const res = await api.addConditionCheck(payload);
        this.showToast(`Condition recorded. Calculated Freshness: ${res.data.freshness_calculated}%`, 'success');
        this.closeAllModals();
        form.reset();
        await this.loadLots();
        await this.loadDashboardMetrics();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openSplitModal(lotId) {
      this.closeAllModals();
      const lot = this.state.lots.find(l => l.id === lotId);
      if (!lot) return;

      document.getElementById('split-parent-id').value = lot.id;
      document.getElementById('split-parent-info').textContent = `${lot.lot_id} (${lot.crop_name}) - Available: ${lot.current_quantity_kg} kg`;
      document.getElementById('modal-split').classList.add('active');
    },

    async submitSplitLot(e) {
      e.preventDefault();
      const form = e.target;
      const parentId = document.getElementById('split-parent-id').value;
      const portion1 = Number(document.getElementById('split-p1-qty').value);
      const portion2 = Number(document.getElementById('split-p2-qty').value);
      const rationale = document.getElementById('split-rationale').value;

      const payload = {
        parent_lot_id: parentId,
        rationale: rationale,
        children: [
          { portion_kg: portion1, rationale: `${rationale} (Batch Part 1)` },
          { portion_kg: portion2, rationale: `${rationale} (Batch Part 2)` }
        ]
      };

      try {
        const res = await api.splitLot(payload);
        this.showToast(`Split complete. Created child batches: ${res.data.children.map(c => c.lot_id).join(', ')}`, 'success');
        this.closeAllModals();
        form.reset();
        await this.loadLots();
        this.viewLotLineage(parentId);
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openMergeModal() {
      this.closeAllModals();
      // Populate eligible lots
      const eligibleLots = this.state.lots.filter(l => l.current_quantity_kg > 0);
      const container = document.getElementById('merge-lots-selector');
      if (container) {
        container.innerHTML = eligibleLots.map(l => `
          <label style="display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem; background: var(--bg-cream-surface); border: 1px solid var(--border-ledger); border-radius: var(--radius-sm); margin-bottom: 0.4rem; font-size: 0.82rem; cursor: pointer;">
            <input type="checkbox" name="merge_lot" value="${l.id}" data-crop="${l.crop_id}">
            <div>
              <strong>${l.lot_id}</strong> - ${l.crop_name} (${l.current_quantity_kg} kg available)
            </div>
          </label>
        `).join('');
      }
      document.getElementById('modal-merge').classList.add('active');
    },

    async submitMergeLots(e) {
      e.preventDefault();
      const checkedBoxes = Array.from(document.querySelectorAll('input[name="merge_lot"]:checked'));
      if (checkedBoxes.length < 2) {
        this.showToast('Select at least two lots to merge', 'error');
        return;
      }

      const parentIds = checkedBoxes.map(cb => cb.value);
      const rationale = document.getElementById('merge-rationale').value;

      try {
        const res = await api.mergeLots({ parent_lot_ids: parentIds, rationale });
        this.showToast(`Merged into new lot: ${res.data.merged_lot.lot_id}`, 'success');
        this.closeAllModals();
        await this.loadLots();
        this.viewLotLineage(res.data.merged_lot.id);
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openDispatchModal(lotId) {
      this.closeAllModals();
      const lot = this.state.lots.find(l => l.id === lotId);
      if (!lot) return;

      document.getElementById('dispatch-lot-id').value = lot.id;
      document.getElementById('dispatch-lot-info').textContent = `${lot.lot_id} (${lot.crop_name}) - Available: ${lot.current_quantity_kg} kg`;
      document.getElementById('dispatch-qty').max = lot.current_quantity_kg;
      document.getElementById('modal-dispatch').classList.add('active');
    },

    async submitDispatch(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const payload = {
        lot_id: formData.get('lot_id'),
        destination_buyer: formData.get('destination_buyer'),
        channel_type: formData.get('channel_type'),
        quantity_dispatched_kg: Number(formData.get('quantity_dispatched_kg')),
        transport_mode: formData.get('transport_mode'),
        temperature_at_departure_c: Number(formData.get('temperature_at_departure_c')),
        notes: formData.get('notes')
      };

      try {
        const res = await api.createDispatch(payload);
        this.showToast(`Dispatched ${res.data.dispatch.quantity_dispatched_kg} kg! BOL: ${res.data.dispatch.bill_of_lading}`, 'success');
        this.closeAllModals();
        form.reset();
        await this.loadLots();
        await this.loadDispatches();
        await this.loadDashboardMetrics();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    openSpoilageModal(lotId) {
      this.closeAllModals();
      const lot = this.state.lots.find(l => l.id === lotId);
      if (!lot) return;

      document.getElementById('spoilage-lot-id').value = lot.id;
      document.getElementById('spoilage-lot-info').textContent = `${lot.lot_id} (${lot.crop_name}) - Available: ${lot.current_quantity_kg} kg`;
      document.getElementById('spoilage-qty').max = lot.current_quantity_kg;
      document.getElementById('modal-spoilage').classList.add('active');
    },

    async submitSpoilage(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);

      const payload = {
        lot_id: formData.get('lot_id'),
        quantity_spoiled_kg: Number(formData.get('quantity_spoiled_kg')),
        spoilage_reason: formData.get('spoilage_reason'),
        root_cause_analysis: formData.get('root_cause_analysis'),
        corrective_action: formData.get('corrective_action')
      };

      try {
        const res = await api.createSpoilage(payload);
        this.showToast(`Spoilage written off: $${res.data.spoilage.financial_loss_estimate} loss logged`, 'success');
        this.closeAllModals();
        form.reset();
        await this.loadLots();
        await this.loadSpoilage();
        await this.loadDashboardMetrics();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    // 11. Digital Passport & Lineage Tree
    async viewLotLineage(lotId) {
      this.switchTab('lineage');
      const container = document.getElementById('lineage-container');
      if (!container) return;

      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Tracing provenance tree...</div>`;

      try {
        const res = await api.getLineageTree(lotId);
        LineageView.renderTree(res.data, 'lineage-container');
      } catch (err) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-danger);">Failed to trace lineage: ${err.message}</div>`;
      }
    },

    async openPassportModal(lotId) {
      this.closeAllModals();
      const modal = document.getElementById('modal-passport');
      const content = document.getElementById('passport-content');
      modal.classList.add('active');
      content.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Retrieving lot passport...</div>`;

      try {
        const res = await api.verifyLot(lotId);
        const p = res.passport;
        content.innerHTML = `
          <div style="background: var(--bg-cream-surface); border: 2px solid var(--color-green-deep); border-radius: var(--radius-md); padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px dashed var(--border-ledger); padding-bottom: 1rem; margin-bottom: 1rem;">
              <div>
                <div style="font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: var(--color-green-light);">OFFICIAL CUSTODY PASSPORT</div>
                <div class="barcode-text" style="font-size: 1.25rem;">${p.lot_id}</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-green-deep);">${p.crop_name}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: var(--font-mono); font-size: 1.5rem;">[QR]</div>
                <span class="badge ${FreshnessMeter.getBadgeClass(p.aging_status)}">${p.aging_status}</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; font-size: 0.82rem; margin-bottom: 1rem;">
              <div><strong>Origin Farm:</strong><br>${p.origin_farm} (${p.harvest_block})</div>
              <div><strong>Harvest Date:</strong><br>${new Date(p.harvest_date).toLocaleDateString()}</div>
              <div><strong>Freshness Index:</strong><br><strong style="color: var(--color-green-deep); font-size: 1.1rem;">${p.freshness_score}%</strong></div>
              <div><strong>Quality Grade:</strong><br>${p.initial_grade}</div>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-ledger); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.78rem;">
              <strong>Cold-Chain & Telemetry Verification:</strong><br>
              ${p.inspection_count} independent quality inspections recorded.<br>
              ${p.latest_inspection ? `Latest Temperature: <strong>${p.latest_inspection.temperature_c}°C</strong> | Decay Stage: <strong>${p.latest_inspection.decay_stage}</strong>` : 'Awaiting scheduled inspection.'}
            </div>

            <div style="margin-top: 0.85rem; font-size: 0.74rem; color: var(--text-muted); text-align: center;">
              Cryptographically timestamped & verified in Supabase PostgreSQL supply-chain ledger.
            </div>
          </div>
        `;
      } catch (err) {
        content.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--color-danger);">${err.message}</div>`;
      }
    },

    // 12. Toast Feedback
    showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type === 'error' ? 'error' : ''}`;
      toast.innerHTML = `
        <span>${type === 'error' ? '❌' : '✅'}</span>
        <span>${message}</span>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  };

  window.App = App;
  App.init();
});
