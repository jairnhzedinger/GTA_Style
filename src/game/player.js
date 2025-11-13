import { Mesh } from '../engine/gl.js';
import { createBox } from '../engine/geometry.js';
import { composeTransform } from '../engine/math.js';

function createCarGeometry(color) {
  return createBox({ width: 1.4, height: 0.6, depth: 2.4, color });
}

const carCache = new Map();

function getCarMesh(gl, color) {
  const key = color.join('-');
  if (!carCache.has(key)) {
    carCache.set(key, new Mesh(gl, createCarGeometry(color)));
  }
  return carCache.get(key);
}

export class Car {
  constructor(gl, { color = [0.9, 0.1, 0.1] } = {}) {
    this.mesh = getCarMesh(gl, color);
    this.position = [0, 0.35, 0];
    this.rotation = 0;
    this.scale = [1, 1, 1];
    this.speed = 0;
    this.maxSpeed = 26;
    this.acceleration = 16;
    this.friction = 5;
    this.turnSpeed = 2.5;
  }

  modelMatrix() {
    return composeTransform(this.position, this.rotation, this.scale);
  }
}

export class PlayerCar extends Car {
  constructor(gl, options = {}) {
    super(gl, options);
    this.turbo = 0;
    this.maxTurbo = 3;
  }

  update(dt, input) {
    const forward = input.isDown('w') ? 1 : 0;
    const backward = input.isDown('s') ? 1 : 0;
    const brake = input.isDown(' ');
    const turboActive = input.isDown('shift');

    const targetAcceleration = forward - backward;
    this.speed += targetAcceleration * this.acceleration * dt;

    if (brake) {
      this.speed *= 0.8;
    }

    const maxSpeed = turboActive ? this.maxSpeed * 1.4 : this.maxSpeed;
    this.speed = Math.max(-10, Math.min(maxSpeed, this.speed));

    // Turbo recarrega aos poucos
    if (turboActive && this.turbo < this.maxTurbo) {
      this.turbo += dt;
    } else if (!turboActive) {
      this.turbo = Math.max(0, this.turbo - dt * 0.75);
    }

    // Fricção natural
    if (!forward && !backward) {
      const friction = Math.sign(this.speed) * this.friction * dt;
      if (Math.abs(friction) > Math.abs(this.speed)) this.speed = 0;
      else this.speed -= friction;
    }

    const steering = (input.isDown('a') ? 1 : 0) - (input.isDown('d') ? 1 : 0);
    if (Math.abs(this.speed) > 0.5) {
      this.rotation += steering * this.turnSpeed * dt * (this.speed / this.maxSpeed);
    }

    const direction = [Math.sin(this.rotation), 0, Math.cos(this.rotation)];
    this.position[0] += direction[0] * this.speed * dt;
    this.position[2] += direction[2] * this.speed * dt;

    // Limites simples da cidade
    this.position[0] = Math.max(-50, Math.min(50, this.position[0]));
    this.position[2] = Math.max(-50, Math.min(50, this.position[2]));
  }
}

export class NpcCar extends Car {
  constructor(gl, pathPoints, speed = 8, color = [1, 0.5, 0.2]) {
    super(gl, { color });
    this.path = pathPoints;
    this.current = 0;
    this.travelSpeed = speed;
  }

  update(dt) {
    if (!this.path.length) return;
    const target = this.path[this.current];
    const dirX = target[0] - this.position[0];
    const dirZ = target[2] - this.position[2];
    const distance = Math.hypot(dirX, dirZ);
    if (distance < 0.5) {
      this.current = (this.current + 1) % this.path.length;
      return;
    }
    const dirAngle = Math.atan2(dirX, dirZ);
    this.rotation = dirAngle;
    const step = Math.min(distance, this.travelSpeed * dt);
    this.position[0] += Math.sin(this.rotation) * step;
    this.position[2] += Math.cos(this.rotation) * step;
  }
}
