# GTA Style Engine Guidelines

- Este projeto é escrito em JavaScript moderno (ES Modules). Sempre utilize `type="module"` ao importar scripts.
- Todo o código deve ser executável diretamente no navegador, sem bundlers ou dependências externas.
- Utilize nomes autoexplicativos para classes e funções. Preferir composição ao invés de herança profunda.
- Ao adicionar novos arquivos dentro de `src/`, mantenha a estrutura `engine/` para utilitários genéricos e `game/` para regras específicas do jogo.
- Comentários devem explicar intenções e não apenas repetir o óbvio.
- Atualize este arquivo caso novas convenções sejam introduzidas.
- Mensagens de commit devem estar em português e descrever claramente a mudança.
