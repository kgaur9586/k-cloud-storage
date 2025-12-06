import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    CircularProgress,
    IconButton,
    Grid,
    Divider,
    Button,
    Tooltip,
    useTheme,
    useMediaQuery,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Close,
    Download,
    OpenInNew,
    Share,
    Info,
    Image as ImageIcon,
    Movie as MovieIcon,
    Description as DocIcon,
    InsertDriveFile as FileIcon,
    History,
    Restore,
    Visibility
} from '@mui/icons-material';
import mammoth from 'mammoth';
import { format } from 'date-fns';
import fileService from '../../services/fileService';
import { getFileType, formatFileSize } from '../../utils/fileUtils';
import { Chip } from '@mui/material';

/**
 * FilePreviewModal Component
 * Displays file preview for supported types with metadata sidebar and version history
 */
export default function FilePreviewModal({ file, open, onClose, permission }) {
    const [loading, setLoading] = useState(false);
    const [contentUrl, setContentUrl] = useState(null);
    const [error, setError] = useState(null);
    const [textContent, setTextContent] = useState(null);
    const [docxHtml, setDocxHtml] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [versions, setVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);

    // Determine if user can download (owner or has download/edit permission)
    const canDownload = !permission || permission === 'download' || permission === 'edit';

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (open && file) {
            loadFileContent();
            loadVersions();
            // Auto-hide sidebar on mobile
            if (isMobile) setShowSidebar(false);
        } else {
            // Cleanup
            if (contentUrl) {
                URL.revokeObjectURL(contentUrl);
                setContentUrl(null);
            }
            setTextContent(null);
            setDocxHtml(null);
            setError(null);
            setVersions([]);
        }
    }, [open, file, isMobile]);

    const loadFileContent = async () => {
        try {
            setLoading(true);
            setError(null);

            const { blob } = await fileService.downloadFile(file.id);
            const url = URL.createObjectURL(blob);
            setContentUrl(url);

            const type = getFileType(file.mimeType, file.name);

            // For text files, read the content
            if (type === 'text' || type === 'code') {
                const text = await blob.text();
                setTextContent(text);
            }

            // For .docx files, convert to HTML
            if (type === 'document' && file.name.endsWith('.docx')) {
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setDocxHtml(result.value);
            }
        } catch (err) {
            console.error('Failed to load file preview:', err);
            // Check if it's a permission error
            if (err.response?.status === 403) {
                setError('View-only access - download not permitted');
            } else {
                setError('Failed to load file preview');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadVersions = async () => {
        try {
            setLoadingVersions(true);
            const versionList = await fileService.getVersions(file.id);
            setVersions(versionList);
        } catch (err) {
            console.error('Failed to load versions:', err);
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleDownload = () => {
        if (contentUrl) {
            const link = document.createElement('a');
            link.href = contentUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleOpenNewTab = () => {
        if (contentUrl) {
            window.open(contentUrl, '_blank');
        }
    };

    const handleShare = () => {
        // Placeholder for share functionality
        console.log('Share file:', file);
        alert('Share functionality coming soon!');
    };

    const handleRestore = async (version) => {
        if (window.confirm(`Are you sure you want to restore version ${version.versionNumber}? This will create a new version.`)) {
            try {
                await fileService.restoreVersion(file.id, version.id);
                // Reload content and versions
                loadFileContent();
                loadVersions();
                alert('Version restored successfully!');
            } catch (err) {
                console.error('Failed to restore version:', err);
                alert('Failed to restore version');
            }
        }
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    if (!file) return null;

    const type = getFileType(file.mimeType, file.name);

    const renderPreviewContent = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={300}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={300}>
                    <Typography color="error">{error}</Typography>
                </Box>
            );
        }

        switch (type) {
            case 'image':
                return (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%" sx={{ bgcolor: 'black' }}>
                        <img
                            src={contentUrl}
                            alt={file.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </Box>
                );
            case 'video':
                return (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%" sx={{ bgcolor: 'black' }}>
                        <video
                            src={contentUrl}
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                    </Box>
                );
            case 'audio':
                return (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%" sx={{ bgcolor: 'grey.100' }}>
                        <audio src={contentUrl} controls style={{ width: '80%' }} />
                    </Box>
                );
            case 'pdf':
                return (
                    <Box height="100%" sx={{ bgcolor: 'grey.200' }}>
                        <iframe
                            src={contentUrl}
                            width="100%"
                            height="100%"
                            title={file.name}
                            style={{ border: 'none' }}
                        />
                    </Box>
                );
            case 'text':
            case 'code':
                return (
                    <Box
                        component="pre"
                        sx={{
                            p: 3,
                            bgcolor: 'white',
                            height: '100%',
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            m: 0
                        }}
                    >
                        {textContent}
                    </Box>
                );
            case 'document':
                // If we have converted docx HTML, show it
                if (docxHtml) {
                    return (
                        <Box
                            sx={{
                                p: 4,
                                bgcolor: 'white',
                                height: '100%',
                                overflow: 'auto',
                                '& img': { maxWidth: '100%' },
                                '& table': { borderCollapse: 'collapse', width: '100%' },
                                '& td, & th': { border: '1px solid #ddd', padding: '8px' },
                            }}
                            dangerouslySetInnerHTML={{ __html: docxHtml }}
                        />
                    );
                }
                // Otherwise show download option
                return (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" sx={{ bgcolor: 'grey.50' }}>
                        <DocIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Preview not available
                        </Typography>
                        {canDownload ? (
                            <Button variant="contained" startIcon={<Download />} onClick={handleDownload}>
                                Download to view
                            </Button>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                View-only access - download not available
                            </Typography>
                        )}
                    </Box>
                );
            default:
                return (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" sx={{ bgcolor: 'grey.50' }}>
                        <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Preview not available
                        </Typography>
                        {canDownload ? (
                            <Button variant="contained" startIcon={<Download />} onClick={handleDownload}>
                                Download to view
                            </Button>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                View-only access - download not available
                            </Typography>
                        )}
                    </Box>
                );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: { height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{
                p: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                zIndex: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', gap: 1 }}>
                    <Typography variant="h6" component="div" noWrap title={file.name}>
                        {file.name}
                    </Typography>
                    {permission === 'view' && (
                        <Chip
                            icon={<Visibility />}
                            label="View Only"
                            color="warning"
                            size="small"
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Open in new tab">
                        <IconButton onClick={handleOpenNewTab} size="small">
                            <OpenInNew />
                        </IconButton>
                    </Tooltip>
                    {canDownload && (
                        <Tooltip title="Download">
                            <IconButton onClick={handleDownload} size="small">
                                <Download />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Share">
                        <IconButton onClick={handleShare} size="small">
                            <Share />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="File Info">
                        <IconButton
                            onClick={toggleSidebar}
                            color={showSidebar ? 'primary' : 'default'}
                            size="small"
                        >
                            <Info />
                        </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Tooltip title="Close">
                        <IconButton onClick={onClose} edge="end" size="small">
                            <Close />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>

            {/* Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Main Preview */}
                <Box sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {renderPreviewContent()}
                </Box>

                {/* Metadata Sidebar */}
                {showSidebar && (
                    <Box sx={{
                        width: isMobile ? '100%' : 320,
                        borderLeft: isMobile ? 0 : 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        overflowY: 'auto',
                        position: isMobile ? 'absolute' : 'relative',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2,
                        boxShadow: isMobile ? -4 : 0
                    }}>
                        <Box sx={{ p: 2 }}>
                            {isMobile && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                    <IconButton onClick={toggleSidebar} size="small">
                                        <Close />
                                    </IconButton>
                                </Box>
                            )}

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                File Details
                            </Typography>

                            <Grid container spacing={2} sx={{ mt: 0 }}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Type</Typography>
                                    <Typography variant="body2">{file.mimeType || 'Unknown'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Size</Typography>
                                    <Typography variant="body2">{formatFileSize(file.size)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Location</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        {file.path || '/'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Created</Typography>
                                    <Typography variant="body2">
                                        {file.createdAt ? format(new Date(file.createdAt), 'PPpp') : 'Unknown'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Last Modified</Typography>
                                    <Typography variant="body2">
                                        {file.updatedAt ? format(new Date(file.updatedAt), 'PPpp') : 'Unknown'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Current Version</Typography>
                                    <Typography variant="body2">v{file.currentVersion || 1}</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <History fontSize="small" /> Version History
                            </Typography>

                            {loadingVersions ? (
                                <Box display="flex" justifyContent="center" p={2}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : versions.length > 0 ? (
                                <List dense disablePadding>
                                    {versions.map((version) => (
                                        <ListItem key={version.id} divider sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={`Version ${version.versionNumber}`}
                                                secondary={
                                                    <>
                                                        <Typography variant="caption" component="span" display="block">
                                                            {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                                                        </Typography>
                                                        <Typography variant="caption" component="span">
                                                            {formatFileSize(version.size)}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title="Restore this version">
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={() => handleRestore(version)}
                                                    >
                                                        <Restore />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    No previous versions
                                </Typography>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle2" gutterBottom>
                                Actions
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {canDownload && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<Download />}
                                        onClick={handleDownload}
                                        fullWidth
                                    >
                                        Download
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    startIcon={<Share />}
                                    onClick={handleShare}
                                    fullWidth
                                >
                                    Share
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Dialog>
    );
}
