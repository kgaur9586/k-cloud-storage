import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
import MoveDialog from './MoveDialog';

/**
 * CopyDialog Component
 * Dialog for copying files/folders with optional rename
 * Reuses MoveDialog for folder selection
 */
export default function CopyDialog({
    open,
    onClose,
    onCopy,
    selectedItems = [],
    currentFolderId,
}) {
    const [showFolderSelector, setShowFolderSelector] = useState(false);
    const [customName, setCustomName] = useState('');
    const [useCustomName, setUseCustomName] = useState(false);
    const [targetFolderId, setTargetFolderId] = useState(currentFolderId);

    const handleCopy = () => {
        const name = useCustomName && customName.trim() ? customName.trim() : undefined;
        onCopy(targetFolderId, name);
        handleClose();
    };

    const handleClose = () => {
        setCustomName('');
        setUseCustomName(false);
        setTargetFolderId(currentFolderId);
        onClose();
    };

    const handleSelectFolder = (folderId) => {
        setTargetFolderId(folderId);
        setShowFolderSelector(false);
    };

    const isSingleItem = selectedItems.length === 1;
    const itemName = isSingleItem ? selectedItems[0]?.name : '';

    return (
        <>
            <Dialog
                open={open && !showFolderSelector}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    },
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CopyIcon color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Copy Items
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} will be copied
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {/* Destination Folder */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Destination
                            </Typography>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setShowFolderSelector(true)}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    py: 1.5,
                                }}
                            >
                                {targetFolderId === currentFolderId
                                    ? 'Current folder (create copy here)'
                                    : targetFolderId === null
                                        ? 'Root folder'
                                        : 'Selected folder'}
                            </Button>
                        </Box>

                        {/* Custom Name (only for single item) */}
                        {isSingleItem && (
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={useCustomName}
                                            onChange={(e) => setUseCustomName(e.target.checked)}
                                        />
                                    }
                                    label="Rename during copy"
                                />

                                {useCustomName && (
                                    <TextField
                                        fullWidth
                                        label="New name"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder={itemName}
                                        sx={{ mt: 1 }}
                                        autoFocus
                                    />
                                )}
                            </Box>
                        )}

                        {/* Info Alert */}
                        <Alert severity="info" icon={<CopyIcon />}>
                            {targetFolderId === currentFolderId
                                ? 'Items will be copied to the same folder with " (copy)" suffix'
                                : 'Items will be copied to the selected folder'}
                        </Alert>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCopy}
                        variant="contained"
                        startIcon={<CopyIcon />}
                        disabled={useCustomName && !customName.trim()}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                            },
                        }}
                    >
                        Copy
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Folder Selector */}
            <MoveDialog
                open={showFolderSelector}
                onClose={() => setShowFolderSelector(false)}
                onMove={handleSelectFolder}
                selectedItems={selectedItems}
                currentFolderId={currentFolderId}
                title="Select Destination Folder"
            />
        </>
    );
}
