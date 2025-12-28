/**
 * Ragdoll.js — Human-ish Ragdoll Physics Body
 * 
 * Creates a physics-based ragdoll with:
 * - Head (circle)
 * - Torso/chest (rectangle)
 * - Pelvis (rectangle)
 * - Upper/lower arms with hands
 * - Upper/lower legs with feet
 * 
 * All parts connected via Matter.js constraints.
 */

const { Bodies, Body, Composite, Constraint } = Matter;

// =============================================================================
// TUNING CONSTANTS — Easy to tweak!
// =============================================================================

export const RAGDOLL_CONFIG = {
    // Overall scale (1.0 = normal size)
    scale: 1.0,

    // Body part sizes (all in pixels, will be scaled)
    head: { radius: 18 },
    torso: { width: 28, height: 50 },
    pelvis: { width: 24, height: 20 },
    upperArm: { width: 10, height: 32 },
    lowerArm: { width: 8, height: 28 },
    hand: { width: 8, height: 8 },
    upperLeg: { width: 12, height: 38 },
    lowerLeg: { width: 10, height: 34 },
    foot: { width: 16, height: 8 },

    // Constraint settings
    constraints: {
        stiffness: 0.9,        // How rigid joints are (0-1)
        damping: 0.3,          // Oscillation dampening (0-1)
        angularStiffness: 0.1, // Rotational resistance
    },

    // Physics properties
    physics: {
        friction: 0.8,
        frictionStatic: 0.9,   // Static friction for better grip
        frictionAir: 0.02,
        restitution: 0.1,      // Bounciness
        density: 0.001,
    },

    // Collision group (all parts collide with world but not each other)
    collisionGroup: -1,
};

// =============================================================================
// RAGDOLL CREATION
// =============================================================================

/**
 * Create a ragdoll at the specified position
 * @param {number} x - Center X position
 * @param {number} y - Center Y position (torso center)
 * @param {Object} options - Optional overrides
 * @returns {Object} Ragdoll object with { bodies, constraints, composite }
 */
