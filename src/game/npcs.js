import { THREE } from '../engine/three.js';

const VERTICAL_ROAD = { start: -48, end: 48, spacing: 12 };
const HORIZONTAL_ROAD = { start: 12, end: 84, spacing: 15 };

const verticalRoadLines = [];
for (let x = VERTICAL_ROAD.start; x <= VERTICAL_ROAD.end; x += VERTICAL_ROAD.spacing) {
  verticalRoadLines.push(x);
}
const horizontalRoadLines = [];
for (let z = HORIZONTAL_ROAD.start; z <= HORIZONTAL_ROAD.end; z += HORIZONTAL_ROAD.spacing) {
  horizontalRoadLines.push(z);
}

const randomRange = (min, max) => min + Math.random() * (max - min);

function isInsideZone(zone, position) {
  return (
    position[0] >= zone.minX &&
    position[0] <= zone.maxX &&
    position[2] >= zone.minZ &&
    position[2] <= zone.maxZ
  );
}

function createNpcMesh(bodyColor, headColor) {
  const group = new THREE.Group();
  const sharedMaterial = {
    flatShading: true,
    roughness: 0.7,
    metalness: 0.05,
  };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.1, 0.35),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(...bodyColor), ...sharedMaterial })
  );
  body.position.y = 0.55;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.35, 0.35),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(...headColor), ...sharedMaterial })
  );
  head.position.y = 1.2;
  group.add(head);

  return group;
}

function clampVectorToBounds(vector, bounds) {
  if (!bounds) return vector;
  vector.x = Math.max(bounds.minX + 0.5, Math.min(bounds.maxX - 0.5, vector.x));
  vector.z = Math.max(bounds.minZ + 0.5, Math.min(bounds.maxZ - 0.5, vector.z));
  return vector;
}

function isPointBlocked(point, collision) {
  if (!collision || !collision.solidZones) return false;
  return collision.solidZones.some((zone) =>
    isInsideZone(zone, [point.x, 0, point.z])
  );
}

function findRandomDestination(collision, origin, radius = 12, attempts = 8) {
  for (let i = 0; i < attempts; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const candidate = new THREE.Vector3(
      origin.x + Math.sin(angle) * distance,
      origin.y,
      origin.z + Math.cos(angle) * distance
    );
    clampVectorToBounds(candidate, collision?.worldBounds);
    if (!isPointBlocked(candidate, collision)) {
      return candidate;
    }
  }
  return origin.clone();
}

function segmentCrossesLines(a, b, lines) {
  return lines.some((line) => (a - line) * (b - line) < 0 && Math.abs(a - b) > 1.5);
}

function doesSegmentCrossRoad(start, end) {
  return (
    segmentCrossesLines(start.z, end.z, horizontalRoadLines) ||
    segmentCrossesLines(start.x, end.x, verticalRoadLines)
  );
}

function isNearRoad(position) {
  return (
    horizontalRoadLines.some((line) => Math.abs(position.z - line) < 2.3) ||
    verticalRoadLines.some((line) => Math.abs(position.x - line) < 2.3)
  );
}

export class PedestrianNPC {
  constructor(scene, { origin = [0, 0, 0], speed = 1.35, colors, collision }) {
    this.object = createNpcMesh(colors.body, colors.head);
    scene.add(this.object);

    this.position = this.object.position;
    this.position.set(origin[0], origin[1], origin[2]);

    this.collision = collision;
    this.baseSpeed = speed;
    this.state = 'patrol';
    this.stateTimer = randomRange(4, 8);
    this.destinationTimer = 0;
    this.crossingRoadTimer = 0;
    this.target = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    this.tempVector = new THREE.Vector3();
  }

  setState(state, duration = randomRange(4, 7)) {
    this.state = state;
    this.stateTimer = duration;
    if (state === 'patrol') {
      this.destinationTimer = 0;
    }
  }

  requestNewPatrolTarget() {
    const destination = findRandomDestination(this.collision, this.position, randomRange(10, 18));
    this.target.copy(destination);
    if (doesSegmentCrossRoad(this.position, destination)) {
      this.crossingRoadTimer = 2.5;
    }
    this.destinationTimer = randomRange(3, 7);
  }

  computeAvoidance(desiredDirection, obstacles = []) {
    const avoidance = new THREE.Vector3();
    obstacles.forEach((obstacle) => {
      if (!obstacle || obstacle.entity === this) return;
      const toObstacle = this.tempVector.subVectors(obstacle.position, this.position);
      const distance = toObstacle.length();
      const reach = (obstacle.radius || 1) + 1.2;
      if (distance > reach || distance < 0.0001) return;
      toObstacle.normalize();
      const facing = desiredDirection.dot(toObstacle);
      if (facing <= 0) return;
      const strength = (reach - distance) / reach;
      avoidance.addScaledVector(toObstacle, -strength * facing);
    });
    return avoidance;
  }

