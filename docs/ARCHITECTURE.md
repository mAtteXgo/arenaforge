# ARCHITECTURE.md — System Design & Data Flow

## System overview
```
┌─────────────────────────────────────────────────────────────────┐
│                       ARENAFORGE SYSTEM                         │
├──────────────────────┬──────────────────┬──────────────────────┤
│    FRONTEND LAYER    │   BACKEND LAYER  │    DATA LAYER        │
├──────────────────────┼──────────────────┼──────────────────────┤
│ HTML5 Canvas × 2:    │  Node.js Express │ PostgreSQL (Render)  │
│ • Battle Engine      │  • REST API      │ • User accounts      │
│ • City Hub UI        │  • Auth/Session  │ • Fighter profiles   │
│                      │  • Matchmaking   │ • Inventory          │
│ Vanilla JS (ES Mods) │  • Battle Logic  │ • City state         │
│ • Matter.js          │  • Resource calc │ • Battle history     │
│ • Canvas Rendering   │                  │ • Resources/items    │
│                      │  Env vars:       │                      │
│ Dev: Antigravity IDE │  DATABASE_URL    │                      │
│                      │  SECRET_KEY      │                      │
│ Prod: Static server  │  API_KEY         │                      │
│       + Express      │  RENDER_URL      │                      │
└──────────────────────┴──────────────────┴──────────────────────┘
```

## Directory structure
```
arenaforge/
├── /docs/                          # Documentation (this folder)
│   ├── CONTEXT.md                  # Project vision & game loop
│   ├── ARCHITECTURE.md             # System design & data flow
│   ├── DB_SCHEMA.md                # Database tables & fields
│   ├── API.md                      # Express endpoint specs
│   ├── BALANCE.md                  # Weapons/spells/armor stats
│   └── DEV_NOTES.md                # Troubleshooting, tips
│
├── /frontend/                      # Client-side code (HTML5)
│   ├── index.html                  # Entry point + loader
│   ├── /battle/                    # Battle engine (Phase 1-2)
│   │   ├── index.html              # Battle sandbox (standalone)
│   │   ├── /src/
│   │   │   ├── engine/             # Physics + sim step
│   │   │   │   ├── World.js        # Matter world setup
│   │   │   │   ├── Simulator.js    # Fixed timestep loop
│   │   │   │   └── DamageSystem.js # Collision → damage
│   │   │   ├── physics/            # Ragdoll creation
│   │   │   │   ├── Ragdoll.js      # Fighter body + constraints
│   │   │   │   └── Limbs.js        # Body part helpers
│   │   │   ├── render/             # Canvas drawing
│   │   │   │   ├── Renderer.js     # Main render loop
│   │   │   │   ├── StickFigure.js  # Draw ragdoll
│   │   │   │   └── Effects.js      # Particles, shake, debug
│   │   │   ├── entities/           # Game objects
│   │   │   │   ├── Fighter.js      # Fighter wrapper (stats + body)
│   │   │   │   ├── Weapon.js       # Weapon entity
│   │   │   │   └── Projectile.js   # Spell projectiles
│   │   │   ├── items/              # Data definitions
│   │   │   │   ├── weapons.js      # Weapon data
│   │   │   │   ├── spells.js       # Spell data
│   │   │   │   └── armor.js        # Armor data
│   │   │   ├── ai/                 # AI decision-making
│   │   │   │   ├── AIBrain.js      # Main AI loop
│   │   │   │   └── Behaviors.js    # Movement, attack, cast
│   │   │   ├── ui/                 # Debug overlays
│   │   │   │   ├── DebugPanel.js   # Settings panel
│   │   │   │   ├── HUD.js          # Health bars, timers
│   │   │   │   └── Controls.js     # Button handlers
│   │   │   ├── replay/             # Determinism + logging
│   │   │   │   ├── ReplayRecorder.js  # Log decisions
│   │   │   │   └── ReplayPlayer.js    # Replay from log
│   │   │   ├── utils/
│   │   │   │   ├── SeededRNG.js    # Deterministic randomness
│   │   │   │   ├── Config.js       # Balance tuning
│   │   │   │   └── Constants.js    # Magic numbers
│   │   │   └── index.js            # Main entry for battle engine
│   │   └── package.json            # (Optional, for dev)
│   │
│   ├── /city/                      # City Hub (Phase 4)
│   │   ├── index.html              # City view page
│   │   ├── /src/
│   │   │   ├── CityHub.js          # Main city renderer
│   │   │   ├── Buildings.js        # Building visuals + data
│   │   │   ├── Inventory.js        # Item list UI
│   │   │   ├── FighterManager.js   # Create/equip fighters
│   │   │   ├── API.js              # Fetch/save game state
│   │   │   └── index.js            # Entry point
│   │   └── css/
│   │       └── city.css
│   │
│   ├── /shared/                    # Shared client/server
│   │   ├── schemas.js              # Fighter, item, building types
│   │   ├── constants.js            # Magic numbers (both sides)
│   │   ├── itemDefinitions.js      # Weapons/spells/armor defs
│   │   └── buildingDefinitions.js  # City buildings defs
│   │
│   └── /assets/                    # (None by default; procedural drawing)
│
├── /backend/                       # Server-side code (Node/Express)
│   ├── server.js                   # Express app setup
│   ├── .env.example                # Env var template
│   ├── /routes/
│   │   ├── auth.js                 # Login, signup, session
│   │   ├── fighters.js             # GET/POST fighters, loadouts
│   │   ├── battles.js              # POST battle result, GET history
│   │   ├── city.js                 # GET/PUT city state
│   │   ├── inventory.js            # GET/PUT items & resources
│   │   └── leaderboard.js          # GET top players
│   │
│   ├── /middleware/
│   │   ├── auth.js                 # Token validation
│   │   └── errorHandler.js         # Error catching
│   │
│   ├── /db/
│   │   ├── pool.js                 # PostgreSQL connection
│   │   ├── migrations/             # Schema version control
│   │   │   ├── 001-init.sql        # Initial schema
│   │   │   ├── 002-fighters.sql    # Fighter table
│   │   │   └── ...
│   │   └── queries.js              # Reusable SQL queries
│   │
│   ├── /services/
│   │   ├── AuthService.js          # User logic
│   │   ├── BattleService.js        # Battle result processing
│   │   ├── CityService.js          # City progression
│   │   ├── ResourceService.js      # Idle resource accrual
│   │   └── MatchmakingService.js   # ELO/queue logic
│   │
│   ├── /cron/                      # Scheduled tasks (Phase 4+)
│   │   ├── resourceAccrual.js      # Daily/hourly ticks
│   │   └── cleanup.js              # Archive old battles
│   │
│   └── package.json                # Node dependencies
│
├── .gitignore
├── .env.example
├── package.json                    # Root (if monorepo)
├── README.md                       # Setup & quick start
└── docker-compose.yml              # (Optional: local Postgres)
```

