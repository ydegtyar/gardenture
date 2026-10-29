# Facebook Instant Games Publishing Guide for Gardenture

This document provides complete instructions for creating the Facebook App, configuring Instant Games, and submitting **Gardenture: Mystic Garden Roguelite** to the Meta Developer Platform.

---

## 1. Architecture: Facebook Instant Games SDK v6.3 Integration

Gardenture integrates the **Facebook Instant Games SDK v6.3** (`https://connect.facebook.net/en_US/fbinstant.6.3.js`) via the modular adapter pattern.

### Build Flag: `VITE_PLATFORM_PROVIDER=FACEBOOK`
When `VITE_PLATFORM_PROVIDER=FACEBOOK`:
1. **SDK Injection**: `vite.config.ts` (`gamePlatformHtmlPlugin`) automatically injects the FBInstant SDK script tag as the **first script** in `<head>` of `index.html` (required by Meta spec).
2. **Config File**: `public/fbapp-config.json` is copied to `dist/fbapp-config.json` automatically by Vite.
3. **Platform Adapter**: `PlatformManager.ts` initializes `FacebookInstantGamesAdapter.ts`.
4. **SDK Lifecycle**: `FBInstant.initializeAsync()` → `setLoadingProgress(100)` → `startGameAsync()` is called before any gameplay.

### SDK Lifecycle & Telemetry
- **Init**: `FBInstant.initializeAsync()` — must complete before rendering any game content.
- **Loading Progress**: `FBInstant.setLoadingProgress(100)` — reports load completion.
- **Start**: `FBInstant.startGameAsync()` — unlocks game interactivity.
- **Player Data**: `FBInstant.player.setDataAsync()` / `getDataAsync()` — cloud save across sessions.

### Ads (Audience Network)
- **Rewarded Video**: `FBInstant.getRewardedVideoAsync(placementId)` — preloaded for zero-latency display.
- **Interstitial**: `FBInstant.getInterstitialAdAsync(placementId)` — preloaded between runs.
- **Audio & Game State**: During all ad playback, game audio is muted (`onMuteAudio`) and gameplay paused (`onPauseGame`). State is restored after ad completion or timeout.

---

## 2. Build & Packaging Commands

### Build for Facebook Instant Games
```bash
# Compile optimized production bundle with FBInstant SDK injected
npm run build:facebook
```

### Create ZIP Package for Upload
```bash
# Build + pack into gardenture-facebook.zip (dist/ root flattened)
npm run facebook:pack
# Creates: gardenture-facebook.zip and facebook.zip at project root
```

> [!IMPORTANT]
> The `.zip` file **must contain `index.html` and `fbapp-config.json` at the root level** — not inside a subdirectory. The `npm run facebook:pack` command handles this correctly by zipping from inside `dist/`.

> [!NOTE]
> File count in the bundle must stay under **500 files** (Meta hard limit). The current Gardenture build is well within this limit.

---

## 3. Environment Variables (`.env.local`)

Add Audience Network placement IDs once your app is created:

```bash
# Facebook Instant Games placement IDs (from Meta Audience Network dashboard)
VITE_FACEBOOK_REWARDED_PLACEMENT_ID="<your_rewarded_placement_id>"
VITE_FACEBOOK_INTERSTITIAL_PLACEMENT_ID="<your_interstitial_placement_id>"
```

Build with placement IDs:
```bash
VITE_PLATFORM_PROVIDER=FACEBOOK \
VITE_FACEBOOK_REWARDED_PLACEMENT_ID="123456789_123" \
VITE_FACEBOOK_INTERSTITIAL_PLACEMENT_ID="123456789_456" \
vite build
```

---

## 4. Meta Developer Portal — App Creation Checklist

### Step 1: Create the App
1. Go to: `https://developers.facebook.com/apps/creation/?app_creation_source=dfc_my_apps_app_create`
2. **App Use Case**: Select **Games**
3. **App Name**: `Gardenture: Mystic Garden Roguelite`
4. **App Contact Email**: *(your email)*
5. Click **Create App**

