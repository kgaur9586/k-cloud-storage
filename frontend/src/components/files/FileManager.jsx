import { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import fileService from '../../services/fileService';
import folderService from '../../services/folderService';
import FileToolbar from './FileToolbar';
import Breadcrumb from './Breadcrumb';
import FolderTree from './FolderTree';
import FileList from './FileList';
import FileUploadZone from './FileUploadZone';
import FilePreviewModal from './FilePreviewModal';
import ShareDialog from './ShareDialog';
import SelectionToolbar from './SelectionToolbar';
import MoveDialog from './MoveDialog';
import CopyDialog from './CopyDialog';
import useSelection from '../../hooks/useSelection';

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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [fileToShare, setFileToShare] = useState(null);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const initialLoadDone = useRef(false);

    // Multi-select functionality
    const allItems = [...folders.map(f => ({ ...f, type: 'folder' })), ...files.map(f => ({ ...f, type: 'file' }))];
    const selection = useSelection(allItems);

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

    // Reload data when folder/sort/search changes
    useEffect(() => {
        if (!initialLoadDone.current) return; // Skip on initial mount

        const reloadData = async () => {
            try {
                setLoading(true);
                const [filesData, foldersData] = await Promise.all([
                    fileService.listFiles(currentFolderId, { sortBy, sortOrder, search: searchQuery }),
                    folderService.listFolders(currentFolderId, searchQuery),
                ]);

                setFiles(filesData.files || []);
                setFolders(foldersData.folders || []);

                // Build breadcrumb
                if (currentFolderId && !searchQuery) {
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
                } else if (searchQuery) {
                    setBreadcrumbPath([{ name: 'Search Results', path: null }]);
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

        // Debounce search
        const timeoutId = setTimeout(() => {
            reloadData();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [currentFolderId, sortBy, sortOrder, searchQuery]);

    // Helper function to reload data (for use in handlers)
    const reloadCurrentData = async () => {
        try {
            setLoading(true);
            const [filesData, foldersData] = await Promise.all([
                fileService.listFiles(currentFolderId, { sortBy, sortOrder, search: searchQuery }),
                folderService.listFolders(currentFolderId, searchQuery),
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
        selection.clearSelection();
        setSearchQuery(''); // Clear search on navigation
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
     * Handle item selection (only from checkbox)
     * This is now handled by the selection hook in FileList
     */

    /**
     * Handle select all
     */
    const handleSelectAll = () => {
        if (selection.selectedCount === files.length + folders.length) {
            selection.clearSelection();
        } else {
            selection.selectAll();
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
     * Handle bulk deletion
     */
    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selection.selectedCount} items?`)) {
            return;
        }

        try {
            const selectedItems = selection.getSelectedItems();
            const deletePromises = selectedItems.map(item => {
                if (item.type === 'file') {
                    return fileService.deleteFile(item.id);
                } else {
                    return folderService.deleteFolder(item.id);
                }
            });

            await Promise.all(deletePromises);
            toast.success('Selected items deleted successfully');
            selection.clearSelection();
            await reloadCurrentData();
            await reloadFolderTree();
        } catch (error) {
            console.error('Failed to delete items:', error);
            toast.error('Failed to delete some items');
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

    /**
     * Handle file preview
     */
    const handlePreview = (file) => {
        setPreviewFile(file);
    };

    const handleClosePreview = () => {
        setPreviewFile(null);
    };

    /**
     * Handle file sharing
     */
    const handleShare = (file) => {
        setFileToShare(file);
        setShareDialogOpen(true);
    };



    const handleCloseShare = () => {
        setShareDialogOpen(false);
        setFileToShare(null);
    };

    const handleShareUpdate = (updatedFile) => {
        setFiles(prevFiles =>
            prevFiles.map(f => f.id === updatedFile.id ? updatedFile : f)
        );
    };

    /**
     * Handle search
     */
    const handleSearch = (query) => {
        setSearchQuery(query);
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
                    selectedCount={selection.selectedCount}
                    onSelectAll={handleSelectAll}
                    onSearch={handleSearch}
                    onBulkDelete={handleBulkDelete}
                />

                {/* Breadcrumb */}
                <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Breadcrumb
                        path={breadcrumbPath}
                        onNavigate={handleNavigate}
                    />
                </Box>

                {/* Main Content */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Folder Tree Sidebar */}
                    <Box
                        sx={{
                            width: { xs: '100%', md: 250 },
                            height: { xs: '200px', md: 'auto' },
                            borderRight: { xs: 0, md: 1 },
                            borderBottom: { xs: 1, md: 0 },
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
                                    selectedItems={selection.selectedIds}
                                    onSelect={(item, type, index, event) => {
                                        const itemIndex = allItems.findIndex(i => i.id === item.id);
                                        selection.toggleSelection(item.id, itemIndex, event);
                                    }}
                                    onNavigate={handleNavigate}
                                    onDelete={handleDelete}
                                    onRename={handleRename}
                                    onPreview={handlePreview}
                                    onShare={handleShare}
                                />
                            </>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                open={Boolean(previewFile)}
                onClose={handleClosePreview}
            />


            {/* Share Dialog */}
            {/* Share Dialog */}
            <ShareDialog
                file={fileToShare}
                open={shareDialogOpen}
                onClose={() => {
                    setShareDialogOpen(false);
                    setFileToShare(null);
                }}
            />

            {/* Selection Toolbar */}
            <SelectionToolbar
                selectedCount={selection.selectedCount}
                onClear={selection.clearSelection}
                onMove={() => setMoveDialogOpen(true)}
                onCopy={() => setCopyDialogOpen(true)}
                onDelete={() => {
                    if (window.confirm(`Delete ${selection.selectedCount} item(s)?`)) {
                        const fileIds = selection.getSelectedItems().filter(i => i.type === 'file').map(i => i.id);
                        fileService.batchDeleteFiles(fileIds).then(() => {
                            toast.success('Files deleted');
                            selection.clearSelection();
                            reloadCurrentData();
                        });
                    }
                }}
                onDownload={async () => {
                    const files = selection.getSelectedItems().filter(i => i.type === 'file');
                    for (const file of files) {
                        const { blob, filename } = await fileService.downloadFile(file.id);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                }}
            />

            {/* Move Dialog */}
            <MoveDialog
                open={moveDialogOpen}
                onClose={() => setMoveDialogOpen(false)}
                onMove={async (targetFolderId) => {
                    const fileIds = selection.getSelectedItems().filter(i => i.type === 'file').map(i => i.id);
                    const result = await fileService.batchMoveFiles(fileIds, targetFolderId);
                    toast.success(`${result.successCount} file(s) moved`);
                    selection.clearSelection();
                    setMoveDialogOpen(false);
                    reloadCurrentData();
                }}
                selectedItems={selection.getSelectedItems()}
                currentFolderId={currentFolderId}
            />

            {/* Copy Dialog */}
            <CopyDialog
                open={copyDialogOpen}
                onClose={() => setCopyDialogOpen(false)}
                onCopy={async (targetFolderId, newName) => {
                    const fileIds = selection.getSelectedItems().filter(i => i.type === 'file').map(i => i.id);
                    const result = await fileService.batchCopyFiles(fileIds, targetFolderId);
                    toast.success(`${result.successCount} file(s) copied`);
                    selection.clearSelection();
                    setCopyDialogOpen(false);
                    reloadCurrentData();
                }}
                selectedItems={selection.getSelectedItems()}
                currentFolderId={currentFolderId}
            />
        </Container>
    );
}
