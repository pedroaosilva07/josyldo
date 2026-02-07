'use server';

import { query, queryOne } from "../../lib/db";
import { requireAdmin } from "../../lib/auth";

export interface FuncionarioAtivo {
    user_id: string;
    username: string;
    nome_completo: string | null;
    data_hora: string;
    latitude: number | null;
    longitude: number | null;
    endereco: string | null;
}

export async function buscarFuncionariosAtivos(): Promise<FuncionarioAtivo[]> {
    await requireAdmin();

    /*
      Busca o último ponto de entrada de cada usuário que ainda não tem saída correspondente.
      Isso indica quem está "trabalhando" no momento.
    */
    const sql = `
        SELECT 
            u.id as user_id,
            u.username,
            u.nome_completo,
            p.data_hora,
            p.latitude,
            p.longitude,
            p.endereco
        FROM points p -- Ops, nome da tabela é 'pontos', vamos corrigir abaixo
        JOIN users u ON p.user_id = u.id
        WHERE p.tipo = 'ENTRADA'
        AND p.id NOT IN (
            SELECT ponto_entrada_id FROM pontos WHERE ponto_entrada_id IS NOT NULL
        )
        ORDER BY p.data_hora DESC
    `;

    // Correção do nome da tabela e query otimizada
    // Se um usuário tiver múltiplos pontos abertos (erro de sistema), pega o mais recente
    const activePoints = query<FuncionarioAtivo>(`
        SELECT 
            u.id as user_id,
            u.username,
            u.nome_completo,
            p.data_hora,
            p.latitude,
            p.longitude,
            p.endereco
        FROM pontos p
        JOIN users u ON p.user_id = u.id
        WHERE p.tipo = 'ENTRADA'
        AND p.id NOT IN (
            SELECT ponto_entrada_id FROM pontos WHERE ponto_entrada_id IS NOT NULL
        )
        GROUP BY u.id
        ORDER BY p.data_hora DESC
    `);

    return activePoints;
}
// ...existing code...

export async function getDashboardStats() {
    await requireAdmin();

    const activeUsers = await buscarFuncionariosAtivos();
    const totalUsers = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');

    return {
        active: activeUsers.length,
        total: totalUsers?.count || 0
    };
}