### Step 2: Basic Settings (`App Settings > Basic`)

| Field | Value |
|---|---|
| **Display Name** | `Gardenture: Mystic Garden Roguelite` |
| **App Namespace** | `gardenture-mystic-garden` *(or `gardenturemysticgarden`)* |
| **App Icon** | Upload `.assets/facebook/app-icon-1024x1024.png` (1024×1024 PNG) |
| **Category** | `Games` |
| **Sub-Category** | `Action` |
| **Privacy Policy URL** | *(your privacy policy URL)* |
| **Terms of Service URL** | *(your ToS URL or same as privacy policy)* |
| **App Purpose** | `Yourself or your own business` |
| **Contact Email** | *(your developer email)* |

### Step 3: Add the Instant Games Product
1. In the left sidebar, click **+ Add Product**
2. Find **Instant Games** and click **Set Up**
3. This unlocks the Instant Games dashboard for your app

### Step 4: Instant Games Configuration

#### Orientation & Display
| Field | Value |
|---|---|
| **Orientation** | `Portrait` |
| **Platform Version** | `RICH_GAMEPLAY` *(handled in `fbapp-config.json`)* |

#### Store Listing (`Instant Games > Store Presence`)

| Field | Value |
|---|---|
| **Game Name** | `Gardenture: Mystic Garden` |
| **Short Description** (≤80 chars) | `Fast-paced 2D botanical roguelite. Draft tarot cards, evolve weapons, survive!` |
| **Long Description** | *(see below)* |
| **Category** | `Action` |
| **Age Rating** | Complete IARC questionnaire *(see Step 5)* |

**Long Description:**
```
Step into Gardenture: Mystic Garden — a fast-paced 2D pastel botanical survival roguelite built for quick, rewarding play sessions.

Your crystal-bladed hero battles blossoming waves of mystical thorn creatures, corrupt sporelings, and colossal floral bosses. With intuitive one-thumb drag-to-move controls, your blade automatically slashes nearby foes while you focus on tactical dodging and fluid movement.

✨ KEY FEATURES:
• 30+ synergy cards and devastating weapon evolutions: razor petal orbits, sky-falling bloom hammers, chain lightning, and iron bark deflection
• DMC-style SSS rank meter — build momentum from D to SSS for amplified speed and explosive floral bursts  
• 4 unique hero arcana personas with distinct playstyles
• Runs last 2–5 minutes — perfect for quick sessions
• Daily challenge runs and high-score streaks
• One-thumb intuitive mobile controls with virtual joystick and flick-dash

Cleanse the sacred garden of corruption. How high can you rank?
```

#### Store Assets

| Asset | File | Size |
|---|---|---|
| **App Icon** | `.assets/facebook/app-icon-1024x1024.png` | 1024×1024 |
| **Landscape Cover** | `.assets/facebook/cover-landscape-1920x1080.png` | 1920×1080 |
| **Portrait Cover** | `.assets/facebook/cover-portrait-800x1200.png` | 800×1200 |
| **Store Banner** | `.assets/facebook/banner-1200x628.png` | 1200×628 |
| **Square Store Icon** | `.assets/facebook/store-icon-512x512.png` | 512×512 |

#### Game Controls
```
Movement: Drag with one thumb / finger anywhere on screen (floating virtual joystick)
Dash: Swipe or quick-flick gesture
Desktop — WASD or Arrow Keys to move, Spacebar to dash
Pause: Tap the pause button / press P or Escape
```

### Step 5: IARC Age Rating
1. In **App Settings > Basic**, find **Age Rating** section
2. Click **Get IARC Rating**
3. Complete the questionnaire:
   - **Violence**: Stylized cartoon violence (no blood, no gore)
   - **Sexual Content**: None
   - **Language**: No strong language
   - **Gambling**: No real-money gambling (simulated card drafting only)
   - Expected rating: **Everyone (E)** or **Everyone 10+ (E10+)**

