import { useEffect, useMemo, useState } from "react";
import { Award, ExternalLink, Globe, Heart, Loader2, Search, Send, Share2, Star, X } from "lucide-react";
import { useAuth, useUsageGate } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

/* ═══════════════════ TYPES ═══════════════════ */
interface AppEntry {
  id: string; name: string; url: string; desc: string; category: string;
  tags: string[]; icon: string; pricing: "gratuit" | "freemium" | "payant" | "open-source";
  rating: number; featured: boolean; affiliate?: string; platform: string;
}
interface Submission { name: string; url: string; desc: string; category: string; submittedBy: string; date: string }

/* ═══════════════════ DATA ═══════════════════ */
const CATS = [
  { id: "all", label: "Tout" },
  { id: "productivite", label: "⚡ Productivité" },
  { id: "design", label: "🎨 Design" },
  { id: "dev", label: "💻 Dev" },
  { id: "ia", label: "🤖 IA" },
  { id: "finance", label: "💰 Finance" },
  { id: "communication", label: "💬 Com" },
  { id: "education", label: "📚 Éducation" },
  { id: "marketing", label: "📣 Marketing" },
  { id: "media", label: "🎬 Médias" },
  { id: "ecommerce", label: "🛒 Commerce" },
  { id: "jeux", label: "🎮 Jeux" },
  { id: "utilitaire", label: "🔧 Outils" },
  { id: "afrique", label: "🌍 Afrique" },
];

const DB: AppEntry[] = [
  { id: "1", name: "Notion", url: "https://notion.so", desc: "Espace de travail tout-en-un : notes, bases de données, wikis, projets.", category: "productivite", tags: ["notes", "projet"], icon: "📝", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "2", name: "Obsidian", url: "https://obsidian.md", desc: "Prise de notes Markdown avec liens bidirectionnels.", category: "productivite", tags: ["notes", "markdown"], icon: "🔮", pricing: "gratuit", rating: 5, featured: true, platform: "Desktop" },
  { id: "3", name: "Trello", url: "https://trello.com", desc: "Gestion de projets visuelle avec tableaux Kanban.", category: "productivite", tags: ["kanban", "projet"], icon: "📋", pricing: "freemium", rating: 4, featured: false, platform: "SaaS" },
  { id: "4", name: "Canva", url: "https://canva.com", desc: "Designs professionnels : affiches, posts, logos et présentations.", category: "design", tags: ["design", "template"], icon: "🎨", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "5", name: "Figma", url: "https://figma.com", desc: "Design d'interfaces collaboratif. Standard UI/UX.", category: "design", tags: ["ui", "prototypage"], icon: "🖌", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "6", name: "Unsplash", url: "https://unsplash.com", desc: "Photos HD libres de droits.", category: "design", tags: ["photos", "libre"], icon: "📷", pricing: "gratuit", rating: 5, featured: false, platform: "Web" },
  { id: "7", name: "GitHub", url: "https://github.com", desc: "Développement collaboratif avec Git.", category: "dev", tags: ["git", "code"], icon: "🐙", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "8", name: "VS Code", url: "https://code.visualstudio.com", desc: "Éditeur de code gratuit et extensible.", category: "dev", tags: ["éditeur", "code"], icon: "💙", pricing: "gratuit", rating: 5, featured: true, platform: "Desktop" },
  { id: "9", name: "Vercel", url: "https://vercel.com", desc: "Déployez des sites web en secondes.", category: "dev", tags: ["hosting", "deploy"], icon: "▲", pricing: "freemium", rating: 5, featured: false, platform: "SaaS" },
  { id: "10", name: "Supabase", url: "https://supabase.com", desc: "Alternative open-source à Firebase.", category: "dev", tags: ["database", "backend"], icon: "⚡", pricing: "freemium", rating: 5, featured: false, platform: "SaaS" },
  { id: "11", name: "ChatGPT", url: "https://chat.openai.com", desc: "Assistant IA conversationnel par OpenAI.", category: "ia", tags: ["chatbot", "gpt"], icon: "🤖", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "12", name: "Claude", url: "https://claude.ai", desc: "Assistant IA par Anthropic. Analyse et raisonnement.", category: "ia", tags: ["chatbot", "analyse"], icon: "🧠", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "13", name: "Wave", url: "https://www.wave.com", desc: "Transfert d'argent mobile en Afrique.", category: "finance", tags: ["mobile-money"], icon: "💸", pricing: "gratuit", rating: 5, featured: true, platform: "Mobile" },
  { id: "14", name: "WhatsApp", url: "https://whatsapp.com", desc: "Messagerie chiffrée n°1 en Afrique.", category: "communication", tags: ["messagerie"], icon: "💬", pricing: "gratuit", rating: 5, featured: true, platform: "Mobile" },
  { id: "15", name: "Duolingo", url: "https://duolingo.com", desc: "Apprenez des langues gratuitement.", category: "education", tags: ["langues"], icon: "🦉", pricing: "freemium", rating: 5, featured: true, platform: "Mobile" },
  { id: "16", name: "Shopify", url: "https://shopify.com", desc: "Créez votre boutique en ligne.", category: "ecommerce", tags: ["boutique"], icon: "🛍", pricing: "payant", rating: 5, featured: true, platform: "SaaS" },
  { id: "17", name: "Flutterwave", url: "https://flutterwave.com", desc: "Paiements pour l'Afrique.", category: "afrique", tags: ["paiement"], icon: "🦋", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "18", name: "Spotify", url: "https://spotify.com", desc: "Musique et podcasts en streaming.", category: "media", tags: ["musique"], icon: "🎵", pricing: "freemium", rating: 5, featured: true, platform: "SaaS" },
  { id: "19", name: "Steam", url: "https://store.steampowered.com", desc: "Plateforme de jeux vidéo PC.", category: "jeux", tags: ["jeux"], icon: "🎮", pricing: "freemium", rating: 5, featured: true, platform: "Desktop" },
  { id: "20", name: "Scryboo Tools", url: "https://tools.scryboo.com", desc: "44+ outils en ligne gratuits.", category: "utilitaire", tags: ["outils", "pdf"], icon: "🔧", pricing: "gratuit", rating: 5, featured: true, platform: "Web" },
  { id: "21", name: "Mailchimp", url: "https://mailchimp.com", desc: "Email marketing et automatisation.", category: "marketing", tags: ["email"], icon: "📧", pricing: "freemium", rating: 4, featured: false, platform: "SaaS" },
  { id: "22", name: "Wise", url: "https://wise.com", desc: "Transferts internationaux au taux réel.", category: "finance", tags: ["transfert"], icon: "🌍", pricing: "freemium", rating: 5, featured: false, platform: "SaaS" },
];

