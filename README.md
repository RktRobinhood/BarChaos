# Bar Chaos 🍹

A bartending game (Overcooked-style) with a full drink training mode.

## Play Now
Open `index.html` in any modern browser — no server needed.

## GitHub Pages Deploy
1. Push this folder to a GitHub repo
2. Go to **Settings → Pages → Source → main branch / root**
3. Your game lives at `https://YOUR-USERNAME.github.io/REPO-NAME/`

Or use the `/docs` folder method:
```
git subtree push --prefix . origin gh-pages
```

## Controls
| Player | Move | Interact |
|--------|------|----------|
| P1 | WASD | E |
| P2 | Arrow Keys | / |
| P3 | IJKL | U |
| P4 | Numpad 8456 | Numpad 9 |

**ESC** = back to menu &nbsp; **ENTER** = confirm on end screen

## How to Play Campaign
1. Pick up a **GLASS** → auto-assigns you to the next order
2. Follow the **glowing stations** in order
3. Use the centre **PASS** counter to hand items to co-op partners
4. Deliver to **SERVE** window before the timer runs out

## Drink Menu / Study Mode
- Browse all 19 recipes, search by name or ingredient
- Click any card to see full recipe + steps
- **Edit** any recipe if you spot a transcription error
- **Add** new drinks as your son learns them
- All edits saved in localStorage — persist between sessions

## Training Mode
- Walk through each recipe step by step at your own pace
- Glass fills visually as you progress
- Take a **5-question quiz** at the end to test mastery
- ★ Mastered badge awarded at 4/5 correct

## Files
```
index.html       Entry point
css/style.css    All UI styles
js/storage.js    Drink database (19 drinks) + localStorage
js/game.js       Campaign engine
js/training.js   Training + quiz logic
js/main.js       State machine, menus, edit forms
```
