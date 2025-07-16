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

#echo "Go to this Link and wait for Next.js to start: $TUNNEL_URL"
## Update .env.local or create it with NEXTAUTH_URL
#if [ -f .env.local ]; then
#  # If NEXTAUTH_URL exists, replace it, else append it
#  if grep -q '^NEXTAUTH_URL=' .env.local; then
#    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$TUNNEL_URL|" .env.local
#  else
#    echo "NEXTAUTH_URL=$TUNNEL_URL" >> .env.local
#  fi
#else
#  # Create the file with NEXTAUTH_URL
#  echo "NEXTAUTH_URL=$TUNNEL_URL" > .env.local
#fi

GITHUB_TOKEN=$(cat .githubToken)
# Upload the URL to GitHub Gist
if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: The file \".githubToken\" does not exist please create one with the token inside."
  kill "$CLOUDFLARED_PID"
  exit 1
fi

# Prepare Gist payload
GIST_PAYLOAD=$(cat <<EOF
{
  "description": "Cloudflare Tunnel URL",
  "public": true,
  "files": {
    "tunnel_url.txt": {
      "content": "$TUNNEL_URL"
    }
  }
}
EOF
)

gist_exists() {
  local id="$1"
  local code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/gists/$id")
  [ "$code" = "200" ]
}

create_new_gist() {
  RESPONSE=$(curl -s -X POST https://api.github.com/gists \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$GIST_PAYLOAD")

  # Fixed: Include the closing quote in the pattern and use field 4
  GIST_ID=$(echo "$RESPONSE" | grep -o '"id": *"[^"]*"' | head -n1 | cut -d'"' -f4)
  
  # Alternative methods (more reliable):
  # GIST_ID=$(echo "$RESPONSE" | sed -n 's/.*"id": *"\([^"]*\)".*/\1/p' | head -n1)
  # GIST_ID=$(echo "$RESPONSE" | awk -F'"' '/"id":/ {print $4; exit}')

  if [ -z "$GIST_ID" ]; then
    echo "Failed to create Gist"
    echo "Response: $RESPONSE"  # Debug output
    kill "$CLOUDFLARED_PID"
    exit 1
  fi

  echo "$GIST_ID" > .gist_id
  echo "Saved Gist ID: $GIST_ID"
}

# Create or update Gist
if [ -f ".gist_id" ]; then
  GIST_ID=$(cat .gist_id)
  echo "Checking if Gist $GIST_ID exists..."
  if gist_exists "$GIST_ID"; then
    echo "Updating existing Gist ID: $GIST_ID"
    curl -s -X PATCH "https://api.github.com/gists/$GIST_ID" \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$GIST_PAYLOAD" > /dev/null
  else
    echo "Gist $GIST_ID not found, creating new Gist..."
    create_new_gist
  fi
else
  echo "Creating new Gist..."
  create_new_gist
fi

# Get GitHub username (also fixed the same issue)
if [ -f ".gist_user" ]; then
  USERNAME=$(cat .gist_user)
else
  USER_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
  USERNAME=$(echo "$USER_RESPONSE" | grep -o '"login": *"[^"]*"' | cut -d'"' -f4)
  if [ -z "$USERNAME" ]; then
    echo "Failed to fetch GitHub username"
    echo "Response: $USER_RESPONSE"  # Debug output
    kill "$CLOUDFLARED_PID"
    exit 1
  fi
  echo "$USERNAME" > .gist_user
fi

# Construct raw Gist URL
RAW_URL="https://gist.githubusercontent.com/$USERNAME/$GIST_ID/raw/tunnel_url.txt"
echo "Tunnel URL available at: $RAW_URL"
# Run your prisma commands and start the dev server
pnpm install
npx prisma generate
npx prisma db push
#npx prisma db push --accept-data-loss
pnpm run dev
