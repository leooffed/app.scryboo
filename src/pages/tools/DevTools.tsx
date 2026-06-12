import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Eye, EyeOff, Globe, Loader2, Lock, RefreshCw, Save, Search, Smartphone, Trash2 } from "lucide-react";
import {
  decodeBase64,
  encodeBase64,
  formatJSON,
  generatePassword,
  hexToRgb,
  minifyJSON,
  passwordStrength,
  rgbToCmyk,
  rgbToHsl,
  type PasswordOptions,
} from "../../lib/tools/dev";
import { ClearButton, CopyButton, ResultBox } from "../../components/tools/common";
import { useAuth, useUsageGate } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Outils de développement - Scryboo",
  description: "Outils de développement web gratuits pour les développeurs.",
  canonical: "/tools/dev",
});

/* ============ Base64 ============ */
export function EncodeurBase64() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return { ok: true, value: "" };
    try {
      return { ok: true, value: mode === "encode" ? encodeBase64(input) : decodeBase64(input) };
    } catch {
      return { ok: false, value: "⚠️ Chaîne Base64 invalide" };
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([["encode", "Encoder"], ["decode", "Décoder"]] as const).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              mode === m ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {label}
          </button>
        ))}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === "encode" ? "Texte à encoder en Base64…" : "Chaîne Base64 à décoder…"}
        aria-label="Entrée"
        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
      />
      <ResultBox label={mode === "encode" ? "Résultat Base64" : "Texte décodé"}>
        <pre className={`text-sm whitespace-pre-wrap break-all max-h-48 overflow-y-auto font-mono ${output.ok ? "text-gray-800" : "text-red-600"}`}>
          {output.value || "Le résultat apparaîtra ici…"}
        </pre>
      </ResultBox>
      <div className="flex gap-2">
        <ClearButton onClick={() => setInput("")} />
        <CopyButton text={output.ok ? output.value : ""} label="Copier le résultat" />
      </div>
    </div>
  );
}

/* ============ Générateur de mot de passe + coffre-fort ============ */
const VAULT_KEY = "scryboo-password-vault";
const SITE_ICONS: { id: string; icon: React.ElementType; label: string }[] = [
  { id: "globe", icon: Globe, label: "Site web" },
  { id: "smartphone", icon: Smartphone, label: "Application" },
  { id: "lock", icon: Lock, label: "Sécurité" },
];

interface VaultEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  iconId: string;
  createdAt: string;
}

function loadVault(): VaultEntry[] {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY) ?? "[]"); }
  catch { return []; }
}
function saveVault(entries: VaultEntry[]) {
  try { localStorage.setItem(VAULT_KEY, JSON.stringify(entries)); } catch {}
}

