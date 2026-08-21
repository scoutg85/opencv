#!/usr/bin/env python3
"""Original pixel-art UI/FX/backgrounds for DEADPOOL vs. THE VOID (MvC2 edition).

Everything here is drawn in code (no ripped pixels): HUD icons, projectile and
impact FX, slash arcs, mist, speech bubble, Miss Minutes, and the three Void
parallax layers. Writes out_assets/sprites/*.png + out_assets/ui_frames.json.
"""
import json, os, math, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out_assets')
random.seed(7)

def up(im, k=4):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)

def px_img(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)

# ---------- HUD icons ----------
def heart(full=True):
    im, d = px_img(15, 13)
    red, dark, hi = (214, 36, 56, 255), (128, 16, 32, 255), (255, 120, 130, 255)
    if not full:
        red, dark, hi = (70, 70, 80, 255), (40, 40, 48, 255), (110, 110, 120, 255)
    pts = [(3, 1), (5, 1), (6, 2), (7, 3), (8, 2), (9, 1), (11, 1), (13, 3), (13, 6), (7, 12), (1, 6), (1, 3)]
    d.polygon(pts, fill=red, outline=dark)
    d.point([(3, 2), (4, 2), (3, 3)], fill=hi)
    return im

def bullet_box():
    im, d = px_img(16, 14)
    d.rectangle([0, 3, 15, 13], fill=(90, 108, 60, 255), outline=(40, 52, 24, 255))
    d.rectangle([0, 3, 15, 5], fill=(120, 140, 84, 255))
    d.rectangle([6, 2, 9, 6], fill=(40, 52, 24, 255))
    for x in (3, 7, 11):
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
    d.rectangle([1, 2, 15, 5], fill=gold, outline=dark)
    d.rectangle([16, 3, 17, 4], fill=(60, 60, 60, 255))
    d.rectangle([3, 6, 7, 11], fill=gold, outline=dark)
    d.rectangle([8, 6, 10, 8], fill=dark)
    d.point([(2, 1)], fill=(255, 240, 180, 255))
    return im

def mg_icon():
    im, d = px_img(24, 12)
    grey, dark = (150, 150, 160, 255), (60, 60, 70, 255)
    d.rectangle([1, 3, 20, 6], fill=grey, outline=dark)        # body
    d.rectangle([21, 4, 23, 5], fill=(40, 40, 40, 255))        # muzzle
    d.rectangle([4, 7, 7, 11], fill=grey, outline=dark)        # grip
    d.rectangle([11, 7, 14, 10], fill=(90, 90, 100, 255), outline=dark)  # mag
    d.rectangle([2, 1, 6, 2], fill=dark)                       # sight
    d.point([(2, 4), (3, 4)], fill=(220, 220, 230, 255))
    return im

# ---------- projectiles / FX ----------
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

def photon(frame=0):
    s = 18
    im, d = px_img(s, s)
    c = s // 2
    r = 6 + frame
    d.ellipse([c - r, c - r, c + r, c + r], fill=(90, 230, 120, 120))
    d.ellipse([c - 4, c - 4, c + 4, c + 4], fill=(140, 255, 170, 255))
    d.ellipse([c - 2, c - 2, c + 2, c + 2], fill=(240, 255, 240, 255))
    for a in range(0, 360, 90):
        x = c + int(math.cos(math.radians(a + frame * 45)) * (r + 1))
        y = c + int(math.sin(math.radians(a + frame * 45)) * (r + 1))
        d.point((x, y), fill=(180, 255, 200, 255))
    return im

def sword():
    im, d = px_img(26, 7)
    d.polygon([(0, 3), (17, 1), (21, 3), (17, 5)], fill=(210, 215, 230, 255))
    d.line([(1, 3), (17, 3)], fill=(255, 255, 255, 255))
    d.rectangle([21, 2, 22, 4], fill=(120, 90, 30, 255))
    d.rectangle([23, 0, 24, 6], fill=(160, 120, 40, 255))
    d.rectangle([25, 2, 25, 4], fill=(90, 60, 20, 255))
    return im

def wave(frame=0):
    w, h = 52, 22
    im, d = px_img(w, h)
    for x in range(0, w, 2):
        hh = int(8 + 7 * abs(math.sin(x * 0.24 + frame * 1.6)))
        d.rectangle([x, h - hh, x + 1, h - 1], fill=(150, 60, 200, 210))
        d.rectangle([x, h - hh, x + 1, h - hh + 2], fill=(240, 200, 90, 255))
    d.rectangle([0, h - 3, w - 1, h - 1], fill=(90, 30, 130, 230))
    return im

