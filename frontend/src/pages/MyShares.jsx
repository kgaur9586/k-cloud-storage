import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import shareService from '../services/shareService';
import { formatDistanceToNow } from 'date-fns';

/**
 * MyShares Page
 * Manage files that the current user has shared
 */
export default function MyShares() {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [selectedShare, setSelectedShare] = useState(null);

    useEffect(() => {
        loadShares();
    }, []);

    const loadShares = async () => {
        try {
            setLoading(true);
            const data = await shareService.getSharedByMe();
            setShares(data);
        } catch (error) {
            console.error('Failed to load shares:', error);
            toast.error('Failed to load shares');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = (share) => {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/share/${share.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
    };

    const handleRevokeClick = (share) => {
        setSelectedShare(share);
        setRevokeDialogOpen(true);
    };

    const handleRevokeConfirm = async () => {
        try {
            await shareService.revokeShareLink(selectedShare.id);
            toast.success('Share link revoked');
            setRevokeDialogOpen(false);
            setSelectedShare(null);
            loadShares();
        } catch (error) {
            console.error('Failed to revoke share:', error);
            toast.error('Failed to revoke share');
        }
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

    const getStatusChip = (share) => {
        if (!share.isActive) {
            return <Chip label="Revoked" color="error" size="small" />;
        }
        if (share.isExpired) {
            return <Chip label="Expired" color="error" size="small" />;
        }
        if (share.isAccessLimitReached) {
            return <Chip label="Limit Reached" color="error" size="small" />;
        }
        return <Chip label="Active" color="success" size="small" />;
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
                My Shares
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage files and folders you've shared with others
            </Typography>

            {shares.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No active shares
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Share files with others to see them here
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>File/Folder</TableCell>
                                <TableCell>Permission</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Access Count</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Expires</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shares.map((share) => (
                                <TableRow key={share.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {share.resourceType === 'file'
                                                ? share.file?.name
                                                : share.folder?.name}
                                        </Typography>
                                        {share.passwordHash && (
                                            <Chip
                                                label="Password"
                                                size="small"
                                                sx={{ mt: 0.5 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={share.permission}
                                            color={getPermissionColor(share.permission)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{getStatusChip(share)}</TableCell>
                                    <TableCell>
                                        {share.accessCount} / {share.maxAccessCount || '∞'}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDistanceToNow(new Date(share.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {share.expiresAt ? (
                                            <Typography variant="body2">
                                                {formatDistanceToNow(new Date(share.expiresAt), {
                                                    addSuffix: true,
                                                })}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Never
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleCopyLink(share)}
                                            title="Copy link"
                                        >
                                            <CopyIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRevokeClick(share)}
                                            title="Revoke share"
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Revoke Confirmation Dialog */}
            <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
                <DialogTitle>Revoke Share Link?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to revoke this share link? This action cannot be undone
                        and the link will no longer work.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRevokeConfirm} color="error" variant="contained">
                        Revoke
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
