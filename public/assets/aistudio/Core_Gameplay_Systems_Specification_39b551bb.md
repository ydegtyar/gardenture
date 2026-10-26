# Core Gameplay Systems Specification

Oct 23, 2026 · @Yuriy

## 1. Purpose, scope and conventions

This document turns the Game Design Document into concrete, testable rules for the moment-to-moment game: movement, dash, combat, enemies, waves, cards, rank and game feel. It is the first spec to read before writing prototype code (milestone M1 to M3). Every number here is a **starting value to be tuned in the prototype**, not a final decision; each section ends with the levers that are safe to change.

**Out of scope here:** meta-progression, store economy, monetization, art direction, platform SDK. Those have their own documents (see GDD section 19).

**Conventions**

| Term | Meaning |
| --- | --- |
| u (world unit) | One world unit. The hero is 1.0 u wide; a basic enemy is 0.8 to 1.0 u. All distances, ranges and speeds use u. |
| s | Seconds of simulation time (not wall-clock time; paused time does not count). |
| tick | One fixed simulation step, 1/60 s. |
| \[T\] | Tunable starting value. Safe to change during balance. |
| \[F\] | Fixed rule. Changing it needs a design discussion because other systems depend on it. |
| Tag | A label on weapons, cards and enemies (for example slash, area, fire) used to make synergies work through data. |

**Reading order:** sections 2 to 5 define how the hero moves and attacks, 6 to 7 how damage works, 8 to 9 what opposes the hero, 10 to 12 how the build grows, 13 to 14 how the player is rewarded and how it feels, and 15 how to test it all.

## 2. World, camera and time

**World.** An open 2D plane with no hard edges in v1 (the camera follows the hero; the ground is a repeating tile). Optional soft boundary at 40 u from the start point so the hero cannot wander forever \[T\]. Top-down view with slight perspective faked by sprite sorting by Y.

**Time.** Fixed timestep of 1/60 s \[F\]. Rendering interpolates between ticks. If a frame takes too long, up to 5 ticks are caught up, then the simulation slows rather than spiraling \[F\]. All timers and cooldowns are counted in ticks or seconds of simulation time, never wall-clock, so pause and tab switches are safe.

**Camera.** Centered on the hero with a small look-ahead in the movement direction (0.8 u, smoothed over 0.25 s) \[T\]. The visible area is defined by the **shorter screen side**, so the same fight is seen in every orientation:

| Aspect | Visible short side | Visible long side (cap) | Notes |
| --- | --- | --- | --- |
| Portrait 9:16 | 9 u wide | 16 u tall (about 1.78x) | Primary target |
| Portrait 9:19.5 (tall phones) | 9 u wide | capped at 18 u tall | Extra height shows decoration only |
| Square 1:1 | 11 u | 11 u | Slightly wider so the hero has room |
| Landscape 16:9 | 9 u tall | capped at 14 u wide | Beyond 14 u wide, add decorative side panels |
| Ultra-wide | 9 u tall | capped at 14 u wide | Never show more play space than the cap |

The caps keep difficulty equal: no orientation lets the player see danger much earlier than another. Enemies spawn by distance from the hero (section 9), not by screen edge.

**Depth sorting and layers (back to front):** ground, ground decals, gems and pickups, enemy shadows, enemies and hero (sorted by Y), weapon effects, projectiles, damage numbers, screen overlays, HUD.

**Pause rules \[F\]:** the simulation pauses on level-up card selection, menu, ad, tab hidden and platform pause events; resuming starts with a 1-second visible countdown or ring so the player can re-orient.

**Tuning levers:** visible short side (smaller makes the game feel more intense), look-ahead distance, soft boundary radius, catch-up tick limit.

## 3. Input and movement

Movement uses a **floating joystick**: the point where the first finger lands becomes the joystick center, and the drag vector from that point sets the direction and speed. Lifting the finger stops the hero (with a short slide).

**Joystick parameters**

| Parameter | Value | Notes |
| --- | --- | --- |
| Dead zone | 8 px or 0.5 mm equivalent, whichever is larger \[T\] | Prevents jitter from a resting thumb |
| Max radius | 56 px at 1x density, scaled by device pixel ratio \[T\] | Distance at which speed reaches maximum |
| Speed curve | speed = maxSpeed × smoothstep(deadZone, maxRadius, distance) \[T\] | Gentle near center, full at edge |
| Center re-anchor | If the finger drags beyond 1.6 × max radius, the center follows the finger \[T\] | Keeps control comfortable on small phones |
| Allowed touch area | Whole screen except HUD buttons \[F\] | Never fixed screen regions |
| Second finger | Ignored for movement; a tap on a power-up slot is allowed \[F\] | Prevents accidental double joysticks |

**Hero movement**

| Parameter | Base value | Notes |
| --- | --- | --- |
| Max speed | 4.0 u/s \[T\] | Crossing the 9 u view takes about 2.2 s |
| Acceleration | 30 u/s² (reaches full speed in about 0.13 s) \[T\] | Snappy but not instant |
| Deceleration on release | 24 u/s² \[T\] | A short slide helps stop at precise points |
| Turn behavior | Direct velocity change, no turning radius \[F\] | Keeps control one-thumb simple |
| Facing | Faces movement direction; during a swing, faces the target \[T\] | Readable attack direction |
| Body radius (collision) | 0.35 u \[T\] | Smaller than the sprite so hits feel fair |
| Pickup radius | 1.5 u base \[T\] | Increased by stats and cards |

