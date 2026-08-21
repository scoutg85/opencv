#!/usr/bin/env python3
"""Cut characters out of the official MvC2 white-background artwork.

Flood-fills near-white from the borders (keeps white highlights inside the
character), drops disconnected debris (the corner watermark), feathers edges,
fades bottoms that touch the frame edge (Void-mist look), and saves per-
character RGBA cutouts plus special sub-pieces (Juggernaut's helmet dome,
Sabretooth's poppable head + headless KO variant).
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'mvc2')
OUT = os.path.join(HERE, 'cutouts')

# name -> artwork number in the pack
CAST = {
    'cable': 28,            # player (Deadpool stand-in — MvC2 has no Deadpool)
    'wolverine': 8,         # ally (yellow/blue, claws out)
    'wolverine_bone': 48,   # W-box sweep variant (bone claws)
    'sabretooth': 1,        # cutscene villain
    'juggernaut': 12,       # mid-boss (helmet!)
    'thanos': 24,           # final boss
    'sentinel': 2,
    'silver_samurai': 11,
    'omega_red': 35,
    'blackheart': 25,
    'shuma_gorath': 10,
    'venom': 40,
    'spiral': 16,
    'marrow': 3,
    'doctor_doom': 49,
}

# fractional (x0, y0, x1, y1) boxes INSIDE the character's cropped cutout
PIECES = {
    'helmet': ('juggernaut', (0.34, 0.00, 0.745, 0.27)),  # the dome
    'sab_head': ('sabretooth', (0.45, 0.00, 0.86, 0.28)), # poppable head + mane
}
# headless KO variant: erase this fractional ellipse from sabretooth
SAB_KO_ERASE = (0.44, -0.04, 0.79, 0.27)

WHITE_MIN = 232      # min channel above this AND low saturation = background-ish
SAT_MAX = 26

def extract(num):
    path = os.path.join(SRC, f'Marvel_Vs_Capcom_2_1280x1024_{num:04d}.png')
    rgb = np.array(Image.open(path).convert('RGB')).astype(int)
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    whiteish = (mn > WHITE_MIN) & ((mx - mn) < SAT_MAX)
    # flood the background from the border
    lab, n = ndimage.label(whiteish)
    border_labels = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    border_labels.discard(0)
    bg = np.isin(lab, list(border_labels))
    fg = ~bg
    # drop disconnected debris (watermark, specks): keep big components near the main one
    flab, fn = ndimage.label(fg)
    if fn > 1:
        sizes = ndimage.sum(fg, flab, range(1, fn + 1))
        main = int(np.argmax(sizes)) + 1
        ys, xs = np.nonzero(flab == main)
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        keep = np.zeros(fn + 1, bool)
        keep[main] = True
        for i in range(1, fn + 1):
            if i == main or sizes[i - 1] < 1200:
                continue
            iys, ixs = np.nonzero(flab == i)
            if (iys.min() < y1 + 40 and iys.max() > y0 - 40 and
                    ixs.min() < x1 + 40 and ixs.max() > x0 - 40 and sizes[i - 1] > 3000):
                keep[i] = True
        fg = keep[flab]
    # nuke enclosed pure-white pockets (bg trapped between limbs/coils):
    # flat, near-255 regions inside the silhouette are background, painted
    # whites (fur, metal, highlights) have texture and shading
    pocket = whiteish & fg
    plab, pn = ndimage.label(pocket)
    for i in range(1, pn + 1):
        sel = plab == i
        area = int(sel.sum())
        if area < 250:
            continue
        vals = mn[sel]
        if vals.mean() > 247 and vals.std() < 5:
            fg[sel] = False
    alpha = (fg * 255).astype(np.uint8)
    # feather the edge slightly
    a_im = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.1))
    alpha = np.array(a_im)
    alpha[np.array(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) == 0] = 0
    out = np.dstack([rgb.astype(np.uint8), alpha])
    # crop to content
    ys, xs = np.nonzero(alpha > 8)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop = out[y0:y1, x0:x1]
    touches_bottom = y1 >= rgb.shape[0] - 3
    if touches_bottom:
        h = crop.shape[0]
        fade = np.ones(h)
        n_f = 26
        fade[-n_f:] = np.linspace(1, 0.04, n_f)
        crop = crop.copy()
        crop[:, :, 3] = (crop[:, :, 3] * fade[:, None]).astype(np.uint8)
    im = Image.fromarray(crop, 'RGBA')
    if im.height > 760:
        s = 760 / im.height
        im = im.resize((max(1, int(im.width * s)), 760), Image.LANCZOS)
    return im, touches_bottom

def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for name, num in CAST.items():
        im, tb = extract(num)
        im.save(os.path.join(OUT, f'{name}.png'))
        meta[name] = {'w': im.width, 'h': im.height, 'bottom_fade': bool(tb)}
        print(f'{name}: {im.width}x{im.height} fade={tb}')
    # special pieces
    for pname, (src, box) in PIECES.items():
        im = Image.open(os.path.join(OUT, f'{src}.png')).convert('RGBA')
        x0, y0, x1, y1 = (int(box[0] * im.width), int(max(0, box[1]) * im.height),
                          int(box[2] * im.width), int(box[3] * im.height))
        piece = im.crop((x0, y0, x1, y1))
        if pname == 'helmet':
            # shade the face opening so the dome reads as an empty helmet
            pd = ImageDraw.Draw(piece)
            pw, ph = piece.size
            mask = piece.getchannel('A').point(lambda a: 255 if a > 40 else 0)
            dark = Image.new('RGBA', piece.size, (0, 0, 0, 0))
            dd = ImageDraw.Draw(dark)
            dd.ellipse([-pw * 0.16, ph * 0.38, pw * 0.28, ph * 1.02], fill=(58, 30, 24, 255))
            piece.paste(dark, (0, 0), Image.composite(dark.getchannel('A'), Image.new('L', piece.size, 0), mask))
        piece.save(os.path.join(OUT, f'{pname}.png'))
        print(f'{pname}: {x1-x0}x{y1-y0} from {src}')
    # headless Sabretooth KO variant
    sab = Image.open(os.path.join(OUT, 'sabretooth.png')).convert('RGBA')
    d = ImageDraw.Draw(sab)
    e = SAB_KO_ERASE
    d.ellipse([e[0] * sab.width, e[1] * sab.height, e[2] * sab.width, e[3] * sab.height],
              fill=(0, 0, 0, 0))
    sab.save(os.path.join(OUT, 'sab_ko.png'))
    print('sab_ko written')
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
    # contact sheet for review
    files = list(CAST.keys())
    cols, cw, ch = 5, 280, 300
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cw, rows * ch), (52, 42, 60))
    dr = ImageDraw.Draw(sheet)
    for i, n in enumerate(files):
        im = Image.open(os.path.join(OUT, f'{n}.png'))
        im.thumbnail((cw - 10, ch - 26))
        x, y = (i % cols) * cw, (i // cols) * ch
        sheet.paste(im, (x + (cw - im.width) // 2, y + 22 + (ch - 22 - im.height) // 2), im)
        dr.text((x + 6, y + 4), n, fill=(255, 220, 100))
        dr.rectangle([x, y, x + cw - 1, y + ch - 1], outline=(90, 80, 100))
    sheet.save(os.path.join(HERE, 'cutout_contact.png'))
    print('contact sheet written')

if __name__ == '__main__':
    main()
