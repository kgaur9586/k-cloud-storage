# System Architecture - Personal Cloud Storage with AI

## Architecture Overview

This document outlines the system architecture for a self-hosted personal cloud storage solution with AI-powered features.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Web Browser  │  │ Mobile Web   │  │ Future: Apps │      │
│  │   (React)    │  │  (Responsive)│  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS (SSL/TLS)
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy                     │
│              (Load Balancing, SSL Termination)               │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer (Node.js)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Express.js API Server                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │   Auth   │ │   File   │ │   AI     │ │  Share   │ │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│   Database    │  │  File Storage  │  │  Cache Layer   │
│  (Metadata)   │  │  (File System) │  │    (Redis)     │
│               │  │                │  │                │
│  PostgreSQL   │  │  /data/files/  │  │  - Sessions    │
│  or MongoDB   │  │  - Original    │  │  - Search      │
│               │  │  - Thumbnails  │  │  - AI Results  │
└───────────────┘  └────────────────┘  └────────────────┘
```

## Component Architecture

### 1. Frontend Layer (React)

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ProtectedRoute.jsx
│   ├── files/
│   │   ├── FileList.jsx
│   │   ├── FileUpload.jsx
│   │   ├── FilePreview.jsx
│   │   └── FileActions.jsx
│   ├── folders/
│   │   ├── FolderTree.jsx
│   │   └── Breadcrumb.jsx
│   ├── search/
│   │   ├── SearchBar.jsx
│   │   ├── SearchResults.jsx
│   │   └── AdvancedFilters.jsx
│   ├── sharing/
│   │   ├── ShareDialog.jsx
│   │   └── PermissionsManager.jsx
│   └── common/
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       └── UploadProgress.jsx
├── services/
│   ├── api.js (Axios instance)
│   ├── authService.js
│   ├── fileService.js
│   └── searchService.js
├── store/
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── fileSlice.js
│   │   └── uiSlice.js
│   └── store.js
├── hooks/
│   ├── useAuth.js
│   ├── useFileUpload.js
│   └── useSearch.js
└── utils/
    ├── formatters.js
    └── validators.js
```

**Key Technologies:**
- React 18+ with Hooks
- Redux Toolkit for state management
- React Router for navigation
- Axios for API calls
- Material-UI or Ant Design for UI components
- React Dropzone for file uploads

### 2. Backend Layer (Node.js + Express)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── storage.js
│   │   └── ai.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── files.routes.js
│   │   ├── folders.routes.js
│   │   ├── search.routes.js
│   │   └── share.routes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   ├── searchController.js
│   │   └── shareController.js
│   ├── services/
│   │   ├── fileService.js
│   │   ├── aiService.js
│   │   ├── searchService.js
│   │   ├── duplicateService.js
│   │   └── thumbnailService.js
│   ├── models/
│   │   ├── User.js
│   │   ├── File.js
│   │   ├── Folder.js
│   │   ├── Share.js
│   │   └── Tag.js
│   ├── utils/
│   │   ├── fileHash.js
│   │   ├── encryption.js
│   │   └── logger.js
│   └── workers/
│       ├── thumbnailWorker.js
│       ├── aiWorker.js
│       └── cleanupWorker.js
├── tests/
└── server.js
```

**Key Technologies:**
- Express.js for REST API
- Multer for file uploads
- JWT for authentication
- Bcrypt for password hashing
- Bull or Agenda for job queues
- Winston for logging
- Joi for validation

### 3. Database Schema (PostgreSQL)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    storage_quota BIGINT DEFAULT 10737418240, -- 10GB
    storage_used BIGINT DEFAULT 0,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders Table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, parent_id, name)
);

-- Files Table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT NOT NULL,
    hash VARCHAR(64) UNIQUE, -- SHA256 for deduplication
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Metadata (AI-generated)
CREATE TABLE file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    category VARCHAR(100),
    extracted_text TEXT,
    ai_tags JSONB,
    image_features JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags Table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Tags (Many-to-Many)
CREATE TABLE file_tags (
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    auto_generated BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (file_id, tag_id)
);

-- Shares Table
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE SET NULL,
    share_token VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    permission VARCHAR(50) DEFAULT 'read', -- read, write, delete
    expires_at TIMESTAMP,
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Duplicates Table
CREATE TABLE duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    duplicate_of UUID REFERENCES files(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_hash ON files(hash);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_file_metadata_file_id ON file_metadata(file_id);
CREATE INDEX idx_shares_token ON shares(share_token);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_file_metadata_category ON file_metadata(category);
```

