import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    viewMode: 'grid', // 'grid' or 'list'
    sortBy: 'name', // 'name', 'size', 'date', 'type'
    sortOrder: 'asc', // 'asc' or 'desc'
    showHidden: false,
    sidebarOpen: true,
    uploadProgress: {}, // { [fileId]: { progress: number, status: string } }
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setViewMode: (state, action) => {
            state.viewMode = action.payload;
        },
        toggleViewMode: (state) => {
            state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
        },
        setSortBy: (state, action) => {
            state.sortBy = action.payload;
        },
        setSortOrder: (state, action) => {
            state.sortOrder = action.payload;
        },
        toggleSortOrder: (state) => {
            state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        },
        setShowHidden: (state, action) => {
            state.showHidden = action.payload;
        },
        toggleShowHidden: (state) => {
            state.showHidden = !state.showHidden;
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setUploadProgress: (state, action) => {
            const { fileId, progress, status } = action.payload;
            state.uploadProgress[fileId] = { progress, status };
        },
        removeUploadProgress: (state, action) => {
            delete state.uploadProgress[action.payload];
        },
        clearUploadProgress: (state) => {
            state.uploadProgress = {};
        },
    },
});

export const {
    setViewMode,
    toggleViewMode,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    setShowHidden,
    toggleShowHidden,
    setSidebarOpen,
    toggleSidebar,
    setUploadProgress,
    removeUploadProgress,
    clearUploadProgress,
} = uiSlice.actions;

export default uiSlice.reducer;
