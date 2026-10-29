#!/usr/bin/env bash
# Push build to itch.io using butler

set -e

# Load credentials
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -E '^(BUTLER_API_KEY|ITCH_USERNAME|ITCH_GAME)=' | xargs)
fi

USERNAME="${ITCH_USERNAME:-ydegtyar}"
GAME="${ITCH_GAME:-gardenture}"

echo "Building itch.io standalone release (VITE_NO_ADS=true)..."
npm run build:itch

echo "Target: $USERNAME/$GAME:html5"

~/.local/bin/butler push dist/ "$USERNAME/$GAME:html5" --userversion "0.1.0"
