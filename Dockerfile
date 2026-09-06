FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies untuk better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
RUN mkdir -p public/audio/cache

EXPOSE 3001

CMD ["node", "dist/server.js"]
