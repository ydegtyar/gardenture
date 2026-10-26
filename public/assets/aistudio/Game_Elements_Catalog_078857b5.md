# Game Elements and Content Catalog: Swipe Roguelite
*With Unified Pastel Cartoon Image Generation Prompts*

*Generated on October 23, 2026*  
*Reference documents: Core Gameplay Systems Specification, Game Design Document, PixiJS Setup and Architecture Specification*

---

## Master Art Style Guide & Prompt Architecture

All image generation prompts share a unified stylistic grammar to guarantee visual harmony across every character, weapon, enemy, card, effect, and environment.

### Core Style Formula
* **Art Movement & Medium:** 2D stylized cartoon game asset, clean digital vector illustration, crisp dual-tone cel-shading.
* **Color Palette:** Soft, dreamy yet punchy pastel tones — mint green (`#A8E6CF`), sage green (`#88D49E`), blush rose (`#FFAAA6`), lavender purple (`#DED2F9`), apricot peach (`#FFD3B6`), sky blue (`#A0C4FF`), butter yellow (`#FDFFB6`), and cream parchment (`#FFFDF0`).
* **Line Art & Contrast:** Bold, high-contrast dark plum/indigo outer outlines (`#2D1E2F`) and clean internal ink lines designed for sharp readability on small mobile screens.
* **Lighting & Shading:** Warm ambient fill lighting, crisp geometric cast shadows, gentle specular star glints, zero photorealistic noise or gritty gradients.
* **Isolation:** Sprites and icons are generated isolated on a solid pure white background (`#FFFFFF`) with no ground drop-shadows. Environments are rendered in seamless top-down 2D orthographic perspective.

---

## 1. Scenes, Screens & Environments

### Environments & Biomes

#### 1.1 Mystic Garden (Launch Biome)
* **Description:** Whimsical fantasy garden with soft pastel turf, winding mossy patches, scattered oversized clover, and tiny pastel wildflowers. Top-down 2D playable area with high contrast for sprite clarity.
* **Image Prompt:**
> `Seamless tileable top-down 2D game environment, whimsical cartoon mystic garden, soft mint green grass, sage moss patches, scattered pastel pink and buttercup yellow wildflowers, subtle stepping stones, flat cel-shading, bold stylized contours, high contrast for character visibility, mobile roguelite game background, clean vector illustration, no characters, no blur.`

#### 1.2 Dungeon (Secondary Biome)
* **Description:** Playful cartoon subterranean ruin with pastel lavender-slate flagstones, mint-green glowing mushrooms, weathered stone cracks, and ancient vine overgrowth.
* **Image Prompt:**
> `Seamless tileable top-down 2D game environment, stylized cartoon dungeon floor, pastel lavender slate flagstones, soft moss-filled cracks, bioluminescent mint-green tiny mushrooms, whimsical overgrown stone tiles, clean cel-shading, bold dark plum outlines, high contrast mobile game background, clean vector art, no characters.`

#### 1.3 Boss Arena (Dynamic Combat Zone)
* **Description:** Circular arena clearing surrounded by an encroaching ring of pastel rose-thorn vines and ancient runic garden stones, featuring an active central perimeter circle.
* **Image Prompt:**
> `Top-down 2D game arena clearing, stylized cartoon floral battleground, circular central battle ring with glowing pastel gold runic markings, surrounded by dense pastel pink thorn brambles and leafy borders, high contrast floor, clean cel-shaded mobile game art, bold outlines, vibrant pastel fantasy palette, no characters.`

### Screens & UI Frames

#### 1.4 In-Run HUD Kit
* **Description:** Modular mobile UI components including health bar, XP gem meter, Style Rank badge frame (D to SSS), and circular power-up item containers with botanical motifs.
* **Image Prompt:**
> `2D stylized cartoon mobile game UI asset kit, organic fantasy garden theme, curved health bar frame with emerald leaves, XP bar with pastel yellow floral trim, circular power-up skill slot buttons, wooden and golden vine borders, clean bold dark outlines, soft pastel colors, cel-shaded vector UI design, isolated on white background.`

#### 1.5 Card Selection Modal Frame
* **Description:** Vertical card banner template with carved light-wood border, blooming flower-gem header, rarity banner tag, and parchment-textured center for card description.
* **Image Prompt:**
> `2D cartoon card frame template for mobile roguelite game, vertical tarot card proportions, light oak carved wooden borders with pastel pink blooming rosebud corners, glowing crystal rarity gem at top, clean cream parchment center, bold dark outlines, high contrast, cel-shaded vector game UI, isolated on white background.`

