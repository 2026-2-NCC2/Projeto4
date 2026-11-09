import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPoliticaOrcamentoFornecedor, deveExibirOrcamentoFornecedor } from '../src/orcamentoReferencia.js';

test('orçamento fica privado por padrão e não vaza por campos alternativos', () => {
  const entrada = {
    id: 'svc-1', valorEstimado: 1200, valor_estimado: 1200,
    valorReferencia: 1180, orcamentoReferencia: 1150,
    mostrarOrcamentoFornecedor: false,
  };
  const resultado = aplicarPoliticaOrcamentoFornecedor({ itensCusto: [entrada], requisicoesFornecedores: [entrada] });
  for (const item of [...resultado.itensCusto, ...resultado.requisicoesFornecedores]) {
    assert.equal(item.mostrarOrcamentoFornecedor, false);
    assert.equal('valorEstimado' in item, false);
    assert.equal('valor_estimado' in item, false);
    assert.equal('valorReferencia' in item, false);
    assert.equal('orcamentoReferencia' in item, false);
  }
});

test('orçamento é visível quando o organizador opta por compartilhar', () => {
  const entrada = { id: 'svc-2', valorEstimado: 2400, mostrarOrcamentoFornecedor: true };
  const resultado = aplicarPoliticaOrcamentoFornecedor({ itensCusto: [entrada], requisicoesFornecedores: [] });
  assert.equal(resultado.itensCusto[0].mostrarOrcamentoFornecedor, true);
  assert.equal(resultado.itensCusto[0].valorEstimado, 2400);
});

test('requisicao antiga não revela orçamento quando o item vinculado está privado', () => {
  const item = { id: 'svc-3', valorEstimado: 5000, mostrarOrcamentoFornecedor: false };
  const requisicaoAntiga = { id: 'svc-3', descricao: 'Som e luz', valorEstimado: 5000, mostrarOrcamentoFornecedor: true };
  const resultado = aplicarPoliticaOrcamentoFornecedor({ itensCusto: [item], requisicoesFornecedores: [requisicaoAntiga] });
  assert.equal(resultado.itensCusto[0].valorEstimado, undefined);
  assert.equal(resultado.requisicoesFornecedores[0].valorEstimado, undefined);
  assert.equal(resultado.requisicoesFornecedores[0].mostrarOrcamentoFornecedor, false);
});

test('flag só considera valores explicitamente ativos', () => {
  assert.equal(deveExibirOrcamentoFornecedor({ mostrarOrcamentoFornecedor: 1 }), true);
  assert.equal(deveExibirOrcamentoFornecedor({ mostrarOrcamentoFornecedor: '1' }), true);
  assert.equal(deveExibirOrcamentoFornecedor({ mostrarOrcamentoFornecedor: false }), false);
  assert.equal(deveExibirOrcamentoFornecedor({}), false);
});
