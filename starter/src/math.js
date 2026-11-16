/*
 * math.js — MODEL ANSWER for Part A.
 *
 * Homogeneous coordinates: points carry w = 1 and vectors carry w = 0.
 * Using w consistently makes the affine rules visible in the code:
 *
 *     point  + vector = point    (1 + 0 = 1)
 *     point  - point  = vector   (1 - 1 = 0)
 *     vector + vector = vector   (0 + 0 = 0)
 *     point  + point  = undefined (1 + 1 = 2), so no method is written for it
 *
 * Every operation returns a NEW object and never modifies `this`.
 */

export class Point4f {
    /** A position in space. w defaults to 1 (homogeneous point). */
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /** Access a component by index 0..3 (x, y, z, w); NaN for anything else. */
    getPosition(index) {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            case 3: return this.w;
            default: return NaN;
        }
    }

    /** Point + Vector = Point: move this point by the displacement v. */
    plusVector(v) {
        return new Point4f(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    /** Point - Vector = Point: move this point by the opposite of v. */
    minusVector(v) {
        return new Point4f(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    /**
     * Point - Point = Vector: the displacement that takes `p` to `this`.
     * Used for triangle edge vectors, e.g. v = p1.minusPoint(p0).
     */
    minusPoint(p) {
        return new Vector4f(this.x - p.x, this.y - p.y, this.z - p.z, this.w - p.w);
    }

    // Point + Point is not defined in affine geometry, so there is no method for it.

    toString() {
        return `Point4f(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
    }
}

export class Vector4f {
    /** A direction/displacement. w defaults to 0 (homogeneous vector). */
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /** Vector + Vector = Vector: component-wise sum (tip-to-tail). */
    plusVector(v) {
        return new Vector4f(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    /** Vector - Vector = Vector: component-wise difference. */
    minusVector(v) {
        return new Vector4f(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    /** Vector + Point = Point: same result as p.plusVector(this). */
    plusPoint(p) {
        return new Point4f(this.x + p.x, this.y + p.y, this.z + p.z, this.w + p.w);
    }

    // Vector - Point is undefined, so there is no method for it.

    /** Vector * scalar: scales the length by |s| (and reverses direction if s < 0). */
    byScalar(s) {
        return new Vector4f(this.x * s, this.y * s, this.z * s, this.w * s);
    }

    /** -v: same length, opposite direction. */
    negate() {
        return new Vector4f(-this.x, -this.y, -this.z, -this.w);
    }

    /** |v| = sqrt(v . v). (w is 0 for vectors so it does not change the result.) */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    /**
     * Unit vector in the same direction: v / |v|.
     * A zero-length vector has no direction, so a zero vector is returned
     * instead of dividing by zero and producing NaNs.
     */
    normal() {
        const len = this.length();
        if (len === 0) return new Vector4f(0, 0, 0, 0);
        return this.byScalar(1 / len);
    }

    /** PROVIDED: dot product. */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    /** PROVIDED: 3D cross product (w is ignored and the result has w = 0). */
    cross(v) {
        return new Vector4f(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x,
            0
        );
    }

    toString() {
        return `Vector4f(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
    }
}
