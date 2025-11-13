// Utilitário para gerar prismas retangulares coloridos.
export function createBox({ width = 1, height = 1, depth = 1, color = [1, 1, 1] }) {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  const positions = [
    // Frente
    -hw,
    -hh,
    hd,
    hw,
    -hh,
    hd,
    hw,
    hh,
    hd,
    -hw,
    hh,
    hd,
    // Trás
    hw,
    -hh,
    -hd,
    -hw,
    -hh,
    -hd,
    -hw,
    hh,
    -hd,
    hw,
    hh,
    -hd,
    // Esquerda
    -hw,
    -hh,
    -hd,
    -hw,
    -hh,
    hd,
    -hw,
    hh,
    hd,
    -hw,
    hh,
    -hd,
    // Direita
    hw,
    -hh,
    hd,
    hw,
    -hh,
    -hd,
    hw,
    hh,
    -hd,
    hw,
    hh,
    hd,
    // Topo
    -hw,
    hh,
    hd,
    hw,
    hh,
    hd,
    hw,
    hh,
    -hd,
    -hw,
    hh,
    -hd,
    // Base
    -hw,
    -hh,
    -hd,
    hw,
    -hh,
    -hd,
    hw,
    -hh,
    hd,
    -hw,
    -hh,
    hd,
  ];

  const normals = [
    // Frente
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    // Trás
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    // Esquerda
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    // Direita
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    // Topo
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    // Base
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
  ];

  const colors = [];
  for (let i = 0; i < 24; i++) {
    colors.push(color[0], color[1], color[2]);
  }

  const indices = [];
  for (let i = 0; i < 6; i++) {
    const offset = i * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }

  return { positions, colors, normals, indices };
}
