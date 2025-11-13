import { THREE } from '../engine/three.js';

const textureLoader = new THREE.TextureLoader();

function createSvgDataUrl(svgContent) {
  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
}

function loadTiledTexture(url, repeatX = 1, repeatY = 1, { colorSpace = THREE.SRGBColorSpace } = {}) {
  const texture = textureLoader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = colorSpace;
  return texture;
}

function loadPatternTexture(svgContent, repeatX, repeatY, colorSpace) {
  return loadTiledTexture(createSvgDataUrl(svgContent), repeatX, repeatY, { colorSpace });
}

const flatNormalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#8080ff"/></svg>`;

const texturedSurfaces = {
  sand: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
         <rect width="64" height="64" fill="#d9c18b"/>
         <circle cx="8" cy="8" r="2" fill="#c09856" opacity="0.4"/>
         <circle cx="26" cy="12" r="1.5" fill="#c7a05b" opacity="0.5"/>
         <circle cx="40" cy="30" r="1.2" fill="#e4d2a2" opacity="0.35"/>
         <circle cx="54" cy="20" r="1.6" fill="#caa46d" opacity="0.45"/>
         <circle cx="12" cy="40" r="1.3" fill="#b3894d" opacity="0.45"/>
       </svg>`,
      24,
      10
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 24, 10, THREE.NoColorSpace),
    roughnessMap: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
         <rect width="8" height="8" fill="#bbbbbb"/>
         <rect width="1" height="1" x="2" y="3" fill="#999999"/>
         <rect width="1" height="1" x="5" y="1" fill="#cccccc"/>
       </svg>`,
      24,
      10,
      THREE.NoColorSpace
    ),
  },
  boardwalk: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
         <rect width="32" height="32" fill="#8a633d"/>
         <rect x="0" y="4" width="32" height="2" fill="#6d4b29" opacity="0.8"/>
         <rect x="0" y="16" width="32" height="2" fill="#a87c53" opacity="0.7"/>
         <rect x="0" y="28" width="32" height="2" fill="#6d4b29" opacity="0.8"/>
       </svg>`,
      12,
      4
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 12, 4, THREE.NoColorSpace),
  },
  concrete: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
         <rect width="32" height="32" fill="#b8b6af"/>
         <rect x="0" y="16" width="32" height="1" fill="#a8a49b" opacity="0.7"/>
         <rect x="16" y="0" width="1" height="32" fill="#a8a49b" opacity="0.7"/>
         <circle cx="9" cy="9" r="0.8" fill="#a3a09a"/>
         <circle cx="22" cy="6" r="0.7" fill="#c9c6be"/>
       </svg>`,
      14,
      8
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 14, 8, THREE.NoColorSpace),
    roughnessMap: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
         <rect width="8" height="8" fill="#d0d0d0"/>
         <circle cx="2" cy="3" r="1" fill="#b3b3b3"/>
       </svg>`,
      14,
      8,
      THREE.NoColorSpace
    ),
  },
  asphalt: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
         <rect width="64" height="64" fill="#2b2b2b"/>
         <circle cx="8" cy="12" r="1" fill="#3a3a3a" opacity="0.6"/>
         <circle cx="22" cy="28" r="1.2" fill="#1f1f1f" opacity="0.6"/>
         <circle cx="40" cy="10" r="1" fill="#343434" opacity="0.5"/>
         <rect x="0" y="30" width="64" height="2" fill="#2f2f2f" opacity="0.5"/>
         <rect x="0" y="48" width="64" height="2" fill="#2f2f2f" opacity="0.5"/>
       </svg>`,
      20,
      6
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 20, 6, THREE.NoColorSpace),
    roughnessMap: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
         <rect width="8" height="8" fill="#8a8a8a"/>
         <circle cx="2" cy="2" r="0.8" fill="#6f6f6f"/>
       </svg>`,
      20,
      6,
      THREE.NoColorSpace
    ),
  },
  grass: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
         <rect width="32" height="32" fill="#1d5527"/>
         <path d="M4 28 L6 20" stroke="#2e8f3c" stroke-width="1.2" stroke-linecap="round"/>
         <path d="M12 30 L14 22" stroke="#3aa447" stroke-width="1" stroke-linecap="round"/>
         <path d="M22 28 L24 21" stroke="#2f7436" stroke-width="1.3" stroke-linecap="round"/>
       </svg>`,
      10,
      6
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 10, 6, THREE.NoColorSpace),
  },
  glassFacade: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="32">
         <rect width="16" height="32" fill="#6ea6c9"/>
         <rect x="0" y="14" width="16" height="4" fill="#90c2dd" opacity="0.5"/>
         <rect x="7" y="0" width="2" height="32" fill="#a5d2ed" opacity="0.5"/>
       </svg>`,
      6,
      8
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 6, 8, THREE.NoColorSpace),
    roughnessMap: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
         <rect width="8" height="8" fill="#cccccc"/>
       </svg>`,
      6,
      8,
      THREE.NoColorSpace
    ),
  },
  brickFacade: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16">
         <rect width="32" height="16" fill="#9b4a2f"/>
         <rect x="0" y="7" width="32" height="2" fill="#702c1d" opacity="0.5"/>
         <rect x="8" y="0" width="2" height="16" fill="#7a2e1b" opacity="0.5"/>
         <rect x="24" y="0" width="2" height="16" fill="#7a2e1b" opacity="0.5"/>
       </svg>`,
      8,
      12
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 8, 12, THREE.NoColorSpace),
  },
  concreteFacade: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
         <rect width="32" height="32" fill="#b0b3ba"/>
         <rect x="0" y="10" width="32" height="2" fill="#8f949d" opacity="0.6"/>
         <rect x="0" y="22" width="32" height="2" fill="#8f949d" opacity="0.6"/>
       </svg>`,
      8,
      12
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 8, 12, THREE.NoColorSpace),
  },
  windowAccent: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
         <rect width="8" height="8" fill="#6ea6c9"/>
         <rect x="0" y="3" width="8" height="2" fill="#c9e8fa" opacity="0.6"/>
       </svg>`,
      4,
      4
    ),
  },
  awning: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="8">
         <rect width="16" height="8" fill="#d23c3c"/>
         <rect x="0" y="0" width="8" height="8" fill="#f5e7d7" opacity="0.7"/>
       </svg>`,
      4,
      2
    ),
  },
  metal: {
    map: loadPatternTexture(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stop-color="#444"/>
           <stop offset="100%" stop-color="#888"/>
         </linearGradient>
         <rect width="16" height="16" fill="url(#g)"/>
         <rect x="0" y="8" width="16" height="1" fill="#555" opacity="0.6"/>
       </svg>`,
      2,
      2
    ),
    normalMap: loadPatternTexture(flatNormalSvg, 2, 2, THREE.NoColorSpace),
  },
};

function cloneTexture(texture) {
  if (!texture) return undefined;
  const clone = texture.clone();
  clone.needsUpdate = true;
  return clone;
}

function getSurfaceMaterial(surfaceName) {
  const surface = texturedSurfaces[surfaceName] || {};
  return {
    map: cloneTexture(surface.map),
    normalMap: cloneTexture(surface.normalMap),
    roughnessMap: cloneTexture(surface.roughnessMap),
  };
}

const buildingThemes = [
  {
    name: 'glass',
    baseColor: [0.55, 0.75, 0.9],
    surface: 'glassFacade',
    details: ['windowBands', 'verticalWindows', 'roofLedge'],
  },
  {
    name: 'brick',
    baseColor: [0.55, 0.3, 0.2],
    surface: 'brickFacade',
    details: ['windowBands', 'awning', 'roofLedge'],
  },
  {
    name: 'concrete',
    baseColor: [0.7, 0.7, 0.7],
    surface: 'concreteFacade',
    details: ['verticalWindows', 'roofLedge'],
  },
];

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function colorFromArray(color) {
  return new THREE.Color(color[0], color[1], color[2]);
}

function createBoxMesh({
  width,
  height,
  depth,
  color,
  position,
  castShadow = false,
  receiveShadow = true,
  map,
  normalMap,
  roughnessMap,
  flatShading = true,
}) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const materialConfig = {
    color: color ? colorFromArray(color) : new THREE.Color(1, 1, 1),
    flatShading,
    roughness: 0.8,
    metalness: 0.05,
  };
  if (map) materialConfig.map = map;
  if (normalMap) materialConfig.normalMap = normalMap;
  if (roughnessMap) materialConfig.roughnessMap = roughnessMap;
  const material = new THREE.MeshStandardMaterial(materialConfig);
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

function createRoadMarkings({
  orientation,
  span,
  position,
  offset = 0,
  dashLength = 6,
  gap = 4,
  thickness = 0.35,
}) {
  const markings = new THREE.Group();
  const start = -span / 2 + dashLength / 2;
  for (let i = start; i < span / 2; i += dashLength + gap) {
    const isHorizontal = orientation === 'horizontal';
    const width = isHorizontal ? dashLength : thickness;
    const depth = isHorizontal ? thickness : dashLength;
    const x = isHorizontal ? position[0] + i : position[0] + offset;
    const z = isHorizontal ? position[2] + offset : position[2] + i;
    markings.add(
      createBoxMesh({
        width,
        height: 0.05,
        depth,
        color: [0.98, 0.98, 0.86],
        position: [x, position[1] + 0.08, z],
        receiveShadow: false,
        castShadow: false,
        flatShading: false,
      })
    );
  }
  return markings;
}

function addRoadSegment(group, { width, depth, position, orientation }) {
  const surface = getSurfaceMaterial('asphalt');
  const road = createWorldPlane({
    width,
    height: 0.12,
    depth,
    color: [0.15, 0.15, 0.15],
    position,
    map: surface.map,
    normalMap: surface.normalMap,
    roughnessMap: surface.roughnessMap,
    flatShading: false,
    receiveShadow: true,
  });
  addObject(group, road);

  const span = orientation === 'horizontal' ? width : depth;
  const centerMarkings = createRoadMarkings({ orientation, span, position });
  group.add(centerMarkings);

  const sideOffset = 1.2;
  const sideMarkingsA = createRoadMarkings({
    orientation,
    span,
    position,
    offset: sideOffset,
    dashLength: 2,
    gap: 1.5,
    thickness: 0.18,
  });
  const sideMarkingsB = createRoadMarkings({
    orientation,
    span,
    position,
    offset: -sideOffset,
    dashLength: 2,
    gap: 1.5,
    thickness: 0.18,
  });
  group.add(sideMarkingsA);
  group.add(sideMarkingsB);
}

const buildingDetailers = {
  windowBands(group, info) {
    const windowSurface = getSurfaceMaterial('windowAccent');
    for (let y = 1.2; y < info.height - 0.8; y += 2.4) {
      const front = createBoxMesh({
        width: info.width - 0.4,
        height: 0.18,
        depth: 0.12,
        position: [info.centerX, y, info.centerZ + info.depth / 2 + 0.07],
        map: windowSurface.map,
        normalMap: windowSurface.normalMap,
        flatShading: false,
        receiveShadow: false,
      });
      const back = createBoxMesh({
        width: info.width - 0.4,
        height: 0.18,
        depth: 0.12,
        position: [info.centerX, y, info.centerZ - info.depth / 2 - 0.07],
        map: cloneTexture(windowSurface.map),
        normalMap: cloneTexture(windowSurface.normalMap),
        flatShading: false,
        receiveShadow: false,
      });
      group.add(front);
      group.add(back);
    }
  },
  verticalWindows(group, info) {
    const windowSurface = getSurfaceMaterial('windowAccent');
    const columns = Math.max(1, Math.floor(info.width / 2));
    for (let i = 0; i < columns; i += 1) {
      const offset = -info.width / 2 + 1 + (i * (info.width - 2)) / Math.max(1, columns - 1);
      const front = createBoxMesh({
        width: 0.3,
        height: info.height - 1,
        depth: 0.1,
        position: [info.centerX + offset, info.height / 2, info.centerZ + info.depth / 2 + 0.08],
        map: windowSurface.map,
        flatShading: false,
        receiveShadow: false,
      });
      const back = createBoxMesh({
        width: 0.3,
        height: info.height - 1,
        depth: 0.1,
        position: [info.centerX + offset, info.height / 2, info.centerZ - info.depth / 2 - 0.08],
        map: cloneTexture(windowSurface.map),
        normalMap: cloneTexture(windowSurface.normalMap),
        flatShading: false,
        receiveShadow: false,
      });
      group.add(front);
      group.add(back);
    }
  },
  roofLedge(group, info) {
    const surface = getSurfaceMaterial('concrete');
    const ledge = createBoxMesh({
      width: info.width + 0.6,
      height: 0.2,
      depth: info.depth + 0.6,
      position: [info.centerX, info.height + 0.1, info.centerZ],
      map: surface.map,
      normalMap: surface.normalMap,
      flatShading: false,
      receiveShadow: true,
    });
    group.add(ledge);
  },
  awning(group, info) {
    const awningSurface = getSurfaceMaterial('awning');
    const canopy = createBoxMesh({
      width: info.width - 0.4,
      height: 0.25,
      depth: info.depth / 2,
      position: [info.centerX, 1.5, info.centerZ + info.depth / 2 + info.depth / 4],
      map: awningSurface.map,
      flatShading: false,
      castShadow: false,
      receiveShadow: true,
    });
    group.add(canopy);
    const supportSurface = getSurfaceMaterial('metal');
    const supportLeft = createBoxMesh({
      width: 0.12,
      height: 1.2,
      depth: 0.12,
      position: [info.centerX - info.width / 3, 0.6, info.centerZ + info.depth / 2 + 0.05],
      map: supportSurface.map,
      normalMap: supportSurface.normalMap,
      flatShading: false,
    });
    const supportRight = createBoxMesh({
      width: 0.12,
      height: 1.2,
      depth: 0.12,
      position: [info.centerX + info.width / 3, 0.6, info.centerZ + info.depth / 2 + 0.05],
      map: cloneTexture(supportSurface.map),
      flatShading: false,
    });
    group.add(supportLeft);
    group.add(supportRight);
  },
};

function decorateBuilding(group, info) {
  const availableDetails = [...info.theme.details];
  const detailCount = Math.max(1, Math.floor(Math.random() * availableDetails.length));
  for (let i = 0; i < detailCount; i += 1) {
    if (!availableDetails.length) break;
    const index = Math.floor(Math.random() * availableDetails.length);
    const detail = availableDetails.splice(index, 1)[0];
    const fn = buildingDetailers[detail];
    if (fn) {
      fn(group, info);
    }
  }
}

function createStreetLamp(position) {
  const lampGroup = new THREE.Group();
  const metalSurface = getSurfaceMaterial('metal');
  const base = createBoxMesh({
    width: 0.5,
    height: 0.4,
    depth: 0.5,
    position: [position[0], position[1] + 0.2, position[2]],
    map: metalSurface.map,
    normalMap: metalSurface.normalMap,
    flatShading: false,
  });
  lampGroup.add(base);
  const pole = createBoxMesh({
    width: 0.15,
    height: 3,
    depth: 0.15,
    position: [position[0], position[1] + 2, position[2]],
    map: cloneTexture(metalSurface.map),
    flatShading: false,
  });
  lampGroup.add(pole);
  const head = createBoxMesh({
    width: 0.9,
    height: 0.3,
    depth: 0.9,
    color: [1, 0.94, 0.8],
    position: [position[0], position[1] + 3.4, position[2]],
    flatShading: false,
    receiveShadow: false,
  });
  head.material.emissive = new THREE.Color(0.8, 0.78, 0.65);
  lampGroup.add(head);
  return lampGroup;
}

function createBench(position) {
  const benchGroup = new THREE.Group();
  const woodSurface = getSurfaceMaterial('boardwalk');
  const seat = createBoxMesh({
    width: 1.8,
    height: 0.2,
    depth: 0.6,
    position: [position[0], position[1] + 0.6, position[2]],
    map: woodSurface.map,
    flatShading: false,
  });
  benchGroup.add(seat);
  const backrest = createBoxMesh({
    width: 1.8,
    height: 0.2,
    depth: 0.5,
    position: [position[0], position[1] + 0.95, position[2] - 0.15],
    map: cloneTexture(woodSurface.map),
    flatShading: false,
  });
  backrest.rotation.x = THREE.MathUtils.degToRad(-10);
  benchGroup.add(backrest);
  const metalSurface = getSurfaceMaterial('metal');
  [-0.7, 0.7].forEach((offset) => {
    const leg = createBoxMesh({
      width: 0.15,
      height: 0.6,
      depth: 0.3,
      position: [position[0] + offset, position[1] + 0.3, position[2] + 0.15],
      map: metalSurface.map,
      flatShading: false,
    });
    benchGroup.add(leg);
  });
  return benchGroup;
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
  const sandSurface = getSurfaceMaterial('sand');
  addObject(
    group,
    createWorldPlane({
      width: 160,
      height: 0.25,
      depth: 40,
      color: [0.92, 0.79, 0.45],
      position: [0, -0.18, -20],
      receiveShadow: true,
      map: sandSurface.map,
      normalMap: sandSurface.normalMap,
      roughnessMap: sandSurface.roughnessMap,
      flatShading: false,
    })
  );
  const boardwalkSurface = getSurfaceMaterial('boardwalk');
  addObject(
    group,
    createWorldPlane({
      width: 180,
      height: 0.2,
      depth: 6,
      color: [0.65, 0.55, 0.42],
      position: [0, -0.12, -4],
      receiveShadow: true,
      map: boardwalkSurface.map,
      normalMap: boardwalkSurface.normalMap,
      flatShading: false,
    })
  );

  const decks = [
    (() => {
      const surface = getSurfaceMaterial('boardwalk');
      return createWorldPlane({
        width: 18,
        height: 0.25,
        depth: 8,
        color: [0.72, 0.58, 0.4],
        position: [-25, -0.1, -12],
        map: surface.map,
        normalMap: surface.normalMap,
        flatShading: false,
      });
    })(),
    (() => {
      const surface = getSurfaceMaterial('boardwalk');
      return createWorldPlane({
        width: 14,
        height: 0.25,
        depth: 7,
        color: [0.72, 0.58, 0.4],
        position: [25, -0.1, -10],
        map: surface.map,
        normalMap: surface.normalMap,
        flatShading: false,
      });
    })(),
  ];
  decks.forEach((deck) => addObject(group, deck));
  const concreteSurface = getSurfaceMaterial('concrete');
  addObject(
    group,
    createWorldPlane({
      width: 6,
      height: 0.3,
      depth: 50,
      color: [0.32, 0.26, 0.19],
      position: [0, -0.12, -30],
      map: concreteSurface.map,
      normalMap: concreteSurface.normalMap,
      roughnessMap: concreteSurface.roughnessMap,
      flatShading: false,
    })
  );

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

  const grassSurface = getSurfaceMaterial('grass');
  const parks = [
    createWorldPlane({
      width: 26,
      height: 0.22,
      depth: 18,
      color: [0.16, 0.42, 0.2],
      position: [-28, -0.12, 28],
      map: grassSurface.map,
      normalMap: grassSurface.normalMap,
      flatShading: false,
    }),
    (() => {
      const parkSurface = getSurfaceMaterial('grass');
      return createWorldPlane({
        width: 28,
        height: 0.22,
        depth: 20,
        color: [0.14, 0.38, 0.22],
        position: [32, -0.12, 46],
        map: parkSurface.map,
        normalMap: parkSurface.normalMap,
        flatShading: false,
      });
    })(),
  ];
  parks.forEach((park) => addObject(group, park));

  const parkPalms = [
    [-30, 0, 30],
    [-22, 0, 26],
    [30, 0, 44],
    [35, 0, 50],
  ];
  parkPalms.forEach((pos) => addObject(group, createPalmTree(pos)));

  const lampPositions = [-50, -20, 20, 50].map((x) => [x, 0, -6]);
  lampPositions.forEach((pos) => addObject(group, createStreetLamp(pos)));
  const benchPositions = [
    [-35, 0, -8],
    [-10, 0, -8],
    [12, 0, -8],
    [36, 0, -8],
    [-30, 0, 24],
    [34, 0, 40],
  ];
  benchPositions.forEach((pos) => addObject(group, createBench(pos)));

  for (let z = 12; z <= 84; z += 15) {
    addRoadSegment(group, { width: 170, depth: 4, position: [0, -0.04, z], orientation: 'horizontal' });
  }
  for (let x = -48; x <= 48; x += 12) {
    addRoadSegment(group, { width: 4, depth: 120, position: [x, -0.04, 55], orientation: 'vertical' });
  }

  for (let x = -48; x <= 48; x += 12) {
    for (let z = 14; z <= 86; z += 12) {
      if (z < 20 && Math.abs(x) < 35) continue;
      if (Math.abs(x) < 8 && z > 32 && z < 70) continue;
      const width = randomRange(3, 6);
      const depth = randomRange(3, 6);
      const height = randomRange(3, 12);
      const theme = buildingThemes[Math.floor(Math.random() * buildingThemes.length)];
      const surface = getSurfaceMaterial(theme.surface);
      const centerX = x + randomRange(-1.5, 1.5);
      const centerZ = z + randomRange(-1.5, 1.5);
      const building = createBoxMesh({
        width,
        height,
        depth,
        color: theme.baseColor,
        position: [centerX, height / 2, centerZ],
        castShadow: true,
        receiveShadow: true,
        map: surface.map,
        normalMap: surface.normalMap,
        roughnessMap: surface.roughnessMap,
        flatShading: false,
      });
      addObject(group, building);
      decorateBuilding(group, {
        centerX,
        centerZ,
        width,
        depth,
        height,
        theme,
      });
      const padding = 0.6;
      collision.solidZones.push({
        minX: centerX - width / 2 - padding,
        maxX: centerX + width / 2 + padding,
        minZ: centerZ - depth / 2 - padding,
        maxZ: centerZ + depth / 2 + padding,
        padding: 0.02,
      });
    }
  }

  return { group, collision };
}
