'use strict';
/* ================================================================== *
 *  DEADPOOL vs. THE VOID  —  MvC2 official-artwork edition
 *  Side-scrolling brawler in the spirit of NES Kung Fu.
 *  Characters: official Marvel vs. Capcom 2 artwork (Capcom/Marvel),
 *  cut out and puppet-animated in code. MvC2 has NO Deadpool, so
 *  CABLE stands in as the playable lead. All UI/FX/backgrounds are
 *  original pixel art drawn in code.
 *  Personal, non-commercial fan homebrew. Do not distribute or sell.
 * ================================================================== */

/* ============================ TUNABLES ============================ */
const CFG = {
  W: 960, H: 540, GROUND_Y: 505,

  RUN_SPEED: 330,           // the hero always runs at this speed
  KNEEL_SPEED: 180,
  JUMP_VY: -880,
  GRAVITY: 2400,
  HOLD_GRAVITY: 1250,       // reduced gravity while A held and rising

  MAX_HEARTS: 4,
  INVINCIBLE_T: 1.0,
  HIT_FLASH_T: 0.18,

  MELEE_REACH: 130,         // smart attack: blade range in front of the hero
  SLASH_T: 0.30,
  PISTOL_T: 0.24,
  MG_RATE: 0.125,           // ~8 shots/sec
  TRACER_SPEED: 780,
  AMMO_PER_BOX: 20, AMMO_CAP: 99,

  DROP_CHANCE: 0.20,
  DROP_HEART: 0.40, DROP_AMMO: 0.40,   // remainder = W-box

  PHASE1_T: 120, PHASE2_T: 60, PHASE3_T: 60,
  SPAWN_CAP: [3, 3, 4],
  SPAWN_CD: [[1.4, 2.4], [1.1, 2.0], [0.9, 1.7]],
  SPAWN_FROM_LEFT: 0.2,

  RANGED_STAND_OFF: 380,    // Doom / Spiral stop distance
  RANGED_CD: 2.5,
  PROJ_SPEED: 240,
  PROJ_HEIGHT: 66,          // above ground; jumpable

  ATK_T: 0.55,              // melee enemy attack duration
  JUGG_HP: 3, JUGG_DASH_V: 760, JUGG_DAZED_T: 2.5, JUGG_TELE_T: 0.6,
  BOSS_HP: 3, WAVE_CD: 2.0, WAVE_CD_FAST: 1.5,
  WAVE_SPEED: 290,
  WOLV_SWEEP_V: 480,        // slower = the Wolverine rampage stays on screen longer

  STICK_LEN: 92, STICK_W: 15,   // the popsicle stick under every puppet

  BUBBLE_CPS: 28,
  BUBBLE_HOLD: 2.5,
};

/* Per-character gameplay config. Art cutouts are single official MvC2
   illustrations; motion comes from the puppet animator below. */
const CHARS = {
  deadpool:       { h: 190 },                                   // the player
  wolverine:      { h: 180 },                                   // ally
  wolverine_bone: { h: 180 },                                   // W-box sweep variant
  sabretooth:     { h: 200 },
  sab_ko:         { h: 200 },                                   // headless KO body (gag)
  juggernaut:     { h: 255 },
  cassandra:      { h: 230 },                                   // final boss (movie photo puppet)
  dp_photo:       { h: 195 },                                   // ending cameo (movie photo puppet)
  sentinel:       { h: 265, speed: 45,  reach: 150, big: true },
  silver_samurai: { h: 215, speed: 80,  reach: 125 },
  omega_red:      { h: 210, speed: 95,  reach: 130 },
  blackheart:     { h: 215, speed: 70,  reach: 120 },
  shuma_gorath:   { h: 185, speed: 60,  reach: 115, hover: true },
  venom:          { h: 195, speed: 115, reach: 110 },
  spiral:         { h: 200, speed: 90,  ranged: true },
  marrow:         { h: 190, speed: 120, reach: 100 },
  doctor_doom:    { h: 205, speed: 85,  ranged: true },
};

const PHASE_MIX = [
  ['marrow', 'venom', 'shuma_gorath', 'omega_red'],
  ['marrow', 'venom', 'shuma_gorath', 'omega_red', 'spiral', 'doctor_doom', 'silver_samurai', 'blackheart'],
  ['marrow', 'venom', 'shuma_gorath', 'omega_red', 'spiral', 'doctor_doom', 'silver_samurai', 'blackheart', 'sentinel'],
];
const KIND_CAP = { sentinel: 1, blackheart: 2, doctor_doom: 2, spiral: 2, silver_samurai: 2 };
const NICE = {
  deadpool: 'DEADPOOL', wolverine: 'WOLVERINE', sabretooth: 'SABRETOOTH', juggernaut: 'JUGGERNAUT',
  cassandra: 'CASSANDRA', sentinel: 'SENTINEL', silver_samurai: 'SILVER SAMURAI', omega_red: 'OMEGA RED',
  blackheart: 'BLACKHEART', shuma_gorath: 'SHUMA-GORATH', venom: 'VENOM', spiral: 'SPIRAL',
  marrow: 'MARROW', doctor_doom: 'DR. DOOM',
};

