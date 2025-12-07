import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import shareService from '../services/shareService';
import fileService from '../services/fileService';
import { formatDistanceToNow } from 'date-fns';
import FilePreviewModal from '../components/files/FilePreviewModal';

/**
 * SharedWithMe Page
 * Displays files that have been shared with the current user
 */
export default function SharedWithMe() {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPermission, setPreviewPermission] = useState(null);

    useEffect(() => {
        loadShares();
    }, []);

    const loadShares = async () => {
        try {
            setLoading(true);
            const data = await shareService.getSharedWithMe();
            setShares(data);
        } catch (error) {
            console.error('Failed to load shared files:', error);
            toast.error('Failed to load shared files');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            const { blob, filename } = await fileService.downloadFile(file.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Download started');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Download failed');
        }
    };

    const handleView = (share) => {
        setPreviewFile(share.file);
        setPreviewPermission(share.permission);
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
        setPreviewFile(null);
        setPreviewPermission(null);
    };

    const getPermissionColor = (permission) => {
        switch (permission) {
            case 'view':
                return 'warning';
            case 'download':
                return 'success';
            case 'edit':
                return 'primary';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                Shared With Me
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Files and folders that others have shared with you
            </Typography>

            {shares.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No shared files
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        When someone shares a file with you, it will appear here
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {shares.map((share) => (
                        <Grid item xs={12} sm={6} md={4} key={share.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" noWrap gutterBottom>
                                        {share.file?.name || 'Unknown File'}
                                    </Typography>

                                    <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
                                        <Chip
                                            label={share.permission}
                                            color={getPermissionColor(share.permission)}
                                            size="small"
                                        />
                                        {share.isExpired && (
                                            <Chip label="Expired" color="error" size="small" />
                                        )}
                                        {share.isAccessLimitReached && (
                                            <Chip label="Limit Reached" color="error" size="small" />
                                        )}
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                                        <PersonIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Shared by: {share.sharedByUser?.name || 'Unknown'}
                                        </Typography>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <ScheduleIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDistanceToNow(new Date(share.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </Typography>
                                    </Box>

                                    {share.expiresAt && !share.isExpired && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            Expires {formatDistanceToNow(new Date(share.expiresAt), {
                                                addSuffix: true,
                                            })}
                                        </Alert>
                                    )}
                                </CardContent>

                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    {share.permission === 'view' ? (
                                        <Button
                                            startIcon={<ViewIcon />}
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => handleView(share)}
                                            disabled={share.isExpired || share.isAccessLimitReached}
                                        >
                                            View Only
                                        </Button>
                                    ) : (
                                        <Box display="flex" gap={1} width="100%">
                                            <Button
                                                startIcon={<ViewIcon />}
                                                size="small"
                                                variant="outlined"
                                                fullWidth
                                                onClick={() => handleView(share)}
                                                disabled={share.isExpired || share.isAccessLimitReached}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                startIcon={<DownloadIcon />}
                                                size="small"
                                                variant="contained"
                                                fullWidth
                                                onClick={() => handleDownload(share.file)}
                                                disabled={share.isExpired || share.isAccessLimitReached}
                                            >
                                                Download
                                            </Button>
                                        </Box>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <FilePreviewModal
                file={previewFile}
                open={previewOpen}
                onClose={handleClosePreview}
                permission={previewPermission}
            />
        </Container>
    );
}
