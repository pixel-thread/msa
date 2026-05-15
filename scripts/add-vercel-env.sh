#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

echo "Starting environment variable sync to Vercel..."

# Read .env file, ignoring comments and empty lines
grep -v '^#' .env | grep -v '^\s*$' | while IFS='=' read -r key value; do
  # Remove potential quotes from the value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  if [ -n "$key" ]; then
    echo "Adding $key..."
    # 'development' is the target environment. 
    # You can change this to 'production' or 'preview' if needed.
    echo -n "$value" | vercel env add "$key" production
  fi
done

echo "Sync complete!"