/* Dialogue script — exact lines, exact speakers. */
const LINES = {
  L1: { who: 'wolverine', text: "Let's go!" },
  L2: { who: 'deadpool', text: 'I have the Wolverine!' },
  L3: { who: 'deadpool', text: 'I am your favorite fan!' },
  L4: { who: 'deadpool', text: 'Disney paid a lot for this CG' },
  L5: { who: 'deadpool', text: 'I am Marvel Jesus' },
  L6: { who: 'deadpool', text: "Let's go home." },
  L7: { who: 'missminutes', text: 'Great work! You saved the sacred timeline... You truly are Marvel Jesus.' },
  L8: { who: 'dp_photo', text: 'I love it' },
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
const IMG = {};
const MISSING = [];
function loadImage(name, src) {
  const im = new Image();
  im.onerror = () => { MISSING.push(src); };
  im.src = src;
  IMG[name] = im;
}
const ATLAS = window.ATLAS || null;
if (ATLAS) {
  for (const [n, c] of Object.entries(ATLAS.chars)) loadImage(n, 'assets/' + c.img);
  for (const [n, c] of Object.entries(ATLAS.pieces)) loadImage('piece_' + n, 'assets/' + c.img);
  loadImage('ui', 'assets/' + ATLAS.ui.img);
} else {
  MISSING.push('assets/atlas.js');
}
loadImage('mm_big', 'assets/sprites/miss_minutes_big.png');
loadImage('bg_sky', 'assets/sprites/bg_sky.png');
loadImage('bg_far', 'assets/sprites/bg_far.png');
loadImage('bg_ground', 'assets/sprites/bg_ground.png');
loadImage('bg_front', 'assets/sprites/bg_front.png');

function charScale(name) { return CHARS[name].h / ATLAS.chars[name].h; }
function dispH(kind) { return CHARS[kind].h; }
function dispW(kind) { return ATLAS.chars[kind].w * charScale(kind); }

/* ======================= PUPPET ANIMATOR ========================== *
 * One official illustration per character; poses are procedural
 * transforms (bob, lean, lunge, squash, spin, sink) about the feet.  */
function drawPuppet(name, pose, wx, wy, facingRight, o = {}) {
  const meta = ATLAS.chars[name];
  if (!meta || !IMG[name] || !IMG[name].width) return;
  const s = charScale(name) * (o.scale || 1);
  const w = meta.w * s, h = meta.h * s;
  const t = (o.t != null ? o.t : game.time) + (o.ph || 0);
  const fw = facingRight ? 1 : -1;        // forward in screen space
  const p = Math.max(0, Math.min(1, o.p != null ? o.p : 0));
  let dx = 0, dy = 0, rot = 0, sxm = 1, sym = 1, alpha = o.alpha != null ? o.alpha : 1;
  switch (pose) {
    case 'idle': dy = Math.sin(t * 2.1) * 3; rot = Math.sin(t * 1.6) * 0.015; break;
    case 'run': {
      const hop = Math.abs(Math.sin(t * 8));
      dy = -hop * 9; rot = fw * 0.07 + Math.sin(t * 8) * 0.03; sym = 1 - hop * 0.03;
      break;
    }
    case 'move': case 'stalk': {
      const hop = Math.abs(Math.sin(t * 5.5));
      dy = -hop * 7; rot = fw * 0.05 + Math.sin(t * 5.5) * 0.025;
      break;
    }
    case 'hover': dy = Math.sin(t * 3) * 9 - 6; rot = Math.sin(t * 2.2) * 0.05; break;
    case 'charge': rot = fw * 0.20; dy = -Math.abs(Math.sin(t * 11)) * 5; break;
    case 'jump':
      rot = fw * Math.max(-0.12, Math.min(0.20, (o.vy || 0) / 2600)) + Math.sin(t * 5) * 0.10;
      sym = 1.05;
      break;
    case 'kneel': sym = 0.80; rot = fw * 0.03; break;
    case 'kneelmove': sym = 0.80; dy = -Math.abs(Math.sin(t * 7)) * 4; rot = fw * 0.05; break;
    case 'slash': dx = fw * Math.sin(p * Math.PI) * 30; rot = fw * (p < 0.4 ? -0.08 : 0.13); break;
    case 'shoot': dx = -fw * 8 * (1 - p); rot = -fw * 0.03 * (1 - p); break;
    case 'mg': dx = -fw * 6 + Math.sin(t * 45) * 2.2; rot = -fw * 0.04; break;
    case 'cast': dy = -Math.sin(p * Math.PI) * 16; rot = -fw * 0.05; sym = 1 + 0.05 * Math.sin(p * Math.PI); break;
    case 'attack': dx = fw * Math.sin(p * Math.PI) * 36; rot = fw * 0.13 * Math.sin(p * Math.PI); break;
    case 'hit': rot = -fw * 0.16; dx = -fw * 10; break;
    case 'dazed': rot = fw * 0.34 + Math.sin(t * 3) * 0.05; dy = 10; break;
    case 'crash': rot = fw * 0.45; dx = fw * 8; break;
    case 'getup': rot = fw * 0.30 * (1 - p); break;
    case 'ko': case 'defeat': {
      const k = Math.max(0, Math.min(1, o.sink || 0));
      rot = fw * (0.5 + k * 0.85); dy = k * h * 0.55; alpha *= (1 - k * 0.45);
      break;
    }
    case 'place': rot = fw * 0.10; dx = fw * 12; break;
    case 'victory': dy = -Math.abs(Math.sin(t * 5)) * 10; break;
    case 'snarl': { const q = 1 + 0.035 * Math.sin(t * 12); sxm = q; sym = q; break; }
  }
  // hand-held puppet micro-wobble
  if (pose !== 'ko' && pose !== 'defeat') rot += Math.sin(t * 13) * 0.012;
  const mirror = (facingRight === !!meta.right) ? 1 : -1;
  ctx.save();
  if (o.flash) ctx.filter = 'brightness(2.4) saturate(0.3)';
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(wx - game.camX + dx), Math.round(wy + dy));
  ctx.rotate(rot);
  ctx.scale(mirror * sxm, sym);
  // popsicle stick, glued behind the cardboard figure
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(-CFG.STICK_W / 2 - 2, -8, CFG.STICK_W + 4, CFG.STICK_LEN + 8);
  ctx.fillStyle = '#cfa768';
  ctx.fillRect(-CFG.STICK_W / 2, -6, CFG.STICK_W, CFG.STICK_LEN + 2);
  ctx.beginPath();
  ctx.arc(0, CFG.STICK_LEN - 2, CFG.STICK_W / 2 + 2, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#b58c50';
  ctx.fillRect(-2, -6, 3, CFG.STICK_LEN);
  ctx.drawImage(IMG[name], -w / 2, -h, w, h);
  ctx.restore();
}
function drawPiece(name, wx, wy, targetH, o = {}) {
  const meta = ATLAS.pieces[name];
  const img = IMG['piece_' + name];
  if (!meta || !img || !img.width) return;
  const s = targetH / meta.h;
  const w = meta.w * s, h = meta.h * s;
  ctx.save();
  ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
  ctx.translate(Math.round(wx - game.camX), Math.round(wy));
  if (o.rot) ctx.rotate(o.rot);
  if (o.mirror) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function uiFrame(n) { return ATLAS.ui.frames[n]; }
function drawUiWorld(name, wx, wy, o = {}) {
  const fr = uiFrame(name);
  if (!fr) return;
  const s = o.scale || 1;
  ctx.save();
  ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
  ctx.translate(Math.round(wx - game.camX), Math.round(wy));
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  ctx.drawImage(IMG.ui, fr[0], fr[1], fr[2], fr[3], -fr[2] * s / 2, -fr[3] * s / 2, fr[2] * s, fr[3] * s);
  ctx.restore();
}
function drawUi(name, x, y, scale = 1, alpha = 1) {
  const fr = uiFrame(name);
  if (!fr) return { w: 0, h: 0 };
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.drawImage(IMG.ui, fr[0], fr[1], fr[2], fr[3], x, y, fr[2] * scale, fr[3] * scale);
  ctx.restore();
  return { w: fr[2] * scale, h: fr[3] * scale };
}
function drawForeground() {
  // puppet-theater stage edge: overlaps the puppets and hides stick bottoms
  const fw = 512, fh = 52;
  const off = -((game.camX * 1.12) % fw);
  for (let x = off - fw; x < CFG.W + fw; x += fw) {
    ctx.drawImage(IMG.bg_front, px(x), CFG.GROUND_Y + 12, fw, fh);
  }
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
      // first playable format wins: drop your own covers in assets/audio/
      for (const ext of ['mp3', 'ogg', 'm4a']) {
        const a = new Audio(`assets/audio/${k}.${ext}`);
        a.loop = true; a.volume = 0.5;
        a.addEventListener('canplaythrough', () => {
          if (!this.mp3ok[k]) { this.mp3ok[k] = true; this.mp3[k] = a; }
        }, { once: true });
        a.addEventListener('error', () => {}, { once: true });
      }
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
  /* Original chiptune loops (no licensed melodies) — drop your own 8-bit
     covers into assets/audio/level.mp3 and boss.mp3 to override. */
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
        if (b != null) this.osc('triangle', b, t, s.spb * 1.9, 0.30, this.musicGain);
        if (l != null) this.osc('square', l, t, s.spb * 1.6, 0.10, this.musicGain);
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
  beat: 'phase1',           // phase1|cut1|phase2|jugg|helmetwait|phase3|boss|ending
  beatT: 0, camX: 0, arenaLock: null,
  checkpoint: 'phase1', shake: 0, fade: 0, fadeDir: 0, time: 0,
  debug: false, viewer: false, viewerIdx: 0,
  pauseSel: 0, congratsT: 0, musicNow: null,
};
let player, enemies, projectiles, pickups, fxs, floaters, bubbles, actors, boss, cut, wolvSweep;
let endingVan = null;
let spawnCd = 1.0;

function resetWorld() {
  player = {
    kind: 'deadpool', x: 300, y: CFG.GROUND_Y, vx: 0, vy: 0, onGround: true,
    facing: 1, hearts: CFG.MAX_HEARTS, inv: 0, flash: 0,
    weapon: 'pistol', ammo: 0, hasHelmet: false,
    state: 'normal', stateT: 0, stateDur: 1, mgCd: 0, mgFlash: 0, kneel: false,
  };
  enemies = []; projectiles = []; pickups = []; fxs = []; floaters = [];
  bubbles = []; actors = []; boss = null; cut = null; wolvSweep = null; endingVan = null;
  game.camX = 0; game.arenaLock = null; game.shake = 0; game.fade = 0; game.fadeDir = 0;
  spawnCd = 1.0;
}
resetWorld();

/* ============================ HELPERS ============================= */
function say(who, lineKey) {
  const line = LINES[lineKey];
  bubbles.push({ who: line.who, text: line.text, t: 0 });
  return line.text.length / CFG.BUBBLE_CPS + CFG.BUBBLE_HOLD;
}
function speakerPos(b) {
  if (b.who === 'deadpool') return { x: player.x, y: player.y - dispH('deadpool') - 14 };
  const a = actors.find(a => a.kind === b.who);
  if (a) return { x: a.x, y: a.y - dispH(a.kind) - 14 };
  if (boss && boss.kind === b.who) return { x: boss.x, y: boss.y - dispH(boss.kind) - 14 };
  return { x: player.x, y: player.y - 220 };
}
function poof(x, y, scale = 1) { fxs.push({ type: 'poof', x, y, t: 0, scale }); AudioSys.sfx('poof'); }
function spark(x, y, scale = 1) { fxs.push({ type: 'spark', x, y, t: 0, scale }); }
function slashFx(x, y, flip) { fxs.push({ type: 'slash', x, y, t: 0, scale: 1.6, flip }); }
function muzzleFx(x, y, flip) { fxs.push({ type: 'muzzle', x, y, t: 0, scale: 1, flip }); }
function floatText(text, x, y, color = '#ffe066') { floaters.push({ text, x, y, t: 0, color }); }
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function playerHurtBox() {
  const h = player.kneel ? 105 : 155;
  return { x: player.x - 28, y: player.y - h, w: 56, h };
}
function enemyBox(e) {
  const h = dispH(e.kind), w = Math.min(dispW(e.kind) * 0.55, h * 0.55);
  return { x: e.x - w / 2, y: e.y - h, w, h };
}
function hurtPlayer() {
  if (player.inv > 0 || game.mode !== 'play' || cut) return;
  player.hearts--; player.inv = CFG.INVINCIBLE_T; player.flash = CFG.HIT_FLASH_T;
  player.state = 'hit'; player.stateT = 0.3; player.stateDur = 0.3;
  AudioSys.sfx('hurt');
  if (player.hearts <= 0) { game.mode = 'gameover'; AudioSys.stopMusic(); }
}

/* ============================ SPAWNER ============================= */
function phaseIndex() { return game.beat === 'phase1' ? 0 : game.beat === 'phase2' ? 1 : 2; }
function makeEnemy(kind, x) {
  return { kind, x, y: CFG.GROUND_Y, state: 'move', t: Math.random() * 9, stT: 0,
           atkCd: 0.6 + Math.random(), fired: false, ph: Math.random() * 7 };
}
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
    enemies.push(makeEnemy(kind, fromLeft ? game.camX - 80 : game.camX + CFG.W + 80));
    const [a, b] = CFG.SPAWN_CD[pi];
    spawnCd = a + Math.random() * (b - a);
  }
}

