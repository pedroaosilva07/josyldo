'use client';

import { useState } from 'react';
import {
    Box, Typography, TextField, Button, Paper, List,
    ListItem, ListItemText, IconButton, Divider
} from '@mui/material';
import { Add, Delete, Edit, Check, Close } from '@mui/icons-material';

export interface Atividade {
    id: string;
    descricao: string;
    criadoEm: string;
}

interface ListaAtividadesProps {
    atividades: Atividade[];
    onAtividadesChange: (atividades: Atividade[]) => void;
    disabled?: boolean;
}

export default function ListaAtividades({ atividades, onAtividadesChange, disabled }: ListaAtividadesProps) {
    const [novaDescricao, setNovaDescricao] = useState('');
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editandoTexto, setEditandoTexto] = useState('');

    const adicionarAtividade = () => {
        if (!novaDescricao.trim()) return;

        const nova: Atividade = {
            id: Math.random().toString(36).substr(2, 9),
            descricao: novaDescricao.trim(),
            criadoEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        onAtividadesChange([...atividades, nova]);
        setNovaDescricao('');
    };

    const removerAtividade = (id: string) => {
        onAtividadesChange(atividades.filter(a => a.id !== id));
    };

    const iniciarEdicao = (atividade: Atividade) => {
        setEditandoId(atividade.id);
        setEditandoTexto(atividade.descricao);
    };

    const salvarEdicao = () => {
        if (!editandoTexto.trim() || !editandoId) return;

        onAtividadesChange(
            atividades.map(a =>
                a.id === editandoId
                    ? { ...a, descricao: editandoTexto.trim() }
                    : a
            )
        );
        cancelarEdicao();
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setEditandoTexto('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            adicionarAtividade();
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                📋 Atividades Realizadas
            </Typography>

            {/* Formulário para adicionar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Descreva a atividade realizada..."
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled}
                    fullWidth
                />
                <Button
                    variant="contained"
                    onClick={adicionarAtividade}
                    disabled={disabled || !novaDescricao.trim()}
                    sx={{ minWidth: 100 }}
                >
                    <Add sx={{ mr: 0.5 }} /> Inserir
                </Button>
            </Box>

            {/* Lista de atividades */}
            {atividades.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Nenhuma atividade registrada ainda.
                </Typography>
            ) : (
                <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                    {atividades.map((atividade, index) => (
                        <Box key={atividade.id}>
                            {index > 0 && <Divider />}
                            <ListItem
                                secondaryAction={
                                    editandoId === atividade.id ? (
                                        <>
                                            <IconButton size="small" onClick={salvarEdicao} color="success">
                                                <Check />
                                            </IconButton>
                                            <IconButton size="small" onClick={cancelarEdicao} color="error">
                                                <Close />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <IconButton
                                                size="small"
                                                onClick={() => iniciarEdicao(atividade)}
                                                disabled={disabled}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => removerAtividade(atividade.id)}
                                                disabled={disabled}
                                                color="error"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </>
                                    )
                                }
                            >
                                {editandoId === atividade.id ? (
                                    <TextField
                                        size="small"
                                        value={editandoTexto}
                                        onChange={(e) => setEditandoTexto(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && salvarEdicao()}
                                        autoFocus
                                        fullWidth
                                        sx={{ mr: 8 }}
                                    />
                                ) : (
                                    <ListItemText
                                        primary={atividade.descricao}
                                        secondary={`Adicionado às ${atividade.criadoEm}`}
                                    />
                                )}
                            </ListItem>
                        </Box>
                    ))}
                </List>
            )}

            {atividades.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Total: {atividades.length} atividade(s)
                </Typography>
            )}
        </Paper>
    );
}
