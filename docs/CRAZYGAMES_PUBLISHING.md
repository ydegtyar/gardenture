# CrazyGames Publishing & Build Instructions

This document provides complete instructions for integrating, building, testing, and submitting **Gardenture: Mystic Garden** to the **CrazyGames Developer Portal** (`https://developer.crazygames.com`).

---

## 1. Architecture: CrazyGames SDK v3 Integration

Gardenture integrates the official **CrazyGames SDK v3** (`https://sdk.crazygames.com/crazygames-sdk-v3.js`) via a modular adapter pattern.

### Build Flag: `VITE_PLATFORM_PROVIDER=CRAZYGAMES`
When `VITE_PLATFORM_PROVIDER=CRAZYGAMES`:
1. **SDK Injection**: `vite.config.ts` (`gamePlatformHtmlPlugin`) automatically injects the CrazyGames SDK v3 script tag into the `<head>` of `index.html`.
2. **Platform Adapter**: `PlatformManager.ts` initializes `CrazyGamesAdapter.ts`.
3. **Environment Detection**: Calls `window.CrazyGames.SDK.init()`, verifying environment is `crazygames` or `local`.

### Telemetry & Lifecycle Calls
- **Loading Start**: `window.CrazyGames.SDK.game.loadingStart()` emitted during initial asset load.
- **Loading Stop (Game Ready)**: `window.CrazyGames.SDK.game.loadingStop()` emitted when title screen is rendered.
- **Gameplay Start**: `window.CrazyGames.SDK.game.gameplayStart()` called when the player clicks "Start Run" and enters gameplay.
- **Gameplay Stop**: `window.CrazyGames.SDK.game.gameplayStop()` called when pausing, opening overlays, or dying.
- **Happy Time**: `window.CrazyGames.SDK.game.happytime()` called on boss defeats and milestone achievements.

### Video Ads (Midgame & Rewarded)
- **Midgame (Interstitial)**: `window.CrazyGames.SDK.ad.requestAd('midgame', callbacks)` triggered between runs.
- **Rewarded**: `window.CrazyGames.SDK.ad.requestAd('rewarded', callbacks)` triggered for opt-in rewards (revive, rerolls, doubling coins).
- **Audio & Game State Handling**: During `adStarted`, game audio is automatically muted (`hooks.onMuteAudio()`) and gameplay paused (`hooks.onPauseGame()`). On `adFinished` or `adError`, audio and game state are restored.

### Cloud Save (Data Module)
- **Save State**: `window.CrazyGames.SDK.data.setItem(key, data)` persists player currency, loadouts, and unlocked personas across devices.
- **Load State**: `window.CrazyGames.SDK.data.getItem(key)` retrieves cloud progress upon launch, falling back to `localStorage` in local or unsupported environments.

---

## 2. Build & Packaging Commands

### Build for CrazyGames
```bash
# Compile optimized production bundle for CrazyGames
npm run build:crazygames
```
This outputs all bundled files into the `dist/` directory with CrazyGames SDK scripts and adapter hooks active.

> [!IMPORTANT]
> **Do not upload `.zip` archives directly to the CrazyGames Developer Portal.**  
> The portal rejects `.zip` files with `"Archive files are not supported, please drag and drop the files directly in the upload zone"`.  
> You must upload the uncompressed folder using the **`[ Select folder ]`** button and selecting `dist/`, or drag all files from `dist/` into the upload zone.

---

## 3. Developer Portal Submission Workflow (`https://developer.crazygames.com/submit`)

### Step 1: Game Upload & Configuration
1. **Game Title**: `Gardenture: Mystic Garden`
2. **Game Engine**: `HTML5`
3. **Progress Save**: Select `Yes, using the Data Module from the CrazyGames SDK`
4. **Mobile Devices**: Check `The game supports mobile devices`
5. **Mobile Orientation**: Select `BOTH` (Landscape & Portrait supported)
6. **Audio Muting**: Check `The game supports CrazyGames muting audio through SDK`
7. **Upload Build Files**:
   - Click `[ Select folder ]`
   - Choose the `dist/` directory
   - Confirm browser prompt: *"Upload files to this site?"*

### Step 2: QA Environment & Live Verification
After files finish uploading, the portal launches an interactive QA session:
1. **Launch QA Preview**: Click `Preview` to open the game in CrazyGames' iframe runner.
2. **Trigger Gameplay Signals**:
   - Wait for the title screen to render (`Loading Start` and `Loading Stop` turn green).
   - Click **"Start Run"** in the game (`Gameplay Start` turns green).
   - Press `P` or `Esc` to pause (`Gameplay Stop` turns green).
