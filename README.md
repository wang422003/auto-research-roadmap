# Auto Research Atlas

A source-grounded technical report on external progress in **Auto Research / Vibe Research** from 2025-07-28 to 2026-07-28.

**Live site:** [https://wang422003.github.io/auto-research-roadmap/](https://wang422003.github.io/auto-research-roadmap/)

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
- `/updates/` — English Living Field Updates
- `/zh/updates/` — 中文 Living Field Updates
- `/ros/` — English Research Operating System hub (default)
- `/zh/ros/` — 中文 Research Operating System hub
- `/ros/foundations/`, `/ros/evaluation/`, `/ros/practice/` — English article series
- `/zh/ros/foundations/`, `/zh/ros/evaluation/`, `/zh/ros/practice/` — 中文 article series
- `/ros/#reading-list` — English curated Research OS reading path
- `/ros/foundations/#closest-literature` — English full 21-entry reading inventory
- `/zh/ros/#reading-list` and `/zh/ros/foundations/#closest-literature` — 中文镜像

Each bilingual route pair is generated from a shared component and evidence
inventory so quantitative claims, maturity ratings, sources, and version
cutoffs remain synchronized.

The main report is a frozen `v1.1` snapshot with an evidence cutoff of
2026-07-28. New external evidence is appended to
`content/field-updates.json`; corrections create a new versioned entry rather
than silently rewriting an older Evidence Grade. Updates are reviewed manually
about once per month, with interim releases for major evidence events. The site
does not use a crawler, CMS, database, runtime API, or scheduled publication.

The `Living Field Updates` archive is an append-only stream and is not merged
back into the frozen 25-entry denominator. `Research Operating System` is a
separate, neutral working synthesis about durable State, executable Execution,
and Control & Accountability. Its articles are not product documentation for
DeepScientist; DeepScientist appears only as a public architecture case study.

The ROS reading list is a separate, curated 21-entry inventory. It reuses the
article-local primary references and keeps a paper's first public date,
version date, publication status, Evidence Grade, reading rationale, and
evidence boundary in `content/research-os.json`. Reading entries do not change
the frozen report denominator or the Living Field Updates evidence
distribution. `Peer-reviewed` is a publication/validation signal; it does not
automatically mean `Independent Replication`. DeepScientist remains a public
architecture case study, not independent evidence for the reading list.

## Evidence policy

Evidence is coded conservatively:

- **A** — Peer-reviewed or independently validated;
- **B** — Preprint with open code, data, or trajectories;
- **C** — Preprint with self-reported results;
- **D** — Official repository or product claim without full academic validation.

The 25-entry corpus is representative rather than exhaustive. Paper, repository, and product releases for the same system are merged to avoid duplicate counting.

## Updating the report

For each new version, record `Release Date`, `Research Lifecycle Coverage`, `Autonomy Level`, `Run Horizon`, `Agent Topology`, `Memory/State`, `Evaluation Protocol`, `Code/Data Availability`, `External Validation`, and `Limitation`. Preserve earlier evidence ratings and add a versioned entry instead of silently overwriting history.

### Monthly update checklist

1. Verify the Paper Version Date and the first public Release Date.
2. Verify Code, Data, and Trajectory availability, including the exact public URL.
3. Bind every quantitative claim to its Task Definition, Denominator, Evaluator,
   Comparison Basis, and Claim Authority.
4. Keep `Author-reported` separate from `Independently Validated`; use
   `contextReferences` when carrying an older archived work into a new update.
5. Run `npm run validate:content`, `npm run validate:research-os`, the lint gate,
   static export, and the page-content tests before publishing.

### Monthly reading-list audit

1. Re-check each canonical Paper URL and the first public date separately from
   the linked `paperVersionDate`.
2. Re-check publication status, Code/Data/Trajectory or Official Repository
   availability, and the Evidence Grade boundary.
3. Keep each entry in exactly one of the five reading groups and preserve the
   five-step `recommendedPath`; use `supersedes` or `correctionOf` for a
   material revision instead of silently replacing an entry.
4. Keep `whyRead` and `evidenceBoundary` qualitative. If a quantitative result
   is needed, bind it to a complete article claim with Task Definition,
   Denominator, Evaluator, Comparison Basis, and Claim Authority.
5. Run both validators, `npm run lint`, Pages export, static-export tests, and
   render tests before publishing a new reading-list revision.

## Development

```bash
npm install
npm run dev
```

The GitHub Pages workflow creates a static export on every push to `main`. Its
pre-deploy gates can be reproduced locally with:

```bash
npm run validate:content
npm run validate:research-os
npm run lint
GITHUB_ACTIONS=true npm run export:pages
npm run test:pages-content
npm run test:static-export
```

`npm run test:render` remains available for the Vinext/Worker preview path; the
Pages gate tests the exported `out/` files because those are the deployed
artifacts.

## License

Report synthesis and site code are provided for research and educational use. Rights to linked papers, repositories, and source materials remain with their respective owners.
