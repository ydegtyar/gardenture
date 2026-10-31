# Gardenture Ornate UI Kit (`src/ui/ornate/`) & Botanical Tarot Draft Modal

## 1. Component Library Overview

| Component | File | Purpose & Variants |
| --- | --- | --- |
| `OrnateFrame` | `OrnateFrame.tsx` | Polished antique-gold frame (`#fff1b0 → #e8b84e → #9a6418 → #d9a441`), 4-corner leafy vine ornaments, rarity gems (`uncommon`, `rare`, `epic`, `legendary`), and parchment/velvet interior surface (`variant="card" \| "button" \| "pill"`). |
| `GameButton` | `GameButton.tsx` | Shared tactile 3D fantasy button used by both the Main Menu and the Botanical Tarot Draft Modal (`variant="green" \| "gold" \| "teal" \| "dark" \| "danger"`, `size="md" \| "lg"`, `ornament="ivy" \| "thorn" \| "laurel" \| "crystal" \| "none"`). |
| `StatPill` | `StatPill.tsx` | Currency/score capsule with gold laurel border ornament and smooth `requestAnimationFrame` number tick animation. |
| `ornateAssets` | `ornateAssets.tsx` + `ornaments.manifest.json` | Typed registry of raster WebP/PNG ornaments (`/public/assets/ornaments/`, total `< 60 KB` WebP) with slice insets, anchors, prompts, seeds, and inline SVG fallbacks. |

## 2. Design Tokens & Animation Timings (`ornate.tokens.css`)

- **Gold Gradient Stops**: `--ornate-gold-stop-1: #fff1b0`, `--ornate-gold-stop-2: #e8b84e`, `--ornate-gold-stop-3: #9a6418`, `--ornate-gold-stop-4: #d9a441`
- **Parchment Surface**: `--ornate-parchment-top: #fdf8eb`, `--ornate-parchment-mid: #f5ebd4`, `--ornate-parchment-bot: #e8d8b7`, subtle diagonal paper grain
- **Sequence Timings (`DRAFT_TIMINGS` in `useDraftSequence.ts`)**:
  - `BACKDROP_FADE_MS`: `200ms`
  - `REVEAL_DURATION_MS`: `550ms` (`cubic-bezier(0.2, 0.8, 0.2, 1)`)
  - `REVEAL_STAGGER_MS`: `180ms` per card (left → right on desktop, top → bottom on mobile)
  - `FLIP_BACK_DURATION_MS`: `350ms`
  - `FLIP_BACK_STAGGER_MS`: `120ms` per card
  - `REDUCED_FADE_MS`: `150ms` (`prefers-reduced-motion: reduce`)

## 3. How to Test
- **Quick URL Trigger**: Open `http://localhost:3000/?autostart=1&autodraft=1` to boot directly into a live run with the Botanical Tarot Draft modal open.
- **Dev-Only Debug Cards**: In development (`import.meta.env.DEV`), click the top-left `Debug Cards` button on the Draft screen (or `DBG` in the HUD) to inspect/set card levels and weapon evolutions.
- **Unit Tests**: Run `npx tsx --test src/app/modals/draft/draftModal.test.tsx src/menu/menuIsolation.test.ts`.
