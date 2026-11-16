/*
 * solids.js — MODEL ANSWER for Part B.
 *
 * Every function writes triangles into a GeometryBuffer (see geometry.js).
 *
 * Normals must point OUTWARD from the solid, or the lighting looks wrong.
 * Every face table below lists its vertices anticlockwise as seen from
 * outside. Babylon.js uses a left-handed coordinate system (z into the
 * screen), so for a triangle (p0, p1, p2) with v = p1 - p0 and w = p2 - p0,
 * the outward normal is  w x v.
 */

import { Point4f, Vector4f } from "./math.js";

const ORIGIN = new Point4f(0, 0, 0);

/**
 * Emit one flat-shaded face (a triangle, or a convex face with four corners)
 * from a face table row.
 *
 * - The face normal is computed once from the first three corners and used for
 *   every vertex, which gives the faceted look of a polyhedron.
 * - A face with four corners (a, b, c, d) is emitted as the two triangles
 *   (a, b, c) and (a, c, d) — a triangle fan around corner a.
 */
function addFlatFace(buf, vertices, face) {
    const p0 = vertices[face[0]];
    const v = vertices[face[1]].minusPoint(p0);   // edge p0 -> p1
    const w = vertices[face[2]].minusPoint(p0);   // edge p0 -> p2
    const normal = w.cross(v).normal();           // w x v points outward (see top of file)
    buf.normal(normal);

    for (let k = 1; k < face.length - 1; k++) {   // fan: (0,1,2), (0,2,3), ...
        buf.vertex(vertices[face[0]]);
        buf.vertex(vertices[face[k]]);
        buf.vertex(vertices[face[k + 1]]);
    }
}

/* ------------------------------------------------------------------ */
/* PROVIDED REFERENCE: tetrahedron                                     */
/* ------------------------------------------------------------------ */

/**
 * Regular tetrahedron using alternate corners of the cube [-1, 1]^3.
 * 4 vertices, 4 triangular faces. Written out in full (without the helper)
 * so the steps from the lecture notes are visible.
 */
export function drawTetrahedron(buf) {
    const vertices = [
        new Point4f(-1, -1, -1),
        new Point4f(-1,  1,  1),
        new Point4f( 1, -1,  1),
        new Point4f( 1,  1, -1)
    ];

    // Each row lists one face, anticlockwise as seen from outside (Babylon.js order).
    const faces = [
        [0, 1, 2],
        [1, 0, 3],
        [2, 1, 3],
        [3, 0, 2]
    ];

    for (const face of faces) {
        const p0 = vertices[face[0]];
        const p1 = vertices[face[1]];
        const p2 = vertices[face[2]];

        const v = p1.minusPoint(p0);
        const w = p2.minusPoint(p0);
        const normal = w.cross(v).normal();

        buf.normal(normal);
        buf.vertex(p0);
        buf.vertex(p1);
        buf.vertex(p2);
    }
}

/* ------------------------------------------------------------------ */
/* Cube                                                                */
/* ------------------------------------------------------------------ */

/**
 * Cube with corners at (±1, ±1, ±1).
 * The 8 corners are indexed by their signs: bit 2 = x, bit 1 = y, bit 0 = z
 * (0 = negative, 1 = positive), so vertex 5 = (+x, -y, +z).
 * 6 square faces -> 12 triangles. Each face keeps its own normal, so corners are
 * repeated per face (24 vertex/normal pairs before triangulation), exactly like
 * the box example.
 */
export function drawCube(buf) {
    const vertices = [
        new Point4f(-1, -1, -1),  // 0
        new Point4f(-1, -1,  1),  // 1
        new Point4f(-1,  1, -1),  // 2
        new Point4f(-1,  1,  1),  // 3
        new Point4f( 1, -1, -1),  // 4
        new Point4f( 1, -1,  1),  // 5
        new Point4f( 1,  1, -1),  // 6
        new Point4f( 1,  1,  1)   // 7
    ];

    const faces = [
        [0, 1, 5, 4],   // bottom (-y)
        [0, 4, 6, 2],   // front  (-z)
        [0, 2, 3, 1],   // left   (-x)
        [4, 5, 7, 6],   // right  (+x)
        [1, 3, 7, 5],   // back   (+z)
        [2, 6, 7, 3]    // top    (+y)
    ];

    for (const face of faces) addFlatFace(buf, vertices, face);
}