3. **Close Preview**: Click `Continue` on the preview sidebar, then close the preview tab.
4. **Complete QA Checklist**:
   - `Initial download size <50MB`: Automatically verified (`~3 MB`).
   - `First gameplay start`: Automatically verified (`Yes (automatic)`).
   - `First gameplay start implemented correctly`: Select `Yes`.
   - `Complies to Gameplay requirements`: Select `Yes`.
   - `Runs on all CrazyGames domains`: Select `Yes`.
   - `Browser checks`: Select `Yes`.
   - `Device checks: Mobile`: Select `Yes`.
   - `No external ads`: Select `Yes`.
   - `Does not offer external login options`: Select `Yes`.
   - `In-game mention of Terms & Conditions and/or Privacy Policy`: Select `N/A` (game does not collect external telemetry or custom backend logins).
   - **Declaration**: Check `I confirm that these results are correct...`
   - Click `Continue →`.

### Step 3: Game Details & Metadata
1. **Category**: `Adventure` (or `Action`)
2. **Tags (Max 5)**: `1 Player`, `Survival`, `2D`
3. **Description (No HTML)**:
   ```text
   Gardenture: Mystic Garden is an enchanting roguelike survival action-adventure game. Explore mystical overgrown gardens, battle waves of corrupted flora and fauna, discover powerful ancient relics, and unlock unique hero personas and abilities. Craft your ultimate build across runs, conquer garden guardians, and restore harmony to the enchanted grove!
   ```
4. **Controls**:
   ```text
   Movement: WASD or Arrow keys (or Click & Drag)
   Dash: Spacebar or Flick / Swipe
   Skills: Q and E keys (or tap skill icons)
   Pause: P or Esc key
   ```
5. **Tools Used**: Select `Gemini` (or other AI/developer assistance tools).
6. **Cover Images** (located in `.assets/crazygames/`):
   - **Landscape 16:9 (`1920x1080`)**: `.assets/crazygames/gardenture-landscape-1920x1080.png`
   - **Portrait 2:3 (`800x1200`)**: `.assets/crazygames/gardenture-portrait-800x1200.png`
   - **Square 1:1 (`800x800`)**: `.assets/crazygames/gardenture-square-800x800.png`
7. **Hover Preview Videos (Mandatory)**:
   - MP4 or MOV format, max 20 seconds.
   - Generate using `ffmpeg` (see section 4 below).
   - Upload **Landscape Video** and **Portrait Video**.
8. Click `Save and continue to last step →`.

### Step 4: Finalize & Submit for Review
1. Check: `I agree to the Terms & Conditions of the Developer Portal, and acknowledge they apply to my submission.`
2. Check: `My game is appropriate for players aged 12+ and meets the criteria for the PEGI 12 rating.`
3. Click `Submit for approval →`.
4. Submission Status moves to **`AWAITING REVIEW`** (`Submitted`). Review turnaround is typically 1–3 business days.

---

## 4. Generating Hover Preview Videos with FFmpeg

CrazyGames requires a landscape and a portrait preview video for desktop hover previews. You can generate crisp 6-second preview videos from cover assets with subtle motion:

```bash
# 1. Generate Landscape Preview MP4 (1920x1080, 30fps, H.264)
ffmpeg -y -loop 1 -i .assets/crazygames/gardenture-landscape-1920x1080.png \
  -vf "zoompan=z='min(zoom+0.001,1.1)':d=180:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30" \
  -c:v libx264 -t 6 -pix_fmt yuv420p -b:v 2M /tmp/gardenture-preview-landscape.mp4

# 2. Generate Portrait Preview MP4 (800x1200, 30fps, H.264)
ffmpeg -y -loop 1 -i .assets/crazygames/gardenture-portrait-800x1200.png \
  -vf "zoompan=z='min(zoom+0.001,1.1)':d=180:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=800x1200:fps=30" \
  -c:v libx264 -t 6 -pix_fmt yuv420p -b:v 2M /tmp/gardenture-preview-portrait.mp4
```

---

## 5. Submitting Updates / New Versions

When pushing a new build after approval or review feedback:
1. Rebuild the application: `npm run build:crazygames`
2. Navigate to your game dashboard: `https://developer.crazygames.com/games/<game-id>`
3. Click **`+ Upload new version`** (or **`Submit new version`**).
4. Select the updated `dist/` folder.
5. Re-run the quick QA preview verification to confirm SDK telemetry.
6. Submit the update for review.
