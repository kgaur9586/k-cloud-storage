import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, LinearProgress } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

/**
 * FileUploadZone Component
 * Drag-and-drop file upload area
 */
export default function FileUploadZone({ onUpload, uploading }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            onUpload(acceptedFiles);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: false,
        multiple: true,
    });

    return (
        <Box
            {...getRootProps()}
            sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                mb: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                    transform: 'scale(1.01)',
                },
            }}
        >
            <input {...getInputProps()} />

            <CloudUpload
                sx={{
                    fontSize: 48,
                    color: isDragActive ? 'primary.main' : 'text.secondary',
                    mb: 2,
                }}
            />

            {uploading ? (
                <>
                    <Typography variant="body1" gutterBottom fontWeight={500}>
                        Uploading files...
                    </Typography>
                    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
                        <LinearProgress />
                    </Box>
                </>
            ) : (
                <>
                    <Typography variant="body1" gutterBottom fontWeight={500}>
                        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        or click to browse
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Maximum file size: 10GB • Up to 10 files at once
                    </Typography>
                </>
            )}
        </Box>
    );
}
