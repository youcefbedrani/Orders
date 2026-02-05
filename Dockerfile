FROM node:18

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files and prisma
COPY package*.json ./
COPY prisma ./prisma/

# Copy node_modules from local (faster in slow network environments)
# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Build the application
RUN npm run build
RUN ls -la .next
RUN ls -la .next/standalone || echo "Standalone folder missing!"

# Manual copy of static assets for standalone mode
RUN mkdir -p .next/standalone/public && cp -r public/* .next/standalone/public/ || true
RUN mkdir -p .next/standalone/.next/static && cp -r .next/static/* .next/standalone/.next/static/ || true
RUN cp -r prisma .next/standalone/prisma

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Run migrations and start the application
CMD npx prisma migrate deploy && npm start
