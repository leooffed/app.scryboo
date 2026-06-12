import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Circle as CircleIcon, Download, Eye, FileImage, Grid3X3,
  Image as ImageIcon, Layers, Loader2, Palette, Pencil, Search,
  Share2, Square, Trash2, Type, Upload,
} from "lucide-react";
import { ClearButton } from "../../components/tools/common";
import { useUsageGate } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type EType = "text" | "rect" | "circle" | "image" | "icon";

interface El {
  id: string;
  type: EType;
  x: number;
  y: number;
  w: number;
  h: number;
  // text
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  // color
  color: string;
  bgColor?: string;
  // shape
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  rotation?: number;
  // image
  imageUrl?: string;
  // icon
  iconName?: string;
  iconStroke?: number;
  iconFill?: string; // "none" = outline only, color = filled
  // z-index
  zIndex: number;
  locked?: boolean;
}

interface CanvasSize { w: number; h: number; label: string }

const uid = () => Math.random().toString(36).slice(2, 10);

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CANVAS_PRESETS: CanvasSize[] = [
  { w: 1080, h: 1080, label: "Post Instagram" },
  { w: 1080, h: 1920, label: "Story / Flyer vertical" },
  { w: 1200, h: 630, label: "Bannière Facebook" },
  { w: 1920, h: 1080, label: "Présentation / YouTube" },
  { w: 800, h: 1200, label: "Affiche A4" },
  { w: 1200, h: 1200, label: "Post carré HD" },
  { w: 1400, h: 400, label: "Bandeau / Header" },
  { w: 600, h: 900, label: "Carte / Invitation" },
  { w: 1024, h: 768, label: "Tableau déco paysage" },
];

const SWATCHES = [
  "#ffffff","#f8fafc","#e2e8f0","#94a3b8","#475569","#1e293b","#0f172a","#000000",
  "#dc2626","#ea580c","#f59e0b","#fbbf24","#84cc16","#16a34a","#0d9488","#0ea5e9",
  "#2563eb","#4f46e5","#7c3aed","#a21caf","#db2777","#e11d48","transparent",
];

