/**
 * index.js — Battle Sandbox Entry Point
 * 
 * Initializes the physics world, renderer, and controls.
 * Spawns two fighters with AI-vs-AI movement.
 */

import { createWorld, resetWorld, getEngine, getWorld, getArenaConfig } from './engine/World.js';
import * as Simulator from './engine/Simulator.js';
import * as Renderer from './render/Renderer.js';
import * as Controls from './ui/Controls.js';
import { createFighter, removeFighter } from './entities/Fighter.js';
import { createAI, resetAI, startAI, stopAI, toggleAI, getAIState, getDistance } from './ai/AIBrain.js';
import {
    initImpactTracker,
    setEngine as setImpactEngine,
    updateImpacts,
    getFloatingNumbers,
    getImpactCount,
    toggleImpactDisplay,
    isShowingImpacts
} from './engine/ImpactTracker.js';

// Placeholder seed (will be real RNG seed later)
let currentSeed = Math.floor(Math.random() * 1000000);

// Fighter instances
let fighterA = null;
let fighterB = null;

/**
 * Get spawn positions for two fighters
 */
function getSpawnPositions() {
    const arena = getArenaConfig();
    const spawnY = arena.height / 2 - 50; // Above center so they fall

    return {
        a: { x: arena.width * 0.3, y: spawnY },  // 30% from left
        b: { x: arena.width * 0.7, y: spawnY },  // 70% from left
    };
}

/**
 * Spawn both fighters in the arena
 */
function spawnFighters() {
    const world = getWorld();
    const spawn = getSpawnPositions();

    // Remove existing fighters
    if (fighterA) removeFighter(world, fighterA);
    if (fighterB) removeFighter(world, fighterB);

    // Clear AI
    resetAI();

    // Create fighters with UNIQUE collision groups
    // Negative groups: parts within same group don't collide with each other
    // Different negative groups: parts DO collide with each other
    fighterA = createFighter(world, spawn.a.x, spawn.a.y, {
        id: 'fighter_a',
        name: 'Fighter A',
        ragdollConfig: { collisionGroup: -1 },
    });

    fighterB = createFighter(world, spawn.b.x, spawn.b.y, {
        id: 'fighter_b',
        name: 'Fighter B',
        ragdollConfig: { collisionGroup: -2 },
    });

    // Create AI controllers (each targets the other)
    createAI(fighterA, fighterB);
    createAI(fighterB, fighterA);

    // Update renderer with fighter list
    Renderer.setFighters([fighterA, fighterB]);

    // Start AI tick loop with debug update callback
    startAI(updateAIDebug);

    console.log('[Spawn] Both fighters spawned');
}

/**
 * Respawn fighters at center (T key)
 */
function handleRespawn() {
    spawnFighters();
    console.log('[Respawn] Fighters respawned');
}

/**
 * Update AI debug overlay
 */
function updateAIDebug() {
    const distEl = document.getElementById('distance-display');
    const stateAEl = document.getElementById('fighter-a-state');
    const stateBEl = document.getElementById('fighter-b-state');

    // Get distance
    const distance = fighterA && fighterB ? getDistance(fighterA, fighterB) : 0;

    // Get AI states
    const aiA = getAIState('fighter_a');
    const aiB = getAIState('fighter_b');

    if (distEl) {
        distEl.textContent = `Dist: ${Math.round(distance)}px`;
    }

    if (stateAEl && aiA) {
        const enabledText = aiA.enabled ? '' : ' [OFF]';
        stateAEl.textContent = `A: ${aiA.state}${enabledText}`;
    }

    if (stateBEl && aiB) {
        const enabledText = aiB.enabled ? '' : ' [OFF]';
        stateBEl.textContent = `B: ${aiB.state}${enabledText}`;
    }
}

/**
 * Update impact debug overlay
 */
function updateImpactDebug() {
    const counterEl = document.getElementById('impact-counter');
    const toggleEl = document.getElementById('impact-toggle');

    if (counterEl) {
        counterEl.textContent = `Impacts (5s): ${getImpactCount()}`;
    }

    if (toggleEl) {
        const showing = isShowingImpacts();
        toggleEl.textContent = `Impacts: ${showing ? 'ON' : 'OFF'}`;
        toggleEl.className = showing ? '' : 'off';
    }
}

/**
 * Initialize the battle sandbox
 */
function init() {
    console.log('========================================');
    console.log('  ArenaForge — Battle Sandbox v0.4');
    console.log('========================================');

    // Get canvas element
    const canvas = document.getElementById('battle-canvas');
    if (!canvas) {
        console.error('[Init] Canvas element not found!');
        return;
    }

    // Create physics world
    const { engine } = createWorld();

    // Initialize impact tracker
    initImpactTracker(engine);

    // Initialize renderer
    Renderer.init(canvas);
    Renderer.setSeed(currentSeed);
    Renderer.setFloatingNumbersGetter(getFloatingNumbers);

    // Spawn fighters
    spawnFighters();

    // Initialize simulator with callbacks
    Simulator.init(
        engine,
        // Render callback (called each frame)
        (engine, debugInfo) => {
            // Update floating numbers
            updateImpacts(16.67); // ~60fps delta

            // Update impact debug
            updateImpactDebug();

            // Render
            Renderer.render(engine, debugInfo);
        },
        // Reset callback
        () => {
            handleReset();
        }
    );

    // Initialize UI controls
    Controls.init();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT') return;

        switch (event.code) {
            case 'KeyT':
                event.preventDefault();
                handleRespawn();
                break;
            case 'Digit1':
                event.preventDefault();
                toggleAI('fighter_a');
                updateAIDebug();
                break;
            case 'Digit2':
                event.preventDefault();
                toggleAI('fighter_b');
                updateAIDebug();
                break;
            case 'KeyH':
                event.preventDefault();
                toggleImpactDisplay();
                updateImpactDebug();
                break;
        }
    });

    // Initial render (before simulation starts)
    Renderer.render(engine, {
        fps: 0,
        tickCount: 0,
        isPaused: false,
        isRunning: false,
    });

    // Initial debug updates
    updateAIDebug();
    updateImpactDebug();

    console.log('[Init] Battle sandbox initialized');
    console.log(`[Init] Seed: ${currentSeed}`);
    console.log('[Init] Press Start or Space to begin');
    console.log('[Init] Press T to respawn fighters');
    console.log('[Init] Press 1/2 to toggle AI');
    console.log('[Init] Press H to toggle impact numbers');
}

/**
 * Handle simulation reset
 */
function handleReset() {
    // Stop AI
    stopAI();

    // Recreate world
    const { engine } = resetWorld();

    // Update simulator with new engine
    Simulator.setEngine(engine);

    // Update impact tracker with new engine
    setImpactEngine(engine);

    // Generate new seed
    currentSeed = Math.floor(Math.random() * 1000000);
    Renderer.setSeed(currentSeed);

    // Respawn fighters
    spawnFighters();

    // Render initial state
    Renderer.render(engine, {
        fps: 0,
        tickCount: 0,
        isPaused: false,
        isRunning: false,
    });

    // Update controls UI
    Controls.updateUI();
    updateImpactDebug();

    console.log(`[Reset] New seed: ${currentSeed}`);
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
