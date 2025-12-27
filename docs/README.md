# ArenaForge Rebuild — Documentation & Setup Guide

## Overview
This is the **redesigned** ArenaForge game: a physics-first stick-fighter RPG with a city-building meta-game. All development docs live in `/docs/` so both humans and AI (Antigravity IDE) can reference them during coding.

## What's in the `/docs/` folder

| File | Purpose | Audience |
|------|---------|----------|
| **CONTEXT.md** | Project vision, pillars, game loop, tech stack | Humans + Antigravity |
| **ARCHITECTURE.md** | System design, data flow, file structure, phase handoff | Humans + Antigravity |
| **DB_SCHEMA.md** | PostgreSQL tables, migrations, relationships | Backend devs + Antigravity |
| **API.md** | Express endpoint specs (auth, fighters, battles, city) | Backend devs + Frontend devs |
| **BALANCE.md** | Weapons, spells, armor stats; damage formulas; tuning knobs | Game designers + Antigravity |
| **DEV_NOTES.md** | Quick start, troubleshooting, performance tips, Render setup | All devs + Antigravity |

---

## Quick start

### Phase 1: Battle Engine Sandbox (local, no backend)

```bash
# 1. Clone your repo
git clone <your-repo>
cd arenaforge/frontend/battle

# 2. Start a local server
python -m http.server 8000

# 3. Open browser
# http://localhost:8000/index.html
```

You'll see:
- Two ragdoll fighters in an arena
- A debug panel to tweak physics/loadouts/seed
- Replay + export JSON buttons

**See DEV_NOTES.md for detailed setup.**

### Phase 4: Add backend + database

```bash
cd arenaforge/backend
cp .env.example .env
# Fill DATABASE_URL from Render Postgres

npm install
npm run migrate
npm start
```

Server listens on http://localhost:3000. Test endpoints with curl (see API.md examples).

---

## Project structure (what to create)

```
arenaforge/
├── /docs/                         ← ALL DESIGN DOCS (you now have these 6 files)
│   ├── CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DB_SCHEMA.md
│   ├── API.md
│   ├── BALANCE.md
│   └── DEV_NOTES.md
│
├── /frontend/                     ← HTML5 + Canvas
│   ├── /battle/
│   │   ├── index.html            (use with Antigravity to generate)
│   │   └── /src/
│   │       ├── engine/           (Physics world, timestep loop)
│   │       ├── physics/          (Ragdoll, limbs, constraints)
│   │       ├── render/           (Canvas drawing, effects)
│   │       ├── entities/         (Fighter, Weapon, Projectile)
│   │       ├── items/            (weapons.js, spells.js, armor.js)
│   │       ├── ai/               (AIBrain, decision-making)
│   │       ├── ui/               (DebugPanel, HUD, Controls)
│   │       ├── replay/           (RecordReplay, PlayReplay)
│   │       └── utils/            (SeededRNG, Config, Constants)
│   │
│   ├── /city/                    (generated in Phase 4)
│   │   ├── index.html
│   │   └── /src/
│   │       └── (CityHub, Buildings, Inventory, API, etc.)
│   │
│   └── /shared/
│       ├── schemas.js
│       ├── constants.js
│       ├── itemDefinitions.js
│       └── buildingDefinitions.js
│
├── /backend/                     ← Node.js + Express (Phase 4+)
│   ├── server.js
│   ├── .env.example
│   ├── /routes/
│   │   ├── auth.js
│   │   ├── fighters.js
│   │   ├── battles.js
│   │   ├── city.js
│   │   ├── inventory.js
│   │   └── leaderboard.js
│   ├── /middleware/
│   ├── /db/
│   │   ├── pool.js
│   │   ├── migrations/
│   │   │   ├── 001-init.sql
│   │   │   └── 002-seed-items.sql
│   │   └── queries.js
│   ├── /services/
│   │   ├── AuthService.js
│   │   ├── BattleService.js
│   │   ├── CityService.js
│   │   ├── ResourceService.js
│   │   └── MatchmakingService.js
│   ├── /cron/
│   │   ├── resourceAccrual.js
│   │   └── cleanup.js
│   └── package.json
│
├── .gitignore
├── .env.example
├── README.md                      ← This file
└── package.json                   (optional, if monorepo)
```

---

## How to use these docs with Antigravity IDE

### Phase 1: Generate the battle engine