def poof(frame=0):
    s = 30 + frame * 8
    im, d = px_img(s, s)
    c = s // 2
    cols = [(190, 120, 230, 235), (140, 80, 190, 210), (90, 50, 140, 170)]
    col = cols[frame]
    n = 7 + frame * 2
    for i in range(n):
        a = i * (360 / n) + frame * 20
        r = s * 0.28 + (i % 3) * 2
        x = c + int(math.cos(math.radians(a)) * r * 0.8)
        y = c + int(math.sin(math.radians(a)) * r * 0.8)
        pr = max(2, int(s * 0.16 - frame))
        d.ellipse([x - pr, y - pr, x + pr, y + pr], fill=col)
    if frame == 0:
        d.ellipse([c - 5, c - 5, c + 5, c + 5], fill=(255, 240, 160, 255))
    return im

def spark():
    s = 17
    im, d = px_img(s, s)
    c = s // 2
    for a in range(0, 360, 45):
        x = c + int(math.cos(math.radians(a)) * 7)
        y = c + int(math.sin(math.radians(a)) * 7)
        d.line([(c, c), (x, y)], fill=(255, 230, 120, 255))
    d.ellipse([c - 2, c - 2, c + 2, c + 2], fill=(255, 255, 230, 255))
    return im

def muzzle():
    im, d = px_img(12, 10)
    d.polygon([(0, 4), (7, 0), (5, 4), (11, 5), (5, 6), (7, 9)], fill=(255, 200, 80, 255))
    d.ellipse([1, 3, 5, 7], fill=(255, 250, 200, 255))
    return im

def slash_arc(frame=0):
    w, h = 34, 46
    im, d = px_img(w, h)
    wdt = 5 - frame * 2
    for i in range(3):
        d.arc([2 - i, 2, w * 2, h - 2], 115, 245, fill=(255, 255, 255, 240 - i * 60), width=max(1, wdt))
    d.arc([4, 6, w * 2 - 4, h - 6], 130, 230, fill=(180, 240, 255, 200), width=1)
    return im

def dust():
    im, d = px_img(14, 8)
    for x, y, r in ((3, 5, 2), (7, 4, 3), (11, 5, 2)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=(180, 150, 110, 150))
    return im

