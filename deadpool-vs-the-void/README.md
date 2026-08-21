# DEADPOOL vs. THE VOID — MvC2 official artwork edition

A single-level, side-scrolling browser brawler in the spirit of NES *Kung Fu*, built from the
"DEADPOOL vs. THE VOID" production document. This edition uses the **official Marvel vs.
Capcom 2 character artwork** from the
[Retro Game Official Asset Artwork](https://archive.org/details/RetroGameOfficialAssetArtwork)
collection on archive.org — 53 high-quality Bengus illustrations on clean white backgrounds,
cut out automatically and **puppet-animated in code** (bob, lean, lunge, squash, sink). All
UI, FX, and the Void backgrounds are original pixel art drawn in code.

> Personal, **non-commercial fan homebrew**. Marvel characters belong to Marvel/Disney and the
> MvC2 artwork to Capcom/Marvel. Keep this private; do not sell or publicly distribute it.

## The Deadpool situation

**Neither requested pack contains Deadpool.** He was never in Marvel vs. Capcom 2's roster
(his first Capcom fighting game was MvC3), and the "X-Men: Children of the Atom (Sega Saturn
Japanese Version)" pack is listed in the collection's description but **was never actually
uploaded** — the item's files stop alphabetically at "Street Fighter", which other archive
users also point out in the reviews ("files from Su–Y are missing").

So the playable lead is **CABLE** — Deadpool's canonical partner (comics and the Deadpool 2
movie), complete with the huge gun. The title screen says so out loud, and every "Deadpool"
line from the script is delivered by Cable, verbatim. Swap in a Deadpool image later by
dropping a white-background artwork into `tools/mvc2/`, adding it in
`tools/cutout_mvc2.py`, and renaming the player kind.

## How to play

Open `index.html` in Chrome/Chromium (double-click works — no server, no build, fully offline).

| Key | NES | Action |
|---|---|---|
| ← / → | D-pad | Steer. **The merc always runs** — no walk, no idle. |
| ↓ | D-pad | Take a knee. ↓ + ←/→ = kneel-move (slower, lower profile). |
| X | A | Jump — straight up or diagonal, hold for extra height. Clears Juggernaut's dash and Thanos's waves. |
| Z | B | **Smart attack** — blade slash if an enemy is inside the strike box, otherwise fires the equipped gun. Slash also destroys Doom's photons and Spiral's swords mid-flight (Thanos's waves can only be jumped). |
| Shift | Select | Toggle pistol ↔ machine gun (needs ammo; the MG icon flashes at 0). |
| Enter | Start | Start / pause (RESUME · RESTART PHASE · MUSIC ON-OFF). |
| D | — | Debug: hitboxes + info. Press **V** inside debug for the artwork viewer. |

Pistol = unlimited ammo. Machine gun = drop-fed (+20 per bullet box, cap 99), ~8 shots/sec,
auto-swaps back to pistol at 0. Horde kills drop (20%): heart 40% / bullets 40% / **yellow
W-box** 20% — the W-box summons **bone-claw Wolverine** to sprint across the screen and
slash every horde enemy.

Timeline: Phase 1 (2:00 horde) → Sabretooth/Wolverine cutscene (head-pop included) →
Phase 2 (1:00) → **Juggernaut** mid-boss (jump his dash, hit him while dazed, 3 hits; his
**helmet** drops — pick it up) → Phase 3 (1:00) → **Thanos** (ground waves must be jumped;
INVULNERABLE with "NO EFFECT" until you touch him carrying the helmet, then 3 hits) →
ending → Miss Minutes CONGRATS screen.

## Cast (adjusted to what the MvC2 pack actually contains)

| Role | Character | Notes |
|---|---|---|
| Player | **Cable** | Deadpool stand-in — see above. Pistol + giant gun both fit him perfectly. |
| Ally | **Wolverine** (yellow/blue) | Cutscene rescue, ending. |
| W-box sweep | **Wolverine (bone claws)** | The alternate MvC2 artwork. |
| Cutscene villain | **Sabretooth** | Head pops off (a headless variant of the artwork is generated at build time). |
| Mid-boss | **Juggernaut** | Dash / crash / dazed loop; the helmet item is literally the dome cut from his artwork. |
| Final boss | **Thanos** | Cassandra Nova → Loki → now Thanos: biggest Marvel villain in the pack, stands in every frame, and the Juggernaut-helmet-blocks-his-powers gag carries over. "I am Marvel Jesus" still said by the player when he appears. |
| Horde (melee) | Venom, Marrow, Shuma-Gorath (hovers), Omega Red, Silver Samurai, Blackheart, Sentinel (slow tank) | All famous named villains, one-hit kills, endless Void recycling. |
| Horde (ranged) | **Dr. Doom** (green photon) + **Spiral** (thrown sword) | Exactly two projectile users, per the design doc (previously Electro/Magneto — neither is in the pack). |
| Miss Minutes | hand-drawn pixel art | Not a Capcom character; drawn in code. |

Every character base rises from drawn Void mist — the official artworks are cropped at the
frame's bottom edge, so the mist doubles as the "everyone's stuck in the Void" look.

## Audio

Two **original** chiptune loops via WebAudio (no licensed melodies) plus all SFX. To use your
own 8-bit covers, export real audio files to:

```
assets/audio/level.mp3   (horde phases)
assets/audio/boss.mp3    (Thanos fight)
```

They're picked up automatically; music starts on the first key press (browser autoplay rules).

## Files

```
index.html          canvas shell (960×540, scaled to fit)
game.js             the whole game — all tunables in CFG at the top
assets/atlas.js     generated atlas (script tag: works on file:// where fetch() can't)
assets/chars/       18 MvC2 artwork cutouts (15 characters + helmet, popped head, headless KO)
assets/sprites/     drawn pixel art: ui sheet, backgrounds, Miss Minutes
assets/audio/       (optional) level.mp3 / boss.mp3
tools/              asset pipeline: archive.org fetch → cutout → drawn assets → atlas
```

Rebuild everything with `tools/build.sh` (needs python3 + pillow/numpy/scipy); the raw
downloads stay untracked. Design-doc mechanics — always-running hero, smart attack, weapon
rules, drops, phase script, exact 7-line dialogue with the scripted speakers, HUD, debug
mode, missing-asset reporting — are implemented as written.
