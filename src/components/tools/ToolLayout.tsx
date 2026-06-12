import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { CATEGORIES, type Tool } from "../../lib/tools-registry";
import { AdBanner } from "../ads/AdBanner";
import { ToolFeedback } from "./common";

interface SeoSection {
  howTo?: string;
  why?: string;
  faq?: { q: string; a: string }[];
}

const DEFAULT_FAQ = [
  {
    q: "Mes données sont-elles sauvegardées ?",
    a: "Non. Tout le traitement se fait dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs.",
  },
  {
    q: "Cet outil est-il vraiment gratuit ?",
    a: "Oui, 100 % gratuit et sans inscription. Le site est financé par la publicité, ce qui nous permet de garder tous les outils accessibles à tous.",
  },
];

export function ToolLayout({
  tool,
  children,
  seo,
}: {
  tool: Tool;
  children: React.ReactNode;
  seo?: SeoSection;
}) {
  const category = CATEGORIES[tool.category];

  // SEO : title, meta description, JSON-LD Schema.org
  useEffect(() => {
    document.title = `${tool.name} gratuit en ligne — Scryboo Tools`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", tool.description);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "tool-jsonld";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      description: tool.description,
      url: `https://tools.scryboo.com/${tool.category}/${tool.slug}`,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      inLanguage: "fr",
    });
    document.getElementById("tool-jsonld")?.remove();
    document.head.appendChild(ld);
    window.scrollTo(0, 0);
    return () => ld.remove();
  }, [tool]);

  const faq = [...(seo?.faq ?? []), ...DEFAULT_FAQ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Leaderboard */}
      <AdBanner slot="SCRY-LEAD-1" format="horizontal" className="my-4" />

      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-blue-600">Accueil</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/${tool.category}`} className="hover:text-blue-600">{category.label}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">{tool.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{tool.name}</h1>
          <p className="text-gray-600 mt-2 mb-6">{tool.description}</p>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">{children}</div>

          <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
            <ToolFeedback slug={tool.slug} />
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Traitement 100 % local — vos données ne quittent pas votre navigateur
            </span>
          </div>

          {/* In-content ad */}
          <AdBanner slot="SCRY-INCONTENT-1" format="responsive" className="my-8" />

          {/* Section SEO */}
          <section className="text-gray-600 text-sm leading-relaxed space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Comment utiliser : {tool.name.toLowerCase()}</h2>
            <p>
              {seo?.howTo ??
                `Utilisez l'interface ci-dessus : saisissez vos données ou déposez votre fichier, puis laissez l'outil faire le travail. Le résultat s'affiche instantanément et peut être copié ou téléchargé en un clic. Aucun logiciel à installer, aucune inscription nécessaire.`}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">À quoi sert cet outil ?</h2>
            <p>
              {seo?.why ??
                `${tool.name} est un outil gratuit en ligne pensé pour les étudiants, professionnels et PME. Il fonctionne sur mobile comme sur ordinateur, sans limite d'utilisation, directement dans votre navigateur.`}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">Questions fréquentes</h2>
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-medium text-gray-800">{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <AdBanner slot="SCRY-SIDE-1" format="rectangle" />
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="font-semibold text-blue-900 text-sm mb-1">💡 Le saviez-vous ?</p>
            <p className="text-sm text-blue-800/80">
              Tous les outils Scryboo fonctionnent hors connexion une fois la page chargée. Vos fichiers
              ne sont jamais envoyés sur un serveur.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