1. **Create a new Antigravity project** (or use "Playground")
2. **Paste the combined prompt** (see below)
3. **Attach the docs** (if Antigravity supports @context):
   - `/docs/CONTEXT.md`
   - `/docs/ARCHITECTURE.md`
   - `/docs/BALANCE.md`
4. **Generate** → Antigravity writes the battle engine code

### Phase 2 & beyond

- Update relevant `/docs/` files as scope expands
- Attach updated docs to Antigravity prompts
- Antigravity will read context + generate accordingly

### Combined Antigravity prompt (copy/paste)

```text
You are a senior HTML5 Canvas game developer and physics programmer.

## Project context
Read /docs/CONTEXT.md, /docs/ARCHITECTURE.md, /docs/BALANCE.md before coding.

## Goal (Phase 1)
Build the FIRST deliverable: a fun, good-looking, fully physics-driven stick-fighter battle engine sandbox with deterministic replays and a debug UI so I can tweak settings and intentionally change outcomes for testing.

My fixed decisions (must follow)
- Fighters are fully physics-driven ragdolls ALL the time (no animation takeover).
- Fights are always AI vs AI (no player control).
- Damage is purely collision/impulse-based (no "attack frames" hitbox system).
- Fighters are "human-ish": head, chest/torso, pelvis/hips, upper/lower arms, upper/lower legs, and feet/hands.

Core tech constraints
- Rendering: HTML5 Canvas 2D.
- Physics: Matter.js.
- Code: Vanilla JS (ES modules). No frameworks.
- Use a fixed simulation timestep and support stepping one frame at a time (for tuning + replays).
- No external image assets required; draw stick figures procedurally with canvas primitives.

Physics implementation requirements (ragdoll)
- Build ragdolls from multiple bodies connected by Matter constraints (distance constraints).
- Use constraint stiffness + damping knobs for stability; expose these in debug UI.
- Provide a "ragdoll preset" (stable defaults) and a "chaos preset" for fun testing.

Combat requirements (purely physics/impulse)
- Weapons are physical bodies attached via constraints (grip constraints), so all damage comes from physics impacts.
- Spells include BOTH:
  (A) impulse-based damage spells (explosions / force blasts / lightning impulse),
  (B) non-damage effects (slow, gravity changes, friction changes, stun-like dampening).
- Convert collision impulse/energy into damage using Matter collision pair/contact data (NOT custom hitboxes).
- Show per-hit debug numbers (impulse score, damage dealt, mitigated damage).

Sandbox features (MVP but "juicy")
1) Single-page sandbox that starts a fight between 2 ragdoll fighters in an arena (floor + walls).
2) "Juice": camera shake on heavy hits, impact particles based on impact score, clear health bars.
3) Debug overlay panel:
   - RNG seed (deterministic AI decisions)
   - Fighter A/B: health, mass, limb density, movement force, jump force, aggression, armor tier
   - Damage model: impulse->damage multiplier, minimum impulse threshold, head multiplier, limb multiplier
   - Constraints: stiffness, damping, angular stiffness (if used), solver/iterations knobs if available
   - Global: gravity, timeScale, friction/air-like knobs
   - Buttons: Start, Pause, Step 1 frame, Reset, Randomize loadouts, Swap sides, Replay last fight
4) AI (deterministic and physics-aware)
   - Approach / retreat / jump decisions based on distance, cooldowns, and current stability (e.g., if fallen, try to recover).
   - Weapon handling goal: create high-impulse collisions intentionally (positioning + timing).
5) Items are data-driven
   - Weapons: at least 3 (sword / spear / hammer) with mass, length, damageScale, knockbackScale, grip config.
   - Spells: at least 3 with cooldown, force, radius, slowFactor, duration, etc.
   - Armor: at least 3 tiers with weight, damageReduction, knockbackReduction.
   - All defined in JSON-like objects so adding items is easy.

Replay / determinism requirements
- Record: seed, all settings, and the timeline of AI decisions (not raw body state every frame).
- "Replay last fight" re-runs from seed/settings and replays decisions on the same fixed timestep.
- Add "Export replay JSON" + "Import replay JSON".

Project structure / deliverables
- index.html + /src/* + minimal CSS (no build step).
- Keep code modular: /src/engine, /src/physics, /src/render, /src/entities, /src/items, /src/ai, /src/ui, /src/replay.
- README.md: how to run locally (simple static server), module overview, and how to add new weapon/spell/armor.

Process rules (important)
- First output a short plan (5–10 bullets) and a file tree.
- Then implement in checkpoints:
  1) Physics world + render loop + arena bounds + fixed timestep
  2) One stable human-ish ragdoll fighter
  3) Two fighters + deterministic AI locomotion
  4) Collision/impulse-based damage + health + KO/win condition
  5) Debug UI + seed controls + stepping
  6) Data-driven weapons/spells/armor
  7) Logging + replay import/export
- After each checkpoint: how to test it in the browser + what "success" looks like.
- If anything is ambiguous, ask me 3–5 targeted questions BEFORE coding.
```

