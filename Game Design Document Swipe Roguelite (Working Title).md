# Game Design Document: Swipe Roguelite (Working Title)

Oct 23, 2026 · @Yuriy

## 1. Vision and pillars

A 2D, build-based survival roguelite for short sessions (2 to 5 minutes): the hero moves with a thumb drag, attacks automatically, and every level-up shapes a different build. It is built in HTML5 for portrait first, and it must stay fully playable in square and landscape views. This document is the master reference; every section lists what must be decided and written in more detail before development starts.

**Elevator pitch.** Drag to move, let the blade swing itself, choose one of three cards every few seconds, chase a style rank, beat the boss, and want another run before the video ends.

**Design pillars**

1. **One-thumb readable.** Everything meaningful can be done with one finger: drag to move, flick to dash, tap to use a power-up. Complexity lives in the choices (cards), never in the controls.
2. **Fast, then deeper.** First level-up within 8 seconds, first meaningful build choice inside 40 seconds, restart after death in under 2 seconds. Depth arrives through synergies and meta unlocks, not through slow openings.
3. **Every run tells a different story.** Professions, weapon shapes, tagged cards, special monsters and curses combine so no two runs feel the same.
4. **Style over safety.** The rank meter rewards aggressive, varied play, so surviving by kiting forever is never the best strategy.
5. **Theme-agnostic core.** All rules are data; the visual theme (mystic garden first, dungeon later) is a swappable content pack.
6. **Tiny and robust.** Small bundle, instant start, pause-safe at any moment, same gameplay across aspect ratios.

**What this game is not:** a deep-menu RPG, a bullet-hell with precise aiming, a game that needs a keyboard, or one that punishes players with long loads and waiting timers.

**Comparable games to study** (to be reviewed during preproduction): Vampire Survivors, Brotato, Survivor.io, Archero, Hades (heat/curses), Devil May Cry (style rank), and the top YouTube Playables arcade titles for session length and onboarding.

**To describe in follow-up docs:** one-page pitch, pillar-conflict rules (what we cut when pillars clash), tone and fantasy statement, comparable-game teardown.

## 2. Audience, platform and constraints

The target is casual mobile players who watch short videos and want an instantly understandable game. Most play happens in portrait on a phone, with a meaningful minority on desktop, tablet and TV. The platform rules below are assumptions to verify against current official documentation before any code is written.

| Topic | Working assumption | Must verify or decide |
| --- | --- | --- |
| Primary platform | YouTube Playables (HTML5 inside the YouTube app and web) | Current submission rules, review process, size and performance limits |
| Secondary platforms | Web portals (CrazyGames, Poki, own site), later PWA | Which portals and when; SDK differences |
| Orientation | Portrait first; square and landscape fully playable | Letterbox vs extended-view policy per aspect ratio |
| Session length | 2 to 4 minutes per run, hard cap about 5 | Run timer vs boss-gated end |
| Input | Touch first; mouse drag and keyboard as fallback; TV remote later. Swipe to dash, tap and tap to teleport(if card applied) | Whether TV and gamepad are in scope |
| Bundle size | As small as possible; assets lazy-loaded after first interaction | Exact platform size limit, target budget (for example under 5 MB initial) |
| Network | Offline-capable after load, no required server. Add PWA cache with cache buster on update. | Whether platform SDK provides cloud save and leaderboards. |
| Ads and purchases | Rewarded ads only, behind an abstraction layer | YouTube policy on ads and purchases; fallback behavior |
| Content rating | All ages, mild fantasy violence, no gore | Platform content policy, ESRB-style self-check |
| Localization | English first; text kept in string tables | Which languages, and font coverage |

**Success metrics (targets to refine after prototype)**

- Day-1 return rate, day-7 return rate, and number of runs per session.
- Median session length (goal 3 to 5 minutes) and share of players who finish the first run.
- Time to first level-up and rate of quitting before it.
- Revive and reroll opt-in rate, and ads per session.

**To describe in follow-up docs:** platform requirements checklist, target-device performance profile (low-end phone baseline), aspect-ratio support matrix, localization plan, content-rating self-assessment.

## 3. Core gameplay loop

The game runs on three nested loops. Each must feel complete on its own and pull the player into the next one.

1. **Moment to moment (seconds).** Drag to position the hero, the weapon auto-swings at the nearest enemy, enemies die and drop XP gems, the player collects gems and avoids damage, and the rank meter rises and decays.
2. **Per run (2 to 4 minutes).** Level-ups every 15 to 40 seconds offer a card choice; a special monster appears about every 45 to 60 seconds; a mini-boss near the middle and a boss at the end close the run; death or victory pays out currency and shows a score summary.
3. **Meta (days).** Currency buys professions, trinkets, weapons and curses; quests, daily seeds and mastery give reasons to return tomorrow.

