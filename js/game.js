'use strict';

// ═══════════════════════════════════════════════════════════
//  game.js  –  Campaign mode  (single-player, Overcooked-style)
// ═══════════════════════════════════════════════════════════

const Game = (() => {
  let canvas, ctx;

  const ST = {
    GLASS:'glass', ICE:'ice', SHAKE:'shake', BLEND:'blend',
    MUDDLE:'muddle', GARNISH:'garnish', TRASH:'trash',
    SPIRITS:'spirits', MIXERS:'mixers', SYRUPS:'syrups',
    COUNTER:'counter', SERVE:'serve',
  };

  // ── Station type registry ────────────────────────────────
  const STYPE = {
    glass_highball: { type:'glass', subtype:'highball', label:'HIGHBALL', sublabel:'glass',  color:'#70C8EE' },
    glass_lowball:  { type:'glass', subtype:'lowball',  label:'LOWBALL',  sublabel:'glass',  color:'#58B0D4' },
    glass_martini:  { type:'glass', subtype:'martini',  label:'MARTINI',  sublabel:'glass',  color:'#4098C0' },
    shake:          { type:'shake',   label:'SHAKE',   sublabel:'', color:'#F5C842' },
    blend:          { type:'blend',   label:'BLEND',   sublabel:'', color:'#C27BE0' },
    muddle:         { type:'muddle',  label:'MUDDLE',  sublabel:'', color:'#F87171' },
    garnish:        { type:'garnish', label:'GARNISH', sublabel:'', color:'#6EE7B7' },
    spirits:        { type:'spirits', label:'SPIRITS', sublabel:'', color:'#FCA5A5' },
    mixers:         { type:'mixers',  label:'MIXERS',  sublabel:'', color:'#86EFAC' },
    syrups:         { type:'syrups',  label:'SYRUPS',  sublabel:'', color:'#FDE68A' },
    ice_cylinder:   { type:'ice', subtype:'cylinder', label:'CYLINDER', sublabel:'ice', color:'#8ED8F8' },
    ice_crushed:    { type:'ice', subtype:'crushed',  label:'CRUSHED',  sublabel:'ice', color:'#70C0E0' },
    ice_large:      { type:'ice', subtype:'large',    label:'LARGE',    sublabel:'ice', color:'#58A8C8' },
    counter:        { type:'counter', label:'PASS',  sublabel:'', color:'#D4A96A' },
    counter2:       { type:'counter', label:'PASS',  sublabel:'', color:'#D4A96A' },
    serve1:         { type:'serve',   label:'SERVE', sublabel:'', color:'#FFD700' },
    serve2:         { type:'serve',   label:'SERVE', sublabel:'', color:'#FFD700' },
    trash:          { type:'trash',   label:'TRASH', sublabel:'', color:'#9CA3AF' },
  };

  function mkSt(id, x, y, w, h) {
    return { id, x, y, w, h, ...STYPE[id] };
  }

  // ── Level configurations ─────────────────────────────────
  // Canvas 900×640.  Orders panel y:0–100.
  // Top wall:  y:100–175  (station bottom edge y:173, player min y:186, gap≈13 px)
  // Left wall: x:0–82     (station right edge x:82,  player min x:88,  gap≈6 px)
  // Right wall: x:818–900 (station left edge x:818,  player max x:812, gap≈6 px)
  // Game floor: y:186–500.   Bottom bar: y:500–572.   HUD: y:572–640.
  //
  // GLASS stations always on RIGHT half of top wall (x ≥ 476).
  // SPIRITS always on LEFT wall (right edge x:82).
  // These two groups are ~400 px apart → zero interaction conflict.

  const LEVEL_CONFIGS = [

    // ── Level 1: Opening Night (Classic Pub) ─────────────
    // Build drinks only – no shake/blend/muddle stations.
    // Wide open floor, warm amber wood.
    {
      num:1, name:'Opening Night', duration:180, passScore:600,
      spawnInterval:25, maxOrders:2, orderTime:60,
      drinkCats:['build'],
      floor:['#F5E6C8','#E8D5A8'], wallCol:'#5C3310', wallTopCol:'#7A4520',
      barFront:'#5C3310', barEdge:'#A0784A', barTop:'#8B5E3C',
      playerStart:{ x:400, y:350 },
      stations:[
        // Glass types – top wall RIGHT half
        mkSt('glass_highball', 476, 108, 88, 65),
        mkSt('glass_lowball',  574, 108, 88, 65),
        mkSt('glass_martini',  672, 108, 88, 65),
        // Garnish – top wall centre-right
        mkSt('garnish', 378, 108, 88, 65),
        // Ingredients – left wall
        mkSt('spirits', 10, 220, 72, 105),
        mkSt('mixers',  10, 338, 72, 105),
        mkSt('syrups',  10, 456, 72, 42),
        // Ice – right wall
        mkSt('ice_cylinder', 818, 220, 72, 88),
        mkSt('ice_crushed',  818, 318, 72, 88),
        mkSt('ice_large',    818, 416, 72, 82),
        // Pass counter – centre
        mkSt('counter', 368, 305, 164, 68),
        // Serve + trash – bottom
        mkSt('serve1', 170, 508, 128, 56),
        mkSt('serve2', 602, 508, 128, 56),
        mkSt('trash',  412, 508, 76,  56),
      ],
    },

    // ── Level 2: Cocktail Hour (Cocktail Lounge) ─────────
    // Adds SHAKE station top-left.  Cool slate blue floor.
    {
      num:2, name:'Cocktail Hour', duration:180, passScore:900,
      spawnInterval:20, maxOrders:3, orderTime:50,
      drinkCats:['build','shake'],
      floor:['#D0D8E8','#BCC8DC'], wallCol:'#2A3A5C', wallTopCol:'#3A4E7A',
      barFront:'#1A2A4A', barEdge:'#4A6A9A', barTop:'#2A4A7A',
      playerStart:{ x:400, y:350 },
      stations:[
        // Shake – top wall LEFT
        mkSt('shake',  90, 108, 88, 65),
        // Garnish – top wall centre
        mkSt('garnish',284, 108, 88, 65),
        // Glass – top wall RIGHT
        mkSt('glass_highball', 476, 108, 88, 65),
        mkSt('glass_lowball',  574, 108, 88, 65),
        mkSt('glass_martini',  672, 108, 88, 65),
        // Ingredients – left wall, shifted down
        mkSt('spirits', 10, 245, 72, 100),
        mkSt('mixers',  10, 360, 72, 100),
        mkSt('syrups',  10, 470, 72, 28),
        // Ice – right wall
        mkSt('ice_cylinder', 818, 210, 72, 95),
        mkSt('ice_crushed',  818, 320, 72, 95),
        mkSt('ice_large',    818, 425, 72, 73),
        // Wider pass counter
        mkSt('counter', 310, 295, 240, 80),
        // Serve + trash
        mkSt('serve1', 130, 508, 128, 56),
        mkSt('serve2', 642, 508, 128, 56),
        mkSt('trash',  400, 508, 100, 56),
      ],
    },

    // ── Level 3: Mojito Madness (Tiki Bar) ───────────────
    // Adds MUDDLE top-left.  Tropical teal floor.
    // Tall centre island makes navigation tighter.
    {
      num:3, name:'Mojito Madness', duration:210, passScore:1200,
      spawnInterval:20, maxOrders:3, orderTime:50,
      drinkCats:['build','shake','muddle'],
      floor:['#C8EAD8','#B0D8C0'], wallCol:'#1A4A2A', wallTopCol:'#2A6A3A',
      barFront:'#0A3018', barEdge:'#2A8040', barTop:'#1A6030',
      playerStart:{ x:220, y:350 },
      stations:[
        // Process stations – top left cluster
        mkSt('shake',  90, 108, 88, 65),
        mkSt('muddle', 188, 108, 88, 65),
        // Garnish – top centre
        mkSt('garnish', 286, 108, 88, 65),
        // Glass – top RIGHT
        mkSt('glass_highball', 476, 108, 88, 65),
        mkSt('glass_lowball',  574, 108, 88, 65),
        mkSt('glass_martini',  672, 108, 88, 65),
        // Ingredients – left wall
        mkSt('spirits', 10, 210, 72, 110),
        mkSt('mixers',  10, 335, 72, 110),
        mkSt('syrups',  10, 460, 72, 38),
        // Ice – right wall
        mkSt('ice_cylinder', 818, 200, 72, 88),
        mkSt('ice_crushed',  818, 300, 72, 88),
        mkSt('ice_large',    818, 400, 72, 88),
        // TALL centre island – forces players around it
        mkSt('counter', 390, 260, 130, 145),
        // Serve + trash
        mkSt('serve1', 140, 508, 128, 56),
        mkSt('serve2', 632, 508, 128, 56),
        mkSt('trash',  390, 508, 80,  56),
      ],
    },

    // ── Level 4: Blender Night (Speakeasy) ───────────────
    // Adds BLEND.  Dark moody purple floor.
    // Garnish moves to right wall; two counters form an L.
    {
      num:4, name:'Blender Night', duration:210, passScore:1500,
      spawnInterval:17, maxOrders:3, orderTime:45,
      drinkCats:['build','shake','muddle','blend'],
      floor:['#2A1F3D','#1E1530'], wallCol:'#0D0D22', wallTopCol:'#1A1A38',
      barFront:'#0A0A18', barEdge:'#3A2A60', barTop:'#2A1A48',
      playerStart:{ x:400, y:350 },
      stations:[
        // Process – full top-left row
        mkSt('shake',  90, 108, 88, 65),
        mkSt('blend',  188, 108, 88, 65),
        mkSt('muddle', 286, 108, 88, 65),
        // Glass – top RIGHT
        mkSt('glass_highball', 476, 108, 88, 65),
        mkSt('glass_lowball',  574, 108, 88, 65),
        mkSt('glass_martini',  672, 108, 88, 65),
        // Garnish – right wall (bottom)
        mkSt('garnish', 818, 428, 72, 70),
        // Ingredients – left wall, tighter
        mkSt('spirits', 10, 215, 72, 95),
        mkSt('mixers',  10, 323, 72, 95),
        mkSt('syrups',  10, 431, 72, 55),
        // Ice – right wall
        mkSt('ice_cylinder', 818, 195, 72, 78),
        mkSt('ice_crushed',  818, 285, 72, 78),
        mkSt('ice_large',    818, 375, 72, 50),
        // L-shaped counter (two pieces)
        mkSt('counter',  310, 275, 130, 70),
        mkSt('counter2', 310, 355, 130, 55),
        // Serve + trash
        mkSt('serve1', 160, 508, 120, 56),
        mkSt('serve2', 620, 508, 120, 56),
        mkSt('trash',  408, 508, 84,  56),
      ],
    },

    // ── Level 5: Full Bar Chaos ───────────────────────────
    // All stations, compressed spacing, dark ember floor.
    // Extra obstacle counter forces tighter routing.
    {
      num:5, name:'Full Bar Chaos', duration:240, passScore:2000,
      spawnInterval:15, maxOrders:4, orderTime:42,
      drinkCats:['build','shake','muddle','blend'],
      floor:['#3A1A0A','#2A1206'], wallCol:'#1A0800', wallTopCol:'#2E1008',
      barFront:'#1A0800', barEdge:'#9A6030', barTop:'#6A3818',
      playerStart:{ x:400, y:370 },
      stations:[
        // Process – across full top wall
        mkSt('shake',  90, 108, 82, 65),
        mkSt('blend',  182, 108, 82, 65),
        mkSt('muddle', 274, 108, 82, 65),
        mkSt('garnish',366, 108, 82, 65),
        // Glass – top RIGHT (slightly narrower)
        mkSt('glass_highball', 476, 108, 82, 65),
        mkSt('glass_lowball',  568, 108, 82, 65),
        mkSt('glass_martini',  660, 108, 82, 65),
        // Ingredients – left wall
        mkSt('spirits', 10, 210, 72, 95),
        mkSt('mixers',  10, 318, 72, 95),
        mkSt('syrups',  10, 426, 72, 52),
        // Ice – right wall
        mkSt('ice_cylinder', 818, 210, 72, 80),
        mkSt('ice_crushed',  818, 305, 72, 80),
        mkSt('ice_large',    818, 400, 72, 78),
        // Two counters create maze-like paths
        mkSt('counter',  295, 270, 120, 65),
        mkSt('counter2', 485, 340, 120, 65),
        // Serve + trash (wider spacing)
        mkSt('serve1', 120, 508, 120, 56),
        mkSt('serve2', 660, 508, 120, 56),
        mkSt('trash',  390, 508, 120, 56),
      ],
    },
  ];

  let state = {};

  // ── Audio ────────────────────────────────────────────────
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function beep(freq, dur, type = 'sine', vol = 0.25) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }
  const sfxStep  = () => { ensureAudio(); beep(660, 0.1); };
  const sfxServe = () => { ensureAudio(); [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f,0.15), i*80)); };
  const sfxFail  = () => { ensureAudio(); beep(180, 0.35, 'sawtooth', 0.3); };
  const sfxBuzz  = () => { ensureAudio(); beep(200, 0.08, 'square', 0.2); };
  const sfxWrong = () => { ensureAudio(); beep(300, 0.12, 'sawtooth', 0.2); beep(220, 0.2, 'sawtooth', 0.15); };

  // ── Geometry helpers ─────────────────────────────────────
  function distToRect(px, py, s) {
    const cx = Math.max(s.x, Math.min(s.x + s.w, px));
    const cy = Math.max(s.y, Math.min(s.y + s.h, py));
    return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
  }
  function nearestStation(px, py, range = 68) {
    let best = null, bestD = Infinity;
    for (const s of state.stations) {
      const d = distToRect(px, py, s);
      if (d < bestD && d < range) { best = s; bestD = d; }
    }
    return best;
  }

  // ── Helpers ──────────────────────────────────────────────
  function pickDrink(cfg) {
    const pool = Storage.getAllDrinks().filter(d => cfg.drinkCats.includes(d.category));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : Storage.getAllDrinks()[0];
  }
  function spawnOrder() {
    const cfg = state.cfg;
    if (state.orders.length >= cfg.maxOrders) return;
    state.orders.push({
      id: Math.random(), drink: pickDrink(cfg),
      timeLeft: cfg.orderTime, maxTime: cfg.orderTime,
      value: 100, claimedBy: null,
    });
  }
  function float(x, y, text, color = '#FFD700') {
    state.floats.push({ x, y, text, color, alpha: 1, vy: -55, life: 1.6 });
  }

  // ── Player movement ──────────────────────────────────────
  function movePlayer(p, dt) {
    const speed = 210;
    let nx = p.x + p.vx * speed * dt;
    let ny = p.y + p.vy * speed * dt;
    const r = p.radius;
    nx = Math.max(88 + r, Math.min(812 - r, nx));
    ny = Math.max(186 + r, Math.min(492 - r, ny));
    for (const s of state.stations) {
      if (s.type === ST.SERVE || s.type === ST.TRASH) continue;
      const cx2 = Math.max(s.x, Math.min(s.x + s.w, nx));
      const cy2 = Math.max(s.y, Math.min(s.y + s.h, ny));
      const dx = nx - cx2, dy = ny - cy2, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < r) { const l = dd || 1; nx = cx2 + (dx / l) * r; ny = cy2 + (dy / l) * r; }
    }
    if (Math.abs(nx - p.x) > 0.1 || Math.abs(ny - p.y) > 0.1) {
      p.facing = p.vx > 0 ? 'right' : p.vx < 0 ? 'left' : p.vy > 0 ? 'down' : 'up';
    }
    p.x = nx; p.y = ny;
  }

  // ── Interaction ──────────────────────────────────────────
  function interact(p) {
    const s = nearestStation(p.x, p.y);
    if (!s) { float(p.x, p.y - 30, 'Nothing nearby', '#FF9999'); sfxBuzz(); return; }

    // TRASH
    if (s.type === ST.TRASH) {
      if (p.holding) { p.holding = null; float(p.x, p.y - 30, 'Trashed!', '#9CA3AF'); }
      else sfxBuzz();
      return;
    }

    // PASS COUNTER
    if (s.type === ST.COUNTER) {
      if (p.holding && !s.item) {
        s.item = p.holding; p.holding = null;
        float(p.x, p.y - 30, 'Placed!', '#D4A96A'); sfxStep(); return;
      }
      if (!p.holding && s.item) {
        p.holding = s.item; s.item = null;
        float(p.x, p.y - 30, 'Picked up!', '#D4A96A'); sfxStep(); return;
      }
      float(p.x, p.y - 30, p.holding ? 'Counter full!' : 'Nothing here', '#FF9999');
      sfxBuzz(); return;
    }

    // GLASS stations – start a new order
    if (s.type === ST.GLASS) {
      if (p.holding) { float(p.x, p.y - 30, 'Hands full!', '#FF9999'); sfxBuzz(); return; }
      const order = state.orders.find(o => !o.claimedBy);
      if (!order) { float(p.x, p.y - 30, 'No orders yet!', '#FF9999'); sfxBuzz(); return; }
      const firstStep = order.drink.steps[0];
      if (firstStep.type === 'glass' && firstStep.subtype && firstStep.subtype !== s.subtype) {
        float(p.x, p.y - 30, `Need ${firstStep.subtype.toUpperCase()} glass!`, '#FBBF24');
        sfxWrong(); return;
      }
      order.claimedBy = p.id;
      p.holding = {
        orderId: order.id, drinkName: order.drink.name,
        steps: order.drink.steps.map(st => ({ ...st, done: false })),
        step: 1,   // glass step (step 0) is already done — advance past it
        color: order.drink.color,
      };
      float(p.x, p.y - 30, '🍸 Got it!', '#70C8EE'); sfxStep(); return;
    }

    if (!p.holding) { float(p.x, p.y - 30, 'Grab a glass first!', '#FF9999'); sfxBuzz(); return; }

    const item = p.holding;
    if (item.step >= item.steps.length) { float(p.x, p.y - 30, 'Go SERVE it!', '#FFD700'); sfxBuzz(); return; }
    const cur = item.steps[item.step];

    // SERVE
    if (s.type === ST.SERVE) {
      if (cur.type === 'serve') { completeOrder(p, item); return; }
      const remaining = item.steps.slice(item.step).filter(st => st.type !== 'serve');
      float(p.x, p.y - 30, `${remaining.length} step(s) left!`, '#FF9999'); sfxBuzz(); return;
    }

    // Type mismatch
    if (s.type !== cur.type) {
      float(p.x, p.y - 30, `Need: ${cur.type.toUpperCase()}`, '#FBBF24'); sfxBuzz(); return;
    }

    // Subtype mismatch (wrong glass or ice variant)
    if (cur.subtype && s.subtype && s.subtype !== cur.subtype) {
      const label = cur.type === 'ice'
        ? `Need ${cur.subtype.toUpperCase()} ice!`
        : `Need ${cur.subtype.toUpperCase()} glass!`;
      float(p.x, p.y - 30, label, '#FBBF24'); sfxWrong(); return;
    }

    // Shake / blend: processing time
    if ((s.type === ST.SHAKE || s.type === ST.BLEND) && !s.processing) {
      s.processing = true; s.processTimer = 1.5; s.processingPlayer = p; p.busy = true;
      float(p.x, p.y - 30, s.type === ST.SHAKE ? 'Shaking…' : 'Blending…', '#F5C842'); return;
    }

    item.steps[item.step].done = true;
    item.step++;
    float(p.x, p.y - 30, '✓ ' + cur.text.substring(0, 24), '#6EE7B7'); sfxStep();
  }

  function completeOrder(p, item) {
    const order = state.orders.find(o => o.id === item.orderId);
    if (!order) return;
    const bonus = Math.floor((order.timeLeft / order.maxTime) * 120);
    const total = order.value + bonus;
    state.score += total; state.completedOrders++;
    float(p.x, p.y - 50, `+${total} pts!`, '#FFD700');
    state.orders = state.orders.filter(o => o.id !== order.id);
    p.holding = null; sfxServe();
    Storage.saveHighScore(state.levelNum, state.score);
  }

  // ── Public API ───────────────────────────────────────────
  function init(cvs, context) { canvas = cvs; ctx = context; }

  function startLevel(levelNum) {
    ensureAudio();
    const idx = Math.max(0, Math.min(levelNum - 1, LEVEL_CONFIGS.length - 1));
    const cfg = LEVEL_CONFIGS[idx];
    state = {
      levelNum, cfg, levelIdx: idx,
      time: cfg.duration,
      spawnTimer: 2,
      score: 0, completedOrders: 0, failedOrders: 0,
      phase: 'playing',
      stations: cfg.stations.map(s => ({
        ...s, item: null, processing: false, processTimer: 0, processingPlayer: null,
      })),
      orders: [], floats: [],
      player: {
        id: 0,
        x: cfg.playerStart.x, y: cfg.playerStart.y,
        vx: 0, vy: 0, radius: 22,
        color: '#FF6B6B',
        holding: null, busy: false, facing: 'down', walkCycle: 0,
      },
    };
  }

  function update(dt, keys) {
    if (state.phase !== 'playing') return;
    state.time -= dt;
    if (state.time <= 0) { state.time = 0; state.phase = 'done'; return; }

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer = state.cfg.spawnInterval;
    }

    for (let i = state.orders.length - 1; i >= 0; i--) {
      const o = state.orders[i];
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        const p = state.player;
        if (p.holding?.orderId === o.id) p.holding = null;
        state.orders.splice(i, 1);
        state.failedOrders++;
        state.score = Math.max(0, state.score - 50);
        sfxFail();
      }
    }

    for (const s of state.stations) {
      if (!s.processing) continue;
      s.processTimer -= dt;
      if (s.processTimer <= 0) {
        s.processing = false;
        const p = s.processingPlayer;
        if (p?.holding) {
          p.holding.steps[p.holding.step].done = true;
          p.holding.step++;
          sfxStep();
        }
        if (p) p.busy = false;
        s.processingPlayer = null;
      }
    }

    state.floats = state.floats.filter(f => {
      f.y += f.vy * dt; f.alpha -= dt / f.life; return f.alpha > 0;
    });

    // Single player movement – supports keyboard AND virtual touch D-pad keys
    const p = state.player;
    if (!p.busy) {
      p.vx = 0; p.vy = 0;
      if (keys['w'] || keys['ArrowUp']    || keys['touch_up'])    p.vy = -1;
      if (keys['s'] || keys['ArrowDown']  || keys['touch_down'])  p.vy =  1;
      if (keys['a'] || keys['ArrowLeft']  || keys['touch_left'])  p.vx = -1;
      if (keys['d'] || keys['ArrowRight'] || keys['touch_right']) p.vx =  1;
      const len = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (len > 1) { p.vx /= len; p.vy /= len; }
      if (len > 0) p.walkCycle += dt * 8;
      movePlayer(p, dt);
    }
  }

  function handleKeyDown(key) {
    if (state.phase !== 'playing') return;
    if (key.toLowerCase() === 'e' || key === 'touch_interact') interact(state.player);
  }

  // ═══════════════════════════════════════════════════════
  //  RENDERING
  // ═══════════════════════════════════════════════════════
  function lighten(hex, a) {
    const [r,g,b] = hexRgb(hex);
    return `rgb(${clamp(r+a)},${clamp(g+a)},${clamp(b+a)})`;
  }
  function darken(hex, a) { return lighten(hex, -a); }
  function hexRgb(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }

  function rrect(x, y, w, h, r = 8, fill, stroke, sw = 2) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
    if (fill)   { ctx.fillStyle = fill;   ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
  }

  function drawFloor() {
    const [c1, c2] = state.cfg.floor;
    const tw = 60, th = 60, x0 = 82, y0 = 182, x1 = 818, y1 = 500;
    for (let tx = x0; tx < x1; tx += tw) {
      for (let ty = y0; ty < y1; ty += th) {
        ctx.fillStyle = ((tx-x0)/tw + (ty-y0)/th) % 2 < 1 ? c1 : c2;
        ctx.fillRect(tx, ty, Math.min(tw, x1-tx), Math.min(th, y1-ty));
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let tx = x0; tx <= x1; tx += tw) { ctx.beginPath(); ctx.moveTo(tx,y0); ctx.lineTo(tx,y1); ctx.stroke(); }
    for (let ty = y0; ty <= y1; ty += th) { ctx.beginPath(); ctx.moveTo(x0,ty); ctx.lineTo(x1,ty); ctx.stroke(); }
  }

  function drawWalls() {
    const cfg = state.cfg;
    // Top wall
    ctx.fillStyle = cfg.wallCol; ctx.fillRect(0, 100, 900, 85);
    ctx.fillStyle = cfg.wallTopCol; ctx.fillRect(0, 100, 900, 12);
    // Visual separator between process stations and glass area
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(462, 108, 8, 65);
    // Left / right wall strips
    ctx.fillStyle = cfg.wallCol;
    ctx.fillRect(0, 182, 85, 320);
    ctx.fillRect(815, 182, 85, 320);
    // Bottom bar
    ctx.fillStyle = cfg.barFront; ctx.fillRect(0, 498, 900, 82);
    ctx.fillStyle = cfg.barEdge;  ctx.fillRect(0, 498, 900, 10);
    ctx.fillStyle = cfg.barTop;   ctx.fillRect(0, 498, 900, 6);
    // Serve cutouts
    [[170,508,128,56],[602,508,128,56]].forEach(([x,y,w,h]) => {
      ctx.fillStyle = darken(cfg.barFront, 20); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = cfg.barEdge; ctx.fillRect(x, y, w, 5);
    });
  }

  // ── Draw one station ────────────────────────────────────
  function drawStation(s) {
    const p = state.player;
    const inRange = distToRect(p.x, p.y, s) < 72;
    const cur = p.holding ? p.holding.steps[p.holding.step] : null;
    const needed = cur &&
      cur.type === s.type &&
      !(cur.subtype && s.subtype && cur.subtype !== s.subtype);

    // 3-D depth shadow
    const depth = 7;
    ctx.fillStyle = darken(s.color, 50);
    ctx.fillRect(s.x, s.y + s.h, s.w, depth);
    ctx.fillRect(s.x + s.w, s.y + depth, depth, s.h);

    // Top face
    rrect(s.x, s.y, s.w, s.h, 6, lighten(s.color, 18), '#1A0800', 2.5);

    // Needed glow
    if (needed) {
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
      rrect(s.x-3, s.y-3, s.w+6, s.h+6, 9, null, '#FFD700', 3);
      ctx.shadowBlur = 0;
    }
    // In-range border
    if (inRange && !needed) {
      rrect(s.x-2, s.y-2, s.w+4, s.h+4, 8, null, 'rgba(255,255,255,0.7)', 2);
    }

    drawStationIcon(s);

    // Labels
    const midX = s.x + s.w / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = needed ? '#1A0800' : '#2D1400';
    ctx.font = `bold ${s.w < 80 ? 9 : 10}px monospace`;
    ctx.fillText(s.label, midX, s.y + s.h - (s.sublabel ? 14 : 5));
    if (s.sublabel) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.font = '8px monospace';
      ctx.fillText(s.sublabel.toUpperCase(), midX, s.y + s.h - 3);
    }

    // Processing bar
    if (s.processing) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(s.x+4, s.y+s.h-14, s.w-8, 10);
      ctx.fillStyle = '#FFD700';         ctx.fillRect(s.x+4, s.y+s.h-14, (s.w-8)*(1-s.processTimer/1.5), 10);
    }

    // Item on counter
    if (s.type === ST.COUNTER && s.item) {
      ctx.fillStyle = s.item.color || '#fff';
      ctx.beginPath(); ctx.arc(s.x+s.w/2, s.y+s.h/2, 14, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2; ctx.stroke();
    }

    // "E" prompt when in range
    if (inRange) {
      const px = s.x + s.w/2, py = s.y - 14;
      rrect(px-13, py-10, 26, 17, 4, '#FFD700', '#1A0800', 1.5);
      ctx.fillStyle = '#1A0800'; ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('E', px, py - 1);
    }
  }

  // ── Station icons ────────────────────────────────────────
  function drawStationIcon(s) {
    const cx = s.x + s.w/2, cy = s.y + s.h/2 - 10;
    const dc = darken(s.color, 55), lc = lighten(s.color, 30);
    ctx.save();
    ctx.strokeStyle = dc; ctx.lineWidth = 2; ctx.fillStyle = darken(s.color, 25);

    if (s.type === 'glass') {
      if (s.subtype === 'highball') {
        rrect(cx-9, cy-16, 18, 30, 2, lc, dc, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx-6, cy-13, 5, 22);
      } else if (s.subtype === 'lowball') {
        rrect(cx-13, cy-8, 26, 22, 2, lc, dc, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx-10, cy-5, 7, 14);
      } else if (s.subtype === 'martini') {
        ctx.beginPath();
        ctx.moveTo(cx-16, cy-16); ctx.lineTo(cx+16, cy-16);
        ctx.lineTo(cx, cy+12); ctx.closePath();
        ctx.fillStyle = lc; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy+12); ctx.lineTo(cx, cy+20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-10, cy+20); ctx.lineTo(cx+10, cy+20); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(cx-14, cy-14); ctx.lineTo(cx-8, cy-14); ctx.lineTo(cx-2, cy+9); ctx.lineTo(cx-16, cy-16); ctx.fill();
      }
    } else if (s.type === 'ice') {
      if (s.subtype === 'cylinder') {
        rrect(cx-8, cy-14, 16, 28, 8, lc, dc, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx-5, cy-10, 4, 18);
      } else if (s.subtype === 'crushed') {
        [[cx-8,cy-12,10,8],[cx+2,cy-8,9,7],[cx-10,cy+2,8,8],[cx+1,cy+4,10,7]].forEach(([x,y,w,h]) => {
          rrect(x, y, w, h, 3, lc, dc, 1.5);
        });
      } else if (s.subtype === 'large') {
        rrect(cx-12, cy-14, 24, 26, 4, lc, dc, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(cx-8, cy-10, 7, 16);
        ctx.strokeStyle = dc; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx-12, cy-14); ctx.lineTo(cx-18, cy-8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+12, cy-14); ctx.lineTo(cx+6, cy-20); ctx.lineTo(cx-6, cy-20); ctx.lineTo(cx-12, cy-14); ctx.stroke();
      }
    } else {
      switch (s.type) {
        case 'shake':
          rrect(cx-7, cy-17, 14, 10, 3, lc, dc, 2);
          rrect(cx-9, cy-8,  18, 26, 4, lc, dc, 2);
          break;
        case 'blend':
          ctx.beginPath();
          ctx.moveTo(cx-9, cy-15); ctx.lineTo(cx+9, cy-15);
          ctx.lineTo(cx+11, cy+13); ctx.lineTo(cx-11, cy+13); ctx.closePath();
          ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx-9, cy+4); ctx.lineTo(cx+9, cy+4); ctx.stroke();
          break;
        case 'muddle':
          ctx.beginPath(); ctx.moveTo(cx, cy-16); ctx.lineTo(cx, cy+8); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy+12, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          break;
        case 'garnish':
          ctx.beginPath(); ctx.arc(cx, cy+2, 13, Math.PI, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx-13, cy+2); ctx.lineTo(cx+13, cy+2); ctx.stroke();
          ctx.fillStyle = lc;
          ctx.beginPath(); ctx.ellipse(cx+5, cy-10, 8, 5, -0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          break;
        case 'trash':
          rrect(cx-9, cy-10, 18, 22, 2, lc, dc, 2);
          ctx.beginPath(); ctx.moveTo(cx-11, cy-10); ctx.lineTo(cx+11, cy-10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx-4, cy-10); ctx.lineTo(cx-4, cy-15); ctx.lineTo(cx+4, cy-15); ctx.lineTo(cx+4, cy-10); ctx.stroke();
          break;
        case 'spirits':
          rrect(cx-5, cy+4,  10, 16, 3, lc, dc, 2);
          rrect(cx-4, cy-14, 8,  20, 2, lc, dc, 2);
          rrect(cx-3, cy-18, 6,  5,  1, '#888', dc, 1);
          break;
        case 'mixers':
          rrect(cx-9, cy-14, 18, 28, 2, lc, dc, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(cx-5, cy-8, 4, 14);
          break;
        case 'syrups':
          rrect(cx-6, cy-4,  12, 18, 6, lc, dc, 2);
          rrect(cx-4, cy-16, 8,  14, 3, lc, dc, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cx-2, cy, 4, 10);
          break;
        case 'counter':
          ctx.strokeStyle = dc; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx-25, cy); ctx.lineTo(cx-8, cy);
          ctx.moveTo(cx-14, cy-6); ctx.lineTo(cx-8, cy); ctx.lineTo(cx-14, cy+6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx+25, cy); ctx.lineTo(cx+8, cy);
          ctx.moveTo(cx+14, cy-6); ctx.lineTo(cx+8, cy); ctx.lineTo(cx+14, cy+6);
          ctx.stroke();
          break;
        case 'serve':
          ctx.beginPath(); ctx.arc(cx, cy+6, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy-14); ctx.lineTo(cx, cy-6);
          ctx.moveTo(cx-5, cy-10); ctx.lineTo(cx, cy-6); ctx.lineTo(cx+5, cy-10);
          ctx.stroke();
          break;
      }
    }
    ctx.restore();
  }

  // ── Player (chef sprite) ─────────────────────────────────
  function drawPlayer(p) {
    const { x, y, radius, color, walkCycle, holding, busy } = p;
    const moving = Math.abs(p.vx) + Math.abs(p.vy) > 0;
    const bob = Math.sin(walkCycle) * 3 * (moving ? 1 : 0);
    ctx.save(); ctx.translate(x, y + bob);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(0, radius-2, radius*0.7, 5, 0, 0, Math.PI*2); ctx.fill();

    // Body
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath(); ctx.ellipse(0, 10, radius-4, radius-1, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 8, 7, 5, 0, 0, Math.PI*2); ctx.fill();

    // Head
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, -8, 13, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1A0800'; ctx.lineWidth = 2; ctx.stroke();

    // Chef hat
    ctx.fillStyle = '#fff';
    ctx.fillRect(-13, -22, 26, 6);
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.strokeRect(-13, -22, 26, 6);
    ctx.beginPath(); ctx.ellipse(0, -30, 9, 11, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ddd'; ctx.stroke();

    // Eyes
    const eyes = {
      down:  [[-5,-7],[5,-7]],
      up:    [[-5,-11],[5,-11]],
      left:  [[-8,-8],[-2,-6]],
      right: [[2,-6],[8,-8]],
    };
    ctx.fillStyle = '#1A0800';
    (eyes[p.facing] || eyes.down).forEach(([ex, ey]) => {
      ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI*2); ctx.fill();
    });

    // Holding bubble with progress bar
    if (holding) {
      const prog = holding.step / holding.steps.length;
      rrect(-20, -62, 40, 26, 5, holding.color || '#6EC6E6', '#fff', 2);
      ctx.fillStyle = '#6EE7B7'; ctx.fillRect(-18, -54, 36 * prog, 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(-18, -54, 36, 6);
      ctx.fillStyle = '#1A0800'; ctx.font = '7px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(holding.drinkName.substring(0, 12), 0, -47);
    }

    // Busy spinner
    if (busy) {
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.arc(0, 0, radius+7, Date.now()/300, Date.now()/300 + Math.PI*1.5); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // ── Guidance arrows ──────────────────────────────────────
  function drawTargetArrows() {
    const p = state.player;
    if (!p.holding) return;
    const cur = p.holding.steps[p.holding.step];
    if (!cur) return;
    const target = state.stations.find(s => {
      if (s.type !== cur.type) return false;
      if (cur.subtype && s.subtype && cur.subtype !== s.subtype) return false;
      return true;
    });
    if (!target) return;
    const tx = target.x + target.w/2, ty = target.y + target.h/2;
    const dx = tx - p.x, dy = ty - p.y, d = Math.sqrt(dx*dx + dy*dy);
    if (d < 90) return;
    const nx = dx/d, ny = dy/d;
    ctx.save(); ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x+nx*32, p.y+ny*32); ctx.lineTo(tx-nx*45, ty-ny*45); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,215,0,0.65)';
    const angle = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(tx-nx*47, ty-ny*47); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-4,-6); ctx.lineTo(-4,6); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.restore();
  }

  // ── Orders panel (top 100 px) ────────────────────────────
  function drawOrdersPanel() {
    ctx.fillStyle = '#1A0D05'; ctx.fillRect(0, 0, 900, 100);
    ctx.fillStyle = '#3D2010'; ctx.fillRect(0, 96, 900, 6);

    ctx.fillStyle = '#8B6040'; ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('ORDERS:', 10, 15);

    const tW = 195, tH = 86, gap = 8, x0 = 94;
    state.orders.forEach((o, i) => {
      const x = x0 + i * (tW + gap);
      const pct = o.timeLeft / o.maxTime;
      const uc = pct > 0.5 ? '#6EE7B7' : pct > 0.25 ? '#FBBF24' : '#EF4444';

      ctx.fillStyle = '#2A1808'; ctx.fillRect(x-2, 4, tW+4, tH+4);
      rrect(x, 6, tW, tH, 5, '#FFF8E7', uc, 2.5);

      // Drink colour dot + name
      ctx.fillStyle = o.drink.color || '#888';
      ctx.beginPath(); ctx.arc(x+13, 20, 8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.stroke();

      const p = state.player;
      const claimed = p.holding?.orderId === o.id;
      ctx.fillStyle = '#1A0800'; ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(o.drink.name.substring(0, 18), x+26, 20);

      // ── Current step text (shows exact amounts!) ─────────
      if (claimed && p.holding) {
        const doneStep = p.holding.step;
        const cur = p.holding.steps[doneStep];
        if (cur) {
          ctx.fillStyle = '#2563EB'; ctx.font = 'bold 9px monospace';
          ctx.fillText('▶', x+6, 36);
          ctx.fillStyle = '#1A0800'; ctx.font = '9px monospace';
          const stepTxt = cur.text.length > 28 ? cur.text.substring(0, 26) + '…' : cur.text;
          ctx.fillText(stepTxt, x+18, 36);
        } else {
          ctx.fillStyle = '#059669'; ctx.font = 'bold 9px monospace';
          ctx.fillText('✓ Ready to SERVE!', x+6, 36);
        }
      } else {
        ctx.fillStyle = '#888'; ctx.font = 'italic 9px monospace';
        ctx.fillText('Pick up glass →', x+6, 36);
      }

      // Step progress dots
      const doneStep2 = claimed ? (p.holding?.step || 0) : 0;
      const visSteps = o.drink.steps.slice(0, 9);
      visSteps.forEach((st, si) => {
        const done   = si < doneStep2;
        const active = si === doneStep2 && claimed;
        ctx.fillStyle = done ? '#6EE7B7' : active ? '#FFD700' : '#C4B89A';
        ctx.beginPath(); ctx.arc(x + 10 + si * 20, 56, 6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = done ? '#1A0800' : '#666';
        ctx.font = '5px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(st.type.slice(0, 3).toUpperCase(), x + 10 + si * 20, 67);
      });

      // Timer bar
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x+4, 78, tW-8, 5);
      ctx.fillStyle = uc;                  ctx.fillRect(x+4, 78, (tW-8)*pct, 5);
    });

    if (!state.orders.length) {
      ctx.fillStyle = '#4A3020'; ctx.font = '13px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Waiting for first order…', 450, 50);
    }
  }

  // ── HUD (bottom bar) ─────────────────────────────────────
  function drawHUD() {
    ctx.fillStyle = '#1A0D05'; ctx.fillRect(0, 582, 900, 58);
    ctx.fillStyle = '#3D2010'; ctx.fillRect(0, 582, 900, 4);

    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`SCORE: ${state.score}`, 18, 611);

    const t = Math.max(0, Math.ceil(state.time));
    ctx.fillStyle = state.time < 30 ? '#EF4444' : '#F8F8F8';
    ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(t/60)}:${(t%60).toString().padStart(2,'0')}`, 450, 611);

    const cfg = state.cfg;
    ctx.fillStyle = '#8B6040'; ctx.font = '12px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`Lv${cfg.num} ${cfg.name}  ✓${state.completedOrders}  ✗${state.failedOrders}`, 882, 611);

    const hs = Storage.getHighScore(state.levelNum);
    if (hs) {
      ctx.fillStyle = '#5A3A20'; ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`BEST: ${hs}`, 18, 632);
    }

    // Controls reminder (single player)
    ctx.fillStyle = '#3A2510'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText('WASD / Arrows to move  |  E to interact  |  ESC = menu', 882, 632);
  }

  // ── Level end overlay ────────────────────────────────────
  function drawLevelEnd() {
    const cfg = state.cfg, pass = state.score >= cfg.passScore;
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, 900, 640);
    rrect(175, 145, 550, 340, 18, pass ? '#0F2A0F' : '#2A0F0F', pass ? '#6EE7B7' : '#EF4444', 3);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = pass ? '#6EE7B7' : '#EF4444'; ctx.font = 'bold 40px monospace';
    ctx.fillText(pass ? '⭐ LEVEL CLEAR!' : "TIME'S UP!", 450, 210);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 30px monospace';
    ctx.fillText(`Score: ${state.score}`, 450, 272);
    ctx.fillStyle = '#C8A870'; ctx.font = '15px monospace';
    ctx.fillText(`Target: ${cfg.passScore}  |  Best: ${Storage.getHighScore(state.levelNum)}`, 450, 318);
    ctx.fillText(`Served: ${state.completedOrders}  |  Missed: ${state.failedOrders}`, 450, 350);
    ctx.fillStyle = '#F8F8F8'; ctx.font = '14px monospace';
    ctx.fillText(pass ? 'ENTER = Next Level' : 'ENTER = Retry', 450, 410);
    ctx.fillStyle = '#8B6040'; ctx.fillText('ESC = Main Menu', 450, 442);
  }

  function render() {
    if (!canvas || !state.player) return;
    drawOrdersPanel();
    drawWalls();
    drawFloor();
    state.stations.forEach(drawStation);
    drawTargetArrows();
    drawPlayer(state.player);
    state.floats.forEach(f => {
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.fillStyle = f.color || '#FFD700';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });
    drawHUD();
    if (state.phase === 'done') drawLevelEnd();
  }

  function getPhase()      { return state.phase; }
  function getScore()      { return state.score; }
  function getLevelCount() { return LEVEL_CONFIGS.length; }
  function isLevelPassed() { return state.score >= state.cfg.passScore; }

  return { init, startLevel, update, render, handleKeyDown, getPhase, getScore, getLevelCount, isLevelPassed };
})();
