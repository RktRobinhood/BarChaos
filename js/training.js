'use strict';

// ═══════════════════════════════════════════════════════════
//  training.js  –  Training mode + quiz logic
// ═══════════════════════════════════════════════════════════

const Training = (() => {
  // State for the active training session
  let state = null;

  // Canvas animation state (left panel visual glass builder)
  let canvas, ctx;
  let animTime = 0;

  // ── Ingredient layer colours for glass visualisation ────
  const LAYER_COLORS = {
    glass:   null,          // glass itself — drawn separately
    ice:     '#CCF0FF',
    spirits: '#FFDDAA',
    mixers:  '#AAFFDD',
    syrups:  '#FFAAEE',
    muddle:  '#BBFFBB',
    shake:   '#FFFFFFCC',
    blend:   '#EEEEFF',
    garnish: '#FFDD55',
    serve:   '#FFD700',
  };

  // ── Glass silhouettes (path drawing helpers) ─────────────
  const GLASS_SHAPES = {
    highball: { cx: 200, base: 380, topW: 70, botW: 50, h: 200 },
    lowball:  { cx: 200, base: 380, topW: 100, botW: 80, h: 120 },
    martini:  { cx: 200, base: 380, topW: 120, botW: 10, h: 160 },
  };

  function glassForDrink(drink) {
    const g = (drink.glass || '').toLowerCase();
    if (g.includes('martini')) return GLASS_SHAPES.martini;
    if (g.includes('lowball')) return GLASS_SHAPES.lowball;
    return GLASS_SHAPES.highball;
  }

  function drawGlass(shape, fillLayers = [], alpha = 1) {
    const { cx, base, topW, botW, h } = shape;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Clip region = glass interior
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, base - h);
    ctx.lineTo(cx + topW / 2, base - h);
    ctx.lineTo(cx + botW / 2, base);
    ctx.lineTo(cx - botW / 2, base);
    ctx.closePath();
    ctx.save();
    ctx.clip();

    // Fill liquid layers
    let fillY = base;
    const totalFillH = h * 0.92;
    const layerH = totalFillH / Math.max(1, fillLayers.length);
    fillLayers.slice().reverse().forEach(color => {
      const topFrac = (fillY - (base - h)) / h;
      const botFrac = (fillY - layerH - (base - h)) / h;
      const lw = topW * topFrac + botW * (1 - topFrac);
      const rw = topW * botFrac + botW * (1 - botFrac);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx - rw / 2, fillY);
      ctx.lineTo(cx + rw / 2, fillY);
      ctx.lineTo(cx + lw / 2, fillY - layerH);
      ctx.lineTo(cx - lw / 2, fillY - layerH);
      ctx.closePath();
      ctx.fill();
      fillY -= layerH;
    });
    ctx.restore();

    // Glass outline
    ctx.strokeStyle = 'rgba(200,230,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, base - h);
    ctx.lineTo(cx + topW / 2, base - h);
    ctx.lineTo(cx + botW / 2, base);
    ctx.lineTo(cx - botW / 2, base);
    ctx.closePath();
    ctx.stroke();

    // Stem for martini glass
    if (shape === GLASS_SHAPES.martini) {
      ctx.beginPath();
      ctx.moveTo(cx, base);
      ctx.lineTo(cx, base + 30);
      ctx.moveTo(cx - 35, base + 30);
      ctx.lineTo(cx + 35, base + 30);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(200,230,255,0.5)';
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Init ─────────────────────────────────────────────────
  function init(cvs, context) { canvas = cvs; ctx = context; }

  // ── Start training a drink ───────────────────────────────
  function startDrink(drinkId) {
    const drink = Storage.getDrinkById(drinkId);
    if (!drink) return;
    const prog = Storage.getTrainingProgress(drinkId);

    state = {
      mode:      'learn',   // 'learn' | 'quiz'
      drink,
      drinkId,
      step:      0,
      layers:    [],
      glassFill: 0,
      prog,
      quizQ:     0,
      quizScore: 0,
      quizOpts:  [],
      quizAnswered: false,
      quizCorrect:  false,
      animating: false,
    };
    animTime = 0;
    updateHTMLPanel();
  }

  // ── Advance/rewind steps ─────────────────────────────────
  function nextStep() {
    if (!state || state.mode !== 'learn') return;
    if (state.step >= state.drink.steps.length) return;
    const s = state.drink.steps[state.step];
    const col = LAYER_COLORS[s.type];
    if (col) state.layers.push(col);
    state.step++;
    state.animating = true;
    animTime = 0;
    updateHTMLPanel();

    if (state.step >= state.drink.steps.length) {
      // Completed all steps
      const prog = Storage.getTrainingProgress(state.drinkId);
      Storage.saveTrainingProgress(state.drinkId, {
        attempts: (prog.attempts || 0) + 1,
        lastAttempt: Date.now(),
      });
    }
  }

  function prevStep() {
    if (!state || state.mode !== 'learn') return;
    if (state.step <= 0) return;
    state.step--;
    state.layers.pop();
    animTime = 0;
    updateHTMLPanel();
  }

  function reset() {
    if (!state) return;
    state.step   = 0;
    state.layers = [];
    animTime = 0;
    updateHTMLPanel();
  }

  // ── Quiz mode ────────────────────────────────────────────
  function startQuiz() {
    if (!state) return;
    state.mode       = 'quiz';
    state.quizQ      = 0;
    state.quizScore  = 0;
    state.quizAnswered = false;
    buildQuizQuestion();
    updateHTMLPanel();
  }

  function buildQuizQuestion() {
    const drink   = state.drink;
    const allDrinks = Storage.getAllDrinks();
    const qType = state.quizQ % 4;

    if (qType === 0) {
      // What glass?
      state.quizQuestion = `What glass is used for "${drink.name}"?`;
      const wrong = shuffle(allDrinks.filter(d => d.glass !== drink.glass)).slice(0, 3).map(d => d.glass);
      state.quizAnswer  = drink.glass;
      state.quizOpts    = shuffle([drink.glass, ...wrong]);

    } else if (qType === 1) {
      // What method?
      state.quizQuestion = `What method is used for "${drink.name}"?`;
      const methods = ['Build', 'Shake / Strain', 'Blend', 'Muddle / Build', 'Shake', 'Shake / Float'];
      const wrong   = shuffle(methods.filter(m => m !== drink.method)).slice(0, 3);
      state.quizAnswer  = drink.method;
      state.quizOpts    = shuffle([drink.method, ...wrong]);

    } else if (qType === 2) {
      // Ingredient question
      const ing = drink.ingredients[Math.floor(Math.random() * drink.ingredients.length)];
      state.quizQuestion = `Which ingredient goes into "${drink.name}"?`;
      const wrong = shuffle(
        allDrinks.flatMap(d => d.ingredients).map(i => i.item)
          .filter(item => !drink.ingredients.some(di => di.item === item))
      ).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
      state.quizAnswer  = ing.item;
      state.quizOpts    = shuffle([ing.item, ...wrong]);

    } else {
      // What's the garnish?
      state.quizQuestion = `What is the garnish for "${drink.name}"?`;
      const wrong = shuffle(allDrinks.filter(d => d.garnish !== drink.garnish)).slice(0, 3).map(d => d.garnish);
      state.quizAnswer  = drink.garnish;
      state.quizOpts    = shuffle([drink.garnish, ...wrong]);
    }

    state.quizAnswered = false;
    state.quizCorrect  = false;
  }

  function answerQuiz(opt) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    state.quizCorrect  = opt === state.quizAnswer;
    if (state.quizCorrect) state.quizScore++;
    updateHTMLPanel();
  }

  function nextQuizQuestion() {
    state.quizQ++;
    if (state.quizQ >= 5) {
      // Quiz finished
      const mastered = state.quizScore >= 4;
      Storage.saveTrainingProgress(state.drinkId, {
        quizBest: Math.max(state.quizScore, Storage.getTrainingProgress(state.drinkId).quizBest || 0),
        mastered,
      });
      state.mode = 'quizResult';
      updateHTMLPanel();
      return;
    }
    buildQuizQuestion();
    updateHTMLPanel();
  }

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  // ── HTML panel updates ───────────────────────────────────
  function updateHTMLPanel() {
    if (!state) return;
    const panel = document.getElementById('training-panel');
    if (!panel) return;

    if (state.mode === 'learn') renderLearnPanel(panel);
    else if (state.mode === 'quiz') renderQuizPanel(panel);
    else renderQuizResultPanel(panel);
  }

  function renderLearnPanel(panel) {
    const { drink, step, prog } = state;
    const done = step >= drink.steps.length;

    panel.innerHTML = `
      <div class="t-drink-header">
        <div class="t-drink-swatch" style="background:${drink.color}"></div>
        <div>
          <div class="t-drink-name">${drink.name}</div>
          <div class="t-drink-meta">${drink.glass} &bull; ${drink.method} &bull; Ice: ${drink.ice}</div>
        </div>
      </div>

      <div class="t-steps">
        ${drink.steps.map((s, i) => `
          <div class="t-step ${i < step ? 'done' : i === step ? 'active' : 'pending'}">
            <span class="t-step-num">${i < step ? '✓' : (i + 1)}</span>
            <span class="t-step-text">${s.text}</span>
          </div>
        `).join('')}
      </div>

      <div class="t-ingredients">
        <div class="t-section-label">INGREDIENTS</div>
        ${drink.ingredients.map(ing => `
          <div class="t-ing">${ing.amount} &nbsp; <strong>${ing.item}</strong></div>
        `).join('')}
        ${drink.garnish ? `<div class="t-ing garnish">Garnish: <strong>${drink.garnish}</strong></div>` : ''}
      </div>

      <div class="t-controls">
        <button onclick="Training.prevStep()" class="btn-sm" ${step === 0 ? 'disabled' : ''}>◀ Back</button>
        <button onclick="Training.reset()" class="btn-sm">↺ Reset</button>
        ${!done ? `<button onclick="Training.nextStep()" class="btn-primary">Next ▶</button>`
                : `<button onclick="Training.startQuiz()" class="btn-quiz">Take Quiz!</button>`}
      </div>

      <div class="t-progress">
        ${prog.mastered ? '<span class="mastered">★ MASTERED</span>' : ''}
        ${prog.attempts ? `Attempts: ${prog.attempts}` : ''}
        ${prog.quizBest ? ` &bull; Best quiz: ${prog.quizBest}/5` : ''}
      </div>
    `;
  }

  function renderQuizPanel(panel) {
    const { quizQuestion, quizOpts, quizAnswered, quizCorrect, quizAnswer, quizQ, quizScore } = state;
    panel.innerHTML = `
      <div class="t-quiz-header">
        <div class="t-quiz-title">QUIZ – Q${quizQ + 1}/5</div>
        <div class="t-quiz-score">Score: ${quizScore}/${quizQ}</div>
      </div>
      <div class="t-quiz-q">${quizQuestion}</div>
      <div class="t-quiz-opts">
        ${quizOpts.map(opt => {
          let cls = 'quiz-opt';
          if (quizAnswered) {
            if (opt === quizAnswer) cls += ' correct';
            else if (opt === state._chosen) cls += ' wrong';
          }
          return `<button class="${cls}"
            onclick="Training.answerQuiz('${opt.replace(/'/g, "\\'")}', '${opt.replace(/'/g, "\\'")}')">
            ${opt}</button>`;
        }).join('')}
      </div>
      ${quizAnswered ? `
        <div class="quiz-feedback ${quizCorrect ? 'correct' : 'wrong'}">
          ${quizCorrect ? '✓ Correct!' : `✗ Answer: ${quizAnswer}`}
        </div>
        <button onclick="Training.nextQuizQuestion()" class="btn-primary">
          ${quizQ < 4 ? 'Next Question' : 'See Results'}
        </button>
      ` : ''}
    `;
  }

  function renderQuizResultPanel(panel) {
    const { quizScore, drinkId, drink } = state;
    const mastered = quizScore >= 4;
    panel.innerHTML = `
      <div class="t-result">
        <div class="t-result-icon">${mastered ? '🏆' : '📚'}</div>
        <div class="t-result-title">${mastered ? 'MASTERED!' : 'Keep Practising'}</div>
        <div class="t-result-score">${quizScore}/5 correct</div>
        <div class="t-result-msg">${mastered
          ? `You know your ${drink.name}!`
          : 'Review the steps and try again.'}</div>
        <div class="t-result-btns">
          <button onclick="Training.startDrink('${drinkId}')" class="btn-primary">Review Recipe</button>
          <button onclick="Training.startQuiz()" class="btn-sm">Retry Quiz</button>
          <button onclick="Main.setState('trainingSelect')" class="btn-sm">Choose Drink</button>
        </div>
      </div>
    `;
  }

  // ── Update (animation) ───────────────────────────────────
  function update(dt) {
    animTime += dt;
    if (state && state.animating) {
      if (animTime > 0.6) state.animating = false;
    }
  }

  // ── Render (canvas left panel) ───────────────────────────
  function render() {
    if (!canvas || !ctx || !state) return;

    // Left panel background
    ctx.fillStyle = '#0d1520';
    ctx.fillRect(0, 0, 420, canvas.height);

    // Title
    ctx.fillStyle = '#445';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DRINK PREVIEW', 210, 30);

    // Glass
    const shape  = glassForDrink(state.drink);
    const layers = state.layers.filter(Boolean);

    // Gentle bob animation
    const bob = Math.sin(animTime * 2.2) * (state.animating ? 6 : 2);
    ctx.save();
    ctx.translate(0, bob);
    drawGlass(shape, layers);
    ctx.restore();

    // Current step indicator
    if (state.mode === 'learn' && state.step < state.drink.steps.length) {
      const cur = state.drink.steps[state.step];
      ctx.fillStyle = LAYER_COLORS[cur.type] || '#aaa';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`▶ ${cur.type.toUpperCase()}`, 210, 100);
    }

    // Completion sparkles
    if (state.step >= (state.drink?.steps.length || 99)) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + animTime;
        const r     = 90 + Math.sin(animTime * 3 + i) * 20;
        ctx.fillStyle = `hsl(${i * 45 + animTime * 80},100%,65%)`;
        ctx.beginPath();
        ctx.arc(shape.cx + Math.cos(angle) * r, shape.base - shape.h / 2 + Math.sin(angle) * r, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Drink name under glass
    ctx.fillStyle = '#667';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.drink.name, shape.cx, shape.base + 50);

    // Progress dots along bottom
    if (state.mode === 'learn') {
      const total = state.drink.steps.length;
      const dotX  = shape.cx - (total * 14) / 2;
      state.drink.steps.forEach((_, i) => {
        ctx.fillStyle = i < state.step ? '#55EFC4' : i === state.step ? '#FFD700' : '#334';
        ctx.beginPath();
        ctx.arc(dotX + i * 14, shape.base + 80, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  return {
    init, startDrink, nextStep, prevStep, reset,
    startQuiz, answerQuiz, nextQuizQuestion,
    update, render,
  };
})();
