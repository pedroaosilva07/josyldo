
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'app', 'data.db');
const db = new Database(dbPath);

console.log('Verificando schema do banco de dados...');

try {
    // Tenta selecionar a coluna role
    db.prepare('SELECT role FROM users LIMIT 1').get();
    console.log('Coluna role já existe.');
} catch (error) {
    if (error.message.includes('no such column')) {
        console.log('Adicionando coluna role...');
        try {
            db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'");
            console.log('Coluna role adicionada com sucesso.');
        } catch (alterError) {
            console.error('Erro ao adicionar coluna:', alterError);
        }
    } else {
        console.error('Erro inesperado:', error);
    }
}

console.log('Migração concluída.');
