// GetallenMijn – splitsen, volgorde en de getallenlijn in een blokkenwereld
// Gebruikt de pixel-art (../tafels/sprites.js) en basisstijl (../tafels/style.css) van TafelMijn.
'use strict';

// ================= HULPJES =================
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '', extra = '') => `<img class="px ${cls}" src="${src}" alt="" draggable="false" ${extra}>`;
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const avImg = (av, cls = 'av') => `<span class="avbox" style="display:inline-block;line-height:0">${img(PX.avatar(av), cls)}</span>`;

// ================= SPELDATA =================
// Volgorde volgt de leerlijn van groep 3: splitsen en getallen wisselen elkaar af.
const WORLDS = [
  { id: 's5', kind: 'split', name: 'Splits t/m 5', sub: 'Graswei', block: 'grass', mob: 'paddo', wholes: [2, 3, 4, 5] },
  { id: 'g10', kind: 'num', name: 'Getallen t/m 10', sub: 'Woestijn', block: 'sand', mob: 'kever', max: 10 },
  { id: 's67', kind: 'split', name: 'Splits 6 en 7', sub: 'Dorp', block: 'planks', mob: 'pompoen', wholes: [6, 7] },
  { id: 'g20', kind: 'num', name: 'Getallen t/m 20', sub: 'Grot', block: 'stone', mob: 'vleermuis', max: 20 },
  { id: 's89', kind: 'split', name: 'Splits 8 en 9', sub: 'Toendra', block: 'snow', mob: 'sneeuwpop', wholes: [8, 9] },
  { id: 'g30', kind: 'num', name: 'Getallen t/m 30', sub: 'Kasteel', block: 'bricks', mob: 'spookje', max: 30 },
  { id: 's10', kind: 'split', name: 'Splits 10', sub: 'IJsberg', block: 'ice', mob: 'wolkje', wholes: [10] },
  { id: 'g50', kind: 'num', name: 'Getallen t/m 50', sub: 'Goudmijn', block: 'gold', mob: 'robo', max: 50 },
  { id: 's20', kind: 'split20', name: '10 en nog wat', sub: 'Vulkaan', block: 'lava', mob: 'lavareus' },
  { id: 'g100', kind: 'num', name: 'Getallen t/m 100', sub: 'Diamantgrot', block: 'diamond', mob: 'kristaldraak', max: 100 }
];
const W = id => WORLDS.find(w => w.id === id);
const BOSSES = [
  { mob: 'rotsreus', block: 'stone' }, { mob: 'paddo', block: 'grass' }, { mob: 'spookje', block: 'bricks' },
  { mob: 'ijsreus', block: 'ice' }, { mob: 'robo', block: 'gold' }, { mob: 'pompoen', block: 'planks' },
  { mob: 'vleermuis', block: 'stone' }, { mob: 'goudreus', block: 'gold' }, { mob: 'lavareus', block: 'lava' },
  { mob: 'kristaldraak', block: 'diamond' }, { mob: 'schaduwreus', block: 'obsidian' }
];
const MOB_IDS = Object.keys(PX.MOBS);
const mobWhere = id => { const w = WORLDS.find(w => w.mob === id); return w ? `Vang in ${w.name}` : 'Versla als eindbaas'; };
const ORES = [
  { id: 'kolen', name: 'Kolen', w: 45 }, { id: 'ijzer', name: 'IJzer', w: 26 }, { id: 'goud', name: 'Goud', w: 14 },
  { id: 'robijn', name: 'Robijn', w: 8 }, { id: 'diamant', name: 'Diamant', w: 5 }, { id: 'smaragd', name: 'Smaragd', w: 2 }
];
const PICKS = [
  { name: 'Houten houweel', cost: null },
  { name: 'Stenen houweel', cost: { kolen: 8 } },
  { name: 'IJzeren houweel', cost: { ijzer: 8, kolen: 4 } },
  { name: 'Gouden houweel', cost: { goud: 8, ijzer: 4 } },
  { name: 'Diamanten houweel', cost: { diamant: 5, goud: 4 } }
];
const TITLES = [[1, 'Beginner'], [3, 'Teller'], [5, 'Splitser'], [8, 'Bouwer'], [12, 'Ontdekker'], [16, 'Ridder'], [20, 'Getallenkoning'], [30, 'Legende']];
const title = lvl => TITLES.filter(t => lvl >= t[0]).pop()[1];
const xpFor = lvl => 100 + (lvl - 1) * 50;
const PRAISE = ['Goed zo!', 'Top!', 'Super!', 'Knap!', 'Geweldig!', 'Yes!', 'Briljant!', 'Wauw!', 'Lekker bezig!'];
const TRYAGAIN = ['Probeer nog eens!', 'Bijna! Nog een keer.', 'Oeps, kijk nog eens goed.', 'Nog één poging!'];
const MODE_UNLOCK = { mix: 1, race: 2, boss: 3 };
const T_CORRECT = 750, T_GIVEUP = 1500, T_RETRY = 650;
const SPLIT_WORLDS = WORLDS.filter(w => w.kind !== 'num').map(w => w.id);
// Splitswerelden hebben 3 niveaus: de telhulp verdwijnt stap voor stap.
const NIVEAUS = { 1: 'Met telblokjes', 2: 'Halve hulp', 3: 'Uit je hoofd' };
const maxLv = w => w.kind === 'num' ? 1 : 3;
function getStars(p, wid, n = 1) { return n === 1 ? (p.stars[wid] || 0) : ((p.nstars[wid] || {})[n] || 0); }
function setStars(p, wid, n, s) { if (n === 1) p.stars[wid] = s; else (p.nstars[wid] = p.nstars[wid] || {})[n] = s; }
function lvOpen(p, w, n) { return n === 1 || (n <= maxLv(w) && (p.settings.unlockAll || getStars(p, w.id, n - 1) >= 2)); }
function topLv(p, w) { let n = 1; while (n < maxLv(w) && lvOpen(p, w, n + 1)) n++; return n; }
function totalStars(p) { return WORLDS.reduce((s, w) => { for (let n = 1; n <= maxLv(w); n++) s += getStars(p, w.id, n); return s; }, 0); }
const MAX_STARS = WORLDS.reduce((s, w) => s + 3 * maxLv(w), 0);
const NUM_WORLDS = WORLDS.filter(w => w.kind === 'num').map(w => w.id);

const ACH = [
  { id: 'eerste', name: 'Eerste stapjes', desc: 'Speel je eerste ronde', icon: () => PX.block('grass'), test: p => p.stats.rounds >= 1 },
  { id: 'perfect', name: 'Foutloos!', desc: 'Alles in één keer goed in een ronde', icon: () => PX.star(), test: (p, c) => c && c.perfect },
  { id: 'reeks10', name: 'Op dreef', desc: '10 goed op rij', icon: () => PX.flame(), test: p => p.stats.bestStreak >= 10 },
  { id: 'reeks25', name: 'Niet te stoppen', desc: '25 goed op rij', icon: () => PX.flame(), test: p => p.stats.bestStreak >= 25 },
  { id: 'bliksem', name: 'Bliksemsnel', desc: 'Goed antwoord binnen 2 seconden', icon: () => PX.mob('wolkje'), test: (p, c) => c && c.fastest < 2 },
  { id: 'ster3', name: 'Sterrenjager', desc: '3 sterren in een wereld', icon: () => PX.star(), test: p => Object.values(p.stars).some(s => s >= 3) },
  { id: 'uithoofd', name: 'Uit je hoofd', desc: 'Haal een ster op niveau 3 (zonder blokjes)', icon: () => PX.block('ore_smaragd'), test: p => SPLIT_WORLDS.some(id => getStars(p, id, 3) >= 1) },
  { id: 'splits', name: 'Splitsmeester', desc: '3 sterren op niveau 3 in alle splitswerelden', icon: () => PX.block('ore_goud'), test: p => SPLIT_WORLDS.every(id => getStars(p, id, 3) >= 3) },
  { id: 'lijn', name: 'Getallenheld', desc: '3 sterren in alle getallenwerelden', icon: () => PX.block('ore_diamant'), test: p => NUM_WORLDS.every(id => (p.stars[id] || 0) >= 3) },
  { id: 'alle1', name: 'Wereldreiziger', desc: 'Minstens 1 ster in alle werelden', icon: () => PX.block('grass', 2), test: p => WORLDS.every(w => (p.stars[w.id] || 0) >= 1) },
  { id: 'mob1', name: 'Eerste vangst', desc: 'Vang je eerste mob', icon: () => PX.mob('paddo'), test: p => Object.keys(p.mobs).length >= 1 },
  { id: 'mob7', name: 'Mobverzamelaar', desc: 'Vang 7 verschillende mobs', icon: () => PX.mob('spookje'), test: p => Object.keys(p.mobs).length >= 7 },
  { id: 'moball', name: 'Mobmeester', desc: 'Vang alle mobs', icon: () => PX.mob('kristaldraak'), test: p => MOB_IDS.every(id => p.mobs[id]) },
  { id: 'lvl5', name: 'Splitser', desc: 'Bereik level 5', icon: () => PX.pickaxe(1), test: p => p.level >= 5 },
  { id: 'lvl10', name: 'Meesterbouwer', desc: 'Bereik level 10', icon: () => PX.block('bricks'), test: p => p.level >= 10 },
  { id: 'lvl20', name: 'Legende', desc: 'Bereik level 20', icon: () => PX.block('diamond'), test: p => p.level >= 20 },
  { id: 'goed100', name: 'Honderd!', desc: '100 opdrachten goed', icon: () => PX.coin(), test: p => p.stats.correct >= 100 },
  { id: 'goed500', name: 'Rekenmachine', desc: '500 opdrachten goed', icon: () => PX.mob('robo'), test: p => p.stats.correct >= 500 },
  { id: 'diamant', name: 'Diamanten!', desc: 'Vind een diamant', icon: () => PX.ore('diamant'), test: p => p.found.diamant >= 1 },
  { id: 'smaragd', name: 'Zeldzame vondst', desc: 'Vind een smaragd', icon: () => PX.ore('smaragd'), test: p => p.found.smaragd >= 1 },
  { id: 'baas1', name: 'Reuzendoder', desc: 'Versla een eindbaas', icon: () => PX.sword(2), test: p => p.stats.bosses >= 1 },
  { id: 'baas5', name: 'Held van de mijn', desc: 'Versla 5 eindbazen', icon: () => PX.sword(4), test: p => p.stats.bosses >= 5 },
  { id: 'race15', name: 'Racer', desc: '15 goed in de tijdrace', icon: () => PX.clock(), test: p => p.stats.raceBest >= 15 },
  { id: 'huisdier', name: 'Beste vriendje', desc: 'Koop een huisdier', icon: () => PX.pet('kuiken'), test: p => p.owned.pets.length >= 1 },
  { id: 'diahouweel', name: 'Glimmend gereedschap', desc: 'Maak het diamanten houweel', icon: () => PX.pickaxe(4), test: p => p.pick >= 4 },
  { id: 'zelf', name: 'Zelf gedaan', desc: 'Een ronde zonder de ?-knop met 3 sterren', icon: () => PX.book(), test: (p, c) => c && c.noHint3 }
];