/* ============================ ENEMIES ============================= */
function updateEnemy(e, dt) {
  const c = CHARS[e.kind];
  const dx = player.x - e.x;
  e.facingRight = dx > 0;
  e.t += dt; e.stT += dt;

  if (e.state === 'move') {
    e.atkCd -= dt;
    if (c.ranged) {
      if (Math.abs(dx) > CFG.RANGED_STAND_OFF) e.x += Math.sign(dx) * (c.speed || 90) * dt;
      else if (e.atkCd <= 0) { e.state = 'attack'; e.stT = 0; e.fired = false; }
    } else {
      const reach = c.reach || 100;
      if (Math.abs(dx) > reach * 0.85) e.x += Math.sign(dx) * (c.speed || 90) * dt;
      else if (e.atkCd <= 0) { e.state = 'attack'; e.stT = 0; }
    }
  } else if (e.state === 'attack') {
    const p = e.stT / CFG.ATK_T;
    if (c.ranged) {
      if (p >= 0.5 && !e.fired) {
        e.fired = true;
        projectiles.push({
          type: e.kind === 'doctor_doom' ? 'photon' : 'sword',
          x: e.x + (e.facingRight ? 50 : -50), y: CFG.GROUND_Y - CFG.PROJ_HEIGHT,
          vx: (e.facingRight ? 1 : -1) * CFG.PROJ_SPEED, t: 0, hostile: true,
        });
        AudioSys.sfx(e.kind === 'doctor_doom' ? 'wave' : 'clang');
      }
    } else if (p > 0.35 && p < 0.78) {
      const reach = c.reach || 100;
      const box = {
        x: e.facingRight ? e.x : e.x - reach, y: CFG.GROUND_Y - dispH(e.kind) * 0.75,
        w: reach, h: dispH(e.kind) * 0.75,
      };
      e.atkBox = box;
      if (rectsOverlap(box, playerHurtBox())) hurtPlayer();
    }
    if (p >= 1) { e.state = 'move'; e.stT = 0; e.atkCd = 0.7 + Math.random() * 0.5; e.atkBox = null; }
  }
  if (e.state !== 'attack') e.atkBox = null;
}
function killEnemy(e, allowDrop = true) {
  poof(e.x, e.y - dispH(e.kind) / 2, CHARS[e.kind].big ? 2.4 : 1.7);
  enemies.splice(enemies.indexOf(e), 1);
  if (allowDrop && ['phase1', 'phase2', 'phase3'].includes(game.beat) && Math.random() < CFG.DROP_CHANCE) {
    const r = Math.random();
    const type = r < CFG.DROP_HEART ? 'heart' : r < CFG.DROP_HEART + CFG.DROP_AMMO ? 'ammo' : 'wbox';
    pickups.push({ type, x: e.x, y: e.y, t: 0 });
  }
}

