# DB_SCHEMA.md — PostgreSQL Tables & Relationships

## Overview
Render PostgreSQL with standard connection pooling. All timestamps in UTC.

## Table definitions (SQL)

### `users` — Account management
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  elo_rating INT DEFAULT 1600,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  total_gold INT DEFAULT 0,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_elo_rating (elo_rating DESC)
);
```

### `fighters` — Fighter profiles (owned by user)
```sql
CREATE TABLE fighters (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  
  -- Core stats (can be modified by equipment/training)
  base_health INT DEFAULT 100,
  base_strength INT DEFAULT 10,
  base_defense INT DEFAULT 5,
  base_agility INT DEFAULT 7,
  
  -- Equipment IDs (foreign keys to inventory)
  weapon_id INT,
  spell_1_id INT,
  spell_2_id INT,
  armor_id INT,
  
  -- Combat record
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  
  INDEX idx_user_id (user_id),
  INDEX idx_level (level DESC)
);
```

### `inventory` — Items owned by user
```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,  -- 'weapon', 'spell', 'armor', 'material'
  item_id VARCHAR(100) NOT NULL,   -- e.g., 'sword_1', 'fireball_1', 'armor_light'
  quantity INT DEFAULT 1,
  unlocked BOOLEAN DEFAULT FALSE,
  rarity VARCHAR(50) DEFAULT 'common',  -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id),
  INDEX idx_user_id (user_id),
  INDEX idx_item_type (item_type)
);
```

### `resources` — Currency & idle generation
```sql
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gold INT DEFAULT 0,
  iron INT DEFAULT 0,
  lumber INT DEFAULT 0,
  crystals INT DEFAULT 0,
  last_accrual_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id)
);
```

### `city_buildings` — City progression
```sql
CREATE TABLE city_buildings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  building_type VARCHAR(50) NOT NULL,  -- 'barracks', 'farm', 'mine', 'town_hall', 'arena'
  level INT DEFAULT 1,
  position_x INT,
  position_y INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  production_rate INT,  -- for farms/mines: gold per hour
  
  UNIQUE(user_id, building_type),
  INDEX idx_user_id (user_id)
);
```

### `battles` — Battle history & replays
```sql
CREATE TABLE battles (
  id SERIAL PRIMARY KEY,
  match_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Fighters
  fighter_a_id INT NOT NULL REFERENCES fighters(id) ON DELETE SET NULL,
  fighter_b_id INT NOT NULL REFERENCES fighters(id) ON DELETE SET NULL,
  winner_id INT REFERENCES fighters(id) ON DELETE SET NULL,
  
  -- Metadata
  battle_type VARCHAR(50) DEFAULT 'arena',  -- 'arena', 'story', 'practice'
  arena_id INT,
  seed INT,
  duration_ms INT,
  
  -- Replay & logging
  replay_data JSONB,  -- {seed, decisions, killLog, duration}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Rewards (claimed/distributed)
  rewards_distributed BOOLEAN DEFAULT FALSE,
  
  INDEX idx_fighter_a (fighter_a_id),
  INDEX idx_fighter_b (fighter_b_id),
  INDEX idx_match_id (match_id),
  INDEX idx_created_at (created_at DESC)
);
```

### `leaderboard` — Cached rankings
```sql
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rank INT,
  elo_rating INT DEFAULT 1600,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_rank (rank ASC),
  INDEX idx_elo_rating (elo_rating DESC)
);
```

### `achievements` — Unlock tracking (Phase 5+)
```sql
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,  -- e.g., 'first_win', 'hundred_kills'
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, achievement_id),
  INDEX idx_user_id (user_id)
);
```

## Relationships diagram
```
users (1)
  ├─→ (many) fighters
  ├─→ (many) inventory
  ├─→ (1) resources
  ├─→ (many) city_buildings
  ├─→ (many) battles (as fighter_a)
  ├─→ (many) battles (as fighter_b)
  ├─→ (many) battles (as winner)
  ├─→ (1) leaderboard
  └─→ (many) achievements

fighters (1)
  └─→ (many) battles (as participant)

inventory items are referenced in:
  • fighters.weapon_id
  • fighters.spell_1_id, spell_2_id
  • fighters.armor_id
```

## Initialization queries

### Create tables (migration file: 001-init.sql)
```sql
-- Run all CREATE TABLE statements above in order
-- Then create indexes

CREATE INDEX idx_users_elo ON users(elo_rating DESC);
CREATE INDEX idx_fighters_user ON fighters(user_id);
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_battles_created ON battles(created_at DESC);
```

### Seed default items (migration file: 002-seed-items.sql)
```sql
-- Weapons
INSERT INTO item_definitions (id, item_type, name, rarity) VALUES
  ('sword_1', 'weapon', 'Iron Sword', 'common'),
  ('spear_1', 'weapon', 'Wooden Spear', 'common'),
  ('hammer_1', 'weapon', 'Stone Hammer', 'uncommon');

-- Spells
INSERT INTO item_definitions (id, item_type, name, rarity) VALUES
  ('fireball', 'spell', 'Fireball', 'common'),
  ('ice_slow', 'spell', 'Frostbolt', 'uncommon'),
  ('lightning', 'spell', 'Lightning Strike', 'uncommon');

-- Armor
INSERT INTO item_definitions (id, item_type, name, rarity) VALUES
  ('armor_light', 'armor', 'Leather Armor', 'common'),
  ('armor_medium', 'armor', 'Chain Mail', 'uncommon'),
  ('armor_heavy', 'armor', 'Plate Armor', 'rare');
```

## Notes on Render PostgreSQL
- Connection string from Render: `postgresql://user:password@host:5432/dbname`
- Use `.env` variables: `DATABASE_URL`, never hardcode.
- Render provides automatic backups; retention depends on plan.
- Connection pooling: use a library like `pg-pool` on backend to avoid exhausting connections.
- For scheduled tasks (idle resource accrual), use Render Cron Jobs or a separate Node.js worker process (Phase 4+).

## Migration strategy
- Store migrations in `/backend/db/migrations/` as `.sql` files.
- Run on deployment via a script (e.g., `npm run migrate`).
- Track schema version in a `schema_version` table to avoid re-running migrations.

## Example migration runner (Node.js)
```javascript
// /backend/db/migrate.js
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`✓ Migrated ${file}`);
    } catch (err) {
      console.error(`✗ Failed ${file}:`, err);
      process.exit(1);
    }
  }
}

migrate();
```

Run: `node /backend/db/migrate.js`