**Target run timeline** (starting values to tune in prototype)

| Time | Event | Purpose |
| --- | --- | --- |
| 0:00 to 0:08 | Few weak enemies, first XP gems | Teach drag and auto-attack, first level-up by 0:08 |
| 0:08 to 0:40 | Three level-ups, first special monster hint | First real build choice, hook the player |
| 0:40 to 1:30 | Density ramps, new archetypes appear | Build starts to matter, rank meter engages |
| 1:30 to 2:10 | Mini-boss, item chest | Mid-run peak and reward |
| 2:10 to 3:20 | Elite waves, curse modifiers bite | Skill and build test |
| 4:00 to 5:00 | Final boss | Climax and clear finish line |
| End | Score summary, currency, near-miss message, one-tap restart | Retention hook |

**Failure and success states.** Death ends the run but still pays currency (scaled by time survived and rank). A revive can be offered once. Boss victory gives a bonus and unlocks the next difficulty tier.

**To describe in follow-up docs:** detailed run-flow charts, pacing curve with XP and difficulty targets per minute, onboarding script for the first three runs, win and lose condition spec, difficulty tier definitions.

## 4. Controls and input

Controls use relative gestures from the touch start point, never fixed screen regions, so they behave identically in every orientation and on any screen size.

| Action | Touch | Mouse | Keyboard | Notes |
| --- | --- | --- | --- | --- |
| Move | Drag anywhere (floating joystick anchored at touch start) | Click and drag | WASD or arrows | Dead zone and max radius to tune; speed scales with drag distance or is fixed (decide) |
| Dash | Quick flick in a direction | Fast drag flick | Space | Short cooldown, brief invulnerability (decide), may damage enemies depending on profession |
| Use power-up | Tap held-item slot | Click slot | Q and E | One or two held slots at most |
| Pick card | Tap card | Click | 1, 2, 3 | Cards stay on screen with slow timer pressure, the whole world become in a freeze liek slow motion and starting to become faster in 30 seconds |
| Pause | Pause button, or automatic on focus loss | Button or Esc | P or Esc | Pausing must never lose state |

**Rules and considerations**

- Auto-aim targets the nearest enemy within range; tie-breaking rules (lowest health, elites first, special monsters first) are a tuning lever.
- Input buffering for dash flicks and a forgiving gesture classifier (flick vs drag) to avoid mis-reads on small phones.
- Thumb occlusion: critical information never sits under the thumb zone; HUD stays at edges.
- Multi-touch: ignore the second finger or reserve it for a power-up tap (decide).
- Accessibility: reduced motion and flash options, colorblind-safe enemy and projectile colors, adjustable joystick size and position, haptics toggle, optional larger hit feedback.
- Haptics and sound feedback on hits, level-ups and rank changes where supported.

**To describe in follow-up docs:** input state machine, gesture classifier thresholds, control feel tuning sheet, accessibility checklist, desktop and TV input mapping.

## 5. Hero, personas and professions

The hero is split into two independent layers so cosmetics and gameplay never get tangled. Any persona can wear any profession.

**Personas (cosmetic only).** A persona is a sprite set, palette, idle and hit animations, a death sound, and an optional name and short flavor line. It has zero effect on balance. Unlock sources: milestones, achievements, daily quests, seasonal events, and rewarded ads. Because they are pure data they are the cheapest content to add after launch.

**Professions (playstyle).** A profession defines the starting weapon shape, one passive, the dash behavior, base stats, and a weighted card pool that nudges the build direction. Unlock sources: meta currency and a first-time challenge (for example reach rank A as the previous profession).

| Profession (working names) | Starting weapon | Dash | Passive | Card pool lean |
| --- | --- | --- | --- | --- |
| Warden (default) | Sword arc | Thorn burst on dash | Slightly higher defense | Slash, area, defense |
| Seeker | Thrown blades (projectile) | Leaves a seed trap | Faster projectile speed | Pierce, crit, speed |
| Herbalist | Pulse circle | Short heal pulse | Heal on kill streak | Healing, area, sustain |
| Stormcaller | Chain lightning | Teleport through enemies | Dash damage | Chain, burst, mobility |

**Hero stats to define:** max health, move speed, damage, attack speed, area, reach, crit chance and damage, pickup radius, dash cooldown, luck (card rarity), armor, regeneration.

