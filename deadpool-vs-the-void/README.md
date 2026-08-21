# DEADPOOL vs. THE VOID

A single-level, side-scrolling browser brawler in the spirit of NES *Kung Fu*, built from the
"DEADPOOL vs. THE VOID" production document — but using **real sprite rips from
[Marvel: Avengers Alliance](https://www.spriters-resource.com/browser_games/marvelavengers/)**
on The Spriters Resource instead of AI-generated art, with the villain roster adjusted to what
that page actually has.

> Personal, **non-commercial fan homebrew**. Marvel characters belong to Marvel/Disney; the
> sprite art belongs to Playdom/Disney and was ripped by TSR contributors (Cyrus Annihilator —
> please give credit). Keep this private; do not sell or publicly distribute it.

## How to play

Open `index.html` in Chrome/Chromium (double-click works — no server, no build, fully offline).

| Key | NES | Action |
|---|---|---|
| ← / → | D-pad | Steer. **Deadpool always runs** — no walk, no idle. |
| ↓ | D-pad | Take a knee. ↓ + ←/→ = kneel-move (slower, lower profile). |
| X | A | Jump — straight up or diagonal, hold for extra height. Clears Juggernaut's dash and Loki's waves. |
| Z | B | **Smart attack** — katana slash if an enemy is inside the strike box, otherwise fires the equipped gun. Slash also destroys Magneto's shards and Electro's bolts mid-flight (Loki's waves can only be jumped). |
| Shift | Select | Toggle pistol ↔ machine gun (needs ammo; the MG icon flashes at 0). |
| Enter | Start | Start / pause (RESUME · RESTART PHASE · MUSIC ON-OFF). |
| D | — | Debug: hitboxes + info. Press **V** inside debug for the frame viewer (↑/↓ sheet, ←/→ frame). |

Pistol = unlimited ammo. Machine gun = Deadpool's giant "Marked for Death" blaster, fed only by
bullet-box drops (+20, cap 99), auto-fire ~8/s, auto-swaps back to pistol at 0. Drops from horde
kills (20%): heart 40% / bullets 40% / **yellow W-box** 20% — the W-box summons Wolverine to
sprint across the screen and slash every horde enemy.

Timeline: Phase 1 (2:00 horde) → Sabretooth/Wolverine cutscene → Phase 2 (1:00) →
**Juggernaut** mid-boss (jump his dash, hit him while he's dazed, 3 hits; he drops his **helmet**
— pick it up) → Phase 3 (1:00) → **Loki** final boss (his ground waves must be jumped; he is
INVULNERABLE until you touch him carrying the helmet, then 3 hits) → ending → Miss Minutes
CONGRATS screen.

## Villain adjustments (per "adjust as needed based on what's available")

Everything was matched against the Marvel: Avengers Alliance section on The Spriters Resource:

| Design doc | In the game | Why |
|---|---|---|
| Cassandra Nova (final boss) | **Loki** | Cassandra doesn't exist in MAA. Loki is the most Void-canon replacement there is (the Void, Alioth, Miss Minutes and the "sacred timeline" are all Loki-series lore), he STANDS in every frame, and the Juggernaut-helmet-blocks-his-powers gag still works — it replaces his horns. All boss mechanics kept: ground waves every ~2s (jump-only), invulnerable + "NO EFFECT" until the helmet is placed, then 3 hits, waves speed up. Deadpool still says "I am Marvel Jesus" when he appears. |
| Scorpion (horde) | **Toad** | No Scorpion sheet in MAA. Toad is literally in the movie's Void gang, and his sheet has a real hop cycle + tongue-lash attack. |
| Sentinel | **Sentinel (Mark IV)** | Used the classic purple/maroon Mark IV Sentinel sheet (`Sentinels (Mark IV)` zip). |
| Miss Minutes | **Hand-drawn pixel art** | Not a MAA character; drawn as original pixel art (small talking sprite + big CONGRATS image). |
| Items/FX/UI/backgrounds | **Hand-drawn + rip-sourced FX** | Hearts, ammo, W-box, gun icons, speech bubble, Void parallax layers (dusk sky + Alioth smoke wall, ruins with the toppled "20" monument letters, cracked ground) are original pixel art. Explosions, sparks, Electro's lightning bolts, Magneto's metal chunk, Loki's red magic waves, the Juggernaut helmet, Sabretooth's popped head, and the barrel/rock props come from the rips themselves. |

Unchanged horde (all from MAA sheets): Magneto & Electro (the only ranged ones), Doctor Octopus,
Doctor Doom, Red Skull, Mister Sinister, Kingpin, Sentinel, MODOK, Blob — plus Toad. All die in
one hit and recycle forever; it's the Void. Juggernaut (mid-boss), Sabretooth + Wolverine
(cutscene), and Deadpool (player, Classic red suit) are as scripted.

Notes forced by the source material (MAA is a turn-based game, its rips have no run cycles):
run/walk animations are approximated from stance/lunge/leap frames; Deadpool's machine gun is
MAA's giant "Marked for Death" blaster (one pose + recoil shake) and his victory is his laptop
taunt; Juggernaut has no helmetless frame, so his defeat keeps the dome and the helmet simply
drops as a pickup.

## Audio

`game.js` plays two **original** chiptune loops through WebAudio (no licensed melodies), plus all
SFX. To use your own 8-bit covers instead, export real audio files to:

```
assets/audio/level.mp3   (horde phases — e.g. your Bye Bye Bye cover)
assets/audio/boss.mp3    (Loki fight — e.g. your Like a Prayer cover)
```

If those files exist they are used automatically (music starts on the first key press because
browsers block autoplay; toggle in the pause menu).

## Files

```
index.html          canvas shell (960×540 internal, pixelated upscale)
game.js             the whole game — all tunables in CFG at the top
assets/atlas.js     generated sprite atlas (script tag: works on file:// where fetch() can't)
assets/atlas.json   same data as JSON
assets/sprites/     16 packed character sheets + fx + ui + backgrounds + Miss Minutes
assets/audio/       (optional) level.mp3 / boss.mp3
tools/              asset pipeline: download rips → auto-slice → pack (see tools/README.md)
```

The internal resolution is 960×540 (not the doc's 320×240) because MAA sprites are large painted
art (~150–350 px tall), not 8-bit tiles; everything else in the doc's spec — controls, smart
attack, drops, phase script, dialogue lines and speakers, HUD, debug mode, missing-asset
reporting — is implemented as written.
