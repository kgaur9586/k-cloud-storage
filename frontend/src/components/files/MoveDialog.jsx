import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Breadcrumbs,
    Link,
    CircularProgress,
    Alert,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    Home as HomeIcon,
    ChevronRight as ChevronRightIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import folderService from '../../services/folderService';

/**
 * MoveDialog Component
 * Interactive folder tree selector for moving files/folders
 * Features:
 * - Breadcrumb navigation
 * - Expandable folder tree
 * - Current location highlighting
 * - Disabled folders (can't move into self or descendants)
 */
export default function MoveDialog({
    open,
    onClose,
    onMove,
    selectedItems = [],
    currentFolderId,
    title = 'Move Items',
}) {
    const [folders, setFolders] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Root' }]);

    useEffect(() => {
        if (open) {
            loadFolders();
        }
    }, [open]);

    const loadFolders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await folderService.getFolderTree();
            // Handle both response.root (array) and direct array response
            const folderData = response.root || response || [];
            setFolders(Array.isArray(folderData) ? folderData : []);
        } catch (err) {
            setError('Failed to load folders');
            console.error('Folder tree error:', err);
            setFolders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFolder = (folderId) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
    };

    const handleSelectFolder = (folderId, folderName) => {
        setSelectedFolderId(folderId);
        if (folderId) {
            setBreadcrumbs([{ id: null, name: 'Root' }, { id: folderId, name: folderName }]);
        } else {
            setBreadcrumbs([{ id: null, name: 'Root' }]);
        }
    };

    const handleMove = () => {
        onMove(selectedFolderId);
        onClose();
    };

    const isDisabled = (folderId) => {
        // Disable current folder
        if (folderId === currentFolderId) return true;

        // Disable selected folders (can't move into themselves)
        if (selectedItems.some(item => item.id === folderId)) return true;

        return false;
    };

    const renderFolderTree = (folderList, level = 0) => {
        return folderList.map((folder) => {
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = selectedFolderId === folder.id;
            const disabled = isDisabled(folder.id);
            const hasChildren = folder.children && folder.children.length > 0;

            return (
                <Box key={folder.id}>
                    <ListItem
                        disablePadding
                        sx={{
                            pl: level * 3,
                            bgcolor: isSelected ? 'action.selected' : 'transparent',
                            '&:hover': {
                                bgcolor: disabled ? 'transparent' : 'action.hover',
                            },
                        }}
                    >
                        {hasChildren && (
                            <IconButton
                                size="small"
                                onClick={() => handleToggleFolder(folder.id)}
                                sx={{ mr: 0.5 }}
                            >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        )}
                        {!hasChildren && <Box sx={{ width: 40 }} />}

                        <ListItemButton
                            onClick={() => !disabled && handleSelectFolder(folder.id, folder.name)}
                            disabled={disabled}
                            selected={isSelected}
                        >
                            <ListItemIcon>
                                {isExpanded ? <FolderOpenIcon color="primary" /> : <FolderIcon />}
                            </ListItemIcon>
                            <ListItemText
                                primary={folder.name}
                                primaryTypographyProps={{
                                    fontWeight: isSelected ? 600 : 400,
                                    color: disabled ? 'text.disabled' : 'text.primary',
                                }}
                            />
                        </ListItemButton>
                    </ListItem>

                    {hasChildren && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {renderFolderTree(folder.children, level + 1)}
                        </Collapse>
                    )}
                </Box>
            );
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '60vh',
                    maxHeight: '80vh',
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {/* Breadcrumbs */}
                <Breadcrumbs
                    separator={<ChevronRightIcon fontSize="small" />}
                    sx={{ mb: 2, px: 1 }}
                >
                    {breadcrumbs.map((crumb, index) => (
                        <Link
                            key={crumb.id || 'root'}
                            component="button"
                            variant="body2"
                            onClick={() => handleSelectFolder(crumb.id, crumb.name)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                textDecoration: 'none',
                                color: index === breadcrumbs.length - 1 ? 'primary.main' : 'text.secondary',
                                fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                                '&:hover': {
                                    textDecoration: 'underline',
                                },
                            }}
                        >
                            {index === 0 && <HomeIcon fontSize="small" />}
                            {crumb.name}
                        </Link>
                    ))}
                </Breadcrumbs>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                        {/* Root folder option */}
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => handleSelectFolder(null, 'Root')}
                                selected={selectedFolderId === null}
                            >
                                <ListItemIcon>
                                    <HomeIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Root"
                                    primaryTypographyProps={{
                                        fontWeight: selectedFolderId === null ? 600 : 400,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* Folder tree */}
                        {renderFolderTree(folders)}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleMove}
                    variant="contained"
                    disabled={selectedFolderId === currentFolderId || loading}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                        },
                    }}
                >
                    Move Here
                </Button>
            </DialogActions>
        </Dialog>
    );
}