/* ============================ PLAYER ============================== */
function meleeBox() {
  return {
    x: player.facing > 0 ? player.x + 10 : player.x - 10 - CFG.MELEE_REACH,
    y: player.y - 195, w: CFG.MELEE_REACH, h: 205,
  };
}
function tryMelee() {
  const box = meleeBox();
  for (const e of enemies) if (rectsOverlap(box, enemyBox(e))) return true;
  if (boss && !boss.dead && rectsOverlap(box, enemyBox(boss))) return true;
  for (const p of projectiles) {
    if (p.hostile && (p.type === 'photon' || p.type === 'sword') &&
        rectsOverlap(box, { x: p.x - 22, y: p.y - 18, w: 44, h: 36 })) return true;
  }
  return false;
}
function doSlashDamage() {
  const box = meleeBox();
  for (const e of [...enemies]) if (rectsOverlap(box, enemyBox(e))) killEnemy(e);
  for (const p of [...projectiles]) {
    if (p.hostile && (p.type === 'photon' || p.type === 'sword') &&
        rectsOverlap(box, { x: p.x - 22, y: p.y - 18, w: 44, h: 36 })) {
      spark(p.x, p.y, 1);
      projectiles.splice(projectiles.indexOf(p), 1);
    }
  }
  if (boss) bossHit('slash', box);
}
function fireGun() {
  const muzzY = player.y - (player.kneel ? 82 : 122);
  const mx = player.x + player.facing * 60;
  projectiles.push({
    type: player.weapon === 'mg' ? 'mgtracer' : 'tracer',
    x: mx, y: muzzY, vx: player.facing * CFG.TRACER_SPEED, t: 0, hostile: false,
  });
  muzzleFx(mx + player.facing * 14, muzzY, player.facing < 0);
  AudioSys.sfx(player.weapon === 'mg' ? 'mg' : 'pistol');
}
function updatePlayer(dt) {
  const p = player;
  p.inv = Math.max(0, p.inv - dt); p.flash = Math.max(0, p.flash - dt);
  p.mgFlash = Math.max(0, p.mgFlash - dt);
  const inputLocked = !!cut || (boss && boss.autoScene > 0);

  let dir = 0;
  if (!inputLocked) {
    if (keys.ArrowLeft) dir -= 1;
    if (keys.ArrowRight) dir += 1;
  }
  if (dir !== 0) p.facing = dir;
  p.kneel = !inputLocked && p.onGround && !!keys.ArrowDown && p.state !== 'place';

  if (!inputLocked && (tap('ShiftLeft') || tap('ShiftRight'))) {
    if (p.weapon === 'pistol') {
      if (p.ammo > 0) p.weapon = 'mg';
      else p.mgFlash = 0.8;
    } else p.weapon = 'pistol';
  }

  if (!inputLocked && tap('KeyX') && p.onGround) {
    p.vy = CFG.JUMP_VY; p.onGround = false; AudioSys.sfx('jump');
    fxs.push({ type: 'dust', x: p.x, y: p.y - 4, t: 0, scale: 1.2 });
  }
  if (!p.onGround) {
    p.vy += (keys.KeyX && p.vy < 0 ? CFG.HOLD_GRAVITY : CFG.GRAVITY) * dt;
    p.y += p.vy * dt;
    if (p.y >= CFG.GROUND_Y) {
      p.y = CFG.GROUND_Y; p.vy = 0; p.onGround = true;
      fxs.push({ type: 'dust', x: p.x, y: p.y - 4, t: 0, scale: 1.2 });
    }
  }

  const spd = p.kneel ? CFG.KNEEL_SPEED : CFG.RUN_SPEED;
  if (!inputLocked) p.x += dir * spd * dt;
  const lockL = game.arenaLock ? game.arenaLock.x0 + 40 : game.camX + 30;
  const lockR = game.arenaLock ? game.arenaLock.x0 + CFG.W - 40 : Infinity;
  p.x = Math.max(lockL, Math.min(lockR, p.x));

  if (!game.arenaLock) game.camX = Math.max(game.camX, p.x - 380);
  else game.camX = game.arenaLock.x0;

  if (p.state !== 'normal') {
    p.stateT -= dt;
    if (p.state === 'slash' && !p.slashDone && p.stateT < CFG.SLASH_T * 0.62) {
      p.slashDone = true; doSlashDamage();
    }
    if (p.stateT <= 0) p.state = 'normal';
  }

  if (!inputLocked && p.state !== 'place') {
    if (tap('KeyZ')) {
      if (tryMelee()) {
        p.state = 'slash'; p.stateT = CFG.SLASH_T; p.stateDur = CFG.SLASH_T; p.slashDone = false;
        slashFx(p.x + p.facing * 78, p.y - 110, p.facing < 0);
        AudioSys.sfx('slash');
      } else if (p.weapon === 'pistol') {
        p.state = 'shoot'; p.stateT = CFG.PISTOL_T; p.stateDur = CFG.PISTOL_T; fireGun();
      } else if (p.ammo > 0) {
        p.state = 'mg'; p.stateT = 0.15; p.stateDur = 0.15; p.mgCd = 0; p.ammo--; fireGun();
      }
    }
    if (keys.KeyZ && p.weapon === 'mg' && p.state !== 'slash') {
      p.mgCd -= dt;
      if (p.mgCd <= 0 && p.ammo > 0 && !tryMelee()) {
        p.mgCd = CFG.MG_RATE; p.ammo--; fireGun();
        p.state = 'mg'; p.stateT = 0.15; p.stateDur = 0.15;
      }
    }
    if (p.ammo <= 0 && p.weapon === 'mg') p.weapon = 'pistol';
  }
}
function playerPose() {
  const p = player;
  if (p.state === 'hit') return 'hit';
  if (p.state === 'place') return 'place';
  if (p.state === 'slash') return 'slash';
  if (p.state === 'shoot') return 'shoot';
  if (p.state === 'mg') return 'mg';
  if (!p.onGround) return 'jump';
  if (p.kneel) return (keys.ArrowLeft || keys.ArrowRight) ? 'kneelmove' : 'kneel';
  if (cut) return 'idle';
  return 'run';
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
        ? { x: pr.x - 62, y: pr.y - 48, w: 124, h: 52 }
        : { x: pr.x - 24, y: pr.y - 16, w: 48, h: 32 };
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
          if (hp.hostile && (hp.type === 'photon' || hp.type === 'sword') &&
              rectsOverlap(box, { x: hp.x - 22, y: hp.y - 18, w: 44, h: 36 })) {
            spark(hp.x, hp.y, 1);
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
    const box = { x: pk.x - 28, y: pk.y - 56, w: 56, h: 56 };
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
  wolvSweep = { x: game.camX - 100, t: 0, lastArc: 0 };
  AudioSys.sfx('roar');
}
function updateWolvSweep(dt) {
  if (!wolvSweep) return;
  wolvSweep.t += dt;
  wolvSweep.x += CFG.WOLV_SWEEP_V * dt;
  if (wolvSweep.t - wolvSweep.lastArc > 0.09) {
    wolvSweep.lastArc = wolvSweep.t;
    const high = Math.floor(wolvSweep.t * 11) % 2 === 0;
    slashFx(wolvSweep.x + 85, CFG.GROUND_Y - (high ? 150 : 85), false);
  }
  if (!wolvSweep.midRoar && wolvSweep.x > game.camX + CFG.W * 0.45) {
    wolvSweep.midRoar = true;
    AudioSys.sfx('roar');
  }
  for (const e of [...enemies]) {
    if (Math.abs(e.x - wolvSweep.x) < 110) killEnemy(e, false);
  }
  if (wolvSweep.x > game.camX + CFG.W + 130) wolvSweep = null;
}

/* ============================ BOSSES ============================== */
function startJuggernaut() {
  game.arenaLock = { x0: game.camX };
  enemies = []; projectiles = projectiles.filter(p => !p.hostile);
  boss = {
    kind: 'juggernaut', x: game.camX + 790, y: CFG.GROUND_Y, hp: CFG.JUGG_HP,
    state: 'intro', t: 0, stT: 0, facingRight: false, dead: false,
    dashDir: -1, hitT: 0, sink: 0, autoScene: 0, ph: 1.3,
  };
  AudioSys.sfx('roar');
  say('deadpool', 'L3');
}
function startFinalBoss() {
  game.arenaLock = { x0: game.camX };
  enemies = []; projectiles = projectiles.filter(p => !p.hostile);
  boss = {
    kind: 'cassandra', x: game.camX + CFG.W + 130, y: CFG.GROUND_Y, hp: CFG.BOSS_HP,
    state: 'enter', t: 0, stT: 0, facingRight: false, dead: false,
    helmetOn: false, waveCd: 2.2, hitT: 0, driftDir: -1, autoScene: 0, sink: 0, ph: 2.6,
  };
  game.musicNow = 'boss';
  AudioSys.playMusic('boss');
}
function bossHit(kind, box) {
  if (!boss || boss.dead) return false;
  if (!rectsOverlap(box, enemyBox(boss))) return false;
  if (boss.kind === 'juggernaut') {
    if (boss.state === 'dazed') {
      boss.hp--; boss.hitT = 0.25; spark(boss.x, boss.y - 150, 1.6); AudioSys.sfx('clang');
      if (boss.hp <= 0) juggDefeated();
    } else {
      spark(boss.x + (player.facing * 60), boss.y - 130, 1);
      AudioSys.sfx('clang');
    }
    return true;
  }
  // final boss (Cassandra)
  if (boss.state === 'enter' || boss.autoScene > 0) return true;
  if (!boss.helmetOn) {
    spark(boss.x, boss.y - 160, 1.3);
    floatText('NO EFFECT', boss.x, boss.y - dispH(boss.kind) - 20, '#9ad1ff');
    AudioSys.sfx('noeffect');
  } else {
    boss.hp--; boss.hitT = 0.3; spark(boss.x, boss.y - 160, 1.7); AudioSys.sfx('hurt');
    if (boss.hp <= 0) bossDefeated();
  }
  return true;
}
function juggDefeated() {
  boss.dead = true; boss.state = 'defeat'; boss.hitT = 0;
  poof(boss.x, boss.y - 130, 2.8);
  say('deadpool', 'L4');
  pickups.push({ type: 'helmet', x: boss.x, y: CFG.GROUND_Y, t: 0 });
  game.beat = 'helmetwait';   // arena stays locked until the helmet is collected
}
function bossDefeated() {
  boss.dead = true; boss.state = 'defeat'; boss.hitT = 0;
  projectiles = projectiles.filter(p => !p.hostile);
  AudioSys.stopMusic();
  AudioSys.sfx('jingle');
  nextBeat('ending');
}
function updateBoss(dt) {
  if (!boss) return;
  const b = boss;
  b.t += dt; b.stT += dt; b.hitT = Math.max(0, b.hitT - dt);
  if (b.dead) { b.sink = Math.min(1, b.sink + dt * 0.5); return; }
  if (b.kind === 'juggernaut') updateJugg(b, dt);
  else updateFinalBoss(b, dt);
}
function updateJugg(b, dt) {
  switch (b.state) {
    case 'intro':
      b.facingRight = player.x > b.x;
      if (b.t > 1.6) { b.state = 'taunt'; b.stT = 0; }
      break;
    case 'taunt':
      b.facingRight = player.x > b.x;
      if (b.stT > 1.1) { b.state = 'tele'; b.stT = 0; AudioSys.sfx('roar'); }
      break;
    case 'tele':
      game.shake = 3;
      if (b.stT > CFG.JUGG_TELE_T) {
        b.state = 'dash'; b.stT = 0;
        b.dashDir = player.x > b.x ? 1 : -1;
        b.facingRight = b.dashDir > 0;
      }
      break;
    case 'dash': {
      b.x += b.dashDir * CFG.JUGG_DASH_V * dt;
      const dashBox = { x: b.x - 75, y: b.y - 200, w: 150, h: 200 };
      if (rectsOverlap(dashBox, playerHurtBox())) hurtPlayer();
      const wallL = game.arenaLock.x0 + 80, wallR = game.arenaLock.x0 + CFG.W - 80;
      if (b.x <= wallL || b.x >= wallR) {
        b.x = Math.max(wallL, Math.min(wallR, b.x));
        b.state = 'crash'; b.stT = 0;
        game.shake = 10; AudioSys.sfx('crash');
      }
      break;
    }
    case 'crash':
      if (b.stT > 0.5) { b.state = 'dazed'; b.stT = 0; }
      break;
    case 'dazed':
      if (b.stT > CFG.JUGG_DAZED_T) { b.state = 'getup'; b.stT = 0; }
      break;
    case 'getup':
      if (b.stT > 0.6) { b.state = 'taunt'; b.stT = 0; }
      break;
  }
}
function updateFinalBoss(b, dt) {
  if (b.autoScene > 0) {
    b.autoScene -= dt;
    if (b.autoScene <= 0) {
      b.autoScene = 0;
      b.helmetOn = true; player.hasHelmet = false;
      player.state = 'normal';
      floatText('NOW HIT HER!', b.x, b.y - dispH(b.kind) - 30, '#ffe066');
      AudioSys.sfx('helmet');
    }
    return;
  }
  const touchPlace = () => {
    if (player.hasHelmet && !b.helmetOn && rectsOverlap(playerHurtBox(), enemyBox(b))) {
      b.autoScene = 1.5; b.state = 'fight'; b.stT = 0;
      player.state = 'place'; player.stateT = 1.5; player.stateDur = 1.5;
      player.facing = b.x > player.x ? 1 : -1;
      return true;
    }
    return false;
  };
  switch (b.state) {
    case 'enter':
      b.x -= 160 * dt;
      if (b.x <= game.arenaLock.x0 + 770) {
        b.x = game.arenaLock.x0 + 770;
        b.state = 'fight'; b.stT = 0;
        say('deadpool', 'L5');
      }
      break;
    case 'fight': {
      b.facingRight = player.x > b.x;
      const x0 = game.arenaLock.x0;
      b.x += b.driftDir * 40 * dt;
      if (b.x < x0 + 630) b.driftDir = 1;
      if (b.x > x0 + 850) b.driftDir = -1;
      b.waveCd -= dt;
      if (b.waveCd <= 0) {
        b.state = 'cast'; b.stT = 0; b.castFired = false;
        b.waveCd = b.helmetOn ? CFG.WAVE_CD_FAST : CFG.WAVE_CD;
      }
      touchPlace();
      break;
    }
    case 'cast': {
      const p = b.stT / 0.7;
      if (p >= 0.5 && !b.castFired) {
        b.castFired = true;
        projectiles.push({
          type: 'wave', x: b.x - 80, y: CFG.GROUND_Y,
          vx: -CFG.WAVE_SPEED, t: 0, hostile: true,
        });
        AudioSys.sfx('wave');
      }
      if (p >= 1) { b.state = 'fight'; b.stT = 0; }
      touchPlace();
      break;
    }
  }
}
function bossPose(b) {
  if (b.dead) return 'ko';
  if (b.hitT > 0 && b.state === 'dazed') return 'hit';
  if (b.kind === 'juggernaut') {
    return { intro: 'idle', taunt: 'idle', tele: 'idle', dash: 'charge', crash: 'crash',
             dazed: 'dazed', getup: 'getup' }[b.state] || 'idle';
  }
  if (b.hitT > 0) return 'hit';
  if (b.state === 'enter') return 'move';
  if (b.state === 'cast') return 'cast';
  return 'idle';
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
  if (cut.i >= cut.steps.length) cut = null;
}
function actor(kind) { return actors.find(a => a.kind === kind); }
function startCutscene1() {
  game.beat = 'cut1';
  enemies = []; projectiles = [];
  actors.push({ kind: 'sabretooth', x: game.camX + CFG.W + 90, y: CFG.GROUND_Y,
                pose: 'stalk', t: 0, facingRight: false, vx: 0, ph: 0.7 });
  runCut([
    { d: 2.0 },                                                  // Sabretooth stalks in
    { d: 1.3, on: () => { const s = actor('sabretooth'); s.pose = 'snarl'; AudioSys.sfx('roar'); } },
    { d: 0.9, on: () => {                                        // Wolverine dashes in
        actors.push({ kind: 'wolverine', x: game.camX - 100, y: CFG.GROUND_Y,
                      pose: 'run', t: 0, facingRight: true, vx: 620, stopAt: game.camX + 470, ph: 1.9 });
      } },
    { d: 1.4, on: () => { const w = actor('wolverine'); w.pose = 'idle'; w.vx = 0; say('wolverine', 'L1'); } },
    { d: 0.65, on: () => {                                       // first swipe
        const w = actor('wolverine');
        w.pose = 'slash'; w.poseT = 0; w.poseDur = 0.65;
        slashFx(w.x + 95, CFG.GROUND_Y - 140, false);
        AudioSys.sfx('slash');
      } },
    { d: 0.65, on: () => {                                       // second swipe
        const w = actor('wolverine');
        w.pose = 'slash'; w.poseT = 0; w.poseDur = 0.65;
        slashFx(w.x + 100, CFG.GROUND_Y - 90, false);
        spark(w.x + 120, CFG.GROUND_Y - 120, 1.2);
        AudioSys.sfx('slash');
      } },
    { d: 1.6, on: () => {                                        // comedic head pop
        const st = actor('sabretooth');
        st.kind = 'sab_ko'; st.pose = 'ko'; st.sink = 0;
        st.headPop = { x: st.x - 6, y: st.y - 185, vy: -560, vx: 85, t: 0 };
        poof(st.x, st.y - 165, 1.8);
      } },
    { d: 2.2, on: () => { say('deadpool', 'L2'); } },
    { d: 1.2, on: () => {                                        // Wolverine runs off right
        const w = actor('wolverine');
        w.pose = 'run'; w.vx = 700; w.facingRight = true; w.stopAt = null;
      } },
    { d: 0.2, on: () => { actors = []; nextBeat('phase2'); } },
  ]);
}
function updateActors(dt) {
  for (const a of [...actors]) {
    a.t += dt;
    if (a.poseT != null) a.poseT += dt;
    if (a.vx) {
      a.x += a.vx * dt;
      if (a.stopAt != null && a.vx > 0 && a.x >= a.stopAt) { a.x = a.stopAt; a.vx = 0; }
    }
    if (a.kind === 'sabretooth' && a.pose === 'stalk') {
      const target = game.camX + 660;
      if (a.x > target) a.x -= 240 * dt;
    }
    if (a.pose === 'ko') a.sink = Math.min(1, (a.sink || 0) + dt * 0.35);
    if (a.headPop) {
      const h = a.headPop;
      h.t += dt; h.vy += 1150 * dt; h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.y > CFG.GROUND_Y - 16) { h.y = CFG.GROUND_Y - 16; h.vy = -h.vy * 0.45; h.vx *= 0.7; }
    }
    if (a.x > game.camX + CFG.W + 150 && a.vx > 0) actors.splice(actors.indexOf(a), 1);
  }
}
function startEnding() {
  projectiles = []; enemies = [];
  actors.push({ kind: 'wolverine', x: game.camX - 100, y: CFG.GROUND_Y,
                pose: 'run', t: 0, facingRight: true, vx: 420, stopAt: player.x - 140, ph: 0.4 });
  runCut([
    { d: 1.6 },
    { d: 0.4, on: () => { const w = actor('wolverine'); if (w) { w.vx = 0; w.pose = 'idle'; } } },
    { d: 3.2, on: () => { say('deadpool', 'L6'); } },
    { d: 2.2, on: () => {                                        // the family wagon arrives
        endingVan = { x: game.camX - 340, vx: 300, stopX: Math.min(player.x, game.camX + 420) - 250 };
      } },
    { d: 0.6, on: () => {                                        // photo Deadpool pops up by the van
        actors.push({ kind: 'dp_photo', x: (endingVan ? endingVan.stopX + 105 : player.x - 160),
                      y: CFG.GROUND_Y, pose: 'victory', t: 0, facingRight: true, ph: 2.2 });
      } },
    { d: 3.2, on: () => { say('dp_photo', 'L8'); } },
    { d: 2.0, on: () => { game.fadeDir = 1; } },
    { d: 0.4, on: () => {
        game.mode = 'congrats'; game.congratsT = 0; game.fade = 0; game.fadeDir = 0;
        bubbles = [];
      } },
  ]);
}
function updateEndingVan(dt) {
  if (!endingVan || !endingVan.vx) return;
  endingVan.x += endingVan.vx * dt;
  if (endingVan.x >= endingVan.stopX) {
    endingVan.x = endingVan.stopX; endingVan.vx = 0;
    fxs.push({ type: 'dust', x: endingVan.x + 90, y: CFG.GROUND_Y - 6, t: 0, scale: 1.6 });
    fxs.push({ type: 'dust', x: endingVan.x - 90, y: CFG.GROUND_Y - 6, t: 0, scale: 1.4 });
    AudioSys.sfx('crash');
  }
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
  if (b === 'boss') { game.checkpoint = 'boss'; startFinalBoss(); }
  if (b === 'ending') startEnding();
}
function restartCheckpoint() {
  const cp = game.checkpoint;
  const keep = { ammo: player.ammo, weapon: player.weapon, hasHelmet: player.hasHelmet };
  resetWorld();
  Object.assign(player, keep);
  if (cp === 'jugg' || cp === 'boss') {
    if (cp === 'boss' && !player.hasHelmet) player.hasHelmet = true;  // the helmet is required
    game.beat = cp; game.beatT = 0;
    game.camX = 0; player.x = 300;
    if (cp === 'jugg') startJuggernaut(); else startFinalBoss();
    game.checkpoint = cp;
  } else {
    nextBeat(cp);
  }
  game.mode = 'play';
  if (cp !== 'boss' && game.musicNow !== 'level') { game.musicNow = 'level'; AudioSys.playMusic('level'); }
}
function updateBeat(dt) {
  const inCombat = ['phase1', 'phase2', 'phase3'].includes(game.beat);
  if (inCombat && !cut) game.beatT += dt;
  if (game.beat === 'phase1' && game.beatT >= CFG.PHASE1_T) startCutscene1();
  else if (game.beat === 'phase2' && game.beatT >= CFG.PHASE2_T) nextBeat('jugg');
  else if (game.beat === 'phase3' && game.beatT >= CFG.PHASE3_T) nextBeat('boss');
}

