import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from '@mui/material';
import { validateFileName } from '../../utils/fileUtils';

/**
 * CreateFolderDialog Component
 * Dialog for creating a new folder
 */
export default function CreateFolderDialog({ open, onClose, onCreate }) {
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState('');

    const handleCreate = () => {
        const validation = validateFileName(folderName);

        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        onCreate(folderName);
        setFolderName('');
        setError('');
    };

    const handleClose = () => {
        setFolderName('');
        setError('');
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCreate();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Folder Name"
                    fullWidth
                    value={folderName}
                    onChange={(e) => {
                        setFolderName(e.target.value);
                        setError('');
                    }}
                    onKeyPress={handleKeyPress}
                    error={Boolean(error)}
                    helperText={error}
                    placeholder="Enter folder name"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} variant="contained" disabled={!folderName.trim()}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