// ================= OPSLAG (alleen lokaal in deze browser) =================
const SAVE = 'getallenmijn_v1';
let DB;
function newProfile(name, avatar) {
  return {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, avatar,
    xp: 0, level: 1, coins: 0, pick: 0,
    ores: { kolen: 0, ijzer: 0, goud: 0, robijn: 0, diamant: 0, smaragd: 0 },
    found: { kolen: 0, ijzer: 0, goud: 0, robijn: 0, diamant: 0, smaragd: 0 },
    stars: {}, nstars: {}, facts: {}, wstats: {}, ach: {}, mobs: {},
    owned: { hats: ['geen'], pets: [] }, pet: null,
    stats: { rounds: 0, correct: 0, wrong: 0, hints: 0, bosses: 0, bestStreak: 0, raceBest: 0 },
    settings: { input: 'keypad', unlockAll: false, dots: 'auto' }
  };
}
function fillDefaults(obj, tpl) {
  for (const k in tpl) {
    if (obj[k] === undefined) obj[k] = tpl[k];
    else if (tpl[k] && typeof tpl[k] === 'object' && !Array.isArray(tpl[k]) && obj[k] && typeof obj[k] === 'object') fillDefaults(obj[k], tpl[k]);
  }
}
function load() {
  try { DB = JSON.parse(localStorage.getItem(SAVE)); } catch (e) { DB = null; }
  if (!DB || !Array.isArray(DB.profiles)) DB = { profiles: [], current: null, sound: true };
  DB.profiles.forEach(p => {
    fillDefaults(p, newProfile(p.name, p.avatar));
    if (typeof p.settings.dots === 'boolean') p.settings.dots = p.settings.dots ? 'auto' : 'off';
  });
}
function save() { try { localStorage.setItem(SAVE, JSON.stringify(DB)); } catch (e) { } }
const P = () => DB.profiles.find(p => p.id === DB.current);

// ================= GELUID =================
const SFX = (() => {
  let ctx;
  const ac = () => {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  function tone(f, d, { type = 'square', vol = 0.05, at = 0, to = null } = {}) {
    if (!DB.sound) return; const c = ac(); if (!c) return;
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.03);
  }
  function noise(d, vol = 0.1, at = 0) {
    if (!DB.sound) return; const c = ac(); if (!c) return;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400; s.buffer = buf; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + at);
  }
  return {
    unlock: ac,
    click: () => tone(520, .05, { vol: .025 }),
    place: () => tone(780, .06, { vol: .04 }),
    correct: () => { tone(660, .09); tone(880, .09, { at: .08 }); tone(1320, .14, { at: .16 }); },
    wrong: () => { tone(330, .12, { type: 'triangle', vol: .07 }); tone(262, .18, { type: 'triangle', vol: .07, at: .1 }); },
    hint: () => { tone(523, .1, { type: 'triangle', vol: .06 }); tone(659, .14, { type: 'triangle', vol: .06, at: .1 }); },
    coin: () => { tone(988, .07, { vol: .04 }); tone(1318, .16, { at: .07, vol: .04 }); },
    dig: () => noise(.09, .14),
    brk: () => { noise(.35, .18); tone(110, .25, { type: 'triangle', vol: .12 }); },
    level: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .2, { at: i * .1, vol: .05 })),
    hit: () => { noise(.12, .18); tone(170, .14, { vol: .07, to: 70 }); },
    hurt: () => tone(320, .4, { type: 'sawtooth', to: 80, vol: .05 }),
    star: i => tone(700 + i * 220, .18, { vol: .05 }),
    win: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, .16, { at: i * .12, vol: .05 })),
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, .25, { at: i * .18, vol: .05, type: 'triangle' }))
  };
})();

// ================= EFFECTEN =================
const fx = $('#fx');
function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
function burst(el, colors, n = 16) {
  if (!el) return; const [x, y] = centerOf(el);
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'part';
    const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 120;
    d.style.cssText = `left:${x}px;top:${y}px;background:${rnd(colors)};--dx:${Math.cos(a) * v}px;--dy:${Math.sin(a) * v + 60}px;--rot:${Math.random() * 360}deg;width:${8 + Math.random() * 8}px;height:${8 + Math.random() * 8}px`;
    fx.appendChild(d); setTimeout(() => d.remove(), 850);
  }
}
function floater(el, html, color) {
  if (!el) return; const [x, y] = centerOf(el);
  const d = document.createElement('div'); d.className = 'floater'; d.innerHTML = html;
  d.style.left = (x - 30 + Math.random() * 40) + 'px'; d.style.top = (y - 40) + 'px'; if (color) d.style.color = color;
  fx.appendChild(d); setTimeout(() => d.remove(), 1000);
}
function confetti(n = 60) {
  const cols = ['#ffd23b', '#5cc22c', '#3a7bd5', '#e0453a', '#4fe3dc', '#f07ab0', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'confetti';
    d.style.cssText = `left:${Math.random() * 100}vw;background:${rnd(cols)};animation-duration:${1.8 + Math.random() * 1.8}s;animation-delay:${Math.random() * .6}s`;
    fx.appendChild(d); setTimeout(() => d.remove(), 4500);
  }
}
function toast(icon, head, text) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `${img(icon)}<div><b>${esc(head)}</b>${esc(text)}</div>`;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4000);
}
function modal(html) { const m = $('#modal'); m.innerHTML = `<div class="card">${html}</div>`; m.classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }
function setBiome(block) {
  document.body.className = block ? 'biome-' + block : '';
  const ground = { grass: 'grass', sand: 'sand', snow: 'snow', stone: 'stone', planks: 'grass', bricks: 'grass', ice: 'snow', gold: 'stone', diamond: 'stone', lava: 'obsidian', obsidian: 'obsidian' }[block] || 'grass';
  $('#ground').style.backgroundImage = `url(${PX.block(ground)})`;
}
function blockColors(type) {
  return ({ grass: ['#5d9b3a', '#866043', '#6aaa40'], sand: ['#dbd3a0', '#cfc590'], planks: ['#a2824e', '#6e5530'], stone: ['#7d7d7d', '#5f5f5f'], snow: ['#fff', '#e3ecf2', '#866043'], bricks: ['#9b4f3c', '#b8aaa0'], ice: ['#9cc4f5', '#e4f1ff'], gold: ['#f6d32b', '#fff3a0'], lava: ['#f06a12', '#ffd34d'], diamond: ['#5fe0dc', '#fff'], obsidian: ['#2c1a42', '#5a3a86'] })[type] || ['#888', '#666'];
}

// ================= SPELER-LOGICA =================
function unlocked(p, i) { return p.settings.unlockAll || i === 0 || (p.stars[WORLDS[i - 1].id] || 0) >= 1; }
function unlockedWorlds(p) { return WORLDS.filter((w, i) => unlocked(p, i)); }
function addXP(p, amt) { p.xp += amt; let ups = 0; while (p.xp >= xpFor(p.level)) { p.xp -= xpFor(p.level); p.level++; ups++; } return ups; }
function rollOre(tier) {
  const ws = ORES.map((o, i) => o.w * (1 + tier * i * 0.3));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ORES.length; i++) { r -= ws[i]; if (r <= 0) return ORES[i].id; }
  return 'kolen';
}
function checkAch(p, ctx) {
  const fresh = [];
  ACH.forEach(a => { if (!p.ach[a.id] && a.test(p, ctx)) { p.ach[a.id] = today(); p.coins += 25; fresh.push(a); } });
  fresh.forEach((a, i) => setTimeout(() => { toast(a.icon(), 'Prestatie! +25 munten', a.name); SFX.coin(); }, 400 + i * 700));
  if (fresh.length) save();
  return fresh;
}

// ================= OPDRACHTEN MAKEN =================
// Gewicht: nieuwe of vaak foute opdrachten komen vaker langs.
function factW(key) { const f = P().facts[key]; if (!f) return 2; const n = f.c + f.w; return 1 + 5 * (f.w / Math.max(1, n)) + (n < 3 ? 1 : 0); }
function wpick(items) { let r = Math.random() * items.reduce((a, b) => a + b.w, 0); for (const it of items) { r -= it.w; if (r <= 0) return it; } return items[items.length - 1]; }

