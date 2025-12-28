/**
 * BalanceAssist.js — Ragdoll Balance Stabilization
 * 
 * Uses invisible "support spring" constraints to keep ragdolls upright
 * without causing jitter from setAngle corrections.
 */

const { Body, Constraint, Composite } = Matter;

// =============================================================================
// BALANCE CONFIGURATION — Easy to tweak!
// =============================================================================

export const BALANCE_CONFIG = {
    // Angular velocity damping (0.0-1.0, lower = more damping)
    angularDampFactor: 0.85,

    // Support constraint settings
    support: {
        enabled: true,
        targetHeightAbovePelvis: 80,  // How high above pelvis the anchor sits
        stiffness: 0.08,               // Constraint stiffness (0.05-0.15 works well)
        damping: 0.1,                  // Constraint damping
        length: 80,                    // Rest length of constraint
    },

    // Update interval (ms)
    tickInterval: 30,
};

// =============================================================================
// DEBUG STATE (exported for overlay)
// =============================================================================

export const balanceDebugState = {
    enabled: true,
    supportActive: false,
    torsoAngleA: 0,
    torsoAngleB: 0,
    pelvisYA: 0,
    pelvisYB: 0,
};

// =============================================================================
// MODULE STATE
// =============================================================================

let tickTimer = null;
let fighters = [];
let floorY = 580;
let world = null;

// Support constraint storage per fighter
const supportData = new Map();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

// =============================================================================
// SUPPORT CONSTRAINT MANAGEMENT
// =============================================================================

/**
 * Create invisible support constraint for a fighter
 */
function createSupportConstraint(fighter, index) {
    if (!fighter?.ragdoll?.bodies?.pelvis || !world) return null;

    const pelvis = fighter.ragdoll.bodies.pelvis;
    const torso = fighter.ragdoll.bodies.torso;

    // Create an invisible anchor point (we'll update its position each tick)
    // The anchor is just a coordinate, not a body
    const anchorY = pelvis.position.y - BALANCE_CONFIG.support.targetHeightAbovePelvis;

    // Create constraint from torso to the anchor point
    const constraint = Constraint.create({
        bodyA: torso,
        pointA: { x: 0, y: -10 }, // Top of torso
        pointB: { x: pelvis.position.x, y: anchorY }, // Anchor in world space
        stiffness: BALANCE_CONFIG.support.stiffness,
        damping: BALANCE_CONFIG.support.damping,
        length: BALANCE_CONFIG.support.length,
        render: { visible: false },
    });

    Composite.add(world, constraint);

    return {
        constraint,
        fighterId: fighter.id,
    };
}

/**
 * Remove support constraint for a fighter
 */
function removeSupportConstraint(fighterId) {
    const data = supportData.get(fighterId);
    if (data && data.constraint && world) {
        Composite.remove(world, data.constraint);
        supportData.delete(fighterId);
    }
}

/**
 * Update support constraint anchor position (follows fighter)
 */
function updateSupportConstraint(fighter, index) {
    const data = supportData.get(fighter.id);
    if (!data || !data.constraint) return;

    const pelvis = fighter.ragdoll.bodies.pelvis;
    if (!pelvis) return;

    // Update anchor position to follow fighter horizontally
    const anchorY = pelvis.position.y - BALANCE_CONFIG.support.targetHeightAbovePelvis;
    data.constraint.pointB = {
        x: pelvis.position.x,
        y: anchorY,
    };
}

// =============================================================================
// BALANCE LOGIC
// =============================================================================

/**
 * Apply balance assist to a single fighter
 */