---

## Development phases & handoff

### Phase 1: Physics Playground
- **Output:** Battle engine sandbox (local HTML file)
- **Files to generate:** Everything under `/frontend/battle/`
- **Exit criteria:** Stable ragdolls, fun collisions, deterministic replays

### Phase 2: Simulator
- **Output:** Rules + data-driven items
- **Files to generate:** Extend `/frontend/battle/src/items/` + update DebugPanel
- **Exit criteria:** Changing equipment reliably changes fight outcome

### Phase 3: The Brain
- **Output:** AI text integration (optional, enrichment only)
- **Files to generate:** Extend `/frontend/battle/src/ai/` with API calls
- **Exit criteria:** AI narration works without breaking physics

### Phase 4: Persistence & City Hub
- **Output:** Full-stack with PostgreSQL + City screens
- **Files to generate:** `/backend/` entire structure + `/frontend/city/`
- **Exit criteria:** Players can login, upgrade buildings, earn resources, persist state

### Phase 5: Story & Social
- **Output:** Story campaign + multiplayer chat
- **Files to generate:** Story mode screens + Socket.IO integration
- **Exit criteria:** Story mode playable, chat works in real-time

---

## Important notes

### For Antigravity prompts
- Always attach the relevant `/docs/` files via context injection
- If context changes (e.g., new weapon added), update BALANCE.md and re-attach
- Antigravity will read context and stay consistent across generations

### For you (the human)
- Use DEV_NOTES.md for day-to-day setup & debugging
- Use BALANCE.md to tweak game feel (weapons, spells, armor, AI parameters)
- Use API.md when wiring frontend to backend (Phase 4+)
- Use ARCHITECTURE.md to understand data flow and file organization

### For the Git workflow
- Commit doc changes together with code changes
- Update docs when you add a new weapon/spell/API endpoint
- Use docs as your "source of truth" for design decisions

---

## Example: Adding a new weapon (Phases 2+)

1. Add entry to `/docs/BALANCE.md` (weapons table)
2. Add data object to `/frontend/battle/src/items/weapons.js`
3. Test in battle sandbox with debug panel
4. If balance is off, iterate in BALANCE.md
5. Commit both docs + code
6. Later (Phase 4), add to database as unlockable item in `/backend/db/migrations/`

---

## Testing

### Phase 1 checklist
- [ ] Two ragdolls spawn ✓
- [ ] Collisions are physics-y ✓
- [ ] Debug panel works ✓
- [ ] Seed control reproduces same fight ✓
- [ ] Export replay JSON works ✓

### Phase 4 checklist
- [ ] Backend API endpoints respond ✓
- [ ] User can login ✓
- [ ] City state persists ✓
- [ ] Battle rewards reflect in resources ✓

---

## References
- **Matter.js docs:** https://brm.io/matter-js/docs/
- **Canvas API:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Render docs:** https://render.com/docs/
- **Express.js:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## FAQ

**Q: Why are the docs separate from the code?**  
A: So Antigravity (and humans) can read them without context bloat. Antigravity reads docs, then generates code that matches. Humans update docs when design changes, and the docs drive future AI generations.

**Q: Can I start with Phase 2 or 4?**  
A: No. Phase 1 (stable physics sandbox) is the foundation. Everything else builds on it.

**Q: What if I change the ragdoll structure (add/remove limbs)?**  
A: Update ARCHITECTURE.md → update Ragdoll.js → test stability → commit.

**Q: How often should I update the docs?**  
A: Every time you make a design decision that future code should know about. At minimum: Phase 1 complete, before Phase 2.

---

## Next steps

1. **Create the repo** with the directory structure (just folders for now)
2. **Paste these 6 docs** into `/docs/` folder
3. **Use the combined prompt** with Antigravity to generate Phase 1
4. **Run the battle sandbox** locally and test
5. **Update docs** with any tweaks or discoveries
6. **Commit everything** (docs + generated code)
7. **Repeat for Phases 2-5**

---

**Good luck, and have fun building! 🎮**
