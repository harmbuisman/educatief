// TafelMijn – tafels oefenen in een blokkenwereld
'use strict';

// ================= HULPJES =================
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '', extra = '') => `<img class="px ${cls}" src="${src}" alt="" draggable="false" ${extra}>`;
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const avImg = (av, cls = 'av') => `<span class="avbox" style="display:inline-block;line-height:0">${img(PX.avatar(av), cls)}</span>`;

// ================= SPELDATA =================
const WORLDS = [
  { t: 1, name: 'Graswei', block: 'grass', mob: 'paddo' },
  { t: 2, name: 'Woestijn', block: 'sand', mob: 'kever' },
  { t: 10, name: 'Dorp', block: 'planks', mob: 'pompoen' },
  { t: 5, name: 'Grot', block: 'stone', mob: 'vleermuis' },
  { t: 3, name: 'Toendra', block: 'snow', mob: 'sneeuwpop' },
  { t: 4, name: 'Kasteel', block: 'bricks', mob: 'spookje' },
  { t: 6, name: 'IJsberg', block: 'ice', mob: 'wolkje' },
  { t: 7, name: 'Goudmijn', block: 'gold', mob: 'robo' },
  { t: 8, name: 'Vulkaan', block: 'lava', mob: 'lavareus' },
  { t: 9, name: 'Diamantgrot', block: 'diamond', mob: 'kristaldraak' }
];
// Eindbazen: de ladder loopt van makkelijk naar moeilijk. Elke baas heeft een eigen 'rang'.
const BOSS_BLOCK = { golem: 'stone', slijm: 'grass', spin: 'stone', draak: 'lava', cycloop: 'grass', kraken: 'ice', ridder: 'bricks', tovenaar: 'snow' };
const BOSSES = [
  { id: 'rotsreus', mob: 'rotsreus', block: 'stone' }, { id: 'paddo', mob: 'paddo', block: 'grass' }, { id: 'spookje', mob: 'spookje', block: 'bricks' },
  { id: 'ijsreus', mob: 'ijsreus', block: 'ice' }, { id: 'robo', mob: 'robo', block: 'gold' }, { id: 'pompoen', mob: 'pompoen', block: 'planks' },
  { id: 'vleermuis', mob: 'vleermuis', block: 'stone' }, { id: 'goudreus', mob: 'goudreus', block: 'gold' }, { id: 'lavareus', mob: 'lavareus', block: 'lava' },
  { id: 'kristaldraak', mob: 'kristaldraak', block: 'diamond' }, { id: 'schaduwreus', mob: 'schaduwreus', block: 'obsidian' }
];
// De nieuwe bazen komen voor de Schaduwreus; de Oerdraak is de allerlaatste.
const OLD_BOSS_IDS = BOSSES.map(b => b.id);
BOSSES.splice(BOSSES.length - 1, 0, ...PX.BIGBOSSES.filter(b => b.id !== 'oerdraak').map(b => ({ id: b.id, big: true, block: BOSS_BLOCK[b.shape] || 'stone' })));
BOSSES.push({ id: 'oerdraak', big: true, block: 'obsidian' });
BOSSES.forEach((b, i) => b.rank = i);
const bossById = id => BOSSES.find(b => b.id === id) || BOSSES[0];
const bossName = b => b.big ? PX.BIGBOSSES.find(x => x.id === b.id).name : PX.MOBS[b.mob].name;
const bossPic = b => b.big ? PX.bigboss(b.id) : PX.mob(b.mob);
// Moeilijkheid: hoger bij een hogere rang, en nog hoger bij elke herkansing tegen een al verslagen baas.
function bossLevel(p, b) { return b.rank + 4 * ((p.bossWins || {})[b.id] || 0); }
function bossStats(d) {
  return {
    hp: Math.min(12 + 2 * d, 90),
    hearts: d < 8 ? 5 : d < 20 ? 4 : 3,
    secs: d < 3 ? 0 : Math.max(3.5, 11 - 0.2 * (d - 3)),   // 0 = geen aanvalstijd
    stars: d < 8 ? 1 : d < 18 ? 2 : d < 30 ? 3 : d < 42 ? 4 : 5
  };
}
// Kies de volgende baas: eerst nog niet verslagen bazen van de laagste rang, nooit dezelfde als de vorige.
function chooseBoss(p) {
  const wins = p.bossWins || {}, recent = p.bossRecent || [];
  let pool = BOSSES.filter(b => !wins[b.id]);
  if (pool.length) pool = pool.slice(0, 3);
  else pool = [...BOSSES].sort((a, b) => bossLevel(p, a) - bossLevel(p, b)).slice(0, 8);
  let cand = pool.filter(b => !recent.includes(b.id));
  if (!cand.length) cand = pool.filter(b => b.id !== recent[0]);
  if (!cand.length) cand = BOSSES.filter(b => b.id !== recent[0]);
  return rnd(cand).id;
}
function nextBoss(p) { if (!p.nextBoss || !BOSSES.some(b => b.id === p.nextBoss)) { p.nextBoss = chooseBoss(p); save(); } return bossById(p.nextBoss); }
const MOB_IDS = Object.keys(PX.MOBS);
const mobWhere = id => { const w = WORLDS.find(w => w.mob === id); return w ? `Vang in ${w.name} (tafel ${w.t})` : 'Versla als eindbaas'; };
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
const TITLES = [[1, 'Beginner'], [3, 'Graver'], [5, 'Mijnwerker'], [8, 'Bouwer'], [12, 'Ontdekker'], [16, 'Ridder'], [20, 'Tafelkoning'], [30, 'Legende']];
const title = lvl => TITLES.filter(t => lvl >= t[0]).pop()[1];
const xpFor = lvl => 100 + (lvl - 1) * 50;
const PRAISE = ['Goed zo!', 'Top!', 'Super!', 'Knap!', 'Geweldig!', 'Yes!', 'Briljant!', 'Wauw!', 'Lekker bezig!'];
const TRYAGAIN = ['Probeer nog eens!', 'Bijna! Nog een keer.', 'Oeps, kijk nog eens goed.', 'Nog één poging!'];
const MODE_UNLOCK = { mix: 1, race: 2, race5: 2, boss: 3 };
const T_CORRECT = 700, T_GIVEUP = 1300, T_RETRY = 650;

