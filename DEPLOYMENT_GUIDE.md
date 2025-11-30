# Deployment Guide - K-Cloud Storage

## Overview
This guide covers deploying the K-Cloud Storage application to a VPS using PM2, Nginx, and PostgreSQL.

## Prerequisites

- Ubuntu 20.04+ VPS
- Domain name (optional but recommended)
- SSH access to VPS
- Sudo privileges

---

## 1. Server Setup

### 1.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Node.js
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x
```

### 1.3 Install PostgreSQL
```bash
# Install PostgreSQL 14+
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### 1.4 Install Nginx
```bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 Install PM2
```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## 2. Database Setup

### 2.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE cloud_storage_prod;
CREATE USER cloud_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cloud_storage_prod TO cloud_user;
\q
```

### 2.2 Configure PostgreSQL for Remote Access (Optional)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Change listen_addresses:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add:
local   cloud_storage_prod   cloud_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 3. Application Deployment

### 3.1 Clone Repository
```bash
# Create app directory
sudo mkdir -p /var/www/k-cloud-storage
sudo chown $USER:$USER /var/www/k-cloud-storage

# Clone repository
cd /var/www/k-cloud-storage
git clone <your-repo-url> .
```

### 3.2 Backend Setup
```bash
cd backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Production .env:**
```env
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_storage_prod
DB_USER=cloud_user
DB_PASSWORD=your_secure_password

# Logto
LOGTO_ENDPOINT=https://your-tenant.logto.app
LOGTO_APP_ID=your_app_id
LOGTO_APP_SECRET=your_app_secret

# Axiom
AXIOM_TOKEN=your_axiom_token
AXIOM_DATASET=cloud-storage-logs
AXIOM_ORG_ID=your_org_id

# Storage
STORAGE_PATH=/var/www/k-cloud-storage/data/files
MAX_FILE_SIZE=10737418240

# CORS
FRONTEND_URL=https://yourdomain.com
```

```bash
# Build TypeScript
npm run build

# Sync database
npm run db:sync

# Create storage directories
mkdir -p /var/www/k-cloud-storage/data/files/{uploads,thumbnails,temp}
```

### 3.3 Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.production
nano .env.production
```

**Production .env.production:**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_LOGTO_ENDPOINT=https://your-tenant.logto.app
VITE_LOGTO_APP_ID=your_app_id
```

```bash
# Build frontend
npm run build

# Build output will be in dist/
```

---

## 4. PM2 Configuration

### 4.1 Create PM2 Ecosystem File
```bash
cd /var/www/k-cloud-storage/backend
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'k-cloud-storage-api',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/k-cloud-storage/logs/api-error.log',
    out_file: '/var/www/k-cloud-storage/logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

### 4.2 Start Application with PM2
```bash
# Create logs directory
mkdir -p /var/www/k-cloud-storage/logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions from the output

# Check status
pm2 status
pm2 logs k-cloud-storage-api
```

---

## 5. Nginx Configuration

### 5.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/k-cloud-storage
```

**Nginx Configuration:**
```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # File upload size
    client_max_body_size 10G;
}

# Frontend Server
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/k-cloud-storage/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.2 Enable Site
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/k-cloud-storage /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 6. SSL Certificate (Let's Encrypt)

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain Certificate
```bash
# For API domain
sudo certbot --nginx -d api.yourdomain.com

# For frontend domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
```

### 6.3 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot will automatically set up a cron job for renewal
```

---

## 7. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 8. Monitoring and Maintenance

### 8.1 PM2 Monitoring
```bash
# View logs
pm2 logs k-cloud-storage-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart k-cloud-storage-api

# Stop application
pm2 stop k-cloud-storage-api

# Delete from PM2
pm2 delete k-cloud-storage-api
```

### 8.2 Database Backup
```bash
# Create backup script
nano /var/www/k-cloud-storage/scripts/backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/var/www/k-cloud-storage/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="cloud_storage_prod_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U cloud_user -h localhost cloud_storage_prod > "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

```bash
# Make executable
chmod +x /var/www/k-cloud-storage/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /var/www/k-cloud-storage/scripts/backup-db.sh
```

### 8.3 Log Rotation
```bash
# PM2 handles log rotation automatically
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 9. Deployment Checklist

- [ ] VPS provisioned and accessible
- [ ] Node.js, PostgreSQL, Nginx installed
- [ ] Database created and configured
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database synced
- [ ] PM2 configured and running
- [ ] Nginx configured and running
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] DNS records configured
- [ ] Application tested

---

## 10. Updating the Application

```bash
# Navigate to app directory
cd /var/www/k-cloud-storage

# Pull latest code
git pull origin main

# Backend update
cd backend
npm install --production
npm run build
pm2 restart k-cloud-storage-api

# Frontend update
cd ../frontend
npm install
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

---

## 11. Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs k-cloud-storage-api --lines 100

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check PostgreSQL
sudo systemctl status postgresql
```

### Database connection issues
```bash
# Test connection
psql -U cloud_user -h localhost -d cloud_storage_prod

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High memory usage
```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart k-cloud-storage-api

# Check system resources
htop
```

---

## 12. Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords**
   - Database passwords
   - SSH keys instead of passwords

3. **Configure fail2ban**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular backups**
   - Database backups (automated)
   - File storage backups
   - Configuration backups

5. **Monitor logs**
   - Application logs (PM2)
   - Nginx access/error logs
   - PostgreSQL logs
   - Axiom dashboard

6. **Rate limiting**
   - Already configured in application
   - Additional Nginx rate limiting if needed

---

## Support

For deployment issues, check:
- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`
- Axiom dashboard for application logs

---

**Deployment Complete! 🚀**

Your K-Cloud Storage application should now be running at:
- Frontend: `https://yourdomain.com`
- API: `https://api.yourdomain.com`
- API Docs: `https://api.yourdomain.com/api-docs`
