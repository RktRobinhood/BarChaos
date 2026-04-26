# Bar Chaos 🍹

A single-player **and** multiplayer bartending game inspired by Overcooked — dodge orders, nail the ingredients, and survive increasingly chaotic bars.

## Play Now
Open `index.html` in any modern browser — no server or install needed.  
Multiplayer requires an internet connection (WebRTC peer-to-peer).

## GitHub Pages
1. Push this folder to a GitHub repo
2. Go to **Settings → Pages → Source → main branch / root**
3. Your game lives at `https://YOUR-USERNAME.github.io/REPO-NAME/`

---

## Controls

| Action | Keys |
|--------|------|
| Move | WASD or Arrow Keys |
| Interact / Pour | E |
| Mini-game shortcuts | 1 – 4 |
| Confirm (end screen) | ENTER |
| Back to menu | ESC |

> **Mobile:** virtual D-pad and USE button appear automatically on small screens.

---

## Campaign Mode

Eight levels across two difficulty tracks. Orders spawn from customers at the bar — grab the right glass, work through each station, and serve before the timer runs out. Wrong pours cost hearts; lose them all and the run ends early.

### Station Flow
1. Walk to a **GLASS** station — claims the next unclaimed order
2. Follow **glowing station hints** (appear after a few seconds of inactivity)
3. At **SPIRITS / MIXERS / SYRUPS / GARNISH** stations a mini-game opens — pick the correct bottle and measure
4. **SHAKE / BLEND / MUDDLE** stations auto-process while you wait
5. Deliver to the **SERVE** window before the customer's patience bar empties
6. **PASS** counter (centre bar) — place a drink to hand it to another player in multiplayer
7. **TRASH** discards whatever you're holding when you've grabbed the wrong order

### Hearts & Scoring
- Start with **3 hearts**; each wrong mini-game answer costs one
- A **Lucky Pour** (upgradeable) forgives the first wrong answer per level
- Serving quickly earns a time bonus
- Perfect serves (no mistakes) with a time bonus also earn **DKK tips**
- Tips persist between sessions and fund the **Bartender Shop**

### Roguelite Upgrades (Campaign only)
Clear the pass score and choose one upgrade before the next level:

| Upgrade | Effect |
|---------|--------|
| ♥ +1 Heart | Survive one more wrong answer |
| ⚡ Speed Boost | Move 25% faster |
| ⏱ +20s Timer | Extra time each level |
| 💰 Bigger Tips | +30% score per drink |
| 🍀 Lucky Pour | First wrong answer forgiven |
| ⚙ Quick Hands | Processing stations 35% faster |

Upgrades stack across levels in a run but reset when you start fresh. Upgrades are **not** available in multiplayer.

---

## Campaign Levels

| # | Name | Theme | Pass Score | New Mechanics |
|---|------|-------|------------|---------------|
| 1 | Opening Night | Classic warm bar | 600 | Build only |
| 2 | Cocktail Hour | Midnight blue lounge | 900 | + Shake |
| 3 | Mojito Madness | Tropical jungle bar | 1,200 | + Muddle |
| 4 | Blender Night | Neon underground club | 1,500 | + Blend |
| 5 | Full Bar Chaos | Fiery back-bar | 2,000 | Full menu |
| 6 | 🌋 Volcano Bar | Active volcano underground | 2,500 | Full menu + hazards |

### Level 6 — Volcano Bar
The bar sits inside an active volcano. Two stacking hazards increase difficulty:

- **Heat Spikes** — every ~20 s a random station flashes orange for 2 s, then locks for 5 s. Interact while locked and you'll be turned away.
- **Eruptions** — every ~40 s customer patience drains 1.8× faster for 8 s. A red pulse and banner warn you it's coming.

---

## Multiplayer

Up to **4 players** in real-time, each on their own device. The game uses **WebRTC peer-to-peer** connections (via PeerJS) so there is no dedicated server — one player hosts and others connect directly.

### Joining a Game
1. Click **🌐 Multiplayer** on the main menu
2. **Create Room** — enter a room name and password, choose a level, then click *Create & Host*
3. Share the **room name and password** with your friends (voice, chat, etc.)
4. Each friend opens the game, clicks **🌐 Multiplayer → Join Room**, types the same name and password, and clicks *Join*
5. Once everyone is in the lobby, the host clicks **▶ Start Game**

