import type { Metadata } from "next";

type Evidence = "A" | "B" | "C" | "D";
type Locale = "en" | "zh";

export const metadata: Metadata = {
  title: "Auto Research Atlas — External Progress & Research Roadmap",
  description: "A source-grounded review of Auto Research and Vibe Research progress, evidence maturity, benchmarks, and research opportunities.",
  alternates: { canonical: "./", languages: { en: "./", "zh-CN": "./zh/" } },
};

const evidence = [
  { level: "A", count: 4, share: 16, label: "Peer-reviewed / Independently Validated" },
  { level: "B", count: 6, share: 24, label: "Preprint + Open Artifacts" },
  { level: "C", count: 14, share: 56, label: "Preprint / Self-reported" },
  { level: "D", count: 1, share: 4, label: "Official Repository / Product Claim" },
] as const;

const systems = [
  { name: "Robin", domain: "Wet-lab / Medicine", autonomy: 3, accountability: 5, maturity: "A" as Evidence, validation: "Nature + in-vitro + raw RNA-seq", limitation: "Human scientists ran physical experiments" },
  { name: "Co-Scientist", domain: "Wet-lab / Medicine", autonomy: 4, accountability: 4, maturity: "A" as Evidence, validation: "Nature + expert review + in-vitro", limitation: "Viability check, not clinical validation" },
  { name: "The AI Scientist", domain: "AI/ML", autonomy: 5, accountability: 3, maturity: "A" as Evidence, validation: "Nature + workshop peer review", limitation: "1 of 3 workshop submissions accepted" },
  { name: "AgenticSciML", domain: "Scientific ML", autonomy: 4, accountability: 4, maturity: "A" as Evidence, validation: "Peer-reviewed computational experiments", limitation: "No independent laboratory replication" },
  { name: "AutoScientists", domain: "Computational Biology", autonomy: 5, accountability: 4, maturity: "B" as Evidence, validation: "Matched-budget execution", limitation: "Author-run; no physical validation" },
  { name: "InternAgent-1.5", domain: "Cross-domain", autonomy: 5, accountability: 3, maturity: "B" as Evidence, validation: "Computational + wet-lab cases", limitation: "No independent replication" },
  { name: "EvoScientist", domain: "AI/ML", autonomy: 4, accountability: 3, maturity: "B" as Evidence, validation: "Execution + human evaluation", limitation: "Leaderboard signal ≠ scientific validity" },
  { name: "Kosmos", domain: "Cross-domain", autonomy: 5, accountability: 3, maturity: "C" as Evidence, validation: "Statement-level scientist checking", limitation: "Checking ≠ discovery replication" },
  { name: "DeepScientist", domain: "AI/ML", autonomy: 5, accountability: 2, maturity: "C" as Evidence, validation: "Author-run AI tasks", limitation: ">20k GPU-hours; self-reported" },
  { name: "SARA-H", domain: "Materials Science", autonomy: 4, accountability: 4, maturity: "C" as Evidence, validation: "Robotic materials campaigns", limitation: "Selected oxide systems" },
  { name: "S-Researcher", domain: "Social Science", autonomy: 3, accountability: 4, maturity: "C" as Evidence, validation: "Simulation + human-study cases", limitation: "Human intervention at every stage" },
  { name: "AlphaEvolve Math", domain: "Mathematics", autonomy: 4, accountability: 3, maturity: "C" as Evidence, validation: "67 mathematical problems", limitation: "Rediscovery ≠ broad autonomy" },
  { name: "autoresearch", domain: "AI/ML", autonomy: 4, accountability: 4, maturity: "D" as Evidence, validation: "Executable fixed-budget demo", limitation: "No academic validation" },
];

const timelineZh = [
  { period: "2025 Q3", title: "Long-horizon loop becomes the headline", body: "Agent Lightning, Memory-R1 与 DeepScientist 把 Credit Assignment、Learned Memory、Findings Memory 带入执行循环。", proof: "主要仍是 AI task 上的 self-reported execution。" },
  { period: "2025 Q4", title: "Structured state and evolutionary exploration", body: "Kosmos 使用 Structured World Model；AlphaEvolve 把 evolutionary program search 扩展到 67 个数学问题。", proof: "Statement checking 与 rediscovery 尚不能替代 independent reproduction。" },
  { period: "2026 Q1", title: "Public loops, topology and robotic campaigns", body: "InternAgent-1.5、EvoScientist、SARA-H、autoresearch 与 AI Scientist 把系统从 demo 推向 execution substrate。", proof: "System definition、budget 与 metric 仍高度不一致。" },
  { period: "2026 Q2", title: "Teams, benchmarks and wet-lab validation", body: "AutoScientists、AutoResearchBench、SciAgentArena 与 Nature systems 同时出现；组织学习和 evidence quality 开始成为核心。", proof: "只有少数工作进入 peer-reviewed / real-world validation。" },
  { period: "2026 Q3", title: "From autonomy scaling to governance", body: "Capability boundary 逐渐清晰：Structured、Retrieval-grounded、Tool-mediated tasks 进步最快。", proof: "Genuine Novelty、Scientific Judgment、Long-horizon Coherence 仍是瓶颈。" },
];

