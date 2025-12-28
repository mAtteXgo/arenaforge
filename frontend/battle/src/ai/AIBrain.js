/**
 * AIBrain.js — Simple AI Controller
 * 
 * Provides basic APPROACH/IDLE behavior for fighters.
 * Runs on a tick interval, applies forces to move toward opponent.
 */

const { Body } = Matter;

// =============================================================================
// AI CONFIGURATION — Easy to tweak!
// =============================================================================

export const AI_CONFIG = {
    // Tick interval (ms) — faster = more responsive movement
    tickInterval: 30,

    // Distance thresholds
    approachDistance: 150,   // Start approaching when further than this
    idleDistance: 80,        // Stop approaching when closer than this

    // Movement forces
    moveForce: 0.012,        // Force applied when walking

    // Velocity limits
    maxVx: 4,                // Max horizontal velocity (prevents rockets)

    // Damping factors (lower = more braking)
    idleDamping: 0.75,       // X velocity multiplier when IDLE
    disabledDamping: 0.80,   // X velocity multiplier when AI is OFF

    // States
    states: {
        IDLE: 'IDLE',
        APPROACH: 'APPROACH',
    },
};

// =============================================================================
// DEBUG STATE (exported for overlay)
// =============================================================================

export const debugState = {
    vxA: 0,
    vxB: 0,
    forceApplied: 0,
};

// =============================================================================
// AI STATE
// =============================================================================

// AI instances (fighter id -> AI state)
const aiInstances = new Map();

// Global tick timer
let tickTimer = null;
let tickCallback = null;

/**
 * Create an AI controller for a fighter
 * @param {Object} fighter - The fighter entity
 * @param {Object} target - The target fighter entity
 * @returns {Object} AI controller
 */
export function createAI(fighter, target) {
    const ai = {
        fighter,
        target,
        state: AI_CONFIG.states.IDLE,
        enabled: true,
        lastDistance: 0,
    };

    aiInstances.set(fighter.id, ai);
    console.log(`[AI] Created AI for "${fighter.name}"`);

    return ai;
}

/**
 * Remove AI controller
 * @param {string} fighterId 
 */
export function removeAI(fighterId) {
    aiInstances.delete(fighterId);
}

/**
 * Clear all AI controllers
 */
export function clearAllAI() {
    aiInstances.clear();
    console.log('[AI] Cleared all AI controllers');
}

/**
 * Toggle AI enabled state
 * @param {string} fighterId 
 * @returns {boolean} New enabled state
 */
export function toggleAI(fighterId) {
    const ai = aiInstances.get(fighterId);
    if (ai) {
        ai.enabled = !ai.enabled;
        console.log(`[AI] "${ai.fighter.name}" AI ${ai.enabled ? 'enabled' : 'disabled'}`);
        return ai.enabled;
    }
    return false;
}

/**
 * Get AI state for a fighter
 * @param {string} fighterId 
 * @returns {Object|null}
 */
export function getAIState(fighterId) {
    return aiInstances.get(fighterId) || null;
}

/**
 * Get all AI states
 * @returns {Array}
 */
export function getAllAIStates() {
    return Array.from(aiInstances.values());
}

/**
 * Calculate distance between two fighters
 * @param {Object} fighterA 
 * @param {Object} fighterB 
 * @returns {number}
 */
