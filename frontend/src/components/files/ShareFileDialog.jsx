import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Switch,
    FormControlLabel,
    Box,
    TextField,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import fileService from '../../services/fileService';

const ShareFileDialog = ({ open, onClose, file, onUpdate }) => {
    const [isPublic, setIsPublic] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        if (open && file) {
            setIsPublic(file.isPublic || false);
            if (file.isPublic) {
                fetchShareLink();
            } else {
                setShareLink('');
            }
        }
    }, [open, file]);

    const fetchShareLink = async () => {
        try {
            setLoading(true);
            const data = await fileService.getShareLink(file.id);
            setShareLink(data.shareLink);
        } catch (error) {
            console.error('Failed to get share link:', error);
            toast.error('Failed to load share link');
        } finally {
            setLoading(false);
        }
    };

    const handleVisibilityChange = async (event) => {
        const newIsPublic = event.target.checked;
        setIsPublic(newIsPublic);

        try {
            setLoading(true);
            const updatedFile = await fileService.toggleFileVisibility(file.id, newIsPublic);

            if (newIsPublic) {
                await fetchShareLink();
            } else {
                setShareLink('');
            }

            if (onUpdate) {
                onUpdate(updatedFile.file);
            }

            toast.success(`File is now ${newIsPublic ? 'public' : 'private'}`);
        } catch (error) {
            console.error('Failed to update visibility:', error);
            setIsPublic(!newIsPublic); // Revert state
            toast.error('Failed to update file visibility');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            setCopying(true);
            await navigator.clipboard.writeText(shareLink);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopying(false), 1000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Failed to copy link');
            setCopying(false);
        }
    };

    if (!file) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Share "{file.name}"
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: '50%',
                            bgcolor: isPublic ? 'success.light' : 'grey.200',
                            color: isPublic ? 'success.dark' : 'grey.600',
                            display: 'flex'
                        }}
                    >
                        {isPublic ? <PublicIcon /> : <LockIcon />}
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {isPublic ? 'Public Access' : 'Private Access'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isPublic
                                ? 'Anyone with the link can view and download this file'
                                : 'Only you can access this file'}
                        </Typography>
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPublic}
                                onChange={handleVisibilityChange}
                                color="success"
                                disabled={loading}
                            />
                        }
                        label=""
                        sx={{ ml: 'auto' }}
                    />
                </Box>

                {isPublic && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Share Link
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={shareLink}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleCopyLink}
                                            edge="end"
                                            color={copying ? "success" : "primary"}
                                            disabled={!shareLink || loading}
                                        >
                                            <CopyIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                            placeholder={loading ? "Generating link..." : ""}
                        />
                        {file.publicAccessCount > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                This file has been accessed {file.publicAccessCount} times via public link.
                            </Typography>
                        )}
                    </Box>
                )}

                {isPublic && (
                    <Alert severity="warning" sx={{ mt: 3 }}>
                        Warning: Anyone with this link can access the file without logging in. Be careful who you share it with.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShareFileDialog;