### 4. File Storage Structure

```
/data/
├── files/
│   ├── originals/
│   │   ├── 2024/
│   │   │   ├── 01/
│   │   │   │   ├── <hash>.<ext>
│   │   │   │   └── ...
│   │   │   └── 02/
│   │   └── 2025/
│   ├── thumbnails/
│   │   ├── small/
│   │   ├── medium/
│   │   └── large/
│   └── temp/
│       └── uploads/
├── backups/
│   ├── daily/
│   └── weekly/
└── logs/
    ├── app.log
    ├── error.log
    └── access.log
```

**Storage Strategy:**
- Files stored by hash to enable deduplication
- Organized by year/month for easier management
- Thumbnails generated in multiple sizes
- Temporary upload directory for chunked uploads

## API Design

### RESTful Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

#### Files
```
GET    /api/files                    # List files
GET    /api/files/:id                # Get file details
GET    /api/files/:id/download       # Download file
POST   /api/files/upload             # Upload file(s)
PUT    /api/files/:id                # Update file (rename, move)
DELETE /api/files/:id                # Delete file
POST   /api/files/:id/restore        # Restore from trash
GET    /api/files/:id/thumbnail      # Get thumbnail
POST   /api/files/batch-delete       # Batch operations
```

#### Folders
```
GET    /api/folders                  # List folders
GET    /api/folders/:id              # Get folder details
POST   /api/folders                  # Create folder
PUT    /api/folders/:id              # Update folder
DELETE /api/folders/:id              # Delete folder
GET    /api/folders/:id/contents     # Get folder contents
```

#### Search
```
GET    /api/search?q=query           # Basic search
POST   /api/search/advanced          # Advanced search
GET    /api/search/suggestions       # Search suggestions
POST   /api/search/image             # Reverse image search
```

#### AI Features
```
POST   /api/ai/categorize/:fileId    # Trigger categorization
GET    /api/ai/duplicates            # Find duplicates
POST   /api/ai/duplicates/resolve    # Resolve duplicates
GET    /api/ai/tags/:fileId          # Get AI-generated tags
POST   /api/ai/extract-text/:fileId  # OCR/text extraction
```

#### Sharing
```
POST   /api/shares                   # Create share
GET    /api/shares/:token            # Access shared file
DELETE /api/shares/:id               # Revoke share
GET    /api/shares/my-shares         # List my shares
PUT    /api/shares/:id               # Update permissions
```

#### Analytics
```
GET    /api/analytics/storage        # Storage usage
GET    /api/analytics/activity       # Activity stats
GET    /api/analytics/categories     # Files by category
```

## AI/ML Architecture

### AI Processing Pipeline

```
┌─────────────┐
│ File Upload │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Queue AI Job    │
│ (Bull/Agenda)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────────────┐
│        AI Worker Process            │
│  ┌───────────────────────────────┐  │
│  │  1. File Type Detection       │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  2. Content Extraction        │  │
│  │     - Images: Visual features │  │
│  │     - Docs: Text extraction   │  │
│  │     - Videos: Metadata        │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  3. AI Processing             │  │
│  │     - Image classification    │  │
│  │     - Object detection        │  │
│  │     - OCR                     │  │
│  │     - Text analysis           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  4. Store Results             │  │
│  │     - Categories              │  │
│  │     - Tags                    │  │
│  │     - Extracted text          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────┐
│ Update Database │
│ & Cache         │
└─────────────────┘
```

### AI Models & Services

**Option 1: Local Models (Cost-effective)**
- TensorFlow.js for browser/Node.js
- MobileNet for image classification
- COCO-SSD for object detection
- Tesseract.js for OCR

**Option 2: Cloud APIs (More accurate)**
- OpenAI GPT-4 Vision for image understanding
- Google Cloud Vision API
- AWS Rekognition
- Azure Computer Vision

**Recommended Hybrid Approach:**
- Use local models for basic categorization
- Use cloud APIs for complex queries (budget permitting)
- Cache AI results to minimize API calls

## Security Architecture

### Authentication Flow (Logto)

