/* Part A: assemble the figure using parent-child transforms. */
import { joint, ball, bone, COLOURS } from "./shapes.js";

const DOWN = Math.PI / 2;
const UP = -Math.PI / 2;
// Shared with the walk cycle so pelvis height matches the actual legs.
export const FIGURE_DIMENSIONS = Object.freeze({
    hipOffset: 0.25, hipDrop: 0.15, thigh: 0.8, shin: 0.75, footRadius: 0.2
});

/** Make a local displacement; joint() copies it before attaching the node. */
const V = (x, y, z) => new BABYLON.Vector3(x, y, z);

/**
 * Build either arm with side=+1 (left) or -1 (right).
 * Shoulder -> upper-arm mesh -> elbow -> forearm mesh -> hand is one chain.
 * The elbow is at (0,0,upperLength) in the rotated bone's coordinates;
 * rotating the shoulder therefore carries the elbow, forearm and hand.
 */
function buildArm(scene, chest, side) {
    const name = side > 0 ? "left" : "right";
    const upperLength = 0.6, lowerLength = 0.55;
    // Changing side mirrors the attachment point, so both arms share this code.
    const shoulder = joint(scene, name + "Shoulder", chest, V(side * 0.6, 0.35, 0));
    ball(scene, name + "ShoulderBall", shoulder, 0.18, COLOURS.blue);
    const upper = bone(scene, name + "UpperArm", shoulder, 0.12, upperLength, COLOURS.orange);
    upper.rotation.x = DOWN; // Point the bone down; keep the shoulder's rest angle zero.
    const elbow = joint(scene, name + "Elbow", upper, V(0, 0, upperLength));
    ball(scene, name + "ElbowBall", elbow, 0.15, COLOURS.blue);
    const forearm = bone(scene, name + "Forearm", elbow, 0.1, lowerLength, COLOURS.orange);
    // The forearm inherits DOWN; applying it again would turn it sideways.
    const hand = joint(scene, name + "Hand", forearm, V(0, 0, lowerLength));
    ball(scene, name + "HandBall", hand, 0.16, COLOURS.blue);
    return { shoulder, elbow };
}

/**
 * Build either leg beneath the pelvis, using the same construction both times.
 * The knee is at the thigh's local +z end, and the foot at the shin's +z end.
 * No world positions are assigned: the entire chain follows the root.
 */
function buildLeg(scene, root, side) {
    const name = side > 0 ? "left" : "right";
    const { hipOffset, hipDrop, thigh, shin, footRadius } = FIGURE_DIMENSIONS;
    const hip = joint(scene, name + "Hip", root, V(side * hipOffset, -hipDrop, 0));
    ball(scene, name + "HipBall", hip, 0.19, COLOURS.blue);
    const upper = bone(scene, name + "Thigh", hip, 0.16, thigh, COLOURS.orange);
    upper.rotation.x = DOWN;
    const knee = joint(scene, name + "Knee", upper, V(0, 0, thigh));
    ball(scene, name + "KneeBall", knee, 0.17, COLOURS.blue);
    const lower = bone(scene, name + "Shin", knee, 0.13, shin, COLOURS.orange);
    // Local +z is the shin's length direction, even after its parents rotate.
    const foot = joint(scene, name + "Foot", lower, V(0, 0, shin));
    ball(scene, name + "FootBall", foot, footRadius, COLOURS.blue);
    return { hip, knee };
}

/**
 * Assemble the figure beneath one pelvis and expose the eight animated joints.
 * Parent transforms accumulate down the tree, like the lecture's matrix stack.
 * The supplied chest/neck/head reference is retained; the limbs are added here.
 */
export function buildFigure(scene) {
    const root = joint(scene, "figure", null, V(0, 1.9, 0));
    ball(scene, "pelvis", root, 0.35, COLOURS.green);
    const chest = joint(scene, "chest", root, V(0, 0.75, 0));
    ball(scene, "chest", chest, 0.45, COLOURS.green);
    const neck = joint(scene, "neck", chest, V(0, 0.45, 0));
    neck.rotation.x = UP;
    bone(scene, "neck", neck, 0.12, 0.3, COLOURS.orange);
    const head = joint(scene, "head", neck, V(0, 0, 0.55));
    ball(scene, "head", head, 0.33, COLOURS.red);
    // Reuse each builder for both sides instead of duplicating the limbs.
    const leftArm = buildArm(scene, chest, +1);
    const rightArm = buildArm(scene, chest, -1);
    const leftLeg = buildLeg(scene, root, +1);
    const rightLeg = buildLeg(scene, root, -1);
    // Animation keeps these references and changes their rotations each frame.
    return { root, joints: {
        leftShoulder: leftArm.shoulder, rightShoulder: rightArm.shoulder,
        leftElbow: leftArm.elbow, rightElbow: rightArm.elbow,
        leftHip: leftLeg.hip, rightHip: rightLeg.hip,
        leftKnee: leftLeg.knee, rightKnee: rightLeg.knee,
        chest, neck, head
    } };
}
