import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'node:fs';
import { db, get, all, run, testarConexao, garantirMigracoes, json, parseJson, userPublico, eventoPublico, propostaPublica } from './db.js';
import { calcularPrecificacao } from './precificacao.js';
import { construirServicosRelatorio } from './relatorioFinanceiro.js';
import { aplicarPoliticaOrcamentoFornecedor, deveExibirOrcamentoFornecedor } from './orcamentoReferencia.js';

const app = express();
const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const diretorioUploads = path.join(raizBackend, 'uploads');
fs.mkdirSync(diretorioUploads, { recursive: true });
const uploadDocumento = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, diretorioUploads),
    filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const permitido = ['application/pdf', 'image/png', 'image/jpeg'].includes(file.mimetype);
    callback(permitido ? null : new Error('Formato inválido. Envie PDF, PNG ou JPG.'), permitido);
  },
});

const PORT = Number(process.env.PORT || 3333);
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
if (!JWT_SECRET || JWT_SECRET.length < 32 || (isProduction && JWT_SECRET === 'troque-esta-chave-por-uma-chave-aleatoria-longa-antes-de-usar')) {
  if (isProduction) throw new Error('Configure JWT_SECRET com uma chave própria, aleatória e com pelo menos 32 caracteres no ambiente de produção.');
  console.warn('AVISO: defina um JWT_SECRET aleatório e com pelo menos 32 caracteres no arquivo .env.');
}

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    const permitidas = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((item) => item.trim());
    if (!origin || permitidas.includes(origin)) return callback(null, true);
    return callback(new Error('Origem não autorizada pelo CORS.'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '10mb' }));

// O rate limit fica somente nos endpoints de autenticação, sem bloquear consultas de sessão.
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' },
});
const limitarCadastro = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.' },
});

const idNovo = () => crypto.randomUUID();
const preparar = (valor) => String(valor ?? '').trim();
const emailNormalizado = (valor) => preparar(valor).toLowerCase();
const booleanoAtivo = (valor) => valor === true || valor === 1 || valor === '1' || valor === 'true';
const valorMonetarioOpcional = (valor) => valor == null || String(valor).trim() === '' ? null : Number(valor);
const dataIsoValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};
const emitirToken = (usuario) => jwt.sign({ sub: usuario.id, perfil: usuario.perfil }, JWT_SECRET || 'chave-local-insegura-apenas-desenvolvimento', { expiresIn: '8h' });
const erro = (res, status, mensagem) => res.status(status).json({ erro: mensagem });

async function autenticado(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  if (!token) return erro(res, 401, 'Faça login para continuar.');
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET || 'chave-local-insegura-apenas-desenvolvimento');
  } catch {
    return erro(res, 401, 'Sessão expirada ou inválida. Entre novamente.');
  }
  try {
    const row = await get('SELECT * FROM usuarios WHERE id = ?', [payload.sub]);
    if (!row) return erro(res, 401, 'Sessão inválida. Entre novamente.');
    if (row.status === 'REJEITADO') return erro(res, 403, 'Este cadastro foi rejeitado. Entre em contato com a administração.');
    req.usuario = userPublico(row);
    return next();
  } catch (e) {
    return next(e);
  }
}

function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) return erro(res, 403, 'Você não tem permissão para executar esta ação.');
    next();
  };
}