const ACH = [
  { id: 'eerste', name: 'Eerste stapjes', desc: 'Speel je eerste ronde', icon: () => PX.block('grass'), test: p => p.stats.rounds >= 1 },
  { id: 'perfect', name: 'Foutloos!', desc: 'Alles in één keer goed in een ronde', icon: () => PX.star(), test: (p, c) => c && c.perfect },
  { id: 'reeks10', name: 'Op dreef', desc: '10 goed op rij', icon: () => PX.flame(), test: p => p.stats.bestStreak >= 10 },
  { id: 'reeks25', name: 'Niet te stoppen', desc: '25 goed op rij', icon: () => PX.flame(), test: p => p.stats.bestStreak >= 25 },
  { id: 'bliksem', name: 'Bliksemsnel', desc: 'Goed antwoord binnen 2 seconden', icon: () => PX.mob('wolkje'), test: (p, c) => c && c.fastest < 2 },
  { id: 'ster3', name: 'Sterrenjager', desc: '3 sterren bij een tafel', icon: () => PX.star(), test: p => Object.values(p.stars).some(s => s >= 3) },
  { id: 'alle1', name: 'Wereldreiziger', desc: 'Minstens 1 ster bij alle tafels', icon: () => PX.block('grass', 2), test: p => WORLDS.every(w => (p.stars[w.t] || 0) >= 1) },
  { id: 'alle3', name: 'Tafelkampioen', desc: '3 sterren bij alle tafels', icon: () => PX.trophy(), test: p => WORLDS.every(w => (p.stars[w.t] || 0) >= 3) },
  { id: 'mob1', name: 'Eerste vangst', desc: 'Vang je eerste mob', icon: () => PX.mob('paddo'), test: p => Object.keys(p.mobs).length >= 1 },
  { id: 'mob7', name: 'Mobverzamelaar', desc: 'Vang 7 verschillende mobs', icon: () => PX.mob('spookje'), test: p => Object.keys(p.mobs).length >= 7 },
  { id: 'moball', name: 'Mobmeester', desc: 'Vang alle mobs', icon: () => PX.mob('kristaldraak'), test: p => MOB_IDS.every(id => p.mobs[id]) },
  { id: 'lvl5', name: 'Mijnwerker', desc: 'Bereik level 5', icon: () => PX.pickaxe(1), test: p => p.level >= 5 },
  { id: 'lvl10', name: 'Meesterbouwer', desc: 'Bereik level 10', icon: () => PX.block('bricks'), test: p => p.level >= 10 },
  { id: 'lvl20', name: 'Legende', desc: 'Bereik level 20', icon: () => PX.block('diamond'), test: p => p.level >= 20 },
  { id: 'goed100', name: 'Honderd!', desc: '100 sommen goed', icon: () => PX.coin(), test: p => p.stats.correct >= 100 },
  { id: 'goed500', name: 'Rekenmachine', desc: '500 sommen goed', icon: () => PX.mob('robo'), test: p => p.stats.correct >= 500 },
  { id: 'goed1000', name: 'Rekenreus', desc: '1000 sommen goed', icon: () => PX.trophy(), test: p => p.stats.correct >= 1000 },
  { id: 'diamant', name: 'Diamanten!', desc: 'Vind een diamant', icon: () => PX.ore('diamant'), test: p => p.found.diamant >= 1 },
  { id: 'smaragd', name: 'Zeldzame vondst', desc: 'Vind een smaragd', icon: () => PX.ore('smaragd'), test: p => p.found.smaragd >= 1 },
  { id: 'baas1', name: 'Reuzendoder', desc: 'Versla een eindbaas', icon: () => PX.sword(2), test: p => p.stats.bosses >= 1 },
  { id: 'baas5', name: 'Held van de mijn', desc: 'Versla 5 eindbazen', icon: () => PX.sword(4), test: p => p.stats.bosses >= 5 },
  { id: 'baas15', name: 'Bazenjager', desc: 'Versla 15 verschillende eindbazen', icon: () => PX.bigboss('vuurdraak'), test: p => Object.keys(p.bossWins || {}).length >= 15 },
  { id: 'baasall', name: 'Koning van de bazen', desc: 'Versla alle eindbazen', icon: () => PX.bigboss('oerdraak'), test: p => BOSSES.every(b => (p.bossWins || {})[b.id]) },
  { id: 'race5', name: 'Marathon', desc: '100 goed in de 5-minutenrace', icon: () => PX.clock(), test: p => p.stats.race5Best >= 100 },
  { id: 'race20', name: 'Racer', desc: '20 goed in de tijdrace', icon: () => PX.clock(), test: p => p.stats.raceBest >= 20 },
  { id: 'race35', name: 'Turbo', desc: '35 goed in de tijdrace', icon: () => PX.clock(), test: p => p.stats.raceBest >= 35 },
  { id: 'huisdier', name: 'Beste vriendje', desc: 'Koop een huisdier', icon: () => PX.pet('kuiken'), test: p => p.owned.pets.length >= 1 },
  { id: 'diahouweel', name: 'Glimmend gereedschap', desc: 'Maak het diamanten houweel', icon: () => PX.pickaxe(4), test: p => p.pick >= 4 },
  { id: 'zelf', name: 'Zelf gedaan', desc: 'Een ronde zonder de ?-knop met 3 sterren', icon: () => PX.book(), test: (p, c) => c && c.noHint3 }
];

