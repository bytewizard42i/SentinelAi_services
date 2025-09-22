FROM node:22.15.1-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create storage directories
RUN mkdir -p storage/logs storage/seeds storage/wallets storage/transactions

# Build the application (optional)
RUN npm run build 2>/dev/null || echo "No build script found"

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
