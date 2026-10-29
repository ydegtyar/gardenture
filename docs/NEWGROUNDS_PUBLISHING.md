# Newgrounds Publishing Guide for Gardenture

This document details the Newgrounds submission configuration, bundle packaging, and live portal publication for **Gardenture: Mystic Garden Roguelite**.

---

## 1. Game Overview & Live Portal URL

- **Live Submission URL:** [https://www.newgrounds.com/portal/view/1059215](https://www.newgrounds.com/portal/view/1059215)
- **Project Edit URL:** `https://www.newgrounds.com/projects/games/8233371/details`
- **Author:** `ydegtyar`
- **Initial Release:** October 29, 2026

---

## 2. Platform Form Parameters

| Field | Value | Notes |
|---|---|---|
| **Title** | `Gardenture: Mystic Garden Roguelite` | Official display title |
| **Short Description** | `Fast-paced botanical survival roguelite. Draft tarot cards & evolve weapons!` | Fits under 90 char limit |
| **Genre** | `Adventure - RPG` (`14`) | Matches roguelite action RPG category |
| **Age Rating** | `E (Everyone)` | All criteria set to `c` (None) |
| **Embed Dimensions** | Width: `800px`, Height: `1200px` | Matches mobile/portrait aspect ratio |
| **Touchscreen Friendly** | Enabled | Virtual touch joystick & flick dash |
| **Embeds Allowed** | Enabled | Public web embed permissible |

### Tags (12 / 12)
`action`, `arcade`, `botanical`, `card`, `casual`, `indie`, `pixel-art`, `roguelike`, `roguelite`, `rpg`, `singleplayer`, `survival`

---

## 3. Game Bundle & Architecture

Gardenture runs on Newgrounds as an ad-free, standalone HTML5 game using the `VITE_NO_ADS=true` and `VITE_PLATFORM_PROVIDER=NONE` environment configuration:
- Zero third-party ad network dependencies (strictly compliant with Newgrounds Terms of Service).
- Bundle includes `index.html` at the archive root.
- Pure PixiJS rendering with responsive scaling (`resizeTo: hostElement`).

### Build & Package Command
```bash
npm run itch:pack
# Creates gardenture-html5.zip (1.8 MB) containing root-level index.html and assets
```

---

## 4. Visual Assets

- **Thumbnail / Portal Icon:** 480×270 JPG formatted into multi-resolution icons (`card`, `full`, `default`, `medium`, `small`) via `ngIconUploader`.
- **Source Graphic:** `.assets/gamedistribution/1280x720.jpg`
