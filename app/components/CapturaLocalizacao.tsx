'use client';

import { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert,
    Button, Paper, IconButton
} from '@mui/material';
import { MyLocation, LocationOn, Refresh } from '@mui/icons-material';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    endereco?: string;
}

interface CapturaLocalizacaoProps {
    onLocationCapture: (location: LocationData) => void;
    disabled?: boolean;
}

export default function CapturaLocalizacao({ onLocationCapture, disabled }: CapturaLocalizacaoProps) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const captureLocation = async () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocalização não suportada neste dispositivo');
            setLoading(false);
            return;
        }

        const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };

        try {
            // Tenta alta precisão primeiro com timeout curto (5s)
            let position: GeolocationPosition;
            try {
                position = await getPosition({
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 30000 // Aceita cache de 30s
                });
            } catch (err) {
                console.warn('Alta precisão falhou ou demorou, tentando baixa precisão...');
                // Fallback para baixa precisão (rápido)
                position = await getPosition({
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000 // Aceita cache de 1min
                });
            }

            const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            // Tenta obter endereço (reverse geocoding)
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${locationData.latitude}&lon=${locationData.longitude}&format=json`,
                    { signal: AbortSignal.timeout(5000) } // Timeout para API de endereço também
                );
                if (response.ok) {
                    const data = await response.json();
                    locationData.endereco = data.display_name;
                }
            } catch {
                console.warn('Não foi possível obter endereço (timeout ou erro)');
            }

            setLocation(locationData);
            onLocationCapture(locationData);
        } catch (err: any) {
            let message = 'Erro ao obter localização';
            if (err.code === 1) message = 'Permissão de localização negada.';
            else if (err.code === 2) message = 'Localização indisponível.';
            else if (err.code === 3) message = 'Tempo esgotado (GPS instável).';

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Captura automática ao montar
    useEffect(() => {
        captureLocation();
    }, []);

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                    Localização
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton
                    size="small"
                    onClick={captureLocation}
                    disabled={loading || disabled}
                >
                    <Refresh />
                </IconButton>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Obtendo localização...
                    </Typography>
                </Box>
            )}

            {error && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                    {error}
                    <Button size="small" onClick={captureLocation} sx={{ ml: 1 }}>
                        Tentar novamente
                    </Button>
                </Alert>
            )}

            {location && !loading && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Coordenadas: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Typography>
                    {location.endereco && (
                        <Typography variant="body2" sx={{
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            fontSize: '0.8rem'
                        }}>
                            📍 {location.endereco}
                        </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                        Precisão: ±{Math.round(location.accuracy)}m
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}
