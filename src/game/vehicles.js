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
      emissive: new THREE.Color(0, 0, 0),
      emissiveIntensity: 0,
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

  group.userData = { chassisMaterial: chassis.material };
  return group;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const NAV_GRID_X = [-48, -24, 0, 24, 48];
const NAV_GRID_Z = [12, 27, 42, 57, 72];

function createRoadGraph() {
  const nodes = [];
  const nodeMap = new Map();
  NAV_GRID_X.forEach((x, xi) => {
    NAV_GRID_Z.forEach((z, zi) => {
      const id = `n-${xi}-${zi}`;
      const node = { id, position: [x, 0, z], neighbors: [], xi, zi };
      nodes.push(node);
      nodeMap.set(id, node);
    });
  });

  nodes.forEach((node) => {
    const { xi, zi } = node;
    const neighborOffsets = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    neighborOffsets.forEach(([dx, dz]) => {
      const nx = xi + dx;
      const nz = zi + dz;
      if (nx < 0 || nz < 0 || nx >= NAV_GRID_X.length || nz >= NAV_GRID_Z.length) return;
      node.neighbors.push(`n-${nx}-${nz}`);
    });
  });

  return { nodes, nodeMap };
}

const DEFAULT_NAV_GRAPH = createRoadGraph();

export class Vehicle {
  constructor(scene, { position = [0, 0, 0], color, worldBounds, navGraph = DEFAULT_NAV_GRAPH }) {
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

    this.navGraph = navGraph;
    this.autopilotSpeed = 6;
    this.routeNodes = [];
    this.routeIndex = 0;
    this.routeTarget = new THREE.Vector3();
    this.laneOffset = 0;
    this.destinationWait = 0;

    this.isPlayerControlled = false;
    this.wasPlayerDriven = false;
    this.parked = false;
    this.parkedLocation = new THREE.Vector3(position[0], position[1], position[2]);
    this.parkedDirection = this.direction;

    this.hornFlash = 0;
    this.honkCooldown = 0;

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
    this.wasPlayerDriven = true;
    this.parked = false;
  }

  clearDriver() {
    this.isPlayerControlled = false;
  }

