import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ResearchOsArticlePage from "../article-page";
import { getResearchOsArticle, researchOsArticles } from "@/content/research-os";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

export function generateStaticParams() {
  return researchOsArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getResearchOsArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title.en} — Auto Research Atlas`,
    description: article.dek.en,
    alternates: { canonical: `${SITE_URL}/ros/${article.slug}/`, languages: { en: `${SITE_URL}/ros/${article.slug}/`, "zh-CN": `${SITE_URL}/zh/ros/${article.slug}/` } },
    openGraph: { title: `${article.title.en} — Auto Research Atlas`, description: article.dek.en, type: "article", url: `${SITE_URL}/ros/${article.slug}/`, locale: "en_US", alternateLocale: ["zh_CN"], publishedTime: article.lastReviewed, modifiedTime: article.lastReviewed, images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Auto Research Atlas" }] },
    twitter: { card: "summary_large_image", title: `${article.title.en} — Auto Research Atlas`, description: article.dek.en, images: [`${SITE_URL}/og.png`] },
  };
}

export default async function ResearchOsArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getResearchOsArticle(slug);
  if (!article) notFound();
  return <ResearchOsArticlePage article={article} locale="en" />;
}
