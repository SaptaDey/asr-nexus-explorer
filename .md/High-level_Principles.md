

## 1  │ High-level Principles


flowchart TD
    subgraph "🎯 Research-Quest Methodology"
        S1[🎯 Stage 1<br/>Initialization<br/>📝 Task Definition] 
        S2[🔍 Stage 2<br/>Decomposition<br/>📊 Multi-Dimensional Analysis]
        S3[💡 Stage 3<br/>Hypothesis Planning<br/>🧠 AI-Generated Theories]
        S4[📈 Stage 4<br/>Evidence Integration<br/>🔬 Bayesian Updates]
        S5[✂️ Stage 5<br/>Pruning & Merging<br/>⚡ Graph Optimization]
        S6[🎯 Stage 6<br/>Subgraph Extraction<br/>🚀 High-Value Pathways]
        S7[📝 Stage 7<br/>Composition<br/>📋 Narrative Generation]
        S8[🔍 Stage 8<br/>Reflection<br/>✅ Quality Audit]
    end
    
    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8
    S8 -.-> S1
    
    style S1 fill:#ffebee
    style S2 fill:#f3e5f5
    style S3 fill:#e8f5e8
    style S4 fill:#e1f5fe
    style S5 fill:#fff3e0
    style S6 fill:#fce4ec
    style S7 fill:#e0f2f1
    style S8 fill:#f1f8e9



graph TD
    A[🎯 Stage 1: Initialization] --> B[🔍 Stage 2: Decomposition]
    B --> C[💡 Stage 3: Hypothesis Generation]
    C --> D[📊 Stage 4: Evidence Integration]
    D --> E[✂️ Stage 5: Pruning & Merging]
    E --> F[🎪 Stage 6: Subgraph Extraction]
    F --> G[📝 Stage 7: Composition]
    G --> H[🔍 Stage 8: Reflection & Audit]
    
    A1[Task Understanding<br/>Multi-dimensional Setup] --> A
    B1[Problem Breakdown<br/>Systematic Analysis] --> B
    C1[Competing Theories<br/>Impact Assessment] --> C
    D1[Bayesian Updates<br/>Statistical Validation] --> D
    E1[Graph Optimization<br/>Quality Control] --> E
    F1[High-Value Pathways<br/>Focus Extraction] --> F
    G1[Research Narrative<br/>Publication Ready] --> G
    H1[Quality Assurance<br/>Scientific Validation] --> H
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#e0f2f1
    style G fill:#f1f8e9
    style H fill:#fff8e1


| Principle                                                                                                                                                                                         | Implementation detail                                                                                                                                             | Source(s) |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Single-tool rule** – every Gemini request must include **Thinking** *plus exactly one other* capability flag (Structured Outputs, Search Grounding, Function Calling, Code Execution, Caching). | The Node.js orchestrator therefore emits a *series* of micro-calls whenever a stage needs more than one external tool (e.g. Search ➜ Code-Exec ➜ Structured-Out). |           |
| **Deterministic graph integrity** requires that *any* payload which alters the Cytoscape store arrives via **Structured Outputs** in a formally-validated JSON schema.                            | Stages 1, 2, 3a, 4b, 5, 6, 7 all terminate with Structured outputs.                                                                                               |           |
| **Thinking is always enabled.** It co-exists with every other flag and is the sole flag when only internal Bayesian or audit reasoning is required (e.g. pruning loop).                           | Stage 5 first pass (posterior filter) uses Thinking only.                                                                                                         |           |
| **Caching header** (`x-goog-cache: true`) is attached to *all* calls once the prompt size exceeds ≈ 200 k tokens. Cache key = SHA-256(stage ID + graph hash).                                     | Cross-cutting optimisation.                                                                                                                                       |           |

---

## 2  │ Merged Capability Matrix

