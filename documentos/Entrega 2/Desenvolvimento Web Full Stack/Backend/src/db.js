import mysql from 'mysql2/promise';
import 'dotenv/config';

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'TrocaTicket',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,
  decimalNumbers: true,
};

export const db = mysql.createPool(config);

export async function get(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows[0] ?? null;
}

export async function all(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

export async function run(sql, params = []) {
  const [result] = await db.execute(sql, params);
  return result;
}

export async function testarConexao() {
  await db.query('SELECT 1');
  return true;
}

// Adiciona a coluna de aprovação de eventos em bancos MySQL já existentes,
// sem apagar ou recriar registros. Eventos antigos entram como pendentes.
export async function garantirMigracoes() {
  const coluna = await get(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventos' AND COLUMN_NAME = 'status_aprovacao'"
  );
  if (!coluna) {
    await db.query("ALTER TABLE eventos ADD COLUMN status_aprovacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' AFTER status");
  }
  const colunaValorEstimado = await get(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'itens_custo' AND COLUMN_NAME = 'valor_estimado'"
  );
  if (!colunaValorEstimado) {
    await db.query('ALTER TABLE itens_custo ADD COLUMN valor_estimado DECIMAL(12,2) NULL AFTER status');
  }
  // Por padrão, o orçamento de referência é privado. O organizador pode optar
  // por compartilhá-lo com fornecedores para cada serviço requerido.
  const colunaCompartilhamentoOrcamento = await get(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'itens_custo' AND COLUMN_NAME = 'exibir_orcamento_fornecedor'"
  );
  if (!colunaCompartilhamentoOrcamento) {
    await db.query('ALTER TABLE itens_custo ADD COLUMN exibir_orcamento_fornecedor TINYINT(1) NOT NULL DEFAULT 0 AFTER valor_estimado');
  }
  const indice = await get(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eventos' AND INDEX_NAME = 'idx_eventos_aprovacao' LIMIT 1"
  );
  if (!indice) {
    await db.query('CREATE INDEX idx_eventos_aprovacao ON eventos (status_aprovacao)');
  }
}

export function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function json(value) {
  return JSON.stringify(value ?? {});
}

export function userPublico(row) {
  if (!row) return null;
  const dados = parseJson(row.dados_json, {});
  const { senha_hash: _senhaHash, dados_json: _dadosJson, ...base } = row;
  return {
    ...base,
    ...dados,
    id: row.id,
    nome: row.nome,
    email: row.email,
    perfil: row.perfil,
    status: row.status,
  };
}

export async function eventoPublico(row) {
  if (!row) return null;
  const dados = parseJson(row.dados_json, {});
  const [itens, requisicoes] = await Promise.all([
    all('SELECT * FROM itens_custo WHERE evento_id = ? ORDER BY criado_em, id', [row.id]),
    all('SELECT * FROM requisicoes_fornecedor WHERE evento_id = ? ORDER BY criado_em, id', [row.id]),
  ]);
  const itensCusto = itens.map((item) => ({
    ...parseJson(item.dados_json, {}),
    id: item.id,
    categoria: item.categoria,
    descricao: item.descricao,
    status: item.status,
    valorEstimado: item.valor_estimado,
    // O valor real é sempre devolvido ao organizador. Nas respostas destinadas
    // ao fornecedor, uma camada adicional aplica a política de visibilidade.
    mostrarOrcamentoFornecedor: Number(item.exibir_orcamento_fornecedor) === 1,
  }));
  const requisicoesFornecedores = requisicoes.map((item) => ({
    ...parseJson(item.dados_json, {}),
    id: item.id,
    categoria: item.categoria,
    descricao: item.descricao,
  }));
  return {
    ...dados,
    id: row.id,
    organizadorId: row.organizador_id,
    nome: row.nome,
    categoria: row.categoria,
    descricao: row.descricao,
    dataInicio: row.data_inicio,
    horaInicio: row.hora_inicio,
    dataFim: row.data_fim,
    horaFim: row.hora_fim,
    local: row.local,
    cidade: row.cidade,
    publicoMinimo: row.publico_minimo,
    publicoMaximo: row.publico_maximo,
    margemLucro: row.margem_lucro,
    capa: row.capa,
    status: row.status,
    statusAprovacao: row.status_aprovacao || 'PENDENTE',
    itensCusto,
    requisicoesFornecedores,
  };
}

export async function propostaPublica(row) {
  if (!row) return null;
  const dados = parseJson(row.dados_json, {});
  const [evento, item, fornecedor] = await Promise.all([
    get('SELECT nome FROM eventos WHERE id = ?', [row.evento_id]),
    row.item_id ? get('SELECT categoria, descricao FROM itens_custo WHERE id = ?', [row.item_id]) : Promise.resolve(null),
    get('SELECT nome FROM usuarios WHERE id = ?', [row.fornecedor_id]),
  ]);
  return {
    ...dados,
    id: row.id,
    eventoId: row.evento_id,
    evento: dados.evento || evento?.nome || 'Evento removido',
    itemId: row.item_id,
    item: dados.item || item?.descricao || 'Item removido',
    categoria: dados.categoria || item?.categoria || '',
    fornecedorId: row.fornecedor_id,
    fornecedor: fornecedor?.nome || '',
    organizadorId: row.organizador_id,
    valor: row.valor,
    validade: row.validade,
    descricao: row.descricao,
    observacoes: row.observacoes,
    status: row.status,
    criadaEm: row.criada_em,
  };
}
