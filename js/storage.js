'use strict';

// ═══════════════════════════════════════════════════════════
//  storage.js  –  Drink database (with glass/ice subtypes)
//                 + localStorage persistence
// ═══════════════════════════════════════════════════════════
//
//  step.type    → which station category  (glass | ice | spirits | …)
//  step.subtype → exact variant required  (highball | lowball | martini)
//                                         (cylinder | crushed | large)
//  If subtype is omitted the game accepts any station of that type.

const BASE_DRINKS = [
  // ── BUILD DRINKS ────────────────────────────────────────
  {
    id: 'gin_hass', name: 'Gin Hass',
    glass: 'Highball', ice: 'Cylinder', method: 'Build',
    garnish: '2 pressed lime wedges',
    color: '#FFD700', category: 'build', difficulty: 1,
    ingredients: [
      { amount: '4 cl',   item: 'Gin' },
      { amount: '2 cl',   item: 'Mango Syrup' },
      { amount: 'Top up', item: 'Lemon Soda (~14 cl)' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball',  text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'ice',     subtype: 'cylinder',  text: 'Fill with CYLINDER ice' },
      { type: 'spirits', text: 'Add 4 cl gin' },
      { type: 'syrups',  text: 'Add 2 cl mango syrup' },
      { type: 'mixers',  text: 'Top with lemon soda (~14 cl)' },
      { type: 'garnish', text: 'Garnish with 2 pressed lime wedges' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'dark_n_stormy', name: "Dark 'n' Stormy",
    glass: 'Highball', ice: 'Cylinder', method: 'Build',
    garnish: '1 lime wedge',
    color: '#8B4513', category: 'build', difficulty: 1,
    ingredients: [
      { amount: '4 cl',     item: 'Dark Rum' },
      { amount: '16 cl',    item: 'Ginger Beer' },
      { amount: '2 dashes', item: 'Angostura Bitters' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball',  text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'ice',     subtype: 'cylinder',  text: 'Fill with CYLINDER ice' },
      { type: 'spirits', text: 'Add 4 cl dark rum' },
      { type: 'mixers',  text: 'Top with 16 cl ginger beer' },
      { type: 'syrups',  text: 'Add 2 dashes Angostura bitters' },
      { type: 'garnish', text: 'Garnish with 1 lime wedge' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'aperol_spritz', name: 'Aperol Spritz',
    glass: 'Highball', ice: 'Cylinder', method: 'Build',
    garnish: '1 orange slice',
    color: '#FF8C00', category: 'build', difficulty: 1,
    ingredients: [
      { amount: '6 cl', item: 'Aperol' },
      { amount: '9 cl', item: 'Prosecco' },
      { amount: '3 cl', item: 'Soda Water' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball',  text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'ice',     subtype: 'cylinder',  text: 'Fill with CYLINDER ice' },
      { type: 'spirits', text: 'Add 6 cl Aperol' },
      { type: 'mixers',  text: 'Add 9 cl Prosecco + 3 cl soda water' },
      { type: 'garnish', text: 'Garnish with 1 orange slice' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'limoncello_spritz', name: 'Limoncello Spritz',
    glass: 'Highball', ice: 'Cylinder', method: 'Build',
    garnish: '1 lemon slice',
    color: '#FFF44F', category: 'build', difficulty: 1,
    ingredients: [
      { amount: '6 cl', item: 'Limoncello' },
      { amount: '9 cl', item: 'Prosecco' },
      { amount: '3 cl', item: 'Soda Water' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball',  text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'ice',     subtype: 'cylinder',  text: 'Fill with CYLINDER ice' },
      { type: 'spirits', text: 'Add 6 cl Limoncello' },
      { type: 'mixers',  text: 'Add 9 cl Prosecco + 3 cl soda water' },
      { type: 'garnish', text: 'Garnish with 1 lemon slice' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'old_fashioned', name: 'Old Fashioned',
    glass: 'Lowball', ice: 'Cylinder', method: 'Build',
    garnish: 'Orange peel',
    color: '#D2691E', category: 'build', difficulty: 1,
    ingredients: [
      { amount: '6 cl',     item: 'Bourbon' },
      { amount: '1 cl',     item: 'Sugar Syrup' },
      { amount: '2 dashes', item: 'Angostura Bitters' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short, wide rocks glass)' },
      { type: 'ice',     subtype: 'cylinder', text: 'Fill with CYLINDER ice' },
      { type: 'spirits', text: 'Add 6 cl bourbon' },
      { type: 'syrups',  text: 'Add 1 cl sugar syrup + 2 dashes Angostura bitters' },
      { type: 'garnish', text: 'Garnish with orange peel' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'white_russian', name: 'White Russian',
    glass: 'Lowball', ice: 'Cylinder', method: 'Build',
    garnish: '3 coffee beans',
    color: '#F5DEB3', category: 'build', difficulty: 1,
    ingredients: [
      { amount: '3 cl', item: 'Kahlúa' },
      { amount: '2 cl', item: 'Vodka' },
      { amount: '8 cl', item: 'Whole Milk' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'ice',     subtype: 'cylinder', text: 'Fill with CYLINDER ice' },
      { type: 'spirits', text: 'Add 3 cl Kahlúa + 2 cl vodka' },
      { type: 'mixers',  text: 'Add 8 cl whole milk' },
      { type: 'garnish', text: 'Garnish with 3 coffee beans' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'passion_passion', name: 'Passion Passion',
    glass: 'Lowball', ice: 'Crushed', method: 'Build',
    garnish: '1 lime wedge + mint',
    color: '#FF6347', category: 'build', difficulty: 2,
    ingredients: [
      { amount: '4 cl', item: 'Rum' },
      { amount: '2 cl', item: 'Sour Mix' },
      { amount: '4 cl', item: 'Passion Juice' },
      { amount: '2 cl', item: 'Passion Syrup' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'ice',     subtype: 'crushed',  text: 'Fill with CRUSHED ice' },
      { type: 'spirits', text: 'Add 4 cl rum' },
      { type: 'syrups',  text: 'Add 2 cl sour mix + 2 cl passion syrup' },
      { type: 'mixers',  text: 'Add 4 cl passion juice' },
      { type: 'garnish', text: 'Garnish with 1 lime wedge + mint' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  // ── SHAKE DRINKS ────────────────────────────────────────
  {
    id: 'espresso_martini', name: 'Espresso Martini',
    glass: 'Martini', ice: 'None in glass', method: 'Shake / Strain',
    garnish: '3 coffee beans',
    color: '#3E1F00', category: 'shake', difficulty: 2,
    ingredients: [
      { amount: '3 cl', item: 'Kahlúa' },
      { amount: '2 cl', item: 'Vodka' },
      { amount: '6 cl', item: 'Espresso Coffee' },
      { amount: '1 cl', item: 'Sugar Syrup' },
    ],
    steps: [
      { type: 'glass',   subtype: 'martini', text: 'Pick up a MARTINI glass (V-shaped stem glass)' },
      { type: 'spirits', text: 'Add 3 cl Kahlúa + 2 cl vodka to shaker' },
      { type: 'mixers',  text: 'Add 6 cl espresso coffee to shaker' },
      { type: 'syrups',  text: 'Add 1 cl sugar syrup' },
      { type: 'shake',   text: 'Shake HARD with ice (creates the foam!)' },
      { type: 'garnish', text: 'Strain into glass; place 3 coffee beans on foam' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'cosmopolitan', name: 'Cosmopolitan',
    glass: 'Martini', ice: 'None in glass', method: 'Shake / Strain',
    garnish: 'None listed',
    color: '#DC143C', category: 'shake', difficulty: 2,
    ingredients: [
      { amount: '2 cl',      item: 'Vodka' },
      { amount: '4 cl',      item: 'Triple Sec' },
      { amount: '8 cl',      item: 'Cranberry Juice' },
      { amount: '2 pressed', item: 'Lime' },
    ],
    steps: [
      { type: 'glass',   subtype: 'martini', text: 'Pick up a MARTINI glass (V-shaped stem glass)' },
      { type: 'spirits', text: 'Add 2 cl vodka + 4 cl Triple Sec to shaker' },
      { type: 'mixers',  text: 'Add 8 cl cranberry juice + juice of 2 pressed limes' },
      { type: 'shake',   text: 'Shake well with ice' },
      { type: 'garnish', text: 'Strain into Martini glass' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'clover_club', name: 'Clover Club',
    glass: 'Martini', ice: 'None in glass', method: 'Shake / Strain',
    garnish: 'Freeze-dried raspberry',
    color: '#FF1493', category: 'shake', difficulty: 3,
    ingredients: [
      { amount: '6 cl', item: 'Gin' },
      { amount: '4 cl', item: 'Sour Mix' },
      { amount: '2 cl', item: 'Raspberry Syrup' },
      { amount: '2 cl', item: 'Egg White' },
    ],
    steps: [
      { type: 'glass',   subtype: 'martini', text: 'Pick up a MARTINI glass (V-shaped stem glass)' },
      { type: 'spirits', text: 'Add 6 cl gin to shaker' },
      { type: 'syrups',  text: 'Add 4 cl sour mix + 2 cl raspberry syrup + 2 cl egg white' },
      { type: 'shake',   text: 'Dry shake first (no ice), then shake again with ice' },
      { type: 'garnish', text: 'Strain into glass; garnish with freeze-dried raspberry' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'whiskey_sour', name: 'Whiskey Sour',
    glass: 'Lowball', ice: 'Cylinder', method: 'Shake',
    garnish: '1 dried lime',
    color: '#DAA520', category: 'shake', difficulty: 2,
    ingredients: [
      { amount: '6 cl',     item: 'Whiskey' },
      { amount: '3 cl',     item: 'Sour Mix' },
      { amount: '2 cl',     item: 'Sugar Syrup' },
      { amount: '2 cl',     item: 'Egg White' },
      { amount: '2 dashes', item: 'Angostura Bitters' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'spirits', text: 'Add 6 cl whiskey to shaker' },
      { type: 'syrups',  text: 'Add 3 cl sour mix + 2 cl sugar syrup + 2 cl egg white' },
      { type: 'shake',   text: 'Shake well with ice' },
      { type: 'ice',     subtype: 'cylinder', text: 'Strain into glass over CYLINDER ice' },
      { type: 'garnish', text: 'Add 2 dashes Angostura on top; garnish with 1 dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'amaretto_sour', name: 'Amaretto Sour',
    glass: 'Lowball', ice: 'Cylinder', method: 'Shake',
    garnish: '1 dried lime',
    color: '#CD853F', category: 'shake', difficulty: 2,
    ingredients: [
      { amount: '5 cl',     item: 'Amaretto' },
      { amount: '3 cl',     item: 'Sour Mix' },
      { amount: '2 cl',     item: 'Sugar Syrup' },
      { amount: '2 cl',     item: 'Egg White' },
      { amount: '2 dashes', item: 'Angostura Bitters' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'spirits', text: 'Add 5 cl amaretto to shaker' },
      { type: 'syrups',  text: 'Add 3 cl sour mix + 2 cl sugar syrup + 2 cl egg white' },
      { type: 'shake',   text: 'Shake well with ice' },
      { type: 'ice',     subtype: 'cylinder', text: 'Strain into glass over CYLINDER ice' },
      { type: 'garnish', text: 'Add 2 dashes Angostura; garnish with 1 dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'limoncello_sour', name: 'Limoncello Sour',
    glass: 'Lowball', ice: 'Cylinder', method: 'Shake',
    garnish: '1 lemon slice',
    color: '#FFFF66', category: 'shake', difficulty: 2,
    ingredients: [
      { amount: '5 cl', item: 'Limoncello' },
      { amount: '3 cl', item: 'Sour Mix' },
      { amount: '2 cl', item: 'Sugar Syrup' },
      { amount: '2 cl', item: 'Egg White' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'spirits', text: 'Add 5 cl limoncello to shaker' },
      { type: 'syrups',  text: 'Add 3 cl sour mix + 2 cl sugar syrup + 2 cl egg white' },
      { type: 'shake',   text: 'Shake well with ice' },
      { type: 'ice',     subtype: 'cylinder', text: 'Strain into glass over CYLINDER ice' },
      { type: 'garnish', text: 'Garnish with 1 lemon slice' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'bramble', name: 'Bramble',
    glass: 'Lowball', ice: 'Crushed', method: 'Shake / Float',
    garnish: '1 dried lime',
    color: '#8B008B', category: 'shake', difficulty: 3,
    ingredients: [
      { amount: '4 cl', item: 'Gin' },
      { amount: '3 cl', item: 'Sour Mix' },
      { amount: '2 cl', item: 'Sugar Syrup' },
      { amount: '1 cl', item: 'Blackberry Syrup (float on top)' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (rocks glass)' },
      { type: 'spirits', text: 'Add 4 cl gin to shaker' },
      { type: 'syrups',  text: 'Add 3 cl sour mix + 2 cl sugar syrup to shaker' },
      { type: 'shake',   text: 'Shake with ice; strain into glass' },
      { type: 'ice',     subtype: 'crushed',  text: 'Fill glass with CRUSHED ice' },
      { type: 'garnish', text: 'FLOAT 1 cl blackberry syrup on top; garnish with dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  // ── MUDDLE DRINKS ───────────────────────────────────────
  {
    id: 'mojito', name: 'Mojito',
    glass: 'Highball', ice: 'Large chunks', method: 'Muddle / Build',
    garnish: '1 piece dried lime',
    color: '#98FB98', category: 'muddle', difficulty: 2,
    ingredients: [
      { amount: '2 tsp',  item: 'Cane Sugar' },
      { amount: '2',      item: 'Lime Wedges' },
      { amount: '2',      item: 'Mint Sprigs' },
      { amount: '4 cl',   item: 'Rum' },
      { amount: 'Top up', item: 'Soda Water' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'syrups',  text: 'Add 2 tsp cane sugar + 2 lime wedges + 2 mint sprigs to glass' },
      { type: 'muddle',  text: 'MUDDLE the sugar, lime and mint together in the glass' },
      { type: 'spirits', text: 'Add 4 cl rum' },
      { type: 'ice',     subtype: 'large',    text: 'Fill with LARGE ice chunks' },
      { type: 'mixers',  text: 'Top with soda water' },
      { type: 'garnish', text: 'Garnish with 1 piece dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'mango_mojito', name: 'Mango Mojito',
    glass: 'Highball', ice: 'Large chunks', method: 'Muddle / Build',
    garnish: '1 piece dried lime',
    color: '#FFA500', category: 'muddle', difficulty: 2,
    ingredients: [
      { amount: '2 tsp',  item: 'Cane Sugar' },
      { amount: '2',      item: 'Lime Wedges' },
      { amount: '2',      item: 'Mint Sprigs' },
      { amount: '4 cl',   item: 'Rum' },
      { amount: '2 cl',   item: 'Mango Syrup' },
      { amount: 'Top up', item: 'Soda Water' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'syrups',  text: 'Add 2 tsp cane sugar + 2 lime wedges + 2 mint sprigs' },
      { type: 'muddle',  text: 'MUDDLE the sugar, lime and mint in the glass' },
      { type: 'spirits', text: 'Add 4 cl rum' },
      { type: 'syrups',  text: 'Add 2 cl mango syrup' },
      { type: 'ice',     subtype: 'large',    text: 'Fill with LARGE ice chunks' },
      { type: 'mixers',  text: 'Top with soda water' },
      { type: 'garnish', text: 'Garnish with 1 piece dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'razor_mojito', name: 'Razor Mojito',
    glass: 'Highball', ice: 'Large chunks', method: 'Muddle / Build',
    garnish: '1 piece dried lime',
    color: '#FF69B4', category: 'muddle', difficulty: 2,
    ingredients: [
      { amount: '2 tsp',  item: 'Cane Sugar' },
      { amount: '2',      item: 'Mint Sprigs' },
      { amount: '2',      item: 'Lime Wedges' },
      { amount: '4 cl',   item: 'Rum' },
      { amount: '2 cl',   item: 'Passoa' },
      { amount: 'Top up', item: 'Ginger Beer' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'syrups',  text: 'Add 2 tsp cane sugar + 2 mint sprigs + 2 lime wedges' },
      { type: 'muddle',  text: 'MUDDLE the sugar, mint and lime in the glass' },
      { type: 'spirits', text: 'Add 4 cl rum + 2 cl Passoa' },
      { type: 'ice',     subtype: 'large',    text: 'Fill with LARGE ice chunks' },
      { type: 'mixers',  text: 'Top with ginger beer' },
      { type: 'garnish', text: 'Garnish with 1 piece dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  // ── BLEND DRINKS ────────────────────────────────────────
  {
    id: 'pina_colada', name: 'Piña Colada',
    glass: 'Highball / Copa', ice: 'Crushed (in blender)', method: 'Blend',
    garnish: 'Whipped cream + 2 thin pineapple wedges on a skewer',
    color: '#FFFACD', category: 'blend', difficulty: 2,
    ingredients: [
      { amount: '12 cl', item: 'Pineapple Juice' },
      { amount: '2 cl',  item: 'Coconut Syrup' },
      { amount: '2 cl',  item: 'Rum Syrup' },
      { amount: 'Top',   item: 'Whipped Cream' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL (or Copa) glass' },
      { type: 'mixers',  text: 'Add 12 cl pineapple juice to blender' },
      { type: 'syrups',  text: 'Add 2 cl coconut syrup + 2 cl rum syrup to blender' },
      { type: 'blend',   text: 'BLEND with crushed ice until smooth' },
      { type: 'garnish', text: 'Top with whipped cream + 2 pineapple wedges on skewer' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'strawberry_daiquiri', name: 'Strawberry Daiquiri',
    glass: 'Highball / Cocktail', ice: 'Crushed (in blender)', method: 'Blend',
    garnish: '1 whole strawberry',
    color: '#FF4444', category: 'blend', difficulty: 2,
    ingredients: [
      { amount: '4 cl',  item: 'Rum' },
      { amount: '3 cl',  item: 'Lime Juice / Sour Mix' },
      { amount: '10 cl', item: 'Strawberry Purée' },
      { amount: '6 cl',  item: 'Strawberry Shot' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL (or cocktail) glass' },
      { type: 'spirits', text: 'Add 4 cl rum + 3 cl lime/sour mix to blender' },
      { type: 'mixers',  text: 'Add 10 cl strawberry purée + 6 cl strawberry shot' },
      { type: 'blend',   text: 'BLEND with ice for 30–40 seconds' },
      { type: 'garnish', text: 'Garnish with 1 whole strawberry' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
];

// ── Storage module ──────────────────────────────────────────
const Storage = (() => {
  const K = {
    SCORES:    'barchaos_scores',
    TRAINING:  'barchaos_training',
    CUSTOM:    'barchaos_custom',
    OVERRIDES: 'barchaos_overrides',
    SETTINGS:  'barchaos_settings',
  };

  const load = (key, def) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  function getHighScore(level)  { return load(K.SCORES, {})[level] || 0; }
  function getHighScores()      { return load(K.SCORES, {}); }
  function saveHighScore(level, score) {
    const s = load(K.SCORES, {});
    if (score > (s[level] || 0)) { s[level] = score; save(K.SCORES, s); return true; }
    return false;
  }

  function getTrainingProgress(drinkId) {
    return load(K.TRAINING, {})[drinkId] || { attempts: 0, mastered: false, quizBest: 0 };
  }
  function saveTrainingProgress(drinkId, data) {
    const t = load(K.TRAINING, {});
    t[drinkId] = Object.assign(t[drinkId] || {}, data, { updatedAt: Date.now() });
    save(K.TRAINING, t);
  }

  function getCustomDrinks()    { return load(K.CUSTOM, []); }
  function saveCustomDrinks(ds) { save(K.CUSTOM, ds); }
  function addCustomDrink(drink) {
    const ds = getCustomDrinks();
    drink.id = 'custom_' + Date.now();
    drink.isCustom = true;
    ds.push(drink);
    saveCustomDrinks(ds);
    return drink;
  }
  function deleteCustomDrink(drinkId) {
    saveCustomDrinks(getCustomDrinks().filter(d => d.id !== drinkId));
  }

  function getDrinkOverrides()         { return load(K.OVERRIDES, {}); }
  function saveDrinkOverride(id, data) { const o = getDrinkOverrides(); o[id] = data; save(K.OVERRIDES, o); }
  function deleteDrinkOverride(id)     { const o = getDrinkOverrides(); delete o[id]; save(K.OVERRIDES, o); }

  function getAllDrinks() {
    const overrides = getDrinkOverrides();
    const base = BASE_DRINKS.map(d => overrides[d.id] ? Object.assign({}, d, overrides[d.id]) : d);
    return [...base, ...getCustomDrinks()];
  }
  function getDrinkById(id) { return getAllDrinks().find(d => d.id === id) || null; }

  function getSetting(key, def = null) { return load(K.SETTINGS, {})[key] ?? def; }
  function setSetting(key, val)        { const s = load(K.SETTINGS, {}); s[key] = val; save(K.SETTINGS, s); }

  return {
    getHighScore, getHighScores, saveHighScore,
    getTrainingProgress, saveTrainingProgress,
    getCustomDrinks, addCustomDrink, deleteCustomDrink,
    getDrinkOverrides, saveDrinkOverride, deleteDrinkOverride,
    getAllDrinks, getDrinkById,
    getSetting, setSetting,
  };
})();
