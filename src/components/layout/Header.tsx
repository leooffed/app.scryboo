import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LogOut, Search, Wrench } from "lucide-react";
import { CATEGORIES, CATEGORY_ORDER, COLOR_CLASSES } from "../../lib/tools-registry";
import { ToolSearch } from "../tools/ToolSearch";
import { ToolIcon } from "../tools/ToolCard";
import { initials, logout, useAuth } from "../../lib/auth";

function UserMenu() {
  const user = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) {
    return (
      <Link
        to="/auth"
        className="inline-flex items-center px-3.5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/25 whitespace-nowrap"
      >
        Commencer
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Compte de ${user.name}`}
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
      >
        {initials(user.name)}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <p className="px-4 py-2 text-xs text-green-600 font-medium">✓ Accès illimité activé</p>
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const location = useLocation();
  const chipsRef = useRef<HTMLElement>(null);

  // Header auto-masquable au scroll (mobile/tablette) — comme une app native
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 64) {
        setHidden(false);
      } else if (Math.abs(y - lastY.current) > 8) {
        setHidden(y > lastY.current);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Centre la chip active quand on change de page
  useEffect(() => {
    const active = chipsRef.current?.querySelector<HTMLElement>("[aria-current='page']");
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 transition-transform duration-300 lg:!translate-y-0 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 lg:h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Accueil Scryboo Tools">
          <span className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </span>
          <span className="font-bold text-gray-900 text-base lg:text-lg">
            Scryboo <span className="text-blue-600">Tools</span>
          </span>
        </Link>

        {/* Navigation desktop — inchangée */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Catégories d'outils">
          {CATEGORY_ORDER.map((cat) => (
            <NavLink
              key={cat}
              to={`/${cat}`}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              {CATEGORIES[cat].label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher un outil"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <UserMenu />
        </div>
      </div>

      {/* Chips de catégories scrollables — mobile & tablette uniquement */}
      <nav
        ref={chipsRef}
        aria-label="Catégories (mobile)"
        className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2.5 -mt-0.5"
      >
        {CATEGORY_ORDER.map((cat) => {
          const info = CATEGORIES[cat];
          const colors = COLOR_CLASSES[info.color];
          return (
            <NavLink
              key={cat}
              to={`/${cat}`}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-600 border-gray-200 active:bg-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ToolIcon name={info.icon} className={`w-3.5 h-3.5 ${isActive ? "text-white" : colors.text}`} />
                  {info.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {searchOpen && <ToolSearch onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
