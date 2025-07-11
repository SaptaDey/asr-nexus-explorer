# **Cost‑Aware Orchestration Map for ASR‑GoT**

### *Multi‑Provider Pipeline: Sonar Deep Research • Gemini‑2.5‑Flash • Gemini‑2.5‑Pro*

---

## 1 │ Objectives

\* Guarantee scientific‑grade reasoning while **minimising \$ spend**.
\* Exploit the strength/price ratio of each model:

* **Sonar Deep Research** → lowest \$/token for *bulk literature & data harvest*.
* **Gemini‑2.5‑Flash** → cheapest LLM for *routine graph bookkeeping*.
* **Gemini‑2.5‑Pro** → premium reasoning & code execution for *critical logic*.
  \* Respect Gemini’s tool rule: **THINKING + exactly ONE** capability flag per request; prefer **BATCH\_API** when feasible.

---

## 2 │ Stage‑by‑Stage Routing & Capability Matrix

|  #                                                                                                          | ASR‑GoT Stage / Micro‑Pass             | Model (Edition)         | Capability Flag     | Batch Size           | Purpose                                                           | Output Payload       |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------- | ------------------- | -------------------- | ----------------------------------------------------------------- | -------------------- |
|  1                                                                                                          | **Initialisation**                     | Gemini Flash            | STRUCTURED\_OUTPUTS | ≤50 nodes            | Emit root *n₀* and parameter inventory.                           | `RootNode` JSON      |
|  2                                                                                                          | **Decomposition**                      | Gemini Flash            | STRUCTURED\_OUTPUTS | ≤50                  | Create dimension nodes + bias flags.                              | `DimensionArray`     |
|  3A                                                                                                         | **Hypothesis Generation – pass A**     | Gemini Flash            | STRUCTURED\_OUTPUTS | ≤25 per‑dim          | Draft 3‑5 hypotheses per dimension w/ metadata.                   | `HypothesisBatch`    |
|  3B                                                                                                         | **Hypothesis Planning – pass B**       | Gemini Pro              | SEARCH\_GROUNDING   | batched (10 queries) | Rapid facts & review snippets.                                    | `SearchResultSet`    |
|  3C                                                                                                         | **Micro‑service Decision**             | Gemini Pro              | FUNCTION\_CALLING   | 1                    | Select next back‑end fn (`run_lit_review`, `queue_lab_protocol`). | `CallSpec`           |
|  4.1                                                                                                        | **Evidence Harvest – Web Search**      | **Sonar Deep Research** | (internal search)   | 100 queries          | Crawl PubMed / arXiv; return up to 1 M tokens of docs.            | `EvidenceCorpus`     |
|  4.2                                                                                                        | **Evidence Harvest → Citation Batch**  | Sonar Deep Research     | (citation tokens)   | auto                 | Generate structured citations & DOIs.                             | `CitationBatch`      |
|  4.3                                                                                                        | **Evidence Analysis**                  | Gemini Pro              | CODE\_EXECUTION †   | batch ≤10 tables     | Compute effect sizes, CI, power (P1.26), produce figs.            | `StatsBundle + PNGs` |
|  4.4                                                                                                        | **Graph Update**                       | Gemini Pro              | STRUCTURED\_OUTPUTS | ≤200 nodes           | Attach Evidence nodes & typed edges (causal, temporal).           | `EvidenceBatch`      |
|  5A                                                                                                         | **Prune / Merge Reasoning**            | Gemini Flash            | THINKING (only)     | n/a                  | Bayesian filter: mark prune\_list & merge\_map.                   | internal list        |
|  5B                                                                                                         | **Graph Mutation Persist**             | Gemini Flash            | STRUCTURED\_OUTPUTS | 1                    | Apply prune\_list / merge\_map.                                   | `PruneMergeSet`      |
|  6A                                                                                                         | **Sub‑graph Metrics Calc**             | Gemini Pro              | CODE\_EXECUTION     | 1                    | Run NetworkX / GraphML centrality + MI scores.                    | `MetricsJSON`        |
|  6B                                                                                                         | **Sub‑graph Emit**                     | Gemini Flash            | STRUCTURED\_OUTPUTS | ≤10                  | Send ranked `SubgraphSet`.                                        | `SubgraphSet`        |
|  7                                                                                                          | **Narrative Composition**              | Gemini Pro              | STRUCTURED\_OUTPUTS | chunk 5 k tok        | Write HTML blocks with embedded figs & Vancouver refs.            | `ReportChunk[]`      |
|  8A                                                                                                         | **Audit Script**                       | Gemini Pro              | CODE\_EXECUTION     | 1                    | Auto‑check coverage, bias, power; produce scorecard.              | `AuditBundle`        |
|  8B                                                                                                         | **Audit Outputs**                      | Gemini Pro              | STRUCTURED\_OUTPUTS | 1                    | Persist `AuditReport` + next‑step recs.                           | `AuditReport`        |
|  S                                                                                                          | **Session‑wide Cache**                 | Gemini Flash / Pro      | CACHING             | n/a                  | Context slices ≥200 k tokens cached for 60 min.                   | n/a                  |
| † Gemini Pro CODE\_EXECUTION calls include *matplotlib* , *plotly*, *ggplot2* snippets to save PNG/SVG into the figure and incorporate in HTML with proper figure lagends. directory. |                                        |                         |                     |                      |                                                                   |                      |

