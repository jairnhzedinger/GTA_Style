const VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 color;
layout(location = 2) in vec3 normal;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

out vec3 vColor;
out vec3 vNormal;
out vec3 vWorldPos;

void main() {
  vec4 world = uModel * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vColor = color;
  vNormal = mat3(uModel) * normal;
  gl_Position = uProjection * uView * world;
}
`;

const FRAG = `#version 300 es
precision highp float;

in vec3 vColor;
in vec3 vNormal;
in vec3 vWorldPos;

uniform vec3 uLightDir;
uniform vec3 uCameraPos;
uniform vec3 uAmbient;
uniform vec3 uLightColor;
uniform vec3 uHorizonColor;
uniform vec3 uFogColor;
uniform float uSunIntensity;

out vec4 outColor;

void main() {
  vec3 normal = normalize(vNormal);
  float diff = max(dot(normal, -uLightDir), 0.0);
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  vec3 reflectDir = reflect(uLightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 24.0) * uSunIntensity;

  vec3 ambient = vColor * uAmbient;
  vec3 diffuse = vColor * uLightColor * diff;
  vec3 specular = uLightColor * spec;
  vec3 lighting = ambient + diffuse + specular;

  float distanceToCamera = length(uCameraPos - vWorldPos);
  float fogFactor = clamp(1.0 - exp(-distanceToCamera * 0.035), 0.0, 0.9);
  float heightMix = clamp((vWorldPos.y + 10.0) / 80.0, 0.0, 1.0);
  vec3 fogColor = mix(uHorizonColor, uFogColor, heightMix);
  vec3 finalColor = mix(lighting, fogColor, fogFactor);

  outColor = vec4(finalColor, 1.0);
}
`;

export class ShaderProgram {
  constructor(gl) {
    this.gl = gl;
    this.program = this.createProgram(VERT, FRAG);
    this.uniformLocations = new Map();
  }

  createProgram(vertSrc, fragSrc) {
    const gl = this.gl;
    const vert = this.compileShader(gl.VERTEX_SHADER, vertSrc);
    const frag = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }
    return program;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name) {
    if (!this.uniformLocations.has(name)) {
      this.uniformLocations.set(name, this.gl.getUniformLocation(this.program, name));
    }
    return this.uniformLocations.get(name);
  }
}

export class Mesh {
  constructor(gl, { positions, colors, normals, indices }) {
    const glPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glPos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const glColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const glNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glNormal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const glIndex = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.buffers = { glPos, glColor, glNormal, glIndex };
    this.count = indices.length;
  }

  bind(shader) {
    const gl = shader.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glPos);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glColor);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glNormal);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.glIndex);
  }

  draw(shader) {
    const gl = shader.gl;
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }
}
