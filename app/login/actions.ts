'use server';

import { validateCredentials, createSession } from "../lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Validação básica
    if (!username || !password) {
        return { success: false, message: 'Usuário e senha são obrigatórios' };
    }

    try {
        // Valida credenciais no banco
        const user = await validateCredentials(username, password);

        if (!user) {
            return { success: false, message: 'Usuário ou senha inválidos' };
        }

        // Cria sessão
        await createSession(user);

        // Retorna sucesso (o redirect será feito pelo cliente)
        const redirectTo = user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

        return {
            success: true,
            message: `Bem-vindo, ${user.nome_completo || user.username}!`,
            redirectTo
        };
    } catch (error: any) {
        console.error('Erro no login:', error);
        return { success: false, message: `Erro interno: ${error.message || 'Desconhecido'}` };
    }
}

export async function logoutAction() {
    const { destroySession } = await import("../lib/auth");
    await destroySession();
    redirect('/login');
}