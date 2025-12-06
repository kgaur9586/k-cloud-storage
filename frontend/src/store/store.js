import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './slices/filesSlice';
import foldersReducer from './slices/foldersSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        files: filesReducer,
        folders: foldersReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for Date objects
                ignoredActions: ['files/setFiles', 'files/addFile', 'files/updateFile'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
                // Ignore these paths in the state
                ignoredPaths: ['files.items', 'folders.items'],
            },
        }),
});

// Export types for TypeScript (optional, but good practice)
export const selectFiles = (state) => state.files.items;
export const selectFolders = (state) => state.folders.items;
export const selectSelectedFileIds = (state) => state.files.selectedIds;
export const selectCurrentFolderId = (state) => state.files.currentFolderId;
export const selectViewMode = (state) => state.ui.viewMode;
export const selectSortBy = (state) => state.ui.sortBy;
export const selectSortOrder = (state) => state.ui.sortOrder;