---

## 2. Characters & Professions

### 2.1 Base Hero Persona (Default Adventurer)
* **Description:** Charming, chibi-proportioned botanical adventurer in a hooded traveling tunic, wearing leather belt pouches and soft boots, viewed from a top-down 3/4 angle.
* **Image Prompt:**
> `Stylized 2D cartoon hero character sprite, cute chibi proportions, top-down 3/4 game perspective, hooded sage-green traveler cloak, warm peach skin, soft brown boots, utility belt with tiny seed pouches, bold dark plum outlines, smooth pastel cel-shading, vibrant high-contrast mobile game character, isolated on pure white background.`

### 2.2 Warden Profession
* **Description:** Sturdy guardian hero clad in living wooden breastplate armor, leafy shoulder pads, and protective bark gauntlets, ready to swing an arc blade.
* **Image Prompt:**
> `Stylized 2D cartoon guardian knight character sprite, top-down 3/4 mobile game view, carved birch wood bark armor, leafy emerald and mint shoulder pauldrons, sturdy stance, holding a leaf-shaped wooden sword, bold dark outlines, pastel green and soft bronze cel-shading, high contrast cute heroic character, isolated on pure white background.`

### 2.3 Seeker Profession
* **Description:** Agile ranged rogue wrapped in a fluttering lavender-tinted wind-cloak, equipped with bandoliers of sharpened seed daggers and nimble boots.
* **Image Prompt:**
> `Stylized 2D cartoon scout assassin character sprite, top-down 3/4 mobile game perspective, dynamic agile pose, hooded lavender and soft violet cloak, leather bandolier holding glowing pastel green seed daggers, swift boots, bold dark outlines, smooth cel-shading, high contrast whimsical fantasy rogue, isolated on pure white background.`

### 2.4 Herbalist Profession
* **Description:** Whimsical support apothecary wearing a botanical apron, a wide-brimmed sun-hat with sprouting flowers, and carrying a glowing alchemical potion pouch.
* **Image Prompt:**
> `Stylized 2D cartoon herbalist apothecary character sprite, top-down 3/4 mobile game perspective, wide-brim straw hat with a blooming pastel pink daisy, sage green apron over cream tunic, pouch filled with glowing mint remedies, holding a small botanical pestle, bold dark outlines, warm pastel cel-shading, isolated on pure white background.`

### 2.5 Stormcaller Profession
* **Description:** Mystical druid channeling atmospheric lightning, adorned with floating lilac feathers, electric sky-blue rune tattoos, and a crackling leafy circlet.
* **Image Prompt:**
> `Stylized 2D cartoon lightning druid character sprite, top-down 3/4 mobile game view, floating ethereal pose, flowing sky-blue and lilac robes, glowing pastel electric runes on hands, leafy circlet sparking with tiny cartoon lightning sparks, bold dark outlines, vibrant high-contrast cel-shaded vector art, isolated on pure white background.`

---

## 3. Weapons & Evolutions

### 3.1 Garden Blade
* **Description:** Broad botanical shortsword with a glowing emerald leaf blade, polished willow-wood crossguard, and vine-wrapped hilt.
* **Image Prompt:**
> `Stylized 2D cartoon game weapon icon, broad single-edge shortsword made of a luminous emerald green leaf, carved wooden hilt wrapped in flowering pastel pink vines, clean bold dark plum outlines, soft pastel cel-shading, high-contrast mobile game inventory item, isolated on pure white background.`

### 3.2 Thorn Spear
* **Description:** Slender polearm grown from a sturdy bramble stalk, tipped with an elongated rose thorn head with sharp barbed edges.
* **Image Prompt:**
> `Stylized 2D cartoon game weapon icon, slender lance polearm crafted from a twisted green bramble vine, tipped with a massive sharpened rose thorn in pastel magenta, small leaf accents, bold clean outlines, vibrant pastel cel-shading, mobile game asset, isolated on pure white background.`

### 3.3 Bloom Hammer
* **Description:** Whimsical heavy warhammer featuring an unopened pastel-purple flower bulb as the crushing head, mounted on an oak branch handle.
* **Image Prompt:**
> `Stylized 2D cartoon game weapon icon, heavy two-handed warhammer with a massive unopened pastel lavender blossom bulb as the hammerhead, sturdy oak branch handle bound with green vines, bold dark outlines, soft pastel cel-shading, high contrast game icon, isolated on pure white background.`

