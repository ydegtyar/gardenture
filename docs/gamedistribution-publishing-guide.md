# GameDistribution Integration & Publishing Guide for Gardenture

## 1. Quality Guidelines Compliance Verification Matrix
Comprehensive verification against [GameDistribution Quality Standards](https://developer.gamedistribution.com/quality-guidelines):

| Guideline Category | GameDistribution Requirement | Gardenture Implementation Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **Family-Friendly & Content** | Suitable for broad audiences; no gore, blood, drugs, politics, or offensive themes | **PASS** | `noBlood: true`, `kidsFriendly: true`. Pastel botanical garden aesthetic with petals and crystals. |
| **Intellectual Property** | Original IP without third-party copyright infringements | **PASS** | Original characters, original arcana designs, and custom generative visual assets. |
| **No Outgoing Links** | Forbidden: outgoing links, redirections, Google Analytics, external trackers, social URLs | **PASS** | Zero external hyperlinks (`<a>`), no external analytics or trackers in runtime code. |
| **Single Ad Provider** | Only GameDistribution SDK ads allowed during gameplay | **PASS** | `GameDistributionAdapter` cleanly encapsulates all ad requests through `gdsdk`. |
| **Sound & Pause Lifecycle** | Must pause gameplay loop and mute all audio during ads; resume upon ad finish | **PASS** | `onMuteAudio` & `onPauseGame` hook directly into `AudioManager` and `SimulationContext` on `SDK_GAME_PAUSE`; unmuted on `SDK_GAME_START`. |
| **Ad Timeouts & Fallbacks** | Ad failures or adblockers must never lock or freeze game flow | **PASS** | 15s interstitial and 25s rewarded timeout safety resolvers with graceful recovery. |
| **Mobile & Portrait Scaling** | Responsive viewport scaling across all devices and aspect ratios without clipping | **PASS** | PixiJS `resizeTo: hostElement` with CSS safe-area insets (`viewport-fit=cover`) and portrait-first UI overlays. |
| **Performance & Load Times** | Fast initial loading, stable 60 FPS, optimized bundle size | **PASS** | Total zip package ~1.8 MB (limit is 50 MB); single GPU texture atlas for single-draw-call rendering. |

---

## 2. Platform Form Parameters (Mobile Portrait Gaming Priority)

For `https://developer.gamedistribution.com/games/new/edit`:

- **Title**: `Gardenture` *(10 chars, well below the recommended 20-char threshold)*
- **Type**: `HTML5` (0)
- **Sub Type**: `PixiJS` (14)
- **Width**: `800`
- **Height**: `1200` *(Default 2:3 / 9:16 mobile portrait canvas aspect)*
- **Genre / Categories**: `Casual` (1845), `Adventure` (2)
- **Tags**: `Roguelite`, `Survival`, `Casual`, `Arcade`, `Singleplayer`
- **Target Audience (Gender)**: `Male`, `Female`
- **Age Group**: `Kids (0-12)`, `Teens (13-17)`, `Young Adults (18-25)`, `Adults (26-54)`
- **Languages**: `English`
- **The Game Doesn't Contain Text**: `false` *(Unchecked)*
- **No Blood**: `true` *(Checked)*
- **Child Friendly**: `true` *(Checked)*
- **Compatibility**: `Both` *(Android & iOS)*
- **Preferred Mode of Play (`mobileMode`)**: `Portrait` (0)
- **HTTPS Ready**: `true` *(Checked)*
- **Rewarded Ads**: `true` *(Supported)*

### Game Description (170 words, fits 100-500 words specification):
```text
Step into Gardenture, a fast-paced 2D pastel botanical survival roguelite crafted for quick, rewarding mobile and browser play sessions. In this enchanting garden world, your crystal-bladed hero battles blossoming waves of mystical thorn creatures, corrupt sporelings, and colossal floral bosses.

With intuitive one-thumb drag-to-move controls, your blade automatically slashes and parries nearby foes, allowing you to focus on tactical dodging and fluid movement. Dash through danger with precision invulnerability frames, collect glowing golden petals and exp orbs, and craft your ultimate build on each level-up.

Discover over 30 synergy cards and devastating weapon evolutions: spin razor-sharp petal orbits, unleash sky-falling bloom hammers, call down chain lightning with storm marks, and reflect incoming damage with iron bark. Build dynamic momentum to push your style rank meter from D all the way up to Triple S (SSS) for amplified speed and explosive floral bursts.

Runs last between 2 and 5 minutes—ideal for quick coffee breaks or extended high-score streaks. Unlock rare arcana personas, master the daily challenge run, and cleanse the sacred garden of corruption!
```

### Instructions (Controls):
```text
Desktop Controls:
• Drag with Mouse or use WASD / Arrow Keys to move.
• Spacebar or Flick Mouse to Dash.
• P or Escape to Pause.

Mobile / Touch Controls:
• Drag anywhere with one thumb or finger to steer your hero.
• Swipe or quick-flick to Dash through attacks.
• Tap in-game buttons to pause or select upgrade cards.
```

### Key Game Features (Max 300 characters):
```text
Fast-paced 2-5 min roguelite runs; 30 synergy cards & weapon evolutions; One-thumb intuitive mobile controls; DMC-style SSS rank meter; 4 unique hero personas; Dynamic daily streak challenges.
```

---

## 3. Promotional Assets Catalog (`.assets/gamedistribution/`)

All thumbnails are generated in high-quality **JPG format** with square edges according to GameDistribution requirements:

1. **`512x384.jpg`** — Mandatory 4:3 main thumbnail ([512x384.jpg](file:///Users/degtyar/code/ydegtyar/gardenture/.assets/gamedistribution/512x384.jpg))
2. **`512x512.jpg`** — Mandatory 1:1 square icon ([512x512.jpg](file:///Users/degtyar/code/ydegtyar/gardenture/.assets/gamedistribution/512x512.jpg))
3. **`200x120.jpg`** — Mandatory 5:3 compact card ([200x120.jpg](file:///Users/degtyar/code/ydegtyar/gardenture/.assets/gamedistribution/200x120.jpg)) without logos or CTA text
4. **`1280x720.jpg`** — Recommended 16:9 widescreen feature graphic ([1280x720.jpg](file:///Users/degtyar/code/ydegtyar/gardenture/.assets/gamedistribution/1280x720.jpg))
5. **`1280x550.jpg`** — Recommended wide banner header ([1280x550.jpg](file:///Users/degtyar/code/ydegtyar/gardenture/.assets/gamedistribution/1280x550.jpg))

---

## 4. Build & Package

To build and package the production zip for GameDistribution:
```bash
npm run gamedistribution:pack
```
This generates:
- `gardenture-gamedistribution.zip` (and `gamedistribution.zip`) with `index.html` at the zip root and GameDistribution SDK integration injected.