### Multiplayer Maps

Two levels are designed specifically around cooperation. Stations are split left and right — one player handles prep, the other handles processing and finishing. The PASS counter in the centre is how drinks cross between sides.

| # | Name | Pass Score | Theme |
|---|------|------------|-------|
| 7 | Cocktail Relay | 1,800 | Warm wood relay bar |
| 8 | Team Chaos | 2,400 | Neon underground relay |

All six single-player campaign levels can also be played in multiplayer. When a campaign level is loaded in multiplayer mode, two PASS counters and a TRASH station are automatically added to the centre of the bar.

### PASS Counter
- **Place** a drink on the counter to hand it off (press E while holding it near the counter)
- **Pick up** from the counter to continue preparation on your side
- A **label** floats above the counter showing the drink name, current step, and a progress bar — so teammates always know what's waiting

### Multiplayer Hearts
Each player has their own heart count. The game only ends early if **all players** run out of hearts simultaneously.

### Cosmetics in Multiplayer
Your hat, apron, and accessory are visible to all other players. Equip something in the **Bartender Shop** before entering a room and the other players will see it on your character sprite.

### Technical Details

| Detail | Value |
|--------|-------|
| Transport | WebRTC DataChannel (DTLS-encrypted) |
| Room identity | SHA-256(name + password) → peer ID |
| Password security | Password is hashed client-side; never transmitted |
| State sync | Host-authoritative at 20 Hz |
| Input | Client→Host at up to 30 Hz |
| Movement | Client-side prediction with host reconciliation |
| NAT traversal | Google + Twilio STUN; openrelay.metered.ca TURN |
| Max players | 4 |
| Library | PeerJS 1.5.4 |

### Known Limitations
- **Requires internet** — WebRTC needs STUN/TURN servers to establish the connection even on a LAN.
- **Host must stay connected** — if the host closes their browser the game ends for all clients.
- **No reconnection** — if a client disconnects mid-game they cannot rejoin that session; start a new room.
- **No local multiplayer** — each player needs their own device and browser.
- **Roguelite upgrades disabled** — run upgrades are not available in multiplayer for simplicity; shop passives still apply to the host's player stats.
- **Mini-game latency** — clients experience ~50 ms of latency per mini-game button press (one round-trip to the host for authoritative validation). This is normal and does not affect gameplay significantly.
- **Firewall / strict NAT** — in rare network configurations WebRTC connections may fail even with TURN. If players cannot connect, try a different network or mobile hotspot.

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
- Click the **Quiz** button on any drink card to skip straight to the quiz
- **5-question quiz** covering glass type, method, ingredients, and garnish
- ★ **Mastered** badge awarded at 4/5 correct — tracked per drink

---

## Bartender Shop
Spend DKK tips earned from fast, perfect serves on permanent upgrades and cosmetics.

**Passive Upgrades** (5 levels each):

| Passive | Max Effect |
|---------|-----------|
| Lucky Pours | +5 forgiven pours per run |
| Extra Hearts | +5 max hearts |
| Speed Training | +74% movement speed |
| Time Management | +100 s per level |
| Better Tips | Faster DKK earning |
| Hint Delay | Station hints appear almost immediately |

**Cosmetics** — visible to all players in multiplayer:

| Slot | Options |
|------|---------|
| Hats | 12 options — classic colour toques, cowboy, crown, wizard, party cone, viking helmet, flames |
| Aprons | 10 options — solid colours, candy stripes, checkerboard, rainbow, tuxedo, flames |
| Accessories | 9 options — bowtie, shades, handlebar moustache, mohawk, halo, gold chain, neon cat-eye glasses, mega beard, animated star aura |

---

## File Map

```
index.html          Entry point, HTML screens, lobby UI
css/style.css       All UI styles including lobby
js/storage.js       Drink database (19 drinks) + localStorage helpers
js/game.js          Campaign engine — levels, mini-game, rendering, MP state
js/training.js      Training mode + quiz logic
js/netplay.js       PeerJS WebRTC multiplayer networking module
js/main.js          State machine, menus, lobby, level select, shop
assets/             Game graphics
```
