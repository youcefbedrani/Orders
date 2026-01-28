# VPS Deployment Guide

## Quick Start on VPS

### Step 1: Upload Files to VPS

```bash
# From your local machine, upload the project to VPS
scp -r /home/badran/Downloads/Freelance_2025/telegram\ bot/youcan-order-automation/ user@your-vps-ip:/opt/warm-lead/

# Or use rsync (recommended)
rsync -avz --progress /home/badran/Downloads/Freelance_2025/telegram\ bot/youcan-order-automation/ user@your-vps-ip:/opt/warm-lead/
```

### Step 2: SSH into VPS

```bash
ssh user@your-vps-ip
cd /opt/warm-lead
```

### Step 3: Install Docker (if not installed)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Start the Application

```bash
# Build and start
sudo docker-compose up -d

# View logs
sudo docker-compose logs -f
```

### Step 5: Access the Application

The app will be running on port 3000. Access it at:
```
http://your-vps-ip:3000
```

### Step 6: Configure Firewall

```bash
# Allow port 3000
sudo ufw allow 3000/tcp
sudo ufw status
```

## Alternative: Run Without Docker

If you prefer to run without Docker:

### Step 1: Install Node.js

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 2: Install Dependencies

```bash
cd /opt/warm-lead
npm install
```

### Step 3: Build and Start

```bash
# Build for production
npm run build

# Start the application
npm start
```

### Step 4: Run with PM2 (Keep Running)

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start npm --name "warm-lead" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you

# View logs
pm2 logs warm-lead

# View status
pm2 status
```

## Using Custom Port

### With Docker

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

Then restart:
```bash
sudo docker-compose down
sudo docker-compose up -d
```

### Without Docker

Set environment variable:
```bash
PORT=8080 npm start
```

Or with PM2:
```bash
pm2 start npm --name "warm-lead" -- start -- --port 8080
```

## Setup with Nginx Reverse Proxy

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Step 2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/warm-lead
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your VPS IP

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
    }
}
```

### Step 3: Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/warm-lead /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now access at: `http://your-domain.com` or `http://your-vps-ip`

## Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

Now access at: `https://your-domain.com`

## Useful Commands

### Docker Commands

```bash
# View running containers
sudo docker-compose ps

# View logs
sudo docker-compose logs -f

# Restart
sudo docker-compose restart

# Stop
sudo docker-compose down

# Rebuild after changes
sudo docker-compose up -d --build

# Remove everything
sudo docker-compose down -v
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs warm-lead

# Restart
pm2 restart warm-lead

# Stop
pm2 stop warm-lead

# Delete
pm2 delete warm-lead

# Monitor
pm2 monit
```

### Database Backup

```bash
# With Docker
sudo docker cp warm-lead-app:/app/prisma/dev.db ./backup-$(date +%Y%m%d).db

# Without Docker
cp /opt/warm-lead/prisma/dev.db ./backup-$(date +%Y%m%d).db
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Docker Issues

```bash
# Restart Docker
sudo systemctl restart docker

# View Docker logs
sudo journalctl -u docker

# Clean up Docker
sudo docker system prune -a
```

### Application Won't Start

```bash
# Check logs
sudo docker-compose logs

# Or with PM2
pm2 logs warm-lead

# Check if port is accessible
curl http://localhost:3000
```

### Firewall Blocking Access

```bash
# Check firewall status
sudo ufw status

# Allow port
sudo ufw allow 3000/tcp

# Disable firewall temporarily (for testing)
sudo ufw disable
```

## Security Checklist

- [ ] Change default login credentials
- [ ] Configure firewall (UFW)
- [ ] Setup SSL certificate
- [ ] Use Nginx reverse proxy
- [ ] Enable automatic updates
- [ ] Setup database backups
- [ ] Restrict SSH access
- [ ] Use strong passwords

## Performance Optimization

### Increase Docker Memory (if needed)

Edit `/etc/docker/daemon.json`:
```json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### Monitor Resources

```bash
# CPU and Memory usage
htop

# Docker stats
sudo docker stats

# Disk usage
df -h
```

---

**Your application should now be running on your VPS!** 🚀

Access it at: `http://your-vps-ip:3000`
