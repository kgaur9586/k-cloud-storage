import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    LinearProgress,
    Card,
    CardContent,
} from '@mui/material';
import { UserProfile } from '../../components/auth/UserProfile';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { UserProfileModal } from '../../components/auth/UserProfileModal';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';

/**
 * Dashboard page
 * Main page after authentication
 */
export function DashboardPage() {
    const [user, setUser] = useState(null);
    const [storageStats, setStorageStats] = useState(null);
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
            const [userData, storage] = await Promise.all([
                authService.getUser(),
                authService.getStorageStats(),
            ]);
            setUser(userData);
            setStorageStats(storage);
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

    const handleProfileSubmit = async (formData) => {
        try {
            await authService.createUser(formData);
            toast.success('Profile created successfully!');
            setShowProfileModal(false);
            setLoading(true);
            await loadUserData();
        } catch (error) {
            console.error('Failed to create profile:', error);
            toast.error(error.response?.data?.message || 'Failed to create profile');
            throw error;
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Container maxWidth="lg">
            <Box py={4}>
                {/* Header */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                            <CloudIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                            <Typography variant="h4" fontWeight={600}>
                                Dashboard
                            </Typography>
                        </Box>
                        <Box display="flex" gap={2} alignItems="center">
                            <UserProfile />
                            <LogoutButton />
                        </Box>
                    </Box>
                </Paper>

                {/* Welcome Section */}
                <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
                    <Typography variant="h5" gutterBottom fontWeight={500}>
                        Welcome back, {user?.name || 'User'}! 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Your personal cloud storage is ready. File upload features coming in Week 2!
                    </Typography>
                </Paper>

                {/* Stats Grid */}
                <Grid container spacing={3}>
                    {/* Storage Stats */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <StorageIcon color="primary" />
                                    <Typography variant="h6">Storage Usage</Typography>
                                </Box>

                                {loading ? (
                                    <LinearProgress />
                                ) : storageStats ? (
                                    <>
                                        <Box mb={2}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatBytes(storageStats.used)} of {formatBytes(storageStats.quota)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {storageStats.usagePercentage.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={storageStats.usagePercentage}
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatBytes(storageStats.available)} available
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography color="text.secondary">No data available</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Quick Stats */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <FolderIcon color="primary" />
                                    <Typography variant="h6">Quick Stats</Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        Files: <strong>0</strong>
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        Folders: <strong>0</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                        Start uploading files to see your stats grow!
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Info Section */}
                <Paper elevation={1} sx={{ p: 3, mt: 3, bgcolor: 'primary.50' }}>
                    <Typography variant="h6" gutterBottom>
                        🎉 Authentication is Working!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Week 1 Complete: User authentication with Logto is fully functional.
                        <br />
                        Coming Next: File upload, folder management, and more features in Week 2!
                    </Typography>
                </Paper>
            </Box>

            {/* Profile Creation Modal */}
            <UserProfileModal
                open={showProfileModal}
                email={partialUser?.email}
                onSubmit={handleProfileSubmit}
            />
        </Container>
    );
}
