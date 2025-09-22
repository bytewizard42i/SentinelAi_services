FROM node:22.15.1-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install Yarn 4.1.0
RUN corepack enable && corepack prepare yarn@4.1.0 --activate

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Create storage directories
RUN mkdir -p storage/logs storage/seeds storage/wallets storage/transactions

# Build the application
RUN yarn build || true

# Expose port
EXPOSE 3000

# Start the server
CMD ["yarn", "start"]
