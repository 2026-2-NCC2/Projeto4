USE TrocaTicket;

-- Migração para bancos existentes. Execute somente se a coluna ainda não existir.
ALTER TABLE eventos
  ADD COLUMN status_aprovacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' AFTER status;

CREATE INDEX idx_eventos_aprovacao ON eventos (status_aprovacao);
