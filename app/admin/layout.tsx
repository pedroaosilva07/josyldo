import { Box, AppBar, Toolbar, Typography, IconButton, Container, Button } from '@mui/material';
import { Logout, Dashboard, People } from '@mui/icons-material';
import { requireAdmin } from "../lib/auth"; // Ajuste o path conforme necessário
import Link from 'next/link';
import { logoutAction } from '../login/actions';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireAdmin();

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
            <AppBar position="static" sx={{ bgcolor: 'secondary.main' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                        Josyldo Admin
                    </Typography>

                    <Button color="inherit" component={Link} href="/admin/dashboard" startIcon={<Dashboard />}>
                        Dashboard
                    </Button>
                    <Button color="inherit" component={Link} href="/admin/funcionarios" startIcon={<People />}>
                        Funcionários
                    </Button>

                    <Box sx={{ ml: 2 }}>
                        <form action={logoutAction}>
                            <IconButton color="inherit" type="submit">
                                <Logout />
                            </IconButton>
                        </form>
                    </Box>
                </Toolbar>
            </AppBar>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {children}
            </Container>
        </Box>
    );
}
