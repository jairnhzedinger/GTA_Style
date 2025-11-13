import { THREE } from '../engine/three.js';

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function colorFromArray(color) {
  return new THREE.Color(color[0], color[1], color[2]);
}

function createBoxMesh({ width, height, depth, color, position, castShadow = false, receiveShadow = true }) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color: colorFromArray(color),
    flatShading: true,
    roughness: 0.8,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

function createPalmTree(position) {
  const group = new THREE.Group();

  const trunk = createBoxMesh({
    width: 0.6,
    height: 5.2,
    depth: 0.6,
    color: [0.4, 0.23, 0.08],
    position: [position[0], position[1] + 2.6, position[2]],
    castShadow: true,
  });
  group.add(trunk);

  const leafGeometry = new THREE.BoxGeometry(0.5, 0.15, 3.6);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: colorFromArray([0.08, 0.8, 0.42]),
    flatShading: true,
    roughness: 0.65,
    metalness: 0.05,
  });
  const leafAngles = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];
  leafAngles.forEach((angle) => {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.set(position[0], position[1] + 5.2, position[2]);
    leaf.rotation.y = angle;
    leaf.castShadow = false;
    leaf.receiveShadow = false;
    group.add(leaf);
  });

  return group;
}

function createUmbrella(position, colors) {
  const group = new THREE.Group();

  const pole = createBoxMesh({
    width: 0.2,
    height: 2.6,
    depth: 0.2,
    color: colors.pole || [0.75, 0.73, 0.7],
    position: [position[0], position[1] + 1.3, position[2]],
  });
  group.add(pole);

  const canopy = createBoxMesh({
    width: 2.4,
    height: 0.4,
    depth: 2.4,
    color: colors.canopy,
    position: [position[0], position[1] + 2.2, position[2]],
  });
  canopy.scale.set(1, 0.7, 1);
  group.add(canopy);

  return group;
}

function createWorldPlane(options) {
  return createBoxMesh(options);
}

function addObject(group, object) {
  group.add(object);
  return object;
}

export function createWorld(scene) {
  const group = new THREE.Group();
  group.name = 'World';
  scene.add(group);

  const collision = {
    worldBounds: { minX: -70, maxX: 70, minZ: -45, maxZ: 90 },
    restrictedZones: [
      { minX: -90, maxX: 90, minZ: -210, maxZ: -35, type: 'água', groundHeight: -0.25, speedModifier: 0 },
    ],
    sandZones: [{ minX: -80, maxX: 80, minZ: -35, maxZ: -5, groundHeight: -0.05, speedModifier: 0.65 }],
    solidZones: [],
  };

  addObject(
    group,
    createWorldPlane({ width: 200, height: 0.2, depth: 200, color: [0.08, 0.28, 0.52], position: [0, -0.32, -110], receiveShadow: true })
  );
  addObject(
    group,
    createWorldPlane({ width: 160, height: 0.25, depth: 40, color: [0.92, 0.79, 0.45], position: [0, -0.18, -20], receiveShadow: true })
  );
  addObject(
    group,
    createWorldPlane({ width: 180, height: 0.2, depth: 6, color: [0.65, 0.55, 0.42], position: [0, -0.12, -4], receiveShadow: true })
  );

  const decks = [
    createWorldPlane({ width: 18, height: 0.25, depth: 8, color: [0.72, 0.58, 0.4], position: [-25, -0.1, -12] }),
    createWorldPlane({ width: 14, height: 0.25, depth: 7, color: [0.72, 0.58, 0.4], position: [25, -0.1, -10] }),
  ];
  decks.forEach((deck) => addObject(group, deck));
  addObject(group, createWorldPlane({ width: 6, height: 0.3, depth: 50, color: [0.32, 0.26, 0.19], position: [0, -0.12, -30] }));

  const umbrellaColors = [
    { canopy: [0.95, 0.35, 0.4] },
    { canopy: [0.2, 0.7, 0.9] },
    { canopy: [0.95, 0.8, 0.32] },
    { canopy: [0.7, 0.35, 0.9] },
  ];
  let umbrellaIndex = 0;
  for (let x = -50; x <= 50; x += 12) {
    const position = [x + randomRange(-2, 2), 0, -18 + randomRange(-3, 2)];
    const set = umbrellaColors[umbrellaIndex % umbrellaColors.length];
    addObject(group, createUmbrella(position, set));
    umbrellaIndex += 1;
  }

  for (let x = -60; x <= 60; x += 12) {
    const position = [x + randomRange(-1, 1), 0, -25 + randomRange(-3, 3)];
    addObject(group, createPalmTree(position));
  }

  const parks = [
    createWorldPlane({ width: 26, height: 0.22, depth: 18, color: [0.16, 0.42, 0.2], position: [-28, -0.12, 28] }),
    createWorldPlane({ width: 28, height: 0.22, depth: 20, color: [0.14, 0.38, 0.22], position: [32, -0.12, 46] }),
  ];
  parks.forEach((park) => addObject(group, park));

  const parkPalms = [
    [-30, 0, 30],
    [-22, 0, 26],
    [30, 0, 44],
    [35, 0, 50],
  ];
  parkPalms.forEach((pos) => addObject(group, createPalmTree(pos)));

  for (let z = 12; z <= 84; z += 15) {
    addObject(group, createWorldPlane({ width: 170, height: 0.12, depth: 4, color: [0.15, 0.15, 0.15], position: [0, -0.04, z] }));
  }
  for (let x = -48; x <= 48; x += 12) {
    addObject(group, createWorldPlane({ width: 4, height: 0.12, depth: 120, color: [0.16, 0.16, 0.16], position: [x, -0.04, 55] }));
  }

  for (let x = -48; x <= 48; x += 12) {
    for (let z = 14; z <= 86; z += 12) {
      if (z < 20 && Math.abs(x) < 35) continue;
      if (Math.abs(x) < 8 && z > 32 && z < 70) continue;
      const width = randomRange(3, 6);
      const depth = randomRange(3, 6);
      const height = randomRange(3, 12);
      const color = [randomRange(0.2, 0.6), randomRange(0.2, 0.5), randomRange(0.2, 0.6)];
      const building = createBoxMesh({
        width,
        height,
        depth,
        color,
        position: [x + randomRange(-1.5, 1.5), height / 2, z + randomRange(-1.5, 1.5)],
        castShadow: true,
      });
      addObject(group, building);
      const padding = 0.6;
      collision.solidZones.push({
        minX: building.position.x - width / 2 - padding,
        maxX: building.position.x + width / 2 + padding,
        minZ: building.position.z - depth / 2 - padding,
        maxZ: building.position.z + depth / 2 + padding,
        padding: 0.02,
      });
    }
  }

  return { group, collision };
}
