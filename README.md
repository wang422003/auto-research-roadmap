# Auto Research Atlas

A source-grounded technical report on external progress in **Auto Research / Vibe Research** from 2025-07-28 to 2026-07-28.

The site covers:

- 25 deduplicated representative systems, methods, and benchmarks;
- six scientific domains;
- an `Autonomy Level × Epistemic Accountability` evidence map;
- benchmark reality checks with task definitions and denominators;
- a three-track research roadmap;
- seven implementation-ready research topic cards.

## Languages

- `/` — English (default)
- `/zh/` — 中文

Both routes are generated from the same evidence inventory and shared report component so the quantitative claims, maturity ratings, sources, and version cutoff remain synchronized.

## Evidence policy

Evidence is coded conservatively:

- **A** — Peer-reviewed or independently validated;
- **B** — Preprint with open code, data, or trajectories;
- **C** — Preprint with self-reported results;
- **D** — Official repository or product claim without full academic validation.

The 25-entry corpus is representative rather than exhaustive. Paper, repository, and product releases for the same system are merged to avoid duplicate counting.

## Updating the report

For each new version, record `Release Date`, `Research Lifecycle Coverage`, `Autonomy Level`, `Run Horizon`, `Agent Topology`, `Memory/State`, `Evaluation Protocol`, `Code/Data Availability`, `External Validation`, and `Limitation`. Preserve earlier evidence ratings and add a versioned entry instead of silently overwriting history.

## Development

```bash
npm install
npm run dev
```

The GitHub Pages workflow creates a static export on every push to `main`.

## License

Report synthesis and site code are provided for research and educational use. Rights to linked papers, repositories, and source materials remain with their respective owners.
