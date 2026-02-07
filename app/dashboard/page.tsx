'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Container, Typography, Button, Paper, Stack, Divider, Chip,
    CircularProgress, Alert, AppBar, Toolbar, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    PlayArrow, Stop, History, Logout, Person, CheckCircle
} from '@mui/icons-material';
import CapturaLocalizacao from '../components/CapturaLocalizacao';
import CapturaMidia from '../components/CapturaMidia';
import ListaAtividades, { Atividade } from '../components/ListaAtividades';
import {
    registrarEntradaAction,
    registrarSaidaAction,
    buscarPontoAbertoAction
} from './actions';
import { logoutAction } from '../login/actions';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    endereco?: string;
}

interface MidiaItem {
    id: string;
    tipo: 'FOTO' | 'VIDEO';
    blob: Blob;
    preview: string;
    nome: string;
}

interface PontoAberto {
    id: string;
    data_hora: string;
    latitude: number | null;
    longitude: number | null;
    endereco: string | null;
}

export default function Dashboard() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Estado do ponto
    const [pontoAberto, setPontoAberto] = useState<PontoAberto | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal de registro
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTipo, setModalTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');

    // Dados do registro
    const [location, setLocation] = useState<LocationData | null>(null);
    const [midias, setMidias] = useState<MidiaItem[]>([]);
    const [atividades, setAtividades] = useState<Atividade[]>([]);

    // Feedback
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);

    // Atualiza relógio
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Carrega estado inicial
    useEffect(() => {
        carregarEstado();
    }, []);

    const carregarEstado = async () => {
        setLoading(true);
        try {
            const result = await buscarPontoAbertoAction();
            if (result.temPontoAberto && result.ponto) {
                setPontoAberto(result.ponto);
                // Carrega atividades existentes
                if (result.atividades) {
                    setAtividades(result.atividades.map(a => ({
                        id: a.id,
                        descricao: a.descricao,
                        criadoEm: new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    })));
                }
            } else {
                setPontoAberto(null);
            }
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = (tipo: 'ENTRADA' | 'SAIDA') => {
        setModalTipo(tipo);
        setLocation(null);
        setMidias([]);
        if (tipo === 'ENTRADA') {
            setAtividades([]);
        }
        setErro(null);
        setSucesso(null);
        setModalOpen(true);
    };

    const fecharModal = () => {
        setModalOpen(false);
    };

    const confirmarRegistro = () => {
        setErro(null);

        startTransition(async () => {
            try {
                // Converte mídias para base64
                const midiasBase64 = await Promise.all(
                    midias.map(async (m) => {
                        const reader = new FileReader();
                        return new Promise<{ tipo: 'FOTO' | 'VIDEO'; dados: string; nome: string }>((resolve) => {
                            reader.onloadend = () => {
                                resolve({
                                    tipo: m.tipo,
                                    dados: reader.result as string,
                                    nome: m.nome
                                });
                            };
                            reader.readAsDataURL(m.blob);
                        });
                    })
                );

                let result;
                if (modalTipo === 'ENTRADA') {
                    result = await registrarEntradaAction({
                        latitude: location?.latitude,
                        longitude: location?.longitude,
                        endereco: location?.endereco,
                        midias: midiasBase64
                    });
                } else {
                    result = await registrarSaidaAction({
                        latitude: location?.latitude,
                        longitude: location?.longitude,
                        endereco: location?.endereco,
                        atividades: atividades.map(a => ({ descricao: a.descricao })),
                        midias: midiasBase64
                    });
                }

                if (!result.success) {
                    setErro(result.error || 'Erro ao registrar ponto');
                    return;
                }

                setSucesso(result.message || null);
                await carregarEstado();

                // Fecha modal após sucesso
                setTimeout(() => {
                    fecharModal();
                    setSucesso(null);
                }, 1500);

            } catch (error: any) {
                setErro(error.message || 'Erro inesperado');
            }
        });
    };

    const handleLogout = () => {
        startTransition(async () => {
            await logoutAction();
        });
    };

    const formatarDataHora = (dataHora: string) => {
        const data = new Date(dataHora);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
            {/* AppBar */}
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    <Person sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Controle de Serviço
                    </Typography>
                    <IconButton color="inherit" onClick={() => router.push('/relatorios')}>
                        <History />
                    </IconButton>
                    <IconButton color="inherit" onClick={handleLogout}>
                        <Logout />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="sm" sx={{ py: 3 }}>
                {/* Relógio */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 4,
                        bgcolor: pontoAberto ? 'success.main' : 'primary.main',
                        color: 'white',
                        mb: 3
                    }}
                >
                    <Typography variant="h2" fontWeight={800}>
                        {currentTime.toLocaleTimeString('pt-BR')}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                        {currentTime.toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </Typography>
                    <Chip
                        icon={pontoAberto ? <CheckCircle /> : undefined}
                        label={pontoAberto ? "Em serviço" : "Fora de serviço"}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 2 }}
                    />
                </Paper>

                {/* Info do ponto aberto */}
                {pontoAberto && (
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                            Ponto de entrada registrado em:
                        </Typography>
                        <Typography variant="body2">
                            {formatarDataHora(pontoAberto.data_hora)}
                        </Typography>
                        {pontoAberto.endereco && (
                            <Typography variant="caption" color="text.secondary">
                                📍 {pontoAberto.endereco}
                            </Typography>
                        )}
                    </Alert>
                )}

                {/* Atividades (quando em serviço) */}
                {pontoAberto && (
                    <Box sx={{ mb: 3 }}>
                        <ListaAtividades
                            atividades={atividades}
                            onAtividadesChange={setAtividades}
                        />
                    </Box>
                )}

                {/* Botões de Ação */}
                <Stack spacing={2}>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                        onClick={() => abrirModal('ENTRADA')}
                        disabled={isPending || !!pontoAberto}
                        sx={{ py: 2, borderRadius: 3, fontWeight: 700 }}
                    >
                        Registrar Entrada
                    </Button>

                    <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <Stop />}
                        onClick={() => abrirModal('SAIDA')}
                        disabled={isPending || !pontoAberto}
                        sx={{ py: 2, borderRadius: 3, fontWeight: 700, borderWidth: 2 }}
                    >
                        Registrar Saída
                    </Button>
                </Stack>
            </Container>

            {/* Modal de Registro */}
            <Dialog open={modalOpen} onClose={fecharModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {modalTipo === 'ENTRADA' ? '📥 Registrar Entrada' : '📤 Registrar Saída'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {/* Feedback */}
                        {erro && <Alert severity="error">{erro}</Alert>}
                        {sucesso && <Alert severity="success">{sucesso}</Alert>}

                        {/* Localização */}
                        <CapturaLocalizacao
                            onLocationCapture={setLocation}
                            disabled={isPending}
                        />

                        {/* Mídia */}
                        <CapturaMidia
                            onMidiasChange={setMidias}
                            disabled={isPending}
                        />

                        {/* Atividades (apenas na saída) */}
                        {modalTipo === 'SAIDA' && (
                            <ListaAtividades
                                atividades={atividades}
                                onAtividadesChange={setAtividades}
                                disabled={isPending}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={fecharModal} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={confirmarRegistro}
                        disabled={isPending || !location}
                        startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isPending ? 'Registrando...' : 'Confirmar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
