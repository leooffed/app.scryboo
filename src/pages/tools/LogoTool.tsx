import { useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Download, Loader2, Search, Share2 } from "lucide-react";
import { ClearButton } from "../../components/tools/common";
import { useSEO } from "../../lib/seo";

/* ================= Galerie d'icônes (130+) ================= */
const ICON_LIST = [
  "Activity","Anchor","Aperture","Apple","Atom","Award","Banknote","Bell","Bike","Bird","Bitcoin","BookOpen","Bot","Brain","Briefcase","Brush","Bug","Building2","Bus","Cake","Camera","Car","Carrot","Cat","ChefHat","Cherry","Church","Clapperboard","Cloud","Code","Coffee","Cog","Compass","Cpu","Croissant","Crown","CupSoda","Diamond","Dog","Drum","Droplet","Dumbbell","Egg","Factory","Feather","Film","Fish","Flag","Flame","Flower2","Footprints","Gamepad2","Gem","Gift","Glasses","Globe","GraduationCap","Grape","Guitar","Hammer","Headphones","Heart","Home","Key","Lamp","Landmark","Laptop","Leaf","Lightbulb","Link","Lock","Mail","MapPin","Megaphone","Mic","Moon","Mountain","Music","Newspaper","Palette","PawPrint","Pen","Phone","Piano","Pizza","Plane","Plug","Printer","Puzzle","Radio","Rocket","Sailboat","Salad","Scale","School","Scissors","Settings","Shield","Ship","Shirt","ShoppingBag","ShoppingCart","Smartphone","Smile","Snowflake","Sparkles","Speaker","Star","Stethoscope","Store","Sun","Swords","Syringe","Target","Tent","Terminal","TreePine","Trophy","Truck","Tv","Umbrella","Utensils","Video","Wallet","Wand2","Warehouse","Watch","Waves","Wifi","Wind","Wine","Wrench","Zap",
].filter((n) => n in Icons);

/* ================= Palettes premium ================= */
const SWATCHES = [
  "#2563eb","#0ea5e9","#0d9488","#16a34a","#84cc16","#eab308","#f59e0b","#ea580c",
  "#dc2626","#e11d48","#db2777","#a21caf","#7c3aed","#4f46e5","#1f2937","#0f172a",
  "#64748b","#ffffff","#f8fafc","#000000",
];

const STYLE_PRESETS: { label: string; bg: string; bg2?: string; fg: string }[] = [
  { label: "Océan", bg: "#2563eb", bg2: "#0ea5e9", fg: "#ffffff" },
  { label: "Forêt", bg: "#059669", bg2: "#84cc16", fg: "#ffffff" },
  { label: "Sunset", bg: "#f59e0b", bg2: "#e11d48", fg: "#ffffff" },
  { label: "Violet", bg: "#7c3aed", bg2: "#db2777", fg: "#ffffff" },
  { label: "Nuit", bg: "#0f172a", fg: "#38bdf8" },
  { label: "Or", bg: "#1f2937", fg: "#fbbf24" },
  { label: "Clair", bg: "#f8fafc", fg: "#0f172a" },
  { label: "Corail", bg: "#fff1f2", fg: "#e11d48" },
];

