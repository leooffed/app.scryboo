import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Share2, Wifi, Globe, Smartphone, MapPin, CreditCard, UtensilsCrossed, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import { ClearButton } from "../../components/tools/common";
import { useUsageGate } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Générateur de QR Code - Scryboo",
  description: "Créez facilement des codes QR pour vos liens, contacts et bien plus encore.",
  canonical: "/tools/qr-code",
});

/* ═══════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════ */
type QrCategory = "url" | "text" | "wifi" | "email" | "phone" | "sms" | "vcard" | "geo" | "app";

interface QrCat { id: QrCategory; icon: React.ElementType; label: string; hint: string }

const CATEGORIES: QrCat[] = [
  { id: "url", icon: Globe, label: "Site web / URL", hint: "Lien vers un site, une page ou une app" },
  { id: "wifi", icon: Wifi, label: "Wi-Fi", hint: "Connexion Wi-Fi automatique" },
  { id: "vcard", icon: CreditCard, label: "Carte de visite", hint: "Contact avec nom, tél, email" },
  { id: "text", icon: QrCode, label: "Texte libre", hint: "N'importe quel message" },
  { id: "email", icon: Globe, label: "Email", hint: "Ouvrir un email pré-rempli" },
  { id: "phone", icon: Smartphone, label: "Téléphone", hint: "Appeler un numéro" },
  { id: "sms", icon: Smartphone, label: "SMS", hint: "Envoyer un SMS pré-rempli" },
  { id: "geo", icon: MapPin, label: "Localisation", hint: "Position GPS / adresse" },
  { id: "app", icon: UtensilsCrossed, label: "Restaurant / Menu", hint: "Lien vers un menu ou une carte" },
];

const COLORS = [
  "#000000", "#1e293b", "#0f172a", "#1e3a5f",
  "#2563eb", "#4f46e5", "#7c3aed", "#9333ea",
  "#dc2626", "#ea580c", "#16a34a", "#0d9488",
];

const BG_COLORS = ["#ffffff", "#f8fafc", "#fef3c7", "#ecfdf5", "#eff6ff", "#fdf2f8"];

const SIZES = [256, 512, 1024, 2048];

const inputCls = "w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/* ═══════════════════════════════════════════════════
   QR DATA BUILDER
   ═══════════════════════════════════════════════════ */
