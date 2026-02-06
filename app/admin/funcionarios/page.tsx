'use client';

import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Stack, Alert, MenuItem
} from '@mui/material';
import { Add, Refresh, PersonAdd } from '@mui/icons-material';
import { listarUsuariosAction, criarUsuarioAction } from './actions';

interface Usuario {
    id: string;
    username: string;
    nome_completo: string | null;
    role: 'USER' | 'ADMIN';
    created_at: string;
}

export default function GerenciarFuncionarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState<{ tipo: 'success' | 'error', text: string } | null>(null);

    const carregar = async () => {
        setLoading(true);
        try {
            const dados = await listarUsuariosAction();
            setUsuarios(dados);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregar(); }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const res = await criarUsuarioAction(formData);

        if (res.success) {
            setMessage({ tipo: 'success', text: res.message });
            carregar();
            setTimeout(() => {
                setOpen(false);
                setMessage(null);
            }, 1000);
        } else {
            setMessage({ tipo: 'error', text: res.message });
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={700}>Funcionários</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpen(true)}
                >
                    Novo Funcionário
                </Button>
            </Stack>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                                <TableCell fontWeight="bold">Nome</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Permissão</TableCell>
                                <TableCell>Data Cadastro</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usuarios.map((u) => (
                                <TableRow key={u.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{u.nome_completo}</TableCell>
                                    <TableCell>{u.username}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={u.role}
                                            size="small"
                                            color={u.role === 'ADMIN' ? 'secondary' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(u.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                </TableRow>
                            ))}
                            {usuarios.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Nenhum usuário encontrado</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal Novo Usuario */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Novo Funcionário</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {message && <Alert severity={message.tipo}>{message.text}</Alert>}

                            <TextField
                                name="nome"
                                label="Nome Completo"
                                required
                                fullWidth
                            />
                            <TextField
                                name="username"
                                label="Usuário (Login)"
                                required
                                fullWidth
                            />
                            <TextField
                                name="password"
                                label="Senha"
                                type="password"
                                required
                                fullWidth
                            />
                            <TextField
                                name="role"
                                label="Permissão"
                                select
                                defaultValue="USER"
                                fullWidth
                            >
                                <MenuItem value="USER">Funcionário (Comum)</MenuItem>
                                <MenuItem value="ADMIN">Administrador</MenuItem>
                            </TextField>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained">Salvar</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
