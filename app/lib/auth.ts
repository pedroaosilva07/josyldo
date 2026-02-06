import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { queryOne, run } from './db';

// Tipos
export interface User {
    id: string;
    username: string;
    password_hash: string;
    nome_completo: string | null;
    created_at: string;
}

export interface Session {
    userId: string;
    username: string;
    nomeCompleto: string | null;
}

const SESSION_COOKIE = 'josyldo_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 dias em segundos

// ====================================
// Funções de Hash
// ====================================

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ====================================
// Funções de Usuário
// ====================================

export function getUserByUsername(username: string): User | undefined {
    return queryOne<User>(
        'SELECT * FROM users WHERE username = ?',
        [username]
    );
}

export function getUserById(id: string): User | undefined {
    return queryOne<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
    );
}

export async function createUser(
    username: string,
    password: string,
    nomeCompleto?: string
): Promise<User> {
    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    run(
        `INSERT INTO users (id, username, password_hash, nome_completo) 
         VALUES (?, ?, ?, ?)`,
        [id, username, passwordHash, nomeCompleto || null]
    );

    return getUserById(id) as User;
}

// ====================================
// Funções de Sessão (Persistência no SQLite)
// ====================================

export async function createSession(user: User): Promise<string> {
    const sessionId = uuidv4();
    // Data de expiração no formato ISO string para SQLite
    const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000).toISOString();

    run(
        'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
        [sessionId, user.id, expiresAt]
    );

    // Define o cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/'
    });

    return sessionId;
}

export async function getSession(): Promise<Session | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
        return null;
    }

    // Busca sessão no banco e faz join com user
    const result = queryOne<{
        user_id: string;
        username: string;
        nome_completo: string | null;
        expires_at: string;
    }>(
        `SELECT s.user_id, s.expires_at, u.username, u.nome_completo 
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [sessionId]
    );

    if (!result) {
        return null; // Sessão inválida
    }

    // Verifica se expirou
    if (new Date(result.expires_at) < new Date()) {
        run('DELETE FROM sessions WHERE id = ?', [sessionId]);
        return null;
    }

    return {
        userId: result.user_id,
        username: result.username,
        nomeCompleto: result.nome_completo
    };
}

export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (sessionId) {
        run('DELETE FROM sessions WHERE id = ?', [sessionId]);
        cookieStore.delete(SESSION_COOKIE);
    }
}

// ====================================
// Middleware de Autenticação
// ====================================

export async function requireAuth(): Promise<Session> {
    const session = await getSession();

    if (!session) {
        throw new Error('Não autenticado');
    }

    return session;
}

export async function validateCredentials(
    username: string,
    password: string
): Promise<User | null> {
    const user = getUserByUsername(username);

    if (!user) {
        return null;
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    return user;
}