async function salvarEvento(dados, organizadorId, id) {
  const atual = await get('SELECT * FROM eventos WHERE id = ?', [id]);
  if (atual && atual.organizador_id !== organizadorId) {
    const e = new Error('Você não pode alterar este evento.');
    e.status = 403;
    throw e;
  }
  const nome = preparar(dados.nome);
  if (!nome) {
    const e = new Error('O nome do evento é obrigatório.');
    e.status = 400;
    throw e;
  }
  const publicoMinimo = Number(dados.publicoMinimo);
  const publicoMaximo = Number(dados.publicoMaximo);
  const margemLucro = Number(dados.margemLucro ?? 0);
  const dataInicio = preparar(dados.dataInicio);
  const dataFim = preparar(dados.dataFim);
  if (!dataInicio || !dataFim || !preparar(dados.local)) {
    const e = new Error('Informe as datas de início e término e o local do evento.');
    e.status = 400;
    throw e;
  }
  if (!dataIsoValida(dataInicio) || !dataIsoValida(dataFim) || dataInicio > dataFim) {
    const e = new Error('Informe datas válidas no formato AAAA-MM-DD e confira se o término não antecede o início.');
    e.status = 400;
    throw e;
  }
  if (!Number.isInteger(publicoMinimo) || publicoMinimo <= 0 || !Number.isInteger(publicoMaximo) || publicoMaximo <= 0) {
    const e = new Error('Público mínimo e máximo precisam ser números inteiros maiores que zero.');
    e.status = 400;
    throw e;
  }
  if (publicoMinimo > publicoMaximo) {
    const e = new Error('O público mínimo não pode ser maior que o público máximo.');
    e.status = 400;
    throw e;
  }
  if (!Number.isFinite(margemLucro) || margemLucro < 0 || margemLucro >= 100) {
    const e = new Error('A margem de lucro deve estar entre 0% e menos de 100%.');
    e.status = 400;
    throw e;
  }
  const itensCusto = Array.isArray(dados.itensCusto) ? dados.itensCusto : [];
  const requisicoes = Array.isArray(dados.requisicoesFornecedores) ? dados.requisicoesFornecedores : [];
  for (const item of [...itensCusto, ...requisicoes]) {
    if (!item) continue;
    const valorBruto = item.valorEstimado ?? item.valor_estimado;
    const valorEstimado = valorMonetarioOpcional(valorBruto);
    if (valorEstimado !== null && (!Number.isFinite(valorEstimado) || valorEstimado < 0)) {
      const e = new Error('O orçamento de referência deve ser um valor total estimado maior ou igual a zero.');
      e.status = 400;
      throw e;
    }
    if (deveExibirOrcamentoFornecedor(item) && !(valorEstimado > 0)) {
      const e = new Error('Informe um orçamento de referência maior que zero antes de compartilhá-lo com fornecedores.');
      e.status = 400;
      throw e;
    }
  }
  const conteudo = { ...dados };
  delete conteudo.senha;
  delete conteudo.itensCusto;
  delete conteudo.requisicoesFornecedores;
  delete conteudo.capa;

  await run(`INSERT INTO eventos
    (id, organizador_id, nome, categoria, descricao, data_inicio, hora_inicio, data_fim, hora_fim, \`local\`, cidade,
     publico_minimo, publico_maximo, margem_lucro, capa, status, status_aprovacao, dados_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?)
    ON DUPLICATE KEY UPDATE nome=VALUES(nome), categoria=VALUES(categoria), descricao=VALUES(descricao),
     data_inicio=VALUES(data_inicio), hora_inicio=VALUES(hora_inicio), data_fim=VALUES(data_fim), hora_fim=VALUES(hora_fim),
     \`local\`=VALUES(\`local\`), cidade=VALUES(cidade), publico_minimo=VALUES(publico_minimo), publico_maximo=VALUES(publico_maximo),
     margem_lucro=VALUES(margem_lucro), capa=VALUES(capa), status=VALUES(status), status_aprovacao='PENDENTE', dados_json=VALUES(dados_json)`, [
    id,
    organizadorId,
    nome,
    preparar(dados.categoria) || null,
    preparar(dados.descricao) || null,
    preparar(dados.dataInicio) || null,
    preparar(dados.horaInicio) || null,
    preparar(dados.dataFim) || null,
    preparar(dados.horaFim) || null,
    preparar(dados.local) || null,
    preparar(dados.cidade) || null,
    publicoMinimo,
    publicoMaximo,
    margemLucro,
    typeof dados.capa === 'string' && (dados.capa.startsWith('data:') || dados.capa.startsWith('https://')) ? dados.capa : null,
    preparar(dados.status) || 'Planejamento',
    json(conteudo),
  ]);

  for (const requisicao of requisicoes) {
    if (!requisicao || !preparar(requisicao.categoria) || !preparar(requisicao.descricao)) continue;
    const bruto = String(requisicao.id || '');
    let reqId = bruto.length >= 20 ? bruto : idNovo();
    const reqExistente = await get('SELECT evento_id FROM requisicoes_fornecedor WHERE id = ?', [reqId]);
    const itemExistente = await get('SELECT evento_id FROM itens_custo WHERE id = ?', [reqId]);
    if ((reqExistente && reqExistente.evento_id !== id) || (itemExistente && itemExistente.evento_id !== id)) reqId = idNovo();
    await run(`INSERT INTO requisicoes_fornecedor (id, evento_id, categoria, descricao, dados_json)
      VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE categoria=VALUES(categoria), descricao=VALUES(descricao), dados_json=VALUES(dados_json)`,
    [reqId, id, preparar(requisicao.categoria), preparar(requisicao.descricao), json(requisicao)]);
    const valorRequisicao = valorMonetarioOpcional(requisicao.valorEstimado ?? requisicao.valor_estimado);
    const mostrarOrcamentoRequisicao = deveExibirOrcamentoFornecedor(requisicao);
    await run(`INSERT INTO itens_custo (id, evento_id, categoria, descricao, status, valor_estimado, exibir_orcamento_fornecedor, dados_json)
      VALUES (?, ?, ?, ?, 'Aberto para cotação', ?, ?, ?) ON DUPLICATE KEY UPDATE categoria=VALUES(categoria), descricao=VALUES(descricao),
      status=VALUES(status), valor_estimado=VALUES(valor_estimado), exibir_orcamento_fornecedor=VALUES(exibir_orcamento_fornecedor), dados_json=VALUES(dados_json)`,
    [reqId, id, preparar(requisicao.categoria), preparar(requisicao.descricao), valorRequisicao > 0 ? valorRequisicao : null, mostrarOrcamentoRequisicao ? 1 : 0,
      json({ ...requisicao, id: reqId, status: 'Aberto para cotação', valorEstimado: valorRequisicao > 0 ? valorRequisicao : null, mostrarOrcamentoFornecedor: mostrarOrcamentoRequisicao })]);
  }

  for (const item of itensCusto) {
    if (!item || !preparar(item.categoria) || !preparar(item.descricao)) continue;
    let itemId = String(item.id || idNovo());
    const itemExistente = await get('SELECT evento_id FROM itens_custo WHERE id = ?', [itemId]);
    if (itemExistente && itemExistente.evento_id !== id) itemId = idNovo();
    const valorBruto = item.valorEstimado ?? item.valor_estimado;
    const valorEstimado = valorMonetarioOpcional(valorBruto);
    const mostrarOrcamento = deveExibirOrcamentoFornecedor(item);
    await run(`INSERT INTO itens_custo (id, evento_id, categoria, descricao, status, valor_estimado, exibir_orcamento_fornecedor, dados_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE categoria=VALUES(categoria), descricao=VALUES(descricao),
      status=VALUES(status), valor_estimado=VALUES(valor_estimado), exibir_orcamento_fornecedor=VALUES(exibir_orcamento_fornecedor), dados_json=VALUES(dados_json)`,
    [itemId, id, preparar(item.categoria), preparar(item.descricao), preparar(item.status) || 'Rascunho', valorEstimado > 0 ? valorEstimado : null, mostrarOrcamento ? 1 : 0,
      json({ ...item, id: itemId, valorEstimado: valorEstimado > 0 ? valorEstimado : null, mostrarOrcamentoFornecedor: mostrarOrcamento })]);
  }

  return eventoPublico(await get('SELECT * FROM eventos WHERE id = ?', [id]));
}

