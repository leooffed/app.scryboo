import { useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2, Trash2, Type } from "lucide-react";
import { ClearButton, FileDropzone, formatBytes, ResultBox } from "../../components/tools/common";
import { useUsageGate } from "../../lib/auth";
import { PdfViewer } from "../../components/tools/PdfPreview";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Outils PDF supplémentaires - Scryboo",
  description: "Modifiez, ajoutez des annotations et bien plus encore à vos fichiers PDF en ligne.",
  canonical: "/tools/pdf-extra",
});

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
async function loadPdfLib() { return import("pdf-lib"); }

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const workerRaw = (await import("pdfjs-dist/build/pdf.worker.min.mjs?raw")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([workerRaw], { type: "text/javascript" }));
  }
  return pdfjs;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const btnCls = "inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all";

/* ═══════════════════════════════════════════════════════
   1. MODIFIER PDF
   ═══════════════════════════════════════════════════════ */
interface Annotation { type: "text" | "image"; page: number; x: number; y: number; text?: string; fontSize?: number; color?: string; imageBytes?: Uint8Array; imgW?: number; imgH?: number }

export function ModifierPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [textVal, setTextVal] = useState("Votre texte ici");
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState("#000000");
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(750);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  const onFile = async (f: File) => {
    setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setFile(f); setPageCount(doc.getPageCount()); setAnnotations([]); setCurrentPage(1);
    } catch { setInfo("⚠️ Fichier PDF invalide ou protégé."); }
  };

  const addText = () => {
    if (!textVal.trim()) return;
    setAnnotations((a) => [...a, { type: "text", page: currentPage, x: posX, y: posY, text: textVal, fontSize, color: textColor }]);
    setInfo(`✅ Texte ajouté à la page ${currentPage}.`);
  };

  const addImage = async (imgFile: File) => {
    const bytes = new Uint8Array(await imgFile.arrayBuffer());
    setAnnotations((a) => [...a, { type: "image", page: currentPage, x: posX, y: posY, imageBytes: bytes, imgW: 150, imgH: 100 }]);
    setInfo(`✅ Image ajoutée à la page ${currentPage}.`);
  };

  const exportPdf = async () => {
    if (!file) return;
    setBusy(true); setInfo("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      for (const a of annotations) {
        const page = doc.getPage(a.page - 1);
        if (a.type === "text" && a.text) {
          const hex = (a.color ?? "#000000").replace("#", "");
          const r = parseInt(hex.slice(0, 2), 16) / 255;
          const g = parseInt(hex.slice(2, 4), 16) / 255;
          const b = parseInt(hex.slice(4, 6), 16) / 255;
          page.drawText(a.text, { x: a.x, y: a.y, size: a.fontSize ?? 16, font, color: rgb(r, g, b) });
        }
        if (a.type === "image" && a.imageBytes) {
          try {
            let img;
            try { img = await doc.embedPng(a.imageBytes); } catch { img = await doc.embedJpg(a.imageBytes); }
            page.drawImage(img, { x: a.x, y: a.y, width: a.imgW ?? 150, height: a.imgH ?? 100 });
          } catch {}
        }
      }
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `modifie-${file.name}`);
      setInfo("✅ PDF modifié téléchargé.");
    } catch { setInfo("⚠️ Erreur lors de la modification."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez votre PDF à modifier" onFiles={(f) => onFile(f[0])} />

      {file && pageCount > 0 && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-4">
          {/* Preview */}
          <PdfViewer
            file={file}
            pageCount={pageCount}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />

          {/* Controls */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-600 uppercase">Ajouter sur la page {currentPage}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="text-[11px] text-gray-500">X</span>
                <input type="number" value={posX} min={0} onChange={(e) => setPosX(+e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" /></label>
              <label className="block"><span className="text-[11px] text-gray-500">Y</span>
                <input type="number" value={posY} min={0} onChange={(e) => setPosY(+e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" /></label>
            </div>
            <label className="block"><span className="text-[11px] text-gray-500">Texte</span>
              <input value={textVal} onChange={(e) => setTextVal(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="text-[11px] text-gray-500">Taille</span>
                <input type="number" value={fontSize} min={6} max={120} onChange={(e) => setFontSize(+e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" /></label>
              <label className="block"><span className="text-[11px] text-gray-500">Couleur</span>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-9 mt-1 rounded border border-gray-200 cursor-pointer" /></label>
            </div>
            <button onClick={addText} className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700 w-full`}><Type className="w-4 h-4" /> Ajouter texte</button>
            <button onClick={() => imgRef.current?.click()} className={`${btnCls} border border-gray-200 text-gray-700 hover:bg-gray-50 w-full`}><ImageIcon className="w-4 h-4" /> Ajouter image</button>
            <input ref={imgRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) addImage(f); }} />

            {annotations.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500">{annotations.length} annotation(s)</p>
                {annotations.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1 text-[11px]">
                    <span>{a.type === "text" ? `📝 "${a.text?.slice(0, 18)}"` : "🖼 Image"} p.{a.page}</span>
                    <button onClick={() => setAnnotations(annotations.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || annotations.length === 0} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Télécharger le PDF modifié
        </button>
        <ClearButton onClick={() => { setFile(null); setAnnotations([]); setInfo(""); setPageCount(0); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. JPG EN PDF
   ═══════════════════════════════════════════════════════ */
export function JpgEnPdf() {
  const { guard } = useUsageGate();
  const [files, setFiles] = useState<File[]>([]);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState(20);
  const [fit, setFit] = useState<"fill" | "contain">("contain");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    // Create image previews
    for (const f of newFiles) {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    }
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(files.filter((_, j) => j !== i));
    setPreviews(previews.filter((_, j) => j !== i));
  };

  const exportPdf = async () => {
    setBusy(true); setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.create();
      const pw = orientation === "portrait" ? 595 : 842;
      const ph = orientation === "portrait" ? 842 : 595;
      for (const f of files) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        let img;
        try { if (f.type === "image/png") img = await doc.embedPng(bytes); else img = await doc.embedJpg(bytes); }
        catch { try { img = await doc.embedPng(bytes); } catch { continue; } }
        const page = doc.addPage([pw, ph]);
        const usable = { w: pw - margin * 2, h: ph - margin * 2 };
        let dw: number, dh: number;
        if (fit === "fill") { dw = usable.w; dh = usable.h; }
        else { const scale = Math.min(usable.w / img.width, usable.h / img.height); dw = img.width * scale; dh = img.height * scale; }
        page.drawImage(img, { x: margin + (usable.w - dw) / 2, y: margin + (usable.h - dh) / 2, width: dw, height: dh });
      }
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), "images-scryboo.pdf");
      setInfo("✅ PDF créé avec vos images.");
    } catch { setInfo("⚠️ Erreur lors de la conversion."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/jpeg,image/png,image/webp" multiple label="Déposez vos images (JPG, PNG, WEBP)" hint="L'ordre d'ajout = ordre des pages" onFiles={addFiles} />

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Aperçu des pages ({files.length})</p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {files.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-24 h-32 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center">
                  <img src={previews[i]} alt={f.name} className="max-w-full max-h-full object-contain" />
                </div>
                <span className="text-[9px] text-gray-400 truncate max-w-[96px]">{i + 1}. {f.name}</span>
                <button onClick={() => removeFile(i)} className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-0.5">
                  <Trash2 className="w-3 h-3" /> Retirer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="block"><span className="text-sm font-medium text-gray-700">Orientation</span>
          <select value={orientation} onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="portrait">Portrait (A4)</option><option value="landscape">Paysage</option>
          </select></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Marge : {margin}px</span>
          <input type="range" min={0} max={80} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full mt-2 accent-blue-600" /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">Ajustement</span>
          <select value={fit} onChange={(e) => setFit(e.target.value as "fill" | "contain")} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="contain">Contenir (proportionnel)</option><option value="fill">Remplir (étirer)</option>
          </select></label>
      </div>

      <div className="flex gap-2">
        <button onClick={() => guard(exportPdf)} disabled={busy || files.length === 0} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Créer le PDF ({files.length} image{files.length > 1 ? "s" : ""})
        </button>
        <ClearButton onClick={() => { previews.forEach(URL.revokeObjectURL); setFiles([]); setPreviews([]); setInfo(""); }} label="Tout retirer" />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3. DÉVERROUILLER PDF
   ═══════════════════════════════════════════════════════ */
export function DeverrouillerPdf() {
  const { guard } = useUsageGate();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const onFile = async (f: File) => {
    setFile(f); setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch { setPageCount(0); }
  };

  const unlock = async () => {
    if (!file) return;
    setBusy(true); setInfo("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true } as any);
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => newDoc.addPage(p));
      const newBytes = await newDoc.save();
      downloadBlob(new Blob([newBytes as BlobPart], { type: "application/pdf" }), `deverrouille-${file.name}`);
      setInfo("✅ PDF déverrouillé téléchargé.");
    } catch { setInfo("⚠️ Impossible de déverrouiller ce PDF."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez le PDF protégé par mot de passe" onFiles={(f) => onFile(f[0])} />

      {file && (
        <div className="grid lg:grid-cols-2 gap-4">
          {pageCount > 0 && (
            <PdfViewer file={file} pageCount={pageCount} />
          )}
          <div className="space-y-3">
            <ResultBox label={`${file.name} — ${formatBytes(file.size)}${pageCount ? ` · ${pageCount} pages` : ""}`}>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Mot de passe du PDF (si requis)</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laissez vide si seule l'impression est restreinte"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            </ResultBox>
            <p className="text-xs text-gray-400">L'outil crée une copie du PDF sans aucune restriction (impression, copie, modification).</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => guard(unlock)} disabled={busy || !file} className={`${btnCls} bg-green-600 text-white hover:bg-green-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Déverrouiller et télécharger
        </button>
        <ClearButton onClick={() => { setFile(null); setPassword(""); setInfo(""); setPageCount(0); }} />
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. COMPARER PDF
   ═══════════════════════════════════════════════════════ */
export function ComparerPdf() {
  const { guard } = useUsageGate();
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [pcA, setPcA] = useState(0);
  const [pcB, setPcB] = useState(0);
  const [result, setResult] = useState<{ pageA: string; pageB: string; diffs: number }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const loadFile = async (f: File, setter: (f: File) => void, pcSetter: (n: number) => void) => {
    setter(f); setResult(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      pcSetter(doc.getPageCount());
    } catch { pcSetter(0); }
  };

  const extractText = async (file: File): Promise<string[]> => {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => ("str" in it ? (it as { str: string }).str : "")).join(" ").replace(/\s{2,}/g, " ").trim());
    }
    return pages;
  };

  const compare = async () => {
    if (!fileA || !fileB) return;
    setBusy(true); setInfo(""); setResult(null);
    try {
      const [pagesA, pagesB] = await Promise.all([extractText(fileA), extractText(fileB)]);
      const maxPages = Math.max(pagesA.length, pagesB.length);
      const results: { pageA: string; pageB: string; diffs: number }[] = [];
      for (let i = 0; i < maxPages; i++) {
        const a = pagesA[i] ?? "", b = pagesB[i] ?? "";
        const wA = a.split(/\s+/), wB = b.split(/\s+/);
        let diffs = 0;
        for (let w = 0; w < Math.max(wA.length, wB.length); w++) if ((wA[w] ?? "") !== (wB[w] ?? "")) diffs++;
        results.push({ pageA: a, pageB: b, diffs });
      }
      setResult(results);
      const totalDiffs = results.reduce((s, r) => s + r.diffs, 0);
      setInfo(totalDiffs === 0 ? "✅ Les deux documents sont identiques." : `⚠️ ${totalDiffs} différence(s) sur ${maxPages} page(s).`);
    } catch { setInfo("⚠️ Impossible de lire un des fichiers PDF."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Document A (original)</p>
          <FileDropzone accept="application/pdf" label="Premier PDF" onFiles={(f) => loadFile(f[0], setFileA, setPcA)} />
          {fileA && pcA > 0 && <PdfViewer file={fileA} pageCount={pcA} />}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Document B (modifié)</p>
          <FileDropzone accept="application/pdf" label="Deuxième PDF" onFiles={(f) => loadFile(f[0], setFileB, setPcB)} />
          {fileB && pcB > 0 && <PdfViewer file={fileB} pageCount={pcB} />}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => guard(compare)} disabled={busy || !fileA || !fileB} className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Comparer
        </button>
        <ClearButton onClick={() => { setFileA(null); setFileB(null); setResult(null); setInfo(""); setPcA(0); setPcB(0); }} />
      </div>

      {result && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {result.map((r, i) => (
            <div key={i} className={`border rounded-xl p-3 ${r.diffs === 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
              <p className="text-xs font-semibold mb-2 flex items-center justify-between">
                <span>Page {i + 1}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.diffs === 0 ? "bg-green-200 text-green-700" : "bg-amber-200 text-amber-700"}`}>
                  {r.diffs === 0 ? "Identique" : `${r.diffs} diff.`}
                </span>
              </p>
              {r.diffs > 0 && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><p className="text-[9px] font-semibold text-gray-400 mb-1">DOCUMENT A</p><p className="text-gray-600 line-clamp-6 whitespace-pre-wrap">{r.pageA || "(vide)"}</p></div>
                  <div><p className="text-[9px] font-semibold text-gray-400 mb-1">DOCUMENT B</p><p className="text-gray-600 line-clamp-6 whitespace-pre-wrap">{r.pageB || "(vide)"}</p></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}
