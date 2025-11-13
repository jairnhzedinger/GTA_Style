# GTA Style WebGL

Simulação em terceira pessoa inspirada em GTA, agora construída sobre a biblioteca [Three.js](https://threejs.org/) para agilizar o desenvolvimento de recursos 3D.

## Como executar

1. Utilize qualquer servidor HTTP simples (por exemplo `npx serve` ou `python -m http.server`).
2. Na raiz do projeto, execute o servidor e abra `http://localhost:PORT/index.html` em um navegador moderno.
3. Clique no canvas para capturar o mouse. Use `W`, `A`, `S`, `D` para caminhar e `Shift` para correr enquanto move a câmera com o mouse.

## Estrutura

- `src/engine`: utilitários genéricos, incluindo o reexport do Three.js.
- `src/game`: regras do jogo, geração do mundo, HUD e entrada.
- `index.html`: página básica com canvas e instruções.

## Recursos

- Renderização, iluminação e fog controlados pelo Three.js.
- Cidade procedural com ruas ortogonais, praias, decks e prédios.
- Avatar com câmera em terceira pessoa, stamina e diferentes superfícies.
- HUD informando velocidade, stamina, tipo de superfície e tempo de sessão.
