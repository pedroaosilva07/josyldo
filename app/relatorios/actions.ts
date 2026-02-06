'use server';

import { query, queryOne } from "../lib/db";
import { requireAuth } from "../lib/auth";

export interface RegistroCompleto {
    id: string;
    tipo: 'ENTRADA' | 'SAIDA';
    data_hora: string;
    latitude: number | null;
    longitude: number | null;
    endereco: string | null;
    ponto_entrada_id: string | null;
    // Campos calculados
    total_atividades: number;
    total_midias: number;
}

export interface RelatorioDetalhado {
    entrada: {
        id: string;
        data_hora: string;
        endereco: string | null;
        latitude: number | null;
        longitude: number | null;
    };
    saida?: {
        id: string;
        data_hora: string;
        endereco: string | null;
        latitude: number | null;
        longitude: number | null;
    };
    atividades: Array<{
        id: string;
        descricao: string;
        created_at: string;
    }>;
    midias_entrada: Array<{
        id: string;
        tipo: string;
        caminho_arquivo: string;
        nome_original: string;
    }>;
    midias_saida: Array<{
        id: string;
        tipo: string;
        caminho_arquivo: string;
        nome_original: string;
    }>;
    duracao_minutos: number | null;
}

// ====================================
// BUSCAR REGISTROS RESUMIDOS
// ====================================
export async function buscarRegistrosAction(filtros: {
    dataInicio?: string;
    dataFim?: string;
}) {
    const session = await requireAuth();

    let sql = `
        SELECT 
            p.id,
            p.data_hora,
            p.endereco,
            s.data_hora as saida_data_hora,
            (SELECT COUNT(*) FROM atividades WHERE ponto_id = p.id) as total_atividades,
            (SELECT COUNT(*) FROM midias WHERE ponto_id = p.id) as total_midias
        FROM pontos p 
        LEFT JOIN pontos s ON s.ponto_entrada_id = p.id
        WHERE p.user_id = ? AND p.tipo = 'ENTRADA'
    `;
    const params: unknown[] = [session.userId];

    if (filtros.dataInicio) {
        sql += ' AND DATE(p.data_hora) >= ?';
        params.push(filtros.dataInicio);
    }
    if (filtros.dataFim) {
        sql += ' AND DATE(p.data_hora) <= ?';
        params.push(filtros.dataFim);
    }

    sql += ' ORDER BY p.data_hora DESC LIMIT 100';

    // Executa uma única query otimizada
    const rows = query<{
        id: string;
        data_hora: string;
        endereco: string | null;
        saida_data_hora: string | null;
        total_atividades: number;
        total_midias: number;
    }>(sql, params);

    // Processa os resultados (apenas cálculo leve de duração)
    const registros = rows.map(row => {
        let duracao_minutos = null;
        if (row.saida_data_hora) {
            const inicio = new Date(row.data_hora);
            const fim = new Date(row.saida_data_hora);
            duracao_minutos = Math.round((fim.getTime() - inicio.getTime()) / 60000);
        }

        return {
            id: row.id,
            data_hora: row.data_hora,
            endereco: row.endereco,
            saida_data_hora: row.saida_data_hora,
            duracao_minutos,
            total_atividades: row.total_atividades,
            total_midias: row.total_midias
        };
    });

    return registros;
}

// ====================================
// BUSCAR DETALHES DE UM REGISTRO
// ====================================
export async function buscarDetalhesRegistroAction(pontoEntradaId: string): Promise<RelatorioDetalhado | null> {
    const session = await requireAuth();

    // Busca entrada
    const entrada = queryOne<{
        id: string;
        user_id: string;
        data_hora: string;
        endereco: string | null;
        latitude: number | null;
        longitude: number | null;
    }>(
        'SELECT * FROM pontos WHERE id = ? AND user_id = ?',
        [pontoEntradaId, session.userId]
    );

    if (!entrada) return null;

    // Busca saída
    const saida = queryOne<{
        id: string;
        data_hora: string;
        endereco: string | null;
        latitude: number | null;
        longitude: number | null;
    }>(
        'SELECT * FROM pontos WHERE ponto_entrada_id = ?',
        [pontoEntradaId]
    );

    // Busca atividades
    const atividades = query<{
        id: string;
        descricao: string;
        created_at: string;
    }>(
        'SELECT * FROM atividades WHERE ponto_id = ? ORDER BY created_at',
        [pontoEntradaId]
    );

    // Busca mídias da entrada
    const midias_entrada = query<{
        id: string;
        tipo: string;
        caminho_arquivo: string;
        nome_original: string;
    }>(
        'SELECT * FROM midias WHERE ponto_id = ?',
        [pontoEntradaId]
    );

    // Busca mídias da saída
    let midias_saida: typeof midias_entrada = [];
    if (saida) {
        midias_saida = query(
            'SELECT * FROM midias WHERE ponto_id = ?',
            [saida.id]
        );
    }

    // Calcula duração
    let duracao_minutos: number | null = null;
    if (saida) {
        const inicio = new Date(entrada.data_hora);
        const fim = new Date(saida.data_hora);
        duracao_minutos = Math.round((fim.getTime() - inicio.getTime()) / 60000);
    }

    return {
        entrada: {
            id: entrada.id,
            data_hora: entrada.data_hora,
            endereco: entrada.endereco,
            latitude: entrada.latitude,
            longitude: entrada.longitude
        },
        saida: saida ? {
            id: saida.id,
            data_hora: saida.data_hora,
            endereco: saida.endereco,
            latitude: saida.latitude,
            longitude: saida.longitude
        } : undefined,
        atividades,
        midias_entrada,
        midias_saida,
        duracao_minutos
    };
}
