# DEV_NOTES.md — Setup, tips & troubleshooting

## Quick start (Phase 1 — Battle Sandbox)

### 1. Clone repo and install
```bash
git clone https://github.com/yourusername/arenaforge.git
cd arenaforge/frontend/battle
npm install
```

### 2. Run a local server
```bash
# Option A: Python
python -m http.server 8000

# Option B: Node (via http-server package)
npx http-server -p 8000

# Option C: Live Server (VS Code extension)
# Right-click index.html → Open with Live Server
```

### 3. Open browser
```
http://localhost:8000/frontend/battle/index.html
```

You should see:
- A canvas with two stick figures
- A debug panel on the right with sliders
- A "Start" button

---

## Common setup issues

### "Matter.js not loading"
- Make sure CDN link is in `index.html` `<head>`:
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/2.0.20/matter.min.js"></script>
  ```
- Clear browser cache (Ctrl+F5)

### "ES modules not loading"
- Use a real HTTP server (not `file://` protocol)
- Browser dev tools → Console to check for CORS errors
- If deploying, ensure backend serves index.html at `/`

### "Ragdoll looks broken"
- Check constraint stiffness in debug panel (try 0.8-0.95)
- Reduce gravity temporarily to test
- Open dev console (F12) and check for JS errors

---

## Development workflow

### Phase 1: Get ragdoll stable
1. Focus on `/src/physics/Ragdoll.js` and constraint values
2. Use debug panel to tweak stiffness/damping
3. Test edge cases: jumping, falling, heavy impacts
4. Export working config to `/src/utils/Config.js`

### Phase 2: Add weapons/spells
1. Define items in `/src/items/weapons.js`, etc.
2. Extend `Fighter` class to equip items
3. Test damage calculation with debug numbers visible
4. Iterate balance in BALANCE.md

### Phase 3-4: Integrate backend
1. Start Express server in `/backend/server.js`
2. Implement API endpoints (see API.md)
3. Test with curl or Postman before frontend wiring
4. Add fetch calls in `/frontend/city/src/API.js`

---

## Battle engine debugging

### Enable all debug overlays
Open DebugPanel.js and set:
```javascript
const DEFAULT_DEBUG = {
  showConstraints: true,
  showCollisions: true,
  showImpulse: true,
  showHealth: true,
  showAI: true
};
```

### Check collision impulses
In DamageSystem.js, log all collisions:
```javascript
Matter.Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach(pair => {
    console.log('Collision:', pair.bodyA.label, '←→', pair.bodyB.label, 'impulse:', pair.collision.normalImpulse);
  });
});
```

### Replay a specific seed
1. Find seed in browser console after fight (logged as "Battle seed: 12345")
2. Copy seed into debug panel
3. Click "Start" → fight replays identically

### Export replay JSON
Button should appear after fight ends. Copy JSON to a text file, commit to repo.

---

## Backend (Phase 4+) quick start

### Prerequisites
- Node.js 16+
- PostgreSQL (local or Render account)
- .env file with secrets (see .env.example)

### 1. Install dependencies
```bash
cd arenaforge/backend
npm install
```

### 2. Set up database
```bash
# Copy environment template
cp .env.example .env

# Fill in DATABASE_URL from Render Postgres
# Run migrations
npm run migrate
```

### 3. Start server
```bash
npm start
# Should log: "Server listening on port 3000"
```

### 4. Test endpoints with curl
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"TestUser","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get user (requires token from login response)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Render deployment

### Frontend (Phase 1-2)
1. Create static site on Render: https://render.com/docs/static-sites
2. Build command: (none, or just a copy)
3. Publish directory: `/frontend/battle`
4. Every push triggers redeploy

### Backend + Database (Phase 4+)
1. Create PostgreSQL database on Render (see DB_SCHEMA.md)
2. Create Web Service on Render:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: set DATABASE_URL (auto-provided) + SECRET_KEY (generate with `openssl rand -hex 32`)
3. Link services: backend calls database via DATABASE_URL
4. Set up Cron Job for idle resource accrual (optional)

---

## Common Render gotchas

### "ENOTFOUND database"
- Database not ready yet; wait 30s after creation
- Check DATABASE_URL in Render dashboard under Environment