// ================= OPSLAG =================
const SAVE = 'tafelmijn_v1';
let DB;
function newProfile(name, avatar) {
  return {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, avatar,
    xp: 0, level: 1, coins: 0, pick: 0,
    ores: { kolen: 0, ijzer: 0, goud: 0, robijn: 0, diamant: 0, smaragd: 0 },
    found: { kolen: 0, ijzer: 0, goud: 0, robijn: 0, diamant: 0, smaragd: 0 },
    stars: {}, best: {}, facts: {}, ach: {}, mobs: {},
    owned: { hats: ['geen'], pets: [] }, pet: null,
    stats: { rounds: 0, correct: 0, wrong: 0, hints: 0, bosses: 0, bestStreak: 0, raceBest: 0, race5Best: 0 },
    bossWins: {}, bossRecent: [], nextBoss: null,
    settings: { input: 'keypad', unlockAll: false }
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
    // oude spelers: bazen die al verslagen waren (vaste volgorde) tellen mee
    if (p.stats.bosses > 0 && !Object.keys(p.bossWins).length) OLD_BOSS_IDS.slice(0, Math.min(p.stats.bosses, OLD_BOSS_IDS.length)).forEach(id => p.bossWins[id] = 1);
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

// ================= SPELER-LOGICA =================
function unlocked(p, i) { return p.settings.unlockAll || i === 0 || (p.stars[WORLDS[i - 1].t] || 0) >= 1; }
function unlockedTables(p) { return WORLDS.filter((w, i) => unlocked(p, i)).map(w => w.t); }
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
      <div class="counter" title="Sterren">${img(PX.star())}${Object.values(p.stars).reduce((a, b) => a + b, 0)}/30</div>
      <div class="counter" title="Mobs gevangen">${img(PX.mob('paddo'))}${Object.keys(p.mobs).length}/${MOB_IDS.length}</div>
    </div>
  </div>`;
}

// ================= SCHERM: PROFIELEN =================
function renderProfiles() {
  G = null; setBiome('grass');
  app.innerHTML = `<div class="screen">
    <div class="logo">Tafel<span class="accent">Mijn</span></div>
    <div class="subtitle">Hak blokken · vang mobs · word een tafelkoning!</div>
    <div class="mobparade">${['paddo', 'spookje', 'robo', 'pompoen', 'vleermuis', 'sneeuwpop'].map(m => img(PX.mob(m), 'mob')).join('')}</div>
    <div class="card"><h2 style="margin-bottom:14px">Wie gaat er spelen?</h2>
      <div class="profiles">
        ${DB.profiles.map(p => `<div class="slot pcard" data-act="choose" data-id="${p.id}">
            ${avImg(p.avatar)}<div class="pname">${esc(p.name)}</div><div class="muted small">Level ${p.level} · ${title(p.level)}</div></div>`).join('')}
        <div class="slot pcard new" data-act="newPlayer">${avImg({ skin: 1, hairColor: 2, hairStyle: 0, shirt: 2, hat: 'geen' })}<div class="pname">+ Nieuwe speler</div><div class="muted small">Maak je eigen poppetje</div></div>
      </div>
    </div>
    <div class="row"><button class="btn light sm" data-act="toggleSound">${DB.sound ? '🔊 Geluid aan' : '🔇 Geluid uit'}</button></div>
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
  const nb = nextBoss(p), nbs = bossStats(bossLevel(p, nb));
  const modes = [
    { act: 'mix', icon: PX.block('obsidian'), name: 'Mix-mijn', desc: '15 sommen uit al je werelden', cls: 'purple' },
    { act: 'race', icon: PX.clock(), name: 'Tijdrace 1 min', desc: `Zoveel mogelijk in 60 sec · record ${p.stats.raceBest}`, cls: 'gold' },
    { act: 'race5', icon: PX.clock(), name: 'Tijdrace 5 min', desc: `Houd het 5 minuten vol · record ${p.stats.race5Best}`, cls: 'gold' },
    { act: 'boss', icon: bossPic(nb), name: 'Eindbaas', desc: `${bossName(nb)} · ${'★'.repeat(nbs.stars)}${'☆'.repeat(5 - nbs.stars)}`, cls: 'red' }
  ];
  app.innerHTML = `<div class="screen">
    ${topbar()}
    <div class="card">
      <h2 style="margin-bottom:14px">Kies een wereld</h2>
      <div class="worlds">
        ${WORLDS.map((w, i) => {
          const open = unlocked(p, i), st = p.stars[w.t] || 0;
          return `<div class="world ${open ? '' : 'locked'}" data-act="${open ? 'play' : 'lockedWorld'}" data-t="${w.t}">
            ${open && st === 0 ? '<span class="badge">NIEUW</span>' : ''}
            <div class="blkwrap">${img(PX.block(w.block), 'blk')}${img(PX.mob(w.mob), 'guard mob')}${open ? '' : img(PX.lock(), 'lockicon')}</div>
            <div class="tnum">Tafel ${w.t}</div><div class="wname">${w.name}</div>
            <div class="stars">${[1, 2, 3].map(s => img(PX.star(st >= s))).join('')}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="modes">
      ${modes.map(m => {
        const need = MODE_UNLOCK[m.act], ok = p.level >= need;
        return `<button class="btn ${ok ? m.cls : 'light'} mode" data-act="${ok ? m.act : 'lockedMode'}" data-need="${need}">${img(ok ? m.icon : PX.lock(), ok && m.act === 'boss' ? 'mob bossicon' : '')}<span>${m.name}<small>${ok ? m.desc : 'Vanaf level ' + need}</small></span></button>`;
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
const mkQ = (t, m, idx, retry = false) => ({ t, m, a: t * m, idx, retry, tries: 0, hinted: false });
const isRound = () => G && (G.mode === 'tafel' || G.mode === 'mix');
function pickFact(tables) {
  const p = P(), items = [];
  tables.forEach(t => { for (let m = 1; m <= 10; m++) {
    const key = t + 'x' + m, f = p.facts[key];
    let w = 1;
    if (!f) w = 2;
    else { const n = f.c + f.w; w = 1 + 5 * (f.w / Math.max(1, n)) + (n < 3 ? 1 : 0) + (f.c ? Math.min(2, (f.time / f.c) / 4) : 0); }
    if (G && G.last === key) w = 0;
    items.push([t, m, w]);
  } });
  let r = Math.random() * items.reduce((a, b) => a + b[2], 0);
  for (const it of items) { r -= it[2]; if (r <= 0) return it; }
  return items[0];
}

function startRound(mode, table) {
  const p = P();
  if (!p) return renderProfiles();
  const tables = mode === 'tafel' ? [table] : unlockedTables(p);
  G = { mode, table, tables, queue: [], retries: [], results: [], streak: 0, best: 0, coins: 0, xp: 0, ores: {}, fastest: 99, times: [],
    firstCorrect: 0, hints: 0, answer: '', locked: true, crack: 0, score: 0, retryCount: 0, done: false };
  if (mode === 'tafel') G.queue = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map((m, i) => mkQ(table, m, i));
  if (mode === 'mix') { for (let i = 0; i < 15; i++) { const [t, m] = pickFact(tables); G.last = t + 'x' + m; G.queue.push(mkQ(t, m, i)); } }
  G.mainTotal = G.queue.length;
  if (mode === 'tafel') { const w = WORLDS.find(w => w.t === table); G.block = w.block; G.mob = w.mob; }
  if (mode === 'mix') { G.block = 'obsidian'; G.mob = rnd(unlockedTables(p).map(t => WORLDS.find(w => w.t === t).mob)); }
  if (mode === 'race') { G.block = 'planks'; G.mob = 'wolkje'; G.raceSecs = 60; }
  if (mode === 'race5') { G.mode = mode = 'race'; G.race5 = true; G.block = 'gold'; G.mob = 'robo'; G.raceSecs = 300; }
  if (mode === 'boss') {
    const b = nextBoss(p), st = bossStats(bossLevel(p, b));
    G.boss = b; G.bossSt = st; G.block = b.block; G.mob = b.mob || 'robo'; G.hearts = st.hearts; G.maxHearts = st.hearts;
    G.bossMax = st.hp; G.bossHp = G.bossMax; G.bossSecs = st.secs;
    p.bossRecent = [b.id, ...(p.bossRecent || []).filter(x => x !== b.id)].slice(0, 4);
    p.nextBoss = null; save();   // na dit gevecht (winst of verlies) komt er een andere baas
  }
  setBiome(G.block);
  renderGame();
  if (mode === 'race') {
    G.endAt = Date.now() + G.raceSecs * 1000;
    G.timer = setInterval(() => {
      const left = Math.max(0, G.endAt - Date.now()), s = Math.ceil(left / 1000);
      const bar = $('#raceBar'); if (bar) { bar.style.width = (left / G.raceSecs / 10) + '%'; $('#raceTxt').textContent = (G.raceSecs > 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' sec') + ' · ' + G.score + ' goed'; }
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
  if (isRound()) { top = `<div class="progress" id="progress"></div>`; right = mine; }
  else if (G.mode === 'race') { top = `<div class="timerbar" style="flex:1;min-width:200px"><div id="raceBar" style="width:100%"></div><span id="raceTxt">${G.raceSecs > 60 ? '5:00' : '60 sec'}</span></div>`; right = mine; }
  else {
    top = `<div class="hearts" id="hearts"></div>`;
    top += `<span class="lvchip">${'★'.repeat(G.bossSt.stars)}${'☆'.repeat(5 - G.bossSt.stars)}</span>`;
    right = `<div class="boss-wrap"><div class="boss-name">${bossName(G.boss)}</div>
      ${img(bossPic(G.boss), 'boss-img mob', 'id="bossImg"')}<div class="hpbar"><div id="hpBar" style="width:100%"></div><span id="hpTxt"></span></div></div>`;
  }
  const input = p.settings.input === 'choice'
    ? `<div class="choices" id="choices"></div>`
    : `<div class="keypad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => `<button class="btn light" data-key="${n}">${n}</button>`).join('')}
        <button class="btn red" data-key="del">⌫</button><button class="btn light" data-key="0">0</button><button class="btn green" data-key="ok">OK</button></div>`;
  app.innerHTML = `<div class="screen game" id="gameScreen">
    <div class="game-top"><button class="btn light sm" data-act="quit">✕ Stop</button>${top}</div>
    <div class="stage">
      <div class="side"><div class="player" id="player">
        <div class="bubble" id="bubble"></div><div class="streak" id="streak"></div>${avImg(p.avatar)}${p.pet ? img(PX.pet(p.pet), 'petimg mob') : ''}</div></div>
      <div class="qcol"><div class="card question" id="question"><div class="sum" id="sum"></div>
        <div class="qfoot"><div class="speedbar"><div id="speed"></div></div>
          <button class="btn gold hintbtn" data-act="hint" title="Help: vul het antwoord in">?</button></div>
        <div class="feedback" id="feedback"></div></div></div>
      <div class="side">${right}</div>
    </div>
    ${input}
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
    st.title = G.streak >= 2 ? G.streak + ' op rij' : '';
    const pl = $('#player'); if (pl) pl.classList.toggle('onfire', G.streak >= 2);
  }
  const h = $('#hearts'); if (h) h.innerHTML = Array.from({ length: G.maxHearts || 5 }, (_, i) => img(PX.heart(i < G.hearts))).join('');
  const hp = $('#hpBar'); if (hp) { hp.style.width = (G.bossHp / G.bossMax * 100) + '%'; $('#hpTxt').textContent = G.bossHp + ' / ' + G.bossMax; }
}

function showSum(state) {
  const q = G.current, el = $('#sum'), qq = $('#question');
  if (!el) return;
  qq.className = 'card question' + (state ? ' ' + state : '');
  el.innerHTML = `${q.m}<span class="op">×</span>${q.t}<span class="op">=</span><span class="ans ${!G.answer ? 'empty' : ''}">${G.answer || '?'}</span>`;
}
function setFeedback(txt, cls = '') { const fb = $('#feedback'); if (fb) { fb.className = 'feedback ' + cls; fb.textContent = txt; } }

function choicesFor(q) {
  const set = new Set([q.a]);
  const c = shuffle([q.t * (q.m + 1), q.t * (q.m - 1), (q.t + 1) * q.m, (q.t - 1) * q.m, q.a + 1, q.a - 1, q.a + 2, q.a + 10, q.a - 10, q.a + q.t]);
  c.forEach(v => { if (set.size < 4 && v > 0 && v !== q.a) set.add(v); });
  let k = 3; while (set.size < 4) set.add(q.a + k++);
  return shuffle([...set]);
}

function startSpeedbar() {
  const sp = $('#speed'); if (!sp) return;
  const secs = G && G.mode === 'boss' && G.bossSecs ? G.bossSecs : 6;
  sp.classList.toggle('danger', !!(G && G.mode === 'boss' && G.bossSecs));
  sp.style.transition = 'none'; sp.style.width = '100%';
  requestAnimationFrame(() => requestAnimationFrame(() => { sp.style.transition = `width ${secs}s linear`; sp.style.width = '0%'; }));
  armBoss();
}
// Sterkere bazen vallen aan als je te lang nadenkt.
function armBoss() {
  if (!G) return;
  clearTimeout(G.bossTO);
  if (G.mode !== 'boss' || !G.bossSecs || G.done) return;
  const myG = G, q = G.current;
  G.bossTO = setTimeout(() => {
    if (G !== myG || G.done || G.current !== q || G.locked) return;
    G.locked = true;
    if (q.tries === 0) recordFact(q, false, G.bossSecs);
    q.tries = 2; G.streak = 0;
    G.hearts--; SFX.hurt();
    const gs = $('#gameScreen'); gs.classList.remove('screen-shake'); void gs.offsetWidth; gs.classList.add('screen-shake');
    document.body.classList.add('flash-red'); setTimeout(() => document.body.classList.remove('flash-red'), 450);
    const bi = $('#bossImg'); if (bi) floater(bi, 'AANVAL!', '#ffd0c8');
    updateHUD();
    if (G.hearts <= 0) { G.answer = String(q.a); showSum('hint'); setTimeout(() => { if (G === myG) finishRound({ win: false }); }, 1200); return; }
    giveUp(q, 'bad', `Te laat! ${q.m} × ${q.t} = ${q.a}`);
  }, G.bossSecs * 1000);
}

function nextQ() {
  if (!G || G.done) return;
  let q;
  if (isRound()) {
    q = G.queue.shift() || G.retries.shift();
    if (!q) return finishRound();
  } else {
    const [t, m] = pickFact(G.tables); q = mkQ(t, m, 0);
  }
  G.current = q; G.last = q.t + 'x' + q.m; G.answer = ''; G.locked = false; G.qStart = performance.now();
  showSum();
  setFeedback(q.retry ? 'Deze komt nog een keer terug!' : '', 'info');
  startSpeedbar();
  const ch = $('#choices');
  if (ch) ch.innerHTML = choicesFor(q).map(v => `<button class="btn light" data-choice="${v}">${v}</button>`).join('');
  updateHUD();
}

function press(k) {
  if (!G || G.locked || !G.current) return;
  SFX.click();
  if (k === 'del') G.answer = G.answer.slice(0, -1);
  else if (k === 'ok') { if (G.answer) submit(+G.answer); return; }
  else if (G.answer.length < 3) G.answer += k;
  showSum();
  if (G.answer.length >= String(G.current.a).length) submit(+G.answer);
}

function recordFact(q, ok, dt) {
  const p = P(), key = q.t + 'x' + q.m;
  const f = p.facts[key] || (p.facts[key] = { c: 0, w: 0, time: 0 });
  if (ok) { f.c++; f.time += Math.min(dt, 20); p.stats.correct++; } else { f.w++; p.stats.wrong++; }
}

function markResult(q, val) { if (isRound() && !q.retry && !G.results[q.idx]) G.results[q.idx] = val; }

function submit(val, btn) {
  if (!G || G.locked || !G.current) return;
  G.locked = true; clearTimeout(G.bossTO);
  const q = G.current, dt = (performance.now() - G.qStart) / 1000, ok = val === q.a;
  // alleen de eerste poging telt mee voor de statistieken
  if (q.tries === 0) recordFact(q, ok, dt);
  if (btn) btn.classList.add(ok ? 'correct' : 'wrongc');
  ok ? onCorrect(q, dt) : onWrong(q, btn);
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
  if (first && dt < 4) { xp += 5; coins += 1; }
  if (G.streak >= 5) coins += 1;
  G.xp += xp; G.coins += coins;
  showSum('right');
  setFeedback((first && G.streak > 0 && G.streak % 5 === 0) ? `COMBO! ${G.streak} op rij!` : (first ? rnd(PRAISE) + (dt < 3 ? ' Snel!' : '') : 'Goed zo, nu wel!'), 'good');
  sayBubble(rnd(PRAISE));
  SFX.correct();

  if (G.mode === 'boss') {
    const bi = $('#bossImg');
    const crit = first && dt < 3;
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
  setTimeout(() => { if (G === myG) nextQ(); }, G.mode === 'race' ? 380 : T_CORRECT);
}

function onWrong(q, btn) {
  const myG = G;
  q.tries++;
  G.streak = 0;
  showSum('wrong');
  SFX.wrong();
  updateHUD();
  if (G.mode === 'boss') {
    G.hearts--; SFX.hurt();
    const gs = $('#gameScreen'); gs.classList.remove('screen-shake'); void gs.offsetWidth; gs.classList.add('screen-shake');
    document.body.classList.add('flash-red'); setTimeout(() => document.body.classList.remove('flash-red'), 450);
    updateHUD();
    if (G.hearts <= 0) { setTimeout(() => { if (G === myG) finishRound({ win: false }); }, 1200); return; }
  }
  // Tijdrace: altijd opnieuw proberen. Anders: één extra poging.
  if (G.mode === 'race' || q.tries < 2) {
    setFeedback(rnd(TRYAGAIN), 'bad');
    setTimeout(() => {
      if (G !== myG || G.current !== q || G.done) return;
      G.answer = ''; showSum(); G.locked = false; startSpeedbar();
    }, T_RETRY);
    return;
  }
  // Tweede keer fout: antwoord kort laten zien en snel door.
  giveUp(q, 'bad', `Het was ${q.m} × ${q.t} = ${q.a}`);
}

function giveUp(q, mark, text) {
  const myG = G;
  markResult(q, mark);
  if (isRound() && G.retryCount < 6) { G.retries.push(mkQ(q.t, q.m, q.idx, true)); G.retryCount++; }
  G.answer = String(q.a); showSum('hint');
  setFeedback(text, 'info');
  const ch = $('#choices'); if (ch) [...ch.children].forEach(b => { if (+b.dataset.choice === q.a) b.classList.add('correct'); });
  updateHUD();
  setTimeout(() => { if (G === myG) nextQ(); }, T_GIVEUP);
}

function useHint() {
  if (!G || G.done || !G.current || G.locked) return;
  const q = G.current;
  G.locked = true; clearTimeout(G.bossTO);
  if (q.tries === 0) recordFact(q, false, 0);
  q.hinted = true; G.hints++; G.streak = 0;
  P().stats.hints++;
  SFX.hint();
  giveUp(q, 'bad', `${q.m} × ${q.t} = ${q.a}. Onthouden!`);
}

function blockColors(type) {
  return ({ grass: ['#5d9b3a', '#866043', '#6aaa40'], sand: ['#dbd3a0', '#cfc590'], planks: ['#a2824e', '#6e5530'], stone: ['#7d7d7d', '#5f5f5f'], snow: ['#fff', '#e3ecf2', '#866043'], bricks: ['#9b4f3c', '#b8aaa0'], ice: ['#9cc4f5', '#e4f1ff'], gold: ['#f6d32b', '#fff3a0'], lava: ['#f06a12', '#ffd34d'], diamond: ['#5fe0dc', '#fff'], obsidian: ['#2c1a42', '#5a3a86'] })[type] || ['#888', '#666'];
}

function quitRound() {
  if (G) { G.done = true; clearInterval(G.timer); clearTimeout(G.bossTO); }
  save(); renderHome();
}

function finishRound(extra = {}) {
  if (!G || G.done) return;
  G.done = true; clearInterval(G.timer); clearTimeout(G.bossTO);
  const p = P(), r = { mode: G.mode, table: G.table, stars: 0, newStars: 0, record: false, perfect: false, win: extra.win, newMob: null };
  p.stats.rounds++;
  const avg = G.times.length ? G.times.reduce((a, b) => a + b, 0) / G.times.length : 0;
  r.avg = avg;
  if (isRound()) {
    const acc = G.firstCorrect / G.mainTotal;
    r.stars = acc >= 0.9 && avg <= 6 ? 3 : acc >= 0.8 ? 2 : acc >= 0.6 ? 1 : 0;
    r.perfect = G.firstCorrect === G.mainTotal;
    if (r.perfect) { G.coins += 10; G.xp += 25; }
    if (G.mode === 'tafel') {
      const prev = p.stars[G.table] || 0;
      if (r.stars > prev) { r.newStars = r.stars - prev; p.stars[G.table] = r.stars; G.coins += r.newStars * 10; }
      p.best[G.table] = Math.max(p.best[G.table] || 0, G.firstCorrect);
      if (r.stars >= 1 && !p.mobs[G.mob]) { p.mobs[G.mob] = today(); r.newMob = G.mob; }
    }
  }
  if (G.mode === 'race') {
    r.score = G.score; r.race5 = !!G.race5;
    const key = G.race5 ? 'race5Best' : 'raceBest';
    if (G.score > p.stats[key]) { r.record = p.stats[key] > 0; p.stats[key] = G.score; if (r.record) G.coins += G.race5 ? 60 : 20; }
    if (G.race5) G.coins += Math.floor(G.score / 5);
  }
  if (G.mode === 'boss') {
    const b = G.boss, st = G.bossSt;
    r.boss = b;
    if (extra.win) {
      const firstWin = !p.bossWins[b.id];
      p.bossWins[b.id] = (p.bossWins[b.id] || 0) + 1;
      p.stats.bosses++; G.coins += 30 + 20 * st.stars; G.xp += 60 + 40 * st.stars; G.ores.diamant = (G.ores.diamant || 0) + 1;
      if (st.stars >= 4) G.ores.smaragd = (G.ores.smaragd || 0) + 1;
      r.firstWin = firstWin;
      if (b.mob && !p.mobs[b.mob]) { p.mobs[b.mob] = today(); r.newMob = b.mob; }
    } else G.coins += 5;
    p.nextBoss = chooseBoss(p);
    r.next = bossById(p.nextBoss);
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
    line = r.race5 ? `${r.score} sommen goed in 5 minuten · record: ${p.stats.race5Best}` : `${r.score} sommen goed in 60 seconden · record: ${p.stats.raceBest}`;
  } else {
    head = r.win ? `${bossName(r.boss)} verslagen!` : `${bossName(r.boss)} won deze keer…`;
    line = (r.win ? (r.firstWin ? 'Nieuwe eindbaas verslagen! Je bent een echte held!' : 'Weer gewonnen!') : 'Oefen nog wat en probeer het opnieuw!')
      + ` <br>Volgende eindbaas: <b>${bossName(r.next)}</b> ${'★'.repeat(bossStats(bossLevel(p, r.next)).stars)}`;
  }
  const idx = WORLDS.findIndex(w => w.t === r.table);
  const next = r.mode === 'tafel' && idx < WORLDS.length - 1 && unlocked(p, idx + 1) ? WORLDS[idx + 1] : null;
  const top = r.mode === 'boss' ? img(bossPic(r.boss), 'mob', 'style="width:110px;height:110px"') : `<div class="mine-block" id="resBlock" style="width:100px">${img(PX.block(G.block), 'base')}${img(PX.crack(10))}</div>`;
  app.innerHTML = `<div class="screen result">
    <div class="card">
      <div id="resTop">${top}</div>
      <h1>${head}</h1>
      ${isRound() ? `<div class="bigstars">${[1, 2, 3].map(s => img(PX.star(r.stars >= s))).join('')}</div>` : ''}
      <div class="muted">${line}</div>
      ${r.newStars ? `<div style="color:var(--gold-d)">+${r.newStars} nieuwe ster${r.newStars > 1 ? 'ren' : ''}! (+${r.newStars * 10} munten)</div>` : ''}
      ${r.newMob ? `<div class="catch">${img(PX.mob(r.newMob), 'mob')}<div style="text-align:left"><span class="muted small">Nieuwe mob gevangen!</span><b>${PX.MOBS[r.newMob].name}</b><span class="small">Bekijk hem in je Mobboek</span></div></div>` : ''}
      ${r.mode === 'tafel' && r.stars === 0 && !p.mobs[G.mob] ? `<div class="muted small">Haal minstens 1 ster om ${PX.MOBS[G.mob].name} te vangen!</div>` : ''}
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
      ${next ? `<button class="btn green" data-act="play" data-t="${next.t}">Volgende: tafel ${next.t} ▶</button>` : ''}
    </div>
  </div>`;
  G.lastMode = r.race5 ? 'race5' : r.mode;
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
  const unlocks = Object.entries(MODE_UNLOCK).filter(([m, l]) => l === lvl).map(([m]) => ({ mix: 'Mix-mijn', race: 'Tijdrace', race5: 'Tijdrace 5 min', boss: 'Eindbaas' })[m]);
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
    </div>
    <div class="card"><div class="card-head"><h2>Eindbazen</h2><span class="muted">${Object.keys(p.bossWins).length} van de ${BOSSES.length} verslagen</span></div>
      <div class="grid-items">${BOSSES.map(b => {
        const w = p.bossWins[b.id], st = bossStats(bossLevel(p, b)).stars;
        return `<div class="slot item ${w ? 'owned' : 'unknown'}">${img(bossPic(b), 'mob')}<div class="iname">${w ? bossName(b) : '???'}</div><div class="muted small">${'★'.repeat(st)}${w ? ' · ' + w + '× verslagen' : ''}</div></div>`;
      }).join('')}</div>
      <p class="muted small" style="margin:14px 0 0">Hoe meer sterren, hoe sterker de baas: meer levens, minder hartjes en minder tijd per som. Versla je een baas nog een keer, dan wordt hij sterker.</p>
    </div></div>`;
}

// ================= WERKBANK =================
function renderCraft() {
  const p = P();
  app.innerHTML = `<div class="screen">${topbar('home')}
    <div class="card"><h2 style="margin-bottom:14px">Jouw kist</h2>
      <div class="grid-items">${ORES.map(o => `<div class="slot item">${img(PX.ore(o.id))}<div class="iname">${o.name}</div><div class="cnt">${p.ores[o.id]}</div></div>`).join('')}</div>
      <p class="muted small" style="margin:12px 0 0">Ertsen vind je door sommen in één keer goed te hakken. Hoe beter je houweel, hoe meer (en zeldzamere) ertsen.</p>
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
      <p class="muted small" style="margin:12px 0 0">Elk beter houweel geeft meer ertskans. Met ijzer en diamant doe je ook meer schade tegen een eindbaas.</p>
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

// ================= VOORTGANG =================
function renderStats() {
  const p = P();
  let cells = '<div class="hd">×</div>' + Array.from({ length: 10 }, (_, i) => `<div class="hd">${i + 1}</div>`).join('');
  const hard = [];
  for (let t = 1; t <= 10; t++) {
    cells += `<div class="hd">${t}</div>`;
    for (let m = 1; m <= 10; m++) {
      const f = p.facts[t + 'x' + m];
      let c = 'c0';
      if (f && f.c + f.w > 0) {
        const acc = f.c / (f.c + f.w), avg = f.c ? f.time / f.c : 99;
        c = acc < 0.6 ? 'c1' : acc < 0.85 ? 'c2' : avg < 4 ? 'c4' : 'c3';
        if (f.w) hard.push({ t, m, acc, n: f.c + f.w });
      }
      cells += `<div class="${c}" title="${m} × ${t}">${t * m}</div>`;
    }
  }
  hard.sort((a, b) => a.acc - b.acc || b.n - a.n);
  const s = p.stats, tot = s.correct + s.wrong;
  app.innerHTML = `<div class="screen">${topbar('home')}
    <div class="statgrid">
      <div class="card"><b>${s.correct}</b>sommen goed</div>
      <div class="card"><b>${tot ? Math.round(s.correct / tot * 100) : 0}%</b>in één keer goed</div>
      <div class="card"><b>${s.rounds}</b>rondes</div>
      <div class="card"><b>${s.bestStreak}</b>langste reeks</div>
      <div class="card"><b>${s.raceBest}</b>record 1 min</div>
      <div class="card"><b>${s.race5Best}</b>record 5 min</div>
      <div class="card"><b>${Object.keys(p.bossWins).length}/${BOSSES.length}</b>eindbazen verslagen</div>
      <div class="card"><b>${s.hints}</b>keer hulp (?)</div>
    </div>
    <div class="card"><h2 style="margin-bottom:6px">Tafelkaart</h2>
      <p class="muted small" style="margin:0 0 12px">Elke rij is een tafel. Groen gaat goed, rood is nog lastig. Alleen de eerste poging telt.</p>
      <div class="heat">${cells}</div>
      <div class="legend" style="margin-top:12px"><span><i style="background:#e3e8ee"></i>nog niet geoefend</span><span><i style="background:#f2a49c"></i>lastig</span><span><i style="background:#f8d48a"></i>bijna</span><span><i style="background:#b6e3a0"></i>goed</span><span><i style="background:#4caf3a"></i>goed én snel</span></div>
    </div>
    ${hard.length ? `<div class="card"><h2 style="margin-bottom:8px">Oefen deze nog eens</h2><div style="font-size:20px">${hard.slice(0, 8).map(h => `${h.m} × ${h.t} = ${h.t * h.m}`).join(' &nbsp;·&nbsp; ')}</div>
      <p class="muted small" style="margin:8px 0 0">Deze sommen komen in Mix-mijn, Tijdrace en het eindbaas-gevecht vaker langs.</p></div>` : ''}
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
      <p class="muted small" style="margin:0 0 16px">Kiezen uit 4 is makkelijker voor beginners. Zelf typen is beter om de tafels echt uit je hoofd te leren.</p>
      <div class="opt-row"><label>Geluid</label><span class="chip ${DB.sound ? 'sel' : ''}" data-act="toggleSound">${DB.sound ? 'Aan' : 'Uit'}</span></div>
      <div class="opt-row"><label>Werelden</label><span class="chip ${p.settings.unlockAll ? 'sel' : ''}" data-act="toggleUnlock">${p.settings.unlockAll ? 'Alles open' : 'Vrijspelen met sterren'}</span></div>
      <p class="muted small" style="margin:0 0 16px">Voor ouders: zet alle werelden open als je kind een bepaalde tafel moet oefenen.</p>
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
  play: d => startRound('tafel', +d.t),
  again: () => G && G.lastMode === 'tafel' ? startRound('tafel', G.table) : startRound(G ? G.lastMode : 'mix'),
  mix: () => startRound('mix'),
  race: () => startRound('race'),
  race5: () => startRound('race5'),
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
  const c = e.target.closest('[data-choice]'); if (c) { if (!c.classList.contains('wrongc')) { SFX.click(); submit(+c.dataset.choice, c); } return; }
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
// iPad-icoon voor 'Zet op beginscherm' (getekend in code, geen los plaatje nodig)
try {
  const c = document.createElement('canvas'); c.width = c.height = 180;
  const x = c.getContext('2d'), im = new Image();
  im.onload = () => { x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, 180, 180);
    const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = c.toDataURL(); document.head.appendChild(l); };
  im.src = PX.block('grass', 1);
} catch (e) { }
load();
renderProfiles();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