### 3.4 Seed Blades
* **Description:** Pair of lightweight, aerodynamic throwing daggers shaped like pointed sycamore winged seeds, glowing with kinetic wind magic.
* **Image Prompt:**
> `Stylized 2D cartoon game weapon icon, pair of floating throwing daggers sculpted like sharp botanical seed pods with mint-green aerodynamic wings, subtle pastel cyan wind trail, bold dark outlines, clean cel-shading, high-contrast mobile game weapon, isolated on pure white background.`

### 3.5 Petal Orbit
* **Description:** Set of vibrant cherry-blossom and orchid petals spinning in a concentric formation, leaving soft glitter trails.
* **Image Prompt:**
> `Stylized 2D cartoon game weapon icon, swirling orbital barrier of three oversized pastel rose and peach flower petals, soft glowing mint sparkles and motion arcs, bold dark plum outlines, smooth cel-shading, magical botanical defense icon, isolated on pure white background.`

### 3.6 Chain Lightning
* **Description:** Crackling fork of stylized pastel blue and lavender electrical energy arcing across floating runic leaves.
* **Image Prompt:**
> `Stylized 2D cartoon game weapon icon, zig-zagging branch of magical lightning rendered in pastel sky-blue and lavender, sparking between three tiny floating golden leaves, bold dark outlines, vibrant cel-shaded comic effect, isolated on pure white background.`

### 3.7 Verdant Edge (Evolution)
* **Description:** Majestic evolved broadsword with an ethereal crescent blade of pure solar-infused emerald light, blooming golden roses on the hilt, and wind trails.
* **Image Prompt:**
> `Stylized 2D cartoon evolved legendary weapon icon, radiant greatsword with a glowing pastel emerald crystal blade emitting crescent light waves, golden vine crossguard blooming with pastel peach roses, bold dark outlines, sparkling cel-shaded fantasy game icon, isolated on pure white background.`

---

## 4. Cards & In-Run Progression

### Stat Cards (12)

#### 4.1 Sharper Edge
* **Description:** A whetstone polishing a sword blade with gleaming white star glints.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, glowing sharpened sword blade edge reflecting brilliant pastel yellow star glints, bold dark outlines, mint and gold cel-shading, clean vector game icon, isolated on pure white background.`

#### 4.2 Quick Hands
* **Description:** A pair of nimble green-leather archer gloves trailing pastel wind swirls.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, pair of nimble sage-green fingerless leather gloves surrounded by fast pastel cyan motion swooshes, bold dark outlines, clean cel-shaded mobile game icon, isolated on pure white background.`

#### 4.3 Wide Swing
* **Description:** A broad sweeping crescent arc in pastel gold cutting through leaves.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, dynamic wide circular sword swing slash effect in pastel golden yellow with tiny sliced leaves flying, bold dark plum outlines, high-contrast cel-shading, isolated on pure white background.`

#### 4.4 Long Reach
* **Description:** An extended botanical vine extending outwards with a grasping leaf tip.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, elongated thorny green vine thrusting forward across the frame with wind streaks, bold dark outlines, pastel green and peach accents, clean cel-shaded vector asset, isolated on pure white background.`

#### 4.5 Swift Boots
* **Description:** Cute leather boots equipped with pastel-winged heels.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, pair of cozy caramel leather ankle boots with tiny fluttering pastel mint wings on the heels, bold dark outlines, smooth cel-shading, mobile roguelite icon, isolated on pure white background.`

#### 4.6 Hardy Bark
* **Description:** A thick wooden bark shield with a glowing healthy green heart rune.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, sturdy circular shield made of layered tree bark with an embossed glowing pastel emerald heart symbol, bold dark outlines, warm earthy cel-shading, isolated on pure white background.`

#### 4.7 Magnet Moss
* **Description:** A fluffy ball of luminescent green moss pulling magnetic sparkles and gems.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, charming clump of fuzzy mint-green moss emitting glowing magnetic attraction rings toward tiny floating gems, bold dark outlines, vibrant pastel cel-shading, isolated on pure white background.`

#### 4.8 Lucky Clover
* **Description:** A four-leaf clover glowing with golden shimmer and lucky sparkles.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, vibrant four-leaf clover with dew drops, surrounded by floating pastel gold lucky star sparkles, bold dark plum outlines, cel-shaded fantasy icon, isolated on pure white background.`

#### 4.9 Keen Eye
* **Description:** A stylized hawk eye emblem framed in golden floral filigree with a sharp crosshair iris.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, sharp hawk-eye crest framed in pastel gold floral filigree with a glinting crosshair pupil, bold dark outlines, high-contrast lavender and yellow cel-shading, isolated on pure white background.`

#### 4.10 Iron Bark
* **Description:** Tree bark reinforced with polished steel studs and glowing defensive runes.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, solid square slab of ironwood bark armored with rounded pastel steel rivets, bold dark outlines, high-contrast gray and moss green cel-shading, isolated on pure white background.`

