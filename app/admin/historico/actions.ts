'use server';

import { query, queryOne } from "../../lib/db";
import { requireAdmin } from "../../lib/auth";

export async function buscarDetalhesPonto(pontoId: string) {
    await requireAdmin();

    // Busca mídias
    const midias = query<{ tipo: 'FOTO' | 'VIDEO', url: string }>(
        'SELECT tipo, caminho_arquivo as url FROM midias WHERE ponto_id = ?',
        [pontoId]
    );

    // Busca atividades
    const atividades = query<{ descricao: string }>(
        'SELECT descricao FROM atividades WHERE ponto_id = ?',
        [pontoId]
    );

    return { midias, atividades };
}

export interface HistoricoItem {
    id: string;
    tipo: 'ENTRADA' | 'SAIDA';
    data_hora: string;
    latitude: number | null;
    longitude: number | null;
    endereco: string | null;
    ponto_entrada_id: string | null;
    atividades: string; // Concatenated descriptions
}

export interface HistoricoResult {
    user: {
        id: string;
        username: string;
        nome_completo: string | null;
    };
    pontos: HistoricoItem[];
}

export async function buscarHistoricoFuncionario(userId: string) {
    await requireAdmin();

    if (!userId) return null;

    // Busca dados do usuário
    const user = queryOne<{ id: string, username: string, nome_completo: string }>(
        'SELECT id, username, nome_completo FROM users WHERE id = ?',
        [userId]
    );

    if (!user) return null;

    // Busca histórico de pontos
    // Junta com atividades (se houver)
    const pontos = query<{
        id: string,
        tipo: 'ENTRADA' | 'SAIDA',
        data_hora: string,
        latitude: number | null,
        longitude: number | null,
        endereco: string | null,
        ponto_entrada_id: string | null,
        atividades: string
    }>(`
        SELECT 
            p.id,
            p.tipo,
            p.ponto_entrada_id,
            p.data_hora,
            p.latitude,
            p.longitude,
            p.endereco,
            GROUP_CONCAT(a.descricao, '; ') as atividades
        FROM pontos p
        LEFT JOIN atividades a ON p.id = a.ponto_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.data_hora DESC
        LIMIT 50
    `, [userId]);

    return {
        user,
        pontos
    };
}
