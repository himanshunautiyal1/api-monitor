#!/bin/bash

set -e

APP_DIR="/root/apps/api-monitor"
REPO="himanshunautiyal1/api-monitor"

echo "Fetching latest release..."
LATEST=$(curl -s https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name"' | cut -d'"' -f4)

echo "Downloading $LATEST..."
curl -L "https://github.com/$REPO/releases/download/$LATEST/deployment.tar.gz" -o /tmp/api-monitor.tar.gz

echo "Extracting..."
mkdir -p $APP_DIR
tar -xzf /tmp/api-monitor.tar.gz -C $APP_DIR

echo "Installing production dependencies..."
cd $APP_DIR
npm install --production

echo "Generating Prisma client..."
npx prisma generate

echo "Restarting PM2..."
pm2 restart api-monitor || pm2 start ecosystem.config.js

echo "Saving PM2 state..."
pm2 save --force

echo "Done. api-monitor running on port 3004"