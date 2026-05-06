# --- Builder Stage ---
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# --- Runtime Stage ---
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Run as non-root user
RUN chown -R node:node /usr/src/app
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built files from the builder stage
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Expose application port
EXPOSE 3001

# Healthcheck to verify the app is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
