FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN echo "Build timestamp: $(date)" && pnpm run build

CMD ["sh", "-c", "set -e; echo '[STARTUP] Starting drizzle-kit push...'; npx drizzle-kit push --force; echo '[STARTUP] Drizzle push complete, starting Node.js...'; NODE_ENV=production node dist/index.js 2>&1 || (echo '[ERROR] Node.js crashed with exit code $?'; exit 1)"]
