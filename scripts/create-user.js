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

// Verifica se usuário Admin já existe
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('Admin');

if (existingAdmin) {
    console.log('⚠️  Usuário "Admin" já existe no banco!');
    console.log('   Atualizando senha para "123456" e garantindo permissão ADMIN...');

    const passwordHash = bcrypt.hashSync('123456', 10);
    db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE username = ?')
        .run(passwordHash, 'ADMIN', 'Admin');
    console.log('✅ Admin atualizado!');
} else {
    console.log('🌱 Criando usuário "Admin"...');

    const passwordHash = bcrypt.hashSync('123456', 10);
    const userId = uuidv4();

    db.prepare(`
        INSERT INTO users (id, username, password_hash, nome_completo, role) 
        VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'Admin', passwordHash, 'Administrador do Sistema', 'ADMIN');

    console.log('✅ Usuário Admin criado com sucesso!');
}

console.log('\n📋 Credenciais:');
console.log('   Usuário: Admin');
console.log('   Senha: 123456');
console.log('\n🚀 Pronto! Agora você pode fazer login.');

db.close();
