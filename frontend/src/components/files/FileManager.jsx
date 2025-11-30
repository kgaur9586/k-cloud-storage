import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Container, Paper, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import fileService from '../../services/fileService';
import folderService from '../../services/folderService';
import FileToolbar from './FileToolbar';
import Breadcrumb from './Breadcrumb';
import FolderTree from './FolderTree';
import FileList from './FileList';
import FileUploadZone from './FileUploadZone';

/**
 * FileManager Component
 * Main container for file management functionality
 */
export default function FileManager() {
    // State
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [folderTree, setFolderTree] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);
    const initialLoadDone = useRef(false);

    // Load initial data - runs only once on mount
    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;

        const loadInitialData = async () => {
            try {
                // Load folder tree
                const treeData = await folderService.getFolderTree();
                setFolderTree(treeData.root || []);
            } catch (error) {
                console.error('Failed to load folder tree:', error);
            }

            try {
                setLoading(true);
                const [filesData, foldersData] = await Promise.all([
                    fileService.listFiles(null, { sortBy: 'name', sortOrder: 'asc' }),
                    folderService.listFolders(null),
                ]);

                setFiles(filesData.files || []);
                setFolders(foldersData.folders || []);
            } catch (error) {
                console.error('Failed to load data:', error);
                toast.error('Failed to load files and folders');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // Reload data when folder/sort changes
    useEffect(() => {
        if (!initialLoadDone.current) return; // Skip on initial mount

        const reloadData = async () => {
            try {
                setLoading(true);
                const [filesData, foldersData] = await Promise.all([
                    fileService.listFiles(currentFolderId, { sortBy, sortOrder }),
                    folderService.listFolders(currentFolderId),
                ]);

                setFiles(filesData.files || []);
                setFolders(foldersData.folders || []);

                // Build breadcrumb
                if (currentFolderId) {
                    try {
                        const folderData = await folderService.getFolder(currentFolderId);
                        const folder = folderData;
                        const pathParts = folder.path.split('/').filter(Boolean);
                        const breadcrumbs = pathParts.map((name, index) => ({
                            name,
                            path: '/' + pathParts.slice(0, index + 1).join('/'),
                        }));
                        setBreadcrumbPath(breadcrumbs);
                    } catch (error) {
                        console.error('Failed to build breadcrumb:', error);
                    }
                } else {
                    setBreadcrumbPath([]);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                toast.error('Failed to load files and folders');
            } finally {
                setLoading(false);
            }
        };

        reloadData();
    }, [currentFolderId, sortBy, sortOrder]);

    // Helper function to reload data (for use in handlers)
    const reloadCurrentData = async () => {
        try {
            setLoading(true);
            const [filesData, foldersData] = await Promise.all([
                fileService.listFiles(currentFolderId, { sortBy, sortOrder }),
                folderService.listFolders(currentFolderId),
            ]);
            setFiles(filesData.files || []);
            setFolders(foldersData.folders || []);
        } catch (error) {
            console.error('Failed to reload data:', error);
            toast.error('Failed to reload files and folders');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to reload folder tree (for use in handlers)
    const reloadFolderTree = async () => {
        try {
            const treeData = await folderService.getFolderTree();
            setFolderTree(treeData.root || []);
        } catch (error) {
            console.error('Failed to reload folder tree:', error);
        }
    };

    /**
     * Handle file upload
     */
    const handleUpload = async (uploadedFiles) => {
        try {
            setUploading(true);
            const result = await fileService.uploadFiles(uploadedFiles, currentFolderId);

            toast.success(`${result.successCount} file(s) uploaded successfully`);

            if (result.failedCount > 0) {
                toast.warning(`${result.failedCount} file(s) failed to upload`);
            }

            // Reload data
            await reloadCurrentData();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    /**
     * Handle folder navigation
     */
    const handleNavigate = (folderId) => {
        setCurrentFolderId(folderId);
        setSelectedItems([]);
    };

    /**
     * Handle folder creation
     */
    const handleCreateFolder = async (name) => {
        try {
            await folderService.createFolder(name, currentFolderId);
            toast.success('Folder created successfully');
            await reloadCurrentData();
            await reloadFolderTree();
        } catch (error) {
            console.error('Failed to create folder:', error);
            toast.error(error.response?.data?.message || 'Failed to create folder');
        }
    };

    /**
     * Handle item selection
     */
    const handleSelect = (item, type) => {
        const itemId = `${type}-${item.id}`;
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    /**
     * Handle select all
     */
    const handleSelectAll = () => {
        if (selectedItems.length === files.length + folders.length) {
            setSelectedItems([]);
        } else {
            const allItems = [
                ...folders.map(f => `folder-${f.id}`),
                ...files.map(f => `file-${f.id}`)
            ];
            setSelectedItems(allItems);
        }
    };

    /**
     * Handle item deletion
     */
    const handleDelete = async (item, type) => {
        try {
            if (type === 'file') {
                await fileService.deleteFile(item.id);
            } else {
                await folderService.deleteFolder(item.id);
            }

            toast.success(`${type === 'file' ? 'File' : 'Folder'} deleted successfully`);
            await reloadCurrentData();
            await reloadFolderTree();
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    /**
     * Handle item rename
     */
    const handleRename = async (item, type, newName) => {
        try {
            if (type === 'file') {
                await fileService.renameFile(item.id, newName);
            } else {
                await folderService.renameFolder(item.id, newName);
            }

            toast.success('Renamed successfully');
            await reloadCurrentData();
            await reloadFolderTree();
        } catch (error) {
            console.error('Failed to rename:', error);
            toast.error(error.response?.data?.message || 'Failed to rename');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Paper elevation={2} sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <FileToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(field, order) => {
                        setSortBy(field);
                        setSortOrder(order);
                    }}
                    onCreateFolder={handleCreateFolder}
                    selectedCount={selectedItems.length}
                    onSelectAll={handleSelectAll}
                />

                {/* Breadcrumb */}
                <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Breadcrumb
                        path={breadcrumbPath}
                        onNavigate={handleNavigate}
                    />
                </Box>

                {/* Main Content */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Folder Tree Sidebar */}
                    <Box
                        sx={{
                            width: 250,
                            borderRight: 1,
                            borderColor: 'divider',
                            overflow: 'auto',
                            p: 2,
                        }}
                    >
                        <FolderTree
                            tree={folderTree}
                            currentFolderId={currentFolderId}
                            onNavigate={handleNavigate}
                            onRefresh={reloadFolderTree}
                        />
                    </Box>

                    {/* File List */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <FileUploadZone
                                    onUpload={handleUpload}
                                    uploading={uploading}
                                />

                                <FileList
                                    files={files}
                                    folders={folders}
                                    viewMode={viewMode}
                                    selectedItems={selectedItems}
                                    onSelect={handleSelect}
                                    onNavigate={handleNavigate}
                                    onDelete={handleDelete}
                                    onRename={handleRename}
                                />
                            </>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
