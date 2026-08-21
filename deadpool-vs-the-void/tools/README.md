# Asset pipeline

Turns Marvel: Avengers Alliance sprite rips from The Spriters Resource into the packed,
game-ready sheets in `../assets/sprites/` plus the atlas.

```
pip install pillow numpy scipy
./build.sh
```

Steps (each runnable on its own from this directory):

1. **`fetch_sheets.py`** — downloads the 16 sheets listed in its `SHEETS` table into `raw/`
   (gitignored). The Sentinel sheet is a zip of individual frames and is extracted to
   `raw/sentinel_zip/`.
2. **`slice_all.py`** — finds every sprite "island" in each sheet (alpha connected-components
   with dilation), writes `islands_<name>.json` (bounding boxes in reading order) and a numbered
   `contact_<name>.png` proof sheet for eyeballing.
3. **`pack.py`** — the hand-curated frame selection lives in its `CURATION` table (island
   indices per animation, chosen by looking at the contact sheets) and `FX` table (explosions,
   lightning bolts, the metal chunk, Loki's red waves, the helmet, the popped head, props).
   Packs the chosen frames into per-character sheets + `atlas.json`. `POSTPROC` holds pixel
   surgery (e.g. erasing Sabretooth's head from his KO frame so the head-pop gag works).
4. **`drawn_assets.py`** — original pixel art drawn in code: HUD icons, speech bubble,
   Miss Minutes, tracers, and the three parallax Void background layers. Adds the `ui` section
   to the atlas — **always run it after `pack.py`**, which rewrites atlas.json from scratch.
5. `build.sh` copies `out_assets/` into `../assets/` and regenerates `assets/atlas.js`
   (the atlas as a script tag, because `fetch()` of JSON does not work on `file://`).

`zoom.py <name> <idx...>` renders enlarged views of chosen islands — useful when curating.

Note: island indices in `CURATION` depend on the exact sheets as downloaded; if TSR ever
updates a sheet, re-check the contact sheet before rebuilding.

Sprite credit: Marvel: Avengers Alliance (Playdom/Disney), ripped by Cyrus Annihilator and
contributors on The Spriters Resource. Personal, non-commercial fan use only.