**Collision with the world.** In v1 the hero collides only with the soft boundary and optional large obstacles (none in launch version). Enemies push the hero slightly on overlap (soft collision, 0.3 u/s per overlapping enemy up to a limit) so being swarmed feels dangerous without hard-locking the player \[T\].

**Desktop input mapping:** WASD or arrows give a fixed-magnitude direction vector with the same acceleration curve; mouse drag behaves like touch.

**Tuning levers:** max speed (affects kiting power directly), dead zone and max radius (feel on different phone sizes), soft push strength.

## 4. Dash

The dash is the second verb of the game and the source of its skill expression. It is triggered by a **flick** while the finger is already dragging, so it never needs a second control.

**Flick detection**

| Parameter | Value | Notes |
| --- | --- | --- |
| Flick window | The last 90 ms of finger movement \[T\] | Measured on touch move events |
| Flick speed threshold | 900 px/s at 1x density, scaled by pixel ratio \[T\] | Must exceed this speed over the window |
| Flick distance minimum | 24 px \[T\] | Prevents small jitters from triggering |
| Direction | Direction of the flick, not the joystick vector \[F\] | The flick can differ from the walking direction |
| Input buffer | If the dash is on cooldown, a flick within the last 0.15 s before it is ready still triggers it \[T\] | Forgiveness |
| Mouse and keyboard | Fast mouse drag, or Space key (dash toward current movement direction) \[T\] |  |

A flick that is too slow is treated as normal movement. Tuning must be done on real phones of different sizes; the thresholds use millimeters where possible to stay consistent across screens.

**Dash parameters**

| Parameter | Base value | Notes |
| --- | --- | --- |
| Distance | 2.6 u \[T\] | About 0.65 s of walking |
| Duration | 0.14 s \[T\] | Fast, readable motion |
| Cooldown | 2.5 s \[T\] | Shown as a ring around the hero |
| Invulnerability | During the dash plus 0.10 s after \[T\] | Grants dodge utility |
| Control during dash | None; commits to the direction \[F\] | Creates risk and timing |
| Damage to enemies passed through | None by default; profession and cards can add \[T\] | Warden: thorn burst at the end |
| Charges | 1 base; cards can add a second charge \[T\] |  |
| Passing through enemies | Allowed (no collision during the dash) \[F\] |  |

**Dash profession variants**

- **Warden:** thorn burst at the end point, 40% weapon damage in a 1.5 u radius.
- **Seeker:** leaves a seed trap at the starting point that damages enemies for 3 s.
- **Herbalist:** a short heal pulse that restores a small amount of health and clears slow.
- **Stormcaller:** teleports through enemies and damages each one passed for 30% weapon damage.

**Feedback:** short motion trail, brief sound, ring refill chime when ready, subtle screen punch on arrival. If a dash dodges a hit, a visible "perfect dodge" spark gives style points (section 13).

**Tuning levers:** cooldown (the strongest lever on difficulty and style), distance, invulnerability duration, flick thresholds.

## 5. Auto-targeting and attack resolution

The hero never aims. Each weapon runs its own cooldown and, when ready, picks a target and fires. This section defines exactly what happens each tick so behavior is deterministic and testable.

**Target selection (per weapon, when its cooldown completes)**

1. Collect living enemies within the weapon's **acquire range** (weapon reach + 1.0 u) \[T\].
2. Apply priority: special monsters and bosses first when within range, then the nearest enemy; ties broken by lowest current health, then lowest enemy id \[T\].
3. If no target exists, the weapon waits and checks again each tick (no cooldown is spent).
4. The attack direction is locked to the target's position at the moment of firing (no tracking during the swing) \[F\]. This makes enemy dodging and the player's positioning meaningful.

**Attack lifecycle**

| Phase | Description | Typical duration |
| --- | --- | --- |
| Wind-up | Visual anticipation, no damage yet | 0.05 to 0.12 s \[T\] |
| Active | Hitbox exists and can damage; each enemy is hit at most once per swing (unless a card says otherwise) \[F\] | 0.08 to 0.20 s \[T\] |
| Recovery | Visual follow-through; cooldown timer already running \[T\] | 0.05 to 0.15 s |

The cooldown starts at the beginning of the active phase and runs in parallel with recovery. A weapon cannot start a new swing while its previous one is still in wind-up or active.

**Hit detection order each tick**

1. Move all entities (hero, enemies, projectiles).
2. Rebuild the spatial hash (cell size 2 u \[T\]).
3. Weapons update: tick cooldowns, acquire targets, spawn hitboxes.
4. Resolve hitboxes against enemies (shape tests: arc, line, circle). Apply damage, knockback, status and on-hit effects in a fixed order.
5. Resolve enemy attacks and contact damage against the hero.
6. Process deaths: drops, on-kill effects, rank events.
7. Spawn new entities (waves, children of splitters, effect spawns).

**Hit rules \[F\]**

- A hitbox damages an enemy once per swing; knockback and status are applied in the same step.
- Enemies have a brief hit flash of 0.08 s and a damage-number popup.
- Contact damage on the hero has an invulnerability window of 0.5 s after each hit \[T\] so being surrounded does not cause instant death.
- Overkill damage is discarded; on-kill effects trigger exactly once per enemy.