/* ============================ UPDATE ============================== */
function update(dt) {
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt * 30);
  if (game.fadeDir) game.fade = Math.min(1, game.fade + dt / 2);

  updateCut(dt);
  updatePlayer(dt);
  updateActors(dt);
  updateEndingVan(dt);
  if (!cut) {
    updateSpawner(dt);
    for (const e of [...enemies]) updateEnemy(e, dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateWolvSweep(dt);
    updateBeat(dt);
  } else if (boss && boss.dead) {
    boss.sink = Math.min(1, boss.sink + dt * 0.4);
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
  const fw = 1024, fh = 160;
  const fx0 = -((game.camX * 0.3) % fw);
  for (let x = fx0 - fw; x < CFG.W + fw; x += fw) {
    ctx.drawImage(IMG.bg_far, px(x), CFG.GROUND_Y - fh + 24, fw, fh);
  }
  const gw = 512, gh = 96;
  const gx0 = -(game.camX % gw);
  for (let x = gx0 - gw; x < CFG.W + gw; x += gw) {
    ctx.drawImage(IMG.bg_ground, px(x), CFG.GROUND_Y - 10, gw, gh);
  }
}
function drawEnemies() {
  for (const e of enemies) {
    const c = CHARS[e.kind];
    const pose = e.state === 'attack' ? 'attack'
      : c.hover ? 'hover' : 'move';
    drawPuppet(e.kind, pose, e.x, e.y, e.facingRight,
               { t: e.t, ph: e.ph, p: e.state === 'attack' ? e.stT / CFG.ATK_T : 0 });
  }
}
function drawBoss() {
  if (!boss) return;
  const b = boss;
  drawPuppet(b.kind, bossPose(b), b.x, b.y, b.facingRight,
             { t: b.t, ph: b.ph, flash: !b.dead && b.hitT > 0, sink: b.sink,
               p: b.state === 'cast' ? b.stT / 0.7 : b.state === 'getup' ? b.stT / 0.6 : 0 });
  if (b.kind === 'cassandra' && b.helmetOn && !b.dead) {
    const hh = dispH('cassandra');
    drawPiece('helmet', b.x + (b.facingRight ? 4 : -4), b.y - hh * 0.90, 62,
              { rot: b.facingRight ? 0.06 : -0.06 });
  }
  if (b.kind === 'juggernaut' && b.state === 'dazed') {
    for (let i = 0; i < 3; i++) {
      const a = game.time * 5 + i * 2.1;
      text('*', b.x + Math.cos(a) * 62 - game.camX, b.y - 225 + Math.sin(a) * 15, 22, '#ffe066', 'center');
    }
  }
  if (!b.dead) {
    const label = b.kind === 'juggernaut'
      ? 'JUGGERNAUT — HIT HIM WHILE HE IS DOWN'
      : b.helmetOn ? 'CASSANDRA (VULNERABLE!)' : 'CASSANDRA — NO EFFECT WITHOUT THE HELMET';
    const hpMax = b.kind === 'juggernaut' ? CFG.JUGG_HP : CFG.BOSS_HP;
    if (b.kind !== 'cassandra' || b.state !== 'enter') {
      text(label, CFG.W / 2, 34, 14, b.kind === 'juggernaut' ? '#fbb' : '#c9f', 'center');
      for (let i = 0; i < hpMax; i++) {
        ctx.fillStyle = i < b.hp ? (b.kind === 'juggernaut' ? '#d65959' : '#59d659') : '#333';
        ctx.fillRect(CFG.W / 2 - 40 + i * 30, 54, 22, 10);
        ctx.strokeStyle = '#000'; ctx.strokeRect(CFG.W / 2 - 40 + i * 30, 54, 22, 10);
      }
    }
  }
}
function drawActors() {
  for (const a of actors) {
    const dur = a.poseDur || 0.7;
    drawPuppet(a.kind, a.pose, a.x, a.y, a.facingRight,
               { t: a.t, ph: a.ph, sink: a.sink, alpha: a.alpha,
                 p: a.poseT != null ? a.poseT / dur : 0 });
    if (a.headPop) drawPiece('sab_head', a.headPop.x, a.headPop.y, 62, { rot: a.headPop.t * 9 });
  }
}
function drawPlayer() {
  const p = player;
  if (p.inv > 0 && Math.floor(p.inv * 18) % 2 === 0 && p.flash <= 0) return;
  const pose = playerPose();
  drawPuppet('deadpool', pose, p.x, p.y, p.facing > 0,
             { flash: p.flash > 0, vy: p.vy,
               p: p.stateDur ? 1 - p.stateT / p.stateDur : 0 });
  if (p.state === 'place') drawPiece('helmet', p.x + p.facing * 62, p.y - 120, 64, { mirror: p.facing < 0 });
  
}
function drawProjectiles() {
  for (const pr of projectiles) {
    if (pr.type === 'tracer') drawUiWorld('tracer', pr.x, pr.y, { flip: pr.vx < 0 });
    else if (pr.type === 'mgtracer') drawUiWorld('mgtracer', pr.x, pr.y, { flip: pr.vx < 0 });
    else if (pr.type === 'photon') drawUiWorld(Math.floor(pr.t * 12) % 2 ? 'photon1' : 'photon0', pr.x, pr.y);
    else if (pr.type === 'sword') drawUiWorld('sword', pr.x, pr.y, { rot: pr.t * 12 * (pr.vx > 0 ? 1 : -1) });
    else if (pr.type === 'wave') {
      const pulse = 1 + Math.sin(pr.t * 14) * 0.1;
      drawUiWorld(Math.floor(pr.t * 10) % 2 ? 'wave1' : 'wave0', pr.x, pr.y - 30,
                  { scale: 1.35 * pulse, flip: pr.vx > 0 });
    }
  }
}
function drawPickups() {
  for (const pk of pickups) {
    const bobY = pk.y - 28 + Math.sin(pk.t * 5 + pk.x) * 5;
    if (pk.type === 'heart') drawUiWorld('heart', pk.x, bobY);
    else if (pk.type === 'ammo') drawUiWorld('bulletbox', pk.x, bobY);
    else if (pk.type === 'wbox') drawUiWorld('wbox', pk.x, bobY);
    else if (pk.type === 'helmet') {
      drawPiece('helmet', pk.x, bobY - 10, 58);
      text('PICK UP THE HELMET!', pk.x - game.camX, bobY - 100, 13, '#ffe066', 'center');
    }
  }
}
function drawWolvSweep() {
  if (!wolvSweep) return;
  drawPuppet('wolverine_bone', 'slash', wolvSweep.x, CFG.GROUND_Y, true,
             { t: wolvSweep.t, p: (wolvSweep.t * 4) % 1, scale: 1.15 });
}
function drawFxs() {
  for (const f of fxs) {
    if (f.type === 'poof') {
      const fi = Math.min(2, Math.floor(f.t / 0.15));
      drawUiWorld('poof' + fi, f.x, f.y, { scale: f.scale * (1 + f.t), alpha: 1 - f.t * 1.6 });
    } else if (f.type === 'slash') {
      const fi = f.t < 0.14 ? 0 : 1;
      drawUiWorld('slash' + fi, f.x, f.y, { scale: f.scale, alpha: 1 - f.t * 2, flip: f.flip });
    } else if (f.type === 'muzzle') {
      drawUiWorld('muzzle', f.x, f.y, { scale: f.scale, alpha: 1 - f.t * 4, flip: f.flip });
    } else if (f.type === 'dust') {
      drawUiWorld('dust', f.x, f.y, { scale: f.scale * (1 + f.t * 2), alpha: 1 - f.t * 2.4 });
    } else {
      drawUiWorld('spark', f.x, f.y, { scale: f.scale, alpha: 1 - f.t * 2 });
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
function drawBubbleAt(sx, sy, shown) {
  const lines = wrapText(shown, 26);
  const lineW = Math.max(...lines.map(l => l.length), 4) * 9.7;
  const w = Math.max(90, lineW + 26), h = lines.length * 18 + 20, tail = 16;
  let bx = sx - w * 0.35, by = sy - h - tail;
  bx = Math.max(6, Math.min(CFG.W - w - 6, bx));
  by = Math.max(6, by);
  const fr = uiFrame('bubble');
  const C = 15;
  const bw = fr[2], bh = fr[3] - 18;
  const dxs = [bx, bx + C, bx + w - C], dws = [C, w - 2 * C, C];
  const sxs = [fr[0], fr[0] + C, fr[0] + bw - C], sws = [C, bw - 2 * C, C];
  const dys = [by, by + C, by + h - C], dhs = [C, h - 2 * C, C];
  const sys_ = [fr[1], fr[1] + C, fr[1] + bh - C], shs = [C, bh - 2 * C, C];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    ctx.drawImage(IMG.ui, sxs[i], sys_[j], sws[i], shs[j], px(dxs[i]), px(dys[j]), px(dws[i]) + 1, px(dhs[j]) + 1);
  }
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
  const wx = CFG.W - 168, wy = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(wx - 8, wy - 2, 168, 46);
  ctx.strokeStyle = '#fff'; ctx.strokeRect(wx - 8, wy - 2, 168, 46);
  if (player.weapon === 'pistol') {
    drawUi('pistol_icon', wx, wy + 4, 0.55);
    text('∞', wx + 52, wy + 8, 22, '#ffe066');
  } else {
    drawUi('mg_icon', wx, wy + 6, 0.45);
    text(String(player.ammo), wx + 52, wy + 10, 20, '#ffe066');
  }
  if (player.mgFlash > 0 && Math.floor(player.mgFlash * 10) % 2 === 0) {
    drawUi('mg_icon', wx + 86, wy + 6, 0.45);
    text('0', wx + 134, wy + 10, 16, '#f66');
  }
  if (player.hasHelmet) drawPiece('helmet', game.camX + wx + 118, wy + 40, 34);
  const label = { phase1: 'PHASE 1', cut1: '', phase2: 'PHASE 2', jugg: 'MID-BOSS',
                  helmetwait: 'MID-BOSS', phase3: 'PHASE 3', boss: 'FINAL BOSS', ending: '' }[game.beat] || '';
  if (label) text(label, CFG.W / 2, 12, 16, '#fff', 'center');
  if (['phase1', 'phase2', 'phase3'].includes(game.beat)) {
    const total = game.beat === 'phase1' ? CFG.PHASE1_T : game.beat === 'phase2' ? CFG.PHASE2_T : CFG.PHASE3_T;
    const remain = Math.max(0, total - game.beatT);
    text(`${Math.floor(remain / 60)}:${String(Math.floor(remain % 60)).padStart(2, '0')}`, CFG.W / 2, 32, 14, '#ffd', 'center');
  }
}
function drawTitle() {
  ctx.fillStyle = '#0b0710'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.drawImage(IMG.bg_sky, 0, 0, CFG.W, CFG.H);
  ctx.fillStyle = 'rgba(10,6,14,0.55)'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  text('DEADPOOL', CFG.W / 2, 58, 64, '#e02439', 'center');
  text('vs. THE VOID', CFG.W / 2, 132, 40, '#ffe066', 'center');
  text('— paper puppet edition —', CFG.W / 2, 184, 18, '#9df', 'center');
  text('every hero glued to cardboard and a popsicle stick, as intended', CFG.W / 2, 208, 13, '#caa', 'center');
  const rows = [
    ['ARROWS', 'steer (the merc always runs) / DOWN = take a knee'],
    ['X  (A)', 'jump — straight up or diagonal, hold for height'],
    ['Z  (B)', 'smart attack: gun at range, blade up close'],
    ['SHIFT', 'toggle pistol / machine gun'],
    ['ENTER', 'start & pause'],
    ['D', 'debug (hitboxes + artwork viewer)'],
  ];
  rows.forEach((r, i) => {
    text(r[0], CFG.W / 2 - 300, 254 + i * 26, 16, '#ffe066');
    text(r[1], CFG.W / 2 - 160, 254 + i * 26, 16, '#fff');
  });
  if (Math.floor(game.time * 2) % 2 === 0) text('PRESS ENTER', CFG.W / 2, 442, 26, '#fff', 'center');
  if (MISSING.length) {
    text('MISSING ASSETS:', 12, 414, 13, '#f66');
    MISSING.slice(0, 6).forEach((m, i) => text(m, 12, 432 + i * 15, 12, '#f88'));
  }
  text('Personal non-commercial fan homebrew. Villains: MvC2 official artwork (archive.org).', CFG.W / 2, 498, 11, '#977', 'center');
  text('Deadpool: Marvel Avengers Alliance art. Cassandra & photo Deadpool: movie renders.', CFG.W / 2, 512, 11, '#977', 'center');
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
  for (let i = 0; i < 40; i++) {
    const x = (i * 193) % CFG.W, y = (i * 89) % 200;
    ctx.fillStyle = (Math.floor(game.time * 2 + i) % 3 === 0) ? '#ffe066' : '#443';
    ctx.fillRect(x, y, 3, 3);
  }
  text('CONGRATS!', CFG.W / 2, 26, 52, '#ffe066', 'center');
  const mm = IMG.mm_big;
  if (mm && mm.width) ctx.drawImage(mm, CFG.W / 2 - 110, 100, 220, 275);
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
  const mb = meleeBox();
  ctx.strokeRect(mb.x - game.camX, mb.y, mb.w, mb.h);
  for (const e of enemies) {
    ctx.strokeStyle = '#f00';
    const b = enemyBox(e);
    ctx.strokeRect(b.x - game.camX, b.y, b.w, b.h);
    if (e.atkBox) { ctx.strokeStyle = '#f0f'; ctx.strokeRect(e.atkBox.x - game.camX, e.atkBox.y, e.atkBox.w, e.atkBox.h); }
  }
  if (boss) { const b = enemyBox(boss); ctx.strokeStyle = '#f80'; ctx.strokeRect(b.x - game.camX, b.y, b.w, b.h); }
  ctx.strokeStyle = '#0ff';
  for (const pr of projectiles) ctx.strokeRect(pr.x - 22 - game.camX, pr.y - 16, 44, 32);
  text(`beat:${game.beat} t:${game.beatT.toFixed(1)} enemies:${enemies.length} cam:${Math.round(game.camX)} V=art viewer`, 10, CFG.H - 24, 13, '#0f0');
}
function drawViewer() {
  ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, CFG.W, CFG.H);
  const names = [...Object.keys(ATLAS.chars), ...Object.keys(ATLAS.pieces).map(p => 'piece:' + p)];
  game.viewerIdx = ((game.viewerIdx % names.length) + names.length) % names.length;
  const sel = names[game.viewerIdx];
  const isPiece = sel.startsWith('piece:');
  const name = isPiece ? sel.slice(6) : sel;
  const meta = isPiece ? ATLAS.pieces[name] : ATLAS.chars[name];
  const img = IMG[isPiece ? 'piece_' + name : name];
  if (img && img.width) {
    const s = Math.min(380 / meta.h, 500 / meta.w);
    ctx.save();
    ctx.translate(CFG.W / 2, CFG.H / 2 + 170);
    ctx.strokeStyle = '#444'; ctx.strokeRect(-meta.w * s / 2, -meta.h * s, meta.w * s, meta.h * s);
    ctx.drawImage(img, -meta.w * s / 2, -meta.h * s, meta.w * s, meta.h * s);
    ctx.restore();
  }
  text('ARTWORK VIEWER  (LEFT/RIGHT cycle, V/ESC exit)', CFG.W / 2, 20, 16, '#ffe066', 'center');
  text(`${sel}  ${meta.w}x${meta.h}px  ${isPiece ? '' : 'native facing: ' + (meta.right ? 'RIGHT' : 'LEFT/frontal')}`,
       CFG.W / 2, 48, 15, '#fff', 'center');
  text(`game height: ${CHARS[name] ? CHARS[name].h + 'px' : '(piece)'}`, CFG.W / 2, 70, 15, '#9cf', 'center');
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
  if (endingVan) drawUiWorld('minivan', endingVan.x, CFG.GROUND_Y - 56);
  drawEnemies();
  drawBoss();
  drawActors();
  drawWolvSweep();
  drawPlayer();
  drawProjectiles();
  drawFxs();
  drawForeground();
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
    if (tap('ArrowLeft')) game.viewerIdx--;
    if (tap('ArrowRight')) game.viewerIdx++;
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
  if (tap('Enter')) { game.mode = 'pause'; game.pauseSel = 0; return; }
  if (tap('KeyD')) game.debug = !game.debug;
  if (game.debug && tap('KeyV')) game.viewer = true;
}

/* ============================ MAIN LOOP =========================== */
let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
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
