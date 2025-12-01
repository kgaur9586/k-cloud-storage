import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Chip,
} from '@mui/material';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import analyticsService from '../../services/analyticsService';
import { Storage, Folder, InsertDriveFile } from '@mui/icons-material';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

/**
 * Format bytes to human-readable format
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * StorageAnalytics Component
 * Displays comprehensive storage analytics with charts
 */
export default function StorageAnalytics() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await analyticsService.getAnalytics();
            console.log('Analytics data received:', data);
            console.log('Data type:', typeof data);
            console.log('Data keys:', data ? Object.keys(data) : 'null');
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!analytics) {
        return (
            <Box p={3}>
                <Typography color="text.secondary">No analytics data available</Typography>
            </Box>
        );
    }

    // Prepare data for file type pie chart
    const typeLabels = Object.keys(analytics.byType);
    const typeData = {
        labels: typeLabels.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
        datasets: [
            {
                data: typeLabels.map(type => analytics.byType[type].size),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                ],
            },
        ],
    };

    // Prepare data for folder bar chart
    const folderData = {
        labels: analytics.byFolder.slice(0, 10).map(f => f.name),
        datasets: [
            {
                label: 'Storage Used',
                data: analytics.byFolder.slice(0, 10).map(f => f.size),
                backgroundColor: '#36A2EB',
            },
        ],
    };

    // Prepare data for trends line chart
    const trendsData = {
        labels: analytics.trends.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Total Storage',
                data: analytics.trends.map(t => t.size),
                borderColor: '#4BC0C0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <Box>
            {/* Overview Cards */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Storage color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">Total Storage</Typography>
                            </Box>
                            <Typography variant="h4" color="primary">
                                {formatBytes(analytics.overview.totalSize)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                {analytics.overview.totalFiles} files
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <InsertDriveFile color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="h6">Average File Size</Typography>
                            </Box>
                            <Typography variant="h4" color="secondary">
                                {formatBytes(analytics.overview.averageFileSize)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Folder color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6">Folders</Typography>
                            </Box>
                            <Typography variant="h4" color="success.main">
                                {analytics.byFolder.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} mb={3}>
                {/* File Type Distribution */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Storage by File Type
                            </Typography>
                            <Box height={300}>
                                <Pie data={typeData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Folder Distribution */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Top 10 Folders by Size
                            </Typography>
                            <Box height={300}>
                                <Bar data={folderData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Storage Trends */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Storage Growth (Last 30 Days)
                            </Typography>
                            <Box height={300}>
                                <Line data={trendsData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Largest Files */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Largest Files
                    </Typography>
                    <List>
                        {analytics.largestFiles.map((file, index) => (
                            <ListItem
                                key={file.id}
                                divider={index < analytics.largestFiles.length - 1}
                            >
                                <ListItemText
                                    primary={file.name}
                                    secondary={`${formatBytes(file.size)} • ${new Date(file.createdAt).toLocaleDateString()}`}
                                />
                                <Chip
                                    label={file.mimeType.split('/')[0]}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
}
