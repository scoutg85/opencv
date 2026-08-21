#!/usr/bin/env python3
"""Assemble assets/atlas.js from the MvC2 cutouts + drawn ui sheet.

Format v2 (puppet engine):
  ATLAS.chars[name]  = {img, w, h, right}   right = artwork natively faces right
  ATLAS.pieces[name] = {img, w, h}
  ATLAS.ui           = {img, frames: {name: [x, y, w, h]}}
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, '..'))  # repo game dir when run from tools/
if not os.path.exists(os.path.join(GAME, 'assets')):
    GAME = '/home/user/opencv/deadpool-vs-the-void'

CHARS = ['deadpool', 'wolverine', 'wolverine_bone', 'sabretooth', 'sab_ko', 'juggernaut',
         'cassandra', 'dp_photo', 'sentinel', 'silver_samurai', 'omega_red', 'blackheart',
         'shuma_gorath', 'venom', 'spiral', 'marrow', 'doctor_doom']
PIECES = ['helmet', 'sab_head']

# artwork natively faces right (flip when entity faces the other way)
FACES_RIGHT = {'blackheart'}

def main():
    chars_dir = os.path.join(GAME, 'assets', 'chars')
    atlas = {'chars': {}, 'pieces': {}}
    for n in CHARS:
        w, h = Image.open(os.path.join(chars_dir, n + '.png')).size
        atlas['chars'][n] = {'img': f'chars/{n}.png', 'w': w, 'h': h, 'right': n in FACES_RIGHT}
    for n in PIECES:
        w, h = Image.open(os.path.join(chars_dir, n + '.png')).size
        atlas['pieces'][n] = {'img': f'chars/{n}.png', 'w': w, 'h': h}
    frames = json.load(open(os.path.join(HERE, 'out_assets', 'ui_frames.json')))
    atlas['ui'] = {'img': 'sprites/ui.png', 'frames': frames}
    with open(os.path.join(GAME, 'assets', 'atlas.js'), 'w') as f:
        f.write('// Generated atlas: MvC2 official-artwork cutouts + original drawn UI/FX\n')
        f.write('window.ATLAS = ' + json.dumps(atlas) + ';\n')
    json.dump(atlas, open(os.path.join(GAME, 'assets', 'atlas.json'), 'w'))
    print('atlas.js:', len(atlas['chars']), 'chars,', len(atlas['pieces']), 'pieces,', len(frames), 'ui frames')

if __name__ == '__main__':
    main()
