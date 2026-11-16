# CG Assignment 3 — Animation and Textures (Babylon.js)

Assignment 3 for the Babylon.js Computer Graphics module: an articulated figure, hierarchical animation and texture coordinates. It goes with the Week 5 notes (hierarchical animation and textures), and follows the Assignment 1 and 2 packages.

This package contains:

- `docs/ASSIGNMENT_3.md` — student-facing assignment specification.
- `docs/model-answer-screenshot.png` — expected result.
- `starter/` — starter repository to distribute to students.

## Teaching design

Babylon.js provides the scene, camera, lights and render loop, and the Assignment 2 solids are provided as `ball()` and `bone()` helpers. Students write:

- the articulated figure as a tree of `TransformNode`s (Part A, 30%);
- the motion: circular path, facing, walk cycle and globe rotation, all computed from elapsed time (Part B, 30%);
- texture coordinates for a cube and a sphere, plus wrapping and filtering (Part C, 20%);
- explanatory comments (Part D, 10%).
- a demo video of at most 90 seconds showing the completed code and the output (Part E, 10%).

Babylon.js's own animation and skeleton classes are excluded, so the transformations are the student's own work. The pelvis, chest, neck and head are provided as the worked reference.

## Running

Because ES modules are used, run a local web server from the `starter` directory:

    python -m http.server 8000 (Windows)
    python3 -m http.server 8000 (macOS)

Then open `http://localhost:8000`. Drag to orbit, G switches between walking and sliding, Space pauses.

## Assets

`assets/world.png` and `assets/sign.png` are generated images, so the package carries no third-party image rights. Students may substitute their own images.

## Babylon.js version

Loaded from the Babylon.js UMD CDN, as in the earlier assignments. Tested headlessly against Babylon.js 8.56 (WebGL2).


