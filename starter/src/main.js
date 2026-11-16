/*
 * main.js — PROVIDED. Do not modify.
 *
 * Builds the scene, loads the textures, and calls your code every frame:
 *
 *     buildFigure(scene)                    — figure.js   (Part A)
 *     updateFigure(figure, t, options)      — animation.js (Part B)
 *     updateGlobe(globe, t)                 — animation.js (Part B)
 *     drawTexturedCube(buf)                 — textures.js  (Part C)
 *     drawTexturedSphere(buf, r, sl, sg)    — textures.js  (Part C)
 *     configureTexture(texture, kind)       — textures.js  (Part C)
 *
 * Controls: drag to orbit, scroll to zoom, G toggles the walk, Space pauses.
 */

import { GeometryBuffer } from "./geometry.js";
import { ground, joint } from "./shapes.js";
import { buildFigure } from "./figure.js";
import { updateFigure, updateGlobe } from "./animation.js";
import { drawTexturedCube, drawTexturedSphere, configureTexture } from "./textures.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.05, 0.06, 0.09, 1);

const camera = new BABYLON.ArcRotateCamera(
    "camera", BABYLON.Tools.ToRadians(215), BABYLON.Tools.ToRadians(72), 13,
    new BABYLON.Vector3(0, 2.2, 0), scene);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 6;
camera.upperRadiusLimit = 45;
camera.wheelPrecision = 12;

const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.6, -1, 0.5), scene);
sun.intensity = 0.9;
const fill = new BABYLON.HemisphericLight("fill", new BABYLON.Vector3(0, 1, 0), scene);
fill.intensity = 0.45;
fill.groundColor = new BABYLON.Color3(0.1, 0.1, 0.12);

ground(scene, 20, 1);

const problems = [];

/* ---------------- Part A: the figure ---------------- */

let figure = null;
try {
    figure = buildFigure(scene);
    if (!figure || !figure.root) throw new Error("buildFigure() did not return { root, joints }");
} catch (err) {
    problems.push("figure.js: " + err.message);
    console.error(err);
}

/* ---------------- Part C: textured meshes ---------------- */

function buildTextured(name, draw, url, kind, position, scale) {
    try {
        const buf = new GeometryBuffer();
        draw(buf);
        const mesh = buf.toMesh(name, scene);
        if (!mesh) throw new Error("no triangles emitted");

        const mat = new BABYLON.StandardMaterial(name + "-mat", scene);
        const texture = new BABYLON.Texture(url, scene);
        configureTexture(texture, kind);
        mat.diffuseTexture = texture;
        mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        mesh.material = mat;
        mesh.position = position;
        if (scale) mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
        return mesh;
    } catch (err) {
        problems.push(`textures.js (${name}): ${err.message}`);
        console.error(err);
        return null;
    }
}

// The globe sits in the middle of the scene, on a node that spins it.
const globeSpin = joint(scene, "globeSpin", null, new BABYLON.Vector3(0, 2.6, 0));
const globe = buildTextured("globe", b => drawTexturedSphere(b, 1.6, 48, 32),
    "assets/world.png", "map", BABYLON.Vector3.Zero());
if (globe) {
    globe.parent = globeSpin;
    globe.rotation.x = -Math.PI / 2;   // the sphere's poles run along z; stand it up
}

buildTextured("sign", drawTexturedCube, "assets/sign.png", "sign",
    new BABYLON.Vector3(6.5, 1.2, 0), 1.2);

/* ---------------- animation loop ---------------- */

const state = { walk: true, paused: false, t: 0 };
const status = document.getElementById("status");

function showStatus() {
    if (problems.length > 0) {
        status.textContent = problems.join(" · ");
        status.classList.add("warn");
    } else {
        status.textContent = `G: ${state.walk ? "walking" : "sliding"} · Space: ${state.paused ? "paused" : "running"} · drag to orbit`;
    }
}

window.addEventListener("keydown", event => {
    const k = event.key.toLowerCase();
    if (k === "g") state.walk = !state.walk;
    if (k === " ") { event.preventDefault(); state.paused = !state.paused; }
    showStatus();
});

scene.onBeforeRenderObservable.add(() => {
    if (!state.paused) state.t += engine.getDeltaTime() / 1000;   // seconds
    try {
        if (figure) updateFigure(figure, state.t, { walk: state.walk });
        if (globe) updateGlobe(globeSpin, state.t);
    } catch (err) {
        if (!problems.some(p => p.startsWith("animation.js"))) {
            problems.push("animation.js: " + err.message);
            console.error(err);
            showStatus();
        }
    }
});

showStatus();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
