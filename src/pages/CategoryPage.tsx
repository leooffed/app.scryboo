import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {useSEO} from "../lib/seo";

useSEO({
  title: "Catégories d'outils - Scryboo",
  description: "Découvrez nos différentes catégories d'outils gratuits en ligne pour améliorer votre productivité.",
  canonical: "/categories",
});

import {
  CATEGORIES,
  COLOR_CLASSES,
  getToolsByCategory,
  type ToolCategory,
} from "../lib/tools-registry";
import { ToolCard, ToolIcon } from "../components/tools/ToolCard";
import { AdBanner } from "../components/ads/AdBanner";

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const valid = category && category in CATEGORIES;

  useEffect(() => {
    if (valid) {
      const c = CATEGORIES[category as ToolCategory];
      document.title = `${c.label} — Outils gratuits en ligne | Scryboo Tools`;
    }
  }, [valid, category]);

  if (!valid) return <Navigate to="/" replace />;

  const cat = category as ToolCategory;
  const info = CATEGORIES[cat];
  const colors = COLOR_CLASSES[info.color];
  const tools = getToolsByCategory(cat);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <AdBanner slot="SCRY-CAT-LEAD" format="horizontal" className="my-4" />

      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">{info.label}</span>
      </nav>

      <div className="flex items-center gap-4 mb-8">
        <span className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center`}>
          <ToolIcon name={info.icon} className={`w-7 h-7 ${colors.text}`} />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{info.label}</h1>
          <p className="text-gray-600">{info.tagline} — {tools.length} outils gratuits.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>

      <AdBanner slot="SCRY-CAT-BOTTOM" format="responsive" className="my-10" />
    </div>
  );
}
