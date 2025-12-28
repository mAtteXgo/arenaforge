/**
 * Controls.js — UI Button Handlers + Keyboard Shortcuts
 * 
 * Wires up simulation controls (Start, Pause, Step, Reset).
 * Handles keyboard shortcuts for quick control.
 */

import * as Simulator from '../engine/Simulator.js';

// DOM elements
let btnStart = null;
let btnPause = null;
let btnStep = null;
let btnReset = null;
let statusDisplay = null;

/**
 * Initialize controls
 */
export function init() {
    // Get DOM elements
    btnStart = document.getElementById('btn-start');
    btnPause = document.getElementById('btn-pause');
    btnStep = document.getElementById('btn-step');
    btnReset = document.getElementById('btn-reset');
    statusDisplay = document.getElementById('status-display');

    // Wire up button click handlers
    if (btnStart) {
        btnStart.addEventListener('click', handleStart);
    }

    if (btnPause) {
        btnPause.addEventListener('click', handlePause);
    }

    if (btnStep) {
        btnStep.addEventListener('click', handleStep);
    }

    if (btnReset) {
        btnReset.addEventListener('click', handleReset);
    }

    // Wire up keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);

    // Initial state
    updateUI();

    console.log('[Controls] Initialized');
}

/**
 * Handle Start button click
 */
function handleStart() {
    Simulator.start();
    updateUI();
}

/**
 * Handle Pause/Resume button click
 */
function handlePause() {
    if (!Simulator.getIsRunning()) {
        // Not started yet, start instead
        Simulator.start();
    } else {
        Simulator.togglePause();
    }
    updateUI();
}

/**
 * Handle Step button click
 */
function handleStep() {
    if (!Simulator.getIsRunning()) {
        // Start in paused state first
        Simulator.start();
        Simulator.pause();
    }
    Simulator.step();
    updateUI();
}

/**
 * Handle Reset button click
 */
function handleReset() {
    Simulator.reset();
    updateUI();
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event 
 */
function handleKeydown(event) {
    // Ignore if typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    switch (event.code) {
        case 'Space':
            event.preventDefault();
            if (!Simulator.getIsRunning()) {
                Simulator.start();
            } else {
                Simulator.togglePause();
            }
            updateUI();
            break;

        case 'KeyN':
            event.preventDefault();
            if (!Simulator.getIsRunning()) {
                Simulator.start();
                Simulator.pause();
            }
            Simulator.step();
            updateUI();
            break;

        case 'KeyR':
            event.preventDefault();
            Simulator.reset();
            updateUI();
            break;
    }
}

/**
 * Update UI state based on simulation state
 */
export function updateUI() {
    const isRunning = Simulator.getIsRunning();
    const isPaused = Simulator.getIsPaused();

    // Update button text
    if (btnPause) {
        btnPause.textContent = isPaused ? 'Resume' : 'Pause';
    }

    // Update button disabled states
    if (btnStart) {
        btnStart.disabled = isRunning;
    }

    // Update status display
    if (statusDisplay) {
        if (!isRunning) {
            statusDisplay.textContent = 'Stopped';
            statusDisplay.className = 'stopped';
        } else if (isPaused) {
            statusDisplay.textContent = 'Paused';
            statusDisplay.className = 'paused';
        } else {
            statusDisplay.textContent = 'Running';
            statusDisplay.className = 'running';
        }
    }
}