function buildQrData(cat: QrCategory, fields: Record<string, string>): string {
  switch (cat) {
    case "url": return fields.url || "https://tools.scryboo.com";
    case "text": return fields.text || "";
    case "wifi": {
      const enc = fields.encryption || "WPA";
      return `WIFI:T:${enc};S:${fields.ssid || ""};P:${fields.password || ""};H:${fields.hidden === "true" ? "true" : "false"};;`;
    }
    case "email": return `mailto:${fields.email || ""}?subject=${encodeURIComponent(fields.subject || "")}&body=${encodeURIComponent(fields.body || "")}`;
    case "phone": return `tel:${fields.phone || ""}`;
    case "sms": return `sms:${fields.phone || ""}${fields.body ? `?body=${encodeURIComponent(fields.body)}` : ""}`;
    case "vcard": return [
      "BEGIN:VCARD", "VERSION:3.0",
      `N:${fields.lastName || ""};${fields.firstName || ""}`,
      `FN:${fields.firstName || ""} ${fields.lastName || ""}`,
      fields.org ? `ORG:${fields.org}` : "",
      fields.title ? `TITLE:${fields.title}` : "",
      fields.phone ? `TEL:${fields.phone}` : "",
      fields.email ? `EMAIL:${fields.email}` : "",
      fields.url ? `URL:${fields.url}` : "",
      fields.address ? `ADR:;;${fields.address};;;;` : "",
      "END:VCARD",
    ].filter(Boolean).join("\n");
    case "geo": return `geo:${fields.lat || "0"},${fields.lng || "0"}`;
    case "app": return fields.url || "";
    default: return "";
  }
}

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
export function GenerateurQrCode() {
  const { guard } = useUsageGate();
  const [cat, setCat] = useState<QrCategory>("url");
  const [fields, setFields] = useState<Record<string, string>>({ url: "https://tools.scryboo.com" });
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20); // % of QR size
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string) => setFields((f) => ({ ...f, [key]: val }));

  const qrData = buildQrData(cat, fields);
  const canGenerate = qrData.length > 0;

  // Switch category → reset fields
  const switchCat = (c: QrCategory) => {
    setCat(c);
    setFields(c === "url" ? { url: "https://" } : {});
  };

  // Generate QR to canvas
  useEffect(() => {
    if (!canGenerate || !canvasRef.current) return;
    const canvas = canvasRef.current;
    QRCodeLib.toCanvas(canvas, qrData, {
      width: 300,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: logoFile ? "H" : "M",
    }, () => {
      // Draw logo overlay if present
      if (logoFile) {
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        img.onload = () => {
          const logoSz = canvas.width * (logoSize / 100);
          const x = (canvas.width - logoSz) / 2;
          const y = (canvas.height - logoSz) / 2;
          // White background behind logo
          ctx.fillStyle = bgColor;
          ctx.fillRect(x - 4, y - 4, logoSz + 8, logoSz + 8);
          ctx.drawImage(img, x, y, logoSz, logoSz);
        };
        img.src = logoFile;
      }
    });
  }, [qrData, fgColor, bgColor, logoFile, logoSize, canGenerate]);

  // Export functions
  const getBlob = async (format: "png" | "jpg" | "svg", exportSize: number): Promise<Blob | null> => {
    if (format === "svg") {
      const svgStr = await QRCodeLib.toString(qrData, {
        type: "svg",
        width: exportSize,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
      });
      return new Blob([svgStr], { type: "image/svg+xml" });
    }
    // PNG or JPG — render to offscreen canvas at exportSize
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = exportSize;
    await QRCodeLib.toCanvas(canvas, qrData, {
      width: exportSize,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: logoFile ? "H" : "M",
    });
    if (logoFile) {
      const ctx = canvas.getContext("2d")!;
      const img = await loadImg(logoFile);
      const logoSz = exportSize * (logoSize / 100);
      const x = (exportSize - logoSz) / 2;
      const y = (exportSize - logoSz) / 2;
      ctx.fillStyle = bgColor;
      ctx.fillRect(x - 4, y - 4, logoSz + 8, logoSz + 8);
      ctx.drawImage(img, x, y, logoSz, logoSz);
    }
    return new Promise((res) =>
      canvas.toBlob((b) => res(b), format === "jpg" ? "image/jpeg" : "image/png", 0.95)
    );
  };

  const download = async (format: "png" | "jpg" | "svg") => {
    setBusy(format); setInfo("");
    try {
      const blob = await getBlob(format, size);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `qrcode-scryboo.${format}`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setInfo(`✅ QR code ${format.toUpperCase()} téléchargé (${size}×${size} px).`);
    } finally { setBusy(null); }
  };

  const share = async () => {
    setBusy("share"); setInfo("");
    try {
      const blob = await getBlob("png", 1024);
      if (!blob) return;
      const file = new File([blob], "qrcode-scryboo.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "QR Code Scryboo" });
        setInfo("✅ QR code partagé.");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "qrcode-scryboo.png"; a.click();
        setInfo("ℹ️ Le PNG a été téléchargé.");
      }
    } catch {} finally { setBusy(null); }
  };

  const btnCls = "inline-flex items-center justify-center gap-2 px-3.5 py-2.5 lg:py-2 text-sm font-medium rounded-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

  /* ─── Field renderers per category ─── */
  const Fields = () => {
    switch (cat) {
      case "url": return (
        <label className="block"><span className="text-sm font-medium text-gray-700">URL du site web</span>
          <input value={fields.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://mon-site.com" className={inputCls} /></label>
      );
      case "text": return (
        <label className="block"><span className="text-sm font-medium text-gray-700">Votre message</span>
          <textarea value={fields.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Scannez ce code pour un message secret…" rows={3}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
      );
      case "wifi": return (<div className="space-y-3">
        <label className="block"><span className="text-sm font-medium text-gray-700">Nom du réseau (SSID) *</span>
          <input value={fields.ssid ?? ""} onChange={(e) => set("ssid", e.target.value)} placeholder="MonWifi" className={inputCls} /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Mot de passe</span>
          <input value={fields.password ?? ""} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" className={inputCls} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm font-medium text-gray-700">Sécurité</span>
            <select value={fields.encryption ?? "WPA"} onChange={(e) => set("encryption", e.target.value)} className={inputCls + " bg-white"}>
              <option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Sans mot de passe</option>
            </select></label>
          <label className="flex items-center gap-2 mt-6 text-sm text-gray-700">
            <input type="checkbox" checked={fields.hidden === "true"} onChange={(e) => set("hidden", e.target.checked ? "true" : "false")} className="accent-blue-600" />
            Réseau masqué
          </label>
        </div>
      </div>);
      case "email": return (<div className="space-y-3">
        <label className="block"><span className="text-sm font-medium text-gray-700">Adresse email *</span>
          <input type="email" value={fields.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="contact@exemple.com" className={inputCls} /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Objet</span>
          <input value={fields.subject ?? ""} onChange={(e) => set("subject", e.target.value)} placeholder="Demande d'information" className={inputCls} /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Message</span>
          <textarea value={fields.body ?? ""} onChange={(e) => set("body", e.target.value)} placeholder="Bonjour, je souhaite…" rows={2}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
      </div>);
      case "phone": return (
        <label className="block"><span className="text-sm font-medium text-gray-700">Numéro de téléphone *</span>
          <input value={fields.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+237 6XX XX XX XX" className={inputCls} /></label>
      );
      case "sms": return (<div className="space-y-3">
        <label className="block"><span className="text-sm font-medium text-gray-700">Numéro *</span>
          <input value={fields.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+237 6XX XX XX XX" className={inputCls} /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Message pré-rempli</span>
          <input value={fields.body ?? ""} onChange={(e) => set("body", e.target.value)} placeholder="Bonjour, je confirme ma réservation." className={inputCls} /></label>
      </div>);
      case "vcard": return (<div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm font-medium text-gray-700">Prénom *</span>
            <input value={fields.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} placeholder="Aïcha" className={inputCls} /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Nom *</span>
            <input value={fields.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} placeholder="Diallo" className={inputCls} /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm font-medium text-gray-700">Entreprise</span>
            <input value={fields.org ?? ""} onChange={(e) => set("org", e.target.value)} placeholder="Mon Entreprise" className={inputCls} /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Poste</span>
            <input value={fields.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Directrice Marketing" className={inputCls} /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm font-medium text-gray-700">Téléphone</span>
            <input value={fields.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+237 6XX XX XX XX" className={inputCls} /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Email</span>
            <input type="email" value={fields.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="aicha@mail.com" className={inputCls} /></label>
        </div>
        <label className="block"><span className="text-sm font-medium text-gray-700">Site web</span>
          <input value={fields.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://mon-site.com" className={inputCls} /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Adresse</span>
          <input value={fields.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Quartier Bastos, Yaoundé" className={inputCls} /></label>
      </div>);
      case "geo": return (<div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="text-sm font-medium text-gray-700">Latitude *</span>
          <input type="number" step="any" value={fields.lat ?? ""} onChange={(e) => set("lat", e.target.value)} placeholder="3.848" className={inputCls} /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Longitude *</span>
          <input type="number" step="any" value={fields.lng ?? ""} onChange={(e) => set("lng", e.target.value)} placeholder="11.502" className={inputCls} /></label>
      </div>);
      case "app": return (
        <label className="block"><span className="text-sm font-medium text-gray-700">Lien du menu / de la carte *</span>
          <input value={fields.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://mon-restaurant.com/menu" className={inputCls} /></label>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Category selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Type de QR code</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => switchCat(c.id)} aria-pressed={cat === c.id}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all active:scale-[0.97] ${
                cat === c.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <c.icon className={`w-5 h-5 ${cat === c.id ? "text-blue-600" : "text-gray-400"}`} />
              <span className={`text-[10px] font-medium text-center leading-tight ${cat === c.id ? "text-blue-700" : "text-gray-600"}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Left: fields + customization */}
        <div className="space-y-5">
          {/* Data fields */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Contenu du QR code
            </p>
            <Fields />
          </div>

          {/* Customization */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Personnalisation</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Couleur du code</span>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5 bg-white" />
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setFgColor(c)} aria-label={c}
                      className={`w-5 h-5 rounded-md border transition-transform active:scale-90 ${fgColor === c ? "ring-2 ring-blue-500 ring-offset-1 border-white" : "border-gray-200"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Couleur de fond</span>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5 bg-white" />
                  {BG_COLORS.map((c) => (
                    <button key={c} onClick={() => setBgColor(c)} aria-label={c}
                      className={`w-5 h-5 rounded-md border transition-transform active:scale-90 ${bgColor === c ? "ring-2 ring-blue-500 ring-offset-1 border-white" : "border-gray-200"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Logo / Image au centre (optionnel)</span>
              <div className="flex items-center gap-3">
                {logoFile ? (
                  <div className="relative">
                    <img src={logoFile} alt="Logo" className="w-14 h-14 rounded-lg border border-gray-200 object-cover" />
                    <button onClick={() => setLogoFile(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow" aria-label="Retirer le logo">✕</button>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <span className="text-lg">+</span>
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]; e.target.value = "";
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = () => setLogoFile(reader.result as string);
                      reader.readAsDataURL(f);
                    }
                  }} />
                {logoFile && (
                  <label className="block flex-1">
                    <span className="text-[11px] text-gray-500">Taille du logo : {logoSize}%</span>
                    <input type="range" min={10} max={35} value={logoSize} onChange={(e) => setLogoSize(+e.target.value)} className="w-full accent-blue-600" />
                  </label>
                )}
              </div>
            </div>

            {/* Export size */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Taille d'export</span>
              <select value={size} onChange={(e) => setSize(+e.target.value)} className={inputCls + " bg-white"}>
                {SIZES.map((s) => <option key={s} value={s}>{s}×{s} px{s >= 1024 ? " (HD)" : ""}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Right: Live preview */}
        <div>
          <div className="lg:sticky lg:top-24 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Aperçu en direct</p>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-center shadow-sm"
              style={{ backgroundColor: bgColor }}>
              {canGenerate ? (
                <canvas ref={canvasRef} className="w-full max-w-[260px] h-auto" />
              ) : (
                <div className="w-60 h-60 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-sm text-center px-4">
                  Remplissez les champs pour voir l'aperçu
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              {canGenerate ? `${qrData.length} caractères encodés` : "En attente de données"}
            </p>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Télécharger votre QR code</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => guard(() => download("png"))} disabled={busy !== null || !canGenerate}
            className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "png" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG
          </button>
          <button onClick={() => guard(() => download("jpg"))} disabled={busy !== null || !canGenerate}
            className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
            {busy === "jpg" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JPG
          </button>
          <button onClick={() => guard(() => download("svg"))} disabled={busy !== null || !canGenerate}
            className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700`}>
            {busy === "svg" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} SVG
          </button>
          <button onClick={() => guard(share)} disabled={busy !== null || !canGenerate}
            className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
            {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Partager
          </button>
          <ClearButton onClick={() => { setFields(cat === "url" ? { url: "https://" } : {}); setLogoFile(null); setInfo(""); }} />
        </div>
        {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-2" aria-live="polite">{info}</p>}
      </div>
    </div>
  );
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
  });
}
