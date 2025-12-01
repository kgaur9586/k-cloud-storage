import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Restore,
    DeleteForever,
    Folder,
    InsertDriveFile,
    DeleteSweep,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import trashService from '../../services/trashService';
import { formatFileSize, getFileIcon } from '../../utils/fileUtils';

/**
 * TrashBin Component
 * Displays deleted files and folders with restore/permanent delete options
 */
export default function TrashBin() {
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);

    useEffect(() => {
        loadTrashItems();
    }, []);

    const loadTrashItems = async () => {
        try {
            setLoading(true);
            const data = await trashService.getTrashItems();
            setFiles(data.files || []);
            setFolders(data.folders || []);
        } catch (error) {
            console.error('Failed to load trash:', error);
            toast.error('Failed to load trash items');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreFile = async (fileId) => {
        try {
            await trashService.restoreFile(fileId);
            toast.success('File restored successfully');
            await loadTrashItems();
        } catch (error) {
            console.error('Failed to restore file:', error);
            toast.error('Failed to restore file');
        }
    };

    const handleRestoreFolder = async (folderId) => {
        try {
            await trashService.restoreFolder(folderId);
            toast.success('Folder restored successfully');
            await loadTrashItems();
        } catch (error) {
            console.error('Failed to restore folder:', error);
            toast.error('Failed to restore folder');
        }
    };

    const handlePermanentDeleteFile = async (fileId) => {
        if (!window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
            return;
        }

        try {
            await trashService.permanentlyDeleteFile(fileId);
            toast.success('File permanently deleted');
            await loadTrashItems();
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error('Failed to delete file');
        }
    };

    const handlePermanentDeleteFolder = async (folderId) => {
        if (!window.confirm('Are you sure you want to permanently delete this folder and all its contents? This action cannot be undone.')) {
            return;
        }

        try {
            await trashService.permanentlyDeleteFolder(folderId);
            toast.success('Folder permanently deleted');
            await loadTrashItems();
        } catch (error) {
            console.error('Failed to delete folder:', error);
            toast.error('Failed to delete folder');
        }
    };

    const handleEmptyTrash = async () => {
        setEmptyDialogOpen(false);

        try {
            const result = await trashService.emptyTrash();
            toast.success(`Trash emptied: ${result.deletedFiles} files and ${result.deletedFolders} folders deleted`);
            await loadTrashItems();
        } catch (error) {
            console.error('Failed to empty trash:', error);
            toast.error('Failed to empty trash');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const totalItems = files.length + folders.length;

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={600}>
                    Trash
                </Typography>
                {totalItems > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteSweep />}
                        onClick={() => setEmptyDialogOpen(true)}
                    >
                        Empty Trash
                    </Button>
                )}
            </Box>

            {totalItems === 0 ? (
                <Card>
                    <CardContent>
                        <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                            <DeleteSweep sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                Trash is empty
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                Deleted items will appear here
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Info */}
                    <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                            {totalItems} item{totalItems !== 1 ? 's' : ''} in trash • Items are automatically deleted after 30 days
                        </Typography>
                    </Box>

                    {/* Folders */}
                    {folders.length > 0 && (
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Folders ({folders.length})
                                </Typography>
                                <List>
                                    {folders.map((folder, index) => (
                                        <ListItem
                                            key={folder.id}
                                            divider={index < folders.length - 1}
                                        >
                                            <ListItemIcon>
                                                <Folder color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={folder.name}
                                                secondary={`Deleted ${new Date(folder.deletedAt).toLocaleDateString()}`}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleRestoreFolder(folder.id)}
                                                    title="Restore"
                                                    sx={{ mr: 1 }}
                                                >
                                                    <Restore />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handlePermanentDeleteFolder(folder.id)}
                                                    title="Delete Permanently"
                                                    color="error"
                                                >
                                                    <DeleteForever />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    )}

                    {/* Files */}
                    {files.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Files ({files.length})
                                </Typography>
                                <List>
                                    {files.map((file, index) => (
                                        <ListItem
                                            key={file.id}
                                            divider={index < files.length - 1}
                                        >
                                            <ListItemIcon>
                                                <InsertDriveFile color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={
                                                    <Box component="span" display="flex" alignItems="center" gap={1}>
                                                        <span>{formatFileSize(file.size)}</span>
                                                        <span>•</span>
                                                        <span>Deleted {new Date(file.deletedAt).toLocaleDateString()}</span>
                                                    </Box>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleRestoreFile(file.id)}
                                                    title="Restore"
                                                    sx={{ mr: 1 }}
                                                >
                                                    <Restore />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handlePermanentDeleteFile(file.id)}
                                                    title="Delete Permanently"
                                                    color="error"
                                                >
                                                    <DeleteForever />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Empty Trash Confirmation Dialog */}
            <Dialog open={emptyDialogOpen} onClose={() => setEmptyDialogOpen(false)}>
                <DialogTitle>Empty Trash?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will permanently delete all {totalItems} items in the trash. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmptyDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleEmptyTrash} color="error" variant="contained">
                        Empty Trash
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
