import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    Lock as LockIcon,
    Download as DownloadIcon,
    Description as FileIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import shareService from '../services/shareService';
import { formatBytes } from '../utils/formatters';

export default function ShareAccessPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [password, setPassword] = useState('');
    const [data, setData] = useState(null);

    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewError, setPreviewError] = useState(false);

    const fetchShare = async (pwd) => {
        try {
            setLoading(true);
            setError(null);
            const result = await shareService.accessShare(token, pwd);
            setData(result);
            setPasswordRequired(false);

            // If view permission, try to load preview
            if (result.permission === 'view' || result.permission === 'download' || result.permission === 'edit') {
                try {
                    const blob = await shareService.downloadSharedFile(token, pwd);
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                } catch (err) {
                    console.error('Failed to load preview:', err);
                    setPreviewError(true);
                }
            }
        } catch (err) {
            console.error('Access share error:', err);
            if (err.response?.status === 401) {
                setPasswordRequired(true);
                if (pwd) setError('Invalid password');
            } else {
                setError(err.response?.data?.message || 'Failed to access shared content');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchShare();
        }
    }, [token]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        fetchShare(password);
    };

    const handleDownload = async () => {
        if (previewUrl) {
            const a = document.createElement('a');
            a.href = previewUrl;
            a.download = data.resource.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Fallback if preview failed but download is allowed
            try {
                const blob = await shareService.downloadSharedFile(token, password);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.resource.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Download failed:', err);
            }
        }
    };

    if (loading && !passwordRequired) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', minHeight: '60vh' }}>
                {error && !passwordRequired && (
                    <Box mb={3}>
                        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" color="error" gutterBottom>
                            Access Denied
                        </Typography>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}

                {passwordRequired ? (
                    <Box component="form" onSubmit={handlePasswordSubmit} maxWidth="sm" mx="auto" mt={8}>
                        <LockIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Password Protected
                        </Typography>
                        <Typography color="textSecondary" paragraph>
                            This link is password protected. Please enter the password to view the content.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <TextField
                            fullWidth
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Access Content'}
                        </Button>
                    </Box>
                ) : data ? (
                    <Box display="flex" flexDirection="column" height="100%">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box textAlign="left">
                                <Typography variant="h5" component="h1">
                                    {data.resource.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {formatBytes(data.resource.size)} • {new Date(data.resource.updatedAt).toLocaleDateString()}
                                </Typography>
                            </Box>
                            {data.permission !== 'view' && (
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownload}
                                >
                                    Download
                                </Button>
                            )}
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Box flexGrow={1} display="flex" justifyContent="center" alignItems="center" bgcolor="#f5f5f5" borderRadius={1} overflow="hidden" minHeight="400px">
                            {previewUrl ? (
                                data.resource.mimeType?.startsWith('image/') ? (
                                    <img
                                        src={previewUrl}
                                        alt={data.resource.name}
                                        style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                                    />
                                ) : data.resource.mimeType === 'application/pdf' ? (
                                    <iframe
                                        src={previewUrl}
                                        title={data.resource.name}
                                        width="100%"
                                        height="600px"
                                        style={{ border: 'none' }}
                                    />
                                ) : data.resource.mimeType?.startsWith('video/') ? (
                                    <video
                                        src={previewUrl}
                                        controls
                                        style={{ maxWidth: '100%', maxHeight: '600px' }}
                                    />
                                ) : data.resource.mimeType?.startsWith('audio/') ? (
                                    <audio
                                        src={previewUrl}
                                        controls
                                        style={{ width: '100%' }}
                                    />
                                ) : (
                                    <Box textAlign="center" p={4}>
                                        <FileIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            Preview not available for this file type
                                        </Typography>
                                    </Box>
                                )
                            ) : previewError ? (
                                <Box textAlign="center" p={4}>
                                    <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                                    <Typography variant="h6" color="error" gutterBottom>
                                        Failed to load preview
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        The file could not be loaded for preview.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box textAlign="center" p={4}>
                                    <CircularProgress size={40} sx={{ mb: 2 }} />
                                    <Typography color="textSecondary">Loading preview...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                ) : null}
            </Paper>
        </Container>
    );
}
