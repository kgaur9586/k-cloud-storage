# Technology Stack & Setup Guide

## Technology Stack Overview

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ LTS | JavaScript runtime |
| Framework | Express.js | 4.x | REST API framework |
| Database | PostgreSQL | 14+ | Metadata storage |
| ORM | Prisma / Sequelize | Latest | Database management |
| Cache | Redis | 7+ | Caching & job queue |
| File Upload | Multer | Latest | File upload handling |
| Authentication | Logto | Latest | Auth & user management |
| Validation | Joi | Latest | Input validation |
| Process Manager | PM2 | Latest | Production process management |
| Job Queue | Bull | Latest | Background jobs |
| Logger | Axiom | Latest | Cloud-based logging & analytics |

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 18+ | UI framework |
| Build Tool | Vite | Latest | Fast build tool |
| State Management | Redux Toolkit | Latest | Global state |
| Routing | React Router | 6+ | Client-side routing |
| HTTP Client | Axios | Latest | API requests |
| UI Library | Material-UI / Ant Design | Latest | Component library |
| File Upload | React Dropzone | Latest | Drag & drop uploads |
| Forms | React Hook Form | Latest | Form management |
| Notifications | React Toastify | Latest | Toast notifications |

### AI/ML Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Local ML | TensorFlow.js | Browser/Node ML |
| Image Classification | MobileNet | Image categorization |
| Object Detection | COCO-SSD | Object recognition |
| OCR | Tesseract.js | Text extraction |
| Cloud AI (Optional) | OpenAI API / Google Vision | Advanced AI features |

### DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web Server | Nginx | Reverse proxy, SSL |
| OS | Ubuntu 22.04 LTS | VPS operating system |
| SSL | Let's Encrypt | Free SSL certificates |
| Monitoring | PM2 Monitor / Netdata | System monitoring |
| Backup | Custom scripts + cron | Automated backups |

---

## Development Environment Setup

### Prerequisites

```bash
# Check versions
node --version  # Should be 18+
npm --version   # Should be 9+
git --version
```

### Backend Setup

```bash
# Create project directory
mkdir personal-cloud-storage
cd personal-cloud-storage

# Initialize backend
mkdir backend
cd backend
npm init -y

# Install core dependencies
npm install express cors dotenv
npm install @logto/node
npm install multer
npm install joi
npm install @axiomhq/js
npm install bull redis

# Install database (choose one)
npm install pg sequelize  # PostgreSQL with Sequelize
# OR
npm install @prisma/client && npx prisma init  # Prisma

# Install dev dependencies
npm install -D nodemon eslint prettier
npm install -D jest supertest

# Create folder structure
mkdir -p src/{config,middleware,routes,controllers,services,models,utils,workers}
mkdir -p tests
```

### Frontend Setup

```bash
# From project root
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install
npm install react-router-dom
npm install @reduxjs/toolkit react-redux
npm install axios
npm install react-dropzone
npm install react-toastify
npm install @mui/material @emotion/react @emotion/styled
# OR
npm install antd

# Install dev dependencies
npm install -D eslint prettier
npm install -D @testing-library/react @testing-library/jest-dom
```

---

## Project Structure

```
personal-cloud-storage/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   └── storage.js
│   │   ├── middleware/
│   │   │   ├── logto.js
│   │   │   ├── upload.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── files.routes.js
│   │   │   ├── folders.routes.js
│   │   │   └── search.routes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── fileController.js
│   │   │   └── searchController.js
│   │   ├── services/
│   │   │   ├── fileService.js
│   │   │   ├── aiService.js
│   │   │   └── searchService.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── File.js
│   │   │   └── Folder.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   └── workers/
│   │       └── aiWorker.js
│   ├── tests/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── files/
│   │   │   ├── folders/
│   │   │   └── common/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── store/
│   │   │   └── store.js
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── PROJECT_REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── MVP_ROADMAP.md
│   └── API_DOCUMENTATION.md
└── README.md
```

---

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_storage
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logto Authentication
LOGTO_ENDPOINT=https://your-logto-instance.logto.app
LOGTO_APP_ID=your_app_id
LOGTO_APP_SECRET=your_app_secret
LOGTO_REDIRECT_URI=http://localhost:3000/callback
LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost:3000

# File Storage
STORAGE_PATH=/data/files
MAX_FILE_SIZE=10737418240
ALLOWED_FILE_TYPES=*

# Axiom Logging
AXIOM_TOKEN=your_axiom_token
AXIOM_DATASET=cloud-storage-logs

# AI Services (Optional)
OPENAI_API_KEY=
GOOGLE_VISION_API_KEY=
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_MAX_FILE_SIZE=10737418240
```

---

## VPS Setup Guide

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

### 2. PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE cloud_storage;
CREATE USER cloud_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cloud_storage TO cloud_user;
\q
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/cloud-storage
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/cloud-storage/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # File upload settings
        client_max_body_size 10G;
        proxy_request_buffering off;
    }
}
```

### 4. SSL Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already set up by certbot)
```

### 5. Deploy Application

```bash
# Clone repository
cd /var/www
git clone your-repo-url cloud-storage
cd cloud-storage

# Backend setup
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values

# Run migrations
npx sequelize-cli db:migrate
# OR
npx prisma migrate deploy

# Start with PM2
pm2 start server.js --name cloud-storage-api
pm2 save
pm2 startup

# Frontend setup
cd ../frontend
npm install
npm run build

# Copy build to nginx directory
sudo cp -r dist/* /var/www/cloud-storage/frontend/dist/
```

---

## Development Workflow

### Running Locally

```bash
# Terminal 1 - Backend
cd backend
npm run dev  # Uses nodemon

# Terminal 2 - Frontend
cd frontend
npm run dev  # Vite dev server

# Terminal 3 - Redis (if not running as service)
redis-server
```

### Testing

```bash
# Backend tests
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

---

## Recommended VS Code Extensions

- ESLint
- Prettier
- GitLens
- Thunder Client (API testing)
- PostgreSQL (database management)
- React Developer Tools

---

## Next Steps

1. ✅ Review this technology stack
2. ✅ Set up development environment
3. ✅ Initialize Git repository
4. ✅ Create project structure
5. ✅ Start with Week 1 of MVP Roadmap
