'use client'
import { useEffect } from "react";

type SEOProps = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object;
};

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (
      name: string,
      content: string,
      attr: "name" | "property" = "name",
    ) => {
      let el = document.querySelector(
        `meta[${attr}="${name}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");

    if (ogImage) setMeta("og:image", ogImage, "property");

    // canonical
    const CANON_BASE = "https://scryboo.com";
    const canonHref = canonical
      ? canonical.startsWith("http")
        ? canonical
        : CANON_BASE + canonical
      : window.location.origin + window.location.pathname;
    let link = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonHref;

    // json-ld
    const SCRIPT_ID = "scryboo-jsonld";
    document.getElementById(SCRIPT_ID)?.remove();
    if (jsonLd) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = SCRIPT_ID;
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [
    title,
    description,
    canonical,
    ogImage,
    jsonLd ? JSON.stringify(jsonLd) : "",
  ]);
}

export const siteName = "Scryboo";
export const siteDesc =
  "Scryboo est une collection d'outils web gratuits, conçus pour les créateurs et entrepreneurs africains. Notre mission : simplifier votre quotidien numérique avec des solutions rapides, efficaces et accessibles à tous.";