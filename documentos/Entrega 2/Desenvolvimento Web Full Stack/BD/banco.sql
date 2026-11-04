CREATE DATABASE IF NOT EXISTS TrocaTicket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE TrocaTicket;

CREATE TABLE IF NOT EXISTS usuarios (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'INCOMPLETO',
  dados_json LONGTEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_perfil_status (perfil, status),
  CONSTRAINT chk_usuarios_perfil CHECK (perfil IN ('ORGANIZADOR', 'FORNECEDOR', 'ADMINISTRADOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eventos (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  organizador_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  nome VARCHAR(180) NOT NULL,
  categoria VARCHAR(100) NULL,
  descricao TEXT NULL,
  data_inicio VARCHAR(20) NULL,
  hora_inicio VARCHAR(10) NULL,
  data_fim VARCHAR(20) NULL,
  hora_fim VARCHAR(10) NULL,
  `local` VARCHAR(180) NULL,
  cidade VARCHAR(120) NULL,
  publico_minimo INT NULL,
  publico_maximo INT NULL,
  margem_lucro DECIMAL(8,2) NOT NULL DEFAULT 0,
  capa LONGTEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Planejamento',
  status_aprovacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  dados_json LONGTEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eventos_organizador (organizador_id),
  KEY idx_eventos_data (data_inicio),
  KEY idx_eventos_aprovacao (status_aprovacao),
  CONSTRAINT fk_eventos_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS requisicoes_fornecedor (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  evento_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  dados_json LONGTEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_requisicoes_evento (evento_id),
  CONSTRAINT fk_requisicoes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS itens_custo (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  evento_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Rascunho',
  valor_estimado DECIMAL(12,2) NULL,
  exibir_orcamento_fornecedor TINYINT(1) NOT NULL DEFAULT 0,
  dados_json LONGTEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_itens_custo_evento (evento_id),
  CONSTRAINT fk_itens_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS propostas (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  evento_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  item_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  fornecedor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  organizador_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  validade VARCHAR(30) NOT NULL,
  descricao VARCHAR(1000) NOT NULL,
  observacoes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'EM ANÁLISE',
  dados_json LONGTEXT NOT NULL,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_propostas_fornecedor (fornecedor_id),
  KEY idx_propostas_organizador (organizador_id),
  KEY idx_propostas_evento (evento_id),
  CONSTRAINT chk_propostas_valor CHECK (valor > 0),
  CONSTRAINT chk_propostas_status CHECK (status IN ('EM ANÁLISE', 'ACEITA', 'RECUSADA')),
  CONSTRAINT fk_propostas_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_propostas_item FOREIGN KEY (item_id) REFERENCES itens_custo(id) ON DELETE SET NULL,
  CONSTRAINT fk_propostas_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_propostas_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
