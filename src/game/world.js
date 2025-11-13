import { Mesh } from '../engine/gl.js';
import { createBox } from '../engine/geometry.js';
import { composeTransform } from '../engine/math.js';
import { NpcCar } from './player.js';

class StaticObject {
  constructor(gl, geometry, position, scale = [1, 1, 1]) {
    this.mesh = new Mesh(gl, geometry);
    this.position = position;
    this.rotation = 0;
    this.scale = scale;
  }

  modelMatrix() {
    return composeTransform(this.position, this.rotation, this.scale);
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createBuilding(gl, x, z) {
  const height = randomRange(3, 12);
  const color = [randomRange(0.2, 0.6), randomRange(0.2, 0.5), randomRange(0.2, 0.6)];
  const geometry = createBox({ width: randomRange(3, 6), height, depth: randomRange(3, 6), color });
  return new StaticObject(gl, geometry, [x, height / 2, z]);
}

function createRoad(gl, width, depth, position) {
  const geometry = createBox({ width, height: 0.1, depth, color: [0.15, 0.15, 0.15] });
  return new StaticObject(gl, geometry, position);
}

function createPlane(gl, width, depth, position, color, height = 0.2) {
  const geometry = createBox({ width, height, depth, color });
  return new StaticObject(gl, geometry, position);
}

function createPalmTree(gl, position) {
  const objects = [];
  const trunk = new StaticObject(
    gl,
    createBox({ width: 0.6, height: 5.2, depth: 0.6, color: [0.4, 0.23, 0.08] }),
    [position[0], position[1] + 2.6, position[2]]
  );
  objects.push(trunk);

  const leafGeometry = createBox({ width: 0.5, height: 0.15, depth: 3.6, color: [0.08, 0.8, 0.42] });
  const leafAngles = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];
  leafAngles.forEach((angle) => {
    const leaf = new StaticObject(gl, leafGeometry, [position[0], position[1] + 5.2, position[2]]);
    leaf.rotation = angle;
    objects.push(leaf);
  });

  return objects;
}

function createBeachDeck(gl, position, size) {
  return createPlane(gl, size[0], size[1], position, [0.72, 0.58, 0.4], 0.25);
}

function createPier(gl, position, size) {
  return createPlane(gl, size[0], size[1], position, [0.32, 0.26, 0.19], 0.3);
}

function createUmbrella(gl, position, colors) {
  const objects = [];
  const pole = new StaticObject(
    gl,
    createBox({ width: 0.2, height: 2.6, depth: 0.2, color: colors.pole || [0.75, 0.73, 0.7] }),
    [position[0], position[1] + 1.3, position[2]]
  );
  objects.push(pole);

  const canopy = new StaticObject(
    gl,
    createBox({ width: 2.4, height: 0.4, depth: 2.4, color: colors.canopy }),
    [position[0], position[1] + 2.2, position[2]]
  );
  canopy.scale = [1, 0.7, 1];
  objects.push(canopy);
  return objects;
}

export function createWorld(gl) {
  const staticObjects = [];
  const traffic = [];

  const collision = {
    worldBounds: { minX: -70, maxX: 70, minZ: -45, maxZ: 90 },
    restrictedZones: [
      { minX: -90, maxX: 90, minZ: -210, maxZ: -35, type: 'water' },
    ],
    sandZones: [{ minX: -80, maxX: 80, minZ: -35, maxZ: -5 }],
  };

  staticObjects.push(createPlane(gl, 200, 200, [0, -0.32, -110], [0.08, 0.28, 0.52], 0.2));
  staticObjects.push(createPlane(gl, 160, 40, [0, -0.18, -20], [0.92, 0.79, 0.45], 0.25));
  staticObjects.push(createPlane(gl, 180, 6, [0, -0.12, -4], [0.65, 0.55, 0.42], 0.2));

  const decks = [
    createBeachDeck(gl, [-25, -0.1, -12], [18, 8]),
    createBeachDeck(gl, [25, -0.1, -10], [14, 7]),
  ];
  decks.forEach((deck) => staticObjects.push(deck));
  staticObjects.push(createPier(gl, [0, -0.12, -30], [6, 50]));

  const umbrellaColors = [
    { canopy: [0.95, 0.35, 0.4] },
    { canopy: [0.2, 0.7, 0.9] },
    { canopy: [0.95, 0.8, 0.32] },
    { canopy: [0.7, 0.35, 0.9] },
  ];
  const umbrellaPositions = [];
  for (let x = -50; x <= 50; x += 12) {
    umbrellaPositions.push([x + randomRange(-2, 2), 0, -18 + randomRange(-3, 2)]);
  }
  umbrellaPositions.forEach((pos, idx) => {
    const set = umbrellaColors[idx % umbrellaColors.length];
    createUmbrella(gl, pos, set).forEach((obj) => staticObjects.push(obj));
  });

  const shorelinePalms = [];
  for (let x = -60; x <= 60; x += 12) {
    shorelinePalms.push([x + randomRange(-1, 1), 0, -25 + randomRange(-3, 3)]);
  }
  shorelinePalms.forEach((pos) => {
    createPalmTree(gl, pos).forEach((obj) => staticObjects.push(obj));
  });

  const parks = [
    createPlane(gl, 26, 18, [-28, -0.12, 28], [0.16, 0.42, 0.2], 0.22),
    createPlane(gl, 28, 20, [32, -0.12, 46], [0.14, 0.38, 0.22], 0.22),
  ];
  parks.forEach((park) => staticObjects.push(park));

  const parkPalmPositions = [
    [-30, 0, 30],
    [-22, 0, 26],
    [30, 0, 44],
    [35, 0, 50],
  ];
  parkPalmPositions.forEach((pos) => {
    createPalmTree(gl, pos).forEach((obj) => staticObjects.push(obj));
  });

  for (let z = 12; z <= 84; z += 15) {
    staticObjects.push(createRoad(gl, 170, 4, [0, -0.04, z]));
  }
  for (let x = -48; x <= 48; x += 12) {
    staticObjects.push(createRoad(gl, 4, 120, [x, -0.04, 55]));
  }

  for (let x = -48; x <= 48; x += 12) {
    for (let z = 14; z <= 86; z += 12) {
      if (z < 20 && Math.abs(x) < 35) continue;
      if (Math.abs(x) < 8 && z > 32 && z < 70) continue;
      staticObjects.push(createBuilding(gl, x + randomRange(-1.5, 1.5), z + randomRange(-1.5, 1.5)));
    }
  }

  const npcPaths = [
    [
      [-40, 0.35, 20],
      [40, 0.35, 20],
      [40, 0.35, 80],
      [-40, 0.35, 80],
    ],
    [
      [-25, 0.35, 35],
      [25, 0.35, 35],
      [25, 0.35, 65],
      [-25, 0.35, 65],
    ],
  ];

  npcPaths.forEach((path) => {
    const color = [randomRange(0.5, 1), randomRange(0.3, 0.7), randomRange(0.1, 0.3)];
    const car = new NpcCar(gl, path, randomRange(4, 10), color);
    car.position = [...path[0]];
    traffic.push(car);
  });

  return {
    staticObjects,
    traffic,
    collision,
  };
}