**Edge cases to handle:** two weapons target the same enemy and kill it in the same tick (first in fixed weapon order gets the kill credit); a target dies during wind-up (the swing continues in its locked direction); a target is beyond reach at the active phase (the swing may miss, which is allowed and visible).

**Tuning levers:** acquire range padding, wind-up lengths, priority rules, hit-invulnerability window.

## 6. Stats and damage formulas

One consistent stacking model keeps balance predictable: every stat is **base × (1 + sum of additive bonuses) × product of multiplicative bonuses** \[F\]. Cards are labeled additive ("+20%") or multiplicative ("×1.5"); the default is additive so power grows gently, and multiplicative effects are rare and expensive.

**Hero stats (launch Warden values)**

| Stat | Base | Notes |
| --- | --- | --- |
| Max health | 100 | Heal and damage in whole numbers |
| Health regeneration | 0.0 per s | Cards and Herbalist add some |
| Armor | 0 | Flat damage reduction per hit, minimum 1 damage taken |
| Move speed | 4.0 u/s | Section 3 |
| Damage | 100% | Multiplies weapon base damage |
| Attack speed | 100% | Divides weapon cooldown: cooldown = base / attack speed |
| Area | 100% | Multiplies swing size (arc radius, circle radius, projectile size) |
| Reach | 100% | Multiplies range and projectile travel distance |
| Crit chance | 5% | Capped at 100% |
| Crit damage | 150% | Multiplier on a crit hit |
| Pickup radius | 1.5 u | Gem and drop collection |
| Luck | 0 | Raises rarity weights (section 10) |
| Dash cooldown | 2.5 s | Section 4 |

**Damage formula (per hit)**

```latex
D = B \times (1 + \sum A_d) \times \prod M \times C \times (1 - R_t)
```

In plain terms: weapon base damage B, times one plus the sum of additive damage bonuses, times any multiplicative bonuses, times the crit multiplier C (1.0 on a normal hit, or the crit damage stat on a crit), times one minus the enemy's damage reduction R\_t (shielded front, boss phases). Final damage is rounded up to the nearest whole number, minimum 1.

**Worked example.** A level 3 sword has B = 14. The hero has +20% damage from cards (one additive card) and one ×1.25 multiplicative card. On a normal hit: 14 × 1.2 × 1.25 = 21.0, so 21 damage. On a crit (150%): 21 × 1.5 = 31.5, rounded up to 32. Against a Shielded enemy hit from the front with 50% reduction: 21 × 0.5 = 10.5, rounded up to 11.

**Damage to the hero.** Enemy hit damage minus armor, minimum 1, then subject to the 0.5 s invulnerability window. Health below 30% triggers a visual warning (vignette and heartbeat) \[T\].

**Caps and soft limits \[T\]:** attack speed capped at 300%, crit chance 100%, area 300%, move speed 6.5 u/s, dash cooldown minimum 0.8 s. Caps prevent runaway builds and keep readability.

**Tuning levers:** base health (survivability), crit base values, armor effect, caps.

## 7. Weapons

A weapon is a data entry: a shape, base numbers, tags and a level table. The player carries up to **3 weapons** per run \[T\]. Weapons level from 1 to 8; each level-up card improves one number. At level 8, a weapon can evolve if its required passive is owned (section 11).

**Launch weapon set (level 1 values)**

| Weapon | Shape | Damage | Cooldown | Reach / size | Special | Tags |
| --- | --- | --- | --- | --- | --- | --- |
| Garden Blade (default sword) | Arc, 110 degrees | 12 | 0.90 s | Reach 1.7 u | Knockback 0.6 u | slash |
| Thorn Spear | Line, width 0.5 u | 16 | 1.20 s | Length 2.8 u | Pierces 3 enemies | pierce |
| Bloom Hammer | Circle at target | 20 | 1.80 s | Radius 1.6 u | 0.25 s delay, knockback 1.0 u | area, impact |
| Seed Blades | Projectile, 1 blade | 9 | 1.00 s | Speed 9 u/s, range 5 u | Pierces 1 | projectile, pierce |
| Petal Orbit | Orbit, 2 petals | 5 per hit | Constant | Orbit radius 1.4 u, 140 deg/s | Hits each enemy every 0.4 s | area, nature |

**Level scaling (Garden Blade as the template)**

| Level | Change |
| --- | --- |
| 2 | +20% damage |
| 3 | Arc widens to 135 degrees |
| 4 | Cooldown 0.80 s |
| 5 | +20% damage |
| 6 | Reach 2.1 u |
| 7 | Cooldown 0.70 s |
| 8 | +30% damage and a second back-swing (hits again behind the hero) |

Other weapons follow the same rhythm: alternate between damage, size or count, and cooldown improvements, with a defining change at level 8. Each weapon's table is stored in the data file; there is no weapon-specific code beyond the shape.

**Shape rules**

- **Arc:** a circle sector from the hero center, facing the locked direction. Hits enemies whose circle overlaps the sector.
- **Line:** a capsule from the hero toward the target; pierce count limits how many enemies are damaged, ordered by distance.
- **Circle:** a circle at the target's position at the moment of firing; damage applies after the delay, with a telegraph ring shown to the player.
- **Projectile:** moves in a straight line, damages on overlap, may pierce, return (boomerang) or split depending on data.
- **Orbit:** objects circling the hero; each object has its own hit cooldown per enemy.

