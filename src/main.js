import { ShaderProgram } from './engine/gl.js';
import { mat4Perspective, mat4LookAt } from './engine/math.js';
import { Input } from './game/input.js';
import { PlayerAvatar } from './game/player.js';
import { createWorld } from './game/world.js';
import { HUD } from './game/hud.js';

const canvas = document.getElementById('game');
const hud = new HUD(document.getElementById('hud'));
const gl = canvas.getContext('webgl2');

if (!gl) {
  alert('Seu navegador precisa suportar WebGL2 para rodar este projeto.');
  throw new Error('WebGL2 não suportado');
}

gl.enable(gl.DEPTH_TEST);
const shader = new ShaderProgram(gl);
const input = new Input(canvas);
const world = createWorld(gl);
const player = new PlayerAvatar(gl, {
  color: [0.2, 0.7, 1],
  collision: world.collision,
});

let projectionMatrix = mat4Perspective(Math.PI / 4, 1, 0.1, 200);
let lastTime = 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const camera = {
  distance: 5.6,
  yaw: 0,
  pitch: -0.45,
  minPitch: -1.2,
  maxPitch: 0.35,
  sensitivity: 0.0025,
  position: [0, 2.5, -6],
  targetOffset: [0, 1.2, 0],
  verticalOffset: 0.4,
  followOffset: [0, 0.15, 0],
  response: 0.12,
};

const mixVec3 = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const normalizeVec3 = (vec) => {
  const len = Math.hypot(vec[0], vec[1], vec[2]) || 1;
  return [vec[0] / len, vec[1] / len, vec[2] / len];
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 140;
  projectionMatrix = mat4Perspective(
    Math.PI / 3,
    canvas.width / canvas.height,
    0.1,
    400
  );
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

function applyCameraRotation(mouseDelta = { dx: 0, dy: 0 }) {
  if (!mouseDelta) return;
  camera.yaw -= mouseDelta.dx * camera.sensitivity;
  camera.pitch = clamp(
    camera.pitch - mouseDelta.dy * camera.sensitivity,
    camera.minPitch,
    camera.maxPitch
  );
}

function updateCamera(dt) {
  const smoothing = 1 - Math.exp(-dt / Math.max(camera.response, 0.001));
  const horizontalDistance = Math.cos(camera.pitch) * camera.distance;
  const desiredPosition = [
    player.position[0] - Math.sin(camera.yaw) * horizontalDistance + camera.followOffset[0],
    player.position[1] + Math.sin(-camera.pitch) * camera.distance + camera.verticalOffset + camera.followOffset[1],
    player.position[2] - Math.cos(camera.yaw) * horizontalDistance + camera.followOffset[2],
  ];
  camera.position = mixVec3(camera.position, desiredPosition, smoothing);
  camera.target = [
    player.position[0] + camera.targetOffset[0],
    player.position[1] + camera.targetOffset[1],
    player.position[2] + camera.targetOffset[2],
  ];
}

function render(time) {
  const dt = (time - lastTime) / 1000 || 0;
  lastTime = time;

  const mouseDelta = input.consumeMouse();
  applyCameraRotation(mouseDelta);
  player.update(dt, input, camera.yaw);
  updateCamera(dt);

  const viewMatrix = mat4LookAt(camera.position, camera.target, [0, 1, 0]);

  const sunsetPhase = Math.sin(time * 0.00005) * 0.5 + 0.5;
  const sunIntensity = 0.65 + 0.35 * sunsetPhase;
  const lightColor = mixVec3([1.0, 0.6, 0.45], [1.0, 0.82, 0.6], sunsetPhase);
  const ambientColor = mixVec3([0.09, 0.04, 0.06], [0.14, 0.06, 0.08], sunsetPhase);
  const horizonColor = mixVec3([0.95, 0.45, 0.38], [0.8, 0.7, 0.6], sunsetPhase);
  const fogColor = mixVec3([0.1, 0.22, 0.35], [0.04, 0.18, 0.28], sunsetPhase);
  const lightDir = normalizeVec3([0.2, 0.25 + sunsetPhase * 0.25, 0.9]);
  const clearColor = mixVec3([0.04, 0.18, 0.25], [0.08, 0.23, 0.32], sunsetPhase);

  gl.clearColor(clearColor[0], clearColor[1], clearColor[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  shader.use();

  gl.uniformMatrix4fv(shader.getUniformLocation('uProjection'), false, projectionMatrix);
  gl.uniformMatrix4fv(shader.getUniformLocation('uView'), false, viewMatrix);
  gl.uniform3fv(shader.getUniformLocation('uLightDir'), new Float32Array(lightDir));
  gl.uniform3fv(shader.getUniformLocation('uLightColor'), new Float32Array(lightColor));
  gl.uniform3fv(shader.getUniformLocation('uHorizonColor'), new Float32Array(horizonColor));
  gl.uniform3fv(shader.getUniformLocation('uFogColor'), new Float32Array(fogColor));
  gl.uniform1f(shader.getUniformLocation('uSunIntensity'), sunIntensity);
  gl.uniform3fv(
    shader.getUniformLocation('uAmbient'),
    new Float32Array(ambientColor)
  );
  gl.uniform3fv(
    shader.getUniformLocation('uCameraPos'),
    new Float32Array(camera.position)
  );

  const drawObject = (object) => {
    gl.uniformMatrix4fv(shader.getUniformLocation('uModel'), false, object.modelMatrix());
    object.mesh.bind(shader);
    object.mesh.draw(shader);
  };

  world.staticObjects.forEach(drawObject);
  drawObject(player);

  hud.update({
    speed: player.speed * 3.6,
    stamina: player.stamina,
    surface: player.surface,
    time: time / 1000,
  });

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
