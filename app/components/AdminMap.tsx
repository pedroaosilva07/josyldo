'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { buscarFuncionariosAtivos, FuncionarioAtivo } from '../admin/dashboard/actions';
import { Box, Typography, Chip, CircularProgress, Alert } from '@mui/material';
import { Person } from '@mui/icons-material';

// Fix para ícones do Leaflet no Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente para ajustar zoom aos marcadores
function MapController({ markers }: { markers: FuncionarioAtivo[] }) {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const group = new L.FeatureGroup(
                markers
                    .filter(m => m.latitude && m.longitude)
                    .map(m => L.marker([m.latitude!, m.longitude!]))
            );
            map.fitBounds(group.getBounds().pad(0.2));
        }
    }, [markers, map]);

    return null;
}

export default function AdminMap() {
    const [funcionarios, setFuncionarios] = useState<FuncionarioAtivo[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchData = async () => {
        try {
            const data = await buscarFuncionariosAtivos();
            setFuncionarios(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Erro ao buscar funcionarios:', error);
        } finally {
            setLoading(false);
        }
    };

    // Polling a cada 30 segundos
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const funcionariosComLocal = funcionarios.filter(f => f.latitude && f.longitude);

    return (
        <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
            {/* Info Overlay */}
            <Box sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1000,
                bgcolor: 'white',
                p: 1.5,
                borderRadius: 2,
                boxShadow: 3
            }}>
                <Typography variant="subtitle2" fontWeight={700}>
                    Em serviço agora: {funcionarios.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Atualizado: {lastUpdate.toLocaleTimeString()}
                </Typography>
                {loading && <CircularProgress size={12} sx={{ ml: 1 }} />}
            </Box>

            {funcionariosComLocal.length === 0 && !loading && (
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    width: '80%'
                }}>
                    <Alert severity="info">Nenhum funcionário com localização ativa no momento.</Alert>
                </Box>
            )}

            <MapContainer
                center={[-20.1213032, -44.8920272]} // Default (ex: Divinópolis) ou pegar do user
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {funcionariosComLocal.map((func) => (
                    <Marker
                        key={func.user_id}
                        position={[func.latitude!, func.longitude!]}
                    >
                        <Popup>
                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {func.nome_completo || func.username}
                                </Typography>
                                <Chip
                                    label="Em Serviço"
                                    color="success"
                                    size="small"
                                    sx={{ my: 0.5 }}
                                />
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    Entrada: {new Date(func.data_hora).toLocaleTimeString()}
                                </Typography>
                                {func.endereco && (
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                        📍 {func.endereco}
                                    </Typography>
                                )}
                            </Box>
                        </Popup>
                    </Marker>
                ))}

                <MapController markers={funcionariosComLocal} />
            </MapContainer>
        </Box>
    );
}
