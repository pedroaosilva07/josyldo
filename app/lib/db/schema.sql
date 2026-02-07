-- ====================================
-- SISTEMA DE CONTROLE DE SERVIÇO
-- Schema do Banco de Dados SQLite
-- ====================================

-- Usuários do sistema
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome_completo TEXT,
    role TEXT DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessões de usuário (Persistência de Login)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Registros de ponto (entrada/saída)
CREATE TABLE IF NOT EXISTS pontos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('ENTRADA', 'SAIDA')) NOT NULL,
    data_hora DATETIME NOT NULL,
    latitude REAL,
    longitude REAL,
    endereco TEXT,
    ponto_entrada_id TEXT, -- Referência ao ponto de entrada (para saídas)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ponto_entrada_id) REFERENCES pontos(id)
);

-- Atividades realizadas durante o serviço
CREATE TABLE IF NOT EXISTS atividades (
    id TEXT PRIMARY KEY,
    ponto_id TEXT NOT NULL,
    descricao TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ponto_id) REFERENCES pontos(id) ON DELETE CASCADE
);

-- Mídias (fotos e vídeos) associadas aos pontos
CREATE TABLE IF NOT EXISTS midias (
    id TEXT PRIMARY KEY,
    ponto_id TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('FOTO', 'VIDEO')) NOT NULL,
    caminho_arquivo TEXT NOT NULL, -- Caminho do arquivo no sistema
    nome_original TEXT,
    tamanho_bytes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ponto_id) REFERENCES pontos(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pontos_user_id ON pontos(user_id);
CREATE INDEX IF NOT EXISTS idx_pontos_data_hora ON pontos(data_hora);
CREATE INDEX IF NOT EXISTS idx_atividades_ponto_id ON atividades(ponto_id);
CREATE INDEX IF NOT EXISTS idx_midias_ponto_id ON midias(ponto_id);
