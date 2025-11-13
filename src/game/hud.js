export class HUD {
  constructor(element) {
    this.el = element;
    this.stats = {
      speed: 0,
      rpm: 0,
      turbo: 0,
      time: 0,
      traffic: 0,
    };
  }

  update(data) {
    this.stats = { ...this.stats, ...data };
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div><strong>Velocidade:</strong> ${this.stats.speed.toFixed(1)} km/h</div>
      <div><strong>RPM:</strong> ${this.stats.rpm.toFixed(0)}</div>
      <div><strong>Turbo:</strong> ${(this.stats.turbo * 100).toFixed(0)}%</div>
      <div><strong>Tráfego:</strong> ${this.stats.traffic}</div>
      <div><strong>Tempo:</strong> ${this.stats.time.toFixed(1)}s</div>
    `;
  }
}
