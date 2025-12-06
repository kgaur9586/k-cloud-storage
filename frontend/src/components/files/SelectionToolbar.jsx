import {
    Box,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    Divider,
    Fade,
    Stack,
} from '@mui/material';
import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    DriveFileMove as MoveIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';

/**
 * SelectionToolbar Component
 * Floating toolbar that appears when items are selected
 * Provides batch actions: Move, Copy, Delete, Download
 */
export default function SelectionToolbar({
    selectedCount,
    onClear,
    onMove,
    onCopy,
    onDelete,
    onDownload,
}) {
    if (selectedCount === 0) return null;

    return (
        <Fade in={selectedCount > 0}>
            <Paper
                elevation={8}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1300,
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 3,
                        py: 1.5,
                        gap: 2,
                    }}
                >
                    {/* Selection Count */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={selectedCount}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                            }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedCount === 1 ? 'item' : 'items'} selected
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Move" arrow>
                            <IconButton
                                onClick={onMove}
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <MoveIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Copy" arrow>
                            <IconButton
                                onClick={onCopy}
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <CopyIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Download" arrow>
                            <IconButton
                                onClick={onDownload}
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete" arrow>
                            <IconButton
                                onClick={onDelete}
                                sx={{
                                    color: '#ff6b6b',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 107, 107, 0.1)',
                                    },
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />

                    {/* Clear Selection */}
                    <Tooltip title="Clear selection" arrow>
                        <IconButton
                            onClick={onClear}
                            size="small"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>
        </Fade>
    );
}
