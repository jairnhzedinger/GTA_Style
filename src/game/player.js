import { THREE } from '../engine/three.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function isInsideZone(zone, position) {
  return (
    position[0] >= zone.minX &&
    position[0] <= zone.maxX &&
    position[2] >= zone.minZ &&
    position[2] <= zone.maxZ
  );
}

function pushOutOfZone(position, zone) {
  const distances = [
    { axis: 'minX', delta: Math.abs(position[0] - zone.minX) },
    { axis: 'maxX', delta: Math.abs(zone.maxX - position[0]) },
    { axis: 'minZ', delta: Math.abs(position[2] - zone.minZ) },
    { axis: 'maxZ', delta: Math.abs(zone.maxZ - position[2]) },
  ];
  distances.sort((a, b) => a.delta - b.delta);
  const closest = distances[0];
  const padding = zone.padding || 0.05;
  switch (closest.axis) {
    case 'minX':
      position[0] = zone.minX - padding;
      break;
    case 'maxX':
      position[0] = zone.maxX + padding;
      break;
    case 'minZ':
      position[2] = zone.minZ - padding;
      break;
    case 'maxZ':
      position[2] = zone.maxZ + padding;
      break;
    default:
      break;
  }
}

function approach(current, target, delta) {
  if (current < target) {
    return Math.min(current + delta, target);
  }
  return Math.max(current - delta, target);
}

function createAvatarMesh(primaryColor, headColor) {
  const group = new THREE.Group();
  group.name = 'PlayerAvatar';

  const sharedMaterial = {
    flatShading: true,
    roughness: 0.65,
    metalness: 0.05,
  };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.2, 0.4),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(...primaryColor), ...sharedMaterial })
  );
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(...headColor), ...sharedMaterial })
  );
  head.position.y = 1.4;
  head.castShadow = true;
  group.add(head);

  return group;
}

export class PlayerAvatar {
  constructor(scene, { color = [0.15, 0.7, 1], headColor = [1, 0.82, 0.68], collision } = {}) {
    this.object = createAvatarMesh(color, headColor);
    scene.add(this.object);

    this.height = 1.8;
    this.position = this.object.position;
    this.position.set(0, this.height / 2, 0);
    this.rotation = 0;

    this.walkSpeed = 2.9;
    this.sprintSpeed = 5.6;
    this.acceleration = 12;
    this.deceleration = 18;

    this.velocity = [0, 0, 0];
    this.speed = 0;
    this.yaw = 0;
    this.surface = 'pavimento';

    this.stamina = 1;
    this.staminaDrain = 0.35;
    this.staminaRecovery = 0.3;

    this.collision = collision;
  }

  sampleSurface(position) {
    if (!this.collision) {
      return { type: 'pavimento', groundHeight: 0, speedModifier: 1 };
    }

    const { sandZones = [], restrictedZones = [] } = this.collision;
    for (const zone of sandZones) {
      if (isInsideZone(zone, position)) {
        return {
          type: 'areia',
          groundHeight: zone.groundHeight ?? 0,
          speedModifier: zone.speedModifier ?? 0.6,
        };
      }
    }

    for (const zone of restrictedZones) {
      if (isInsideZone(zone, position)) {
        return {
          type: zone.type || 'restrito',
          groundHeight: zone.groundHeight ?? 0,
          speedModifier: zone.speedModifier ?? 0,
        };
      }
    }

    return { type: 'pavimento', groundHeight: 0, speedModifier: 1 };
  }

  applyWorldConstraints(position) {
    if (!this.collision) {
      position[1] = this.height / 2;
      return { groundHeight: 0, type: 'pavimento' };
    }

    const { worldBounds, restrictedZones = [], solidZones = [] } = this.collision;

    if (worldBounds) {
      position[0] = clamp(position[0], worldBounds.minX, worldBounds.maxX);
      position[2] = clamp(position[2], worldBounds.minZ, worldBounds.maxZ);
    }

    restrictedZones.forEach((zone) => {
      if (isInsideZone(zone, position)) {
        pushOutOfZone(position, zone);
      }
    });

    solidZones.forEach((zone) => {
      if (isInsideZone(zone, position)) {
        pushOutOfZone(position, zone);
      }
    });

    const surface = this.sampleSurface(position);
    position[1] = surface.groundHeight + this.height / 2;
    return surface;
  }

  update(dt, input, cameraYaw = 0) {
    if (!dt) return;

    const forward = [Math.sin(cameraYaw), 0, Math.cos(cameraYaw)];
    const right = [Math.sin(cameraYaw + Math.PI / 2), 0, Math.cos(cameraYaw + Math.PI / 2)];

    const move = [0, 0, 0];
    if (input.isDown('w')) {
      move[0] += forward[0];
      move[2] += forward[2];
    }
    if (input.isDown('s')) {
      move[0] -= forward[0];
      move[2] -= forward[2];
    }
    if (input.isDown('d')) {
      move[0] += right[0];
      move[2] += right[2];
    }
    if (input.isDown('a')) {
      move[0] -= right[0];
      move[2] -= right[2];
    }

    const moveLength = Math.hypot(move[0], move[2]);
    if (moveLength > 0) {
      move[0] /= moveLength;
      move[2] /= moveLength;
    }

    const previewPosition = [
      this.position.x + move[0] * 0.5,
      this.position.y,
      this.position.z + move[2] * 0.5,
    ];
    const surface = this.sampleSurface(previewPosition);

    const wantsToSprint = input.isDown('shift') && this.stamina > 0.1;
    const maxSpeed = (wantsToSprint ? this.sprintSpeed : this.walkSpeed) * surface.speedModifier;
    const targetVelocity = moveLength > 0 ? [move[0] * maxSpeed, 0, move[2] * maxSpeed] : [0, 0, 0];

    const rate = moveLength > 0 ? this.acceleration : this.deceleration;
    this.velocity[0] = approach(this.velocity[0], targetVelocity[0], rate * dt);
    this.velocity[2] = approach(this.velocity[2], targetVelocity[2], rate * dt);

    const nextPosition = [
      this.position.x + this.velocity[0] * dt,
      this.position.y,
      this.position.z + this.velocity[2] * dt,
    ];

    const resolvedSurface = this.applyWorldConstraints(nextPosition);
    this.position.set(nextPosition[0], nextPosition[1], nextPosition[2]);
    this.surface = resolvedSurface.type;

    const horizontalSpeed = Math.hypot(this.velocity[0], this.velocity[2]);
    if (horizontalSpeed > 0.05) {
      this.yaw = Math.atan2(this.velocity[0], this.velocity[2]);
    }
    this.object.rotation.y = this.yaw;

    const moving = horizontalSpeed > 0.1;
    if (wantsToSprint && moving && surface.speedModifier > 0.5) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * dt);
    } else {
      this.stamina = Math.min(1, this.stamina + this.staminaRecovery * dt);
    }

    this.speed = horizontalSpeed;
  }
}