async function eventoAdministrativo(row) {
  const evento = await eventoPublico(row);
  const organizadorRow = await get('SELECT * FROM usuarios WHERE id = ?', [row.organizador_id]);
  const organizador = userPublico(organizadorRow);
  return {
    ...evento,
    precificacao: await precificacaoDeEvento(row),
    organizador: organizador ? {
      id: organizador.id,
      nome: organizador.nome,
      email: organizador.email,
      status: organizador.status,
      razaoSocial: organizador.razaoSocial || organizador.nome,
      responsavel: organizador.responsavel || '',
      cnpj: organizador.cnpj || '',
      cpf: organizador.cpf || '',
      telefone: organizador.telefone || '',
      cidade: organizador.cidade || '',
      estado: organizador.estado || '',
      descricao: organizador.descricao || '',
      areaAtuacao: organizador.areaAtuacao || organizador.segmento || '',
    } : null,
  };
}

async function eventoParaPerfil(row, perfil) {
  const evento = await eventoPublico(row);
  return perfil === 'FORNECEDOR' ? aplicarPoliticaOrcamentoFornecedor(evento) : evento;
}

async function precificacaoDeEvento(row) {
  const [itens, propostas] = await Promise.all([
    all('SELECT * FROM itens_custo WHERE evento_id = ? ORDER BY criado_em, id', [row.id]),
    all("SELECT * FROM propostas WHERE evento_id = ? AND status = 'ACEITA' ORDER BY atualizada_em DESC, criada_em DESC", [row.id]),
  ]);
  return calcularPrecificacao(row, itens, propostas);
}

// Resposta explicativa para quem abre por engano a raiz da API (porta 3333).
// A interface web continua em http://localhost:5173, servida pelo Vite.
app.get('/', (_req, res) => res.json({
  servico: 'TrocaTicket API',
  mensagem: 'API ativa. Para abrir o site, use http://localhost:5173.',
  health: '/api/health',
}));

app.get('/api/health', async (_req, res, next) => {
  try {
    await testarConexao();
    res.json({ status: 'ok', servico: 'TrocaTicket API', banco: 'conectado', tecnologia: 'MySQL' });
  } catch (e) { next(e); }
});

