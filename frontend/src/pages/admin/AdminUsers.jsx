import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Storage as StorageIcon,
    Security as SecurityIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import adminService from '../../services/adminService';
import { formatBytes } from '../../utils/formatters';
import { toast } from 'react-toastify';


const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Dialog states
    const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newQuota, setNewQuota] = useState('');
    const [newRole, setNewRole] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.listUsers({
                page: page + 1,
                limit: rowsPerPage,
                search,
            });
            console.log('AdminUsers: Fetching users response:', response);

            let usersData = [];
            let total = 0;

            if (response.users) {
                // Interceptor unwrapped the response
                usersData = response.users;
                total = response.pagination?.total || 0;
            } else if (response.data && response.data.users) {
                // Response is the full API response object
                usersData = response.data.users;
                total = response.data.pagination?.total || 0;
            } else if (response.data && Array.isArray(response.data)) {
                // Direct array in data
                usersData = response.data;
                total = response.data.length;
            }

            setUsers(usersData || []);
            setTotalUsers(total || 0);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleMenuOpen = (event, user) => {
        setSelectedUser(user);
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUser(null);
    };

    // Quota Management
    const handleQuotaClick = () => {
        setNewQuota(selectedUser.storageQuota);
        setQuotaDialogOpen(true);
        setAnchorEl(null);
    };

    const handleQuotaSave = async () => {
        try {
            setActionLoading(true);
            await adminService.updateUserQuota(selectedUser.id, newQuota);
            toast.success('User quota updated');
            setQuotaDialogOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update quota');
        } finally {
            setActionLoading(false);
        }
    };

    // Role Management
    const handleRoleClick = () => {
        setNewRole(selectedUser.role);
        setRoleDialogOpen(true);
        setAnchorEl(null);
    };

    const handleRoleSave = async () => {
        try {
            setActionLoading(true);
            await adminService.updateUserRole(selectedUser.id, newRole);
            toast.success('User role updated');
            setRoleDialogOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Management
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        setAnchorEl(null);
    };

    const handleDeleteConfirm = async () => {
        try {
            setActionLoading(true);
            await adminService.deleteUser(selectedUser.id);
            toast.success('User deleted successfully');
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    User Management
                </Typography>
                <IconButton onClick={fetchUsers} title="Refresh">
                    <RefreshIcon />
                </IconButton>
            </Box>

            <Paper sx={{ mb: 4, p: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Storage</TableCell>
                                <TableCell>Files</TableCell>
                                <TableCell>Joined</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="textSecondary">No users found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2">{user.name || 'Unknown'}</Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role}
                                                color={user.role === 'admin' ? 'secondary' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2">
                                                    {formatBytes(user.storageUsed)} / {formatBytes(user.storageQuota)}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {((user.storageUsed / user.storageQuota) * 100).toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.fileCount || 0}</TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleQuotaClick}>
                    <StorageIcon sx={{ mr: 1 }} /> Edit Quota
                </MenuItem>
                <MenuItem onClick={handleRoleClick}>
                    <SecurityIcon sx={{ mr: 1 }} /> Change Role
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1 }} /> Delete User
                </MenuItem>
            </Menu>

            {/* Edit Quota Dialog */}
            <Dialog open={quotaDialogOpen} onClose={() => setQuotaDialogOpen(false)}>
                <DialogTitle>Edit Storage Quota</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Set the storage quota in bytes. (1 GB = 1073741824 bytes)
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Quota (Bytes)"
                        type="number"
                        fullWidth
                        value={newQuota}
                        onChange={(e) => setNewQuota(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQuotaDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleQuotaSave} variant="contained" disabled={actionLoading}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Warning: Roles are synced from Logto. If you change a role here, it might be overwritten on the next login if the user has different roles in Logto.
                        Please ensure you also update the role in the Logto Console.
                    </Alert>
                    <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={newRole}
                            label="Role"
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRoleSave} variant="contained" disabled={actionLoading}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Alert severity="error">
                        Are you sure you want to delete <b>{selectedUser?.name}</b>?
                        This action is irreversible and will delete all their files and folders.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={actionLoading}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminUsers;
