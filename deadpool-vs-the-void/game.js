'use strict';
/* ================================================================== *
 *  DEADPOOL vs. THE VOID
 *  Side-scrolling brawler in the spirit of NES Kung Fu.
 *  Sprites: Marvel: Avengers Alliance rips from The Spriters Resource.
 *  Personal, non-commercial fan homebrew. Do not distribute or sell.
 * ================================================================== */

/* ============================ TUNABLES ============================ */
const CFG = {
  W: 960, H: 540, GROUND_Y: 505,

  RUN_SPEED: 330,           // Deadpool always runs at this speed
  KNEEL_SPEED: 180,         // crouch-walk speed
  JUMP_VY: -880,            // initial jump velocity
  GRAVITY: 2400,
  HOLD_GRAVITY: 1250,       // reduced gravity while A held and rising (variable height)

  MAX_HEARTS: 4,
  INVINCIBLE_T: 1.0,        // seconds of i-frames after a hit
  HIT_FLASH_T: 0.18,

  MELEE_REACH: 118,         // smart attack: katana range in front of Deadpool
  SLASH_T: 0.30,
  PISTOL_T: 0.24,
  MG_RATE: 0.125,           // ~8 shots/sec
  TRACER_SPEED: 780,
  AMMO_PER_BOX: 20, AMMO_CAP: 99,

  DROP_CHANCE: 0.20,        // per horde kill
  DROP_HEART: 0.40, DROP_AMMO: 0.40,  // remainder = W-box

  PHASE1_T: 120, PHASE2_T: 60, PHASE3_T: 60,   // seconds of horde combat
  SPAWN_CAP: [3, 3, 4],                        // concurrent enemies per phase
  SPAWN_CD: [[1.4, 2.4], [1.1, 2.0], [0.9, 1.7]],
  SPAWN_FROM_LEFT: 0.2,

  RANGED_STAND_OFF: 380,    // Electro/Magneto stop distance
  RANGED_CD: 2.5,
  PROJ_SPEED: 240,
  PROJ_HEIGHT: 62,          // above ground; jumpable

  JUGG_HP: 3, JUGG_DASH_V: 760, JUGG_DAZED_T: 2.5, JUGG_TELE_T: 0.6,
  LOKI_HP: 3, LOKI_WAVE_CD: 2.0, LOKI_WAVE_CD_FAST: 1.5,
  WAVE_SPEED: 290,
  WOLV_SWEEP_V: 900,

  BUBBLE_CPS: 28,           // typewriter chars/sec
  BUBBLE_HOLD: 2.5,         // seconds after text completes
};

/* Per-character display config: target on-screen height + anim speeds.
   All source sheets face LEFT; the engine flips when facing right. */
const CHARS = {
  deadpool:        { h: 170, fps: { run: 11, slash: 12, pistol: 10, mg: 10, victory: 3, kneelmove: 8 } },
  wolverine:       { h: 160, fps: { run: 11, slash: 12, idle: 3 } },
  sabretooth:      { h: 165, fps: { stalk: 7, snarl: 3 } },
  juggernaut:      { h: 225, fps: { idle: 3, charge: 11 } },
  loki:            { h: 190, fps: { idle: 3, cast: 8 } },
  magneto:         { h: 170, speed: 95,  ranged: true,  fps: { move: 4, attack: 7 } },
  electro:         { h: 168, speed: 100, ranged: true,  fps: { move: 5, attack: 8 } },
  doc_ock:         { h: 180, speed: 85,  reach: 120, fps: { move: 6, attack: 9 } },
  doctor_doom:     { h: 175, speed: 90,  reach: 105, fps: { move: 7, attack: 9 } },
  red_skull:       { h: 172, speed: 105, reach: 95,  fps: { move: 6, attack: 9 } },
  mister_sinister: { h: 175, speed: 95,  reach: 100, fps: { move: 5, attack: 9 } },
  kingpin:         { h: 210, speed: 70,  reach: 125, big: true, fps: { move: 5, attack: 8 } },
  sentinel:        { h: 290, speed: 42,  reach: 150, big: true, fps: { move: 3, attack: 6 } },
  modok:           { h: 200, speed: 80,  reach: 115, big: true, hover: true, fps: { move: 4, attack: 8 } },
  toad:            { h: 145, speed: 130, reach: 92,  fps: { move: 9, attack: 9 } },
  blob:            { h: 205, speed: 55,  reach: 110, big: true, fps: { move: 5, attack: 7 } },
};

const PHASE_MIX = [
  ['toad', 'electro', 'blob', 'red_skull'],
  ['toad', 'electro', 'blob', 'red_skull', 'magneto', 'doc_ock', 'doctor_doom', 'mister_sinister', 'kingpin'],
  ['toad', 'electro', 'blob', 'red_skull', 'magneto', 'doc_ock', 'doctor_doom', 'mister_sinister', 'kingpin', 'sentinel', 'modok'],
];
const KIND_CAP = { sentinel: 1, kingpin: 1, blob: 2, modok: 1, magneto: 2, electro: 2 };

/* Dialogue script — exact lines, exact speakers. */
const LINES = {
  L1: { who: 'wolverine', text: "Let's go!" },
  L2: { who: 'deadpool', text: 'I have the Wolverine!' },
  L3: { who: 'deadpool', text: 'I am your favorite fan!' },
  L4: { who: 'deadpool', text: 'Disney paid a lot for this CG' },
  L5: { who: 'deadpool', text: 'I am Marvel Jesus' },
  L6: { who: 'deadpool', text: "Let's go home." },
  L7: { who: 'missminutes', text: 'Great work! You saved the sacred timeline... You truly are Marvel Jesus.' },
};

/* ============================ CANVAS ============================== */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function fitCanvas() {
  const s = Math.min(window.innerWidth / CFG.W, window.innerHeight / CFG.H);
  canvas.style.width = Math.floor(CFG.W * s) + 'px';
  canvas.style.height = Math.floor(CFG.H * s) + 'px';
}
window.addEventListener('resize', fitCanvas); fitCanvas();

/* ============================ ASSETS ============================== */
const IMG = {};                 // name -> HTMLImageElement
const MISSING = [];
let assetsPending = 0;
function loadImage(name, src) {
  assetsPending++;
  const im = new Image();
  im.onload = () => { assetsPending--; };
  im.onerror = () => { assetsPending--; MISSING.push(src); };
  im.src = src;
  IMG[name] = im;
}
const ATLAS = window.ATLAS || null;
if (ATLAS) {
  for (const [name, sh] of Object.entries(ATLAS.sheets)) loadImage(name, 'assets/' + sh.img);
  loadImage('fx', 'assets/' + ATLAS.fx.img);
  loadImage('ui', 'assets/' + ATLAS.ui.img);
} else {
  MISSING.push('assets/atlas.js');
}
loadImage('mm_big', 'assets/sprites/miss_minutes_big.png');
loadImage('bg_sky', 'assets/sprites/bg_sky.png');
loadImage('bg_far', 'assets/sprites/bg_far.png');
loadImage('bg_ground', 'assets/sprites/bg_ground.png');

/* Per-character scale: target height / reference frame height. */
const SCALE = {};
function charScale(name) {
  if (SCALE[name]) return SCALE[name];
  const sh = ATLAS.sheets[name];
  const ref = (sh.anims.idle || sh.anims.move || sh.anims.run || sh.anims.stalk)[0];
  const s = CHARS[name].h / sh.frames[ref][3];
  SCALE[name] = s;
  return s;
}
function animFrames(name, anim) { return ATLAS.sheets[name].anims[anim]; }

/* Anims whose source frames face RIGHT (MAA specials) — flip logic inverts. */
const FLIP_EXCEPTIONS = { deadpool: { mg: true } };

