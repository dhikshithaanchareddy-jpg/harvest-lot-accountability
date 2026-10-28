// public/js/components/lineageView.js

class LineageView {
  static renderTree(treeData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!treeData || !treeData.lot) {
      container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No lineage data available for this lot.</div>`;
      return;
    }

    const { lot, ancestors, descendants } = treeData;

    let html = `<div class="tree-flow">`;

    // 1. Ancestors level
    if (ancestors && ancestors.length > 0) {
      html += `
        <div style="text-align: center;">
          <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: var(--text-muted);">
            Origin Ancestor Batches (${ancestors.length})
          </span>
        </div>
        <div class="tree-level">
      `;

      ancestors.forEach(anc => {
        html += `
          <div class="tree-node parent">
            <div style="font-size: 0.72rem; color: var(--color-green-light); font-weight: 700;">PARENT LOT</div>
            <div class="barcode-text" style="font-size: 0.95rem; margin: 0.2rem 0;">${anc.lot.lot_id}</div>
            <div style="font-size: 0.8rem; font-weight: 600;">${anc.lot.origin_farm}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.35rem;">
              Contributed: <strong>${anc.quantity_contributed_kg} kg</strong> (${anc.event_type})
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic; margin-top: 0.2rem;">
              "${anc.rationale}"
            </div>
          </div>
        `;
      });

      html += `</div>
        <div class="tree-connector">
          <span>LINEAGE DERIVATION</span>
        </div>
      `;
    }

    // 2. Active Focus Lot
    html += `
      <div class="tree-level">
        <div class="tree-node" style="border: 3px solid var(--color-green-deep); background: #FFFFFF; transform: scale(1.04); box-shadow: var(--shadow-md);">
          <div style="font-size: 0.72rem; color: var(--color-mango); font-weight: 800; letter-spacing: 0.05em;">ACTIVE FOCUS LOT</div>
          <div class="barcode-text" style="font-size: 1.15rem; margin: 0.3rem 0; color: var(--color-green-deep);">${lot.lot_id}</div>
          <div style="font-size: 0.88rem; font-weight: 700;">${lot.origin_farm}</div>
          <div style="margin: 0.5rem 0;">
            <span class="badge ${FreshnessMeter.getBadgeClass(lot.aging_status)}">${lot.aging_status}</span>
            <span style="font-size: 0.8rem; font-weight: 700; margin-left: 0.5rem;">${lot.freshness_score}% Fresh</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            Available: <strong>${lot.current_quantity_kg} / ${lot.initial_quantity_kg} kg</strong>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">
            Status: <strong>${lot.status}</strong>
          </div>
        </div>
      </div>
    `;

    // 3. Descendants level
    if (descendants && descendants.length > 0) {
      html += `
        <div class="tree-connector">
          <span>DOWNSTREAM PROVENANCE</span>
        </div>
        <div style="text-align: center;">
          <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: var(--text-muted);">
            Derived Child Batches (${descendants.length})
          </span>
        </div>
        <div class="tree-level">
      `;

      descendants.forEach(desc => {
        html += `
          <div class="tree-node child">
            <div style="font-size: 0.72rem; color: var(--color-mango-dark); font-weight: 700;">DERIVED CHILD</div>
            <div class="barcode-text" style="font-size: 0.95rem; margin: 0.2rem 0;">${desc.lot.lot_id}</div>
            <div style="font-size: 0.8rem; font-weight: 600;">Portion: ${desc.quantity_contributed_kg} kg</div>
            <div style="margin: 0.35rem 0;">
              <span class="badge ${FreshnessMeter.getBadgeClass(desc.lot.aging_status)}">${desc.lot.aging_status}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">
              Current Stock: <strong>${desc.lot.current_quantity_kg} kg</strong> (${desc.lot.status})
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-style: italic; margin-top: 0.25rem;">
              "${desc.rationale}"
            </div>
          </div>
        `;
      });

      html += `</div>`;
    } else if (!ancestors || ancestors.length === 0) {
      html += `
        <div style="text-align: center; margin-top: 1rem; color: var(--text-muted); font-size: 0.82rem;">
          🌱 <em>This lot is an original direct harvest batch without split or merge partitions.</em>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  }
}

window.LineageView = LineageView;
