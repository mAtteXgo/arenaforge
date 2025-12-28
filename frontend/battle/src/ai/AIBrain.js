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
    // Tick interval (ms) — faster = more responsive
    tickInterval: 50,

    // Distance thresholds
    approachDistance: 150,   // Start approaching when further than this
    idleDistance: 80,        // Stop approaching when closer than this

    // Movement
    moveForce: 0.008,        // Force applied when walking (increased for faster approach)
    maxVelocity: 5,          // Clamp velocity to prevent rockets
    brakingFactor: 0.85,     // Multiply velocity by this when IDLE (< 1 = braking)

    // States
    states: {
        IDLE: 'IDLE',
        APPROACH: 'APPROACH',
    },
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
 * Clamp a body's velocity
 * @param {Matter.Body} body 
 * @param {number} maxVel 
 */
function clampVelocity(body, maxVel) {
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > maxVel) {
        const scale = maxVel / speed;
        Body.setVelocity(body, {
            x: vx * scale,
            y: vy * scale,
        });
    }
}

/**
 * Process one AI tick for a single AI controller
 * @param {Object} ai 
 */
function processAITick(ai) {
    if (!ai.enabled) return;

    const { fighter, target } = ai;

    // Get positions
    if (!fighter?.ragdoll?.bodies?.pelvis || !target?.ragdoll?.bodies?.pelvis) {
        return;
    }

    const myPos = fighter.ragdoll.bodies.pelvis.position;
    const targetPos = target.ragdoll.bodies.pelvis.position;

    // Calculate distance
    const dx = targetPos.x - myPos.x;
    const dy = targetPos.y - myPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    ai.lastDistance = distance;

    // Determine state
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
            fighter.ragdoll.bodies.pelvis,
            fighter.ragdoll.bodies.pelvis.position,
            { x: force, y: 0 }
        );
    } else if (ai.state === AI_CONFIG.states.IDLE) {
        // Apply braking when IDLE to stop drift
        const pelvis = fighter.ragdoll.bodies.pelvis;
        const torso = fighter.ragdoll.bodies.torso;

        Body.setVelocity(pelvis, {
            x: pelvis.velocity.x * AI_CONFIG.brakingFactor,
            y: pelvis.velocity.y,
        });
        Body.setVelocity(torso, {
            x: torso.velocity.x * AI_CONFIG.brakingFactor,
            y: torso.velocity.y,
        });
    }

    // Clamp velocity on pelvis and torso
    clampVelocity(fighter.ragdoll.bodies.pelvis, AI_CONFIG.maxVelocity);
    clampVelocity(fighter.ragdoll.bodies.torso, AI_CONFIG.maxVelocity);
}

/**
 * Process all AI ticks
 */
function processAllAI() {
    aiInstances.forEach(ai => {
        processAITick(ai);
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
