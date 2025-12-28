/**
 * Simulator.js — Fixed Timestep Physics Loop
 * 
 * Manages the simulation loop with fixed timestep for determinism.
 * Provides pause/resume/step/reset controls.
 */

const { Engine } = Matter;

// Simulation configuration
const SIM_CONFIG = {
    fixedDelta: 1000 / 60,  // ~16.67ms per tick (60 FPS physics)
    maxSubSteps: 5,         // Prevent spiral of death
};

// Module state
let engine = null;
let isRunning = false;
let isPaused = false;
let accumulator = 0;
let lastTime = 0;
let frameCount = 0;
let fps = 0;
let fpsLastTime = 0;
let tickCount = 0;

// Callbacks
let onRender = null;
let onReset = null;

/**
 * Initialize the simulator with an engine and callbacks
 * @param {Matter.Engine} matterEngine - The physics engine
 * @param {Function} renderCallback - Called each frame with (engine, debugInfo)
 * @param {Function} resetCallback - Called when reset is triggered
 */
export function init(matterEngine, renderCallback, resetCallback) {
    engine = matterEngine;
    onRender = renderCallback;
    onReset = resetCallback;

    accumulator = 0;
    lastTime = 0;
    tickCount = 0;
    frameCount = 0;
    fps = 0;
    fpsLastTime = performance.now();

    console.log('[Simulator] Initialized');
}

/**
 * Update the engine reference (after reset)
 * @param {Matter.Engine} matterEngine 
 */
export function setEngine(matterEngine) {
    engine = matterEngine;
}

/**
 * Main simulation loop (called via requestAnimationFrame)
 */
function loop(currentTime) {
    if (!isRunning) return;

    // Calculate delta time
    if (lastTime === 0) {
        lastTime = currentTime;
    }

    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Cap delta to prevent spiral of death
    if (deltaTime > SIM_CONFIG.fixedDelta * SIM_CONFIG.maxSubSteps) {
        deltaTime = SIM_CONFIG.fixedDelta * SIM_CONFIG.maxSubSteps;
    }

    // Update FPS counter
    frameCount++;
    if (currentTime - fpsLastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsLastTime = currentTime;
    }

    // Fixed timestep accumulator
    if (!isPaused) {
        accumulator += deltaTime;

        // Step physics with fixed delta
        while (accumulator >= SIM_CONFIG.fixedDelta) {
            Engine.update(engine, SIM_CONFIG.fixedDelta);
            accumulator -= SIM_CONFIG.fixedDelta;
            tickCount++;
        }
    }

    // Render (always, even when paused)
    if (onRender) {
        const debugInfo = {
            fps,
            tickCount,
            isPaused,
            isRunning,
        };
        onRender(engine, debugInfo);
    }

    // Continue loop
    requestAnimationFrame(loop);
}

/**
 * Start the simulation
 */
export function start() {
    if (isRunning) return;

    isRunning = true;
    isPaused = false;
    lastTime = 0;
    accumulator = 0;

    console.log('[Simulator] Started');

    requestAnimationFrame(loop);
}

/**
 * Pause the simulation (freezes physics, continues rendering)
 */
export function pause() {
    if (!isRunning) return;

    isPaused = true;
    console.log('[Simulator] Paused');
}

/**
 * Resume the simulation from paused state
 */
export function resume() {
    if (!isRunning) return;

    isPaused = false;
    lastTime = performance.now(); // Reset time to avoid jump
    console.log('[Simulator] Resumed');
}

/**
 * Toggle pause/resume
 * @returns {boolean} New paused state
 */
export function togglePause() {
    if (isPaused) {
        resume();
    } else {
        pause();
    }
    return isPaused;
}

/**
 * Step exactly one physics frame (while paused)
 */
export function step() {
    if (!engine) return;

    // Force pause if not already
    if (!isPaused) {
        pause();
    }

    // Single physics step
    Engine.update(engine, SIM_CONFIG.fixedDelta);
    tickCount++;

    console.log(`[Simulator] Stepped to tick ${tickCount}`);

    // Trigger render
    if (onRender) {
        const debugInfo = {
            fps,
            tickCount,
            isPaused: true,
            isRunning,
        };
        onRender(engine, debugInfo);
    }
}

/**
 * Reset the simulation (triggers reset callback)
 */
export function reset() {
    isRunning = false;
    isPaused = false;
    accumulator = 0;
    lastTime = 0;
    tickCount = 0;

    console.log('[Simulator] Reset');

    if (onReset) {
        onReset();
    }
}

/**
 * Check if simulation is running
 * @returns {boolean}
 */
export function getIsRunning() {
    return isRunning;
}

/**
 * Check if simulation is paused
 * @returns {boolean}
 */
export function getIsPaused() {
    return isPaused;
}

/**
 * Get current FPS
 * @returns {number}
 */
export function getFPS() {
    return fps;
}

/**
 * Get current tick count
 * @returns {number}
 */
export function getTickCount() {
    return tickCount;
}