**Weapon acquisition:** the default weapon from the profession; additional weapons from level-up cards (weapon cards are about 15% of offers \[T\]) and from chests.

**Balance target:** at the same investment, weapons should differ in *feel*, not in raw power. Rough target: single-target damage per second at level 1 between 9 and 14 per weapon (Garden Blade 13.3, Thorn Spear 13.3, Bloom Hammer 11.1, Seed Blades 9.0, Petal Orbit up to 12.5 per petal in contact), with area, pierce and coverage compensating for the lower numbers.

**Tuning levers:** base damage, cooldowns, per-level changes, weapon slot count, weapon card frequency.

## 8. Enemies

Every enemy is an archetype plus numbers. The AI is a small state machine so behavior is readable and the same code serves every theme.

**Base stats at minute 0 (before time scaling)**

| Archetype | Health | Speed (u/s) | Contact damage | Radius (u) | XP | Behavior |
| --- | --- | --- | --- | --- | --- | --- |
| Chaser | 18 | 2.0 | 6 | 0.40 | 1 | Moves straight at the hero |
| Dasher | 28 | 1.4, dash 7.0 | 12 on dash hit | 0.45 | 2 | Approaches, telegraphs, then charges in a line |
| Spitter | 22 | 1.2 | 4 (projectile 8) | 0.40 | 2 | Keeps 4.5 u away and fires a slow shot |
| Brute | 90 | 1.0 | 14 | 0.70 | 5 | Slow, heavy, large knockback resistance |
| Splitter | 30 | 1.6 | 6 | 0.50 | 2 | On death spawns 2 small Chasers (health 8, speed 2.4) |
| Shielded | 45 | 1.5 | 8 | 0.50 | 3 | Takes 50% less damage from the front arc (120 degrees) |

**AI states**

| Archetype | States and timing |
| --- | --- |
| Chaser | Seek only |
| Dasher | Seek, then at 4.5 u: Telegraph 0.6 s (line and flash), Charge 0.35 s, Recover 0.9 s |
| Spitter | Seek until 4.5 u, Hold and fire every 2.2 s (projectile speed 4.5 u/s, lifetime 2.5 s), retreat if closer than 3 u |
| Brute | Seek; ground-slam telegraph 0.8 s when within 1.4 u, area 1.6 u radius |
| Splitter | Seek; split on death |
| Shielded | Seek while facing the hero; rotation speed limited so flanking works |

**Time scaling.** Enemy health and damage multiply by a scaling factor that grows over the run \[T\]:

```latex
S(t) = 1 + 0.35\,t_{min} + 0.04\,t_{min}^2
```

where t\_min is run time in minutes. At 0 min the factor is 1.00, at 2 min 1.86, at 4 min 3.04. Enemy speed grows only 4% per minute so the player can always outrun the swarm if they play carefully \[T\]. A difficulty tier or curse multiplies this further.

**Telegraph rules \[F\]:** every attack that can deal more than 10 damage has a visible warning of at least 0.5 s, a distinct color (consistently the same for all enemy attacks), and a sound cue. No unavoidable damage.

**Separation:** enemies push each other apart softly to avoid a single stacked blob (separation force tuned so dense swarms form a ring around the hero rather than one pixel). Enemies far from the hero (beyond 18 u) are recycled closer to keep density stable.

**Readability:** each archetype has a unique silhouette and a unique color family; elite versions add a colored outline and 40% more size, and special monsters add a glow and an off-screen arrow.

**Tuning levers:** health and speed per archetype, scaling curve coefficients, telegraph durations, contact damage.

## 9. Wave director

A director system controls enemy flow with a **spawn budget**: each second it earns budget points and spends them on spawn groups chosen from the current time's allowed archetypes. This keeps pressure smooth and makes waves easy to tune with a single table.

**Spawn placement rules \[F\]**

- Spawn on a ring 9 to 11 u from the hero, at a random angle, avoiding the 60-degree cone in the hero's movement direction so enemies do not spawn directly in front \[T\].
- Groups of the same archetype spawn together in a loose cluster (radius 1.5 u).
- If more than the cap is alive, no new spawns until count drops; budget is held (up to 2 seconds of banked budget) \[T\].
- Placement depends only on distance from the hero, so every aspect ratio faces the same pressure.

**Archetype cost (budget points)**

| Archetype | Chaser | Dasher | Spitter | Brute | Splitter | Shielded |
| --- | --- | --- | --- | --- | --- | --- |
| Cost | 1 | 3 | 3 | 8 | 4 | 5 |

**Run script (4-minute run, starting values)**

