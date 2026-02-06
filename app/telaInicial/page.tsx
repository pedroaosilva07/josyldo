'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { registrarPontoAction } from './actions';
import { PontoRegistro } from '../lib/dbMock';
import {
    Box, Container, Typography, Button, Paper,
    Stack, Divider, Chip, IconButton, CircularProgress,
    Alert
} from '@mui/material';
import { AccessTime, PlayArrow, Stop, History, AccountCircle } from '@mui/icons-material';

export default function PontoDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [registros, setRegistros] = useState<PontoRegistro[]>([]);
    const [isPending, startTransition] = useTransition(); // React 19 transition hook
    const [erro, setErro] = useState<string | null>(null);

    const ultimoPonto = registros[0]?.tipo;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRegistrar = (tipo: 'ENTRADA' | 'SAIDA') => {
        setErro(null);
        startTransition(async () => {
            const result = await registrarPontoAction(tipo);

            if (!result.success) {
                setErro(result.error || "Erro desconhecido");
                return;
            }

            if (result.novoPonto) {
                setRegistros(prev => [result.novoPonto!, ...prev]);
            }
        });
    };

    return (
        <Container maxWidth="xs" sx={{ py: 4, height: '100vh' }}>
            {/* Header e Relógio (Código Visual Anterior...) */}
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'primary.main', color: 'white', mb: 4 }}>
                <Typography variant="h2" fontWeight="800">
                    {currentTime.toLocaleTimeString('pt-BR')}
                </Typography>
                <Chip
                    label={isPending ? "Processando..." : "Sistema Online"}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 1 }}
                />
            </Paper>

            {/* Ações com Funções Realistas */}

            {erro && <Alert severity='warning' sx={{ mb: 2 }}>{erro}</Alert>}
            <Stack spacing={2} sx={{ mb: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={() => handleRegistrar('ENTRADA')}
                    disabled={isPending || ultimoPonto === 'ENTRADA'}
                    sx={{ py: 2, borderRadius: 3, fontWeight: 700 }}
                >
                    Registrar Entrada
                </Button>

                <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <Stop />}
                    onClick={() => handleRegistrar('SAIDA')}
                    disabled={isPending || ultimoPonto === 'SAIDA' || ultimoPonto === undefined}
                    sx={{ py: 2, borderRadius: 3, fontWeight: 700, borderWidth: 2 }}
                >
                    Registrar Saída
                </Button>
            </Stack>

            {/* Histórico Dinâmico */}
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                <History fontSize="small" /> Registros de Hoje
            </Typography>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} variant="outlined">
                <Stack divider={<Divider />}>
                    {registros.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Nenhum registro hoje.</Typography>
                        </Box>
                    )}
                    {registros.map((reg) => (
                        <Box key={reg.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="body2" fontWeight="700">
                                    {reg.tipo}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {reg.tipo === 'ENTRADA' ? 'Início da jornada' : 'Fim da jornada'}
                                </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="600" color="primary">
                                {reg.horario}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Paper>
        </Container>
    );
}