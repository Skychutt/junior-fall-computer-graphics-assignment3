/* Part C: generate triangle positions, normals and texture coordinates. */
import { Point4f, Vector4f } from "./math.js";
const ORIGIN = new Point4f(0, 0, 0);

/**
 * Each face gets the entire image. From outside, its corners are bottom-left,
 * bottom-right, top-right, top-left with UVs (0,0),(1,0),(1,1),(0,1).
 * Side faces use +y as image-up; top uses -z and bottom uses +z.
 * Emit triangles (0,1,2),(0,2,3). The provided LH winding uses the outward
 * normal (p2-p0) cross (p1-p0). Corners repeat because neighbouring faces have
 * different normals and UVs, even when they share a geometric position.
 */
export function drawTexturedCube(buf) {
    const faces = [
        [[-1,-1,-1], [ 1,-1,-1], [ 1, 1,-1], [-1, 1,-1]], // -z
        [[ 1,-1, 1], [-1,-1, 1], [-1, 1, 1], [ 1, 1, 1]], // +z
        [[-1,-1, 1], [-1,-1,-1], [-1, 1,-1], [-1, 1, 1]], // -x
        [[ 1,-1,-1], [ 1,-1, 1], [ 1, 1, 1], [ 1, 1,-1]], // +x
        [[ 1, 1, 1], [-1, 1, 1], [-1, 1,-1], [ 1, 1,-1]], // +y
        [[ 1,-1,-1], [-1,-1,-1], [-1,-1, 1], [ 1,-1, 1]]  // -y
    ];
    const uv = [[0,0], [1,0], [1,1], [0,1]];
    for (const face of faces) {
        const points = face.map(p => new Point4f(...p));
        const v = points[1].minusPoint(points[0]);
        const w = points[2].minusPoint(points[0]);
        buf.normal(w.cross(v).normal()); // One outward unit normal for this flat face.
        // Split the square along diagonal 0--2; copy each corner's UV with it.
        for (const k of [0, 1, 2, 0, 2, 3]) {
            buf.uv(...uv[k]);
            buf.vertex(points[k]);
        }
    }
}

/**
 * Sample theta in [-pi,pi] and latitude phi in [-pi/2,pi/2]. As in Week 4,
 * direction=(cos(phi)cos(theta), cos(phi)sin(theta), sin(phi)); position is
 * radius*direction, and the smooth unit normal is direction itself.
 * Week 7's range conversion gives u=theta/(2*pi)+1/2 and v=phi/pi+1/2.
 * With this starter's +sin(theta) geometry and its -pi/2 X stand-up rotation,
 * increasing theta runs right-to-left when viewed from outside in the LH scene.
 * Use imageU=1-u=1/2-theta/(2*pi), keeping v unchanged, so the map (and any
 * text on it) reads the right way round rather than being mirrored.
 * Duplicate the seam at u=0 and u=1 so no triangle interpolates across the
 * entire map. Pole vertices retain each slice's UVs. Skip the zero-area
 * triangle at each pole, leaving closed triangle fans.
 * Each input grid cell is subdivided 4x4 by default, using the same parametric
 * formula. The supplied 48x32 grid thus becomes 192x128 (48,768 triangles),
 * making the globe's silhouette smooth in close-up without changing main.js.
 * refinement=1 retains the original grid for comparisons or slower devices.
 */
export function drawTexturedSphere(buf, radius, nSlices, nSegments, refinement = 4) {
    // More longitude/latitude samples make the outline smoother when zoomed in.
    nSlices *= refinement;
    nSegments *= refinement;
    for (let i = 0; i < nSlices; i++) {
        for (let j = 0; j < nSegments; j++) {
            const corners = [
                [i / nSlices, j / nSegments],
                [i / nSlices, (j + 1) / nSegments],
                [(i + 1) / nSlices, (j + 1) / nSegments],
                [(i + 1) / nSlices, j / nSegments]
            ];
            const triangles = [];
            // At a pole, two corners coincide: emit only the other triangle.
            if (j < nSegments - 1) triangles.push(0, 1, 2);
            if (j > 0) triangles.push(0, 2, 3);
            for (const k of triangles) {
                const [u, v] = corners[k];
                const theta = (u - 0.5) * 2 * Math.PI;
                const phi = (v - 0.5) * Math.PI;
                // A sphere's smooth normal points from its centre to the vertex.
                const n = new Vector4f(Math.cos(phi) * Math.cos(theta),
                    Math.cos(phi) * Math.sin(theta), Math.sin(phi));
                buf.normal(n);
                buf.uv(1 - u, v); // Match the map's left/right direction after standing the sphere up.
                buf.vertex(ORIGIN.plusVector(n.byScalar(radius)));
            }
        }
    }
}

/**
 * Nearest sampling keeps the sign's geometric edges crisp. Clamp both axes
 * so each face shows one image without sampling pixels from its opposite edge.
 * Bilinear sampling blends neighbouring map texels. Wrap longitude around the
 * equator; clamp latitude so north and south poles never blend together.
 */
export function configureTexture(texture, kind) {
    const T = BABYLON.Texture;
    const isMap = kind === "map";
    texture.updateSamplingMode(isMap ? T.BILINEAR_SAMPLINGMODE : T.NEAREST_SAMPLINGMODE);
    texture.wrapU = isMap ? T.WRAP_ADDRESSMODE : T.CLAMP_ADDRESSMODE;
    texture.wrapV = T.CLAMP_ADDRESSMODE;
    // Preserve map detail at oblique angles near the edge of the globe.
    if (isMap) texture.anisotropicFilteringLevel = 8;
    return texture;
}
