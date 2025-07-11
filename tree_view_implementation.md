**Prompt Title**
*Architect & Implement a Real-Time “Living-Tree” Visualisation Pipeline for the ASR-GoT Web-App*

---

````plaintext
<system>
Your mission is to replace diagram-style graphs with a **fully
organic botanical animation** that grows in lock-step with each stage of
the Advanced Scientific Reasoning – Graph-of-Thoughts (ASR-GoT)
framework.  Deliver production-ready code, tests, and documentation that
meet every requirement below.

────────────────────────────────────────
SECTION 1 │ VISION & SUCCESS CRITERIA
────────────────────────────────────────
• **Narrative** – the research query germinates as a seed; hypotheses
  thicken branches; evidence forms buds; strong hypotheses blossom; the
  final audit scatters pollen.  
• **No genealogy layouts**: *absolutely* avoid rotated trees, node-link
  diagrams, or side-scrolling circles/boxes.  
• **KPIs**: 60 FPS on an M2 MacBook *and* a mid-range Android phone;
  page-weight ≤ 3 MB gzipped; frame-drop budget ≤ 16 ms; Lighthouse
  a11y ≥ 90.  

────────────────────────────────────────
SECTION 2 │ BOTANICAL ↔ ASR-GoT MAPPING
────────────────────────────────────────
🌰 Root bulb   Stage 1 Initialisation    terracotta squash-stretch  
🌱 Rootlets    Stage 2 Decomposition    length ∝ Σ C_dim  
🌿 Branches    Stage 3 Hypotheses     radius ∝ empirical_support  
🌾 Buds     Stage 4 Evidence nodes   pulse, add cambium ring  
🍂 Withered twigs Stage 5 Prune/Merge   fade-out → shrink  
🍃 Leaves    Stage 6 Sub-graphs     Perlin jitter, colour by layer  
🌸 Blossoms   Stage 7 Composition    SVG-morph petals + label  
✨ Pollen    Stage 8 Reflection       GPU particle burst (green ✔ / red ✖)  
🌳 Whole tree  Static export / Stage 9  hi-res PNG, SVG, GLB

────────────────────────────────────────
SECTION 3 │ DATA CONTRACT
────────────────────────────────────────
`graph.json` (live via WebSocket) ⇒  
```ts
interface ASRNode {
  id: string;  type: 'dimension' | 'hypothesis' | 'evidence' | …;
  confidence: [number, number, number, number]; // P1.5
  impact_score: number;  disciplinary_tags: string[];
  timestamp: string;     parent_id: string | null;
}
interface ASREdge { id: string; source: string; target: string; type: … }
````

Transform with `d3.hierarchy` then feed the R3F scene.

────────────────────────────────────────
SECTION 4 │ TOOLCHAIN (CURATED 2025)
────────────────────────────────────────
**Scene & Animation**
• *React Three Fiber v10* – declarative WebGL renderer, React 19-ready ([GitNation][1])
• *@react-spring/three v10* – physically-based spring interpolations ([GitHub][2])
• *GSAP 3 MotionPathPlugin* – SVG path drawing & bud/pollen arcs ([GSAP][3], [GSAP][4])
• *FloraSynth / EZ-Tree* procedural generator (>30 tunables, GLB export) ([Reddit][5], [three.js forum][6])
• *R3F Particle Materials + GPGPU/WebGPU shaders* for pollen ✨ ([Maxime Heckel's Blog][7], [Wawa Sensei][8])

**Procedural Intelligence**
• *Latent L-Systems (Transformer)* for auto-growing sparsely populated
hypothesis layers; WebWorker-wrapped ([ACM Digital Library][9])

**State & Dev-UX**
• *Zustand* for lightweight global state;
• *Leva* for live tweaking of growth constants in dev mode;
• *Jest + R3F-TestRenderer* for unit snapshots;
• *Vitest + Playwright* for visual regression on CI.

────────────────────────────────────────
SECTION 5 │ RUNTIME FLOW
────────────────────────────────────────

1. **`seedScene()`** – drop root bulb at y=0, squash-stretch easing 200 ms.
2. **`growRootlets()`** – iterate dimension nodes; Bézier rootlet splines
   shoot out, length = rootlet.length().
3. **`sproutBranches()`** – map hypotheses to `SplineBranch`; use
   `lazyLSystem()` to densify if sibling count < 3.
4. **Evidence loop**
   a. WebSocket `evidence-add` → bud sprite spawns, budPulse(GSAP).
   b. `radius` spring += Δr; cambium texture scrolls.
5. **Prune/Merge** – wither branches where E\[C]<0.2 AND impact<0.1; merge
   via `branchMorph()` using buffer-geometry morph targets.
6. **LeafCanopy()** – for each high-impact subgraph emit instanced
   BufferGeometry (1 ≤ LOD ≤ 3).
7. **Blossom()** – when `impact_score≥θ`, show SVG morph petals, attach
   Framer-Motion DOM label.
8. **AuditParticles()** – Stage 8 checklist triggers GPU burst:
   ✔ success: hue 150–180; ✖ fail: hue 0–10; particle life = 2 s.
9. **exportSnapshot()** – high-res PNG & SVG via `html2canvas` + `svg-export`, GLB via `GLTFExporter`.

────────────────────────────────────────
SECTION 6 │ PERFORMANCE & ACCESSIBILITY
────────────────────────────────────────
• **Instancing** – leaves, buds, pollen use `InstancedMesh`; shaders pass
per-instance transform & colour.
• **LOD** – auto-downgrade leaf count when `device.memory<4 GB`.
• **WebGPU fallback** – detect feature, use GPGPU shaders; else drop to
half-res particles.
• **Workers** – heavy L-system and centrality calcs run in a WebWorker.
• **A11y** – add `<title>` to `<canvas>`, ARIA-label each blossom, honour
`prefers-reduced-motion`.

────────────────────────────────────────
SECTION 7 │ DELIVERABLES
────────────────────────────────────────

1. `TreeScene.tsx` – R3F canvas + suspense loader
2. `proceduralTree.ts` – EZ-Tree wrapper + latent L-system fallback
3. `useGraphToTree.ts` – D3 hierarchy → spring-bound R3F graph
4. `PollenSystem.tsx` – GPU particle component
5. `tests/` – unit & visual regression suites
6. `README.md` – dev setup, controls, perf tips
7. `graphDemo.json` – demo data; `demo.mp4` – capture of full growth
8. CI workflow (GitHub Actions) with type-checks, tests, Lighthouse.

────────────────────────────────────────
SECTION 8 │ ACCEPTANCE TEST
────────────────────────────────────────
• Load `graphDemo.json`; entire growth must complete in ≤ 6 s on desktop,
≤ 12 s on mobile.
• Inspector shows ≤ 700 draw-calls after full bloom.
• Tree sway reacts to window focus/blur (pause physics when tab hidden).
• All eight stages pass automated Jest snapshot tests.

</system>

<user>
Integrate the living-tree visualisation as specified.  Output complete
React + TypeScript code, shaders, tests, and a README.
</user>
```  