**Starting kit rules:** each profession starts with one weapon slot filled; up to three weapon slots in a run; up to four passive slots (decide numbers during balance).

**To describe in follow-up docs:** full stat sheet with formulas, profession design briefs (fantasy, strengths, weaknesses, counters), persona catalog and art spec, unlock tree, character select screen flow.

## 6. Combat and weapons

Combat is automatic: the hero swings toward the nearest valid target within reach, and the player's skill is positioning, dashing, and picking cards. Weapons are configuration over a small set of attack shapes, so a new weapon is a data entry and not new code.

| Shape | Examples | Behavior | Key stats |
| --- | --- | --- | --- |
| Arc | Sword, scythe | Sweep in front of the hero toward the target | Arc angle, reach, swing speed |
| Line | Spear, rapier | Thrust that pierces along a line | Length, width, pierce count |
| Circle | Hammer slam, thorn burst | Area around hero or target point | Radius, delay, knockback |
| Projectile | Boomerang, thrown blade | Travels, may return or pierce | Speed, count, spread, lifetime |
| Orbit | Spinning petals | Objects circling the hero | Count, radius, rotation speed |

**Weapon stats:** damage, cooldown, area (swing size, which the player can increase), reach, knockback, crit, pierce, tags (slash, pierce, area, fire, nature, projectile), and level (1 to 8).

**Damage model considerations**

- Damage formula: base × (1 + additive bonuses) × multiplicative bonuses; crit applied last. Keep a single documented formula.
- Hit feedback: hit-stop duration, screen shake, knockback, damage numbers, enemy flash and death animation, all tunable per weapon.
- Status effects: burn, freeze, slow, poison (decide which are in v1) with stacking and duration rules.
- Targeting rules: nearest, with priority overrides and an attack-direction indicator so the player can read where swings land.
- Weapon slots, swapping at chests, and weapon evolution requirements.
- Performance limit: maximum simultaneous hitboxes and projectiles.

**To describe in follow-up docs:** weapon catalog with numeric tables, damage formula document, status effect spec, hit-feel tuning guide, targeting and priority spec, hitbox and collision shape definitions.

## 7. Enemies, special monsters and bosses

Enemies are built from archetypes. A theme pack skins them (thorn-vine chasers in the garden, skeletons in a dungeon) without changing behavior code.

| Archetype | Behavior | Threat it creates | Counter |
| --- | --- | --- | --- |
| Chaser | Walks straight at the hero in swarms | Crowd pressure | Area weapons |
| Dasher | Telegraphs, then charges in a line | Burst damage | Dash timing |
| Spitter | Keeps distance and fires slow shots | Pressure while kiting | Close the gap, dash |
| Brute | Slow, high health, high knockback | Blocks space | Focus damage |
| Splitter | Breaks into smaller enemies on death | Swarm growth | Pierce and area |
| Shielded | Blocks hits from the front | Needs positioning | Flank or projectile |

**Special monsters.** A visibly marked monster (glow plus an off-screen arrow) appears every 45 to 60 seconds. Killing it is optional but rewarding. Drops: a rare card choice or a one-time power-up. Each is a themed variant of an archetype with a modifier (a fleeing golden beast, a charging giant, a monster that spawns minions).

**One-time power-ups (held, used on demand):** shield (absorb a hit or a short duration), freeze (stop enemies for about 3 seconds), fire breath (short cone attack). Candidates for later: magnet, time slow, bomb. Hold limit of one or two.

**Bosses.** A mini-boss in the middle and a final boss per biome, each with 2 to 3 telegraphed phases, an arena rule (for example shrinking safe zone), and a guaranteed reward.

**Spawn and wave rules to decide:** spawn by distance from the hero (never by screen edge, so orientation does not change difficulty), maximum active enemies (about 150 to 250), spawn rate curve per minute, elite chance, enemy scaling by time and difficulty tier, despawn rules for enemies far offscreen, and a repeat-protection rule so special monsters rotate.

**To describe in follow-up docs:** enemy bestiary with stats and AI states, wave script format and per-minute tables, special monster and power-up catalog, boss design docs with phase diagrams, spawn-system spec.

## 8. In-run progression and cards

The level-up card choice is the heart of the roguelite layer. Each card is a data entry with tags, so effects combine without hand-written interactions.

**XP and levels.** Enemies drop XP gems that the hero collects within a pickup radius. The XP curve is front-loaded: levels 1 to 3 arrive within about 40 seconds, then spacing widens to 25 to 40 seconds. A run reaches roughly level 10 to 14.

**Card types**

