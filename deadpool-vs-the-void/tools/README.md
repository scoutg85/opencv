# Asset pipeline (MvC2 official artwork edition)

Turns the official Marvel vs. Capcom 2 character artwork from archive.org into the
game-ready cutouts in `../assets/chars/`, plus the drawn pixel UI/FX/backgrounds.

```
pip install pillow numpy scipy
./build.sh
```

Steps (each runnable on its own from this directory):

1. **`fetch_mvc2.py`** — downloads
   "Marvel vs. Capcom 2 - New Age of Heroes (Official Asset Artwork).zip" from the
   [RetroGameOfficialAssetArtwork](https://archive.org/details/RetroGameOfficialAssetArtwork)
   item (retrying across mirror nodes — archive.org 5xxes intermittently) and extracts the
   53 artwork PNGs into `mvc2/` (gitignored).

   Note: the "X-Men: Children of the Atom (Sega Saturn Japanese Version)" pack is listed in
   that item's description but its file was never uploaded (everything after "Street
   Fighter" alphabetically is missing from the item), so this game uses the MvC2 pack only.

2. **`cutout_mvc2.py`** — cuts each character out of its white background:
   border flood-fill (keeps white highlights inside the art), drops disconnected debris
   (the corner watermark), nukes enclosed pure-white pockets (between limbs/coils),
   feathers edges, fades bottoms that touch the frame edge (the Void-mist look), and
   generates the special pieces: the **helmet** (Juggernaut's dome, cavity shaded),
   **sab_head** (Sabretooth's poppable head), and **sab_ko** (his headless KO body).
   The `CAST` table maps character names to artwork numbers.

3. **`drawn_assets.py`** — original pixel art drawn in code: HUD icons, tracers, photon /
   sword / wave projectiles, poofs, sparks, slash arcs, mist, speech bubble, Miss Minutes,
   and the three parallax Void background layers.

4. **`gen_atlas.py`** — assembles `../assets/atlas.js` (chars + pieces + ui frame table).
   `FACES_RIGHT` marks artworks that natively face right so the engine flips correctly.

Characters are single illustrations, puppet-animated by the engine (`drawPuppet` in
`game.js`): run-bob, lunge, squash, dazed tilt, KO sink-into-the-mist, and so on.

Artwork credit: Marvel vs. Capcom 2 official character art (Capcom/Marvel), preserved in
the Retro Game Official Asset Artwork collection on archive.org. Personal, non-commercial
fan use only.