### "Connection rejected"
- Database URL wrong (typo, stale copy from old DB)
- Check Postgres service is still running (Render can pause free tier)
- Use connection pooling in backend (`pg-pool`)

### "Deploy is slow"
- First deploy takes 3-5 min (building npm packages)
- Subsequent deploys ~30s if no new packages
- Keep dependencies minimal

### "Static site won't serve index.html for deep routes"
- Render static sites serve HTML correctly by default
- If using a router, see Render docs on _redirects file (not needed for this project)

---

## Code style & conventions

### File naming
- Modules: PascalCase (`Ragdoll.js`, `DamageSystem.js`)
- Utilities: camelCase (`seededRNG.js`)
- Data files: camelCase (`weapons.js`, `config.js`)

### Variable naming
- `fighter` / `fighterA` / `fighterB` for instances
- `strength`, `defense` for stats (not "str" or "def")
- `impulse`, `damage`, `knockback` for physics values
- `debugConfig`, `balanceConfig` for settings objects

### Comments
- Use `// ` for single-line notes
- Use `/** ... */` for function/class docs
- Keep comments short; let code speak

---

## Performance tips

### Canvas rendering
- Batch draw calls when possible
- Clear canvas once per frame (not per entity)
- Use requestAnimationFrame for 60fps target

### Physics simulation
- Keep solver iterations low (default 3-4)
- Use fixed timestep (no variable delta)
- Cull distant collisions if needed (unlikely for 1v1)

### Network (backend)
- Use connection pooling for database
- Cache leaderboard (update hourly, not per request)
- Compress replay JSON before storing (optional)

---

## Testing checklist

### Before Phase 1 handoff
- [ ] Two ragdolls spawn
- [ ] They move/jump realistically
- [ ] Collisions feel responsive
- [ ] Debug panel changes settings live
- [ ] Seed control reproduces same fight
- [ ] Replay export/import works

### Before Phase 2 handoff
- [ ] Items (weapons/spells/armor) equip visually
- [ ] Damage calculation matches formulas in BALANCE.md
- [ ] Knockback is proportional to impulse
- [ ] Health bar decreases and KO works

### Before Phase 4 handoff
- [ ] All API endpoints respond (test with curl)
- [ ] User can create account + login
- [ ] Fighter creation persists to database
- [ ] City state saves + loads
- [ ] Battle result updates resources

---

## Debugging workflow (example)

**Problem:** Fighter takes too much knockback from light hits.

**Solution:**
1. Open `/src/utils/Config.js` and find `IMPULSE_TO_KNOCKBACK_MULTIPLIER`
2. Log impulse values in DamageSystem.js:
   ```javascript
   console.log('Impulse:', pair.collision.normalImpulse);
   ```
3. Run debug fight, watch console
4. Adjust multiplier (e.g., 0.05 → 0.03) and reload
5. Test again, compare with replay
6. Once satisfied, update BALANCE.md with new value
7. Commit change

---

## FAQ

**Q: Why no Phaser or Babylon.js?**  
A: Simpler to learn, easier to debug, matches your existing code, no dependency hell.

**Q: How do I add a new weapon?**  
A: Add entry to `/src/items/weapons.js` with data (mass, length, damageScale). Test in battle with debug panel. Update BALANCE.md. Done.

**Q: Can I change the ragdoll body parts?**  
A: Yes, edit Ragdoll.js. Add/remove limbs by creating more bodies + constraints. Test for stability.

**Q: How does Render Cron Jobs work?**  
A: Set a URL (your backend) + schedule (e.g., "hourly"). Render hits that endpoint. Backend runs accrual logic. See Render docs.

**Q: Do I need Docker?**  
A: No, but it's useful for local Postgres testing. See docker-compose.yml template.

---

## Links & resources

- Matter.js docs: https://brm.io/matter-js/docs/
- Render docs: https://render.com/docs/
- PostgreSQL: https://www.postgresql.org/docs/
- Express.js: https://expressjs.com/
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

## Maintenance notes

- Update Matter.js CDN version quarterly (security, bug fixes)
- Backup PostgreSQL on Render regularly (set up automated backups in Render dashboard)
- Monitor battle replays for balance exploits
- Archive old replay data (battles >1 year old) to reduce DB size
