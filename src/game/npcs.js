import { THREE } from '../engine/three.js';

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

export class PedestrianNPC {
  constructor(scene, { waypoints = [], speed = 1.4, colors }) {
    this.object = createNpcMesh(colors.body, colors.head);
    scene.add(this.object);

    this.position = this.object.position;
    const start = waypoints[0] || [0, 0, 0];
    this.position.set(start[0], start[1], start[2]);

    this.waypoints = waypoints;
    this.currentTarget = 1;
    this.speed = speed;
  }

  update(dt) {
    if (!this.waypoints.length) return;
    const target = this.waypoints[this.currentTarget];
    if (!target) return;

    const direction = new THREE.Vector3(
      target[0] - this.position.x,
      0,
      target[2] - this.position.z
    );
    const distance = direction.length();
    if (distance < 0.3) {
      this.currentTarget = (this.currentTarget + 1) % this.waypoints.length;
      return;
    }

    direction.normalize();
    this.position.x += direction.x * this.speed * dt;
    this.position.z += direction.z * this.speed * dt;
    this.object.rotation.y = Math.atan2(direction.x, direction.z);
  }
}

const npcPalettes = [
  { body: [0.85, 0.1, 0.2], head: [1, 0.86, 0.72] },
  { body: [0.15, 0.65, 0.85], head: [0.96, 0.8, 0.62] },
  { body: [0.3, 0.8, 0.45], head: [0.9, 0.78, 0.66] },
  { body: [0.6, 0.35, 0.8], head: [0.98, 0.85, 0.75] },
  { body: [0.95, 0.7, 0.2], head: [0.94, 0.76, 0.6] },
];

export function spawnPedestrians(scene) {
  const paths = [
    [
      [-10, 0, 10],
      [-10, 0, 40],
      [-25, 0, 40],
      [-25, 0, 10],
    ],
    [
      [12, 0, 20],
      [12, 0, 60],
      [28, 0, 60],
      [28, 0, 20],
    ],
    [
      [-30, 0, -12],
      [-10, 0, -18],
      [-30, 0, -22],
    ],
    [
      [30, 0, -8],
      [45, 0, -4],
      [30, 0, 6],
    ],
    [
      [-45, 0, 55],
      [-25, 0, 70],
      [-45, 0, 85],
      [-60, 0, 70],
    ],
  ];

  return paths.map((waypoints, index) =>
    new PedestrianNPC(scene, {
      waypoints,
      speed: 1.2 + Math.random() * 0.6,
      colors: npcPalettes[index % npcPalettes.length],
    })
  );
}
