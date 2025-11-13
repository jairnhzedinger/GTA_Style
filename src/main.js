import { ShaderProgram } from './engine/gl.js';
import { mat4Perspective, mat4LookAt } from './engine/math.js';
import { Input } from './game/input.js';
import { PlayerCar } from './game/player.js';
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
const player = new PlayerCar(gl, { color: [0.2, 0.7, 1] });

let projectionMatrix = mat4Perspective(Math.PI / 4, 1, 0.1, 200);
let lastTime = 0;
const camera = {
  distance: 14,
  yaw: 0,
  pitch: -0.4,
  position: [0, 10, 10],
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

function updateCamera(dt) {
  const { dx, dy } = input.consumeMouse();
  camera.yaw -= dx * 0.002;
  camera.pitch = Math.max(-1.2, Math.min(-0.1, camera.pitch - dy * 0.002));
  const offset = [
    Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
    Math.sin(-camera.pitch) * camera.distance * 0.5 + 5,
    Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
  ];
  camera.position = [
    player.position[0] - offset[0],
    player.position[1] + offset[1],
    player.position[2] - offset[2],
  ];
}

function render(time) {
  const dt = (time - lastTime) / 1000 || 0;
  lastTime = time;

  player.update(dt, input);
  world.traffic.forEach((npc) => npc.update(dt));
  updateCamera(dt);

  const viewMatrix = mat4LookAt(camera.position, player.position, [0, 1, 0]);

  gl.clearColor(0.02, 0.02, 0.05, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  shader.use();

  gl.uniformMatrix4fv(shader.getUniformLocation('uProjection'), false, projectionMatrix);
  gl.uniformMatrix4fv(shader.getUniformLocation('uView'), false, viewMatrix);
  gl.uniform3fv(shader.getUniformLocation('uLightDir'), new Float32Array([0.3, 1, 0.5]));
  gl.uniform3fv(
    shader.getUniformLocation('uAmbient'),
    new Float32Array([0.04, 0.05, 0.08])
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
  world.traffic.forEach(drawObject);
  drawObject(player);

  hud.update({
    speed: Math.abs(player.speed) * 3.6,
    rpm: Math.abs(player.speed) * 250,
    turbo: Math.min(1, player.turbo / player.maxTurbo),
    traffic: world.traffic.length,
    time: time / 1000,
  });

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
