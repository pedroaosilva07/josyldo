'use server';

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';
import { run, queryOne, query } from "../lib/db";
import { requireAuth } from "../lib/auth";
import fs from 'fs';
import path from 'path';

// Tipos
export interface PontoRegistro {
    id: string;
    user_id: string;
    tipo: 'ENTRADA' | 'SAIDA';
    data_hora: string;
    latitude: number | null;
    longitude: number | null;
    endereco: string | null;
    ponto_entrada_id: string | null;
}

export interface AtividadeDB {
    id: string;
    ponto_id: string;
    descricao: string;
    created_at: string;
}

export interface MidiaDB {
    id: string;
    ponto_id: string;
    tipo: 'FOTO' | 'VIDEO';
    caminho_arquivo: string;
    nome_original: string;
}

// Diretório de uploads
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Garante que o diretório de uploads existe
function ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

// ====================================
// REGISTRAR PONTO DE ENTRADA
// ====================================
export async function registrarEntradaAction(dados: {
    latitude?: number;
    longitude?: number;
    endereco?: string;
    midias?: Array<{ tipo: 'FOTO' | 'VIDEO'; dados: string; nome: string }>;
}) {
    const session = await requireAuth();

    try {
        console.log(`[RegistrarEntrada] Iniciando para user: ${session.username}`);

        // Verifica se já tem entrada aberta
        const pontoAberto = queryOne<PontoRegistro>(
            `SELECT * FROM pontos 
             WHERE user_id = ? AND tipo = 'ENTRADA' 
             AND id NOT IN (SELECT ponto_entrada_id FROM pontos WHERE ponto_entrada_id IS NOT NULL)
             ORDER BY data_hora DESC LIMIT 1`,
            [session.userId]
        );

        if (pontoAberto) {
            console.log(`[RegistrarEntrada] Erro: Ponto já aberto ID ${pontoAberto.id}`);
            return { success: false, error: "Você já tem um ponto de entrada aberto. Registre a saída primeiro." };
        }

        const pontoId = uuidv4();
        const dataHora = new Date().toISOString();

        // Registra o ponto
        run(
            `INSERT INTO pontos (id, user_id, tipo, data_hora, latitude, longitude, endereco) 
             VALUES (?, ?, 'ENTRADA', ?, ?, ?, ?)`,
            [pontoId, session.userId, dataHora, dados.latitude || null, dados.longitude || null, dados.endereco || null]
        );

        // Salva mídias se houver
        if (dados.midias && dados.midias.length > 0) {
            ensureUploadsDir();
            for (const midia of dados.midias) {
                try {
                    const midiaId = uuidv4();
                    const extensao = midia.tipo === 'FOTO' ? 'jpg' : 'webm';
                    const nomeArquivo = `${midiaId}.${extensao}`;
                    const caminhoCompleto = path.join(UPLOADS_DIR, nomeArquivo);

                    // Decodifica base64 e salva
                    const buffer = Buffer.from(midia.dados.split(',')[1] || midia.dados, 'base64');
                    fs.writeFileSync(caminhoCompleto, buffer);

                    run(
                        `INSERT INTO midias (id, ponto_id, tipo, caminho_arquivo, nome_original) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [midiaId, pontoId, midia.tipo, `/uploads/${nomeArquivo}`, midia.nome]
                    );
                } catch (midiaError) {
                    console.error('[RegistrarEntrada] Erro ao salvar mídia:', midiaError);
                    // Não aborta o ponto principal se mídia falhar, mas loga
                }
            }
        }

        console.log(`[RegistrarEntrada] Sucesso! ID: ${pontoId}`);
        revalidatePath('/dashboard');
        revalidatePath('/relatorios'); // Garante atualização do histórico

        return {
            success: true,
            pontoId,
            message: 'Entrada registrada com sucesso!'
        };
    } catch (error: any) {
        console.error('[RegistrarEntrada] Erro CRÍTICO:', error);
        return { success: false, error: "Erro ao registrar ponto: " + error.message };
    }
}

// ====================================
// REGISTRAR PONTO DE SAÍDA
// ====================================
export async function registrarSaidaAction(dados: {
    latitude?: number;
    longitude?: number;
    endereco?: string;
    atividades?: Array<{ descricao: string }>;
    midias?: Array<{ tipo: 'FOTO' | 'VIDEO'; dados: string; nome: string }>;
}) {
    const session = await requireAuth();

    try {
        console.log(`[RegistrarSaida] Iniciando para user: ${session.username}`);

        // Busca ponto de entrada aberto
        const pontoEntrada = queryOne<PontoRegistro>(
            `SELECT * FROM pontos 
             WHERE user_id = ? AND tipo = 'ENTRADA' 
             AND id NOT IN (SELECT ponto_entrada_id FROM pontos WHERE ponto_entrada_id IS NOT NULL)
             ORDER BY data_hora DESC LIMIT 1`,
            [session.userId]
        );

        if (!pontoEntrada) {
            console.log('[RegistrarSaida] Erro: Nenhum ponto aberto');
            return { success: false, error: "Nenhum ponto de entrada aberto encontrado." };
        }

        const pontoSaidaId = uuidv4();
        const dataHora = new Date().toISOString();

        // Registra ponto de saída
        run(
            `INSERT INTO pontos (id, user_id, tipo, data_hora, latitude, longitude, endereco, ponto_entrada_id) 
             VALUES (?, ?, 'SAIDA', ?, ?, ?, ?, ?)`,
            [pontoSaidaId, session.userId, dataHora, dados.latitude || null, dados.longitude || null, dados.endereco || null, pontoEntrada.id]
        );

        // Salva atividades no ponto de ENTRADA (para manter histórico vinculado ao ponto principal)
        if (dados.atividades && dados.atividades.length > 0) {
            for (const atividade of dados.atividades) {
                run(
                    `INSERT INTO atividades (id, ponto_id, descricao) VALUES (?, ?, ?)`,
                    [uuidv4(), pontoEntrada.id, atividade.descricao]
                );
            }
        }

        // Salva mídias
        if (dados.midias && dados.midias.length > 0) {
            ensureUploadsDir();
            for (const midia of dados.midias) {
                try {
                    const midiaId = uuidv4();
                    const extensao = midia.tipo === 'FOTO' ? 'jpg' : 'webm';
                    const nomeArquivo = `${midiaId}.${extensao}`;
                    const caminhoCompleto = path.join(UPLOADS_DIR, nomeArquivo);

                    const buffer = Buffer.from(midia.dados.split(',')[1] || midia.dados, 'base64');
                    fs.writeFileSync(caminhoCompleto, buffer);

                    run(
                        `INSERT INTO midias (id, ponto_id, tipo, caminho_arquivo, nome_original) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [midiaId, pontoSaidaId, midia.tipo, `/uploads/${nomeArquivo}`, midia.nome]
                    );
                } catch (midiaError) {
                    console.error('[RegistrarSaida] Erro ao salvar mídia:', midiaError);
                }
            }
        }

        console.log(`[RegistrarSaida] Sucesso! Saída ID: ${pontoSaidaId}, Entrada Fechada: ${pontoEntrada.id}`);
        revalidatePath('/dashboard');
        revalidatePath('/relatorios');

        return {
            success: true,
            pontoSaidaId,
            pontoEntradaId: pontoEntrada.id,
            message: 'Saída registrada com sucesso!'
        };
    } catch (error: any) {
        console.error('[RegistrarSaida] Erro CRÍTICO:', error);
        return { success: false, error: "Erro ao registrar saída: " + error.message };
    }
}

