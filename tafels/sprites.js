// TafelMijn – eigen pixel-art, volledig in code getekend (geen externe plaatjes nodig)
const PX = (() => {
  const cache = {};

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hashStr(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }

  function make(key, w, h, draw) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, (x, y, col) => { if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } });
    cache[key] = c.toDataURL();
    return cache[key];
  }

  function fromMap(key, rows, pal) {
    return make(key, rows[0].length, rows.length, (g, p) => {
      rows.forEach((r, y) => [...r].forEach((ch, x) => p(x, y, pal[ch])));
    });
  }

  // ---------- BLOKKEN ----------
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const DIRT = ['#866043', '#79553a', '#966c4a', '#6b4b32'];
  const STONE = ['#7d7d7d', '#858585', '#707070', '#8f8f8f', '#7a7a7a'];

  const blockDraw = {
    grass(p, r) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pick(r, DIRT));
      const G = ['#5d9b3a', '#6aaa40', '#4f8a30', '#7bbb4c'];
      for (let x = 0; x < 16; x++) {
        const d = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.25 ? 1 : 0);
        for (let y = 0; y < d; y++) p(x, y, pick(r, G));
      }
    },
    dirt(p, r) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pick(r, DIRT)); },
    sand(p, r) {
      const S = ['#dbd3a0', '#e3dbb0', '#cfc590', '#d8cf9a', '#e8e0b8'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pick(r, S));
    },
    stone(p, r) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pick(r, STONE));
      for (let i = 0; i < 10; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 16); p(x, y, '#5f5f5f'); p(x + 1, y, '#666'); }
    },
    snow(p, r) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pick(r, DIRT));
      const W = ['#f4f8fb', '#ffffff', '#e3ecf2'];
      for (let x = 0; x < 16; x++) {
        const d = 4 + (r() < 0.5 ? 1 : 0) + (r() < 0.3 ? 2 : 0);
        for (let y = 0; y < d; y++) p(x, y, pick(r, W));
      }
    },
    planks(p, r) {
      const P = ['#a2824e', '#9c7b47', '#b08f5a', '#a6864f'];
      for (let y = 0; y < 16; y++) {
        const board = Math.floor(y / 4);
        const seam = board % 2 ? 4 : 11;
        for (let x = 0; x < 16; x++) {
          let c = pick(r, P);
          if (y % 4 === 3) c = '#6e5530';
          else if (x === seam) c = '#7d6138';
          p(x, y, c);
        }
      }
    },
    bricks(p, r) {
      const B = ['#9b4f3c', '#a85a45', '#8f4636', '#b0604a'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const row = Math.floor(y / 4);
        let c = pick(r, B);
        if (y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7) c = r() < 0.5 ? '#b8aaa0' : '#a99b91';
        p(x, y, c);
      }
    },
    ice(p, r) {
      const I = ['#9cc4f5', '#a8cdf7', '#8fb9ee', '#b3d6fa'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = pick(r, I);
        if ((x + y) % 7 === 0 && r() < 0.8) c = '#e4f1ff';
        p(x, y, c);
      }
    },
    gold(p, r) {
      const Y = ['#f6d32b', '#fbe35a', '#e9bf1e', '#f8da3e'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = pick(r, Y);
        if (x === 0 || y === 0) c = '#fff3a0';
        if (x === 15 || y === 15) c = '#c49a10';
        p(x, y, c);
      }
      for (let i = 2; i < 6; i++) p(i, 2, '#fffbe0');
    },
    lava(p, r) {
      const L = ['#d84a0e', '#f06a12', '#e85a10', '#c33a08'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pick(r, L));
      for (let i = 0; i < 14; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); p(x, y, '#ffb21c'); p(x + 1, y, '#ffd34d'); p(x, y + 1, '#ff9a1c'); }
    },
    diamond(p, r) {
      const D = ['#5fe0dc', '#76ece6', '#4cc9c4', '#68e6e0'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = pick(r, D);
        if (x === 0 || y === 0) c = '#c8fffc';
        if (x === 15 || y === 15) c = '#2e9e99';
        p(x, y, c);
      }
      for (let i = 2; i < 7; i++) p(i, 2, '#ffffff');
      p(2, 3, '#ffffff'); p(2, 4, '#ffffff');
    },
    obsidian(p, r) {
      const O = ['#1b1027', '#26163a', '#120a1c', '#2c1a42'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, r() < 0.06 ? '#5a3a86' : pick(r, O));
    },
    chestblock(p, r) {
      blockDraw.planks(p, r);
      for (let x = 0; x < 16; x++) { p(x, 6, '#3d2a14'); p(x, 0, '#3d2a14'); p(x, 15, '#3d2a14'); }
      for (let y = 0; y < 16; y++) { p(0, y, '#3d2a14'); p(15, y, '#3d2a14'); }
      for (let y = 5; y < 9; y++) for (let x = 7; x < 9; x++) p(x, y, '#d9d9d9');
    }
  };

  const ORE_COLORS = {
    kolen: ['#2a2a2a', '#3f3f3f'], ijzer: ['#d8af93', '#e8c7b0'], goud: ['#fcee4b', '#e6c227'],
    robijn: ['#e0213a', '#ff5a6a'], diamant: ['#4fe3dc', '#a8fffa'], smaragd: ['#17dd62', '#7affaa']
  };

  function block(type, seed = 1) {
    const key = 'b_' + type + '_' + seed;
    return make(key, 16, 16, (g, p) => {
      const r = rng(hashStr(type) + seed * 7919);
      if (type.startsWith('ore_')) {
        blockDraw.stone(p, r);
        const [c1, c2] = ORE_COLORS[type.slice(4)];
        const spots = [[3, 3], [10, 2], [6, 8], [12, 10], [2, 12], [8, 13]];
        spots.forEach(([x, y]) => { p(x, y, c1); p(x + 1, y, c2); p(x, y + 1, c2); if (r() < 0.6) p(x + 1, y + 1, c1); });
      } else (blockDraw[type] || blockDraw.stone)(p, r);
    });
  }

  // Scheuren voor het "hakken" van een blok (0..10)
  const crackPixels = (() => {
    const r = rng(4242), pts = [];
    for (let w = 0; w < 7; w++) {
      let x = 7 + Math.floor(r() * 3) - 1, y = 7 + Math.floor(r() * 3) - 1;
      const dx = r() < 0.5 ? -1 : 1, dy = r() < 0.5 ? -1 : 1;
      for (let s = 0; s < 14; s++) {
        pts.push([x, y]);
        if (r() < 0.55) x += dx; else y += dy;
        if (r() < 0.2) x -= dx;
        if (x < 0 || y < 0 || x > 15 || y > 15) break;
      }
    }
    return pts;
  })();
  function crack(stage) {
    return make('crack_' + stage, 16, 16, (g, p) => {
      const n = Math.floor(crackPixels.length * Math.min(stage, 10) / 10);
      for (let i = 0; i < n; i++) p(crackPixels[i][0], crackPixels[i][1], 'rgba(20,12,8,0.75)');
    });
  }

  // ---------- GEREEDSCHAP ----------
  const TIER_COLORS = ['#a07a45', '#8a8a8a', '#d8d8d8', '#f5d33a', '#4fe3dc'];
  function pickaxe(tier) {
    return make('pick_' + tier, 16, 16, (g, p) => {
      const col = TIER_COLORS[tier];
      for (let x = 2; x <= 10; x++) { const y = 14 - (x - 1); p(x, y, x % 2 ? '#6b4a22' : '#8a6331'); p(x - 1, y, '#3e2a12'); }
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const cx = x + 0.5 - 1, cy = 15 - (y + 0.5);
        const d = Math.hypot(cx, cy), a = Math.atan2(cy, cx) * 180 / Math.PI;
        if (d > 10.2 && d < 13.2 && Math.abs(a - 45) < 40) {
          p(x, y, d > 12.2 ? shade(col, 0.35) : d < 11.2 ? shade(col, -0.35) : col);
        }
      }
    });
  }
  function sword(tier) {
    return make('sword_' + tier, 16, 16, (g, p) => {
      const col = TIER_COLORS[tier];
      for (let i = 0; i < 9; i++) { p(5 + i, 10 - i, col); p(6 + i, 10 - i, shade(col, 0.4)); p(5 + i, 11 - i, shade(col, -0.35)); }
      [[3, 10], [4, 11], [5, 12], [6, 13], [7, 14]].forEach(([x, y]) => p(x, y, '#3e2a12'));
      p(3, 12, '#8a6331'); p(2, 13, '#6b4a22'); p(1, 14, '#3e2a12');
    });
  }

  // ---------- ITEMS ----------
  const GEM = ['..kkkk..', '.kwccck.', 'kwcccCCk', 'kcccCCCk', '.kcCCCk.', '..kCCk..', '...kk...'];
  function ore(name) {
    const [c1, c2] = ORE_COLORS[name];
    return fromMap('ore_' + name, GEM, { k: '#1a1a1a', w: '#ffffff', c: c2, C: c1 });
  }
  const heart = (full = true) => fromMap('heart_' + full, [
    '.kk.kk.', 'krrkrrk', 'krwrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'
  ], { k: '#2a0a0a', r: full ? '#e0263a' : '#555', w: full ? '#ff9aa4' : '#777' });
  const coin = () => fromMap('coin', [
    '..kkkk..', '.koyyyok', 'koywyyyk', 'koywyyyk', 'koyyyyyk', 'koyyyyok', '.kooook.', '..kkkk..'
  ].map(r => r.padEnd(8, '.').slice(0, 8)), { k: '#5a3d00', o: '#d9a400', y: '#ffd93b', w: '#fff6b0' });
  const star = (on = true) => fromMap('star_' + on, [
    '....k....', '...kyk...', '...kyk...', 'kkkkyykkk', 'kyyyywyyk', '.kyyyyyk.', '..kyyyk..', '.kyykyyk.', '.kkk.kkk.'
  ], { k: on ? '#6b4b00' : '#333', y: on ? '#ffd23b' : '#6c6c6c', w: on ? '#fff7c0' : '#8a8a8a' });
  const flame = () => fromMap('flame', [
    '...r....', '..ro.r..', '..roor..', '.rooyor.', '.royyyor', 'rroyyyor', '.roywyor', '..rooor.'
  ], { r: '#d8320e', o: '#ff8a1c', y: '#ffd34d', w: '#fff6c0' });
  const chest = () => fromMap('chest', [
    '.kkkkkkkkkk.', 'kbbbbbbbbbbk', 'kbBbbbbbbBbk', 'kkkkkyykkkkk', 'kbbbbyybbbbk', 'kbBbbbbbbBbk', 'kbbbbbbbbbbk', '.kkkkkkkkkk.'
  ], { k: '#2e1c08', b: '#a0702f', B: '#7a5221', y: '#e6e6e6' });
  const trophy = () => fromMap('trophy', [
    'kkkkkkkkkk', 'kyyyyyyyyk', 'ykywyyyyky', 'ykyyyyyyky', '.kyyyyyyk.', '..kyyyyk..', '...kyyk...', '....yy....', '...kyyk...', '..kkkkkk..'
  ], { k: '#6b4b00', y: '#ffd23b', w: '#fff7c0' });
  const clock = () => fromMap('clock', [
    '..kkkk..', '.kwwwwk.', 'kwwkwwwk', 'kwwkwwwk', 'kwwkkkwk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'
  ], { k: '#222', w: '#f2f2f2' });
  const book = () => fromMap('book', [
    '.kkkkkkkk.', 'kbbbbbbbwk', 'kbyyyybbwk', 'kbbbbbbbwk', 'kbyyybbbwk', 'kbbbbbbbwk', 'kbbbbbbbwk', '.kkkkkkkk.'
  ], { k: '#1d1d3a', b: '#4b4bc8', y: '#ffd23b', w: '#eee' });
  const gear = () => fromMap('gear', [
    '...kk...', '.k.kk.k.', '..kggk..', 'kkg..gkk', 'kkg..gkk', '..kggk..', '.k.kk.k.', '...kk...'
  ], { k: '#444', g: '#9a9a9a' });
  const lock = () => fromMap('lock', [
    '..kkkk..', '.k....k.', '.k....k.', 'kkkkkkkk', 'kyyyyyyk', 'kyyykyyk', 'kyyykyyk', 'kkkkkkkk'
  ], { k: '#2a2a2a', y: '#c9a227' });

  // ---------- BAAS: Rotsreus ----------
  const BOSS_THEMES = [
    { s: '#8a8a8a', S: '#5f5f5f', r: '#ff3b2f', name: 'Rotsreus' },
    { s: '#a9d2ff', S: '#6f9fd8', r: '#2040ff', name: 'IJsreus' },
    { s: '#7a3020', S: '#4a1a10', r: '#ffd000', name: 'Lavareus' },
    { s: '#e9c22a', S: '#b08d10', r: '#7a00ff', name: 'Goudreus' },
    { s: '#2c1a42', S: '#140a20', r: '#2cffd0', name: 'Schaduwreus' }
  ];
  function boss(theme) {
    const t = BOSS_THEMES[theme % BOSS_THEMES.length];
    return fromMap('boss_' + theme, [
      '..ssssssss..', '.sSssssssSs.', 'ssssssssssss', 'sskksssskkss', 'sskrssssrkss', 'ssssssssssss',
      'sSssssssssSs', 'sskkkkkkkkss', 'sskwkwwkwkss', 'ssssssssssss', '.sSssssssSs.', '..ss....ss..'
    ], { s: t.s, S: t.S, k: '#141414', r: t.r, w: '#f2f2f2' });
  }


  // ---------- MOBS (eigen ontwerpen) ----------
  const MOBS = {
    paddo: { name: 'Paddo', rows: ['....rrrrrr....', '..rrrwwrrrrr..', '.rrwwrrrrwwrr.', 'rrrrrrrrrwwrrr', 'rwwrrrrrrrrrwr', 'rrrrrrwwrrrrrr', '.RRRRRRRRRRRR.', '...ssssssss...', '...skksskks...', '...ssssssss...', '...sssmmsss...', '...ssssssss...', '....SssssS....', '....ss..ss....'],
      pal: { r: '#d93a2b', R: '#9e2219', w: '#fff4e6', s: '#f1dcb8', S: '#cdb48c', k: '#2b1d14', m: '#b5523b' } },
    kever: { name: 'Kristalkever', rows: ['..k........k..', '...k......k...', '....cccccc....', '...cCwccCcc...', '..cCcccCcccc..', '.ccccCccCcccc.', '.cCccccccCccc.', '.bbbbbbbbbbbb.', 'bbwkbbbbbbwkbb', 'bbkkbbbbbbkkbb', '.bbbbbbbbbbbb.', 'l.l.l....l.l.l'],
      pal: { k: '#222', c: '#76ece6', C: '#3fb8b2', w: '#fff', b: '#4a3a7a', l: '#2a2040' } },
    pompoen: { name: 'Pompoenkop', rows: ['......gg......', '.....gg.......', '..oooooooooo..', '.oOooOooOooOo.', 'ooOooOooOooOoo', 'ooyyoOooOyyooo', 'oOyyoOooOyyOoo', 'ooOooOooOooOoo', 'oOyyyyyyyyyyOo', 'ooOyoyoyoyOooo', '.oOooOooOooOo.', '..oooooooooo..'],
      pal: { o: '#f08a1c', O: '#c4661a', g: '#3fae49', y: '#ffe14d' } },
    vleermuis: { name: 'Vleermuis', rows: ['...p......p...', '...pp....pp...', '...pppppppp...', 'P..pykppkyp..P', 'PP.pppppppp.PP', 'PPPppwppwppPPP', 'PPPPppppppPPPP', 'PP.PPppppPP.PP', 'P...PppppP...P', '.....pppp.....', '......pp......'],
      pal: { p: '#7b4fb8', P: '#4a2a7a', y: '#ffe14d', k: '#1a1a1a', w: '#ffffff' } },
    sneeuwpop: { name: 'Sneeuwpop', rows: ['....kkkkkk....', '....kkkkkk....', '..kkkkkkkkkk..', '....wwwwww....', '...wwkwwkww...', '...wwwoowww...', '...wwwkkwww...', '..rrrrrrrrrr..', '..wwwwwwrrww..', '.wwwwkwwrrwww.', '.wwwwwwwwwwww.', '.wwwwkwwwwwww.', '..wwwwwwwwww..'],
      pal: { k: '#2a2a2a', w: '#f4f8fb', o: '#ff8a1c', r: '#e0263a' } },
    spookje: { name: 'Spookje', rows: ['....wwwwww....', '..wwwwwwwwww..', '.wwwwwwwwwwww.', '.wwwwwwwwwwww.', 'wwwkkwwwwkkwww', 'wwwkkwwwwkkwww', 'wwppwwwwwwppww', 'wwwwwwkkwwwwww', 'wwwwwwkkwwwwww', 'wwwwwwwwwwwwww', 'wwwwwwwwwwwwww', 'gwwwwwwwwwwwwg', 'gg.www..www.gg', 'g...w....w...g'],
      pal: { w: '#f4f7ff', g: '#c9d2e6', k: '#2a2a40', p: '#ffb3c8' } },
    wolkje: { name: 'Bliksemwolk', rows: ['...wwww..www..', '..wwwwwwwwwww.', '.wwwwwwwwwwwww', 'wwwwwwwwwwwwww', 'wwwkkwwwwkkwww', 'wwwkkwwwwkkwww', 'wwwwwwkkwwwwww', '.gggggggggggg.', '...y....y.....', '..yy...yy.....', '...y....y.....', '..y....y......'],
      pal: { w: '#e8eef5', g: '#9aa8b8', k: '#2a2a40', y: '#ffd23b' } },
    robo: { name: 'Robo', rows: ['......r.......', '......g.......', '..gggggggggg..', '..gGGGGGGGGg..', '..gGccGGccGg..', '..gGccGGccGg..', '..gGGGGGGGGg..', '..gGGkkkkGGg..', '..gggggggggg..', '...dddddddd...', '.ggdbbbbbbdgg.', '.g.dbbyybbd.g.', '...dddddddd...', '...dd....dd...'],
      pal: { r: '#e0263a', g: '#b8c2cc', G: '#8a96a3', c: '#4fe3dc', k: '#2b2b2b', d: '#5a6470', b: '#3a7bd5', y: '#ffd23b' } },
    lavareus: { name: 'Lavareus', golem: 2 },
    kristaldraak: { name: 'Kristaldraak', rows: ['.r......r.', '.gg....gg.', '.gggggggg.', '.gykggkyg.', '.gggggggg.', '.ggwggwgg.', 'GGggggggGG', 'G.gGGGGg.G', '..gggggg..', '..gg..gg..'],
      pal: { g: '#5fd6e0', G: '#2e8fa0', r: '#b47bff', y: '#ffd23b', k: '#222', w: '#fff' } },
    rotsreus: { name: 'Rotsreus', golem: 0 },
    ijsreus: { name: 'IJsreus', golem: 1 },
    goudreus: { name: 'Goudreus', golem: 3 },
    schaduwreus: { name: 'Schaduwreus', golem: 4 }
  };
  const mob = id => { const m = MOBS[id]; if (!m) return ''; return m.golem !== undefined ? boss(m.golem) : fromMap('mob_' + id, m.rows, m.pal); };


  // ---------- EXTRA EINDBAZEN: vormen x kleuren ----------
  // b = lijf, B = schaduw, e = ogen, a = accent, k = zwart, w = wit, s = huid
  const BOSS_SHAPES = {
    golem: ['..bbbbbbbb..', '.bBbbbbbbBb.', 'bbbbbbbbbbbb', 'bbkkbbbbkkbb', 'bbkebbbbekbb', 'bbbbbbbbbbbb',
      'bBbbbbbbbbBb', 'bbkkkkkkkkbb', 'bbkwkwwkwkbb', 'bbbbbbbbbbbb', '.bBbbbbbbBb.', '..bb....bb..'],
    slijm: ['....a.aa.a....', '....aaaaaa....', '...bbbbbbbb...', '..bbbbbbbbbb..', '.bbwkbbbbwkbb.', '.bbkkbbbbkkbb.',
      'bbbbbbbbbbbbbb', 'bbbbbkkkkbbbbb', 'bbbbbbeebbbbbb', 'BbbbbbbbbbbbbB', 'BBbbbbbbbbbbBB', '.BBBBBBBBBBBB.'],
    spin: ['k............k', '.k..bbbbbb..k.', '..kbbbbbbbbk..', 'kk.bbebbebb.kk', '..kbBbbbbBbk..', '.k.bbbbbbbb.k.',
      'k..bbBbbBbb..k', '..k.bbbbbb.k..', '.k...w..w...k.', 'k............k'],
    draak: ['.a..........a.', '.aa........aa.', '..bbbbbbbbbb..', '.bbbbbbbbbbbb.', '.bbebbbbbbebb.', '.bbkbbbbbbkbb.',
      '.bbbbbbbbbbbb.', 'bbbbbbbbbbbbbb', 'bBkbbbbbbbbkBb', 'bbbbbbbbbbbbbb', 'BBwBwBwwBwBwBB', '.BBBBBBBBBBBB.'],
    cycloop: ['.....aaaa.....', '...bbbbbbbb...', '..bbbbbbbbbb..', '.bbbbwwwwbbbb.', '.bbbwwkkwwbbb.', '.bbbwwkkwwbbb.',
      '.bbbbwwwwbbbb.', '.bbbbbbbbbbbb.', '.bbbkkkkkkbbb.', '.bbbkwkkwkbbb.', '..bbbbbbbbbb..', '..BBB....BBB..'],
    kraken: ['....bbbbbb....', '..bbbbbbbbbb..', '.bbbbbbbbbbbb.', '.bbbaabbaabbb.', '.bwwbbbbbbwwb.', '.bwebbbbbbweb.',
      '.bbbbbbbbbbbb.', '..bbbbkkbbbb..', '..bbbbbbbbbb..', '.bb.bb..bb.bb.', 'b..b..bb..b..b', 'b..b.b..b.b..b', '.B..B....B..B.'],
    ridder: ['......aa......', '.....aaaa.....', '...bbbbbbbb...', '..bbbbbbbbbb..', '..bBBBBBBBBb..', '..bkkkkkkkkb..',
      '..bkekkkkekb..', '..bkkkkkkkkb..', '..bBBBBBBBBb..', '..bbbBbbBbbb..', '..bbbBbbBbbb..', '...bbbbbbbb...', '.BBBBBBBBBBBB.'],
    tovenaar: ['.......a......', '......aaa.....', '.....aaaaa....', '....aawaaaa...', '...aaaaaaaaa..', '.aaaaaaaaaaaa.',
      '...ssssssss...', '...sesssses...', '...ssssssss...', '..wwwwwwwwww..', '..wwwwwwwwww..', '.bbwwwwwwwwbb.', '.bbbwwwwwwbbb.', '.bbbbbwwbbbbb.']
  };
  const C = (b, B, e, a, extra = {}) => ({ b, B, e, a, ...extra });
  const BIGBOSSES = [
    { id: 'slijmkoning', name: 'Slijmkoning', shape: 'slijm', c: C('#5cc22c', '#3a8a1a', '#2b5a12', '#ffd23b') },
    { id: 'grotspin', name: 'Grotspin', shape: 'spin', c: C('#6b4b32', '#4a321f', '#ff3b2f', '#ffd23b') },
    { id: 'moerascycloop', name: 'Moerascycloop', shape: 'cycloop', c: C('#6f9a3a', '#4c6e24', '#ff3b2f', '#8a5a2a') },
    { id: 'inktvis', name: 'Paarse Inktvis', shape: 'kraken', c: C('#9a5ad8', '#6a3aa0', '#2b2b3a', '#f07ab0') },
    { id: 'bosdraak', name: 'Bosdraak', shape: 'draak', c: C('#3fae49', '#24802c', '#ffd23b', '#a8e070') },
    { id: 'ijzerridder', name: 'IJzeren Ridder', shape: 'ridder', c: C('#b8c2cc', '#7f8a96', '#ff3b2f', '#e0263a') },
    { id: 'sneeuwtovenaar', name: 'Sneeuwtovenaar', shape: 'tovenaar', c: C('#3a7bd5', '#244f8f', '#4fe3dc', '#6aa8ff', { s: '#f6d2b4', w: '#f4f8fb' }) },
    { id: 'koperreus', name: 'Koperreus', shape: 'golem', c: C('#c87a3a', '#8a4f1e', '#4fe3dc', '#000') },
    { id: 'ijsslijm', name: 'IJsslijm', shape: 'slijm', c: C('#9cc4f5', '#6f9fd8', '#244f8f', '#e4f1ff') },
    { id: 'gifspin', name: 'Gifspin', shape: 'spin', c: C('#3fae49', '#24602c', '#ffd23b', '#000') },
    { id: 'ijscycloop', name: 'IJscycloop', shape: 'cycloop', c: C('#a9d2ff', '#6f9fd8', '#2040ff', '#e4f1ff') },
    { id: 'rodekraken', name: 'Rode Kraken', shape: 'kraken', c: C('#e0453a', '#a02a20', '#ffd23b', '#ffb3a8') },
    { id: 'vuurdraak', name: 'Vuurdraak', shape: 'draak', c: C('#e0453a', '#9e2219', '#ffd23b', '#ff9a1c') },
    { id: 'goudridder', name: 'Gouden Ridder', shape: 'ridder', c: C('#f6d32b', '#c49a10', '#3a7bd5', '#3a7bd5') },
    { id: 'giftovenaar', name: 'Giftovenaar', shape: 'tovenaar', c: C('#3fae49', '#24802c', '#d8ff4a', '#2c6b2c', { s: '#c9e0a0', w: '#d8d8d8' }) },
    { id: 'smaragdreus', name: 'Smaragdreus', shape: 'golem', c: C('#17b85a', '#0e7a3a', '#ffffff', '#000') },
    { id: 'toverslijm', name: 'Toverslijm', shape: 'slijm', c: C('#c06ae0', '#8a3aa8', '#4a1a6a', '#4fe3dc') },
    { id: 'lavaspin', name: 'Lavaspin', shape: 'spin', c: C('#2c1a1a', '#140a0a', '#ff9a1c', '#000', { k: '#f06a12', w: '#ffd34d' }) },
    { id: 'nachtcycloop', name: 'Nachtcycloop', shape: 'cycloop', c: C('#4a2a7a', '#2c1a42', '#ffd23b', '#b47bff') },
    { id: 'diepzeekraken', name: 'Diepzeekraken', shape: 'kraken', c: C('#1d3a5a', '#10243a', '#4fe3dc', '#4fe3dc') },
    { id: 'schaduwdraak', name: 'Schaduwdraak', shape: 'draak', c: C('#2c1a42', '#140a20', '#ff3b2f', '#7a00ff') },
    { id: 'zwarteridder', name: 'Zwarte Ridder', shape: 'ridder', c: C('#3a3a46', '#1d1d24', '#ff3b2f', '#e0263a') },
    { id: 'vuurtovenaar', name: 'Vuurtovenaar', shape: 'tovenaar', c: C('#e0453a', '#9e2219', '#ffd23b', '#f06a12', { s: '#f6d2b4', w: '#ffd34d' }) },
    { id: 'kristalreus', name: 'Kristalreus', shape: 'golem', c: C('#5fe0dc', '#2e8fa0', '#ffffff', '#000') },
    { id: 'goudslijm', name: 'Goudslijm', shape: 'slijm', c: C('#f6d32b', '#c49a10', '#6a4a00', '#e0263a') },
    { id: 'spookspin', name: 'Spookspin', shape: 'spin', c: C('#e8eef5', '#9aa8b8', '#7a00ff', '#000', { k: '#c9d2e6' }) },
    { id: 'vuurcycloop', name: 'Vuurcycloop', shape: 'cycloop', c: C('#d84a0e', '#8a2a08', '#ffd23b', '#ffd34d') },
    { id: 'diamantdraak', name: 'Diamantdraak', shape: 'draak', c: C('#5fe0dc', '#2e8fa0', '#7a00ff', '#ffffff') },
    { id: 'diamantridder', name: 'Diamanten Ridder', shape: 'ridder', c: C('#4fe3dc', '#2e9fa0', '#ffffff', '#7a00ff') },
    { id: 'oertovenaar', name: 'Oertovenaar', shape: 'tovenaar', c: C('#2c1a42', '#140a20', '#2cffd0', '#7a00ff', { s: '#b8aaa0', w: '#e8e8e8' }) },
    { id: 'obsidiaanreus', name: 'Obsidiaanreus', shape: 'golem', c: C('#1b1027', '#0a0612', '#ff2cd0', '#000', { k: '#5a3a86', w: '#ff2cd0' }) },
    { id: 'oerdraak', name: 'Oerdraak', shape: 'draak', c: C('#f6d32b', '#1d1d24', '#e0263a', '#e0263a') }
  ];
  function bigboss(id) {
    const b = BIGBOSSES.find(x => x.id === id); if (!b) return '';
    const c = b.c;
    return fromMap('bb_' + id, BOSS_SHAPES[b.shape], { b: c.b, B: c.B, e: c.e, a: c.a, k: c.k || '#141414', w: c.w || '#f2f2f2', s: c.s || '#f6d2b4' });
  }

  // ---------- HUISDIEREN ----------
  const PETS = {
    kuiken: { name: 'Kuikentje', price: 100, rows: ['..........', '...yyyy...', '..yyyyyy..', '..ykyyky..', '..yyooyy..', '.yyyyyyyy.', 'yYyyyyyyYy', '.yyyyyyyy.', '..yyyyyy..', '...o..o...'], pal: { y: '#ffe14d', Y: '#e6b800', k: '#222', o: '#ff8c1a' } },
    konijn: { name: 'Konijn', price: 150, rows: ['..w....w..', '..wp..pw..', '..wp..pw..', '..wwwwww..', '.wwwwwwww.', '.wkwwwwkw.', '.wwwppwww.', '.wwwwwwww.', '..wwwwww..', '..ww..ww..'], pal: { w: '#f4f4f4', p: '#f7a1b5', k: '#222' } },
    kat: { name: 'Kat', price: 200, rows: ['.o......o.', '.oo....oo.', '.oooooooo.', '.oOooooOo.', '.okooooko.', '.oooppooo.', '.oOooooOo.', '..oooooo..', '..oo..oo..', '..........'], pal: { o: '#f39a3b', O: '#c4661a', k: '#222', p: '#f7a1b5' } },
    hond: { name: 'Hond', price: 200, rows: ['..........', '.BBbbbbBB.', 'BBBbbbbBBB', 'BBbkbbkbBB', '.BbbbbbbB.', '..bbnnbb..', '..bbbbbb..', '..bwwwwb..', '..bbbbbb..', '..bb..bb..'], pal: { b: '#b07a45', B: '#6e4522', k: '#222', n: '#1a1a1a', w: '#e44d6a' } },
    uil: { name: 'Uil', price: 300, rows: ['.u......u.', '.uu....uu.', '.uuuuuuuu.', '.wwuuuuww.', 'wkwuuuuwkw', '.wwuoouww.', '.uuuuuuuu.', '.uUuUuUuu.', '..uuuuuu..', '..o....o..'], pal: { u: '#8b6a4a', U: '#5e432c', w: '#f4f4f4', k: '#222', o: '#ffb21c' } },
    draak: { name: 'Draakje', price: 750, rows: ['.r......r.', '.gg....gg.', '.gggggggg.', '.gykggkyg.', '.gggggggg.', '.ggwggwgg.', 'GGggggggGG', 'G.gGGGGg.G', '..gggggg..', '..gg..gg..'], pal: { g: '#3fbf4a', G: '#24802c', r: '#e0263a', y: '#ffd23b', k: '#222', w: '#fff' } }
  };
  const pet = id => PETS[id] ? fromMap('pet_' + id, PETS[id].rows, PETS[id].pal) : '';

  // ---------- AVATAR (zelf samen te stellen) ----------
  const AV = {
    skins: ['#f6d2b4', '#e8b48f', '#c98c62', '#8d5a3b', '#5c3a26'],
    hairColors: ['#3b2a1e', '#7a4a24', '#e0b040', '#c4502b', '#1d1d24', '#9a6bd8', '#3aa0e0', '#e85a9a'],
    hairStyles: ['kort', 'lang', 'stekels', 'staart', 'kaal'],
    shirts: ['#3a7bd5', '#d84a4a', '#3fae49', '#f2b52c', '#8e4fc8', '#f07ab0', '#20b2aa', '#4a4a4a'],
    hats: { geen: { name: 'Geen', price: 0 }, pet: { name: 'Pet', price: 50 }, strik: { name: 'Strik', price: 50 }, koptelefoon: { name: 'Koptelefoon', price: 100 }, tovenaar: { name: 'Tovenaarshoed', price: 200 }, helm: { name: 'Ridderhelm', price: 250 }, kroon: { name: 'Kroon', price: 400 } }
  };
  function avatar(a) {
    const key = 'av_' + JSON.stringify(a);
    return make(key, 16, 16, (g, p) => {
      const skin = AV.skins[a.skin] || AV.skins[0];
      const hair = AV.hairColors[a.hairColor] || AV.hairColors[0];
      const shirt = AV.shirts[a.shirt] || AV.shirts[0];
      const style = AV.hairStyles[a.hairStyle] || 'kort';
      const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) p(x, y, c); };
      // shirt
      rect(2, 12, 13, 15, shirt); rect(2, 12, 13, 12, shade(shirt, 0.2));
      rect(2, 13, 2, 15, shade(shirt, -0.25)); rect(13, 13, 13, 15, shade(shirt, -0.25));
      rect(7, 12, 8, 12, shade(skin, -0.1));
      // lange haren achter
      if (style === 'lang') { rect(2, 4, 3, 12, hair); rect(12, 4, 13, 12, hair); }
      // hoofd
      rect(3, 2, 12, 11, skin); rect(3, 11, 12, 11, shade(skin, -0.12));
      // haar
      if (style !== 'kaal') {
        rect(4, 1, 11, 1, hair); rect(3, 2, 12, 3, hair); p(3, 4, hair); p(12, 4, hair);
        p(5, 4, shade(hair, -0.2)); p(9, 4, hair);
        if (style === 'stekels') { [4, 6, 8, 10].forEach(x => p(x, 0, hair)); }
        if (style === 'staart') { rect(13, 3, 14, 8, hair); p(14, 9, hair); }
        if (style === 'lang') { rect(3, 4, 3, 6, hair); rect(12, 4, 12, 6, hair); }
      }
      // ogen
      const eye = (x) => { rect(x, 6, x + 1, 7, '#2b2b3a'); p(x, 6, '#ffffff'); };
      eye(5); eye(9);
      // wangen + mond
      p(4, 9, shade('#f29ca0', 0)); p(11, 9, '#f29ca0');
      p(6, 9, '#7a3b2e'); p(7, 10, '#7a3b2e'); p(8, 10, '#7a3b2e'); p(9, 9, '#7a3b2e');
      // hoeden
      switch (a.hat) {
        case 'pet': rect(4, 0, 11, 0, '#d33a3a'); rect(3, 1, 12, 2, '#d33a3a'); rect(3, 3, 14, 3, '#9e2222'); p(7, 1, '#fff'); break;
        case 'strik': [[10, 0], [10, 1], [10, 2], [11, 1], [12, 1], [13, 0], [13, 1], [13, 2]].forEach(([x, y]) => p(x, y, '#ff6fae')); p(11, 1, '#d63d86'); p(12, 1, '#d63d86'); break;
        case 'koptelefoon': rect(4, 0, 11, 0, '#333'); p(3, 1, '#333'); p(12, 1, '#333'); rect(2, 2, 2, 4, '#333'); rect(13, 2, 13, 4, '#333');
          rect(1, 5, 3, 8, '#e0263a'); rect(12, 5, 14, 8, '#e0263a'); break;
        case 'tovenaar': rect(7, 0, 8, 0, '#6a3fc0'); rect(6, 1, 9, 1, '#6a3fc0'); rect(5, 2, 10, 2, '#6a3fc0'); rect(1, 3, 14, 3, '#4b2a8f'); p(7, 1, '#ffd23b'); p(8, 2, '#ffd23b'); break;
        case 'helm': rect(3, 0, 12, 0, '#9a9a9a'); rect(2, 1, 13, 4, '#b5b5b5'); rect(2, 4, 13, 4, '#8a8a8a');
          rect(2, 5, 3, 9, '#9a9a9a'); rect(12, 5, 13, 9, '#9a9a9a'); rect(7, 5, 8, 7, '#8a8a8a'); p(4, 1, '#e8e8e8'); p(5, 1, '#e8e8e8'); break;
        case 'kroon': [3, 6, 9, 12].forEach(x => p(x, 0, '#ffd23b')); rect(3, 1, 12, 2, '#ffd23b'); rect(3, 2, 12, 2, '#d9a400');
          p(5, 1, '#e0263a'); p(8, 1, '#3a7bd5'); p(11, 1, '#17dd62'); break;
      }
    });
  }

  return { mob, MOBS, block, crack, pickaxe, sword, ore, heart, coin, star, flame, chest, trophy, clock, book, gear, lock, boss, BOSS_THEMES, bigboss, BIGBOSSES, pet, PETS, avatar, AV, ORE_COLORS, shade };
})();
