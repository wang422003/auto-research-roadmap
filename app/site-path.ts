const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === "true" ? "/auto-research-roadmap" : "";

/**
 * Static, server-rendered internal URL helper. It keeps the Vinext preview free
 * of client-side routing while preserving the GitHub Pages project basePath in
 * the Next.js export.
 */
export function sitePath(href: string): string {
  if (!href.startsWith("/")) return href;
  return `${githubPagesBasePath}${href}`;
}
