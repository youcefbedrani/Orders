# YouCan Order Automation - Docker Deployment

## 🐳 Docker Setup

The application is fully containerized with Docker for easy deployment.

## 🚀 Quick Start

### Build and Run with Docker Compose
```bash
cd youcan-order-automation

# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at **http://localhost:3000**

### Build Docker Image Manually
```bash
# Build the image
docker build -t youcan-order-automation .

# Run the container
docker run -p 3000:3000 -v sqlite-data:/app/prisma youcan-order-automation
```

## 📦 What's Included

- **Next.js Application**: Fully built and optimized
- **SQLite Database**: Persisted in Docker volume
- **All Dependencies**: Bundled in the container
- **Health Checks**: Automatic container health monitoring

## 🗄️ Database Persistence

The SQLite database is stored in a Docker volume named `sqlite-data`. This ensures your data persists even if you recreate the container.

### View Database Volume
```bash
docker volume ls
docker volume inspect youcan-order-automation_sqlite-data
```

### Backup Database
```bash
docker cp youcan-order-automation-app-1:/app/prisma/dev.db ./backup.db
```

### Restore Database
```bash
docker cp ./backup.db youcan-order-automation-app-1:/app/prisma/dev.db
```

## 🔧 Docker Commands

### View Running Containers
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f app
```

### Restart Container
```bash
docker-compose restart
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Remove Everything (including volumes)
```bash
docker-compose down -v
```

## 📊 Container Details

- **Base Image**: node:18-alpine
- **Port**: 3000
- **Database**: SQLite (persisted in volume)
- **Build Type**: Multi-stage (optimized for production)
- **Size**: ~200MB (optimized)

## 🌐 Production Deployment

### Deploy to Any Server
```bash
# On your server
git clone <your-repo>
cd youcan-order-automation
docker-compose up -d
```

### Environment Variables
Create a `.env` file:
```env
NODE_ENV=production
DATABASE_URL=file:/app/prisma/dev.db
```

## ✅ Health Checks

The container includes automatic health checks:
- Checks every 30 seconds
- Considers unhealthy after 3 failed attempts
- Automatically restarts if unhealthy

## 🎯 Usage

1. **Start Container**: `docker-compose up -d`
2. **Open Browser**: http://localhost:3000
3. **Use the App**:
   - Enter landing page URL
   - Upload Excel/CSV file
   - Map columns
   - Start processing orders

## 🔒 Security Notes

- Container runs as non-root user (nextjs:nodejs)
- Minimal attack surface (alpine base)
- No unnecessary packages
- Health monitoring enabled

---

**Ready to deploy anywhere with Docker!** 🐳
