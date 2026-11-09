import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularPrecificacao } from '../src/precificacao.js';

test('calcula equilíbrio e ticket-alvo para público mínimo e máximo', () => {
  const resultado = calcularPrecificacao(
    { id: 'ev-1', nome: 'Evento teste', publico_minimo: 100, publico_maximo: 200, margem_lucro: 20 },
    [{ id: 'c1', categoria: 'Estrutura', descricao: 'Palco', valor_estimado: 1000 }],
    []
  );
  assert.equal(resultado.totalCustos, 1000);
  assert.equal(resultado.cenarios.minimo.ticketEquilibrio, 10);
  assert.equal(resultado.cenarios.minimo.ticketAlvo, 12.5);
  assert.equal(resultado.cenarios.maximo.ticketEquilibrio, 5);
  assert.equal(resultado.cenarios.maximo.ticketAlvo, 6.25);
});

test('proposta aceita substitui estimativa do mesmo item, sem duplicar custo', () => {
  const resultado = calcularPrecificacao(
    { id: 'ev-1', publico_minimo: 100, publico_maximo: 200, margem_lucro: 20 },
    [{ id: 'c1', categoria: 'Som', descricao: 'Som', valor_estimado: 800 }],
    [{ id: 'p1', item_id: 'c1', valor: 500, status: 'ACEITA', atualizada_em: '2026-01-01 10:00:00' }]
  );
  assert.equal(resultado.totalCustos, 500);
  assert.equal(resultado.componentes.length, 1);
  assert.equal(resultado.componentes[0].origem, 'PROPOSTA_ACEITA');
});

test('inclui proposta aceita sem item e custo adicional estimado', () => {
  const resultado = calcularPrecificacao(
    { publico_minimo: 10, publico_maximo: 20, margem_lucro: 0 },
    [{ id: 'c1', categoria: 'Operacional', descricao: 'Licença', valor_estimado: 100 }],
    [{ id: 'p1', item_id: null, valor: 50, status: 'ACEITA' }]
  );
  assert.equal(resultado.totalCustos, 150);
  assert.equal(resultado.componentes.length, 2);
});

test('não calcula ticket com margem inválida ou público ausente', () => {
  const margemInvalida = calcularPrecificacao({ publico_minimo: 10, publico_maximo: 20, margem_lucro: 100 }, [{ id: 'c1', valor_estimado: 50 }], []);
  assert.equal(margemInvalida.cenarios.minimo, null);
  assert.ok(margemInvalida.alertas.some((alerta) => alerta.includes('margem')));
  const publicoAusente = calcularPrecificacao({ publico_minimo: 0, publico_maximo: 20, margem_lucro: 10 }, [{ id: 'c1', valor_estimado: 50 }], []);
  assert.equal(publicoAusente.cenarios.minimo, null);
  assert.ok(publicoAusente.alertas.some((alerta) => alerta.includes('público mínimo')));
});


test('não calcula cenários quando o público mínimo supera o máximo', () => {
  const resultado = calcularPrecificacao(
    { publico_minimo: 200, publico_maximo: 100, margem_lucro: 20 },
    [{ id: 'c1', valor_estimado: 1000 }],
    []
  );
  assert.equal(resultado.cenarios.minimo, null);
  assert.equal(resultado.cenarios.maximo, null);
  assert.ok(resultado.alertas.some((alerta) => alerta.includes('mínimo não pode ser maior')));
});


test('usa somente a proposta aceita mais recentemente para um item', () => {
  const resultado = calcularPrecificacao(
    { publico_minimo: 10, publico_maximo: 20, margem_lucro: 20 },
    [{ id: 'c1', categoria: 'Som', descricao: 'Som', valor_estimado: 900 }],
    [
      { id: 'p-antiga', item_id: 'c1', valor: 500, status: 'ACEITA', atualizada_em: '2026-01-01 10:00:00' },
      { id: 'p-nova', item_id: 'c1', valor: 450, status: 'ACEITA', atualizada_em: '2026-02-01 10:00:00' }
    ]
  );
  assert.equal(resultado.totalCustos, 450);
  assert.equal(resultado.componentes.length, 1);
  assert.equal(resultado.componentes[0].propostaId, 'p-nova');
  assert.ok(resultado.alertas.some((alerta) => alerta.includes('mais de uma proposta')));
});


