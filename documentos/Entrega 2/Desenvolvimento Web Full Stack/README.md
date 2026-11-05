# TrocaTicket — versão consolidada

Plataforma acadêmica de planejamento e precificação de eventos. A aplicação conecta organizadores a fornecedores e estima o preço de um único tipo de ingresso; o MVP não vende ingressos nem processa pagamentos.

## Estrutura

- `Frontend/`: React + Vite.
- `Backend/`: API Node.js + Express, autenticação e persistência MySQL.
- `Backend/database/schema.sql`: esquema oficial para criar as tabelas no MySQL.
- `BD/`: scripts SQL e documentação do modelo de dados ([README do banco](BD/README.md)).
- `DOCUMENTACAO/`: cálculo do ticket, auditoria dos requisitos e coleção Postman.

> Este ZIP não inclui `node_modules` nem o arquivo `.env` real. Isso é intencional: as dependências devem ser instaladas na máquina em que o projeto será executado e as credenciais devem ser configuradas localmente.

## 1. Preparar o MySQL pelo XAMPP

1. Abra o XAMPP Control Panel e inicie **MySQL**.
2. Se precisar abrir o phpMyAdmin, inicie também **Apache** e visite `http://localhost/phpmyadmin`.
3. Se o banco ainda não existe, importe `Backend/database/schema.sql` (ou o arquivo equivalente em `BD/banco.sql`) usando a aba **Importar**.
4. Confirme a existência do banco `TrocaTicket`.

Se você já tem dados cadastrados no banco, **não apague o banco**. A API chama migrações pequenas na inicialização para acrescentar colunas necessárias quando possível. Faça backup antes de aplicar mudanças de esquema.

## 2. Configurar e iniciar o backend

Abra um primeiro CMD/terminal na pasta `Backend`, não na raiz do projeto:

```cmd
cd Backend
copy .env.example .env
npm install
```

Se o arquivo `.env` já existir, não o substitua. Abra `Backend/.env` e configure a conexão de acordo com o XAMPP. Na instalação local comum, os valores são:

```dotenv
PORT=3333
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=TrocaTicket
DB_USER=root
DB_PASSWORD=
```

Defina `JWT_SECRET` com uma chave aleatória própria de pelo menos 32 caracteres. Não publique `.env` no GitHub. A conta administrativa inicial é criada apenas se o e-mail configurado ainda não existir no banco. Se a conta já existe, editar `ADMIN_PASSWORD` não troca automaticamente a senha da conta existente.

Inicie a API:

```cmd
npm run dev
```

Mantenha esse terminal aberto. O terminal deve dizer que a conexão com MySQL foi estabelecida e que a API está disponível em `http://localhost:3333`.

Teste a conexão em `http://localhost:3333/api/health`. Se abrir `http://localhost:3333/`, a API retorna um pequeno JSON explicativo; **esse endereço não é a interface do site**.

## 3. Configurar e iniciar o frontend

Abra um segundo CMD/terminal na pasta `Frontend`:

```cmd
cd Frontend
copy .env.example .env
npm install
npm run dev
```

Não execute `npm install` na pasta raiz `TrocaTicket`, pois ela não tem um `package.json` próprio. Execute-o separadamente dentro de `Backend` e `Frontend`.

Abra o endereço indicado por Vite, normalmente `http://localhost:5173`. O backend fica em `3333`; o site fica em `5173` (ou na porta alternativa indicada pelo Vite, como `5174`). Mantenha o MySQL, o backend e o frontend rodando durante o uso.

## Funcionalidades integradas

