import test from 'node:test';
import assert from 'node:assert/strict';
import { construirServicosRelatorio } from '../src/relatorioFinanceiro.js';

test('marca relatório consolidado quando todos os serviços têm estimativa', () => {
  const resultado = construirServicosRelatorio([
    { id: 'a', categoria: 'Estrutura', descricao: 'Palco', valor_estimado: 1000 },
    { id: 'b', categoria: 'Segurança', descricao: 'Equipe', valor_estimado: 800 },
  ], [], []);
  assert.equal(resultado.status, 'CONSOLIDADO');
  assert.equal(resultado.totalServicos, 2);
  assert.equal(resultado.servicosComCusto, 2);
  assert.equal(resultado.servicosPendentes.length, 0);
});

test('uma proposta aceita substitui o custo estimado do mesmo serviço', () => {
  const resultado = construirServicosRelatorio(
    [{ id: 'a', descricao: 'Som', valor_estimado: 700 }],
    [],
    [{ id: 'p1', item_id: 'a', valor: 950, status: 'ACEITA', fornecedor_id: 'f1' }],
  );
  assert.equal(resultado.servicos[0].valorConsiderado, 950);
  assert.equal(resultado.servicos[0].origemCusto, 'PROPOSTA_ACEITA');
  assert.equal(resultado.status, 'CONSOLIDADO');
});

test('cria linha pendente para demanda ainda sem item ou custo', () => {
  const resultado = construirServicosRelatorio([], [{ id: 'r1', categoria: 'Buffet', descricao: 'Comida' }], []);
  assert.equal(resultado.status, 'PRELIMINAR');
  assert.equal(resultado.servicosPendentes.length, 1);
  assert.equal(resultado.servicosPendentes[0].descricao, 'Comida');
});

test('não considera proposta em análise como custo consolidado', () => {
  const resultado = construirServicosRelatorio(
    [{ id: 'a', descricao: 'Som' }],
    [],
    [{ id: 'p1', item_id: 'a', valor: 950, status: 'EM ANÁLISE', fornecedor_id: 'f1' }],
  );
  assert.equal(resultado.status, 'PRELIMINAR');
  assert.equal(resultado.servicosPendentes.length, 1);
});
