import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    currentPath: [], // Breadcrumb path
    expanded: {}, // { [folderId]: boolean }
    loading: false,
    error: null,
};

const foldersSlice = createSlice({
    name: 'folders',
    initialState,
    reducers: {
        setFolders: (state, action) => {
            state.items = action.payload;
            state.error = null;
        },
        addFolder: (state, action) => {
            state.items.unshift(action.payload);
        },
        removeFolder: (state, action) => {
            state.items = state.items.filter(f => f.id !== action.payload);
        },
        updateFolder: (state, action) => {
            const index = state.items.findIndex(f => f.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = { ...state.items[index], ...action.payload };
            }
        },
        setCurrentPath: (state, action) => {
            state.currentPath = action.payload;
        },
        toggleExpanded: (state, action) => {
            const folderId = action.payload;
            state.expanded[folderId] = !state.expanded[folderId];
        },
        setExpanded: (state, action) => {
            const { folderId, expanded } = action.payload;
            state.expanded[folderId] = expanded;
        },
        expandAll: (state) => {
            state.items.forEach(folder => {
                state.expanded[folder.id] = true;
            });
        },
        collapseAll: (state) => {
            state.expanded = {};
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    setFolders,
    addFolder,
    removeFolder,
    updateFolder,
    setCurrentPath,
    toggleExpanded,
    setExpanded,
    expandAll,
    collapseAll,
    setLoading,
    setError,
} = foldersSlice.actions;

export default foldersSlice.reducer;
