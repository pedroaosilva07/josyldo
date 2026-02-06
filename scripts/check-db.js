const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'josyldo.db');
const db = new Database(DB_PATH);

console.log('--- Últimos 5 Pontos ---');
const pontos = db.prepare('SELECT * FROM pontos ORDER BY data_hora DESC LIMIT 5').all();
console.table(pontos);

console.log('\n--- Atividades Recentes ---');
const atividades = db.prepare('SELECT * FROM atividades ORDER BY created_at DESC LIMIT 5').all();
console.table(atividades);

console.log('\n--- Usuários ---');
const users = db.prepare('SELECT id, username FROM users').all();
console.table(users);
