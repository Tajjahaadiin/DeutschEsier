# Multi-stage build for DeutschEasier (Compatible with Hugging Face Spaces & Render)
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies untuk better-sqlite3 native C++ addon
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
# Hugging Face Spaces mewajibkan port 7860
ENV PORT=7860

# Buat user non-root UID 1000 sesuai regulasi Hugging Face Spaces
RUN adduser -D -u 1000 user

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
# Salin template database SQLite awal jika ada
COPY --from=builder /app/sqlite.db ./sqlite.db

# Pastikan folder cache audio ada dan seluruh folder /app dimiliki oleh user UID 1000
RUN mkdir -p /app/public/audio/cache && chown -R user:user /app

USER user
EXPOSE 7860

CMD ["node", "dist/server.js"]
