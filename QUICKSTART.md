# Quick Start Guide

## Prerequisites Installation

Run the setup script:
```bash
./setup.sh
```

Or install manually:
```bash
# PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Redis
sudo apt install redis-server
sudo systemctl start redis
```

## Database Setup

```bash
# Access PostgreSQL
sudo -u postgres psql

# Run these commands:
CREATE DATABASE cloud_storage_dev;
CREATE USER cloud_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cloud_storage_dev TO cloud_user;
\q
```

## Update Configuration

Edit `backend/.env` and set your database password:
```env
DB_PASSWORD=your_password
```

## Run the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Wait for:
```
✅ Database connected successfully
✅ Database models synchronized
🚀 Server running on http://localhost:3000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:5173/
```

## Test It!

1. Open http://localhost:5173
2. Click "Sign In"
3. Sign in with Logto
4. See your dashboard!

## Verify Logs

Check Axiom: https://app.axiom.co
- Dataset: `cloud-storage-logs`
- You should see logs from your app

## Need Help?

See `SETUP_AND_RUN.md` for detailed troubleshooting.

---

**That's it! You're ready to go!** 🚀
