import { Mesh } from '../engine/gl.js';
import { createBox } from '../engine/geometry.js';
import { composeTransform } from '../engine/math.js';

function translatePositions(source, offset) {
  const positions = [];
  for (let i = 0; i < source.length; i += 3) {
    positions.push(source[i] + offset[0], source[i + 1] + offset[1], source[i + 2] + offset[2]);
  }
  return positions;
}

function mergeGeometries(parts) {
  const merged = { positions: [], normals: [], colors: [], indices: [] };
  let vertexOffset = 0;

  parts.forEach(({ geometry, offset = [0, 0, 0] }) => {
    merged.positions.push(...translatePositions(geometry.positions, offset));
    merged.normals.push(...geometry.normals);
    merged.colors.push(...geometry.colors);
    geometry.indices.forEach((index) => {
      merged.indices.push(index + vertexOffset);
    });
    vertexOffset += geometry.positions.length / 3;
  });

  return merged;
}

const avatarCache = new Map();

function getAvatarMesh(gl, { primaryColor, headColor }) {
  const key = `${primaryColor.join('-')}:${headColor.join('-')}`;
  if (!avatarCache.has(key)) {
    const body = createBox({ width: 0.55, height: 1.2, depth: 0.4, color: primaryColor });
    const head = createBox({ width: 0.4, height: 0.4, depth: 0.4, color: headColor });
    const geometry = mergeGeometries([
      { geometry: body, offset: [0, 0.6, 0] },
      { geometry: head, offset: [0, 1.4, 0] },
    ]);
    avatarCache.set(key, new Mesh(gl, geometry));
  }
  return avatarCache.get(key);
}

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

export class PlayerAvatar {
  constructor(gl, { color = [0.15, 0.7, 1], headColor = [1, 0.82, 0.68], collision } = {}) {
    this.mesh = getAvatarMesh(gl, { primaryColor: color, headColor });
    this.height = 1.8;
    this.position = [0, this.height / 2, 0];
    this.rotation = 0;
    this.scale = [1, 1, 1];

    this.walkSpeed = 2.9;
    this.sprintSpeed = 5.6;
    this.acceleration = 12;
    this.deceleration = 18;
    this.turnSpeed = 0.0025;

    this.velocity = [0, 0, 0];
    this.speed = 0;
    this.yaw = 0;
    this.pitch = -0.35;
    this.surface = 'pavimento';

    this.stamina = 1;
    this.staminaDrain = 0.35;
    this.staminaRecovery = 0.3;

    this.collision = collision;
  }

  modelMatrix() {
    return composeTransform(this.position, this.yaw, this.scale);
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
      this.position[0] + move[0] * 0.5,
      this.position[1],
      this.position[2] + move[2] * 0.5,
    ];
    const surface = this.sampleSurface(previewPosition);

    const wantsToSprint = input.isDown('shift') && this.stamina > 0.1;
    const maxSpeed = (wantsToSprint ? this.sprintSpeed : this.walkSpeed) * surface.speedModifier;
    const targetVelocity = moveLength > 0 ? [move[0] * maxSpeed, 0, move[2] * maxSpeed] : [0, 0, 0];

    const rate = moveLength > 0 ? this.acceleration : this.deceleration;
    this.velocity[0] = approach(this.velocity[0], targetVelocity[0], rate * dt);
    this.velocity[2] = approach(this.velocity[2], targetVelocity[2], rate * dt);

    const nextPosition = [
      this.position[0] + this.velocity[0] * dt,
      this.position[1],
      this.position[2] + this.velocity[2] * dt,
    ];

    const resolvedSurface = this.applyWorldConstraints(nextPosition);
    this.position = nextPosition;
    this.surface = resolvedSurface.type;
    const horizontalSpeed = Math.hypot(this.velocity[0], this.velocity[2]);
    if (horizontalSpeed > 0.05) {
      this.yaw = Math.atan2(this.velocity[0], this.velocity[2]);
    }
    this.rotation = this.yaw;

    const moving = Math.hypot(this.velocity[0], this.velocity[2]) > 0.1;
    if (wantsToSprint && moving && surface.speedModifier > 0.5) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * dt);
    } else {
      this.stamina = Math.min(1, this.stamina + this.staminaRecovery * dt);
    }

    this.speed = horizontalSpeed;
  }
}
