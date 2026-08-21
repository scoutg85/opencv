#!/usr/bin/env python3
"""Pack curated frames from TSR rips into game-ready sheets + atlas.json.

Frame refs: int = island index from islands_<name>.json; [x,y,w,h] = explicit
rect in the raw sheet; "file:<name>" = standalone file in raw/sentinel_zip.
"""
import json, os
from PIL import Image

SCRATCH = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SCRATCH, 'out_assets')

CURATION = {
    'deadpool': {'anims': {
        'idle': [1], 'run': [14, 22, 20, 29], 'jump': [14, 28, 29],
        'kneel': [16], 'kneelmove': [16, 14], 'slash': [32, 17, 34],
        'pistol': [24, 25], 'mg': [38], 'hit': [12], 'place': [27],
        'victory': [10, 11]}},
    'wolverine': {'anims': {'idle': [6, 7], 'run': [9, 8, 19, 17], 'slash': [13, 27, 20]}},
    'juggernaut': {'anims': {
        'idle': [0, 17], 'charge': [6, 7, 10], 'crash': [19], 'dazed': [22],
        'getup': [21], 'hit': [20], 'defeat': [22]}},
    'sabretooth': {'anims': {'stalk': [37, 38], 'snarl': [1, 24], 'hit': [30], 'ko': [36]}},
    'loki': {'anims': {'idle': [6, 7], 'cast': [8, 44, 45], 'hit': [12], 'defeat': [42]}},
    'magneto': {'anims': {'move': [11, 12], 'attack': [24, 17, 18]}},
    'electro': {'anims': {'move': [8, 12], 'attack': [14, 15, 13]}},
    'doc_ock': {'anims': {'move': [5, 6, 11, 6], 'attack': [14, 12, 7]}},
    'doctor_doom': {'anims': {
        'move': [[672, 307, 254, 206], [930, 307, 255, 206], [1192, 307, 258, 206]],
        'attack': [[1453, 293, 292, 220], 13, 12]}},
    'red_skull': {'anims': {'move': [14, 15], 'attack': [17, 33, 34]}},
    'mister_sinister': {'anims': {'move': [13, 15], 'attack': [13, 43, 12]}},
    'kingpin': {'anims': {'idle': [8], 'move': [21, 19], 'attack': [42, 43, 37]}},
    'modok': {'anims': {'move': [0, 17], 'attack': [7, 9, 6]}},
    'toad': {'anims': {'move': [12, 15, 14, 13], 'attack': [0, 29, 28]}},
    'blob': {'anims': {'idle': [0], 'move': [20, 21, 22], 'attack': [4, 19, 5]}},
    'sentinel': {'zip': True, 'anims': {
        'idle': ['file:1 idle.png'], 'move': ['file:1 Image10.png', 'file:1 Image14.png'],
        'attack': ['file:1 Image20.png', 'file:1 Image17.png', 'file:1 Image15.png']}},
}

# FX pulled from various sheets: name -> (source_sheet, ref)
FX = {
    'poof0': ('mister_sinister', 18), 'poof1': ('mister_sinister', 28), 'poof2': ('mister_sinister', 35),
    'spark': ('mister_sinister', 21),
    'shard': ('magneto', 26),
    'bolt0': ('electro', 44), 'bolt1': ('electro', 45),
    'wave0': ('loki', 29), 'wave1': ('loki', 28), 'orb': ('loki', 38),
    'head': ('sabretooth', 3),
    'barrel': ('sabretooth', 40), 'rock': ('sabretooth', 41),
    'helmet': ('juggernaut', 15),
    'mgicon': ('red_skull', 7),
}

MAXW = 1900
PAD = 2

# Post-processing: (sheet, island_ref) -> list of ops.
# 'erase_ellipse' args are fractional (x0, y0, x1, y1) of the frame box.
POSTPROC = {
    ('sabretooth', 36): [('erase_ellipse', 0.25, 0.08, 0.58, 0.31)],  # KO body loses its head (head pops off separately)
}