### Step 6: Upload HTML5 Game Bundle (`Instant Games > Web Hosting`)
1. Click **Add Build**
2. Upload `gardenture-facebook.zip`
3. Wait for processing (usually 1–2 minutes)
4. Click **Push to Production** (or keep as **Staged** for testing)

> [!NOTE]
> While in development mode, only **Developers** and **Testers** listed in App Roles can play the game. Meta automatically serves **test ads** to all approved developers.

### Step 7: Set Up Audience Network Ads
1. Go to `https://developers.facebook.com/apps/<APP_ID>/audience-network/`
2. Create a **Rewarded Video** placement → copy the Placement ID
3. Create an **Interstitial** placement → copy the Placement ID
4. Add both IDs to `.env.local` and rebuild with `npm run facebook:pack`

### Step 8: Connection Experience (Zero Permissions)
1. Go to **Instant Games > Connection Experience**
2. Select **Zero Permissions** *(no upfront permission prompts for new users)*
3. This is required for all new Instant Games submissions

### Step 9: Submit for App Review
1. Go to **App Review > Requests**
2. Request the **`instant_gaming` permission** (required for public distribution)
3. Provide:
   - **Instructions for Reviewers**: *(see below)*
   - **Screencast**: A short video of the game being played
   - **Additional Context**: Describe the game genre and controls

**Reviewer Instructions:**
```
Gardenture: Mystic Garden is a single-player action roguelite HTML5 game.

To play:
1. The game loads automatically and shows the title screen within 3 seconds.
2. Tap or click "Start Run" to begin gameplay.
3. Drag anywhere with one finger/mouse to move the hero.
4. Survive waves of enemies — the blade attacks automatically.
5. Level up by collecting XP orbs, and choose upgrade cards to build your run.
6. The game ends when the hero dies (run lasts 2–5 minutes).

Rewarded ads appear optionally when the player clicks "Watch Ad" buttons (revive, reroll cards, double coins). Interstitial ads appear between runs at natural break points.

No social sharing, no external links, no login required.
```

---

## 5. `fbapp-config.json` Reference

Located at `public/fbapp-config.json` (automatically copied to `dist/` on build):

```json
{
  "instant_games": {
    "platform_version": "RICH_GAMEPLAY",
    "orientation": "PORTRAIT",
    "navigation_menu_version": "NAV_FLOATING"
  }
}
```

This file **must** be present at the root of the uploaded ZIP alongside `index.html`.

---

## 6. Promotional Assets Catalog (`.assets/facebook/`)

| File | Dimensions | Usage |
|---|---|---|
| `app-icon-1024x1024.png` | 1024×1024 | App icon, store listing |
| `cover-landscape-1920x1080.png` | 1920×1080 | Landscape game cover |
| `cover-portrait-800x1200.png` | 800×1200 | Portrait game cover |
| `banner-1200x628.png` | 1200×628 | OG/Facebook share image |
| `store-icon-512x512.png` | 512×512 | App Center icon |

---

## 7. Testing Before Submission

### Add Test Users
1. Go to **App Roles > Roles**
2. Add developers/testers under **Testers**
3. Test users can play the game from `https://fb.gg/play/<app_namespace>`

### Local Testing with Facebook Instant Games Debugger
```
https://developers.facebook.com/tools/instantgames/simulator/
```
- Upload `gardenture-facebook.zip` to the simulator
- Verify SDK lifecycle signals fire correctly
- Test rewarded and interstitial ad flows (test ads are served automatically)

---

## 8. Submitting Updates / New Versions

When pushing a new build after approval or review feedback:
1. Rebuild: `npm run facebook:pack`
2. Go to `https://developers.facebook.com/apps/<APP_ID>/instant-games/hosting/`
3. Click **Add Build** and upload the new `gardenture-facebook.zip`
4. Click **Push to Production** once processing completes