  update(dt, context = {}) {
    if (!dt) return;
    const { player, playerAggressive = false, obstacles = [] } = context;

    this.stateTimer -= dt;
    this.destinationTimer -= dt;
    this.crossingRoadTimer = Math.max(0, this.crossingRoadTimer - dt);

    if (player) {
      const distanceToPlayer = this.position.distanceTo(player.position);
      if (playerAggressive && distanceToPlayer < 9) {
        this.setState('flee', randomRange(4, 6));
      } else if (this.state === 'patrol' && distanceToPlayer < 4 && this.stateTimer <= 0) {
        this.setState('curious', randomRange(4, 6));
      } else if (this.state === 'curious' && distanceToPlayer > 7) {
        this.setState('patrol', randomRange(4, 7));
      }
    }

    if (this.state === 'flee' && this.stateTimer <= 0) {
      this.setState('patrol');
    }
    if (this.state === 'curious' && this.stateTimer <= 0) {
      this.setState('patrol');
    }

    if (this.state === 'patrol' && (this.destinationTimer <= 0 || this.position.distanceTo(this.target) < 0.5)) {
      this.requestNewPatrolTarget();
    }

    if (this.state === 'flee' && player) {
      const away = new THREE.Vector3().subVectors(this.position, player.position);
      if (away.lengthSq() < 0.01) {
        away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      }
      away.normalize();
      const distance = randomRange(8, 14);
      const destination = new THREE.Vector3(
        this.position.x + away.x * distance,
        this.position.y,
        this.position.z + away.z * distance
      );
      clampVectorToBounds(destination, this.collision?.worldBounds);
      if (!isPointBlocked(destination, this.collision)) {
        this.target.copy(destination);
      }
    }

    if (this.state === 'curious' && player) {
      const offset = new THREE.Vector3().subVectors(player.position, this.position);
      const distance = offset.length();
      const desiredDistance = 2.4;
      if (distance > desiredDistance + 0.5) {
        offset.normalize().multiplyScalar(distance - desiredDistance);
        const destination = new THREE.Vector3(
          this.position.x + offset.x,
          this.position.y,
          this.position.z + offset.z
        );
        clampVectorToBounds(destination, this.collision?.worldBounds);
        if (!isPointBlocked(destination, this.collision)) {
          this.target.copy(destination);
        }
      }
    }

    const toTarget = new THREE.Vector3().subVectors(this.target, this.position);
    const distance = toTarget.length();
    if (distance < 0.05) {
      return;
    }
    toTarget.normalize();
    const avoidance = this.computeAvoidance(toTarget, obstacles);
    const desiredDirection = toTarget.add(avoidance).normalize();
    const crossing = this.crossingRoadTimer > 0 || isNearRoad(this.position);
    const speedMultiplier = this.state === 'flee' ? 1.35 : this.state === 'curious' ? 0.85 : 1;
    const targetSpeed = this.baseSpeed * speedMultiplier * (crossing ? 0.55 : 1);
    this.position.x += desiredDirection.x * targetSpeed * dt;
    this.position.z += desiredDirection.z * targetSpeed * dt;
    clampVectorToBounds(this.position, this.collision?.worldBounds);
    this.object.rotation.y = Math.atan2(desiredDirection.x, desiredDirection.z);
  }
}

const npcPalettes = [
  { body: [0.85, 0.1, 0.2], head: [1, 0.86, 0.72] },
  { body: [0.15, 0.65, 0.85], head: [0.96, 0.8, 0.62] },
  { body: [0.3, 0.8, 0.45], head: [0.9, 0.78, 0.66] },
  { body: [0.6, 0.35, 0.8], head: [0.98, 0.85, 0.75] },
  { body: [0.95, 0.7, 0.2], head: [0.94, 0.76, 0.6] },
];

export function spawnPedestrians(scene, collision) {
  const spawnPositions = [
    [-12, 0, 12],
    [15, 0, 25],
    [-28, 0, -12],
    [35, 0, -6],
    [-48, 0, 62],
  ];

  return spawnPositions.map((origin, index) =>
    new PedestrianNPC(scene, {
      origin,
      speed: 1.2 + Math.random() * 0.6,
      colors: npcPalettes[index % npcPalettes.length],
      collision,
    })
  );
}