/* ------------------------------------------------------------------ */
/* Octahedron                                                          */
/* ------------------------------------------------------------------ */

/**
 * Regular octahedron: one vertex on each half-axis at distance 1.
 * 6 vertices, 8 triangular faces (one per octant). Each face joins one
 * x-vertex, one y-vertex and one z-vertex.
 */
export function drawOctahedron(buf) {
    const vertices = [
        new Point4f(-1,  0,  0),  // 0: -x
        new Point4f( 0, -1,  0),  // 1: -y
        new Point4f( 0,  0, -1),  // 2: -z
        new Point4f( 1,  0,  0),  // 3: +x
        new Point4f( 0,  1,  0),  // 4: +y
        new Point4f( 0,  0,  1)   // 5: +z
    ];

    const faces = [
        [3, 5, 4],   // (+x, +y, +z)
        [4, 5, 0],   // (-x, +y, +z)
        [0, 5, 1],   // (-x, -y, +z)
        [1, 5, 3],   // (+x, -y, +z)
        [0, 2, 4],   // (-x, +y, -z)
        [4, 2, 3],   // (+x, +y, -z)
        [3, 2, 1],   // (+x, -y, -z)
        [1, 2, 0]    // (-x, -y, -z)
    ];

    for (const face of faces) addFlatFace(buf, vertices, face);
}

/* ------------------------------------------------------------------ */
/* Icosahedron                                                         */
/* ------------------------------------------------------------------ */

/**
 * Regular icosahedron inscribed in the unit sphere.
 * The 12 vertices lie on three mutually perpendicular golden rectangles
 * with sides 2X by 2Z, where Z / X is the golden ratio and X^2 + Z^2 = 1:
 *
 *     X = 1 / sqrt(1 + phi^2) ≈ 0.5257,   Z = phi * X ≈ 0.8507
 *
 * They are precomputed from phi rather than typed in as magic numbers.
 * 20 triangular faces.
 */
export function drawIcosahedron(buf) {
    const phi = (1 + Math.sqrt(5)) / 2;
    const X = 1 / Math.sqrt(1 + phi * phi);
    const Z = phi * X;

    const vertices = [
        new Point4f(-X, 0,  Z), new Point4f( X, 0,  Z),
        new Point4f(-X, 0, -Z), new Point4f( X, 0, -Z),
        new Point4f(0,  Z,  X), new Point4f(0,  Z, -X),
        new Point4f(0, -Z,  X), new Point4f(0, -Z, -X),
        new Point4f( Z,  X, 0), new Point4f(-Z,  X, 0),
        new Point4f( Z, -X, 0), new Point4f(-Z, -X, 0)
    ];

    // Each face is listed anticlockwise as seen from outside.
    const faces = [
        [0, 4, 1],  [0, 9, 4],  [9, 5, 4],  [4, 5, 8],  [4, 8, 1],
        [8, 10, 1], [8, 3, 10], [5, 3, 8],  [5, 2, 3],  [2, 7, 3],
        [7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6], [0, 1, 6],
        [6, 1, 10], [9, 0, 11], [9, 11, 2], [9, 2, 5],  [7, 2, 11]
    ];

    for (const face of faces) addFlatFace(buf, vertices, face);
}

/* ------------------------------------------------------------------ */
/* Cylinder                                                            */
/* ------------------------------------------------------------------ */

/**
 * Closed cylinder around the z-axis, from z = 0 to z = height.
 *
 * A circle of radius r is sampled at theta_i = 2*pi*i / nSegments:
 *     x = r cos(theta),  y = r sin(theta)
 *
 * For each segment i (i = 0 .. nSegments-1) we emit:
 *   - a side panel (2 triangles) with SMOOTH normals (cos theta, sin theta, 0):
 *     each vertex gets the normal of the true cylinder at that angle, so the
 *     lighting varies continuously around the side;
 *   - one bottom-cap triangle to the centre, normal (0, 0, -1);
 *   - one top-cap triangle to the centre, normal (0, 0, +1).
 * Total: 4 * nSegments triangles.
 */