app.post('/api/auth/register', limitarCadastro, async (req, res, next) => {
  try {
    const nome = preparar(req.body.nome);
    const email = emailNormalizado(req.body.email);
    const senha = String(req.body.senha || '');
    const perfil = preparar(req.body.perfil).toUpperCase();
    if (nome.length < 2) return erro(res, 400, 'Informe seu nome completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 400, 'Informe um e-mail válido.');
    if (senha.length < 8) return erro(res, 400, 'A senha deve possuir no mínimo 8 caracteres.');
    if (!['ORGANIZADOR', 'FORNECEDOR'].includes(perfil)) return erro(res, 400, 'Escolha um tipo de cadastro válido.');
    const existe = await get('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe) return erro(res, 409, 'Já existe uma conta cadastrada com este e-mail.');
    const usuario = {
      id: idNovo(), nome, email, senha_hash: await bcrypt.hash(senha, 12), perfil,
      status: 'INCOMPLETO', dados_json: '{}',
    };
    await run('INSERT INTO usuarios (id, nome, email, senha_hash, perfil, status, dados_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario.id, usuario.nome, usuario.email, usuario.senha_hash, usuario.perfil, usuario.status, usuario.dados_json]);
    const publico = userPublico(await get('SELECT * FROM usuarios WHERE id = ?', [usuario.id]));
    return res.status(201).json({ usuario: publico, token: emitirToken(publico) });
  } catch (e) { next(e); }
});

app.post('/api/auth/login', limitarLogin, async (req, res, next) => {
  try {
    const email = emailNormalizado(req.body.email);
    const senha = String(req.body.senha || '');
    const row = await get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!row || !(await bcrypt.compare(senha, row.senha_hash))) return erro(res, 401, 'E-mail ou senha incorretos.');
    if (row.status === 'REJEITADO') return erro(res, 403, 'Este cadastro foi rejeitado. Entre em contato com a administração.');
    const usuario = userPublico(row);
    return res.json({ usuario, token: emitirToken(usuario) });
  } catch (e) { next(e); }
});

app.get('/api/auth/me', autenticado, (req, res) => res.json({ usuario: req.usuario }));
app.get('/api/users/me', autenticado, (req, res) => res.json({ usuario: req.usuario }));

app.patch('/api/users/me/password', autenticado, async (req, res, next) => {
  try {
    const senhaAtual = String(req.body.senhaAtual || '');
    const novaSenha = String(req.body.novaSenha || '');
    if (novaSenha.length < 8) return erro(res, 400, 'A nova senha deve possuir no mínimo 8 caracteres.');
    const row = await get('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!row || !(await bcrypt.compare(senhaAtual, row.senha_hash))) return erro(res, 400, 'A senha atual está incorreta.');
    if (senhaAtual === novaSenha) return erro(res, 400, 'A nova senha deve ser diferente da senha atual.');
    const hash = await bcrypt.hash(novaSenha, 12);
    await run('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hash, req.usuario.id]);
    return res.json({ ok: true, mensagem: 'Senha alterada com sucesso.' });
  } catch (e) { next(e); }
});

app.post('/api/users/me/document', autenticado, (req, res, next) => {
  uploadDocumento.single('documento')(req, res, (uploadError) => {
    if (uploadError) {
      const mensagem = uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'O documento deve possuir no máximo 10 MB.'
        : (uploadError.message || 'Não foi possível receber o documento.');
      return erro(res, 400, mensagem);
    }
    if (!req.file) return erro(res, 400, 'Selecione um arquivo PDF, PNG ou JPG.');
    (async () => {
      const row = await get('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
      if (!row) return erro(res, 404, 'Usuário não encontrado.');
      const dadosAtuais = parseJson(row.dados_json, {});
      const dadosAtualizados = {
        ...dadosAtuais,
        comprovante: req.file.originalname,
        comprovanteArquivo: req.file.filename,
        comprovanteTipo: req.file.mimetype,
        comprovanteEnviadoEm: new Date().toISOString(),
      };
      await run('UPDATE usuarios SET dados_json = ? WHERE id = ?', [json(dadosAtualizados), req.usuario.id]);
      return res.json({ usuario: userPublico(await get('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id])) });
    })().catch(next);
  });
});

app.patch('/api/users/me/profile', autenticado, async (req, res, next) => {
  try {
    const atual = await get('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!atual) return erro(res, 404, 'Usuário não encontrado.');
    const dadosAtuais = parseJson(atual.dados_json, {});
    const permitidos = { ...dadosAtuais };
    const campos = ['responsavel', 'razaoSocial', 'cnpj', 'telefone', 'cidade', 'estado', 'documento', 'segmento', 'descricao', 'comprovante', 'cadastroCompleto', 'nome', 'email', 'areaAtuacao', 'fotoPerfil', 'site', 'website', 'instagram', 'produtosOferecidos', 'servicosOferecidos'];
    for (const campo of campos) if (req.body[campo] !== undefined) permitidos[campo] = req.body[campo];
    const nome = preparar(req.body.nome ?? atual.nome);
    const email = emailNormalizado(req.body.email ?? atual.email);
    if (nome.length < 2) return erro(res, 400, 'O nome precisa ter pelo menos 2 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 400, 'Informe um e-mail válido.');
    const conflito = await get('SELECT id FROM usuarios WHERE email = ? AND id <> ?', [email, atual.id]);
    if (conflito) return erro(res, 409, 'Este e-mail já está em uso.');
    const novoStatus = req.body.cadastroCompleto === true ? 'PENDENTE' : atual.status;
    await run('UPDATE usuarios SET nome = ?, email = ?, status = ?, dados_json = ? WHERE id = ?',
      [nome, email, novoStatus, json(permitidos), atual.id]);
    return res.json({ usuario: userPublico(await get('SELECT * FROM usuarios WHERE id = ?', [atual.id])) });
  } catch (e) { next(e); }
});

function fornecedorPublico(row) {
  const usuario = userPublico(row);
  const tagsOrigem = usuario.tags ?? usuario.produtos ?? usuario.servicos ?? usuario.segmento ?? usuario.areaAtuacao ?? '';
  const tags = Array.isArray(tagsOrigem)
    ? tagsOrigem.map((tag) => String(tag).trim()).filter(Boolean)
    : String(tagsOrigem).split(/[;,]/).map((tag) => tag.trim()).filter(Boolean);
  const documento = String(usuario.cnpj || usuario.documento || '').replace(/\D/g, '');

  return {
    id: usuario.id,
    nome: usuario.razaoSocial || usuario.nome,
    razaoSocial: usuario.razaoSocial || usuario.nome,
    responsavel: usuario.responsavel || '',
    categoria: usuario.segmento || usuario.areaAtuacao || 'Outros',
    areaAtuacao: usuario.areaAtuacao || usuario.segmento || 'Não informada',
    descricao: usuario.descricao || '',
    cidade: usuario.cidade || '',
    estado: usuario.estado || '',
    telefone: usuario.telefone || '',
    email: usuario.email || '',
    cnpj: documento.length === 14 ? (usuario.cnpj || usuario.documento) : '',
    tags,
    produtos: Array.isArray(usuario.produtosOferecidos) ? usuario.produtosOferecidos : (Array.isArray(usuario.produtos) ? usuario.produtos : []),
    servicos: Array.isArray(usuario.servicosOferecidos) ? usuario.servicosOferecidos : (Array.isArray(usuario.servicos) ? usuario.servicos : []),
    fotoPerfil: usuario.fotoPerfil || '',
    site: usuario.site || usuario.website || '',
    instagram: usuario.instagram || '',
    verificado: usuario.status === 'APROVADO',
    status: usuario.status,
  };
}

// Campos comerciais devolvidos somente após a proposta ter sido aceita e
// somente em respostas destinadas ao organizador dono da proposta/relatório.
function contatoComercialFornecedor(row) {
  if (!row) return null;
  const fornecedor = fornecedorPublico(row);
  return {
    id: fornecedor.id,
    nome: fornecedor.nome,
    razaoSocial: fornecedor.razaoSocial,
    responsavel: fornecedor.responsavel,
    email: fornecedor.email,
    telefone: fornecedor.telefone,
    whatsapp: fornecedor.whatsapp || fornecedor.telefone,
    cnpj: fornecedor.cnpj,
    cidade: fornecedor.cidade,
    estado: fornecedor.estado,
    categoria: fornecedor.categoria,
    descricao: fornecedor.descricao,
    produtos: fornecedor.produtos,
    servicos: fornecedor.servicos,
    site: fornecedor.site,
    instagram: fornecedor.instagram,
  };
}

app.get('/api/suppliers', autenticado, exigirPerfil('ORGANIZADOR', 'ADMINISTRADOR'), async (_req, res, next) => {
  try {
    // O diretório mostra fornecedores cadastrados que não foram rejeitados; o status fica explícito no perfil.
    const rows = await all("SELECT * FROM usuarios WHERE perfil = 'FORNECEDOR' AND status <> 'REJEITADO' ORDER BY nome");
    res.json({ fornecedores: rows.map(fornecedorPublico) });
  } catch (e) { next(e); }
});

app.get('/api/suppliers/:id', autenticado, exigirPerfil('ORGANIZADOR', 'ADMINISTRADOR'), async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM usuarios WHERE id = ? AND perfil = 'FORNECEDOR' AND status <> 'REJEITADO'", [req.params.id]);
    if (!row) return erro(res, 404, 'Fornecedor não encontrado ou indisponível.');
    return res.json({ fornecedor: fornecedorPublico(row) });
  } catch (e) { next(e); }
});

app.get('/api/events', autenticado, async (req, res, next) => {
  try {
    let rows;
    if (req.usuario.perfil === 'ORGANIZADOR') {
      rows = await all('SELECT * FROM eventos WHERE organizador_id = ? ORDER BY criado_em DESC', [req.usuario.id]);
    } else if (req.usuario.perfil === 'FORNECEDOR') {
      // Fornecedores só veem eventos que a administração já aprovou.
      rows = await all("SELECT e.* FROM eventos e INNER JOIN usuarios u ON u.id = e.organizador_id WHERE e.status_aprovacao = 'APROVADO' AND u.status = 'APROVADO' ORDER BY e.criado_em DESC");
    } else {
      rows = await all('SELECT * FROM eventos ORDER BY criado_em DESC');
    }
    res.json({ eventos: await Promise.all(rows.map((row) => eventoParaPerfil(row, req.usuario.perfil))) });
  } catch (e) { next(e); }
});

app.post('/api/events', autenticado, exigirPerfil('ORGANIZADOR'), async (req, res, next) => {
  try {
    if (req.usuario.status !== 'APROVADO') {
      return erro(res, 403, 'Seu cadastro de organizador precisa ser aprovado antes de criar eventos.');
    }
    const evento = await salvarEvento(req.body, req.usuario.id, String(req.body.id || idNovo()));
    res.status(201).json({ evento });
  } catch (e) { next(e); }
});

app.get('/api/events/:id', autenticado, async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!row) return erro(res, 404, 'Evento não encontrado.');
    if (req.usuario.perfil === 'ORGANIZADOR' && row.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não tem acesso a este evento.');
    if (req.usuario.perfil === 'FORNECEDOR') {
      const organizador = await get('SELECT status FROM usuarios WHERE id = ?', [row.organizador_id]);
      if (row.status_aprovacao !== 'APROVADO' || organizador?.status !== 'APROVADO') return erro(res, 404, 'Evento não encontrado.');
    }
    res.json({ evento: await eventoParaPerfil(row, req.usuario.perfil) });
  } catch (e) { next(e); }
});

app.get('/api/events/:id/report', autenticado, exigirPerfil('ORGANIZADOR'), async (req, res, next) => {
  try {
    const eventoRow = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!eventoRow) return erro(res, 404, 'Evento não encontrado.');
    if (eventoRow.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não tem acesso ao relatório deste evento.');

    const [itens, demandas, aceitas, pendentes] = await Promise.all([
      all('SELECT * FROM itens_custo WHERE evento_id = ? ORDER BY criado_em, id', [eventoRow.id]),
      all('SELECT * FROM requisicoes_fornecedor WHERE evento_id = ? ORDER BY criado_em, id', [eventoRow.id]),
      all("SELECT * FROM propostas WHERE evento_id = ? AND status = 'ACEITA' ORDER BY atualizada_em DESC, criada_em DESC", [eventoRow.id]),
      get("SELECT COUNT(*) AS total FROM propostas WHERE evento_id = ? AND status = 'EM ANÁLISE'", [eventoRow.id]),
    ]);

    const resumoServicos = construirServicosRelatorio(itens, demandas, aceitas);
    const [evento, precificacao, propostasAceitas] = await Promise.all([
      eventoPublico(eventoRow),
      precificacaoDeEvento(eventoRow),
      Promise.all(aceitas.map(async (row) => {
        const proposta = await propostaPublica(row);
        const fornecedorRow = await get("SELECT * FROM usuarios WHERE id = ? AND perfil = 'FORNECEDOR'", [row.fornecedor_id]);
        return { ...proposta, contatoFornecedor: contatoComercialFornecedor(fornecedorRow) };
      })),
    ]);

    res.json({
      relatorio: {
        geradoEm: new Date().toISOString(),
        evento,
        ...resumoServicos,
        precificacao,
        propostasAceitas,
        propostasEmAnalise: Number(pendentes?.total || 0),
        premissaPublicoEsperado: 'Como não há campo de público esperado cadastrado, o relatório usa a média entre público mínimo e máximo como referência inicial; o organizador pode ajustar essa hipótese no relatório.',
      },
    });
  } catch (e) { next(e); }
});

app.get('/api/events/:id/pricing', autenticado, exigirPerfil('ORGANIZADOR', 'ADMINISTRADOR'), async (req, res, next) => {
  try {
    const evento = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!evento) return erro(res, 404, 'Evento não encontrado.');
    if (req.usuario.perfil === 'ORGANIZADOR' && evento.organizador_id !== req.usuario.id) {
      return erro(res, 403, 'Você não tem acesso ao orçamento deste evento.');
    }
    res.json({ precificacao: await precificacaoDeEvento(evento) });
  } catch (e) { next(e); }
});

app.put('/api/events/:id', autenticado, exigirPerfil('ORGANIZADOR'), async (req, res, next) => {
  try {
    if (req.usuario.status !== 'APROVADO') return erro(res, 403, 'Seu cadastro de organizador precisa ser aprovado para editar eventos.');
    const atual = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!atual) return erro(res, 404, 'Evento não encontrado.');
    if (atual.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não pode alterar este evento.');
    res.json({ evento: await salvarEvento({ ...(await eventoPublico(atual)), ...req.body, id: atual.id }, req.usuario.id, atual.id) });
  } catch (e) { next(e); }
});

app.delete('/api/events/:id', autenticado, exigirPerfil('ORGANIZADOR', 'ADMINISTRADOR'), async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!row) return erro(res, 404, 'Evento não encontrado.');
    if (req.usuario.perfil !== 'ADMINISTRADOR' && row.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não pode excluir este evento.');
    await run('DELETE FROM eventos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.post('/api/events/:id/cost-items', autenticado, exigirPerfil('ORGANIZADOR'), async (req, res, next) => {
  try {
    if (req.usuario.status !== 'APROVADO') return erro(res, 403, 'Seu cadastro de organizador precisa ser aprovado para editar os custos dos eventos.');
    const evento = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!evento) return erro(res, 404, 'Evento não encontrado.');
    if (evento.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não pode alterar este evento.');
    const categoria = preparar(req.body.categoria);
    const descricao = preparar(req.body.descricao);
    if (!categoria || !descricao) return erro(res, 400, 'Informe a categoria e a descrição do serviço requerido.');
    const valorEstimadoBruto = req.body.valorEstimado ?? req.body.valor_estimado;
    const valorEstimado = valorMonetarioOpcional(valorEstimadoBruto);
    const mostrarOrcamentoFornecedor = booleanoAtivo(req.body.mostrarOrcamentoFornecedor ?? req.body.exibir_orcamento_fornecedor);
    if (valorEstimado !== null && (!Number.isFinite(valorEstimado) || valorEstimado < 0)) {
      return erro(res, 400, 'O orçamento de referência deve ser um valor total estimado maior ou igual a zero.');
    }
    if (mostrarOrcamentoFornecedor && !(valorEstimado > 0)) {
      return erro(res, 400, 'Informe um orçamento de referência maior que zero antes de compartilhá-lo com fornecedores.');
    }
    let id = String(req.body.id || idNovo());
    const itemExistente = await get('SELECT evento_id FROM itens_custo WHERE id = ?', [id]);
    if (itemExistente && itemExistente.evento_id !== req.params.id) return erro(res, 403, 'Este item já está vinculado a outro evento.');
    await run(`INSERT INTO itens_custo (id, evento_id, categoria, descricao, status, valor_estimado, exibir_orcamento_fornecedor, dados_json)
      VALUES (?, ?, ?, ?, 'Rascunho', ?, ?, ?) ON DUPLICATE KEY UPDATE categoria=VALUES(categoria), descricao=VALUES(descricao),
      status=VALUES(status), valor_estimado=VALUES(valor_estimado), exibir_orcamento_fornecedor=VALUES(exibir_orcamento_fornecedor), dados_json=VALUES(dados_json)`,
    [id, req.params.id, categoria, descricao, valorEstimado > 0 ? valorEstimado : null, mostrarOrcamentoFornecedor ? 1 : 0,
      json({ ...req.body, valorEstimado: valorEstimado > 0 ? valorEstimado : null, mostrarOrcamentoFornecedor })]);
    await run("UPDATE eventos SET status_aprovacao = 'PENDENTE' WHERE id = ?", [req.params.id]);
    const item = await get('SELECT * FROM itens_custo WHERE id = ?', [id]);
    res.status(201).json({ item: { ...parseJson(item.dados_json, {}), id: item.id, categoria: item.categoria, descricao: item.descricao, status: item.status, valorEstimado: item.valor_estimado, mostrarOrcamentoFornecedor: Number(item.exibir_orcamento_fornecedor) === 1 } });
  } catch (e) { next(e); }
});

app.delete('/api/events/:id/cost-items/:itemId', autenticado, exigirPerfil('ORGANIZADOR'), async (req, res, next) => {
  try {
    if (req.usuario.status !== 'APROVADO') return erro(res, 403, 'Seu cadastro de organizador precisa ser aprovado para editar os custos dos eventos.');
    const evento = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!evento) return erro(res, 404, 'Evento não encontrado.');
    if (evento.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não pode alterar este evento.');
    await run('DELETE FROM itens_custo WHERE id = ? AND evento_id = ?', [req.params.itemId, req.params.id]);
    await run('DELETE FROM requisicoes_fornecedor WHERE id = ? AND evento_id = ?', [req.params.itemId, req.params.id]);
    await run("UPDATE eventos SET status_aprovacao = 'PENDENTE' WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.get('/api/proposals', autenticado, async (req, res, next) => {
  try {
    let rows;
    if (req.usuario.perfil === 'FORNECEDOR') {
      rows = await all('SELECT * FROM propostas WHERE fornecedor_id = ? ORDER BY criada_em DESC', [req.usuario.id]);
    } else if (req.usuario.perfil === 'ORGANIZADOR') {
      rows = await all('SELECT * FROM propostas WHERE organizador_id = ? ORDER BY criada_em DESC', [req.usuario.id]);
    } else {
      rows = await all('SELECT * FROM propostas ORDER BY criada_em DESC');
    }

    let propostas = await Promise.all(rows.map(propostaPublica));
    // Dados de contato comercial só são incluídos para o organizador dono da
    // proposta e depois que o status tiver sido gravado como ACEITA.
    if (req.usuario.perfil === 'ORGANIZADOR') {
      propostas = await Promise.all(propostas.map(async (proposta) => {
        if (String(proposta.status || '').toUpperCase() !== 'ACEITA') return proposta;
        const fornecedorRow = await get("SELECT * FROM usuarios WHERE id = ? AND perfil = 'FORNECEDOR'", [proposta.fornecedorId]);
        return { ...proposta, contatoFornecedor: contatoComercialFornecedor(fornecedorRow) };
      }));
    }
    res.json({ propostas });
  } catch (e) { next(e); }
});

app.post('/api/proposals', autenticado, exigirPerfil('FORNECEDOR'), async (req, res, next) => {
  try {
    const evento = await get('SELECT * FROM eventos WHERE id = ?', [String(req.body.eventoId || '')]);
    if (!evento || evento.status_aprovacao !== 'APROVADO') return erro(res, 404, 'O evento não existe ou ainda não foi aprovado pela administração.');
    const organizadorDoEvento = await get('SELECT status FROM usuarios WHERE id = ?', [evento.organizador_id]);
    if (organizadorDoEvento?.status !== 'APROVADO') return erro(res, 404, 'O evento não existe ou ainda não está disponível para propostas.');
    if (req.usuario.status !== 'APROVADO') return erro(res, 403, 'Seu cadastro precisa ser aprovado antes de enviar propostas.');
    const itemId = req.body.itemId ? String(req.body.itemId) : null;
    if (itemId) {
      const item = await get('SELECT id FROM itens_custo WHERE id = ? AND evento_id = ?', [itemId, evento.id]);
      if (!item) return erro(res, 400, 'O item selecionado não pertence a este evento.');
    }
    const valor = Number(req.body.valor);
    const validade = preparar(req.body.validade);
    const descricao = preparar(req.body.descricao);
    if (!(valor > 0) || !Number.isFinite(valor)) return erro(res, 400, 'Informe um valor de proposta válido.');
    if (!validade || !descricao) return erro(res, 400, 'Preencha a validade e a descrição da proposta.');
    const id = String(req.body.id || idNovo());
    const dados = { ...req.body, fornecedorId: req.usuario.id, organizadorId: evento.organizador_id, status: 'EM ANÁLISE' };
    await run(`INSERT INTO propostas (id, evento_id, item_id, fornecedor_id, organizador_id, valor, validade, descricao, observacoes, status, dados_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'EM ANÁLISE', ?)`,
    [id, evento.id, itemId, req.usuario.id, evento.organizador_id, valor, validade, descricao, preparar(req.body.observacoes) || null, json(dados)]);
    res.status(201).json({ proposta: await propostaPublica(await get('SELECT * FROM propostas WHERE id = ?', [id])) });
  } catch (e) { next(e); }
});

app.patch('/api/proposals/:id/status', autenticado, exigirPerfil('ORGANIZADOR'), async (req, res, next) => {
  try {
    const status = preparar(req.body.status).toUpperCase();
    if (!['ACEITA', 'RECUSADA', 'EM ANÁLISE'].includes(status)) return erro(res, 400, 'Status da proposta inválido.');
    const proposta = await get('SELECT * FROM propostas WHERE id = ?', [req.params.id]);
    if (!proposta) return erro(res, 404, 'Proposta não encontrada.');
    if (proposta.organizador_id !== req.usuario.id) return erro(res, 403, 'Você não pode responder a esta proposta.');
    if (proposta.status !== 'EM ANÁLISE') return erro(res, 409, 'Esta proposta já recebeu uma resposta.');
    if (status === 'ACEITA' && proposta.item_id) {
      const aceitasAnteriores = await all("SELECT * FROM propostas WHERE evento_id = ? AND item_id = ? AND status = 'ACEITA' AND id <> ?", [proposta.evento_id, proposta.item_id, proposta.id]);
      for (const anterior of aceitasAnteriores) {
        const dadosAnteriores = parseJson(anterior.dados_json, {});
        await run('UPDATE propostas SET status = ?, dados_json = ?, atualizada_em = CURRENT_TIMESTAMP WHERE id = ?', ['RECUSADA', json({ ...dadosAnteriores, status: 'RECUSADA' }), anterior.id]);
      }
    }
    const dados = parseJson(proposta.dados_json, {});
    await run('UPDATE propostas SET status = ?, dados_json = ?, atualizada_em = CURRENT_TIMESTAMP WHERE id = ?', [status, json({ ...dados, status }), proposta.id]);
    res.json({ proposta: await propostaPublica(await get('SELECT * FROM propostas WHERE id = ?', [proposta.id])) });
  } catch (e) { next(e); }
});

app.delete('/api/proposals/:id', autenticado, exigirPerfil('FORNECEDOR'), async (req, res, next) => {
  try {
    const proposta = await get('SELECT * FROM propostas WHERE id = ?', [req.params.id]);
    if (!proposta) return erro(res, 404, 'Proposta não encontrada.');
    if (proposta.fornecedor_id !== req.usuario.id) return erro(res, 403, 'Você não pode excluir esta proposta.');
    if (proposta.status !== 'EM ANÁLISE') return erro(res, 409, 'Só é possível excluir propostas que ainda estão em análise.');
    await run('DELETE FROM propostas WHERE id = ?', [proposta.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.get('/api/admin/events', autenticado, exigirPerfil('ADMINISTRADOR'), async (_req, res, next) => {
  try {
    const rows = await all('SELECT * FROM eventos ORDER BY criado_em DESC');
    const eventos = await Promise.all(rows.map(eventoAdministrativo));
    res.json({ eventos });
  } catch (e) { next(e); }
});

app.patch('/api/admin/events/:id/status', autenticado, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const status = preparar(req.body.statusAprovacao || req.body.status).toUpperCase();
    if (!['PENDENTE', 'APROVADO', 'REJEITADO'].includes(status)) return erro(res, 400, 'Status de aprovação do evento inválido.');
    const row = await get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
    if (!row) return erro(res, 404, 'Evento não encontrado.');
    if (status === 'APROVADO') {
      const organizador = await get('SELECT status FROM usuarios WHERE id = ?', [row.organizador_id]);
      if (organizador?.status !== 'APROVADO') {
        return erro(res, 409, 'Não é possível aprovar este evento enquanto o cadastro do organizador não estiver aprovado.');
      }
    }
    await run('UPDATE eventos SET status_aprovacao = ? WHERE id = ?', [status, row.id]);
    const atualizado = await get('SELECT * FROM eventos WHERE id = ?', [row.id]);
    res.json({ evento: await eventoAdministrativo(atualizado) });
  } catch (e) { next(e); }
});

app.get('/api/admin/users', autenticado, exigirPerfil('ADMINISTRADOR'), async (_req, res, next) => {
  try {
    const rows = await all("SELECT * FROM usuarios WHERE perfil <> 'ADMINISTRADOR' ORDER BY criado_em DESC");
    res.json({ usuarios: rows.map(userPublico) });
  } catch (e) { next(e); }
});

app.get('/api/admin/users/:id/document', autenticado, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!row) return erro(res, 404, 'Cadastro não encontrado.');
    const dados = parseJson(row.dados_json, {});
    if (!dados.comprovanteArquivo) return erro(res, 404, 'Este cadastro ainda não enviou um documento.');
    const nomeArmazenado = path.basename(String(dados.comprovanteArquivo));
    const arquivo = path.join(diretorioUploads, nomeArmazenado);
    if (!fs.existsSync(arquivo)) return erro(res, 404, 'O arquivo não está disponível no servidor.');
    return res.download(arquivo, path.basename(String(dados.comprovante || 'comprovante')));
  } catch (e) { next(e); }
});

app.patch('/api/admin/users/:id/status', autenticado, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const status = preparar(req.body.status).toUpperCase();
    if (!['PENDENTE', 'APROVADO', 'REJEITADO', 'INCOMPLETO'].includes(status)) return erro(res, 400, 'Status de cadastro inválido.');
    const row = await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!row || row.perfil === 'ADMINISTRADOR') return erro(res, 404, 'Cadastro não encontrado.');
    await run('UPDATE usuarios SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ usuario: userPublico(await get('SELECT * FROM usuarios WHERE id = ?', [req.params.id])) });
  } catch (e) { next(e); }
});

app.get('/api/admin/overview', autenticado, exigirPerfil('ADMINISTRADOR'), async (_req, res, next) => {
  try {
    const [usuarios, pendentes, eventos, propostas] = await Promise.all([
      get("SELECT COUNT(*) AS total FROM usuarios WHERE perfil <> 'ADMINISTRADOR'"),
      get("SELECT COUNT(*) AS total FROM usuarios WHERE status = 'PENDENTE'"),
      get('SELECT COUNT(*) AS total FROM eventos'),
      get('SELECT COUNT(*) AS total FROM propostas'),
    ]);
    res.json({ usuarios: usuarios.total, pendentes: pendentes.total, eventos: eventos.total, propostas: propostas.total });
  } catch (e) { next(e); }
});

app.use((req, res) => erro(res, 404, `Rota não encontrada: ${req.method} ${req.path}`));
app.use((err, _req, res, _next) => {
  if (err?.status) return erro(res, err.status, err.message);
  if (err?.type === 'entity.parse.failed') return erro(res, 400, 'O corpo da requisição contém JSON inválido.');
  if (err?.type === 'entity.too.large') return erro(res, 413, 'Os dados enviados ultrapassam o limite permitido.');
  if (err?.message?.includes('Formato inválido')) return erro(res, 400, err.message);
  if (err?.code === 'ER_DUP_ENTRY') return erro(res, 409, 'Já existe um registro com esses dados.');
  if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.code === 'ER_ROW_IS_REFERENCED_2') return erro(res, 400, 'Não foi possível salvar porque existem registros relacionados inválidos.');
  if (err?.message?.includes('CORS')) return erro(res, 403, err.message);
  console.error(err);
  return erro(res, 500, 'Ocorreu um erro interno. Confira o terminal da API.');
});

async function criarAdministradorInicial() {
  if (isProduction && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'TrocaTicket#2026Admin' || process.env.ADMIN_PASSWORD.length < 12)) {
    throw new Error('Em produção, configure ADMIN_PASSWORD com uma senha própria de pelo menos 12 caracteres.');
  }
  const email = emailNormalizado(process.env.ADMIN_EMAIL || 'admin@trocaticket.com');
  const senha = process.env.ADMIN_PASSWORD || 'TrocaTicket#2026Admin';
  const nome = preparar(process.env.ADMIN_NAME || 'Administrador TrocaTicket');
  const existente = await get('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existente) return;
  const hash = await bcrypt.hash(senha, 12);
  await run("INSERT INTO usuarios (id, nome, email, senha_hash, perfil, status, dados_json) VALUES (?, ?, ?, ?, 'ADMINISTRADOR', 'APROVADO', '{}')",
    [idNovo(), nome, email, hash]);
  console.log(`Conta administrativa inicial criada: ${email}`);
  if (!process.env.ADMIN_PASSWORD) console.warn('AVISO: senha administrativa local padrão em uso. Defina ADMIN_PASSWORD no .env antes de disponibilizar a aplicação.');
}

const arquivo = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === arquivo) {
  (async () => {
    try {
      await testarConexao();
      await garantirMigracoes();
      console.log(`Conexão com MySQL estabelecida (${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'TrocaTicket'}).`);
      await criarAdministradorInicial();
      app.listen(PORT, () => console.log(`TrocaTicket API disponível em http://localhost:${PORT}`));
    } catch (e) {
      console.error('Não foi possível inicializar a API. Verifique se o MySQL do XAMPP está iniciado, o banco TrocaTicket foi importado e o arquivo .env está correto.');
      console.error(e);
      process.exit(1);
    }
  })();
}

export default app;
