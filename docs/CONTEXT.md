# PROJECT: ARENAFORGE (Rebuild) — CONTEXT.md

## Vision
ArenaForge is a physics-first stick-fighter RPG where the **battle engine** is the main attraction and the "city hub" is the long-term progression layer.  
Core fantasy: build fighters + gear in a city, then watch chaotic-but-readable AI ragdoll battles to earn loot/resources and expand the city.

## Core pillars (non‑negotiable)
- **Physics spectacle first:** Always-on ragdoll combat; entertainment and replays matter as much as "winning."
- **Deterministic & testable:** Seeded AI + fixed timestep; fights can be replayed and balanced by tuning settings.
- **Meta progression matters:** The City Hub + persistence isn't a menu—it's the second half of the game loop.
- **Data-driven content:** Weapons/spells/armor/buildings are defined as data objects and can be expanded without rewriting systems.

## Target game loop
1) Player manages City Hub → collects resources → upgrades buildings / crafts gear / trains fighters.
2) Player sends fighters to Arena (repeatable) or Story (structured) → battles generate rewards and progression events.
3) Rewards return to City Hub → unlock more content and stronger builds → loop continues.

## Tech stack & deployment
- **Frontend:** HTML5 Canvas (battle + city), vanilla JS ES modules.
- **Physics:** Matter.js.
- **Backend:** Node.js + Express.
- **Persistence:** PostgreSQL on Render (Phase 4, but designed-in from day 1 via clear API boundaries).
- **Secrets/config:** Render environment variables for DB URLs, API keys, etc.
- **Scheduled tasks:** Render Cron Jobs (for idle resource generation, cleanup, etc.).

## Product structure (modules)
- `/battle/` — Battle Engine (standalone first; later embedded in Arena + Story).
- `/city/` — City Hub renderer + interaction (canvas-based city map).
- `/api/` — Express API for auth, saves, matchmaking, inventory, city state.
- `/shared/` — Shared schemas, constants, item definitions, balance tables.

## Battle engine spec (what "good" means)
- Always physics-driven ragdolls (human-ish body parts + constraints).
- AI vs AI only (no player control in fights).
- Damage is collision/impulse-based (no fighting-game hitboxes).
- Debug-first: seed control, step frame, replay last fight, export/import replay JSON.
- Juice: camera shake + impact particles + readable health/KO states.

## Content system (data-driven)
### Items
**Weapons:** physical bodies attached via constraints; stats affect mass, length, grip, damage scaling.  
Examples: sword (fast, low reach), spear (medium speed, high reach), hammer (slow, high knockback).

**Spells:**
- Impulse-based damage spells (blast, lightning impulse, explosive projectile).
- Status/effect spells (slow, gravity changes, friction changes, dampening).

**Armor:** mitigates damage/knockback with tradeoffs (weight reduces agility).  
Tiers: light (low defense, high speed), medium (balanced), heavy (high defense, low speed).

### City buildings
Minimum set (Phase 4 deliverable):
- **Town Hall:** account overview, upgrades, news/patch notes, leaderboard access.
- **Barracks:** create/manage fighters, equip loadouts, training.
- **Arena:** matchmaking/queued fights + rewards.
- **Farms/Mines:** passive resource generation over time (idle economy).

## Development phases (deliverable-driven)

### Phase 1 — Physics Playground (battle feel)
**Deliverable:** standalone local sandbox with 2 ragdolls fighting, debug panel for physics knobs + seed, no backend.  
**Exit criteria:** stable ragdolls, fun collisions, deterministic replays, clear KO/win condition.

### Phase 2 — Simulator (rules + loadouts)
**Deliverable:** battle rules become consistent: stats, loadouts, weapons/spells/armor data-driven, impulse-based damage visible in debug.  
**Exit criteria:** changing equipment/settings reliably changes fight outcome; replays match seed/settings.

### Phase 3 — The Brain (AI integration)
**Deliverable:** AI "battle narration" or fight script generation can be plugged in (OpenRouter), but the physics engine stays authoritative.  
**Exit criteria:** AI text enriches the experience without deciding outcomes in a non-deterministic way.

### Phase 4 — Persistence & City Hub (major pillar)
**Goal:** make the City Hub a real game layer, backed by PostgreSQL on Render.

**Phase 4 deliverables**
- City Hub screen is a **visual city map** (canvas), not a list/menu.
- PostgreSQL schema + migrations for:
  - users
  - fighters
  - inventory (items, quantities, unlock flags)
  - city (buildings, levels, layout)
  - resources (balances + timestamps)
  - battles (results, replays, rewards)
- Express API endpoints (minimum):
  - Auth (simple session or token; can start basic)
  - Get/Save city state
  - Get/Save fighters + loadouts
  - Post battle result + rewards
  - Fetch battle history/replays
- Idle resources:
  - Either "compute-on-login" using timestamps, or scheduled accrual via Render Cron Jobs.
- Render configuration:
  - Use Render-provided DB connection URLs via environment variables/secrets.

**Exit criteria**
- A player can log in, see their city, upgrade a building, generate/claim resources, and those changes persist across sessions.
- After a battle, rewards persist and reflect in inventory/resources/city progression.

### Phase 5 — Story & Social
**Deliverable:** Story map accessible from city + social layer (chat, etc.).  
Socket.IO is an option for real-time chat/events when ready.

## Key design decisions (to avoid rewrites)
- Battle engine stays standalone with a clean interface:
  - Input: seed + fighter configs + arena config
  - Output: winner + event log + replay JSON + rewards summary
- City Hub never directly manipulates Matter.js; it only configures fighters and launches battles.
- Persistence uses server APIs; localStorage may be used only as a temporary dev stub (replaceable).

## Success metrics (what to optimize for)
- Battles are funny/chaotic but still readable (players can tell why someone won).
- Balance iteration is fast (debug UI + replay + seed).
- City Hub creates long-term goals: "one more upgrade" → "one more fight."
