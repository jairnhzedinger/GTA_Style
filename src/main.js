import { THREE } from './engine/three.js';
import { Input } from './game/input.js';
import { PlayerAvatar } from './game/player.js';
import { createWorld } from './game/world.js';
import { HUD } from './game/hud.js';
import { spawnVehicles } from './game/vehicles.js';
import { spawnPedestrians } from './game/npcs.js';

const canvas = document.getElementById('game');
const hud = new HUD(document.getElementById('hud'));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = false;
renderer.setPixelRatio(window.devicePixelRatio || 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0.04, 0.18, 0.25);
scene.fog = new THREE.Fog(0x0a2439, 25, 220);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);

const ambientLight = new THREE.AmbientLight(0x120a10, 0.8);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
sunLight.position.set(-30, 60, 50);
scene.add(sunLight);

const input = new Input(canvas);
const world = createWorld(scene);
const player = new PlayerAvatar(scene, {
  color: [0.2, 0.7, 1],
  collision: world.collision,
});
const vehicles = spawnVehicles(scene, world.collision);
const pedestrians = spawnPedestrians(scene);
let activeVehicle = null;

const cameraRig = {
  distance: 5.6,
  yaw: 0,
  pitch: -0.45,
  minPitch: -1.2,
  maxPitch: 0.35,
  sensitivity: 0.0025,
  position: new THREE.Vector3(0, 2.5, -6),
  target: new THREE.Vector3(),
  desiredPosition: new THREE.Vector3(),
  targetOffset: [0, 1.2, 0],
  verticalOffset: 0.4,
  followOffset: [0, 0.15, 0],
  response: 0.12,
};

let lastTime = 0;

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight - 140;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyCameraRotation(mouseDelta = { dx: 0, dy: 0 }) {
  if (!mouseDelta) return;
  cameraRig.yaw -= mouseDelta.dx * cameraRig.sensitivity;
  cameraRig.pitch = clamp(
    cameraRig.pitch - mouseDelta.dy * cameraRig.sensitivity,
    cameraRig.minPitch,
    cameraRig.maxPitch
  );
}

function updateCamera(dt, subject) {
  const smoothing = 1 - Math.exp(-dt / Math.max(cameraRig.response, 0.001));
  const subjectSettings = subject?.cameraSettings || {};
  const distance = subjectSettings.distance ?? cameraRig.distance;
  const targetOffset = subjectSettings.targetOffset || cameraRig.targetOffset;
  const verticalOffset = subjectSettings.verticalOffset ?? cameraRig.verticalOffset;
  const followOffset = subjectSettings.followOffset || cameraRig.followOffset;
  const horizontalDistance = Math.cos(cameraRig.pitch) * distance;

  cameraRig.desiredPosition.set(
    subject.position.x - Math.sin(cameraRig.yaw) * horizontalDistance + followOffset[0],
    subject.position.y + Math.sin(-cameraRig.pitch) * distance + verticalOffset + followOffset[1],
    subject.position.z - Math.cos(cameraRig.yaw) * horizontalDistance + followOffset[2]
  );

  cameraRig.position.lerp(cameraRig.desiredPosition, smoothing);
  cameraRig.target.set(
    subject.position.x + targetOffset[0],
    subject.position.y + targetOffset[1],
    subject.position.z + targetOffset[2]
  );

  camera.position.copy(cameraRig.position);
  camera.lookAt(cameraRig.target);
}

function mixColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function applyEnvironmentLighting(time) {
  const sunsetPhase = Math.sin(time * 0.00005) * 0.5 + 0.5;
  const lightColor = mixColor([1.0, 0.6, 0.45], [1.0, 0.82, 0.6], sunsetPhase);
  const ambientColor = mixColor([0.09, 0.04, 0.06], [0.14, 0.06, 0.08], sunsetPhase);
  const fogColor = mixColor([0.1, 0.22, 0.35], [0.04, 0.18, 0.28], sunsetPhase);
  const backgroundColor = mixColor([0.04, 0.18, 0.25], [0.08, 0.23, 0.32], sunsetPhase);

  sunLight.color.setRGB(lightColor[0], lightColor[1], lightColor[2]);
  sunLight.intensity = 0.9 + 0.5 * sunsetPhase;
  ambientLight.color.setRGB(ambientColor[0], ambientColor[1], ambientColor[2]);
  scene.background.setRGB(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
  scene.fog.color.setRGB(fogColor[0], fogColor[1], fogColor[2]);
}

function render(time) {
  const dt = (time - lastTime) / 1000 || 0;
  lastTime = time;

  const mouseDelta = input.consumeMouse();
  applyCameraRotation(mouseDelta);
  let hint = '';

  if (!activeVehicle) {
    player.update(dt, input, cameraRig.yaw);
    player.setVisible(true);

    let closestVehicle = null;
    let closestDistance = Infinity;
    vehicles.forEach((vehicle) => {
      const distance = vehicle.distanceTo(player.position);
      if (distance < 2.6 && distance < closestDistance && vehicle.canEnter()) {
        closestVehicle = vehicle;
        closestDistance = distance;
      }
    });

    if (closestVehicle) {
      hint = 'Pressione ENTER para dirigir';
      if (input.consumePress('enter')) {
        activeVehicle = closestVehicle;
        closestVehicle.setDriver();
        player.setVisible(false);
        player.syncWithVehicle(closestVehicle);
      }
    }
  } else {
    player.syncWithVehicle(activeVehicle);
    player.speed = 0;
    player.stamina = Math.min(1, player.stamina + player.staminaRecovery * dt);
    hint = activeVehicle.canExit() ? 'Pressione ENTER para sair do veículo' : 'Reduza a velocidade para sair';
    if (input.consumePress('enter') && activeVehicle.canExit()) {
      const exitPosition = activeVehicle.getExitPosition();
      player.position.set(exitPosition.x, exitPosition.y, exitPosition.z);
      player.setVisible(true);
      activeVehicle.clearDriver();
      activeVehicle = null;
    }
  }

  vehicles.forEach((vehicle) => {
    const controlled = vehicle === activeVehicle;
    vehicle.update(dt, input, controlled);
  });
  pedestrians.forEach((npc) => npc.update(dt));

  const focusEntity = activeVehicle || player;
  updateCamera(dt, focusEntity);
  applyEnvironmentLighting(time);

  const currentSpeed = activeVehicle ? Math.abs(activeVehicle.speed) : player.speed;
  const surfaceLabel = activeVehicle ? 'veículo' : player.surface;

  hud.update({
    speed: currentSpeed * 3.6,
    stamina: player.stamina,
    surface: surfaceLabel,
    time: time / 1000,
    hint,
  });

  renderer.render(scene, camera);
  input.postFrame();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
