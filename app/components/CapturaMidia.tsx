'use client';

import { useState, useRef } from 'react';
import {
    Box, Typography, Button, Paper, IconButton,
    Stack, Dialog, DialogContent, DialogActions
} from '@mui/material';
import {
    CameraAlt, Videocam, Delete, Close, FlipCameraAndroid
} from '@mui/icons-material';

interface MidiaItem {
    id: string;
    tipo: 'FOTO' | 'VIDEO';
    blob: Blob;
    preview: string;
    nome: string;
}

interface CapturaMidiaProps {
    onMidiasChange: (midias: MidiaItem[]) => void;
    disabled?: boolean;
}

export default function CapturaMidia({ onMidiasChange, disabled }: CapturaMidiaProps) {
    const [midias, setMidias] = useState<MidiaItem[]>([]);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'foto' | 'video'>('foto');
    const [isRecording, setIsRecording] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startCamera = async (mode: 'foto' | 'video') => {
        setCameraMode(mode);
        setCameraOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
                audio: mode === 'video'
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Erro ao acessar câmera:', err);
            console.error('Erro ao acessar câmera:', err);
            alert('Não foi possível acessar a câmera. \n\nPor favor, verifique se você permitiu o acesso à câmera nas configurações do navegador (ícone de cadeado na barra de endereço).');
            setCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraOpen(false);
        setIsRecording(false);
    };

    const flipCamera = async () => {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        stopCamera();
        await startCamera(cameraMode);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const newMidia: MidiaItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    tipo: 'FOTO',
                    blob,
                    preview: URL.createObjectURL(blob),
                    nome: `foto_${new Date().toISOString()}.jpg`
                };
                const updated = [...midias, newMidia];
                setMidias(updated);
                onMidiasChange(updated);
            }
        }, 'image/jpeg', 0.8);

        stopCamera();
    };

    const startRecording = () => {
        if (!streamRef.current) return;

        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm'
        });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const newMidia: MidiaItem = {
                id: Math.random().toString(36).substr(2, 9),
                tipo: 'VIDEO',
                blob,
                preview: URL.createObjectURL(blob),
                nome: `video_${new Date().toISOString()}.webm`
            };
            const updated = [...midias, newMidia];
            setMidias(updated);
            onMidiasChange(updated);
            stopCamera();
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const removeMidia = (id: string) => {
        const updated = midias.filter(m => m.id !== id);
        setMidias(updated);
        onMidiasChange(updated);
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                📸 Fotos e Vídeos
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<CameraAlt />}
                    onClick={() => startCamera('foto')}
                    disabled={disabled}
                    fullWidth
                >
                    Tirar Foto
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Videocam />}
                    onClick={() => startCamera('video')}
                    disabled={disabled}
                    fullWidth
                >
                    Gravar Vídeo
                </Button>
            </Stack>

            {/* Preview de mídias capturadas */}
            {midias.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {midias.map((midia) => (
                        <Box
                            key={midia.id}
                            sx={{
                                position: 'relative',
                                width: 80,
                                height: 80,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '2px solid',
                                borderColor: midia.tipo === 'FOTO' ? 'primary.main' : 'secondary.main'
                            }}
                        >
                            {midia.tipo === 'FOTO' ? (
                                <img
                                    src={midia.preview}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <video
                                    src={midia.preview}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                            <IconButton
                                size="small"
                                onClick={() => removeMidia(midia.id)}
                                sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    bgcolor: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    p: 0.3,
                                    '&:hover': { bgcolor: 'error.main' }
                                }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Dialog da Câmera */}
            <Dialog
                open={cameraOpen}
                onClose={stopCamera}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent sx={{ p: 0, position: 'relative' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', display: 'block' }}
                    />
                    <IconButton
                        onClick={flipCamera}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white'
                        }}
                    >
                        <FlipCameraAndroid />
                    </IconButton>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
                    {cameraMode === 'foto' ? (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={capturePhoto}
                            startIcon={<CameraAlt />}
                        >
                            Capturar
                        </Button>
                    ) : isRecording ? (
                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            onClick={stopRecording}
                        >
                            ⏹️ Parar Gravação
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            onClick={startRecording}
                        >
                            🔴 Iniciar Gravação
                        </Button>
                    )}
                    <Button onClick={stopCamera} startIcon={<Close />}>
                        Cancelar
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
