import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Tabs,
    Tab,
} from '@mui/material';
import { UserProfile } from '../../components/auth/UserProfile';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { UserProfileModal } from '../../components/auth/UserProfileModal';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import CloudIcon from '@mui/icons-material/Cloud';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import {
    Dashboard as DashboardIcon,
    Folder as FolderIcon,
    Settings as SettingsIcon,
    Delete as DeleteIcon,
    PhotoLibrary as PhotoLibraryIcon,
    BarChart as BarChartIcon // Re-added BarChartIcon as it's used
} from '@mui/icons-material';
import FileManager from '../../components/files/FileManager';
import StorageAnalytics from '../../components/analytics/StorageAnalytics';
import TrashBin from '../../components/trash/TrashBin';
import MediaGallery from '../../components/media/MediaGallery';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import MyShares from '../../pages/MyShares';
import SharedWithMe from '../../pages/SharedWithMe';
import {
    Share as ShareIcon,
    People as PeopleIcon,
} from '@mui/icons-material';

/**
 * Dashboard page
 * Main page after authentication with file management and analytics
 */
export function DashboardPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [partialUser, setPartialUser] = useState(null);
    const [currentTab, setCurrentTab] = useState('analytics');

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

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
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
                            {user && <Typography>{user.name || user.email}</Typography>}
                            <LogoutButton />
                        </Box>
                    </Box>

                    {/* Navigation Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
                        <Tabs value={currentTab} onChange={handleTabChange}>
                            <Tab
                                icon={<InsertDriveFileIcon />}
                                label="Files"
                                value="files" // Added value prop
                                iconPosition="start"
                            />
                            <Tab
                                icon={<PhotoLibraryIcon />}
                                label="Media"
                                value="media"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<ShareIcon />}
                                label="My Shares"
                                value="my-shares"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<PeopleIcon />}
                                label="Shared with Me"
                                value="shared-with-me"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<BarChartIcon />}
                                label="Analytics"
                                value="analytics" // Added value prop
                                iconPosition="start"
                            />
                            <Tab
                                icon={<DeleteIcon />}
                                label="Trash"
                                value="trash" // Added value prop
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>
                </Container>
            </Paper>

            {/* Content */}
            <ErrorBoundary>
                <Box sx={{ display: currentTab === 'files' ? 'block' : 'none' }}>
                    <FileManager />
                </Box>
                <Box sx={{ display: currentTab === 'media' ? 'block' : 'none' }}>
                    <MediaGallery />
                </Box>
                <Box sx={{ display: currentTab === 'my-shares' ? 'block' : 'none' }}>
                    <MyShares />
                </Box>
                <Box sx={{ display: currentTab === 'shared-with-me' ? 'block' : 'none' }}>
                    <SharedWithMe />
                </Box>
                <Box sx={{ display: currentTab === 'analytics' ? 'block' : 'none' }}>
                    <Container maxWidth="xl" sx={{ py: 3 }}>
                        <StorageAnalytics />
                    </Container>
                </Box>
                <Box sx={{ display: currentTab === 'trash' ? 'block' : 'none' }}>
                    <Container maxWidth="xl" sx={{ py: 3 }}>
                        <TrashBin />
                    </Container>
                </Box>
            </ErrorBoundary>
        </Box>
    );
}