/* Draw a character frame anchored at feet (bottom-center), world coords. */
function drawChar(name, anim, fi, wx, wy, facingRight, opts = {}) {
  if (FLIP_EXCEPTIONS[name] && FLIP_EXCEPTIONS[name][anim]) facingRight = !facingRight;
  const sh = ATLAS.sheets[name];
  const frames = sh.anims[anim] || sh.anims.move || sh.anims.idle;
  const fr = sh.frames[frames[Math.min(fi, frames.length - 1)]];
  const s = (opts.scale || 1) * charScale(name);
  const dw = fr[2] * s, dh = fr[3] * s;
  const sx = Math.round(wx - game.camX), sy = Math.round(wy);
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.flash) ctx.filter = 'brightness(2.6) saturate(0.2)';
  ctx.translate(sx, sy);
  if (facingRight) ctx.scale(-1, 1);
  ctx.drawImage(IMG[name], fr[0], fr[1], fr[2], fr[3], -dw / 2, -dh + (opts.dy || 0), dw, dh);
  ctx.restore();
  return { w: dw, h: dh };
}
function fxFrame(n) { return ATLAS.fx.frames[n]; }
function drawFx(n, wx, wy, scale = 1, opts = {}) {
  const fr = fxFrame(n);
  if (!fr) return;
  const dw = fr[2] * scale, dh = fr[3] * scale;
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  ctx.translate(Math.round(wx - game.camX), Math.round(wy));
  if (opts.rot) ctx.rotate(opts.rot);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.drawImage(IMG.fx, fr[0], fr[1], fr[2], fr[3], -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}
function drawUi(n, x, y, scale = 1, alpha = 1) {
  const fr = ATLAS.ui.frames[n];
  if (!fr) return { w: 0, h: 0 };
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.drawImage(IMG.ui, fr[0], fr[1], fr[2], fr[3], x, y, fr[2] * scale, fr[3] * scale);
  ctx.restore();
  return { w: fr[2] * scale, h: fr[3] * scale };
}

/* ============================ AUDIO =============================== */
const AudioSys = {
  ctx: null, master: null, musicGain: null, on: true, musicOn: true,
  song: null, step: 0, nextT: 0, noiseBuf: null,
  mp3: { level: null, boss: null }, mp3ok: { level: false, boss: false }, mp3Playing: null,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.42;
    this.musicGain.connect(this.master);
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    for (const k of ['level', 'boss']) {
      const a = new Audio('assets/audio/' + k + '.mp3');
      a.loop = true; a.volume = 0.5;
      a.addEventListener('canplaythrough', () => { this.mp3ok[k] = true; }, { once: true });
      a.addEventListener('error', () => {}, { once: true });
      this.mp3[k] = a;
    }
  },
  freq(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  osc(type, midi, t, dur, vol, dest) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = this.freq(midi);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(t, dur, vol, hp, dest) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 4000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.master);
    s.start(t); s.stop(t + dur + 0.02);
  },
  /* Original chiptune loops (no licensed melodies) — replace with your own
     8-bit covers by dropping level.mp3 / boss.mp3 into assets/audio/. */
  SONGS: {
    level: {
      spb: 0.105, len: 64,
      bass: [40,,40,,43,,40,,45,,45,,47,,45,, 40,,40,,43,,40,,48,,48,,47,,45,,
             40,,40,,43,,40,,45,,45,,47,,50,, 52,,50,,48,,47,,45,,43,,47,,45,,],
      lead: [64,,,,67,,64,,69,,,,67,,64,, 62,,,,64,,67,,71,,,,69,,67,,
             64,,,,67,,64,,69,,,,72,,71,, 74,,72,,71,,69,,67,,64,,62,,64,,],
      hatEvery: 2, snareAt: [8, 24, 40, 56],
    },
    boss: {
      spb: 0.15, len: 64,
      bass: [38,,38,,44,,38,,41,,38,,45,,44,, 38,,38,,44,,38,,46,,45,,44,,41,,
             38,,38,,44,,38,,41,,38,,45,,44,, 36,,36,,43,,36,,44,,44,,46,,47,,],
      lead: [62,,,,,,,,65,,,,,,64,, 62,,,,,,,,68,,,,67,,65,,
             62,,,,,,,,65,,,,,,69,, 70,,,,68,,,,65,,,,62,,,,],
      hatEvery: 4, snareAt: [8, 24, 40, 56],
    },
  },
  playMusic(name) {
    if (!this.ctx) return;
    this.stopMusic();
    if (this.mp3ok[name]) {
      this.mp3Playing = this.mp3[name];
      if (this.musicOn) this.mp3Playing.play().catch(() => {});
      this.song = null;
      return;
    }
    this.song = this.SONGS[name];
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.05;
  },
  stopMusic() {
    this.song = null;
    if (this.mp3Playing) { this.mp3Playing.pause(); this.mp3Playing.currentTime = 0; this.mp3Playing = null; }
  },
  setMusicOn(on) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.value = on ? 0.42 : 0;
    if (this.mp3Playing) { if (on) this.mp3Playing.play().catch(() => {}); else this.mp3Playing.pause(); }
  },
  tickMusic() {
    if (!this.ctx || !this.song) return;
    const s = this.song;
    while (this.nextT < this.ctx.currentTime + 0.22) {
      const i = this.step % s.len, t = this.nextT;
      if (this.musicOn) {
        const b = s.bass[i], l = s.lead[i];
        if (b != null && b !== undefined) this.osc('triangle', b, t, s.spb * 1.9, 0.30, this.musicGain);
        if (l != null && l !== undefined) this.osc('square', l, t, s.spb * 1.6, 0.10, this.musicGain);
        if (i % s.hatEvery === 0) this.noise(t, 0.03, 0.05, 6000, this.musicGain);
        if (s.snareAt.includes(i)) this.noise(t, 0.09, 0.14, 1800, this.musicGain);
      }
      this.step++; this.nextT += s.spb;
    }
  },
  sfx(kind) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case 'pistol': this.osc('square', 92, t, 0.07, 0.18); this.noise(t, 0.05, 0.14, 3000); break;
      case 'mg': this.osc('square', 86, t, 0.05, 0.13); this.noise(t, 0.04, 0.12, 2500); break;
      case 'slash': this.noise(t, 0.12, 0.16, 5200); this.osc('sawtooth', 70, t, 0.09, 0.08); break;
      case 'hurt': this.osc('sawtooth', 50, t, 0.22, 0.22); this.noise(t, 0.15, 0.12, 1200); break;
      case 'poof': this.noise(t, 0.25, 0.22, 900); this.osc('triangle', 45, t, 0.18, 0.16); break;
      case 'pickup': [76, 81, 88].forEach((m, i) => this.osc('square', m, t + i * 0.05, 0.09, 0.12)); break;
      case 'jump': this.osc('square', 62, t, 0.05, 0.09); this.osc('square', 74, t + 0.05, 0.07, 0.09); break;
      case 'clang': this.osc('square', 96, t, 0.04, 0.12); this.osc('square', 90, t + 0.03, 0.1, 0.08); break;
      case 'noeffect': this.osc('sine', 40, t, 0.25, 0.25); break;
      case 'roar': this.osc('sawtooth', 33, t, 0.5, 0.3); this.osc('sawtooth', 38, t + 0.05, 0.45, 0.2); break;
      case 'crash': this.noise(t, 0.35, 0.3, 500); this.osc('triangle', 36, t, 0.3, 0.3); break;
      case 'wave': this.osc('sawtooth', 44, t, 0.3, 0.12); this.osc('sawtooth', 45, t + 0.02, 0.28, 0.1); break;
      case 'helmet': [64, 69, 76, 81].forEach((m, i) => this.osc('square', m, t + i * 0.06, 0.12, 0.12)); break;
      case 'jingle': [69, 73, 76, 81, 76, 81, 85].forEach((m, i) => this.osc('square', m, t + i * 0.11, 0.2, 0.12)); break;
      case 'talk': this.osc('square', 90 + Math.floor(Math.random() * 6), t, 0.03, 0.05); break;
    }
  },
};

/* ============================ INPUT =============================== */
const keys = {}, pressed = {};
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  AudioSys.init();
  if (AudioSys.ctx && AudioSys.ctx.state === 'suspended') AudioSys.ctx.resume();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
function tap(code) { const p = pressed[code]; pressed[code] = false; return !!p; }

/* ============================ GAME STATE ========================== */
const game = {
  mode: 'title',            // title | play | pause | gameover | congrats
  beat: 'phase1',           // phase1|cut1|phase2|jugg|helmetwait|phase3|loki|ending
  beatT: 0, phaseTimer: 0, camX: 0, arenaLock: null,
  checkpoint: 'phase1', shake: 0, fade: 0, time: 0,
  debug: false, viewer: false, viewerSheet: 0, viewerFrame: 0,
  pauseSel: 0, congratsT: 0, musicNow: null,
};
let player, enemies, projectiles, pickups, fxs, floaters, bubbles, actors, boss, cut, wolvSweep;
let spawnCd = 1.0;

function resetWorld() {
  player = {
    kind: 'deadpool', x: 300, y: CFG.GROUND_Y, vx: 0, vy: 0, onGround: true,
    facing: 1, hearts: CFG.MAX_HEARTS, inv: 0, flash: 0,
    weapon: 'pistol', ammo: 0, hasHelmet: false,
    state: 'normal', stateT: 0, mgCd: 0, mgFlash: 0,
    anim: 'run', fi: 0, ft: 0, kneel: false,
  };
  enemies = []; projectiles = []; pickups = []; fxs = []; floaters = [];
  bubbles = []; actors = []; boss = null; cut = null; wolvSweep = null;
  game.camX = 0; game.arenaLock = null; game.shake = 0; game.fade = 0;
  spawnCd = 1.0;
}
resetWorld();

