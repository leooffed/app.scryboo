import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import { CATEGORIES, TOOLS_REGISTRY } from "../../lib/tools-registry";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function ToolSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return TOOLS_REGISTRY.filter((t) => t.isPopular);
    return TOOLS_REGISTRY.filter(
      (t) =>
        normalize(t.name).includes(q) ||
        normalize(t.description).includes(q) ||
        t.keywords.some((k) => normalize(k).includes(q))
    ).slice(0, 8);
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-3 sm:pt-24 px-3 sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche d'outils"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un outil… (pdf, tva, image…)"
            aria-label="Rechercher un outil"
            className="flex-1 py-4 text-base sm:text-sm focus:outline-none"
          />
          <button onClick={onClose} aria-label="Fermer la recherche" className="p-2 -mr-1 text-gray-400 hover:text-gray-600 active:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="max-h-[60vh] sm:max-h-80 overflow-y-auto py-2 overscroll-contain">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-400">Aucun outil trouvé pour «&nbsp;{query}&nbsp;»</li>
          )}
          {results.map((t) => (
            <li key={t.slug}>
              <button
                onClick={() => {
                  navigate(`/${t.category}/${t.slug}`);
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors group"
              >
                <span>
                  <span className="block text-sm font-medium text-gray-900">{t.name}</span>
                  <span className="block text-xs text-gray-500">{CATEGORIES[t.category].label}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
