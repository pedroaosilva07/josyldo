const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'josyldo.db');

console.log('🔌 Conectando ao banco:', DB_PATH);
const db = new Database(DB_PATH);

try {
    // 1. Check columns
    console.log('🔍 Verificando tabela users...');
    const columns = db.pragma('table_info(users)');
    console.log('   Colunas encontradas:', columns.map(c => c.name).join(', '));

    const hasRole = columns.some(c => c.name === 'role');

    if (!hasRole) {
        console.log('🛠️ Adicionando coluna role...');
        db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'").run();
        console.log('✅ Coluna role adicionada!');
    } else {
        console.log('ℹ️ Coluna role já existe.');
    }

    // 2. Setup Admin
    console.log('👤 Configurando usuário Admin...');
    const admin = db.prepare("SELECT * FROM users WHERE username = 'Admin' COLLATE NOCASE").get();

    if (admin) {
        console.log('   Admin encontrado:', admin.username);
        // Ensure role is ADMIN
        db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(admin.id);
        console.log('✅ Role de Admin atualizado para ADMIN');
    } else {
        console.log('⚠️  Usuário Admin NÃO encontrado! (Execute o script create-user.js depois)');
    }

} catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
} finally {
    db.close();
}
