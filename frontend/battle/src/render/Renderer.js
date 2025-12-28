/**
 * Renderer.js — Canvas Rendering
 * 
 * Draws the arena bounds and debug overlays.
 * Uses simple canvas 2D drawing (no Matter.Render).
 */

import { getArenaConfig } from '../engine/World.js';

// Render configuration
const COLORS = {
    background: '#0d0d1a',
    arena: '#1a1a2e',
    walls: '#3d5a80',
    wallStroke: '#5c7a99',
    debugText: '#eee',
    // Stick figure colors
    stickBody: '#e0e0e0',
    stickHead: '#ffffff',
    stickOutline: '#333333',
    // Fighter-specific colors
    fighterA: { body: '#60a5fa', head: '#93c5fd', outline: '#1e40af' }, // Blue
    fighterB: { body: '#f87171', head: '#fca5a5', outline: '#991b1b' }, // Red
};

// Module state
let canvas = null;
let ctx = null;
let arenaConfig = null;

// Placeholder seed (will be real later)
let currentSeed = '------';

// Fighters to render
let fighters = [];

// Floating impact numbers (set externally)
let floatingNumbersGetter = null;

/**
 * Initialize the renderer
 * @param {HTMLCanvasElement} canvasElement 
 */
export function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    arenaConfig = getArenaConfig();

    // Set canvas size to match arena
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    console.log('[Renderer] Initialized');
}

/**
 * Resize canvas to fit container
 */
function resizeCanvas() {
    // Get available space (viewport minus panel)
    const panelWidth = 250;
    const availableWidth = window.innerWidth - panelWidth;
    const availableHeight = window.innerHeight;

    // Calculate scale to fit arena while maintaining aspect ratio
    const arenaAspect = arenaConfig.width / arenaConfig.height;
    const containerAspect = availableWidth / availableHeight;

    let scale;
    if (containerAspect > arenaAspect) {
        // Container is wider than arena
        scale = availableHeight / arenaConfig.height;
    } else {
        // Container is taller than arena
        scale = availableWidth / arenaConfig.width;
    }

    // Set canvas size (use arena dimensions for drawing, CSS for display)
    canvas.width = arenaConfig.width;
    canvas.height = arenaConfig.height;

    // Scale canvas via CSS for display fit
    canvas.style.width = `${arenaConfig.width * scale}px`;
    canvas.style.height = `${arenaConfig.height * scale}px`;

    // Center canvas
    canvas.style.position = 'fixed';
    canvas.style.left = `${(availableWidth - arenaConfig.width * scale) / 2}px`;
    canvas.style.top = `${(availableHeight - arenaConfig.height * scale) / 2}px`;
}

/**
 * Set the current seed for display
 * @param {string|number} seed 
 */
export function setSeed(seed) {
    currentSeed = String(seed);
}

/**
 * Clear the canvas
 */
function clear() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw arena floor and walls
 * @param {Object} bounds - The arena bound bodies
 */
