#!/usr/bin/env python3
"""Download the Marvel vs. Capcom 2 official-artwork pack from archive.org.

Item: https://archive.org/details/RetroGameOfficialAssetArtwork
File: "Marvel vs. Capcom 2 - New Age of Heroes (Official Asset Artwork).zip"
Extracts the 53 character artworks into tools/mvc2/ (gitignored).
Archive.org nodes 5xx intermittently, so this retries across mirrors.
"""
import json, os, subprocess, time, urllib.parse, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ITEM = 'RetroGameOfficialAssetArtwork'
NAME = 'Marvel vs. Capcom 2 - New Age of Heroes (Official Asset Artwork).zip'

def main():
    dest = os.path.join(HERE, 'mvc2')
    zpath = os.path.join(HERE, 'mvc2.zip')
    if os.path.isdir(dest) and len(os.listdir(dest)) >= 50:
        print('mvc2/ already present'); return
    meta = json.load(urllib.request.urlopen(f'https://archive.org/metadata/{ITEM}'))
    servers = [meta.get('server')] + meta.get('workable_servers', [])
    servers = [s for i, s in enumerate(servers) if s and s not in servers[:i]]
    q = urllib.parse.quote(NAME)
    urls = [f'https://{s}{meta["dir"]}/{q}' for s in servers]
    urls.append(f'https://archive.org/download/{ITEM}/{q}')
    for attempt in range(8):
        url = urls[attempt % len(urls)]
        r = subprocess.run(['curl', '-sSL', '--max-time', '600', '-w', '%{http_code}',
                            '-o', zpath, url], capture_output=True, text=True)
        if r.stdout.strip() == '200' and os.path.getsize(zpath) > 10_000_000:
            break
        print(f'attempt {attempt}: HTTP {r.stdout.strip()}, retrying...')
        time.sleep(4 * (attempt + 1))
    else:
        raise SystemExit('download failed')
    os.makedirs(dest, exist_ok=True)
    with zipfile.ZipFile(zpath) as z:
        for n in z.namelist():
            if n.endswith('.png') and '__MACOSX' not in n:
                z.extract(n, dest)
    os.remove(zpath)
    print('extracted', len(os.listdir(dest)), 'files')

if __name__ == '__main__':
    main()
