# Week 2: File Management System Design & Implementation

## 1. Overview
Week 2 focused on building the core file management capabilities of the K-Cloud Storage application. The goal was to create a robust, secure, and user-friendly system for uploading, organizing, and interacting with files and folders.

## 2. Architecture

### 2.1 Database Schema
We introduced two primary models: `File` and `Folder`.

**Folder Model:**
- `id`: UUID
- `name`: String
- `parentId`: UUID (Self-referencing foreign key for hierarchy)
- `userId`: UUID (Owner)
- `path`: String (Materialized path for efficient tree traversal)
- `isDeleted`: Boolean (Soft delete support)

**File Model:**
- `id`: UUID
- `name`: String
- `originalName`: String
- `mimeType`: String
- `size`: BigInt
- `path`: String (Physical storage path)
- `folderId`: UUID (Foreign key to Folder)
- `userId`: UUID (Owner)
- `hash`: String (SHA-256 hash for deduplication)
- `isDeleted`: Boolean

### 2.2 Backend Services
- **FileService**: Handles file upload, download, deletion, renaming, and moving. Implements storage quota checks and duplicate detection.
- **FolderService**: Manages folder creation, hierarchy (tree structure), and recursive operations (delete, move).
- **StorageService**: Abstraction layer for physical file operations. Currently implements local filesystem storage but designed to support cloud providers (S3) in the future.

### 2.3 API Endpoints
- `POST /api/files/upload`: Multipart file upload.
- `GET /api/files`: List files with pagination, sorting, and global search.
- `GET /api/files/:id/download`: Secure file download.
- `GET /api/folders/tree`: Returns full folder hierarchy.
- `POST /api/folders`: Create new folder.
- `PUT /api/files/:id`, `PUT /api/folders/:id`: Rename operations.
- `DELETE /api/files/:id`, `DELETE /api/folders/:id`: Soft delete operations.

## 3. Frontend Implementation

### 3.1 Component Structure
- **FileManager**: Main container component managing state (current folder, selection, view mode).
- **FileToolbar**: Actions bar (Upload, New Folder, Search, Sort, View Toggle).
- **FolderTree**: Recursive sidebar navigation component.
- **FileList**: Displays content in Grid or List view.
- **FileCard/FileListItem**: Individual item components with context menus.
- **FilePreviewModal**: Modal for previewing images, PDFs, text, and playing audio/video.

### 3.2 Key Features
- **Dual View Modes**: Users can switch between a visual Grid view and a detailed List view.
- **Global Search**: Search bar in the toolbar queries the backend to find files/folders across the entire user drive, not just the current folder.
- **Responsive Design**: The interface adapts to mobile devices:
    - Sidebar becomes a top scrollable section.
    - Toolbar actions stack or wrap.
    - Grid columns adjust based on screen width.
- **File Preview**: Integrated previewer supports:
    - Images (JPG, PNG, GIF, WebP)
    - Video (MP4, WebM)
    - Audio (MP3, WAV)
    - PDF
    - Text/Code (with syntax highlighting support in future)

### 3.3 State Management
- Used `useState` for local UI state (modals, selection).
- Used `useRef` to prevent infinite API loops during initialization.
- Implemented debounced search to reduce API calls.

## 4. Security & Performance
- **Authentication**: All API endpoints are protected via JWT middleware.
- **Authorization**: Resource access is strictly scoped to the authenticated `userId`.
- **Input Validation**: Zod schemas validate all incoming requests.
- **Pagination**: File listing is paginated to handle large directories.
- **Soft Deletes**: Files are marked as deleted rather than immediately removed, allowing for potential recovery (Trash feature).

## 5. Future Improvements
- **Cloud Storage**: Migrate `StorageService` to use AWS S3 or Google Cloud Storage.
- **Shared Folders**: Implement permission system for sharing.
- **Trash Bin**: UI to view and restore soft-deleted items.
- **File Versions**: Keep history of file changes.