const FONTS = [
  { id: "Arial, sans-serif", label: "Arial" },
  { id: "Georgia, serif", label: "Georgia" },
  { id: "Verdana, sans-serif", label: "Verdana" },
  { id: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
  { id: "'Courier New', monospace", label: "Courier" },
  { id: "Impact, sans-serif", label: "Impact" },
  { id: "'Times New Roman', serif", label: "Times" },
];

const ICON_LIST = [
  "Activity","Anchor","Aperture","Apple","Atom","Award","Banknote","Bell","Bike","Bird",
  "BookOpen","Bot","Brain","Briefcase","Brush","Building2","Bus","Cake","Camera","Car",
  "Cat","ChefHat","Church","Cloud","Code","Coffee","Cog","Compass","Cpu","Crown",
  "CupSoda","Diamond","Dog","Droplet","Dumbbell","Factory","Feather","Film","Fish","Flag",
  "Flame","Flower2","Gamepad2","Gem","Gift","Glasses","Globe","GraduationCap","Guitar",
  "Hammer","Headphones","Heart","Home","Key","Lamp","Landmark","Laptop","Leaf","Lightbulb",
  "Link","Lock","Mail","MapPin","Megaphone","Mic","Moon","Mountain","Music","Newspaper",
  "Palette","PawPrint","Pen","Phone","Pizza","Plane","Plug","Printer","Puzzle","Rocket",
  "Sailboat","Scale","School","Scissors","Settings","Shield","Ship","Shirt","ShoppingBag",
  "ShoppingCart","Smartphone","Smile","Snowflake","Sparkles","Star","Stethoscope","Store",
  "Sun","Swords","Target","Tent","Terminal","TreePine","Trophy","Truck","Tv","Umbrella",
  "Utensils","Video","Wallet","Wand2","Watch","Waves","Wifi","Wine","Wrench","Zap",
].filter((n) => n in LucideIcons);

const STOCK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80", label: "Dégradé bleu" },
  { url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&q=80", label: "Dégradé violet" },
  { url: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=600&q=80", label: "Dégradé vert" },
  { url: "https://images.unsplash.com/photo-1557682260-96773eb01377?w=600&q=80", label: "Dégradé rose" },
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80", label: "Bureau moderne" },
  { url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80", label: "Espace coworking" },
  { url: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=600&q=80", label: "Abstrait coloré" },
  { url: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=600&q=80", label: "Texture marbre" },
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", label: "Montagne" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", label: "Plage tropicale" },
  { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80", label: "Nature verte" },
  { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80", label: "Ciel étoilé" },
  { url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=600&q=80", label: "Forêt brumeuse" },
  { url: "https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=600&q=80", label: "Pont suspendu" },
  { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80", label: "Paysage désertique" },
  { url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80", label: "Espace coworking" },
  { url: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=600&q=80", label: "Abstrait coloré" },
  { url: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=600&q=80", label: "Texture marbre" },
  { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", label: "Montagne" },
];

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES
   ═══════════════════════════════════════════════════════════════ */
interface Template { name: string; cat: string; canvas: CanvasSize; bg: string; els: Omit<El, "id" | "zIndex">[] }

const T: Template[] = [
  {
    name: "Flyer Promo", cat: "Flyer",
    canvas: { w: 1080, h: 1920, label: "Story" }, bg: "#1e293b",
    els: [
      { type: "rect", x: 0, y: 0, w: 1080, h: 420, color: "transparent", bgColor: "#2563eb", borderRadius: 0 },
      { type: "text", x: 90, y: 100, w: 900, h: 100, text: "GRANDE PROMOTION", fontSize: 72, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffffff", textAlign: "center" },
      { type: "text", x: 90, y: 240, w: 900, h: 80, text: "-50% SUR TOUT LE MAGASIN", fontSize: 48, fontWeight: 700, fontFamily: "Arial, sans-serif", color: "#fbbf24", textAlign: "center" },
      { type: "rect", x: 80, y: 500, w: 920, h: 780, color: "transparent", bgColor: "#334155", borderRadius: 24 },
      { type: "text", x: 140, y: 560, w: 800, h: 600, text: "Découvrez nos offres exceptionnelles sur toute la collection.\n\n🎯 Électronique\n🎯 Mode & Accessoires\n🎯 Maison & Décoration\n\nValable du 1er au 31 Janvier 2026.", fontSize: 32, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#e2e8f0", lineHeight: 1.5 },
      { type: "rect", x: 240, y: 1400, w: 600, h: 100, color: "transparent", bgColor: "#fbbf24", borderRadius: 50 },
      { type: "text", x: 260, y: 1410, w: 560, h: 80, text: "COMMANDER MAINTENANT", fontSize: 32, fontWeight: 800, fontFamily: "Arial, sans-serif", color: "#1e293b", textAlign: "center" },
      { type: "icon", x: 480, y: 1580, w: 120, h: 120, color: "#475569", iconName: "ShoppingCart", iconStroke: 1.5 },
      { type: "text", x: 200, y: 1760, w: 680, h: 40, text: "Mon Entreprise · Douala, Cameroun", fontSize: 22, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#64748b", textAlign: "center" },
    ],
  },
  {
    name: "Bannière Facebook", cat: "Bannière",
    canvas: { w: 1200, h: 630, label: "Facebook" }, bg: "#4f46e5",
    els: [
      { type: "circle", x: 850, y: 150, w: 300, h: 300, color: "transparent", bgColor: "rgba(255,255,255,0.12)", borderRadius: 9999 },
      { type: "circle", x: 950, y: 50, w: 180, h: 180, color: "transparent", bgColor: "rgba(255,255,255,0.08)", borderRadius: 9999 },
      { type: "text", x: 80, y: 140, w: 700, h: 140, text: "Bienvenue sur\nnotre page 🚀", fontSize: 64, fontWeight: 800, fontFamily: "Arial, sans-serif", color: "#ffffff", lineHeight: 1.2 },
      { type: "text", x: 80, y: 340, w: 600, h: 50, text: "Solutions innovantes pour votre business", fontSize: 26, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#c7d2fe" },
      { type: "rect", x: 80, y: 440, w: 240, h: 60, color: "transparent", bgColor: "#ffffff", borderRadius: 30 },
      { type: "text", x: 100, y: 452, w: 200, h: 36, text: "En savoir plus", fontSize: 20, fontWeight: 700, fontFamily: "Arial, sans-serif", color: "#4f46e5", textAlign: "center" },
    ],
  },
  {
    name: "Post Citation", cat: "Post",
    canvas: { w: 1080, h: 1080, label: "Instagram" }, bg: "#fef3c7",
    els: [
      { type: "rect", x: 60, y: 60, w: 960, h: 960, color: "transparent", bgColor: "#ffffff", borderRadius: 32, borderWidth: 3, borderColor: "#f59e0b" },
      { type: "icon", x: 440, y: 120, w: 200, h: 200, color: "#f59e0b", iconName: "Sparkles", iconStroke: 1.2, opacity: 0.3 },
      { type: "text", x: 120, y: 200, w: 840, h: 100, text: "Citation du jour", fontSize: 64, fontWeight: 800, fontFamily: "Georgia, serif", color: "#92400e", textAlign: "center" },
      { type: "text", x: 120, y: 380, w: 840, h: 300, text: "\"Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès. Si vous aimez ce que vous faites, vous réussirez.\"", fontSize: 38, fontWeight: 400, fontFamily: "Georgia, serif", color: "#78350f", textAlign: "center", lineHeight: 1.6 },
      { type: "text", x: 120, y: 770, w: 840, h: 40, text: "— Albert Schweitzer", fontSize: 24, fontWeight: 600, fontFamily: "Georgia, serif", color: "#b45309", textAlign: "center" },
      { type: "rect", x: 400, y: 870, w: 280, h: 4, color: "transparent", bgColor: "#f59e0b", borderRadius: 2 },
    ],
  },
  {
    name: "Affiche Événement", cat: "Affiche",
    canvas: { w: 800, h: 1200, label: "Affiche" }, bg: "#0f172a",
    els: [
      { type: "rect", x: 0, y: 0, w: 800, h: 300, color: "transparent", bgColor: "#e11d48" },
      { type: "icon", x: 620, y: 30, w: 150, h: 150, color: "rgba(255,255,255,0.15)", iconName: "Sparkles", iconStroke: 1 },
      { type: "text", x: 50, y: 80, w: 700, h: 70, text: "CONFÉRENCE 2026", fontSize: 52, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffffff" },
      { type: "text", x: 50, y: 180, w: 700, h: 50, text: "Innovation & Entrepreneuriat", fontSize: 28, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#fecdd3" },
      { type: "icon", x: 50, y: 370, w: 40, h: 40, color: "#e11d48", iconName: "Calendar" },
      { type: "text", x: 110, y: 375, w: 640, h: 40, text: "15 Mars 2026 · 9h - 17h", fontSize: 26, fontWeight: 600, fontFamily: "Arial, sans-serif", color: "#ffffff" },
      { type: "icon", x: 50, y: 440, w: 40, h: 40, color: "#e11d48", iconName: "MapPin" },
      { type: "text", x: 110, y: 445, w: 640, h: 40, text: "Palais des Congrès, Yaoundé", fontSize: 24, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#94a3b8" },
      { type: "rect", x: 50, y: 530, w: 700, h: 2, color: "transparent", bgColor: "#334155" },
      { type: "text", x: 50, y: 580, w: 700, h: 280, text: "Rejoignez 500+ entrepreneurs pour une journée exceptionnelle :\n\n✅ Conférences inspirantes\n✅ Ateliers pratiques\n✅ Networking premium\n✅ Repas offert", fontSize: 24, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#cbd5e1", lineHeight: 1.6 },
      { type: "rect", x: 200, y: 1020, w: 400, h: 80, color: "transparent", bgColor: "#e11d48", borderRadius: 40 },
      { type: "text", x: 220, y: 1032, w: 360, h: 56, text: "S'INSCRIRE", fontSize: 28, fontWeight: 800, fontFamily: "Arial, sans-serif", color: "#ffffff", textAlign: "center" },
    ],
  },
  {
    name: "Tableau Déco Abstrait", cat: "Décoration",
    canvas: { w: 1200, h: 1200, label: "Tableau" }, bg: "#1a1a2e",
    els: [
      { type: "circle", x: 150, y: 100, w: 350, h: 350, color: "transparent", bgColor: "#e94560", opacity: 0.9 },
      { type: "circle", x: 450, y: 350, w: 450, h: 450, color: "transparent", bgColor: "#0f3460", opacity: 0.8 },
      { type: "circle", x: 750, y: 80, w: 280, h: 280, color: "transparent", bgColor: "#16213e", opacity: 0.7 },
      { type: "circle", x: 300, y: 600, w: 200, h: 200, color: "transparent", bgColor: "#e94560", opacity: 0.3 },
      { type: "rect", x: 80, y: 940, w: 1040, h: 4, color: "transparent", bgColor: "#e94560" },
      { type: "text", x: 80, y: 990, w: 1040, h: 90, text: "ABSTRACT", fontSize: 80, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#eaeaea", textAlign: "center" },
      { type: "text", x: 80, y: 1100, w: 1040, h: 40, text: "Décoration intérieure · Art moderne minimaliste", fontSize: 22, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#64748b", textAlign: "center" },
    ],
  },
  {
    name: "Carte de visite", cat: "Carte",
    canvas: { w: 1200, h: 630, label: "Carte" }, bg: "#ffffff",
    els: [
      { type: "rect", x: 0, y: 0, w: 8, h: 630, color: "transparent", bgColor: "#2563eb" },
      { type: "text", x: 60, y: 120, w: 600, h: 60, text: "AÏCHA DIALLO", fontSize: 42, fontWeight: 800, fontFamily: "Arial, sans-serif", color: "#1e293b" },
      { type: "text", x: 60, y: 200, w: 600, h: 40, text: "Développeuse Web Full-Stack", fontSize: 24, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#2563eb" },
      { type: "rect", x: 60, y: 270, w: 120, h: 3, color: "transparent", bgColor: "#2563eb" },
      { type: "icon", x: 60, y: 320, w: 24, h: 24, color: "#64748b", iconName: "Mail" },
      { type: "text", x: 100, y: 322, w: 400, h: 24, text: "aicha@exemple.com", fontSize: 18, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#64748b" },
      { type: "icon", x: 60, y: 365, w: 24, h: 24, color: "#64748b", iconName: "Phone" },
      { type: "text", x: 100, y: 367, w: 400, h: 24, text: "+221 77 XXX XX XX", fontSize: 18, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#64748b" },
      { type: "icon", x: 60, y: 410, w: 24, h: 24, color: "#64748b", iconName: "Globe" },
      { type: "text", x: 100, y: 412, w: 400, h: 24, text: "linkedin.com/in/aicha-diallo", fontSize: 18, fontWeight: 400, fontFamily: "Arial, sans-serif", color: "#64748b" },
      { type: "icon", x: 900, y: 220, w: 200, h: 200, color: "#e2e8f0", iconName: "Code", iconStroke: 0.8 },
    ],
  },
  {
    name: "Canevas vierge", cat: "Vierge",
    canvas: { w: 1080, h: 1080, label: "Carré" }, bg: "#ffffff", els: [],
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

function IconComp({ name, className, strokeWidth, fill }: { name: string; className?: string; strokeWidth?: number; fill?: string }) {
  const I = (LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? LucideIcons.Star;
  return <I className={className} strokeWidth={strokeWidth ?? 2} fill={fill && fill !== "none" ? fill : "none"} />;
}

/* ═══════════════════════════════════════════════════════════════
   COLOR PICKER INLINE
   ═══════════════════════════════════════════════════════════════ */
function ColorPick({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
      <div className="mt-1 flex items-center gap-1 flex-wrap">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)} aria-label={label}
          className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0" />
        <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Code ${label}`}
          className="w-20 px-1.5 py-1 border border-gray-200 rounded text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {SWATCHES.map((c) => (
          <button key={c} onClick={() => onChange(c)} aria-label={c}
            className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-sm border transition-transform active:scale-90 ${c === "transparent" ? "bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:6px_6px]" : ""} ${value === c ? "ring-2 ring-blue-500 ring-offset-1 border-white" : "border-gray-200"}`}
            style={c !== "transparent" ? { backgroundColor: c } : undefined} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function CreateurDesign() {
  const { guard } = useUsageGate();
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(CANVAS_PRESETS[0]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [elements, setElements] = useState<El[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragInfo, setDragInfo] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [resizeInfo, setResizeInfo] = useState<{ id: string; ox: number; oy: number; ow: number; oh: number } | null>(null);
  const [panel, setPanel] = useState<"templates" | "add" | "icons" | "images" | "layers">("templates");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [iconSearch, setIconSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [nextZ, setNextZ] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sel = elements.find((e) => e.id === selected) ?? null;

  const filteredIcons = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    return q ? ICON_LIST.filter((n) => n.toLowerCase().includes(q)) : ICON_LIST;
  }, [iconSearch]);

  /* --- mutations --- */
  const upd = useCallback((id: string, p: Partial<El>) => {
    setElements((els) => els.map((e) => (e.id === id ? { ...e, ...p } : e)));
  }, []);

  const del = (id: string) => {
    setElements((els) => els.filter((e) => e.id !== id));
    if (selected === id) setSelected(null);
  };

  const add = (partial: Omit<El, "id" | "zIndex">) => {
    const el: El = { ...partial, id: uid(), zIndex: nextZ };
    setNextZ((z) => z + 1);
    setElements((prev) => [...prev, el]);
    setSelected(el.id);
    setMobileView("preview");
  };

  const bringFront = (id: string) => {
    upd(id, { zIndex: nextZ });
    setNextZ((z) => z + 1);
  };
  const sendBack = (id: string) => upd(id, { zIndex: 0 });

  const loadTemplate = (t: Template) => {
    setCanvasSize(t.canvas);
    setBgColor(t.bg);
    let z = 1;
    setElements(t.els.map((e) => ({ ...e, id: uid(), zIndex: z++ } as El)));
    setNextZ(z);
    setSelected(null);
    setPanel("add");
    setMobileView("preview");
  };

  /* --- scale --- */
  const scale = Math.min(1, 580 / canvasSize.w, 520 / canvasSize.h);
  const sortedEls = useMemo(() => [...elements].sort((a, b) => a.zIndex - b.zIndex), [elements]);

  /* --- drag & resize --- */
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    const el = elements.find((x) => x.id === id);
    if (!el || el.locked) return;
    setSelected(id);
    // On mobile, if in preview mode, switch to edit so properties are visible
    if (window.innerWidth < 1024) setMobileView("edit");
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragInfo({ id, ox: (e.clientX - rect.left) / scale - el.x, oy: (e.clientY - rect.top) / scale - el.y });
  };
  const onResizeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setResizeInfo({ id, ox: (e.clientX - rect.left) / scale, oy: (e.clientY - rect.top) / scale, ow: el.w, oh: el.h });
  };

  useEffect(() => {
    if (!dragInfo && !resizeInfo) return;
    const onMove = (e: PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / scale, my = (e.clientY - rect.top) / scale;
      if (dragInfo) upd(dragInfo.id, { x: Math.round(mx - dragInfo.ox), y: Math.round(my - dragInfo.oy) });
      if (resizeInfo) upd(resizeInfo.id, { w: Math.max(16, Math.round(resizeInfo.ow + mx - resizeInfo.ox)), h: Math.max(16, Math.round(resizeInfo.oh + my - resizeInfo.oy)) });
    };
    const onUp = () => { setDragInfo(null); setResizeInfo(null); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [dragInfo, resizeInfo, scale, upd]);

  /* --- add image --- */
  const addImage = (url: string, file?: File) => {
    const src = file ? URL.createObjectURL(file) : url;
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      const w = Math.min(canvasSize.w * 0.5, 500);
      add({ type: "image", x: 40, y: 40, w: Math.round(w), h: Math.round(w / aspect), color: "transparent", imageUrl: src });
    };
    img.onerror = () => add({ type: "image", x: 40, y: 40, w: 300, h: 300, color: "transparent", imageUrl: src });
    img.src = src;
  };

  /* --- RENDER TO CANVAS (for export) --- */
  const renderToCanvas = async (multiplier = 2): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize.w * multiplier; canvas.height = canvasSize.h * multiplier;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(multiplier, multiplier);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    for (const el of sortedEls) {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      if (el.type === "rect" || el.type === "circle") {
        const r = el.type === "circle" ? Math.min(el.w, el.h) / 2 : (el.borderRadius ?? 0);
        ctx.beginPath(); ctx.roundRect(el.x, el.y, el.w, el.h, r);
        if (el.bgColor && el.bgColor !== "transparent") { ctx.fillStyle = el.bgColor; ctx.fill(); }
        if ((el.borderWidth ?? 0) > 0 && el.borderColor) { ctx.strokeStyle = el.borderColor; ctx.lineWidth = el.borderWidth!; ctx.stroke(); }
      }
      if (el.type === "image" && el.imageUrl) {
        try { const img = await loadImg(el.imageUrl); ctx.drawImage(img, el.x, el.y, el.w, el.h); } catch {}
      }
      if (el.type === "icon" && el.iconName) {
        // Draw background behind icon if any
        if (el.bgColor && el.bgColor !== "transparent") {
          ctx.fillStyle = el.bgColor;
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.w, el.h, el.borderRadius ?? 0);
          ctx.fill();
        }
        // Render icon as a temporary SVG → image
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const iconPad = el.w * 0.15;
        const iconSize = el.w - iconPad * 2;
        svg.setAttribute("width", String(iconSize)); svg.setAttribute("height", String(iconSize));
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", (el.iconFill && el.iconFill !== "none") ? el.iconFill : "none");
        svg.setAttribute("stroke", el.color); svg.setAttribute("stroke-width", String(el.iconStroke ?? 2));
        svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
        // Get the icon path from a temp DOM render
        const tmp = document.createElement("div"); tmp.style.display = "none"; document.body.appendChild(tmp);
        const { createRoot } = await import("react-dom/client");
        const I = (LucideIcons as unknown as Record<string, LucideIcon>)[el.iconName];
        if (I) {
          const root = createRoot(tmp);
          const { createElement: h } = await import("react");
          root.render(h(I, { width: 24, height: 24, strokeWidth: el.iconStroke ?? 2 }));
          await new Promise((r) => setTimeout(r, 50));
          const rendered = tmp.querySelector("svg");
          if (rendered) {
            svg.innerHTML = rendered.innerHTML;
          }
          root.unmount();
        }
        document.body.removeChild(tmp);
        const svgStr = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        try { const img = await loadImg(url); ctx.drawImage(img, el.x + iconPad, el.y + iconPad, iconSize, iconSize); } catch {}
        URL.revokeObjectURL(url);
      }
      if (el.type === "text" && el.text) {
        ctx.fillStyle = el.color;
        ctx.font = `${el.fontWeight ?? 400} ${el.fontSize ?? 32}px ${el.fontFamily ?? "Arial, sans-serif"}`;
        ctx.textBaseline = "top";
        if (el.textAlign === "center") ctx.textAlign = "center";
        else if (el.textAlign === "right") ctx.textAlign = "right";
        else ctx.textAlign = "left";
        const lines = wrapText(ctx, el.text, el.w);
        const lh = (el.fontSize ?? 32) * (el.lineHeight ?? 1.25);
        let ty = el.y;
        const tx = el.textAlign === "center" ? el.x + el.w / 2 : el.textAlign === "right" ? el.x + el.w : el.x;
        for (const line of lines) {
          if (ty + lh > el.y + el.h + 20) break;
          ctx.fillText(line, tx, ty);
          ty += lh;
        }
      }
      ctx.restore();
    }
    return canvas;
  };

  /* --- exports --- */
  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const exportPng = async () => {
    setBusy("png"); setInfo("");
    try {
      const c = await renderToCanvas(2);
      c.toBlob((b) => { if (b) { downloadBlob(b, "design-scryboo.png"); setInfo("✅ PNG HD exporté (2x)."); } }, "image/png");
    } finally { setBusy(null); }
  };

  const exportJpg = async () => {
    setBusy("jpg"); setInfo("");
    try {
      const c = await renderToCanvas(2);
      c.toBlob((b) => { if (b) { downloadBlob(b, "design-scryboo.jpg"); setInfo("✅ JPG exporté."); } }, "image/jpeg", 0.92);
    } finally { setBusy(null); }
  };

  const exportSvg = () => {
    setBusy("svg"); setInfo("");
    // Build basic SVG from elements
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize.w}" height="${canvasSize.h}" viewBox="0 0 ${canvasSize.w} ${canvasSize.h}">`;
    svg += `<rect width="${canvasSize.w}" height="${canvasSize.h}" fill="${bgColor}"/>`;
    for (const el of sortedEls) {
      const op = el.opacity != null && el.opacity < 1 ? ` opacity="${el.opacity}"` : "";
      if (el.type === "rect") {
        svg += `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${el.borderRadius ?? 0}" fill="${el.bgColor ?? "none"}"${(el.borderWidth ?? 0) > 0 ? ` stroke="${el.borderColor}" stroke-width="${el.borderWidth}"` : ""}${op}/>`;
      } else if (el.type === "circle") {
        const cx = el.x + el.w / 2, cy = el.y + el.h / 2, r = Math.min(el.w, el.h) / 2;
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${el.bgColor ?? "none"}"${op}/>`;
      } else if (el.type === "text" && el.text) {
        const anchor = el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start";
        const tx = el.textAlign === "center" ? el.x + el.w / 2 : el.textAlign === "right" ? el.x + el.w : el.x;
        svg += `<text x="${tx}" y="${el.y + (el.fontSize ?? 32)}" font-family="${el.fontFamily ?? "Arial"}" font-size="${el.fontSize ?? 32}" font-weight="${el.fontWeight ?? 400}" fill="${el.color}" text-anchor="${anchor}"${op}>${escSvg(el.text)}</text>`;
      }
    }
    svg += "</svg>";
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "design-scryboo.svg");
    setInfo("✅ SVG vectoriel exporté.");
    setBusy(null);
  };

  const exportPdf = async () => {
    setBusy("pdf"); setInfo("");
    try {
      const c = await renderToCanvas(3);
      const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const page = doc.addPage([canvasSize.w * 0.75, canvasSize.h * 0.75]);
      const png = await doc.embedPng(await blob.arrayBuffer());
      page.drawImage(png, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "design-scryboo.pdf");
      setInfo("✅ PDF haute qualité exporté, prêt pour l'impression.");
    } finally { setBusy(null); }
  };

  const shareDesign = async () => {
    setBusy("share"); setInfo("");
    try {
      const c = await renderToCanvas(2);
      const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
      const file = new File([blob], "design-scryboo.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Design Scryboo" }); setInfo("✅ Partagé."); }
      else { downloadBlob(blob, "design-scryboo.png"); setInfo("ℹ️ PNG téléchargé."); }
    } catch {} finally { setBusy(null); }
  };

  const reset = () => { setElements([]); setSelected(null); setBgColor("#ffffff"); setNextZ(1); setInfo(""); setPanel("templates"); };

  const btnCls = "inline-flex items-center justify-center gap-1.5 px-3 py-2 lg:py-1.5 text-xs font-medium rounded-lg active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all";
  const inpCls = "w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500";

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  type PanelTab = "templates" | "add" | "icons" | "images" | "layers";
  const panelBtns: { id: PanelTab; icon: React.ElementType; label: string }[] = [
    { id: "templates", icon: Grid3X3, label: "Modèles" },
    { id: "add", icon: Pencil, label: "Ajouter" },
    { id: "icons", icon: LucideIcons.Shapes, label: "Icônes" },
    { id: "images", icon: FileImage, label: "Images" },
    { id: "layers", icon: Layers, label: "Calques" },
  ];

  /* Properties panel — always shown below when an element is selected */
  const PropsPanel = () => {
    if (!sel) return null;
    return (
      <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            {sel.type === "text" ? "Propriétés du texte" : sel.type === "icon" ? `Icône : ${sel.iconName}` : sel.type === "image" ? "Propriétés de l'image" : `Propriétés (${sel.type})`}
          </p>
          <button onClick={() => setSelected(null)} aria-label="Désélectionner" className="text-[10px] text-gray-400 hover:text-gray-600">✕ Fermer</button>
        </div>
        {/* Position / size — always visible */}
        <div className="grid grid-cols-4 gap-1.5">
          <label className="block"><span className="text-[10px] text-gray-400">X</span><input type="number" value={sel.x} onChange={(e) => upd(sel.id, { x: +e.target.value })} className={inpCls} /></label>
          <label className="block"><span className="text-[10px] text-gray-400">Y</span><input type="number" value={sel.y} onChange={(e) => upd(sel.id, { y: +e.target.value })} className={inpCls} /></label>
          <label className="block"><span className="text-[10px] text-gray-400">L</span><input type="number" value={sel.w} min={16} onChange={(e) => upd(sel.id, { w: Math.max(16, +e.target.value) })} className={inpCls} /></label>
          <label className="block"><span className="text-[10px] text-gray-400">H</span><input type="number" value={sel.h} min={16} onChange={(e) => upd(sel.id, { h: Math.max(16, +e.target.value) })} className={inpCls} /></label>
        </div>
        {/* Text props */}
        {sel.type === "text" && (<>
          <label className="block"><span className="text-[10px] text-gray-400">Contenu du texte</span>
            <textarea value={sel.text ?? ""} onChange={(e) => upd(sel.id, { text: e.target.value })}
              className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs h-16 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
          <div className="grid grid-cols-3 gap-1.5">
            <label className="block"><span className="text-[10px] text-gray-400">Taille</span>
              <input type="number" value={sel.fontSize ?? 32} min={8} max={200} onChange={(e) => upd(sel.id, { fontSize: +e.target.value })} className={inpCls} /></label>
            <label className="block"><span className="text-[10px] text-gray-400">Graisse</span>
              <select value={sel.fontWeight ?? 400} onChange={(e) => upd(sel.id, { fontWeight: +e.target.value })} className={inpCls + " bg-white"}>
                <option value={400}>Normal</option><option value={600}>Semi</option><option value={700}>Gras</option><option value={900}>Black</option>
              </select></label>
            <label className="block"><span className="text-[10px] text-gray-400">Alignement</span>
              <select value={sel.textAlign ?? "left"} onChange={(e) => upd(sel.id, { textAlign: e.target.value as El["textAlign"] })} className={inpCls + " bg-white"}>
                <option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option>
              </select></label>
          </div>
          <label className="block"><span className="text-[10px] text-gray-400">Police</span>
            <select value={sel.fontFamily ?? FONTS[0].id} onChange={(e) => upd(sel.id, { fontFamily: e.target.value })} className={inpCls + " bg-white mt-1"}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select></label>
          <label className="block"><span className="text-[10px] text-gray-400">Interligne : {(sel.lineHeight ?? 1.25).toFixed(2)}</span>
            <input type="range" min={0.8} max={2.5} step={0.05} value={sel.lineHeight ?? 1.25} onChange={(e) => upd(sel.id, { lineHeight: +e.target.value })} className="w-full accent-blue-600" /></label>
          <ColorPick label="Couleur du texte" value={sel.color} onChange={(v) => upd(sel.id, { color: v })} />
        </>)}
        {/* Icon props */}
        {sel.type === "icon" && (<>
          {/* Icon preview + change */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl border border-gray-200 flex items-center justify-center shrink-0" style={{ color: sel.color, backgroundColor: (sel.bgColor && sel.bgColor !== "transparent") ? sel.bgColor : undefined }}>
              <IconComp name={sel.iconName ?? "Star"} className="w-8 h-8" strokeWidth={sel.iconStroke ?? 2} fill={sel.iconFill} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700">{sel.iconName}</p>
              <button
                onClick={() => setPanel("icons")}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium mt-0.5"
              >Changer d'icône →</button>
            </div>
          </div>
          <ColorPick label="Couleur du trait (stroke)" value={sel.color} onChange={(v) => upd(sel.id, { color: v })} />
          <ColorPick label="Couleur de remplissage (fill)" value={sel.iconFill ?? "none"} onChange={(v) => upd(sel.id, { iconFill: v === "transparent" ? "none" : v })} />
          <label className="block"><span className="text-[10px] text-gray-400">Épaisseur du trait : {(sel.iconStroke ?? 2).toFixed(1)}</span>
            <input type="range" min={0.5} max={3.5} step={0.1} value={sel.iconStroke ?? 2} onChange={(e) => upd(sel.id, { iconStroke: +e.target.value })} className="w-full accent-blue-600" /></label>
          <ColorPick label="Fond derrière l'icône" value={sel.bgColor ?? "transparent"} onChange={(v) => upd(sel.id, { bgColor: v })} />
          <label className="block"><span className="text-[10px] text-gray-400">Arrondi du fond : {sel.borderRadius ?? 0}px</span>
            <input type="range" min={0} max={Math.min(sel.w, sel.h) / 2} value={sel.borderRadius ?? 0} onChange={(e) => upd(sel.id, { borderRadius: +e.target.value })} className="w-full accent-blue-600" /></label>
        </>)}
        {/* Shape props */}
        {(sel.type === "rect" || sel.type === "circle") && (<>
          <ColorPick label="Remplissage" value={sel.bgColor ?? "#2563eb"} onChange={(v) => upd(sel.id, { bgColor: v })} />
          <label className="block"><span className="text-[10px] text-gray-400">Arrondi : {sel.borderRadius ?? 0}px</span>
            <input type="range" min={0} max={sel.type === "circle" ? 9999 : Math.min(sel.w, sel.h) / 2} value={sel.borderRadius ?? 0} onChange={(e) => upd(sel.id, { borderRadius: +e.target.value })} className="w-full accent-blue-600" /></label>
          <label className="block"><span className="text-[10px] text-gray-400">Bordure : {sel.borderWidth ?? 0}px</span>
            <input type="range" min={0} max={20} value={sel.borderWidth ?? 0} onChange={(e) => upd(sel.id, { borderWidth: +e.target.value })} className="w-full accent-blue-600" /></label>
          {(sel.borderWidth ?? 0) > 0 && <ColorPick label="Couleur bordure" value={sel.borderColor ?? "#000"} onChange={(v) => upd(sel.id, { borderColor: v })} />}
        </>)}
        {/* Image props */}
        {sel.type === "image" && (
          <p className="text-[10px] text-gray-400">Redimensionnez l'image avec la poignée bleue ou les champs ci-dessus.</p>
        )}
        {/* Shared controls */}
        <label className="block"><span className="text-[10px] text-gray-400">Opacité : {Math.round((sel.opacity ?? 1) * 100)}%</span>
          <input type="range" min={0} max={100} value={Math.round((sel.opacity ?? 1) * 100)} onChange={(e) => upd(sel.id, { opacity: +e.target.value / 100 })} className="w-full accent-blue-600" /></label>
        <div className="flex gap-1.5">
          <button onClick={() => bringFront(sel.id)} className={`${btnCls} border border-gray-200 text-gray-600 hover:bg-gray-50 flex-1`}>↑ Premier plan</button>
          <button onClick={() => sendBack(sel.id)} className={`${btnCls} border border-gray-200 text-gray-600 hover:bg-gray-50 flex-1`}>↓ Arrière-plan</button>
        </div>
        {/* Duplicate */}
        <div className="flex gap-1.5">
          <button onClick={() => {
            const dup: El = { ...sel, id: uid(), x: sel.x + 20, y: sel.y + 20, zIndex: nextZ };
            setNextZ((z) => z + 1);
            setElements((prev) => [...prev, dup]);
            setSelected(dup.id);
          }} className={`${btnCls} border border-gray-200 text-gray-600 hover:bg-gray-50 flex-1`}>⧉ Dupliquer</button>
          <button onClick={() => del(sel.id)} className={`${btnCls} border border-red-200 text-red-600 hover:bg-red-50 flex-1`}><Trash2 className="w-3.5 h-3.5" /> Supprimer</button>
        </div>
      </div>
    );
  };

  const PanelContent = () => {
    /* TEMPLATES */
    if (panel === "templates") return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Choisissez un modèle ou partez de zéro :</p>
        <div className="grid grid-cols-2 gap-2">
          {T.map((t) => (
            <button key={t.name} onClick={() => loadTemplate(t)}
              className="group bg-white border border-gray-100 rounded-xl p-1.5 text-left hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all">
              <div className="aspect-[4/3] rounded-lg overflow-hidden mb-1 relative" style={{ background: t.bg }}>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] text-white/80 font-bold uppercase tracking-wider bg-black/25 px-1.5 py-0.5 rounded">{t.cat}</span>
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-700 group-hover:text-blue-600 truncate">{t.name}</p>
            </button>
          ))}
        </div>
      </div>
    );

    /* ADD */
    if (panel === "add") return (
      <div className="space-y-3">
        <label className="block"><span className="text-[11px] font-medium text-gray-500">Taille du canevas</span>
          <select value={`${canvasSize.w}x${canvasSize.h}`}
            onChange={(e) => { const p = CANVAS_PRESETS.find((c) => `${c.w}x${c.h}` === e.target.value); if (p) setCanvasSize(p); }}
            className={inpCls + " bg-white mt-1"}>
            {CANVAS_PRESETS.map((c) => <option key={`${c.w}x${c.h}`} value={`${c.w}x${c.h}`}>{c.label} ({c.w}×{c.h})</option>)}
          </select></label>
        <ColorPick label="Fond du canevas" value={bgColor} onChange={setBgColor} />
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide pt-1">Ajouter un élément</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => add({ type: "text", x: 50, y: 50, w: 400, h: 80, text: "Votre texte", fontSize: 40, fontWeight: 700, fontFamily: "Arial, sans-serif", color: "#1e293b", textAlign: "left", lineHeight: 1.25 })}
            className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50 w-full`}><Type className="w-4 h-4" /> Texte</button>
          <button onClick={() => add({ type: "rect", x: 50, y: 50, w: 200, h: 200, color: "transparent", bgColor: "#2563eb", borderRadius: 12 })}
            className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50 w-full`}><Square className="w-4 h-4" /> Rectangle</button>
          <button onClick={() => add({ type: "circle", x: 50, y: 50, w: 200, h: 200, color: "transparent", bgColor: "#e11d48", borderRadius: 9999 })}
            className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50 w-full`}><CircleIcon className="w-4 h-4" /> Cercle</button>
          <button onClick={() => fileRef.current?.click()}
            className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50 w-full`}><Upload className="w-4 h-4" /> Mon image</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Ajouter une image"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) addImage("", f); }} />
      </div>
    );

    /* ICONS */
    if (panel === "icons") {
      const isSwapping = sel?.type === "icon";
      return (
        <div className="space-y-2">
          {isSwapping && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
              <IconComp name={sel!.iconName ?? "Star"} className="w-4 h-4 shrink-0" fill={sel!.iconFill} />
              Cliquez sur une icône pour remplacer <strong>{sel!.iconName}</strong>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} placeholder="Rechercher… (star, heart, car…)" aria-label="Rechercher une icône"
              className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto overscroll-contain">
            {filteredIcons.map((name) => (
              <button key={name} title={name}
                onClick={() => {
                  if (isSwapping) {
                    // Replace icon on selected element
                    upd(sel!.id, { iconName: name });
                  } else {
                    // Add new icon element
                    add({ type: "icon", x: 100, y: 100, w: 80, h: 80, color: "#1e293b", iconName: name, iconStroke: 2, iconFill: "none" });
                  }
                }}
                className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                  isSwapping && sel!.iconName === name
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100"
                }`}>
                <IconComp name={name} className="w-5 h-5" strokeWidth={1.8} />
              </button>
            ))}
            {filteredIcons.length === 0 && <p className="col-span-full text-center text-[10px] text-gray-400 py-4">Aucune icône</p>}
          </div>
          <p className="text-[10px] text-gray-400">{filteredIcons.length} icônes · {isSwapping ? "Cliquez pour changer l'icône" : "Cliquez pour ajouter au design"}</p>
        </div>
      );
    }

    /* IMAGES */
    if (panel === "images") return (
      <div className="space-y-3">
        <button onClick={() => fileRef.current?.click()}
          className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700 w-full`}><Upload className="w-4 h-4" /> Importer mon image</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Importer une image"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) addImage("", f); }} />
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Images libres de droits</p>
        <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto overscroll-contain">
          {STOCK_IMAGES.map((img) => (
            <button key={img.url} onClick={() => addImage(img.url)}
              className="relative rounded-lg overflow-hidden group aspect-[4/3] bg-gray-100 active:scale-[0.97] transition-all">
              <img src={img.url} alt={img.label} loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                <span className="text-[9px] text-white font-medium">{img.label}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">Source : Unsplash · Libres pour usage commercial</p>
      </div>
    );

    /* LAYERS */
    if (panel === "layers") return (
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{elements.length} calque{elements.length > 1 ? "s" : ""}</p>
        {elements.length === 0 && <p className="text-xs text-gray-400 py-3 text-center">Aucun élément. Ajoutez du texte, des formes ou des images.</p>}
        {[...elements].reverse().map((el) => (
          <div key={el.id}
            onClick={() => setSelected(el.id)}
            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${selected === el.id ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="truncate flex items-center gap-1.5">
              {el.type === "text" && <Type className="w-3 h-3 shrink-0" />}
              {el.type === "rect" && <Square className="w-3 h-3 shrink-0" />}
              {el.type === "circle" && <CircleIcon className="w-3 h-3 shrink-0" />}
              {el.type === "image" && <ImageIcon className="w-3 h-3 shrink-0" />}
              {el.type === "icon" && <IconComp name={el.iconName ?? "Star"} className="w-3 h-3 shrink-0" />}
              {el.type === "text" ? (el.text?.slice(0, 18) || "Texte") : el.type === "icon" ? el.iconName : el.type}
            </span>
            <button onClick={(ev) => { ev.stopPropagation(); del(el.id); }} aria-label="Supprimer"
              className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    );

    return null;
  };

  return (
    <div className="space-y-3">
      {/* Mobile toggle edit / preview */}
      <div className="lg:hidden flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => setMobileView("edit")} className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobileView === "edit" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          <Pencil className="w-3.5 h-3.5" /> Édition
        </button>
        <button onClick={() => setMobileView("preview")} className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobileView === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
          <Eye className="w-3.5 h-3.5" /> Aperçu
        </button>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        {/* ── LEFT PANEL ── */}
        <div className={`space-y-2 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          <div className="flex gap-1 flex-wrap">
            {panelBtns.map((b) => (
              <button key={b.id} onClick={() => setPanel(b.id)}
                className={`inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${panel === b.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                <b.icon className="w-3 h-3" /> {b.label}
              </button>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto overscroll-contain">
            <PanelContent />
            <PropsPanel />
          </div>
        </div>

        {/* ── CANVAS PREVIEW ── */}
        <div className={`${mobileView === "edit" ? "hidden lg:block" : ""}`}>
          <div className="overflow-auto rounded-xl border border-gray-200 p-3"
            style={{ backgroundImage: "linear-gradient(45deg,#f1f5f9 25%,transparent 25%),linear-gradient(-45deg,#f1f5f9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f1f5f9 75%),linear-gradient(-45deg,transparent 75%,#f1f5f9 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0,0 8px,8px -8px,-8px 0", backgroundColor: "#e2e8f0" }}>
            <div className="mx-auto" style={{ width: canvasSize.w * scale, height: canvasSize.h * scale }}>
              <div ref={canvasRef} className="relative overflow-hidden shadow-xl"
                style={{ width: canvasSize.w * scale, height: canvasSize.h * scale, background: bgColor, transformOrigin: "top left" }}
                onClick={() => setSelected(null)}>
                {sortedEls.map((el) => {
                  const isSel = selected === el.id;
                  const base: React.CSSProperties = {
                    position: "absolute", left: el.x * scale, top: el.y * scale,
                    width: el.w * scale, height: el.h * scale,
                    opacity: el.opacity ?? 1, cursor: el.locked ? "default" : "move",
                    outline: isSel ? "2px solid #2563eb" : "1px solid transparent",
                    outlineOffset: isSel ? 1 : 0, touchAction: "none",
                    zIndex: el.zIndex,
                  };
                  const Handles = isSel ? (<>
                    {/* 4 corner dots for visibility */}
                    <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-full" />
                    <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-full" />
                    <div className="absolute -left-1 -bottom-1 w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-full" />
                    {/* Bottom-right: resize handle */}
                    <div className="absolute -right-1.5 -bottom-1.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize shadow-sm"
                      onPointerDown={(e) => onResizeDown(e, el.id)} />
                  </>) : null;

                  if (el.type === "text") return (
                    <div key={el.id} style={base} onPointerDown={(e) => onPointerDown(e, el.id)}>
                      <div style={{
                        color: el.color, fontSize: (el.fontSize ?? 32) * scale,
                        fontWeight: el.fontWeight ?? 400, fontFamily: el.fontFamily ?? "Arial, sans-serif",
                        lineHeight: el.lineHeight ?? 1.25, textAlign: el.textAlign ?? "left",
                        whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden",
                        width: "100%", height: "100%",
                      }}>{el.text}</div>
                      {Handles}
                    </div>
                  );
                  if (el.type === "icon") return (
                    <div key={el.id} style={{
                      ...base,
                      color: el.color,
                      backgroundColor: (el.bgColor && el.bgColor !== "transparent") ? el.bgColor : undefined,
                      borderRadius: (el.borderRadius ?? 0) * scale,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }} onPointerDown={(e) => onPointerDown(e, el.id)}>
                      <IconComp name={el.iconName ?? "Star"} className="w-[70%] h-[70%]" strokeWidth={el.iconStroke ?? 2} fill={el.iconFill} />
                      {Handles}
                    </div>
                  );
                  if (el.type === "image") return (
                    <div key={el.id} style={base} onPointerDown={(e) => onPointerDown(e, el.id)}>
                      <img src={el.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                      {Handles}
                    </div>
                  );
                  const r = el.type === "circle" ? "50%" : `${(el.borderRadius ?? 0) * scale}px`;
                  return (
                    <div key={el.id} style={{
                      ...base,
                      backgroundColor: el.bgColor ?? "transparent",
                      borderRadius: r,
                      border: (el.borderWidth ?? 0) > 0 ? `${Math.max(1, (el.borderWidth ?? 0) * scale)}px solid ${el.borderColor ?? "#000"}` : "none",
                    }} onPointerDown={(e) => onPointerDown(e, el.id)}>
                      {Handles}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-gray-400">{canvasSize.w}×{canvasSize.h} px</p>
              {sel ? (
                <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  {sel.type === "text" ? `"${(sel.text ?? "").slice(0, 18)}"` : sel.type === "icon" ? sel.iconName : sel.type} sélectionné
                  <button onClick={() => setMobileView("edit")} className="lg:hidden text-blue-500 underline ml-1">Modifier ↗</button>
                </p>
              ) : (
                <p className="text-[10px] text-gray-400">Cliquez sur un élément</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPORTS ── */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">Exporter votre design</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => guard(exportPng)} disabled={busy !== null || !elements.length} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "png" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PNG HD</button>
          <button onClick={() => guard(exportJpg)} disabled={busy !== null || !elements.length} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "jpg" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} JPG</button>
          <button onClick={() => guard(exportSvg)} disabled={busy !== null || !elements.length} className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700`}>
            {busy === "svg" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} SVG</button>
          <button onClick={() => guard(exportPdf)} disabled={busy !== null || !elements.length} className={`${btnCls} bg-gray-900 text-white hover:bg-gray-800`}>
            {busy === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF Impression</button>
          <button onClick={() => guard(shareDesign)} disabled={busy !== null || !elements.length} className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
            {busy === "share" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Partager</button>
          <ClearButton onClick={reset} label="Tout effacer" />
        </div>
        {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-2" aria-live="polite">{info}</p>}
      </div>
    </div>
  );
}

function escSvg(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
