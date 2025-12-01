/**
 * File utility functions
 */

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension (lowercase, without dot)
 */
export const getFileExtension = (filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Get file type category from MIME type or extension
 * @param {string} mimeType - MIME type
 * @param {string} filename - File name (fallback)
 * @returns {string} File type category (image, video, audio, document, archive, code, other)
 */
export const getFileType = (mimeType, filename = '') => {
    if (mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
        if (mimeType.includes('text')) return 'text';
    }

    // Fallback to extension
    const ext = getFileExtension(filename);
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
    const docExts = ['doc', 'docx', 'odt'];
    const sheetExts = ['xls', 'xlsx', 'ods', 'csv'];
    const presentationExts = ['ppt', 'pptx', 'odp'];
    const archiveExts = ['zip', 'rar', 'tar', 'gz', '7z'];
    const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    if (docExts.includes(ext)) return 'document';
    if (sheetExts.includes(ext)) return 'spreadsheet';
    if (presentationExts.includes(ext)) return 'presentation';
    if (archiveExts.includes(ext)) return 'archive';
    if (codeExts.includes(ext)) return 'code';
    if (ext === 'txt') return 'text';

    return 'other';
};

/**
 * Check if file type can be previewed
 * @param {string} mimeType - MIME type
 * @param {string} filename - File name
 * @returns {boolean} True if file can be previewed
 */
export const canPreviewFile = (mimeType, filename) => {
    const type = getFileType(mimeType, filename);
    return ['image', 'video', 'audio', 'pdf', 'text', 'document', 'code'].includes(type);
};

/**
 * Get icon name for file type
 * @param {string} mimeType - MIME type
 * @param {string} filename - File name
 * @returns {string} Material icon name
 */
export const getFileIcon = (mimeType, filename) => {
    const type = getFileType(mimeType, filename);

    const iconMap = {
        image: 'Image',
        video: 'VideoFile',
        audio: 'AudioFile',
        pdf: 'PictureAsPdf',
        document: 'Description',
        spreadsheet: 'TableChart',
        presentation: 'Slideshow',
        archive: 'FolderZip',
        code: 'Code',
        text: 'TextSnippet',
        other: 'InsertDriveFile',
    };

    return iconMap[type] || 'InsertDriveFile';
};

/**
 * Validate file name
 * @param {string} name - File/folder name
 * @returns {object} { valid: boolean, error: string }
 */
export const validateFileName = (name) => {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Name cannot be empty' };
    }

    if (name.length > 255) {
        return { valid: false, error: 'Name is too long (max 255 characters)' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(name)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(name.toUpperCase())) {
        return { valid: false, error: 'Name is reserved' };
    }

    return { valid: true, error: null };
};

/**
 * Download file from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Get color for file type
 * @param {string} mimeType - MIME type
 * @param {string} filename - File name
 * @returns {string} Color code
 */
export const getFileColor = (mimeType, filename) => {
    const type = getFileType(mimeType, filename);

    const colorMap = {
        image: '#4caf50',
        video: '#f44336',
        audio: '#9c27b0',
        pdf: '#e53935',
        document: '#2196f3',
        spreadsheet: '#4caf50',
        presentation: '#ff9800',
        archive: '#795548',
        code: '#607d8b',
        text: '#9e9e9e',
        other: '#757575',
    };

    return colorMap[type] || '#757575';
};
