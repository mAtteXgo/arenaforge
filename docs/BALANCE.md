# BALANCE.md — Game balance tables & tuning constants

## Weapons (data-driven definitions)

| Name | ID | Type | Mass | Length | Grip offset | Damage scale | Knockback scale | Speed | Rarity | Unlock |
|------|----|----|------|--------|------------|--------------|-----------------|-------|--------|--------|
| Iron Sword | sword_1 | sword | 1.2 | 60 | 15 | 1.0x | 1.0x | 1.0 | common | start |
| Wooden Spear | spear_1 | spear | 0.8 | 90 | 20 | 0.8x | 0.8x | 1.1 | common | start |
| Stone Hammer | hammer_1 | hammer | 2.0 | 40 | 10 | 1.3x | 1.4x | 0.7 | uncommon | level 5 |
| Silver Sword | sword_2 | sword | 1.0 | 65 | 15 | 1.2x | 1.1x | 1.1 | uncommon | level 10 |
| Crystal Spear | spear_2 | spear | 0.7 | 100 | 25 | 1.0x | 1.0x | 1.3 | rare | level 15 |

**Weapon impact on ragdoll:**
- mass: added to grip point body
- length: determines reach distance
- grip offset: where weapon attaches to hand
- damage/knockback scale: multipliers on collision impulse

---

## Spells (impulse + effect)

### Damage spells

| Name | ID | Type | Cooldown (ms) | Impulse | Radius | Damage scale | Projectile speed | Unlock |
|------|----|----|------------|---------|--------|--------------|-----------------|--------|
| Fireball | fireball | blast | 3000 | 800 | 50 | 1.0x | 200 | start |
| Lightning Strike | lightning | strike | 4000 | 1200 | 40 | 1.2x | instant | level 5 |
| Ice Spike | ice_spike | projectile | 2500 | 600 | 30 | 0.8x | 150 | level 10 |

**Damage spell mechanics:**
- impulse: force applied to all bodies in radius on cast
- cooldown: time before fighter can cast again
- damage scale: multiplier on impulse→damage conversion
- projectile speed: how fast spell travels (0 = instant)

### Status spells (non-damage)

| Name | ID | Type | Cooldown (ms) | Effect | Duration | Potency | Radius | Unlock |
|------|----|----|------------|--------|----------|---------|--------|--------|
| Slow | ice_slow | status | 3000 | velocity * 0.5 | 5000 | 0.5 | 80 | level 3 |
| Stun | stun | status | 5000 | damping * 2.0 | 3000 | 2.0 | 60 | level 10 |
| Gravity Surge | gravity_surge | status | 6000 | gravity * 1.5 | 4000 | 1.5 | 100 | level 15 |

**Status spell mechanics:**
- effect: what property gets modified
- duration: how long effect persists (ms)
- potency: multiplier/additive value applied
- radius: how far effect spreads (circle around caster)

---

## Armor (damage mitigation)

| Name | ID | Tier | Defense | Knockback reduction | Weight | Speed penalty | Price |
|------|----|----|---------|-------------------|--------|----------------|-------|
| Leather Armor | armor_light | light | 3 | 0.9x | 0.8 | 1.0x | 50 |
| Chain Mail | armor_medium | medium | 5 | 0.8x | 1.2 | 0.95x | 150 |
| Plate Armor | armor_heavy | heavy | 8 | 0.7x | 1.8 | 0.85x | 400 |

**Armor mechanics:**
- defense: flat damage reduction per hit
- knockback reduction: multiplier on impulse transferred to body
- weight: added to overall fighter mass (affects movement)
- speed penalty: multiplier on movement speed

---

## Fighter stats & progression

### Base stats (on creation)
- Health: 100
- Strength: 10 (damage multiplier)
- Defense: 5 (reduction base)
- Agility: 7 (movement speed)

### Stat growth per level
- Health: +10 per level
- Strength: +0.5 per level
- Defense: +0.3 per level
- Agility: +0.2 per level

**Example at level 5:**
- Health: 100 + (10 × 4) = 140
- Strength: 10 + (0.5 × 4) = 12
- Defense: 5 + (0.3 × 4) = 6.2
- Agility: 7 + (0.2 × 4) = 7.8

---

## Damage calculation

```
Impact Score = collisionImpulse × weaponDamageScale × strengthMultiplier
Damage = Impact Score - armorDefense
Knockback = collisionImpulse × knockbackScale × (1 - armorKnockbackReduction)

If headshot (impact on head): Damage × 1.5
If limb (impact on arm/leg): Damage × 0.7
```

**Example:**
- Fighter A hits Fighter B with sword (damage scale 1.0x)
- Collision impulse: 500 N
- Fighter A strength: 10 (multiplier 1.0x)
- Fighter B armor defense: 3
- Fighter B knockback reduction: 0.9x

```
Impact Score = 500 × 1.0 × 1.0 = 500
Damage = 500 - 3 = 497
Knockback = 500 × 1.0 × (1 - 0.9) = 50 N
```

---

## Impulse thresholds

| Event | Min impulse | Reaction |
|-------|------------|----------|
| Register hit | 50 | Show damage number |
| Knockback | 100 | Apply force to body |
| Stumble | 200 | Ragdoll temporary stagger |
| Knockdown | 400 | Full ragdoll drop to ground |
| KO | 600+ | Trigger defeat if health ≤ 0 |

---

## AI parameters

| Param | Range | Default | Effect |
|-------|-------|---------|--------|
| Aggression | 0.0-1.0 | 0.6 | Higher = more frequent attacks |
| Movement speed | 50-150 | 80 | Pixel/sec when moving |
| Jump force | 100-300 | 150 | Impulse on jump |
| Reaction time | 0-500 | 200ms | Delay before responding to opponent |
| Cast frequency | 0.0-1.0 | 0.3 | Chance to cast spell per decision |
| Retreat distance | 0-400 | 150px | How far to back away if threatened |

---

## Economy & resources

### Resource generation (per hour at building level 1)
- Farm: 5 gold, 2 lumber
- Mine: 3 iron, 1 crystal
- Town Hall: 0 (static)
- Arena: depends on battle wins

### Building upgrade costs
| Building | Level 1→2 | Level 2→3 | Level 3→4 | Level 4→5 |
|----------|---------|---------|---------|---------|
| Farm | 100 gold | 200 gold | 400 gold | 800 gold |
| Mine | 150 gold, 50 iron | 300 gold, 100 iron | 600 gold, 200 iron | 1200 gold, 400 iron |
| Barracks | 200 gold | 400 gold | 800 gold | 1600 gold |

### Battle rewards
- **Arena win:** 150 gold + 50 XP + random item drop chance
- **Arena loss:** 50 gold + 10 XP
- **Story win:** 500 gold + 200 XP + guaranteed item drop
- **Story loss:** 100 gold + 50 XP

---

## Tuning checklist (for debug panel adjustments)

When iterating balance:
1. Change parameter in `/shared/constants.js`
2. Reload battle with new seed
3. Observe fight outcomes
4. If desired outcome achieved: document in BALANCE.md + commit
5. If not: adjust and retry (use replay system for comparison)

**Key knobs to twiddle:**
- `IMPULSE_TO_DAMAGE_MULTIPLIER` (global)
- `KNOCKBACK_THRESHOLD` (when ragdoll reacts)
- `ARMOR_DEFENSE_PER_TIER`
- `AI_AGGRESSION` (per fighter)
- `WEAPON_DAMAGE_SCALE` (per weapon)
- `SPELL_COOLDOWN` (per spell)
