#!/data/data/com.termux/files/usr/bin/bash

GITHUB_USER="himanshunautiyal1"
GITHUB_REPO="api-monitor"
APP_DIR="/data/data/com.termux/files/home/apps/api-monitor"
PM2_NAME="api-monitor"

echo "🚀 Starting api-monitor deployment..."

echo "📡 Fetching latest release info..."
RELEASE_DATA=$(curl -s "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/latest")

TAG_NAME=$(echo "$RELEASE_DATA" | grep '"tag_name"' | cut -d '"' -f 4)
echo "✅ Latest release: $TAG_NAME"

ASSET_URL=$(echo "$RELEASE_DATA" | grep "browser_download_url" | grep -E "\.tar\.gz|\.zip" | head -1 | cut -d '"' -f 4)

if [ -z "$ASSET_URL" ]; then
    echo "❌ No downloadable assets found!"
    echo "$RELEASE_DATA" | grep -E "name|browser_download_url" | head -10
    exit 1
fi

echo "✅ Found asset: $ASSET_URL"

echo "📥 Downloading..."
if command -v wget &> /dev/null; then
    wget -O deployment.tar.gz "$ASSET_URL"
elif command -v curl &> /dev/null; then
    curl -L -o deployment.tar.gz "$ASSET_URL"
else
    echo "❌ Neither wget nor curl found!"
    exit 1
fi

if [ ! -f deployment.tar.gz ]; then
    echo "❌ Download failed!"
    exit 1
fi

echo "✅ Download complete!"

echo "📦 Extracting..."
mkdir -p $APP_DIR
tar -xzf deployment.tar.gz --overwrite -C $APP_DIR

rm deployment.tar.gz

echo "📦 Installing production dependencies..."
cd $APP_DIR
npm install --production

echo "⚙️ Generating Prisma client..."
npx prisma generate

echo "🔄 Restarting PM2..."
pm2 restart $PM2_NAME || pm2 start ecosystem.config.js

pm2 save --force

echo "✅ Deployment complete!"
echo "📊 Check logs with: pm2 logs $PM2_NAME"