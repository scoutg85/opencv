#!/usr/bin/env python3
"""Generate original pixel-art UI/FX/background assets (PIL, nearest upscale)."""
import json, os, math, random
from PIL import Image, ImageDraw

SCRATCH = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SCRATCH, 'out_assets')
random.seed(7)

def up(im, k=4):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)

def px_img(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)

# ---------- small icons (drawn at 1x, scaled 4x) ----------
def heart(full=True):
    im, d = px_img(15, 13)
    red, dark, hi = (214, 36, 56, 255), (128, 16, 32, 255), (255, 120, 130, 255)
    if not full:
        red, dark, hi = (70, 70, 80, 255), (40, 40, 48, 255), (110, 110, 120, 255)
    pts = [(3,1),(5,1),(6,2),(7,3),(8,2),(9,1),(11,1),(13,3),(13,6),(7,12),(1,6),(1,3)]
    d.polygon(pts, fill=red, outline=dark)
    d.point([(3,2),(4,2),(3,3)], fill=hi)
    return im

def bullet_box():
    im, d = px_img(16, 14)
    d.rectangle([0, 3, 15, 13], fill=(90, 108, 60, 255), outline=(40, 52, 24, 255))
    d.rectangle([0, 3, 15, 5], fill=(120, 140, 84, 255))
    d.rectangle([6, 2, 9, 6], fill=(40, 52, 24, 255))
    for i, x in enumerate((3, 7, 11)):
        d.rectangle([x, 8, x + 1, 12], fill=(232, 176, 60, 255))
        d.point((x, 7), fill=(255, 220, 120, 255))
    return im

def wbox():
    im, d = px_img(16, 14)
    d.rectangle([0, 1, 15, 13], fill=(240, 200, 40, 255), outline=(90, 60, 0, 255))
    d.rectangle([1, 2, 14, 3], fill=(255, 232, 120, 255))
    d.line([(2, 4), (4, 10)], fill=(20, 20, 20, 255), width=2)
    d.line([(4, 10), (7, 5)], fill=(20, 20, 20, 255), width=2)
    d.line([(7, 5), (10, 10)], fill=(20, 20, 20, 255), width=2)
    d.line([(10, 10), (12, 4)], fill=(20, 20, 20, 255), width=2)
    return im

def pistol_icon():
    im, d = px_img(18, 12)
    gold, dark = (230, 190, 70, 255), (120, 90, 20, 255)
    d.rectangle([1, 2, 15, 5], fill=gold, outline=dark)          # slide
    d.rectangle([16, 3, 17, 4], fill=(60, 60, 60, 255))          # muzzle
    d.rectangle([3, 6, 7, 11], fill=gold, outline=dark)          # grip
    d.rectangle([8, 6, 10, 8], fill=dark)                        # trigger guard
    d.point([(2, 1)], fill=(255, 240, 180, 255))
    return im

def tracer():
    im, d = px_img(10, 4)
    d.rectangle([0, 1, 9, 2], fill=(255, 220, 90, 255))
    d.rectangle([6, 0, 9, 3], fill=(255, 250, 200, 255))
    return im

def mgtracer():
    im, d = px_img(16, 4)
    for x in (0, 6, 12):
        d.rectangle([x, 1, x + 3, 2], fill=(255, 200, 70, 255))
        d.point((x + 3, 1), fill=(255, 250, 200, 255))
    return im

def bubble():
    im, d = px_img(48, 26)
    d.rounded_rectangle([0, 0, 47, 19], radius=5, fill=(252, 252, 252, 255), outline=(20, 20, 20, 255), width=2)
    d.polygon([(8, 19), (16, 19), (8, 25)], fill=(252, 252, 252, 255))
    d.line([(8, 19), (8, 25)], fill=(20, 20, 20, 255), width=2)
    d.line([(8, 25), (16, 20)], fill=(20, 20, 20, 255), width=2)
    return im

