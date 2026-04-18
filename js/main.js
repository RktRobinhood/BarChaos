'use strict';

// ═══════════════════════════════════════════════════════════
//  main.js  –  Game engine, state machine, input, loop
// ═══════════════════════════════════════════════════════════

const Main = (() => {
  const CANVAS_W = 900;
  const CANVAS_H = 640;

  let canvas, ctx;
  let lastTime   = 0;
  let gameState  = 'mainMenu';
  let numPlayers = 1;
  let currentLevel = 1;
  const keys     = {};

  // ── Boot ─────────────────────────────────────────────────
  function boot() {
    canvas = document.getElementById('canvas');
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx = canvas.getContext('2d');

    Game.init(canvas, ctx);
    Training.init(canvas, ctx);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   e => { keys[e.key] = false; });
    window.addEventListener('resize',  onResize);
    onResize();

    buildMenuStudyUI();
    setState('mainMenu');
    requestAnimationFrame(loop);
  }

  function onResize() {
    const scaleX = window.innerWidth  / CANVAS_W;
    const scaleY = window.innerHeight / CANVAS_H;
    const scale  = Math.min(scaleX, scaleY, 1);
    canvas.style.width  = `${CANVAS_W * scale}px`;
    canvas.style.height = `${CANVAS_H * scale}px`;
  }

  // ── Main loop ────────────────────────────────────────────
  function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (gameState === 'campaign') {
      Game.update(dt, keys);
      Game.render(ctx);
      // Check level end
      if (Game.getPhase() === 'done') {
        // Still rendering via Game.render (shows end screen)
      }
    } else if (gameState === 'training') {
      Training.update(dt);
      Training.render();
    } else {
      // Non-game states: draw animated background only
      drawAnimBg(ts / 1000);
    }

    requestAnimationFrame(loop);
  }

  // Subtle animated starfield for menu screens
  function drawAnimBg(t) {
    for (let i = 0; i < 60; i++) {
      const seed  = i * 73.4;
      const x     = ((seed * 137.5) % CANVAS_W);
      const y     = ((seed * 97.1)  % CANVAS_H);
      const blink = (Math.sin(t * 0.8 + i) + 1) / 2;
      ctx.fillStyle = `rgba(100,150,255,${blink * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── State machine ────────────────────────────────────────
  const SCREENS = ['mainMenu','levelSelect',
                   'campaign','trainingSelect','training',
                   'menuStudy','settings'];

  function setState(s, opts = {}) {
    gameState = s;
    SCREENS.forEach(id => {
      const el = document.getElementById('screen-' + id);
      if (el) el.classList.toggle('active', id === s);
    });

    // Show touch D-pad only during campaign
    const tc = document.getElementById('touch-controls');
    if (tc) tc.classList.toggle('visible', s === 'campaign');

    if (s === 'campaign') {
      Game.startLevel(opts.level || currentLevel);
    }
    if (s === 'training' && opts.drinkId) {
      Training.startDrink(opts.drinkId);
    }
    if (s === 'menuStudy') {
      refreshStudyGrid();
    }
    if (s === 'trainingSelect') {
      refreshTrainingSelect();
    }
    if (s === 'levelSelect') {
      refreshLevelSelect();
    }
  }

  // ── Input ────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.key] = true;

    if (gameState === 'campaign') {
      Game.handleKeyDown(e.key);
      if (e.key === 'Escape') setState('mainMenu');
      if (e.key === 'Enter' && Game.getPhase() === 'done') {
        if (Game.isLevelPassed() && currentLevel < Game.getLevelCount()) {
          currentLevel++;
        }
        setState('levelSelect');
      }
    }
    if (gameState === 'training' && e.key === 'Escape') setState('trainingSelect');
    if (gameState === 'menuStudy'  && e.key === 'Escape') setState('mainMenu');
  }

  // ── Build Study UI (runs once) ───────────────────────────
  function buildMenuStudyUI() {
    // The study screen is pure HTML. We populate it dynamically.
  }

  // ── Refresh study grid ───────────────────────────────────
  function refreshStudyGrid(filterCat = 'all', search = '') {
    const grid = document.getElementById('study-grid');
    if (!grid) return;
    let drinks = Storage.getAllDrinks();

    if (filterCat !== 'all') drinks = drinks.filter(d => d.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      drinks = drinks.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.ingredients.some(i => i.item.toLowerCase().includes(q))
      );
    }

    grid.innerHTML = drinks.length === 0
      ? '<p class="no-drinks">No drinks found.</p>'
      : drinks.map(d => drinkCardHTML(d)).join('');
  }

  function drinkCardHTML(d) {
    const prog  = Storage.getTrainingProgress(d.id);
    const badge = prog.mastered ? '<span class="mastered-badge">★</span>' : '';
    return `
      <div class="drink-card" onclick="Main.openDrinkDetail('${d.id}')">
        <div class="card-swatch" style="background:${d.color||'#888'}"></div>
        <div class="card-body">
          <div class="card-name">${d.name}${badge}</div>
          <div class="card-meta">${d.glass} &bull; ${d.method}</div>
          <div class="card-ings">${d.ingredients.slice(0, 3).map(i => i.item).join(', ')}${d.ingredients.length > 3 ? '…' : ''}</div>
        </div>
      </div>
    `;
  }

  // ── Drink detail modal ───────────────────────────────────
  function openDrinkDetail(drinkId) {
    const d = Storage.getDrinkById(drinkId);
    if (!d) return;

    const modal = document.getElementById('modal-detail');
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header" style="border-color:${d.color}">
          <div class="modal-swatch" style="background:${d.color}"></div>
          <div>
            <h2>${d.name}</h2>
            <div class="modal-meta">
              <span>Glass: <strong>${d.glass}</strong></span>
              <span>Ice: <strong>${d.ice}</strong></span>
              <span>Method: <strong>${d.method}</strong></span>
            </div>
          </div>
          <button class="btn-close" onclick="Main.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="modal-col">
            <h3>Ingredients</h3>
            <ul class="ing-list">
              ${d.ingredients.map(i => `<li><span class="ing-amt">${i.amount}</span> ${i.item}</li>`).join('')}
            </ul>
            <div class="garnish-line">Garnish: <strong>${d.garnish}</strong></div>
          </div>
          <div class="modal-col">
            <h3>Steps</h3>
            <ol class="steps-list">
              ${d.steps.map(s => `<li class="step-item step-${s.type}">${s.text}</li>`).join('')}
            </ol>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" onclick="Main.trainDrink('${d.id}')">Train This Drink</button>
          <button class="btn-secondary" onclick="Main.editDrink('${d.id}')">Edit Recipe</button>
          ${d.isCustom ? `<button class="btn-danger" onclick="Main.deleteDrink('${d.id}')">Delete</button>` : ''}
        </div>
      </div>
    `;
    modal.classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-detail').classList.remove('open');
    document.getElementById('modal-edit').classList.remove('open');
  }

  function trainDrink(drinkId) {
    closeModal();
    setState('training', { drinkId });
  }

  // ── Edit / Add drink ─────────────────────────────────────
  function editDrink(drinkId) {
    closeModal();
    const d = Storage.getDrinkById(drinkId) || {};
    showEditForm(d, false);
  }

  function addDrink() {
    showEditForm({
      name: '', glass: 'Highball', ice: 'Cylinder', method: 'Build',
      garnish: '', color: '#AAAAFF', category: 'build', difficulty: 1,
      ingredients: [{ amount: '', item: '' }],
      steps: [{ type: 'glass', text: 'Pick up glass' }],
    }, true);
  }

  function deleteDrink(drinkId) {
    if (!confirm('Delete this custom drink?')) return;
    Storage.deleteCustomDrink(drinkId);
    closeModal();
    refreshStudyGrid();
  }

  function showEditForm(d, isNew) {
    const modal = document.getElementById('modal-edit');
    modal.innerHTML = `
      <div class="modal-box edit-form">
        <div class="modal-header">
          <h2>${isNew ? 'Add New Drink' : 'Edit: ' + d.name}</h2>
          <button class="btn-close" onclick="Main.closeModal()">✕</button>
        </div>
        <form id="drink-form" class="edit-fields" onsubmit="return false">
          <input type="hidden" id="ef-id" value="${d.id || ''}">
          <input type="hidden" id="ef-isnew" value="${isNew}">

          <label>Name
            <input id="ef-name" value="${esc(d.name)}" required>
          </label>
          <div class="ef-row">
            <label>Glass<input id="ef-glass" value="${esc(d.glass)}"></label>
            <label>Ice<input id="ef-ice" value="${esc(d.ice)}"></label>
            <label>Method<input id="ef-method" value="${esc(d.method)}"></label>
          </div>
          <div class="ef-row">
            <label>Category
              <select id="ef-cat">
                ${['build','shake','blend','muddle'].map(c =>
                  `<option value="${c}" ${d.category===c?'selected':''}>${c}</option>`
                ).join('')}
              </select>
            </label>
            <label>Colour
              <input type="color" id="ef-color" value="${d.color||'#AAAAFF'}">
            </label>
            <label>Difficulty
              <select id="ef-diff">
                ${[1,2,3].map(n => `<option ${d.difficulty===n?'selected':''}>${n}</option>`).join('')}
              </select>
            </label>
          </div>
          <label>Garnish<input id="ef-garnish" value="${esc(d.garnish)}"></label>

          <h4>Ingredients <button type="button" class="btn-xs" onclick="Main.addIngRow()">+ Add</button></h4>
          <div id="ef-ings">
            ${(d.ingredients||[]).map((ing,i) => ingRowHTML(ing,i)).join('')}
          </div>

          <h4>Recipe Steps <button type="button" class="btn-xs" onclick="Main.addStepRow()">+ Add</button></h4>
          <div id="ef-steps">
            ${(d.steps||[]).map((s,i) => stepRowHTML(s,i)).join('')}
          </div>

          <div class="ef-actions">
            <button class="btn-primary" onclick="Main.saveDrinkForm()">Save</button>
            <button class="btn-sm" onclick="Main.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.add('open');
  }

  let ingCount = 0, stepCount = 0;
  function ingRowHTML(ing, idx) {
    ingCount = idx + 1;
    return `<div class="ef-ing-row" id="ir${idx}">
      <input class="ef-ing-amt" placeholder="Amount" value="${esc(ing.amount)}">
      <input class="ef-ing-item" placeholder="Ingredient" value="${esc(ing.item)}">
      <button type="button" class="btn-xs del" onclick="document.getElementById('ir${idx}').remove()">✕</button>
    </div>`;
  }
  function stepRowHTML(s, idx) {
    const types = ['glass','ice','spirits','mixers','syrups','muddle','shake','blend','garnish','serve'];
    stepCount = idx + 1;
    return `<div class="ef-step-row" id="sr${idx}">
      <select class="ef-step-type">${types.map(t => `<option ${s.type===t?'selected':''}>${t}</option>`).join('')}</select>
      <input class="ef-step-text" placeholder="Step description" value="${esc(s.text)}">
      <button type="button" class="btn-xs del" onclick="document.getElementById('sr${idx}').remove()">✕</button>
    </div>`;
  }
  function addIngRow() {
    const c = ingCount++;
    document.getElementById('ef-ings').insertAdjacentHTML('beforeend', ingRowHTML({ amount: '', item: '' }, c));
  }
  function addStepRow() {
    const c = stepCount++;
    document.getElementById('ef-steps').insertAdjacentHTML('beforeend', stepRowHTML({ type: 'glass', text: '' }, c));
  }

  function saveDrinkForm() {
    const isNew = document.getElementById('ef-isnew').value === 'true';
    const id    = document.getElementById('ef-id').value;

    const ings  = [...document.querySelectorAll('.ef-ing-row')].map(row => ({
      amount: row.querySelector('.ef-ing-amt').value.trim(),
      item:   row.querySelector('.ef-ing-item').value.trim(),
    })).filter(i => i.item);

    const steps = [...document.querySelectorAll('.ef-step-row')].map(row => ({
      type: row.querySelector('.ef-step-type').value,
      text: row.querySelector('.ef-step-text').value.trim(),
    })).filter(s => s.text);

    const data = {
      name:        document.getElementById('ef-name').value.trim(),
      glass:       document.getElementById('ef-glass').value.trim(),
      ice:         document.getElementById('ef-ice').value.trim(),
      method:      document.getElementById('ef-method').value.trim(),
      garnish:     document.getElementById('ef-garnish').value.trim(),
      color:       document.getElementById('ef-color').value,
      category:    document.getElementById('ef-cat').value,
      difficulty:  parseInt(document.getElementById('ef-diff').value),
      ingredients: ings,
      steps,
    };

    if (!data.name) { alert('Please enter a drink name.'); return; }

    if (isNew) {
      Storage.addCustomDrink(data);
    } else {
      Storage.saveDrinkOverride(id, data);
    }
    closeModal();
    refreshStudyGrid();
  }

  function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  // ── Training select screen ───────────────────────────────
  function refreshTrainingSelect() {
    const grid = document.getElementById('training-grid');
    if (!grid) return;
    const drinks = Storage.getAllDrinks();
    grid.innerHTML = drinks.map(d => {
      const prog = Storage.getTrainingProgress(d.id);
      return `
        <div class="t-select-card" onclick="Main.setState('training', {drinkId:'${d.id}'})">
          <div class="tsc-swatch" style="background:${d.color}"></div>
          <div class="tsc-name">${d.name}</div>
          <div class="tsc-cat">${d.category} &bull; diff ${d.difficulty}</div>
          ${prog.mastered ? '<div class="tsc-mastered">★ Mastered</div>' : ''}
          ${prog.attempts ? `<div class="tsc-att">${prog.attempts} attempts</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // ── Level select screen ──────────────────────────────────
  function refreshLevelSelect() {
    const cont = document.getElementById('level-cards');
    if (!cont) return;
    const levels = [
      { n: 1, name: 'Opening Night',   pass: 600,  cat: 'Build drinks only' },
      { n: 2, name: 'Cocktail Hour',   pass: 900,  cat: '+ Shake drinks' },
      { n: 3, name: 'Mojito Madness',  pass: 1200, cat: '+ Mojito variants' },
      { n: 4, name: 'Blender Night',   pass: 1500, cat: '+ Blend & Sours' },
      { n: 5, name: 'Full Bar Chaos',  pass: 2000, cat: 'Full menu' },
    ];
    cont.innerHTML = levels.map(l => {
      const hs = Storage.getHighScore(l.n);
      const done = hs >= l.pass;
      return `
        <div class="lv-card ${done ? 'cleared' : ''}" onclick="Main.selectLevel(${l.n})">
          <div class="lv-num">Level ${l.n}</div>
          <div class="lv-name">${l.name}</div>
          <div class="lv-cat">${l.cat}</div>
          <div class="lv-pass">Pass: ${l.pass}</div>
          ${hs ? `<div class="lv-hs ${done?'gold':''}">Best: ${hs}</div>` : ''}
          ${done ? '<div class="lv-clear">CLEARED ★</div>' : ''}
        </div>
      `;
    }).join('');
  }

  function selectLevel(n) {
    currentLevel = n;
    setState('campaign', { level: n });
  }

  // ── Touch / virtual D-pad ────────────────────────────────
  function touchStart(dir) { keys['touch_' + dir] = true; }
  function touchEnd(dir)   { keys['touch_' + dir] = false; }
  function touchInteract() { Game.handleKeyDown('touch_interact'); }

  // ── Expose public API ────────────────────────────────────
  return {
    boot, setState,
    openDrinkDetail, closeModal, trainDrink,
    editDrink, addDrink, deleteDrink,
    saveDrinkForm, addIngRow, addStepRow,
    refreshStudyGrid, selectLevel,
    touchStart, touchEnd, touchInteract,
  };
})();

// ── HTML button helpers (called from inline onclick) ──────
const openDrinkDetail = id => Main.openDrinkDetail(id);

window.addEventListener('DOMContentLoaded', Main.boot);
