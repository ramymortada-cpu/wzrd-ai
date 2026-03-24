FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN echo "Build timestamp: $(date)" && pnpm run build

CMD ["sh", "-c", "npx drizzle-kit push --force && NODE_ENV=production node dist/index.js"]
