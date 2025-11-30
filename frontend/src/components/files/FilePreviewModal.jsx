import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    IconButton,
} from '@mui/material';
import { Close, Download } from '@mui/icons-material';
import fileService from '../../services/fileService';
import { getFileType, downloadBlob } from '../../utils/fileUtils';

/**
 * FilePreviewModal Component
 * Displays file preview for supported types
 */
export default function FilePreviewModal({ file, open, onClose }) {
    const [loading, setLoading] = useState(false);
    const [contentUrl, setContentUrl] = useState(null);
    const [error, setError] = useState(null);
    const [textContent, setTextContent] = useState(null);

    useEffect(() => {
        if (open && file) {
            loadFileContent();
        } else {
            // Cleanup
            if (contentUrl) {
                URL.revokeObjectURL(contentUrl);
                setContentUrl(null);
            }
            setTextContent(null);
            setError(null);
        }
    }, [open, file]);

    const loadFileContent = async () => {
        try {
            setLoading(true);
            setError(null);

            const { blob } = await fileService.downloadFile(file.id);
            const url = URL.createObjectURL(blob);
            setContentUrl(url);

            // For text files, read the content
            const type = getFileType(file.mimeType, file.name);
            if (type === 'text' || type === 'code') {
                const text = await blob.text();
                setTextContent(text);
            }
        } catch (err) {
            console.error('Failed to load file preview:', err);
            setError('Failed to load file preview');
        } finally {
            setLoading(false);
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

    if (!file) return null;

    const type = getFileType(file.mimeType, file.name);

    const renderContent = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <Typography color="error">{error}</Typography>
                </Box>
            );
        }

        switch (type) {
            case 'image':
                return (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <img
                            src={contentUrl}
                            alt={file.name}
                            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    </Box>
                );
            case 'video':
                return (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <video
                            src={contentUrl}
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '70vh' }}
                        />
                    </Box>
                );
            case 'audio':
                return (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <audio src={contentUrl} controls style={{ width: '100%' }} />
                    </Box>
                );
            case 'pdf':
                return (
                    <Box height="70vh">
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
                            p: 2,
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: '70vh',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                        }}
                    >
                        {textContent}
                    </Box>
                );
            default:
                return (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={200}>
                        <Typography variant="body1" gutterBottom>
                            Preview not available for this file type
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={handleDownload}
                        >
                            Download to view
                        </Button>
                    </Box>
                );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '40vh' }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '80%' }}>
                    {file.name}
                </Typography>
                <Box>
                    <IconButton onClick={handleDownload} title="Download">
                        <Download />
                    </IconButton>
                    <IconButton onClick={onClose} title="Close">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}
