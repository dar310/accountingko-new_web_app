# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package files to install dependencies first (for caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 3000

CMD ["pnpm", "run", "dev"]