const timelineEn = [
  { period: "2025 Q3", title: "Long-horizon loops become the headline", body: "Agent Lightning, Memory-R1, and DeepScientist bring Credit Assignment, Learned Memory, and Findings Memory into executable research loops.", proof: "The evidence is still dominated by self-reported execution on AI tasks." },
  { period: "2025 Q4", title: "Structured state and evolutionary exploration", body: "Kosmos introduces a Structured World Model, while AlphaEvolve extends evolutionary program search across 67 mathematical problems.", proof: "Statement checking and rediscovery are not substitutes for independent reproduction." },
  { period: "2026 Q1", title: "Public loops, topology, and robotic campaigns", body: "InternAgent-1.5, EvoScientist, SARA-H, autoresearch, and The AI Scientist move the field from demos toward executable research substrates.", proof: "System definitions, budgets, and metrics remain highly inconsistent." },
  { period: "2026 Q2", title: "Teams, benchmarks, and wet-lab validation", body: "AutoScientists, AutoResearchBench, SciAgentArena, and peer-reviewed Nature systems appear together; organization and evidence quality become first-class concerns.", proof: "Only a small minority of systems reach peer-reviewed or real-world validation." },
  { period: "2026 Q3", title: "From autonomy scaling to governance", body: "The capability boundary sharpens: structured, retrieval-grounded, tool-mediated tasks are advancing fastest.", proof: "Genuine Novelty, Scientific Judgment, and Long-horizon Coherence remain bottlenecks." },
];

const benchmarks = [
  { name: "AutoResearchBench", capability: "Literature Discovery", task: "Deep antecedent recovery / Wide exhaustive retrieval", sample: "Paper-defined corpus", evaluator: "Accuracy / set IoU", result: "9.39% Deep · 9.31% Wide", maturity: "B" },
  { name: "SciAgentArena", capability: "Data + Code Execution", task: "Interactive scientific tasks with stepwise checks", sample: "≈200 tasks", evaluator: "Environment execution", result: "Strong on specified analysis; weak on novelty", maturity: "B" },
  { name: "BixBench", capability: "Life-science Reasoning", task: "Open-response / multiple-choice scientific QA", sample: "Benchmark set", evaluator: "Answer scoring", result: "48.8% open · 64.4% MC", maturity: "C" },
  { name: "ScienceAgentBench", capability: "Historical Scientific Coding", task: "Tasks derived from peer-reviewed papers", sample: "102 tasks / 44 papers", evaluator: "Independent completion", result: "32.4% independent", maturity: "Historical" },
  { name: "MLE-Bench / autoresearch", capability: "ML Optimization", task: "Executable changes under fixed compute", sample: "Task-specific", evaluator: "Held-out metric / val_bpb", result: "No valid cross-system aggregate", maturity: "Historical / D" },
];

