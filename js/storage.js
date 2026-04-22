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
      { type: 'mixers',  text: 'Add 9 cl Prosecco' },
      { type: 'mixers',  text: 'Add 3 cl soda water' },
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
      { type: 'mixers',  text: 'Add 9 cl Prosecco' },
      { type: 'mixers',  text: 'Add 3 cl soda water' },
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
      { type: 'syrups',  text: 'Add 1 cl sugar syrup' },
      { type: 'syrups',  text: 'Add 2 dashes Angostura bitters' },
      { type: 'garnish', text: 'Garnish with orange peel' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'passion_passion', name: 'Passion Passion',
    glass: 'Lowball', ice: 'Crushed', method: 'Build',
    garnish: '1 lime wedge + mint',
    color: '#FF6347', category: 'build', difficulty: 2,
    ingredients: [
      { amount: '4 cl', item: 'Vodka' },
      { amount: '2 cl', item: 'Sour Mix' },
      { amount: '4 cl', item: 'Passion Juice' },
      { amount: '2 cl', item: 'Passion Syrup' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'ice',     subtype: 'crushed',  text: 'Fill with CRUSHED ice' },
      { type: 'spirits', text: 'Add 4 cl vodka' },
      { type: 'syrups',  text: 'Add 2 cl sour mix' },
      { type: 'syrups',  text: 'Add 2 cl passion syrup' },
      { type: 'mixers',  text: 'Add 4 cl passion juice' },
      { type: 'garnish', text: 'Garnish with 1 lime wedge + mint' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  // ── SHAKE DRINKS ────────────────────────────────────────
  {
    id: 'white_russian', name: 'White Russian',
    glass: 'Lowball', ice: 'Cylinder', method: 'Shake / Strain',
    garnish: '3 coffee beans',
    color: '#F5DEB3', category: 'shake', difficulty: 2,
    ingredients: [
      { amount: '3 cl', item: 'Kahlúa' },
      { amount: '2 cl', item: 'Vodka' },
      { amount: '8 cl', item: 'Whole Milk' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'spirits', text: 'Add 3 cl Kahlúa to shaker' },
      { type: 'spirits', text: 'Add 2 cl vodka to shaker' },
      { type: 'mixers',  text: 'Add 8 cl whole milk to shaker' },
      { type: 'shake',   text: 'Shake well with ice' },
      { type: 'ice',     subtype: 'cylinder', text: 'Strain into glass over CYLINDER ice' },
      { type: 'garnish', text: 'Garnish with 3 coffee beans' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
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
      { type: 'spirits', text: 'Add 3 cl Kahlúa to shaker' },
      { type: 'spirits', text: 'Add 2 cl vodka to shaker' },
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
      { amount: '2 cl',      item: 'Triple Sec' },
      { amount: '8 cl',      item: 'Cranberry Juice' },
      { amount: '2 pressed', item: 'Lime' },
    ],
    steps: [
      { type: 'glass',   subtype: 'martini', text: 'Pick up a MARTINI glass (V-shaped stem glass)' },
      { type: 'spirits', text: 'Add 2 cl vodka to shaker' },
      { type: 'spirits', text: 'Add 2 cl Triple Sec to shaker' },
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
      { amount: '4 cl', item: 'Gin' },
      { amount: '6 cl', item: 'Sour Mix' },
      { amount: '2 cl', item: 'Raspberry Syrup' },
      { amount: '2 cl', item: 'Egg White' },
    ],
    steps: [
      { type: 'glass',   subtype: 'martini', text: 'Pick up a MARTINI glass (V-shaped stem glass)' },
      { type: 'spirits', text: 'Add 4 cl gin to shaker' },
      { type: 'syrups',  text: 'Add 6 cl sour mix + 2 cl raspberry syrup + 2 cl egg white' },
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
      { amount: '5 cl',     item: 'Bourbon' },
      { amount: '3 cl',     item: 'Sour Mix' },
      { amount: '2 cl',     item: 'Sugar Syrup' },
      { amount: '2 cl',     item: 'Egg White' },
      { amount: '2 dashes', item: 'Angostura Bitters' },
    ],
    steps: [
      { type: 'glass',   subtype: 'lowball',  text: 'Pick up a LOWBALL glass (short rocks glass)' },
      { type: 'spirits', text: 'Add 5 cl bourbon to shaker' },
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
    id: 'kinderaeg', name: 'Kinderæg',
    glass: 'Highball', ice: 'None in glass', method: 'Shake / Strain',
    garnish: 'None',
    color: '#F5DEB3', category: 'shake', difficulty: 1,
    ingredients: [
      { amount: '6 cl',  item: 'Licor 43' },
      { amount: '16 cl', item: 'Cocoa Milk' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL glass' },
      { type: 'spirits', text: 'Add 6 cl Licor 43 to shaker' },
      { type: 'mixers',  text: 'Add 16 cl cocoa milk to shaker' },
      { type: 'shake',   text: 'Shake well with ice; strain into glass' },
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
    glass: 'Highball', ice: 'Crushed', method: 'Muddle / Build',
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
      { type: 'ice',     subtype: 'crushed',  text: 'Fill with CRUSHED ice' },
      { type: 'mixers',  text: 'Top with soda water' },
      { type: 'garnish', text: 'Garnish with 1 piece dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'mango_mojito', name: 'Mango Mojito',
    glass: 'Highball', ice: 'Crushed', method: 'Muddle / Build',
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
      { type: 'ice',     subtype: 'crushed',  text: 'Fill with CRUSHED ice' },
      { type: 'mixers',  text: 'Top with soda water' },
      { type: 'garnish', text: 'Garnish with 1 piece dried lime' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
  {
    id: 'razor_mojito', name: 'Razor Mojito',
    glass: 'Highball', ice: 'Crushed', method: 'Muddle / Build',
    garnish: '1 piece dried lime',
    color: '#FF69B4', category: 'muddle', difficulty: 2,
    ingredients: [
      { amount: '2 tsp',  item: 'Cane Sugar' },
      { amount: '2',      item: 'Mint Sprigs' },
      { amount: '2',      item: 'Lime Wedges' },
      { amount: '4 cl',   item: 'Bacardi Razz' },
      { amount: '2 cl',   item: 'Passoa' },
      { amount: 'Top up', item: 'Ginger Beer' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL glass (tall, straight-sided)' },
      { type: 'syrups',  text: 'Add 2 tsp cane sugar + 2 mint sprigs + 2 lime wedges' },
      { type: 'muddle',  text: 'MUDDLE the sugar, mint and lime in the glass' },
      { type: 'spirits', text: 'Add 4 cl Bacardi Razz' },
      { type: 'spirits', text: 'Add 2 cl Passoa' },
      { type: 'ice',     subtype: 'crushed',  text: 'Fill with CRUSHED ice' },
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
      { amount: '4 cl',  item: 'Malibu' },
      { amount: '12 cl', item: 'Pineapple Juice' },
      { amount: '2 cl',  item: 'Coconut Syrup' },
      { amount: 'Top',   item: 'Whipped Cream' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL (or Copa) glass' },
      { type: 'spirits', text: 'Add 4 cl Malibu to blender' },
      { type: 'mixers',  text: 'Add 12 cl pineapple juice to blender' },
      { type: 'syrups',  text: 'Add 2 cl coconut syrup to blender' },
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
      { amount: '3 cl',  item: 'Sour Mix' },
      { amount: '10 cl', item: 'Strawberry Purée' },
      { amount: '6 cl',  item: 'Strawberry Shot' },
    ],
    steps: [
      { type: 'glass',   subtype: 'highball', text: 'Pick up a HIGHBALL (or cocktail) glass' },
      { type: 'spirits', text: 'Add 4 cl rum to blender' },
      { type: 'syrups',  text: 'Add 3 cl sour mix to blender' },
      { type: 'mixers',  text: 'Add 10 cl strawberry purée + 6 cl strawberry shot to blender' },
      { type: 'blend',   text: 'BLEND with ice for 30–40 seconds' },
      { type: 'garnish', text: 'Garnish with 1 whole strawberry' },
      { type: 'serve',   text: 'Serve!' },
    ],
  },
];

// ── Shop item catalogue ──────────────────────────────────────
const SHOP_ITEMS = [
  // Passives (permanent run bonuses)
  { id:'p_lucky',  type:'passive', name:'Lucky Charm',  desc:'Begin every run with 1 Lucky Pour.',      icon:'🍀', price:150, color:'#86EFAC' },
  { id:'p_heart',  type:'passive', name:'Iron Heart',   desc:'Begin every run with +1 max heart.',      icon:'♥',  price:250, color:'#EF4444' },
  { id:'p_speed',  type:'passive', name:'Swift Feet',   desc:'Begin every run 15% faster.',             icon:'⚡', price:200, color:'#FFD700' },
  { id:'p_tips',   type:'passive', name:'Tip Magnet',   desc:'Earn 25% more DKK tips per drink.',       icon:'💰', price:300, color:'#6EE7B7' },
  { id:'p_hint',   type:'passive', name:'Sharp Mind',   desc:'Station hints appear after 3s not 5s.',   icon:'💡', price:180, color:'#74B9FF' },
  { id:'p_time',   type:'passive', name:'Sommelier',    desc:'Begin every run with +20s on the clock.', icon:'⏱', price:320, color:'#A29BFE' },
  // ── Hats ─────────────────────────────────────────────────
  // Color toques — full chef-hat tinted in the chosen colour
  { id:'c_hat_red',    type:'cosmetic', slot:'hat', name:'Red Toque',      desc:'Full scarlet chef hat.',      icon:'🎩', price:60,  color:'#EF4444' },
  { id:'c_hat_blue',   type:'cosmetic', slot:'hat', name:'Cobalt Toque',   desc:'Full cobalt chef hat.',       icon:'🎩', price:60,  color:'#3B82F6' },
  { id:'c_hat_green',  type:'cosmetic', slot:'hat', name:'Forest Toque',   desc:'Full forest-green chef hat.', icon:'🎩', price:60,  color:'#22C55E' },
  { id:'c_hat_purple', type:'cosmetic', slot:'hat', name:'Violet Toque',   desc:'Full violet chef hat.',       icon:'🎩', price:60,  color:'#A855F7' },
  { id:'c_hat_gold',   type:'cosmetic', slot:'hat', name:'Gold Toque',     desc:'Full gold chef hat.',         icon:'🎩', price:120, color:'#FFD700' },
  { id:'c_hat_black',  type:'cosmetic', slot:'hat', name:'Midnight Toque', desc:'Full midnight-black hat.',    icon:'🎩', price:80,  color:'#1A1A2E' },
  // Exotic hat shapes
  { id:'c_hat_cowboy', type:'cosmetic', slot:'hat', name:'The Cowboy',     desc:'Wide-brim leather cowboy hat.', icon:'🤠', price:180, color:'#8B5A2F' },
  { id:'c_hat_crown',  type:'cosmetic', slot:'hat', name:'Diamond Crown',  desc:'5-point gold crown with gems.', icon:'👑', price:500, color:'#FFD700' },
  { id:'c_hat_wizard', type:'cosmetic', slot:'hat', name:'Wizard Hat',     desc:'Towering purple sorcerer cone.', icon:'🧙', price:250, color:'#7C3AED' },
  { id:'c_hat_party',  type:'cosmetic', slot:'hat', name:'Party Cone',     desc:'Rainbow-striped birthday cone.', icon:'🎉', price:120, color:'#EC4899' },
  { id:'c_hat_viking', type:'cosmetic', slot:'hat', name:'Viking Helm',    desc:'Steel dome with ivory horns.',   icon:'⚔️', price:350, color:'#9CA3AF' },
  { id:'c_hat_flames', type:'cosmetic', slot:'hat', name:'Flame Crown',    desc:'Living fire erupting from your head.', icon:'🔥', price:400, color:'#FF4500' },
  // ── Aprons ───────────────────────────────────────────────
  // Solid colour — entire body tinted
  { id:'c_apron_navy',   type:'cosmetic', slot:'apron', name:'Navy Apron',   desc:'Deep navy uniform.',        icon:'👘', price:80,  color:'#1E3A5F' },
  { id:'c_apron_black',  type:'cosmetic', slot:'apron', name:'Black Apron',  desc:'All-black uniform.',        icon:'👘', price:80,  color:'#111111' },
  { id:'c_apron_forest', type:'cosmetic', slot:'apron', name:'Forest Apron', desc:'Deep forest-green uniform.',icon:'👘', price:80,  color:'#1A4A2A' },
  { id:'c_apron_purple', type:'cosmetic', slot:'apron', name:'Royal Apron',  desc:'Royal purple uniform.',     icon:'👘', price:100, color:'#4A1A6A' },
  { id:'c_apron_wine',   type:'cosmetic', slot:'apron', name:'Wine Apron',   desc:'Rich burgundy uniform.',    icon:'👘', price:100, color:'#6A1A2A' },
  // Patterned aprons
  { id:'c_apron_stripes', type:'cosmetic', slot:'apron', name:'Candy Stripes',  desc:'Bold red & white candy-cane stripes.', icon:'🍭', price:150, color:'#EF4444' },
  { id:'c_apron_checker', type:'cosmetic', slot:'apron', name:'Checkerboard',   desc:'Classic black & white squares.',       icon:'♟', price:150, color:'#111111' },
  { id:'c_apron_rainbow', type:'cosmetic', slot:'apron', name:'Rainbow Burst',  desc:'Full-spectrum rainbow uniform.',        icon:'🌈', price:200, color:'#A855F7' },
  { id:'c_apron_tuxedo',  type:'cosmetic', slot:'apron', name:'Tuxedo',         desc:'Sharp black tux with red bow-tie.',    icon:'🤵', price:280, color:'#111111' },
  { id:'c_apron_flames',  type:'cosmetic', slot:'apron', name:'Flame Burst',    desc:'Burning fire pattern all over.',       icon:'🔥', price:350, color:'#FF4500' },
  // ── Accessories ──────────────────────────────────────────
  { id:'c_acc_bowtie',    type:'cosmetic', slot:'acc', name:'Giant Bow Tie',   desc:'Huge gold bow tie you cannot miss.',    icon:'🎀', price:100, color:'#FFD700' },
  { id:'c_acc_shades',    type:'cosmetic', slot:'acc', name:'Mirror Shades',   desc:'Reflective aviator sunglasses.',        icon:'🕶', price:120, color:'#88CCFF' },
  { id:'c_acc_tache',     type:'cosmetic', slot:'acc', name:'Handlebar Moustache', desc:'Magnificent waxed handlebar.',      icon:'🥸', price:80,  color:'#3D1C00' },
  { id:'c_acc_mohawk',    type:'cosmetic', slot:'acc', name:'Mohawk',          desc:'Towering rainbow mohawk spikes.',       icon:'🤘', price:200, color:'#FF1493' },
  { id:'c_acc_halo',      type:'cosmetic', slot:'acc', name:'Halo',            desc:'Glowing golden halo above your head.',  icon:'😇', price:300, color:'#FFD700' },
  { id:'c_acc_chain',     type:'cosmetic', slot:'acc', name:'Gold Chain',      desc:'Thick gold chain + pendant.',           icon:'📿', price:180, color:'#FFD700' },
  { id:'c_acc_neonshades',type:'cosmetic', slot:'acc', name:'Neon Cat-Eyes',   desc:'Oversized hot-pink cat-eye glasses.',   icon:'😎', price:220, color:'#FF00FF' },
  { id:'c_acc_beard',     type:'cosmetic', slot:'acc', name:'Mega Beard',      desc:'Enormous lumberjack beard.',            icon:'🧔', price:150, color:'#5C3317' },
  { id:'c_acc_stars',     type:'cosmetic', slot:'acc', name:'Star Aura',       desc:'Animated golden stars orbit you.',      icon:'⭐', price:400, color:'#FFD700' },
];

// ── Storage module ──────────────────────────────────────────
const Storage = (() => {
  const K = {
    SCORES:    'barchaos_scores',
    TRAINING:  'barchaos_training',
    CUSTOM:    'barchaos_custom',
    OVERRIDES: 'barchaos_overrides',
    SETTINGS:  'barchaos_settings',
    TIPS:           'barchaos_tips',
    PURCHASED:      'barchaos_purchased',
    EQUIPPED:       'barchaos_equipped',
    PASSIVE_LEVELS: 'barchaos_passive_levels',
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

  function getTips()    { return load(K.TIPS, 0); }
  function addTips(n)   { save(K.TIPS, getTips() + n); }
  function spendTips(n) { const c=getTips(); if(c<n) return false; save(K.TIPS,c-n); return true; }

  function hasPurchased(id)  { return load(K.PURCHASED,[]).includes(id); }
  function purchaseItem(id)  { const p=load(K.PURCHASED,[]); if(!p.includes(id)){p.push(id);save(K.PURCHASED,p);} }
  function getEquipped()     { return load(K.EQUIPPED,{}); }
  function equipItem(slot,id){ const e=getEquipped(); e[slot]=id; save(K.EQUIPPED,e); }
  function unequipItem(slot) { const e=getEquipped(); delete e[slot]; save(K.EQUIPPED,e); }
  function getShopItems()    { return SHOP_ITEMS; }

  // ── Passive levelling (0–5, exponential cost) ────────────
  const PASSIVE_MAX = 5;
  function getPassiveLevel(id) { return load(K.PASSIVE_LEVELS, {})[id] || 0; }
  function passiveLevelCost(itemOrId, nextLevel) {
    const item = typeof itemOrId === 'string'
      ? SHOP_ITEMS.find(i => i.id === itemOrId) : itemOrId;
    if (!item) return Infinity;
    return Math.round(item.price * Math.pow(2, nextLevel - 1));
  }
  function upgradePassive(id) {
    const item = SHOP_ITEMS.find(i => i.id === id && i.type === 'passive');
    if (!item) return false;
    const levels  = load(K.PASSIVE_LEVELS, {});
    const current = levels[id] || 0;
    if (current >= PASSIVE_MAX) return false;
    const cost = passiveLevelCost(item, current + 1);
    if (!spendTips(cost)) return false;
    levels[id] = current + 1;
    save(K.PASSIVE_LEVELS, levels);
    return true;
  }
  function getUnlockedPassives() {
    const levels = load(K.PASSIVE_LEVELS, {});
    return SHOP_ITEMS
      .filter(i => i.type === 'passive' && (levels[i.id] || 0) > 0)
      .map(i => ({ ...i, level: levels[i.id] || 0 }));
  }

  return {
    getHighScore, getHighScores, saveHighScore,
    getTrainingProgress, saveTrainingProgress,
    getCustomDrinks, addCustomDrink, deleteCustomDrink,
    getDrinkOverrides, saveDrinkOverride, deleteDrinkOverride,
    getAllDrinks, getDrinkById,
    getSetting, setSetting,
    getTips, addTips, spendTips,
    hasPurchased, purchaseItem,
    getEquipped, equipItem, unequipItem,
    getShopItems, getUnlockedPassives,
    getPassiveLevel, passiveLevelCost, upgradePassive, PASSIVE_MAX,
  };
})();