export function GenerateurMotDePasse() {
  const user = useAuth();
  const { guard } = useUsageGate();
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 16, upper: true, lower: true, digits: true, symbols: true, excludeAmbiguous: false,
  });
  const [pwd, setPwd] = useState(() => generatePassword({ length: 16, upper: true, lower: true, digits: true, symbols: true, excludeAmbiguous: false }));
  const strength = passwordStrength(pwd);

  // Champs pour enregistrer
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [iconId, setIconId] = useState("globe");

  // Coffre-fort
  const [vault, setVault] = useState<VaultEntry[]>(() => loadVault());
  const [showVault, setShowVault] = useState(false);
  const [vaultSearch, setVaultSearch] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState("");

  // Persist vault
  useEffect(() => { saveVault(vault); }, [vault]);

  const regen = (o: PasswordOptions = opts) => setPwd(generatePassword(o));
  const set = (patch: Partial<PasswordOptions>) => {
    const next = { ...opts, ...patch };
    if (!next.upper && !next.lower && !next.digits && !next.symbols) return;
    setOpts(next);
    regen(next);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const copyEntry = async (pw: string, id: string) => {
    try { await navigator.clipboard.writeText(pw); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch {}
  };

  const deleteEntry = (id: string) => {
    setVault((v) => v.filter((e) => e.id !== id));
  };

  const saveEntry = () => {
    if (!site.trim()) { setInfo("⚠️ Renseignez le nom du site ou de l'application."); return; }
    const entry: VaultEntry = {
      id: Math.random().toString(36).slice(2, 10),
      site: site.trim(),
      username: username.trim(),
      password: pwd,
      iconId,
      createdAt: new Date().toISOString(),
    };
    setVault((v) => [entry, ...v]);
    setSite("");
    setUsername("");
    regen();
    setInfo("✅ Mot de passe enregistré dans votre coffre-fort local.");
    setShowVault(true);
  };

  const filteredVault = useMemo(() => {
    const q = vaultSearch.trim().toLowerCase();
    return q ? vault.filter((e) => e.site.toLowerCase().includes(q) || e.username.toLowerCase().includes(q)) : vault;
  }, [vault, vaultSearch]);

  const getIcon = (id: string) => SITE_ICONS.find((s) => s.id === id)?.icon ?? Globe;

  // Export CSV
  const exportCsv = () => {
    setBusy("csv");
    const header = "Site,Identifiant,Mot de passe,Date de création";
    const lines = vault.map((e) => `"${e.site}","${e.username}","${e.password}","${new Date(e.createdAt).toLocaleDateString("fr-FR")}"`);
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mots-de-passe-scryboo.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setInfo("✅ Fichier CSV exporté. Gardez-le en lieu sûr !");
    setBusy(null);
  };

  // Export PDF
  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const blue = rgb(0.15, 0.39, 0.92);
      const dark = rgb(0.13, 0.16, 0.22);
      const gray = rgb(0.45, 0.47, 0.52);
      const white = rgb(1, 1, 1);
      const clean = (s: string) => s.replace(/[^\x20-\x7EÀ-ÿ]/g, "");

      let page = doc.addPage([595, 842]);
      page.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: blue });
      page.drawText("COFFRE-FORT - MOTS DE PASSE", { x: 50, y: 806, size: 18, font: bold, color: white });
      page.drawText(`${vault.length} entree(s) - Exporte le ${new Date().toLocaleDateString("fr-FR")}`, { x: 50, y: 790, size: 9, font, color: white });

      let y = 750;
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: blue });
      page.drawText("Site / Application", { x: 58, y, size: 9, font: bold, color: white });
      page.drawText("Identifiant", { x: 230, y, size: 9, font: bold, color: white });
      page.drawText("Mot de passe", { x: 380, y, size: 9, font: bold, color: white });
      y -= 24;

      for (const e of vault) {
        if (y < 60) { page = doc.addPage([595, 842]); y = 790; }
        page.drawText(clean(e.site).slice(0, 28), { x: 58, y, size: 9, font: bold, color: dark });
        page.drawText(clean(e.username || "—").slice(0, 24), { x: 230, y, size: 9, font, color: gray });
        page.drawText(clean(e.password).slice(0, 24), { x: 380, y, size: 8, font, color: dark });
        y -= 16;
      }

      page.drawText("CONFIDENTIEL - Gardez ce document en lieu sur", { x: 50, y: 40, size: 8, font, color: gray });

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "mots-de-passe-scryboo.pdf"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setInfo("✅ PDF exporté. Gardez-le en lieu sûr !");
    } finally { setBusy(null); }
  };

  const btnCls = "inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

  return (
    <div className="space-y-5">
      {/* Générateur */}
      <div aria-live="polite" className="bg-gray-900 rounded-xl p-5 text-center">
        <p className="text-xl sm:text-2xl font-mono text-green-400 break-all select-all">{pwd}</p>
        <div className="mt-3 flex items-center gap-2 justify-center">
          <div className="h-1.5 w-40 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full ${strength.color}`} style={{ width: `${(strength.score / 6) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-300">{strength.label}</span>
        </div>
      </div>

      {/* Options */}
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Longueur : {opts.length} caractères</span>
        <input type="range" min={6} max={64} value={opts.length} onChange={(e) => set({ length: +e.target.value })}
          className="w-full mt-2 accent-blue-600" aria-label="Longueur du mot de passe" />
      </label>
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
        <label className="flex items-center gap-2"><input type="checkbox" checked={opts.upper} onChange={(e) => set({ upper: e.target.checked })} className="accent-blue-600" /> Majuscules (A-Z)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={opts.lower} onChange={(e) => set({ lower: e.target.checked })} className="accent-blue-600" /> Minuscules (a-z)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={opts.digits} onChange={(e) => set({ digits: e.target.checked })} className="accent-blue-600" /> Chiffres (0-9)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={opts.symbols} onChange={(e) => set({ symbols: e.target.checked })} className="accent-blue-600" /> Symboles (!@#…)</label>
        <label className="flex items-center gap-2 col-span-2"><input type="checkbox" checked={opts.excludeAmbiguous} onChange={(e) => set({ excludeAmbiguous: e.target.checked })} className="accent-blue-600" /> Exclure les ambigus (I, l, 1, O, 0…)</label>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => regen()} className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
          <RefreshCw className="w-4 h-4" /> Régénérer
        </button>
        <CopyButton text={pwd} label="Copier" />
      </div>

      {/* Enregistrer le mot de passe */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Enregistrer ce mot de passe
        </p>
        <div className="grid sm:grid-cols-[auto_1fr_1fr] gap-3 items-end">
          {/* Icône */}
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Type</span>
            <div className="flex gap-1 mt-1">
              {SITE_ICONS.map((s) => (
                <button key={s.id} onClick={() => setIconId(s.id)} aria-label={s.label} title={s.label}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${iconId === s.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  <s.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          {/* Site */}
          <label className="block">
            <span className="text-[11px] text-gray-500 font-medium">Site ou application *</span>
            <input value={site} onChange={(e) => setSite(e.target.value)}
              placeholder="Ex : Gmail, Facebook, Orange Money…" aria-label="Nom du site"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          {/* Identifiant */}
          <label className="block">
            <span className="text-[11px] text-gray-500 font-medium">Identifiant (optionnel)</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex : aicha@mail.com" aria-label="Identifiant"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
        </div>
        <button onClick={() => guard(saveEntry)} disabled={!site.trim()}
          className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto`}>
          <Save className="w-4 h-4" /> Enregistrer dans le coffre-fort
        </button>
        <p className="text-[10px] text-gray-400">
          🔒 Stocké localement dans votre navigateur (chiffré côté client). Jamais envoyé sur un serveur.
          {!user && " · Connectez-vous pour exporter."}
        </p>
      </div>

      {/* Coffre-fort */}
      {vault.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <button onClick={() => setShowVault(!showVault)}
            className="flex items-center justify-between w-full text-left">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Mon coffre-fort ({vault.length})
            </span>
            <span className="text-xs text-blue-500 font-medium">{showVault ? "Masquer ▲" : "Afficher ▼"}</span>
          </button>

          {showVault && (<>
            {vault.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={vaultSearch} onChange={(e) => setVaultSearch(e.target.value)}
                  placeholder="Rechercher un site…" aria-label="Rechercher dans le coffre-fort"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto overscroll-contain">
              {filteredVault.map((e) => {
                const IconEl = getIcon(e.iconId);
                const revealed = revealedIds.has(e.id);
                const isCopied = copiedId === e.id;
                return (
                  <div key={e.id} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <IconEl className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.site}</p>
                      {e.username && <p className="text-[11px] text-gray-400 truncate">{e.username}</p>}
                      <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">
                        {revealed ? e.password : "•".repeat(Math.min(e.password.length, 20))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleReveal(e.id)} aria-label={revealed ? "Masquer" : "Afficher"} title={revealed ? "Masquer" : "Afficher"}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => copyEntry(e.password, e.id)} aria-label="Copier le mot de passe" title="Copier"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => deleteEntry(e.id)} aria-label="Supprimer" title="Supprimer"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredVault.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Aucun résultat pour «&nbsp;{vaultSearch}&nbsp;»</p>}
            </div>

            {/* Export (connecté uniquement) */}
            {user ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => guard(exportCsv)} disabled={busy !== null}
                  className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
                  {busy === "csv" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Exporter CSV
                </button>
                <button onClick={() => guard(exportPdf)} disabled={busy !== null}
                  className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50`}>
                  {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Exporter PDF
                </button>
                <button onClick={() => { setVault([]); setInfo("Coffre-fort vidé."); }}
                  className={`${btnCls} border border-red-200 text-red-600 hover:bg-red-50`}>
                  <Trash2 className="w-4 h-4" /> Tout supprimer
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                <p className="font-semibold">🔒 Export réservé aux membres connectés</p>
                <p className="mt-0.5">Créez un compte gratuit pour exporter vos mots de passe en CSV ou PDF.</p>
              </div>
            )}
          </>)}
        </div>
      )}

      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
      <p className="text-xs text-gray-400">Généré localement avec l'API Web Crypto — jamais transmis sur le réseau.</p>
    </div>
  );
}

