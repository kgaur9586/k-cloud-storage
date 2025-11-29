import { useLogto } from '@logto/react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

/**
 * Protected route wrapper
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useLogto();

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
