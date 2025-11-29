import { useEffect, useState } from 'react';
import { useLogto } from '@logto/react';
import { Avatar, Box, Typography, Skeleton } from '@mui/material';

/**
 * User profile display component
 * Shows user avatar, name, and email
 */
export function UserProfile() {
    const { isAuthenticated, getIdTokenClaims } = useLogto();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            getIdTokenClaims()
                .then(setUser)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, getIdTokenClaims]);

    if (!isAuthenticated || !user) {
        return null;
    }

    if (loading) {
        return (
            <Box display="flex" alignItems="center" gap={2}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box>
                    <Skeleton width={120} height={20} />
                    <Skeleton width={160} height={16} />
                </Box>
            </Box>
        );
    }

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <Avatar
                src={user.picture}
                alt={user.name}
                sx={{ width: 40, height: 40 }}
            />
            <Box>
                <Typography variant="body1" fontWeight={500}>
                    {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {user.email}
                </Typography>
            </Box>
        </Box>
    );
}
