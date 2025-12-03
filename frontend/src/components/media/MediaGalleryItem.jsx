import React from 'react';
import {
    Box,
    Card,
    CardActionArea,
    CardMedia,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    Share as ShareIcon,
    PlayCircleOutline as PlayIcon,
    Image as ImageIcon,
    Movie as MovieIcon
} from '@mui/icons-material';
import { formatFileSize } from '../../utils/fileUtils';
import { format } from 'date-fns';
import AuthenticatedThumbnail from '../files/AuthenticatedThumbnail';

const MediaGalleryItem = ({ item, onDownload, onDelete, onShare, onClick }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const isVideo = item.mimeType?.startsWith('video/');

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (event) => {
        event?.stopPropagation();
        setAnchorEl(null);
    };

    const handleAction = (action) => (event) => {
        event.stopPropagation();
        handleMenuClose();
        action(item);
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover .media-actions': {
                    opacity: 1
                }
            }}
        >
            <CardActionArea
                onClick={() => onClick(item)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}
            >
                <Box sx={{ position: 'relative', paddingTop: '100%', bgcolor: 'action.hover' }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {item.thumbnailPath ? (
                            <AuthenticatedThumbnail
                                fileId={item.id}
                                name={item.name}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            isVideo ? <MovieIcon sx={{ fontSize: 60, color: 'text.secondary' }} /> : <ImageIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                        )}

                        {isVideo && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0,0,0,0.3)'
                            }}>
                                <PlayIcon sx={{ fontSize: 60, color: 'white', opacity: 0.8 }} />
                            </Box>
                        )}
                    </Box>
                </Box>

                <Box sx={{ p: 1.5, width: '100%' }}>
                    <Typography variant="subtitle2" noWrap title={item.name}>
                        {item.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            {formatFileSize(item.size)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </Typography>
                    </Box>
                </Box>
            </CardActionArea>

            <Box
                className="media-actions"
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%'
                }}
            >
                <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={handleAction(onDownload)}>
                    <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Download</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleAction(onShare)}>
                    <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Share</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleAction(onDelete)} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Card>
    );
};

export default MediaGalleryItem;