export function drawCylinder(buf, radius, height, nSegments) {
    const up = new Vector4f(0, 0, height);
    const bottomCentre = ORIGIN;
    const topCentre = ORIGIN.plusVector(up);
    const capDown = new Vector4f(0, 0, -1);
    const capUp = new Vector4f(0, 0, 1);

    for (let i = 0; i < nSegments; i++) {      // integer loop: exactly nSegments panels
        const theta1 = (2 * Math.PI * i) / nSegments;
        const theta2 = (2 * Math.PI * (i + 1)) / nSegments;

        // Unit radial directions double as the side normals.
        const n1 = new Vector4f(Math.cos(theta1), Math.sin(theta1), 0);
        const n2 = new Vector4f(Math.cos(theta2), Math.sin(theta2), 0);

        const b1 = ORIGIN.plusVector(n1.byScalar(radius));  // bottom ring
        const b2 = ORIGIN.plusVector(n2.byScalar(radius));
        const t1 = b1.plusVector(up);                         // top ring
        const t2 = b2.plusVector(up);

        // Side panel (b1, t1, t2, b2) -> triangles (b1, t1, t2) and (b1, t2, b2)
        buf.normal(n1); buf.vertex(b1);
        buf.normal(n1); buf.vertex(t1);
        buf.normal(n2); buf.vertex(t2);

        buf.normal(n1); buf.vertex(b1);
        buf.normal(n2); buf.vertex(t2);
        buf.normal(n2); buf.vertex(b2);

        // Bottom cap: seen from below (outside), b1 -> b2 -> centre is anticlockwise.
        buf.normal(capDown);
        buf.vertex(b1);
        buf.vertex(b2);
        buf.vertex(bottomCentre);

        // Top cap: seen from above, t1 -> centre -> t2 is anticlockwise.
        buf.normal(capUp);
        buf.vertex(t1);
        buf.vertex(topCentre);
        buf.vertex(t2);
    }
}

/* ------------------------------------------------------------------ */
/* Sphere                                                              */
/* ------------------------------------------------------------------ */

/** Unit direction for longitude theta and latitude phi (see lecture notes). */
function sphereDirection(phi, theta) {
    return new Vector4f(
        Math.cos(phi) * Math.cos(theta),
        Math.cos(phi) * Math.sin(theta),
        Math.sin(phi)
    );
}

/**
 * UV sphere centred at the origin.
 *
 *     x = r cos(phi) cos(theta)
 *     y = r cos(phi) sin(theta)       theta in [-pi, pi)      (nSlices steps)
 *     z = r sin(phi)                  phi   in [-pi/2, pi/2)  (nSegments steps)
 *
 * For a sphere centred at the origin the unit normal at a point is simply the
 * point's direction from the centre, so normal = direction and
 * position = centre + r * direction.
 *
 * Each (theta, phi) cell has four corners and becomes two triangles, giving
 * 2 * nSlices * nSegments triangles. The triangles touching the poles have
 * zero area (two corners coincide) — harmless, and left in for simplicity.
 */
export function drawSphere(buf, radius, nSlices, nSegments) {
    const dTheta = (2 * Math.PI) / nSlices;
    const dPhi = Math.PI / nSegments;

    // Integer counters avoid the extra/missing row that accumulating floats can cause.
    for (let i = 0; i < nSlices; i++) {
        const theta0 = -Math.PI + i * dTheta;
        const theta1 = theta0 + dTheta;

        for (let j = 0; j < nSegments; j++) {
            const phi0 = -Math.PI / 2 + j * dPhi;
            const phi1 = phi0 + dPhi;

            // Four corners of the cell: a = (phi0, theta0), b = (phi1, theta0),
            // c = (phi1, theta1), d = (phi0, theta1)
            const corners = [
                sphereDirection(phi0, theta0),
                sphereDirection(phi1, theta0),
                sphereDirection(phi1, theta1),
                sphereDirection(phi0, theta1)
            ];

            // Cell (a, b, c, d) -> triangles (a, b, c) and (a, c, d)
            for (const k of [0, 1, 2, 0, 2, 3]) {
                const n = corners[k];
                buf.normal(n);
                buf.vertex(ORIGIN.plusVector(n.byScalar(radius)));
            }
        }
    }
}
