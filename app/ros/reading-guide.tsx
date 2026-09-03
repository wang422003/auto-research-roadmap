import { getLocalized } from "@/content/field-updates";
import { researchOsArticles } from "@/content/research-os";
import { sitePath } from "../site-path";
import type {
  ResearchOsReadingEntry,
  ResearchOsReadingGroup,
  ResearchOsReadingList,
  ResearchOsReference,
} from "@/content/research-os";

export type ReadingGuideLocale = "en" | "zh";
export type ReadingGuideMode = "full" | "compact";

type ResolvedEntry = {
  entry: ResearchOsReadingEntry;
  reference?: ResearchOsReference;
  companionReferences: ResearchOsReference[];
};

const TRACK_LABELS: Record<string, { en: string; zh: string }> = {
  direct: { en: "Direct Research OS Framing", zh: "直接 Research OS Framing" },
  foundations: { en: "Foundations & Human–Agent Boundary", zh: "Foundations 与 Human–Agent Boundary" },
  systems: { en: "Executable Research Systems", zh: "Executable Research Systems" },
  evaluation: { en: "Evaluation & Accountability", zh: "Evaluation 与 Accountability" },
  lab: { en: "Lab-in-the-loop & Real-world Validation", zh: "Lab-in-the-loop 与 Real-world Validation" },
};

const STATUS_LABELS: Record<string, { en: string; zh: string }> = {
  "Peer-reviewed": { en: "Peer-reviewed", zh: "Peer-reviewed" },
  Preprint: { en: "Preprint", zh: "Preprint" },
  SSRN: { en: "SSRN", zh: "SSRN" },
};

// A small set of widely used short names keeps the cards scannable while the
// linked heading remains the canonical publication title.  These are editorial
// aliases, not alternative citations; future aliases should be added to the
// content source once the schema carries a first-class shortName field.
const EDITORIAL_ALIASES: Record<string, string> = {
  scion: "SCION",
};

function text(locale: ReadingGuideLocale, value: { en: string; zh: string }): string {
  return locale === "zh" ? value.zh : value.en;
}

function resolveEntry(entry: ResearchOsReadingEntry): ResolvedEntry {
  const article = researchOsArticles.find((candidate) => candidate.slug === entry.articleSlug);
  const reference = article?.references.find((candidate) => candidate.id === entry.referenceId);
  const companionReferences = (entry.companionReferenceIds ?? [])
    .map((id) => article?.references.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ResearchOsReference => Boolean(candidate));
  return { entry, reference, companionReferences };
}

function entriesForGroup(readingList: ResearchOsReadingList, group: ResearchOsReadingGroup): ResolvedEntry[] {
  const entriesById = new Map(readingList.entries.map((entry) => [entry.id, entry]));
  return group.entryIds
    .map((entryId) => entriesById.get(entryId))
    .filter((entry): entry is ResearchOsReadingEntry => Boolean(entry))
    .map(resolveEntry);
}

function evidenceLabel(locale: ReadingGuideLocale, grade: string): string {
  return locale === "zh" ? `Evidence Grade ${grade}` : `Evidence Grade ${grade}`;
}

