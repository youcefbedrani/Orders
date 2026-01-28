# 🚀 Quick VPS Deployment

## Fastest Way to Deploy

### Step 1: Upload to VPS

```bash
# From your local machine
scp -r youcan-order-automation/ user@your-vps-ip:/opt/warm-lead/
```

### Step 2: Run Deployment Script

```bash
# SSH into VPS
ssh user@your-vps-ip

# Go to directory
cd /opt/warm-lead

# Run deployment script
./deploy-vps.sh
```

The script will:
- ✅ Install Docker & Docker Compose (if needed)
- ✅ Build and start the application
- ✅ Configure firewall
- ✅ Show you the access URL

### Step 3: Access Application

```
http://your-vps-ip:3000
```

**Login:**
- Email: `admin@example.com`
- Password: `admin123`

---

## Manual Deployment

### Option 1: Docker (Recommended)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start application
sudo docker-compose up -d

# View logs
sudo docker-compose logs -f
```

### Option 2: PM2 (Node.js)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Build
npm run build

# Install PM2
sudo npm install -g pm2

# Start
pm2 start npm --name "warm-lead" -- start
pm2 save
pm2 startup
```

---

## Firewall Configuration

```bash
# Allow port 3000
sudo ufw allow 3000/tcp
sudo ufw status
```

---

## Setup Domain with Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/warm-lead
```

Add:
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

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/warm-lead /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

---

## Useful Commands

### Docker
```bash
sudo docker-compose ps          # Status
sudo docker-compose logs -f     # Logs
sudo docker-compose restart     # Restart
sudo docker-compose down        # Stop
```

### PM2
```bash
pm2 status                      # Status
pm2 logs warm-lead             # Logs
pm2 restart warm-lead          # Restart
pm2 stop warm-lead             # Stop
```

---

## Troubleshooting

**Port already in use:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Can't access from browser:**
```bash
# Check firewall
sudo ufw status
sudo ufw allow 3000/tcp

# Check if app is running
curl http://localhost:3000
```

**Docker issues:**
```bash
sudo systemctl restart docker
sudo docker-compose down
sudo docker-compose up -d --build
```

---

## Full Documentation

- **VPS_DEPLOYMENT.md** - Complete deployment guide
- **INSTALLATION.md** - Installation instructions
- **USER_GUIDE.md** - How to use the application

---

**Need help? Check VPS_DEPLOYMENT.md for detailed instructions.**
