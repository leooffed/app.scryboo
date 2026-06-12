import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy, Download, Eye, Image as ImageIcon, Maximize2, Minimize2, Plus, Search, Share2, Trash2, Upload } from "lucide-react";
import { ClearButton } from "../../components/tools/common";
import { useUsageGate } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Créateur de site web - Scryboo",
  description: "Créez facilement votre site web professionnel sans compétences techniques.",
  canonical: "/tools/site-builder",
});

/* ═══════════════════════════ TYPES ═══════════════════════════ */
type BlockType = "hero" | "about" | "menu" | "gallery" | "rooms" | "testimonials" | "contact" | "footer" | "cta" | "features" | "image-banner" | "text-block" | "spacer";
const uid = () => Math.random().toString(36).slice(2, 10);

interface Block { id: string; type: BlockType; data: Record<string, string>; collapsed?: boolean }

interface FieldDef { key: string; label: string; type: "text" | "textarea" | "color" | "url" | "image" }

interface BlockDef {
  type: BlockType; label: string; emoji: string; group: string;
  defaultData: Record<string, string>; fields: FieldDef[];
}

/* ═══════════════════════════ STOCK IMAGES ═══════════════════════════ */
const STOCK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80", label: "Restaurant intérieur" },
  { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", label: "Plat gastronomique" },
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80", label: "Restaurant terrasse" },
  { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", label: "Cuisine africaine" },
  { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", label: "Hôtel piscine" },
  { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", label: "Chambre d'hôtel" },
  { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", label: "Hôtel luxe" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", label: "Nourriture délicieuse" },
  { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", label: "Café ambiance" },
  { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80", label: "Salade fraîche" },
  { url: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80", label: "Petit-déjeuner" },
  { url: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&q=80", label: "Table dressée" },
];

/* ═══════════════════════════ BLOCK DEFINITIONS ═══════════════════════════ */
const BLOCK_DEFS: BlockDef[] = [
  {
    type: "hero", label: "En-tête héro", emoji: "🏠", group: "Structure",
    defaultData: { title: "Bienvenue chez nous", subtitle: "Le meilleur restaurant de la ville", btnText: "Réserver maintenant", btnUrl: "#contact", bgImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80", bgColor: "#1e293b", accentColor: "#f59e0b", overlay: "0.5" },
    fields: [
      { key: "title", label: "Titre principal", type: "text" },
      { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "btnText", label: "Texte du bouton", type: "text" },
      { key: "btnUrl", label: "Lien du bouton", type: "url" },
      { key: "bgImage", label: "Image de fond", type: "image" },
      { key: "bgColor", label: "Couleur de fond (si pas d'image)", type: "color" },
      { key: "accentColor", label: "Couleur du bouton", type: "color" },
    ],
  },
  {
    type: "about", label: "À propos", emoji: "📖", group: "Contenu",
    defaultData: { title: "Notre histoire", text: "Fondé en 2020, notre établissement vous accueille dans un cadre chaleureux et authentique. Notre équipe passionnée met tout en œuvre pour vous offrir une expérience inoubliable, mêlant saveurs locales et touches internationales.", image: "", bgColor: "#ffffff" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "text", label: "Description", type: "textarea" },
      { key: "image", label: "Photo (optionnel)", type: "image" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "image-banner", label: "Bannière image", emoji: "🖼", group: "Média",
    defaultData: { image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80", caption: "", height: "300" },
    fields: [
      { key: "image", label: "Image", type: "image" },
      { key: "caption", label: "Légende (optionnel)", type: "text" },
      { key: "height", label: "Hauteur (px)", type: "text" },
    ],
  },
  {
    type: "menu", label: "Menu / Carte", emoji: "🍽", group: "Contenu",
    defaultData: { title: "Notre Menu", item1: "Poulet DG|5 000 FCFA|Poulet sauté aux légumes et plantain", item2: "Tilapia braisé|4 000 FCFA|Poisson grillé, sauce tomate, plantain", item3: "Ndolé|3 500 FCFA|Feuilles amères, crevettes, arachides", item4: "Jus de fruits|1 000 FCFA|Orange, mangue ou passion", bgColor: "#fffbeb", accentColor: "#92400e" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "item1", label: "Plat 1 (Nom|Prix|Description)", type: "text" },
      { key: "item2", label: "Plat 2", type: "text" },
      { key: "item3", label: "Plat 3", type: "text" },
      { key: "item4", label: "Plat 4", type: "text" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
      { key: "accentColor", label: "Couleur des prix", type: "color" },
    ],
  },
  {
    type: "rooms", label: "Chambres / Services", emoji: "🛏", group: "Contenu",
    defaultData: { title: "Nos Chambres", room1: "Standard|25 000 FCFA/nuit|Wi-Fi, climatisation, petit-déjeuner", room2: "Deluxe|50 000 FCFA/nuit|Suite avec salon, minibar, vue panoramique", room3: "Présidentielle|100 000 FCFA/nuit|Jacuzzi privé, room service 24h", bgColor: "#f0fdf4" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "room1", label: "Chambre 1 (Nom|Prix|Détails)", type: "text" },
      { key: "room2", label: "Chambre 2", type: "text" },
      { key: "room3", label: "Chambre 3", type: "text" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "features", label: "Avantages", emoji: "⭐", group: "Contenu",
    defaultData: { title: "Pourquoi nous choisir", f1: "🍽|Cuisine locale|Des plats préparés avec des produits frais du marché", f2: "📶|Wi-Fi gratuit|Connexion haut débit dans tout l'établissement", f3: "🅿️|Parking|Parking privé et sécurisé", f4: "🎵|Musique live|Ambiance musicale tous les weekends", bgColor: "#f8fafc" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "f1", label: "Avantage 1 (Emoji|Titre|Description)", type: "text" },
      { key: "f2", label: "Avantage 2", type: "text" },
      { key: "f3", label: "Avantage 3", type: "text" },
      { key: "f4", label: "Avantage 4", type: "text" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "gallery", label: "Galerie photos", emoji: "📸", group: "Média",
    defaultData: { title: "Notre galerie", img1: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80", img2: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80", img3: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&q=80", img4: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&q=80", bgColor: "#ffffff" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "img1", label: "Image 1", type: "image" },
      { key: "img2", label: "Image 2", type: "image" },
      { key: "img3", label: "Image 3", type: "image" },
      { key: "img4", label: "Image 4", type: "image" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "testimonials", label: "Avis clients", emoji: "💬", group: "Contenu",
    defaultData: { title: "Ce que disent nos clients", t1name: "Aïcha D.", t1text: "Un cadre magnifique et une cuisine exceptionnelle ! Je recommande à 100%.", t2name: "Jean-Pierre M.", t2text: "Le meilleur hôtel de la ville. Personnel accueillant et chambres impeccables.", bgColor: "#eff6ff" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "t1name", label: "Client 1 — nom", type: "text" }, { key: "t1text", label: "Client 1 — avis", type: "textarea" },
      { key: "t2name", label: "Client 2 — nom", type: "text" }, { key: "t2text", label: "Client 2 — avis", type: "textarea" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "cta", label: "Appel à l'action", emoji: "📢", group: "Structure",
    defaultData: { title: "Réservez votre table dès maintenant", subtitle: "Places limitées pour ce weekend", btnText: "Appeler · +237 6XX XX XX XX", btnUrl: "tel:+237600000000", bgColor: "#2563eb" },
    fields: [
      { key: "title", label: "Message principal", type: "text" },
      { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "btnText", label: "Texte du bouton", type: "text" },
      { key: "btnUrl", label: "Lien", type: "url" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "text-block", label: "Bloc de texte", emoji: "📝", group: "Contenu",
    defaultData: { text: "Ajoutez ici du contenu libre pour votre site : conditions, informations supplémentaires, mentions légales…", bgColor: "#ffffff" },
    fields: [
      { key: "text", label: "Contenu", type: "textarea" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "contact", label: "Contact", emoji: "📞", group: "Structure",
    defaultData: { title: "Nous contacter", address: "Quartier Bonapriso, Douala — Cameroun", phone: "+237 6XX XX XX XX", email: "info@monrestaurant.com", hours: "Lun-Sam : 11h-23h · Dim : 12h-22h", bgColor: "#ffffff", mapQuery: "Douala Cameroun" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "address", label: "Adresse", type: "text" },
      { key: "phone", label: "Téléphone", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "hours", label: "Horaires", type: "text" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "footer", label: "Pied de page", emoji: "📋", group: "Structure",
    defaultData: { text: "© 2026 Mon Restaurant — Tous droits réservés", social: "Facebook · Instagram · WhatsApp", bgColor: "#0f172a" },
    fields: [
      { key: "text", label: "Texte copyright", type: "text" },
      { key: "social", label: "Réseaux sociaux", type: "text" },
      { key: "bgColor", label: "Couleur de fond", type: "color" },
    ],
  },
  {
    type: "spacer", label: "Espace vide", emoji: "↕️", group: "Structure",
    defaultData: { height: "40", bgColor: "#ffffff" },
    fields: [{ key: "height", label: "Hauteur (px)", type: "text" }, { key: "bgColor", label: "Couleur", type: "color" }],
  },
];

const BLOCK_GROUPS = ["Structure", "Contenu", "Média"];

const TEMPLATES = [
  { name: "Restaurant africain", emoji: "🍛", types: ["hero", "about", "menu", "gallery", "features", "testimonials", "cta", "contact", "footer"] },
  { name: "Hôtel / Lodge", emoji: "🏨", types: ["hero", "about", "rooms", "gallery", "features", "testimonials", "contact", "footer"] },
  { name: "Café / Bar", emoji: "☕", types: ["hero", "image-banner", "menu", "features", "cta", "contact", "footer"] },
  { name: "Page vierge", emoji: "📄", types: [] as string[] },
];

/* ═══════════════════════════ HTML GENERATOR ═══════════════════════════ */
function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function isLight(hex: string) { const c = hex.replace("#", ""); if (c.length !== 6) return true; return (parseInt(c.slice(0, 2), 16) * 299 + parseInt(c.slice(2, 4), 16) * 587 + parseInt(c.slice(4, 6), 16) * 114) / 1000 > 128; }
function parseItem(s: string) { const [name, price, desc] = (s || "").split("|").map((x) => x.trim()); return { name: name || "", price: price || "", desc: desc || "" }; }

function generateHtml(blocks: Block[], subdomain: string): string {
  let body = "";
  for (const b of blocks) {
    const d = b.data;
    const bg = d.bgColor || "#ffffff";
    const tc = isLight(bg) ? "#1e293b" : "#ffffff";
    const ac = d.accentColor || "#f59e0b";
    switch (b.type) {
      case "hero": {
        const hasBg = d.bgImage?.startsWith("http");
        body += `<section style="position:relative;min-height:480px;display:flex;align-items:center;justify-content:center;text-align:center;${hasBg ? `background:url('${d.bgImage}') center/cover` : `background:${bg}`};color:#fff"><div style="position:absolute;inset:0;background:rgba(0,0,0,${d.overlay || "0.5"})"></div><div style="position:relative;z-index:1;padding:40px 20px;max-width:700px"><h1 style="font-size:clamp(2em,5vw,3.5em);margin:0;font-weight:800">${esc(d.title)}</h1><p style="font-size:clamp(1em,2.5vw,1.4em);opacity:.85;margin:16px 0 32px">${esc(d.subtitle)}</p>${d.btnText ? `<a href="${esc(d.btnUrl || "#")}" style="display:inline-block;background:${ac};color:#fff;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:1.05em;transition:transform .2s">${esc(d.btnText)}</a>` : ""}</div></section>`;
        break;
      }
      case "about": {
        const hasImg = d.image?.startsWith("http");
        body += `<section style="background:${bg};padding:80px 20px"><div style="max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;gap:40px;align-items:center">${hasImg ? `<img src="${d.image}" alt="" style="width:min(100%,380px);border-radius:16px;object-fit:cover;aspect-ratio:4/3">` : ""}<div style="flex:1;min-width:280px"><h2 style="color:${tc};font-size:1.8em;margin:0 0 16px">${esc(d.title)}</h2><p style="color:${isLight(bg) ? "#475569" : "#cbd5e1"};line-height:1.9;font-size:1.05em">${esc(d.text)}</p></div></div></section>`;
        break;
      }
      case "image-banner":
        body += `<section style="background:${bg}"><img src="${d.image || ""}" alt="${esc(d.caption || "")}" style="width:100%;height:${d.height || 300}px;object-fit:cover;display:block">${d.caption ? `<p style="text-align:center;padding:12px;font-size:.9em;color:#64748b">${esc(d.caption)}</p>` : ""}</section>`;
        break;
      case "menu":
        body += `<section style="background:${bg};padding:80px 20px"><h2 style="text-align:center;color:${tc};font-size:2em;margin:0 0 40px">${esc(d.title)}</h2><div style="max-width:600px;margin:0 auto">${[1,2,3,4].map(i => { const it = parseItem(d[`item${i}`] || ""); if (!it.name) return ""; return `<div style="padding:20px 0;border-bottom:1px solid ${isLight(bg) ? "#e5e7eb" : "#334155"}"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:600;color:${tc};font-size:1.1em">${esc(it.name)}</span><span style="font-weight:700;color:${ac};white-space:nowrap">${esc(it.price)}</span></div>${it.desc ? `<p style="margin:6px 0 0;font-size:.9em;color:${isLight(bg) ? "#64748b" : "#94a3b8"}">${esc(it.desc)}</p>` : ""}</div>`; }).join("")}</div></section>`;
        break;
      case "rooms":
        body += `<section style="background:${bg};padding:80px 20px"><h2 style="text-align:center;color:${tc};font-size:2em;margin:0 0 40px">${esc(d.title)}</h2><div style="max-width:700px;margin:0 auto;display:grid;gap:16px">${[1,2,3].map(i => { const it = parseItem(d[`room${i}`] || ""); if (!it.name) return ""; return `<div style="padding:24px;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span style="font-weight:700;font-size:1.15em;color:#1e293b">${esc(it.name)}</span><span style="font-weight:700;color:#2563eb">${esc(it.price)}</span></div><p style="margin:0;color:#64748b;font-size:.95em">${esc(it.desc)}</p></div>`; }).join("")}</div></section>`;
        break;
      case "features":
        body += `<section style="background:${bg};padding:80px 20px"><h2 style="text-align:center;color:${tc};font-size:2em;margin:0 0 40px">${esc(d.title)}</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;max-width:900px;margin:0 auto">${[1,2,3,4].map(i => { const parts = (d[`f${i}`] || "").split("|").map((x) => x.trim()); if (!parts[0]) return ""; return `<div style="padding:28px 20px;background:#fff;border-radius:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05)"><span style="font-size:2em;display:block;margin-bottom:12px">${parts[0]}</span><h3 style="margin:0 0 8px;color:#1e293b;font-size:1.05em">${esc(parts[1] || "")}</h3><p style="margin:0;color:#64748b;font-size:.9em;line-height:1.6">${esc(parts[2] || "")}</p></div>`; }).join("")}</div></section>`;
        break;
      case "gallery":
        body += `<section style="background:${bg};padding:80px 20px"><h2 style="text-align:center;color:${tc};font-size:2em;margin:0 0 40px">${esc(d.title)}</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;max-width:900px;margin:0 auto">${[1,2,3,4].map(i => d[`img${i}`] ? `<img src="${d[`img${i}`]}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px">` : "").join("")}</div></section>`;
        break;
      case "testimonials":
        body += `<section style="background:${bg};padding:80px 20px"><h2 style="text-align:center;color:${tc};font-size:2em;margin:0 0 40px">${esc(d.title)}</h2><div style="max-width:700px;margin:0 auto;display:grid;gap:20px">${[1,2].map(i => d[`t${i}text`] ? `<blockquote style="margin:0;padding:28px;background:#fff;border-radius:16px;border-left:4px solid #2563eb;box-shadow:0 2px 8px rgba(0,0,0,.05)"><p style="margin:0 0 12px;color:#334155;font-size:1.05em;line-height:1.7;font-style:italic">"${esc(d[`t${i}text`])}"</p><cite style="color:#94a3b8;font-style:normal;font-weight:600">— ${esc(d[`t${i}name`] || "")}</cite></blockquote>` : "").join("")}</div></section>`;
        break;
      case "cta":
        body += `<section style="background:${bg};padding:80px 20px;text-align:center"><h2 style="color:#fff;font-size:clamp(1.5em,3vw,2.2em);margin:0">${esc(d.title)}</h2>${d.subtitle ? `<p style="color:rgba(255,255,255,.8);margin:12px 0 0;font-size:1.1em">${esc(d.subtitle)}</p>` : ""}${d.btnText ? `<a href="${esc(d.btnUrl || "#")}" style="display:inline-block;margin-top:28px;background:#fff;color:${bg};padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:1.05em">${esc(d.btnText)}</a>` : ""}</section>`;
        break;
      case "text-block":
        body += `<section style="background:${bg};padding:60px 20px"><div style="max-width:700px;margin:0 auto;color:${tc};line-height:1.8">${esc(d.text).replace(/\n/g, "<br>")}</div></section>`;
        break;
      case "contact":
        body += `<section style="background:${bg};padding:80px 20px"><h2 style="text-align:center;color:${tc};font-size:2em;margin:0 0 40px">${esc(d.title)}</h2><div style="max-width:500px;margin:0 auto;text-align:center;line-height:2.2;color:${isLight(bg) ? "#475569" : "#cbd5e1"};font-size:1.05em">${d.address ? `<p>📍 ${esc(d.address)}</p>` : ""}${d.phone ? `<p>📞 <a href="tel:${esc(d.phone)}" style="color:inherit;text-decoration:none">${esc(d.phone)}</a></p>` : ""}${d.email ? `<p>✉️ <a href="mailto:${esc(d.email)}" style="color:inherit">${esc(d.email)}</a></p>` : ""}${d.hours ? `<p>🕐 ${esc(d.hours)}</p>` : ""}</div></section>`;
        break;
      case "footer":
        body += `<footer style="background:${bg};padding:40px 20px;text-align:center"><p style="color:#94a3b8;margin:0 0 8px">${esc(d.text)}</p>${d.social ? `<p style="color:#64748b;font-size:.85em">${esc(d.social)}</p>` : ""}<p style="color:#475569;font-size:.75em;margin-top:16px;opacity:.5">Créé avec Scryboo Tools</p></footer>`;
        break;
      case "spacer":
        body += `<div style="height:${d.height || 40}px;background:${bg}"></div>`;
        break;
    }
  }
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subdomain || "Mon site")} — Scryboo</title><style>*{box-sizing:border-box;margin:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}img{max-width:100%}a{transition:opacity .2s}a:hover{opacity:.85}</style></head><body>${body}</body></html>`;
}

/* ═══════════════════════════ IMAGE PICKER MODAL ═══════════════════════════ */
function ImagePicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = search.trim() ? STOCK_IMAGES.filter((i) => i.label.toLowerCase().includes(search.toLowerCase())) : STOCK_IMAGES;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Choisir une image</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>
          {/* Upload */}
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors">
            <Upload className="w-4 h-4" /> Importer votre propre image
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (f) { const url = URL.createObjectURL(f); onSelect(url); }
          }} />
          {/* URL */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher… (restaurant, hôtel, plat…)"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Images libres de droits (Unsplash)</p>
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((img) => (
              <button key={img.url} onClick={() => onSelect(img.url)}
                className="relative aspect-[4/3] rounded-lg overflow-hidden group active:scale-[0.97] transition-transform">
                <img src={img.url} alt={img.label} loading="lazy" className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <span className="text-[9px] text-white font-medium">{img.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */
export function ConstructeurSite() {
  const { guard } = useUsageGate();
  const [subdomain, setSubdomain] = useState("mon-restaurant");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);
  const [imagePicker, setImagePicker] = useState<{ blockId: string; fieldKey: string } | null>(null);
  const [info, setInfo] = useState("");

  const addBlock = (type: BlockType) => {
    const def = BLOCK_DEFS.find((d) => d.type === type)!;
    const b: Block = { id: uid(), type, data: { ...def.defaultData } };
    setBlocks((prev) => [...prev, b]);
    setEditId(b.id);
    setShowAdd(false);
  };

  const loadTemplate = (t: typeof TEMPLATES[number]) => {
    setBlocks(t.types.map((type) => {
      const def = BLOCK_DEFS.find((d) => d.type === type)!;
      return { id: uid(), type: type as BlockType, data: { ...def.defaultData } };
    }));
    setEditId(null);
  };

  const updateData = (id: string, key: string, val: string) =>
    setBlocks((bs) => bs.map((b) => b.id === id ? { ...b, data: { ...b.data, [key]: val } } : b));

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= blocks.length) return;
    const n = [...blocks]; [n[idx], n[t]] = [n[t], n[idx]]; setBlocks(n);
  };

  const duplicate = (idx: number) => {
    const src = blocks[idx];
    const dup: Block = { ...src, id: uid(), data: { ...src.data } };
    const n = [...blocks]; n.splice(idx + 1, 0, dup); setBlocks(n);
  };

  const html = generateHtml(blocks, subdomain);

  const exportHtml = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${subdomain || "site"}.html`; a.click();
    setInfo("✅ Site HTML téléchargé.");
  };

  const shareSite = async () => {
    const blob = new Blob([html], { type: "text/html" });
    const file = new File([blob], `${subdomain}.html`, { type: "text/html" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: subdomain });
    } else { exportHtml(); }
  };

  const inpCls = "w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnCls = "inline-flex items-center justify-center gap-2 px-3.5 py-2.5 lg:py-2 text-sm font-medium rounded-lg active:scale-[0.98] disabled:opacity-40 transition-all";

  return (
    <div className="space-y-5">
      {/* Image Picker Modal */}
      {imagePicker && (
        <ImagePicker
          onSelect={(url) => { updateData(imagePicker.blockId, imagePicker.fieldKey, url); setImagePicker(null); }}
          onClose={() => setImagePicker(null)}
        />
      )}

      {/* Subdomain + Templates */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Adresse de votre site</p>
        <div className="flex items-center bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
          <input value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="mon-restaurant" className="flex-1 px-4 py-3.5 text-sm font-semibold focus:outline-none min-w-0" maxLength={30} />
          <span className="px-4 py-3.5 bg-blue-50 text-blue-600 text-sm font-medium border-l border-blue-200 whitespace-nowrap shrink-0">.scryboo.com</span>
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">Commencez avec un modèle prêt à l'emploi :</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => loadTemplate(t)}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.97] transition-all">
                <span className="text-3xl">{t.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{t.name}</span>
                <span className="text-[10px] text-gray-400">{t.types.length} sections</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ EDITOR (full width, top) ═══ */}
      {blocks.length > 0 && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sections de votre site ({blocks.length})</p>
              <button onClick={() => setShowAdd(!showAdd)}
                className={`${btnCls} ${showAdd ? "bg-gray-200 text-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {showAdd ? "✕ Fermer" : <><Plus className="w-4 h-4" /> Ajouter une section</>}
              </button>
            </div>

            {/* Add block panel */}
            {showAdd && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg">
                {BLOCK_GROUPS.map((group) => (
                  <div key={group} className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {BLOCK_DEFS.filter((d) => d.group === group).map((d) => (
                        <button key={d.type} onClick={() => addBlock(d.type)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 hover:border-blue-200 transition-colors">
                          <span>{d.emoji}</span> {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Block list — each block expandable */}
            <div className="space-y-2">
              {blocks.map((b, i) => {
                const def = BLOCK_DEFS.find((d) => d.type === b.type);
                const isEditing = editId === b.id;
                if (!def) return null;
                return (
                  <div key={b.id} className={`border rounded-2xl overflow-hidden transition-all ${isEditing ? "border-blue-300 shadow-md" : "border-gray-200"}`}>
                    {/* Block header */}
                    <div
                      className={`flex items-center gap-2 px-4 py-3 cursor-pointer ${isEditing ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}`}
                      onClick={() => setEditId(isEditing ? null : b.id)}
                    >
                      <span className="text-lg shrink-0">{def.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isEditing ? "text-blue-700" : "text-gray-800"}`}>
                          {b.data.title || def.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{def.label} · Position {i + 1}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 text-gray-500" title="Monter"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 text-gray-500" title="Descendre"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => duplicate(i)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500" title="Dupliquer"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setBlocks(blocks.filter((x) => x.id !== b.id)); if (editId === b.id) setEditId(null); }}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                        {isEditing ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Block editor — expanded */}
                    {isEditing && (
                      <div className="px-4 py-4 bg-white border-t border-gray-100 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {def.fields.map((f) => (
                            <label key={f.key} className={`block ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                              <span className="text-xs font-medium text-gray-600">{f.label}</span>
                              {f.type === "textarea" ? (
                                <textarea value={b.data[f.key] ?? ""} onChange={(e) => updateData(b.id, f.key, e.target.value)}
                                  className={inpCls + " h-24 resize-y"} />
                              ) : f.type === "color" ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input type="color" value={b.data[f.key] || "#ffffff"} onChange={(e) => updateData(b.id, f.key, e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                                  <input value={b.data[f.key] ?? ""} onChange={(e) => updateData(b.id, f.key, e.target.value)}
                                    className="flex-1 px-2.5 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                              ) : f.type === "image" ? (
                                <div className="mt-1 space-y-2">
                                  {b.data[f.key]?.startsWith("http") || b.data[f.key]?.startsWith("blob") ? (
                                    <div className="relative inline-block">
                                      <img src={b.data[f.key]} alt="" className="h-20 rounded-lg border border-gray-200 object-cover" />
                                      <button onClick={() => updateData(b.id, f.key, "")}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow">✕</button>
                                    </div>
                                  ) : null}
                                  <button onClick={() => setImagePicker({ blockId: b.id, fieldKey: f.key })}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-xs font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                    <ImageIcon className="w-4 h-4" /> {b.data[f.key] ? "Changer l'image" : "Choisir une image"}
                                  </button>
                                </div>
                              ) : (
                                <input value={b.data[f.key] ?? ""} onChange={(e) => updateData(b.id, f.key, e.target.value)} className={inpCls} />
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ PREVIEW (full width, bottom) ═══ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Aperçu en direct
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 hidden sm:inline">{subdomain}.scryboo.com</span>
                <button onClick={() => setPreviewFull(!previewFull)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title={previewFull ? "Réduire" : "Plein écran"}>
                  {previewFull ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className={`border border-gray-200 rounded-2xl overflow-hidden shadow-lg bg-white transition-all ${previewFull ? "fixed inset-4 z-50" : ""}`}
              style={previewFull ? {} : { height: 600 }}>
              {previewFull && (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs text-gray-500">{subdomain}.scryboo.com — Aperçu plein écran</span>
                  <button onClick={() => setPreviewFull(false)} className="text-xs text-blue-600 font-medium">Fermer ✕</button>
                </div>
              )}
              <iframe srcDoc={html} title="Aperçu du site" className="w-full h-full" sandbox="allow-same-origin" />
            </div>
          </div>

          {/* ═══ EXPORT ═══ */}
          <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2">
            <button onClick={() => guard(exportHtml)} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
              <Download className="w-4 h-4" /> Télécharger le site HTML
            </button>
            <button onClick={() => guard(shareSite)} className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
              <Share2 className="w-4 h-4" /> Partager
            </button>
            <ClearButton onClick={() => { setBlocks([]); setEditId(null); setShowAdd(false); setInfo(""); }} label="Recommencer" />
          </div>
        </>
      )}
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}