| Type | Examples | Purpose |
| --- | --- | --- |
| Stat | Wider swing, faster swing, more damage, move speed, pickup radius | Reliable growth |
| Behavior | Swing twice, swing leaves a trail, kills cause small explosions, dash damages enemies | Build-defining |
| Synergy | Slash weapons also pierce, area damage heals on kill, crits spawn a second arc | Combos through tags |
| Weapon | New weapon or weapon level-up | Variety and power |
| Risk and reward | More damage but less health, more XP but faster enemies | Player agency |
| Evolution | Maxed weapon plus required passive becomes an upgraded form | Long-term planning |

**Rules to decide**

- Three cards offered per level-up; rarity tiers (common, uncommon, rare, legendary) weighted by luck stat.
- One free reroll per run; further rerolls cost a rewarded ad (see section 12). Banish or skip options are candidates.
- Pool rules: no duplicate offers, max level per card, slot limits, and anti-frustration logic (guarantee a useful card after several weak offers).
- Chest and special-monster rewards: guaranteed rare card or power-up.
- Card text format: short, numeric, and readable in one glance; icons for tags.
- Target launch content: about 30 cards, 3 to 4 weapon shapes plus variants, 3 power-ups, 4 evolutions.

**To describe in follow-up docs:** full card catalog with numbers, XP curve table, rarity weights, tag and synergy matrix, evolution recipes, reroll and banish rules, card UI spec.

## 9. Style rank and scoring

A live rank meter, in the spirit of Devil May Cry, rewards aggressive and varied play. The rank climbs D, C, B, A, S, SS, SSS, and the current rank multiplies both score and currency. This creates the central tension of the game: survive, or play with style.

**Meter mechanics**

| Event | Effect on style points | Notes |
| --- | --- | --- |
| Kill within a streak window | Gain, growing with streak length | Window length is a tuning value |
| Dash through enemies | Gain | Encourages risky movement |
| Using different weapons or skills in a short span | Bonus | Anti-spam variety reward |
| Killing a special monster | Large gain | Event reward |
| No damage taken for a period | Slow passive gain | Rewards clean play |
| Taking damage | Rank drop | Severity tuned per hit |
| Idle without kills | Decay | Prevents passive farming |
| Repeating the same action over and over | Reduced gain | Anti-exploit rule |

**Scoring**

- Run score = sum of kill points × rank multiplier at the time, plus time, boss and no-hit bonuses.
- Rank also scales end-of-run currency, so style pays off in the meta layer.
- End-of-run summary shows peak rank, time spent in each rank, best streak, and a personal-best delta.

**Presentation.** A large letter with a decaying bar, a screen-edge glow, a short audio sting on rank-up, and a distinct sound on rank loss. It must stay readable on small screens and not hide gameplay.

**Decisions to make:** thresholds per rank, decay speed per difficulty tier, whether rank carries across bosses, whether curses change rules, and how the daily leaderboard ranks scores.

**To describe in follow-up docs:** rank rules spec with numeric tables, score formula, presentation and audio spec, anti-exploit review, leaderboard integration notes.

## 10. Meta-progression and store

Meta-progression turns every run, even a failed one, into permanent progress. The first purchase must be affordable after one or two runs so the player feels progress immediately.

**Currencies (to finalize)**

| Currency | Earned from | Spent on |
| --- | --- | --- |
| Coins (soft) | Every run, scaled by time, rank and boss kills | Professions, trinkets, weapons, base perks |
| Gems or seeds (rare soft) | Bosses, quests, first-time achievements | Persona unlocks, special loadout slots |
| Ad tokens&#32; | Rewarded ads, tracked per day | Revive, reroll, skin unlocks |

**Store catalog**

- **Professions:** unlock new playstyles.
- **Weapons:** unlock additional starting or chest weapons.
- **Trinkets (equipped before a run, 2 to 3 slots):** small always-on modifiers such as larger pickup radius, a free first reroll, or a blocked first hit.
- **Buffs:** temporary or run-start boosts for late game.
- **Curses and debuffs (optional difficulty modifiers):** for example faster enemies, no healing drops, or a smaller swing area, in exchange for a reward multiplier. This is the late-game difficulty ladder and is unlocked after a few boss kills.
- **Personas:** cosmetic unlocks, some tied to ads or milestones.

**Considerations**

- Price curve and diminishing returns so long-term players still have goals.
- Loadout screen: persona, profession, weapon, trinkets and curses chosen in one quick flow (maximum two taps to start a run).
- Refund or respec rules, and an "up next" suggestion that always shows an affordable goal within one to two runs.
- Curse stacking rules and a combined reward-multiplier cap.
- Save data versioning and migration, and cheat resistance for local saves.
- No real-money purchases assumed; verify platform policy before adding any.