test('inclui comissão da TrocaTicket no equilíbrio e no ticket-alvo', () => {
  const resultado = calcularPrecificacao(
    { id: 'ev-fee', publico_minimo: 600, publico_maximo: 600, margem_lucro: 20, taxa_plataforma: 5 },
    [{ id: 'c1', descricao: 'Estrutura', valor_estimado: 30000 }],
    []
  );
  const cenario = resultado.cenarios.minimo;
  assert.equal(cenario.ticketEquilibrio, 52.64);
  assert.equal(cenario.ticketAlvo, 66.67);
  assert.equal(cenario.receitaEstimada, 40002);
  assert.equal(cenario.comissaoTrocaTicket, 2000.1);
  assert.equal(cenario.resultadoOrganizador, 8001.9);
  assert.ok(cenario.margemEfetiva >= 20);
});

test('bloqueia cálculo quando margem e comissão somadas chegam a 100%', () => {
  const resultado = calcularPrecificacao(
    { publico_minimo: 100, publico_maximo: 200, margem_lucro: 70, taxa_plataforma: 30 },
    [{ id: 'c1', valor_estimado: 1000 }],
    []
  );
  assert.ok(resultado.cenarios.minimo);
  assert.equal(resultado.cenarios.minimo.ticketAlvo, null);
  assert.ok(resultado.alertas.some((alerta) => alerta.includes('soma da margem')));
});

test('a comissão zero preserva a fórmula anterior do enunciado', () => {
  const resultado = calcularPrecificacao(
    { publico_minimo: 100, publico_maximo: 200, margem_lucro: 20, taxa_plataforma: 0 },
    [{ id: 'c1', valor_estimado: 1000 }],
    []
  );
  assert.equal(resultado.cenarios.minimo.ticketEquilibrio, 10);
  assert.equal(resultado.cenarios.minimo.ticketAlvo, 12.5);
  assert.equal(resultado.cenarios.minimo.comissaoTrocaTicket, 0);
});


test('calcula dois tickets: cobertura de custos com comissão e ticket com margem do organizador', () => {
  const resultado = calcularPrecificacao(
    { id: 'ev-comissao', publico_minimo: 600, publico_maximo: 600, margem_lucro: 20, taxa_plataforma: 5 },
    [{ id: 'c1', categoria: 'Estrutura', descricao: 'Custos do evento', valor_estimado: 30000 }],
    [],
  );
  const cenario = resultado.cenarios.minimo;
  assert.equal(cenario.ticketCoberturaCustos, 52.64);
  assert.equal(cenario.ticketEquilibrio, 52.64);
  assert.equal(cenario.comissaoCobertura, 1579.2);
  assert.equal(cenario.ticketAlvo, 66.67);
  assert.equal(cenario.comissaoTrocaTicket, 2000.1);
  assert.equal(cenario.lucroEstimado, 8001.9);
  assert.ok(cenario.margemLucroEfetiva >= 20);
  assert.equal(resultado.taxaPlataforma, 5);
});

test('mantém o ticket de cobertura quando comissão + margem inviabilizam o segundo ticket', () => {
  const resultado = calcularPrecificacao(
    { publico_minimo: 100, publico_maximo: 100, margem_lucro: 60, taxa_plataforma: 40 },
    [{ id: 'c1', valor_estimado: 1000 }],
    [],
  );
  const cenario = resultado.cenarios.minimo;
  assert.equal(cenario.ticketCoberturaCustos, 16.67);
  assert.equal(cenario.ticketAlvo, null);
  assert.ok(resultado.alertas.some((alerta) => alerta.includes('precisa ser menor que 100%')));
});
