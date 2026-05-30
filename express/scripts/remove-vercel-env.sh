#!/bin/bash

ENVIRONMENT="production"  # change to: production / development

echo "Fetching env variables from Vercel ($ENVIRONMENT)..."

# Get list of env vars
vercel env ls "$ENVIRONMENT" | awk 'NR>2 {print $1}' | while read -r key; do

  if [ -n "$key" ]; then
    echo "Deleting $key from $ENVIRONMENT..."
    vercel env rm "$key" "$ENVIRONMENT" --yes
  fi

done

echo "All environment variables deleted from $ENVIRONMENT!"