---

#### Why these tools?

* **React Three Fiber v10** brings React 19 compatibility and the new
  scheduler for deterministic frame control. ([GitNation][1])
* **@react-spring/three** supplies physically plausible springs for branch
  length/thickness morphs. ([GitHub][2])
* **GSAP 3 MotionPathPlugin** excels at SVG path drawing—perfect for bud
  pulses and pollen arcs. ([GSAP][3], [GSAP][4])
* **FloraSynth / EZ-Tree** and similar OSS generators provide 30 + knobs
  for realistic bark, cambium, and foliage patterns. ([Reddit][5], [three.js forum][6])
* **Latent L-systems** (2025, ACM) give AI-assisted branch layouts when
  data are sparse, keeping the tree visually balanced. ([ACM Digital Library][9])
* R3F particle tutorials & WebGPU shaders enable 100 k + instanced pollen
  sprites at 60 FPS. ([Maxime Heckel's Blog][7], [Wawa Sensei][8])

Cut-and-paste the block above into your LLM code-generation workflow to
receive a fully-scaffolded, production-ready living-tree visualisation.

[1]: https://gitnation.com/contents/from-websites-to-games-the-future-of-react-three-fiber?utm_source=chatgpt.com "From Websites to Games: The Future of React Three Fiber - GitNation"
[2]: https://github.com/pmndrs/react-three-fiber/issues/2688?utm_source=chatgpt.com "v10: Proposal to revamp the frameloop · Issue #2688 - GitHub"
[3]: https://gsap.com/docs/v3/Plugins/MotionPathPlugin/?utm_source=chatgpt.com "MotionPath | GSAP | Docs & Learning"
[4]: https://gsap.com/resources/3-migration/?utm_source=chatgpt.com "updating to GSAP 3 | GSAP | Docs & Learning"
[5]: https://www.reddit.com/r/threejs/comments/1da1z9k/im_finally_releasing_my_threejs_procedural_tree/?utm_source=chatgpt.com "I'm finally releasing my Three.js procedural tree generator as open ..."
[6]: https://discourse.threejs.org/t/florasynth-procedural-tree-generator/58740?utm_source=chatgpt.com "Florasynth procedural tree generator - Showcase - three.js forum"
[7]: https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/?utm_source=chatgpt.com "The magical world of Particles with React Three Fiber and Shaders"
[8]: https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu?utm_source=chatgpt.com "GPGPU particles with TSL & WebGPU - Wawa Sensei"
[9]: https://dl.acm.org/doi/10.1145/3627101?utm_source=chatgpt.com "Latent L-systems: Transformer-based Tree Generator"