const topicsZh = [
  { priority: 1, title: "Matched-budget Dynamic Agent Topology", question: "何时 Single Agent、Parallel Subagents、Role-specialized Team 最优？", novelty: "将 topology selection 从 fixed architecture 变成 stage-conditional policy。", baseline: "Single Agent + fixed subagents + fixed team", experiment: "3 task families × 3 budgets × ≥5 repeats；model、token、wall-clock 完全匹配。", metric: "Best validated gain / cost", guardrail: "Crash rate、duplicated work、variance", ablation: "No routing / no shared state / no handoff / oracle topology", gate: "跨 ≥2 task families 稳定，否则只作为 negative empirical study。", needs: "30–100 GPU-days · replayable containers", output: "Benchmark / Empirical Study", window: "2–4 months" },
  { priority: 2, title: "Counterfactual Credit Assignment", question: "Retrieval、Handoff、Experiment、Reflection 哪类 action 真正贡献 downstream utility？", novelty: "Research trajectory 上的 off-policy counterfactual replay。", baseline: "Outcome-only RL + heuristic keep/discard", experiment: "保存完整 trajectory，删除或替换单个 action 后 deterministic replay。", metric: "Counterfactual value calibration", guardrail: "Replay bias、compute inflation", ablation: "No credit module / terminal reward only / random attribution", gate: "预测 held-out utility 且改善 final result / cost。", needs: "10k–50k trajectories", output: "Core Method Paper", window: "4–8 months" },
  { priority: 3, title: "Receiver-conditioned Scientific Handoff", question: "什么信息应传给哪个 receiver、何时传、传多少？", novelty: "Source-grounded + receiver-conditioned + budget-constrained communication。", baseline: "Full transcript / fixed summary / no communication", experiment: "Planner→Executor 与 Analyst→Writer；显式 token budget。", metric: "Downstream utility / transmitted token", guardrail: "Unsupported claims、missed contradictions", ablation: "No provenance / no receiver conditioning / unlimited budget", gate: "Matched budget 下提升 success 且减少 unsupported handoff。", needs: "5k–20k handoff pairs + source graph", output: "Core Method Paper", window: "4–8 months" },
  { priority: 4, title: "Noise-aware Auto Research Benchmark", question: "系统能否区分真实 improvement 与 experiment noise？", novelty: "Noise floor、independent repeats、negative results 与 artifact replay 成为一等公民。", baseline: "Single-seed keep-if-better loop", experiment: "5 tasks × ≥10 seeds；隐藏 stochastic perturbation；replay checksum。", metric: "True-positive improvement rate", guardrail: "False discovery rate、reproducibility", ablation: "No repeats / no noise model / no negative log", gate: "FDR 显著下降且不牺牲过多 throughput。", needs: "50–150 GPU-days", output: "Benchmark Paper", window: "2–4 months" },
  { priority: 5, title: "Human Intervention Policy", question: "Human 应在什么信号出现时介入？", novelty: "Learning-to-defer for research loops with intervention cost。", baseline: "Never intervene / always review / fixed checkpoints", experiment: "模拟 expert + 5–10 real experts；比较 uncertainty、error、novelty triggers。", metric: "Quality–cost frontier", guardrail: "Missed severe errors、human minutes", ablation: "Trigger families / expert quality / delayed intervention", gate: "同质量减少 human time，或同时间减少 severe errors。", needs: "Expert study + audited trajectories", output: "Human–AI Method", window: "2–6 months" },
  { priority: 6, title: "Provenance-first Research Memory", question: "如何保存 Evidence、Contradiction、Failure 和 Decision Context？", novelty: "Typed scientific memory + contradiction-aware update + artifact lineage。", baseline: "Vector RAG / summary memory / append-only log", experiment: "跨 20–50 sessions 的 evolving-evidence tasks。", metric: "Claim provenance accuracy", guardrail: "Stale-fact rate、storage、latency", ablation: "No typing / no immutable evidence / no contradiction edges", gate: "Source tracking 与 update correctness 同时提升。", needs: "Evidence-change corpus + long-run agents", output: "Core Method Paper", window: "4–8 months" },
  { priority: 7, title: "Cross-domain Independent Replication", question: "组织策略能否从 AI/ML transfer 到 Computational Biology 或 Materials Science？", novelty: "Success criterion 改为 independent replication / new knowledge gain。", baseline: "Best domain workflow + human expert team", experiment: "先 computational biology，再用 external experiment service 复验 top candidates。", metric: "Independent replication rate", guardrail: "Cost、safety、preregistered negatives", ablation: "No learned topology / no provenance memory / no expert gate", gate: "至少一个 preregistered finding 被独立复现。", needs: "Domain experts + external lab budget", output: "Cross-domain System Paper", window: "8–18 months" },
];

