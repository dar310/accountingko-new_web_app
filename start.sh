#!/bin/sh

set -e

# Function to install cloudflared based on architecture
install_cloudflared() {
  echo "Detecting architecture..."
  ARCH=$(uname -m)
  echo "Architecture detected: $ARCH"

  if [ "$ARCH" = "x86_64" ]; then
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
  else
    echo "Unsupported architecture: $ARCH"
    exit 1
  fi

  echo "Downloading cloudflared from $CF_URL ..."
  wget -q "$CF_URL" -O /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  echo "cloudflared installed."
}

# Check if cloudflared is installed; if not, install it
if ! command -v cloudflared > /dev/null 2>&1; then
  install_cloudflared
else
  echo "cloudflared already installed."
fi

# Start cloudflared tunnel in background and redirect output to a file
cloudflared tunnel --url http://localhost:3000 > /tmp/cloudflared.log 2>&1 &
cat /tmp/cloudflared.log
# Save its PID to a file or variable
CLOUDFLARED_PID=$!

# Wait for the tunnel URL to appear in the log (timeout after 30s)
COUNT=0
TIMEOUT=15

while ! grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log > /tmp/tunnel_url.txt; do
  sleep 1
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $TIMEOUT ]; then
    echo "Timeout waiting for cloudflared tunnel URL"
    exit 1
  fi
done

# Extract the URL
TUNNEL_URL=$(head -n1 /tmp/tunnel_url.txt)

echo "Go to this Link and wait for Next.js to start: $TUNNEL_URL"

# Update .env.local or create it with NEXTAUTH_URL
if [ -f .env.local ]; then
  # If NEXTAUTH_URL exists, replace it, else append it
  if grep -q '^NEXTAUTH_URL=' .env.local; then
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$TUNNEL_URL|" .env.local
  else
    echo "NEXTAUTH_URL=$TUNNEL_URL" >> .env.local
  fi
else
  # Create the file with NEXTAUTH_URL
  echo "NEXTAUTH_URL=$TUNNEL_URL" > .env.local
fi

# Run your prisma commands and start the dev server
pnpm install
npx prisma generate
npx prisma db push
pnpm run dev