export function createRagdoll(x, y, options = {}) {
    const config = { ...RAGDOLL_CONFIG, ...options };
    const s = config.scale;

    // Common body options
    const bodyOptions = (label) => ({
        label,
        friction: config.physics.friction,
        frictionStatic: config.physics.frictionStatic,
        frictionAir: config.physics.frictionAir,
        restitution: config.physics.restitution,
        density: config.physics.density,
        collisionFilter: {
            group: config.collisionGroup,
        },
    });

    // Calculate positions relative to torso center
    const torsoY = y;
    const headY = torsoY - config.torso.height * s / 2 - config.head.radius * s - 4 * s;
    const pelvisY = torsoY + config.torso.height * s / 2 + config.pelvis.height * s / 2;

    // Arm positions
    const shoulderY = torsoY - config.torso.height * s / 2 + 8 * s;
    const shoulderOffsetX = config.torso.width * s / 2 + 2 * s;

    // Leg positions
    const hipY = pelvisY + config.pelvis.height * s / 2;
    const hipOffsetX = config.pelvis.width * s / 4;

    // ==========================================================================
    // CREATE BODIES
    // ==========================================================================

    // Head
    const head = Bodies.circle(x, headY, config.head.radius * s, bodyOptions('head'));

    // Torso
    const torso = Bodies.rectangle(
        x, torsoY,
        config.torso.width * s, config.torso.height * s,
        bodyOptions('torso')
    );

    // Pelvis
    const pelvis = Bodies.rectangle(
        x, pelvisY,
        config.pelvis.width * s, config.pelvis.height * s,
        bodyOptions('pelvis')
    );

    // Left arm
    const leftUpperArm = Bodies.rectangle(
        x - shoulderOffsetX - config.upperArm.height * s / 2,
        shoulderY,
        config.upperArm.height * s, config.upperArm.width * s, // Rotated
        bodyOptions('leftUpperArm')
    );

    const leftLowerArm = Bodies.rectangle(
        x - shoulderOffsetX - config.upperArm.height * s - config.lowerArm.height * s / 2,
        shoulderY,
        config.lowerArm.height * s, config.lowerArm.width * s,
        bodyOptions('leftLowerArm')
    );

    const leftHand = Bodies.rectangle(
        x - shoulderOffsetX - config.upperArm.height * s - config.lowerArm.height * s - config.hand.width * s / 2,
        shoulderY,
        config.hand.width * s, config.hand.height * s,
        bodyOptions('leftHand')
    );

    // Right arm
    const rightUpperArm = Bodies.rectangle(
        x + shoulderOffsetX + config.upperArm.height * s / 2,
        shoulderY,
        config.upperArm.height * s, config.upperArm.width * s,
        bodyOptions('rightUpperArm')
    );

    const rightLowerArm = Bodies.rectangle(
        x + shoulderOffsetX + config.upperArm.height * s + config.lowerArm.height * s / 2,
        shoulderY,
        config.lowerArm.height * s, config.lowerArm.width * s,
        bodyOptions('rightLowerArm')
    );

    const rightHand = Bodies.rectangle(
        x + shoulderOffsetX + config.upperArm.height * s + config.lowerArm.height * s + config.hand.width * s / 2,
        shoulderY,
        config.hand.width * s, config.hand.height * s,
        bodyOptions('rightHand')
    );

    // Left leg
    const leftUpperLeg = Bodies.rectangle(
        x - hipOffsetX,
        hipY + config.upperLeg.height * s / 2,
        config.upperLeg.width * s, config.upperLeg.height * s,
        bodyOptions('leftUpperLeg')
    );

    const leftLowerLeg = Bodies.rectangle(
        x - hipOffsetX,
        hipY + config.upperLeg.height * s + config.lowerLeg.height * s / 2,
        config.lowerLeg.width * s, config.lowerLeg.height * s,
        bodyOptions('leftLowerLeg')
    );

    const leftFoot = Bodies.rectangle(
        x - hipOffsetX + 4 * s,
        hipY + config.upperLeg.height * s + config.lowerLeg.height * s + config.foot.height * s / 2,
        config.foot.width * s, config.foot.height * s,
        bodyOptions('leftFoot')
    );

    // Right leg
    const rightUpperLeg = Bodies.rectangle(
        x + hipOffsetX,
        hipY + config.upperLeg.height * s / 2,
        config.upperLeg.width * s, config.upperLeg.height * s,
        bodyOptions('rightUpperLeg')
    );

    const rightLowerLeg = Bodies.rectangle(
        x + hipOffsetX,
        hipY + config.upperLeg.height * s + config.lowerLeg.height * s / 2,
        config.lowerLeg.width * s, config.lowerLeg.height * s,
        bodyOptions('rightLowerLeg')
    );

    const rightFoot = Bodies.rectangle(
        x + hipOffsetX + 4 * s,
        hipY + config.upperLeg.height * s + config.lowerLeg.height * s + config.foot.height * s / 2,
        config.foot.width * s, config.foot.height * s,
        bodyOptions('rightFoot')
    );

    // Collect all bodies
    const bodies = {
        head,
        torso,
        pelvis,
        leftUpperArm, leftLowerArm, leftHand,
        rightUpperArm, rightLowerArm, rightHand,
        leftUpperLeg, leftLowerLeg, leftFoot,
        rightUpperLeg, rightLowerLeg, rightFoot,
    };

    // ==========================================================================
    // CREATE CONSTRAINTS
    // ==========================================================================

    const { stiffness, damping } = config.constraints;

    const constraintOptions = {
        stiffness,
        damping,
        render: { visible: false },
    };

    const constraints = [];

    // Helper to create point constraint
    const connect = (bodyA, bodyB, pointA, pointB, options = {}) => {
        return Constraint.create({
            bodyA,
            bodyB,
            pointA,
            pointB,
            ...constraintOptions,
            ...options,
        });
    };

    // Neck (head to torso)
    constraints.push(connect(
        head, torso,
        { x: 0, y: config.head.radius * s },
        { x: 0, y: -config.torso.height * s / 2 }
    ));

    // Spine (torso to pelvis)
    constraints.push(connect(
        torso, pelvis,
        { x: 0, y: config.torso.height * s / 2 },
        { x: 0, y: -config.pelvis.height * s / 2 }
    ));

    // Left shoulder
    constraints.push(connect(
        torso, leftUpperArm,
        { x: -config.torso.width * s / 2, y: -config.torso.height * s / 2 + 8 * s },
        { x: config.upperArm.height * s / 2, y: 0 }
    ));

    // Left elbow
    constraints.push(connect(
        leftUpperArm, leftLowerArm,
        { x: -config.upperArm.height * s / 2, y: 0 },
        { x: config.lowerArm.height * s / 2, y: 0 }
    ));

    // Left wrist
    constraints.push(connect(
        leftLowerArm, leftHand,
        { x: -config.lowerArm.height * s / 2, y: 0 },
        { x: config.hand.width * s / 2, y: 0 }
    ));

    // Right shoulder
    constraints.push(connect(
        torso, rightUpperArm,
        { x: config.torso.width * s / 2, y: -config.torso.height * s / 2 + 8 * s },
        { x: -config.upperArm.height * s / 2, y: 0 }
    ));

    // Right elbow
    constraints.push(connect(
        rightUpperArm, rightLowerArm,
        { x: config.upperArm.height * s / 2, y: 0 },
        { x: -config.lowerArm.height * s / 2, y: 0 }
    ));

    // Right wrist
    constraints.push(connect(
        rightLowerArm, rightHand,
        { x: config.lowerArm.height * s / 2, y: 0 },
        { x: -config.hand.width * s / 2, y: 0 }
    ));

    // Left hip
    constraints.push(connect(
        pelvis, leftUpperLeg,
        { x: -config.pelvis.width * s / 4, y: config.pelvis.height * s / 2 },
        { x: 0, y: -config.upperLeg.height * s / 2 }
    ));

    // Left knee
    constraints.push(connect(
        leftUpperLeg, leftLowerLeg,
        { x: 0, y: config.upperLeg.height * s / 2 },
        { x: 0, y: -config.lowerLeg.height * s / 2 }
    ));

    // Left ankle
    constraints.push(connect(
        leftLowerLeg, leftFoot,
        { x: 0, y: config.lowerLeg.height * s / 2 },
        { x: -4 * s, y: -config.foot.height * s / 2 }
    ));

    // Right hip
    constraints.push(connect(
        pelvis, rightUpperLeg,
        { x: config.pelvis.width * s / 4, y: config.pelvis.height * s / 2 },
        { x: 0, y: -config.upperLeg.height * s / 2 }
    ));

    // Right knee
    constraints.push(connect(
        rightUpperLeg, rightLowerLeg,
        { x: 0, y: config.upperLeg.height * s / 2 },
        { x: 0, y: -config.lowerLeg.height * s / 2 }
    ));

    // Right ankle
    constraints.push(connect(
        rightLowerLeg, rightFoot,
        { x: 0, y: config.lowerLeg.height * s / 2 },
        { x: -4 * s, y: -config.foot.height * s / 2 }
    ));

    // ==========================================================================
    // CREATE COMPOSITE
    // ==========================================================================

    const composite = Composite.create({ label: 'ragdoll' });
    Composite.add(composite, Object.values(bodies));
    Composite.add(composite, constraints);

    console.log('[Ragdoll] Created ragdoll at', x, y);

    return {
        bodies,
        constraints,
        composite,
        config,
    };
}

