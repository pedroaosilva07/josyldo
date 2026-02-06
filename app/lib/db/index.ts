import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Caminho do banco de dados
const DB_PATH = path.join(process.cwd(), 'data', 'josyldo.db');
const SCHEMA_PATH = path.join(process.cwd(), 'app', 'lib', 'db', 'schema.sql');

// Garante que o diretório existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Cria ou abre o banco de dados
const db = new Database(DB_PATH);

// Habilita foreign keys
db.pragma('foreign_keys = ON');

// Inicializa o schema se necessário
function initializeDatabase() {
    const schemaExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get();

    if (!schemaExists) {
        console.log('📦 Inicializando banco de dados...');
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schema);
        console.log('✅ Banco de dados inicializado com sucesso!');
    }
}

// Inicializa na primeira importação
initializeDatabase();

// Exporta o banco de dados
export default db;

// ====================================
// Funções utilitárias para queries
// ====================================

export function query<T>(sql: string, params: unknown[] = []): T[] {
    return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: unknown[] = []) {
    return db.prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
    return db.transaction(fn)();
}