export function getDistance(fighterA, fighterB) {
    if (!fighterA?.ragdoll?.bodies?.torso || !fighterB?.ragdoll?.bodies?.torso) {
        return 0;
    }

    const posA = fighterA.ragdoll.bodies.torso.position;
    const posB = fighterB.ragdoll.bodies.torso.position;

    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;

    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp horizontal velocity only
 * @param {Matter.Body} body 
 * @param {number} maxVx 
 */
function clampHorizontalVelocity(body, maxVx) {
    const vx = body.velocity.x;
    if (Math.abs(vx) > maxVx) {
        Body.setVelocity(body, {
            x: Math.sign(vx) * maxVx,
            y: body.velocity.y,
        });
    }
}

/**
 * Apply damping to horizontal velocity only
 * @param {Matter.Body} body 
 * @param {number} factor 
 */
function dampHorizontalVelocity(body, factor) {
    Body.setVelocity(body, {
        x: body.velocity.x * factor,
        y: body.velocity.y,
    });
}

/**
 * Process one AI tick for a single AI controller
 * @param {Object} ai 
 * @param {number} index - Fighter index (0 or 1)
 */
function processAITick(ai, index) {
    const { fighter, target } = ai;

    // Get bodies
    if (!fighter?.ragdoll?.bodies?.pelvis || !target?.ragdoll?.bodies?.pelvis) {
        return;
    }

    const pelvis = fighter.ragdoll.bodies.pelvis;
    const torso = fighter.ragdoll.bodies.torso;

    // Update debug state
    if (index === 0) {
        debugState.vxA = pelvis.velocity.x;
    } else {
        debugState.vxB = pelvis.velocity.x;
    }

    // If AI is disabled, apply damping and return
    if (!ai.enabled) {
        dampHorizontalVelocity(pelvis, AI_CONFIG.disabledDamping);
        dampHorizontalVelocity(torso, AI_CONFIG.disabledDamping);
        return;
    }

    const myPos = pelvis.position;
    const targetPos = target.ragdoll.bodies.pelvis.position;

    // Calculate distance
    const dx = targetPos.x - myPos.x;
    const dy = targetPos.y - myPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    ai.lastDistance = distance;

    // Determine state with hysteresis
    if (distance > AI_CONFIG.approachDistance) {
        ai.state = AI_CONFIG.states.APPROACH;
    } else if (distance < AI_CONFIG.idleDistance) {
        ai.state = AI_CONFIG.states.IDLE;
    }
    // Keep current state if in between (hysteresis)

    // Apply movement force if approaching
    if (ai.state === AI_CONFIG.states.APPROACH) {
        const direction = dx > 0 ? 1 : -1;
        const force = AI_CONFIG.moveForce * direction;

        // Apply to pelvis for stable walking
        Body.applyForce(
            pelvis,
            pelvis.position,
            { x: force, y: 0 }
        );

        // Also apply to torso for faster response
        Body.applyForce(
            torso,
            torso.position,
            { x: force * 0.5, y: 0 }
        );

        debugState.forceApplied = force;
    } else if (ai.state === AI_CONFIG.states.IDLE) {
        // Apply braking when IDLE to stop drift
        dampHorizontalVelocity(pelvis, AI_CONFIG.idleDamping);
        dampHorizontalVelocity(torso, AI_CONFIG.idleDamping);
        debugState.forceApplied = 0;
    }

    // Clamp horizontal velocity
    clampHorizontalVelocity(pelvis, AI_CONFIG.maxVx);
    clampHorizontalVelocity(torso, AI_CONFIG.maxVx);
}

/**
 * Process all AI ticks
 */
function processAllAI() {
    let index = 0;
    aiInstances.forEach(ai => {
        processAITick(ai, index);
        index++;
    });

    // Call the tick callback if set (for debug updates)
    if (tickCallback) {
        tickCallback();
    }
}

/**
 * Start the AI tick loop
 * @param {Function} onTick - Optional callback after each tick
 */
export function startAI(onTick = null) {
    if (tickTimer) return;

    tickCallback = onTick;
    tickTimer = setInterval(processAllAI, AI_CONFIG.tickInterval);
    console.log('[AI] AI tick loop started');
}

/**
 * Stop the AI tick loop
 */
export function stopAI() {
    if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
        tickCallback = null;
        console.log('[AI] AI tick loop stopped');
    }
}

/**
 * Reset AI (stop and clear)
 */
export function resetAI() {
    stopAI();
    clearAllAI();
}
