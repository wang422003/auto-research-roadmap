"use client";

import { useEffect } from "react";

export default function DocumentLanguage({ lang }: { lang: "en" | "zh-CN" }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
