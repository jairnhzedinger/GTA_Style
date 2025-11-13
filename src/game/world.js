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

function createPark(gl, width, depth, position) {
  const geometry = createBox({ width, height: 0.2, depth, color: [0.12, 0.35, 0.18] });
  return new StaticObject(gl, geometry, position);
}

export function createWorld(gl) {
  const staticObjects = [];
  const traffic = [];

  staticObjects.push(createPark(gl, 120, 120, [0, -0.15, 0]));

  for (let i = -2; i <= 2; i++) {
    staticObjects.push(createRoad(gl, 120, 4, [0, -0.04, i * 10]));
    staticObjects.push(createRoad(gl, 4, 120, [i * 10, -0.04, 0]));
  }

  for (let x = -40; x <= 40; x += 10) {
    for (let z = -40; z <= 40; z += 10) {
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
      if (Math.abs(x % 20) < 1 && Math.abs(z % 20) < 1) continue;
      staticObjects.push(createBuilding(gl, x + randomRange(-2, 2), z + randomRange(-2, 2)));
    }
  }

  const npcPaths = [
    [
      [-30, 0.35, -30],
      [30, 0.35, -30],
      [30, 0.35, 30],
      [-30, 0.35, 30],
    ],
    [
      [-20, 0.35, 0],
      [0, 0.35, 20],
      [20, 0.35, 0],
      [0, 0.35, -20],
    ],
  ];

  npcPaths.forEach((path, i) => {
    const color = [randomRange(0.5, 1), randomRange(0.3, 0.7), randomRange(0.1, 0.3)];
    const car = new NpcCar(gl, path, randomRange(4, 10), color);
    car.position = [...path[0]];
    traffic.push(car);
  });

  return {
    staticObjects,
    traffic,
  };
}
