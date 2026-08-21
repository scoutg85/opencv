#!/bin/bash
# Rebuild all game assets from The Spriters Resource rips.
#   1. fetch_sheets.py  -> tools/raw/            (downloads the 16 MAA sheets)
#   2. slice_all.py     -> islands_*.json        (auto-detect sprite islands)
#   3. pack.py          -> out_assets/           (curated frames -> packed sheets + atlas)
#   4. drawn_assets.py  -> out_assets/           (original pixel UI/FX/backgrounds, adds 'ui' to atlas)
#   5. copy into ../assets and regenerate atlas.js
# Requires: python3 with pillow, numpy, scipy.
set -e
cd "$(dirname "$0")"
python3 fetch_sheets.py
python3 slice_all.py
python3 pack.py
python3 drawn_assets.py
cp out_assets/sprites/*.png ../assets/sprites/
cp out_assets/atlas.json ../assets/
python3 - <<'PY'
import json
atlas = json.load(open('out_assets/atlas.json'))
with open('../assets/atlas.js', 'w') as f:
    f.write('// Generated sprite atlas (frames curated from Marvel: Avengers Alliance rips)\n')
    f.write('window.ATLAS = ' + json.dumps(atlas) + ';\n')
print('atlas.js written:', 'ui' in atlas and 'fx' in atlas and len(atlas['sheets']) == 16)
PY
echo "assets rebuilt."