- Autocadastro de organizadores e fornecedores e aprovação administrativa.
- Autenticação por token e rotas por perfil; status e permissões são validados no servidor.
- A logo dos dashboards retorna à área correspondente ao perfil conectado.
- Criação e edição de eventos com capa; somente organizadores aprovados podem criar ou alterar eventos.
- Verificação administrativa de eventos com status de aprovação separado do status de planejamento.
- Serviços requeridos e despesas estimadas, comparação e resposta a propostas de fornecedores.
- Busca de fornecedores cadastrados e detalhes de contato, segmento, produtos e serviços informados.
- Perfil público do organizador para fornecedores aprovados, com informações comerciais e eventos aprovados.
- Proteção contra propostas duplicadas por fornecedor/serviço; o fornecedor pode editar uma proposta em análise.
- Contrapropostas do organizador com valor, quantidade e descrição; o fornecedor aceita ou recusa, atualizando o mesmo registro.
- Relatório comercial do fornecedor com propostas aceitas, recusadas e pendentes e soma bruta das propostas aceitas.
- Painel administrativo com taxa de comissão da plataforma por evento e projeções para público mínimo, médio e máximo.
- Painéis de organizador com gastos estimados de todos os eventos e propostas aguardando análise.
- Cálculo do ticket de equilíbrio e ticket-alvo por cenário de público mínimo/máximo, consolidando custos e propostas aceitas sem duplicar o mesmo serviço.
- Dados persistidos em MySQL via API Express.

## Cálculo do ticket

A fórmula segue o requisito RF13 do PDF do Projeto Interdisciplinar:

- Ticket de equilíbrio = custo total consolidado / público.
- Ticket-alvo = custo total consolidado / [público × (1 − margem de lucro)].

A comissão da TrocaTicket e a margem do organizador são percentuais sobre a receita bruta. O sistema apresenta dois preços: (1) cobertura dos custos após a comissão da plataforma; (2) cobertura dos custos, comissão e margem desejada pelo organizador. Proposta aceita para um serviço substitui a estimativa manual desse serviço; propostas ainda em análise ou recusadas não entram no total. Consulte `DOCUMENTACAO/CALCULO_TICKET.md` para fórmulas, premissas e arredondamento.

## Testes

Na pasta `Backend`:

```cmd
npm test
```

A coleção Postman está em `DOCUMENTACAO/Postman/TrocaTicket_CRUD.postman_collection.json`. Teste o fluxo integrado com contas separadas: aprovar organizador, criar evento e serviços requeridos, aprovar fornecedor, enviar proposta, aceitar a proposta e conferir o cálculo do ticket.

## Problemas comuns

- `npm install` com `ENOENT package.json`: você está no diretório errado. Entre em `Backend` ou `Frontend` antes de executar o comando.
- `{"erro":"Rota não encontrada: GET /"}` em `localhost:3333`: você abriu a raiz da API. Use `localhost:5173` para o site e `localhost:3333/api/health` para a verificação da API.
- Tela branca em `localhost:5173`: confira o terminal do Vite e o Console do navegador (F12). O endereço deve estar servindo o frontend, não o backend; se o Vite anunciar `5174`, use essa porta.
- Erro de banco: confirme que MySQL está iniciado no XAMPP e compare `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` com sua instalação.

## Segurança

Esta versão é voltada a desenvolvimento e avaliação acadêmica. Antes de publicar, configure segredos próprios, HTTPS, backups, controles de acesso, proteção e retenção apropriada de documentos e testes de segurança. Não versionar `Backend/.env`, `Frontend/.env` ou dados privados de uploads.

## Última atualização consolidada — 17/10/2026

As mudanças de interface e fluxo mais recentes estão descritas em [`DOCUMENTACAO/ATUALIZACAO_PERFIL_TEMA_EVENTOS_2026-10-17.md`](DOCUMENTACAO/ATUALIZACAO_PERFIL_TEMA_EVENTOS_2026-10-17.md). Elas incluem o seletor de tema claro/escuro, ajuste do logo, redirecionamento pós-cadastro para o dashboard, abas de estado dos eventos e um layout único de perfil para organizadores e fornecedores.

**Eventos rejeitados não são excluídos automaticamente.** A administração altera o campo de aprovação no MySQL; o organizador mantém acesso ao registro na aba de eventos recusados/cancelados, e fornecedores deixam de ver o evento rejeitado nas oportunidades disponíveis.

## Relatório financeiro e contatos após proposta aceita

A tela `Organizador > Relatório financeiro` pode ser aberta a partir dos detalhes de cada evento. Ela permite consultar uma versão preliminar durante o planejamento e identifica como consolidado o orçamento quando todos os serviços requeridos possuem uma estimativa ou proposta aceita. O botão de exportação abre a impressão do navegador; escolha “Salvar como PDF”. Consulte `DOCUMENTACAO/RELATORIO_FINANCEIRO_E_CONTATOS.md` para regras, fórmulas e permissões.

