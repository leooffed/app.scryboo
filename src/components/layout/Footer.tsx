import { Link } from "react-router-dom";
import { CATEGORIES, CATEGORY_ORDER, getToolsByCategory } from "../../lib/tools-registry";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <p className="font-bold text-white text-lg mb-2">
            Scryboo <span className="text-blue-400">Tools</span>
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Des outils en ligne 100&nbsp;% gratuits pour le grand public et les PME en Afrique
            francophone. Aucune inscription, traitement dans votre navigateur.
          </p>
        </div>

        {CATEGORY_ORDER.slice(0, 3).map((cat) => (
          <div key={cat}>
            <p className="font-semibold text-white text-sm mb-3">{CATEGORIES[cat].label}</p>
            <ul className="space-y-2">
              {getToolsByCategory(cat).slice(0, 5).map((t) => (
                <li key={t.slug}>
                  <Link to={`/${t.category}/${t.slug}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Scryboo — tools.scryboo.com · Tous droits réservés</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 cursor-pointer">Mentions légales</span>
            <span className="hover:text-gray-300 cursor-pointer">Confidentialité</span>
            <span className="hover:text-gray-300 cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
