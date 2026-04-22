# Bar Chaos 🍹

A single-player bartending game inspired by Overcooked — dodge orders, nail the ingredients, and survive increasingly chaotic bars.

## Play Now
Open `index.html` in any modern browser — no server or install needed.

## GitHub Pages
1. Push this folder to a GitHub repo
2. Go to **Settings → Pages → Source → main branch / root**
3. Your game lives at `https://YOUR-USERNAME.github.io/REPO-NAME/`

---

## Campaign Mode

Five (plus one secret) levels, each with a distinct theme and layout. Orders spawn from customers at the bar; grab the right glass, work through each station in order, and serve before the timer runs out. Wrong pours cost you a heart — lose them all and the run ends early.

### Controls

| Action | Keys |
|--------|------|
| Move | WASD or Arrow Keys |
| Interact / Pour | E |
| Confirm (end screen) | ENTER |
| Back to menu | ESC |
| Mini-game shortcuts | 1 – 4 |

> Mobile: virtual D-pad + Interact button shown on small screens.

### Station Flow
1. Walk to a **GLASS** station — grabs the next unclaimed order
2. Follow the **glowing station hints** (appear after a few seconds of inactivity)
3. At **SPIRITS / MIXERS / SYRUPS / GARNISH** stations a mini-game pops up — pick the correct bottle and then the correct measure
4. **SHAKE / BLEND** stations auto-process while you wait
5. Deliver to the **SERVE** window before the customer's patience bar empties
6. **TRASH** discards whatever you're holding if you grab the wrong glass

### Hearts & Scoring
- You start with **3 hearts**; each wrong answer in a mini-game costs one
- A **Lucky Pour** (upgradeable) forgives the first wrong answer per level
- Serving quickly earns a time bonus; perfect (no mistakes) + fast serves also earn **DKK tips**
- Tips persist between sessions and fund the **Bartender Shop**

### Roguelite Upgrades
Clear a level's pass score and choose one of three run upgrades before moving on:

| Upgrade | Effect |
|---------|--------|
| ♥ +1 Heart | Survive one more wrong answer |
| ⚡ Speed Boost | Move 25 % faster |
| ⏱ +20 s Timer | Extra time each level |
| 💰 Bigger Tips | +30 % score per drink |
| 🍀 Lucky Pour | First wrong answer forgiven |
| ⚙ Quick Hands | Processing stations 35 % faster |

Upgrades stack across levels in a run but reset when you start fresh.

---

## Campaign Levels

| # | Name | Theme | Pass Score | New Drinks |
|---|------|-------|-----------|------------|
| 1 | Opening Night | Classic warm bar | 600 | Build only |
| 2 | Cocktail Hour | Midnight blue lounge | 900 | + Shake |
| 3 | Mojito Madness | Tropical jungle bar | 1 200 | + Muddle |
| 4 | Blender Night | Neon underground club | 1 500 | + Blend |
| 5 | Full Bar Chaos | Fiery back-bar | 2 000 | Full menu |
| 6 | 🌋 Volcano Bar | Volcanic underground | 2 500 | Full menu + hazards |

### Level 6 — Volcano Bar *(unlocked from the level select)*
The bar sits inside an active volcano. Two environment hazards stack on top of normal difficulty:

- **Heat Spikes** — every ~20 s a random station flashes orange for 2 s, then locks for 5 s. Plan around it or be caught mid-pour.
- **Eruptions** — every ~40 s lava flows speed up customer impatience ×1.8 for 8 s. A countdown banner and red pulse warn you it's coming.

---

## Drink Menu / Study Mode
- Browse all 19 cocktail recipes; filter by name or ingredient
- Click any card to see the full recipe, steps, and glass type
- **Edit** any recipe if you spot a transcription error
- **Add** new drinks as your son learns them at bar school
- All edits saved to localStorage — persist between sessions

---

## Training Mode
Walk through each drink step by step at your own pace:

- The glass on the left fills visually as you add each ingredient
- Hit **Take Quiz!** after finishing all steps to test your memory
- Or click the **Quiz** button on the drink card to jump straight to the quiz
- **5-question quiz** covering glass type, method, ingredients, and garnish
- ★ **Mastered** badge awarded at 4/5 correct — tracked per drink

---

## Bartender Shop
Spend DKK tips earned from perfect serves on permanent passive upgrades and cosmetics.

**Passives** (5 levels each):

| Passive | Max effect |
|---------|-----------|
| Lucky Pours | +5 forgiven pours per run |
| Extra Hearts | +5 max hearts |
| Speed Training | +74 % movement speed |
| Time Management | +100 s per level |
| Better Tips | Faster DKK earning |
| Hint Delay | Station hints appear almost immediately |

**Cosmetics** — hats, aprons, and accessories for your bartender sprite.

---

## File Map

```
index.html        Entry point & HTML screens
css/style.css     All UI styles
js/storage.js     Drink database (19 drinks) + localStorage helpers
js/game.js        Campaign engine — levels, mini-game, rendering
js/training.js    Training mode + quiz logic
js/main.js        State machine, menus, level select, shop, edit forms
assets/           Game graphics
```