---

## 3 │ Batch‑API Strategy

* **Gemini Batch** – send up to **5 prompts** in one HTTP call when processing multiple dimension groups or evidence tables; use separate requests for different capability flags (one batch = one flag).
* **Sonar Batch** – use 100‑query bundle @ \$5 per 1 000 queries ⇒ \$0.50 per 100; schedule throttle to meet rate limits.

---

## 4 │ Cost Dashboard (Rule‑of‑Thumb per 1 Run)

| Stage Cluster                                                         | Model | Prompt tks | Output tks | Price USD                                               | Notes                           |
| --------------------------------------------------------------------- | ----- | ---------- | ---------- | ------------------------------------------------------- | ------------------------------- |
| Init + Decomp                                                         | Flash | 12 k       | 5 k        | ≈ \$0.06 in / \$0.013 out                               |                                 |
| Hyp A                                                                 | Flash | 30 k       | 10 k       | ≈ \$0.09 in / \$0.025 out                               |                                 |
| Hyp B+C                                                               | Pro   | 25 k       | 8 k        | \~\$0.031 in / \$0.08 out                               |                                 |
| Evidence Search                                                       | Sonar | 500 k      | 0          | \$1.00 in                                               | \$5 per 1000 searches amortised |
| Evidence Citations                                                    | Sonar | 0          | 100 k      | \$0.80 out                                              |                                 |
| Evidence Stats                                                        | Pro   | 40 k       | 15 k       | \~\$0.05 in / \$0.15 out                                |                                 |
| Narrative                                                             | Pro   | 60 k       | 25 k       | \~\$0.075 in / \$0.25 out                               |                                 |
| Audit                                                                 | Pro   | 50 k       | 10 k       | \~\$0.062 in / \$0.10 out                               |                                 |
| **Total**                                                             |       | ≈ 717 k    | 173 k      | **≈ \$2.2 input + \$1.58 output + \$1.8 Sonar = \$5.6** |                                 |
| (Caching/storage billed separately at ≈ \$0.40 per hour for 1 M tok.) |       |            |            |                                                         |                                 |

---

## 5 │ Token & Thinking‑Budget Guidance

| Stage Group       | Prompt Size Envelope | thinking\_budget |
| ----------------- | -------------------- | ---------------- |
| Flash stages      | ≤ 40 k               | 2 048            |
| Pro search / plan | 40–60 k              | 4 096–8 192      |
| Pro evidence code | up to 200 k          | 16 384           |
| Report chunks     | ≤ 20 k each          | 2 048            |
| Audit             | 60–100 k             | 8 192            |

---

## 6 │ Request Skeletons

### Gemini Flash (Structured Outputs)

```http
POST /v1beta/models/gemini-2.5-flash:generateContent
{ "tools": ["THINKING","STRUCTURED_OUTPUTS"],
  "batch": [{…},{…}], "thinking_budget":2048 }
```

### Gemini Pro (Code Execution)

```http
POST /v1beta/models/gemini-2.5-pro:generateContent
{ "tools": ["THINKING","CODE_EXECUTION"],
  "contents": [{"role":"user","content":"Run stats …"}],
  "max_output_tokens":4096,
  "thinking_budget":16384 }
```

### Sonar Deep Research (Batch Search)

```http
POST /v1/search
{ "queries": ["IL‑17 AND CTCL", …], "max_docs": 100, "batch": true }
```

---

## 7 │ Fallback & Guardrails

* If Sonar rate‑limits → auto‑downgrade to Gemini Pro SEARCH\_GROUNDING batch.
* If Flash output ≥10 % hallucination in QA sample → escalate stage to Pro.
* Enforce `<65 536` output tokens per Gemini call; stream long outputs.
* Cache slice when aggregated prompt ≥200 k; purge after 24 h.

---

## 8 │ Revision Log

\* **v2 (2025‑07‑11)** — Introduced Sonar + Flash + Pro tri‑model strategy, batch API columns, cost dashboard.
\* v1 — original single‑model Pro map.
