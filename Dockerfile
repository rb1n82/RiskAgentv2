# 1) Build-Stage
FROM node:18-alpine AS builder
WORKDIR /app

# -- Backend bauen
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
RUN cd server && npm run build

# -- Frontend bauen
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2) Production-Image
FROM node:18-alpine
WORKDIR /app

# Nur das Nötigste kopieren
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/frontend/build ./frontend/build

# Installiere Produktions-Dependencies für das Run-Image
RUN cd server && npm install --production

ENV NODE_ENV=production
EXPOSE 3001

# Starte deinen Express-Server
CMD ["node", "server/dist/index.js"]
