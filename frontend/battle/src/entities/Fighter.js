/**
 * Fighter.js — Fighter Entity Wrapper
 * 
 * Wraps a ragdoll with game-related properties.
 * Manages spawning, respawning, and provides access to the ragdoll.
 */

import { createRagdoll, removeRagdoll, getJointPositions } from '../physics/Ragdoll.js';

const { Composite } = Matter;

/**
 * Create a new fighter
 * @param {Matter.World} world - The physics world
 * @param {number} x - Spawn X position
 * @param {number} y - Spawn Y position
 * @param {Object} options - Fighter options
 * @returns {Object} Fighter instance
 */
export function createFighter(world, x, y, options = {}) {
    const id = options.id || `fighter_${Date.now()}`;
    const name = options.name || 'Fighter';

    // Create the ragdoll
    const ragdoll = createRagdoll(x, y, options.ragdollConfig);

    // Add to world
    Composite.add(world, ragdoll.composite);

    const fighter = {
        id,
        name,
        ragdoll,
        spawnPoint: { x, y },

        // Future: stats, weapon, armor, etc.
    };

    console.log(`[Fighter] Created "${name}" at (${x}, ${y})`);

    return fighter;
}

/**
 * Remove fighter from world
 * @param {Matter.World} world 
 * @param {Object} fighter 
 */
export function removeFighter(world, fighter) {
    if (fighter && fighter.ragdoll) {
        removeRagdoll(world, fighter.ragdoll);
        console.log(`[Fighter] Removed "${fighter.name}"`);
    }
}

/**
 * Respawn fighter at a position
 * @param {Matter.World} world 
 * @param {Object} fighter 
 * @param {number} x 
 * @param {number} y 
 * @returns {Object} New fighter instance
 */
export function respawnFighter(world, fighter, x, y) {
    // Remove old ragdoll
    removeFighter(world, fighter);

    // Create new fighter at position
    const newFighter = createFighter(world, x, y, {
        id: fighter.id,
        name: fighter.name,
    });

    console.log(`[Fighter] Respawned "${fighter.name}" at (${x}, ${y})`);

    return newFighter;
}

/**
 * Get joint positions for rendering
 * @param {Object} fighter 
 * @returns {Object} Joint positions
 */
export function getFighterJoints(fighter) {
    if (!fighter || !fighter.ragdoll) return null;
    return getJointPositions(fighter.ragdoll);
}

/**
 * Get the torso position (center of fighter)
 * @param {Object} fighter 
 * @returns {Object} { x, y }
 */
export function getFighterPosition(fighter) {
    if (!fighter || !fighter.ragdoll) return null;
    return fighter.ragdoll.bodies.torso.position;
}
