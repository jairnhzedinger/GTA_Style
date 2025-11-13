export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { dx: 0, dy: 0 };
    this.pointerLocked = false;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
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
}
