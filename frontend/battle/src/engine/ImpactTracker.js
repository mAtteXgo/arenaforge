/**
 * ImpactTracker.js — Collision Impact Detection
 * 
 * Listens to Matter.js collision events and calculates impact scores.
 * Triggers floating numbers for significant impacts.
 */

const { Events } = Matter;

// =============================================================================
// IMPACT CONFIGURATION — Easy to tweak!
// =============================================================================

export const IMPACT_CONFIG = {
    // Minimum impact to register (prevents spam from gentle touches)
    minImpact: 50,

    // Impact intensity thresholds for coloring
    thresholds: {
        small: 100,    // grey
        medium: 200,   // yellow
        large: 400,    // red
    },

    // Max floating numbers on screen at once
    maxFloatingNumbers: 20,

    // How long floating numbers last (ms)
    floatDuration: 1500,

    // Counter window (how long to track impacts, ms)
    counterWindow: 5000,

    // Ignore collisions with static bodies (walls, floor)
    ignoreStatic: true,

    // Bodies to ignore (labels)
    ignoreLabels: ['floor', 'ceiling', 'leftWall', 'rightWall'],
};

// =============================================================================
// MODULE STATE
// =============================================================================

// Floating number particles
let floatingNumbers = [];

// Impact history for counter
let impactHistory = [];

// Display toggle
let showImpacts = true;

// Engine reference
let engine = null;

// =============================================================================
// FLOATING NUMBER CLASS
// =============================================================================

class FloatingNumber {
    constructor(x, y, value, color) {
        this.x = x;
        this.y = y;
        this.value = Math.round(value);
        this.color = color;
        this.createdAt = performance.now();
        this.opacity = 1.0;
        this.vy = -1.5; // Float upward
    }

    update(dt) {
        this.y += this.vy;
        const age = performance.now() - this.createdAt;
        const progress = age / IMPACT_CONFIG.floatDuration;
        this.opacity = 1 - progress;
    }

    isExpired() {
        return performance.now() - this.createdAt > IMPACT_CONFIG.floatDuration;
    }
}

// =============================================================================
// IMPACT CALCULATION
// =============================================================================

/**
 * Calculate impact score from collision pair
 * @param {Object} pair - Matter.js collision pair
 * @returns {number} Impact score
 */
function calculateImpact(pair) {
    const { bodyA, bodyB, collision } = pair;

    // Get relative velocity
    const velA = bodyA.velocity;
    const velB = bodyB.velocity;
    const relVelX = velA.x - velB.x;
    const relVelY = velA.y - velB.y;
    const relSpeed = Math.sqrt(relVelX * relVelX + relVelY * relVelY);

    // Get combined mass
    const massA = bodyA.mass || 1;
    const massB = bodyB.mass || 1;
    const combinedMass = massA + massB;

    // Impact = relative speed × combined mass
    const impact = relSpeed * combinedMass * 10; // Scale factor for readability

    return impact;
}

/**
 * Get color based on impact intensity
 * @param {number} impact 
 * @returns {string} Color hex
 */
function getImpactColor(impact) {
    const { thresholds } = IMPACT_CONFIG;

    if (impact >= thresholds.large) {
        return '#ef4444'; // Red
    } else if (impact >= thresholds.medium) {
        return '#fbbf24'; // Yellow
    } else if (impact >= thresholds.small) {
        return '#9ca3af'; // Grey
    }
    return '#6b7280'; // Light grey for small impacts
}

/**
 * Get collision midpoint
 * @param {Object} pair 
 * @returns {Object} { x, y }
 */
function getCollisionPoint(pair) {
    const { bodyA, bodyB } = pair;
    return {
        x: (bodyA.position.x + bodyB.position.x) / 2,
        y: (bodyA.position.y + bodyB.position.y) / 2,
    };
}

/**
 * Check if collision should be ignored
 * @param {Object} pair 
 * @returns {boolean}
 */
function shouldIgnore(pair) {
    const { bodyA, bodyB } = pair;

    // Ignore static bodies
    if (IMPACT_CONFIG.ignoreStatic) {
        if (bodyA.isStatic || bodyB.isStatic) return true;
    }

    // Ignore specific labels
    if (IMPACT_CONFIG.ignoreLabels.includes(bodyA.label)) return true;
    if (IMPACT_CONFIG.ignoreLabels.includes(bodyB.label)) return true;

    return false;
}

// =============================================================================
// COLLISION HANDLER
// =============================================================================

/**
 * Handle collision start event
 * @param {Object} event 
 */
function onCollisionStart(event) {
    if (!showImpacts) return;

    event.pairs.forEach(pair => {
        // Skip ignored collisions
        if (shouldIgnore(pair)) return;

        // Calculate impact
        const impact = calculateImpact(pair);

        // Skip if below threshold
        if (impact < IMPACT_CONFIG.minImpact) return;

        // Get collision point
        const point = getCollisionPoint(pair);

        // Get color
        const color = getImpactColor(impact);

        // Create floating number (cap at max)
        if (floatingNumbers.length < IMPACT_CONFIG.maxFloatingNumbers) {
            floatingNumbers.push(new FloatingNumber(point.x, point.y, impact, color));
        }

        // Add to history
        impactHistory.push({
            time: performance.now(),
            impact,
        });

        // Clean old history
        const now = performance.now();
        impactHistory = impactHistory.filter(h => now - h.time < IMPACT_CONFIG.counterWindow);
    });
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Initialize impact tracker with engine
 * @param {Matter.Engine} matterEngine 
 */
export function initImpactTracker(matterEngine) {
    engine = matterEngine;

    // Clear state
    floatingNumbers = [];
    impactHistory = [];

    // Listen to collision events
    Events.on(engine, 'collisionStart', onCollisionStart);

    console.log('[ImpactTracker] Initialized');
}

/**
 * Clean up impact tracker
 */
export function destroyImpactTracker() {
    if (engine) {
        Events.off(engine, 'collisionStart', onCollisionStart);
        engine = null;
    }
    floatingNumbers = [];
    impactHistory = [];
}

/**
 * Update floating numbers (call each frame)
 * @param {number} dt - Delta time in ms
 */
export function updateImpacts(dt) {
    // Update all floating numbers
    floatingNumbers.forEach(fn => fn.update(dt));

    // Remove expired
    floatingNumbers = floatingNumbers.filter(fn => !fn.isExpired());
}

/**
 * Get floating numbers for rendering
 * @returns {Array}
 */
export function getFloatingNumbers() {
    return floatingNumbers;
}

/**
 * Get impact count in last N seconds
 * @returns {number}
 */
export function getImpactCount() {
    const now = performance.now();
    return impactHistory.filter(h => now - h.time < IMPACT_CONFIG.counterWindow).length;
}

/**
 * Toggle impact display
 * @returns {boolean} New state
 */
export function toggleImpactDisplay() {
    showImpacts = !showImpacts;
    console.log(`[ImpactTracker] Display ${showImpacts ? 'enabled' : 'disabled'}`);
    return showImpacts;
}

/**
 * Check if impacts are being shown
 * @returns {boolean}
 */
export function isShowingImpacts() {
    return showImpacts;
}

/**
 * Set engine reference (for reset)
 * @param {Matter.Engine} matterEngine 
 */
export function setEngine(matterEngine) {
    // Remove old listener
    if (engine) {
        Events.off(engine, 'collisionStart', onCollisionStart);
    }

    engine = matterEngine;

    // Add new listener
    Events.on(engine, 'collisionStart', onCollisionStart);

    // Clear state
    floatingNumbers = [];
    impactHistory = [];
}
