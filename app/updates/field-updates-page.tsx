import DocumentLanguage from "../document-language";
import { sitePath } from "../site-path";
import { fieldUpdates, latestFieldUpdate } from "@/content/field-updates";

type Locale = "en" | "zh";
type JsonRecord = Record<string, unknown>;

type WorkView = {
  id: string;
  title: string;
  releaseDate: string;
  paperVersionDate: string;
  domain: string;
  validation: string;
  limitation: string;
  maturity: string;
  status: string;
};

type NamedCopy = {
  id: string;
  title: string;
  body: string;
  note: string;
};

type ReferenceView = {
  id: string;
  title: string;
  url: string;
  kind: string;
};

type UpdateView = {
  id: string;
  publishedAt: string;
  evidenceCutoff: string;
  previousCutoff: string;
  title: string;
  summary: string;
  takeaways: string[];
  works: WorkView[];
  contextWorks: WorkView[];
  contextReferences: string[];
  themes: NamedCopy[];
  ladder: NamedCopy[];
  gaps: NamedCopy[];
  capabilityAssessment: NamedCopy[];
  references: ReferenceView[];
  supersedes: string[];
  correctionOf: string[];
};

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRelations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(scalar).filter(Boolean);
  const relation = scalar(value);
  return relation ? [relation] : [];
}

function scalar(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function localized(value: unknown, locale: Locale): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  const copy = asRecord(value);
  return scalar(copy[locale]) || scalar(copy.en) || scalar(copy.zh);
}

function firstValue(record: JsonRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function firstText(record: JsonRecord, keys: string[], locale: Locale): string {
  return localized(firstValue(record, keys), locale);
}

function normalizeNamedCopy(
  value: unknown,
  locale: Locale,
  index: number,
): NamedCopy {
  if (typeof value === "string") {
    return { id: String(index + 1), title: value, body: "", note: "" };
  }
  const item = asRecord(value);
  if (item.en !== undefined || item.zh !== undefined) {
    return {
      id: String(index + 1),
      title: localized(item, locale),
      body: "",
      note: "",
    };
  }
  return {
    id: scalar(item.id) || String(index + 1),
    title: firstText(item, ["title", "stage", "label", "capability"], locale),
    body: firstText(
      item,
      ["summary", "description", "assessment", "body", "finding"],
      locale,
    ),
    note: firstText(item, ["note", "evidence", "status", "boundary"], locale),
  };
}

function normalizeWork(value: unknown, locale: Locale, index: number): WorkView {
  const work = asRecord(value);
  return {
    id: scalar(work.id) || String(index + 1),
    title: localized(work.title, locale),
    releaseDate: scalar(work.releaseDate),
    paperVersionDate: scalar(work.paperVersionDate),
    domain: localized(work.domain, locale),
    validation: localized(work.externalValidation, locale),
    limitation: localized(work.limitation, locale),
    maturity: scalar(work.evidenceMaturity),
    status: scalar(work.deltaStatus),
  };
}

const archivedWorkById = new Map(
  fieldUpdates.flatMap((update) => update.works.map((work) => [work.id, work] as const)),
);

// The oldest update's previous cutoff is the frozen v1.1 report boundary.
// Derive it from the append-only source so the page never drifts when another
// update is added.
const frozenReportCutoff = fieldUpdates.at(-1)?.previousCutoff ?? "2026-07-28";

// Update 002 calls out twelve representative works in the first screen. The
// remaining six signals stay available in an explicit, collapsed group so the
// archive remains comprehensive without letting the evidence table lose its
// editorial focus.
const update002CoreWorkIds = new Set([
  "autoresearch-eval-v3",
  "beyond-final-scores-v1",
  "scienceflow-v2",
  "little-scientist-v1",
  "creativity-agents-v1",
  "station-v1",
  "bixbench3-v1",
  "coscientist-realworld-v1",
  "dr-claw-v1",
  "pris-v1",
  "asset-pricing-v1",
  "brain-researcher-v1",
]);

function isAdditionalSignal(update: UpdateView, work: WorkView): boolean {
  return update.id === "update-002-2026-09-03" && work.status === "New" && !update002CoreWorkIds.has(work.id);
}

function normalizeReference(
  value: unknown,
  locale: Locale,
  index: number,
): ReferenceView {
  const reference = asRecord(value);
  return {
    id: scalar(reference.id) || String(index + 1),
    title: firstText(reference, ["title", "label"], locale),
    url: scalar(reference.url),
    kind: firstText(reference, ["kind", "sourceType", "type"], locale),
  };
}

function normalizeUpdate(value: unknown, locale: Locale): UpdateView {
  const update = asRecord(value);
  const contextReferences = asArray(update.contextReferences).map(scalar).filter(Boolean);
  return {
    id: scalar(update.id),
    publishedAt: scalar(update.publishedAt),
    evidenceCutoff: scalar(update.evidenceCutoff),
    previousCutoff: scalar(update.previousCutoff),
    title: localized(update.title, locale),
    summary: localized(update.summary, locale),
    takeaways: asArray(update.takeaways)
      .map((item) => localized(item, locale))
      .filter(Boolean),
    works: asArray(update.works).map((item, index) =>
      normalizeWork(item, locale, index),
    ),
    contextWorks: contextReferences
      .map((id, index) => normalizeWork(archivedWorkById.get(id), locale, index))
      .filter((work) => work.title),
    contextReferences,
    themes: asArray(update.themes).map((item, index) =>
      normalizeNamedCopy(item, locale, index),
    ),
    ladder: asArray(update.capabilityLadder).map((item, index) =>
      normalizeNamedCopy(item, locale, index),
    ),
    gaps: asArray(update.openGaps).map((item, index) =>
      normalizeNamedCopy(item, locale, index),
    ),
    capabilityAssessment: asArray(update.capabilityAssessment).map(
      (item, index) => normalizeNamedCopy(item, locale, index),
    ),
    references: asArray(update.references).map((item, index) =>
      normalizeReference(item, locale, index),
    ),
    supersedes: asRelations(update.supersedes),
    correctionOf: asRelations(update.correctionOf),
  };
}

function formatDate(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf())) return date;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", {
    year: "numeric",
    month: locale === "zh" ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function maturityLabel(grade: string, locale: Locale): string {
  const labels: Record<string, [string, string]> = {
    A: ["Peer-reviewed or independently validated", "Peer-reviewed 或 Independently Validated"],
    B: ["Preprint with open artifacts", "Preprint + Open Artifacts"],
    C: ["Preprint, author-reported", "Preprint / Author-reported"],
    D: ["Official claim without full academic validation", "Official Claim，缺少完整学术验证"],
  };
  const label = labels[grade] ?? ["Evidence grade", "证据等级"];
  return `${locale === "zh" ? label[1] : label[0]} · ${grade}`;
}