| Time | Budget per s | Active cap | Allowed archetypes | Elite chance | Events |
| --- | --- | --- | --- | --- | --- |
| 0:00 to 0:20 | 2.0 | 20 | Chaser | 0% | First gems within 5 s |
| 0:20 to 0:45 | 3.0 | 35 | Chaser | 0% | First special monster hint at 0:40 |
| 0:45 to 1:15 | 4.5 | 60 | Chaser, Dasher | 3% | Special monster 1 at 0:50 |
| 1:15 to 1:45 | 6.0 | 90 | Chaser, Dasher, Spitter | 5% | Mini-boss at 1:30 |
| 1:45 to 2:30 | 8.0 | 120 | Chaser, Dasher, Spitter, Splitter | 7% | Special monster 2 at 2:00 |
| 2:30 to 3:15 | 10.0 | 150 | All six | 10% | Special monster 3 at 2:45, curses bite |
| 3:15 to 4:00 | 8.0 (plus boss) | 120 | All six | 10% | Final boss at 3:15, stragglers continue |

**Rules**

- **Elites:** health ×3, damage ×1.5, size ×1.4, guaranteed drop of a gem cluster and a small chance of a power-up \[T\].
- **Group size:** a spawn decision picks an archetype, then spends enough budget for 3 to 8 enemies (fewer for expensive ones).
- **Catch-up mechanic:** if the hero kills faster than expected (kill rate above target), the director adds 15% more budget; if the hero is low on health and not killing, budget drops 15% for up to 10 s \[T\]. This keeps strong and weak players both in a tense zone.
- **Boss time:** at 3:15 the director halves ordinary budget and sets the boss arena rule (section 12).
- **Difficulty tiers and curses** multiply budget, enemy scaling or add rules (more elites, faster enemies).

**Target numbers for sanity checks:** the script above earns about 1,600 budget points over 4 minutes; with a mix weighted toward Chasers (average cost about 2.3) that is roughly 600 to 750 enemies spawned in a full run on tier 1, with 60 to 90 visible at the peak; the hard cap of 150 alive applies in the busiest phase, and builds with strong area damage should clear most waves quickly rather than reach the cap.

**Tuning levers:** budget per second (the main difficulty dial), archetype introduction times, caps, catch-up strength, elite chance.

## 10. XP, levels and card offers

**XP gems.** Enemies drop a gem worth their XP value (section 8). Small gems merge into larger ones when more than 40 are on the ground, to protect performance \[T\]. Gems are attracted to the hero once inside the pickup radius, with a speed that rises from 3 to 12 u/s so collection feels satisfying. A magnet power-up pulls every gem at once.

**XP curve.** The XP needed for the next level is front-loaded so the first choices arrive fast:

| Level | XP to next level | Approx. cumulative time (typical play) |
| --- | --- | --- |
| 1 to 2 | 6 | 0:08 |
| 2 to 3 | 10 | 0:20 |
| 3 to 4 | 16 | 0:38 |
| 4 to 5 | 24 | 0:58 |
| 5 to 6 | 34 | 1:20 |
| 6 to 7 | 46 | 1:45 |
| 7 to 8 | 60 | 2:10 |
| 8 to 9 | 76 | 2:38 |
| 9 to 10 | 94 | 3:08 |
| 10 to 11 | 114 | 3:40 |

A typical run therefore reaches level 10 to 12. XP values drawn from higher enemy tiers and elites keep the curve on target; the table is a first guess to be rebalanced from prototype telemetry. A bonus level-up card is granted on the mini-boss and the boss kill.

**Card offer logic \[F\]**

1. The run pauses and shows 3 cards (4 with a trinket or high luck).
2. Pool filtering: remove cards at max level, cards whose slots are full (for example a fourth weapon), cards with unmet prerequisites, and duplicates in the same offer.
3. Type weights per offer: stat 45%, behavior 25%, weapon (new or upgrade) 15%, synergy 10%, risk and reward 5% \[T\].
4. Rarity weights at luck 0: common 60%, uncommon 28%, rare 10%, legendary 2% \[T\]; each point of luck moves 1.5% from common into the higher tiers.
5. **Pity rules:** after 3 offers with no card above common, the next offer contains one uncommon or better; if no offered card benefits the hero's current weapons (no matching tag), one is replaced by a tag-matching card \[T\].
6. The player taps one card; the effect applies immediately, and the run resumes with a 1-second ring and brief invulnerability (0.8 s) \[T\].

**Reroll and skip.** One free reroll per run; further rerolls cost a rewarded ad (GDD section 12). A banish option (remove a card from the pool for the run) is a later candidate. Skipping is allowed and gives a small heal and 5 coins \[T\] to avoid forced bad choices.

**Slots \[T\]:** 3 weapons, 4 passive cards (stat and behavior cards that take a slot), and unlimited stacking levels of the same card up to its max level.

**Tuning levers:** XP per level, gem values, offer weights, pity thresholds, number of cards offered, slot limits.

## 11. Card catalog v1 and effect schema

Thirty launch cards, each defined by data. Values are per level; most cards stack up to 5 levels \[T\]. Tags drive synergies: a card that says "slash weapons" applies to any weapon carrying the tag.

**Stat cards (12)**

| Card | Rarity | Effect per level |
| --- | --- | --- |
| Sharper Edge | Common | +12% damage |
| Quick Hands | Common | +10% attack speed |
| Wide Swing | Common | +12% area |
| Long Reach | Common | +10% reach |
| Swift Boots | Common | +6% move speed |
| Hardy Bark | Common | +15 max health, heal 15 |
| Magnet Moss | Common | +20% pickup radius |
| Lucky Clover | Uncommon | +10 luck |
| Keen Eye | Uncommon | +5% crit chance, +10% crit damage |
| Iron Bark | Uncommon | +1 armor |
| Regrowth | Uncommon | +0.5 health per second |
| Fleet Step | Uncommon | Dash cooldown -0.2 s |

