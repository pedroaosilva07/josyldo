'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Container, Typography, Paper, AppBar, Toolbar, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Button, Stack, Chip, CircularProgress, Dialog,
    DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
    Divider, Alert
} from '@mui/material';
import {
    ArrowBack, Download, Search, AccessTime, LocationOn,
    PhotoCamera, Videocam, Assignment
} from '@mui/icons-material';
import { buscarRegistrosAction, buscarDetalhesRegistroAction, RelatorioDetalhado } from './actions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface RegistroResumo (única definição)
interface RegistroResumo {
    id: string;
    data_hora: string;
    endereco: string | null;
    saida_data_hora: string | null;
    duracao_minutos: number | null;
    total_atividades: number;
    total_midias: number;
}

export default function Relatorios() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Filtros
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Dados
    const [registros, setRegistros] = useState<RegistroResumo[]>([]);
    const [loading, setLoading] = useState(true);

    // Detalhes
    const [detalhesOpen, setDetalhesOpen] = useState(false);
    const [detalhes, setDetalhes] = useState<RelatorioDetalhado | null>(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);

    // Carrega registros iniciais
    useEffect(() => {
        buscarRegistros();
    }, []);

    const buscarRegistros = async () => {
        setLoading(true);
        try {
            const result = await buscarRegistrosAction({
                dataInicio: dataInicio || undefined,
                dataFim: dataFim || undefined
            });
            setRegistros(result as RegistroResumo[]);
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
        } finally {
            setLoading(false);
        }
    };

    const abrirDetalhes = async (pontoId: string) => {
        setLoadingDetalhes(true);
        setDetalhesOpen(true);
        try {
            const result = await buscarDetalhesRegistroAction(pontoId);
            setDetalhes(result);
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
        } finally {
            setLoadingDetalhes(false);
        }
    };

    const formatarData = (dataHora: string) => {
        return new Date(dataHora).toLocaleDateString('pt-BR');
    };

    const formatarHora = (dataHora: string) => {
        return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatarDuracao = (minutos: number | null) => {
        if (minutos === null) return '-';
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
    };

    // ====================================
    // GERAR PDF
    // ====================================
    const gerarPDF = async (registro: RegistroResumo) => {
        const detalhesCompletos = await buscarDetalhesRegistroAction(registro.id);
        if (!detalhesCompletos) {
            alert('Erro ao buscar detalhes para o PDF');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let y = 20;

        // --- Helper de Imagem ---
        const carregarImagem = (url: string): Promise<{ base64: string, ratio: number }> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve({
                            base64: canvas.toDataURL('image/jpeg', 0.8),
                            ratio: img.width / img.height
                        });
                    } else {
                        reject(new Error('Erro ao criar context canvas'));
                    }
                };
                img.onerror = () => reject(new Error(`Erro ao carregar imagem: ${url}`));
                img.src = url;
            });
        };

        const checkPageBreak = (heightNeeded: number) => {
            if (y + heightNeeded > pageHeight - margin) {
                doc.addPage();
                y = margin;
                return true;
            }
            return false;
        };

        // --- Cabeçalho ---
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Serviço', pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
        y += 8;

        if (detalhesCompletos.nome_funcionario) {
            doc.setFontSize(11);
            doc.text(`Funcionário: ${detalhesCompletos.nome_funcionario}`, pageWidth / 2, y, { align: 'center' });
            y += 8;
        }

        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // --- Entrada ---
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Entrada', margin, y); // Removido emoji
        y += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data/Hora: ${new Date(detalhesCompletos.entrada.data_hora).toLocaleString('pt-BR')}`, margin + 5, y);
        y += 6;

        if (detalhesCompletos.entrada.endereco) {
            const linhas = doc.splitTextToSize(`Local: ${detalhesCompletos.entrada.endereco}`, pageWidth - margin * 2 - 5);
            doc.text(linhas, margin + 5, y);
            y += linhas.length * 6;
        } else if (detalhesCompletos.entrada.latitude) {
            doc.text(`Coords: ${detalhesCompletos.entrada.latitude}, ${detalhesCompletos.entrada.longitude}`, margin + 5, y);
            y += 6;
        }
        y += 4;

        // --- Saída ---
        if (detalhesCompletos.saida) {
            checkPageBreak(40);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Saída', margin, y); // Removido emoji
            y += 8;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Data/Hora: ${new Date(detalhesCompletos.saida.data_hora).toLocaleString('pt-BR')}`, margin + 5, y);
            y += 6;

            if (detalhesCompletos.saida.endereco) {
                const linhas = doc.splitTextToSize(`Local: ${detalhesCompletos.saida.endereco}`, pageWidth - margin * 2 - 5);
                doc.text(linhas, margin + 5, y);
                y += linhas.length * 6;
            }

            if (detalhesCompletos.duracao_minutos !== null) {
                y += 2;
                doc.setFont('helvetica', 'bold');
                doc.text(`Duração Total: ${formatarDuracao(detalhesCompletos.duracao_minutos)}`, margin + 5, y);
                y += 8;
            }
            y += 4;
        }

        // --- Atividades ---
        if (detalhesCompletos.atividades.length > 0) {
            checkPageBreak(30);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Atividades Realizadas', margin, y);
            y += 6;

            autoTable(doc, {
                startY: y,
                head: [['#', 'Descrição', 'Horário']],
                body: detalhesCompletos.atividades.map((a, i) => [
                    (i + 1).toString(),
                    a.descricao,
                    new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                ]),
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] },
                margin: { left: margin, right: margin }
            });

            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // --- Mídias (Imagens) ---
        const todasMidias = [...detalhesCompletos.midias_entrada, ...detalhesCompletos.midias_saida];
        const fotos = todasMidias.filter(m => m.tipo === 'FOTO');

        if (fotos.length > 0) {
            checkPageBreak(30);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Fotos Anexadas (${fotos.length})`, margin, y);
            y += 10;

            for (const foto of fotos) {
                try {
                    const { base64, ratio } = await carregarImagem(foto.caminho_arquivo);

                    // Define largura da imagem (maxpageWidth - margins)
                    const imgWidth = 100; // Defina um tamanho fixo ou largura da página
                    // Se quiser ocupar metade da pagina: (pageWidth - margin*2) / 2
                    // Vamos usar largura fixa de 120mm ou ajustar se for retrato/paisagem

                    // Vamos usar largura disponivel de 150mm (para não ficar enorme)
                    const displayWidth = 140;
                    const displayHeight = displayWidth / ratio;

                    checkPageBreak(displayHeight + 10);

                    doc.addImage(base64, 'JPEG', margin, y, displayWidth, displayHeight);

                    // Legenda da foto
                    y += displayHeight + 2;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'italic');
                    const tipoTexto = detalhesCompletos.midias_entrada.some(m => m.id === foto.id) ? "Entrada" : "Saída";
                    doc.text(`Foto de ${tipoTexto} - ${foto.nome_original}`, margin, y);

                    y += 10; // Espaço para próxima foto

                } catch (err) {
                    console.error("Erro ao add imagem", err);
                    checkPageBreak(10);
                    doc.setFontSize(10);
                    doc.setTextColor(255, 0, 0);
                    doc.text(`Erro ao carregar imagem: ${foto.nome_original}`, margin, y);
                    doc.setTextColor(0, 0, 0);
                    y += 10;
                }
            }
        }

        // Rodapé
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Sistema de Controle de Serviço - Josyldo', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        doc.save(`relatorio_${formatarData(registro.data_hora).replace(/\//g, '-')}.pdf`);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
            {/* AppBar */}
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    <IconButton color="inherit" onClick={() => router.push('/dashboard')} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Relatórios
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ py: 3 }}>
                {/* Filtros */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        🔍 Filtros
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
                        <TextField
                            label="Data Início"
                            type="date"
                            size="small"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Data Fim"
                            type="date"
                            size="small"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={buscarRegistros}
                            disabled={loading}
                            sx={{ minWidth: 120 }}
                        >
                            Buscar
                        </Button>
                    </Stack>
                </Paper>

                {/* Tabela de Registros */}
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: 'primary.main' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Data</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Entrada</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Saída</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Duração</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Info</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : registros.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                Nenhum registro encontrado.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    registros.map((registro) => (
                                        <TableRow key={registro.id} hover>
                                            <TableCell>{formatarData(registro.data_hora)}</TableCell>
                                            <TableCell>{formatarHora(registro.data_hora)}</TableCell>
                                            <TableCell>
                                                {registro.saida_data_hora
                                                    ? formatarHora(registro.saida_data_hora)
                                                    : <Chip label="Em aberto" size="small" color="warning" />
                                                }
                                            </TableCell>
                                            <TableCell>{formatarDuracao(registro.duracao_minutos)}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    {registro.total_atividades > 0 && (
                                                        <Chip
                                                            icon={<Assignment />}
                                                            label={registro.total_atividades}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {registro.total_midias > 0 && (
                                                        <Chip
                                                            icon={<PhotoCamera />}
                                                            label={registro.total_midias}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => abrirDetalhes(registro.id)}
                                                    >
                                                        Ver
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Download />}
                                                        onClick={() => gerarPDF(registro)}
                                                    >
                                                        PDF
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            {/* Dialog de Detalhes */}
            <Dialog open={detalhesOpen} onClose={() => setDetalhesOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    📄 Detalhes do Registro
                </DialogTitle>
                <DialogContent>
                    {loadingDetalhes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : detalhes ? (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {/* Entrada */}
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600} color="primary">
                                    📥 Entrada
                                </Typography>
                                <Typography variant="body2">
                                    {new Date(detalhes.entrada.data_hora).toLocaleString('pt-BR')}
                                </Typography>
                                {detalhes.entrada.endereco && (
                                    <Typography variant="caption" color="text.secondary">
                                        📍 {detalhes.entrada.endereco}
                                    </Typography>
                                )}
                            </Paper>

                            {/* Saída */}
                            {detalhes.saida ? (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600} color="secondary">
                                        📤 Saída
                                    </Typography>
                                    <Typography variant="body2">
                                        {new Date(detalhes.saida.data_hora).toLocaleString('pt-BR')}
                                    </Typography>
                                    {detalhes.saida.endereco && (
                                        <Typography variant="caption" color="text.secondary">
                                            📍 {detalhes.saida.endereco}
                                        </Typography>
                                    )}
                                    {detalhes.duracao_minutos !== null && (
                                        <Chip
                                            icon={<AccessTime />}
                                            label={formatarDuracao(detalhes.duracao_minutos)}
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    )}
                                </Paper>
                            ) : (
                                <Alert severity="warning">Ponto ainda em aberto</Alert>
                            )}

                            {/* Atividades */}
                            {detalhes.atividades.length > 0 && (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        📋 Atividades ({detalhes.atividades.length})
                                    </Typography>
                                    <List dense>
                                        {detalhes.atividades.map((a, i) => (
                                            <ListItem key={a.id}>
                                                <ListItemText
                                                    primary={`${i + 1}. ${a.descricao}`}
                                                    secondary={new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            )}

                            {/* Mídias */}
                            {(detalhes.midias_entrada.length > 0 || detalhes.midias_saida.length > 0) && (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        📷 Mídias ({detalhes.midias_entrada.length + detalhes.midias_saida.length})
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                        {[...detalhes.midias_entrada, ...detalhes.midias_saida].map((m) => (
                                            <Chip
                                                key={m.id}
                                                icon={m.tipo === 'FOTO' ? <PhotoCamera /> : <Videocam />}
                                                label={m.nome_original}
                                                size="small"
                                                onClick={() => window.open(m.caminho_arquivo, '_blank')}
                                                clickable
                                            />
                                        ))}
                                    </Stack>
                                </Paper>
                            )}
                        </Stack>
                    ) : (
                        <Alert severity="error">Erro ao carregar detalhes</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetalhesOpen(false)}>Fechar</Button>
                    {detalhes && (
                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => {
                                const registro = registros.find(r => r.id === detalhes.entrada.id);
                                if (registro) gerarPDF(registro);
                            }}
                        >
                            Baixar PDF
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