const FONTS = [
  { id: "Arial, Helvetica, sans-serif", label: "Sans (Arial)" },
  { id: "Georgia, 'Times New Roman', serif", label: "Serif (Georgia)" },
  { id: "'Courier New', monospace", label: "Mono (Courier)" },
  { id: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { id: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
];

type Mode = "icon" | "text" | "icon-text";
type BgType = "solid" | "gradient" | "none";

interface LogoState {
  mode: Mode;
  icon: string;
  text: string;
  font: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  fgColor: string;
  strokeWidth: number;
  iconScale: number;
  bgType: BgType;
  bgColor: string;
  bgColor2: string;
  gradientAngle: number;
  radius: number;
  borderWidth: number;
  borderColor: string;
}

const DEFAULT: LogoState = {
  mode: "icon-text",
  icon: "Rocket",
  text: "Scryboo",
  font: FONTS[0].id,
  fontWeight: 700,
  fontSize: 72,
  letterSpacing: 0,
  fgColor: "#ffffff",
  strokeWidth: 1.8,
  iconScale: 0.42,
  bgType: "gradient",
  bgColor: "#2563eb",
  bgColor2: "#0ea5e9",
  gradientAngle: 135,
  radius: 110,
  borderWidth: 0,
  borderColor: "#ffffff",
};

/* ================= Contrôles UI ================= */
function ColorControl({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Pipette ${label}`}
          className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value)}
          aria-label={`Code hexadécimal ${label}`}
          className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-1">
          {SWATCHES.slice(0, 10).map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              aria-label={`Couleur ${c}`}
              className={`w-5 h-5 rounded-md border transition-transform active:scale-90 ${
                value.toLowerCase() === c ? "ring-2 ring-blue-500 ring-offset-1 border-white" : "border-gray-200"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-1 ml-11">
        {SWATCHES.slice(10).map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`Couleur ${c}`}
            className={`w-5 h-5 rounded-md border transition-transform active:scale-90 ${
              value.toLowerCase() === c ? "ring-2 ring-blue-500 ring-offset-1 border-white" : "border-gray-200"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

function Slider({
  label, value, onChange, min, max, step = 1, suffix = "",
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label} : {value}{suffix}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)} aria-label={label}
        className="w-full mt-1.5 accent-blue-600" />
    </label>
  );
}

/* ================= Composant principal ================= */
export function CreateurLogo() {
  const [s, setS] = useState<LogoState>(DEFAULT);
  const [iconSearch, setIconSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  useSEO({
    title: "Créateur de logo - Scryboo",
    description: "Créez votre logo personnalisé en quelques clics.",
    canonical: "/tools/logo",
  });

  const set = (patch: Partial<LogoState>) => setS((p) => ({ ...p, ...patch }));

  const filteredIcons = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    return q ? ICON_LIST.filter((n) => n.toLowerCase().includes(q)) : ICON_LIST;
  }, [iconSearch]);

  const Icon = (Icons as unknown as Record<string, LucideIcon>)[s.icon] ?? Icons.Rocket;

  /* ----- Géométrie du canvas 512×512 ----- */
  const C = 512;
  const hasIcon = s.mode !== "text";
  const hasText = s.mode !== "icon" && s.text.trim().length > 0;
  const iconSize = Math.round(C * s.iconScale);
  const iconY = hasText ? C * 0.18 : (C - iconSize) / 2;
  const textY = hasIcon && hasText ? C * 0.78 : C / 2;

  // Coordonnées du dégradé selon l'angle
  const rad = ((s.gradientAngle - 90) * Math.PI) / 180;
  const gx = Math.cos(rad) * 0.5, gy = Math.sin(rad) * 0.5;
  const grad = { x1: 0.5 - gx, y1: 0.5 - gy, x2: 0.5 + gx, y2: 0.5 + gy };

  const filename = (s.text.trim() || s.icon || "logo").toLowerCase().replace(/\s+/g, "-");

  /* ----- Exports ----- */
  const getSvgString = () => {
    if (!svgRef.current) return "";
    const node = svgRef.current.cloneNode(true) as SVGSVGElement;
    node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(node);
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const renderPng = (size: number): Promise<Blob | null> =>
    new Promise((resolve) => {
      const svgStr = getSvgString();
      const url = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob(resolve, "image/png");
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });

  const exportSvg = () => {
    setInfo("");
    download(new Blob([getSvgString()], { type: "image/svg+xml" }), `${filename}.svg`);
    setInfo("✅ Logo SVG téléchargé — vectoriel, redimensionnable à l'infini.");
  };

  const exportPng = async (size: number) => {
    setBusy(`png${size}`);
    setInfo("");
    try {
      const blob = await renderPng(size);
      if (blob) {
        download(blob, `${filename}-${size}px.png`);
        setInfo(`✅ Logo PNG ${size}×${size} px téléchargé (fond transparent si « Aucun fond »).`);
      }
    } finally {
      setBusy(null);
    }
  };

  const exportPrint = async () => {
    setBusy("print");
    setInfo("");
    try {
      const blob = await renderPng(2048);
      if (!blob) return;
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]); // A4
      const png = await doc.embedPng(await blob.arrayBuffer());
      const size = 400;
      page.drawImage(png, { x: (595 - size) / 2, y: (842 - size) / 2 + 40, width: size, height: size });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      page.drawText("Logo haute resolution (2048 px) - pret pour l'impression", {
        x: 150, y: 130, size: 10, font, color: rgb(0.45, 0.45, 0.5),
      });
      page.drawText("Cree gratuitement avec tools.scryboo.com", {
        x: 195, y: 114, size: 9, font, color: rgb(0.6, 0.6, 0.65),
      });
      const bytes = await doc.save();
      download(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${filename}-impression.pdf`);
      setInfo("✅ PDF d'impression A4 téléchargé (logo en 2048 px).");
    } finally {
      setBusy(null);
    }
  };

  const sharePng = async () => {
    setBusy("share");
    setInfo("");
    try {
      const blob = await renderPng(1024);
      if (!blob) return;
      const file = new File([blob], `${filename}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Logo ${s.text || s.icon}` });
        setInfo("✅ Logo partagé.");
      } else {
        download(blob, `${filename}.png`);
        setInfo("ℹ️ Partage non disponible — le PNG a été téléchargé.");
      }
    } catch { /* annulé */ } finally {
      setBusy(null);
    }
  };

  const btnCls =
    "inline-flex items-center justify-center gap-2 px-3.5 py-2.5 lg:py-2 text-sm font-medium rounded-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

  return (
    <div className="space-y-5">
      {/* ===== Aperçu + éditeur : 2 colonnes sur desktop, aperçu en premier sur mobile ===== */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* --------- Panneau d'édition --------- */}
        <div className="space-y-5 order-2 lg:order-1">
          {/* Mode */}
          <div className="flex gap-2">
            {([["icon", "Icône seule"], ["text", "Texte seul"], ["icon-text", "Icône + texte"]] as const).map(([m, label]) => (
              <button key={m} onClick={() => set({ mode: m })} aria-pressed={s.mode === m}
                className={`px-3.5 py-2 text-sm rounded-lg border transition-colors ${
                  s.mode === m ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Styles rapides */}
          <div>
            <span className="text-sm font-medium text-gray-700">Styles rapides</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {STYLE_PRESETS.map((p) => (
                <button key={p.label} onClick={() => set({
                    bgType: p.bg2 ? "gradient" : "solid",
                    bgColor: p.bg, bgColor2: p.bg2 ?? p.bg, fgColor: p.fg,
                  })}
                  aria-label={`Style ${p.label}`}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 active:scale-95 transition-all">
                  <span className="w-5 h-5 rounded-md border border-black/5"
                    style={{ background: p.bg2 ? `linear-gradient(135deg, ${p.bg}, ${p.bg2})` : p.bg }} />
                  <span className="text-xs text-gray-600">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Icône */}
          {s.mode !== "text" && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Icône — {filteredIcons.length} disponibles</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Rechercher… (ex : car, heart, food)" aria-label="Rechercher une icône"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-44 overflow-y-auto overscroll-contain border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                {filteredIcons.map((name) => {
                  const I = (Icons as unknown as Record<string, LucideIcon>)[name];
                  return (
                    <button key={name} onClick={() => set({ icon: name })} aria-label={`Icône ${name}`} title={name}
                      className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                        s.icon === name ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-white hover:text-blue-600 active:bg-white"
                      }`}>
                      <I className="w-5 h-5" strokeWidth={1.8} />
                    </button>
                  );
                })}
                {filteredIcons.length === 0 && (
                  <p className="col-span-full text-center text-xs text-gray-400 py-4">Aucune icône pour «&nbsp;{iconSearch}&nbsp;»</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Taille de l'icône" value={Math.round(s.iconScale * 100)} onChange={(v) => set({ iconScale: v / 100 })} min={15} max={75} suffix=" %" />
                <Slider label="Épaisseur du trait" value={s.strokeWidth} onChange={(v) => set({ strokeWidth: v })} min={0.5} max={3.5} step={0.1} />
              </div>
            </div>
          )}

          {/* Texte */}
          {s.mode !== "icon" && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Texte du logo</span>
                <input value={s.text} onChange={(e) => set({ text: e.target.value })} placeholder="Nom de votre marque" maxLength={20}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Police</span>
                  <select value={s.font} onChange={(e) => set({ font: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Graisse</span>
                  <select value={s.fontWeight} onChange={(e) => set({ fontWeight: +e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={400}>Normal</option>
                    <option value={600}>Semi-gras</option>
                    <option value={700}>Gras</option>
                    <option value={900}>Très gras</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Taille du texte" value={s.fontSize} onChange={(v) => set({ fontSize: v })} min={24} max={140} suffix=" px" />
                <Slider label="Espacement lettres" value={s.letterSpacing} onChange={(v) => set({ letterSpacing: v })} min={-4} max={24} suffix=" px" />
              </div>
            </div>
          )}

          {/* Couleurs */}
          <ColorControl label={s.mode === "text" ? "Couleur du texte" : "Couleur icône / texte"} value={s.fgColor} onChange={(v) => set({ fgColor: v })} />

          {/* Fond */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Fond :</span>
              {([["solid", "Uni"], ["gradient", "Dégradé"], ["none", "Aucun (transparent)"]] as const).map(([t, label]) => (
                <button key={t} onClick={() => set({ bgType: t })} aria-pressed={s.bgType === t}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    s.bgType === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {s.bgType !== "none" && (
              <ColorControl label={s.bgType === "gradient" ? "Couleur de départ" : "Couleur de fond"} value={s.bgColor} onChange={(v) => set({ bgColor: v })} />
            )}
            {s.bgType === "gradient" && (
              <>
                <ColorControl label="Couleur d'arrivée" value={s.bgColor2} onChange={(v) => set({ bgColor2: v })} />
                <Slider label="Angle du dégradé" value={s.gradientAngle} onChange={(v) => set({ gradientAngle: v })} min={0} max={360} step={15} suffix="°" />
              </>
            )}
          </div>

          {/* Bordures */}
          <div className="grid grid-cols-2 gap-4">
            <Slider label="Arrondi des coins" value={s.radius} onChange={(v) => set({ radius: v })} min={0} max={256} suffix=" px" />
            <Slider label="Épaisseur bordure" value={s.borderWidth} onChange={(v) => set({ borderWidth: v })} min={0} max={32} suffix=" px" />
          </div>
          {s.borderWidth > 0 && (
            <ColorControl label="Couleur de la bordure" value={s.borderColor} onChange={(v) => set({ borderColor: v })} />
          )}
        </div>

        {/* --------- Aperçu en direct (sticky desktop) --------- */}
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aperçu en direct</p>
            {/* Damier = zones transparentes */}
            <div
              className="rounded-2xl border border-gray-200 p-5 sm:p-6 flex items-center justify-center"
              style={{
                backgroundImage:
                  "linear-gradient(45deg,#f1f5f9 25%,transparent 25%),linear-gradient(-45deg,#f1f5f9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f1f5f9 75%),linear-gradient(-45deg,transparent 75%,#f1f5f9 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
                backgroundColor: "#ffffff",
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${C} ${C}`}
                width={C}
                height={C}
                role="img"
                aria-label="Aperçu du logo"
                className="w-full max-w-[280px] sm:max-w-[300px] h-auto drop-shadow-xl"
              >
                <defs>
                  <linearGradient id="logo-grad" x1={grad.x1} y1={grad.y1} x2={grad.x2} y2={grad.y2}>
                    <stop offset="0%" stopColor={s.bgColor} />
                    <stop offset="100%" stopColor={s.bgColor2} />
                  </linearGradient>
                </defs>
                {(s.bgType !== "none" || s.borderWidth > 0) && (
                  <rect
                    x={s.borderWidth / 2}
                    y={s.borderWidth / 2}
                    width={C - s.borderWidth}
                    height={C - s.borderWidth}
                    rx={Math.max(0, s.radius - s.borderWidth / 2)}
                    fill={s.bgType === "none" ? "none" : s.bgType === "gradient" ? "url(#logo-grad)" : s.bgColor}
                    stroke={s.borderWidth > 0 ? s.borderColor : "none"}
                    strokeWidth={s.borderWidth}
                  />
                )}
                {hasIcon && (
                  <Icon
                    x={(C - iconSize) / 2}
                    y={iconY}
                    width={iconSize}
                    height={iconSize}
                    color={s.fgColor}
                    strokeWidth={s.strokeWidth}
                  />
                )}
                {hasText && (
                  <text
                    x={C / 2}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={s.fgColor}
                    fontFamily={s.font}
                    fontWeight={s.fontWeight}
                    fontSize={s.fontSize}
                    letterSpacing={s.letterSpacing}
                  >
                    {s.text}
                  </text>
                )}
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              Le damier indique les zones transparentes · 512 × 512 px
            </p>
          </div>
        </div>
      </div>

      {/* ===== Exports ===== */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Télécharger votre logo</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportPng(512)} disabled={busy !== null} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "png512" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG 512
          </button>
          <button onClick={() => exportPng(1024)} disabled={busy !== null} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "png1024" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG 1024
          </button>
          <button onClick={() => exportPng(2048)} disabled={busy !== null} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "png2048" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG 2048 (HD)
          </button>
          <button onClick={exportSvg} disabled={busy !== null} className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700`}>
            <Download className="w-4 h-4" /> SVG vectoriel
          </button>
          <button onClick={exportPrint} disabled={busy !== null} className={`${btnCls} bg-gray-900 text-white hover:bg-gray-800`}>
            {busy === "print" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF impression
          </button>
          <button onClick={sharePng} disabled={busy !== null} className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
            {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Partager
          </button>
          <ClearButton onClick={() => { setS(DEFAULT); setInfo(""); }} label="Réinitialiser" />
        </div>
        {info && (
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>
        )}
      </div>
    </div>
  );
}