function applyBalanceAssist(fighter, index) {
    if (!fighter?.ragdoll?.bodies) return;

    const { torso, pelvis } = fighter.ragdoll.bodies;
    if (!torso || !pelvis) return;

    // Get current torso angle
    const torsoAngle = normalizeAngle(torso.angle);
    const torsoAngleDeg = radToDeg(torsoAngle);

    // Update debug state
    if (index === 0) {
        balanceDebugState.torsoAngleA = torsoAngleDeg;
        balanceDebugState.pelvisYA = pelvis.position.y;
    } else {
        balanceDebugState.torsoAngleB = torsoAngleDeg;
        balanceDebugState.pelvisYB = pelvis.position.y;
    }

    // 1) Angular velocity damping (steer toward 0, PD-ish)
    const targetOmega = 0;
    const currentOmega = torso.angularVelocity;
    const dampedOmega = currentOmega * BALANCE_CONFIG.angularDampFactor;
    Body.setAngularVelocity(torso, dampedOmega);
    Body.setAngularVelocity(pelvis, pelvis.angularVelocity * BALANCE_CONFIG.angularDampFactor);

    // 2) Update support constraint position
    if (BALANCE_CONFIG.support.enabled) {
        updateSupportConstraint(fighter, index);
    }
}

/**
 * Process balance assist for all fighters
 */
function processBalanceAssist() {
    if (!balanceDebugState.enabled) {
        balanceDebugState.supportActive = false;
        return;
    }

    balanceDebugState.supportActive = BALANCE_CONFIG.support.enabled;

    fighters.forEach((fighter, index) => {
        applyBalanceAssist(fighter, index);
    });
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Initialize balance assist system
 */
export function initBalanceAssist(fighterList, arenaFloorY, matterWorld) {
    fighters = fighterList || [];
    floorY = arenaFloorY || 580;
    world = matterWorld || null;

    // Create support constraints for each fighter
    if (world && balanceDebugState.enabled) {
        fighters.forEach((fighter, index) => {
            const data = createSupportConstraint(fighter, index);
            if (data) {
                supportData.set(fighter.id, data);
            }
        });
    }

    console.log('[BalanceAssist] Initialized with support constraints');
}

/**
 * Update fighter references (after respawn)
 */
export function setFighters(fighterList) {
    // Remove old constraints
    fighters.forEach(f => {
        if (f?.id) removeSupportConstraint(f.id);
    });

    fighters = fighterList || [];

    // Create new constraints
    if (world && balanceDebugState.enabled) {
        fighters.forEach((fighter, index) => {
            const data = createSupportConstraint(fighter, index);
            if (data) {
                supportData.set(fighter.id, data);
            }
        });
    }
}

/**
 * Set the Matter.js world reference
 */
export function setWorld(matterWorld) {
    world = matterWorld;
}

/**
 * Start the balance assist tick loop
 */
export function startBalanceAssist() {
    if (tickTimer) return;

    tickTimer = setInterval(processBalanceAssist, BALANCE_CONFIG.tickInterval);
    console.log('[BalanceAssist] Started');
}

/**
 * Stop the balance assist tick loop
 */
export function stopBalanceAssist() {
    if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
        console.log('[BalanceAssist] Stopped');
    }
}

/**
 * Toggle balance assist enabled state
 */
export function toggleBalanceAssist() {
    balanceDebugState.enabled = !balanceDebugState.enabled;

    // Add/remove support constraints based on state
    if (balanceDebugState.enabled && world) {
        fighters.forEach((fighter, index) => {
            if (!supportData.has(fighter.id)) {
                const data = createSupportConstraint(fighter, index);
                if (data) {
                    supportData.set(fighter.id, data);
                }
            }
        });
    } else {
        fighters.forEach(f => {
            if (f?.id) removeSupportConstraint(f.id);
        });
    }

    console.log(`[BalanceAssist] ${balanceDebugState.enabled ? 'Enabled' : 'Disabled'}`);
    return balanceDebugState.enabled;
}

/**
 * Check if balance assist is enabled
 */
export function isBalanceEnabled() {
    return balanceDebugState.enabled;
}

/**
 * Reset balance assist (stop and clear)
 */
export function resetBalanceAssist() {
    stopBalanceAssist();

    // Remove all support constraints
    fighters.forEach(f => {
        if (f?.id) removeSupportConstraint(f.id);
    });
    supportData.clear();

    fighters = [];
    world = null;
    balanceDebugState.torsoAngleA = 0;
    balanceDebugState.torsoAngleB = 0;
    balanceDebugState.pelvisYA = 0;
    balanceDebugState.pelvisYB = 0;
    balanceDebugState.supportActive = false;
}