#### 4.11 Regrowth
* **Description:** A curling green sprout emerging from a cracked seed with soft pink healing aura.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, fresh green seedling sprouting from a brown seed, enveloped in a gentle pastel pink healing aura with floating sparkles, bold dark outlines, smooth cel-shading, isolated on pure white background.`

#### 4.12 Fleet Step
* **Description:** A silhouette hero dashing forward leaving afterimage silhouettes.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, swift cartoon hero silhouette executing a dash with three fading pastel lavender motion ghost trails, bold dark plum outlines, cel-shaded action icon, isolated on pure white background.`

### Behavior Cards (8)

#### 4.13 Echo Swing
* **Description:** Double-ghosted sword arc showing a simultaneous secondary phantom swing.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, twin overlapping sword slash arcs, one vibrant gold and one translucent pastel cyan phantom echo, bold dark outlines, high-contrast cel-shaded attack icon, isolated on pure white background.`

#### 4.14 Thorn Trail
* **Description:** A path of sharp blooming briar thorns sprouting along a curved line.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, winding trail of prickly green briar vines sprouting sharp pastel rose thorns on the ground, bold dark plum outlines, clean cel-shading, mobile game icon, isolated on pure white background.`

#### 4.15 Spore Pop
* **Description:** A bulbous mushroom bursting in a cloud of colorful pastel pollen spores.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, cute bulbous mushroom popping open and releasing an explosive radial ring of pastel orange and yellow pollen particles, bold dark outlines, playful cel-shading, isolated on pure white background.`

#### 4.16 Second Wind
* **Description:** A magical green phoenix feather reigniting with golden life sparks.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, glowing emerald phoenix feather bursting with radiant pastel gold revitalization flames, bold dark outlines, vibrant cel-shaded resurrection emblem, isolated on pure white background.`

#### 4.17 Double Dash
* **Description:** Two curved wind arrows circling each other in an energetic sprint loop.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, two intertwined swooping wind arrows formed of pastel mint and sky blue energy, bold dark plum outlines, dynamic cel-shaded speed icon, isolated on pure white background.`

#### 4.18 Vampiric Bloom
* **Description:** A dark crimson orchid drinking glowing green essence droplets.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, stylized exotic orchid flower in pastel burgundy and magenta, absorbing floating drops of glowing mint life essence, bold dark outlines, high-contrast cel-shading, isolated on pure white background.`

#### 4.19 Shockwave
* **Description:** A ground impact sending expanding concentric rings cracking the earth.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, heavy fist smashing the ground creating concentric expanding shockwave rings of pastel yellow and cyan dust, bold dark outlines, punchy cel-shading, isolated on pure white background.`

#### 4.20 Petal Storm
* **Description:** A miniature whirlwind dense with swirling pastel flower petals.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, swirling botanical vortex funnel filled with fluttering pastel pink, lavender, and peach flower petals, bold dark outlines, dynamic cel-shaded tornado icon, isolated on pure white background.`

### Synergy Cards (6)

#### 4.21 Piercing Slash
* **Description:** A sword blade slicing directly through an armored wooden target dummy.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, glowing pastel green sword slash cutting cleanly through a wooden shield, leaving a luminous pierce beam, bold dark plum outlines, high-contrast cel-shading, isolated on pure white background.`

#### 4.22 Burning Thorns
* **Description:** Briar thorns enveloped in bright stylized cartoon flames.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, cluster of sharp rose bramble thorns engulfed in crackling pastel orange and magenta cartoon fire, bold dark outlines, clean vibrant cel-shading, isolated on pure white background.`

#### 4.23 Healing Bloom
* **Description:** An exploded monster bursting into a radiant blooming healing lotus seed.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, blooming pastel pink lotus flower sprouting with glowing green restorative light beams and dew drops, bold dark outlines, whimsical cel-shading, isolated on pure white background.`

#### 4.24 Chain Bloom
* **Description:** An arrow or seed split by electric vine branches connecting multiple nodes.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, glowing botanical projectile striking a sphere and branching into two lightning-charged vine arcs, bold dark plum outlines, pastel blue and green cel-shading, isolated on pure white background.`

