export class HUD {
  constructor(element) {
    this.el = element;
    this.stats = {
      speed: 0,
      stamina: 1,
      surface: 'pavimento',
      time: 0,
    };
  }

  update(data) {
    this.stats = { ...this.stats, ...data };
    this.render();
  }

  render() {
    const staminaPercent = Math.round(this.stats.stamina * 100);
    const surfaceLabel = this.stats.surface.charAt(0).toUpperCase() + this.stats.surface.slice(1);
    this.el.innerHTML = `
      <div><strong>Velocidade:</strong> ${this.stats.speed.toFixed(1)} km/h</div>
      <div><strong>Stamina:</strong> ${staminaPercent}%</div>
      <div><strong>Superfície:</strong> ${surfaceLabel}</div>
      <div><strong>Tempo:</strong> ${this.stats.time.toFixed(1)}s</div>
    `;
  }
}
