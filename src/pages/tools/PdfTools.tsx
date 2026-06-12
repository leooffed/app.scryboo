import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { ClearButton, DownloadButton, FileDropzone, ResultBox } from "../../components/tools/common";
import { PdfPageThumb, PdfViewer } from "../../components/tools/PdfPreview";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Outils PDF - Scryboo",
  description: "Fusionnez, divisez et éditez vos fichiers PDF en ligne.",
  canonical: "/tools/pdf",
});

/* ---------- Helpers ---------- */
async function mergePdfs(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const out = await merged.save();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}

function parseRanges(input: string, max: number): number[] {
  const pages = new Set<number>();
  for (const part of input.split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = parseInt(m[1]);
    const b = m[2] ? parseInt(m[2]) : a;
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
      if (i >= 1 && i <= max) pages.add(i);
    }
  }
  return [...pages].sort((x, y) => x - y);
}

/* ============ Fusionner PDF ============ */
export function FusionnerPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="application/pdf"
        multiple
        label="Déposez vos fichiers PDF (2 minimum)"
        hint="L'ordre d'ajout = ordre de fusion"
        onFiles={(f) => setFiles((prev) => [...prev, ...f.filter((x) => x.type === "application/pdf")])}
      />
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">{files.length} fichier{files.length > 1 ? "s" : ""} — cliquez pour prévisualiser</p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {files.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <PdfPageThumb
                  file={f}
                  pageNum={1}
                  width={100}
                  selected={previewFile === f}
                  onClick={() => setPreviewFile(previewFile === f ? null : f)}
                  label={`${i + 1}. ${f.name.slice(0, 12)}`}
                />
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Retirer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {previewFile && (
        <PdfViewer file={previewFile} pageCount={99} currentPage={1} className="mt-2" />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {busy && <p className="text-sm text-blue-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Fusion en cours…</p>}
      <div className="flex gap-2">
        <ClearButton onClick={() => { setFiles([]); setPreviewFile(null); }} label="Tout retirer" />
        <DownloadButton
          disabled={files.length < 2}
          filename="fusion-scryboo.pdf"
          label={`Fusionner ${files.length || ""} PDF`}
          getBlob={async () => {
            setBusy(true); setError("");
            try { return await mergePdfs(files); }
            catch { setError("Un des fichiers PDF est invalide ou protégé."); return null; }
            finally { setBusy(false); }
          }}
        />
      </div>
    </div>
  );
}

/* ============ Diviser un PDF ============ */
export function SplitterPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState("");
  const [error, setError] = useState("");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const onFile = async (f: File) => {
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const count = doc.getPageCount();
      setFile(f);
      setPageCount(count);
      const all = Array.from({ length: count }, (_, i) => i + 1);
      setSelectedPages(all);
      setRanges(`1-${count}`);
    } catch {
      setError("Fichier PDF invalide ou protégé.");
    }
  };

  const selected = file ? parseRanges(ranges, pageCount) : [];

  const togglePage = (p: number) => {
    const next = selectedPages.includes(p) ? selectedPages.filter((x) => x !== p) : [...selectedPages, p].sort((a, b) => a - b);
    setSelectedPages(next);
    // Rebuild ranges string from selected pages
    if (next.length === 0) { setRanges(""); return; }
    const parts: string[] = [];
    let start = next[0], end = next[0];
    for (let i = 1; i < next.length; i++) {
      if (next[i] === end + 1) { end = next[i]; }
      else { parts.push(start === end ? `${start}` : `${start}-${end}`); start = end = next[i]; }
    }
    parts.push(start === end ? `${start}` : `${start}-${end}`);
    setRanges(parts.join(", "));
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez le PDF à diviser" onFiles={(f) => onFile(f[0])} />
      {file && pageCount > 0 && (
        <>
          <ResultBox label={`${file.name} — ${pageCount} pages · Cliquez les pages à extraire`}>
            <label className="block mb-3">
              <span className="text-sm font-medium text-gray-700">Plages de pages (ex : 1-3, 5, 8-10)</span>
              <input
                value={ranges}
                onChange={(e) => {
                  setRanges(e.target.value);
                  setSelectedPages(parseRanges(e.target.value, pageCount));
                }}
                aria-label="Pages à extraire"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <p className="text-xs text-gray-500 mb-2" aria-live="polite">
              <strong className="text-blue-600">{selected.length}</strong> page{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}
            </p>
          </ResultBox>

          {/* Visual page selector */}
          <PdfViewer
            file={file}
            pageCount={pageCount}
            selectedPages={selectedPages}
            onTogglePage={togglePage}
          />
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <ClearButton onClick={() => { setFile(null); setPageCount(0); setRanges(""); setSelectedPages([]); }} />
        <DownloadButton
          disabled={!file || selected.length === 0}
          filename="extrait-scryboo.pdf"
          label={`Extraire ${selected.length} page${selected.length > 1 ? "s" : ""}`}
          getBlob={async () => {
            if (!file) return null;
            const { PDFDocument } = await import("pdf-lib");
            const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
            const out = await PDFDocument.create();
            const pages = await out.copyPages(src, selected.map((p) => p - 1));
            pages.forEach((p) => out.addPage(p));
            const bytes = await out.save();
            return new Blob([bytes as BlobPart], { type: "application/pdf" });
          }}
        />
      </div>
    </div>
  );
}

/* ============ PDF vers Word ============ */
export function PdfVersWord() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const extract = async (f: File): Promise<string[]> => {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerRaw = (await import("pdfjs-dist/build/pdf.worker.min.mjs?raw")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([workerRaw], { type: "text/javascript" }));
    }
    const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it) => ("str" in it ? (it as { str: string }).str : "")).join(" ").replace(/\s{2,}/g, " ");
      pages.push(text.trim());
    }
    return pages;
  };

  const onFile = async (f: File) => {
    setFile(f); setBusy(true); setError(""); setPreview("");
    try {
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        const workerRaw = (await import("pdfjs-dist/build/pdf.worker.min.mjs?raw")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([workerRaw], { type: "text/javascript" }));
      }
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      setPageCount(doc.numPages);
      const pages = await extract(f);
      setPreview(pages.join("\n\n").slice(0, 800));
    } catch {
      setError("Impossible de lire ce PDF (scanné ou protégé ?). Les PDF images nécessitent un OCR.");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" label="Déposez votre PDF à convertir en Word" onFiles={(f) => onFile(f[0])} />
      {busy && <p className="text-sm text-blue-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Extraction du texte…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {file && pageCount > 0 && !busy && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* PDF preview */}
          <PdfViewer file={file} pageCount={pageCount} />
          {/* Text preview */}
          <ResultBox label={`Texte extrait — ${pageCount} page${pageCount > 1 ? "s" : ""}`}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {preview || "(Aucun texte détecté — le PDF est peut-être un scan)"}
            </p>
          </ResultBox>
        </div>
      )}

      <div className="flex gap-2">
        <ClearButton onClick={() => { setFile(null); setPreview(""); setPageCount(0); }} />
        <DownloadButton
          disabled={!file || !preview}
          filename={file ? file.name.replace(/\.pdf$/i, "") + ".doc" : "document.doc"}
          label="Télécharger le document Word"
          getBlob={async () => {
            if (!file) return null;
            const pages = await extract(file);
            const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${file.name}</title></head><body>${pages
              .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`)
              .join("<br clear='all' style='page-break-before:always'>")}</body></html>`;
            return new Blob([html], { type: "application/msword" });
          }}
        />
      </div>
    </div>
  );
}