  park(position = this.position, direction = this.direction) {
    const parsedPosition = Array.isArray(position)
      ? { x: position[0], y: position[1], z: position[2] }
      : position;
    if (parsedPosition) {
      this.position.set(parsedPosition.x, parsedPosition.y, parsedPosition.z);
      this.parkedLocation.copy(this.position);
    }
    this.direction = direction ?? this.direction;
    this.parkedDirection = this.direction;
    this.speed = 0;
    this.parked = true;
    this.wasPlayerDriven = true;
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

  update(dt, input, usePlayerInput = false, context = {}) {
    if (usePlayerInput) {
      this.applyPlayerInput(dt, input);
    } else {
      this.applyAutopilot(dt, context);
    }

    this.position.x = clamp(this.position.x, this.worldBounds.minX + 2, this.worldBounds.maxX - 2);
    this.position.z = clamp(this.position.z, this.worldBounds.minZ + 2, this.worldBounds.maxZ - 2);
    this.mesh.rotation.y = this.direction;
    this.updateHornVisual(dt);
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

  ensureRoute() {
    if (this.routeNodes.length > 1 && this.routeIndex < this.routeNodes.length - 1) {
      return;
    }
    if (!this.navGraph || !this.navGraph.nodes.length) {
      this.routeNodes = [];
      this.routeIndex = 0;
      return;
    }

    const startNode = this.findClosestNavNode();
    const endNode = this.pickDistantNavNode(startNode);
    if (!startNode || !endNode || startNode.id === endNode.id) {
      this.routeNodes = [];
      this.routeIndex = 0;
      return;
    }

    const path = this.buildRouteBetween(startNode, endNode);
    if (!path.length || path.length < 2) {
      this.routeNodes = [];
      this.routeIndex = 0;
      return;
    }

    this.routeNodes = path;
    this.routeIndex = 0;
    this.laneOffset = (Math.random() * 0.9 + 0.35) * (Math.random() < 0.5 ? -1 : 1);
  }

  findClosestNavNode() {
    if (!this.navGraph || !this.navGraph.nodes.length) {
      return null;
    }
    let closest = null;
    let bestDistance = Infinity;
    this.navGraph.nodes.forEach((node) => {
      const dx = this.position.x - node.position[0];
      const dz = this.position.z - node.position[2];
      const manhattan = Math.abs(dx) + Math.abs(dz);
      if (manhattan < bestDistance) {
        bestDistance = manhattan;
        closest = node;
      }
    });
    return closest;
  }

  pickDistantNavNode(startNode) {
    if (!startNode || !this.navGraph || !this.navGraph.nodes.length) {
      return null;
    }
    let chosen = startNode;
    let longest = -Infinity;
    this.navGraph.nodes.forEach((node) => {
      if (node.id === startNode.id) return;
      const distance = Math.abs(node.xi - startNode.xi) + Math.abs(node.zi - startNode.zi);
      if (distance > longest) {
        longest = distance;
        chosen = node;
      }
    });
    return chosen;
  }

  buildRouteBetween(startNode, endNode) {
    if (!startNode || !endNode || !this.navGraph) {
      return [];
    }
    if (startNode.id === endNode.id) {
      return [startNode];
    }

    const queue = [startNode];
    const visited = new Set([startNode.id]);
    const previous = new Map();
    const { nodeMap } = this.navGraph;

    while (queue.length) {
      const node = queue.shift();
      if (node.id === endNode.id) {
        break;
      }
      node.neighbors.forEach((neighborId) => {
        if (visited.has(neighborId)) return;
        const neighborNode = nodeMap.get(neighborId);
        if (!neighborNode) return;
        visited.add(neighborId);
        previous.set(neighborId, node.id);
        queue.push(neighborNode);
      });
    }

    if (!visited.has(endNode.id)) {
      return [startNode];
    }

    const path = [];
    let currentId = endNode.id;
    while (currentId) {
      const currentNode = nodeMap.get(currentId);
      if (!currentNode) break;
      path.push(currentNode);
      currentId = previous.get(currentId);
    }
    path.reverse();
    return path;
  }

  adjustSpeed(targetSpeed, dt) {
    if (this.speed < targetSpeed) {
      this.speed = Math.min(targetSpeed, this.speed + this.acceleration * dt);
    } else if (this.speed > targetSpeed) {
      this.speed = Math.max(targetSpeed, this.speed - this.brakeForce * dt);
    }
  }

  detectPotentialCollision(obstacles = []) {
    if (!obstacles.length) return null;
    const forward = new THREE.Vector3(Math.sin(this.direction), 0, Math.cos(this.direction));
    const lookAhead = 2.8 + Math.abs(this.speed) * 0.4;
    const futurePoint = new THREE.Vector3(
      this.position.x + forward.x * lookAhead,
      0,
      this.position.z + forward.z * lookAhead
    );
    for (const obstacle of obstacles) {
      if (!obstacle || obstacle.entity === this) continue;
      const radius = obstacle.radius || 1;
      const distance = futurePoint.distanceTo(obstacle.position);
      if (distance < radius + 0.8) {
        return obstacle;
      }
    }
    return null;
  }

  applyAutopilot(dt, context = {}) {
    if (this.parked) {
      const brake = this.brakeForce * dt;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - brake);
      } else {
        this.speed = Math.min(0, this.speed + brake);
      }
      this.position.y = 0;
      return;
    }

    if (this.isPlayerControlled) {
      this.speed = clamp(this.speed - this.damping * dt, 0, this.maxSpeed);
      return;
    }

    if (this.destinationWait > 0) {
      this.destinationWait = Math.max(0, this.destinationWait - dt);
      this.adjustSpeed(0, dt);
      this.position.y = 0;
      return;
    }

    this.ensureRoute();
    if (!this.routeNodes.length || this.routeIndex >= this.routeNodes.length - 1) {
      this.adjustSpeed(0, dt);
      this.position.y = 0;
      return;
    }

    const currentNode = this.routeNodes[this.routeIndex];
    const nextNode = this.routeNodes[this.routeIndex + 1];
    if (!nextNode) {
      this.handleDestinationReached();
      this.adjustSpeed(0, dt);
      this.position.y = 0;
      return;
    }

    const currentPos = new THREE.Vector3(currentNode.position[0], 0, currentNode.position[2]);
    const nextPos = new THREE.Vector3(nextNode.position[0], 0, nextNode.position[2]);
    const segmentVector = new THREE.Vector3().subVectors(nextPos, currentPos);
    if (segmentVector.lengthSq() === 0) {
      this.routeIndex += 1;
      return;
    }

    const forwardOnSegment = segmentVector.clone().normalize();
    const lateralDirection = new THREE.Vector3(forwardOnSegment.z, 0, -forwardOnSegment.x);
    this.routeTarget.copy(nextPos).addScaledVector(lateralDirection, this.laneOffset);

    const direction = new THREE.Vector3().subVectors(this.routeTarget, this.position);
    const distance = direction.length();
    if (distance < 1.1) {
      this.routeIndex += 1;
      if (this.routeIndex >= this.routeNodes.length - 1) {
        this.handleDestinationReached();
      }
      return;
    }

    direction.normalize();
    const desiredAngle = Math.atan2(direction.x, direction.z);
    let angleDelta = desiredAngle - this.direction;
    angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta));
    this.direction += angleDelta * 0.9 * dt;

    const potentialCollision = this.detectPotentialCollision(context.obstacles || []);
    if (potentialCollision && this.honkCooldown <= 0) {
      this.triggerHonk();
    }

    const intersectionAhead = nextNode.neighbors.length > 2;
    let desiredSpeed = this.autopilotSpeed;
    if (intersectionAhead) {
      if (distance < 2.2) {
        desiredSpeed = 0;
      } else if (distance < 5) {
        desiredSpeed = Math.min(desiredSpeed, this.autopilotSpeed * 0.45);
      }
    }
    if (potentialCollision) {
      desiredSpeed = 0;
    }

    this.adjustSpeed(desiredSpeed, dt);

    const forward = new THREE.Vector3(Math.sin(this.direction), 0, Math.cos(this.direction));
    this.position.x += forward.x * this.speed * dt;
    this.position.z += forward.z * this.speed * dt;
    this.position.y = 0;
  }

  handleDestinationReached() {
    this.routeNodes = [];
    this.routeIndex = 0;
    this.destinationWait = 2.5 + Math.random() * 2.5;
    this.speed = 0;
  }

  triggerHonk() {
    this.hornFlash = 0.45;
    this.honkCooldown = 2.5;
  }

  updateHornVisual(dt) {
    this.hornFlash = Math.max(0, this.hornFlash - dt);
    this.honkCooldown = Math.max(0, this.honkCooldown - dt);
    const chassisMaterial = this.mesh.userData?.chassisMaterial;
    if (!chassisMaterial) return;
    if (this.hornFlash > 0) {
      const glow = 0.25 + 0.2 * Math.sin((0.45 - this.hornFlash) * 20);
      chassisMaterial.emissive.setScalar(glow);
    } else {
      chassisMaterial.emissive.setScalar(0);
    }
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
      navGraph: DEFAULT_NAV_GRAPH,
    })
  );
}