const topicsEn = [
  { priority: 1, title: "Matched-budget Dynamic Agent Topology", question: "When should a system use a Single Agent, Parallel Subagents, or a Role-specialized Team?", novelty: "Turn topology selection from a fixed architecture into a stage-conditional policy.", baseline: "Single Agent + fixed subagents + fixed team", experiment: "3 task families × 3 budgets × ≥5 repeats with matched model, tokens, and wall-clock time.", metric: "Best validated gain / cost", guardrail: "Crash rate, duplicated work, variance", ablation: "No routing / no shared state / no handoff / oracle topology", gate: "Stable gains across ≥2 task families; otherwise publish as a negative empirical study.", needs: "30–100 GPU-days · replayable containers", output: "Benchmark / Empirical Study", window: "2–4 months" },
  { priority: 2, title: "Counterfactual Credit Assignment", question: "Which actions—Retrieval, Handoff, Experiment, or Reflection—actually create downstream utility?", novelty: "Off-policy counterfactual replay over complete research trajectories.", baseline: "Outcome-only RL + heuristic keep/discard", experiment: "Record full trajectories, then deterministically replay them after deleting or replacing individual actions.", metric: "Counterfactual value calibration", guardrail: "Replay bias, compute inflation", ablation: "No credit module / terminal reward only / random attribution", gate: "Predict held-out utility and improve the final result-to-cost ratio.", needs: "10k–50k trajectories", output: "Core Method Paper", window: "4–8 months" },
  { priority: 3, title: "Receiver-conditioned Scientific Handoff", question: "What should be sent to which receiver, when, and under what information budget?", novelty: "Source-grounded, receiver-conditioned, budget-constrained communication.", baseline: "Full transcript / fixed summary / no communication", experiment: "Evaluate Planner→Executor and Analyst→Writer handoffs under explicit token budgets.", metric: "Downstream utility / transmitted token", guardrail: "Unsupported claims, missed contradictions", ablation: "No provenance / no receiver conditioning / unlimited budget", gate: "Improve task success and reduce unsupported handoffs under matched budgets.", needs: "5k–20k handoff pairs + source graph", output: "Core Method Paper", window: "4–8 months" },
  { priority: 4, title: "Noise-aware Auto Research Benchmark", question: "Can an autonomous loop distinguish real improvements from experiment noise?", novelty: "Make Noise Floor, Independent Repeats, Negative Results, and Artifact Replay first-class benchmark requirements.", baseline: "Single-seed keep-if-better loop", experiment: "5 tasks × ≥10 seeds with hidden stochastic perturbations and replay checksums.", metric: "True-positive improvement rate", guardrail: "False discovery rate, reproducibility", ablation: "No repeats / no noise model / no negative log", gate: "Reduce FDR materially without sacrificing excessive discovery throughput.", needs: "50–150 GPU-days", output: "Benchmark Paper", window: "2–4 months" },
  { priority: 5, title: "Human Intervention Policy", question: "Which signals should trigger human intervention in a research loop?", novelty: "Learning-to-defer for research loops with an explicit intervention cost.", baseline: "Never intervene / always review / fixed checkpoints", experiment: "Combine simulated experts with 5–10 real experts; compare uncertainty, error, and novelty triggers.", metric: "Quality–cost frontier", guardrail: "Missed severe errors, human minutes", ablation: "Trigger families / expert quality / delayed intervention", gate: "Reduce human time at fixed quality, or reduce severe errors at fixed time.", needs: "Expert study + audited trajectories", output: "Human–AI Method", window: "2–6 months" },
  { priority: 6, title: "Provenance-first Research Memory", question: "How should a system preserve Evidence, Contradictions, Failures, and Decision Context?", novelty: "Typed scientific memory with contradiction-aware updates and artifact lineage.", baseline: "Vector RAG / summary memory / append-only log", experiment: "Evolving-evidence tasks spanning 20–50 sessions.", metric: "Claim provenance accuracy", guardrail: "Stale-fact rate, storage, latency", ablation: "No typing / no immutable evidence / no contradiction edges", gate: "Improve both source tracking and update correctness at controlled cost.", needs: "Evidence-change corpus + long-run agents", output: "Core Method Paper", window: "4–8 months" },
  { priority: 7, title: "Cross-domain Independent Replication", question: "Can learned research organization transfer from AI/ML to Computational Biology or Materials Science?", novelty: "Replace paper acceptance and LLM scores with Independent Replication and New Knowledge Gain.", baseline: "Best domain workflow + human expert team", experiment: "Start in computational biology, then retest top candidates through an external experiment service.", metric: "Independent replication rate", guardrail: "Cost, safety, preregistered negatives", ablation: "No learned topology / no provenance memory / no expert gate", gate: "At least one preregistered finding is independently reproduced.", needs: "Domain experts + external lab budget", output: "Cross-domain System Paper", window: "8–18 months" },
];

