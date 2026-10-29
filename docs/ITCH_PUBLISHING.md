# Complete itch.io Publishing & Build Instructions

This document provides complete instructions for publishing and updating **Gardenture: Mystic Garden Roguelite** on itch.io.

---

## Architecture: The `VITE_NO_ADS` Flag

On itch.io, players expect a clean, premium, self-contained indie experience without intrusive external ad SDKs or broken third-party script network requests.

When `VITE_NO_ADS=true`:
1. **Ad SDK Removal**: The YouTube Playables SDK `<script>` tag is stripped from `index.html` during the Vite production build (`vite-plugin-game-platform-html`).
2. **Platform Provider**: Defaults to `NONE` (`NoOpLocalAdapter`), which resolves all saves to local storage and returns `false` for all ad capabilities.
3. **Hero Persona Skins**:
   - In ad mode, personas require 3 rewarded ads (`adPipsRequired: 3`).
   - In `NO_ADS` mode, personas require **50 Rare Seeds** (`PERSONA_NO_ADS_COST_SEEDS = 50`), creating a prestigious endgame goal.
4. **Ad-Related UI Suppression**:
   - Title screen "+100 🎬" ad button is replaced with a static currency badge.
   - Sanctuary store "+100 🎬" ad button is replaced with a static currency badge.
   - Rescue Revive modal hides "Revive with Ad" (only coin revive and give up are shown).
   - Run Summary modal hides "Watch Ad to Double Coins".
   - Card Draft modal hides "Watch Ad to Reroll".

---

## Deployment Steps

### 1. Build and Package

```bash
# Build standalone no-ads build
npm run build:itch

# Create HTML5 zip archive
npm run itch:pack
# -> gardenture-html5.zip created at project root
```

### 2. Push to itch.io via Butler (Recommended)

Butler is itch.io's official CLI that uploads binary diffs, making releases instant and bandwidth-efficient.

```bash
# Ensure Butler API key is in .env.local:
# BUTLER_API_KEY="your-token"
# ITCH_USERNAME="ydegtyar"
# ITCH_GAME="gardenture"

npm run itch:push
```

### 3. Verify Status

```bash
npm run itch:status
```

---

## itch.io Dashboard Checklist (`https://itch.io/game/edit/5251570`)

1. **Title**: `Gardenture: Mystic Garden Roguelite`
2. **Short description**: `Fast-paced 2D pastel survival roguelite. Draft botanical tarot cards, awaken weapon evolutions, and survive endless waves in an enchanted garden.`
3. **Classification**: `Games`
4. **Kind of project**: `HTML (You have a ZIP file...)`
5. **Release status**: `In development` / `Released`
6. **Pricing**: `$0 or donate`
7. **Embed options**:
   - Embed in page: `Yes`
   - Viewport dimensions: `960` x `540` (or `1280` x `720`)
   - Orientation: Landscape
   - Mobile friendly: `Yes`
   - Fullscreen button: `Yes`
8. **Tags**:
   `roguelite`, `survival`, `top-down`, `action`, `fantasy`, `casual`, `singleplayer`, `bullet-hell`, `cards`, `nature`, `fast-paced`

---

## Profile & Theme Settings

### Profile Page: `https://ydegtyar.itch.io/`
- **Banner**: Upload `.assets/itch/profile_banner.jpg` (1376×768)
- **Background**: Upload `.assets/itch/profile_background.jpg` (1376×768)
- **Background Color**: `#18241E`
- **Text Color**: `#FFFDF0`
- **Link Color**: `#A8E6CF`

### User Settings: `https://itch.io/user/settings`
- **Avatar**: Upload `.assets/itch/user_avatar.jpg` (1024×1024)