/* ============================ HELPERS ============================= */
function say(who, lineKey, opts = {}) {
  const line = LINES[lineKey];
  bubbles.push({ who: line.who, text: line.text, t: 0, done: false, ...opts });
  return line.text.length / CFG.BUBBLE_CPS + CFG.BUBBLE_HOLD;
}
function speakerPos(b) {
  if (b.at) return b.at();
  if (b.who === 'deadpool') return { x: player.x, y: player.y - dispH('deadpool') - 14 };
  const a = actors.find(a => a.kind === b.who);
  if (a) return { x: a.x, y: a.y - dispH(a.kind) - 14 };
  if (boss && boss.kind === b.who) return { x: boss.x, y: boss.y - dispH(boss.kind) - 14 };
  return { x: player.x, y: player.y - 200 };
}
function dispH(kind) { return CHARS[kind].h; }
function poof(x, y, scale = 1) { fxs.push({ type: 'poof', x, y, t: 0, scale }); AudioSys.sfx('poof'); }
function spark(x, y, scale = 0.8) { fxs.push({ type: 'spark', x, y, t: 0, scale }); }
function floatText(text, x, y, color = '#ffe066') { floaters.push({ text, x, y, t: 0, color }); }
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function playerHurtBox() {
  const h = player.kneel ? 88 : 140;
  return { x: player.x - 26, y: player.y - h, w: 52, h };
}
function enemyBox(e) {
  const h = dispH(e.kind), w = h * 0.42;
  return { x: e.x - w / 2, y: e.y - h, w, h };
}
function hurtPlayer() {
  if (player.inv > 0 || game.mode !== 'play' || cut) return;
  player.hearts--; player.inv = CFG.INVINCIBLE_T; player.flash = CFG.HIT_FLASH_T;
  player.state = 'hit'; player.stateT = 0.3;
  AudioSys.sfx('hurt');
  if (player.hearts <= 0) { game.mode = 'gameover'; AudioSys.stopMusic(); }
}

/* ============================ SPAWNER ============================= */
function phaseIndex() { return game.beat === 'phase1' ? 0 : game.beat === 'phase2' ? 1 : 2; }
function updateSpawner(dt) {
  if (!['phase1', 'phase2', 'phase3'].includes(game.beat)) return;
  spawnCd -= dt;
  const pi = phaseIndex();
  if (spawnCd <= 0 && enemies.length < CFG.SPAWN_CAP[pi]) {
    const mix = PHASE_MIX[pi];
    let kind, guard = 12;
    do {
      kind = mix[Math.floor(Math.random() * mix.length)];
    } while (--guard > 0 && KIND_CAP[kind] && enemies.filter(e => e.kind === kind).length >= KIND_CAP[kind]);
    const fromLeft = Math.random() < CFG.SPAWN_FROM_LEFT;
    enemies.push({
      kind, x: fromLeft ? game.camX - 70 : game.camX + CFG.W + 70,
      y: CFG.GROUND_Y, state: 'move', t: 0, fi: 0, ft: 0,
      atkCd: 0.6 + Math.random(), fired: false, bob: Math.random() * 6,
    });
    const [a, b] = CFG.SPAWN_CD[pi];
    spawnCd = a + Math.random() * (b - a);
  }
}

/* ============================ ENEMIES ============================= */
function updateEnemy(e, dt) {
  const c = CHARS[e.kind];
  const dx = player.x - e.x;
  e.facingRight = dx > 0;
  e.t += dt; e.ft += dt;
  const fps = (c.fps && c.fps[e.state === 'attack' ? 'attack' : 'move']) || 6;
  if (e.ft > 1 / fps) {
    e.ft = 0; e.fi++;
    const frames = animFrames(e.kind, e.state === 'attack' ? 'attack' : 'move');
    if (e.fi >= frames.length) {
      if (e.state === 'attack') { e.state = 'move'; e.atkCd = 0.7 + Math.random() * 0.5; e.fired = false; }
      e.fi = 0;
    }
  }
  if (c.hover) e.bob += dt * 4;
  e.yOff = c.hover ? Math.sin(e.bob) * 8 - 8 : 0;

  if (e.state === 'move') {
    e.atkCd -= dt;
    if (c.ranged) {
      if (Math.abs(dx) > CFG.RANGED_STAND_OFF) e.x += Math.sign(dx) * (c.speed || 90) * dt;
      else if (e.atkCd <= 0) { e.state = 'attack'; e.fi = 0; e.ft = 0; e.fired = false; }
    } else {
      const reach = c.reach || 95;
      if (Math.abs(dx) > reach * 0.85) e.x += Math.sign(dx) * (c.speed || 90) * dt;
      else if (e.atkCd <= 0) { e.state = 'attack'; e.fi = 0; e.ft = 0; }
    }
  } else if (e.state === 'attack') {
    if (c.ranged) {
      if (e.fi >= 2 && !e.fired) {
        e.fired = true;
        projectiles.push({
          type: e.kind === 'electro' ? 'bolt' : 'shard',
          x: e.x + (e.facingRight ? 40 : -40), y: CFG.GROUND_Y - CFG.PROJ_HEIGHT,
          vx: (e.facingRight ? 1 : -1) * CFG.PROJ_SPEED, t: 0, hostile: true,
        });
        AudioSys.sfx(e.kind === 'electro' ? 'wave' : 'clang');
      }
    } else if (e.fi >= 1) {
      const reach = c.reach || 95;
      const box = {
        x: e.facingRight ? e.x : e.x - reach, y: CFG.GROUND_Y - dispH(e.kind) * 0.75,
        w: reach, h: dispH(e.kind) * 0.75,
      };
      if (e.kind === 'modok') e.x += (e.facingRight ? 1 : -1) * 260 * dt;  // hover-ram
      if (rectsOverlap(box, playerHurtBox())) hurtPlayer();
      e.atkBox = box;
    }
  }
  if (e.state !== 'attack') e.atkBox = null;
}
function killEnemy(e, allowDrop = true) {
  poof(e.x, e.y - dispH(e.kind) / 2, CHARS[e.kind].big ? 2.2 : 1.5);
  enemies.splice(enemies.indexOf(e), 1);
  if (allowDrop && ['phase1', 'phase2', 'phase3'].includes(game.beat) && Math.random() < CFG.DROP_CHANCE) {
    const r = Math.random();
    const type = r < CFG.DROP_HEART ? 'heart' : r < CFG.DROP_HEART + CFG.DROP_AMMO ? 'ammo' : 'wbox';
    pickups.push({ type, x: e.x, y: e.y, t: 0 });
  }
}