**Behavior cards (8)**

| Card | Rarity | Effect |
| --- | --- | --- |
| Echo Swing | Rare | Every 4th swing repeats once instantly (3rd level: every 3rd) |
| Thorn Trail | Uncommon | Dashing leaves thorns for 2 s that deal 30% damage per 0.5 s |
| Spore Pop | Uncommon | Kills have a 15% chance to explode for 40% damage in 1.2 u |
| Second Wind | Rare | Once per run, survive lethal damage with 30% health |
| Double Dash | Rare | +1 dash charge |
| Vampiric Bloom | Rare | Heal 1 health per 12 kills (level 1; faster per level) |
| Shockwave | Rare | Every 5th hit sends a 3 u shockwave dealing 50% damage |
| Petal Storm | Uncommon | +1 orbit petal on Petal Orbit; others gain a small orbiting petal |

**Synergy cards (6)**

| Card | Rarity | Requires tag | Effect |
| --- | --- | --- | --- |
| Piercing Slash | Uncommon | slash | Slash attacks also pierce 1 enemy |
| Burning Thorns | Rare | pierce | Pierce hits apply burn (4 per second for 3 s) |
| Healing Bloom | Uncommon | area | Area kills have a 5% chance to drop a healing seed |
| Chain Bloom | Rare | projectile | Projectiles chain to 1 nearby enemy for 60% damage |
| Crit Burst | Rare | any | Critical hits spawn a small damaging arc |
| Frost Touch | Rare | impact | Impact hits slow enemies by 30% for 1.5 s |

**Risk and reward cards (4)**

| Card | Rarity | Upside | Downside |
| --- | --- | --- | --- |
| Glass Blade | Uncommon | +50% damage | -30% max health |
| Greedy Roots | Uncommon | +40% XP from gems | Enemies +10% speed |
| Wild Growth | Rare | +30% area | -15% attack speed |
| Blood Pact | Rare | +25% crit chance | Take 10% more damage |

A further group of **weapon cards** (new weapon or weapon level-up) is generated from the weapon table rather than listed here, and **evolutions** (4 at launch) appear when a weapon reaches level 8 and the required passive is owned, for example Garden Blade plus Sharper Edge becomes the Verdant Edge: swing fires a piercing crescent wave at 60% damage.

**Effect schema (draft).** Effects are small typed records so new cards need no code:

```json
{
  "id": "echo_swing",
  "type": "behavior",
  "rarity": "rare",
  "maxLevel": 3,
  "tags": ["swing", "repeat"],
  "requires": [],
  "effects": [
    {
      "trigger": "onSwing",
      "condition": { "everyN": [4, 3, 2] },
      "action": { "repeatSwing": { "delay": 0.0 } }
    }
  ]
}
```

Supported triggers at launch: onSwing, onHit, onCrit, onKill, onDash, onDamageTaken, onLevelUp, timer. Supported actions: statModify, repeatSwing, spawnArea, spawnProjectile, applyStatus, heal, grantCharge, shield. A synergy card lists required tags; the pool filter checks the hero's current weapon tags.

**Anti-degenerate rules \[F\]:** no card may grant infinite invulnerability, remove the dash cooldown entirely, or exceed stat caps in section 6; multiplicative effects are limited to rare and legendary cards.

**Tuning levers:** per-level values, rarity assignment, max levels, tag requirements, evolution recipes.

## 12. Special monsters, power-ups and bosses

**Special monsters.** Optional, high-value targets that create risk and reward decisions. Three appear per run at 0:50, 2:00 and 2:45 (section 9), each chosen from a rotating pool with no repeat in the same run \[T\].

| Special monster | Based on | Modifier | Behavior hint | Reward |
| --- | --- | --- | --- | --- |
| Golden Beast | Chaser | Health ×8, flees from hero | Runs away at 3.2 u/s, despawns after 12 s | Rare card choice |
| Bloom Giant | Brute | Health ×5, charges every 3 s | Telegraphed straight charge | One-time power-up |
| Brood Mother | Splitter | Spawns 2 Chasers every 2 s | Stays at distance, protected by minions | Uncommon card plus gem burst |
| Mirror Wisp | Spitter | Teleports every 3 s | Fires a fan of 3 shots | One-time power-up plus health seed |

Each has a glow, an off-screen arrow, and a thin health bar; the arrow disappears when the monster despawns. Killing one gives +30 style points (section 13).

**One-time power-ups.** A held item the player triggers with a tap; the hero holds at most 2 \[T\]. If a third is picked up, the oldest is replaced.

| Power-up | Effect | Duration |
| --- | --- | --- |
| Shield | Absorbs the next 40 damage | Until used or 20 s |
| Freeze | All enemies in view are frozen; bosses are slowed by 60% instead | 3 s |
| Fire Breath | Cone of 3.5 u length, 70 degrees, 20 damage per 0.2 s and burn | 2.5 s |
| Magnet | Pulls every gem and drop to the hero | Instant |
| Time Slow (later) | Enemies move at 40% speed | 4 s |

Power-ups also drop at a 3% chance from elites and appear in chests \[T\].

