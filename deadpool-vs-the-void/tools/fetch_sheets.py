#!/usr/bin/env python3
"""Download the Marvel: Avengers Alliance sheets this game uses from The Spriters Resource.

Downloads into tools/raw/ (gitignored). Sheets are fan rips of Playdom's game —
personal, non-commercial use only; credit the rippers (Cyrus Annihilator).
"""
import os, re, subprocess, sys, time, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
BASE = 'https://www.spriters-resource.com'

# name -> The Spriters Resource asset id (browser_games/marvelavengers)
SHEETS = {
    'deadpool': 51721,          # Deadpool (Classic)
    'wolverine': 48880,         # Wolverine (Yellow & Blue)
    'juggernaut': 50690,        # Juggernaut (Classic)
    'sabretooth': 49563,        # Sabretooth (Classic)
    'loki': 49035,              # Loki (final boss — Cassandra Nova stand-in)
    'magneto': 52811,           # Magneto (Classic)
    'electro': 67248,           # Electro (Classic)
    'doc_ock': 50682,           # Doctor Octopus
    'doctor_doom': 49034,       # Dr. Doom (Classic)
    'red_skull': 53447,         # Red Skull
    'mister_sinister': 61724,   # Mr. Sinister
    'kingpin': 74206,           # Kingpin
    'sentinel': 50675,          # Sentinels (Mark IV) — zip of frames
    'modok': 49036,             # M.O.D.O.K.
    'toad': 49564,              # Toad (Scorpion stand-in)
    'blob': 50214,              # Blob
}

def curl(url, out):
    subprocess.run(['curl', '-sSL', '-A', UA, url, '-o', out], check=True)

def main():
    os.makedirs(RAW, exist_ok=True)
    for name, aid in SHEETS.items():
        page = os.path.join(RAW, f'.{name}.page.html')
        curl(f'{BASE}/browser_games/marvelavengers/asset/{aid}/', page)
        html = open(page, encoding='utf-8', errors='replace').read()
        m = re.search(r'/media/assets/(\d+)/(\d+)\.(png|zip)', html)
        os.remove(page)
        if not m:
            print(f'{name}: could not find media URL, skipping', file=sys.stderr)
            continue
        ext = m.group(3)
        out = os.path.join(RAW, f'{name}.{ext}')
        if os.path.exists(out if ext == 'png' else os.path.join(RAW, f'{name}_zip')):
            print(f'{name}: already downloaded')
            continue
        curl(BASE + m.group(0), out)
        if ext == 'zip':
            d = os.path.join(RAW, f'{name}_zip')
            os.makedirs(d, exist_ok=True)
            zipfile.ZipFile(out).extractall(d)
        print(f'{name}: ok ({ext})')
        time.sleep(1)

if __name__ == '__main__':
    main()