**To describe in follow-up docs:** economy spreadsheet (income per run versus prices), store item catalog, loadout flow and screens, curse and buff catalog with multipliers, save schema, unlock tree.

## 11. Retention systems

Retention is designed in from the start rather than added later. Each system gives a different reason to return: tomorrow, this week, or this season.

| System | Cadence | What it does | Open questions |
| --- | --- | --- | --- |
| Daily seeded run | Every 24 hours | Same waves and card pool for everyone, one scored attempt plus unlimited practice | Server-less seed from date; leaderboard source |
| Quests | 3 per day, rotating | Short goals such as "defeat 100 enemies with the sword" paying currency | Quest pool size, reroll rules |
| Weapon and profession mastery | Long-term | Using a weapon unlocks evolutions and cosmetic variants | Mastery levels and rewards |
| Achievements | Long-term | Milestones that unlock personas and titles | List and rarity |
| Streak bonus | Daily | Small reward for consecutive days | Forgiveness rules so a missed day is not punishing |
| Seasonal or event packs | Monthly or seasonal | Limited theme overlays, special monsters, cosmetics | Content cost and calendar |
| Near-miss feedback | Every death | Messages like "boss had 8 percent health left" and personal-best deltas | Message library |
| Leaderboards and sharing | Daily and all-time | Friendly competition, share cards | Platform support, anti-cheat |

**Considerations**

- First-session experience determines retention: a 3-run onboarding plan with an early unlock.
- Return triggers inside the platform (notifications or surfaced content) depend on what the platform allows.
- Avoid dark patterns: no punishing streak loss, no fake urgency.

**To describe in follow-up docs:** retention loop diagram, first-time user experience script, daily seed spec, quest catalog, achievement list, live-ops calendar and content plan.

## 12. Monetization and ads

The design uses player-initiated rewarded ads only, and never shows an ad unprompted. The biggest risk is platform policy: YouTube Playables rules on ads and purchases must be verified before this section is final. All ad logic goes through a `Monetization` interface so each build target can implement it differently.

| Placement | Reward | Limit | Fallback if ads are unavailable |
| --- | --- | --- | --- |
| Revive | Continue about 10 seconds with 3 seconds of invulnerability | One per run | Spend coins or gems, or disable |
| Card reroll | Reroll the offered cards | One free per run, extra by ad | Spend coins |
| Skin unlock | Progress pip toward a cosmetic (for example 3 views) | Daily cap | Earn through milestones |
| Double rewards | Double end-of-run coins | Once per run | Disable |

**Design rules**

- Offer revive before the death screen so it feels like a rescue, not a gate.
- The free reroll and the free first run experience are never hidden behind ads.
- Cap total ads per session and per day.
- The ad button always shows exactly what is gained.

**Implementation notes**

- Interface: `isAdAvailable(placement)`, `showRewardedAd(placement) → rewarded or not`, `grantReward(placement)`.
- Implementations: YouTube Playables SDK (if permitted), web portal SDKs, and a dev mock. The game must pause audio and simulation while an ad shows and resume cleanly.
- Soft currency only; any real-money purchases require a separate policy check and design pass.

