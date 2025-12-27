# API.md — Express endpoint specifications

## Base URL
```
Production: https://arenaforge-backend.onrender.com
Development: http://localhost:3000
```

All endpoints require:
- `Content-Type: application/json`
- Auth endpoints use Bearer tokens in `Authorization: Bearer <token>` header

## Auth endpoints

### POST /api/auth/register
Register a new account.

**Request:**
```json
{
  "email": "player@example.com",
  "username": "StickKing",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "userId": 1,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "player@example.com",
    "username": "StickKing",
    "createdAt": "2025-12-27T23:00:00Z"
  }
}
```

**Errors:**
- 400 Bad Request: Missing fields, invalid email
- 409 Conflict: Email/username already exists

---

### POST /api/auth/login
Authenticate user.

**Request:**
```json
{
  "email": "player@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "StickKing",
    "eloRating": 1600
  }
}
```

**Errors:**
- 401 Unauthorized: Wrong credentials

---

### GET /api/auth/me
Get current user info (requires auth).

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "StickKing",
    "email": "player@example.com",
    "eloRating": 1600,
    "totalWins": 5,
    "totalLosses": 2
  }
}
```

---

## Fighter endpoints

### GET /api/fighters
List all fighters owned by current user (requires auth).

**Response (200 OK):**
```json
{
  "success": true,
  "fighters": [
    {
      "id": 101,
      "userId": 1,
      "name": "Stick King",
      "level": 3,
      "baseHealth": 100,
      "baseStrength": 10,
      "baseDefense": 5,
      "baseAgility": 7,
      "weaponId": "sword_1",
      "spells": ["fireball", null],
      "armorId": "armor_light",
      "wins": 5,
      "losses": 2
    }
  ]
}
```

---

### POST /api/fighters
Create a new fighter (requires auth).

**Request:**
```json
{
  "name": "Stick King",
  "baseHealth": 100,
  "baseStrength": 10,
  "baseDefense": 5,
  "baseAgility": 7
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "fighter": {
    "id": 101,
    "userId": 1,
    "name": "Stick King",
    "createdAt": "2025-12-27T23:00:00Z"
  }
}
```

---

### GET /api/fighters/:fighterId
Get a specific fighter (requires auth, user must own fighter).

**Response (200 OK):**
```json
{
  "success": true,
  "fighter": {
    "id": 101,
    "name": "Stick King",
    "level": 3,
    "experience": 250,
    "baseHealth": 100,
    "weaponId": "sword_1",
    "spells": ["fireball", "ice_slow"],
    "armorId": "armor_light",
    "wins": 5,
    "losses": 2
  }
}
```

---

### PUT /api/fighters/:fighterId
Update fighter equipment/settings (requires auth).

**Request:**
```json
{
  "weaponId": "sword_1",
  "spells": ["fireball", "ice_slow"],
  "armorId": "armor_medium"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "fighter": {
    "id": 101,
    "weaponId": "sword_1",
    "spells": ["fireball", "ice_slow"],
    "armorId": "armor_medium"
  }
}
```

---

## Battle endpoints

### POST /api/battles/start
Initialize a new battle (requires auth).

**Request:**
```json
{
  "fighterId": 101,
  "opponentId": 102,
  "arenaId": "arena_basic",
  "battleType": "arena"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "matchId": "match_123456",
  "seed": 12345,
  "fighterA": {
    "id": 101,
    "name": "Stick King",
    "health": 100,
    "weapon": {...},
    "armor": {...}
  },
  "fighterB": {
    "id": 102,
    "name": "Stick Warrior",
    "health": 100,
    "weapon": {...},
    "armor": {...}
  }
}
```

---

### POST /api/battles/end
Submit battle results (requires auth, must have valid matchId).

**Request:**
```json
{
  "matchId": "match_123456",
  "winnerId": 101,
  "loserId": 102,
  "durationMs": 15230,
  "replay": {
    "seed": 12345,
    "decisions": [...],
    "killLog": [...]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "rewards": {
    "winner": {
      "gold": 150,
      "xp": 50,
      "items": []
    },
    "loser": {
      "gold": 50,
      "xp": 10,
      "items": []
    }
  },
  "updatedStats": {
    "winnerId": 101,
    "wins": 6,
    "losses": 2,
    "newElo": 1650
  }
}
```

---

### GET /api/battles/history?limit=10&offset=0
Get user's battle history (requires auth).

**Response (200 OK):**
```json
{
  "success": true,
  "total": 42,
  "battles": [
    {
      "id": "match_123456",
      "fighterId": 101,
      "opponentId": 102,
      "winnerId": 101,
      "durationMs": 15230,
      "createdAt": "2025-12-27T23:00:00Z",
      "replay": {...}
    }
  ]
}
```

---

### GET /api/battles/:matchId/replay
Download a specific battle replay (public, no auth required).

**Response (200 OK):**
```json
{
  "success": true,
  "matchId": "match_123456",
  "seed": 12345,
  "fighterA": {id: 101, name: "Stick King"},
  "fighterB": {id: 102, name: "Stick Warrior"},
  "replay": {
    "seed": 12345,
    "decisions": [...],
    "killLog": [...]
  }
}
```

---

## City endpoints

### GET /api/city
Get current user's city state (requires auth).

**Response (200 OK):**
```json
{
  "success": true,
  "city": {
    "userId": 1,
    "buildings": [
      {
        "id": "barracks_1",
        "buildingType": "barracks",
        "level": 1,
        "positionX": 100,
        "positionY": 150,
        "completedAt": "2025-12-27T23:00:00Z"
      },
      {
        "id": "farm_1",
        "buildingType": "farm",
        "level": 1,
        "positionX": 200,
        "positionY": 100,
        "productionRate": 5
      }
    ],
    "resources": {
      "gold": 500,
      "iron": 100,
      "lumber": 75,
      "crystals": 0
    }
  }
}
```

---

### PUT /api/city/building/:buildingId/upgrade
Upgrade a building (requires auth, user must own city).

**Request:**
```json
{
  "buildingId": "farm_1"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "building": {
    "id": "farm_1",
    "level": 2,
    "productionRate": 7,
    "completedAt": "2025-12-27T23:30:00Z"
  },
  "costPaid": {
    "gold": 100,
    "iron": 50
  },
  "resourcesRemaining": {
    "gold": 400,
    "iron": 50
  }
}
```

---

### POST /api/city/resources/claim
Claim idle-generated resources (requires auth).

**Request:**
```json
{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "accrued": {
    "gold": 25,
    "iron": 10,
    "lumber": 5
  },
  "newTotals": {
    "gold": 525,
    "iron": 110,
    "lumber": 80
  }
}
```

---

## Inventory endpoints

### GET /api/inventory
Get all items owned by user (requires auth).

**Response (200 OK):**
```json
{
  "success": true,
  "items": [
    {
      "id": 1,
      "itemType": "weapon",
      "itemId": "sword_1",
      "quantity": 1,
      "unlocked": true,
      "rarity": "common"
    },
    {
      "id": 2,
      "itemType": "spell",
      "itemId": "fireball",
      "quantity": 1,
      "unlocked": true,
      "rarity": "common"
    }
  ]
}
```

---

### POST /api/inventory/unlock
Unlock an item (e.g., after battle reward).

**Request:**
```json
{
  "itemId": "spell_ice_slow"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "item": {
    "itemId": "spell_ice_slow",
    "unlocked": true
  }
}
```

---

## Leaderboard endpoints

### GET /api/leaderboard?limit=50&offset=0
Get global leaderboard (no auth required).

**Response (200 OK):**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": 5,
      "username": "TopSticker",
      "eloRating": 2100,
      "wins": 100,
      "losses": 20
    },
    {
      "rank": 2,
      "userId": 1,
      "username": "StickKing",
      "eloRating": 1650,
      "wins": 6,
      "losses": 2
    }
  ]
}
```

---

## Error handling
All errors return a consistent format:
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

**Common HTTP status codes:**
- 200 OK: Success
- 201 Created: Resource created
- 400 Bad Request: Invalid input
- 401 Unauthorized: Missing/invalid auth token
- 403 Forbidden: User lacks permission
- 404 Not Found: Resource doesn't exist
- 409 Conflict: Resource already exists
- 500 Internal Server Error: Server error