const sources = [
  ["Kosmos", "https://arxiv.org/abs/2511.02824"], ["DeepScientist", "https://arxiv.org/abs/2509.26603"], ["EvoScientist", "https://arxiv.org/abs/2603.08127"], ["InternAgent-1.5", "https://arxiv.org/abs/2602.08990"], ["AutoScientists", "https://arxiv.org/abs/2605.28655"], ["autoresearch", "https://github.com/karpathy/autoresearch"], ["Mathematical Exploration with AlphaEvolve", "https://arxiv.org/abs/2511.02864"], ["Rethinking AI Scientist / Deep Research", "https://arxiv.org/abs/2601.12542"], ["S-Researcher", "https://arxiv.org/abs/2604.01520"], ["Autonomous Materials Experimentation / SARA-H", "https://arxiv.org/abs/2601.08185"], ["Robin — Nature", "https://www.nature.com/articles/s41586-026-10652-y"], ["Co-Scientist — Nature", "https://www.nature.com/articles/s41586-026-10644-y"], ["Towards end-to-end automation of AI research — Nature", "https://www.nature.com/articles/s41586-026-10265-5"], ["AgenticSciML", "https://www.nature.com/articles/s44387-026-00102-5"], ["AutoResearchBench", "https://arxiv.org/abs/2604.25256"], ["SciAgentArena", "https://arxiv.org/abs/2606.12736"], ["Agent Lightning", "https://arxiv.org/abs/2508.03680"], ["Memory-R1", "https://arxiv.org/abs/2508.19828"], ["Mem-π", "https://arxiv.org/abs/2605.21463"], ["Communication Policy Evolution", "https://arxiv.org/abs/2606.14314"], ["A-MAC", "https://arxiv.org/abs/2603.04549"], ["Eywa", "https://arxiv.org/abs/2605.30771"], ["MemIR", "https://arxiv.org/abs/2605.25869"], ["Multi-Agent Collaboration for Automated Research", "https://arxiv.org/abs/2603.29632"], ["AAAI-26 AI Review Pilot", "https://arxiv.org/abs/2604.13940"], ["AI for Auto-Research: Roadmap & User Guide", "https://arxiv.org/abs/2605.18661"], ["A Visionary Look at Vibe Researching", "https://arxiv.org/abs/2604.00945"], ["ScienceAgentBench — Historical Baseline", "https://arxiv.org/abs/2410.05080"],
];

const maturityClass = (m: Evidence | string) => `evidence evidence-${m.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`;

