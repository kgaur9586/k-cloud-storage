import { useState, useEffect } from 'react';
import { Box } from '@mui/material';

/**
 * Component to fetch and display authenticated images
 */
export default function AuthenticatedThumbnail({ fileId, name, fallback, sx = {} }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch thumbnail with auth headers
    useEffect(() => {
        let objectUrl = null;
        let mounted = true;

        const fetchThumbnail = async () => {
            try {
                // Use the configured axios instance which has the auth token
                const response = await import('../../services/api').then(m => m.default.get(
                    `/files/${fileId}/thumbnail`,
                    { responseType: 'blob' }
                ));

                if (mounted) {
                    objectUrl = URL.createObjectURL(response.data);
                    setImageUrl(objectUrl);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Thumbnail fetch error:', err);
                if (mounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchThumbnail();

        return () => {
            mounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [fileId]);

    if (error) return fallback ? fallback() : null;
    if (loading) return <Box sx={{ width: 64, height: 64, bgcolor: 'action.hover', borderRadius: 1, ...sx }} />;

    return (
        <Box
            component="img"
            src={imageUrl}
            alt={name}
            sx={{
                maxWidth: '100%',
                maxHeight: 80,
                objectFit: 'contain',
                borderRadius: 1,
                ...sx
            }}
        />
    );
}
