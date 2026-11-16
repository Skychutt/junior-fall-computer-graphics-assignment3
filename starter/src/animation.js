/* Part B: calculate every pose from elapsed time, independently of frame rate. */
import { FIGURE_DIMENSIONS } from "./figure.js";

const WALK_RADIUS = 4;
const LAP_SECONDS = 12;
const STRIDES_PER_LAP = 16; // One stride contains a left step and a right step.
const STEP_HEIGHT = 0.22;
const TAU = 2 * Math.PI;
const { hipOffset, hipDrop, thigh, shin, footRadius } = FIGURE_DIMENSIONS;
const REST_HEIGHT = hipDrop + thigh + shin + footRadius;

/** Keep rounding errors from putting an acos/asin input outside [-1, 1]. */
function clampUnit(value) {
    return Math.max(-1, Math.min(1, value));
}

/**
 * Find a foot position relative to its hip. The step phase is tied to theta.
 * First half-cycle: hold one world-space ground point. Second half: move to
 * the next point using u-sin(2*pi*u)/(2*pi), and lift by height*sin(pi*u)^2.
 * Both curves have zero end velocity, so the foot leaves and lands smoothly.
 * Reconstructing the contact point from the cycle number needs no frame history.
 */
function footTarget(theta, phase, side, bodyHeight) {
    const offset = side > 0 ? 0 : Math.PI; // The right foot is half a cycle later.
    const legPhase = phase + offset;
    const cycle = Math.floor(legPhase / TAU);
    const localPhase = legPhase - cycle * TAU;
    let angle = (cycle * TAU - offset + Math.PI / 2) / STRIDES_PER_LAP;
    let height = footRadius;

    if (localPhase > Math.PI) {
        const u = (localPhase - Math.PI) / Math.PI;
        const travel = u - Math.sin(TAU * u) / TAU;
        angle += (TAU / STRIDES_PER_LAP) * travel;
        height += STEP_HEIGHT * Math.sin(Math.PI * u) ** 2;
    }

    // The two feet follow circles just outside/inside the pelvis's circle.
    const radius = WALK_RADIUS + side * hipOffset;
    const delta = angle - theta;
    // Express the world target in the rotating figure's local coordinates.
    return {
        x: radius * (Math.cos(delta) - 1),
        y: height - bodyHeight + hipDrop,
        z: radius * Math.sin(delta)
    };
}

/**
 * Aim the thigh and shin at a foot target (a two-segment inverse-kinematics step).
 * The cosine rule gives cos(knee)=(distance^2-thigh^2-shin^2)/(2*thigh*shin).
 * acos chooses a nonnegative knee bend. A small hip roll handles the circle's
 * sideways curvature; the hip pitch then aims the bent leg at the target.
 * Babylon applies these hip Euler rotations as X-pitch after Z-roll (yaw=0).
 */
function poseLeg(hip, knee, target) {
    const { x, y, z } = target;
    const distanceSquared = x * x + y * y + z * z;
    const bend = Math.acos(clampUnit(
        (distanceSquared - thigh * thigh - shin * shin) / (2 * thigh * shin)
    ));
    const down = thigh + shin * Math.cos(bend);
    const back = shin * Math.sin(bend);
    const roll = Math.asin(clampUnit(x / down));
    const pitch = Math.atan2(-z, -y) - Math.atan2(back, down * Math.cos(roll));
    hip.rotation.set(pitch, 0, roll);
    knee.rotation.set(bend, 0, 0);
}

/**
 * Move round x=R*cos(theta), z=R*sin(theta), where theta=2*pi*t/12.
 * The tangent is (-sin(theta),0,cos(theta)); yaw=-theta points local +z along it.
 * phase=16*theta links steps and sinusoidal arm swings to distance travelled.
 * The legs alternate planted support and raised swing, with knees bending one
 * way. Sliding retains the path but restores zero facing and joint angles.
 */
export function updateFigure(figure, t, options = {}) {
    const walking = options.walk !== false;
    const theta = TAU * t / LAP_SECONDS;
    const phase = STRIDES_PER_LAP * theta;
    const { root, joints } = figure;
    root.position.set(WALK_RADIUS * Math.cos(theta), REST_HEIGHT, WALK_RADIUS * Math.sin(theta));
    root.rotation.y = walking ? -theta : 0;

    if (!walking) {
        // Reset hip roll as well as pitch when switching from walking to sliding.
        for (const side of ["left", "right"]) {
            for (const name of ["Shoulder", "Elbow", "Hip", "Knee"]) {
                joints[side + name].rotation.set(0, 0, 0);
            }
        }
        return;
    }

    // Rise over the supporting foot; lower at foot changes so both legs reach.
    root.position.y = REST_HEIGHT - 0.07 + 0.06 * Math.sin(phase) ** 2;
    poseLeg(joints.leftHip, joints.leftKnee, footTarget(theta, phase, +1, root.position.y));
    poseLeg(joints.rightHip, joints.rightKnee, footTarget(theta, phase, -1, root.position.y));

    // A quarter-cycle shift puts the opposite arm forwards at each foot landing.
    const swing = Math.sin(phase + Math.PI / 2);
    joints.leftShoulder.rotation.x = 0.35 * swing;
    joints.rightShoulder.rotation.x = -0.35 * swing;
    joints.leftElbow.rotation.x = -(0.12 + 0.3 * Math.max(0, -swing));
    joints.rightElbow.rotation.x = -(0.12 + 0.3 * Math.max(0, swing));
}

/** Angle = angular speed * time: rotate about Y once every 20 seconds. */
export function updateGlobe(globe, t) {
    globe.rotation.y = TAU * t / 20;
}
