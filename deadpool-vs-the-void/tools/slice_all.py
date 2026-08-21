#!/usr/bin/env python3
"""Detect sprite islands in TSR sheets, emit numbered contact sheets + bbox JSON."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SCRATCH = os.path.dirname(os.path.abspath(__file__))

def islands_of(path, dilate=6, min_area=150):
    im = Image.open(path).convert('RGBA')
    a = np.array(im.getchannel('A')) > 8
    dil = ndimage.binary_dilation(a, structure=np.ones((3, 3), bool), iterations=dilate)
    labels, n = ndimage.label(dil)
    out = []
    slices = ndimage.find_objects(labels)
    for i, sl in enumerate(slices, start=1):
        if sl is None:
            continue
        sub = a[sl] & (labels[sl] == i)
        area = int(sub.sum())
        if area < min_area:
            continue
        ys, xs = np.nonzero(sub)
        y0, x0 = sl[0].start, sl[1].start
        bx0, bx1 = x0 + int(xs.min()), x0 + int(xs.max()) + 1
        by0, by1 = y0 + int(ys.min()), y0 + int(ys.max()) + 1
        out.append({'x': bx0, 'y': by0, 'w': bx1 - bx0, 'h': by1 - by0, 'area': area})
    # reading order: bin rows by y-center
    out.sort(key=lambda b: b['y'] + b['h'] / 2)
    rows, cur, last_cy = [], [], None
    for b in out:
        cy = b['y'] + b['h'] / 2
        if last_cy is None or abs(cy - last_cy) < 130:
            cur.append(b)
        else:
            rows.append(cur); cur = [b]
        last_cy = cy if last_cy is None else (last_cy * (len(cur) - 1) + cy) / len(cur)
    if cur:
        rows.append(cur)
    ordered = []
    for r in rows:
        r.sort(key=lambda b: b['x'])
        ordered.extend(r)
    return im, ordered

def contact_sheet(im, islands, out_png, cols=8, cell_w=150, cell_h=170, thumb=128):
    rows = (len(islands) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell_w, max(1, rows) * cell_h), (240, 240, 240, 255))
    d = ImageDraw.Draw(sheet)
    for idx, b in enumerate(islands):
        crop = im.crop((b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h']))
        s = min(thumb / crop.width, thumb / crop.height, 1.0)
        t = crop.resize((max(1, int(crop.width * s)), max(1, int(crop.height * s))), Image.LANCZOS)
        cx, cy = (idx % cols) * cell_w, (idx // cols) * cell_h
        # checker backdrop so white/dark sprites both visible
        for yy in range(cy + 20, cy + cell_h, 10):
            for xx in range(cx, cx + cell_w, 10):
                if ((xx // 10) + (yy // 10)) % 2 == 0:
                    d.rectangle([xx, yy, xx + 9, yy + 9], fill=(214, 214, 214, 255))
        sheet.paste(t, (cx + (cell_w - t.width) // 2, cy + 20 + (cell_h - 20 - t.height) // 2), t)
        d.rectangle([cx, cy, cx + cell_w - 1, cy + 18], fill=(180, 30, 30, 255))
        d.text((cx + 4, cy + 3), f"#{idx}  {b['w']}x{b['h']}", fill=(255, 255, 255, 255))
        d.rectangle([cx, cy, cx + cell_w - 1, cy + cell_h - 1], outline=(120, 120, 120, 255))
    sheet.convert('RGB').save(out_png)

def main():
    names = sys.argv[1:] or [
        'deadpool', 'wolverine', 'juggernaut', 'sabretooth', 'loki', 'magneto',
        'electro', 'doc_ock', 'doctor_doom', 'red_skull', 'mister_sinister',
        'kingpin', 'modok', 'toad', 'blob']
    for n in names:
        p = os.path.join(SCRATCH, 'raw', f'{n}.png')
        im, isl = islands_of(p)
        json.dump(isl, open(os.path.join(SCRATCH, f'islands_{n}.json'), 'w'))
        contact_sheet(im, isl, os.path.join(SCRATCH, f'contact_{n}.png'))
        print(f'{n}: {len(isl)} islands, sheet {im.size}')

if __name__ == '__main__':
    main()
