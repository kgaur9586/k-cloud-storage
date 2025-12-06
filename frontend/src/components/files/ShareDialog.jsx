import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    Switch,
    FormControlLabel,
    Chip,
    Alert,
    Divider,
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    Close as CloseIcon,
    Visibility,
    VisibilityOff,
    Share as ShareIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import shareService from '../../services/shareService';

/**
 * ShareDialog Component
 * Interactive dialog for creating and managing file share links
 */
export default function ShareDialog({ open, onClose, file }) {
    const [permission, setPermission] = useState('download');
    const [enablePassword, setEnablePassword] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [enableExpiration, setEnableExpiration] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);
    const [enableAccessLimit, setEnableAccessLimit] = useState(false);
    const [maxAccessCount, setMaxAccessCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState(null);

    const handleCreateShare = async () => {
        if (enablePassword && password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        try {
            setLoading(true);
            const options = {
                permission,
                password: enablePassword ? password : undefined,
                expiresAt: enableExpiration ? expiresAt?.toISOString() : undefined,
                maxAccessCount: enableAccessLimit ? maxAccessCount : undefined,
            };

            const result = await shareService.createShareLink(file.id, options);
            setShareLink(result);
            toast.success('Share link created successfully');
        } catch (error) {
            console.error('Failed to create share link:', error);
            toast.error(error.response?.data?.message || 'Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (shareLink?.shareUrl) {
            navigator.clipboard.writeText(shareLink.shareUrl);
            toast.success('Link copied to clipboard');
        }
    };

    const handleClose = () => {
        // Reset form
        setPermission('download');
        setEnablePassword(false);
        setPassword('');
        setEnableExpiration(false);
        setExpiresAt(null);
        setEnableAccessLimit(false);
        setMaxAccessCount(10);
        setShareLink(null);
        onClose();
    };

    const getExpirationPreset = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <ShareIcon />
                        <Typography variant="h6" fontWeight={600}>
                            Share File
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                    {file?.name}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ bgcolor: 'white', color: 'text.primary' }}>
                {shareLink ? (
                    // Share link created - show result
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Share link created successfully!
                        </Alert>

                        <TextField
                            fullWidth
                            label="Share Link"
                            value={shareLink.shareUrl}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleCopyLink} edge="end">
                                            <CopyIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                            <Chip
                                label={`Permission: ${shareLink.permission}`}
                                color="primary"
                                size="small"
                            />
                            {shareLink.hasPassword && (
                                <Chip label="Password Protected" color="warning" size="small" />
                            )}
                            {shareLink.expiresAt && (
                                <Chip
                                    label={`Expires: ${new Date(shareLink.expiresAt).toLocaleDateString()}`}
                                    color="info"
                                    size="small"
                                />
                            )}
                            {shareLink.maxAccessCount && (
                                <Chip
                                    label={`Max Access: ${shareLink.maxAccessCount}`}
                                    color="secondary"
                                    size="small"
                                />
                            )}
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            Access count: {shareLink.accessCount} / {shareLink.maxAccessCount || '∞'}
                        </Typography>
                    </Box>
                ) : (
                    // Share link creation form
                    <Box>
                        {/* Permission Level */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Permission Level</InputLabel>
                            <Select
                                value={permission}
                                onChange={(e) => setPermission(e.target.value)}
                                label="Permission Level"
                            >
                                <MenuItem value="view">
                                    <Box>
                                        <Typography variant="body1">View Only</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Can preview file, cannot download
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="download">
                                    <Box>
                                        <Typography variant="body1">Download</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Can view and download file
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="edit">
                                    <Box>
                                        <Typography variant="body1">Edit</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Can view, download, and upload new versions
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <Divider sx={{ my: 2 }} />

                        {/* Password Protection */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enablePassword}
                                    onChange={(e) => setEnablePassword(e.target.checked)}
                                />
                            }
                            label="Password Protection"
                            sx={{ mb: 1 }}
                        />
                        {enablePassword && (
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                helperText="Minimum 8 characters"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}

                        {/* Expiration Date */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enableExpiration}
                                    onChange={(e) => setEnableExpiration(e.target.checked)}
                                />
                            }
                            label="Set Expiration"
                            sx={{ mb: 1 }}
                        />
                        {enableExpiration && (
                            <Box sx={{ mb: 2 }}>
                                <Box display="flex" gap={1} mb={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setExpiresAt(getExpirationPreset(1))}
                                    >
                                        1 Day
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setExpiresAt(getExpirationPreset(7))}
                                    >
                                        7 Days
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setExpiresAt(getExpirationPreset(30))}
                                    >
                                        30 Days
                                    </Button>
                                </Box>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker
                                        label="Expiration Date"
                                        value={expiresAt}
                                        onChange={setExpiresAt}
                                        minDateTime={new Date()}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Box>
                        )}

                        {/* Access Limit */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enableAccessLimit}
                                    onChange={(e) => setEnableAccessLimit(e.target.checked)}
                                />
                            }
                            label="Limit Access Count"
                            sx={{ mb: 1 }}
                        />
                        {enableAccessLimit && (
                            <TextField
                                fullWidth
                                type="number"
                                label="Maximum Access Count"
                                value={maxAccessCount}
                                onChange={(e) => setMaxAccessCount(parseInt(e.target.value))}
                                inputProps={{ min: 1 }}
                                sx={{ mb: 2 }}
                            />
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ bgcolor: 'white', px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                    {shareLink ? 'Close' : 'Cancel'}
                </Button>
                {!shareLink && (
                    <Button
                        onClick={handleCreateShare}
                        variant="contained"
                        disabled={loading}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                            },
                        }}
                    >
                        Create Share Link
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
