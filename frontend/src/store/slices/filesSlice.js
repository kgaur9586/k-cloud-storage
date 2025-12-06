import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    currentFolderId: null,
    selectedIds: [],
    loading: false,
    error: null,
    cache: {}, // { [folderId]: { data: [], timestamp: number } }
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        hasMore: true,
    },
};

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setFiles: (state, action) => {
            state.items = action.payload;
            state.error = null;
        },
        addFile: (state, action) => {
            state.items.unshift(action.payload);
        },
        addFiles: (state, action) => {
            state.items.unshift(...action.payload);
        },
        removeFile: (state, action) => {
            state.items = state.items.filter(f => f.id !== action.payload);
            state.selectedIds = state.selectedIds.filter(id => id !== action.payload);
        },
        removeFiles: (state, action) => {
            const idsToRemove = action.payload;
            state.items = state.items.filter(f => !idsToRemove.includes(f.id));
            state.selectedIds = state.selectedIds.filter(id => !idsToRemove.includes(id));
        },
        updateFile: (state, action) => {
            const index = state.items.findIndex(f => f.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = { ...state.items[index], ...action.payload };
            }
        },
        replaceFiles: (state, action) => {
            const { temp, real } = action.payload;
            const tempIds = temp.map(f => f.id);
            // Remove temp files
            state.items = state.items.filter(f => !tempIds.includes(f.id));
            // Add real files
            state.items.unshift(...real);
        },
        setCurrentFolderId: (state, action) => {
            state.currentFolderId = action.payload;
        },
        setSelectedIds: (state, action) => {
            state.selectedIds = action.payload;
        },
        toggleSelection: (state, action) => {
            const id = action.payload;
            if (state.selectedIds.includes(id)) {
                state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
            } else {
                state.selectedIds.push(id);
            }
        },
        selectAll: (state) => {
            state.selectedIds = state.items.map(f => f.id);
        },
        clearSelection: (state) => {
            state.selectedIds = [];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        cacheFiles: (state, action) => {
            const { folderId, data } = action.payload;
            const key = folderId || 'root';
            state.cache[key] = {
                data,
                timestamp: Date.now(),
            };
        },
        invalidateCache: (state, action) => {
            const folderId = action.payload;
            const key = folderId || 'root';
            delete state.cache[key];
        },
        clearCache: (state) => {
            state.cache = {};
        },
        // Pagination actions
        appendFiles: (state, action) => {
            // Add files without replacing existing ones (for infinite scroll)
            state.items.push(...action.payload);
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        resetPagination: (state) => {
            state.pagination = {
                page: 1,
                limit: 50,
                total: 0,
                hasMore: true,
            };
        },
    },
});

export const {
    setFiles,
    addFile,
    addFiles,
    removeFile,
    removeFiles,
    updateFile,
    replaceFiles,
    setCurrentFolderId,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    setLoading,
    setError,
    cacheFiles,
    invalidateCache,
    clearCache,
    appendFiles,
    setPagination,
    resetPagination,
} = filesSlice.actions;

export default filesSlice.reducer;