```
1. User clicks Login
   ↓
2. Redirect to Logto sign-in page
   ↓
3. User authenticates (email, social, etc.)
   ↓
4. Logto redirects back with authorization code
   ↓
5. Backend exchanges code for tokens
   ↓
6. Store tokens securely (httpOnly cookies)
   ↓
7. Client makes requests with session cookie
   ↓
8. Middleware validates token with Logto
```

### Security Measures

1. **Authentication (Logto)**
   - OIDC/OAuth 2.0 compliant
   - Social login support (Google, GitHub, etc.)
   - Multi-factor authentication (MFA)
   - Session management
   - Rate limiting on login attempts

2. **Authorization**
   - Role-based access control (RBAC)
   - Resource-level permissions
   - Middleware for route protection

3. **File Security**
   - Virus scanning on upload (ClamAV)
   - File type validation
   - Size limits
   - Sanitize filenames
   - Optional encryption at rest

4. **Network Security**
   - HTTPS only (SSL/TLS)
   - CORS configuration
   - Helmet.js for security headers
   - Rate limiting (express-rate-limit)

5. **Data Protection**
   - Input validation (Joi)
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CSRF tokens for state-changing operations

## Deployment Architecture

### VPS Setup

```
┌─────────────────────────────────────────────┐
│              VPS (Ubuntu 22.04)             │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │         Nginx (Port 80/443)        │    │
│  │  - Reverse proxy                   │    │
│  │  - SSL termination                 │    │
│  │  - Static file serving             │    │
│  └────────────────────────────────────┘    │
│                    │                        │
│  ┌────────────────────────────────────┐    │
│  │      Node.js App (Port 3000)       │    │
│  │      Managed by PM2                │    │
│  │  - API server                      │    │
│  │  - Worker processes                │    │
│  └────────────────────────────────────┘    │
│                    │                        │
│  ┌────────────────────────────────────┐    │
│  │    PostgreSQL (Port 5432)          │    │
│  │    - Metadata storage              │    │
│  └────────────────────────────────────┘    │
│                    │                        │
│  ┌────────────────────────────────────┐    │
│  │       Redis (Port 6379)            │    │
│  │    - Caching                       │    │
│  │    - Session storage               │    │
│  │    - Job queue                     │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │      File Storage (/data)          │    │
│  │    - User files                    │    │
│  │    - Thumbnails                    │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Monitoring & Logging

- **Application Monitoring**: PM2 monitoring
- **Server Monitoring**: Netdata or Grafana
- **Logs**: Winston + log rotation
- **Alerts**: Email/SMS for critical errors
- **Backups**: Automated daily backups

## Scalability Considerations

### Vertical Scaling (Initial)
- Upgrade VPS resources as needed
- Optimize database queries
- Implement caching

### Horizontal Scaling (Future)
- Load balancer (Nginx)
- Multiple app instances
- Separate database server
- Object storage (S3-compatible)
- CDN for static assets

## Performance Optimization

1. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Read replicas (future)

2. **Caching**
   - Redis for frequently accessed data
   - Browser caching headers
   - CDN for static assets

3. **File Operations**
   - Chunked uploads for large files
   - Streaming downloads
   - Background processing for thumbnails
   - Lazy loading in UI

4. **API**
   - Pagination for list endpoints
   - Compression (gzip)
   - Response caching
   - GraphQL (future alternative)

## Technology Decisions Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | Node.js + Express | JavaScript ecosystem, async I/O |
| Frontend | React | Component-based, large ecosystem |
| Database | PostgreSQL | ACID compliance, JSON support |
| Cache | Redis | Fast, versatile, job queues |
| File Storage | File System | Simple, cost-effective for VPS |
| AI/ML | TensorFlow.js + APIs | Hybrid approach for cost/accuracy |
| Authentication | Logto | Modern auth platform, OIDC/OAuth |
| Logging | Axiom | Cloud-based, real-time analytics |
| Process Manager | PM2 | Zero-downtime, monitoring |
| Web Server | Nginx | Reverse proxy, SSL, static files |
| Upload | Multer | Standard for Express |
| Validation | Joi | Schema validation |
| Testing | Jest + Supertest | Comprehensive testing |

## Next Steps

1. Set up development environment
2. Initialize project structure
3. Implement MVP features (Phase 1)
4. Deploy to VPS
5. Iterate with AI features (Phase 2+)
