# Responsividade mobile-first — TrocaTicket

## Objetivo

A camada `Frontend/src/responsive.css` padroniza o comportamento responsivo das telas públicas e dos módulos de organizador, fornecedor e administrador. Ela é carregada depois dos estilos das páginas para corrigir conflitos de breakpoints sem reescrever a lógica dos componentes.

## Estratégia de layout

- **Base (celulares, 320px+):** conteúdo em uma coluna, cabeçalho compacto e navegação inferior fixa com uma coluna por item do menu. Formulários e cards ocupam a largura disponível; tabelas extensas rolam dentro do próprio contêiner.
- **560px+:** cards e blocos de informação selecionados passam a duas colunas quando há espaço suficiente.
- **768px+:** telas de tablet usam toda a largura do conteúdo e mantêm a navegação inferior, evitando uma sidebar que comprima o conteúdo em tablets retrato.
- **1024px+:** a navegação muda para sidebar lateral; conteúdo e menu ficam em colunas separadas.
- **1280px+:** grades de indicadores e relatórios ganham colunas adicionais.

## Componentes cobertos

- Cabeçalho público e cabeçalho dos dashboards.
- Navegação inferior móvel e menu lateral desktop.
- Home, Login e Cadastro, incluindo rolagem quando o teclado virtual está aberto.
- Dashboards de organizador, fornecedor e administrador.
- Cards de eventos, propostas, solicitações, métricas e cadastros.
- Formulários de evento, perfil, proposta e contraproposta.
- Detalhes de evento, fornecedor e organizador.
- Relatórios financeiros e de propostas.
- Tabelas de precificação e áreas administrativas, com rolagem horizontal restrita ao contêiner.
- Espaçamento seguro para dispositivos com recortes e barras do sistema (`safe-area-inset`).

## Resoluções-alvo para validação manual

| Tipo | Viewport sugerido |
|---|---:|
| Celular compacto | 320 × 640 |
| Celular comum | 360 × 800 |
| Celular grande | 430 × 932 |
| Tablet retrato | 768 × 1024 |
| Tablet retrato grande | 820 × 1180 |
| Tablet paisagem | 1024 × 768 |
| Notebook | 1366 × 768 |
| Desktop | 1440 × 900 |

## Como validar no navegador

1. Inicie o MySQL/XAMPP e os servidores do backend e frontend normalmente.
2. Abra o DevTools do navegador (`F12`) e ative a barra de dispositivos.
3. Teste os viewports da tabela acima nas páginas de início, eventos, detalhes do evento, procurar fornecedores, propostas, relatórios e módulos administrativos.
4. Confirme que não existe rolagem horizontal na página inteira; tabelas extensas podem rolar dentro do próprio painel.
5. Teste os dois temas, escuro e claro, e abra o teclado virtual em formulários no celular.
6. Verifique os links, botões e menus de cada perfil em todos os viewports.

## Validação técnica executada nesta atualização

- A nova folha CSS foi analisada com parser CSS: sem erros de sintaxe e com blocos balanceados.
- Os 14 testes automatizados existentes do backend foram executados: todos passaram.
- A alteração não modifica API, autenticação, modelo MySQL ou dados persistidos.
- A compilação de produção do Vite não foi concluída neste ambiente porque as dependências do frontend não puderam ser instaladas integralmente. A validação final do build e a inspeção visual em dispositivos devem ser feitas no ambiente Windows do projeto.