/* ============================ PLAYER ============================== */
function tryMelee() {
  // smart attack: katana if any target inside the strike box
  const reachBox = {
    x: player.facing > 0 ? player.x + 8 : player.x - 8 - CFG.MELEE_REACH,
    y: player.y - 170, w: CFG.MELEE_REACH, h: 180,
  };
  let hit = false;
  for (const e of [...enemies]) {
    if (rectsOverlap(reachBox, enemyBox(e))) hit = true;
  }
  if (boss && !boss.dead && rectsOverlap(reachBox, enemyBox(boss))) hit = true;
  for (const p of projectiles) {
    if (p.hostile && (p.type === 'shard' || p.type === 'bolt') &&
        rectsOverlap(reachBox, { x: p.x - 20, y: p.y - 20, w: 40, h: 40 })) hit = true;
  }
  return hit;
}
function doSlashDamage() {
  const box = {
    x: player.facing > 0 ? player.x + 8 : player.x - 8 - CFG.MELEE_REACH,
    y: player.y - 180, w: CFG.MELEE_REACH, h: 190,
  };
  for (const e of [...enemies]) if (rectsOverlap(box, enemyBox(e))) killEnemy(e);
  for (const p of [...projectiles]) {
    if (p.hostile && (p.type === 'shard' || p.type === 'bolt') &&
        rectsOverlap(box, { x: p.x - 20, y: p.y - 20, w: 40, h: 40 })) {
      spark(p.x, p.y, 1);
      projectiles.splice(projectiles.indexOf(p), 1);
    }
  }
  if (boss) bossHit('slash', box);
}
function fireGun() {
  const kneel = player.kneel;
  const muzzY = player.y - (kneel ? 64 : 96);
  const mx = player.x + player.facing * 62;
  projectiles.push({
    type: player.weapon === 'mg' ? 'mgtracer' : 'tracer',
    x: mx, y: muzzY, vx: player.facing * CFG.TRACER_SPEED, t: 0, hostile: false,
  });
  spark(mx + player.facing * 8, muzzY, 0.45);
  AudioSys.sfx(player.weapon === 'mg' ? 'mg' : 'pistol');
}
function updatePlayer(dt) {
  const p = player;
  p.inv = Math.max(0, p.inv - dt); p.flash = Math.max(0, p.flash - dt);
  p.mgFlash = Math.max(0, p.mgFlash - dt);
  const inputLocked = !!cut || (boss && boss.autoScene);

  let dir = 0;
  if (!inputLocked) {
    if (keys.ArrowLeft) dir -= 1;
    if (keys.ArrowRight) dir += 1;
  }
  if (dir !== 0) p.facing = dir;
  p.kneel = !inputLocked && p.onGround && !!keys.ArrowDown && p.state !== 'place';

  // weapon toggle
  if (!inputLocked && (tap('ShiftLeft') || tap('ShiftRight'))) {
    if (p.weapon === 'pistol') {
      if (p.ammo > 0) p.weapon = 'mg';
      else p.mgFlash = 0.8;
    } else p.weapon = 'pistol';
  }

  // jump
  if (!inputLocked && tap('KeyX') && p.onGround) {
    p.vy = CFG.JUMP_VY; p.onGround = false; AudioSys.sfx('jump');
  }
  // gravity (variable jump height while holding)
  if (!p.onGround) {
    p.vy += (keys.KeyX && p.vy < 0 ? CFG.HOLD_GRAVITY : CFG.GRAVITY) * dt;
    p.y += p.vy * dt;
    if (p.y >= CFG.GROUND_Y) { p.y = CFG.GROUND_Y; p.vy = 0; p.onGround = true; }
  }

  // horizontal: always full run speed on the ground; kneel-move is slower
  const spd = p.kneel ? CFG.KNEEL_SPEED : CFG.RUN_SPEED;
  if (!inputLocked) p.x += dir * spd * dt;
  const lockL = game.arenaLock ? game.arenaLock.x0 + 40 : game.camX + 30;
  const lockR = game.arenaLock ? game.arenaLock.x0 + CFG.W - 40 : Infinity;
  p.x = Math.max(lockL, Math.min(lockR, p.x));

  // camera
  if (!game.arenaLock) {
    game.camX = Math.max(game.camX, p.x - 380);
  } else game.camX = game.arenaLock.x0;

  // state timers
  if (p.state !== 'normal') {
    p.stateT -= dt;
    if (p.state === 'slash' && !p.slashDone && p.stateT < CFG.SLASH_T * 0.6) {
      p.slashDone = true; doSlashDamage();
    }
    if (p.stateT <= 0) { p.state = 'normal'; }
  }

  // smart attack
  if (!inputLocked && p.state !== 'place') {
    if (tap('KeyZ')) {
      if (tryMelee()) {
        p.state = 'slash'; p.stateT = CFG.SLASH_T; p.slashDone = false;
        AudioSys.sfx('slash');
      } else if (p.weapon === 'pistol') {
        p.state = 'shootP'; p.stateT = CFG.PISTOL_T; fireGun();
      } else if (p.ammo > 0) {
        p.state = 'shootMG'; p.stateT = 0.15; p.mgCd = 0; p.ammo--; fireGun();
      }
    }
    // MG auto-fire while held
    if (keys.KeyZ && p.weapon === 'mg' && p.state !== 'slash') {
      p.mgCd -= dt;
      if (p.mgCd <= 0 && p.ammo > 0 && !tryMelee()) {
        p.mgCd = CFG.MG_RATE; p.ammo--; fireGun();
        p.state = 'shootMG'; p.stateT = 0.15;
      }
    }
    if (p.ammo <= 0 && p.weapon === 'mg') p.weapon = 'pistol';
  }

  // pick anim
  let anim = 'run', loop = true;
  if (p.state === 'hit') { anim = 'hit'; loop = false; }
  else if (p.state === 'place') { anim = 'place'; loop = false; }
  else if (p.state === 'slash') { anim = 'slash'; loop = false; }
  else if (p.state === 'shootP') { anim = 'pistol'; loop = false; }
  else if (p.state === 'shootMG') { anim = 'mg'; }
  else if (!p.onGround) { anim = 'jump'; }
  else if (p.kneel) { anim = dir !== 0 ? 'kneelmove' : 'kneel'; }
  else if (cut) { anim = 'idle'; }
  if (anim !== p.anim) { p.anim = anim; p.fi = 0; p.ft = 0; }
  const fps = (CHARS.deadpool.fps && CHARS.deadpool.fps[anim]) || 9;
  p.ft += dt;
  const frames = animFrames('deadpool', anim);
  if (anim === 'jump') {
    p.fi = p.vy < -200 ? 0 : p.vy < 300 ? 1 : 2;
  } else if (p.ft > 1 / fps) {
    p.ft = 0; p.fi++;
    if (p.fi >= frames.length) p.fi = loop ? 0 : frames.length - 1;
  }
}

/* ========================= PROJECTILES ============================ */
function updateProjectiles(dt) {
  for (const pr of [...projectiles]) {
    pr.t += dt; pr.x += pr.vx * dt;
    if (pr.x < game.camX - 160 || pr.x > game.camX + CFG.W + 160) {
      projectiles.splice(projectiles.indexOf(pr), 1); continue;
    }
    if (pr.hostile) {
      const box = pr.type === 'wave'
        ? { x: pr.x - 60, y: pr.y - 44, w: 120, h: 48 }
        : { x: pr.x - 22, y: pr.y - 14, w: 44, h: 28 };
      if (rectsOverlap(box, playerHurtBox())) {
        hurtPlayer();
        if (pr.type !== 'wave') projectiles.splice(projectiles.indexOf(pr), 1);
      }
    } else {
      const box = { x: pr.x - 8, y: pr.y - 4, w: 16, h: 8 };
      let consumed = false;
      for (const e of [...enemies]) {
        if (rectsOverlap(box, enemyBox(e))) { killEnemy(e); consumed = true; break; }
      }
      if (!consumed && boss) consumed = bossHit('shot', box);
      if (!consumed) {
        for (const hp of [...projectiles]) {
          if (hp.hostile && (hp.type === 'shard' || hp.type === 'bolt') &&
              rectsOverlap(box, { x: hp.x - 20, y: hp.y - 16, w: 40, h: 32 })) {
            spark(hp.x, hp.y, 0.9);
            projectiles.splice(projectiles.indexOf(hp), 1);
            consumed = true; break;
          }
        }
      }
      if (consumed) {
        const i = projectiles.indexOf(pr);
        if (i >= 0) projectiles.splice(i, 1);
      }
    }
  }
}
function updatePickups(dt) {
  for (const pk of [...pickups]) {
    pk.t += dt;
    const box = { x: pk.x - 26, y: pk.y - 52, w: 52, h: 52 };
    if (rectsOverlap(box, playerHurtBox())) {
      if (pk.type === 'heart') player.hearts = Math.min(CFG.MAX_HEARTS, player.hearts + 1);
      else if (pk.type === 'ammo') player.ammo = Math.min(CFG.AMMO_CAP, player.ammo + CFG.AMMO_PER_BOX);
      else if (pk.type === 'wbox') startWolvSweep();
      else if (pk.type === 'helmet') {
        player.hasHelmet = true;
        AudioSys.sfx('helmet');
        if (game.beat === 'helmetwait') nextBeat('phase3');
      }
      AudioSys.sfx('pickup');
      pickups.splice(pickups.indexOf(pk), 1);
    }
  }
}
function startWolvSweep() {
  if (wolvSweep) return;
  wolvSweep = { x: game.camX - 90, t: 0 };
  AudioSys.sfx('roar');
}
function updateWolvSweep(dt) {
  if (!wolvSweep) return;
  wolvSweep.t += dt;
  wolvSweep.x += CFG.WOLV_SWEEP_V * dt;
  for (const e of [...enemies]) {
    if (Math.abs(e.x - wolvSweep.x) < 90) killEnemy(e, false);
  }
  if (wolvSweep.x > game.camX + CFG.W + 120) wolvSweep = null;
}

