'use strict';

// ═══════════════════════════════════════════════════════════
//  game.js  –  Campaign mode  (single-player, Overcooked + MixologyMaster hybrid)
// ═══════════════════════════════════════════════════════════

const Game = (() => {
  let canvas, ctx;

  const ST = {
    GLASS:'glass', ICE:'ice', SHAKE:'shake', BLEND:'blend',
    MUDDLE:'muddle', GARNISH:'garnish', TRASH:'trash',
    SPIRITS:'spirits', MIXERS:'mixers', SYRUPS:'syrups',
    COUNTER:'counter', SERVE:'serve',
  };

  // Stations that trigger the ingredient mini-game
  const MINI_GAME_TYPES = new Set(['spirits','mixers','syrups','garnish']);
  const HEARTS_MAX = 3;
  const HINT_DELAY  = 5;   // seconds before station glow / arrow appear

  // ── Ingredient pools for distractor generation ───────────
  const ING_POOL = {
    spirits: ['Gin','Vodka','White Rum','Dark Rum','Tequila','Whiskey','Bourbon',
              'Amaretto','Kahlúa','Aperol','Limoncello','Triple Sec','Campari','Baileys'],
    mixers:  ['Tonic Water','Soda Water','Ginger Beer','Lemon Soda','Cola',
              'Orange Juice','Cranberry Juice','Pineapple Juice','Lime Juice','Coconut Cream'],
    syrups:  ['Simple Syrup','Mango Syrup','Strawberry Syrup','Lime Cordial',
              'Grenadine','Passionfruit Syrup','Elderflower Cordial','Rose Syrup','Orgeat'],
    garnish: ['Lime Wedge','Lemon Wedge','Mint Sprig','Orange Twist','Dried Lime Wheel',
              'Strawberry','Cherry','Cucumber Slice','Coffee Beans','Edible Flower'],
  };

  // ── Roguelite upgrade pool ───────────────────────────────
  const UPGRADES_POOL = [
    { id:'hearts', icon:'♥', label:'+1 Heart',     desc:'Survive one more wrong answer.',          color:'#EF4444' },
    { id:'speed',  icon:'⚡', label:'Speed Boost',  desc:'Move 25% faster behind the bar.',         color:'#FFD700' },
    { id:'time',   icon:'⏱', label:'+20s Timer',   desc:'Each level has 20 extra seconds.',        color:'#74B9FF' },
    { id:'tips',   icon:'💰', label:'Bigger Tips',  desc:'Earn 30% more score per drink.',          color:'#6EE7B7' },
    { id:'lucky',  icon:'🍀', label:'Lucky Pour',   desc:'First wrong answer each level forgiven.', color:'#86EFAC' },
    { id:'quick',  icon:'⚙',  label:'Quick Hands',  desc:'Processing stations 35% faster.',         color:'#FDE68A' },
  ];

  // ── Station type registry ────────────────────────────────
  const STYPE = {
    glass_highball:{ type:'glass', subtype:'highball', label:'HIGHBALL', sublabel:'glass',  color:'#70C8EE' },
    glass_lowball: { type:'glass', subtype:'lowball',  label:'LOWBALL',  sublabel:'glass',  color:'#58B0D4' },
    glass_martini: { type:'glass', subtype:'martini',  label:'MARTINI',  sublabel:'glass',  color:'#4098C0' },
    shake:         { type:'shake',   label:'SHAKE',   sublabel:'', color:'#F5C842' },
    blend:         { type:'blend',   label:'BLEND',   sublabel:'', color:'#C27BE0' },
    muddle:        { type:'muddle',  label:'MUDDLE',  sublabel:'', color:'#F87171' },
    garnish:       { type:'garnish', label:'GARNISH', sublabel:'', color:'#6EE7B7' },
    spirits:       { type:'spirits', label:'SPIRITS', sublabel:'', color:'#FCA5A5' },
    mixers:        { type:'mixers',  label:'MIXERS',  sublabel:'', color:'#86EFAC' },
    syrups:        { type:'syrups',  label:'SYRUPS',  sublabel:'', color:'#FDE68A' },
    ice_cylinder:  { type:'ice', subtype:'cylinder', label:'CYLINDER', sublabel:'ice', color:'#8ED8F8' },
    ice_crushed:   { type:'ice', subtype:'crushed',  label:'CRUSHED',  sublabel:'ice', color:'#70C0E0' },
    ice_large:     { type:'ice', subtype:'large',    label:'LARGE',    sublabel:'ice', color:'#58A8C8' },
    counter:       { type:'counter', label:'PASS',  sublabel:'', color:'#D4A96A' },
    counter2:      { type:'counter', label:'PASS',  sublabel:'', color:'#D4A96A' },
    serve1:        { type:'serve',   label:'SERVE', sublabel:'', color:'#FFD700' },
    serve2:        { type:'serve',   label:'SERVE', sublabel:'', color:'#FFD700' },
    trash:         { type:'trash',   label:'TRASH', sublabel:'', color:'#9CA3AF' },
  };

  function mkSt(id, x, y, w, h) { return { id, x, y, w, h, ...STYPE[id] }; }

  // ── Level configurations (5 distinct layouts) ────────────
  const LEVEL_CONFIGS = [
    {
      num:1, name:'Opening Night', duration:180, passScore:600,
      spawnInterval:28, maxOrders:2, orderTime:65, drinkCats:['build'],
      floor:['#E8D8A0','#D4C088'], wallBrick:'#6A3510', wallBrickLt:'#8A5530',
      barWood:'#8B5E3C', barWoodLt:'#A87850', barWoodDk:'#5A3010',
      playerStart:{ x:400, y:340 },
      stations:[
        mkSt('glass_highball', 476,108,88,65), mkSt('glass_lowball',574,108,88,65), mkSt('glass_martini',672,108,88,65),
        mkSt('garnish',378,108,88,65),
        mkSt('spirits',10,220,72,105), mkSt('mixers',10,338,72,105), mkSt('syrups',10,456,72,42),
        mkSt('ice_cylinder',818,220,72,88), mkSt('ice_crushed',818,318,72,88), mkSt('ice_large',818,416,72,82),
        mkSt('serve1',170,508,128,56), mkSt('serve2',602,508,128,56),
      ],
    },
    {
      num:2, name:'Cocktail Hour', duration:180, passScore:900,
      spawnInterval:22, maxOrders:3, orderTime:55, drinkCats:['build','shake'],
      floor:['#C8D8E8','#B0C4D8'], wallBrick:'#2A3A5C', wallBrickLt:'#3A5080',
      barWood:'#1A2A4A', barWoodLt:'#2A4A7A', barWoodDk:'#0A1828',
      playerStart:{ x:400, y:340 },
      stations:[
        mkSt('shake',90,108,88,65),
        mkSt('garnish',284,108,88,65),
        mkSt('glass_highball',476,108,88,65), mkSt('glass_lowball',574,108,88,65), mkSt('glass_martini',672,108,88,65),
        mkSt('spirits',10,245,72,100), mkSt('mixers',10,360,72,100), mkSt('syrups',10,470,72,28),
        mkSt('ice_cylinder',818,210,72,95), mkSt('ice_crushed',818,320,72,95), mkSt('ice_large',818,425,72,73),
        mkSt('serve1',130,508,128,56), mkSt('serve2',642,508,128,56),
      ],
    },
    {
      num:3, name:'Mojito Madness', duration:210, passScore:1200,
      spawnInterval:20, maxOrders:3, orderTime:50, drinkCats:['build','shake','muddle'],
      floor:['#B8E8C8','#98D0A8'], wallBrick:'#1A4A2A', wallBrickLt:'#2A6A3A',
      barWood:'#0A3018', barWoodLt:'#1A5028', barWoodDk:'#041008',
      playerStart:{ x:220, y:340 },
      stations:[
        mkSt('shake',90,108,88,65), mkSt('muddle',188,108,88,65), mkSt('garnish',286,108,88,65),
        mkSt('glass_highball',476,108,88,65), mkSt('glass_lowball',574,108,88,65), mkSt('glass_martini',672,108,88,65),
        mkSt('spirits',10,210,72,110), mkSt('mixers',10,335,72,110), mkSt('syrups',10,460,72,38),
        mkSt('ice_cylinder',818,200,72,88), mkSt('ice_crushed',818,300,72,88), mkSt('ice_large',818,400,72,88),
        mkSt('serve1',140,508,128,56), mkSt('serve2',632,508,128,56),
      ],
    },
    {
      num:4, name:'Blender Night', duration:210, passScore:1500,
      spawnInterval:17, maxOrders:3, orderTime:45, drinkCats:['build','shake','muddle','blend'],
      floor:['#2A1F3D','#1E1530'], wallBrick:'#0D0D22', wallBrickLt:'#1A1A38',
      barWood:'#0A0A18', barWoodLt:'#2A1A48', barWoodDk:'#040408',
      playerStart:{ x:400, y:340 },
      stations:[
        mkSt('shake',90,108,88,65), mkSt('blend',188,108,88,65), mkSt('muddle',286,108,88,65),
        mkSt('glass_highball',476,108,88,65), mkSt('glass_lowball',574,108,88,65), mkSt('glass_martini',672,108,88,65),
        mkSt('garnish',818,428,72,70),
        mkSt('spirits',10,215,72,95), mkSt('mixers',10,323,72,95), mkSt('syrups',10,431,72,55),
        mkSt('ice_cylinder',818,195,72,78), mkSt('ice_crushed',818,285,72,78), mkSt('ice_large',818,375,72,50),
        mkSt('serve1',160,508,120,56), mkSt('serve2',620,508,120,56),
      ],
    },
    {
      num:5, name:'Full Bar Chaos', duration:240, passScore:2000,
      spawnInterval:15, maxOrders:4, orderTime:42, drinkCats:['build','shake','muddle','blend'],
      floor:['#3A1A0A','#2A1206'], wallBrick:'#1A0800', wallBrickLt:'#2E1008',
      barWood:'#1A0800', barWoodLt:'#6A3818', barWoodDk:'#0A0400',
      playerStart:{ x:400, y:360 },
      stations:[
        mkSt('shake',90,108,82,65), mkSt('blend',182,108,82,65), mkSt('muddle',274,108,82,65), mkSt('garnish',366,108,82,65),
        mkSt('glass_highball',476,108,82,65), mkSt('glass_lowball',568,108,82,65), mkSt('glass_martini',660,108,82,65),
        mkSt('spirits',10,210,72,95), mkSt('mixers',10,318,72,95), mkSt('syrups',10,426,72,52),
        mkSt('ice_cylinder',818,210,72,80), mkSt('ice_crushed',818,305,72,80), mkSt('ice_large',818,400,72,78),
        mkSt('serve1',120,508,120,56), mkSt('serve2',660,508,120,56),
      ],
    },
  ];

  // Customer colours (distinct from player red)
  const CUST_COLORS = ['#74B9FF','#55EFC4','#FDCB6E','#E17055','#A29BFE','#FD79A8'];
  const CUST_PHRASES = [
    (n) => `${n}, please!`,
    (n) => `Can I get a ${n}?`,
    (n) => `I'll have the ${n}!`,
    (n) => `One ${n} for me!`,
  ];

  let state = {};

  // ── Audio ────────────────────────────────────────────────
  let audioCtx = null;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function beep(freq, dur, type='sine', vol=0.22) {
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
  const sfxFail  = () => { ensureAudio(); beep(180, 0.4, 'sawtooth', 0.3); };
  const sfxBuzz  = () => { ensureAudio(); beep(200, 0.08, 'square', 0.2); };
  const sfxWrong = () => { ensureAudio(); beep(300, 0.15, 'sawtooth', 0.25); beep(200, 0.2, 'sawtooth', 0.18); };
  const sfxHeart = () => { ensureAudio(); beep(120, 0.5, 'sawtooth', 0.35); };

  // ── Geometry helpers ─────────────────────────────────────
  function distToRect(px, py, s) {
    const cx = Math.max(s.x, Math.min(s.x+s.w, px));
    const cy = Math.max(s.y, Math.min(s.y+s.h, py));
    return Math.sqrt((px-cx)**2 + (py-cy)**2);
  }
  function nearestStation(px, py, range=68) {
    let best=null, bestD=Infinity;
    for (const s of state.stations) {
      const d = distToRect(px, py, s);
      if (d<bestD && d<range) { best=s; bestD=d; }
    }
    return best;
  }

  // ── Data helpers ─────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i=a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  function parseIngredient(text) {
    let m;
    m = text.match(/^add\s+([\d.]+\s*cl)\s+(.+)/i);
    if (m) return { name: m[2].trim(), amount: m[1].trim() };
    m = text.match(/^add\s+a\s+dash\s+of\s+(.+)/i);
    if (m) return { name: m[1].trim(), amount: 'a dash' };
    m = text.match(/^top\s+with\s+(.+?)(?:\s*\(.*\))?$/i);
    if (m) return { name: m[1].trim(), amount: 'top up' };
    m = text.match(/^garnish\s+with\s+(.+)/i);
    if (m) return { name: m[1].trim(), amount: null };
    m = text.match(/^add\s+(.+)/i);
    if (m) return { name: m[1].trim(), amount: null };
    return { name: text.trim(), amount: null };
  }

  function makeAmountOptions(correctAmt) {
    if (!correctAmt || correctAmt === 'top up')
      return shuffle(['top up', '2 cl', '4 cl', '8 cl']);
    if (correctAmt === 'a dash')
      return shuffle(['a dash', '1 cl', '2 cl', '10 ml']);
    const n = parseFloat(correctAmt);
    if (isNaN(n)) return null;
    const pool = new Set([n]);
    const candidates = [1,1.5,2,2.5,3,3.5,4,4.5,5,6].sort(() => Math.random()-0.5);
    for (const c of candidates) { if (pool.size>=4) break; if (c!==n) pool.add(c); }
    return shuffle([...pool].map(v => Number.isInteger(v) ? `${v} cl` : `${v} cl`));
  }

  function pickDrink(cfg) {
    const pool = Storage.getAllDrinks().filter(d => cfg.drinkCats.includes(d.category));
    return pool.length ? pool[Math.floor(Math.random()*pool.length)] : Storage.getAllDrinks()[0];
  }
  function spawnOrder() {
    const cfg = state.cfg;
    if (state.orders.length >= cfg.maxOrders) return;
    const phraseIdx = Math.floor(Math.random()*CUST_PHRASES.length);
    const drink = pickDrink(cfg);
    state.orders.push({
      id: Math.random(), drink,
      timeLeft: cfg.orderTime, maxTime: cfg.orderTime,
      value: 100, claimedBy: null,
      custColor: CUST_COLORS[state.orders.length % CUST_COLORS.length],
      phrase: CUST_PHRASES[phraseIdx](drink.name),
    });
  }
  function float(x, y, text, color='#FFD700', size=18) {
    state.floats.push({ x, y, text, color, alpha:1, vy:-55, life:1.6, size });
  }

  // ── Mini-game system ─────────────────────────────────────
  function openMiniGame(player, stationType, cur, parsed) {
    const pool = ING_POOL[stationType] || [];
    const correctLower = parsed.name.toLowerCase();
    const distractors = shuffle(pool.filter(d => d.toLowerCase() !== correctLower)).slice(0,3);
    const ingOptions = shuffle([parsed.name, ...distractors]);
    const amtOptions = parsed.amount !== null ? makeAmountOptions(parsed.amount) : null;

    state.miniGame = {
      active:true, player, stationType, cur, parsed,
      phase: 'ingredient',
      ingOptions, amtOptions,
      correctIng: correctLower,
      correctAmt: parsed.amount,
      selectedIng: null,
      feedback: null, feedbackMsg: '',
      feedbackTimer: 0, lastResult: null,
      shakeTimer: 0,
      buttons: [],
      // Build log: completed steps up to current
      buildLog: buildLogEntries(player),
    };
  }

  function buildLogEntries(p) {
    if (!p.holding) return [];
    return p.holding.steps
      .slice(0, p.holding.step)
      .map(s => s.text.substring(0, 30));
  }

  function updateMiniGame(dt) {
    const mg = state.miniGame;
    if (!mg) return;
    if (mg.shakeTimer > 0) mg.shakeTimer -= dt;
    if (mg.feedbackTimer <= 0) return;
    mg.feedbackTimer -= dt;
    if (mg.feedbackTimer > 0) return;

    // Timer expired — apply result
    if (mg.lastResult === 'correct') {
      if (mg.phase === 'ingredient') {
        if (mg.amtOptions) {
          mg.phase = 'amount';
          mg.feedback = null;
        } else {
          advanceFromMiniGame(mg);
        }
      } else {
        advanceFromMiniGame(mg);
      }
    } else {
      mg.feedback = null; // wrong: clear, allow retry
    }
  }

  function handleMiniGameClick(cx, cy) {
    const mg = state.miniGame;
    if (!mg?.active) return false;
    if (mg.feedbackTimer > 0) return true;

    for (const btn of mg.buttons) {
      if (cx>=btn.x && cx<=btn.x+btn.w && cy>=btn.y && cy<=btn.y+btn.h) {
        if (btn.action === 'selectIng') {
          if (btn.value.toLowerCase() === mg.correctIng) {
            mg.selectedIng = btn.value;
            mg.feedback = 'correct';
            mg.lastResult = 'correct';
            mg.feedbackMsg = '✓ Correct!';
            mg.feedbackTimer = 0.55;
            sfxStep();
          } else {
            mg.feedback = 'wrong';
            mg.lastResult = 'wrong';
            mg.feedbackMsg = `✗ That's ${btn.value} — wrong!`;
            mg.feedbackTimer = 0.9;
            mg.shakeTimer = 0.3;
            loseHeart();
            if (mg.player.holding) mg.player.holding.hadMistake = true;
          }
        } else if (btn.action === 'selectAmt') {
          if (btn.value === mg.correctAmt) {
            mg.feedback = 'correct';
            mg.lastResult = 'correct';
            mg.feedbackMsg = `✓ ${btn.value} — perfect pour!`;
            mg.feedbackTimer = 0.65;
            sfxStep();
          } else {
            mg.feedback = 'wrong';
            mg.lastResult = 'wrong';
            mg.feedbackMsg = `✗ ${btn.value} is wrong — try again`;
            mg.feedbackTimer = 0.9;
            mg.shakeTimer = 0.3;
            loseHeart();
            if (mg.player.holding) mg.player.holding.hadMistake = true;
          }
        } else if (btn.action === 'close') {
          closeMiniGame();
        }
        return true;
      }
    }
    return true;
  }

  function advanceFromMiniGame(mg) {
    if (!state.miniGame?.active) return;
    const p = mg.player;
    if (p.holding && p.holding.step < p.holding.steps.length) {
      p.holding.steps[p.holding.step].done = true;
      p.holding.step++;
      p.stepTimer = 0;
      float(p.x, p.y-32, `✓ ${mg.parsed.name.substring(0,18)}`, '#6EE7B7');
    }
    closeMiniGame();
  }

  function closeMiniGame() { state.miniGame = null; }

  function loseHeart() {
    if (state.luckyPours > 0) {
      state.luckyPours--;
      float(state.player.x, state.player.y - 30, '🍀 Lucky!', '#86EFAC');
      sfxStep();
      return;
    }
    const p = state.player;
    p.hearts = Math.max(0, (p.hearts ?? HEARTS_MAX) - 1);
    sfxHeart();
    if (p.hearts <= 0) { closeMiniGame(); state.phase = 'failed'; }
  }

  // ── Player movement ──────────────────────────────────────
  function movePlayer(p, dt) {
    const speed = 210 * (p.speedMult || 1);
    let nx = p.x + p.vx*speed*dt, ny = p.y + p.vy*speed*dt;
    const r = p.radius;
    nx = Math.max(88+r, Math.min(812-r, nx));
    ny = Math.max(186+r, Math.min(492-r, ny));
    for (const s of state.stations) {
      if (s.type===ST.SERVE || s.type===ST.TRASH) continue;
      const cx2=Math.max(s.x,Math.min(s.x+s.w,nx)), cy2=Math.max(s.y,Math.min(s.y+s.h,ny));
      const dx=nx-cx2, dy=ny-cy2, dd=Math.sqrt(dx*dx+dy*dy);
      if (dd<r) { const l=dd||1; nx=cx2+(dx/l)*r; ny=cy2+(dy/l)*r; }
    }
    if (Math.abs(nx-p.x)>0.1||Math.abs(ny-p.y)>0.1)
      p.facing = p.vx>0?'right':p.vx<0?'left':p.vy>0?'down':'up';
    p.x=nx; p.y=ny;
  }

  // ── Interaction ──────────────────────────────────────────
  function interact(p) {
    const s = nearestStation(p.x, p.y);
    if (!s) {
      if (p.holding) { p.holding=null; float(p.x,p.y-40,'Discarded!','#9CA3AF'); sfxBuzz(); }
      else { float(p.x,p.y-30,'Nothing nearby','#FF9999'); sfxBuzz(); }
      return;
    }

    if (s.type===ST.TRASH) {
      if (p.holding) { p.holding=null; float(p.x, p.y-30, 'Trashed!', '#9CA3AF'); }
      else sfxBuzz();
      return;
    }

    if (s.type===ST.COUNTER) {
      if (p.holding && !s.item) { s.item=p.holding; p.holding=null; float(p.x,p.y-30,'Placed!','#D4A96A'); sfxStep(); return; }
      if (!p.holding && s.item) { p.holding=s.item; s.item=null; float(p.x,p.y-30,'Picked up!','#D4A96A'); sfxStep(); return; }
      float(p.x, p.y-30, p.holding?'Counter full!':'Nothing here', '#FF9999'); sfxBuzz(); return;
    }

    if (s.type===ST.GLASS) {
      if (p.holding) { float(p.x,p.y-30,'Hands full!','#FF9999'); sfxBuzz(); return; }
      const order = state.orders.find(o => !o.claimedBy);
      if (!order) { float(p.x,p.y-30,'No orders yet!','#FF9999'); sfxBuzz(); return; }
      const firstStep = order.drink.steps[0];
      if (firstStep.type==='glass' && firstStep.subtype && firstStep.subtype!==s.subtype) {
        float(p.x, p.y-30, `Need ${firstStep.subtype.toUpperCase()} glass!`, '#FBBF24');
        sfxWrong(); return;
      }
      order.claimedBy = p.id;
      p.holding = {
        orderId: order.id, drinkName: order.drink.name,
        steps: order.drink.steps.map(st=>({...st,done:false})),
        step: 1, color: order.drink.color,
      };
      p.stepTimer = 0;
      float(p.x, p.y-30, '🍸 Got it!', '#70C8EE'); sfxStep(); return;
    }

    if (!p.holding) { float(p.x,p.y-30,'Grab a glass first!','#FF9999'); sfxBuzz(); return; }

    const item = p.holding;
    if (item.step>=item.steps.length) { float(p.x,p.y-30,'Go SERVE it!','#FFD700'); sfxBuzz(); return; }
    const cur = item.steps[item.step];

    if (s.type===ST.SERVE) {
      if (cur.type==='serve') { completeOrder(p,item); return; }
      const remaining = item.steps.slice(item.step).filter(st=>st.type!=='serve');
      float(p.x, p.y-30, `${remaining.length} step(s) left!`, '#FF9999'); sfxBuzz(); return;
    }

    if (s.type!==cur.type) { float(p.x,p.y-30,`Need: ${cur.type.toUpperCase()}`,'#FBBF24'); sfxBuzz(); return; }

    if (cur.subtype && s.subtype && s.subtype!==cur.subtype) {
      const label = cur.type==='ice' ? `Need ${cur.subtype.toUpperCase()} ice!` : `Need ${cur.subtype.toUpperCase()} glass!`;
      float(p.x, p.y-30, label, '#FBBF24'); sfxWrong(); return;
    }

    if ((s.type===ST.SHAKE||s.type===ST.BLEND) && !s.processing) {
      s.processing=true; s.processTimer=1.5*(state.quickMult||1); s.processingPlayer=p; p.busy=true;
      float(p.x, p.y-30, s.type===ST.SHAKE?'Shaking…':'Blending…', '#F5C842'); return;
    }

    // Mini-game for measured stations
    if (MINI_GAME_TYPES.has(s.type)) {
      const parsed = parseIngredient(cur.text);
      if (parsed.name) { openMiniGame(p, s.type, cur, parsed); return; }
    }

    item.steps[item.step].done=true;
    item.step++;
    p.stepTimer = 0;
    float(p.x, p.y-30, '✓ '+cur.text.substring(0,22), '#6EE7B7'); sfxStep();
  }

  function completeOrder(p, item) {
    const order = state.orders.find(o=>o.id===item.orderId);
    if (!order) return;
    const bonus = Math.floor((order.timeLeft/order.maxTime)*120);
    const total = Math.floor((order.value+bonus) * (state.tipsMult || 1));
    state.score+=total; state.completedOrders++;
    float(p.x, p.y-50, `+${total} pts!`, '#FFD700');
    state.orders = state.orders.filter(o=>o.id!==order.id);
    p.holding=null; p.stepTimer=0;
    sfxServe();
    Storage.saveHighScore(state.levelNum, state.score);
    // Award DKK tips only for perfect (no mistakes) + fast serves
    if (!item.hadMistake && bonus > 0) {
      const tipMagnet = Math.pow(1.25, Storage.getPassiveLevel('p_tips'));
      const dkk = Math.max(1, Math.floor((bonus / 10) * tipMagnet));
      Storage.addTips(dkk);
      float(p.x, p.y-70, `+${dkk} DKK`, '#6EE7B7', 16);
    }
  }

  // ── Public API ───────────────────────────────────────────
  function init(cvs, context) { canvas=cvs; ctx=context; }

  function startLevel(levelNum, opts = {}) {
    ensureAudio();
    const idx = Math.max(0, Math.min(levelNum-1, LEVEL_CONFIGS.length-1));
    const cfg = LEVEL_CONFIGS[idx];

    // Carry upgrades across levels in a run; reset on fresh start
    const runUpgrades = opts.keepUpgrades ? (state.runUpgrades || []) : [];

    // Apply shop passives — each has level 0–5, effects scale with level
    const pl = id => Storage.getPassiveLevel(id);

    // Apply upgrade effects (roguelite run upgrades stack on top)
    const countUpg = id => runUpgrades.filter(u => u.id === id).length;
    const heartBonus  = countUpg('hearts') + pl('p_heart');
    const speedMult   = Math.pow(1.25, countUpg('speed')) * Math.pow(1.15, pl('p_speed'));
    const timeBonus   = countUpg('time') * 20 + pl('p_time') * 20;
    const tipsMult    = Math.pow(1.3,  countUpg('tips'));
    const quickMult   = Math.pow(0.65, countUpg('quick'));
    const luckyStarts = countUpg('lucky') + pl('p_lucky');

    // 3 random unique upgrade choices for end-of-level pick
    const upgradeChoices = shuffle([...UPGRADES_POOL]).slice(0, 3);

    state = {
      levelNum, cfg, levelIdx: idx,
      time: cfg.duration + timeBonus, spawnTimer: 2,
      score:0, completedOrders:0, failedOrders:0,
      phase: 'playing',
      stations: cfg.stations.map(s=>({...s,item:null,processing:false,processTimer:0,processingPlayer:null})),
      orders:[], floats:[],
      miniGame: null,
      runUpgrades,
      upgradeChoices,
      upgradePicked: false,
      luckyPours: luckyStarts,
      tipsMult,
      quickMult,
      hintDelay: Math.max(1, 5 - pl('p_hint') * 0.8),
      player: {
        id:0, x:cfg.playerStart.x, y:cfg.playerStart.y,
        vx:0, vy:0, radius:22, color:'#FF6B6B',
        holding:null, busy:false, facing:'down', walkCycle:0,
        stepTimer:0, hearts:HEARTS_MAX + heartBonus,
        maxHearts: HEARTS_MAX + heartBonus,
        speedMult,
      },
    };
  }

  function update(dt, keys) {
    if (state.phase!=='playing') return;

    // Mini-game active: update mini-game only, let floats tick
    if (state.miniGame?.active) {
      updateMiniGame(dt);
      state.floats = state.floats.filter(f=>{ f.y+=f.vy*dt; f.alpha-=dt/f.life; return f.alpha>0; });
      return;
    }

    state.time-=dt;
    if (state.time<=0) { state.time=0; state.phase='done'; return; }

    state.spawnTimer-=dt;
    if (state.spawnTimer<=0) { spawnOrder(); state.spawnTimer=state.cfg.spawnInterval; }

    for (let i=state.orders.length-1; i>=0; i--) {
      const o=state.orders[i]; o.timeLeft-=dt;
      if (o.timeLeft<=0) {
        if (state.player.holding?.orderId===o.id) state.player.holding=null;
        state.orders.splice(i,1); state.failedOrders++;
        state.score=Math.max(0,state.score-50); sfxFail();
      }
    }

    for (const s of state.stations) {
      if (!s.processing) continue;
      s.processTimer-=dt;
      if (s.processTimer<=0) {
        s.processing=false;
        const p=s.processingPlayer;
        if (p?.holding) { p.holding.steps[p.holding.step].done=true; p.holding.step++; p.stepTimer=0; sfxStep(); }
        if (p) p.busy=false;
        s.processingPlayer=null;
      }
    }

    state.floats = state.floats.filter(f=>{ f.y+=f.vy*dt; f.alpha-=dt/f.life; return f.alpha>0; });

    const p = state.player;
    if (!p.busy) {
      p.stepTimer += dt;
      p.vx=0; p.vy=0;
      if (keys['w']||keys['ArrowUp']   ||keys['touch_up'])    p.vy=-1;
      if (keys['s']||keys['ArrowDown'] ||keys['touch_down'])  p.vy= 1;
      if (keys['a']||keys['ArrowLeft'] ||keys['touch_left'])  p.vx=-1;
      if (keys['d']||keys['ArrowRight']||keys['touch_right']) p.vx= 1;
      const len=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
      if (len>1){p.vx/=len;p.vy/=len;}
      if (len>0) p.walkCycle+=dt*8;
      movePlayer(p,dt);
    }
  }

  function handleKeyDown(key) {
    if (state.miniGame?.active) {
      if (key === 'Escape') { closeMiniGame(); return; }
      const idx = ['1','2','3','4'].indexOf(key);
      if (idx !== -1) { selectMiniGameOption(idx); return; }
      return;
    }
    // Upgrade picker (level passed, upgrade not yet chosen)
    if (state.phase === 'done' && !state.upgradePicked) {
      const pass = state.score >= state.cfg.passScore;
      if (pass) {
        const idx = ['1','2','3'].indexOf(key);
        if (idx !== -1 && state.upgradeChoices?.[idx]) {
          state.runUpgrades.push(state.upgradeChoices[idx]);
          state.upgradePicked = true;
          sfxStep();
          return;
        }
      }
    }
    if (state.phase!=='playing') return;
    if (key.toLowerCase()==='e'||key==='touch_interact') interact(state.player);
  }

  function selectMiniGameOption(idx) {
    const mg = state.miniGame;
    if (!mg?.active || mg.feedbackTimer > 0) return;
    if (mg.phase === 'ingredient') {
      if (idx < mg.ingOptions.length) {
        // Simulate click on that option by finding its button
        const btn = mg.buttons.find(b => b.action === 'selectIng' && b.value === mg.ingOptions[idx]);
        if (btn) handleMiniGameClick(btn.x + 1, btn.y + 1);
      }
    } else {
      if (mg.amtOptions && idx < mg.amtOptions.length) {
        const btn = mg.buttons.find(b => b.action === 'selectAmt' && b.value === mg.amtOptions[idx]);
        if (btn) handleMiniGameClick(btn.x + 1, btn.y + 1);
      }
    }
  }

  function handleClick(cx, cy) {
    if (state.miniGame?.active) handleMiniGameClick(cx, cy);
  }

  function isMiniGameActive() { return !!state.miniGame?.active; }

  // ═══════════════════════════════════════════════════════
  //  RENDERING — SNES pixel-art aesthetic
  // ═══════════════════════════════════════════════════════

  // Drawing utilities
  function clamp(v) { return Math.max(0, Math.min(255, v|0)); }
  function hexRgb(h) { return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
  function lighten(hex,a){ const[r,g,b]=hexRgb(hex); return `rgb(${clamp(r+a)},${clamp(g+a)},${clamp(b+a)})`; }
  function darken(hex,a){ return lighten(hex,-a); }

  // Pixel-aligned rounded rect (no anti-alias tricks, crisp edges)
  function prect(x,y,w,h,fill,stroke,sw=2){
    x=x|0; y=y|0; w=w|0; h=h|0;
    if(fill){ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);}
    if(stroke){ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.strokeRect(x+sw/2,y+sw/2,w-sw,h-sw);}
  }

  function rrect(x,y,w,h,r=6,fill,stroke,sw=2){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    if(fill){ctx.fillStyle=fill; ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.stroke();}
  }

  // ── SNES-style brick wall ────────────────────────────────
  function drawBrickWall(x,y,w,h,darkCol,lightCol){
    const bW=36, bH=18;
    ctx.fillStyle=darkCol; ctx.fillRect(x,y,w,h);
    for(let row=0; row*bH<h; row++){
      const off = row%2===0 ? 0 : bW/2;
      for(let col=-1; (col*bW-off)<w; col++){
        const bx = Math.max(x, x+col*bW+off);
        const by = y+row*bH;
        const bw2 = Math.min(bW-2, x+w-bx-1);
        const bh2 = Math.min(bH-2, y+h-by-1);
        if(bw2<=2||bh2<=2) continue;
        ctx.fillStyle=lightCol; ctx.fillRect(bx+1,by+1,bw2,bh2);
        // Top highlight
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(bx+1,by+1,bw2,3);
        // Bottom shadow
        ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(bx+1,by+bh2-2,bw2,2);
      }
    }
  }

  // ── SNES-style tile floor ────────────────────────────────
  function drawFloor(){
    const [c1,c2] = state.cfg.floor;
    const tw=40, th=40, x0=82, y0=182, x1=818, y1=500;
    for(let tx=x0; tx<x1; tx+=tw){
      for(let ty=y0; ty<y1; ty+=th){
        const light = ((tx-x0)/tw+(ty-y0)/th)%2<1;
        const base = light?c1:c2;
        const tw2=Math.min(tw,x1-tx), th2=Math.min(th,y1-ty);
        ctx.fillStyle=base; ctx.fillRect(tx,ty,tw2,th2);
        // Grout lines
        ctx.fillStyle='rgba(0,0,0,0.18)';
        ctx.fillRect(tx,ty,tw2,2);
        ctx.fillRect(tx,ty,2,th2);
        // Corner highlight
        ctx.fillStyle='rgba(255,255,255,0.10)';
        ctx.fillRect(tx+2,ty+2,8,8);
        // Centre dot accent
        if(tw2>=tw && th2>=th){
          ctx.fillStyle='rgba(0,0,0,0.07)';
          ctx.fillRect(tx+tw/2-2,ty+th/2-2,4,4);
        }
      }
    }
  }

  function drawWalls(){
    const cfg = state.cfg;
    // Top wall — brick texture, taller to fill removed panel area
    drawBrickWall(0,0,900,185,cfg.wallBrick,cfg.wallBrickLt);
    // Dark cap strip at very top
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,900,4);
    // Visual separator between process stations and glass area
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(462,108,8,65);

    // Left / right wall strips — brick
    drawBrickWall(0,182,85,320,cfg.wallBrick,cfg.wallBrickLt);
    drawBrickWall(815,182,85,320,cfg.wallBrick,cfg.wallBrickLt);

    // Bar counter — SNES wood plank style
    const bFront=cfg.barWood, bLight=cfg.barWoodLt, bDark=cfg.barWoodDk;
    ctx.fillStyle=bDark; ctx.fillRect(0,498,900,82);
    // Wood planks
    for(let px2=0; px2<900; px2+=80){
      ctx.fillStyle=bFront; ctx.fillRect(px2,503,78,72);
      ctx.fillStyle=bLight; ctx.fillRect(px2,503,78,4);
      ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(px2+78,503,2,72);
    }
    // Bar top edge (shiny)
    ctx.fillStyle=bLight; ctx.fillRect(0,498,900,6);
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(0,498,900,2);
    // Serve cutouts
    [[170,508,128,56],[602,508,128,56]].forEach(([sx,sy,sw,sh])=>{
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(sx,sy,sw,sh);
      ctx.fillStyle=bLight; ctx.fillRect(sx,sy,sw,3);
    });

    // Score strip inside top wall
    drawScoreStrip();
  }

  function drawScoreStrip(){
    const p=state.player;
    const t=Math.max(0,Math.ceil(state.time));
    const timeStr=`${Math.floor(t/60)}:${(t%60).toString().padStart(2,'0')}`;
    // Hearts
    ctx.font='bold 14px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    const maxH = p.maxHearts || HEARTS_MAX;
    for(let i=0;i<maxH;i++){
      ctx.fillStyle = i<p.hearts ? '#EF4444' : '#3A1010';
      ctx.fillText('♥', 10+i*20, 16);
    }
    // Score
    ctx.fillStyle='#FFD700'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
    ctx.fillText(`SCORE: ${state.score}`, 75, 16);
    // Timer
    ctx.fillStyle=state.time<30?'#EF4444':'#F8F8F8';
    ctx.font='bold 16px monospace'; ctx.textAlign='center';
    ctx.fillText(timeStr, 450, 16);
    // Level name
    ctx.fillStyle='#8B6040'; ctx.font='bold 11px monospace'; ctx.textAlign='right';
    ctx.fillText(`Lv${state.cfg.num} ${state.cfg.name}`, 890, 16);
    // High score
    const hs=Storage.getHighScore(state.levelNum);
    if(hs){ ctx.fillStyle='#5A3A20'; ctx.font='10px monospace'; ctx.textAlign='right'; ctx.fillText(`BEST: ${hs}`,890,30); }
  }

  // ── Draw one station ────────────────────────────────────
  function drawStation(s){
    const p=state.player;
    const showHints = (p.stepTimer||0) > (state.hintDelay || HINT_DELAY);
    const inRange = distToRect(p.x,p.y,s) < 72;
    const cur = p.holding ? p.holding.steps[p.holding.step] : null;
    const needed = showHints && cur &&
      cur.type===s.type &&
      !(cur.subtype && s.subtype && cur.subtype!==s.subtype);

    // 3-D depth shadow (pixel art bevel)
    const depth=6;
    ctx.fillStyle=darken(s.color,60);
    ctx.fillRect(s.x|0,(s.y+s.h)|0,(s.w+depth)|0,depth);
    ctx.fillRect((s.x+s.w)|0,(s.y+depth)|0,depth,(s.h)|0);

    // Top face — lighter top-left for SNES 3D feel
    ctx.fillStyle=lighten(s.color,22); ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.fillStyle=lighten(s.color,40); ctx.fillRect(s.x,s.y,s.w,4);  // top highlight
    ctx.fillStyle=lighten(s.color,40); ctx.fillRect(s.x,s.y,4,s.h);  // left highlight
    ctx.fillStyle=darken(s.color,30); ctx.fillRect(s.x,s.y+s.h-4,s.w,4); // bottom shadow
    ctx.fillStyle=darken(s.color,30); ctx.fillRect(s.x+s.w-4,s.y,4,s.h); // right shadow
    // Outer border (pixel art outline)
    prect(s.x,s.y,s.w,s.h,null,'#0A0500',2);

    // Needed glow
    if(needed){
      ctx.shadowColor='#FFD700'; ctx.shadowBlur=18;
      prect(s.x-3,s.y-3,s.w+6,s.h+6,null,'#FFD700',3);
      ctx.shadowBlur=0;
    }
    // In-range border
    if(inRange && !needed){
      prect(s.x-2,s.y-2,s.w+4,s.h+4,null,'rgba(255,255,255,0.6)',2);
    }

    drawStationIcon(s);

    // Labels
    const midX=s.x+s.w/2;
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle='#0A0500'; ctx.font=`bold ${s.w<80?9:10}px monospace`;
    ctx.fillText(s.label, midX, s.y+s.h-(s.sublabel?14:5));
    if(s.sublabel){
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.font='8px monospace';
      ctx.fillText(s.sublabel.toUpperCase(), midX, s.y+s.h-3);
    }

    if(s.processing){
      ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(s.x+4,s.y+s.h-12,s.w-8,9);
      ctx.fillStyle='#FFD700';           ctx.fillRect(s.x+4,s.y+s.h-12,(s.w-8)*(1-s.processTimer/1.5),9);
    }

    if(s.type===ST.COUNTER && s.item){
      ctx.fillStyle=s.item.color||'#fff';
      ctx.beginPath(); ctx.arc(s.x+s.w/2,s.y+s.h/2,12,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#0A0500'; ctx.lineWidth=2; ctx.stroke();
    }

    // "E" prompt
    if(inRange){
      const px=s.x+s.w/2, py=s.y-14;
      prect(px-12,py-9,24,16,'#FFD700','#0A0500',2);
      ctx.fillStyle='#0A0500'; ctx.font='bold 10px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('E',px,py-1);
    }
  }

  // ── Station icons (SNES pixel-art style) ─────────────────
  function drawStationIcon(s){
    const cx=s.x+s.w/2|0, cy=(s.y+s.h/2-10)|0;
    const dc=darken(s.color,55), lc=lighten(s.color,35);
    ctx.save(); ctx.strokeStyle=dc; ctx.lineWidth=2; ctx.fillStyle=darken(s.color,20);

    if(s.type==='glass'){
      if(s.subtype==='highball'){
        prect(cx-8,cy-16,16,30,lc,dc,2);
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(cx-5,cy-13,4,22);
        ctx.fillStyle='rgba(180,230,255,0.3)'; ctx.fillRect(cx-8,cy-16,16,5);
      } else if(s.subtype==='lowball'){
        prect(cx-12,cy-7,24,20,lc,dc,2);
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(cx-9,cy-4,6,13);
        ctx.fillStyle='rgba(180,230,255,0.3)'; ctx.fillRect(cx-12,cy-7,24,4);
      } else {
        ctx.beginPath(); ctx.moveTo(cx-15,cy-15); ctx.lineTo(cx+15,cy-15); ctx.lineTo(cx,cy+12); ctx.closePath();
        ctx.fillStyle=lc; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx,cy+12); ctx.lineTo(cx,cy+20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-9,cy+20); ctx.lineTo(cx+9,cy+20); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(cx-13,cy-13); ctx.lineTo(cx-7,cy-13); ctx.lineTo(cx-2,cy+9); ctx.closePath(); ctx.fill();
      }
    } else if(s.type==='ice'){
      if(s.subtype==='cylinder'){
        prect(cx-7,cy-13,14,26,lc,dc,2);
        ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillRect(cx-5,cy-10,3,18);
        ctx.fillStyle='rgba(180,230,255,0.4)'; ctx.fillRect(cx-7,cy-13,14,4);
      } else if(s.subtype==='crushed'){
        [[cx-7,cy-11,9,7],[cx+1,cy-7,8,7],[cx-9,cy+1,7,7],[cx+2,cy+3,9,6]].forEach(([x,y,w,h])=>{
          prect(x,y,w,h,lc,dc,1.5);
          ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(x+1,y+1,3,2);
        });
      } else {
        prect(cx-11,cy-13,22,24,lc,dc,2);
        ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.fillRect(cx-8,cy-10,6,14);
        ctx.fillStyle='rgba(180,230,255,0.3)'; ctx.fillRect(cx-11,cy-13,22,4);
        // 3D cube lines
        ctx.strokeStyle=dc; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(cx-11,cy-13); ctx.lineTo(cx-17,cy-7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+11,cy-13); ctx.lineTo(cx+5,cy-19); ctx.lineTo(cx-7,cy-19); ctx.lineTo(cx-11,cy-13); ctx.stroke();
      }
    } else {
      switch(s.type){
        case 'shake':
          prect(cx-6,cy-16,12,9,lc,dc,2);
          prect(cx-8,cy-8,16,24,lc,dc,2);
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(cx-6,cy-6,4,18);
          break;
        case 'blend':
          ctx.beginPath(); ctx.moveTo(cx-8,cy-14); ctx.lineTo(cx+8,cy-14); ctx.lineTo(cx+10,cy+12); ctx.lineTo(cx-10,cy+12); ctx.closePath();
          ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx-8,cy+4); ctx.lineTo(cx+8,cy+4); ctx.stroke();
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(cx-6,cy-12,3,10);
          break;
        case 'muddle':
          prect(cx-4,cy-5,8,18,lc,dc,2);
          ctx.beginPath(); ctx.arc(cx,cy-9,5,0,Math.PI*2); ctx.fillStyle=lc; ctx.fill(); ctx.stroke();
          break;
        case 'garnish':
          ctx.beginPath(); ctx.arc(cx,cy+2,12,Math.PI,Math.PI*2); ctx.fillStyle=lc; ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx-12,cy+2); ctx.lineTo(cx+12,cy+2); ctx.stroke();
          ctx.fillStyle='#4CAF50';
          ctx.beginPath(); ctx.ellipse(cx+4,cy-9,7,4,-0.4,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#2A7030'; ctx.lineWidth=1.5; ctx.stroke();
          break;
        case 'trash':
          prect(cx-8,cy-9,16,20,lc,dc,2);
          ctx.strokeStyle=dc; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(cx-10,cy-9); ctx.lineTo(cx+10,cy-9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx-3,cy-9); ctx.lineTo(cx-3,cy-14); ctx.lineTo(cx+3,cy-14); ctx.lineTo(cx+3,cy-9); ctx.stroke();
          for(let ix=-4;ix<=4;ix+=4){ ctx.beginPath(); ctx.moveTo(cx+ix,cy-6); ctx.lineTo(cx+ix,cy+8); ctx.stroke(); }
          break;
        case 'spirits':
          prect(cx-4,cy+2,8,14,lc,dc,2);
          prect(cx-3,cy-12,6,16,lc,dc,2);
          prect(cx-2,cy-16,4,5,'#888',dc,1);
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(cx-2,cy-10,2,10);
          break;
        case 'mixers':
          prect(cx-8,cy-13,16,26,lc,dc,2);
          ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(cx-5,cy-10,3,18);
          ctx.fillStyle=lc; ctx.fillRect(cx-5,cy-13,10,4);
          break;
        case 'syrups':
          prect(cx-5,cy-3,10,16,lc,dc,2);
          prect(cx-3,cy-14,6,12,lc,dc,2);
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(cx-2,cy,3,9);
          break;
        case 'counter':
          ctx.strokeStyle=dc; ctx.lineWidth=3;
          ctx.beginPath(); ctx.moveTo(cx-24,cy); ctx.lineTo(cx-8,cy); ctx.moveTo(cx-14,cy-6); ctx.lineTo(cx-8,cy); ctx.lineTo(cx-14,cy+6); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx+24,cy); ctx.lineTo(cx+8,cy); ctx.moveTo(cx+14,cy-6); ctx.lineTo(cx+8,cy); ctx.lineTo(cx+14,cy+6); ctx.stroke();
          break;
        case 'serve':
          ctx.beginPath(); ctx.arc(cx,cy+6,11,0,Math.PI*2); ctx.fillStyle=lc; ctx.fill(); ctx.stroke();
          ctx.strokeStyle='#FFD700'; ctx.lineWidth=3;
          ctx.beginPath(); ctx.moveTo(cx,cy-13); ctx.lineTo(cx,cy-5); ctx.moveTo(cx-5,cy-9); ctx.lineTo(cx,cy-5); ctx.lineTo(cx+5,cy-9); ctx.stroke();
          break;
      }
    }
    ctx.restore();
  }

  // ── SNES player sprite ───────────────────────────────────
  function drawPlayer(p){
    const {x,y,radius,color,walkCycle,holding,busy}=p;
    // Cosmetics
    const equipped = Storage.getEquipped();
    const ec = {...equipped, ...(p._previewCosmetics||{})};
    const shopItems = Storage.getShopItems();
    const hatItem   = shopItems.find(i=>i.id===ec.hat);
    const apronItem = shopItems.find(i=>i.id===ec.apron);
    const accId     = ec.acc;
    const hatCol    = hatItem   ? hatItem.color   : color;
    const apronCol  = apronItem ? apronItem.color : color;
    const moving=Math.abs(p.vx)+Math.abs(p.vy)>0;
    const bob=Math.sin(walkCycle)*3*(moving?1:0);
    const legSwing=Math.sin(walkCycle)*4*(moving?1:0);
    ctx.save(); ctx.translate(x|0,(y+bob)|0);

    // Ground shadow
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0,radius-2,radius*0.65,4,0,0,Math.PI*2); ctx.fill();

    // Legs (SNES sprite style — two visible pixels)
    if(moving){
      ctx.fillStyle='#1A0800';
      ctx.fillRect(-7,10,5,8);
      ctx.fillRect( 3,10,5,8);
      ctx.fillStyle='#3A1800';
      ctx.fillRect(-7+legSwing|0,14,5,4);
      ctx.fillRect( 3-legSwing|0,14,5,4);
    } else {
      ctx.fillStyle='#1A0800';
      ctx.fillRect(-7,10,5,9); ctx.fillRect(3,10,5,9);
    }

    // Body / apron (white uniform + colored collar)
    ctx.fillStyle='#F0F0F0'; ctx.fillRect(-11,2,22,14);
    ctx.fillStyle=darken(apronCol,10); ctx.fillRect(-11,2,22,5); // colored top
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(-11,2,5,14); // highlight left
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(9,2,2,14); // shadow right
    ctx.fillStyle='#0A0500'; ctx.strokeRect(-11,2,22,14); // outline
    // Apron tie
    ctx.fillStyle=apronCol; ctx.fillRect(-2,4,4,8);

    // Head (pixel art — square-ish, African skin tone)
    const skinCol='#7A3E28';
    ctx.fillStyle=skinCol; ctx.fillRect(-10,-20,20,18);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(-10,-20,4,18); // highlight
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(8,-20,2,18); // shadow
    ctx.strokeStyle='#2A0800'; ctx.lineWidth=2; ctx.strokeRect(-10,-20,20,18);

    // Chef hat (white rectangle + puff)
    ctx.fillStyle='#FFFFFF'; ctx.fillRect(-11,-27,22,8);
    ctx.fillStyle='#E0E0E0'; ctx.fillRect(-11,-27,22,2); // shade top
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(-8,-36,16,10);
    ctx.fillStyle='#E8E8E8'; ctx.fillRect(-8,-36,16,3);
    ctx.strokeStyle='#CCCCCC'; ctx.lineWidth=1.5; ctx.strokeRect(-8,-36,16,10);
    ctx.strokeStyle='#CCCCCC'; ctx.strokeRect(-11,-27,22,8);
    // Hat band
    ctx.fillStyle=hatCol; ctx.fillRect(-11,-21,22,3);

    // Eyes (2px pixel art)
    const eyes={down:[[-4,-13],[4,-13]],up:[[-4,-17],[4,-17]],left:[[-7,-14],[-1,-13]],right:[[1,-13],[7,-14]]};
    ctx.fillStyle='#0A0500';
    (eyes[p.facing]||eyes.down).forEach(([ex,ey])=>{ ctx.fillRect(ex-2,ey-1,4,3); });

    // Accessory
    if(accId==='c_acc_bowtie'){
      ctx.fillStyle='#FFD700'; ctx.fillRect(-5,1,10,5);
      ctx.fillStyle='#C8A000'; ctx.beginPath(); ctx.moveTo(-5,1); ctx.lineTo(-5,6); ctx.lineTo(0,3.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5,1); ctx.lineTo(5,6); ctx.lineTo(0,3.5); ctx.closePath(); ctx.fill();
    } else if(accId==='c_acc_shades'){
      ctx.fillStyle='rgba(17,17,17,0.85)';
      ctx.fillRect(-10,-16,8,5); ctx.fillRect(2,-16,8,5);
      ctx.strokeStyle='#555'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-2,-14); ctx.lineTo(2,-14); ctx.stroke();
    } else if(accId==='c_acc_tache'){
      ctx.fillStyle='#2A1A0A';
      ctx.beginPath(); ctx.ellipse(-3,-7,5,2.5,0.2,0,Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(3,-7,5,2.5,-0.2,0,Math.PI); ctx.fill();
    }

    // Holding bubble
    if(holding){
      const prog=holding.step/holding.steps.length;
      rrect(-20,-62,40,26,5,holding.color||'#6EC6E6','#0A0500',2);
      ctx.fillStyle='#6EE7B7'; ctx.fillRect(-18,-54,36*prog|0,6);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.strokeRect(-18,-54,36,6);
      ctx.fillStyle='#0A0500'; ctx.font='7px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(holding.drinkName.substring(0,12),0,-47);
    }

    // Busy spinner
    if(busy){
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=3; ctx.setLineDash([8,5]);
      ctx.beginPath(); ctx.arc(0,0,radius+8,Date.now()/280,Date.now()/280+Math.PI*1.5); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // ── Guidance arrows (delayed by HINT_DELAY seconds) ──────
  function drawTargetArrows(){
    const p=state.player;
    if(!p.holding||(p.stepTimer||0)<(state.hintDelay || HINT_DELAY)) return;
    const cur=p.holding.steps[p.holding.step]; if(!cur) return;
    const target=state.stations.find(s=>{
      if(s.type!==cur.type) return false;
      if(cur.subtype&&s.subtype&&cur.subtype!==s.subtype) return false;
      return true;
    });
    if(!target) return;
    const tx=target.x+target.w/2, ty=target.y+target.h/2;
    const dx=tx-p.x, dy=ty-p.y, d=Math.sqrt(dx*dx+dy*dy);
    if(d<90) return;
    const nx=dx/d, ny=dy/d;
    ctx.save(); ctx.setLineDash([5,9]);
    ctx.strokeStyle='rgba(255,215,0,0.25)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(p.x+nx*32,p.y+ny*32); ctx.lineTo(tx-nx*45,ty-ny*45); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle='rgba(255,215,0,0.6)';
    const angle=Math.atan2(dy,dx);
    ctx.save(); ctx.translate(tx-nx*47,ty-ny*47); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(9,0); ctx.lineTo(-5,-5); ctx.lineTo(-5,5); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.restore();
  }

  // ── Customer sprites at bar bottom ───────────────────────
  function drawCustomers(){
    if(!state.orders.length) return;
    const total=state.orders.length;
    state.orders.forEach((o,i)=>{
      const cx = total===1 ? 450 :
                 total===2 ? [230,670][i] :
                 total===3 ? [180,450,720][i] :
                 [160,360,540,740][i];
      drawCustomerFigure(cx, o);
    });
  }

  function drawCustomerFigure(cx, o){
    const pct = o.timeLeft/o.maxTime;
    const bubbleCol = pct>0.5?'#2A6030':pct>0.25?'#7A6010':'#7A1010';
    const headY = 484;
    const shakeX = (pct<0.15 && Math.sin(Date.now()/60)>0) ? 2 : 0;
    const claimed = state.player.holding?.orderId === o.id;
    const col = o.custColor || '#74B9FF';

    ctx.save(); ctx.translate(shakeX, 0);

    // Body (behind bar, only arms + head visible)
    // Arms on bar
    ctx.fillStyle=col;
    ctx.fillRect(cx-28,495,56,8); // forearms on bar
    ctx.fillStyle=darken(col,15);
    ctx.fillRect(cx-28,495,56,3); // arm top

    // Head
    ctx.fillStyle='#F5C890'; ctx.beginPath(); ctx.arc(cx,headY,14,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#0A0500'; ctx.lineWidth=2; ctx.stroke();
    // Hair
    ctx.fillStyle=col; ctx.fillRect(cx-14,headY-16,28,8);
    ctx.strokeStyle='#0A0500'; ctx.lineWidth=1.5; ctx.stroke();
    // Eyes
    ctx.fillStyle='#0A0500'; ctx.fillRect(cx-6,headY-4,3,3); ctx.fillRect(cx+3,headY-4,3,3);
    // Mouth: smile or frown
    if(pct>0.4){
      ctx.beginPath(); ctx.arc(cx,headY+4,5,0.1,Math.PI-0.1); ctx.strokeStyle='#0A0500'; ctx.lineWidth=1.5; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx,headY+9,5,Math.PI+0.1,-0.1); ctx.stroke();
    }

    // Speech bubble — drink name only, no recipe hints
    const bW=160, bH=44, bX=cx-bW/2, bY=headY-bH-18;
    rrect(bX,bY,bW,bH,8,claimed?'#0A1A0A':'#FFF8E7',bubbleCol,2.5);
    // Bubble arrow
    ctx.fillStyle=claimed?'#0A1A0A':'#FFF8E7';
    ctx.beginPath(); ctx.moveTo(cx-8,bY+bH); ctx.lineTo(cx+8,bY+bH); ctx.lineTo(cx,headY-4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=bubbleCol; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(cx-8,bY+bH); ctx.lineTo(cx,headY-4); ctx.lineTo(cx+8,bY+bH); ctx.stroke();

    // Just the drink name
    ctx.fillStyle=claimed?'#6EE7B7':'#1A0800'; ctx.font='bold 10px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const drinkName=o.drink.name;
    const line1=drinkName.length>20?drinkName.substring(0,19)+'…':drinkName;
    ctx.fillText(line1, cx, bY+bH/2);

    // Patience bar under bubble
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(bX+4,bY+bH-6,bW-8,4);
    ctx.fillStyle=bubbleCol;         ctx.fillRect(bX+4,bY+bH-6,(bW-8)*pct,4);

    ctx.restore();
  }

  // ── Mini-game shelf overlay ──────────────────────────────
  function drawMiniGame(){
    const mg=state.miniGame;
    if(!mg?.active) return;
    mg.buttons=[];

    // Shake offset
    const shakeOff=mg.shakeTimer>0?(Math.sin(Date.now()/30)*6|0):0;

    // Dark overlay
    ctx.fillStyle='rgba(0,0,0,0.82)'; ctx.fillRect(0,0,900,640);

    ctx.save(); ctx.translate(shakeOff,0);

    const cw=720, ch=400, cx=(900-cw)/2, cy=(640-ch)/2;
    // Card background — SNES dark panel
    prect(cx,cy,cw,ch,'#120A04','#C8A040',3);
    // Top title bar
    prect(cx,cy,cw,36,'#2A1500',null);
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(cx,cy,cw,2);

    // Station type label
    const typeLabel={spirits:'SPIRITS SHELF',mixers:'MIXERS SHELF',syrups:'SYRUPS SHELF',garnish:'GARNISH STATION'}[mg.stationType]||'SELECT INGREDIENT';
    ctx.fillStyle='#FFD700'; ctx.font='bold 14px monospace';
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(typeLabel, cx+14, cy+18);

    // Phase indicator
    ctx.fillStyle='#8B6040'; ctx.font='11px monospace'; ctx.textAlign='right';
    ctx.fillText(mg.phase==='ingredient'?'STEP 1 of 2: SELECT BOTTLE':'STEP 2 of 2: MEASURE AMOUNT', cx+cw-12, cy+18);

    // Hearts in top-right
    const maxH=state.player.maxHearts||HEARTS_MAX;
    for(let i=0;i<maxH;i++){
      ctx.fillStyle=i<state.player.hearts?'#EF4444':'#3A1010';
      ctx.font='16px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText('♥',cx+cw-14-i*22,cy+18);
    }

    // ── Build log (left column) ───────────────────────────
    const logX=cx+10, logY=cy+46, logW=160;
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(logX,logY,logW,ch-56);
    ctx.fillStyle='#C8A040'; ctx.font='bold 9px monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText('BUILD LOG:', logX+6, logY+6);
    mg.buildLog.forEach((entry,i)=>{
      ctx.fillStyle='#6EE7B7'; ctx.font='8px monospace';
      ctx.fillText('✓ '+entry, logX+6, logY+22+i*14);
    });
    // Current step pending
    ctx.fillStyle='#FFD700'; ctx.font='bold 8px monospace';
    ctx.fillText('▶ '+mg.cur.text.substring(0,22), logX+6, logY+22+mg.buildLog.length*14);

    // ── Right panel ───────────────────────────────────────
    const panX=cx+logW+18, panW=cw-logW-28;

    if(mg.phase==='ingredient'){
      drawIngredientPhase(mg, panX, cy+46, panW, ch-56);
    } else {
      drawAmountPhase(mg, panX, cy+46, panW, ch-56);
    }

    // ── Feedback message ──────────────────────────────────
    if(mg.feedback){
      const fCol=mg.feedback==='correct'?'#6EE7B7':'#EF4444';
      rrect(cx+cw/2-140,cy+ch-46,280,30,6,
            mg.feedback==='correct'?'rgba(6,78,0,0.8)':'rgba(100,0,0,0.8)',fCol,2);
      ctx.fillStyle=fCol; ctx.font='bold 12px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(mg.feedbackMsg, cx+cw/2, cy+ch-31);
    }

    // ESC / keyboard hint
    ctx.fillStyle='#5A4020'; ctx.font='9px monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText('Press 1–4 or click to select  •  ESC = cancel', cx+cw/2, cy+ch+18);

    ctx.restore();
  }

  function drawIngredientPhase(mg, panX, panY, panW, panH){
    ctx.fillStyle='#C8A040'; ctx.font='bold 11px monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText('Which bottle do you need?', panX, panY+6);

    const cols=mg.ingOptions.length<=4?mg.ingOptions.length:2;
    const bW=Math.min(135, (panW-(cols+1)*10)/cols), bH=130;
    const totalW=cols*bW+(cols-1)*10;
    const startX=panX+(panW-totalW)/2;
    const startY=panY+30;

    mg.ingOptions.forEach((opt,i)=>{
      const col=i%cols, row=Math.floor(i/cols);
      const bx=startX+col*(bW+10), by=startY+row*(bH+10);
      const isSelected=mg.selectedIng?.toLowerCase()===opt.toLowerCase();
      const correctHint=mg.feedback==='wrong'&&opt.toLowerCase()===mg.correctIng;

      let bgCol='#1A0A00';
      if(isSelected&&mg.feedback==='correct') bgCol='#0A2A0A';
      else if(correctHint) bgCol='#0A2A0A';
      else if(mg.feedback==='wrong'&&mg.selectedIng?.toLowerCase()===opt.toLowerCase()) bgCol='#2A0A0A';

      prect(bx,by,bW,bH,bgCol,isSelected?'#FFD700':'#4A2A00',2);
      // SNES bevel
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(bx,by,bW,3);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(bx,by+bH-3,bW,3);

      // Key hint badge
      ctx.fillStyle='rgba(255,215,0,0.18)'; ctx.fillRect(bx+4,by+4,18,16);
      ctx.fillStyle='#FFD700'; ctx.font='bold 10px monospace';
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText(String(i+1), bx+8, by+5);

      // Bottle shape (pixel art)
      drawPixelBottle(bx+bW/2|0, by+65, mg.stationType, bW*0.3|0);

      ctx.fillStyle=isSelected?'#FFD700':'#C8A870'; ctx.font='bold 9px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      const lines=wrapWord(opt,14);
      lines.forEach((ln,li)=>ctx.fillText(ln, bx+bW/2, by+bH-20+li*11));

      if(!mg.feedbackTimer||mg.feedbackTimer<=0.4){
        mg.buttons.push({x:bx,y:by,w:bW,h:bH,action:'selectIng',value:opt});
      }
    });
  }

  function drawAmountPhase(mg, panX, panY, panW, panH){
    ctx.fillStyle='#C8A040'; ctx.font='bold 11px monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText(`How much ${mg.selectedIng}?`, panX, panY+6);

    // Jigger visual (left)
    const jx=panX+50, jy=panY+50;
    drawJigger(jx, jy, mg.correctAmt);

    // Amount buttons (right)
    const btnX=panX+panW-170;
    ctx.fillStyle='#8B6040'; ctx.font='bold 10px monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText('Select amount:', btnX, panY+28);

    (mg.amtOptions||[]).forEach((opt,i)=>{
      const bx=btnX, by=panY+46+i*58;
      const bw=148, bh=44;
      prect(bx,by,bw,bh,'#1A0A00',opt===mg.correctAmt&&mg.feedback==='wrong'?'#6EE7B7':'#4A2A00',2);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,by,bw,3);
      // Key hint
      ctx.fillStyle='rgba(255,215,0,0.18)'; ctx.fillRect(bx+4,by+4,18,16);
      ctx.fillStyle='#FFD700'; ctx.font='bold 10px monospace';
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText(String(i+1), bx+8, by+5);
      ctx.fillStyle='#F0D890'; ctx.font='bold 14px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(opt, bx+bw/2, by+bh/2);
      if(!mg.feedbackTimer||mg.feedbackTimer<=0.4){
        mg.buttons.push({x:bx,y:by,w:bw,h:bh,action:'selectAmt',value:opt});
      }
    });
  }

  function drawJigger(cx, cy, correctAmt){
    const jW=50, jH=100;
    const x=cx-jW/2|0, y=cy|0;
    const correctN = correctAmt==='top up'?5:correctAmt==='a dash'?0.5:parseFloat(correctAmt)||0;
    const maxCl=5;

    // Outer jigger shape
    ctx.fillStyle='#8B8070';
    ctx.beginPath();
    ctx.moveTo(x,y); ctx.lineTo(x+jW,y);
    ctx.lineTo(x+jW*0.6,y+jH*0.45);
    ctx.lineTo(x+jW*0.4,y+jH*0.45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#C8B870'; ctx.lineWidth=2; ctx.stroke();
    // Inner (dark)
    ctx.fillStyle='#2A1800';
    ctx.beginPath();
    ctx.moveTo(x+4,y+4); ctx.lineTo(x+jW-4,y+4);
    ctx.lineTo(x+jW*0.6-2,y+jH*0.45-4);
    ctx.lineTo(x+jW*0.4+2,y+jH*0.45-4); ctx.closePath(); ctx.fill();

    // Liquid fill
    const fillPct=Math.min(correctN/maxCl,1);
    const fillH=(jH*0.42)*fillPct;
    const fillW=jW-12;
    const fillY=y+jH*0.44-fillH;
    ctx.fillStyle='rgba(100,180,255,0.6)';
    ctx.fillRect(x+6,fillY|0,fillW,fillH|0);

    // Amount markings
    for(let cl=1;cl<=5;cl++){
      const pct=cl/maxCl;
      const lineY=(y+jH*0.44-(jH*0.42)*pct)|0;
      ctx.strokeStyle=cl===Math.round(correctN)?'#FFD700':'rgba(200,180,110,0.5)';
      ctx.lineWidth=cl===Math.round(correctN)?2:1;
      ctx.beginPath(); ctx.moveTo(x+jW-4,lineY); ctx.lineTo(x+jW+8,lineY); ctx.stroke();
      ctx.fillStyle=cl===Math.round(correctN)?'#FFD700':'rgba(200,180,110,0.6)';
      ctx.font=`${cl===Math.round(correctN)?'bold ':''} 8px monospace`;
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(`${cl}cl`,x+jW+10,lineY);
    }

    // Label above jigger
    ctx.fillStyle='#FFD700'; ctx.font='bold 10px monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText(correctAmt||'?', cx, y-4);
  }

  function drawPixelBottle(cx, cy, type, sz){
    const colors={spirits:'#8B5A2A',mixers:'#2A5A3A',syrups:'#5A2A7A',garnish:'#2A5A1A'};
    const col=colors[type]||'#8B5A2A';
    const lc=lighten(col,30);
    // Bottle body
    prect(cx-sz/2|0, cy-sz|0, sz, sz*2, lc, darken(col,20), 2);
    // Neck
    prect(cx-sz/4|0, cy-sz*1.5|0, sz/2|0, sz*0.55|0, lc, darken(col,20), 2);
    // Cap
    prect(cx-sz/4-2|0, cy-sz*1.55-4|0, sz/2+4|0, 6, '#888', darken(col,30), 1.5);
    // Label
    prect(cx-sz/2+2|0, cy-sz/2+2|0, sz-4, sz-4, darken(col,10), null);
    // Highlight
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(cx-sz/2+3|0, cy-sz+2|0, 3, sz*1.8|0);
  }

  function wrapWord(text, maxLen){
    if(text.length<=maxLen) return [text];
    const mid=text.lastIndexOf(' ',maxLen);
    if(mid<1) return [text.substring(0,maxLen),text.substring(maxLen)];
    return [text.substring(0,mid),text.substring(mid+1)];
  }

  // ── HUD (bottom strip, minimal) ──────────────────────────
  function drawHUD(){
    ctx.fillStyle='#120A04'; ctx.fillRect(0,572,900,68);
    ctx.fillStyle='#3D2010'; ctx.fillRect(0,572,900,3);
    // Target score bar
    const cfg=state.cfg;
    const scorePct=Math.min(state.score/cfg.passScore,1);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(10,610,880,16);
    ctx.fillStyle=scorePct>=1?'#FFD700':'#3A7A3A'; ctx.fillRect(10,610,880*scorePct|0,16);
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,610,880*scorePct|0,4);
    // Labels
    ctx.fillStyle='#8B6040'; ctx.font='9px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(`Target: ${cfg.passScore}`, 10, 600);
    ctx.fillStyle='#8B6040'; ctx.font='9px monospace'; ctx.textAlign='right';
    ctx.fillText(`✓${state.completedOrders}  ✗${state.failedOrders}  |  WASD+E to play  |  ESC=menu`, 890, 600);
    ctx.fillStyle=state.score>=cfg.passScore?'#FFD700':'#D0D0D0'; ctx.font='bold 11px monospace'; ctx.textAlign='center';
    ctx.fillText(`${state.score} / ${cfg.passScore}`, 450, 620);
  }

  // ── Level end / failed overlay ───────────────────────────
  function drawLevelEnd(){
    const cfg=state.cfg;
    const failed=state.phase==='failed';
    const pass=!failed&&state.score>=cfg.passScore;
    const showUpgrades=pass&&!state.upgradePicked;

    ctx.fillStyle='rgba(0,0,0,0.82)'; ctx.fillRect(0,0,900,640);

    // Box height depends on whether upgrade picker is shown
    const bH=showUpgrades?500:280;
    const bX=150, bY=(640-bH)/2, bW=600;
    const boxCol=failed?'#2A0808':pass?'#0A2A0A':'#1A1000';
    const bordCol=failed?'#EF4444':pass?'#6EE7B7':'#EF4444';
    rrect(bX,bY,bW,bH,18,boxCol,bordCol,3);

    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=failed?'#EF4444':pass?'#6EE7B7':'#EF4444';
    ctx.font='bold 36px monospace';
    ctx.fillText(failed?'💔 OUT OF HEARTS!':pass?'⭐ LEVEL CLEAR!':"TIME'S UP!",450,bY+48);

    if(!failed){
      ctx.fillStyle='#FFD700'; ctx.font='bold 24px monospace';
      ctx.fillText(`Score: ${state.score}`,450,bY+98);
      ctx.fillStyle='#C8A870'; ctx.font='13px monospace';
      ctx.fillText(`Target: ${cfg.passScore}  |  Best: ${Storage.getHighScore(state.levelNum)}`,450,bY+132);
      ctx.fillText(`Served: ${state.completedOrders}  |  Missed: ${state.failedOrders}`,450,bY+156);
    } else {
      ctx.fillStyle='#C8A870'; ctx.font='13px monospace';
      ctx.fillText('Too many wrong pours — keep studying!',450,bY+100);
      ctx.fillText(`Score so far: ${state.score}`,450,bY+126);
    }

    if(showUpgrades){
      // Upgrade picker
      ctx.fillStyle='#FFD700'; ctx.font='bold 13px monospace';
      ctx.fillText('— PICK YOUR UPGRADE (press 1, 2 or 3) —',450,bY+192);
      drawUpgradeCards(bX+20,bY+210,bW-40);
    } else {
      // Action hints
      const hintY=bY+bH-36;
      ctx.fillStyle='#F8F8F8'; ctx.font='13px monospace';
      if(pass&&state.upgradePicked){
        const picked=state.runUpgrades[state.runUpgrades.length-1];
        ctx.fillStyle='#6EE7B7';
        ctx.fillText(`${picked.icon} ${picked.label} equipped!  ENTER = Next Level`,450,hintY-16);
      } else {
        ctx.fillText(pass?'ENTER = Next Level':'ENTER = Retry',450,hintY-16);
      }
      ctx.fillStyle='#5A4020'; ctx.font='11px monospace';
      ctx.fillText('ESC = Main Menu',450,hintY+12);
    }
  }

  function drawUpgradeCards(startX,startY,totalW){
    const choices=state.upgradeChoices||[];
    const cardW=(totalW-20)/3, cardH=240;
    choices.forEach((upg,i)=>{
      const cx=startX+i*(cardW+10);
      const isLast=state.upgradePicked&&state.runUpgrades[state.runUpgrades.length-1]?.id===upg.id;
      const bg=isLast?'#0A2A0A':'#1A0A00';
      const bord=isLast?upg.color:'#4A2A00';
      rrect(cx,startY,cardW,cardH,10,bg,bord,2);
      // Number badge
      ctx.fillStyle='rgba(255,215,0,0.2)'; ctx.fillRect(cx+6,startY+6,22,18);
      ctx.fillStyle='#FFD700'; ctx.font='bold 12px monospace';
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText(String(i+1),cx+10,startY+8);
      // Icon
      ctx.font='32px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(upg.icon,cx+cardW/2,startY+60);
      // Label
      ctx.fillStyle=upg.color; ctx.font='bold 11px monospace';
      ctx.fillText(upg.label,cx+cardW/2,startY+102);
      // Desc (word-wrapped)
      ctx.fillStyle='#C8A870'; ctx.font='9px monospace';
      const words=upg.desc.split(' '); let line=''; let lineY=startY+124;
      words.forEach(w=>{
        const test=line?line+' '+w:w;
        if(ctx.measureText(test).width>cardW-12){
          ctx.fillText(line,cx+cardW/2,lineY); line=w; lineY+=13;
        } else { line=test; }
      });
      if(line) ctx.fillText(line,cx+cardW/2,lineY);
      // Run count badge
      const already=state.runUpgrades.filter(u=>u.id===upg.id).length;
      if(already>0){
        ctx.fillStyle='#FFD700'; ctx.font='9px monospace';
        ctx.fillText(`(×${already+1} if picked)`,cx+cardW/2,startY+cardH-16);
      }
    });
  }

  // ── Subtle CRT scanlines ─────────────────────────────────
  function drawScanlines(){
    ctx.fillStyle='rgba(0,0,0,0.04)';
    for(let y=0; y<640; y+=2) ctx.fillRect(0,y,900,1);
  }

  function render(){
    if(!canvas||!state.player) return;
    drawWalls();
    drawFloor();
    state.stations.forEach(drawStation);
    drawTargetArrows();
    drawCustomers();
    drawPlayer(state.player);
    state.floats.forEach(f=>{
      ctx.globalAlpha=Math.max(0,f.alpha);
      ctx.fillStyle=f.color||'#FFD700'; ctx.font=`bold ${f.size||18}px monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(f.text,f.x,f.y); ctx.globalAlpha=1;
    });
    drawHUD();
    if(state.phase==='done'||state.phase==='failed') drawLevelEnd();
    if(state.miniGame?.active) drawMiniGame();
    drawScanlines();
  }

  function getPhase()      { return state.phase; }
  function getScore()      { return state.score; }
  function getLevelCount() { return LEVEL_CONFIGS.length; }
  function isLevelPassed() { return state.score>=state.cfg.passScore; }

  function drawAvatarPreview(targetCtx, cx, cy, scale, previewCosmetics) {
    // Draw the bartender sprite on an external canvas for the shop preview
    const origCtx = ctx;
    ctx = targetCtx;
    const fakeP = {
      x: cx, y: cy, vx:0, vy:0, radius:22, color:'#FF6B6B',
      holding:null, busy:false, facing:'down', walkCycle: Date.now()/400,
      stepTimer:0, maxHearts:3, hearts:3,
      _previewCosmetics: previewCosmetics || {},
    };
    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.scale(scale, scale);
    targetCtx.translate(-cx, -cy);
    drawPlayer(fakeP);
    targetCtx.restore();
    ctx = origCtx;
  }

  return {
    init, startLevel, update, render,
    handleKeyDown, handleClick, isMiniGameActive,
    getPhase, getScore, getLevelCount, isLevelPassed,
    isUpgradePicked: () => !!state.upgradePicked,
    drawAvatarPreview,
  };
})();
