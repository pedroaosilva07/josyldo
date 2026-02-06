// Script para criar usuário inicial
// Execute com: node scripts/create-user.js

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Caminho do banco
const DB_PATH = path.join(__dirname, '..', 'data', 'josyldo.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'app', 'lib', 'db', 'schema.sql');

// Garante que o diretório existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Conecta ao banco
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Inicializa schema se necessário
const schemaExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
).get();

if (!schemaExists) {
    console.log('📦 Criando tabelas do banco de dados...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    console.log('✅ Tabelas criadas!');
}

// Verifica se usuário já existe
const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('Pedro');

if (existingUser) {
    console.log('⚠️  Usuário "Pedro" já existe no banco!');
    console.log('   Atualizando senha para "123"...');

    const passwordHash = bcrypt.hashSync('123', 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(passwordHash, 'Pedro');
    console.log('✅ Senha atualizada!');
} else {
    console.log('🌱 Criando usuário "Pedro"...');

    const passwordHash = bcrypt.hashSync('123', 10);
    const userId = uuidv4();

    db.prepare(`
        INSERT INTO users (id, username, password_hash, nome_completo) 
        VALUES (?, ?, ?, ?)
    `).run(userId, 'Pedro', passwordHash, 'Pedro Silva');

    console.log('✅ Usuário criado com sucesso!');
}

console.log('\n📋 Credenciais:');
console.log('   Usuário: Pedro');
console.log('   Senha: 123');
console.log('\n🚀 Pronto! Agora você pode fazer login.');

db.close();
