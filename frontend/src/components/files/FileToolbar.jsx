import { useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Menu,
    MenuItem,
    TextField,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import {
    UploadFile,
    CreateNewFolder,
    ViewModule,
    ViewList,
    Sort,
    Search,
    SelectAll,
} from '@mui/icons-material';
import CreateFolderDialog from './CreateFolderDialog';

/**
 * FileToolbar Component
 * Top action bar with file management controls
 */
export default function FileToolbar({
    viewMode,
    onViewModeChange,
    sortBy,
    sortOrder,
    onSortChange,
    onCreateFolder,
    selectedCount,
    onSelectAll,
    onSearch,
}) {
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSortClick = (event) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setSortAnchorEl(null);
    };

    const handleSortSelect = (field) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        onSortChange(field, newOrder);
        handleSortClose();
    };

    const handleCreateFolder = (name) => {
        onCreateFolder(name);
        setCreateFolderOpen(false);
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                flexWrap: 'wrap',
            }}
        >
            {/* Left Section - Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    variant="contained"
                    startIcon={<UploadFile />}
                    component="label"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Upload Files
                    <input
                        type="file"
                        hidden
                        multiple
                        onChange={(e) => {
                            // This will be handled by FileUploadZone
                            // Just for visual consistency
                        }}
                    />
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<CreateNewFolder />}
                    onClick={() => setCreateFolderOpen(true)}
                    sx={{ textTransform: 'none' }}
                >
                    New Folder
                </Button>

                {selectedCount > 0 && (
                    <Tooltip title="Select All">
                        <IconButton onClick={onSelectAll} color="primary">
                            <SelectAll />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Right Section - View Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {/* Search */}
                <TextField
                    size="small"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: '100%', sm: 200 } }}
                />

                {/* Sort */}
                <Tooltip title="Sort">
                    <IconButton onClick={handleSortClick}>
                        <Sort />
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={sortAnchorEl}
                    open={Boolean(sortAnchorEl)}
                    onClose={handleSortClose}
                >
                    <MenuItem onClick={() => handleSortSelect('name')}>
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                    <MenuItem onClick={() => handleSortSelect('size')}>
                        Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                    <MenuItem onClick={() => handleSortSelect('createdAt')}>
                        Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </MenuItem>
                </Menu>

                {/* View Mode Toggle */}
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newMode) => newMode && onViewModeChange(newMode)}
                    size="small"
                >
                    <ToggleButton value="grid">
                        <Tooltip title="Grid View">
                            <ViewModule />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="list">
                        <Tooltip title="List View">
                            <ViewList />
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Selected Count */}
            {selectedCount > 0 && (
                <Box
                    sx={{
                        px: 2,
                        py: 0.5,
                        bgcolor: 'primary.50',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    }}
                >
                    {selectedCount} selected
                </Box>
            )}

            {/* Create Folder Dialog */}
            <CreateFolderDialog
                open={createFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
                onCreate={handleCreateFolder}
            />
        </Box>
    );
}
