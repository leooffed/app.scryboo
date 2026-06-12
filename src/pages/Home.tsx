import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Zap, ShieldCheck, Globe } from "lucide-react";
import {useSEO} from "../lib/seo";

useSEO({
  title: "Scryboo Tools — Outils en ligne gratuits (texte, PDF, image, IA)",
  description: "Tous vos outils du quotidien, gratuits et instantanés. Texte, image, PDF, calculateurs, dev et IA — tout fonctionne directement dans votre navigateur. Conçu pour le grand public et les PME d'Afrique francophone.",
  canonical: "/",
});

import {
  CATEGORIES,
  CATEGORY_ORDER,
  COLOR_CLASSES,
  TOOLS_REGISTRY,
  getToolsByCategory,
} from "../lib/tools-registry";
import { ToolCard, ToolIcon } from "../components/tools/ToolCard";
import { AdBanner } from "../components/ads/AdBanner";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function Home() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Scryboo Tools — Outils en ligne gratuits (texte, PDF, image, IA)";
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return null;
    return TOOLS_REGISTRY.filter(
      (t) =>
        normalize(t.name).includes(q) ||
        normalize(t.description).includes(q) ||
        t.keywords.some((k) => normalize(k).includes(q))
    );
  }, [query]);

  const popular = TOOLS_REGISTRY.filter((t) => t.isPopular);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-10 text-center">
          <p className="inline-block text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 px-3 py-1 rounded-full mb-4">
            {TOOLS_REGISTRY.length} outils · 100 % gratuits · Sans inscription
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Tous vos outils du quotidien,
            <br className="hidden sm:block" />
            <span className="text-blue-600"> gratuits et instantanés</span>
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Texte, image, PDF, calculateurs, dev et IA — tout fonctionne directement dans votre
            navigateur. Conçu pour le grand public et les PME d'Afrique francophone.
          </p>

          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher parmi tous les outils… (ex : pdf, tva, image)"
              aria-label="Rechercher un outil"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Résultat instantané</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> Données 100 % privées</span>
            <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-500" /> FCFA, TVA Afrique &amp; +</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {/* Résultats de recherche */}
        {filtered && (
          <section className="py-8" aria-live="polite">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""} pour «&nbsp;{query}&nbsp;»
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        )}

        {!filtered && (
          <>
            {/* Populaires */}
            <section className="py-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Les plus utilisés</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popular.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>

            <AdBanner slot="SCRY-HOME-1" format="horizontal" className="my-6" />

            {/* Par catégorie */}
            {CATEGORY_ORDER.map((cat) => {
              const colors = COLOR_CLASSES[CATEGORIES[cat].color];
              return (
                <section key={cat} className="py-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <ToolIcon name={CATEGORIES[cat].icon} className={`w-5 h-5 ${colors.text}`} />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{CATEGORIES[cat].label}</h2>
                        <p className="text-xs text-gray-500">{CATEGORIES[cat].tagline}</p>
                      </div>
                    </div>
                    <Link
                      to={`/${cat}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Tout voir <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getToolsByCategory(cat).map((t) => (
                      <ToolCard key={t.slug} tool={t} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
