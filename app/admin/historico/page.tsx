'use client';

import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, MenuItem,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, CircularProgress,
    Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Alert
} from '@mui/material';
import { Visibility, PictureAsPdf, AccessTime, LocationOn } from '@mui/icons-material';
import { listarUsuariosAction } from '../funcionarios/actions';
import { buscarHistoricoFuncionario, buscarDetalhesPonto, HistoricoItem, HistoricoResult } from './actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type extensions for jsPDF
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable?: { finalY: number };
}

interface Turno {
    id: string; // ID da entrada
    data: string;
    entrada: HistoricoItem;
    saida?: HistoricoItem;
    duracao?: string;
    status: 'CONCLUIDO' | 'EM_ANDAMENTO' | 'ERRO_SAIDA_SEM_ENTRADA';
}

interface DetalhesPonto {
    midias: { tipo: 'FOTO' | 'VIDEO', url: string }[];
    atividades: { descricao: string }[];
}

export default function HistoricoPage() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [historico, setHistorico] = useState<HistoricoResult | null>(null);
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [loading, setLoading] = useState(false);

    // Dialog Detalhes
    const [dialogOpen, setDialogOpen] = useState(false);
    const [turnoSelecionado, setTurnoSelecionado] = useState<Turno | null>(null);
    const [detalhesEntrada, setDetalhesEntrada] = useState<DetalhesPonto | null>(null);
    const [detalhesSaida, setDetalhesSaida] = useState<DetalhesPonto | null>(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);

    // Carrega lista de usuários
    useEffect(() => {
        listarUsuariosAction().then(setUsuarios);
    }, []);

    // Carrega histórico e processa turnos
    useEffect(() => {
        if (selectedUser) {
            setLoading(true);
            buscarHistoricoFuncionario(selectedUser)
                .then(res => {
                    setHistorico(res);
                    if (res) {
                        processarTurnos(res.pontos);
                    } else {
                        setTurnos([]);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setHistorico(null);
            setTurnos([]);
        }
    }, [selectedUser]);

    const processarTurnos = (pontos: HistoricoItem[]) => {
        const turnosMap = new Map<string, Turno>();
        const saidasOrfãs: HistoricoItem[] = [];

        // Pontos vêm ordenados por data DESC (mais recente primeiro)
        // Vamos processar de baixo para cima (antigo -> novo) ou só iterar
        // Melhor iterar e usar o ponto_entrada_id para vincular

        const pontosOrdenados = [...pontos].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

        // Estratégia: Criar turno para cada ENTRADA.
        // Vincular SAIDA correspondente.

        const novosTurnos: Turno[] = [];

        pontosOrdenados.forEach(p => {
            if (p.tipo === 'ENTRADA') {
                const turno: Turno = {
                    id: p.id,
                    data: new Date(p.data_hora).toLocaleDateString('pt-BR'),
                    entrada: p,
                    status: 'EM_ANDAMENTO'
                };
                novosTurnos.push(turno);
            } else if (p.tipo === 'SAIDA') {
                // Tenta achar a entrada correspondente
                const entradaId = p.ponto_entrada_id;
                const turno = novosTurnos.find(t => t.id === entradaId);

                if (turno) {
                    turno.saida = p;
                    turno.status = 'CONCLUIDO';

                    // Calcula duração
                    const inicio = new Date(turno.entrada.data_hora).getTime();
                    const fim = new Date(p.data_hora).getTime();
                    const diffMs = fim - inicio;
                    const diffHrs = Math.floor(diffMs / 3600000);
                    const diffMins = Math.floor((diffMs % 3600000) / 60000);
                    turno.duracao = `${diffHrs}h ${diffMins}m`;
                } else {
                    // Saída sem entrada carregada (pode ser de paginação antiga)
                    // Ignorar ou mostrar erro? Vamos ignorar para manter limpo, ou criar um turno 'ERRO'
                }
            }
        });

        // Reverter para mostrar mais recente primeiro
        setTurnos(novosTurnos.reverse());
    };

    const verDetalhes = async (turno: Turno) => {
        setTurnoSelecionado(turno);
        setDialogOpen(true);
        setLoadingDetalhes(true);
        setDetalhesEntrada(null);
        setDetalhesSaida(null);

        try {
            const [detEntrada, detSaida] = await Promise.all([
                buscarDetalhesPonto(turno.entrada.id),
                turno.saida ? buscarDetalhesPonto(turno.saida.id) : Promise.resolve(null)
            ]);

            setDetalhesEntrada(detEntrada);
            //@ts-ignore
            setDetalhesSaida(detSaida);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetalhes(false);
        }
    };

    const gerarPDF = () => {
        if (!historico) return;

        const doc = new jsPDF() as jsPDFWithAutoTable;

        doc.setFontSize(18);
        doc.text(`Histórico de Ponto: ${historico.user.nome_completo}`, 14, 20);

        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
        doc.text(`Total de Turnos Visíveis: ${turnos.length}`, 14, 34);

        const tableData = turnos.map(t => [
            t.data,
            new Date(t.entrada.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            t.saida ? new Date(t.saida.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---',
            t.duracao || (t.status === 'EM_ANDAMENTO' ? 'Em andamento' : '-'),
            t.entrada.atividades || '-'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Data', 'Entrada', 'Saída', 'Duração', 'Atividades']],
            body: tableData,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [25, 118, 210] }
        });

        doc.save(`historico_${historico.user.username}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    Histórico de Serviço
                </Typography>
                {turnos.length > 0 && (
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<PictureAsPdf />}
                        onClick={gerarPDF}
                    >
                        Exportar PDF
                    </Button>
                )}
            </Stack>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <TextField
                    select
                    label="Selecione o Funcionário"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    fullWidth
                >
                    {usuarios.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                            {u.nome_completo || u.username} ({u.username})
                        </MenuItem>
                    ))}
                </TextField>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && selectedUser && (
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Entrada</TableCell>
                                    <TableCell>Saída</TableCell>
                                    <TableCell>Duração</TableCell>
                                    <TableCell>Locais</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {turnos.map((turno) => (
                                    <TableRow key={turno.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{turno.data}</TableCell>
                                        <TableCell>{new Date(turno.entrada.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell>
                                            {turno.saida ? (
                                                new Date(turno.saida.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                            ) : (
                                                <Chip label="Em Andamento" color="success" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime fontSize="small" color="action" />
                                                {turno.duracao || '-'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LocationOn fontSize="small" color="action" />
                                                <Typography variant="caption" sx={{ maxWidth: 150 }} noWrap>
                                                    {turno.entrada.endereco || 'Sem endereço'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() => verDetalhes(turno)}
                                                startIcon={<Visibility />}
                                            >
                                                Ver
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {turnos.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            Nenhum turno encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Dialog de Detalhes */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Detalhes do Turno
                </DialogTitle>
                <DialogContent dividers>
                    {loadingDetalhes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : turnoSelecionado && (
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            {/* Entrada */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" color="primary" gutterBottom>Entrada</Typography>
                                <Typography variant="body2"><strong>Hora:</strong> {new Date(turnoSelecionado.entrada.data_hora).toLocaleString('pt-BR')}</Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}><strong>Endereço:</strong> {turnoSelecionado.entrada.endereco || '-'}</Typography>

                                {/* Atividades - Vinculadas à Entrada no DB */}
                                <Box sx={{ mt: 2, bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>Atividades Realizadas:</Typography>
                                    {detalhesEntrada?.atividades && detalhesEntrada.atividades.length > 0 ? (
                                        <ul>
                                            {detalhesEntrada.atividades.map((a, i) => (
                                                <li key={i}><Typography variant="body2">{a.descricao}</Typography></li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">Nenhuma atividade registrada na entrada.</Typography>
                                    )}
                                </Box>

                                {detalhesEntrada?.midias && detalhesEntrada.midias.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">Mídias ({detalhesEntrada.midias.length}):</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 1 }}>
                                            {detalhesEntrada.midias.map((m, i) => (
                                                <Box key={i} component="a" href={m.url} target="_blank" sx={{
                                                    minWidth: 80, height: 80,
                                                    border: '1px solid #ddd', borderRadius: 1,
                                                    backgroundImage: `url(${m.url})`, backgroundSize: 'cover'
                                                }} />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Box>

                            {/* Saída */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" color="secondary" gutterBottom>Saída</Typography>
                                {turnoSelecionado.saida ? (
                                    <>
                                        <Typography variant="body2"><strong>Hora:</strong> {new Date(turnoSelecionado.saida.data_hora).toLocaleString('pt-BR')}</Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Endereço:</strong> {turnoSelecionado.saida.endereco || '-'}</Typography>

                                        {detalhesSaida?.midias && detalhesSaida.midias.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2">Mídias:</Typography>
                                                <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 1 }}>
                                                    {detalhesSaida.midias.map((m, i) => (
                                                        <Box key={i} component="a" href={m.url} target="_blank" sx={{
                                                            minWidth: 80, height: 80,
                                                            border: '1px solid #ddd', borderRadius: 1,
                                                            backgroundImage: `url(${m.url})`, backgroundSize: 'cover'
                                                        }} />
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    <Alert severity="info" sx={{ mt: 2 }}>Turno ainda em andamento.</Alert>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} variant="contained">Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}
