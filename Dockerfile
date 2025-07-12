# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN apk add --no-cache \
    curl \
    wget \
    grep \
    sed

# Copy only package files to install dependencies first (for caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the app
COPY . .

RUN npm install auth

RUN npx auth secret

RUN chmod +x ./start.sh

# Expose port
EXPOSE 3000

CMD ["./start.sh"]

