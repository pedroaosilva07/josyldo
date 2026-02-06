'use server';

import { query, run, queryOne } from "../../lib/db";
import { requireAdmin, createUser } from "../../lib/auth";
import type { Role } from "../../lib/auth";

export async function listarUsuariosAction() {
    await requireAdmin();

    return query<{
        id: string;
        username: string;
        nome_completo: string | null;
        role: Role;
        created_at: string;
    }>('SELECT id, username, nome_completo, role, created_at FROM users ORDER BY nome_completo');
}

export async function criarUsuarioAction(formData: FormData) {
    await requireAdmin();

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const nome = formData.get('nome') as string;
    const role = formData.get('role') as Role;

    if (!username || !password || !nome) {
        return { success: false, message: 'Todos os campos são obrigatórios' };
    }

    // Verifica se já existe
    const existente = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existente) {
        return { success: false, message: 'Usuário já existe' };
    }

    try {
        await createUser(username, password, nome, role);
        return { success: true, message: 'Usuário criado com sucesso' };
    } catch (error) {
        console.error("Erro ao criar user:", error);
        return { success: false, message: 'Erro ao criar usuário' };
    }
}
