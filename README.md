# Personal Cloud Storage with AI Optimizations

A self-hosted personal cloud storage solution with AI-powered features for intelligent file management.

## 🎯 Project Overview

This is a feature-rich personal cloud storage system that runs on your private VPS, giving you complete control over your data while leveraging AI for smart categorization, duplicate detection, and intelligent search.

## ✨ Key Features

### Core Features (MVP)
- 🔐 User authentication and authorization
- 📤 File upload/download with progress tracking
- 📁 Folder management and organization
- 🔍 Basic search functionality
- 🖼️ File preview and thumbnails
- 🗑️ Trash/recycle bin

### AI-Powered Features
- 🤖 **Auto-Categorization**: Automatically categorize images and documents
- 🔎 **Smart Search**: Natural language queries and semantic search
- 🔄 **Duplicate Detection**: Find exact and similar duplicates
- 🏷️ **Auto-Tagging**: AI-generated tags for easy organization
- 📝 **OCR**: Extract text from images and PDFs

### Advanced Features
- 🔗 **Custom Sharing**: Share files with permissions, expiration, and passwords
- 📊 **Storage Analytics**: Visualize storage usage
- 💾 **Automated Backups**: Scheduled backups and version control
- 🗜️ **Storage Optimization**: Compression and deduplication
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React + Vite
- **Database**: PostgreSQL (metadata)
- **Storage**: File System
- **Cache**: Redis
- **AI/ML**: TensorFlow.js + Cloud APIs
- **Deployment**: VPS + Nginx + PM2

## 📚 Documentation

- [Project Requirements](./PROJECT_REQUIREMENTS.md) - Detailed requirements and user stories
- [System Architecture](./ARCHITECTURE.md) - Architecture design and database schema
- [MVP Roadmap](./MVP_ROADMAP.md) - 12-week development plan
- [Technology Stack](./TECH_STACK.md) - Setup guide and tech details

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 7+
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd personal-cloud-storage

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate
npm run dev

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` for the frontend and `http://localhost:3000` for the API.

## 📖 Development Approach

This project follows an **MVP (Minimum Viable Product)** development methodology:

1. **Feature-by-Feature**: Build one feature at a time
2. **Test Thoroughly**: Comprehensive testing after each feature
3. **Document Everything**: Maintain up-to-date documentation
4. **Deploy Incrementally**: Regular deployments to catch issues early

### Development Phases

- **Phase 1 (Weeks 1-4)**: Core features and MVP
- **Phase 2 (Weeks 5-8)**: AI-powered features
- **Phase 3 (Weeks 9-10)**: Sharing and collaboration
- **Phase 4 (Weeks 11-12)**: Optimization and polish

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

See [TECH_STACK.md](./TECH_STACK.md) for detailed VPS deployment instructions.

Quick deployment:

```bash
# Build frontend
cd frontend
npm run build

# Deploy with PM2
cd backend
pm2 start server.js --name cloud-storage
pm2 save
```

## 📊 Project Status

- [x] Planning and architecture design
- [ ] Phase 1: MVP development
- [ ] Phase 2: AI features
- [ ] Phase 3: Sharing features
- [ ] Phase 4: Optimization
- [ ] Production deployment

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📝 License

MIT License - Feel free to use this for your own personal cloud storage needs.

## 🙏 Acknowledgments

Built with modern web technologies and AI/ML capabilities to create a powerful self-hosted storage solution.

---

**Note**: This is a self-hosted solution designed for personal use on a private VPS. Always ensure proper security measures are in place when deploying to production.
