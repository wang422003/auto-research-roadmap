import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/auto-research-roadmap" : "",
  assetPrefix: isGitHubPages ? "/auto-research-roadmap/" : "",
  images: { unoptimized: true },
};

export default nextConfig;
