# Warm Lead - Installation Guide

## 📋 System Requirements

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- 2GB RAM minimum
- 1GB free disk space

## 🚀 Quick Installation with Docker

### Step 1: Download the Application

Extract the application files to your desired location:
```bash
cd /path/to/warm-lead
```

### Step 2: Start the Application

```bash
docker-compose up -d
```

The application will:
- Build the Docker image
- Start the container
- Initialize the database
- Be ready in 2-3 minutes

### Step 3: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

**Default Login Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

> ⚠️ **Important**: Change the default password after first login for security.

## 🔧 Docker Commands

### View Application Status
```bash
docker-compose ps
```

### View Application Logs
```bash
docker-compose logs -f
```

### Stop the Application
```bash
docker-compose down
```

### Restart the Application
```bash
docker-compose restart
```

### Update After Code Changes
```bash
docker-compose up -d --build
```

## 💾 Database Management

### Backup Database
```bash
docker cp warm-lead-app:/app/prisma/dev.db ./backup-$(date +%Y%m%d).db
```

### Restore Database
```bash
docker cp ./backup.db warm-lead-app:/app/prisma/dev.db
docker-compose restart
```

### View Database Location
```bash
docker volume inspect warm-lead_sqlite-data
```

## 🌐 Production Deployment

### Deploy on VPS/Cloud Server

1. **Install Docker on your server**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Upload application files**
```bash
scp -r warm-lead/ user@your-server:/opt/
```

3. **Start on server**
```bash
ssh user@your-server
cd /opt/warm-lead
docker-compose up -d
```

4. **Configure firewall** (if needed)
```bash
sudo ufw allow 3000/tcp
```

### Using Custom Port

Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

Then restart:
```bash
docker-compose up -d
```

### Using with Nginx Reverse Proxy

Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Recommendations

1. **Change Default Credentials**
   - Login with default credentials
   - Navigate to settings
   - Update email and password

2. **Use HTTPS in Production**
   - Install SSL certificate (Let's Encrypt recommended)
   - Configure reverse proxy (Nginx/Apache)

3. **Firewall Configuration**
   - Only expose necessary ports
   - Use UFW or iptables

4. **Regular Backups**
   - Schedule daily database backups
   - Store backups off-server

## 📊 Monitoring

### Check Container Health
```bash
docker ps
docker stats warm-lead-app
```

### View Resource Usage
```bash
docker-compose top
```

### Check Disk Usage
```bash
docker system df
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

### Container Won't Start
```bash
# View detailed logs
docker-compose logs

# Remove and rebuild
docker-compose down
docker-compose up -d --build
```

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Permission Issues
```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

## 📞 Support

For technical issues:
1. Check application logs: `docker-compose logs -f`
2. Verify Docker is running: `docker ps`
3. Check system resources: `docker stats`

## 🔄 Updates

To update the application:
```bash
# Stop current version
docker-compose down

# Backup database
docker cp warm-lead-app:/app/prisma/dev.db ./backup.db

# Update files (replace with new version)

# Start new version
docker-compose up -d --build

# Restore database if needed
docker cp ./backup.db warm-lead-app:/app/prisma/dev.db
docker-compose restart
```

---

**Application is now ready to use!** 🎉
