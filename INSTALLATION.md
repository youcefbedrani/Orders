# Warm Lead - Installation Guide

This guide covers how to install the application on a Linux VPS (Ubuntu/Debian) for production.

---

## 🚀 Direct VPS Installation (Recommended)

This method ensures the best performance on smaller VPS instances by using Next.js Standalone mode and PM2.

### 1. System Requirements
- **Node.js**: v18 or higher
- **RAM**: 1GB minimum (2GB recommended)
- **Database**: SQLite (built-in)

### 2. Installation Steps

```bash
# 1. Download/Clone the application
cd /root/Orders

# 2. Install dependencies
npm install

# 3. Synchronize Database (Crucial for Admin & Auth)
npx prisma db push

# 4. Build for Production
npm run build

# 5. Start with PM2
pm2 start npm --name "warm-lead" -- start
```

### 3. Updating the Application
Whenever you pull new changes from Git:

```bash
git pull
npm install
npx prisma db push
npm run build
pm2 restart warm-lead
```

---

## 🐳 Docker Installation (Alternative)

If you prefer using Docker:

### 1. Start the Application
```bash
docker-compose up -d --build
```

### 2. Sync Database inside Docker
```bash
docker exec -it warm-lead-app npx prisma db push
```

---

## 🛡️ Firewall Configuration (UFW)

If you cannot access the app on port 3000, open the port:

```bash
sudo ufw allow 3000/tcp
```

---

## 🗝️ Default Admin Credentials

After installation, login with:
- **URL**: `http://your-server-ip:3000/login`
- **Email**: `admin@admin.com`
- **Password**: `admin`

*Note: The admin account is automatically created on your first successful login attempt.*

---

## 💾 Database Management

The database is a single file located at `prisma/dev.db`.

### Local Backup:
```bash
cp prisma/dev.db ./backup-$(date +%Y%m%d).db
```

### Restore:
```bash
cp your-backup.db prisma/dev.db
pm2 restart warm-lead
```

---
*© 2026 Hashtag Automation - Production Ready 1.1*