def mist():
    w, h = 70, 18
    im, d = px_img(w, h)
    for i in range(16):
        x = random.randint(0, w - 12)
        y = random.randint(6, h - 4)
        r = random.randint(4, 8)
        d.ellipse([x, y - r // 2, x + r * 2, y + r // 2], fill=(120, 90, 150, 60))
    for i in range(10):
        x = random.randint(0, w - 16)
        y = random.randint(9, h - 2)
        d.ellipse([x, y - 3, x + 14, y + 3], fill=(160, 130, 190, 45))
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
    for a in range(0, 360, 30):
        x = cx + int(math.cos(math.radians(a)) * (fr - max(1, s // 20)))
        y = cy + int(math.sin(math.radians(a)) * (fr - max(1, s // 20)))
        d.point((x, y), fill=dark_o)
    ew = max(1, s // 16)
    ey = cy - fr // 3
    for exd in (-fr // 3, fr // 3):
        d.ellipse([cx + exd - ew, ey - ew * 2, cx + exd + ew, ey + ew], fill=(30, 30, 30, 255))
    mw = fr // 2
    if frame == 0:
        d.arc([cx - mw, cy - mw // 2, cx + mw, cy + mw + 2], 20, 160, fill=(30, 30, 30, 255), width=max(1, s // 22))
    else:
        d.ellipse([cx - mw // 2, cy + 1, cx + mw // 2, cy + mw], fill=(120, 30, 30, 255), outline=(30, 30, 30, 255))
    d.line([(cx, cy), (cx + fr // 2, cy - fr // 2)], fill=(200, 60, 30, 255), width=max(1, s // 26))
    d.line([(cx, cy), (cx - fr // 3, cy - fr // 5)], fill=(200, 60, 30, 255), width=max(1, s // 26))
    aw = max(1, s // 20)
    ax = cx - r - s // 6
    ay = cy - s // 4 if frame == 0 else cy - s // 3
    d.line([(cx - r, cy), (ax, ay)], fill=dark_o, width=aw)
    d.ellipse([ax - aw * 2, ay - aw * 2, ax + aw * 2, ay + aw * 2], fill=(255, 255, 255, 255), outline=dark_o)
    bx, by = cx + r + s // 8, cy + s // 5
    d.line([(cx + r, cy + 2), (bx, by)], fill=dark_o, width=aw)
    d.ellipse([bx - aw * 2, by - aw * 2, bx + aw * 2, by + aw * 2], fill=(255, 255, 255, 255), outline=dark_o)
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
    d.ellipse([W // 2 - 26, H - 74, W // 2 + 26, H - 22], fill=(252, 214, 120, 255))
    d.rectangle([0, H - 52, W, H - 48], fill=(240, 160, 64, 255))
    for x in range(0, W, 4):
        h = 26 + int(14 * math.sin(x * 0.05) + 8 * math.sin(x * 0.13 + 2) + random.randint(-3, 3))
        d.rectangle([x, H - h, x + 3, H], fill=(38, 20, 46, 255))
        d.rectangle([x, H - h, x + 3, H - h + 3], fill=(64, 34, 76, 255))
    for i in range(9):
        cw, cy_ = random.randint(30, 90), random.randint(8, H - 90)
        cx_ = random.randint(0, W - 20)
        d.rectangle([cx_, cy_, cx_ + cw, cy_ + 3], fill=(255, 226, 180, 90))
    return up(im, 2)

def bg_far():
    W, H = 512, 80
    im, d = px_img(W, H)
    sil, sil2 = (52, 30, 40, 255), (70, 42, 50, 255)
    ground_y = H - 12
    d.rectangle([0, ground_y, W, H], fill=sil)
    for x in range(W):
        h = int(5 * math.sin(x * 0.05) + 3 * math.sin(x * 0.021 + 1))
        d.line([(x, ground_y - 4 + h % 4), (x, H)], fill=sil)
    d.polygon([(40, ground_y), (70, ground_y - 26), (86, ground_y - 18), (58, ground_y)], fill=sil2)
    d.rectangle([52, ground_y - 30, 78, ground_y - 22], fill=sil2)
    d.ellipse([92, ground_y - 22, 124, ground_y + 4], outline=sil2, width=6)
    d.polygon([(190, ground_y), (250, ground_y - 10), (256, ground_y - 4), (196, ground_y + 4)], fill=sil2)
    d.polygon([(238, ground_y - 8), (250, ground_y - 30), (256, ground_y - 6)], fill=sil2)
    d.ellipse([320, ground_y - 26, 372, ground_y + 10], fill=sil2)
    d.rectangle([330, ground_y - 4, 340, ground_y + 2], fill=sil)
    d.rectangle([350, ground_y - 4, 360, ground_y + 2], fill=sil)
    for bx, bh_ in ((420, 34), (444, 24), (470, 40), (12, 22), (150, 18), (290, 20)):
        d.polygon([(bx, ground_y), (bx + 6, ground_y - bh_), (bx + 14, ground_y)], fill=sil)
    return up(im, 2)

def bg_front():
    """Foreground overlap strip: the puppet-theater 'stage edge' that hides
    the popsicle-stick bottoms and slightly overlaps the characters."""
    W, H = 256, 26
    im, d = px_img(W, H)
    deep, dark, rim = (74, 48, 40, 255), (52, 32, 30, 255), (120, 82, 56, 255)
    # jagged rocky top edge
    for x in range(W):
        h = int(7 + 5 * math.sin(x * 0.11) + 3 * math.sin(x * 0.043 + 2) + random.randint(-1, 1))
        d.line([(x, H - 1), (x, H - h - 10)], fill=deep)
        d.point((x, H - h - 10), fill=rim)
        d.point((x, H - h - 9), fill=rim)
    d.rectangle([0, H - 8, W, H], fill=dark)
    # debris on the ridge
    for i in range(16):
        x, y = random.randint(0, W - 3), random.randint(H - 12, H - 3)
        d.rectangle([x, y, x + random.randint(1, 2), y + 1], fill=(96, 62, 46, 255))
    return up(im, 2)  # 512x52

def minivan():
    """Original pixel-art grey minivan (an Odyssey if you squint)."""
    W, H = 96, 42
    im, d = px_img(W, H)
    body, dark, glass, hi = (176, 180, 188, 255), (92, 96, 106, 255), (60, 92, 120, 255), (226, 230, 236, 255)
    # body: long sloped nose minivan profile, facing right
    d.polygon([(2, 26), (6, 16), (18, 9), (34, 5), (66, 5), (80, 9), (90, 17), (93, 26),
               (93, 34), (2, 34)], fill=body, outline=dark)
    # windows
    d.polygon([(20, 10), (34, 7), (34, 17), (16, 17)], fill=glass, outline=dark)
    d.polygon([(37, 7), (56, 7), (56, 17), (37, 17)], fill=glass, outline=dark)
    d.polygon([(59, 7), (74, 9), (80, 17), (59, 17)], fill=glass, outline=dark)
    # sliding-door line + handles
    d.line([(57, 8), (57, 32)], fill=dark)
    d.line([(36, 8), (36, 32)], fill=dark)
    d.rectangle([48, 21, 54, 22], fill=dark)
    d.rectangle([60, 21, 66, 22], fill=dark)
    # lights + bumper
    d.rectangle([90, 20, 93, 24], fill=(255, 214, 120, 255))
    d.rectangle([2, 22, 4, 26], fill=(200, 60, 50, 255))
    d.rectangle([2, 31, 93, 34], fill=(140, 144, 152, 255))
    d.line([(6, 15), (30, 9)], fill=hi)
    # wheels
    for wx in (22, 74):
        d.ellipse([wx - 8, 28, wx + 8, 42], fill=(30, 30, 34, 255), outline=(10, 10, 12, 255))
        d.ellipse([wx - 3, 33, wx + 3, 38], fill=(180, 180, 190, 255))
    return up(im, 3)  # 288x126

def bg_ground():
    W, H = 256, 48
    im, d = px_img(W, H)
    top, mid, deep = (196, 150, 96, 255), (160, 116, 72, 255), (120, 84, 52, 255)
    d.rectangle([0, 0, W, 6], fill=top)
    d.rectangle([0, 6, W, 20], fill=mid)
    d.rectangle([0, 20, W, H], fill=deep)
    for i in range(14):
        x = random.randint(0, W - 1)
        y = random.randint(1, 16)
        for k in range(random.randint(3, 8)):
            d.point(((x + random.randint(-1, 1)) % W, y + k), fill=(96, 64, 40, 255))
    for i in range(22):
        x, y = random.randint(0, W - 4), random.randint(4, H - 6)
        c = (216, 200, 170, 255) if random.random() < 0.3 else (140, 100, 62, 255)
        d.rectangle([x, y, x + random.randint(1, 3), y + 1], fill=c)
    d.rectangle([0, 0, W, 1], fill=(226, 184, 128, 255))
    # a couple of drawn props baked into the tile
    d.rectangle([30, -8, 42, 4], fill=(70, 90, 70, 255), outline=(40, 50, 40, 255))  # rusted drum
    d.ellipse([180, -6, 206, 6], fill=(120, 110, 100, 255), outline=(80, 74, 66, 255))  # rock
    return up(im, 2)

def main():
    os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)
    ui = {
        'heart': up(heart(True)), 'heart_empty': up(heart(False)),
        'bulletbox': up(bullet_box()), 'wbox': up(wbox()),
        'pistol_icon': up(pistol_icon()), 'mg_icon': up(mg_icon()),
        'tracer': up(tracer(), 3), 'mgtracer': up(mgtracer(), 3),
        'photon0': up(photon(0), 3), 'photon1': up(photon(1), 3),
        'sword': up(sword(), 3),
        'wave0': up(wave(0), 3), 'wave1': up(wave(1), 3),
        'poof0': up(poof(0), 3), 'poof1': up(poof(1), 3), 'poof2': up(poof(2), 3),
        'spark': up(spark(), 3), 'muzzle': up(muzzle(), 3),
        'slash0': up(slash_arc(0), 3), 'slash1': up(slash_arc(1), 3),
        'dust': up(dust(), 3), 'mist': up(mist(), 3),
        'bubble': up(bubble(), 3),
        'missm0': up(miss_minutes(0), 3), 'missm1': up(miss_minutes(1), 3),
        'minivan': minivan(),
    }
    PAD, W = 2, 900
    x, y, rowh = PAD, PAD, 0
    rects = {}
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
    up(miss_minutes(0, big=True), 4).save(os.path.join(OUT, 'sprites', 'miss_minutes_big.png'))
    bg_sky().save(os.path.join(OUT, 'sprites', 'bg_sky.png'))
    bg_far().save(os.path.join(OUT, 'sprites', 'bg_far.png'))
    bg_ground().save(os.path.join(OUT, 'sprites', 'bg_ground.png'))
    bg_front().save(os.path.join(OUT, 'sprites', 'bg_front.png'))
    json.dump({n: list(r) for n, r in rects.items()}, open(os.path.join(OUT, 'ui_frames.json'), 'w'))
    print('ui sheet', sheet.size, '| entries', len(rects))

if __name__ == '__main__':
    main()
