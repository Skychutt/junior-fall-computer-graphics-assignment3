# Computer Graphics — Assignment 3
## Animation and Textures

### Purpose

Assignment 2 built single objects out of triangles. This assignment puts objects **together** and makes them **move**, then paints images onto them.

You will build an articulated figure as a tree of nodes, animate it so that it walks around a circle, and give a cube and a sphere texture coordinates so that an image can be painted on them.

As before, Babylon.js provides the window, camera, lights and render loop. The solids from Assignment 2 are provided this time, so you can concentrate on the hierarchy, the motion and the texture mapping. You may **not** use Babylon.js's `Animation`, `AnimationGroup` or skeleton classes for the assessed work: you compute the transformations yourself, every frame.

---

## Learning outcomes

After completing this assignment you should be able to:

- describe an object as a hierarchy of nodes, each with its own local coordinate system;
- explain how a transformation at one node affects everything below it;
- choose sensible joints, rest poses and rotation axes for an articulated figure;
- compute a position and an orientation as a function of time;
- animate using elapsed time, so that motion is frame-rate independent;
- assign texture coordinates to a surface, including the cylindrical mapping of a sphere;
- explain texture wrapping and filtering, and choose them appropriately.

---

# 1. Provided environment

```text
starter/
├── index.html
├── assets/
│   ├── world.png          a stylised map, for the globe
│   └── sign.png           a geometric image, for the cube
└── src/
    ├── main.js            PROVIDED  scene, camera, lights, loop (do not modify)
    ├── shapes.js          PROVIDED  joint(), ball(), bone(), ground()
    ├── geometry.js        PROVIDED  GeometryBuffer, now with buf.uv()
    ├── math.js            PROVIDED  Point4f and Vector4f
    ├── solids.js          PROVIDED  the Assignment 2 solids
    ├── figure.js          PART A    the articulated figure
    ├── animation.js       PART B    the motion
    ├── textures.js        PART C    texture coordinates
    └── style.css
```

Run it as before: start a local web server in the `starter` folder (for example `python3 -m http.server 8000`) and open `http://localhost:8000`.

The starter shows the pelvis, chest, neck and head, which are done for you as a worked reference. The top bar lists anything that is not working yet.

| Control | Effect |
|---|---|
| drag / scroll | orbit and zoom the camera |
| G | switch between the walking and sliding versions |
| Space | pause |

---

# 2. Scene graphs

A scene is a tree of nodes. Each node has a position, a rotation and a scale **relative to its parent**, so the transformations accumulate down the tree: a hand is placed in the forearm's coordinates, the forearm in the upper arm's, the upper arm in the chest's, and the chest in the world's.

Babylon.js gives you this directly:

```javascript
const node = new BABYLON.TransformNode("elbow", scene);
node.parent = upperArm;                          // attach it to the tree
node.position = new BABYLON.Vector3(0, 0, 0.6);  // in the parent's coordinates
node.rotation.x = angle;                         // rotates everything below it
```

This is the same idea as the matrix stack in the notes: going down the tree applies another matrix, and coming back up removes it. Babylon.js keeps the stack for you.

Three helpers are provided in `shapes.js`:

| Helper | What it makes |
|---|---|
| `joint(scene, name, parent, position)` | an empty node: a place where parts are attached and rotated |
| `ball(scene, name, parent, radius, colour)` | a sphere centred on its parent node |
| `bone(scene, name, parent, radius, length, colour)` | a cylinder running along the node's local +z axis |

A bone runs along its own +z, so the joint at its far end goes at local `(0, 0, length)`, whatever rotations are applied above it.

---

# 3. Part A — The articulated figure (30%)

Complete `buildFigure()` in `src/figure.js` to produce this hierarchy:

```text
root (pelvis)
  ├─ chest
  │    ├─ neck ─ head                        (provided)
  │    ├─ leftShoulder  ─ upper arm ─ leftElbow  ─ forearm ─ hand
  │    └─ rightShoulder ─ upper arm ─ rightElbow ─ forearm ─ hand
  ├─ leftHip  ─ thigh ─ leftKnee  ─ shin ─ foot
  └─ rightHip ─ thigh ─ rightKnee ─ shin ─ foot
```

### Requirements

- Each limb is attached to its parent, not positioned in world coordinates. Moving the pelvis must move the whole figure; rotating a shoulder must carry the whole arm.
- Write the arm once as a function and call it twice, with a side of +1 and −1. Do the same for the legs. Copy-and-pasted limbs lose marks.
- Keep the fixed "hang the limb downwards" rotation on the **bone**, and leave the **joint** above it at zero, so that a joint angle of 0 is the rest pose.
- Return `{ root, joints }` with the eight joint names `main.js` expects.

---

# 4. Part B — Animation (30%)

Complete `src/animation.js`.

### B1. Travelling in a circle

Given the time `t` in seconds, compute the position on a circle of radius R, one lap every `LAP_SECONDS`:

