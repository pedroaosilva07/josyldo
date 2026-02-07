'use client';

import { useState } from 'react';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Container, Button,
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import { Logout, Dashboard, People, History, Menu as MenuIcon } from '@mui/icons-material';
import Link from 'next/link';
import { logoutAction } from '../login/actions';

export default function AdminLayoutClient({
    children
}: {
    children: React.ReactNode;
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return;
        }
        setDrawerOpen(open);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard />, href: '/admin/dashboard' },
        { text: 'Funcionários', icon: <People />, href: '/admin/funcionarios' },
        { text: 'Histórico', icon: <History />, href: '/admin/historico' },
    ];

    const drawerContent = (
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
                <Typography variant="h6" fontWeight={700}>Menu</Typography>
            </Box>
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton component={Link} href={item.href}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                <form action={logoutAction}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Logout />}
                        type="submit"
                        fullWidth
                    >
                        Sair
                    </Button>
                </form>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
            <AppBar position="static" sx={{ bgcolor: 'secondary.main' }}>
                <Toolbar>
                    {/* Botão Hamburger (Só Mobile) */}
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
                        onClick={toggleDrawer(true)}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                        Josyldo Admin
                    </Typography>

                    {/* Menu Desktop */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                        {menuItems.map((item) => (
                            <Button
                                key={item.text}
                                color="inherit"
                                component={Link}
                                href={item.href}
                                startIcon={item.icon}
                            >
                                {item.text}
                            </Button>
                        ))}
                    </Box>

                    {/* Botão Sair Desktop */}
                    <Box sx={{ ml: 2, display: { xs: 'none', md: 'block' } }}>
                        <form action={logoutAction}>
                            <IconButton color="inherit" type="submit">
                                <Logout />
                            </IconButton>
                        </form>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Drawer Mobile */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
            >
                {drawerContent}
            </Drawer>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {children}
            </Container>
        </Box>
    );
}
