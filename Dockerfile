# Use Debian-based Node instead of Alpine to match local system
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies in container (with proper architecture)
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application  
CMD ["npm", "start"]
