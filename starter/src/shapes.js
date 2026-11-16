/*
 * shapes.js — PROVIDED. Do not modify.
 *
 * Small helpers for building a scene graph out of the solids you wrote in
 * Assignment 2. Three ideas, and they are all you need for Part A:
 *
 *   joint(scene, name, parent, position)
 *       an empty node: a place where one part is attached to another.
 *       Rotating a joint rotates everything below it.
 *
 *   ball(scene, name, parent, radius, colour)
 *       a sphere centred on its parent node.
 *
 *   bone(scene, name, parent, radius, length, colour)
 *       a cylinder that runs from its parent node along the node's local
 *       +z axis. Its far end is therefore at local (0, 0, length), which is
 *       where the next joint goes.
 *
 * A node's transform is always relative to its parent, so a rotation high up
 * in the tree carries every part below it along.
 */

import { GeometryBuffer } from "./geometry.js";
import { drawSphere, drawCylinder } from "./solids.js";

export const COLOURS = {
    red: [1, 0, 0], green: [0, 0.7, 0.2], blue: [0.2, 0.4, 1],
    yellow: [1, 0.85, 0], orange: [1, 0.5, 0], magenta: [1, 0, 1],
    cyan: [0, 0.8, 0.9], grey: [0.6, 0.6, 0.6], white: [1, 1, 1]
};

const SPHERE_SLICES = 24;
const SPHERE_SEGMENTS = 16;
const CYLINDER_SEGMENTS = 20;

/** An empty node at a position relative to its parent. */
export function joint(scene, name, parent = null, position = null) {
    const node = new BABYLON.TransformNode(name, scene);
    if (parent) node.parent = parent;
    if (position) node.position = position.clone();
    return node;
}

/** A sphere centred on its parent node. */
export function ball(scene, name, parent, radius, colour) {
    const buf = new GeometryBuffer();
    drawSphere(buf, radius, SPHERE_SLICES, SPHERE_SEGMENTS);
    return finish(scene, name, buf, parent, colour);
}

/** A cylinder running from its parent node along local +z. */
export function bone(scene, name, parent, radius, length, colour) {
    const buf = new GeometryBuffer();
    drawCylinder(buf, radius, length, CYLINDER_SEGMENTS);
    return finish(scene, name, buf, parent, colour);
}

/** A StandardMaterial in a flat colour. */
export function material(scene, name, colour) {
    const mat = new BABYLON.StandardMaterial(name + "-mat", scene);
    mat.diffuseColor = new BABYLON.Color3(...colour);
    mat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    return mat;
}

/** The ground: a plain grid, so you can see the figure move across it. */
export function ground(scene, size = 20, step = 1) {
    const lines = [];
    for (let i = -size / 2; i <= size / 2; i += step) {
        lines.push([new BABYLON.Vector3(i, 0, -size / 2), new BABYLON.Vector3(i, 0, size / 2)]);
        lines.push([new BABYLON.Vector3(-size / 2, 0, i), new BABYLON.Vector3(size / 2, 0, i)]);
    }
    const grid = BABYLON.MeshBuilder.CreateLineSystem("grid", { lines }, scene);
    grid.color = new BABYLON.Color3(0.25, 0.3, 0.35);
    grid.isPickable = false;
    return grid;
}

function finish(scene, name, buf, parent, colour) {
    const mesh = buf.toMesh(name, scene);
    if (parent) mesh.parent = parent;
    mesh.material = material(scene, name, colour);
    return mesh;
}