/**
 * Remove ragdoll from world
 * @param {Matter.World} world 
 * @param {Object} ragdoll 
 */
export function removeRagdoll(world, ragdoll) {
    if (ragdoll && ragdoll.composite) {
        Composite.remove(world, ragdoll.composite);
        console.log('[Ragdoll] Removed from world');
    }
}

/**
 * Get joint positions for drawing stick figure
 * @param {Object} ragdoll 
 * @returns {Object} Joint positions
 */
export function getJointPositions(ragdoll) {
    const { bodies } = ragdoll;

    return {
        head: bodies.head.position,
        neck: {
            x: bodies.torso.position.x,
            y: bodies.torso.position.y - bodies.torso.bounds.max.y + bodies.torso.bounds.min.y + 10,
        },
        torsoTop: {
            x: bodies.torso.position.x,
            y: bodies.torso.bounds.min.y,
        },
        torsoCenter: bodies.torso.position,
        torsoBottom: {
            x: bodies.torso.position.x,
            y: bodies.torso.bounds.max.y,
        },
        pelvis: bodies.pelvis.position,

        leftShoulder: {
            x: bodies.torso.position.x - 14,
            y: bodies.torso.bounds.min.y + 8,
        },
        leftElbow: bodies.leftLowerArm.position,
        leftHand: bodies.leftHand.position,

        rightShoulder: {
            x: bodies.torso.position.x + 14,
            y: bodies.torso.bounds.min.y + 8,
        },
        rightElbow: bodies.rightLowerArm.position,
        rightHand: bodies.rightHand.position,

        leftHip: {
            x: bodies.pelvis.position.x - 6,
            y: bodies.pelvis.bounds.max.y,
        },
        leftKnee: bodies.leftLowerLeg.position,
        leftFoot: bodies.leftFoot.position,

        rightHip: {
            x: bodies.pelvis.position.x + 6,
            y: bodies.pelvis.bounds.max.y,
        },
        rightKnee: bodies.rightLowerLeg.position,
        rightFoot: bodies.rightFoot.position,
    };
}
