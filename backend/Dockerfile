# Use Node.js 22.15.1 (as specified in workshop requirements)
FROM node:22.15.1-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sentinelai -u 1001

# Create necessary directories
RUN mkdir -p /app/storage /app/logs
RUN chown -R sentinelai:nodejs /app

# Switch to non-root user
USER sentinelai

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
