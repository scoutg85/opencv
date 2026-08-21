#!/usr/bin/env python3
"""Render a zoom strip of selected islands: zoom.py <name> <idx> [idx...]"""
import json, os, sys
from PIL import Image, ImageDraw

SCRATCH = os.path.dirname(os.path.abspath(__file__))

def main():
    name = sys.argv[1]
    idxs = [int(x) for x in sys.argv[2:]]
    isl = json.load(open(os.path.join(SCRATCH, f'islands_{name}.json')))
    im = Image.open(os.path.join(SCRATCH, 'raw', f'{name}.png')).convert('RGBA')
    TH, cols = 210, 8
    cell_w, cell_h = 230, 240
    rows = (len(idxs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell_w, rows * cell_h), (235, 235, 235))
    d = ImageDraw.Draw(sheet)
    for k, i in enumerate(idxs):
        b = isl[i]
        crop = im.crop((b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h']))
        s = min(TH / crop.height, (cell_w - 10) / crop.width, 2.5)
        t = crop.resize((max(1, int(crop.width * s)), max(1, int(crop.height * s))), Image.LANCZOS)
        cx, cy = (k % cols) * cell_w, (k // cols) * cell_h
        for yy in range(cy + 22, cy + cell_h, 12):
            for xx in range(cx, cx + cell_w, 12):
                if ((xx // 12) + (yy // 12)) % 2 == 0:
                    d.rectangle([xx, yy, xx + 11, yy + 11], fill=(215, 215, 215))
        sheet.paste(t, (cx + (cell_w - t.width) // 2, cy + 22 + (cell_h - 22 - t.height) // 2), t)
        d.rectangle([cx, cy, cx + cell_w - 1, cy + 20], fill=(20, 90, 160))
        d.text((cx + 5, cy + 4), f"#{i}", fill=(255, 255, 255))
        d.rectangle([cx, cy, cx + cell_w - 1, cy + cell_h - 1], outline=(120, 120, 120))
    out = os.path.join(SCRATCH, f'zoom_{name}.png')
    sheet.save(out)
    print(out, sheet.size)

if __name__ == '__main__':
    main()
