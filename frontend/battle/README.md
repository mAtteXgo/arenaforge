# ArenaForge — Battle Sandbox

Physics-first battle sandbox using Matter.js. Phase 1 Checkpoint 4: Impact numbers debug system.

## How to Run

```bash
npx http-server -p 8080
```

Open: `http://localhost:8080/frontend/battle/index.html`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause/Resume |
| `N` | Step Frame |
| `R` | Reset |
| `T` | Respawn Fighters |
| `1` | Toggle AI A |
| `2` | Toggle AI B |
| `H` | Toggle Impact Numbers |

## File Structure

```
frontend/battle/src/
├── index.js            # Entry point
├── engine/
│   ├── World.js        # Physics world + arena
│   ├── Simulator.js    # Fixed timestep loop
│   └── ImpactTracker.js # Collision impact detection
├── physics/
│   └── Ragdoll.js      # Ragdoll body parts
├── entities/
│   └── Fighter.js      # Fighter entity
├── ai/
│   └── AIBrain.js      # AI APPROACH/IDLE logic
├── render/
│   └── Renderer.js     # Stick figure + floating numbers
└── ui/
    └── Controls.js     # Button handlers
```

## Impact Configuration

Edit `IMPACT_CONFIG` in `ImpactTracker.js`:
- `minImpact` — Minimum to show (default: 50)
- `thresholds.small/medium/large` — Color breakpoints
- `maxFloatingNumbers` — Cap on screen (default: 20)
- `floatDuration` — How long numbers stay (default: 1500ms)

## Current Features

- ✅ Two fighters (blue A, red B)
- ✅ AI-vs-AI movement (APPROACH/IDLE)
- ✅ Floating impact numbers on collision
- ✅ Color by intensity (grey/yellow/red)
- ✅ H key toggles impact display
- ✅ Impact counter (last 5 seconds)
