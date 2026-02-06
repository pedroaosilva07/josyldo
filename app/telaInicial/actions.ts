'use server';

import { revalidatePath } from "next/cache";
import { delay, PontoRegistro, pontosMocados } from "../lib/dbMock";
import { error } from "console";

export async function registrarPontoAction(tipo: "ENTRADA" | "SAIDA") {
    await delay(600);

    const ultimoPonto = pontosMocados[0];

    if (tipo === 'ENTRADA' && ultimoPonto?.tipo === 'ENTRADA') {
        return { success: false, error: "Já existe um ponto de entrada registrada." };
    }

    if (tipo === 'SAIDA' && ultimoPonto?.tipo === 'SAIDA') {
        return { success: false, error: "Já existe um ponto de saída registrada." }
    }
    const novoPonto: PontoRegistro = {
        id: Math.random().toString(36).substr(2, 9),
        tipo,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    pontosMocados.unshift(novoPonto);

    revalidatePath('/telaInicial');
    return { success: true, novoPonto }

}