function genSplit(w) {
  const cands = [];
  w.wholes.forEach(n => { for (let k = 0; k <= n; k++) {
    const key = `s:${n}:${Math.min(k, n - k)}`;
    cands.push({ n, k, key, w: factW(key) * (k === 0 || k === n ? 0.25 : 1) * (G && G.lastKey === key ? 0.05 : 1) });
  } });
  const c = wpick(cands);
  if (Math.random() < 0.2) return { type: 'split', v: 'whole', n: c.n, p1: c.k, p2: c.n - c.k, a: c.n, key: c.key, input: 'num' };
  return { type: 'split', v: 'part', n: c.n, known: c.k, leftKnown: Math.random() < 0.5, a: c.n - c.k, key: c.key, input: 'num' };
}
function genSplit20() {
  const c = wpick(Array.from({ length: 10 }, (_, i) => { const n = 11 + i, key = 't:' + n; return { n, key, w: factW(key) * (G && G.lastKey === key ? 0.05 : 1) }; }));
  const e = c.n - 10, v = rnd(['ten', 'ten', 'ones', 'whole']);
  return { type: 'split20', v, n: c.n, e, a: v === 'ten' ? e : v === 'ones' ? 10 : c.n, key: c.key, input: 'num' };
}
function lineWindow(max) {
  if (max <= 20) return [0, max];
  const starts = []; for (let s = 0; s <= max - 20; s += 10) starts.push(s);
  const s = rnd(starts); return [s, s + 20];
}
function lineLabels(lo, hi, max) {
  const step = max <= 30 ? 5 : 10, out = [];
  for (let i = lo; i <= hi; i++) if (i === lo || i === hi || i % step === 0) out.push(i);
  return out;
}
function genNum(w, type) {
  const max = w.max;
  if (type === 'lineRead' || type === 'lineTap') {
    const [lo, hi] = lineWindow(max), labels = lineLabels(lo, hi, max), pre = type === 'lineRead' ? 'l:' : 'p:';
    const cands = []; for (let i = lo; i <= hi; i++) if (!labels.includes(i)) cands.push({ i, w: factW(pre + i) * (G && G.lastKey === pre + i ? 0.05 : 1) });
    const t = wpick(cands).i;
    return { type, lo, hi, labels, a: t, key: pre + t, input: type === 'lineRead' ? 'num' : 'tap', tapped: [] };
  }
  if (type === 'order') {
    const count = max <= 10 ? 4 : 5, set = new Set();
    if (max >= 50 && Math.random() < 0.5) { const t = ri(1, Math.floor(max / 10) - 1), e = ri(1, 9); if (t !== e) { set.add(t * 10 + e); set.add(e * 10 + t); } }
    const lo = max <= 10 ? 0 : max <= 20 ? 0 : Math.max(0, max - 30);
    while (set.size < count) set.add(ri(lo, max));
    const nums = shuffle([...set]), dir = max >= 20 && Math.random() < 0.3 ? 'down' : 'up';
    const sorted = [...nums].sort((a, b) => dir === 'up' ? a - b : b - a);
    return { type, nums, dir, a: sorted, placed: [], key: 'o:' + w.id, input: 'order' };
  }
  if (type === 'neigh') {
    const kind = rnd(['na', 'voor', 'tussen']);
    const n = kind === 'na' ? ri(0, max - 1) : kind === 'voor' ? ri(1, max) : ri(1, max - 1);
    const a = kind === 'na' ? n + 1 : kind === 'voor' ? n - 1 : n;
    return { type, kind, n, a, key: 'b:' + a, input: 'num' };
  }
  // compare
  let x = ri(0, max), y;
  if (max >= 30 && Math.random() < 0.5) {
    const t = Math.floor(x / 10), e = x % 10;
    y = (t !== e && e * 10 + t <= max && t > 0) ? e * 10 + t : Math.min(max, x + ri(1, 3));
  } else y = ri(0, max);
  if (y === x) y = x === max ? x - 1 : x + 1;
  const which = Math.random() < 0.5 ? 'grootst' : 'kleinst';
  return { type: 'compare', x, y, which, a: which === 'grootst' ? Math.max(x, y) : Math.min(x, y), key: 'c:' + w.id, input: 'pick' };
}
const NUM_MIX = ['lineRead', 'lineRead', 'lineRead', 'lineTap', 'lineTap', 'lineTap', 'order', 'neigh', 'neigh', 'compare'];
function genFor(w, type, raceOnly, lvl) {
  let q;
  if (w.kind === 'split') q = genSplit(w);
  else if (w.kind === 'split20') q = genSplit20();
  else q = genNum(w, type || rnd(raceOnly ? ['lineRead', 'neigh', 'neigh'] : NUM_MIX));
  q.wid = w.id; q.tries = 0; q.retry = false; q.lvl = lvl || topLv(P(), w);
  return q;
}

// ================= TOPBALK =================
function topbar(back) {
  const p = P();
  const pct = Math.round(p.xp / xpFor(p.level) * 100);
  return `<div class="card topbar">
    ${back ? `<button class="btn light sm" data-act="${back}">◀ Terug</button>` : ''}
    <div class="who">${avImg(p.avatar)}<div style="flex:1">
      <div class="name">${esc(p.name)}</div>
      <div class="lvl">Level ${p.level} · ${title(p.level)}</div>
      <div class="xpbar"><div style="width:${pct}%"></div><span>${p.xp} / ${xpFor(p.level)} XP</span></div>
    </div></div>
    <div class="counters">
      <div class="counter" title="Munten">${img(PX.coin())}<span>${p.coins}</span></div>
      <div class="counter" title="Sterren">${img(PX.star())}${totalStars(p)}/${MAX_STARS}</div>
      <div class="counter" title="Mobs gevangen">${img(PX.mob('paddo'))}${Object.keys(p.mobs).length}/${MOB_IDS.length}</div>
    </div>
  </div>`;
}

// ================= SCHERM: PROFIELEN =================
function renderProfiles() {
  G = null; setBiome('grass');
  app.innerHTML = `<div class="screen">
    <div class="logo">Getallen<span class="accent">Mijn</span></div>
    <div class="subtitle">Splitsen · tellen · de getallenlijn tot 100!</div>
    <div class="mobparade">${['paddo', 'kever', 'pompoen', 'vleermuis', 'sneeuwpop', 'spookje'].map(m => img(PX.mob(m), 'mob')).join('')}</div>
    <div class="card"><h2 style="margin-bottom:14px">Wie gaat er spelen?</h2>
      <div class="profiles">
        ${DB.profiles.map(p => `<div class="slot pcard" data-act="choose" data-id="${p.id}">
            ${avImg(p.avatar)}<div class="pname">${esc(p.name)}</div><div class="muted small">Level ${p.level} · ${title(p.level)}</div></div>`).join('')}
        <div class="slot pcard new" data-act="newPlayer">${avImg({ skin: 1, hairColor: 2, hairStyle: 0, shirt: 2, hat: 'geen' })}<div class="pname">+ Nieuwe speler</div><div class="muted small">Maak je eigen poppetje</div></div>
      </div>
    </div>
    <div class="row"><a class="btn light sm" href="../" style="text-decoration:none">◀ Andere spelletjes</a><button class="btn light sm" data-act="toggleSound">${DB.sound ? '🔊 Geluid aan' : '🔇 Geluid uit'}</button></div>
  </div>`;
}

// ================= SCHERM: AVATAR-EDITOR =================
let EDIT = null;
function renderEditor(existing) {
  if (!EDIT) {
    const p = existing ? P() : null;
    EDIT = { id: p ? p.id : null, name: p ? p.name : '', av: p ? { ...p.avatar } : { skin: Math.floor(Math.random() * 5), hairColor: Math.floor(Math.random() * 5), hairStyle: Math.floor(Math.random() * 4), shirt: Math.floor(Math.random() * 8), hat: 'geen' } };
  }
  const p = EDIT.id ? DB.profiles.find(x => x.id === EDIT.id) : null;
  const ownedHats = p ? p.owned.hats : ['geen'];
  const sw = (key, list) => list.map((c, i) => `<div class="swatch ${EDIT.av[key] === i ? 'sel' : ''}" style="background:${c}" data-act="av" data-k="${key}" data-v="${i}"></div>`).join('');
  const again = !!app.querySelector('#nameIn');
  app.innerHTML = `<div class="screen ${again ? 'noanim' : ''}">
    <div class="card">
      <h2 style="margin-bottom:16px">${p ? 'Pas je speler aan' : 'Nieuwe speler'}</h2>
      <div class="editor">
        <div class="preview center">${avImg(EDIT.av, '')}</div>
        <div>
          <div class="opt-row"><label>Naam</label><input class="name" id="nameIn" maxlength="14" placeholder="Jouw naam" value="${esc(EDIT.name)}"></div>
          <div class="opt-row"><label>Huid</label>${sw('skin', PX.AV.skins)}</div>
          <div class="opt-row"><label>Haar</label>${sw('hairColor', PX.AV.hairColors)}</div>
          <div class="opt-row"><label>Kapsel</label>${PX.AV.hairStyles.map((s, i) => `<span class="chip ${EDIT.av.hairStyle === i ? 'sel' : ''}" data-act="av" data-k="hairStyle" data-v="${i}">${s}</span>`).join('')}</div>
          <div class="opt-row"><label>Shirt</label>${sw('shirt', PX.AV.shirts)}</div>
          <div class="opt-row"><label>Hoed</label>${Object.entries(PX.AV.hats).map(([id, h]) => {
            const own = ownedHats.includes(id);
            return `<span class="chip ${EDIT.av.hat === id ? 'sel' : ''} ${own ? '' : 'locked'}" ${own ? `data-act="av" data-k="hat" data-v="${id}"` : ''}>${own ? '' : '🔒 '}${h.name}</span>`;
          }).join('')}</div>
          ${!p ? '<div class="muted small">Hoeden koop je later in de winkel met munten.</div>' : ''}
        </div>
      </div>
    </div>
    <div class="row">
      <button class="btn light" data-act="${p ? 'home' : 'profiles'}">Annuleer</button>
      <button class="btn purple" data-act="randomAv">🎲 Verras me</button>
      <button class="btn green" data-act="saveAv">✔ Opslaan</button>
    </div>
  </div>`;
  const inp = $('#nameIn'); inp.addEventListener('input', () => EDIT.name = inp.value);
}