/* ============================ BOSSES ============================== */
function startJuggernaut() {
  game.arenaLock = { x0: game.camX };
  enemies = []; projectiles = projectiles.filter(p => !p.hostile);
  boss = {
    kind: 'juggernaut', x: game.camX + 780, y: CFG.GROUND_Y, hp: CFG.JUGG_HP,
    state: 'intro', t: 0, fi: 0, ft: 0, facingRight: false, dead: false,
    dashDir: -1, hitT: 0,
  };
  AudioSys.sfx('roar');
  say('deadpool', 'L3');
}
function startLoki() {
  game.arenaLock = { x0: game.camX };
  enemies = []; projectiles = projectiles.filter(p => !p.hostile);
  boss = {
    kind: 'loki', x: game.camX + CFG.W + 120, y: CFG.GROUND_Y, hp: CFG.LOKI_HP,
    state: 'enter', t: 0, fi: 0, ft: 0, facingRight: false, dead: false,
    helmetOn: false, waveCd: 2.2, hitT: 0, driftDir: -1, autoScene: 0,
  };
  game.musicNow = 'boss';
  AudioSys.playMusic('boss');
}
function bossHit(kind, box) {
  if (!boss || boss.dead) return false;
  if (!rectsOverlap(box, enemyBox(boss))) return false;
  if (boss.kind === 'juggernaut') {
    if (boss.state === 'dazed') {
      boss.hp--; boss.hitT = 0.25; spark(boss.x, boss.y - 140, 1.4); AudioSys.sfx('clang');
      if (boss.hp <= 0) juggDefeated();
    } else {
      spark(boss.x + (player.facing * 60), boss.y - 120, 0.8);
      AudioSys.sfx('clang');
    }
    return true;
  }
  if (boss.kind === 'loki') {
    if (boss.state === 'enter' || boss.autoScene) return true;
    if (!boss.helmetOn) {
      spark(boss.x, boss.y - 150, 1.1);
      floatText('NO EFFECT', boss.x, boss.y - dispH('loki') - 20, '#9ad1ff');
      AudioSys.sfx('noeffect');
    } else {
      boss.hp--; boss.hitT = 0.3; spark(boss.x, boss.y - 150, 1.5); AudioSys.sfx('hurt');
      if (boss.hp <= 0) lokiDefeated();
    }
    return true;
  }
  return false;
}
function juggDefeated() {
  boss.dead = true; boss.state = 'defeat'; boss.fi = 0;
  poof(boss.x, boss.y - 120, 2.6);
  say('deadpool', 'L4');
  pickups.push({ type: 'helmet', x: boss.x, y: CFG.GROUND_Y, t: 0 });
  game.beat = 'helmetwait';
  // arena stays locked until the helmet is collected
}
function lokiDefeated() {
  boss.dead = true; boss.state = 'defeat'; boss.fi = 0; boss.hitT = 0;
  projectiles = projectiles.filter(p => !p.hostile);
  AudioSys.stopMusic();
  AudioSys.sfx('jingle');
  nextBeat('ending');
}
function updateBoss(dt) {
  if (!boss) return;
  const b = boss;
  b.t += dt; b.ft += dt; b.hitT = Math.max(0, b.hitT - dt);
  if (b.kind === 'juggernaut') updateJugg(b, dt);
  else updateLoki(b, dt);
}
function updateJugg(b, dt) {
  const animMap = {
    intro: 'idle', taunt: 'idle', tele: 'idle', dash: 'charge', crash: 'crash',
    dazed: 'dazed', getup: 'getup', defeat: 'defeat',
  };
  const anim = b.hitT > 0 && b.state === 'dazed' ? 'hit' : animMap[b.state] || 'idle';
  const frames = animFrames('juggernaut', anim);
  const fps = (CHARS.juggernaut.fps && CHARS.juggernaut.fps[anim]) || 5;
  if (b.ft > 1 / fps) { b.ft = 0; b.fi = (b.fi + 1) % frames.length; }
  b.anim = anim;
  if (b.dead) return;

  switch (b.state) {
    case 'intro':
      if (b.t > 1.6) { b.state = 'taunt'; b.t = 0; }
      b.facingRight = player.x > b.x;
      break;
    case 'taunt':
      b.facingRight = player.x > b.x;
      if (b.t > 1.1) { b.state = 'tele'; b.t = 0; AudioSys.sfx('roar'); }
      break;
    case 'tele':
      game.shake = 3;
      if (b.t > CFG.JUGG_TELE_T) {
        b.state = 'dash'; b.t = 0; b.fi = 0;
        b.dashDir = player.x > b.x ? 1 : -1;
        b.facingRight = b.dashDir > 0;
      }
      break;
    case 'dash': {
      b.x += b.dashDir * CFG.JUGG_DASH_V * dt;
      const dashBox = { x: b.x - 70, y: b.y - 190, w: 140, h: 190 };
      if (rectsOverlap(dashBox, playerHurtBox())) hurtPlayer();
      const wallL = game.arenaLock.x0 + 70, wallR = game.arenaLock.x0 + CFG.W - 70;
      if (b.x <= wallL || b.x >= wallR) {
        b.x = Math.max(wallL, Math.min(wallR, b.x));
        b.state = 'crash'; b.t = 0; b.fi = 0;
        game.shake = 10; AudioSys.sfx('crash');
      }
      break;
    }
    case 'crash':
      if (b.t > 0.5) { b.state = 'dazed'; b.t = 0; b.fi = 0; }
      break;
    case 'dazed':
      if (b.t > CFG.JUGG_DAZED_T) { b.state = 'getup'; b.t = 0; b.fi = 0; }
      break;
    case 'getup':
      if (b.t > 0.6) { b.state = 'taunt'; b.t = 0; }
      break;
  }
}
function updateLoki(b, dt) {
  const anim = b.dead ? 'defeat' : b.hitT > 0 ? 'hit' : b.state === 'cast' ? 'cast' : 'idle';
  const frames = animFrames('loki', anim);
  const fps = (CHARS.loki.fps && CHARS.loki.fps[anim]) || 4;
  if (b.ft > 1 / fps) {
    b.ft = 0; b.fi++;
    if (b.fi >= frames.length) {
      if (b.state === 'cast' && !b.dead) { b.state = 'fight'; }
      b.fi = b.dead ? frames.length - 1 : 0;
    }
  }
  b.anim = anim;
  if (b.dead) return;

  if (b.autoScene > 0) {
    b.autoScene -= dt;
    if (b.autoScene <= 0) {
      b.autoScene = 0;
      b.helmetOn = true; player.hasHelmet = false;
      player.state = 'normal';
      floatText('NOW HIT HIM!', b.x, b.y - dispH('loki') - 30, '#ffe066');
      AudioSys.sfx('helmet');
    }
    return;
  }
  switch (b.state) {
    case 'enter':
      b.x -= 160 * dt;
      if (b.x <= game.arenaLock.x0 + 760) {
        b.x = game.arenaLock.x0 + 760;
        b.state = 'fight'; b.t = 0;
        say('deadpool', 'L5');
      }
      break;
    case 'fight': {
      b.facingRight = player.x > b.x;
      // slow drift near the right side of the arena
      const x0 = game.arenaLock.x0;
      b.x += b.driftDir * 40 * dt;
      if (b.x < x0 + 620) b.driftDir = 1;
      if (b.x > x0 + 840) b.driftDir = -1;
      b.waveCd -= dt;
      if (b.waveCd <= 0) {
        b.state = 'cast'; b.fi = 0; b.ft = 0; b.castFired = false;
        b.waveCd = b.helmetOn ? CFG.LOKI_WAVE_CD_FAST : CFG.LOKI_WAVE_CD;
      }
      // touch with helmet -> place it
      if (player.hasHelmet && !b.helmetOn &&
          rectsOverlap(playerHurtBox(), enemyBox(b))) {
        b.autoScene = 1.5;
        player.state = 'place'; player.stateT = 1.5;
        player.facing = b.x > player.x ? 1 : -1;
      }
      break;
    }
    case 'cast':
      if (b.fi >= 2 && !b.castFired) {
        b.castFired = true;
        projectiles.push({
          type: 'wave', x: b.x - 70, y: CFG.GROUND_Y,
          vx: -CFG.WAVE_SPEED, t: 0, hostile: true,
        });
        AudioSys.sfx('wave');
      }
      if (player.hasHelmet && !b.helmetOn &&
          rectsOverlap(playerHurtBox(), enemyBox(b))) {
        b.autoScene = 1.5; b.state = 'fight';
        player.state = 'place'; player.stateT = 1.5;
      }
      break;
  }
}

/* ============================ CUTSCENES =========================== */
function runCut(steps) { cut = { steps, i: 0, t: 0 }; }
function updateCut(dt) {
  if (!cut) return;
  cut.t += dt;
  const s = cut.steps[cut.i];
  if (!s) { cut = null; return; }
  if (s.on && !s.ran) { s.ran = true; s.on(); }
  if (cut.t >= (s.d || 0)) { cut.i++; cut.t = 0; }
  if (cut.i >= cut.steps.length) {
    cut = null;
  }
}
function startCutscene1() {
  game.beat = 'cut1';
  enemies = []; projectiles = [];
  const sx = game.camX;
  actors.push({ kind: 'sabretooth', x: sx + CFG.W + 80, y: CFG.GROUND_Y, anim: 'stalk', fi: 0, ft: 0, facingRight: false, vis: true });
  runCut([
    { d: 2.0, on: () => {} },                                    // Sabretooth stalks in (moved in updateActors)
    { d: 0.9, on: () => { actorSet('sabretooth', 'snarl'); AudioSys.sfx('roar'); } },
    { d: 0.9, on: () => {                                        // Wolverine dashes in
        actors.push({ kind: 'wolverine', x: game.camX - 90, y: CFG.GROUND_Y, anim: 'run', fi: 0, ft: 0, facingRight: true, vis: true, vx: 620 });
      } },
    { d: 1.2, on: () => { actorSet('wolverine', 'idle'); say('wolverine', 'L1'); } },
    { d: 0.7, on: () => { actorSet('wolverine', 'slash'); AudioSys.sfx('slash'); } },
    { d: 1.6, on: () => {                                        // comedic head pop
        const st = actors.find(a => a.kind === 'sabretooth');
        st.anim = 'ko'; st.fi = 0;
        st.headPop = { x: st.x - 6, y: st.y - 170, vy: -560, vx: 85, t: 0 };
        poof(st.x, st.y - 150, 1.6);
      } },
    { d: 2.2, on: () => { say('deadpool', 'L2'); } },
    { d: 1.2, on: () => {                                        // Wolverine runs off right
        const w = actors.find(a => a.kind === 'wolverine');
        w.anim = 'run'; w.vx = 700; w.facingRight = true;
        const st = actors.find(a => a.kind === 'sabretooth');
        if (st) st.fadeOut = true;
      } },
    { d: 0.2, on: () => { actors = []; nextBeat('phase2'); } },
  ]);
}
function actorSet(kind, anim) {
  const a = actors.find(a => a.kind === kind);
  if (a) { a.anim = anim; a.fi = 0; a.ft = 0; a.vx = 0; }
}
function updateActors(dt) {
  for (const a of [...actors]) {
    a.ft += dt;
    const c = CHARS[a.kind];
    const fps = (c.fps && c.fps[a.anim]) || 6;
    const frames = animFrames(a.kind, a.anim);
    if (a.ft > 1 / fps) {
      a.ft = 0; a.fi++;
      if (a.fi >= frames.length) a.fi = ['ko', 'snarl'].includes(a.anim) ? frames.length - 1 : 0;
    }
    if (a.vx) a.x += a.vx * dt;
    if (a.kind === 'sabretooth' && a.anim === 'stalk') {
      const target = game.camX + 660;
      if (a.x > target) a.x -= 240 * dt;
    }
    if (a.headPop) {
      const h = a.headPop;
      h.t += dt; h.vy += 1150 * dt; h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.y > CFG.GROUND_Y - 14) { h.y = CFG.GROUND_Y - 14; h.vy = -h.vy * 0.45; h.vx *= 0.7; }
    }
    if (a.fadeOut) {
      a.alpha = (a.alpha == null ? 1 : a.alpha) - dt * 0.8;
      if (a.alpha <= 0) actors.splice(actors.indexOf(a), 1);
    }
    if (a.x > game.camX + CFG.W + 140 && a.vx > 0) actors.splice(actors.indexOf(a), 1);
  }
}
function startEnding() {
  projectiles = []; enemies = [];
  actors.push({ kind: 'wolverine', x: game.camX - 90, y: CFG.GROUND_Y, anim: 'run', fi: 0, ft: 0, facingRight: true, vis: true, vx: 420 });
  runCut([
    { d: 1.4, on: () => {} },
    { d: 0.4, on: () => {
        const w = actors.find(a => a.kind === 'wolverine');
        if (w) { w.vx = 0; w.anim = 'idle'; w.x = player.x - 130; }
      } },
    { d: 3.0, on: () => { say('deadpool', 'L6'); } },
    { d: 2.0, on: () => { game.fadeDir = 1; } },
    { d: 0.4, on: () => {
        game.mode = 'congrats'; game.congratsT = 0; game.fade = 0; game.fadeDir = 0;
        bubbles = [];
      } },
  ]);
}

