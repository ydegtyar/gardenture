#!/usr/bin/env bash
# Push build to Facebook Instant Games via Graph API
set -e

if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -E '^(FACEBOOK_APP_ID|FACEBOOK_APP_SECRET|FACEBOOK_ACCESS_TOKEN)=' | xargs 2>/dev/null || true)
fi

APP_ID="${FACEBOOK_APP_ID:-1122546253826452}"
ZIP_FILE="gardenture-facebook.zip"

if [ ! -f "$ZIP_FILE" ]; then
  echo "Packing fresh Facebook build..."
  npm run facebook:pack
fi

TOKEN="$FACEBOOK_ACCESS_TOKEN"
if [ -z "$TOKEN" ] && [ -n "$FACEBOOK_APP_SECRET" ]; then
  TOKEN="${APP_ID}|${FACEBOOK_APP_SECRET}"
fi

if [ -z "$TOKEN" ]; then
  echo "Notice: FACEBOOK_ACCESS_TOKEN (or FACEBOOK_APP_SECRET) not set in .env.local."
  echo "Usage: Set FACEBOOK_ACCESS_TOKEN in .env.local, or pass: FACEBOOK_ACCESS_TOKEN=xxx npm run facebook:upload"
  exit 1
fi

COMMENT="${1:-CLI Build Upload}"

echo "Uploading $ZIP_FILE to Facebook App $APP_ID..."
RESPONSE=$(curl -s -X POST "https://graph-video.facebook.com/$APP_ID/assets" \
  -F "access_token=$TOKEN" \
  -F "type=BUNDLE" \
  -F "asset=@$ZIP_FILE" \
  -F "comment=$COMMENT")

echo "Response: $RESPONSE"
