'use client';

import { useActionState } from "react";
// Importamos a action que criaremos no passo abaixo
import { loginAction } from "./actions"; 
import { 
    Button, Paper, TextField, Box, Typography, 
    Container, Alert, CircularProgress 
} from "@mui/material";

export default function Login() {
    // state: retorno da action | action: função disparada pelo form | isPending: status de loading
    const [state, action, isPending] = useActionState(
        async (_state: { success: boolean; message: any; } | null, formData: FormData) => {
            return await loginAction(formData);
        },
        null
    );

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{
                marginTop: 20, // Ajustei de 30 para 20 para caber melhor o alerta
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        borderRadius: 2,
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                        Acesso ao Sistema
                    </Typography>

                    {/* Feedback visual do Mock */}
                    {state && !state.success && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {state.message}
                        </Alert>
                    )}
                    {state?.success && (
                        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                            {state.message}
                        </Alert>
                    )}

                    <Box 
                        component="form" 
                        action={action} // Liga o formulário à Server Action
                        sx={{ mt: 1, width: '100%' }}
                    >
                        <TextField
                            name="username" // Identificador para o banco mocado
                            label="Usuário"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            autoComplete="username"
                            autoFocus
                            disabled={isPending}
                        />
                        <TextField
                            name="password" // Identificador para o banco mocado
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
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <CircularProgress size={24} color="inherit" />
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