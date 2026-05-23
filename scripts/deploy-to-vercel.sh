#!/bin/bash

set -e

ENV=${1:-production}

echo "🚀 Starting build + deploy for: $ENV"

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Step 2: Build locally
echo "🏗️ Building project..."
vercel build --prod

# Step 3: Validate environment
if [[ "$ENV" != "production" && "$ENV" != "preview" ]]; then
  echo "❌ Invalid env: $ENV"
  echo "Use: production | preview"
  exit 1
fi

# Step 4: Deploy using prebuilt output
echo "🚀 Deploying with prebuilt output..."

if [ "$ENV" == "production" ]; then
  vercel deploy --prebuilt --prod --logs
else
  vercel deploy --prebuilt
fi

echo "✅ Deployment complete!"
