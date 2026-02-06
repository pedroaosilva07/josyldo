import db, { run, queryOne } from './index';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * Script de seed para inicializar dados do banco
 * Execute: npx ts-node --project tsconfig.json app/lib/db/seed.ts
 */

async function seed() {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // Verifica se já existe usuário
    const existingUser = queryOne<{ id: string }>(
        'SELECT id FROM users WHERE username = ?',
        ['Pedro']
    );

    if (existingUser) {
        console.log('⚠️  Usuário Pedro já existe. Seed pulado.');
        return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash('123', 10);

    // Cria usuário padrão
    run(
        `INSERT INTO users (id, username, password_hash, nome_completo) 
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), 'Pedro', passwordHash, 'Pedro Silva']
    );

    console.log('✅ Usuário criado:');
    console.log('   Username: Pedro');
    console.log('   Senha: 123');
    console.log('\n🎉 Seed concluído com sucesso!');
}

// Executa o seed
seed().catch(console.error);