export default function Report({ locale = "en" }: { locale?: Locale }) {
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => isZh ? zh : en;
  const timeline = isZh ? timelineZh : timelineEn;
  const topics = isZh ? topicsZh : topicsEn;

  return (
    <main lang={isZh ? "zh-CN" : "en"}>
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark">AR</span><span>Auto Research Atlas</span></a>
        <nav aria-label={t("Main navigation", "主导航")}>
          <a href="#evidence">{t("Evidence", "证据")}</a><a href="#landscape">{t("Landscape", "系统图谱")}</a><a href="#benchmarks">Benchmarks</a><a href="#roadmap">Roadmap</a><a href="#topics">{t("Topics", "选题")}</a>
        </nav>
        <div className="header-actions"><a className="header-link" href="#sources">{t("Sources", "来源")} ↗</a><a className="language-switch" href={isZh ? "../" : "./zh/"} hrefLang={isZh ? "en" : "zh-CN"}>{isZh ? "EN" : "中文"}</a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid">
          <div>
            <div className="eyebrow"><span className="live-dot" /> Technical Report · v1.1 · 2026-07-28</div>
            <h1>Auto Research /<br /><em>Vibe Research</em></h1>
            <p className="hero-deck">{t("Over the past year, research agents moved from isolated tool use toward ", "过去一年，科研 Agent 从 isolated tool use 进入 ")}<strong>iterative execution, persistent state, and adaptive organization</strong>{t(". Yet Genuine Novelty, Scientific Judgment, and Trustworthy Autonomy remain unresolved.", "；但 Genuine Novelty、Scientific Judgment 与 Trustworthy Autonomy 仍未解决。")}</p>
            <div className="hero-actions"><a className="button primary" href="#findings">{t("Read the findings", "阅读核心结论")}</a><a className="button" href="#topics">{t("Explore 7 research topics", "查看 7 个研究选题")}</a></div>
          </div>
          <aside className="hero-aside">
            <p className="aside-label">{t("Evidence window", "证据时间窗")}</p><p className="aside-value">2025-07-28<br />→ 2026-07-28</p>
            <div className="mini-grid"><div><strong>25</strong><span>{t("curated entries", "精选条目")}</span></div><div><strong>6</strong><span>{t("scientific domains", "科学领域")}</span></div><div><strong>4</strong><span>{t("evidence levels", "证据等级")}</span></div><div><strong>7</strong><span>{t("topic cards", "选题卡片")}</span></div></div>
            <p className="aside-note">{t("Representative, deduplicated corpus — not exhaustive bibliometrics.", "代表性、去重后的语料库，并非穷尽式文献计量。")}</p>
          </aside>
        </div>
        <div className="hero-line"><span>Research Assistant</span><i /><span>Human-on-the-loop</span><i /><span>Computational Scientist</span><i /><span>Lab-validated System</span></div>
      </section>

      <section className="section findings" id="findings">
        <div className="section-index">01 / Technical Summary</div>
        <h2>{t("What can we trust today?", "现在能相信什么？")}</h2>
        <div className="finding-grid">
          <article><span>01</span><h3>Execution throughput is real</h3><p>{t("Fixed metrics, short trials, and replayable code make Narrow Optimization Loops credible experimental substrates.", "Fixed metric、short trial、replayable code 让 Narrow Optimization Loop 成为可靠 experimental substrate。")}</p></article>
          <article><span>02</span><h3>State beats longer prompts</h3><p>{t("Structured World Models, Findings Memory, shared experimental state, and typed provenance are replacing generic summary memory.", "Structured World Model、Findings Memory、shared experimental state 与 typed provenance 正在替代普通 summary memory。")}</p></article>
          <article><span>03</span><h3>Validation remains human-heavy</h3><p>{t("The strongest wet-lab evidence still depends on humans for candidate selection, physical execution, safety, and critical judgment.", "最强 wet-lab evidence 仍依赖 humans 进行 candidate selection、physical execution、safety 与 critical judgment。")}</p></article>
        </div>
        <div className="thesis"><p>Research thesis</p><strong>{t("The next important paper will not come from ‘more agents,’ but from auditable, learnable, matched-budget Research Organization.", "下一篇重要工作不会来自“更多 Agents”，而会来自可审计、可学习、matched-budget 的 Research Organization。")}</strong></div>
      </section>

      <section className="section evidence-section" id="evidence">
        <div className="section-index">02 / Evidence Framework</div><h2>{t("Autonomy is not evidence", "Autonomy 不是证据")}</h2>
        <p className="section-intro">{t("This report maps systems using ", "本报告用 ")}<strong>Autonomy Level × Epistemic Accountability</strong>{t(". The denominator below is a curated set of 25 deduplicated entries—not the publication volume of the field.", " 定位系统。以下分布的 denominator 是 25 个去重 representative entries，不代表全领域 publication volume。")}</p>
        <div className="evidence-layout">
          <div className="bar-chart" aria-label="Evidence maturity distribution">{evidence.map((item) => <div className="bar-row" key={item.level}><div className={maturityClass(item.level)}>{item.level}</div><div className="bar-track"><div className={`bar-fill fill-${item.level.toLowerCase()}`} style={{ width: `${item.share}%` }}><span>{item.count}</span></div></div><p><strong>{item.share}%</strong>{item.label}</p></div>)}</div>
          <aside className="definition-card"><h3>{t("Working definitions", "工作定义")}</h3><dl><dt>Auto Research</dt><dd>Objective → Iterative Research Loop</dd><dt>Vibe Research</dt><dd>Human Direction + Taste + Judgment; Agent Throughput</dd><dt>Evidence A</dt><dd>Peer-reviewed or Independently Validated</dd><dt>Evidence D</dt><dd>Public demo without academic validation</dd></dl></aside>
        </div>
      </section>

      <section className="section" id="timeline">
        <div className="section-index">03 / Field Evolution</div><h2>{t("From loops to learned organization", "从 loop 到 organization")}</h2>
        <div className="timeline">{timeline.map((item, i) => <article key={item.period}><div className="time-mark"><span>{item.period}</span><b>{String(i + 1).padStart(2, "0")}</b></div><div><h3>{item.title}</h3><p>{item.body}</p><small>{item.proof}</small></div></article>)}</div>
      </section>

      <section className="section landscape" id="landscape">
        <div className="section-index">04 / System Landscape</div><h2>Autonomy–Evidence Map</h2>
        <p className="section-intro">{t("The 1–5 scores are a transparent analyst rubric, not metrics reported by the papers. The x-axis shows Autonomy, the y-axis Epistemic Accountability, and color Evidence Maturity.", "1–5 scoring 是透明 analyst rubric，不是 paper 原始 metric。横轴为 Autonomy，纵轴为 Epistemic Accountability；颜色为 Evidence Maturity。")}</p>
        <div className="scatter-wrap"><div className="scatter-y">Epistemic Accountability →</div><div className="scatter">{[1,2,3,4,5].map(n => <span className="x-grid" key={`x${n}`} style={{ left: `${(n-1)*25}%` }} />)}{[1,2,3,4,5].map(n => <span className="y-grid" key={`y${n}`} style={{ bottom: `${(n-1)*25}%` }} />)}{systems.map((s, i) => <div className={`dot dot-${s.maturity.toLowerCase()} dot-i${i}`} key={s.name} style={{ left: `calc(${(s.autonomy-1)*25}% - 8px)`, bottom: `calc(${(s.accountability-1)*25}% - 8px)` }}><span>{s.name}</span></div>)}</div><div className="scatter-x">Autonomy Level →</div><div className="legend"><span><i className="dot-a" />A</span><span><i className="dot-b" />B</span><span><i className="dot-c" />C</span><span><i className="dot-d" />D</span></div></div>
        <div className="table-shell"><table><thead><tr><th>System</th><th>Domain</th><th>Autonomy</th><th>Accountability</th><th>Validation</th><th>Limitation</th><th>Evidence</th></tr></thead><tbody>{systems.map(s => <tr key={s.name}><td><strong>{s.name}</strong></td><td>{s.domain}</td><td>{s.autonomy}/5</td><td>{s.accountability}/5</td><td>{s.validation}</td><td>{s.limitation}</td><td><span className={maturityClass(s.maturity)}>{s.maturity}</span></td></tr>)}</tbody></table></div>
      </section>

      <section className="section" id="benchmarks">
        <div className="section-index">05 / Reality Check</div><h2>{t("Benchmarks do not measure the same thing", "Benchmarks 测到的不是同一件事")}</h2>
        <p className="section-intro">{t("Literature Discovery, Data Analysis, Code Experimentation, Open-ended Exploration, and Scientific Novelty must be reported separately. Accuracy, Pass Rate, and Novelty Score with different definitions should not be ranked side by side.", "Literature Discovery、Data Analysis、Code Experimentation、Open-ended Exploration 与 Scientific Novelty 必须分开报告；不同 definition 的 Accuracy、Pass Rate、Novelty Score 不应横向排序。")}</p>
        <div className="benchmark-list">{benchmarks.map((b, i) => <article key={b.name}><div className="benchmark-number">0{i+1}</div><div className="benchmark-main"><div className="row-meta"><span>{b.capability}</span><span>{b.maturity}</span></div><h3>{b.name}</h3><p>{b.task}</p></div><div className="benchmark-result"><strong>{b.result}</strong><span>{b.sample} · {b.evaluator}</span></div></article>)}</div>
        <div className="warning"><strong>Negative evidence matters.</strong><p>{t("The best model on AutoResearchBench reaches only 9.39% Deep Accuracy and 9.31% Wide IoU. SciAgentArena likewise finds that agents handle well-specified analysis far better than novelty or self-directed exploration.", "AutoResearchBench 的 best model 仍只有 9.39% Deep Accuracy 与 9.31% Wide IoU；SciAgentArena 则显示 agents 擅长 well-specified analysis，却仍不擅长 novelty 与 self-directed exploration。")}</p></div>
      </section>

      <section className="section" id="roadmap">
        <div className="section-index">06 / Research Roadmap</div><h2>{t("Three stages, increasing risk", "三阶段，逐层增加风险")}</h2>
        <div className="roadmap-grid"><article><div className="roadmap-top"><span>Track 01</span><b>2–4 mo</b></div><h3>Evaluation & Empirical Foundations</h3><p>{t("Matched Budget, Noise-floor Estimation, Independent Repeats, Negative Results, Artifact Replay, and Human Intervention Policy.", "Matched Budget、Noise-floor、Independent Repeats、Negative Results、Artifact Replay、Human Intervention Policy。")}</p><footer>Benchmark Paper · Empirical Study</footer></article><article><div className="roadmap-top"><span>Track 02</span><b>4–8 mo</b></div><h3>Learned Research Organization</h3><p>{t("Dynamic Topology, Counterfactual Credit, Receiver-conditioned Handoff, and Provenance-first Memory.", "Dynamic Topology、Counterfactual Credit、Receiver-conditioned Handoff、Provenance-first Memory。")}</p><footer>Core Method Paper</footer></article><article><div className="roadmap-top"><span>Track 03</span><b>8–18 mo</b></div><h3>Trustworthy Cross-domain Discovery</h3><p>{t("External Experiment Services, Domain-expert Review, Independent Replication, and New Knowledge Gain.", "External Experiment Service、Domain-expert Review、Independent Replication、New Knowledge Gain。")}</p><footer>Cross-domain System Paper</footer></article></div>
        <div className="sequence"><span>Benchmark substrate</span><i>→</i><span>Learned organization</span><i>→</i><span>Independent replication</span></div>
      </section>

      <section className="section topics" id="topics">
        <div className="section-index">07 / Research Topic Cards</div><h2>{t("Seven research-ready topics", "七个可落地选题")}</h2><p className="section-intro">{t("Ranked by expected scientific value × feasibility × evidence gap. Expand each card for its Minimum Viable Experiment, Ablations, and Failure Gate.", "按 expected scientific value × feasibility × evidence gap 排序。展开查看 Minimum Viable Experiment、Ablation 与 Failure Gate。")}</p>
        <div className="topic-list">{topics.map(topic => <details key={topic.priority} open={topic.priority === 1}><summary><span className="topic-rank">P{topic.priority}</span><div><h3>{topic.title}</h3><p>{topic.question}</p></div><span className="topic-window">{topic.window}</span><span className="plus">+</span></summary><div className="topic-body"><div><label>Novelty Positioning</label><p>{topic.novelty}</p></div><div><label>Strongest Baseline</label><p>{topic.baseline}</p></div><div><label>Minimum Viable Experiment</label><p>{topic.experiment}</p></div><div><label>Core Metric</label><p>{topic.metric}</p></div><div><label>Guardrail Metric</label><p>{topic.guardrail}</p></div><div><label>Required Ablation</label><p>{topic.ablation}</p></div><div><label>Success / Failure Gate</label><p>{topic.gate}</p></div><div><label>Compute & Data</label><p>{topic.needs}</p></div><div className="topic-output"><label>Publication Potential</label><p>{topic.output}</p></div></div></details>)}</div>
      </section>

      <section className="section limitations">
        <div className="section-index">08 / Open Problems</div><h2>{t("Do not confuse an impressive demo with science", "不要被 impressive demo 欺骗")}</h2>
        <div className="problem-grid">{["Metric Incomparability","LLM-as-a-Judge Feedback Loop","Experiment Noise","Data Leakage","Selective Reporting","Reproduction Cost","Product Claim vs Public Evidence","Research Governance"].map((problem,i)=><article key={problem}><span>{String(i+1).padStart(2,"0")}</span><h3>{problem}</h3></article>)}</div>
        <p className="method-note"><strong>Update protocol.</strong>{t(" Every new version must record Release Date, Lifecycle Coverage, Autonomy, Run Horizon, Topology, Memory/State, Evaluation, Code/Data, External Validation, and Limitation. Preserve old Evidence Maturity ratings and add a Versioned Entry.", " 新版本必须记录 Release Date、Lifecycle Coverage、Autonomy、Run Horizon、Topology、Memory/State、Evaluation、Code/Data、External Validation 与 Limitation；旧 Evidence Maturity 保留，通过 Versioned Entry 增量更新。")}</p>
      </section>

      <section className="section sources" id="sources">
        <div className="section-index">09 / Primary Sources</div><h2>{t("Source inventory", "来源清单")}</h2><p className="section-intro">{t("The review prioritizes paper version history, official repositories, versions of record, and public benchmarks. A preprint is not scientific consensus.", "优先使用 paper version history、official repository、version of record 与公开 benchmark。Preprint 不等于 scientific consensus。")}</p>
        <div className="source-grid">{sources.map(([label, href],i)=><a href={href} target="_blank" rel="noreferrer" key={href}><span>{String(i+1).padStart(2,"0")}</span><strong>{label}</strong><i>↗</i></a>)}</div>
      </section>

      <footer className="footer"><div><span className="brand-mark">AR</span><strong>Auto Research Atlas</strong></div><p>{t("Independent technical synthesis for Research Topic Selection.", "面向 Research Topic Selection 的独立技术综述。")}<br />Evidence cutoff: 2026-07-28 · Version 1.1</p><a href="#top">{t("Back to top", "返回顶部")} ↑</a></footer>
    </main>
  );
}
