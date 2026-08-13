FROM node:22-alpine AS build

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Compile TypeScript and bundle Vite
RUN npm run build

# --- Production Runner Stage ---
FROM node:22-alpine

WORKDIR /app

# Install simple static server
RUN npm install -g serve

# Copy compiled assets from build stage
COPY --from=build /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