```text
θ = 2π t / LAP_SECONDS
x = R cos θ,   z = R sin θ
```

### B2. Facing the right way

A figure that moves round a circle without turning slides sideways, like the train in the notes. Work out the direction of travel — the derivative of the position — and set `root.rotation.y` so that the figure's local +z points along it.

State the angle you used, and where it comes from, in a comment.

When `options.walk` is false, leave the rotation at 0 so that the marker can see the difference by pressing G.

### B3. The walk cycle

Swing the limbs so that the figure walks:

- drive the swing from a sine wave whose phase advances with θ, so that the steps stay in step with the distance travelled;
- opposite arm and leg swing together;
- a knee or an elbow bends **one way only**: think about how to keep the angle on one side of zero;
- when `options.walk` is false, every joint angle is 0.

### B4. The globe

Rotate the globe about its own axis, once every 20 seconds.

### Requirement: frame-rate independence

Every motion must be computed from the time you are given, never by adding a fixed amount per frame. The figure must walk at the same speed on a machine drawing 30 frames a second and one drawing 120.

---

# 5. Part C — Texture coordinates (20%)

Complete `src/textures.js`. `buf.uv(u, v)` sets the texture coordinate for the vertices that follow, in the same way as `buf.normal(n)`.

### C1. The cube

Give each of the six faces the whole image. Each face is a square, so its corners take the corners of the image. Choose the order so that the image is the right way up and the same way round on every face, and say which order you chose.

### C2. The sphere

The sphere is built from two parameters, so the mapping is direct: this is the cylindrical (equirectangular) projection used for world maps.

- u comes from the longitude θ (which runs from −π to π);
- v comes from the latitude φ (which runs from −π/2 to π/2).

Both must end up in the range 0 to 1. Give the two expressions, and explain them in a comment.

### C3. Wrapping and filtering

In `configureTexture()`, choose for each image:

- a sampling mode — nearest for hard-edged, geometric images, bilinear for smooth ones;
- `wrapU` and `wrapV` — wrap or clamp.

Explain both choices in comments. Think about what the map needs going round the equator, and what it needs at the poles.

---

# 6. Part D — Comments (10%)

Write a clear comment above every function you complete, explaining what it does and why. For the animation, include the maths: where the angle comes from, and why the phase is tied to θ.

---

# 7. Part E — Demo video (10%)

Include a screen recording of **no more than 90 seconds** that shows:

1. **Your completed code.** Scroll through the functions you wrote in `figure.js`, `animation.js` and `textures.js`.
2. **The output.** Run the project and show:
   - the figure walking at least one full lap of the circle;
   - pressing **G** to switch between walking and sliding;
   - the rotating globe and the textured cube, zoomed in close enough to see the textures.

# 8. Checklist

- [ ] The figure is complete, and one change to the pelvis moves all of it.
- [ ] Pressing G shows a clear difference between walking and sliding.
- [ ] The figure faces the way it is travelling, and its feet do not obviously skate.
- [ ] The globe turns steadily about its own axis.
- [ ] The map is the right way up on the globe, with no upside-down or mirrored text, and no visible seam at the poles.
- [ ] The sign image is crisp on the cube.
- [ ] No Babylon.js animation or skeleton classes are used.
- [ ] The demo video is no longer than 90 seconds and shows the code and the output listed in Part E.

---

# 9. Submission

Submit a zip of your project folder, keeping the structure above, with a README giving your name, student ID, how to run it, and any known limitations.

**Deadline:** Sunday, 15 November 2026..

---

# 10. Academic integrity

You may consult the lecture material, the Babylon.js documentation and general programming references. The hierarchy, the animation and the texture coordinates must be your own work. You may be asked to explain your code.

---

# 11. Assessment rubric — 20 marks

| Criterion | Marks |
|---|---:|
| **Part A:** hierarchy correct, limbs parameterised, sensible joints and rest pose | 6 |
| **Part B:** circular path, correct facing, convincing walk cycle, frame-rate independent, globe rotation | 6 |
| **Part C:** cube and sphere texture coordinates, sensible wrapping and filtering | 4 |
| **Part D:** comments and explanation | 2 |
| **Part D:** Demo video (≤ 90 seconds, shows the completed functions and the output) | 2 |
| **Total** | **20** |

### Performance descriptors

**Excellent (18–20)** — hierarchy clean and parameterised; walk convincing and clearly time-based; textures correct with no seams; comments explain the maths.

**Good (14–17)** — everything works with minor faults: a limb swinging the wrong way, a knee bending backwards, or a slightly wrong texture orientation.

**Satisfactory (10–13)** — the figure is built and moves, but the hierarchy is partly flat, the motion is frame-rate dependent, or the texture mapping is wrong in places.

**Below 10** — major parts missing, or Babylon.js animation classes used in place of your own.

---

# 12. Key principle

> **Position is a function of time; every part is positioned relative to its parent.**