/* ============ Formateur JSON ============ */
export function FormateurJSON() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (fn: "format" | "minify") => {
    const res = fn === "format" ? formatJSON(input, indent) : minifyJSON(input);
    if (res.ok) {
      setOutput(res.result);
      setError("");
    } else {
      setOutput("");
      setError(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='{"exemple": [1, 2, 3], "valide": true}'
        aria-label="JSON à formater"
        spellCheck={false}
        className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => run("format")} disabled={!input.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
          Formater
        </button>
        <button onClick={() => run("minify")} disabled={!input.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          Minifier
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
          Indentation
          <select value={indent} onChange={(e) => setIndent(+e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-sm">
            <option value={2}>2 espaces</option>
            <option value={4}>4 espaces</option>
            <option value={8}>Tabulation large</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" aria-live="polite">
          ❌ JSON invalide : {error}
        </p>
      )}
      <ResultBox label={output ? "✅ JSON valide" : "Résultat"}>
        <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all max-h-72 overflow-y-auto font-mono">
          {output || "Le JSON formaté apparaîtra ici…"}
        </pre>
      </ResultBox>
      <div className="flex gap-2">
        <ClearButton onClick={() => { setInput(""); setOutput(""); setError(""); }} />
        <CopyButton text={output} label="Copier le JSON" />
      </div>
    </div>
  );
}

/* ============ Convertisseur de couleurs ============ */
export function ConvertisseurCouleur() {
  const [hex, setHex] = useState("#2563eb");
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
  const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : null;

  const rows = rgb && hsl && cmyk
    ? [
        { label: "HEX", value: hex.toLowerCase() },
        { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
        { label: "CMJN", value: `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%` },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Sélecteur visuel</span>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#2563eb"}
            onChange={(e) => setHex(e.target.value)}
            aria-label="Sélecteur de couleur"
            className="block mt-1 w-24 h-24 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white"
          />
        </label>
        <label className="block flex-1">
          <span className="text-sm font-medium text-gray-700">Code HEX</span>
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value)}
            placeholder="#2563eb"
            aria-label="Code hexadécimal"
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!rgb && <p className="text-xs text-red-500 mt-1">Format invalide — utilisez #RGB ou #RRGGBB</p>}
        </label>
        <div
          className="w-24 h-24 rounded-xl border border-gray-200 shrink-0 mt-6"
          style={{ backgroundColor: rgb ? hex : "#fff" }}
          aria-label="Aperçu de la couleur"
        />
      </div>
      <div aria-live="polite" className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-500 w-12">{r.label}</span>
            <code className="text-sm text-gray-800 flex-1">{r.value}</code>
            <CopyButton text={r.value} label="Copier" />
          </div>
        ))}
      </div>
    </div>
  );
}