function ReadingCard({
  resolved,
  locale,
  compact = false,
  index,
}: {
  resolved: ResolvedEntry;
  locale: ReadingGuideLocale;
  compact?: boolean;
  index: number;
}) {
  const { entry, reference, companionReferences } = resolved;
  const title = reference?.title ?? entry.id;
  const whyRead = getLocalized(entry.whyRead, locale);
  const evidenceBoundary = getLocalized(entry.evidenceBoundary, locale);
  const status = STATUS_LABELS[entry.publicationStatus] ?? { en: entry.publicationStatus, zh: entry.publicationStatus };

  return (
    <article className={`ros-reading-card${compact ? " ros-reading-card-compact" : ""}`} id={`reading-${entry.id}`}>
      <div className="ros-reading-card-topline">
        <span className="ros-reading-card-index">{String(index + 1).padStart(2, "0")}</span>
        {EDITORIAL_ALIASES[entry.id] ? <span className="ros-reading-alias">{EDITORIAL_ALIASES[entry.id]}</span> : null}
        <span className={`ros-reading-grade ros-reading-grade-${entry.evidenceMaturity.toLowerCase()}`}>
          {evidenceLabel(locale, entry.evidenceMaturity)}
        </span>
      </div>
      <h3>
        {reference ? (
          <a href={reference.url} target="_blank" rel="noreferrer noopener">
            {title} <i aria-hidden="true">↗</i>
          </a>
        ) : (
          title
        )}
      </h3>
      <div className="ros-reading-card-meta">
        <time dateTime={entry.paperVersionDate}>{entry.paperVersionDate}</time>
        <span>{status[locale]}</span>
        <span>{entry.paperVersion}</span>
      </div>
      <div className="ros-reading-card-copy">
        <p><strong>{locale === "zh" ? "Why read" : "Why read"}</strong>{" "}{whyRead}</p>
        <p className="ros-reading-boundary"><strong>{locale === "zh" ? "Evidence boundary" : "Evidence boundary"}</strong>{" "}{evidenceBoundary}</p>
      </div>
      {companionReferences.length > 0 ? (
        <div className="ros-reading-companions">
          <span>{locale === "zh" ? "Official artifact" : "Official artifact"}</span>
          {companionReferences.map((companion) => (
            <a href={companion.url} target="_blank" rel="noreferrer noopener" key={companion.id}>
              {companion.title} ↗
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function RecommendedPath({ readingList, locale }: { readingList: ResearchOsReadingList; locale: ReadingGuideLocale }) {
  const entriesById = new Map(readingList.entries.map((entry) => [entry.id, entry]));
  const path = readingList.recommendedPath
    .map((entryId) => entriesById.get(entryId))
    .filter((entry): entry is ResearchOsReadingEntry => Boolean(entry))
    .map(resolveEntry);

  return (
    <section className="ros-reading-path" aria-labelledby="ros-reading-path-title">
      <div className="ros-reading-path-heading">
        <span className="ros-reading-eyebrow">{locale === "zh" ? "Recommended path" : "Recommended path"}</span>
        <h3 id="ros-reading-path-title">{locale === "zh" ? "从概念到验证，按这五步阅读。" : "Read from concept to validation."}</h3>
      </div>
      <ol>
        {path.map(({ entry, reference }, index) => (
          <li key={entry.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {reference ? (
              <a href={reference.url} target="_blank" rel="noreferrer noopener">
                {reference.title} <i aria-hidden="true">↗</i>
              </a>
            ) : <strong>{entry.id}</strong>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function EvidenceCaveat({ locale }: { locale: ReadingGuideLocale }) {
  return (
    <aside className="ros-reading-caveat" role="note">
      <span className="ros-reading-eyebrow">{locale === "zh" ? "Evidence boundary" : "Evidence boundary"}</span>
      <p>
        {locale === "zh"
          ? "Peer-reviewed does not imply Independent Replication。开放 Code、Paper Acceptance 与 Real-world Demonstration 也应分别记录。"
          : "Peer-reviewed does not imply Independent Replication. Open Code, Paper Acceptance, and Real-world Demonstration remain separate signals."}
      </p>
    </aside>
  );
}

function ReadingGroups({ readingList, locale }: { readingList: ResearchOsReadingList; locale: ReadingGuideLocale }) {
  return (
    <div className="ros-reading-groups">
      {readingList.groups.map((group) => {
        const entries = entriesForGroup(readingList, group);
        const groupLabel = text(locale, group.title) || TRACK_LABELS[group.id]?.[locale] || group.id;
        return (
          <details className={`ros-reading-group ros-reading-group-${group.id}`} open={group.id === "direct"} key={group.id}>
            <summary>
              <span className="ros-reading-group-number">{String(readingList.groups.indexOf(group) + 1).padStart(2, "0")}</span>
              <span className="ros-reading-group-title"><strong>{groupLabel}</strong><small>{getLocalized(group.summary, locale)}</small></span>
              <span className="ros-reading-group-count">{entries.length} {locale === "zh" ? "篇 Paper" : "papers"}</span>
              <span className="ros-reading-group-plus" aria-hidden="true">＋</span>
            </summary>
            <div className="ros-reading-group-body">
              {entries.map((resolved, index) => <ReadingCard resolved={resolved} locale={locale} index={index} key={resolved.entry.id} />)}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function ReadingGuide({
  readingList,
  locale,
  mode,
}: {
  readingList: ResearchOsReadingList;
  locale: ReadingGuideLocale;
  mode: ReadingGuideMode;
}) {
  const directGroup = readingList.groups.find((group) => group.id === "direct") ?? readingList.groups[0];
  const directEntries = directGroup ? entriesForGroup(readingList, directGroup).slice(0, 4) : [];
  const isCompact = mode === "compact";

  if (isCompact) {
    return (
      <div className="ros-reading-guide ros-reading-guide-compact">
        <div className="ros-reading-lead">
          <span className="ros-reading-eyebrow">{locale === "zh" ? "Curated reading list" : "Curated reading list"}</span>
          <h3>{locale === "zh" ? "Research OS 仍是一个 emerging framing。" : "Research OS is still an emerging framing."}</h3>
          <p>{getLocalized(readingList.framing, locale)}</p>
        </div>
        <div className="ros-reading-featured-grid">
          {directEntries.map((resolved, index) => <ReadingCard resolved={resolved} locale={locale} compact index={index} key={resolved.entry.id} />)}
        </div>
        <RecommendedPath readingList={readingList} locale={locale} />
        <EvidenceCaveat locale={locale} />
        <a className="ros-reading-open-link" href={sitePath(locale === "zh" ? "/zh/ros/foundations/#closest-literature" : "/ros/foundations/#closest-literature")}>
          {locale === "zh" ? "打开完整 Reading Inventory" : "Open the full reading inventory"} <span aria-hidden="true">↘</span>
        </a>
      </div>
    );
  }

  return (
    <div className="ros-reading-guide ros-reading-guide-full">
      <div className="ros-reading-lead">
        <span className="ros-reading-eyebrow">{locale === "zh" ? "Curated reading inventory" : "Curated reading inventory"}</span>
        <p>{getLocalized(readingList.framing, locale)}</p>
        <p className="ros-reading-disambiguation">
          {locale === "zh"
            ? "这里的 Research Operating System 指 AI-native scientific workflow substrate，不是 UX ResearchOps 的 participant / recruitment operation。"
            : "Here, Research Operating System means an AI-native scientific workflow substrate—not UX ResearchOps for participant or recruitment operations."}
        </p>
      </div>
      <RecommendedPath readingList={readingList} locale={locale} />
      <EvidenceCaveat locale={locale} />
      <ReadingGroups readingList={readingList} locale={locale} />
    </div>
  );
}

export { EvidenceCaveat, ReadingCard, RecommendedPath };
