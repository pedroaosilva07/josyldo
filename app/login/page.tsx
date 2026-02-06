'use client';

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import {
    Button, Paper, TextField, Box, Typography,
    Container, Alert, CircularProgress
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

interface LoginState {
    success: boolean;
    message: string;
    redirectTo?: string;
}

export default function Login() {
    const router = useRouter();

    const [state, action, isPending] = useActionState(
        async (_state: LoginState | null, formData: FormData) => {
            return await loginAction(formData) as LoginState;
        },
        null
    );

    // Redireciona após login bem-sucedido
    useEffect(() => {
        if (state?.success && state?.redirectTo) {
            router.push(state.redirectTo);
        }
    }, [state, router]);

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        borderRadius: 3,
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2
                        }}
                    >
                        <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
                    </Box>

                    <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                        Controle de Serviço
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Faça login para continuar
                    </Typography>

                    {/* Feedback de erro */}
                    {state && !state.success && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {state.message}
                        </Alert>
                    )}
                    {/* Feedback de sucesso */}
                    {state?.success && (
                        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                            {state.message}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        action={action}
                        sx={{ width: '100%' }}
                    >
                        <TextField
                            name="username"
                            label="Usuário"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            autoComplete="username"
                            autoFocus
                            disabled={isPending}
                        />
                        <TextField
                            name="password"
                            label="Senha"
                            type="password"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            autoComplete="current-password"
                            disabled={isPending}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 600 }}
                            disabled={isPending || state?.success}
                        >
                            {isPending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : state?.success ? (
                                "Redirecionando..."
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}