def miss_minutes(frame=0, big=False):
    s = 64 if big else 26
    im, d = px_img(s, int(s * 1.25))
    cx, cy, r = s // 2, s // 2, s // 2 - 2
    orange, dark_o, cream = (245, 148, 40, 255), (170, 90, 16, 255), (250, 236, 200, 255)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=orange, outline=dark_o, width=max(1, s // 26))
    fr = int(r * 0.72)
    d.ellipse([cx - fr, cy - fr, cx + fr, cy + fr], fill=cream, outline=dark_o)
    # ticks
    for a in range(0, 360, 30):
        x = cx + int(math.cos(math.radians(a)) * (fr - max(1, s // 20)))
        y = cy + int(math.sin(math.radians(a)) * (fr - max(1, s // 20)))
        d.point((x, y), fill=dark_o)
    ew = max(1, s // 16)
    ey = cy - fr // 3
    for exd in (-fr // 3, fr // 3):
        d.ellipse([cx + exd - ew, ey - ew * 2, cx + exd + ew, ey + ew], fill=(30, 30, 30, 255))
    # smile (open when talking frame 1)
    mw = fr // 2
    if frame == 0:
        d.arc([cx - mw, cy - mw // 2, cx + mw, cy + mw + 2], 20, 160, fill=(30, 30, 30, 255), width=max(1, s // 22))
    else:
        d.ellipse([cx - mw // 2, cy + 1, cx + mw // 2, cy + mw], fill=(120, 30, 30, 255), outline=(30, 30, 30, 255))
    # clock hands
    d.line([(cx, cy), (cx + fr // 2, cy - fr // 2)], fill=(200, 60, 30, 255), width=max(1, s // 26))
    d.line([(cx, cy), (cx - fr // 3, cy - fr // 5)], fill=(200, 60, 30, 255), width=max(1, s // 26))
    # arms: one waving
    aw = max(1, s // 20)
    d.line([(cx - r, cy), (cx - r - s // 6, cy - s // 4 if frame == 0 else cy - s // 3)], fill=dark_o, width=aw)
    d.ellipse([cx - r - s // 6 - aw * 2, (cy - s // 4 if frame == 0 else cy - s // 3) - aw * 2,
               cx - r - s // 6 + aw * 2, (cy - s // 4 if frame == 0 else cy - s // 3) + aw * 2], fill=(255, 255, 255, 255), outline=dark_o)
    d.line([(cx + r, cy + 2), (cx + r + s // 8, cy + s // 5)], fill=dark_o, width=aw)
    d.ellipse([cx + r + s // 8 - aw * 2, cy + s // 5 - aw * 2, cx + r + s // 8 + aw * 2, cy + s // 5 + aw * 2],
              fill=(255, 255, 255, 255), outline=dark_o)
    # legs + shoes
    ly = cy + r
    for lxd in (-r // 3, r // 3):
        d.line([(cx + lxd, ly), (cx + lxd, ly + s // 5)], fill=dark_o, width=aw)
        d.ellipse([cx + lxd - aw * 2, ly + s // 5 - aw, cx + lxd + aw * 2, ly + s // 5 + aw * 2], fill=(40, 30, 20, 255))
    return im

# ---------- backgrounds ----------
def bg_sky():
    W, H = 480, 270
    im, d = px_img(W, H)
    bands = [(94, 50, 96), (122, 58, 92), (150, 70, 82), (178, 88, 70), (204, 110, 62), (226, 136, 58), (240, 160, 64)]
    bh = H // len(bands) + 1
    for i, c in enumerate(bands):
        d.rectangle([0, i * bh, W, (i + 1) * bh], fill=c + (255,))
    # sun disc low on horizon
    d.ellipse([W // 2 - 26, H - 74, W // 2 + 26, H - 22], fill=(252, 214, 120, 255))
    d.rectangle([0, H - 52, W, H - 48], fill=(240, 160, 64, 255))
    # Alioth smoke storm rolling on horizon (dark violet cloud wall)
    for x in range(0, W, 4):
        h = 26 + int(14 * math.sin(x * 0.05) + 8 * math.sin(x * 0.13 + 2) + random.randint(-3, 3))
        d.rectangle([x, H - h, x + 3, H], fill=(38, 20, 46, 255))
        d.rectangle([x, H - h, x + 3, H - h + 3], fill=(64, 34, 76, 255))
    # streak clouds
    for i in range(9):
        cw, cy_ = random.randint(30, 90), random.randint(8, H - 90)
        cx_ = random.randint(0, W - 20)
        d.rectangle([cx_, cy_, cx_ + cw, cy_ + 3], fill=(255, 226, 180, 90))
    return up(im, 2)  # 960x540

def bg_far():
    W, H = 512, 80
    im, d = px_img(W, H)
    sil, sil2 = (52, 30, 40, 255), (70, 42, 50, 255)
    ground_y = H - 12
    d.rectangle([0, ground_y, W, H], fill=sil)
    # rolling dune line
    for x in range(W):
        h = int(5 * math.sin(x * 0.05) + 3 * math.sin(x * 0.021 + 1))
        d.line([(x, ground_y - 4 + h % 4), (x, H)], fill=sil)
    # toppled giant "20" monument letters (movie landmark)
    d.polygon([(40, ground_y), (70, ground_y - 26), (86, ground_y - 18), (58, ground_y)], fill=sil2)   # leaning 2
    d.rectangle([52, ground_y - 30, 78, ground_y - 22], fill=sil2)
    d.ellipse([92, ground_y - 22, 124, ground_y + 4], outline=sil2, width=6)                            # half-buried 0
    # crashed jet: fuselage + tail fin
    d.polygon([(190, ground_y), (250, ground_y - 10), (256, ground_y - 4), (196, ground_y + 4)], fill=sil2)
    d.polygon([(238, ground_y - 8), (250, ground_y - 30), (256, ground_y - 6)], fill=sil2)
    # half-buried giant skull
    d.ellipse([320, ground_y - 26, 372, ground_y + 10], fill=sil2)
    d.rectangle([330, ground_y - 4, 340, ground_y + 2], fill=sil)
    d.rectangle([350, ground_y - 4, 360, ground_y + 2], fill=sil)   # eye sockets
    # ruined spires
    for bx, bh_ in ((420, 34), (444, 24), (470, 40), (12, 22), (150, 18), (290, 20)):
        d.polygon([(bx, ground_y), (bx + 6, ground_y - bh_), (bx + 14, ground_y)], fill=sil)
    return up(im, 2)  # 1024x160

def bg_ground():
    W, H = 256, 48
    im, d = px_img(W, H)
    top, mid, deep = (196, 150, 96, 255), (160, 116, 72, 255), (120, 84, 52, 255)
    d.rectangle([0, 0, W, 6], fill=top)
    d.rectangle([0, 6, W, 20], fill=mid)
    d.rectangle([0, 20, W, H], fill=deep)
    # cracks
    for i in range(14):
        x = random.randint(0, W - 1)
        y = random.randint(1, 16)
        for k in range(random.randint(3, 8)):
            d.point(((x + random.randint(-1, 1)) % W, y + k), fill=(96, 64, 40, 255))
    # pebbles/bones
    for i in range(22):
        x, y = random.randint(0, W - 4), random.randint(4, H - 6)
        c = (216, 200, 170, 255) if random.random() < 0.3 else (140, 100, 62, 255)
        d.rectangle([x, y, x + random.randint(1, 3), y + 1], fill=c)
    # subtle top highlight
    d.rectangle([0, 0, W, 1], fill=(226, 184, 128, 255))
    return up(im, 2)  # 512x96

def main():
    os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)
    ui = {
        'heart': up(heart(True)), 'heart_empty': up(heart(False)),
        'bulletbox': up(bullet_box()), 'wbox': up(wbox()),
        'pistol_icon': up(pistol_icon()),
        'tracer': up(tracer(), 3), 'mgtracer': up(mgtracer(), 3),
        'bubble': up(bubble(), 3),
        'missm0': up(miss_minutes(0), 3), 'missm1': up(miss_minutes(1), 3),
    }
    # pack ui sheet
    PAD = 2
    x, rowh = PAD, 0
    rects = {}
    W = 620
    y = PAD
    for n, im in ui.items():
        if x + im.width + PAD > W:
            x, y, rowh = PAD, y + rowh + PAD, 0
        rects[n] = (x, y, im.width, im.height)
        x += im.width + PAD
        rowh = max(rowh, im.height)
    H = y + rowh + PAD
    sheet = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for n, im in ui.items():
        sheet.paste(im, rects[n][:2])
    sheet.save(os.path.join(OUT, 'sprites', 'ui.png'))
    mmb = up(miss_minutes(0, big=True), 4)
    mmb.save(os.path.join(OUT, 'sprites', 'miss_minutes_big.png'))
    bg_sky().save(os.path.join(OUT, 'sprites', 'bg_sky.png'))
    bg_far().save(os.path.join(OUT, 'sprites', 'bg_far.png'))
    bg_ground().save(os.path.join(OUT, 'sprites', 'bg_ground.png'))
    atlas = json.load(open(os.path.join(OUT, 'atlas.json')))
    atlas['ui'] = {'img': 'sprites/ui.png', 'frames': {n: list(r) for n, r in rects.items()}}
    json.dump(atlas, open(os.path.join(OUT, 'atlas.json'), 'w'))
    print('ui sheet', sheet.size, '| big MM', mmb.size)

if __name__ == '__main__':
    main()
