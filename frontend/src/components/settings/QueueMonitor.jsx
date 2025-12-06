import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    HourglassEmpty as HourglassIcon,
    Refresh as RefreshIcon,
    PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import queueService from '../../services/queueService';

const QueueMonitor = () => {
    const [stats, setStats] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = async () => {
        try {
            setError(null);
            const [statsData, jobsData] = await Promise.all([
                queueService.getQueueStats(),
                queueService.getJobs('failed', 5),
            ]);
            console.log('Stats data received:', statsData);
            console.log('Jobs data received:', jobsData);
            setStats(statsData);
            setJobs(Array.isArray(jobsData?.jobs) ? jobsData.jobs : []);
        } catch (err) {
            console.error('Queue fetch error:', err);
            setError(err.message);
            setStats(null);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (jobId) => {
        try {
            await queueService.retryJob(jobId);
            fetchData(); // Refresh data
        } catch (err) {
            setError(`Failed to retry job: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchData();

        if (autoRefresh) {
            const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    const getHealthColor = (health) => {
        switch (health) {
            case 'healthy':
                return 'success';
            case 'busy':
                return 'warning';
            case 'unhealthy':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Queue Stats */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Queue Status</Typography>
                        <Box>
                            <Chip
                                label={stats?.health || 'Unknown'}
                                color={getHealthColor(stats?.health)}
                                size="small"
                                sx={{ mr: 1 }}
                            />
                            <Tooltip title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}>
                                <IconButton size="small" onClick={() => setAutoRefresh(!autoRefresh)}>
                                    <RefreshIcon color={autoRefresh ? 'primary' : 'disabled'} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <HourglassIcon color="action" sx={{ fontSize: 40 }} />
                                <Typography variant="h4">{stats?.counts.waiting || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Waiting
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <PlayArrowIcon color="primary" sx={{ fontSize: 40 }} />
                                <Typography variant="h4">{stats?.counts.active || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                                <Typography variant="h4">{stats?.counts.completed || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Completed
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box textAlign="center">
                                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                                <Typography variant="h4">{stats?.counts.failed || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Failed
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Failed Jobs */}
            {jobs.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Recent Failed Jobs
                        </Typography>
                        {jobs.map((job) => (
                            <Box
                                key={job.id}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box flex={1}>
                                    <Typography variant="body1" fontWeight="medium">
                                        {job.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        File: {job.data?.originalName || 'Unknown'}
                                    </Typography>
                                    <Typography variant="caption" color="error">
                                        {job.failedReason}
                                    </Typography>
                                </Box>
                                <Tooltip title="Retry job">
                                    <IconButton color="primary" onClick={() => handleRetry(job.id)}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default QueueMonitor;
