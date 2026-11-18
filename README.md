# NEON RIFT — Original Hackathon Game

NEON RIFT is a responsive, browser-based arcade survival game built with vanilla HTML, CSS, and JavaScript. The player steers a neon ship with three lives, avoids red rift fragments, collects cyan energy shards, chains shard streaks for score multipliers, and tries to beat a locally saved high score. Hits trigger a damage flash, arena shake, and a brief invulnerability window.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. For best results, use a local static server (for example, VS Code Live Server).

No framework, backend, API key, or installation is required. Google Fonts are loaded from the web; if offline, the page uses fallback fonts.

## Controls
- Desktop: Left/Right arrow keys or A/D.
- Start/restart: click START RUN or press Space/Enter.
- Touch: tap the left/right side of the playfield or drag to steer.
- Collect cyan diamonds; avoid red fragments.

## Features
- Original visual identity and responsive layout
- Playable canvas-based endless survival game
- Score, shards, difficulty level, three-life HUD, and personal-best HUD
- Three-life damage system, temporary post-hit invulnerability, screen shake, and damage flash
- Shard streak combo bonuses with multipliers up to ×5
- Local high score via `localStorage` (no account or server)
- Keyboard, pointer, and touch interaction
- Reduced-motion-aware styling and accessible game instructions

## Files
- `index.html` — semantic page structure
- `style.css` — visual design and responsive layout
- `script.js` — gameplay loop, collision detection, particles, scoring, and local record
- `README.md` — project overview and run instructions

## Originality / submission notes
This implementation was written for this project using original layout, game logic, CSS styling, and canvas-drawn geometry. It does not copy a pre-existing game or use third-party game assets. As with any submission, disclose any external tools or assistance according to the hackathon's rules. Before submitting, personalize the copy and visual details, test it on the judging device, and include your source code and a working deployment URL.

## Suggested project description
**NEON RIFT: A Neon Arcade Survival Challenge** — An accessible, mobile-friendly browser game that challenges players to survive an escalating field of hazards while collecting energy shards. It combines a custom canvas game loop, real-time collision detection, responsive controls, and local personal-best tracking in a lightweight, no-install experience.