## Data flow (example: player fights)

### Pre-battle: Load fight config
```
City Hub [Canvas]
  ↓
Select Fighter A + Fighter B + Arena
  ↓
Send POST /api/battles/start
  ↓
Backend generates matchID, logs fight start
  ↓
Returns {matchID, seed, arenaConfig, fighter_a_config, fighter_b_config}
  ↓
Frontend /battle/index.html loads + renders with that config
```

### During battle: Physics simulation
```
Matter.Engine.update() [fixed timestep]
  ↓ (per tick)
Collision detection → Damage events
  ↓
AI decision tick → movement forces
  ↓
Render canvas frame + debug UI
  ↓
Record event log (decisions, impacts, KO check)
  ↓
If KO → determine winner + export replay JSON
```

### Post-battle: Persist results
```
Battle over
  ↓
Export replay JSON + winner + kill log
  ↓
POST /api/battles/end {matchID, winner, replay, killLog}
  ↓
Backend:
  • Updates fighter stats (XP, wins, losses)
  • Generates rewards (gold, loot drops)
  • Updates city resources
  • Stores replay (optional, for viewing)
  ↓
Returns {rewards: {gold: 100, loot: [...]}, newStats: {...}}
  ↓
Frontend: Show rewards screen, return to City Hub
  ↓
City state auto-syncs or manual refresh
```

## Key interfaces (to keep in sync)

### Fighter config (input to battle)
```javascript
{
  id: "fighter_123",
  name: "Stick King",
  stats: {
    health: 100,
    strength: 10,
    defense: 5,
    agility: 7
  },
  weapon: {id: "sword_1", type: "sword", ...},
  spells: [{id: "fireball", cooldown: 3000}, ...],
  armor: {id: "armor_light", defense: 3, ...},
  ragdollConfig: {mass: 1, limbStiffness: 0.8, damping: 0.1},
  aiConfig: {aggression: 0.6, moveSpeed: 80}
}
```

### Battle result (output)
```javascript
{
  matchID: "match_456",
  seed: 12345,
  winner: "fighter_123",
  loser: "fighter_789",
  duration: 15230,  // ms
  killLog: [
    {timestamp: 1000, attacker: "123", defender: "789", damage: 25, hitType: "head"},
    ...
  ],
  replay: {
    seed: 12345,
    decisions: [{tick: 5, fighter: "123", action: "jump", ...}, ...],
    physics: null  // (optional; usually just decisions)
  },
  rewards: {
    winner: {gold: 150, xp: 50, items: []},
    loser: {gold: 50, xp: 10, items: []}
  }
}
```

### City state (persisted)
```javascript
{
  userId: "user_456",
  buildings: [
    {id: "barracks", level: 2, position: {x: 100, y: 200}},
    {id: "farm", level: 1, position: {x: 200, y: 150}},
    ...
  ],
  resources: {
    gold: 500,
    iron: 100,
    lumber: 75,
    xp: 0
  },
  fighters: ["fighter_123", "fighter_789"],
  lastUpdated: 1704067200000
}
```

## Phase handoff strategy
- **Phase 1→2:** Battle engine stays in `/frontend/battle/`, reuse everything, add data-driven items.
- **Phase 2→3:** Keep battle engine, add `/backend/` with stub endpoints, wire up AI text generation.
- **Phase 3→4:** Add PostgreSQL migrations, City Hub screens, real API persistence.
- **Phase 4→5:** Extend schema + routes for Story mode, add Socket.IO for social.

## Testing & iteration loop
1. Make balance change in `/shared/constants.js` or `/docs/BALANCE.md`.
2. Reload battle sandbox with new seed.
3. Adjust debug settings in DebugPanel.js.
4. Replay last fight from JSON log.
5. Export + inspect replay; iterate.
6. Once satisfied, commit settings to `/api/` + database defaults for next server deploy.
