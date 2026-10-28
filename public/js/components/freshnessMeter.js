// public/js/components/freshnessMeter.js

class FreshnessMeter {
  static getBarClass(score) {
    if (score >= 85) return 'high';
    if (score >= 65) return 'mid';
    if (score >= 40) return 'low';
    return 'critical';
  }

  static getBadgeClass(status) {
    switch (status) {
      case 'Fresh': return 'badge-fresh';
      case 'Optimal': return 'badge-optimal';
      case 'Approaching Threshold': return 'badge-warning';
      case 'Critical Over-Age': return 'badge-critical';
      case 'Spoilage Suspect': return 'badge-suspect';
      default: return 'badge-optimal';
    }
  }

  static render(score, agingStatus, daysInStorage, shelfLifeDays) {
    const barClass = this.getBarClass(score);
    const badgeClass = this.getBadgeClass(agingStatus);
    const daysLeft = shelfLifeDays ? Math.max(0, shelfLifeDays - daysInStorage) : null;

    return `
      <div class="freshness-meter">
        <div class="meter-header">
          <span class="badge ${badgeClass}">${agingStatus}</span>
          <span class="meter-score" title="Freshness Index Calculation">
            Freshness: <strong>${Number(score).toFixed(1)}%</strong>
          </span>
        </div>
        <div class="meter-track" role="progressbar" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100">
          <div class="meter-bar ${barClass}" style="width: ${Math.min(100, Math.max(0, score))}%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
          <span>In Cold Storage: <strong>${daysInStorage}d</strong></span>
          ${daysLeft !== null ? `<span>Estimated Shelf-Life: <strong>${daysLeft}d left</strong></span>` : ''}
        </div>
      </div>
    `;
  }
}

window.FreshnessMeter = FreshnessMeter;