/* ============================ BEATS =============================== */
function nextBeat(b) {
  game.beat = b; game.beatT = 0;
  if (['phase1', 'phase2', 'phase3'].includes(b)) {
    game.checkpoint = b;
    game.arenaLock = null; boss = null;
    spawnCd = 0.8;
    if (game.musicNow !== 'level') { game.musicNow = 'level'; AudioSys.playMusic('level'); }
  }
  if (b === 'jugg') { game.checkpoint = 'jugg'; startJuggernaut(); }
  if (b === 'loki') { game.checkpoint = 'loki'; startLoki(); }
  if (b === 'ending') startEnding();
}
function restartCheckpoint() {
  const cp = game.checkpoint;
  const keep = { ammo: player.ammo, weapon: player.weapon, hasHelmet: player.hasHelmet };
  resetWorld();
  Object.assign(player, keep);
  if (cp === 'jugg' || cp === 'loki') {
    if (cp === 'loki' && !player.hasHelmet) player.hasHelmet = true;  // safety: helmet is required
    game.beat = cp; game.beatT = 0;
    game.camX = 0; player.x = 300;
    if (cp === 'jugg') startJuggernaut(); else startLoki();
    game.checkpoint = cp;
  } else {
    nextBeat(cp);
  }
  game.mode = 'play';
  if (cp !== 'loki' && game.musicNow !== 'level') { game.musicNow = 'level'; AudioSys.playMusic('level'); }
}
function updateBeat(dt) {
  const inCombat = ['phase1', 'phase2', 'phase3'].includes(game.beat);
  if (inCombat && !cut) game.beatT += dt;
  if (game.beat === 'phase1' && game.beatT >= CFG.PHASE1_T) startCutscene1();
  else if (game.beat === 'phase2' && game.beatT >= CFG.PHASE2_T) nextBeat('jugg');
  else if (game.beat === 'phase3' && game.beatT >= CFG.PHASE3_T) nextBeat('loki');
}

/* ============================ UPDATE ============================== */
function update(dt) {
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt * 30);
  if (game.fadeDir) game.fade = Math.min(1, game.fade + dt / 2);

  updateCut(dt);
  updatePlayer(dt);
  updateActors(dt);
  if (!cut) {
    updateSpawner(dt);
    for (const e of [...enemies]) updateEnemy(e, dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateWolvSweep(dt);
    updateBeat(dt);
  }
  for (const f of [...fxs]) { f.t += dt; if (f.t > 0.45) fxs.splice(fxs.indexOf(f), 1); }
  for (const f of [...floaters]) { f.t += dt; if (f.t > 1.2) floaters.splice(floaters.indexOf(f), 1); }
  for (const b of [...bubbles]) {
    b.t += dt;
    const full = b.text.length / CFG.BUBBLE_CPS;
    if (b.t < full && Math.floor(b.t * CFG.BUBBLE_CPS) % 3 === 0) AudioSys.sfx('talk');
    if (b.t > full + CFG.BUBBLE_HOLD) bubbles.splice(bubbles.indexOf(b), 1);
  }
  AudioSys.tickMusic();
}