// ================= SCHERM: HOME / WERELDKAART =================
function renderHome() {
  G = null; EDIT = null; setBiome('grass');
  const p = P();
  const nb = BOSSES[p.stats.bosses % BOSSES.length];
  const modes = [
    { act: 'mix', icon: PX.block('obsidian'), name: 'Mix-mijn', desc: '15 opdrachten uit al je werelden', cls: 'purple' },
    { act: 'race', icon: PX.clock(), name: 'Tijdrace', desc: `Zoveel mogelijk in 60 sec · record ${p.stats.raceBest}`, cls: 'gold' },
    { act: 'boss', icon: PX.mob(nb.mob), name: 'Eindbaas', desc: `Versla ${PX.MOBS[nb.mob].name}!`, cls: 'red' }
  ];
  app.innerHTML = `<div class="screen">
    ${topbar()}
    <div class="card">
      <h2 style="margin-bottom:14px">Kies een wereld</h2>
      <div class="worlds">
        ${WORLDS.map((w, i) => {
          const open = unlocked(p, i), st = getStars(p, w.id, 1);
          return `<div class="world ${open ? '' : 'locked'}" data-act="${open ? 'play' : 'lockedWorld'}" data-w="${w.id}">
            ${open && getStars(p, w.id, 1) === 0 ? '<span class="badge">NIEUW</span>' : ''}
            <div class="blkwrap">${img(PX.block(w.block), 'blk')}${img(PX.mob(w.mob), 'guard mob')}${open ? '' : img(PX.lock(), 'lockicon')}</div>
            <div class="tnum">${w.name}</div><div class="wname">${w.sub}</div>
            ${maxLv(w) === 1 ? `<div class="stars">${[1, 2, 3].map(s => img(PX.star(st >= s))).join('')}</div>`
              : `<div class="lvstars">${[1, 2, 3].map(n => lvOpen(p, w, n)
                  ? `<span title="Niveau ${n}: ${NIVEAUS[n]}"><b>${n}</b>${[1, 2, 3].map(s => img(PX.star(getStars(p, w.id, n) >= s))).join('')}</span>`
                  : `<span class="lk" title="Niveau ${n}: haal eerst 2 sterren op niveau ${n - 1}"><b>${n}</b>${img(PX.lock())}</span>`).join('')}</div>`}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="modes">
      ${modes.map(m => {
        const need = MODE_UNLOCK[m.act], ok = p.level >= need;
        return `<button class="btn ${ok ? m.cls : 'light'} mode" data-act="${ok ? m.act : 'lockedMode'}" data-need="${need}">${img(ok ? m.icon : PX.lock(), ok && m.act === 'boss' ? 'mob' : '')}<span>${m.name}<small>${ok ? m.desc : 'Vanaf level ' + need}</small></span></button>`;
      }).join('')}
    </div>
    <div class="menu-row">
      <button class="btn light" data-act="mobs">${img(PX.mob('spookje'), 'mob')} Mobboek</button>
      <button class="btn light" data-act="craft">${img(PX.pickaxe(p.pick))} Werkbank</button>
      <button class="btn light" data-act="shop">${img(PX.coin())} Winkel</button>
      <button class="btn light" data-act="achs">${img(PX.trophy())} Prestaties</button>
      <button class="btn light" data-act="stats">${img(PX.book())} Voortgang</button>
      <button class="btn light" data-act="settings">${img(PX.gear())} Instellingen</button>
      <button class="btn light" data-act="profiles">${img(PX.avatar({ skin: 1, hairColor: 2, hairStyle: 0, shirt: 2, hat: 'geen' }))} Wissel speler</button>
    </div>
  </div>`;
}

// ================= SPEL =================
let G = null;
const isRound = () => G && (G.mode === 'world' || G.mode === 'mix');

function startRound(mode, wid, lvl) {
  const p = P();
  if (!p) return renderProfiles();
  const open = unlockedWorlds(p);
  G = { mode, wid, queue: [], retries: [], results: [], streak: 0, best: 0, coins: 0, xp: 0, ores: {}, fastest: 99, times: [],
    firstCorrect: 0, hints: 0, answer: '', locked: true, crack: 0, score: 0, retryCount: 0, done: false, lastKey: null };
  if (mode === 'world') {
    const w = W(wid);
    G.lvl = Math.min(lvl || 1, maxLv(w));
    const types = w.kind === 'num' ? shuffle(NUM_MIX) : Array(10).fill(null);
    types.forEach((t, i) => { const q = genFor(w, t, false, G.lvl); q.idx = i; G.lastKey = q.key; G.queue.push(q); });
    G.block = w.block; G.mob = w.mob;
  }
  if (mode === 'mix') {
    for (let i = 0; i < 15; i++) { const q = genFor(rnd(open)); q.idx = i; G.lastKey = q.key; G.queue.push(q); }
    G.block = 'obsidian'; G.mob = rnd(open).mob;
  }
  G.lastKey = null;
  G.mainTotal = G.queue.length;
  if (mode === 'race') { G.block = 'planks'; G.mob = 'wolkje'; }
  if (mode === 'boss') {
    const b = BOSSES[p.stats.bosses % BOSSES.length];
    G.mob = b.mob; G.block = b.block; G.hearts = 5;
    G.bossMax = Math.min(10 + p.stats.bosses * 2, 30); G.bossHp = G.bossMax;
  }
  setBiome(G.block);
  renderGame();
  if (mode === 'race') {
    G.endAt = Date.now() + 60000;
    G.timer = setInterval(() => {
      const left = Math.max(0, G.endAt - Date.now());
      const bar = $('#raceBar'); if (bar) { bar.style.width = (left / 600) + '%'; $('#raceTxt').textContent = Math.ceil(left / 1000) + ' sec · ' + G.score + ' goed'; }
      if (left <= 0) finishRound();
    }, 200);
  }
  nextQ();
}

function renderGame() {
  const p = P();
  let top = '', right = '';
  const mine = `<div class="mine-wrap"><div class="mine-block" id="mineBlock">${img(PX.block(G.block), 'base')}${img(PX.crack(0), '', 'id="crackImg"')}</div>
      ${img(PX.mob(G.mob), 'guard mob', 'id="guard"')}${img(PX.pickaxe(p.pick), 'pickaxe-swing', 'id="pickImg"')}</div>`;
  if (isRound()) {
    const w = G.mode === 'world' ? W(G.wid) : null;
    top = (w && maxLv(w) > 1 ? `<span class="lvchip">Niveau ${G.lvl} · ${NIVEAUS[G.lvl]}</span>` : '') + `<div class="progress" id="progress"></div>`;
    right = mine;
  }
  else if (G.mode === 'race') { top = `<div class="timerbar" style="flex:1;min-width:200px"><div id="raceBar" style="width:100%"></div><span id="raceTxt">60 sec</span></div>`; right = mine; }
  else {
    top = `<div class="hearts" id="hearts"></div>`;
    right = `<div class="boss-wrap"><div class="boss-name">${PX.MOBS[G.mob].name}</div>
      ${img(PX.mob(G.mob), 'boss-img mob', 'id="bossImg"')}<div class="hpbar"><div id="hpBar" style="width:100%"></div><span id="hpTxt"></span></div></div>`;
  }
  app.innerHTML = `<div class="screen game" id="gameScreen">
    <div class="game-top"><button class="btn light sm" data-act="quit">✕ Stop</button>${top}</div>
    <div class="scene">
      <div class="player" id="player"><div class="bubble" id="bubble"></div><div class="streak" id="streak"></div>${avImg(p.avatar)}${p.pet ? img(PX.pet(p.pet), 'petimg mob') : ''}</div>
      ${right}
    </div>
    <div class="card question" id="question"><div id="qbody"></div>
      <div class="qfoot"><div class="speedbar"><div id="speed"></div></div>
        <button class="btn gold hintbtn" data-act="hint" title="Help: laat het antwoord zien">?</button></div>
      <div class="feedback" id="feedback"></div></div>
    <div id="inputArea"></div>
  </div>`;
  updateHUD();
}

function updateHUD() {
  if (!G) return;
  const pr = $('#progress');
  if (pr) pr.innerHTML = Array.from({ length: G.mainTotal }, (_, i) => `<i class="${G.results[i] || (G.current && !G.current.retry && G.current.idx === i ? 'cur' : '')}"></i>`).join('');
  const st = $('#streak');
  if (st) {
    st.className = 'streak' + (G.streak >= 5 ? ' hot' : '');
    st.innerHTML = G.streak >= 2 ? `${img(PX.flame())}${G.streak}` : '';
    const pl = $('#player'); if (pl) pl.classList.toggle('onfire', G.streak >= 2);
  }
  const h = $('#hearts'); if (h) h.innerHTML = Array.from({ length: 5 }, (_, i) => img(PX.heart(i < G.hearts))).join('');
  const hp = $('#hpBar'); if (hp) { hp.style.width = (G.bossHp / G.bossMax * 100) + '%'; $('#hpTxt').textContent = G.bossHp + ' / ' + G.bossMax; }
}

// ---------- tekenen van een opdracht ----------
const box = v => `<span class="box">${v}</span>`;
const ansBox = () => `<span class="box ans ${G.answer === '' ? 'empty' : ''}">${G.answer === '' ? '?' : G.answer}</span>`;
const blockDots = (n, src) => Array.from({ length: n }, () => img(src)).join('');
const ghosts = n => Array.from({ length: n }, () => '<span class="ghost"></span>').join('');
const LEGS = '<svg class="legs" viewBox="0 0 150 34"><line x1="75" y1="3" x2="30" y2="31"/><line x1="75" y1="3" x2="120" y2="31"/></svg>';

function nline(q, opts = {}) {
  const { lo, hi, labels } = q, span = hi - lo;
  const pos = i => `calc(3% + ${((i - lo) / span * 94).toFixed(3)}%)`;
  let h = '<div class="nline"><div class="axis"></div>';
  for (let i = lo; i <= hi; i++) h += `<div class="tick ${labels.includes(i) ? '' : 'small'}" style="left:${pos(i)}"></div>`;
  labels.forEach(i => h += `<div class="lab" style="left:${pos(i)}">${i}</div>`);
  if (opts.arrow != null) h += `<div class="arrow" style="left:${pos(opts.arrow)}">▼</div>`;
  if (opts.tap) for (let i = lo; i <= hi; i++) h += `<div class="zone" data-tapn="${i}" style="left:${pos(i)};width:${(94 / span).toFixed(3)}%"></div>`;
  (q.tapped || []).forEach(t => h += `<div class="mark ${t.cls}" style="left:${pos(t.n)}">${t.cls !== 'bad' ? `<span>${t.n}</span>` : ''}</div>`);
  return h + '</div>';
}
const nblock = (v, blk, attrs = '', cls = '') => `<button class="nblock ${cls}" style="background-image:url(${PX.block(blk)})" ${attrs}>${v}</button>`;

function drawQ(state) {
  const q = G.current, el = $('#qbody'), qq = $('#question');
  if (!el) return;
  qq.className = 'card question' + (state ? ' ' + state : '');
  // Telhulp: niveau 1 blokjes + lege vakjes, niveau 2 alleen blokjes van het bekende deel, niveau 3 niets.
  const ds = P().settings.dots, help = ds === 'on' ? 1 : ds === 'off' ? 3 : (q.lvl || 1);
  const showDots = help < 3, showGhosts = help === 1;
  const A = PX.block('gold'), B = PX.block('diamond');
  let h = '';
  if (q.type === 'split') {
    if (q.v === 'part') {
      const known = box(q.known);
      h = `<div class="qtext">Splits ${q.n}</div><div class="split"><div class="top">${box(q.n)}</div>${LEGS}
        <div class="bottom">${q.leftKnown ? known + ansBox() : ansBox() + known}</div></div>`;
      const gh = showGhosts ? ghosts(q.n - q.known) : '';
      if (showDots && (q.known > 0 || gh)) h += `<div class="dots">${q.leftKnown ? blockDots(q.known, A) + '<span class="gap"></span>' + gh : gh + '<span class="gap"></span>' + blockDots(q.known, A)}</div>`;
    } else {
      h = `<div class="qtext">Hoeveel samen?</div><div class="split"><div class="top">${ansBox()}</div>${LEGS}<div class="bottom">${box(q.p1)}${box(q.p2)}</div></div>`;
      if (showGhosts) h += `<div class="dots">${blockDots(q.p1, A)}<span class="gap"></span>${blockDots(q.p2, B)}</div>`;
    }
  } else if (q.type === 'split20') {
    const top = q.v === 'whole' ? ansBox() : box(q.n);
    const left = q.v === 'ones' ? ansBox() : box(10), right = q.v === 'ten' ? ansBox() : box(q.e);
    h = `<div class="qtext">${q.v === 'whole' ? 'Hoeveel samen?' : `Splits ${q.n}`}</div><div class="split"><div class="top">${top}</div>${LEGS}<div class="bottom">${left}${right}</div></div>`;
    if (showDots) {
      const left = q.v === 'ones' && !showGhosts ? '' : `<span class="bar10">${blockDots(10, A)}</span>`;
      const right = q.v === 'ten' ? (showGhosts ? ghosts(q.e) : '') : blockDots(q.e, B);
      if (q.v !== 'whole' || showGhosts) h += `<div class="dots">${left}<span class="gap"></span>${right}</div>`;
    }
  } else if (q.type === 'lineRead') {
    h = `<div class="qtext">Welk getal hoort bij de pijl?</div>${nline(q, { arrow: q.a })}<div class="row-boxes">${ansBox()}</div>`;
  } else if (q.type === 'lineTap') {
    h = `<div class="qtext">Tik op de plek van <span class="big">${q.a}</span></div>${nline(q, { tap: true })}`;
  } else if (q.type === 'order') {
    const blk = W(q.wid).block;
    h = `<div class="qtext">Zet op volgorde</div><div class="arrowhint">${q.dir === 'up' ? 'van klein → naar groot' : 'van groot → naar klein'}</div>
      <div class="slots">${q.a.map((_, i) => `<div class="slot-box">${q.placed[i] != null ? nblock(q.placed[i], blk) : ''}</div>`).join('')}</div>
      <div class="pool">${q.nums.map((v, i) => nblock(v, blk, `data-onum="${i}"`, q.used && q.used[i] ? 'used' : (q.helpNext && v === q.a[q.placed.length] ? 'nexthint' : ''))).join('')}</div>`;
  } else if (q.type === 'neigh') {
    const t = { na: `Welk getal komt ná ${q.n}?`, voor: `Welk getal komt vóór ${q.n}?`, tussen: 'Welk getal zit ertussen?' }[q.kind];
    const row = q.kind === 'na' ? box(q.n) + ansBox() : q.kind === 'voor' ? ansBox() + box(q.n) : box(q.n - 1) + ansBox() + box(q.n + 1);
    h = `<div class="qtext">${t}</div><div class="row-boxes">${row}</div>`;
  } else if (q.type === 'compare') {
    const blk = W(q.wid).block;
    h = `<div class="qtext">Welk getal is het <span class="big">${q.which}</span>?</div>
      <div class="pick2">${[q.x, q.y].map(v => nblock(v, blk, `data-pick="${v}"`, q.picked === v ? (v === q.a ? 'ok' : 'badtap') : (state === 'hint' && v === q.a ? 'ok' : ''))).join('')}</div>`;
  }
  el.innerHTML = h;
}

function drawInput() {
  const q = G.current, ia = $('#inputArea');
  if (q.input !== 'num') { ia.innerHTML = ''; return; }
  if (P().settings.input === 'choice') {
    const max = q.type === 'split' ? 10 : q.type === 'split20' ? 20 : W(q.wid).max;
    const set = new Set([q.a]);
    shuffle([q.a + 1, q.a - 1, q.a + 2, q.a - 2, q.a + 10, q.a - 10, q.a + 3]).forEach(v => { if (set.size < 4 && v >= 0 && v <= max + 2) set.add(v); });
    let k = 3; while (set.size < 4) set.add(q.a + k++);
    ia.innerHTML = `<div class="choices" id="choices">${shuffle([...set]).map(v => `<button class="btn light" data-choice="${v}">${v}</button>`).join('')}</div>`;
  } else {
    ia.innerHTML = `<div class="keypad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => `<button class="btn light" data-key="${n}">${n}</button>`).join('')}
      <button class="btn red" data-key="del">⌫</button><button class="btn light" data-key="0">0</button><button class="btn green" data-key="ok">OK</button></div>`;
  }
}

function setFeedback(txt, cls = '') { const fb = $('#feedback'); if (fb) { fb.className = 'feedback ' + cls; fb.textContent = txt; } }
function startSpeedbar() {
  const sp = $('#speed'); if (!sp) return;
  sp.style.transition = 'none'; sp.style.width = '100%';
  requestAnimationFrame(() => requestAnimationFrame(() => { sp.style.transition = 'width 8s linear'; sp.style.width = '0%'; }));
}

function nextQ() {
  if (!G || G.done) return;
  let q;
  if (isRound()) {
    q = G.queue.shift() || G.retries.shift();
    if (!q) return finishRound();
  } else {
    const open = unlockedWorlds(P());
    q = genFor(rnd(open), null, G.mode === 'race'); q.idx = 0;
  }
  G.current = q; G.lastKey = q.key; G.answer = ''; G.locked = false; G.qStart = performance.now();
  drawQ(); drawInput();
  setFeedback(q.retry ? 'Deze komt nog een keer terug!' : '', 'info');
  startSpeedbar();
  updateHUD();
}

// ---------- antwoorden ----------
function press(k) {
  if (!G || G.locked || !G.current || G.current.input !== 'num') return;
  SFX.click();
  if (k === 'del') G.answer = G.answer.slice(0, -1);
  else if (k === 'ok') { if (G.answer !== '') answer(+G.answer === G.current.a); return; }
  else if (G.answer.length < 3) G.answer += k;
  drawQ();
  if (G.answer.length >= String(G.current.a).length) answer(+G.answer === G.current.a);
}
function onTap(n) {
  const q = G && G.current; if (!q || G.locked || q.type !== 'lineTap') return;
  const ok = n === q.a;
  q.tapped.push({ n, cls: ok ? 'ok' : 'bad' });
  answer(ok);
}
function onOrderTap(i, el) {
  const q = G && G.current; if (!q || G.locked || q.type !== 'order') return;
  q.used = q.used || [];
  if (q.used[i]) return;
  const v = q.nums[i], expected = q.a[q.placed.length];
  if (v === expected) {
    q.used[i] = true; q.placed.push(v); SFX.place();
    if (q.placed.length === q.a.length) answer(true); else drawQ();
  } else {
    el.classList.remove('badtap'); void el.offsetWidth; el.classList.add('badtap');
    answer(false);
  }
}
function onPick(v) {
  const q = G && G.current; if (!q || G.locked || q.type !== 'compare') return;
  q.picked = v; answer(v === q.a);
}

function record(q, ok, dt) {
  const p = P();
  const f = p.facts[q.key] || (p.facts[q.key] = { c: 0, w: 0, time: 0 });
  const ws = p.wstats[q.wid] || (p.wstats[q.wid] = { c: 0, w: 0 });
  if (ok) { f.c++; f.time += Math.min(dt, 30); ws.c++; p.stats.correct++; } else { f.w++; ws.w++; p.stats.wrong++; }
}
function markResult(q, val) { if (isRound() && !q.retry && !G.results[q.idx]) G.results[q.idx] = val; }

function answer(ok) {
  if (!G || G.locked || !G.current) return;
  G.locked = true;
  const q = G.current, dt = (performance.now() - G.qStart) / 1000;
  if (q.tries === 0) record(q, ok, dt);
  ok ? onCorrect(q, dt) : onWrong(q);
}

function sayBubble(txt) {
  const b = $('#bubble'); if (!b) return;
  b.textContent = txt; b.classList.add('show');
  const pl = $('#player'); pl.classList.remove('cheer'); void pl.offsetWidth; pl.classList.add('cheer');
  clearTimeout(sayBubble.t); sayBubble.t = setTimeout(() => b.classList.remove('show'), 1000);
}

function onCorrect(q, dt) {
  const p = P(), myG = G, first = q.tries === 0;
  if (first) {
    G.streak++; G.best = Math.max(G.best, G.streak); p.stats.bestStreak = Math.max(p.stats.bestStreak, G.streak);
    G.fastest = Math.min(G.fastest, dt); G.times.push(dt);
    if (isRound() && !q.retry) G.firstCorrect++;
  }
  markResult(q, first ? 'ok' : 'meh');
  let xp = first ? 10 : 4, coins = 1;
  if (first && dt < 5) { xp += 5; coins += 1; }
  if (G.streak >= 5) coins += 1;
  G.xp += xp; G.coins += coins;
  if (q.input === 'num') G.answer = String(q.a);
  drawQ('right');
  setFeedback((first && G.streak > 0 && G.streak % 5 === 0) ? `COMBO! ${G.streak} op rij!` : (first ? rnd(PRAISE) : 'Goed zo, nu wel!'), 'good');
  sayBubble(rnd(PRAISE));
  SFX.correct();

  if (G.mode === 'boss') {
    const bi = $('#bossImg');
    const crit = first && dt < 4;
    const dmg = 1 + Math.floor(p.pick / 2) + (crit ? 1 : 0);
    G.bossHp = Math.max(0, G.bossHp - dmg);
    bi.classList.remove('hurt'); void bi.offsetWidth; bi.classList.add('hurt');
    SFX.hit(); burst(bi, blockColors(G.block).concat('#fff'), 14);
    floater(bi, (crit ? 'KRITIEK! ' : '') + '-' + dmg, '#ffd0c8');
    updateHUD();
    if (G.bossHp <= 0) { setTimeout(() => { if (G === myG) finishRound({ win: true }); }, 900); return; }
  } else {
    const mb = $('#mineBlock'), pk = $('#pickImg');
    if (pk) { pk.classList.remove('swing'); void pk.offsetWidth; pk.classList.add('swing'); }
    if (mb) {
      mb.classList.remove('hit'); void mb.offsetWidth; mb.classList.add('hit');
      SFX.dig();
      if (G.mode === 'race') G.crack = (G.crack + 2) % 12;
      else G.crack = Math.min(10, Math.round(G.results.filter(r => r === 'ok' || r === 'meh').length / Math.max(1, G.mainTotal) * 10));
      if (G.mode === 'race' && G.crack >= 10) { SFX.brk(); burst(mb, blockColors(G.block), 24); G.crack = 0; }
      $('#crackImg').src = PX.crack(G.crack);
      burst(mb, blockColors(G.block), 10);
      floater(mb, '+' + xp + ' XP');
      const chance = first ? 0.28 + p.pick * 0.06 + Math.min(G.streak, 10) * 0.02 : 0;
      if (Math.random() < chance) {
        const o = rollOre(p.pick);
        G.ores[o] = (G.ores[o] || 0) + 1;
        setTimeout(() => { floater(mb, img(PX.ore(o)) + ' +1'); SFX.coin(); }, 250);
      }
    }
  }
  if (G.mode === 'race') G.score++;
  updateHUD();
  setTimeout(() => { if (G === myG) nextQ(); }, G.mode === 'race' ? 450 : T_CORRECT);
}

function onWrong(q) {
  const myG = G;
  q.tries++;
  G.streak = 0;
  drawQ('wrong');
  SFX.wrong();
  updateHUD();
  if (G.mode === 'boss') {
    G.hearts--; SFX.hurt();
    const gs = $('#gameScreen'); gs.classList.remove('screen-shake'); void gs.offsetWidth; gs.classList.add('screen-shake');
    document.body.classList.add('flash-red'); setTimeout(() => document.body.classList.remove('flash-red'), 450);
    updateHUD();
    if (G.hearts <= 0) { setTimeout(() => { if (G === myG) finishRound({ win: false }); }, 1200); return; }
  }
  // Volgorde: 3 keer zelf proberen, daarna alleen het volgende blok laten oplichten (nooit alles voorzeggen).
  if (q.type === 'order') {
    if (q.tries >= 3 && !q.helpNext) { helpOrder(q); setFeedback('Kijk, dit blok is de volgende!', 'info'); }
    else setFeedback(q.helpNext ? 'Tik op het blok dat oplicht.' : rnd(TRYAGAIN), 'bad');
    setTimeout(() => { if (G !== myG || G.current !== q || G.done) return; drawQ(); G.locked = false; }, T_RETRY);
    return;
  }
  // Eén extra poging (in de tijdrace onbeperkt). Pas daarna het antwoord.
  if (G.mode === 'race' || q.tries < 2) {
    setFeedback(rnd(TRYAGAIN), 'bad');
    setTimeout(() => {
      if (G !== myG || G.current !== q || G.done) return;
      G.answer = ''; q.picked = undefined; drawQ(); G.locked = false;
      const ch = $('#choices'); if (ch) [...ch.children].forEach(b => b.classList.remove('wrongc'));
    }, T_RETRY);
    return;
  }
  giveUp(q, 'bad', 'Kijk, zo is het goed!');
}

function helpOrder(q) {
  q.helpNext = true;
  markResult(q, 'bad');
  if (isRound() && G.retryCount < 5) { G.retries.push({ ...q, retry: true, tries: 0, placed: [], used: [], helpNext: false }); G.retryCount++; }
  updateHUD();
}

function giveUp(q, mark, text) {
  const myG = G;
  markResult(q, mark);
  if (isRound() && G.retryCount < 5) {
    const again = { ...q, retry: true, tries: 0, placed: [], used: [], tapped: [], picked: undefined };
    G.retries.push(again); G.retryCount++;
  }
  if (q.input === 'num') G.answer = String(q.a);
  if (q.type === 'lineTap') q.tapped = [{ n: q.a, cls: 'show' }];
  if (q.type === 'order') { q.placed = [...q.a]; q.used = q.nums.map(() => true); }
  if (q.type === 'compare') q.picked = undefined;
  drawQ('hint');
  setFeedback(text, 'info');
  const ch = $('#choices'); if (ch) [...ch.children].forEach(b => { if (+b.dataset.choice === q.a) b.classList.add('correct'); });
  updateHUD();
  setTimeout(() => { if (G === myG) nextQ(); }, T_GIVEUP + (q.type === 'order' ? 600 : 0));
}

function useHint() {
  if (!G || G.done || !G.current || G.locked) return;
  const q = G.current;
  if (q.type === 'order') {
    if (q.helpNext) return;
    if (q.tries === 0) record(q, false, 0);
    q.tries = Math.max(q.tries, 1);
    G.hints++; G.streak = 0; P().stats.hints++;
    SFX.hint(); helpOrder(q); drawQ(); setFeedback('Dit blok is de volgende. Zet de rest zelf!', 'info');
    return;
  }
  G.locked = true;
  if (q.tries === 0) record(q, false, 0);
  G.hints++; G.streak = 0; P().stats.hints++;
  SFX.hint();
  giveUp(q, 'bad', 'Zo is het. Onthouden!');
}

function quitRound() {
  if (G) { G.done = true; clearInterval(G.timer); }
  save(); renderHome();
}

function finishRound(extra = {}) {
  if (!G || G.done) return;
  G.done = true; clearInterval(G.timer);
  const p = P(), r = { mode: G.mode, wid: G.wid, stars: 0, newStars: 0, record: false, perfect: false, win: extra.win, newMob: null };
  p.stats.rounds++;
  const avg = G.times.length ? G.times.reduce((a, b) => a + b, 0) / G.times.length : 0;
  r.avg = avg;
  if (isRound()) {
    const acc = G.firstCorrect / G.mainTotal;
    const slow = G.mode === 'world' && W(G.wid).kind !== 'num' ? 10 : 8;   // splitsen is moeilijker: iets meer tijd
    r.stars = acc >= 0.9 && avg <= slow ? 3 : acc >= 0.8 ? 2 : acc >= 0.6 ? 1 : 0;
    r.perfect = G.firstCorrect === G.mainTotal;
    if (r.perfect) { G.coins += 10; G.xp += 25; }
    if (G.mode === 'world') {
      const w = W(G.wid), prev = getStars(p, G.wid, G.lvl), wasOpen = lvOpen(p, w, G.lvl + 1);
      r.lvl = G.lvl;
      if (r.stars > prev) { r.newStars = r.stars - prev; setStars(p, G.wid, G.lvl, r.stars); G.coins += r.newStars * 10; }
      if (G.lvl < maxLv(w) && !wasOpen && lvOpen(p, w, G.lvl + 1)) r.newLv = G.lvl + 1;
      if (r.stars >= 1 && !p.mobs[G.mob]) { p.mobs[G.mob] = today(); r.newMob = G.mob; }
    }
  }
  if (G.mode === 'race') {
    r.score = G.score;
    if (G.score > p.stats.raceBest) { r.record = p.stats.raceBest > 0; p.stats.raceBest = G.score; if (r.record) G.coins += 20; }
  }
  if (G.mode === 'boss') {
    if (extra.win) {
      p.stats.bosses++; G.coins += 50; G.xp += 100; G.ores.diamant = (G.ores.diamant || 0) + 1;
      if (!p.mobs[G.mob]) { p.mobs[G.mob] = today(); r.newMob = G.mob; }
    } else G.coins += 5;
  }
  r.coins = G.coins; r.xp = G.xp; r.ores = { ...G.ores }; r.correct = G.firstCorrect; r.total = G.mainTotal; r.best = G.best; r.hints = G.hints;
  p.coins += G.coins;
  Object.entries(G.ores).forEach(([o, n]) => { p.ores[o] += n; p.found[o] += n; });
  const ups = addXP(p, G.xp);
  save();
  const fresh = checkAch(p, { perfect: r.perfect, fastest: G.fastest, noHint3: r.stars === 3 && G.hints === 0 });
  renderResult(r);
  if (ups) setTimeout(() => showLevelUp(p.level), 1500 + fresh.length * 300);
}

function renderResult(r) {
  const p = P();
  let head, line = '';
  if (isRound()) {
    head = ['Blijf oefenen!', 'Goed gedaan!', 'Heel goed!', 'Fantastisch!'][r.stars];
    line = `${r.correct} van de ${r.total} in één keer goed · gemiddeld ${r.avg.toFixed(1)} sec` + (r.hints ? ` · ${r.hints}× hulp` : '');
  } else if (r.mode === 'race') {
    head = r.record ? 'Nieuw record!' : 'Tijd is om!';
    line = `${r.score} opdrachten goed in 60 seconden · record: ${p.stats.raceBest}`;
  } else {
    head = r.win ? `${PX.MOBS[G.mob].name} verslagen!` : `${PX.MOBS[G.mob].name} won deze keer…`;
    line = r.win ? 'Je bent een echte held!' : 'Oefen nog wat en probeer het opnieuw!';
  }
  const idx = WORLDS.findIndex(w => w.id === r.wid);
  const next = r.mode === 'world' && idx < WORLDS.length - 1 && unlocked(p, idx + 1) ? WORLDS[idx + 1] : null;
  const top = r.mode === 'boss' ? img(PX.mob(G.mob), 'mob', 'style="width:110px;height:110px"') : `<div class="mine-block" id="resBlock" style="width:100px">${img(PX.block(G.block), 'base')}${img(PX.crack(10))}</div>`;
  app.innerHTML = `<div class="screen result">
    <div class="card">
      <div id="resTop">${top}</div>
      <h1>${head}</h1>
      ${isRound() ? `<div class="bigstars">${[1, 2, 3].map(s => img(PX.star(r.stars >= s))).join('')}</div>` : ''}
      <div class="muted">${line}</div>
      ${r.newStars ? `<div style="color:var(--gold-d)">+${r.newStars} nieuwe ster${r.newStars > 1 ? 'ren' : ''}! (+${r.newStars * 10} munten)</div>` : ''}
      ${r.newLv ? `<div class="catch">${img(PX.block('ore_smaragd'))}<div style="text-align:left"><span class="muted small">Nieuw niveau vrijgespeeld!</span><b>Niveau ${r.newLv}: ${NIVEAUS[r.newLv]}</b><span class="small">${r.newLv === 2 ? 'Nu zonder lege vakjes om te tellen.' : 'Nu helemaal zonder blokjes!'}</span></div></div>` : ''}
      ${r.newMob ? `<div class="catch">${img(PX.mob(r.newMob), 'mob')}<div style="text-align:left"><span class="muted small">Nieuwe mob gevangen!</span><b>${PX.MOBS[r.newMob].name}</b><span class="small">Bekijk hem in je Mobboek</span></div></div>` : ''}
      ${r.mode === 'world' && r.stars === 0 && !p.mobs[G.mob] ? `<div class="muted small">Haal minstens 1 ster om ${PX.MOBS[G.mob].name} te vangen!</div>` : ''}
      <div class="rewards">
        <div class="reward">${img(PX.block('grass', 5))}+${r.xp} XP</div>
        <div class="reward">${img(PX.coin())}+${r.coins}</div>
        ${Object.entries(r.ores).map(([o, n]) => `<div class="reward">${img(PX.ore(o))}+${n} ${ORES.find(x => x.id === o).name}</div>`).join('')}
      </div>
      ${r.best >= 5 ? `<div class="small">${img(PX.flame(), '', 'style="width:20px;vertical-align:middle"')} Langste reeks: ${r.best} op rij</div>` : ''}
    </div>
    <div class="row">
      <button class="btn light" data-act="home">◀ Kaart</button>
      <button class="btn gold" data-act="again">↻ Nog een keer</button>
      ${r.newLv ? `<button class="btn green" data-act="playLv" data-w="${r.wid}" data-n="${r.newLv}">Niveau ${r.newLv} ▶</button>` : next ? `<button class="btn green" data-act="play" data-w="${next.id}">Volgende: ${next.name} ▶</button>` : ''}
    </div>
  </div>`;
  G.lastMode = r.mode;
  const rb = $('#resBlock');
  if (rb) setTimeout(() => { if (!rb.isConnected) return; SFX.brk(); burst(rb, blockColors(G.block), 30); rb.style.visibility = 'hidden'; }, 350);
  if (r.mode === 'boss' && r.win) setTimeout(() => { SFX.win(); confetti(80); }, 500);
  if (r.mode === 'boss' && !r.win) SFX.lose();
  if (r.newMob) setTimeout(() => { SFX.coin(); confetti(50); }, 1300);
  document.querySelectorAll('.bigstars img').forEach((el, i) => {
    setTimeout(() => { el.classList.add('in'); if (i < r.stars) SFX.star(i); }, 650 + i * 380);
  });
  if (r.stars === 3 || r.record) setTimeout(() => confetti(70), 1800);
}

function showLevelUp(lvl) {
  SFX.level(); confetti(90);
  const unlocks = Object.entries(MODE_UNLOCK).filter(([m, l]) => l === lvl).map(([m]) => ({ mix: 'Mix-mijn', race: 'Tijdrace', boss: 'Eindbaas' })[m]);
  modal(`<div class="levelup">LEVEL ${lvl}!</div>
    ${avImg(P().avatar, 'big')}
    <div>Je bent nu: <b>${title(lvl)}</b></div>
    ${unlocks.length ? `<div>Nieuw vrijgespeeld: <b>${unlocks.join(', ')}</b></div>` : ''}
    <button class="btn green" data-act="closeModal">Hoera!</button>`);
}

// ================= MOBBOEK =================
function renderMobs() {
  const p = P(), n = Object.keys(p.mobs).length;
  app.innerHTML = `<div class="screen">${topbar('home')}
    <div class="card"><div class="card-head"><h2>Mobboek</h2><span class="muted">${n} van de ${MOB_IDS.length} gevangen</span></div>
      <div class="grid-items">${MOB_IDS.map(id => {
        const got = p.mobs[id];
        return `<div class="slot item ${got ? 'owned' : 'unknown'}">${img(PX.mob(id), 'mob')}<div class="iname">${got ? PX.MOBS[id].name : '???'}</div><div class="muted small">${got ? 'Gevangen!' : mobWhere(id)}</div></div>`;
      }).join('')}</div>
      <p class="muted small" style="margin:14px 0 0">Haal minstens 1 ster in een wereld om de mob van die wereld te vangen. Reuzen en andere eindbazen vang je door ze te verslaan.</p>
    </div></div>`;
}

// ================= WERKBANK =================
function renderCraft() {
  const p = P();
  app.innerHTML = `<div class="screen">${topbar('home')}
    <div class="card"><h2 style="margin-bottom:14px">Jouw kist</h2>
      <div class="grid-items">${ORES.map(o => `<div class="slot item">${img(PX.ore(o.id))}<div class="iname">${o.name}</div><div class="cnt">${p.ores[o.id]}</div></div>`).join('')}</div>
      <p class="muted small" style="margin:12px 0 0">Ertsen vind je door opdrachten in één keer goed te doen. Hoe beter je houweel, hoe meer (en zeldzamere) ertsen.</p>
    </div>
    <div class="card"><h2 style="margin-bottom:14px">Werkbank</h2>
      <div class="grid-items">${PICKS.map((pk, i) => {
        const have = p.pick >= i, nextUp = i === p.pick + 1;
        const can = nextUp && Object.entries(pk.cost || {}).every(([o, n]) => p.ores[o] >= n);
        return `<div class="slot item ${p.pick === i ? 'equipped' : have ? 'owned' : ''}">${img(PX.pickaxe(i))}<div class="iname">${pk.name}</div>
          ${pk.cost ? `<div class="recipe">${Object.entries(pk.cost).map(([o, n]) => `${img(PX.ore(o))}${n}`).join(' &nbsp;')}</div>` : '<div class="recipe muted">start</div>'}
          ${have ? `<div class="small muted">${p.pick === i ? 'In gebruik' : 'Gemaakt'}</div>` : nextUp ? `<button class="btn sm ${can ? 'green' : 'light'}" data-act="doCraft" data-i="${i}" ${can ? '' : 'disabled'}>Maken</button>` : img(PX.lock(), '', 'style="width:26px;height:26px"')}
        </div>`;
      }).join('')}</div>
    </div>
  </div>`;
}

// ================= WINKEL =================
let shopTab = 'hats';
function renderShop() {
  const p = P();
  const tabs = `<div class="tabs"><button class="btn light sm ${shopTab === 'hats' ? 'active' : ''}" data-act="shopTab" data-tab="hats">Hoeden</button>
    <button class="btn light sm ${shopTab === 'pets' ? 'active' : ''}" data-act="shopTab" data-tab="pets">Huisdieren</button></div>`;
  const price = n => `${img(PX.coin(), '', 'style="width:18px;height:18px"')} ${n}`;
  let items;
  if (shopTab === 'hats') {
    items = Object.entries(PX.AV.hats).map(([id, h]) => {
      const own = p.owned.hats.includes(id), on = p.avatar.hat === id;
      return `<div class="slot item ${on ? 'equipped' : own ? 'owned' : ''}">${avImg({ ...p.avatar, hat: id }, '')}<div class="iname">${h.name}</div>
        ${own ? (on ? '<div class="small muted">Op je hoofd</div>' : `<button class="btn sm green" data-act="wearHat" data-id="${id}">Opzetten</button>`)
          : `<button class="btn sm gold" data-act="buy" data-kind="hats" data-id="${id}" ${p.coins >= h.price ? '' : 'disabled'}>${price(h.price)}</button>`}</div>`;
    }).join('');
  } else {
    items = Object.entries(PX.PETS).map(([id, pt]) => {
      const own = p.owned.pets.includes(id), on = p.pet === id;
      return `<div class="slot item ${on ? 'equipped' : own ? 'owned' : ''}">${img(PX.pet(id), 'mob')}<div class="iname">${pt.name}</div>
        ${own ? (on ? `<button class="btn sm light" data-act="petOff">Thuislaten</button>` : `<button class="btn sm green" data-act="petOn" data-id="${id}">Meenemen</button>`)
          : `<button class="btn sm gold" data-act="buy" data-kind="pets" data-id="${id}" ${p.coins >= pt.price ? '' : 'disabled'}>${price(pt.price)}</button>`}</div>`;
    }).join('');
  }
  const again = !!app.querySelector('#shopGrid');
  app.innerHTML = `<div class="screen ${again ? 'noanim' : ''}">${topbar('home')}
    <div class="card"><div class="card-head"><h2>Winkel</h2>${tabs}</div>
    <div class="grid-items" id="shopGrid">${items}</div>
    <p class="muted small" style="margin:12px 0 0">Munten verdien je met goede en snelle antwoorden, reeksen, sterren en prestaties.</p></div>
  </div>`;
  document.querySelectorAll('#shopGrid .avbox img').forEach(i => { i.style.width = '64px'; i.style.height = '64px'; });
}

// ================= PRESTATIES =================
function renderAchs() {
  const p = P(), n = ACH.filter(a => p.ach[a.id]).length;
  app.innerHTML = `<div class="screen">${topbar('home')}
    <div class="card"><div class="card-head"><h2>Prestaties</h2><span class="muted">${n} van de ${ACH.length}</span></div>
    <div class="achs">${ACH.map(a => `<div class="slot ach ${p.ach[a.id] ? '' : 'off'}">${img(a.icon(), 'mob')}<div><div class="an">${a.name}</div><div class="ad">${a.desc}</div></div></div>`).join('')}</div></div>
  </div>`;
}

// ================= VOORTGANG (voor ouders) =================
function heatClass(f) {
  if (!f || f.c + f.w === 0) return 'c0';
  const acc = f.c / (f.c + f.w), avg = f.c ? f.time / f.c : 99;
  return acc < 0.6 ? 'c1' : acc < 0.85 ? 'c2' : avg < 5 ? 'c4' : 'c3';
}
function renderStats() {
  const p = P(), s = p.stats, tot = s.correct + s.wrong;
  const bars = WORLDS.map(w => {
    const ws = p.wstats[w.id], n = ws ? ws.c + ws.w : 0, pct = n ? Math.round(ws.c / n * 100) : 0;
    return `<div class="wbar"><span class="wn">${w.name}</span><span class="bar"><div style="width:${pct}%"></div></span><span class="pct">${n ? pct + '%' : '–'}</span></div>`;
  }).join('');
  let grid = '';
  for (let n = 2; n <= 10; n++) {
    let cells = '';
    for (let k = 0; k <= Math.floor(n / 2); k++) cells += `<span class="cell ${heatClass(p.facts[`s:${n}:${k}`])}">${k}+${n - k}</span>`;
    grid += `<div class="srow"><span class="whole">${n}</span>${cells}</div>`;
  }
  let tens = ''; for (let n = 11; n <= 20; n++) tens += `<span class="cell ${heatClass(p.facts['t:' + n])}">10+${n - 10}</span>`;
  grid += `<div class="srow"><span class="whole">11-20</span>${tens}</div>`;
  const hard = Object.entries(p.facts).filter(([k, f]) => k.startsWith('s:') && f.w > 0)
    .map(([k, f]) => { const [, n, a] = k.split(':').map(Number); return { txt: `${n} = ${a} + ${n - a}`, acc: f.c / (f.c + f.w), n: f.c + f.w }; })
    .sort((a, b) => a.acc - b.acc || b.n - a.n).slice(0, 8);
  app.innerHTML = `<div class="screen">${topbar('home')}
    <div class="statgrid">
      <div class="card"><b>${s.correct}</b>opdrachten goed</div>
      <div class="card"><b>${tot ? Math.round(s.correct / tot * 100) : 0}%</b>in één keer goed</div>
      <div class="card"><b>${s.rounds}</b>rondes</div>
      <div class="card"><b>${s.bestStreak}</b>langste reeks</div>
      <div class="card"><b>${s.raceBest}</b>tijdrace-record</div>
      <div class="card"><b>${s.hints}</b>keer hulp (?)</div>
    </div>
    <div class="card"><h2 style="margin-bottom:10px">Per wereld</h2>
      <p class="muted small" style="margin:0 0 12px">Percentage in één keer goed.</p>${bars}</div>
    <div class="card"><h2 style="margin-bottom:6px">Splitsingen</h2>
      <p class="muted small" style="margin:0 0 12px">Groen gaat goed, rood is nog lastig. 3+4 telt ook voor 4+3.</p>
      <div class="splitgrid">${grid}</div>
      <div class="legend" style="margin-top:12px"><span><i style="background:#e3e8ee"></i>nog niet geoefend</span><span><i style="background:#f2a49c"></i>lastig</span><span><i style="background:#f8d48a"></i>bijna</span><span><i style="background:#b6e3a0"></i>goed</span><span><i style="background:#4caf3a"></i>goed én snel</span></div>
    </div>
    ${hard.length ? `<div class="card"><h2 style="margin-bottom:8px">Oefen deze nog eens</h2><div style="font-size:20px">${hard.map(h => h.txt).join(' &nbsp;·&nbsp; ')}</div>
      <p class="muted small" style="margin:8px 0 0">Deze splitsingen komen vaker langs tot ze goed gaan.</p></div>` : ''}
  </div>`;
}

// ================= INSTELLINGEN =================
function renderSettings() {
  const p = P();
  const again = !!app.querySelector('#settingsCard');
  app.innerHTML = `<div class="screen ${again ? 'noanim' : ''}">${topbar('home')}
    <div class="card" id="settingsCard"><h2 style="margin-bottom:16px">Instellingen</h2>
      <div class="opt-row"><label>Antwoord</label>
        <span class="chip ${p.settings.input === 'keypad' ? 'sel' : ''}" data-act="setInput" data-v="keypad">Zelf typen</span>
        <span class="chip ${p.settings.input === 'choice' ? 'sel' : ''}" data-act="setInput" data-v="choice">Kiezen uit 4</span></div>
      <p class="muted small" style="margin:0 0 16px">Kiezen uit 4 is makkelijker voor beginners. Bij de getallenlijn en volgorde tik je altijd zelf.</p>
      <div class="opt-row"><label>Blokjes</label>
        <span class="chip ${p.settings.dots === 'auto' ? 'sel' : ''}" data-act="setDots" data-v="auto">Per niveau</span>
        <span class="chip ${p.settings.dots === 'on' ? 'sel' : ''}" data-act="setDots" data-v="on">Altijd</span>
        <span class="chip ${p.settings.dots === 'off' ? 'sel' : ''}" data-act="setDots" data-v="off">Nooit</span></div>
      <p class="muted small" style="margin:0 0 16px">Bij splitsen helpen telblokjes. "Per niveau": niveau 1 met blokjes en lege vakjes, niveau 2 alleen de blokjes van het getal dat je al weet, niveau 3 zonder blokjes.</p>
      <div class="opt-row"><label>Geluid</label><span class="chip ${DB.sound ? 'sel' : ''}" data-act="toggleSound">${DB.sound ? 'Aan' : 'Uit'}</span></div>
      <div class="opt-row"><label>Werelden</label><span class="chip ${p.settings.unlockAll ? 'sel' : ''}" data-act="toggleUnlock">${p.settings.unlockAll ? 'Alles open' : 'Vrijspelen met sterren'}</span></div>
      <p class="muted small" style="margin:0 0 16px">Voor ouders: zet alle werelden open om direct te oefenen wat er deze week op school is, bijvoorbeeld "Splits 8 en 9".</p>
      <div class="row" style="justify-content:flex-start">
        <button class="btn light" data-act="editPlayer">${img(PX.avatar(p.avatar))} Poppetje aanpassen</button>
        <button class="btn red" data-act="deletePlayer">Speler wissen</button>
      </div>
    </div>
  </div>`;
}

// ================= ACTIES =================
const ACTIONS = {
  profiles: () => { EDIT = null; renderProfiles(); },
  choose: d => { DB.current = d.id; save(); renderHome(); },
  newPlayer: () => { EDIT = null; renderEditor(false); },
  editPlayer: () => { EDIT = null; renderEditor(true); },
  av: d => { EDIT.av[d.k] = d.k === 'hat' ? d.v : +d.v; SFX.click(); renderEditor(); },
  randomAv: () => {
    const hats = EDIT.id ? DB.profiles.find(x => x.id === EDIT.id).owned.hats : ['geen'];
    EDIT.av = { skin: Math.floor(Math.random() * 5), hairColor: Math.floor(Math.random() * 8), hairStyle: Math.floor(Math.random() * 5), shirt: Math.floor(Math.random() * 8), hat: rnd(hats) };
    renderEditor();
  },
  saveAv: () => {
    const name = (EDIT.name || '').trim();
    if (!name) { $('#nameIn').focus(); toast(PX.book(), 'Even wachten', 'Vul eerst je naam in!'); return; }
    if (EDIT.id) { const p = DB.profiles.find(x => x.id === EDIT.id); p.name = name; p.avatar = EDIT.av; }
    else { const p = newProfile(name, EDIT.av); DB.profiles.push(p); DB.current = p.id; }
    save(); EDIT = null; renderHome();
  },
  home: () => renderHome(),
  play: d => {
    const p = P(), w = W(d.w);
    if (maxLv(w) === 1 || topLv(p, w) === 1) return startRound('world', w.id, 1);
    modal(`<h2>${w.name}</h2><div class="muted">Kies een niveau</div>
      <div class="lvpick">${[1, 2, 3].map(n => {
        const open = lvOpen(p, w, n), st = getStars(p, w.id, n);
        return `<button class="btn ${open ? 'light' : 'light'}" ${open ? `data-act="playLv" data-w="${w.id}" data-n="${n}"` : 'disabled'}>
          <span style="text-align:left;flex:1">Niveau ${n}<small>${NIVEAUS[n]}${open ? '' : ' · haal 2 sterren op niveau ' + (n - 1)}</small></span>
          <span class="stars">${open ? [1, 2, 3].map(s => img(PX.star(st >= s))).join('') : img(PX.lock())}</span></button>`;
      }).join('')}</div>
      <button class="btn light sm" data-act="closeModal">Annuleer</button>`);
  },
  playLv: d => { closeModal(); startRound('world', d.w, +d.n); },
  again: () => G && G.lastMode === 'world' ? startRound('world', G.wid, G.lvl) : startRound(G ? G.lastMode : 'mix'),
  mix: () => startRound('mix'),
  race: () => startRound('race'),
  boss: () => startRound('boss'),
  quit: () => quitRound(),
  hint: () => useHint(),
  lockedWorld: () => { SFX.wrong(); toast(PX.lock(), 'Nog op slot', 'Haal eerst een ster in de vorige wereld!'); },
  lockedMode: d => { SFX.wrong(); toast(PX.lock(), 'Nog op slot', 'Speel verder tot level ' + d.need + '!'); },
  mobs: () => renderMobs(),
  craft: () => renderCraft(),
  doCraft: d => {
    const p = P(), i = +d.i, pk = PICKS[i];
    if (i !== p.pick + 1 || !Object.entries(pk.cost).every(([o, n]) => p.ores[o] >= n)) return;
    Object.entries(pk.cost).forEach(([o, n]) => p.ores[o] -= n);
    p.pick = i; save(); SFX.level(); confetti(40);
    toast(PX.pickaxe(i), 'Gemaakt!', pk.name); checkAch(p); renderCraft();
  },
  shop: () => renderShop(),
  shopTab: d => { shopTab = d.tab; renderShop(); },
  buy: d => {
    const p = P(), cost = d.kind === 'hats' ? PX.AV.hats[d.id].price : PX.PETS[d.id].price;
    if (p.coins < cost || p.owned[d.kind].includes(d.id)) return;
    p.coins -= cost; p.owned[d.kind].push(d.id);
    if (d.kind === 'hats') p.avatar.hat = d.id; else p.pet = d.id;
    save(); SFX.coin(); confetti(30);
    toast(d.kind === 'hats' ? PX.avatar(p.avatar) : PX.pet(d.id), 'Gekocht!', d.kind === 'hats' ? PX.AV.hats[d.id].name : PX.PETS[d.id].name);
    checkAch(p); renderShop();
  },
  wearHat: d => { const p = P(); p.avatar.hat = d.id; save(); SFX.click(); renderShop(); },
  petOn: d => { const p = P(); p.pet = d.id; save(); SFX.click(); renderShop(); },
  petOff: () => { const p = P(); p.pet = null; save(); renderShop(); },
  achs: () => renderAchs(),
  stats: () => renderStats(),
  settings: () => renderSettings(),
  setInput: d => { P().settings.input = d.v; save(); renderSettings(); },
  setDots: d => { P().settings.dots = d.v; save(); renderSettings(); },
  toggleSound: () => { DB.sound = !DB.sound; save(); SFX.click(); if ($('#settingsCard')) renderSettings(); else renderProfiles(); },
  toggleUnlock: () => { const p = P(); p.settings.unlockAll = !p.settings.unlockAll; save(); renderSettings(); },
  deletePlayer: () => modal(`<h2>Speler wissen?</h2><div>Alle sterren, munten, mobs en voortgang van <b>${esc(P().name)}</b> verdwijnen voorgoed.</div>
    <div class="row"><button class="btn light" data-act="closeModal">Nee, toch niet</button><button class="btn red" data-act="reallyDelete">Ja, wissen</button></div>`),
  reallyDelete: () => { DB.profiles = DB.profiles.filter(p => p.id !== DB.current); DB.current = null; save(); closeModal(); renderProfiles(); },
  closeModal: () => closeModal()
};

document.addEventListener('click', e => {
  SFX.unlock();
  const k = e.target.closest('[data-key]'); if (k) { press(k.dataset.key); return; }
  const c = e.target.closest('[data-choice]');
  if (c) { if (G && !G.locked && !c.classList.contains('wrongc')) { SFX.click(); const ok = +c.dataset.choice === G.current.a; c.classList.add(ok ? 'correct' : 'wrongc'); answer(ok); } return; }
  const t = e.target.closest('[data-tapn]'); if (t) { onTap(+t.dataset.tapn); return; }
  const o = e.target.closest('[data-onum]'); if (o) { onOrderTap(+o.dataset.onum, o); return; }
  const pk = e.target.closest('[data-pick]'); if (pk) { onPick(+pk.dataset.pick); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const fn = ACTIONS[a.dataset.act];
  if (fn) { if (!['av', 'choose', 'hint'].includes(a.dataset.act)) SFX.click(); fn(a.dataset); }
});
document.addEventListener('keydown', e => {
  if (!G || G.done || !$('#gameScreen') || !$('#modal').classList.contains('hidden')) return;
  if (/^[0-9]$/.test(e.key)) {
    const ch = $('#choices');
    if (ch) { const b = ch.children[+e.key - 1]; if (b) b.click(); }
    else press(e.key);
  } else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
  else if (e.key === 'Enter') press('ok');
  else if (e.key === '?') useHint();
});

// ================= START =================
try {
  const c = document.createElement('canvas'); c.width = c.height = 180;
  const x = c.getContext('2d'), im = new Image();
  im.onload = () => { x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, 180, 180);
    const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = c.toDataURL(); document.head.appendChild(l); };
  im.src = PX.block('ore_goud', 1);
} catch (e) { }
load();
renderProfiles();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
