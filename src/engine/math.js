// Funções matemáticas básicas para vetores e matrizes 4x4.
export const EPSILON = 1e-5;

export function vec3(x = 0, y = 0, z = 0) {
  return new Float32Array([x, y, z]);
}

export function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < EPSILON) return v;
  v[0] /= len;
  v[1] /= len;
  v[2] /= len;
  return v;
}

export function cross(a, b) {
  return new Float32Array([
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]);
}

export function subtract(a, b) {
  return new Float32Array([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
}

export function mat4Identity() {
  const out = new Float32Array(16);
  out[0] = out[5] = out[10] = out[15] = 1;
  return out;
}

export function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col + row * 4] =
        a[row * 4] * b[col] +
        a[row * 4 + 1] * b[col + 4] +
        a[row * 4 + 2] * b[col + 8] +
        a[row * 4 + 3] * b[col + 12];
    }
  }
  return out;
}

export function mat4Perspective(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

export function mat4Translation(x, y, z) {
  const out = mat4Identity();
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

export function mat4RotationY(angle) {
  const out = mat4Identity();
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  out[0] = c;
  out[2] = s;
  out[8] = -s;
  out[10] = c;
  return out;
}

export function mat4Scale(x, y, z) {
  const out = mat4Identity();
  out[0] = x;
  out[5] = y;
  out[10] = z;
  return out;
}

export function mat4LookAt(eye, target, up) {
  const zAxis = normalize(subtract(eye, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);

  const out = mat4Identity();
  out[0] = xAxis[0];
  out[1] = yAxis[0];
  out[2] = zAxis[0];
  out[4] = xAxis[1];
  out[5] = yAxis[1];
  out[6] = zAxis[1];
  out[8] = xAxis[2];
  out[9] = yAxis[2];
  out[10] = zAxis[2];
  out[12] = -(
    xAxis[0] * eye[0] +
    xAxis[1] * eye[1] +
    xAxis[2] * eye[2]
  );
  out[13] = -(
    yAxis[0] * eye[0] +
    yAxis[1] * eye[1] +
    yAxis[2] * eye[2]
  );
  out[14] = -(
    zAxis[0] * eye[0] +
    zAxis[1] * eye[1] +
    zAxis[2] * eye[2]
  );
  return out;
}

export function composeTransform(position, rotationY = 0, scale = [1, 1, 1]) {
  const translation = mat4Translation(position[0], position[1], position[2]);
  const rotation = mat4RotationY(rotationY);
  const scaling = mat4Scale(scale[0], scale[1], scale[2]);
  return mat4Multiply(translation, mat4Multiply(rotation, scaling));
}
