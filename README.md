# GTA Style WebGL

Simulação top-down inspirada em GTA, inteiramente escrita em JavaScript moderno e WebGL2.

## Como executar

1. Instale qualquer servidor HTTP simples (por exemplo `npx serve` ou `python -m http.server`).
2. Na raiz do projeto, execute o servidor e abra `http://localhost:PORT/index.html` em um navegador com suporte a WebGL2.
3. Clique no canvas para capturar o mouse. Use `W`, `A`, `S`, `D` para dirigir, `Shift` para turbo e `Espaço` para frear.

## Estrutura

- `src/engine`: utilitários genéricos do motor 3D (math, WebGL e geometria).
- `src/game`: regras do jogo, geração do mundo, HUD e entrada.
- `index.html`: página básica com canvas e instruções.

## Recursos

- Renderizador WebGL2 com shading Phong simples.
- Cidade procedural com ruas ortogonais, parques e prédios.
- Sistema de veículos com física simplificada, turbo e tráfego automático.
- HUD informando velocidade, RPM aproximado, turbo, tráfego e tempo.
