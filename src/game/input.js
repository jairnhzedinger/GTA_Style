export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { dx: 0, dy: 0 };
    this.pointerLocked = false;
    this.justPressed = new Set();

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys.has(key)) {
        this.justPressed.add(key);
      }
      this.keys.add(key);
    });
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys.delete(key);
      this.justPressed.delete(key);
    });

    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.pointerLocked) return;
      this.mouse.dx += event.movementX;
      this.mouse.dy += event.movementY;
    });
  }

  consumeMouse() {
    const { dx, dy } = this.mouse;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }

  isDown(key) {
    return this.keys.has(key.toLowerCase());
  }

  consumePress(key) {
    const normalized = key.toLowerCase();
    if (this.justPressed.has(normalized)) {
      this.justPressed.delete(normalized);
      return true;
    }
    return false;
  }

  postFrame() {
    this.justPressed.clear();
  }
}
