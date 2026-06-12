import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";

/* ═══════════════════════════════════════════════════════
   PDF PAGE RENDERER — renders pages to canvas via pdfjs
   ═══════════════════════════════════════════════════════ */

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const workerRaw = (await import("pdfjs-dist/build/pdf.worker.min.mjs?raw")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
      new Blob([workerRaw], { type: "text/javascript" })
    );
  }
  return pdfjs;
}

/* ─── Single page thumbnail ─── */
export function PdfPageThumb({
  file,
  pageNum,
  width = 160,
  selected,
  onClick,
  label,
  overlay,
}: {
  file: File;
  pageNum: number;
  width?: number;
  selected?: boolean;
  onClick?: () => void;
  label?: string;
  overlay?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const pdfjs = await getPdfJs();
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        if (cancelled) return;
        const page = await doc.getPage(pageNum);
        const vp = page.getViewport({ scale: 1 });
        const scale = (width * 2) / vp.width; // 2x for retina
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        setDims({ w: viewport.width / 2, h: viewport.height / 2 });
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file, pageNum, width]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg border-2 overflow-hidden bg-white transition-all flex-shrink-0 ${
        selected
          ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
          : onClick
            ? "border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
            : "border-gray-200"
      }`}
      style={{ width, minHeight: width * 1.3 }}
      aria-label={label}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={dims ? { width: dims.w, height: dims.h } : { width, height: width * 1.4 }}
      />
      {overlay && <div className="absolute inset-0">{overlay}</div>}
      {label && (
        <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-[9px] text-white font-medium text-center py-1 px-1">
          {label}
        </span>
      )}
    </button>
  );
}

/* ─── Full page viewer with navigation ─── */
export function PdfViewer({
  file,
  pageCount,
  currentPage,
  onPageChange,
  selectedPages,
  onTogglePage,
  className,
}: {
  file: File;
  pageCount: number;
  currentPage?: number;
  onPageChange?: (p: number) => void;
  selectedPages?: number[];
  onTogglePage?: (p: number) => void;
  className?: string;
}) {
  const [page, setPage] = useState(currentPage ?? 1);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  const activePage = currentPage ?? page;
  const setActivePage = (p: number) => {
    setPage(p);
    onPageChange?.(p);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const pdfjs = await getPdfJs();
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        if (cancelled) return;
        const pg = await doc.getPage(activePage);
        const baseScale = 400 / pg.getViewport({ scale: 1 }).width;
        const viewport = pg.getViewport({ scale: baseScale * zoom * 2 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await pg.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file, activePage, zoom]);

  return (
    <div className={`bg-gray-100 border border-gray-200 rounded-xl overflow-hidden ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1">
          <button onClick={() => setActivePage(Math.max(1, activePage - 1))} disabled={activePage <= 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Page précédente">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 tabular-nums min-w-[60px] text-center">
            {activePage} / {pageCount}
          </span>
          <button onClick={() => setActivePage(Math.min(pageCount, activePage + 1))} disabled={activePage >= pageCount}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Page suivante">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} disabled={zoom <= 0.5}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Zoom arrière">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-gray-400 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} disabled={zoom >= 3}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Zoom avant">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="overflow-auto p-3 flex justify-center" style={{ maxHeight: 420 }}>
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}
          <canvas ref={canvasRef} className="shadow-lg rounded" style={{ width: 400 * zoom, height: "auto" }} />
        </div>
      </div>

      {/* Thumbnails strip */}
      {pageCount > 1 && (
        <div className="flex gap-2 overflow-x-auto px-3 py-2 border-t border-gray-100 bg-white no-scrollbar">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const isSel = selectedPages?.includes(p);
            return (
              <PdfPageThumb
                key={p}
                file={file}
                pageNum={p}
                width={64}
                selected={p === activePage}
                onClick={() => {
                  setActivePage(p);
                  onTogglePage?.(p);
                }}
                label={`${p}`}
                overlay={
                  isSel !== undefined ? (
                    <div className={`absolute inset-0 flex items-center justify-center ${isSel ? "bg-blue-500/20" : ""}`}>
                      {isSel && <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">✓</span>}
                    </div>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
