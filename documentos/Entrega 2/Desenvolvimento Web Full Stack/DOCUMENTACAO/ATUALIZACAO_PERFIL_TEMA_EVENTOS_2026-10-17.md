# Atualização TrocaTicket — 17/10/2026

Esta atualização reúne mudanças de interface e fluxo pedidas para a versão conectada ao MySQL/XAMPP.

## O que mudou

- Ajuste da marca/logo nos cabeçalhos público e autenticado, com SVG próprio e contraste melhorado.
- Seletor de tema no cabeçalho público e nos dashboards. O tema escuro permanece como padrão; o tema claro aplica fundo branco/azul e a preferência fica salva no navegador.
- Após autocadastro, organizador e fornecedor são enviados para o dashboard inicial do próprio perfil. O dashboard mostra a chamada para completar o perfil, sem forçar a navegação direta ao formulário.
- Eventos do organizador separados nas abas Todos, Eventos confirmados (aprovados), Eventos em análise e Eventos recusados/cancelados.
- Perfil de organizador e fornecedor usando o mesmo layout compartilhado. Ambos podem editar os dados cadastrais/complementares, contato, foto e documento; o fornecedor também mantém campos de site, Instagram, produtos e serviços.
- Formulários de completar cadastro são pré-preenchidos com os dados já existentes.
- O status de aprovação administrativa de eventos é persistido separadamente do status de planejamento.

## Eventos rejeitados

Rejeitar um evento pelo administrador **não o apaga do MySQL**. A operação atualiza `eventos.status_aprovacao` para `REJEITADO`. O organizador pode consultá-lo na aba **Eventos recusados/cancelados**. O evento rejeitado deixa de aparecer para fornecedores nas oportunidades disponíveis, pois a API filtra eventos aprovados e exige organizador aprovado. A exclusão é uma ação separada do organizador, sujeita às permissões da API.

## Execução local

1. Preserve o arquivo `Backend/.env` da sua máquina; ele não é incluído neste pacote.
2. Inicie o MySQL pelo XAMPP.
3. Em `Backend`, execute `npm install` e `npm run dev`.
4. Em `Frontend`, execute `npm install` e `npm run dev`.
5. Abra o endereço local informado pelo Vite (normalmente `http://localhost:5173`).

Não é necessário importar o SQL novamente se o banco já estiver configurado. Faça backup antes de substituir os arquivos do seu projeto atual.

## Validação desta atualização

- Sintaxe de arquivos JavaScript/JSX verificada por transpile.
- Imports relativos conferidos.
- Testes unitários da fórmula de precificação executados separadamente.
- O build completo do Vite não foi confirmado neste ambiente porque as dependências instaladas eram específicas do Windows e o ambiente de verificação não dispõe da binding nativa Linux do Rolldown. Execute `npm install`/`npm run build` no ambiente de destino para confirmar a compilação lá.
