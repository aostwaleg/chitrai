FROM node:22-alpine

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build step)
RUN npm install

# Copy source code
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Prune dev dependencies to keep container size small
RUN npm prune --production

EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

CMD ["npm", "start"]
