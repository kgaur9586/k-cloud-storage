import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
} from '@mui/material';
import { UserProfile } from '../../components/auth/UserProfile';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { UserProfileModal } from '../../components/auth/UserProfileModal';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import CloudIcon from '@mui/icons-material/Cloud';
import FileManager from '../../components/files/FileManager';
import ErrorBoundary from '../../components/common/ErrorBoundary';

/**
 * Dashboard page
 * Main page after authentication with file management
 */
export function DashboardPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [partialUser, setPartialUser] = useState(null);

    const effectRan = useRef(false);

    useEffect(() => {
        if (effectRan.current === false) {
            loadUserData();
            return () => {
                effectRan.current = true;
            };
        }
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await authService.getUser();
            setUser(userData);
        } catch (error) {
            // Handle 404 - user authenticated but not in database
            if (error.response?.status === 404) {
                console.log('User not found in database, showing profile modal');
                setPartialUser(error.response.data.data || error.response.data);
                setShowProfileModal(true);
            } else {
                console.error('Failed to load user data:', error);
                toast.error('Failed to load user data');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Container maxWidth="xl">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                            <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h5" fontWeight={600}>
                                K-Cloud Storage
                            </Typography>
                        </Box>
                        <Box display="flex" gap={2} alignItems="center">
                            {/* <UserProfile /> */}
                            {user && <Typography>{user.name || user.email}</Typography>}
                            <LogoutButton />
                        </Box>
                    </Box>
                </Container>
            </Paper>

            {/* File Manager */}
            <ErrorBoundary>
                <FileManager />
            </ErrorBoundary>
        </Box>
    );
}