function drawArenaBounds(bounds) {
    if (!bounds) return;

    const bodies = [bounds.floor, bounds.ceiling, bounds.leftWall, bounds.rightWall];

    ctx.fillStyle = COLORS.walls;
    ctx.strokeStyle = COLORS.wallStroke;
    ctx.lineWidth = 2;

    bodies.forEach(body => {
        const vertices = body.vertices;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}

/**
 * Draw arena background (inside the walls)
 */
function drawArenaBackground() {
    const { wallThickness, width, height } = arenaConfig;

    ctx.fillStyle = COLORS.arena;
    ctx.fillRect(
        wallThickness,
        wallThickness,
        width - wallThickness * 2,
        height - wallThickness * 2
    );
}

/**
 * Update debug overlay elements
 * @param {Object} debugInfo 
 */
function updateDebugOverlay(debugInfo) {
    const fpsEl = document.getElementById('fps-display');
    const seedEl = document.getElementById('seed-display');

    if (fpsEl) {
        fpsEl.textContent = `FPS: ${debugInfo.fps}`;
    }
    if (seedEl) {
        seedEl.textContent = `Seed: ${currentSeed}`;
    }
}

/**
 * Main render function — called each frame
 * @param {Matter.Engine} engine 
 * @param {Object} debugInfo - { fps, tickCount, isPaused, isRunning }
 */
export function render(engine, debugInfo) {
    if (!ctx) return;

    // Clear canvas
    clear();

    // Draw arena background
    drawArenaBackground();

    // Draw arena bounds
    const bounds = {
        floor: engine.world.bodies.find(b => b.label === 'floor'),
        ceiling: engine.world.bodies.find(b => b.label === 'ceiling'),
        leftWall: engine.world.bodies.find(b => b.label === 'leftWall'),
        rightWall: engine.world.bodies.find(b => b.label === 'rightWall'),
    };
    drawArenaBounds(bounds);

    // Draw fighters as stick figures
    fighters.forEach((fighter, index) => {
        if (fighter && fighter.ragdoll) {
            const colorScheme = index === 0 ? COLORS.fighterA : COLORS.fighterB;
            drawStickFigure(fighter.ragdoll, colorScheme);
        }
    });

    // Draw floating impact numbers
    if (floatingNumbersGetter) {
        const numbers = floatingNumbersGetter();
        drawFloatingNumbers(numbers);
    }

    // Update debug overlay (FPS, seed)
    updateDebugOverlay(debugInfo);
}

/**
 * Draw floating impact numbers
 * @param {Array} numbers - Array of floating number objects
 */
function drawFloatingNumbers(numbers) {
    if (!numbers || numbers.length === 0) return;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';

    numbers.forEach(num => {
        // Set color with opacity
        ctx.globalAlpha = num.opacity;

        // Draw shadow
        ctx.fillStyle = '#000';
        ctx.fillText(num.value, num.x + 1, num.y + 1);

        // Draw number
        ctx.fillStyle = num.color;
        ctx.fillText(num.value, num.x, num.y);
    });

    // Reset alpha
    ctx.globalAlpha = 1.0;
}

/**
 * Draw a stick figure from ragdoll bodies
 * @param {Object} ragdoll 
 * @param {Object} colorScheme - Optional color scheme { body, head, outline }
 */
function drawStickFigure(ragdoll, colorScheme = null) {
    const { bodies } = ragdoll;

    // Use provided colors or defaults
    const bodyColor = colorScheme?.body || COLORS.stickBody;
    const headColor = colorScheme?.head || COLORS.stickHead;
    const outlineColor = colorScheme?.outline || COLORS.stickOutline;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Helper to draw a line between two points
    const drawLine = (p1, p2, width = 4, color = bodyColor) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    };

    // Get body positions
    const head = bodies.head.position;
    const torso = bodies.torso.position;
    const pelvis = bodies.pelvis.position;

    const leftUpperArm = bodies.leftUpperArm.position;
    const leftLowerArm = bodies.leftLowerArm.position;
    const leftHand = bodies.leftHand.position;

    const rightUpperArm = bodies.rightUpperArm.position;
    const rightLowerArm = bodies.rightLowerArm.position;
    const rightHand = bodies.rightHand.position;

    const leftUpperLeg = bodies.leftUpperLeg.position;
    const leftLowerLeg = bodies.leftLowerLeg.position;
    const leftFoot = bodies.leftFoot.position;

    const rightUpperLeg = bodies.rightUpperLeg.position;
    const rightLowerLeg = bodies.rightLowerLeg.position;
    const rightFoot = bodies.rightFoot.position;

    // Calculate neck position (top of torso)
    const neckY = bodies.torso.bounds.min.y + 5;
    const neck = { x: torso.x, y: neckY };

    // Draw body outline first (darker, thicker)
    const outlineWidth = 7;

    // Spine outline
    drawLine(neck, pelvis, outlineWidth, outlineColor);

    // Left arm outline
    drawLine(neck, leftUpperArm, outlineWidth, outlineColor);
    drawLine(leftUpperArm, leftLowerArm, outlineWidth, outlineColor);
    drawLine(leftLowerArm, leftHand, outlineWidth, outlineColor);

    // Right arm outline
    drawLine(neck, rightUpperArm, outlineWidth, outlineColor);
    drawLine(rightUpperArm, rightLowerArm, outlineWidth, outlineColor);
    drawLine(rightLowerArm, rightHand, outlineWidth, outlineColor);

    // Left leg outline
    drawLine(pelvis, leftUpperLeg, outlineWidth, outlineColor);
    drawLine(leftUpperLeg, leftLowerLeg, outlineWidth, outlineColor);
    drawLine(leftLowerLeg, leftFoot, outlineWidth, outlineColor);

    // Right leg outline
    drawLine(pelvis, rightUpperLeg, outlineWidth, outlineColor);
    drawLine(rightUpperLeg, rightLowerLeg, outlineWidth, outlineColor);
    drawLine(rightLowerLeg, rightFoot, outlineWidth, outlineColor);

    // Draw main body (lighter, thinner on top)
    const bodyWidth = 4;

    // Spine (neck to pelvis)
    drawLine(neck, pelvis, bodyWidth);

    // Left arm
    drawLine(neck, leftUpperArm, bodyWidth);
    drawLine(leftUpperArm, leftLowerArm, bodyWidth);
    drawLine(leftLowerArm, leftHand, bodyWidth);

    // Right arm
    drawLine(neck, rightUpperArm, bodyWidth);
    drawLine(rightUpperArm, rightLowerArm, bodyWidth);
    drawLine(rightLowerArm, rightHand, bodyWidth);

    // Left leg
    drawLine(pelvis, leftUpperLeg, bodyWidth);
    drawLine(leftUpperLeg, leftLowerLeg, bodyWidth);
    drawLine(leftLowerLeg, leftFoot, bodyWidth);

    // Right leg
    drawLine(pelvis, rightUpperLeg, bodyWidth);
    drawLine(rightUpperLeg, rightLowerLeg, bodyWidth);
    drawLine(rightLowerLeg, rightFoot, bodyWidth);

    // Draw head (circle)
    const headRadius = bodies.head.circleRadius || 18;

    // Head outline
    ctx.fillStyle = outlineColor;
    ctx.beginPath();
    ctx.arc(head.x, head.y, headRadius + 2, 0, Math.PI * 2);
    ctx.fill();

    // Head fill
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Neck line (head to neck)
    drawLine(head, neck, outlineWidth, outlineColor);
    drawLine(head, neck, bodyWidth);
}

/**
 * Set fighters to render
 * @param {Array} fighterList 
 */
export function setFighters(fighterList) {
    fighters = fighterList || [];
}

/**
 * Get canvas dimensions
 * @returns {Object} { width, height }
 */
export function getDimensions() {
    return {
        width: canvas?.width || 0,
        height: canvas?.height || 0,
    };
}

/**
 * Set the function that provides floating numbers
 * @param {Function} getter - Function returning array of floating numbers
 */
export function setFloatingNumbersGetter(getter) {
    floatingNumbersGetter = getter;
}


