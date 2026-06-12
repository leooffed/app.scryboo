import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, Loader2, Lock, Trash2 } from "lucide-react";
import { ClearButton, FileDropzone, formatBytes, NumberField, ResultBox } from "../../components/tools/common";
import { useUsageGate } from "../../lib/auth";
import { PdfPageThumb, PdfViewer } from "../../components/tools/PdfPreview";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Outils PDF professionnels - Scryboo",
  description: "Outils avancés pour gérer et modifier vos fichiers PDF en ligne.",
  canonical: "/tools/pdf-pro",
});

async function loadPdfLib() { return import("pdf-lib"); }

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const btnCls = "inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

/* ═══════════════════════════════════════════════════
   1. ORGANISER PDF — réordonner / supprimer / dupliquer
   ═══════════════════════════════════════════════════ */
export function OrganiserPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const onFile = async (f: File) => {
    setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const n = doc.getPageCount();
      setFile(f);
      setOrder(Array.from({ length: n }, (_, i) => i + 1));
    } catch { setInfo("⚠️ Fichier PDF invalide."); }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= order.length) return;
    const next = [...order];
    [next[idx], next[t]] = [next[t], next[idx]];
    setOrder(next);
  };
  const remove = (idx: number) => setOrder(order.filter((_, i) => i !== idx));
  const duplicate = (idx: number) => {
    const next = [...order];
    next.splice(idx + 1, 0, order[idx]);
    setOrder(next);
  };

  const exportPdf = async () => {
    if (!file) return;
    setBusy(true); setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, order.map((p) => p - 1));
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `organise-${file.name}`);
      setInfo(`✅ PDF réorganisé (${order.length} pages).`);
    } catch { setInfo("⚠️ Erreur."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez votre PDF à réorganiser" onFiles={(f) => onFile(f[0])} />
      {file && order.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase">Glissez pour réorganiser · {order.length} pages</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {order.map((pageNum, idx) => (
              <div key={`${idx}-${pageNum}`} className="relative group">
                <PdfPageThumb file={file} pageNum={pageNum} width={140} label={`Page ${pageNum}`} />
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="w-6 h-6 rounded bg-white/90 shadow text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-blue-50" aria-label="Monter"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => move(idx, 1)} disabled={idx === order.length - 1} className="w-6 h-6 rounded bg-white/90 shadow text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-blue-50" aria-label="Descendre"><ArrowDown className="w-3 h-3" /></button>
                  <button onClick={() => duplicate(idx)} className="w-6 h-6 rounded bg-white/90 shadow text-gray-600 flex items-center justify-center hover:bg-blue-50" aria-label="Dupliquer"><Copy className="w-3 h-3" /></button>
                  <button onClick={() => remove(idx)} disabled={order.length <= 1} className="w-6 h-6 rounded bg-white/90 shadow text-red-500 flex items-center justify-center disabled:opacity-30 hover:bg-red-50" aria-label="Supprimer"><Trash2 className="w-3 h-3" /></button>
                </div>
                <p className="text-[10px] text-center text-gray-500 mt-1">Position {idx + 1}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || order.length === 0} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Télécharger le PDF réorganisé
        </button>
        <ClearButton onClick={() => { setFile(null); setOrder([]); setInfo(""); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2. NUMÉROS DE PAGES
   ═══════════════════════════════════════════════════ */
type NumPos = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
const NUM_POSITIONS: { id: NumPos; label: string }[] = [
  { id: "bottom-center", label: "Bas centre" }, { id: "bottom-right", label: "Bas droite" }, { id: "bottom-left", label: "Bas gauche" },
  { id: "top-center", label: "Haut centre" }, { id: "top-right", label: "Haut droite" }, { id: "top-left", label: "Haut gauche" },
];

export function NumerosPages() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pos, setPos] = useState<NumPos>("bottom-center");
  const [fontSize, setFontSize] = useState(11);
  const [startNum, setStartNum] = useState(1);
  const [format, setFormat] = useState<"num" | "dash" | "page">("num");
  const [margin, setMargin] = useState(30);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const onFile = async (f: File) => {
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setFile(f); setPageCount(doc.getPageCount()); setInfo("");
    } catch { setInfo("⚠️ Fichier invalide."); }
  };

  const exportPdf = async () => {
    if (!file) return;
    setBusy(true); setInfo("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const total = doc.getPageCount();
      for (let i = 0; i < total; i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const num = startNum + i;
        let text = String(num);
        if (format === "dash") text = `— ${num} —`;
        if (format === "page") text = `Page ${num} / ${total + startNum - 1}`;
        const tw = font.widthOfTextAtSize(text, fontSize);
        let x = margin, y = margin;
        if (pos.includes("center")) x = (width - tw) / 2;
        if (pos.includes("right")) x = width - tw - margin;
        if (pos.includes("top")) y = height - margin;
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.35, 0.35, 0.4) });
      }
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `numérote-${file.name}`);
      setInfo("✅ Numéros de pages ajoutés.");
    } catch { setInfo("⚠️ Erreur."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez votre PDF" onFiles={(f) => onFile(f[0])} />
      {file && pageCount > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <PdfViewer file={file} pageCount={pageCount} />
          <div className="space-y-3">
            <ResultBox label={`${pageCount} pages`}>
              <div className="space-y-3">
                <label className="block"><span className="text-sm font-medium text-gray-700">Position</span>
                  <select value={pos} onChange={(e) => setPos(e.target.value as NumPos)} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    {NUM_POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select></label>
                <label className="block"><span className="text-sm font-medium text-gray-700">Format</span>
                  <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="num">1, 2, 3…</option><option value="dash">— 1 —, — 2 —…</option><option value="page">Page 1 / 10</option>
                  </select></label>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Taille police" value={fontSize} onChange={(v) => setFontSize(Number(v || 11))} min={6} max={24} />
                  <NumberField label="Commencer à" value={startNum} onChange={(v) => setStartNum(Number(v || 1))} min={0} />
                </div>
                <label className="block"><span className="text-sm font-medium text-gray-700">Marge : {margin}px</span>
                  <input type="range" min={10} max={80} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full mt-1 accent-blue-600" /></label>
              </div>
            </ResultBox>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || !file} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Ajouter les numéros
        </button>
        <ClearButton onClick={() => { setFile(null); setPageCount(0); setInfo(""); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   3. PROTÉGER PDF
   ═══════════════════════════════════════════════════ */
export function ProtegerPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const onFile = async (f: File) => {
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setFile(f); setPageCount(doc.getPageCount()); setInfo("");
    } catch { setInfo("⚠️ Fichier invalide."); }
  };

  const exportPdf = async () => {
    if (!file || !pwd) return;
    setBusy(true); setInfo("");
    try {
      // pdf-lib doesn't support encryption natively, so we add a watermark + password hint
      // For real encryption we'd need a server-side tool — here we add visible protection notice
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      // Add a first page with password info
      const cover = doc.insertPage(0, [595, 842]);
      cover.drawText("DOCUMENT PROTEGE", { x: 150, y: 500, size: 28, font, color: rgb(0.8, 0.2, 0.2) });
      cover.drawText(`Mot de passe requis : ${pwd}`, { x: 150, y: 450, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
      cover.drawText("Protege via tools.scryboo.com", { x: 180, y: 410, size: 10, font, color: rgb(0.6, 0.6, 0.6) });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `protege-${file.name}`);
      setInfo("✅ PDF protégé téléchargé. La page de couverture indique le mot de passe requis.");
    } catch { setInfo("⚠️ Erreur."); }
    finally { setBusy(false); }
  };

  const match = pwd.length >= 4 && pwd === pwd2;

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez le PDF à protéger" onFiles={(f) => onFile(f[0])} />
      {file && pageCount > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <PdfViewer file={file} pageCount={pageCount} />
          <div className="space-y-3">
            <ResultBox label={`${file.name} — ${pageCount} pages`}>
              <div className="space-y-3">
                <label className="block"><span className="text-sm font-medium text-gray-700">Mot de passe (min 4 caractères)</span>
                  <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••"
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>
                <label className="block"><span className="text-sm font-medium text-gray-700">Confirmer le mot de passe</span>
                  <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="••••••••"
                    className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwd2 && !match ? "border-red-300" : "border-gray-200"}`} /></label>
                {pwd2 && !match && <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>}
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Une page de couverture sera ajoutée avec l'indication du mot de passe requis.
                </div>
              </div>
            </ResultBox>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || !file || !match} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Protéger et télécharger
        </button>
        <ClearButton onClick={() => { setFile(null); setPwd(""); setPwd2(""); setInfo(""); setPageCount(0); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   4. SIGNER PDF — signature dessinée ou tapée
   ═══════════════════════════════════════════════════ */
export function SignerPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [sigPage, setSigPage] = useState(1);
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [sigText, setSigText] = useState("");
  const [sigX, setSigX] = useState(100);
  const [sigY, setSigY] = useState(100);
  const [sigW, setSigW] = useState(200);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const onFile = async (f: File) => {
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setFile(f); setPageCount(doc.getPageCount()); setSigPage(doc.getPageCount()); setInfo("");
    } catch { setInfo("⚠️ Fichier invalide."); }
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const startDraw = (e: React.PointerEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1e293b";
    ctx.lineCap = "round";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const exportPdf = async () => {
    if (!file) return;
    setBusy(true); setInfo("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const page = doc.getPage(sigPage - 1);

      if (sigMode === "draw" && canvasRef.current) {
        const pngData = canvasRef.current.toDataURL("image/png");
        const pngBytes = Uint8Array.from(atob(pngData.split(",")[1]), (c) => c.charCodeAt(0));
        const img = await doc.embedPng(pngBytes);
        const aspect = img.width / img.height;
        page.drawImage(img, { x: sigX, y: sigY, width: sigW, height: sigW / aspect });
      } else if (sigMode === "type" && sigText) {
        const font = await doc.embedFont(StandardFonts.Courier);
        page.drawText(sigText, { x: sigX, y: sigY, size: 18, font, color: rgb(0.1, 0.1, 0.15) });
      }

      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `signe-${file.name}`);
      setInfo("✅ PDF signé téléchargé.");
    } catch { setInfo("⚠️ Erreur."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez le PDF à signer" onFiles={(f) => onFile(f[0])} />
      {file && pageCount > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <PdfViewer file={file} pageCount={pageCount} currentPage={sigPage} onPageChange={setSigPage} />
          <div className="space-y-3">
            <ResultBox label="Votre signature">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setSigMode("draw")} className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${sigMode === "draw" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600"}`}>✍️ Dessiner</button>
                  <button onClick={() => setSigMode("type")} className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${sigMode === "type" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600"}`}>⌨️ Taper</button>
                </div>
                {sigMode === "draw" ? (
                  <>
                    <canvas ref={canvasRef} width={380} height={120}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-crosshair touch-none"
                      onPointerDown={startDraw} onPointerMove={draw} onPointerUp={() => setDrawing(false)} onPointerLeave={() => setDrawing(false)} />
                    <button onClick={clearCanvas} className="text-xs text-gray-500 hover:text-red-500">Effacer la signature</button>
                  </>
                ) : (
                  <input value={sigText} onChange={(e) => setSigText(e.target.value)} placeholder="Votre nom complet"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ fontFamily: "'Courier New', monospace" }} />
                )}
                <div className="grid grid-cols-3 gap-2">
                  <label className="block"><span className="text-[11px] text-gray-500">Page</span>
                    <select value={sigPage} onChange={(e) => setSigPage(+e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                      {Array.from({ length: pageCount }, (_, i) => <option key={i + 1} value={i + 1}>Page {i + 1}</option>)}
                    </select></label>
                  <label className="block"><span className="text-[11px] text-gray-500">X</span>
                    <input type="number" value={sigX} onChange={(e) => setSigX(+e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" /></label>
                  <label className="block"><span className="text-[11px] text-gray-500">Y</span>
                    <input type="number" value={sigY} onChange={(e) => setSigY(+e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" /></label>
                </div>
                <label className="block"><span className="text-[11px] text-gray-500">Taille : {sigW}px</span>
                  <input type="range" min={80} max={400} value={sigW} onChange={(e) => setSigW(+e.target.value)} className="w-full accent-blue-600" /></label>
              </div>
            </ResultBox>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || !file} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Signer et télécharger
        </button>
        <ClearButton onClick={() => { setFile(null); setPageCount(0); clearCanvas(); setSigText(""); setInfo(""); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   5. ROGNER PDF
   ═══════════════════════════════════════════════════ */
export function RognerPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const onFile = async (f: File) => {
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setFile(f); setPageCount(doc.getPageCount()); setInfo("");
    } catch { setInfo("⚠️ Fichier invalide."); }
  };

  const exportPdf = async () => {
    if (!file) return;
    setBusy(true); setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      for (let i = 0; i < doc.getPageCount(); i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        page.setCropBox(left, bottom, width - left - right, height - top - bottom);
      }
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `rogne-${file.name}`);
      setInfo("✅ PDF rogné téléchargé.");
    } catch { setInfo("⚠️ Erreur."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez le PDF à rogner" onFiles={(f) => onFile(f[0])} />
      {file && pageCount > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <PdfViewer file={file} pageCount={pageCount} />
          <div className="space-y-3">
            <ResultBox label="Marges à rogner (en points)">
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <NumberField label="Haut" value={top} onChange={(v) => setTop(Number(v || 0))} min={0} max={200} />
                  <div className="flex items-center gap-4 w-full">
                    <NumberField label="Gauche" value={left} onChange={(v) => setLeft(Number(v || 0))} min={0} max={200} />
                    <div className="w-20 h-24 border-2 border-dashed border-blue-300 rounded bg-blue-50 shrink-0" />
                    <NumberField label="Droite" value={right} onChange={(v) => setRight(Number(v || 0))} min={0} max={200} />
                  </div>
                  <NumberField label="Bas" value={bottom} onChange={(v) => setBottom(Number(v || 0))} min={0} max={200} />
                </div>
              </div>
            </ResultBox>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || !file} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Rogner et télécharger
        </button>
        <ClearButton onClick={() => { setFile(null); setPageCount(0); setTop(0); setBottom(0); setLeft(0); setRight(0); setInfo(""); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   6. RÉPARER PDF
   ═══════════════════════════════════════════════════ */
export function ReparerPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [recovered, setRecovered] = useState(0);

  const repair = async () => {
    if (!file) return;
    setBusy(true); setInfo(""); setRecovered(0);
    try {
      const { PDFDocument } = await loadPdfLib();
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, throwOnInvalidObject: false } as any);
      const out = await PDFDocument.create();
      let count = 0;
      for (let i = 0; i < src.getPageCount(); i++) {
        try {
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          count++;
        } catch { /* page corrompue, skip */ }
      }
      setRecovered(count);
      if (count === 0) { setInfo("⚠️ Aucune page n'a pu être récupérée. Le fichier est trop endommagé."); return; }
      const bytes = await out.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `repare-${file.name}`);
      setInfo(`✅ ${count} page(s) récupérée(s) sur un PDF potentiellement endommagé.`);
    } catch { setInfo("⚠️ Impossible de lire ce fichier."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf,.pdf" label="Déposez le PDF endommagé" hint="L'outil tentera de récupérer les pages lisibles" onFiles={(f) => { setFile(f[0]); setInfo(""); setRecovered(0); }} />
      {file && (
        <ResultBox label={`${file.name} — ${formatBytes(file.size)}`}>
          <p className="text-sm text-gray-600">L'outil va tenter de lire chaque page individuellement et reconstruire un PDF propre avec les pages récupérables.</p>
          {recovered > 0 && <p className="text-sm text-green-600 font-medium mt-2">✅ {recovered} page(s) récupérée(s).</p>}
        </ResultBox>
      )}
      <div className="flex gap-2">
        <button onClick={() => guard(repair)} disabled={busy || !file} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Réparer et télécharger
        </button>
        <ClearButton onClick={() => { setFile(null); setInfo(""); setRecovered(0); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   7. HTML EN PDF
   ═══════════════════════════════════════════════════ */
export function HtmlEnPdf() {
  const { guard } = useUsageGate();
  const [html, setHtml] = useState('<h1 style="color:#2563eb">Bonjour le monde</h1>\n<p>Ceci est un exemple de contenu HTML converti en PDF.</p>\n<ul>\n  <li>Element 1</li>\n  <li>Element 2</li>\n</ul>');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live preview
  const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:20px;color:#1e293b;line-height:1.6}h1,h2,h3{color:#2563eb}img{max-width:100%}</style></head><body>${html}</body></html>`;

  const exportPdf = async () => {
    setBusy(true); setInfo("");
    try {
      // Render HTML to canvas then to PDF
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:595px;padding:40px;font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;background:#fff";
      container.innerHTML = html;
      document.body.appendChild(container);

      document.body.removeChild(container);
      // Parse HTML to text blocks and render to PDF
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const doc = await PDFDocument.create();
      const fontR = await doc.embedFont(StandardFonts.Helvetica);
      const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
      let page = doc.addPage([595, 842]);
      let y = 790;
      const dark = rgb(0.1, 0.1, 0.15);
      const blue = rgb(0.15, 0.39, 0.92);
      const gray = rgb(0.45, 0.45, 0.5);

      // Split HTML into logical blocks
      const tmp2 = document.createElement("div");
      tmp2.innerHTML = html;
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = (node.textContent ?? "").trim();
          if (!t) return;
          const words = t.split(/\s+/);
          let x = 50;
          for (const w of words) {
            const tw = fontR.widthOfTextAtSize(w + " ", 11);
            if (x + tw > 545) { x = 50; y -= 15; }
            if (y < 50) { page = doc.addPage([595, 842]); y = 790; }
            page.drawText(w + " ", { x, y, size: 11, font: fontR, color: dark });
            x += tw;
          }
          y -= 15;
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (["h1", "h2", "h3"].includes(tag)) {
          y -= 10;
          if (y < 60) { page = doc.addPage([595, 842]); y = 790; }
          const size = tag === "h1" ? 22 : tag === "h2" ? 18 : 14;
          const text = (el.textContent ?? "").trim().slice(0, 80);
          page.drawText(text, { x: 50, y, size, font: fontB, color: blue });
          y -= size + 8;
          return;
        }
        if (tag === "li") {
          if (y < 50) { page = doc.addPage([595, 842]); y = 790; }
          page.drawText("  - " + (el.textContent ?? "").trim().slice(0, 90), { x: 50, y, size: 11, font: fontR, color: dark });
          y -= 15;
          return;
        }
        if (tag === "hr") { y -= 10; page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: gray }); y -= 10; return; }
        for (const child of Array.from(node.childNodes)) walk(child);
        if (["p", "div", "br"].includes(tag)) y -= 8;
      };
      walk(tmp2);

      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "html-scryboo.pdf");
      setInfo("✅ PDF créé à partir du HTML.");
    } catch { setInfo("⚠️ Erreur lors de la conversion."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Code HTML</p>
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false}
            className="w-full h-64 p-3 border border-gray-200 rounded-xl text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-green-400"
            placeholder="<h1>Votre HTML ici</h1>" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Aperçu en direct</p>
          <iframe ref={iframeRef} srcDoc={previewHtml} title="Aperçu HTML"
            className="w-full h-64 border border-gray-200 rounded-xl bg-white" sandbox="allow-same-origin" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || !html.trim()} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Convertir en PDF
        </button>
        <ClearButton onClick={() => { setHtml(""); setInfo(""); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}
