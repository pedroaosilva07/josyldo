const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'josyldo.db');
const db = new Database(DB_PATH);

console.log('🔄 Iniciando migração manual...');

try {
    // Cria tabela sessions se não existir
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);

    console.log('✅ Tabela SESSIONS criada com sucesso!');

    // Verifica
    const tableUser = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").get();
    if (tableUser) {
        console.log('✅ Verificação OK: Tabela sessions existe.');
    }

} catch (err) {
    console.error('❌ Erro na migração:', err);
}
