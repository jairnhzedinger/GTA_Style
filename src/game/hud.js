export class HUD {
  constructor(element) {
    this.el = element;
    this.stats = {
      speed: 0,
      speedLimit: 0,
      stamina: 1,
      surface: 'pavimento',
      time: 0,
      hint: '',
      inVehicle: false,
    };
  }

  update(data) {
    this.stats = { ...this.stats, ...data };
    this.render();
  }

  render() {
    const staminaPercent = Math.round(this.stats.stamina * 100);
    const surfaceLabel = this.stats.surface.charAt(0).toUpperCase() + this.stats.surface.slice(1);
    const hintBlock = this.stats.hint
      ? `<div class="hud-hint">${this.stats.hint}</div>`
      : '';
    const speedometer = this.stats.inVehicle
      ? this.renderSpeedometer(this.stats.speed, this.stats.speedLimit)
      : '';

    this.el.innerHTML = `
      <div class="hud-row"><strong>Velocidade:</strong> ${this.stats.speed.toFixed(1)} km/h</div>
      ${speedometer}
      <div class="hud-row"><strong>Stamina:</strong> ${staminaPercent}%</div>
      <div class="hud-row"><strong>Superfície:</strong> ${surfaceLabel}</div>
      <div class="hud-row"><strong>Tempo:</strong> ${this.stats.time.toFixed(1)}s</div>
      ${hintBlock}
    `;
  }

  renderSpeedometer(currentSpeed, maxSpeed) {
    const safeMax = Math.max(0, maxSpeed || 0);
    const normalizedSpeed = Math.max(0, currentSpeed);
    const ratio = safeMax > 0 ? Math.min(normalizedSpeed / safeMax, 1) : 0;
    const startAngle = -120;
    const sweep = 240;
    const angle = startAngle + sweep * ratio;
    const centerX = 60;
    const centerY = 65;
    const radius = 45;
    const radians = (angle * Math.PI) / 180;
    const needleX = centerX + radius * Math.cos(radians);
    const needleY = centerY + radius * Math.sin(radians);

    return `
      <div class="hud-speedometer" aria-hidden="false">
        <svg viewBox="0 0 120 80" role="img" aria-label="Velocímetro">
          <path class="hud-speedometer-arc" d="M 15 65 A 45 45 0 0 1 105 65" />
          <line class="hud-speedometer-needle" x1="${centerX}" y1="${centerY}" x2="${needleX.toFixed(2)}" y2="${needleY.toFixed(2)}" />
          <circle class="hud-speedometer-center" cx="${centerX}" cy="${centerY}" r="4" />
        </svg>
        <div class="hud-speedometer-info">
          <div class="hud-speedometer-value">${normalizedSpeed.toFixed(1)} <span>km/h</span></div>
          <div class="hud-speedometer-limit">Máx. ${safeMax ? safeMax.toFixed(0) : '—'} km/h</div>
        </div>
      </div>
    `;
  }
}
