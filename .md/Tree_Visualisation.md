
# **Design and Implement an Animated “Growing-Tree” Visualisation for the Advanced Scientific Reasoning – Graph-of-Thoughts (ASR-GoT) Web App**

---

### 1  │ SYSTEM DIRECTIVE

Your sole task is to embed a **continuous, data-bound, animated “growing-tree” metaphor** into the existing ASR-GoT React + Node.js application.
The animation must map **every stage and node of the eight-stage ASR-GoT framework (P1.0 – P1.29)** onto a living botanical scene that *grows* as reasoning progresses.

---

### 2  │ VISUAL METAPHOR SPECIFICATION

| ASR-GoT Concept                         | Botanical Analogue          | Visual Rules                                                                                          |
| --------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Root node n₀** (“Task Understanding”) | **Root bulb / soil anchor** | Appears instantly at Stage 1; warm terracotta colour.                                                 |
| **Dimension nodes (Stage 2)**           | **Primary rootlets**        | Radially emerge, length proportional to initial confidence ∑C\_dim.                                   |
| **Hypotheses (Stage 3)**                | **Main branches**           | Thickness ∝ C\_hypo, hue graduated by disciplinary tag palette.                                       |
| **Evidence nodes (Stage 4)**            | **Cambium rings + buds**    | Each new evidence blob enlarges the parent branch circumference by ΔC; Anime-style pulse on arrival.  |
| **Pruned / merged nodes (Stage 5)**     | **Withered twigs / grafts** | Faded opacity; merged branches fuse with spring-like easing.                                          |
| **High-impact subgraphs (Stage 6)**     | **Leaf clusters**           | Leaf size ∝ impact\_score; tooltip on hover reveals node metadata.                                    |
| **Composed findings (Stage 7)**         | **Blossoms**                | Pastel petals unfurl sequentially; text label appears beside bloom.                                   |
| **Reflections & audit ticks (Stage 8)** | **Falling pollen sparkles** | Emit golden particles when checklist item passes; crimson particles for violations requiring revisit. |

---

### 3  │ TECHNOLOGY STACK & LIBRARIES

1. **D3.js v7 hierarchical layout** for position calculation and continuous growth morphs ([d3js.org][1]).
2. **react-spring v10** (or `@react-spring/three`) to interpolate branch length, thickness and colour over time ([react-spring.dev][2]).
3. **Anime.js SVG utilities** for stroke-dash “line-drawing” of emergent branches and blossom morphs ([animejs.com][3]).
4. **Cytoscape.js back-channel** remains the canonical graph model; D3/react-spring subscribe to its “graph-updated” WebSocket events to animate deltas.
5. **TailwindCSS + CSS variables** to expose palette tokens (`--branch-hue`, `--leaf-sat`…) allowing instant theming with the existing gradient (#7E5BEF → #00D2FF).

---

### 4  │ DATA BINDING & STATE MANAGEMENT

* Every ASR-GoT node carries `metadata.layer_id`, `confidence`, `impact_score`, etc.
* Build a **selector hook** (`useTreeScene`) that transforms the Cytoscape JSON into a D3 *hierarchy* keyed on `parent_id`.
* Publish derived animated props:

  ```ts
  {
    length: spring(len(fn(confidence))),   // branch length
    radius: spring(rad(fn(confidence))),   // thickness
    color:  spring(colorScale(disciplinary_tags)),
    blossom: spring(impact_score > θ ? 1 : 0)
  }
  ```

---

### 5  │ ANIMATION TIMELINE (ALGORITHMIC)

1. **Stage 1 initialisation** → instant placement of root.
2. **Stage 2 decomposition** → `trail()` react-spring sequence: rootlets slide outwards with easing `easeInOutBack`.
3. **Stage 3 hypotheses** → branches grow upwards; Anime.js stroke-dashoffset draws SVG path, then react-spring expands thickness.
4. **Stage 4 evidence loop** → on every evidence event:

   * target branch pulses (rgba flash)
   * `radius` spring increases by Δr (set from Bayesian ΔC)
   * a bud sprite scales from 0 → 1 and turns into a mini-leaf or fruit icon depending on edge\_type (“Supportive” vs “Contradictory”).
5. **Stage 5 prune/merge** → withered branch fades to 20 % opacity; merged paths morph smoothly (Anime.js `morphTo`).
6. **Stage 6 extraction** → high-impact subtrees get leaf canopy: staggered leaf fade-in; leaves jitter subtly (friction 80).
7. **Stage 7 composition** → blossoms open via SVG path morph over 800 ms; blossom label slides in from right.
8. **Stage 8 reflection** → pollen particle system triggers for each checklist success; failures shake offending branch and hover-tooltip lists issues.

Frame-rate target: **60 FPS**; throttle D3 recalcs with `requestAnimationFrame` and memoise heavy computations.

---

### 6  │ INTERACTION DETAILS

* **Hover** node → popover with full P1.12 metadata (scrollable).
* **Click** branch → side-drawer focuses corresponding ASR-GoT stage, allowing manual edits.
* **Timeline scrubber** (bottom bar) lets user rewind / fast-forward reasoning history; animation plays transformations chronologically.
* **Colour-blind mode** toggles texture patterns on branches instead of hue alone.

---

### 7  │ EXPORT & ACCESSIBILITY

* “Export → HTML” embeds the **final SVG tree snapshot** (serialised with inline CSS) plus the Stage-7 narrative.
* Provide `aria-label` on every SVG path, leaf and blossom for screen-reader summaries of node content.
* Ensure animation honours `prefers-reduced-motion`; if true, fall back to instant state changes with subtle opacity transitions only.

---

### 8  │ PERFORMANCE & TESTING

* Implement **lazy-loading** of Anime.js only after Stage 2 begins.
* Unit-test D3 → react-spring mapper with Jest; visual regression tests via Storybook Chromatic snapshots at key growth checkpoints.
* Monitor main-thread frame budget with `performance.mark`; warn in console if frame drops > 16 ms sustained (link to P1.21 cost guardrails).

---

### 9  │ DELIVERABLES

* `TreeScene.tsx` (React component) + `tree-hooks.ts` (data adapters).
* `TreeStyles.css` (Tailwind layer directives).
* `tree-animation.spec.tsx` (tests).
* README section **“Animated Growing-Tree Visualisation”** explaining metaphor and developer API.


---

### REFERENCES

1. Bostock M. *D3 hierarchy tree layout documentation*. 2024 ([d3js.org][1])
2. *react-spring examples – fluid animations in React*. 2025 ([react-spring.dev][2])
3. *Anime.js SVG utilities for morphing & line-drawing*. 2025 ([animejs.com][3])

[1]: https://d3js.org/d3-hierarchy/tree?utm_source=chatgpt.com "Tree | D3 by Observable - D3.js"
[2]: https://www.react-spring.dev/examples?utm_source=chatgpt.com "Examples | React Spring"
[3]: https://animejs.com/documentation/svg/?utm_source=chatgpt.com "SVG | Anime.js | JavaScript Animation Engine"
