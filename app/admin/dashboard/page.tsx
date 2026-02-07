'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Chip, Alert } from '@mui/material';
// Como o Leaflet precisa de 'window', ele deve ser carregado dinamicamente
import dynamic from 'next/dynamic';
// Importação dinâmica do mapa para evitar erro de SSR
const AdminMap = dynamic(() => import('../../components/AdminMap'), { ssr: false });

// ... imports
import { getDashboardStats } from './actions';

export default function AdminDashboard() {
    const [stats, setStats] = useState<{ active: number, total: number }>({ active: 0, total: 0 });

    useEffect(() => {
        getDashboardStats().then(setStats);
        const interval = setInterval(() => {
            getDashboardStats().then(setStats);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
                Visão Geral
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ flex: 2 }}>
                    <Paper sx={{ p: 0, height: { xs: '50vh', md: '500px' }, overflow: 'hidden', borderRadius: 2 }}>
                        <AdminMap />
                    </Paper>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Status dos Funcionários
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Alert
                                severity={stats.active > 0 ? "success" : "info"}
                                icon={false}
                                sx={{ mb: 1, border: 1, borderColor: 'divider' }}
                            >
                                <Typography variant="h3" fontWeight={700} color={stats.active > 0 ? "success.main" : "text.primary"}>
                                    {stats.active}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    Em Serviço Agora
                                </Typography>
                            </Alert>
                            <Typography variant="caption" color="text.secondary">
                                Total de funcionários cadastrados: {stats.total}
                            </Typography>
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            O mapa mostra a localização em tempo real de quem está com ponto aberto (Entrada sem Saída).
                        </Typography>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
