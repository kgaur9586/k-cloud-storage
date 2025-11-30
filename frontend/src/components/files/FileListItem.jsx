import { useState } from 'react';
import {
    Box,
    Checkbox,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import {
    MoreVert,
    Edit,
    Delete,
    Download,
    Folder,
} from '@mui/icons-material';
import * as Icons from '@mui/icons-material';
import { formatFileSize, getFileIcon, getFileColor } from '../../utils/fileUtils';
import { format } from 'date-fns';
import fileService from '../../services/fileService';
import { downloadBlob } from '../../utils/fileUtils';

/**
 * FileListItem Component
 * Row display for files and folders in list view
 */
export default function FileListItem({
    item,
    type,
    selected,
    onSelect,
    onNavigate,
    onDelete,
    onRename,
}) {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchorEl(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        handleMenuClose();

        try {
            const { blob, filename } = await fileService.downloadFile(item.id);
            downloadBlob(blob, filename);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleRename = (e) => {
        e.stopPropagation();
        handleMenuClose();
        const newName = prompt(`Rename ${type}:`, item.name);
        if (newName && newName !== item.name) {
            onRename(newName);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        handleMenuClose();
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            onDelete();
        }
    };

    const handleRowClick = () => {
        if (type === 'folder' && onNavigate) {
            onNavigate();
        }
    };

    // Get icon
    const iconName = type === 'folder' ? 'Folder' : getFileIcon(item.mimeType, item.name);
    const IconComponent = Icons[iconName] || Icons.InsertDriveFile;
    const iconColor = type === 'folder' ? '#FFA726' : getFileColor(item.mimeType, item.name);

    return (
        <Box
            onClick={handleRowClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 1,
                cursor: type === 'folder' ? 'pointer' : 'default',
                bgcolor: selected ? 'primary.50' : 'transparent',
                '&:hover': {
                    bgcolor: selected ? 'primary.100' : 'action.hover',
                },
                transition: 'background-color 0.2s',
            }}
        >
            {/* Checkbox */}
            <Checkbox
                checked={selected}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                size="small"
            />

            {/* Icon */}
            <IconComponent
                sx={{
                    fontSize: 32,
                    color: iconColor,
                }}
            />

            {/* Name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    noWrap
                    title={item.name}
                >
                    {item.name}
                </Typography>
            </Box>

            {/* Size */}
            <Box sx={{ width: 100, textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                    {type === 'file' ? formatFileSize(item.size) : '—'}
                </Typography>
            </Box>

            {/* Date */}
            <Box sx={{ width: 120, textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                    {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                </Typography>
            </Box>

            {/* Actions */}
            <IconButton
                size="small"
                onClick={handleMenuOpen}
            >
                <MoreVert fontSize="small" />
            </IconButton>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
            >
                {type === 'file' && (
                    <MenuItem onClick={handleDownload}>
                        <ListItemIcon>
                            <Download fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Download</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={handleRename}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <Delete fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
}
