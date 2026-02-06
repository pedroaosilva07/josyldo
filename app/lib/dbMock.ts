export const mockUsers = [{
    id: 1,
    username: 'Pedro',
    password: '123',
}]

export const deplay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type PontoRegistro = {
    id: string;
    tipo: 'ENTRADA' | 'SAIDA';
    horario: string;
};

export let pontosMocados: PontoRegistro[] = [];

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));