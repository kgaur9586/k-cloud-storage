import { Box, Grid, Typography } from '@mui/material';
import { FolderOpen, InsertDriveFile } from '@mui/icons-material';
import FileCard from './FileCard';
import FileListItem from './FileListItem';

/**
 * FileList Component
 * Displays files and folders in grid or list view
 */
export default function FileList({
    files,
    folders,
    viewMode,
    selectedItems,
    onSelect,
    onNavigate,
    onDelete,
    onRename,
    onPreview,
}) {
    const hasItems = files.length > 0 || folders.length > 0;

    if (!hasItems) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    color: 'text.secondary',
                }}
            >
                <FolderOpen sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                    This folder is empty
                </Typography>
                <Typography variant="body2">
                    Upload files or create folders to get started
                </Typography>
            </Box>
        );
    }

    if (viewMode === 'grid') {
        return (
            <Grid container spacing={2}>
                {/* Folders first */}
                {folders.map((folder) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`folder-${folder.id}`}>
                        <FileCard
                            item={folder}
                            type="folder"
                            selected={selectedItems.includes(`folder-${folder.id}`)}
                            onSelect={() => onSelect(folder, 'folder')}
                            onNavigate={() => onNavigate(folder.id)}
                            onDelete={() => onDelete(folder, 'folder')}
                            onRename={(newName) => onRename(folder, 'folder', newName)}
                        />
                    </Grid>
                ))}

                {/* Then files */}
                {files.map((file) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`file-${file.id}`}>
                        <FileCard
                            item={file}
                            type="file"
                            selected={selectedItems.includes(`file-${file.id}`)}
                            onSelect={() => onSelect(file, 'file')}
                            onDelete={() => onDelete(file, 'file')}
                            onRename={(newName) => onRename(file, 'file', newName)}
                            onPreview={() => onPreview(file)}
                        />
                    </Grid>
                ))}
            </Grid>
        );
    }

    // List view
    return (
        <Box>
            {/* Folders first */}
            {folders.map((folder) => (
                <FileListItem
                    key={`folder-${folder.id}`}
                    item={folder}
                    type="folder"
                    selected={selectedItems.includes(`folder-${folder.id}`)}
                    onSelect={() => onSelect(folder, 'folder')}
                    onNavigate={() => onNavigate(folder.id)}
                    onDelete={() => onDelete(folder, 'folder')}
                    onRename={(newName) => onRename(folder, 'folder', newName)}
                />
            ))}

            {/* Then files */}
            {files.map((file) => (
                <FileListItem
                    key={`file-${file.id}`}
                    item={file}
                    type="file"
                    selected={selectedItems.includes(`file-${file.id}`)}
                    onSelect={() => onSelect(file, 'file')}
                    onDelete={() => onDelete(file, 'file')}
                    onRename={(newName) => onRename(file, 'file', newName)}
                    onPreview={() => onPreview(file)}
                />
            ))}
        </Box>
    );
}
