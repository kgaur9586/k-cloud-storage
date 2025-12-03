import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Grid,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    Alert,
    Container,
    Paper,
    TextField,
    InputAdornment
} from '@mui/material';
import {
    Image as ImageIcon,
    Movie as MovieIcon,
    GridView as GridViewIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import fileService from '../../services/fileService';
import MediaGalleryItem from './MediaGalleryItem';
import FilePreviewModal from '../files/FilePreviewModal';

const MediaGallery = () => {
    const [mediaType, setMediaType] = useState('all'); // 'all', 'image', 'video'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [previewItem, setPreviewItem] = useState(null);

    const fetchMedia = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Determine mimeType filter based on selection
            let mimeTypeFilter = undefined;
            if (mediaType === 'image') mimeTypeFilter = 'image/';
            if (mediaType === 'video') mimeTypeFilter = 'video/';

            // If 'all', we need to fetch both or filter on client side if API doesn't support multiple prefixes
            // For now, let's fetch all and filter client side if needed, or assume API supports partial match
            // Actually, let's use the API's mimeType filter which does a startsWith check

            // Since we want BOTH images and videos when 'all' is selected, we might need to make two requests 
            // or update the backend to support multiple types. 
            // For simplicity, let's fetch all files and filter client-side for 'all' view if the API doesn't support complex queries

            const params = {
                limit: 100, // Fetch more items for gallery
                sortBy: 'createdAt',
                sortOrder: 'desc',
                search: search || undefined
            };

            if (mediaType !== 'all') {
                params.mimeType = mimeTypeFilter;
            }

            const response = await fileService.listFiles(null, params);

            // Filter for media files only
            let mediaFiles = response.files.filter(file =>
                file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/')
            );

            // If specific type selected, the API filter should have handled it, but double check
            if (mediaType === 'image') {
                mediaFiles = mediaFiles.filter(file => file.mimeType.startsWith('image/'));
            } else if (mediaType === 'video') {
                mediaFiles = mediaFiles.filter(file => file.mimeType.startsWith('video/'));
            }

            setItems(mediaFiles);
        } catch (err) {
            console.error('Failed to fetch media:', err);
            setError('Failed to load media gallery');
        } finally {
            setLoading(false);
        }
    }, [mediaType, search]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleTypeChange = (event, newType) => {
        if (newType !== null) {
            setMediaType(newType);
        }
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const handleItemClick = (item) => {
        setPreviewItem(item);
    };

    const handleClosePreview = () => {
        setPreviewItem(null);
    };

    const handleDownload = async (item) => {
        try {
            await fileService.downloadFile(item.id, item.name);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            try {
                await fileService.deleteFile(item.id);
                setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    const handleShare = async (item) => {
        // Implement share logic
        console.log('Share:', item);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" component="h1">
                    Media Gallery
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search media..."
                        value={search}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <ToggleButtonGroup
                        value={mediaType}
                        exclusive
                        onChange={handleTypeChange}
                        aria-label="media type"
                        size="small"
                    >
                        <ToggleButton value="all" aria-label="all media">
                            <GridViewIcon sx={{ mr: 1 }} /> All
                        </ToggleButton>
                        <ToggleButton value="image" aria-label="images only">
                            <ImageIcon sx={{ mr: 1 }} /> Images
                        </ToggleButton>
                        <ToggleButton value="video" aria-label="videos only">
                            <MovieIcon sx={{ mr: 1 }} /> Videos
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : items.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="h6" color="text.secondary">
                        No media files found
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {items.map((item) => (
                        <Grid item key={item.id} xs={6} sm={4} md={3} lg={2}>
                            <MediaGalleryItem
                                item={item}
                                onClick={handleItemClick}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onShare={handleShare}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            {previewItem && (
                <FilePreviewModal
                    open={Boolean(previewItem)}
                    onClose={handleClosePreview}
                    file={previewItem}
                />
            )}
        </Container>
    );
};

export default MediaGallery;
