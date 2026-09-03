# Stage 1: Build & install production dependencies
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Final lightweight runtime
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]

