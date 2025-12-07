import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    IconButton,
    useTheme,
} from '@mui/material';
import {
    People as PeopleIcon,
    Storage as StorageIcon,
    Description as FileIcon,
    TrendingUp as TrendingUpIcon,
    CloudUpload as UploadIcon,
    CloudDownload as DownloadIcon,
    Share as ShareIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import adminService from '../../services/adminService';
import { formatBytes } from '../../utils/formatters';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const StatCard = ({ title, value, subtext, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                        {title}
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                        {value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {subtext}
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>
                    {icon}
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'upload': return <UploadIcon color="primary" />;
            case 'download': return <DownloadIcon color="success" />;
            case 'share': return <ShareIcon color="info" />;
            case 'delete': return <DeleteIcon color="error" />;
            default: return <FileIcon />;
        }
    };

    return (
        <ListItem divider>
            <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'background.default' }}>
                    {getIcon(activity.type)}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Typography variant="subtitle2">
                        {activity.userName} {activity.type}ed {activity.fileName}
                    </Typography>
                }
                secondary={new Date(activity.timestamp).toLocaleString()}
            />
            {activity.fileSize && (
                <Chip size="small" label={formatBytes(activity.fileSize)} variant="outlined" />
            )}
        </ListItem>
    );
};

const AdminDashboard = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, activityData] = await Promise.all([
                adminService.getSystemStats(),
                adminService.getRecentActivity()
            ]);
            setStats(statsData);
            setActivity(activityData.activities);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return <LinearProgress />;
    }

    if (!stats) return null;

    // Chart Data
    const storageChartData = {
        labels: ['Used', 'Available'],
        datasets: [
            {
                data: [stats.storage.total, stats.storage.quota - stats.storage.total],
                backgroundColor: [theme.palette.primary.main, theme.palette.grey[200]],
                borderWidth: 0,
            },
        ],
    };

    const fileTypeData = {
        labels: ['Images', 'Videos', 'Documents'],
        datasets: [
            {
                data: [stats.files.images, stats.files.videos, stats.files.documents],
                backgroundColor: [
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.info.main,
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Admin Dashboard
                </Typography>
                <IconButton onClick={fetchDashboardData} title="Refresh Data">
                    <RefreshIcon />
                </IconButton>
            </Box>

            {/* Key Metrics */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Users"
                        value={stats.users.total}
                        subtext={`${stats.users.new} new this month`}
                        icon={<PeopleIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Users"
                        value={stats.users.active}
                        subtext="Last 30 days"
                        icon={<TrendingUpIcon />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Storage Used"
                        value={formatBytes(stats.storage.total)}
                        subtext={`${stats.storage.percentage}% of ${formatBytes(stats.storage.quota)}`}
                        icon={<StorageIcon />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Files"
                        value={stats.files.total.toLocaleString()}
                        subtext={`${stats.activity.uploads} uploads today`}
                        icon={<FileIcon />}
                        color="info"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Storage Distribution */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Storage Usage
                            </Typography>
                            <Box height={250} display="flex" justifyContent="center">
                                <Doughnut
                                    data={storageChartData}
                                    options={{
                                        cutout: '70%',
                                        plugins: { legend: { position: 'bottom' } }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* File Types */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                File Distribution
                            </Typography>
                            <Box height={250} display="flex" justifyContent="center">
                                <Doughnut
                                    data={fileTypeData}
                                    options={{
                                        cutout: '70%',
                                        plugins: { legend: { position: 'bottom' } }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Activity
                            </Typography>
                            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {activity.length > 0 ? (
                                    activity.map((item) => (
                                        <ActivityItem key={item.id} activity={item} />
                                    ))
                                ) : (
                                    <Typography color="textSecondary" align="center" py={4}>
                                        No recent activity
                                    </Typography>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminDashboard;