function statusLabel(status: string, locale: Locale): string {
  const labels: Record<string, [string, string]> = {
    New: ["New", "New · 新增"],
    Context: ["Context", "Context · 背景"],
    "Date Clarification": ["Date clarification", "Date Clarification · 日期校正"],
  };
  const label = labels[status];
  return label ? (locale === "zh" ? label[1] : label[0]) : status;
}

function statusClass(status: string): string {
  return status.toLowerCase().replaceAll(" ", "-");
}

function updateLabel(id: string): string {
  const match = id.match(/^update-(\d+)/i);
  return match ? `Update ${match[1]}` : id;
}

function sectionId(update: UpdateView, section: string): string {
  return `${update.publishedAt}-${section}`;
}

function changeGroup(
  update: UpdateView,
  status: WorkView["status"],
  locale: Locale,
  includeWork: (work: WorkView) => boolean = () => true,
) {
  const labels: Record<string, [string, string]> = {
    New: ["New since the previous cutoff", "Previous Cutoff 后新增"],
    Context: ["2026 evidence context", "2026 Evidence Context"],
    "Date Clarification": ["Date clarification", "日期校正"],
  };
  const heading = labels[status] ?? [status, status];
  const works = update.works.filter((work) => work.status === status && includeWork(work));
  if (!works.length) return null;
  return (
    <article className={`updates-change-group updates-status-${statusClass(status)}`}>
      <div className="updates-change-heading">
        <span className="updates-status-label">{statusLabel(status, locale)}</span>
        <strong>{locale === "zh" ? heading[1] : heading[0]}</strong>
        <b>{works.length} {statusLabel(status, locale)}</b>
      </div>
      <ul>
        {works.map((work) => (
          <li key={work.id}>
            <span>{work.title}</span>
            <span>
              <time dateTime={work.paperVersionDate || work.releaseDate}>
                {work.paperVersionDate || work.releaseDate}
              </time>
              <i className={`updates-grade updates-grade-${work.maturity.toLowerCase()}`}>
                Evidence {work.maturity}
              </i>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function additionalSignalsGroup(update: UpdateView, locale: Locale) {
  const isZh = locale === "zh";
  const works = update.works.filter((work) => isAdditionalSignal(update, work));
  if (!works.length) return null;
  return (
    <details className="updates-additional-signals">
      <summary>
        <span className="updates-status-label">Additional Signals</span>
        <strong>{isZh ? "Additional Signals · 其他信号" : "Additional Signals"}</strong>
        <b>{works.length}</b>
        <i aria-hidden="true">+</i>
      </summary>
      <p>
        {isZh
          ? "这些条目纳入本次 archive，但不占据首屏重点；展开可查看完整 Evidence。"
          : "These works stay in the archive but remain out of the first-screen focus. Expand to inspect their evidence."}
      </p>
      <ul>
        {works.map((work) => (
          <li key={work.id}>
            <span>{work.title}</span>
            <span>
              <time dateTime={work.paperVersionDate || work.releaseDate}>
                {work.paperVersionDate || work.releaseDate}
              </time>
              <i className={`updates-grade updates-grade-${work.maturity.toLowerCase()}`}>
                Evidence {work.maturity}
              </i>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function carriedContextGroup(update: UpdateView, locale: Locale) {
  const isZh = locale === "zh";
  return (
    <article className="updates-change-group updates-carried-context">
      <div className="updates-change-heading">
        <span className="updates-status-label">Context reference</span>
        <strong>{isZh ? "Carried context · 旧条目引用" : "Carried context · archived references"}</strong>
        <b>{update.contextWorks.length} {isZh ? "carried" : "carried"}</b>
      </div>
      <p className="updates-carried-note">
        {isZh
          ? "这些 work 已在更早的 Update 中归档；本次只用于主题与能力判断，不计入当前 Evidence denominator。"
          : "These works were archived in earlier Updates. They inform themes and capability assessment, but do not enter this update's Evidence denominator."}
      </p>
      <ul>
        {update.contextWorks.map((work) => (
          <li key={work.id}>
            <span>{work.title}</span>
            <span>
              <time dateTime={work.paperVersionDate || work.releaseDate}>
                {work.paperVersionDate || work.releaseDate}
              </time>
              <i className={`updates-grade updates-grade-${work.maturity.toLowerCase()}`}>
                Evidence {work.maturity}
              </i>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function EvidenceTable({ works, locale, label }: { works: WorkView[]; locale: Locale; label?: string }) {
  const t = (en: string, zh: string) => (locale === "zh" ? zh : en);
  return (
    <div className="updates-table-shell" role="region" aria-label={label ?? t("Scrollable evidence table", "可滚动 Evidence Table")} tabIndex={0}>
      <table>
        <caption className="updates-visually-hidden">{t("Research works and public evidence", "Research Work 与公开证据")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("Status", "状态")}</th>
            <th scope="col">{t("Work / Domain", "工作 / Domain")}</th>
            <th scope="col">{t("Validation", "Validation")}</th>
            <th scope="col">{t("Grade", "等级")}</th>
            <th scope="col">{t("Limitation", "Limitation")}</th>
          </tr>
        </thead>
        <tbody>
          {works.map((work) => (
            <tr key={work.id}>
              <td data-label={t("Status", "状态")}>
                <span className={`updates-status-label updates-status-${statusClass(work.status)}`}>{statusLabel(work.status, locale)}</span>
              </td>
              <th scope="row" data-label={t("Work / Domain", "工作 / Domain")}>
                <strong>{work.title}</strong>
                <span>{work.domain}</span>
                <time dateTime={work.paperVersionDate || work.releaseDate}>{t("Version", "版本")} {work.paperVersionDate || work.releaseDate}</time>
              </th>
              <td data-label={t("Validation", "Validation")}>{work.validation}</td>
              <td data-label={t("Grade", "等级")}><span className={`updates-grade updates-grade-${work.maturity.toLowerCase()}`}>Evidence {work.maturity}</span></td>
              <td data-label={t("Limitation", "Limitation")}>{work.limitation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdateEntry({
  update,
  locale,
  latest,
}: {
  update: UpdateView;
  locale: Locale;
  latest: boolean;
}) {
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);
  const counts = ["A", "B", "C", "D"].map((grade) => ({
    grade,
    count: update.works.filter((work) => work.maturity === grade).length,
  }));

  return (
    <details
      className={`updates-entry${latest ? " updates-entry-latest" : ""}`}
      id={update.publishedAt}
      open={latest}
    >
      <summary className="updates-entry-summary">
        <span className="updates-date-rail" aria-hidden="true">
          <b>{update.publishedAt.slice(5, 7)}</b>
          <i />
          <b>{update.publishedAt.slice(8, 10)}</b>
          <small>{update.publishedAt.slice(0, 4)}</small>
        </span>
        <span className="updates-entry-heading">
          <span className="updates-kicker">
            {updateLabel(update.id)} · {latest ? t("Latest entry", "最新条目") : t("Archive entry", "历史条目")}
          </span>
          <strong>{update.title}</strong>
          <span>
            <time dateTime={update.publishedAt}>{formatDate(update.publishedAt, locale)}</time>
            <i aria-hidden="true">·</i>
            {t("Evidence cutoff", "Evidence Cutoff")} {update.evidenceCutoff}
          </span>
        </span>
        <span className="updates-entry-toggle" aria-hidden="true">+</span>
      </summary>

      <div className="updates-entry-body">
        <section
          className="updates-section updates-changes"
          id={sectionId(update, "changes")}
        >
          <div className="updates-section-label">01 / {t("Delta", "变化")}</div>
          <div className="updates-section-heading">
            <h2>{t("What changed since the previous cutoff", "相对 Previous Cutoff 有何变化")}</h2>
            <p>{update.summary}</p>
          </div>
          <div className={`updates-change-grid${update.works.some((work) => work.status === "Date Clarification") ? "" : " updates-change-grid-no-date"}`}>
            {changeGroup(update, "New", locale, (work) => !isAdditionalSignal(update, work))}
            {changeGroup(update, "Date Clarification", locale)}
            {changeGroup(update, "Context", locale)}
            {additionalSignalsGroup(update, locale)}
            {update.contextWorks.length ? carriedContextGroup(update, locale) : null}
          </div>
          <div className="updates-takeaways">
            <span>{t("Current read", "当前判断")}</span>
            <ol>
              {update.takeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="updates-section updates-themes"
          id={sectionId(update, "themes")}
        >
          <div className="updates-section-label">02 / Progress Themes</div>
          <div className="updates-section-heading">
            <h2>{t("Where the field moved", "领域真正推进在哪里")}</h2>
            <p>
              {t(
                "Six signals separate durable capability progress from a louder demo cycle.",
                "六条信号用于区分可持续的 Capability Progress 与更响亮的 Demo Cycle。",
              )}
            </p>
          </div>
          <ol className="updates-theme-grid">
            {update.themes.map((theme, index) => (
              <li key={theme.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{theme.title}</h3>
                <p>{theme.body}</p>
                {theme.note ? <small>{theme.note}</small> : null}
              </li>
            ))}
          </ol>
        </section>

        <section
          className="updates-section updates-evidence"
          id={sectionId(update, "evidence")}
        >
          <div className="updates-section-label">03 / Evidence</div>
          <div className="updates-section-heading">
            <h2>{t("Evidence reality check", "Evidence Reality Check")}</h2>
            <p>
              {t(
                "Evidence A means peer-reviewed or independently validated. It does not automatically mean independent replication.",
                "Evidence A 表示 Peer-reviewed 或 Independently Validated；它不自动等同于 Independent Replication。",
              )}
            </p>
          </div>
          <div className="updates-evidence-counts" role="group" aria-label={t("Evidence maturity distribution", "Evidence Maturity 分布")}>
            {counts.map(({ grade, count }) => (
              <div key={grade}>
                <span className={`updates-grade updates-grade-${grade.toLowerCase()}`}>
                  Evidence {grade}
                </span>
                <strong>{count}</strong>
                <small>{maturityLabel(grade, locale)}</small>
              </div>
            ))}
          </div>
          <EvidenceTable
            works={update.works.filter((work) => !isAdditionalSignal(update, work))}
            locale={locale}
          />
          {update.works.some((work) => isAdditionalSignal(update, work)) ? (
            <details className="updates-additional-evidence">
              <summary>{t("Show Additional Signals in the evidence table", "在 Evidence Table 中显示 Additional Signals")} <span aria-hidden="true">＋</span></summary>
              <EvidenceTable
                works={update.works.filter((work) => isAdditionalSignal(update, work))}
                locale={locale}
                label={t("Additional signals evidence table", "Additional Signals Evidence Table")}
              />
            </details>
          ) : null}
          {update.capabilityAssessment.length ? (
            <div className="updates-capability-assessment">
              {update.capabilityAssessment.map((item) => (
                <article key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {item.note ? <small>{item.note}</small> : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section
          className="updates-section updates-ladder-section"
          id={sectionId(update, "ladder")}
        >
          <div className="updates-section-label">04 / Capability Ladder</div>
          <div className="updates-section-heading">
            <h2>{t("Capability is a ladder, not a binary", "Capability 是阶梯，不是二元标签")}</h2>
            <p>
              {t(
                "Current public evidence is strongest in bounded, executable loops with artifact-backed human oversight.",
                "当前公开证据最强的形态，是有明确边界、可执行、并由 artifact-backed human oversight 约束的 loop。",
              )}
            </p>
          </div>
          <ol className="updates-ladder">
            {update.ladder.map((step, index) => (
              <li key={step.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {step.note ? <small>{step.note}</small> : null}
                </div>
              </li>
            ))}
          </ol>
          <div className="updates-current-form">
            <span>{t("Most credible current form", "当前最可信形态")}</span>
            <strong>Vibe Research / Human-on-the-loop</strong>
          </div>
        </section>

        <section
          className="updates-section updates-gaps"
          id={sectionId(update, "gaps")}
        >
          <div className="updates-section-label">05 / Open Gaps</div>
          <div className="updates-section-heading">
            <h2>{t("What is still missing", "仍未解决的问题")}</h2>
            <p>
              {t(
                "The remaining bottlenecks concern epistemic reliability, not only agent throughput.",
                "剩余瓶颈关乎 Epistemic Reliability，而不只是 Agent Throughput。",
              )}
            </p>
          </div>
          <div className="updates-gap-grid">
            {update.gaps.map((gap, index) => (
              <article key={gap.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{gap.title}</h3>
                {gap.body ? <p>{gap.body}</p> : null}
                {gap.note ? <small>{gap.note}</small> : null}
              </article>
            ))}
          </div>
        </section>

        <section
          className="updates-section updates-references"
          id={sectionId(update, "references")}
        >
          <div className="updates-section-label">06 / Primary References</div>
          <div className="updates-section-heading">
            <h2>{t("Primary reference inventory", "Primary Reference Inventory")}</h2>
            <p>
              {t(
                "Paper version histories, versions of record, and official repositories are prioritized over secondary summaries.",
                "优先使用 Paper Version History、Version of Record 与 Official Repository，而非二手摘要。",
              )}
            </p>
          </div>
          <ol className="updates-reference-list">
            {update.references.map((reference, index) => (
              <li key={reference.id || reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer noopener">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{reference.title}</strong>
                  {reference.kind ? <small>{reference.kind}</small> : null}
                  <i aria-hidden="true">↗</i>
                </a>
              </li>
            ))}
          </ol>
          {update.supersedes.length || update.correctionOf.length ? (
            <div className="updates-version-links">
              {update.supersedes.length ? (
                <p><strong>Supersedes:</strong> {update.supersedes.join(", ")}</p>
              ) : null}
              {update.correctionOf.length ? (
                <p><strong>Correction of:</strong> {update.correctionOf.join(", ")}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </details>
  );
}

export default function FieldUpdatesPage({ locale }: { locale: Locale }) {
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);
  const reportHref = isZh ? "/zh/" : "/";
  const updatesHref = isZh ? "/zh/updates/" : "/updates/";
  const languageHref = isZh ? "/updates/" : "/zh/updates/";
  const updates = (fieldUpdates as readonly unknown[]).map((update) =>
    normalizeUpdate(update, locale),
  ).sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  const latest = normalizeUpdate(latestFieldUpdate as unknown, locale);
  const latestSection = (section: string) => `#${sectionId(latest, section)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("Living Field Updates — Auto Research Atlas", "Living Field Updates — Auto Research Atlas 中文版"),
    description: latest.summary,
    inLanguage: isZh ? "zh-CN" : "en",
    dateModified: latest.publishedAt,
    hasPart: updates.map((update) => ({
      "@type": "BlogPosting",
      headline: update.title,
      datePublished: update.publishedAt,
      dateModified: update.publishedAt,
      url: `https://wang422003.github.io/auto-research-roadmap${updatesHref}#${update.publishedAt}`,
    })),
  };

  return (
    <>
      <DocumentLanguage lang={isZh ? "zh-CN" : "en"} />
      <a className="updates-skip-link" href="#updates-main">
        {t("Skip to field updates", "跳到领域更新正文")}
      </a>
      <header className="site-header updates-header">
        <div className="header-row updates-header-row">
          <a className="brand" href={sitePath(reportHref)}>
            <span className="brand-mark">AR</span>
            <span>Auto Research Atlas</span>
          </a>
          <nav className="updates-desktop-nav" aria-label={t("Field updates navigation", "领域更新导航")}>
            <a href={sitePath(reportHref)}>{t("Report", "主报告")}</a>
            <a aria-current="page" href={sitePath(updatesHref)}>{t("Updates", "更新")}</a>
            <a href={sitePath(isZh ? "/zh/ros/" : "/ros/")}>{t("Research OS", "Research OS")}</a>
            <a href={latestSection("themes")}>{t("Themes", "主题")}</a>
            <a href={latestSection("evidence")}>{t("Evidence", "证据")}</a>
            <a href={latestSection("gaps")}>{t("Open gaps", "开放问题")}</a>
          </nav>
          <div className="header-actions updates-header-actions">
            <a className="header-link" href={latestSection("references")}>
              {t("References", "参考文献")} ↗
            </a>
            <a className="language-switch" href={sitePath(`${languageHref}#${latest.publishedAt}`)} hrefLang={isZh ? "en" : "zh-CN"}>
              {isZh ? "EN" : "中文"}
            </a>
          </div>
        </div>
        <nav className="updates-mobile-nav" aria-label={t("Field update sections", "领域更新章节")}>
          <a href={sitePath(reportHref)}>{t("Report", "主报告")}</a>
          <a href={sitePath(isZh ? "/zh/ros/" : "/ros/")}>Research OS</a>
          <a href={latestSection("changes")}>{t("Changed", "变化")}</a>
          <a href={latestSection("themes")}>{t("Themes", "主题")}</a>
          <a href={latestSection("evidence")}>{t("Evidence", "证据")}</a>
          <a href={latestSection("ladder")}>Capability</a>
          <a href={latestSection("gaps")}>{t("Gaps", "问题")}</a>
        </nav>
      </header>

      <main className="updates-main" id="updates-main" lang={isZh ? "zh-CN" : "en"}>
        <section className="updates-hero" id="top">
          <div className="updates-hero-copy">
            <div className="updates-eyebrow">
              <span className="live-dot" /> Living Field Updates · {updateLabel(latest.id)} · <time dateTime={latest.publishedAt}>{latest.publishedAt}</time>
            </div>
            <h1>
              <span>{latest.title}</span>
              <span className="updates-hero-subline">{t("Process evidence expands; novelty remains a claim.", "Process Evidence 扩展；Novelty 仍只是 Claim。")}</span>
            </h1>
            <p>{latest.summary}</p>
            <div className="updates-hero-actions">
              <a className="button primary" href={`#${latest.publishedAt}`}>
                {t("Read the latest update", "阅读最新更新")}
              </a>
              <a className="button" href={sitePath(reportHref)}>
                {t("Return to v1.1 report", "返回 v1.1 主报告")}
              </a>
            </div>
          </div>
          <aside className="updates-review-card" aria-label={t("Update review dates", "更新审阅日期")}>
            <dl>
              <div>
                <dt>{t("Last reviewed", "Last Reviewed")}</dt>
                <dd><time dateTime={latest.publishedAt}>{latest.publishedAt}</time></dd>
              </div>
              <div>
                <dt>Evidence Cutoff</dt>
                <dd><time dateTime={latest.evidenceCutoff}>{latest.evidenceCutoff}</time></dd>
              </div>
              <div>
                <dt>{t("Previous report cutoff", "Previous Report Cutoff")}</dt>
                <dd><time dateTime={latest.previousCutoff}>{latest.previousCutoff}</time></dd>
              </div>
            </dl>
            <p>
              {t(
                "Append-only. Corrections create a new versioned entry; prior evidence grades are never silently rewritten.",
                "Append-only。纠错会创建新的 Versioned Entry，旧 Evidence Grade 不会被静默覆盖。",
              )}
              <span className="updates-frozen-cutoff">
                {t("Frozen v1.1 report cutoff", "冻结的 v1.1 报告 Cutoff")} · <time dateTime={frozenReportCutoff}>{frozenReportCutoff}</time>
              </span>
            </p>
          </aside>
        </section>

        <section className="updates-boundary" aria-label={t("Evidence boundary", "证据边界")}>
          <span>{t("Current boundary", "当前边界")}</span>
          <strong>
            {t(
              "Better Evaluation and Execution—not solved Genuine Novelty.",
              "进步来自更强的 Evaluation 与 Execution，而不是已解决 Genuine Novelty。",
            )}
          </strong>
          <p>
            {t(
              "Untouched Holdouts, Artifact-aware Review, Stepwise Verification, and real instrument execution are strengthening the evidence base. Scientific Judgment, Independent Replication, Long-horizon Coherence, and Research Integrity remain bottlenecks.",
              "Untouched Holdout、Artifact-aware Review、Stepwise Verification 与 Real Instrument Execution 正在强化证据；Scientific Judgment、Independent Replication、Long-horizon Coherence 与 Research Integrity 仍是主要 Bottleneck。",
            )}
          </p>
        </section>

        <section className="updates-ros-lens" aria-labelledby="updates-ros-lens-title">
          <div>
            <span className="updates-section-label">Research Operating System</span>
            <h2 id="updates-ros-lens-title">{t("Read the field through a durable system lens.", "用持久系统视角理解这个领域。")}</h2>
            <p>{t("The companion series separates State, Execution, and Control & Accountability, then turns the evidence gap into an operating checklist.", "配套系列拆解 State、Execution 与 Control & Accountability，并把 Evidence Gap 变成可执行 Checklist。")}</p>
          </div>
          <div className="updates-ros-links">
            <a className="button primary" href={sitePath(isZh ? "/zh/ros/" : "/ros/")}>{t("Open Research OS", "打开 Research OS")}</a>
            <a href={sitePath(isZh ? "/zh/ros/foundations/" : "/ros/foundations/")}>{t("Foundations", "Foundations")} ↗</a>
            <a href={sitePath(isZh ? "/zh/ros/evaluation/" : "/ros/evaluation/")}>{t("Evaluation", "Evaluation")} ↗</a>
            <a href={sitePath(isZh ? "/zh/ros/practice/" : "/ros/practice/")}>{t("Practice", "Practice")} ↗</a>
          </div>
        </section>

        <section className="updates-archive" id="archive">
          <div className="updates-archive-heading">
            <div className="updates-section-label">Versioned Archive</div>
            <h2>{t("Newest first. History stays visible.", "最新在前，历史始终可见。")}</h2>
            <p>
              {t(
                "The latest entry is expanded. Older entries remain fully server-rendered and can be opened in place.",
                "最新条目默认展开；旧条目仍完整 Server-rendered，可在原位展开。",
              )}
            </p>
          </div>
          <div className="updates-entry-list">
            {updates.map((update, index) => (
              <UpdateEntry
                key={update.id || update.publishedAt}
                update={update}
                locale={locale}
                latest={index === 0}
              />
            ))}
          </div>
        </section>

        <footer className="updates-footer">
          <div><span className="brand-mark">AR</span><strong>Auto Research Atlas</strong></div>
          <p>
            {t("Independent synthesis for Research Topic Selection.", "面向 Research Topic Selection 的独立技术综述。")}
            <br />
            {t("Manual review cadence: monthly, plus major evidence events.", "人工更新节奏：每月一次，重大证据事件可提前发布。")}
          </p>
          <a href="#top">{t("Back to top", "返回顶部")} ↑</a>
        </footer>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
