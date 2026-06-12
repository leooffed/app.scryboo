import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Home, LayoutGrid, Search, Sparkles, FileType, X } from "lucide-react";
import { CATEGORIES, CATEGORY_ORDER, COLOR_CLASSES, getToolsByCategory, type ToolCategory } from "../../lib/tools-registry";
import { ToolIcon } from "../tools/ToolCard";
import { ToolSearch } from "../tools/ToolSearch";

/* ---------- Bottom sheet : toutes les catégories ---------- */
function CategorySheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<ToolCategory | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 lg:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Toutes les catégories d'outils"
    >
      <div
        className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto pb-safe animate-[sheet-up_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        style={{ animationName: "sheet-up" }}
      >
        <style>{`@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100 z-10">
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900">Tous les outils</p>
            <button onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 pb-6">
          {CATEGORY_ORDER.map((cat) => {
            const info = CATEGORIES[cat];
            const colors = COLOR_CLASSES[info.color];
            const tools = getToolsByCategory(cat);
            const open = expanded === cat;
            return (
              <div key={cat} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : cat)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
                  aria-expanded={open}
                >
                  <span className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <ToolIcon name={info.icon} className={`w-5 h-5 ${colors.text}`} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-gray-900 text-sm">{info.label}</span>
                    <span className="block text-xs text-gray-500 truncate">{tools.length} outils</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${open ? "rotate-90" : ""}`} />
                </button>
                {open && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {tools.map((t) => (
                      <button
                        key={t.slug}
                        onClick={() => {
                          navigate(`/${t.category}/${t.slug}`);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <ToolIcon name={t.icon} className={`w-4 h-4 ${colors.text} shrink-0`} />
                        <span className="text-sm text-gray-700 flex-1">{t.name}</span>
                        {t.isPopular && <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Top</span>}
                        {t.usesAI && <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-600">IA</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Barre de navigation basse (mobile + tablette) ---------- */
export function BottomNav() {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const path = location.pathname;
  const isHome = path === "/";
  const isPdf = path.startsWith("/pdf");
  const isIa = path.startsWith("/ia");

  const itemCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-h-[52px] transition-colors ${
      active ? "text-blue-600" : "text-gray-400 active:text-gray-600"
    }`;

  return (
    <>
      <nav
        aria-label="Navigation principale (mobile)"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-safe"
      >
        <div className="flex items-stretch max-w-lg mx-auto">
          <Link to="/" className={itemCls(isHome)} aria-label="Accueil" aria-current={isHome ? "page" : undefined}>
            <Home className="w-5 h-5" strokeWidth={isHome ? 2.4 : 2} />
            <span className={`text-[10px] ${isHome ? "font-semibold" : "font-medium"}`}>Accueil</span>
          </Link>

          <Link to="/pdf" className={itemCls(isPdf)} aria-label="Outils PDF" aria-current={isPdf ? "page" : undefined}>
            <FileType className="w-5 h-5" strokeWidth={isPdf ? 2.4 : 2} />
            <span className={`text-[10px] ${isPdf ? "font-semibold" : "font-medium"}`}>PDF</span>
          </Link>

          {/* Bouton central « Outils » mis en avant */}
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Tous les outils"
            className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[52px]"
          >
            <span className="w-11 h-11 -mt-5 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center active:scale-95 transition-transform">
              <LayoutGrid className="w-5 h-5 text-white" />
            </span>
            <span className="text-[10px] font-medium text-gray-400 mt-0.5">Outils</span>
          </button>

          <Link to="/ia" className={itemCls(isIa)} aria-label="Outils IA" aria-current={isIa ? "page" : undefined}>
            <Sparkles className="w-5 h-5" strokeWidth={isIa ? 2.4 : 2} />
            <span className={`text-[10px] ${isIa ? "font-semibold" : "font-medium"}`}>IA</span>
          </Link>

          <button onClick={() => setSearchOpen(true)} className={itemCls(false)} aria-label="Rechercher un outil">
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Recherche</span>
          </button>
        </div>
      </nav>

      {sheetOpen && <CategorySheet onClose={() => setSheetOpen(false)} />}
      {searchOpen && <ToolSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