const SK = "scryboo-dir-subs";
const LK = "scryboo-dir-likes";
const PB: Record<string, { l: string; c: string }> = {
  gratuit: { l: "Gratuit", c: "bg-green-100 text-green-700" },
  freemium: { l: "Freemium", c: "bg-blue-100 text-blue-700" },
  payant: { l: "Payant", c: "bg-amber-100 text-amber-700" },
  "open-source": { l: "Open-source", c: "bg-purple-100 text-purple-700" },
};

/* ═══════════════════ COMPONENT ═══════════════════ */
export function AnnuaireApps() {
  const { guard } = useUsageGate();
  const user = useAuth();
  useSEO({
    title: "Annuaire d'applications - Scryboo",
    description: "Découvrez notre annuaire d'applications et outils en ligne gratuits.",
    canonical: "/tools/directory",
  });

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [modal, setModal] = useState(false);
  const [likes, setLikes] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(LK) ?? "[]"); } catch { return []; } });
  const [subs, setSubs] = useState<Submission[]>(() => { try { return JSON.parse(localStorage.getItem(SK) ?? "[]"); } catch { return []; } });
  const [sn, setSn] = useState(""); const [su, setSu] = useState(""); const [sd, setSd] = useState(""); const [sc, setSc] = useState("utilitaire"); const [sb, setSb] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => { try { localStorage.setItem(LK, JSON.stringify(likes)); } catch {} }, [likes]);
  useEffect(() => { try { localStorage.setItem(SK, JSON.stringify(subs)); } catch {} }, [subs]);

  const list = useMemo(() => {
    let r = DB;
    if (cat !== "all") r = r.filter((e) => e.category === cat);
    const q = search.toLowerCase().trim();
    if (q) r = r.filter((e) => e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.tags.some((t) => t.includes(q)));
    return r;
  }, [search, cat]);

  const submit = () => {
    if (!sn.trim() || !su.trim()) return;
    setSubs((s) => [...s, { name: sn.trim(), url: su.trim(), desc: sd.trim(), category: sc, submittedBy: sb.trim() || user?.name || "Anonyme", date: new Date().toISOString() }]);
    setSn(""); setSu(""); setSd(""); setSb(""); setModal(false);
    setInfo("✅ Soumission envoyée. L'équipe Scryboo la vérifiera.");
  };

  const share = (e: AppEntry) => {
    const t = `${e.icon} ${e.name} — ${e.desc}\n${e.affiliate || e.url}\n\nVia tools.scryboo.com`;
    if (navigator.share) navigator.share({ title: e.name, text: t, url: e.affiliate || e.url }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank");
  };

  const ic = "w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4">
      {/* ── Recherche ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une app, un SaaS…"
          aria-label="Rechercher" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* ── Catégories ── */}
      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${cat === c.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Compteur + Proposer ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{list.length} résultat{list.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all">
          <Send className="w-3 h-3" /> Proposer une app
        </button>
      </div>

      {/* ── Liste ── */}
      <div className="grid gap-2">
        {list.map((e) => {
          const liked = likes.includes(e.id);
          const p = PB[e.pricing];
          return (
            <div key={e.id} className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-xl p-3">
              {/* Icône */}
              <span className="text-xl leading-none mt-0.5 shrink-0">{e.icon}</span>

              {/* Contenu */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">{e.name}</span>
                  {e.featured && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  {p && <span className={`text-[9px] font-bold px-1.5 py-px rounded-full shrink-0 ${p.c}`}>{p.l}</span>}
                </div>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-1">{e.desc}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-2.5 h-2.5 ${s <= e.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}
                  </div>
                  <span className="text-[9px] text-gray-400">{e.platform}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                <button onClick={() => setLikes((l) => l.includes(e.id) ? l.filter((x) => x !== e.id) : [...l, e.id])} aria-label="Aimer"
                  className={`p-1.5 rounded-lg transition-colors ${liked ? "text-red-500 bg-red-50" : "text-gray-300 hover:text-red-400"}`}>
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                </button>
                <button onClick={() => share(e)} aria-label="Partager"
                  className="p-1.5 rounded-lg text-gray-300 hover:text-green-500 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <a href={e.affiliate || e.url} target="_blank" rel="noopener noreferrer" aria-label="Visiter"
                  className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="text-center py-10">
            <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun résultat</p>
            <button onClick={() => setModal(true)} className="text-xs text-blue-600 font-medium mt-1">Proposer →</button>
          </div>
        )}
      </div>

      {/* ── Soumissions ── */}
      {subs.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 uppercase">Vos soumissions</p>
          {subs.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs">
              <span className="truncate text-gray-700 font-medium">{s.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-amber-600 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" />En attente</span>
                <button onClick={() => setSubs(subs.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {info && <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}

      {/* ── Modal soumission ── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">Proposer une application</p>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <label className="block"><span className="text-sm font-medium text-gray-700">Nom *</span>
              <input value={sn} onChange={(e) => setSn(e.target.value)} placeholder="Notion, Canva…" className={ic} /></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">URL *</span>
              <input value={su} onChange={(e) => setSu(e.target.value)} placeholder="https://…" className={ic} /></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">Description</span>
              <textarea value={sd} onChange={(e) => setSd(e.target.value)} rows={2} placeholder="À quoi sert cette app…" className={ic + " resize-y"} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-sm font-medium text-gray-700">Catégorie</span>
                <select value={sc} onChange={(e) => setSc(e.target.value)} className={ic + " bg-white"}>
                  {CATS.filter((c) => c.id !== "all").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select></label>
              <label className="block"><span className="text-sm font-medium text-gray-700">Votre nom</span>
                <input value={sb} onChange={(e) => setSb(e.target.value)} placeholder={user?.name || "Anonyme"} className={ic} /></label>
            </div>
            <button onClick={() => guard(submit)} disabled={!sn.trim() || !su.trim()}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 transition-all">
              Soumettre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
