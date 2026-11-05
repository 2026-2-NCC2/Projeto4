# Auditoria do projeto contra o enunciado do PI

Base: `PI_2CCOMP_2CCOMP_202602_TrocaTicket.pdf`, anexado à conversa em 14/10/2026. A auditoria distingue os recursos presentes no código dos entregáveis acadêmicos que precisam ser comprovados pela equipe.

## Requisitos funcionais do sistema

| Requisito do enunciado | Situação no código preparado | Observação / evidência |
|---|---|---|
| RF01 - Autocadastro de organizador | Implementado | API de cadastro, perfil e status de aprovação. |
| RF02 - Autocadastro de fornecedor | Implementado | Cadastro separado por perfil e campos complementares. |
| RF03 - Aprovação/rejeição de cadastros | Implementado | Administração separa pendentes e verificados, preservando o registro. |
| RF04 - Autenticação e perfis | Implementado com ressalvas de validação final | Senhas com hash, sessão validada pelo backend e rotas por perfil; confirmar com testes integrados locais. |
| RF05 - Cadastro/consulta/edição de eventos | Implementado | Há endpoints de criar, consultar, atualizar e excluir; editar evento volta para aprovação pendente. |
| RF06 - Itens de composição de custo | Implementado | Cadastro, listagem, edição, exclusão e valor estimado por item. |
| RF07 - Custos fora de propostas | Implementado | O campo de estimativa manual aceita custos fiscais, operacionais, variáveis e outras categorias. |
| RF08 - Publicação para cotação | Implementado | A API lista para fornecedores apenas eventos aprovados e de organizadores aprovados. |
| RF09 - Consulta de eventos pelo fornecedor | Implementado | A API verifica aprovação do fornecedor e do evento. |
| RF10 - Envio de proposta | Implementado | Proposta vinculada a evento e opcionalmente ao item, com valor, validade, descrição e observações. |
| RF11 - Comparar propostas | Implementado na interface atual, requer teste de ponta a ponta | Organizador consulta propostas recebidas; validar no XAMPP com contas de perfis diferentes. |
| RF12 - Selecionar proposta e consolidar orçamento | Implementado | Aceitar proposta atualiza seu status e, no mesmo item, recusa a proposta antes aceita; o cálculo reflete a seleção. |
| RF13 - Cálculo do ticket | Implementado nesta versão | Tela nova de ticket de equilíbrio e ticket-alvo para público mínimo e máximo; fórmula documentada em `CALCULO_TICKET.md`. |
| RF14 - Visão administrativa/relatórios | Parcial | Administração vê cadastros, eventos e resumo de precificação por evento. Relatórios exportáveis/agregações gerenciais ainda podem ser ampliados. |

## Requisitos não funcionais e técnicos

- **MySQL e persistência:** o projeto usa `mysql2` e XAMPP. `Backend/database/schema.sql` e `BD/banco.sql` são os scripts de instalação; devem permanecer sincronizados.
- **Migração de status de evento:** o backend adiciona a coluna `status_aprovacao` e seu índice em bancos existentes. Não é necessário apagar os registros nem recriar o banco.
- **Sem pagamento ou venda de ingresso:** intencional, conforme o escopo do MVP no PDF.
- **Sem dados de exemplo no formulário de evento:** as demandas de fornecedores começam vazias; só são persistidas aquelas informadas pelo organizador.
- **Controle de acesso:** rotas verificam usuário, perfil e propriedade dos registros no backend. Isso precisa ser confirmado por testes HTTP, não apenas por esconder botões.
- **Postman:** a collection entregue em `DOCUMENTACAO/Postman/TrocaTicket_CRUD.postman_collection.json` contém login, CRUD de evento e cenários de erro. Use uma conta real de organizador aprovada e configure as variáveis conforme o README.
- **Testes automatizados:** `cd Backend` e `npm test` executa testes unitários da fórmula de precificação. Eles não substituem o teste integral com MySQL ativo.

## Entregáveis acadêmicos que não são comprovados só pelo código

O PDF também pede atividades específicas por Unidade Curricular. Os arquivos fornecidos nesta conversa não permitem confirmar que todos estejam entregues. Antes da entrega final, a equipe deve verificar se o repositório contém:

- protótipo navegável no Figma ou equivalente;
- modelo/diagrama do banco e README da pasta `BD` (há documentação SQL e textual, mas o diagrama visual precisa ser conferido);
- mapa de processo-chave em PDF, com início, etapas, fim, gargalos e melhorias;
- documento de Gestão Empresarial com missão, visão, valores e proposta de valor;
- entrega de Cálculo II com polinômio de Taylor de ordem 3 e comparação gráfico/função (E1), além de máximos, mínimos, concavidade e inflexão (E2), aplicados a uma variável/função justificada;
- documento final de extensão, banner, pitch de até 4 minutos e evidências de demonstração;
- evidências de testes CRUD e erros no Postman (prints ou gravação) e collection exportada;
- instruções de execução, commits/histórico e URL publicada funcionando.

Esta lista não afirma que esses materiais inexistem em outros locais; indica que não foram validados como parte dos arquivos de código examinados.

## Roteiro mínimo de validação local

1. Ligar MySQL no XAMPP e testar `http://localhost:3333/api/health`.
2. Rodar `npm test` dentro de `Backend`.
3. Rodar `npm run build` dentro de `Frontend`.
4. Testar autocadastro -> aprovação administrativa -> criar evento -> adicionar custos -> fornecedor aprovado envia proposta -> organizador aceita proposta -> precificação dos cenários mínimo/máximo.
5. Confirmar que eventos pendentes/rejeitados não aparecem a fornecedores e que a alteração de dados volta para fila de análise.
6. Executar a collection Postman e guardar evidências para o repositório.
