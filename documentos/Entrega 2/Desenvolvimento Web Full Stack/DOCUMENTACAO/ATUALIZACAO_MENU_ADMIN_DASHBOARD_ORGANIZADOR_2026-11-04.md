# Atualização de navegação administrativa e dashboard do organizador

## Alterações

- Removida a aba separada **Financeiro** da tela `Administrador > Eventos`. A tela mantém apenas as abas **Para verificar** e **Verificados**.
- Mantida a consulta da comissão por evento dentro dos detalhes administrativos do respectivo evento. A taxa continua sendo dado administrativo e não é exposta aos fornecedores.
- O dashboard do organizador voltou a apresentar três indicadores: **Eventos cadastrados**, **Gastos estimados - todos os eventos** e **Propostas pendentes**.
- Removido o card genérico **Resultado estimado - público médio**, que somava cenários de diferentes eventos e não identificava a qual evento o resultado pertencia.

## Arquivos alterados

- `Frontend/src/pages/DashBoard/Administrador/Eventos/index.jsx`
- `Frontend/src/pages/DashBoard/Organizador/index.jsx`
- `README.md`

## Banco de dados

Nenhuma alteração no banco MySQL é necessária. Não executar novamente os scripts SQL para aplicar esta atualização.