| ASR-GoT Stage / Micro-pass                | Cognitive / Operational Task                                                                                     | Gemini Flag for **this** request<sup>†</sup> | Rationale & Orchestration Notes                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| **1 Initialisation**                      | Emit canonical JSON for root node *n₀* (ID, confidence vector C₀, timestamps, layer ID, metadata P1.12)          | **Structured Outputs**                       | Guarantees schema compliance before any external retrieval begins.               |
| **2 Decomposition**                       | Generate array of dimension nodes (Scope, Constraints, …) with prior confidence vectors and bias flags.          | **Structured Outputs**                       | Same reason; keeps context lightweight (no web calls yet).                       |
| **3 Hypothesis Generation – pass A**      | Draft 3–5 hypotheses per dimension; attach falsifiability criteria (P1.16) & impact score (P1.28).               | **Structured Outputs**                       | Deterministic ingestion; still no external IO.                                   |
| **3 Planning – pass B**                   | Collect *high-level* domain facts & recent reviews to refine experiment plans.                                   | **Search Grounding**                         | Requires real-time retrieval; no code exec yet.                                  |
| **3 Planning – pass C**                   | Decide which bespoke micro-service (e.g. `run_lit_review`, `queue_lab_protocol`) to call next.                   | **Function Calling**                         | Lets Gemini select the proper back-end function; returns `{"name","arguments"}`. |
| **4 Evidence-integration cycle – step 1** | Query Perplexity for targeted evidence supporting focus hypothesis *h\**.                                        | **Search Grounding**                         | Supplies fresh URLs, DOIs, PDFs.                                                 |
| **4 Evidence-integration – step 2**       | If raw tables/CSVs are present, compute effect sizes, CIs, statistical power (P1.26).                            | **Code Execution**                           | Executes Python/R snippets; outputs JSON summary + PNG/SVG figures.              |
| **4 Evidence-integration – step 3**       | Post retrieved evidence nodes and typed edges (supportive, causal, temporal).                                    | **Structured Outputs**                       | Updates Cytoscape; closes micro-cycle.                                           |
| **5 Pruning / Merging – pass A**          | Pure Bayesian update: drop nodes with E\[ C ] < 0.2 and low impact; shortlist merge-candidates (semantic ≥ 0.8). | **Thinking** *(only)*                        | No external tool needed – internal reasoning suffices.                           |
| **5 Pruning / Merging – pass B**          | Persist `prune_ids` and `merge_map` to graph store.                                                              | **Structured Outputs**                       | Deterministic graph mutation.                                                    |
| **6 Sub-graph Extraction**                | Compute centrality, MI and impact metrics; rank top sub-graphs for user view/export.                             | **Code Execution**                           | Runs NetworkX (or JS) analyses on graph JSON; returns ranked list.               |
| **6 Extraction – save results**           | Emit `SubgraphSet` JSON with node IDs & scores.                                                                  | **Structured Outputs**                       | Feed UI highlighter.                                                             |
| **7 Composition**                         | Draft human-readable narrative blocks (Abstract, Findings, Figures, Vancouver refs) **without raw MD**.          | **Structured Outputs**                       | Returns array `{title, html_block}` for live preview.                            |
| **8 Reflection / Audit – pass A**         | Traverse entire graph; tick checklist (coverage, biases, power, causality).                                      | **Thinking** + **Code Execution**            | Code exec runs automated audit script; Thinking reasons about uncovered issues.  |
| **8 Reflection – pass B**                 | Emit `AuditReport` JSON & recommended next actions.                                                              | **Structured Outputs**                       | Final deterministic artefact.                                                    |
| **Session-wide**                          | Persist / retrieve giant prompt segments ≥ 1 M tokens.                                                           | **Caching**                                  | Activated automatically once graph size explodes.                                |

† *Every request also sets `"tools":["THINKING", "<single-capability>"]`.*

---

## 3  │ Execution Flow Diagram (textual)

```
Stage 1  ─►  Stage 2  ─►  Stage 3A  ─►  3B  ─►  3C
  │           │           │           │      ╰─┬─┐
  ▼           ▼           ▼           ▼        │ │
Structured  Structured  Structured  Search   Function
Outputs     Outputs     Outputs     Ground-   Calling
                                      ing
                                                 │
                                                 ▼
Evidence-loop ──┬── Search Grounding
                ├── Code Execution
                └── Structured Outputs
                      ↑
                      │  (repeat until convergence)
                      ▼
Stage 5  Thinking → Structured
Stage 6  Code Exec → Structured
Stage 7  Structured
Stage 8  Thinking+Code Exec → Structured
```

---

## 4  │ Conflict Resolution & Improvements

* **Capability order** – Draft A placed *Search Grounding* ahead of *Structured Outputs* for Stages 1–2; Draft B used only Structured.  Searching before the graph even exists adds latency without benefit, so the merged plan adopts **Structured Outputs only** for Stages 1–2.
* **Stage 3 split** – Draft B’s two-pass approach (Structured then Search) is retained; it keeps early hypothesis JSON clean, then enriches with evidence.
* **Pruning logic** – Draft A covered pruning via Structured-outputs; Draft B delegated pure inference to Thinking.  The merge combines both: *Thinking-only* pass for statistics, followed by a *Structured* pass that writes mutations.
* **Audit** – integrated Code-Execution into Stage 8 (from Draft A) plus Thinking (from B) to satisfy both the automatic checklist and reflective reasoning.

---

## 5  │ Next Engineering Tasks

1. **Implement orchestrator FSM** with per-stage capability mapping exactly as table § 2.
2. **Stub micro-services** referenced in Function-Calling (e.g. `queue_lab_protocol`).
3. **Write JSON schema validators** for every Structured-Output payload (RootNode, DimensionArray, HypothesisBatch, EvidenceBatch, PruneMergeSet, SubgraphSet, ReportChunk\[], AuditReport).
4. **Add exponential-backoff and jitter** to Search-Grounding calls to respect Perplexity rate limits.
5. **Unit-test** each stage with mocked Gemini responses; ensure no request breaches the single-tool rule.

---