// ====================================
// BUSCAR PONTO ABERTO
// ====================================
export async function buscarPontoAbertoAction() {
    const session = await requireAuth();

    const pontoAberto = queryOne<PontoRegistro>(
        `SELECT * FROM pontos 
         WHERE user_id = ? AND tipo = 'ENTRADA' 
         AND id NOT IN (SELECT ponto_entrada_id FROM pontos WHERE ponto_entrada_id IS NOT NULL)
         ORDER BY data_hora DESC LIMIT 1`,
        [session.userId]
    );

    if (!pontoAberto) {
        return { temPontoAberto: false };
    }

    // Busca atividades do ponto
    const atividades = query<AtividadeDB>(
        'SELECT * FROM atividades WHERE ponto_id = ? ORDER BY created_at',
        [pontoAberto.id]
    );

    // Busca mídias do ponto
    const midias = query<MidiaDB>(
        'SELECT * FROM midias WHERE ponto_id = ? ORDER BY created_at',
        [pontoAberto.id]
    );

    return {
        temPontoAberto: true,
        ponto: pontoAberto,
        atividades,
        midias
    };
}

// ====================================
// BUSCAR HISTÓRICO
// ====================================
export async function buscarHistoricoAction(dataInicio?: string, dataFim?: string) {
    const session = await requireAuth();

    let sql = `
        SELECT p.*, 
               (SELECT COUNT(*) FROM atividades WHERE ponto_id = p.id) as total_atividades,
               (SELECT COUNT(*) FROM midias WHERE ponto_id = p.id) as total_midias
        FROM pontos p 
        WHERE p.user_id = ?
    `;
    const params: unknown[] = [session.userId];

    if (dataInicio) {
        sql += ' AND DATE(p.data_hora) >= ?';
        params.push(dataInicio);
    }
    if (dataFim) {
        sql += ' AND DATE(p.data_hora) <= ?';
        params.push(dataFim);
    }

    sql += ' ORDER BY p.data_hora DESC LIMIT 50';

    return query<PontoRegistro & { total_atividades: number; total_midias: number }>(sql, params);
}
