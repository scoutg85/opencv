#!/bin/bash
# Rebuild all game assets from the MvC2 official artwork pack.
#   1. fetch_mvc2.py   -> tools/mvc2/       (archive.org download, 53 artworks)
#   2. cutout_mvc2.py  -> tools/cutouts/    (white-bg removal, pieces, mist fade)
#   3. drawn_assets.py -> tools/out_assets/ (original pixel UI/FX/backgrounds)
#   4. copy into ../assets, gen_atlas.py -> assets/atlas.js
# Requires: python3 with pillow, numpy, scipy.
set -e
cd "$(dirname "$0")"
python3 fetch_mvc2.py
python3 cutout_mvc2.py
python3 drawn_assets.py
mkdir -p ../assets/chars ../assets/sprites
for n in cable wolverine wolverine_bone sabretooth sab_ko juggernaut thanos sentinel \
         silver_samurai omega_red blackheart shuma_gorath venom spiral marrow doctor_doom \
         helmet sab_head; do
  cp "cutouts/$n.png" ../assets/chars/
done
cp out_assets/sprites/*.png ../assets/sprites/
python3 gen_atlas.py
echo "assets rebuilt."