/* ============================ RENDER ============================== */
function px(n) { return Math.round(n); }
function text(s, x, y, size = 16, color = '#fff', align = 'left', bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(s, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function drawBackground() {
  ctx.drawImage(IMG.bg_sky, 0, 0, CFG.W, CFG.H);
  // far ruins: parallax 0.3x
  const fw = 1024, fh = 160;
  let fx0 = -((game.camX * 0.3) % fw);
  for (let x = fx0 - fw; x < CFG.W + fw; x += fw) {
    ctx.drawImage(IMG.bg_far, px(x), CFG.GROUND_Y - fh + 24, fw, fh);
  }
  // ground: 1:1
  const gw = 512, gh = 96;
  let gx0 = -(game.camX % gw);
  for (let x = gx0 - gw; x < CFG.W + gw; x += gw) {
    ctx.drawImage(IMG.bg_ground, px(x), CFG.GROUND_Y - 10, gw, gh);
  }
  // scattered props from the rips (anchored to the ground)
  const seed = Math.floor(game.camX / 900);
  for (let i = seed - 1; i <= seed + 2; i++) {
    const rx = i * 900 + ((i * 7919) % 500);
    const name = (i % 2 === 0) ? 'barrel' : 'rock';
    const s = name === 'barrel' ? 0.55 : 0.45;
    const fr = fxFrame(name);
    if (fr) drawFx(name, rx, CFG.GROUND_Y - fr[3] * s / 2 + 6, s, { alpha: 0.9 });
  }
}
function drawEnemies() {
  for (const e of enemies) {
    drawChar(e.kind, e.state === 'attack' ? 'attack' : 'move', e.fi, e.x, e.y + (e.yOff || 0), e.facingRight);
  }
}
function drawBoss() {
  if (!boss) return;
  const b = boss;
  const opts = { flash: !b.dead && b.hitT > 0 };
  const anim = b.dead ? 'defeat' : (b.anim || 'idle');
  drawChar(b.kind, anim, b.dead ? 99 : b.fi, b.x, b.y, b.facingRight, opts);
  if (b.kind === 'loki' && b.helmetOn) {
    const hh = dispH('loki');
    drawFx('helmet', b.x + (b.facingRight ? 6 : -6), b.y - hh * 0.86, 1.7, { flip: b.facingRight });
  }
  if (b.kind === 'juggernaut' && b.state === 'dazed') {
    // stars circling the dazed head
    for (let i = 0; i < 3; i++) {
      const a = game.time * 5 + i * 2.1;
      const sx = b.x + Math.cos(a) * 60 - game.camX, sy = b.y - 205 + Math.sin(a) * 14;
      text('*', sx, sy, 22, '#ffe066', 'center');
    }
  }
  if (!b.dead && b.kind === 'loki' && b.state !== 'enter') {
    // boss HP pips
    for (let i = 0; i < CFG.LOKI_HP; i++) {
      ctx.fillStyle = i < b.hp ? '#59d659' : '#333';
      ctx.fillRect(CFG.W / 2 - 40 + i * 30, 54, 22, 10);
      ctx.strokeStyle = '#000'; ctx.strokeRect(CFG.W / 2 - 40 + i * 30, 54, 22, 10);
    }
    text(boss.helmetOn ? 'LOKI (VULNERABLE!)' : 'LOKI — NO EFFECT WITHOUT THE HELMET', CFG.W / 2, 34, 14, '#c9f', 'center');
  }
  if (!b.dead && b.kind === 'juggernaut') {
    for (let i = 0; i < CFG.JUGG_HP; i++) {
      ctx.fillStyle = i < b.hp ? '#d65959' : '#333';
      ctx.fillRect(CFG.W / 2 - 40 + i * 30, 54, 22, 10);
      ctx.strokeStyle = '#000'; ctx.strokeRect(CFG.W / 2 - 40 + i * 30, 54, 22, 10);
    }
    text('JUGGERNAUT — HIT HIM WHILE HE IS DOWN', CFG.W / 2, 34, 14, '#fbb', 'center');
  }
}
function drawActors() {
  for (const a of actors) {
    drawChar(a.kind, a.anim, a.fi, a.x, a.y, a.facingRight, { alpha: a.alpha });
    if (a.headPop) drawFx('head', a.headPop.x, a.headPop.y, 1.9, { rot: a.headPop.t * 9, alpha: a.alpha });
  }
}
function drawPlayer() {
  const p = player;
  if (p.inv > 0 && Math.floor(p.inv * 18) % 2 === 0 && p.flash <= 0) return; // i-frame flicker
  const opts = { flash: p.flash > 0 };
  drawChar('deadpool', p.anim, p.fi, p.x, p.y, p.facing > 0, opts);
  if (p.state === 'place') drawFx('helmet', p.x + p.facing * 52, p.y - 96, 1.5);
  if (p.hasHelmet && p.state !== 'place') drawFx('helmet', p.x - p.facing * 34, p.y - dispH('deadpool') - 4, 1.0);
}
function drawProjectiles() {
  for (const pr of projectiles) {
    if (pr.type === 'tracer') drawUiWorld('tracer', pr.x, pr.y, pr.vx < 0);
    else if (pr.type === 'mgtracer') drawUiWorld('mgtracer', pr.x, pr.y, pr.vx < 0);
    else if (pr.type === 'shard') drawFx('shard', pr.x, pr.y, 0.5, { rot: pr.t * 10 });
    else if (pr.type === 'bolt') drawFx(Math.floor(pr.t * 14) % 2 ? 'bolt1' : 'bolt0', pr.x, pr.y, 0.6, { flip: pr.vx > 0 });
    else if (pr.type === 'wave') {
      const pulse = 0.62 + Math.sin(pr.t * 16) * 0.07;
      drawFx(Math.floor(pr.t * 10) % 2 ? 'wave1' : 'wave0', pr.x, pr.y - 34, pulse, { flip: pr.vx > 0 });
    }
  }
}
function drawUiWorld(name, wx, wy, flip) {
  const fr = ATLAS.ui.frames[name];
  ctx.save();
  ctx.translate(px(wx - game.camX), px(wy));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(IMG.ui, fr[0], fr[1], fr[2], fr[3], -fr[2] / 2, -fr[3] / 2, fr[2], fr[3]);
  ctx.restore();
}
function drawPickups() {
  for (const pk of pickups) {
    const bobY = pk.y - 26 + Math.sin(pk.t * 5 + pk.x) * 5;
    if (pk.type === 'heart') drawUiWorld('heart', pk.x, bobY);
    else if (pk.type === 'ammo') drawUiWorld('bulletbox', pk.x, bobY);
    else if (pk.type === 'wbox') drawUiWorld('wbox', pk.x, bobY);
    else if (pk.type === 'helmet') {
      drawFx('helmet', pk.x, bobY - 6, 1.6);
      text('PICK UP THE HELMET!', pk.x - game.camX, bobY - 90, 13, '#ffe066', 'center');
    }
  }
}
function drawWolvSweep() {
  if (!wolvSweep) return;
  const fi = Math.floor(wolvSweep.t * 12) % 3;
  drawChar('wolverine', 'slash', fi, wolvSweep.x, CFG.GROUND_Y, true);
}
function drawFxs() {
  for (const f of fxs) {
    if (f.type === 'poof') {
      const fi = Math.min(2, Math.floor(f.t / 0.15));
      drawFx('poof' + fi, f.x, f.y, f.scale * (1 + f.t), { alpha: 1 - f.t * 1.6 });
    } else {
      drawFx('spark', f.x, f.y, f.scale, { alpha: 1 - f.t * 2 });
    }
  }
  for (const f of floaters) {
    text(f.text, f.x - game.camX, f.y - f.t * 40, 15, f.color, 'center');
  }
}
function wrapText(s, maxChars) {
  const words = s.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}
function drawBubbleAt(sx, sy, shown, opts = {}) {
  const lines = wrapText(shown, 26);
  const lineW = Math.max(...lines.map(l => l.length), 4) * 9.7;
  const w = Math.max(90, lineW + 26), h = lines.length * 18 + 20, tail = 16;
  let bx = sx - w * 0.35, by = sy - h - tail;
  bx = Math.max(6, Math.min(CFG.W - w - 6, bx));
  by = Math.max(6, by);
  const fr = ATLAS.ui.frames.bubble;
  const C = 15;  // 9-slice corner (bubble sprite is 144x78 incl. tail zone)
  const bw = fr[2], bh = fr[3] - 18;  // body region above the tail
  // 9-slice the bubble body
  const dxs = [bx, bx + C, bx + w - C], dws = [C, w - 2 * C, C];
  const sxs = [fr[0], fr[0] + C, fr[0] + bw - C], sws = [C, bw - 2 * C, C];
  const dys = [by, by + C, by + h - C], dhs = [C, h - 2 * C, C];
  const sys_ = [fr[1], fr[1] + C, fr[1] + bh - C], shs = [C, bh - 2 * C, C];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    ctx.drawImage(IMG.ui, sxs[i], sys_[j], sws[i], shs[j], px(dxs[i]), px(dys[j]), px(dws[i]) + 1, px(dhs[j]) + 1);
  }
  // tail
  ctx.drawImage(IMG.ui, fr[0] + 18, fr[1] + bh - 4, 30, 22, px(sx - 8), px(by + h - 3), 24, 18);
  lines.forEach((l, i) => {
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#111';
    ctx.fillText(l, bx + 14, by + 11 + i * 18);
  });
}
function drawBubbles() {
  for (const b of bubbles) {
    const pos = speakerPos(b);
    const shown = b.text.slice(0, Math.floor(b.t * CFG.BUBBLE_CPS));
    if (!shown) continue;
    drawBubbleAt(pos.x - game.camX, pos.y, shown);
  }
}
function drawHUD() {
  for (let i = 0; i < CFG.MAX_HEARTS; i++) {
    drawUi(i < player.hearts ? 'heart' : 'heart_empty', 14 + i * 52, 12, 0.8);
  }
  // weapon slot
  const wx = CFG.W - 150, wy = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(wx - 8, wy - 2, 150, 46);
  ctx.strokeStyle = '#fff'; ctx.strokeRect(wx - 8, wy - 2, 150, 46);
  if (player.weapon === 'pistol') {
    drawUi('pistol_icon', wx, wy + 4, 0.55);
    text('∞', wx + 52, wy + 8, 22, '#ffe066');
  } else {
    drawFxIcon('mgicon', wx, wy + 2, 40);
    text(String(player.ammo), wx + 52, wy + 10, 20, '#ffe066');
  }
  if (player.mgFlash > 0 && Math.floor(player.mgFlash * 10) % 2 === 0) {
    drawFxIcon('mgicon', wx + 92, wy + 2, 40);
    text('0', wx + 128, wy + 10, 16, '#f66');
  }
  if (player.hasHelmet) drawFxIcon('helmet', wx + 96, wy + 2, 40);
  // phase label + combat timer
  const label = { phase1: 'PHASE 1', cut1: '', phase2: 'PHASE 2', jugg: 'MID-BOSS',
                  helmetwait: 'MID-BOSS', phase3: 'PHASE 3', loki: 'FINAL BOSS', ending: '' }[game.beat] || '';
  if (label) text(label, CFG.W / 2, 12, 16, '#fff', 'center');
  if (['phase1', 'phase2', 'phase3'].includes(game.beat)) {
    const total = game.beat === 'phase1' ? CFG.PHASE1_T : game.beat === 'phase2' ? CFG.PHASE2_T : CFG.PHASE3_T;
    const remain = Math.max(0, total - game.beatT);
    text(`${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`, CFG.W / 2, 32, 14, '#ffd', 'center');
  }
}
function drawFxIcon(name, x, y, size) {
  const fr = fxFrame(name);
  if (!fr) return;
  const s = size / Math.max(fr[2], fr[3]);
  ctx.drawImage(IMG.fx, fr[0], fr[1], fr[2], fr[3], x, y, fr[2] * s, fr[3] * s);
}
function drawTitle() {
  ctx.fillStyle = '#0b0710'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.drawImage(IMG.bg_sky, 0, 0, CFG.W, CFG.H);
  ctx.fillStyle = 'rgba(10,6,14,0.55)'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  text('DEADPOOL', CFG.W / 2, 74, 64, '#e02439', 'center');
  text('vs. THE VOID', CFG.W / 2, 148, 40, '#ffe066', 'center');
  text('a Marvel: Avengers Alliance sprite fan-game', CFG.W / 2, 200, 14, '#caa', 'center');
  const rows = [
    ['ARROWS', 'steer (Deadpool always runs) / DOWN = take a knee'],
    ['X  (A)', 'jump — straight up or diagonal, hold for height'],
    ['Z  (B)', 'smart attack: gun at range, katana up close'],
    ['SHIFT', 'toggle pistol / machine gun'],
    ['ENTER', 'start & pause'],
    ['D', 'debug (hitboxes + frame viewer)'],
  ];
  rows.forEach((r, i) => {
    text(r[0], CFG.W / 2 - 300, 258 + i * 26, 16, '#ffe066');
    text(r[1], CFG.W / 2 - 160, 258 + i * 26, 16, '#fff');
  });
  if (Math.floor(game.time * 2) % 2 === 0) text('PRESS ENTER', CFG.W / 2, 448, 26, '#fff', 'center');
  if (MISSING.length) {
    text('MISSING ASSETS:', 12, 420, 13, '#f66');
    MISSING.slice(0, 6).forEach((m, i) => text(m, 12, 438 + i * 15, 12, '#f88'));
  }
  text('Personal non-commercial fan homebrew. Sprites: Marvel Avengers Alliance (Playdom).', CFG.W / 2, 512, 11, '#977', 'center');
}
function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  text('PAUSED', CFG.W / 2, 160, 40, '#fff', 'center');
  ['RESUME', 'RESTART PHASE', 'MUSIC: ' + (AudioSys.musicOn ? 'ON' : 'OFF')].forEach((s, i) => {
    text((game.pauseSel === i ? '> ' : '  ') + s, CFG.W / 2, 250 + i * 36, 22,
         game.pauseSel === i ? '#ffe066' : '#ccc', 'center');
  });
}
function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  text('TRY AGAIN?', CFG.W / 2, 200, 48, '#e02439', 'center');
  if (Math.floor(game.time * 2) % 2 === 0)
    text('PRESS ENTER — restart from the start of this phase', CFG.W / 2, 300, 18, '#fff', 'center');
}
function drawCongrats(dt) {
  game.congratsT += dt;
  ctx.fillStyle = '#120a18'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  // starfield sparkle
  for (let i = 0; i < 40; i++) {
    const x = (i * 193) % CFG.W, y = (i * 89) % 200;
    ctx.fillStyle = (Math.floor(game.time * 2 + i) % 3 === 0) ? '#ffe066' : '#443';
    ctx.fillRect(x, y, 3, 3);
  }
  text('CONGRATS!', CFG.W / 2, 26, 52, '#ffe066', 'center');
  const mm = IMG.mm_big;
  if (mm && mm.width) ctx.drawImage(mm, CFG.W / 2 - 110, 100, 220, 275);
  // Miss Minutes talks (typewriter)
  const line = LINES.L7.text;
  const t0 = 1.0;
  if (game.congratsT > t0) {
    const shown = line.slice(0, Math.floor((game.congratsT - t0) * CFG.BUBBLE_CPS));
    const talking = shown.length < line.length;
    drawUi(Math.floor(game.time * 6) % 2 === 0 && talking ? 'missm1' : 'missm0', 150, 395, 1);
    drawBubbleAt(260, 470, shown);
    if (!talking && game.congratsT > t0 + line.length / CFG.BUBBLE_CPS + 1) {
      if (Math.floor(game.time * 2) % 2 === 0)
        text('THE END — PRESS ENTER TO PLAY AGAIN', CFG.W / 2, 500, 20, '#fff', 'center');
    }
  }
}
function drawDebug() {
  ctx.strokeStyle = '#0f0';
  const pb = playerHurtBox();
  ctx.strokeRect(pb.x - game.camX, pb.y, pb.w, pb.h);
  ctx.strokeStyle = '#ff0';
  const mb = {
    x: player.facing > 0 ? player.x + 8 : player.x - 8 - CFG.MELEE_REACH,
    y: player.y - 180, w: CFG.MELEE_REACH, h: 190,
  };
  ctx.strokeRect(mb.x - game.camX, mb.y, mb.w, mb.h);
  ctx.strokeStyle = '#f00';
  for (const e of enemies) {
    const b = enemyBox(e);
    ctx.strokeRect(b.x - game.camX, b.y, b.w, b.h);
    if (e.atkBox) { ctx.strokeStyle = '#f0f'; ctx.strokeRect(e.atkBox.x - game.camX, e.atkBox.y, e.atkBox.w, e.atkBox.h); ctx.strokeStyle = '#f00'; }
  }
  if (boss) { const b = enemyBox(boss); ctx.strokeStyle = '#f80'; ctx.strokeRect(b.x - game.camX, b.y, b.w, b.h); }
  ctx.strokeStyle = '#0ff';
  for (const pr of projectiles) ctx.strokeRect(pr.x - 20 - game.camX, pr.y - 15, 40, 30);
  text(`beat:${game.beat} t:${game.beatT.toFixed(1)} enemies:${enemies.length} cam:${Math.round(game.camX)} V=frame viewer`, 10, CFG.H - 24, 13, '#0f0');
}
function drawViewer() {
  ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  const names = Object.keys(ATLAS.sheets);
  game.viewerSheet = (game.viewerSheet + names.length) % names.length;
  const name = names[game.viewerSheet];
  const sh = ATLAS.sheets[name];
  game.viewerFrame = (game.viewerFrame + sh.frames.length) % sh.frames.length;
  const fr = sh.frames[game.viewerFrame];
  const s = Math.min(380 / fr[3], 380 / fr[2], 2);
  ctx.save();
  ctx.translate(CFG.W / 2, CFG.H / 2 + 60);
  ctx.strokeStyle = '#444'; ctx.strokeRect(-fr[2] * s / 2, -fr[3] * s, fr[2] * s, fr[3] * s);
  ctx.drawImage(IMG[name], fr[0], fr[1], fr[2], fr[3], -fr[2] * s / 2, -fr[3] * s, fr[2] * s, fr[3] * s);
  ctx.restore();
  const anims = Object.entries(sh.anims).filter(([a, fs]) => fs.includes(game.viewerFrame)).map(([a]) => a).join(', ');
  text('FRAME VIEWER  (UP/DOWN sheet, LEFT/RIGHT frame, V/ESC exit)', CFG.W / 2, 20, 16, '#ffe066', 'center');
  text(`${name}  frame ${game.viewerFrame}/${sh.frames.length - 1}  rect ${fr.join(',')}`, CFG.W / 2, 48, 15, '#fff', 'center');
  text(`used by anims: ${anims || '(none)'}`, CFG.W / 2, 70, 15, '#9cf', 'center');
}
function render(dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  if (game.mode === 'title') { drawTitle(); return; }
  if (game.mode === 'congrats') { drawCongrats(dt); return; }
  if (game.viewer) { drawViewer(); return; }
  const shake = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake : 0;
  ctx.setTransform(1, 0, 0, 1, 0, Math.round(shake));
  drawBackground();
  drawPickups();
  drawEnemies();
  drawBoss();
  drawActors();
  drawWolvSweep();
  drawPlayer();
  drawProjectiles();
  drawFxs();
  drawBubbles();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHUD();
  if (game.debug) drawDebug();
  if (game.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${game.fade})`; ctx.fillRect(0, 0, CFG.W, CFG.H); }
  if (game.mode === 'pause') drawPause();
  if (game.mode === 'gameover') drawGameOver();
}

/* ============================ MODES =============================== */
function handleModes() {
  if (game.mode === 'title') {
    if (tap('Enter')) {
      resetWorld();
      game.mode = 'play';
      nextBeat('phase1');
    }
    return;
  }
  if (game.mode === 'congrats') {
    if (tap('Enter')) { game.mode = 'title'; resetWorld(); AudioSys.stopMusic(); }
    return;
  }
  if (game.mode === 'gameover') {
    if (tap('Enter')) restartCheckpoint();
    return;
  }
  if (game.viewer) {
    if (tap('ArrowUp')) { game.viewerSheet--; game.viewerFrame = 0; }
    if (tap('ArrowDown')) { game.viewerSheet++; game.viewerFrame = 0; }
    if (tap('ArrowLeft')) game.viewerFrame--;
    if (tap('ArrowRight')) game.viewerFrame++;
    if (tap('KeyV') || tap('Escape')) game.viewer = false;
    return;
  }
  if (game.mode === 'pause') {
    if (tap('ArrowUp')) game.pauseSel = (game.pauseSel + 2) % 3;
    if (tap('ArrowDown')) game.pauseSel = (game.pauseSel + 1) % 3;
    if (tap('Enter')) {
      if (game.pauseSel === 0) game.mode = 'play';
      else if (game.pauseSel === 1) restartCheckpoint();
      else AudioSys.setMusicOn(!AudioSys.musicOn);
    }
    return;
  }
  // playing
  if (tap('Enter')) { game.mode = 'pause'; game.pauseSel = 0; return; }
  if (tap('KeyD')) game.debug = !game.debug;
  if (game.debug && tap('KeyV')) game.viewer = true;
}

/* ============================ MAIN LOOP =========================== */
let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  handleModes();
  if (game.mode === 'play') {
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
  } else {
    game.time += dt;
    AudioSys.tickMusic();
  }
  render(dt);
  for (const k of Object.keys(pressed)) pressed[k] = false;
}
requestAnimationFrame(frame);
