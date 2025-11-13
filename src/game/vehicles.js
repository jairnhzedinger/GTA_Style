import { THREE } from '../engine/three.js';

function createVehicleMesh({ color = [0.8, 0.12, 0.18] } = {}) {
  const group = new THREE.Group();

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.6, 2.8),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(...color),
      flatShading: true,
      roughness: 0.5,
      metalness: 0.2,
    })
  );
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  group.add(chassis);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.6, 1.3),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color[0] * 0.8, color[1] * 0.8, color[2] * 0.8),
      flatShading: true,
      roughness: 0.4,
      metalness: 0.3,
    })
  );
  cabin.position.set(0, 0.85, -0.1);
  group.add(cabin);

  const wheelGeometry = new THREE.BoxGeometry(0.3, 0.45, 0.15);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.08, 0.08, 0.08) });
  const wheelOffsets = [
    [-0.65, 0.22, 1],
    [0.65, 0.22, 1],
    [-0.65, 0.22, -1],
    [0.65, 0.22, -1],
  ];
  wheelOffsets.forEach((offset) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(offset[0], offset[1], offset[2]);
    group.add(wheel);
  });

  return group;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class Vehicle {
  constructor(scene, { position = [0, 0, 0], color, worldBounds, autopilotPath = [] }) {
    this.mesh = createVehicleMesh({ color });
    scene.add(this.mesh);
    this.position = this.mesh.position;
    this.position.set(position[0], position[1], position[2]);

    this.direction = 0;
    this.speed = 0;
    this.maxSpeed = 14;
    this.acceleration = 10;
    this.brakeForce = 18;
    this.turnSpeed = 1.6;
    this.damping = 6;
    this.worldBounds = worldBounds;

    this.autopilotPath = autopilotPath;
    this.currentWaypoint = 0;
    this.autopilotSpeed = 6;

    this.isPlayerControlled = false;

    this.cameraSettings = {
      targetOffset: [0, 1.4, 0],
      followOffset: [0, 0.6, 0],
      verticalOffset: 0.9,
      distance: 8.2,
    };
  }

  distanceTo(position) {
    return this.position.distanceTo(position);
  }

  setDriver() {
    this.isPlayerControlled = true;
  }

  clearDriver() {
    this.isPlayerControlled = false;
  }

  canEnter() {
    return !this.isPlayerControlled;
  }

  canExit() {
    return Math.abs(this.speed) < 2;
  }

  getExitPosition() {
    const offset = new THREE.Vector3(Math.sin(this.direction + Math.PI / 2), 0, Math.cos(this.direction + Math.PI / 2));
    offset.multiplyScalar(1.5);
    return new THREE.Vector3(this.position.x + offset.x, this.position.y, this.position.z + offset.z);
  }

  update(dt, input, usePlayerInput = false) {
    if (usePlayerInput) {
      this.applyPlayerInput(dt, input);
    } else {
      this.applyAutopilot(dt);
    }

    this.position.x = clamp(this.position.x, this.worldBounds.minX + 2, this.worldBounds.maxX - 2);
    this.position.z = clamp(this.position.z, this.worldBounds.minZ + 2, this.worldBounds.maxZ - 2);
    this.mesh.rotation.y = this.direction;
  }

  applyPlayerInput(dt, input) {
    const forwardInput = (input.isDown('w') ? 1 : 0) - (input.isDown('s') ? 1 : 0);
    const steeringInput = (input.isDown('d') ? 1 : 0) - (input.isDown('a') ? 1 : 0);

    if (forwardInput !== 0) {
      this.speed += forwardInput * this.acceleration * dt;
    } else {
      const decay = this.damping * dt;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - decay);
      } else {
        this.speed = Math.min(0, this.speed + decay);
      }
    }

    this.speed = clamp(this.speed, -this.maxSpeed * 0.4, this.maxSpeed);

    if (forwardInput < 0 && this.speed > 0) {
      this.speed = Math.max(0, this.speed - this.brakeForce * dt);
    }

    const turnAmount = steeringInput * this.turnSpeed * dt * clamp(Math.abs(this.speed) / this.maxSpeed, 0.2, 1);
    this.direction -= turnAmount;

    this.position.x += Math.sin(this.direction) * this.speed * dt;
    this.position.z += Math.cos(this.direction) * this.speed * dt;
    this.position.y = 0;
  }

  applyAutopilot(dt) {
    if (!this.autopilotPath.length || this.isPlayerControlled) {
      this.speed = clamp(this.speed - this.damping * dt, 0, this.maxSpeed);
      return;
    }

    const target = this.autopilotPath[this.currentWaypoint];
    const direction = new THREE.Vector3(target[0] - this.position.x, 0, target[2] - this.position.z);
    const distance = direction.length();
    if (distance < 1.5) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.autopilotPath.length;
      return;
    }

    direction.normalize();
    const desiredAngle = Math.atan2(direction.x, direction.z);
    const angleDelta = desiredAngle - this.direction;
    this.direction += angleDelta * 0.6 * dt;

    this.position.x += direction.x * this.autopilotSpeed * dt;
    this.position.z += direction.z * this.autopilotSpeed * dt;
    this.speed = this.autopilotSpeed;
    this.position.y = 0;
  }
}

const vehiclePalettes = [
  [0.92, 0.18, 0.2],
  [0.2, 0.4, 0.9],
  [0.1, 0.65, 0.35],
  [0.95, 0.75, 0.2],
];

export function spawnVehicles(scene, collision) {
  const bounds = collision.worldBounds;
  const parkingSpots = [
    [-12, 0, 26],
    [12, 0, 26],
    [-30, 0, 60],
    [30, 0, 62],
    [-20, 0, 75],
  ];

  return parkingSpots.map((position, index) =>
    new Vehicle(scene, {
      position,
      color: vehiclePalettes[index % vehiclePalettes.length],
      worldBounds: bounds,
      autopilotPath: [
        [position[0], 0, position[2]],
        [position[0], 0, position[2] + 10],
        [position[0] + 6, 0, position[2] + 10],
        [position[0] + 6, 0, position[2]],
      ],
    })
  );
}