**Chests.** Spawn at the mini-boss kill and boss kill; grant a weapon level-up or a rare card plus coins.

**Mini-boss (1:30).** An enlarged Brute named for the theme, health 500 × S(t), two attacks: ground slam (telegraph 0.9 s, radius 2.0 u, 25 damage) and a charge (telegraph 0.7 s, 18 damage). Drops a chest and a bonus level-up.

**Final boss (3:15).** Health 1,600 × S(t) scaling at 60% \[T\], three phases:

| Phase | Health range | Behavior | Arena rule |
| --- | --- | --- | --- |
| 1 | 100 to 66% | Slow melee slams, summons 6 Chasers every 8 s | None |
| 2 | 66 to 33% | Adds a radial burst of 8 projectiles every 5 s, moves faster | Safe zone slowly shrinks from 8 u to 5 u radius |
| 3 | 33 to 0% | Faster slams, spawns a rotating thorn wall; burst every 3.5 s | Safe zone holds at 5 u; damage taken +20% for the boss |

All boss attacks follow the telegraph rule (section 8). Defeating the boss ends the run with victory, a bonus score, a chest, and the next difficulty tier unlocked. Hitting the 4:30 hard cap without a boss kill ends the run as a timeout with partial rewards \[T\].

**Tuning levers:** special monster health and reward tables, power-up strengths, boss health and phase thresholds, arena radius.

## 13. Rank and score

The rank meter holds **style points (SP)** from 0 to 100 within the current rank. Gaining SP fills the bar; at 100 the rank goes up one step and the bar restarts at 30. The bar drains continuously; at 0 the rank drops one step and the bar restarts at 70. The ranks, from lowest, are D, C, B, A, S, SS, SSS. The run starts at D with 0 SP.

**SP gains and losses (starting values)**

| Event | SP | Notes |
| --- | --- | --- |
| Kill with streak counter 1 to 4 | +2 | Streak counter resets after 2.5 s without a kill |
| Kill with streak 5 to 14 | +3 |  |
| Kill with streak 15 or more | +4 |  |
| Kill with a different weapon than the previous kill | +1 bonus | Variety bonus, once per 0.5 s |
| Dash through enemies (each, up to 5 per dash) | +3 | Only if the dash is not on cooldown overlap |
| Perfect dodge (dash that avoids a telegraphed hit) | +12 |  |
| Elite kill | +8 |  |
| Special monster kill | +30 |  |
| Mini-boss or boss phase completed | +25 |  |
| No damage for 8 s | +1 per second | Capped at +10 per 20 s |
| Taking damage | -15 | Plus -5 per extra hit within 2 s |
| Idle (no kill for 3 s) | Extra drain | Drain rate triples |
| Repeated identical action spam | Gain reduced 50% | For example dashing more than 3 times in 4 s |

**Drain rate.** The base drain depends on rank, so higher ranks need more activity \[T\]:

| Rank | Drain (SP per second) | Score multiplier | Currency multiplier |
| --- | --- | --- | --- |
| D | 2 | ×1.0 | ×1.0 |
| C | 3 | ×1.3 | ×1.1 |
| B | 4 | ×1.7 | ×1.2 |
| A | 5 | ×2.2 | ×1.35 |
| S | 6.5 | ×3.0 | ×1.5 |
| SS | 8 | ×4.0 | ×1.7 |
| SSS | 10 | ×5.5 | ×2.0 |

**Score.**

```latex
\text{Score} = \sum_{k} P_k \times M_{rank}(t_k) + 50 \times T_{surv} + B_{boss} + B_{nohit}
```

Each kill k gives kill points P (Chaser 10, Dasher 30, Spitter 30, Splitter 40, Shielded 50, Brute 80, elite ×5, special monster 500) multiplied by the rank multiplier at that moment. T\_surv is seconds survived; the boss bonus is 5,000 for victory; the no-hit bonus is 2,000 per boss phase cleared without damage \[T\].

**Currency payout at run end:** coins = floor((0.1 × kills + 0.5 × seconds survived + boss bonus) × average currency multiplier), where the boss bonus is 60 coins on victory \[T\]. A typical successful run yields about 250 to 400 coins; a short failed run 40 to 80.

**Worked example.** At rank B (×1.7) a player kills a Dasher (30 points): 30 × 1.7 = 51 points. At rank S (×3.0) the same kill gives 90 points. Staying at S for a full minute at about 3 kills per second and an average of 25 base points per kill is worth about 13,500 points, against about 4,500 at rank D, so holding rank dominates the score, as designed.

**Presentation requirements:** the letter and bar sit in a fixed HUD corner, must not cover enemies, grow slightly on rank-up with a screen-edge glow and a sting, and show a clear dim and warning sound when the bar is under 15 SP. The summary screen shows peak rank, time at each rank and best streak.

**Tuning levers:** gains, drain per rank, multipliers (the main dial for "how much is style worth"), thresholds for restart values, anti-spam rules.

## 14. Game feel and feedback

In an auto-attack game the feel of every hit carries the experience. These values are the starting kit; they are tuned by playing on real phones, not by reasoning.

**Hit feedback**

