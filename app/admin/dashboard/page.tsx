'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Chip, Alert } from '@mui/material';
// Como o Leaflet precisa de 'window', ele deve ser carregado dinamicamente
import dynamic from 'next/dynamic';
// Importação dinâmica do mapa para evitar erro de SSR
const AdminMap = dynamic(() => import('../../components/AdminMap'), { ssr: false });

export default function AdminDashboard() {
    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
                Visão Geral
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 0, height: '500px', overflow: 'hidden', borderRadius: 2 }}>
                        <AdminMap />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Atividade Recente
                        </Typography>
                        <Alert severity="info">Recurso em desenvolvimento: Lista de quem entrou/saiu hoje.</Alert>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
