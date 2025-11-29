import { Box, Container, Typography, Paper } from '@mui/material';
import { LoginButton } from '../../components/auth/LoginButton';
import CloudIcon from '@mui/icons-material/Cloud';

/**
 * Login page
 * Entry point for unauthenticated users
 */
export function LoginPage() {
    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 6,
                        width: '100%',
                        borderRadius: 2,
                        textAlign: 'center',
                    }}
                >
                    <CloudIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />

                    <Typography variant="h3" gutterBottom fontWeight={600}>
                        Personal Cloud Storage
                    </Typography>

                    <Typography
                        variant="h6"
                        color="text.secondary"
                        paragraph
                        sx={{ mb: 4 }}
                    >
                        Secure, intelligent file storage with AI-powered features
                    </Typography>

                    <Box display="flex" justifyContent="center" mt={4}>
                        <LoginButton />
                    </Box>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 4 }}
                    >
                        Sign in to access your files and start organizing with AI
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
}
