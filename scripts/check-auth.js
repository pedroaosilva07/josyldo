const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'josyldo.db');
const db = new Database(DB_PATH);

try {
    const tableUser = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").get();
    if (tableUser) {
        console.log('✅ Tabela SESSIONS existe.');
    } else {
        console.error('❌ Tabela SESSIONS NÃO encontrada!');
    }

    const sessions = db.prepare('SELECT count(*) as count FROM sessions').get();
    console.log(`📊 Sessões ativas: ${sessions.count}`);

    console.log('--- Schema Sessions ---');
    const schema = db.prepare("PRAGMA table_info(sessions)").all();
    console.table(schema);

} catch (err) {
    console.error('Erro ao verificar banco:', err);
}