| Event | Visual | Audio | Time and strength |
| --- | --- | --- | --- |
| Normal hit | Enemy white flash, small knockback, damage number | Short thud, pitch varies ±10% | Flash 0.08 s; hit-stop 0 ms |
| Critical hit | Yellow number, larger, spark | Higher pitch click | Hit-stop 40 ms \[T\]; screen shake 0.05 u |
| Enemy death | Pop with particles, gem pops out | Soft burst | Particle life 0.35 s |
| Elite or special monster hit | Stronger flash and bar nudge | Heavier thud | Hit-stop 30 ms |
| Hero hit | Red vignette pulse, hero flash, brief push | Low hit sound | Hit-stop 60 ms; shake 0.12 u for 0.2 s |
| Dash | Motion trail, dust | Whoosh | Camera punch 0.08 u on arrival |
| Level-up | Radial burst, gems pulled in | Rising chime | Simulation pauses for cards |
| Rank up | Large letter pulse, edge glow | Rank sting | 0.5 s animation |

**Rules**

- Hit-stop never exceeds 80 ms and never stacks (the longest active wins) so it cannot freeze the game in crowds \[F\].
- Damage numbers are pooled, limited to 30 visible, merge for rapid hits on the same enemy, and can be disabled in settings.
- Particle counts are capped per frame; low-end mode halves particles and disables screen shake.
- Screen shake and flash intensity are user-adjustable, with a reduced-motion preset \[F\].
- Telegraph indicators use a consistent warning color distinct from the player's weapon color; the player's attack color is never used for enemy attacks.
- Enemy hit flash uses a shader-free tint approach for performance on low-end devices.
- Audio: sounds triggered more than 6 times in 100 ms are throttled; music ducks briefly under the level-up and rank-up stings.

**Readability rules \[F\]**

1. The hero is always the most visible object (outline and a soft ground ring).
2. Enemy projectiles are brighter than the background and never the same color as gems.
3. At 150 enemies on screen the hero and enemy telegraphs must remain distinguishable; if not, reduce enemy opacity at the edges or cap density.
4. Never rely on color alone: shapes, icons and motion differ for dangerous attacks.

**Haptics (where the platform supports it):** a short pulse on taking damage, a longer pulse on level-up and rank-up; user toggle.

**Tuning levers:** hit-stop lengths, shake strengths, particle limits, audio throttle values, damage number density.

## 15. Tuning levers, acceptance tests and open questions

**Master tuning levers (change these first, in this order)**

| Goal | Lever | Direction |
| --- | --- | --- |
| Game too easy | Wave budget per second, enemy scaling coefficients | Raise |
| Game too hard early | First 45 s budget, base enemy speed | Lower |
| Too little build variety | Card type weights, tag requirements, pity rules | Adjust |
| Kiting is dominant | Enemy speed scaling, ranged enemy count, rank drain | Raise |
| Players feel weak | Level-up spacing, early damage, hit-stop on hit | Improve |
| Runs too long | Boss health, boss arrival time, XP curve | Lower |
| Style feels irrelevant | Rank multipliers and currency multipliers | Raise |

**Prototype acceptance tests (pass these at milestone M1 to M3)**

| # | Test | Pass criterion |
| --- | --- | --- |
| 1 | Time to first level-up | 6 to 10 s for a player who only moves |
| 2 | Idle player | An idle hero is killed before 1:30 on tier 1 |
| 3 | Competent player (tester) | Reaches the boss in at least 60% of runs by the tenth attempt |
| 4 | New player (never seen the game) | Understands drag movement and auto-attack without text in under 15 s |
| 5 | Weapon feel | Each starting weapon is rated distinct by testers; none rated clearly worst by more than 70% of testers |
| 6 | Build variety | Across 30 recorded runs, no single card chosen in more than 70% of runs |
| 7 | Performance | 60 FPS with 150 enemies on a mid-range phone; 30 FPS floor on the low-end target |
| 8 | Orientation parity | Same bot clears the run at equal rates (within 5%) in portrait, square and landscape |
| 9 | Interruption safety | Tab switch, pause and resume 20 times with no state loss or desync |
| 10 | Restart speed | From death screen to the next run starting in under 2 s |
| 11 | Run length | 90% of runs end between 2:00 and 4:30 |
| 12 | Rank engagement | Testers reach rank A at least once in 5 runs, and S is possible but uncommon |

**Bot-based checks.** Simple scripted bots (stand still, run in circles, always flee, greedy gem collection) run thousands of seeded runs to find broken cards, impossible spikes and dominant builds before human testing. This needs the seeded RNG and a headless simulation mode from the start.

**Open questions to resolve in the prototype**

1. Should dash speed and distance scale with move speed, or stay fixed?
2. Is a hero collision radius of 0.35 u enough to feel fair with large swarms?
3. Is the 4:30 hard cap the right ending, or should the boss arrive earlier for weaker runs?
4. How many cards per offer is best on small screens (three vs four)?
5. Should rank decay pause while a card choice is on screen? (Current rule: simulation paused, so yes.)
6. Is it better for the soft world boundary to exist, or for enemies to adapt to wandering?
7. Is the mini-boss necessary if special monsters already create peaks?
8. Does the landscape cap (14 u wide) hurt the feeling of space enough to need decorative panels earlier?

**Next documents (from GDD section 19):** framework evaluation and technical design, data schema and save spec, UI and UX specification, economy and store design, art bible and theme pack spec.
