# DEADPOOL vs. THE VOID — paper puppet edition

A single-level, side-scrolling browser brawler in the spirit of NES *Kung Fu*, built from the
"DEADPOOL vs. THE VOID" production document — staged as a **paper puppet theater**: every
character is a cut-out glued to a cardboard backing on a **popsicle stick**. A foreground
ridge slightly overlaps the stage for depth and hides the stick bottoms; when a puppet jumps,
the whole thing — stick and all — sails through the air like someone tossed it.

> Personal, **non-commercial fan homebrew**. Marvel characters belong to Marvel/Disney; the
> villain artwork to Capcom/Marvel. Keep this private; do not sell or publicly distribute it.

## How to play

Open `index.html` in Chrome/Chromium (double-click works — no server, no build, fully offline).

| Key | NES | Action |
|---|---|---|
| ← / → | D-pad | Steer. **Deadpool always runs** — no walk, no idle. |
| ↓ | D-pad | Take a knee. ↓ + ←/→ = kneel-move (slower, lower profile). |
| X | A | Jump — straight up or diagonal, hold for extra height. Clears Juggernaut's dash and Cassandra's waves. |
| Z | B | **Smart attack** — blade slash if an enemy is inside the strike box, otherwise fires the equipped gun. Slash also destroys Doom's photons and Spiral's swords mid-flight (Cassandra's waves can only be jumped). |
| Shift | Select | Toggle pistol ↔ machine gun (needs ammo; the MG icon flashes at 0). |
| Enter | Start | Start / pause (RESUME · RESTART PHASE · MUSIC ON-OFF). |
| D | — | Debug: hitboxes + info. Press **V** inside debug for the artwork viewer. |

Pistol = unlimited. Machine gun = drop-fed (+20 per bullet box, cap 99), ~8 shots/sec. Horde
kills drop (20%): heart 40% / bullets 40% / **yellow W-box** 20% — the W-box summons
bone-claw Wolverine for a long, screen-clearing rampage.

Timeline: Phase 1 (2:00 horde) → Sabretooth/Wolverine cutscene (double claw swipe, head-pop) →
Phase 2 (1:00) → **Juggernaut** (jump his dash, hit him while dazed, 3 hits; grab the
**helmet** he drops — it then lives only in the HUD) → Phase 3 (1:00) → **CASSANDRA NOVA**
(movie photo puppet; jump her psychic waves; she's INVULNERABLE until you touch her carrying
the helmet — it gets jammed on her head — then 3 hits) → ending: the **minivan** pulls up and
a photo Deadpool says "I love it" → Miss Minutes CONGRATS screen.

## The cast

| Role | Art source |
|---|---|
| **Deadpool** (player) | Marvel: Avengers Alliance artwork (The Spriters Resource) — full-body pose, guns up |
| **Cassandra Nova** (final boss) | *Deadpool & Wolverine* movie photo render, clipped onto cardboard — per the design doc, she STANDS in every frame |
| Photo Deadpool (ending cameo) | movie photo render |
| Wolverine, bone-claw Wolverine, Sabretooth, Juggernaut | MvC2 official artwork (archive.org "Retro Game Official Asset Artwork") |
| Horde: Venom, Marrow, Shuma-Gorath, Omega Red, Silver Samurai, Blackheart, Sentinel + ranged Dr. Doom (photons) & Spiral (thrown swords) | MvC2 official artwork |
| Minivan, Miss Minutes, all UI/FX/backgrounds | original pixel art drawn in code |

The cardboard borders, hard-cut bottoms, and sticks are added by the pipeline — the missing
legs on the MvC2 artworks became the aesthetic instead of a bug.

## Music

The game ships with **original** chiptune loops (no licensed melodies). To use your own 8-bit
covers — e.g. the NSYNC and Madonna covers you have in mind — save them as audio files named:

```
assets/audio/level.mp3   (or .ogg / .m4a)  — horde phases
assets/audio/boss.mp3    (or .ogg / .m4a)  — Cassandra fight
```

If those files exist, the game plays them automatically (music starts on the first key press —
browser autoplay rules). Note: audio can't be pulled out of a YouTube link by the game; the
files themselves need to be in that folder.

## Files

```
index.html          canvas shell (960×540, scaled to fit)
game.js             the whole game — tunables in CFG at the top (incl. STICK_LEN)
assets/atlas.js     generated atlas (script tag: works on file:// where fetch() can't)
assets/chars/       19 puppet cutouts (17 characters + helmet + poppable head)
assets/sprites/     drawn pixel art: ui sheet, minivan, backgrounds incl. bg_front overlap layer
assets/audio/       (optional) your music files
tools/              asset pipeline (fetch → cutout → puppetize → drawn assets → atlas)
```

Rebuild with `tools/build.sh` (python3 + pillow/numpy/scipy). The two movie renders are
manual drops in `tools/puppet_in/` (documented in `tools/README.md`).
