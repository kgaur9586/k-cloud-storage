import { useState } from 'react';
import {
    Card,
    CardContent,
    CardActionArea,
    Box,
    Typography,
    Checkbox,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Folder,
    MoreVert,
    Edit,
    Delete,
    Download,
    Visibility,
} from '@mui/icons-material';
import * as Icons from '@mui/icons-material';
import { formatFileSize, getFileIcon, getFileColor } from '../../utils/fileUtils';
import { format } from 'date-fns';
import fileService from '../../services/fileService';
import { downloadBlob } from '../../utils/fileUtils';

/**
 * FileCard Component
 * Card display for files and folders in grid view
 */
export default function FileCard({
    item,
    type,
    selected,
    onSelect,
    onNavigate,
    onDelete,
    onRename,
}) {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [hovering, setHovering] = useState(false);

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

    const handleCardClick = () => {
        if (type === 'folder') {
            onNavigate();
        }
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        onSelect();
    };

    // Get icon
    const iconName = type === 'folder' ? 'Folder' : getFileIcon(item.mimeType, item.name);
    const IconComponent = Icons[iconName] || Icons.InsertDriveFile;
    const iconColor = type === 'folder' ? '#FFA726' : getFileColor(item.mimeType, item.name);

    return (
        <Card
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            sx={{
                position: 'relative',
                height: '100%',
                transition: 'all 0.2s ease-in-out',
                border: selected ? 2 : 1,
                borderColor: selected ? 'primary.main' : 'divider',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                },
            }}
        >
            <CardActionArea onClick={handleCardClick}>
                <CardContent>
                    {/* Checkbox */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            opacity: hovering || selected ? 1 : 0,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <Checkbox
                            checked={selected}
                            onClick={handleCheckboxClick}
                            size="small"
                        />
                    </Box>

                    {/* Menu */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            opacity: hovering ? 1 : 0,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                        >
                            <MoreVert fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Icon */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 2,
                            mt: 3,
                        }}
                    >
                        <IconComponent
                            sx={{
                                fontSize: 64,
                                color: iconColor,
                            }}
                        />
                    </Box>

                    {/* Name */}
                    <Typography
                        variant="body2"
                        fontWeight={500}
                        noWrap
                        textAlign="center"
                        title={item.name}
                    >
                        {item.name}
                    </Typography>

                    {/* Details */}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        textAlign="center"
                        display="block"
                        sx={{ mt: 0.5 }}
                    >
                        {type === 'file' ? formatFileSize(item.size) : 'Folder'}
                    </Typography>

                    {item.createdAt && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            textAlign="center"
                            display="block"
                        >
                            {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>

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
        </Card>
    );
}