**To describe in follow-up docs:** monetization policy review, placement and frequency spec, ad provider integration plan, fallback economy design, compliance checklist (children's content and data rules).

## 13. Theme, art and audio

The core game is theme-agnostic. A **theme pack** maps visuals, names and sounds onto the same archetypes and systems, so a second theme later costs content, not code. The first theme is the **mystic garden** (soft palette, thorn-vines, spore spitters, moss golems, blooming effects); a dungeon pack follows as proof that the structure works.

**Theme pack contents**

- Sprite atlas and animation sets for hero personas, enemies, bosses, props and effects.
- Palette and tile or ground set, background parallax layers.
- Names and flavor text for weapons, cards and enemies (string tables).
- Sound effects set and music loop.
- Mapping file: archetype to sprite, weapon to visual effect.

**Art direction decisions**

- Style: stylized flat shapes with bold outlines, low detail, high readability; one limited palette per theme.
- Resolution and scale rules: fixed logical size, sprite sizes, pixel art vs vector, texture atlas budget.
- Readability first: enemy silhouettes distinct at small size, projectile and telegraph colors consistent, player always clearly visible.
- Animation budget per sprite (frames, states) and an effects library (hit sparks, rank-up glow, level-up burst).
- AI-assisted asset pipeline: one locked prompt template and palette so generated sprites stay consistent, then manual cleanup and atlas packing.

**Audio**

- Short synthesized or heavily compressed effects, one looping music track per theme, optional adaptive intensity layer by rank.
- Mute on focus loss, separate music and effect volume, platform audio-start rules (audio only after first interaction).

**To describe in follow-up docs:** art bible, style guide and palette, asset specification and size budgets, animation list, theme pack format spec, audio design document, AI asset pipeline guide.

## 14. UI, UX and responsive layout

The world is rendered at a fixed logical scale and the camera shows a fixed visible radius around the hero along the shorter screen side. Portrait therefore shows more vertical space, landscape more horizontal space, and enemy pressure stays equivalent because spawns depend on distance from the hero, not on screen edges.

| Aspect | Playfield | HUD placement | Notes |
| --- | --- | --- | --- |
| Portrait (about 9:16) | Full height, extra vertical look-ahead | Rank and score top, power-up slots and pause at bottom corners | Primary design target |
| Square (about 1:1) | Reduced extra view | Compact top bar, slots in corners | Verify first-minute readability |
| Landscape (16:9 and wider) | Extra horizontal view, capped to avoid easier play | Rank and score to one side, slots opposite side | Optional decorative side panels; cap extra view to keep difficulty equal |

**Screens and flows**

1. Boot and first-interaction screen (audio unlock), then straight to a one-tap play.
2. Home: play button, loadout summary, daily seed, quests, store entry.
3. Loadout: persona, profession, weapon, trinkets, curses (two taps to start).
4. In-run HUD: health, XP bar, level, timer, rank meter, score, held power-ups, pause.
5. Level-up card selection with pause, reroll button, and clear tag icons.
6. Death or victory: revive offer, score summary, near-miss message, currency earned, rewards, one-tap restart.
7. Store, quests, achievements, settings, credits.

**UX considerations:** safe areas and notches, thumb reach zones, tutorial through play instead of text, loading in under a few seconds, state restoration after interruption, readable font sizes on small phones, and clear affordances for ad-gated actions.

**To describe in follow-up docs:** wireframes for every screen, layout rules per aspect ratio with breakpoints, UI style guide and component library, HUD spec, onboarding and tutorial flow, settings list.

## 15. Technical architecture

The stack is TypeScript with a small 2D renderer, a fixed-timestep simulation separated from rendering, and all content loaded from data. Framework choice is a decision for the prototype phase, based on bundle size and measured performance on a low-end phone.

| Area | Working choice | Alternatives and open decisions |
| --- | --- | --- |
| Language and build | TypeScript, Vite, single minified bundle | Tree-shaking budget, asset hashing |
| Renderer | PixiJS (small, fast sprite batching) | Kaplay or plain Canvas 2D if smaller; Phaser 3 if size budget allows |
| Game loop | Fixed-timestep simulation, interpolated rendering | Step rate (for example 60 Hz), slow-device behavior |
| Entity model | Lightweight entity-component with typed arrays or pooled objects | Plain objects vs ECS library |
| Memory | Object pools for enemies, gems, projectiles, damage numbers | Pool sizes, allocation audits |
| Collision | Spatial hash grid, circle colliders | Cell size, query budget |
| Randomness | Seeded RNG with separate streams (spawns, cards, drops, cosmetic) | Algorithm choice, replay and daily seed support |
| Data | JSON for weapons, cards, enemies, waves, professions, trinkets, curses | Schema validation, hot reload in dev |
| Save | Versioned save object via platform SDK or local storage | Migration, cloud sync availability |
| Platform layer | Adapter interface (YouTube SDK, web portal, dev mock) | Lifecycle events: pause, resume, audio, score reporting |
| Audio | WebAudio with a few compressed files or synthesis | Decode cost, start-up unlock |
| Assets | Atlas packing, lazy loading after first interaction | Compression formats, size budget |

**Module outline (suggested):** core (loop, time, RNG), input, world (entities, spawn, collision), combat (weapons, damage, status), progression (XP, cards, evolutions), meta (save, store, quests), ui, platform (SDK adapters, monetization), content (data loaders, theme packs), analytics, tools (balance and debug).

**Performance budgets to set:** 60 FPS target on a mid-range phone, 30 FPS floor on a low-end device, maximum draw calls, maximum active entities, bundle size and memory ceiling, and cold-start time.

**To describe in follow-up docs:** technical design document, module and data-flow diagram, framework evaluation report with benchmark results, data schema reference, platform adapter spec, build and release pipeline, debug tools plan.

## 16. Data model and content pipeline

Every gameplay element is data, so balancing and new content never require code changes. Each table needs a documented schema, validation rules and an owner file.

| Data table | Key fields (draft) |
| --- | --- |
| personas | id, name, sprite set, palette, unlock rule, flavor text |
| professions | id, starting weapon, dash type, passive, base stats, card pool weights, unlock rule |
| weapons | id, shape, damage, cooldown, area, reach, knockback, tags, levels, evolution requirement |
| cards | id, type, rarity, tags, effects, max level, prerequisites, text key, icon |
| enemies | id, archetype, stats, behavior parameters, drops, sprite mapping |
| special\_monsters | id, base enemy, modifier, reward table, spawn rules |
| powerups | id, effect, duration, trigger, hold rules |
| waves | time ranges, spawn tables, caps, elite chance, boss events |
| rank\_rules | events, point values, decay, thresholds, multipliers |
| trinkets and curses | id, effect, price, reward multiplier, unlock rule |
| quests and achievements | id, goal, counter event, reward |
| themes | id, atlas, palette, sound set, string table, archetype mapping |
| save\_data | version, currencies, unlocks, loadout, best scores, quest progress, settings |

**Pipeline considerations**

- JSON schema validation at build time, with clear error messages.
- An effect system (small set of effect types composed through data) so cards can be authored without scripting.
- Balance spreadsheets as the source of truth, exported to JSON by script.
- AI-assisted content: generate card text, enemy stats and quest lists from templates, then review by hand; keep a style guide so naming and text stay consistent.
- Localization: all player-facing text in string tables with keys.
- Debug and cheat panel for testing unlocks, forcing special monsters and fast-forwarding runs.

**To describe in follow-up docs:** data schema reference, effect system spec, balance spreadsheet structure, content authoring guide, localization workflow, save migration plan.

## 17. Analytics, balance and QA

A short-session game lives or dies on its first minutes, so measurement and balance tooling are planned before content.

**Analytics events to define (subject to platform privacy rules)**

- Session start and end, run start and end (cause of death, time, level, rank, score).
- Card offered, chosen, rerolled; weapons and professions used; build outcomes.
- Time to first level-up, quits before first level-up, ad offered, ad accepted, revive used.
- Quest completion, store purchases, unlock progress, daily seed participation.

**Balance approach**

- Target curves for XP per minute, enemy count, enemy health and damage per minute, written down and compared to telemetry.
- Automated simulation: bots playing with scripted strategies to find dominant builds and impossible spikes.
- Win-rate targets by difficulty tier and by profession; no card or weapon above a set pick-rate threshold.
- Economy simulation: coins per run versus unlock prices to check time to each unlock.

**QA scope**

| Area | Checks |
| --- | --- |
| Devices | Low-end Android, mid-range phone, iPhone, tablet, desktop, TV browser if in scope |
| Orientations | Portrait, square, landscape; rotation mid-run; window resize |
| Interruptions | Tab hidden, call, app switch, ad playing, pause and resume, audio focus |
| Performance | Frame rate with maximum enemies, memory growth over repeated runs, battery use |
| Saves | Corrupt save, version upgrade, cleared storage, offline play |
| Accessibility | Reduced motion, colorblind palettes, readable text |
| Policy | Platform certification checklist, content rating, ad behavior |

**To describe in follow-up docs:** analytics plan and event dictionary, balance targets sheet, simulation tool spec, test plan and device matrix, performance budget report, launch certification checklist.

## 18. Production plan, risks and open questions

The project is built solo with AI tools, so scope is controlled by milestones that each end in a playable build and a go or no-go decision.

| Milestone | Scope | Exit criterion |
| --- | --- | --- |
| M0 Preproduction | Platform requirements check, framework benchmark, comparable-game teardown | Framework and constraints decided |
| M1 Core feel | Drag movement, auto-swing, one enemy type, XP gems, level-up with placeholder art | Fun for 3 minutes without any meta |
| M2 Build layer | Card system, 10 cards, 3 weapon shapes, rank meter | Different builds feel different |
| M3 Content | 5 enemy archetypes, special monsters, power-ups, mini-boss and boss, wave script | Full run completes in 4 minutes |
| M4 Meta | Currency, 2 professions, store, trinkets, save, loadout | Reason to play a second run |
| M5 Retention and monetization | Daily seed, quests, ad abstraction, curses | Return loops testable |
| M6 Polish and platform | Juice, art pass, audio, accessibility, performance, certification | Submission-ready build |
| M7 Soft launch and live ops | Analytics review, balance patches, first content update | Retention targets reviewed |

**AI-assisted workflow:** use AI for boilerplate code, sprite generation under a locked style template, JSON content and card text, and balance spreadsheets. Hand-tune game feel (hit-stop, swing timing, first-minute pacing) and review all generated content for consistency and rights.

**Risks and mitigations**

| Risk | Mitigation |
| --- | --- |
| Platform rules on ads, size or SDK change or block design | Early policy check, monetization abstraction, small bundle |
| Scope creep from many systems | Milestone gates, cut list, ship M1 to M4 first |
| Core loop not fun enough | Prototype first, kill or pivot at M1 |
| Performance on low-end phones | Early benchmarking, entity caps, pooling |
| Art inconsistency from generated assets | Locked prompts and palette, manual cleanup pass |
| Balance snowballs with many synergies | Simulation tooling, pick-rate caps |
| Rights and licensing of generated or third-party assets | Asset log, license review before release |

**Open questions to answer early:** final title and brand, one hero or several at launch, first theme confirmation, run length (timer vs boss-gated), ad policy on target platform, cloud save and leaderboard availability, and whether PWA or portal releases follow the first launch.

**To describe in follow-up docs:** production schedule and task breakdown, risk register, cut list, tool and licensing inventory, release plan.

## 19. Follow-up documents and pre-development checklist

This index lists every document that grows out of this one, in the order they should be written. Each row says what the document must settle before development of that area begins.

| # | Document | Source section | Must settle | Needed by |
| --- | --- | --- | --- | --- |
| 1 | Platform requirements and policy review | 2, 12 | Size and SDK limits, ad and purchase rules, certification steps | M0 |
| 2 | Framework evaluation and technical design | 15 | Renderer, loop, entity model, performance budgets | M0 |
| 3 | Core feel and controls spec | 3, 4 | Input thresholds, movement, dash, hit feel targets | M1 |
| 4 | Combat, weapon and damage spec | 6 | Shapes, formulas, status effects, targeting | M1 |
| 5 | Card, progression and synergy catalog | 8 | Card list, rarity, tag matrix, evolutions | M2 |
| 6 | Rank and scoring spec | 9 | Rules, thresholds, decay, presentation | M2 |
| 7 | Enemy, boss and wave design | 7 | Bestiary, wave scripts, boss phases | M3 |
| 8 | Hero, profession and persona design | 5 | Stats, kits, unlock rules | M4 |
| 9 | Economy and store design | 10 | Currencies, prices, curse and trinket catalog | M4 |
| 10 | Data schema and save spec | 16 | Schemas, effect system, save migration | M1 to M4 |
| 11 | UI and UX specification | 14 | Wireframes, layouts per aspect, HUD, onboarding | M2 |
| 12 | Art bible and theme pack spec | 13 | Style, palette, asset specs, pipeline | M2 |
| 13 | Audio design | 13 | Sound list, music, implementation rules | M6 |
| 14 | Retention and live-ops plan | 11 | Daily seed, quests, events, calendar | M5 |
| 15 | Monetization implementation plan | 12 | Placements, frequency, fallbacks | M5 |
| 16 | Analytics and balance plan | 17 | Event dictionary, targets, simulation tool | M2 |
| 17 | QA and release plan | 17, 18 | Device matrix, test plan, launch checklist | M6 |
| 18 | Production schedule and risk register | 18 | Task breakdown, cut list, risks | M0 |

**Pre-development checklist** (tick when decided)

- [ ] Target platform rules read and constraints written down (size, SDK, ads, purchases)
- [ ] Working title and brand direction chosen
- [ ] First theme confirmed (mystic garden) and art style approved
- [ ] Framework chosen after a benchmark on a low-end phone
- [ ] Core loop prototype plan agreed with a kill or pivot criterion
- [ ] Run length model decided (timer or boss-gated)
- [ ] Controls scheme and dash rules fixed
- [ ] Damage formula and stat list fixed
- [ ] Card and effect data model fixed
- [ ] Rank meter rules drafted
- [ ] Economy first pass done in a spreadsheet
- [ ] Save schema and versioning approach defined
- [ ] Monetization abstraction and fallbacks defined
- [ ] Analytics events listed and privacy rules checked
- [ ] Aspect-ratio rules and camera policy fixed
- [ ] Asset pipeline with locked prompts and palette tested
- [ ] Performance budgets set (frame rate, entities, bundle size, memory)
- [ ] Accessibility options listed
- [ ] Localization approach decided
- [ ] Rights and licensing log started for all assets and tools
- [ ] Milestone plan and cut list approved