Depois que um organizador aceita uma proposta, `GET /api/proposals` inclui os dados de contato comercial daquele fornecedor somente para o organizador dono da proposta. Propostas pendentes ou recusadas não revelam esses dados na resposta.

## Orçamento de referência por serviço

No formulário **Serviços requeridos**, o campo **Orçamento de referência (R$)** é o valor total que o organizador estima gastar com aquele serviço (não é média de mercado nem preço por unidade). Ele serve para o planejamento financeiro e para o cálculo do ticket; uma proposta aceita substitui esse valor no custo consolidado do mesmo serviço.

Por padrão, o orçamento é privado para fornecedores. O organizador pode marcar **Compartilhar este orçamento de referência com os fornecedores** para exibi-lo na oportunidade e na tela de envio de proposta. Quando desmarcado, o backend remove o valor das respostas de eventos destinadas a fornecedores, não apenas o esconde na interface. Para bancos já existentes, a coluna `exibir_orcamento_fornecedor` é adicionada automaticamente quando o backend inicia, com padrão `0` (privado); não é necessário reimportar o SQL.

Mais detalhes em [`DOCUMENTACAO/ORCAMENTO_REFERENCIA_SERVICO.md`](DOCUMENTACAO/ORCAMENTO_REFERENCIA_SERVICO.md).


## Negociação de propostas e comissão administrativa

O fornecedor aprovado envia uma proposta vinculada a um serviço específico. O backend bloqueia um segundo envio do mesmo fornecedor para o mesmo serviço/evento (HTTP 409); propostas ainda em análise podem ser editadas. O organizador pode aceitar, recusar ou enviar uma contraproposta contendo valor total, quantidade e descrição. Quando o fornecedor aceita a contraproposta, o valor e as condições são atualizados na própria proposta, e os painéis dos dois perfis recebem a situação atualizada.

O fornecedor possui relatório comercial com contagem de propostas aceitas, recusadas e em análise e o valor bruto das propostas aceitas. Esse valor não é lucro líquido do fornecedor, pois a plataforma não desconta despesas, tributos ou custos operacionais dele.

Nos detalhes administrativos de cada evento, a equipe pode definir a taxa da TrocaTicket e consultar a comissão projetada para públicos mínimo, médio e máximo. A opção foi mantida dentro do cadastro do evento, sem uma aba financeira separada no menu. A taxa (`eventos.taxa_plataforma`) é informação administrativa e não é enviada nas respostas públicas dos eventos. A comissão é uma projeção sobre a receita estimada, não uma cobrança ou transação real.

Para bancos existentes, o backend verifica e adiciona `eventos.taxa_plataforma` automaticamente na inicialização. Também tenta criar o índice único `uq_proposta_fornecedor_servico`; se o banco já possuir propostas duplicadas antigas para o mesmo serviço, a migração preserva o histórico e registra um aviso. A API continua bloqueando novos envios repetidos.

## Atualização de 04/11/2026

Além das funcionalidades já descritas, esta consolidação inclui a área de relatório comercial do fornecedor, contrapropostas, edição de proposta pendente, proteção reforçada contra proposta duplicada, perfil público do organizador, projeções da comissão administrativa e correção de navegação da logo dos dashboards para a área do perfil conectado. O SQL de `BD/banco.sql` foi alinhado ao `Backend/database/schema.sql`.


## Documentação do banco de dados

A descrição das tabelas, campos, tipos MySQL, chaves primárias/estrangeiras, índices e migrações está em [`BD/README.md`](BD/README.md). O script de criação está em [`BD/banco.sql`](BD/banco.sql) e sua cópia usada pelo backend em [`Backend/database/schema.sql`](Backend/database/schema.sql).
## Responsividade

A camada de estilos mobile-first está em `Frontend/src/responsive.css`. Estratégia de breakpoints, componentes cobertos e roteiro de validação: [DOCUMENTACAO/RESPONSIVIDADE_MOBILE_FIRST.md](DOCUMENTACAO/RESPONSIVIDADE_MOBILE_FIRST.md).
