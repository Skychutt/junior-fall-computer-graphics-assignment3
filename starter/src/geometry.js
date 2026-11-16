/*
 * geometry.js — PROVIDED INFRASTRUCTURE. Do not modify.
 *
 * A Babylon.js mesh is a set of arrays: positions, normals and indices
 * (see examples/box-playground.js). GeometryBuffer fills those arrays for
 * you, in the same "set a normal, then emit vertices" style as the
 * normalIs() / vertexAt() helper in the lecture notes:
 *
 *     buf.normal(n)   sets the current normal (a Vector4f, or x, y, z)
 *     buf.vertex(p)   emits a vertex          (a Point4f,  or x, y, z)
 *
 * Every 3 calls to vertex() make one triangle. A face with four corners
 * (a, b, c, d) is emitted as the two triangles (a, b, c) and (a, c, d).
 *
 * Assignment 3 adds texture coordinates:
 *
 *     buf.uv(u, v)    sets the current texture coordinate
 *
 * Like normal(), it applies to every vertex emitted after it. If you never
 * call uv(), the mesh simply has no texture coordinates.
 */

export class GeometryBuffer {
    constructor() {
        this.positions = [];
        this.normals = [];
        this.indices = [];
        this._currentNormal = [0, 1, 0];
        this.uvs = [];
        this._currentUV = null;
    }

    /** Set the current normal. Used by every following vertex. */
    normal(nOrX, y, z) {
        this._currentNormal = toXYZ(nOrX, y, z, "normal");
    }

    /** Set the current texture coordinate (u, v), each normally 0 to 1. */
    uv(u, v) {
        if (typeof u !== "number" || typeof v !== "number") {
            throw new Error(`uv() received an invalid value: ${JSON.stringify([u, v])}`);
        }
        this._currentUV = [u, v];
    }

    /** Emit one vertex using the current normal (and texture coordinate). */
    vertex(pOrX, y, z) {
        const [px, py, pz] = toXYZ(pOrX, y, z, "vertex");
        const index = this.positions.length / 3;
        this.positions.push(px, py, pz);
        this.normals.push(...this._currentNormal);
        if (this._currentUV) this.uvs.push(...this._currentUV);
        this.indices.push(index);
    }

    get vertexCount() {
        return this.positions.length / 3;
    }

    get triangleCount() {
        return Math.floor(this.indices.length / 3);
    }

    /** Convert the collected arrays into a Babylon.js mesh (null if empty). */
    toMesh(name, scene) {
        if (this.indices.length % 3 !== 0) {
            throw new Error(
                `${name}: ${this.indices.length} vertices emitted — not a multiple of 3`
            );
        }
        if (this.triangleCount === 0) return null;

        const mesh = new BABYLON.Mesh(name, scene);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = this.positions;
        vertexData.normals = this.normals;
        vertexData.indices = this.indices;
        if (this.uvs.length === 2 * this.vertexCount) {
            vertexData.uvs = this.uvs;
        } else if (this.uvs.length > 0) {
            throw new Error(
                `${name}: ${this.uvs.length / 2} texture coordinates for ` +
                `${this.vertexCount} vertices — call uv() before every vertex`
            );
        }
        vertexData.applyToMesh(mesh);
        return mesh;
    }
}

function toXYZ(a, y, z, what) {
    const xyz = typeof a === "number" ? [a, y, z] : a ? [a.x, a.y, a.z] : [];
    if (xyz.length !== 3 || xyz.some(v => typeof v !== "number" || !Number.isFinite(v))) {
        throw new Error(`${what}() received an invalid value: ${JSON.stringify(xyz)}`);
    }
    return xyz;
}