#### 4.25 Crit Burst
* **Description:** A golden starburst explosion shattering into a crescent nova.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, explosive golden critical hit impact flash shattering into flying pastel diamond sparks, bold dark outlines, punchy high-contrast cel-shading, isolated on pure white background.`

#### 4.26 Frost Touch
* **Description:** An icy handprint freezing autumn leaves into pastel cyan rime crystals.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, stylized handprint made of sparkling pastel cyan frost, freezing green leaves into delicate ice crystals, bold dark plum outlines, clean cel-shading, isolated on pure white background.`

### Risk & Reward Cards (4)

#### 4.27 Glass Blade
* **Description:** A razor-sharp crystal rapier with fractures along the hilt.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, crystalline transparent dagger glowing with sharp pastel cyan light, displaying subtle hairline fractures near the gold hilt, bold dark outlines, high-contrast cel-shading, isolated on pure white background.`

#### 4.28 Greedy Roots
* **Description:** Gnarled roots clutching piles of glittering golden gems.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, greedy tangled tree roots tightly clutching a hoard of sparkling pastel yellow XP gems and gold coins, bold dark plum outlines, rich cel-shading, isolated on pure white background.`

#### 4.29 Wild Growth
* **Description:** Enormous oversized flowers crowding out a clockwork timer.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, massive blooming pastel blossom violently overflowing and tangling around a slow brass pocket watch, bold dark outlines, playful cel-shading, isolated on pure white background.`

#### 4.30 Blood Pact
* **Description:** Two clasping hands sealed with a glowing crimson vine thorn contract.
* **Image Prompt:**
> `Stylized 2D cartoon card icon, two stylized hands clasping together bound by a thorny pastel crimson vine with a glowing red sigil, bold dark outlines, high-contrast dramatic cel-shading, isolated on pure white background.`

---

## 5. Effects & VFX

### Status Effects

#### 5.1 Burn Debuff
* **Description:** Clustered cartoon flame tongues dancing over an entity.
* **Image Prompt:**
> `Stylized 2D cartoon visual effect sprite, three playful dancing flame wisps in pastel orange and warm magenta with tiny ember sparks, bold dark plum outlines, smooth cel-shading, mobile game VFX asset, isolated on pure white background.`

#### 5.2 Freeze Debuff
* **Description:** Crystalline pastel-cyan frost block encasing an object with glinting facets.
* **Image Prompt:**
> `Stylized 2D cartoon visual effect sprite, geometric ice crystal block in translucent pastel cyan with sharp white facet highlights and floating frost flakes, bold dark outlines, cel-shaded game status icon, isolated on pure white background.`

#### 5.3 Slow Debuff
* **Description:** Sticky honeyed sap droplets and clockwork snail spirals weighing down movement.
* **Image Prompt:**
> `Stylized 2D cartoon visual effect sprite, puddle of sticky amber floral sap with a cute spiral snail shell motif and slow dripping beads, bold dark plum outlines, glossy cel-shading, isolated on pure white background.`

#### 5.4 Poison Debuff
* **Description:** Bubbling noxious pastel-violet spore drops and toxic skull vapors.
* **Image Prompt:**
> `Stylized 2D cartoon visual effect sprite, bubbling cluster of pastel violet and sickly lime spore bubbles with cartoon skull vapor wisps, bold dark outlines, vibrant cel-shaded debuff effect, isolated on pure white background.`

### Combat Actions & Dash VFX

#### 5.5 Thorn Burst (Warden Dash)
* **Description:** Radial ring of 8 oversized rose thorns firing outward in an explosive starburst.
* **Image Prompt:**
> `Stylized 2D cartoon visual combat effect, explosive 360-degree radial ring of sharp pastel magenta thorns bursting outward with dust puffs, bold dark plum outlines, high-contrast punchy cel-shading, isolated on pure white background.`

#### 5.6 Seed Trap (Seeker Dash)
* **Description:** Armed botanical landmine pod with coiled green tendrils and a glowing red bud ready to spring.
* **Image Prompt:**
> `Stylized 2D cartoon game obstacle trap, plump botanical seed pod resting on ground, coiled spring tendrils and glowing pastel orange warning core, bold dark outlines, clean cel-shading, isolated on pure white background.`

#### 5.7 Heal Pulse (Herbalist Dash)
* **Description:** Expanding concentric ring of soft emerald light decorated with floating mint leaves and crosses.
* **Image Prompt:**
> `Stylized 2D cartoon magic spell effect, expanding circular aura wave of radiant pastel mint light with floating green leaves and tiny plus-shaped sparkles, bold dark contours, gentle cel-shading, isolated on pure white background.`

#### 5.8 Phase Teleport (Stormcaller Dash)
* **Description:** Crackling silhouette afterimage with an electric blue lightning trail.
* **Image Prompt:**
> `Stylized 2D cartoon movement effect, electric blue afterimage ghost dissolving into zigzagging pastel lavender sparks and lightning bolts, bold dark plum outlines, high-contrast cel-shading, isolated on pure white background.`

#### 5.9 Perfect Dodge Spark
* **Description:** Sharp golden starburst glint with motion shock lines indicating timely evasion.
* **Image Prompt:**
> `Stylized 2D cartoon combat feedback effect, brilliant 8-pointed golden star spark with dynamic white impact shockwaves and comic action lines, bold dark outlines, punchy cel-shading, isolated on pure white background.`

---

## 6. Enemies & Bosses

### Standard Archetypes (Garden Theme)

#### 6.1 Chaser (Thorn-Vine Swarmer)
* **Description:** Skittering botanical quadruped creature composed of twisted vines, thorn fangs, and glowing amber eyes.
* **Image Prompt:**
> `Stylized 2D cartoon enemy sprite, top-down 3/4 mobile game perspective, skittering vine beast with four thorny branch legs, a snapping bulb maw with rose-thorn teeth, glowing yellow cartoon eyes, bold dark plum outlines, pastel olive and sage cel-shading, isolated on pure white background.`

#### 6.2 Dasher (Briar Charger)
* **Description:** Horned beetle-like botanical charger with a heavy rosewood shell and forward-facing battering ram thorns.
* **Image Prompt:**
> `Stylized 2D cartoon enemy sprite, top-down 3/4 game view, aggressive horned beetle monster with a polished chestnut shell, oversized forward-pointing pastel magenta ram horns, primed in a charging pose, bold dark outlines, smooth cel-shading, isolated on pure white background.`

#### 6.3 Spitter (Spore Spitter)
* **Description:** Stationary bulbous pitcher plant with a wide funnel mouth, puffing cheek pouches, and spore artillery.
* **Image Prompt:**
> `Stylized 2D cartoon enemy sprite, top-down 3/4 view, plump pitcher plant monster with swollen cheeks preparing to fire, speckled pastel violet and mint skin, leafy base feet, bold dark plum outlines, vibrant cel-shaded mobile enemy, isolated on pure white background.`

#### 6.4 Brute (Moss Golem)
* **Description:** Enormous, lumbering stone and earth golem covered in thick pastel moss, wielding heavy boulder fists.
* **Image Prompt:**
> `Stylized 2D cartoon heavy enemy sprite, top-down 3/4 perspective, massive gentle-giant moss golem made of rounded river stones and fluffy pastel green moss, giant stone fists, glowing cyan eye slits, bold dark outlines, clean cel-shading, isolated on pure white background.`

#### 6.5 Splitter (Bulb Mitotic)
* **Description:** Gelatinous double-lobed bulb enemy with a translucent jelly exterior containing two swirling seed nuclei.
* **Image Prompt:**
> `Stylized 2D cartoon enemy sprite, top-down 3/4 view, bouncy pear-shaped slime bulb with translucent pastel peach jelly body, containing two visible smiling seed cores ready to divide, bold dark outlines, glossy cel-shading, isolated on pure white background.`

#### 6.6 Shielded (Bark Sentinel)
* **Description:** Stately wooden sentry holding an impenetrable curved slab of ancient oak bark in front of its body.
* **Image Prompt:**
> `Stylized 2D cartoon enemy sprite, top-down 3/4 perspective, wooden clockwork sentry crouching behind an enormous curved tower shield made of carved oak bark with a carved eye crest, bold dark plum outlines, earthy pastel cel-shading, isolated on pure white background.`

#### 6.7 Elite Enemy Modifier
* **Description:** An empowered variant displaying glowing runic crown antlers, vibrant magenta outline glow, and enlarged scale.
* **Image Prompt:**
> `Stylized 2D cartoon enemy sprite modifier, empowered variant with floating pastel magenta runic horn crowns, luminous golden outline aura, crackling tiny power embers, bold dark outlines, high-contrast cel-shading, isolated on pure white background.`

### Special Monsters

#### 6.8 Golden Beast
* **Description:** Sleek, timid fox-like creature spun of gleaming golden wheat and honeyed sunlight, fleeing rapidly with a trailing coin pouch.
* **Image Prompt:**
> `Stylized 2D cartoon special monster sprite, top-down 3/4 view, swift fleeing magical fox creature made of radiant spun pastel gold wheat, glittering trail of golden sparkles and dropping coins, frightened cute expression, bold dark outlines, vibrant cel-shading, isolated on pure white background.`

#### 6.9 Bloom Giant
* **Description:** Massive overgrown brute crowned with a blazing multi-petaled sunflower head that charges across the field.
* **Image Prompt:**
> `Stylized 2D cartoon special boss enemy sprite, top-down 3/4 view, hulking tree-trunk colossus with a giant blooming pastel sunflower for a head, charging forward with raised root arms, bold dark plum outlines, warm yellow and bark cel-shading, isolated on pure white background.`

#### 6.10 Brood Mother
* **Description:** Floating matriarchal hive queen shaped like a hollowed flowering gourd, attended by swarming seedling escorts.
* **Image Prompt:**
> `Stylized 2D cartoon special monster sprite, top-down 3/4 view, floating maternal floral queen shaped like an elegant carved hanging gourd with orchid wings, tiny cute seedling babies peeking out, bold dark outlines, pastel lavender and mint cel-shading, isolated on pure white background.`

#### 6.11 Mirror Wisp
* **Description:** Cunning ethereal fairy wisp holding a polished dewdrop mirror, splitting light into tri-directional beams.
* **Image Prompt:**
> `Stylized 2D cartoon special monster sprite, top-down 3/4 view, mischievous floating wisp creature with translucent gossamer wings, holding a glowing dewdrop mirror that refracts pastel rainbow light beams, bold dark plum outlines, magical cel-shading, isolated on pure white background.`

### Boss Encounters

#### 6.12 Mini-Boss: Ancient Moss Colossus
* **Description:** Greatly enlarged Moss Golem armored in ancient stone ruins, slamming both tree-sized boulder fists into the ground.
* **Image Prompt:**
> `Stylized 2D cartoon mini-boss sprite, top-down 3/4 mobile game view, colossal ancient moss golem with cracked runic temple pillars embedded in its shoulders, smashing two enormous stone fists downward with shockwave dust clouds, bold dark outlines, rich pastel green and granite cel-shading, isolated on pure white background.`

#### 6.13 Final Boss Phase 1: Primordial Thornheart
* **Description:** Towering botanical monstrosity anchored by an ancient redwood stump body, wielding whipping thorny vine tentacles.
* **Image Prompt:**
> `Stylized 2D cartoon main boss sprite, phase 1, top-down 3/4 mobile view, towering ancient tree god with an exposed glowing pastel emerald heart core, waving four massive thorny vine tentacles, glowing eyes in knotted bark, bold dark plum outlines, dramatic cel-shading, isolated on pure white background.`

#### 6.14 Final Boss Phase 2: Frenzied Bloom
* **Description:** The boss sheds its outer bark, exposing radiant botanical crystals and firing radial volleys of glowing rosebud seeds.
* **Image Prompt:**
> `Stylized 2D cartoon main boss sprite, phase 2, top-down 3/4 view, enwrapped in glowing pastel magenta petals, radiant exposed crystal core firing a 360-degree burst of glowing botanical energy orbs, furious stylized expression, bold dark outlines, vibrant cel-shading, isolated on pure white background.`

#### 6.15 Final Boss Phase 3: Apex Briar Overlord
* **Description:** Fully enraged titan surrounded by a spinning ring of red thorn lasers and orbiting bramble blades, locked in final desperation.
* **Image Prompt:**
> `Stylized 2D cartoon main boss sprite, final phase, top-down 3/4 view, apex botanical overlord surrounded by a whirling barrier of glowing crimson thorn walls and dark purple petals, eyes radiating intense yellow light, bold dark plum outlines, extreme contrast cel-shading, isolated on pure white background.`

---

## 7. Objects, Pickups & Meta Items

### In-Run Collectibles & Drops

#### 7.1 Normal XP Gem
* **Description:** Faceted teardrop crystal in glowing pastel mint-cyan.
* **Image Prompt:**
> `Stylized 2D cartoon game pickup icon, sparkling teardrop-shaped gem crystal in pastel mint-cyan with clean geometric facets and bright specular glints, bold dark plum outlines, smooth cel-shading, mobile game drop, isolated on pure white background.`

#### 7.2 XP Gem Cluster
* **Description:** Triplet cluster of radiant pastel-gold crystal shards fused together.
* **Image Prompt:**
> `Stylized 2D cartoon game pickup icon, cluster of three fused sparkling geometric crystals in pastel golden yellow and peach, emitting soft star sparkles, bold dark outlines, vibrant cel-shaded high-tier pickup, isolated on pure white background.`

#### 7.3 Healing Seed
* **Description:** Glowing acorn-shaped seed enveloped in a heart-shaped pink aura.
* **Image Prompt:**
> `Stylized 2D cartoon game health pickup icon, polished golden-brown botanical acorn seed surrounded by a luminous pastel rose heart-shaped glow with tiny health crosses, bold dark plum outlines, clean cel-shading, isolated on pure white background.`

#### 7.4 Item Chest
* **Description:** Whimsical treasure chest made of carved willow wood with flowering vine hinges and a golden leaf clasp.
* **Image Prompt:**
> `Stylized 2D cartoon treasure chest icon, ornate trunk crafted from polished curved wood, bound by flowering pastel pink vines, with a glowing golden leaf lock latch, slightly ajar with golden light spilling out, bold dark outlines, cel-shading, isolated on pure white background.`

### Held Power-Ups (One-Time Use)

#### 7.5 Shield Power-Up
* **Description:** Spherical crystalline barrier orb with an embossed oak leaf emblem.
* **Image Prompt:**
> `Stylized 2D cartoon power-up item icon, glowing spherical crystal orb containing a floating pastel emerald oak leaf crest, surrounded by protective concentric rings, bold dark plum outlines, high-contrast cel-shading, isolated on pure white background.`

#### 7.6 Freeze Power-Up
* **Description:** Delicate snowflake encased inside a clear pastel-cyan glass flask.
* **Image Prompt:**
> `Stylized 2D cartoon power-up item icon, round glass potion vial containing a floating intricate pastel cyan snowflake emitting chilly vapor wisps, cork stopper with leafy ribbon, bold dark outlines, smooth cel-shading, isolated on pure white background.`

#### 7.7 Fire Breath Power-Up
* **Description:** Ceramic gourd bottle painted with flame swirls, spewing cartoon fire embers from its mouth.
* **Image Prompt:**
> `Stylized 2D cartoon power-up item icon, rounded terracotta gourd flask painted with pastel orange fire swirls, erupting with tiny playful cartoon flame sparks, bold dark plum outlines, vibrant cel-shaded icon, isolated on pure white background.`

#### 7.8 Magnet Power-Up
* **Description:** Horseshoe magnet sculpted from polished brass with glowing clover tips.
* **Image Prompt:**
> `Stylized 2D cartoon power-up item icon, cute horseshoe magnet made of warm polished brass with glowing mint four-leaf clover magnetic poles pulling floating sparkles, bold dark outlines, clean cel-shading, isolated on pure white background.`

#### 7.9 Time Slow Power-Up
* **Description:** Whimsical brass sundial stopwatch with winding flower petal hands.
* **Image Prompt:**
> `Stylized 2D cartoon power-up item icon, antique circular pocket watch with flower petal hands ticking slowly, surrounded by drifting pastel lavender hourglass dust, bold dark plum outlines, smooth cel-shading, isolated on pure white background.`

### Meta Currencies & Loadout Items

#### 7.10 Soft Coins
* **Description:** Chubby gold coin stamped with a cute sprouting seedling emblem.
* **Image Prompt:**
> `Stylized 2D cartoon currency icon, thick shiny golden coin stamped with a clean embossed seedling leaf emblem, sparkling glint on edge, bold dark plum outlines, warm pastel gold cel-shading, isolated on pure white background.`

#### 7.11 Rare Seeds (Premium Meta Currency)
* **Description:** Prismatic rainbow seed pulsing with inner celestial light.
* **Image Prompt:**
> `Stylized 2D cartoon rare currency icon, prismatic iridescent botanical seed glowing with shifting pastel rainbow colors (lavender, mint, rose, gold), sparkling stardust aura, bold dark outlines, high-contrast cel-shading, isolated on pure white background.`

#### 7.12 Trinket: Aegis Leaf
* **Description:** Silver-plated brooch shaped like an ivy leaf that deflects an incoming blow.
* **Image Prompt:**
> `Stylized 2D cartoon trinket accessory icon, delicate ivy leaf brooch crafted from pastel silver metal with an inlaid mint jade center, glowing with a soft defensive ward aura, bold dark outlines, cel-shaded game gear, isolated on pure white background.`

#### 7.13 Curse Sigil: Swarm Brand
* **Description:** Ominous carved obsidian talisman engraved with a fiery thorn rune that increases enemy difficulty.
* **Image Prompt:**
> `Stylized 2D cartoon difficulty curse sigil icon, carved dark plum obsidian stone talisman etched with a glowing pastel crimson thorn rune, emitting subtle smoke wisps, bold clean outlines, high-contrast cel-shading, isolated on pure white background.`
