/**
 * World.js — Matter.js Engine + World Setup
 * 
 * Creates the physics world with arena bounds (floor, walls, ceiling).
 * Provides functions to create, reset, and access the engine/world.
 */

// Get Matter.js from global (loaded via CDN)
const { Engine, World, Bodies, Body, Composite } = Matter;

// Arena configuration
const ARENA = {
  width: 900,
  height: 600,
  wallThickness: 20,
  floorY: 580,      // Floor position from top
  ceilingY: 20,     // Ceiling position from top
};

// Physics configuration
const PHYSICS = {
  gravity: { x: 0, y: 1.0 },
  timing: {
    timeScale: 1.0,
  }
};

// Module state
let engine = null;
let world = null;
let bounds = null;

/**
 * Create arena boundary walls (static bodies)
 */
function createArenaBounds() {
  const { width, height, wallThickness } = ARENA;
  
  // Floor
  const floor = Bodies.rectangle(
    width / 2, 
    height - wallThickness / 2, 
    width + wallThickness * 2, 
    wallThickness, 
    { 
      isStatic: true, 
      label: 'floor',
      render: { fillStyle: '#3d5a80' }
    }
  );
  
  // Ceiling
  const ceiling = Bodies.rectangle(
    width / 2, 
    wallThickness / 2, 
    width + wallThickness * 2, 
    wallThickness, 
    { 
      isStatic: true, 
      label: 'ceiling',
      render: { fillStyle: '#3d5a80' }
    }
  );
  
  // Left wall
  const leftWall = Bodies.rectangle(
    wallThickness / 2, 
    height / 2, 
    wallThickness, 
    height, 
    { 
      isStatic: true, 
      label: 'leftWall',
      render: { fillStyle: '#3d5a80' }
    }
  );
  
  // Right wall
  const rightWall = Bodies.rectangle(
    width - wallThickness / 2, 
    height / 2, 
    wallThickness, 
    height, 
    { 
      isStatic: true, 
      label: 'rightWall',
      render: { fillStyle: '#3d5a80' }
    }
  );
  
  return { floor, ceiling, leftWall, rightWall };
}

/**
 * Create a new physics world with arena bounds
 * @returns {Object} { engine, world, bounds }
 */
export function createWorld() {
  // Create engine
  engine = Engine.create({
    gravity: PHYSICS.gravity,
  });
  
  world = engine.world;
  
  // Create and add arena bounds
  bounds = createArenaBounds();
  Composite.add(world, [
    bounds.floor,
    bounds.ceiling,
    bounds.leftWall,
    bounds.rightWall
  ]);
  
  console.log('[World] Created physics world with arena bounds');
  
  return { engine, world, bounds };
}

/**
 * Reset the world to initial state
 * @returns {Object} { engine, world, bounds }
 */
export function resetWorld() {
  // Clear existing world
  if (world) {
    Composite.clear(world, false);
  }
  
  // Recreate engine
  if (engine) {
    Engine.clear(engine);
  }
  
  console.log('[World] Reset physics world');
  
  return createWorld();
}

/**
 * Get the current Matter.js engine
 */
export function getEngine() {
  return engine;
}

/**
 * Get the current Matter.js world
 */
export function getWorld() {
  return world;
}

/**
 * Get the arena bounds bodies
 */
export function getBounds() {
  return bounds;
}

/**
 * Get arena configuration
 */
export function getArenaConfig() {
  return { ...ARENA };
}

/**
 * Update gravity (for debugging/tuning)
 * @param {number} x - Horizontal gravity
 * @param {number} y - Vertical gravity
 */
export function setGravity(x, y) {
  if (engine) {
    engine.gravity.x = x;
    engine.gravity.y = y;
    console.log(`[World] Gravity set to (${x}, ${y})`);
  }
}