def postprocess(name, ref, crop):
    ops = POSTPROC.get((name, ref if isinstance(ref, int) else None))
    if not ops:
        return crop
    from PIL import ImageDraw
    crop = crop.copy()
    d = ImageDraw.Draw(crop)
    w, h = crop.size
    for op in ops:
        if op[0] == 'erase_ellipse':
            x0, y0, x1, y1 = op[1] * w, op[2] * h, op[3] * w, op[4] * h
            d.ellipse([x0, y0, x1, y1], fill=(0, 0, 0, 0))
    return crop

def load_islands(name):
    return json.load(open(os.path.join(SCRATCH, f'islands_{name}.json')))

def resolve(name, ref, islands_cache, img_cache):
    """Return a PIL crop for a frame ref."""
    if isinstance(ref, str) and ref.startswith('file:'):
        return Image.open(os.path.join(SCRATCH, 'raw', 'sentinel_zip', ref[5:])).convert('RGBA')
    if name not in img_cache:
        img_cache[name] = Image.open(os.path.join(SCRATCH, 'raw', f'{name}.png')).convert('RGBA')
    im = img_cache[name]
    if isinstance(ref, list):
        x, y, w, h = ref
    else:
        if name not in islands_cache:
            islands_cache[name] = load_islands(name)
        b = islands_cache[name][ref]
        x, y, w, h = b['x'], b['y'], b['w'], b['h']
    return im.crop((x, y, x + w, y + h))

def pack_frames(crops):
    """Row-pack crops; return (sheet_img, rects)."""
    rects, x, y, rowh = [], PAD, PAD, 0
    for c in crops:
        w, h = c.size
        if x + w + PAD > MAXW and x > PAD:
            x, y = PAD, y + rowh + PAD
            rowh = 0
        rects.append((x, y, w, h))
        x += w + PAD
        rowh = max(rowh, h)
    W = max(r[0] + r[2] for r in rects) + PAD
    H = y + rowh + PAD
    sheet = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for c, r in zip(crops, rects):
        sheet.paste(c, (r[0], r[1]))
    return sheet, rects

def main():
    os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)
    islands_cache, img_cache = {}, {}
    atlas = {'sheets': {}}
    for name, spec in CURATION.items():
        # unique refs in order of first use
        uniq, order = [], {}
        for anim, refs in spec['anims'].items():
            for r in refs:
                key = json.dumps(r)
                if key not in order:
                    order[key] = len(uniq)
                    uniq.append(r)
        crops = [postprocess(name, r, resolve(name, r, islands_cache, img_cache)) for r in uniq]
        sheet, rects = pack_frames(crops)
        sheet.save(os.path.join(OUT, 'sprites', f'{name}.png'))
        anims = {a: [order[json.dumps(r)] for r in refs] for a, refs in spec['anims'].items()}
        atlas['sheets'][name] = {'img': f'sprites/{name}.png',
                                 'frames': [list(r) for r in rects], 'anims': anims}
        print(f'{name}: {len(uniq)} frames -> {sheet.size}')
    # fx sheet
    fx_names = list(FX.keys())
    crops = [resolve(src, ref, islands_cache, img_cache) for src, ref in FX.values()]
    sheet, rects = pack_frames(crops)
    sheet.save(os.path.join(OUT, 'sprites', 'fx.png'))
    atlas['fx'] = {'img': 'sprites/fx.png',
                   'frames': {n: list(r) for n, r in zip(fx_names, rects)}}
    print('fx:', len(fx_names), '->', sheet.size)
    json.dump(atlas, open(os.path.join(OUT, 'atlas.json'), 'w'))
    total = sum(os.path.getsize(os.path.join(OUT, 'sprites', f))
                for f in os.listdir(os.path.join(OUT, 'sprites')))
    print(f'total sprite bytes: {total/1e6:.2f} MB')

if __name__ == '__main__':
    main()
