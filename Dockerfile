# Multi-stage Docker build for ASR-GoT
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Backend runtime
FROM node:18-alpine AS backend

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY server/ ./server/
COPY prisma/ ./prisma/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./public

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S asr-got -u 1001

# Change ownership
RUN chown -R asr-got:nodejs /app
USER asr-got

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["npm", "run", "server"]