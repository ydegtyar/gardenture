# 🌿 Gardenture: Mystic Garden Roguelite

A fast-paced 2D pastel botanical survival roguelite built with React, PixiJS, TypeScript, and TailwindCSS. Draft vintage botanical tarot cards, trigger weapon evolutions, rack up stylish DMC-tier combo ranks, and survive fierce garden swarms.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local dev server (port 3000)
npm run dev

# Run unit / deterministic simulation tests
npx tsx --test src/sim/simulation.test.ts

# Production build (general)
npm run build
```

---

## 🕹️ itch.io Publishing Guide

Gardenture supports a dedicated **No-Ads Standalone Mode** for itch.io, where all third-party ad networks and SDKs are cleanly stripped, all ad buttons are replaced with seamless local actions, and premium Arcana Persona skins become unlockable using in-game **Rare Seeds** (50 seeds).

### 1. Environment Configuration

In `.env.local`:
```bash
# Butler credentials
BUTLER_API_KEY="your-butler-api-key"
ITCH_USERNAME="ydegtyar"
ITCH_GAME="gardenture"

# Ad configuration (default false for web, set true for itch.io)
VITE_NO_ADS="false"
```

### 2. Build for itch.io

To compile the optimized, ad-free standalone build:
```bash
npm run build:itch
```
This runs:
- `VITE_NO_ADS=true`
- `VITE_PLATFORM_PROVIDER=NONE`
- Automatically strips the external YouTube Playables SDK `<script>` tag from `dist/index.html`.
- Switches all persona unlocks to 50 Rare Seeds.
- Hides all ad rerolls, double coins ad banners, and ad revives.

### 3. Package as HTML5 ZIP

To generate a clean zip archive ready for manual upload to itch.io:
```bash
npm run itch:pack
# Creates: gardenture-html5.zip
```

### 4. Push directly via Butler (Automated)

Ensure Butler is installed and configured:
```bash
# Push directly to the html5 channel
npm run itch:push

# Or run the push script
./scripts/itch-push.sh

# Check build and processing status on itch.io
npm run itch:status
```

### 5. itch.io Project Page Settings (`https://itch.io/game/edit/<id>`)

| Setting | Recommended Value |
|---|---|
| **Kind of project** | **HTML** (You have a ZIP file...) |
| **Upload file** | Upload `gardenture-html5.zip` or push via Butler |
| **File options** | Check: **"This file will be played in the browser"** |
| **Embed options** | **Embed in page** |
| **Viewport dimensions** | **960 × 540** (or **1280 × 720**), 16:9 responsive |
| **Orientation** | Landscape / Auto-detect |
| **Mobile friendly** | Check: **Yes** (supports touch & virtual joystick) |
| **Fullscreen button** | Check: **Yes** |
| **Automatically start** | Optional (or click to start) |

---

## 🎨 itch.io Profile & Page Assets

Visual branding assets generated for the project are stored in `.assets/itch/`:
- `profile_banner.jpg` (1376×768): Header banner for `https://ydegtyar.itch.io/`
- `profile_background.jpg` (1376×768): Dark botanical wallpaper for `https://ydegtyar.itch.io/`
- `user_avatar.jpg` (1024×1024): Heterochromia botanical hero avatar for `https://itch.io/user/settings`
- `itch-cover.jpg` (630×500): Cover image for game card listings

---

## 🎮 CrazyGames Publishing Guide

Gardenture supports the official **CrazyGames SDK v3** with automated gameplay telemetry, midgame and rewarded video ads (with automatic game pause and audio muting), and cloud save progression via the CrazyGames Data module.

### Build for CrazyGames
```bash
npm run build:crazygames
```

For full step-by-step instructions on Developer Portal upload, QA checklist verification, metadata, asset specs, and video generation, see:
👉 **[CrazyGames Publishing Guide](docs/CRAZYGAMES_PUBLISHING.md)**

