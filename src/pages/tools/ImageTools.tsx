import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { ClearButton, DownloadButton, FileDropzone, formatBytes, ResultBox } from "../../components/tools/common";
import { useSEO } from "../../lib/seo";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/* ============ Compresseur d'image ============ */
export function CompresseurImage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [quality, setQuality] = useState(70);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useSEO({
    title: "Compresseur d'image - Scryboo",
    description: "Réduisez la taille de vos images sans perdre en qualité grâce à notre compresseur d'image en ligne gratuit.",
    canonical: "/tools/image/compress",
  });

  const compress = async (f: File, q: number) => {
    setBusy(true);
    setError("");
    try {
      const { default: imageCompression } = await import("browser-image-compression");
      const compressed = await imageCompression(f, {
        maxSizeMB: 10,
        maxWidthOrHeight: 4096,
        initialQuality: q / 100,
        useWebWorker: true,
      });
      setResult({ blob: compressed, url: URL.createObjectURL(compressed) });
    } catch {
      setError("Impossible de compresser cette image. Vérifiez le format (JPG, PNG, WEBP).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        label="Déposez votre image (JPG, PNG, WEBP)"
        hint="Taille max recommandée : 20 Mo"
        onFiles={(files) => {
          setFile(files[0]);
          setResult(null);
          compress(files[0], quality);
        }}
      />
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Qualité : {quality}%</span>
        <input
          type="range" min={10} max={95} value={quality}
          onChange={(e) => {
            setQuality(+e.target.value);
            if (file) compress(file, +e.target.value);
          }}
          className="w-full mt-2 accent-blue-600" aria-label="Qualité de compression"
        />
      </label>
      {busy && <p className="text-sm text-blue-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Compression en cours…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {file && result && !busy && (
        <ResultBox label="Résultat de la compression">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img src={result.url} alt="Aperçu de l'image compressée" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
            <div className="text-sm space-y-1">
              <p className="text-gray-600">Avant : <strong>{formatBytes(file.size)}</strong></p>
              <p className="text-gray-600">Après : <strong className="text-green-600">{formatBytes(result.blob.size)}</strong></p>
              <p className="text-green-700 font-semibold">
                −{Math.max(0, Math.round((1 - result.blob.size / file.size) * 100))}&nbsp;% de réduction
              </p>
            </div>
          </div>
        </ResultBox>
      )}
      <div className="flex gap-2">
        <ClearButton onClick={() => { setFile(null); setResult(null); }} />
        <DownloadButton
          disabled={!result}
          getBlob={() => result?.blob ?? null}
          filename={file ? `compresse-${file.name}` : "image.jpg"}
          label="Télécharger l'image compressée"
        />
      </div>
    </div>
  );
}

/* ============ Convertisseur de format ============ */
const FORMATS = [
  { mime: "image/png", ext: "png", label: "PNG" },
  { mime: "image/jpeg", ext: "jpg", label: "JPG" },
  { mime: "image/webp", ext: "webp", label: "WEBP" },
];

export function ConvertisseurFormat() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState(FORMATS[0]);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const convert = async (f: File, fmt: typeof FORMATS[number]) => {
    setBusy(true);
    try {
      const img = await loadImage(f);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      if (fmt.mime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, fmt.mime, 0.92);
      if (blob) setResult({ blob, url: URL.createObjectURL(blob) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/*"
        label="Déposez votre image à convertir"
        onFiles={(files) => {
          setFile(files[0]);
          convert(files[0], format);
        }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Convertir vers :</span>
        {FORMATS.map((f) => (
          <button
            key={f.mime}
            onClick={() => {
              setFormat(f);
              if (file) convert(file, f);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              format.mime === f.mime ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {busy && <p className="text-sm text-blue-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Conversion…</p>}
      {result && !busy && (
        <ResultBox label={`Image convertie en ${format.label}`}>
          <div className="flex items-center gap-4">
            <img src={result.url} alt="Aperçu de l'image convertie" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
            <p className="text-sm text-gray-600">Taille : <strong>{formatBytes(result.blob.size)}</strong></p>
          </div>
        </ResultBox>
      )}
      <div className="flex gap-2">
        <ClearButton onClick={() => { setFile(null); setResult(null); }} />
        <DownloadButton
          disabled={!result}
          getBlob={() => result?.blob ?? null}
          filename={file ? file.name.replace(/\.[^.]+$/, "") + "." + format.ext : "image." + format.ext}
          label={`Télécharger en ${format.label}`}
        />
      </div>
    </div>
  );
}

/* ============ Redimensionneur ============ */
export function Redimensionneur() {
  const [file, setFile] = useState<File | null>(null);
  const [orig, setOrig] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [keepRatio, setKeepRatio] = useState(true);
  const [result, setResult] = useState<{ blob: Blob; url: string; w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const resize = async (f: File, w: number, h: number) => {
    setBusy(true);
    try {
      const img = await loadImage(f);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await canvasToBlob(canvas, f.type === "image/png" ? "image/png" : "image/jpeg", 0.92);
      if (blob) setResult({ blob, url: URL.createObjectURL(blob), w, h });
    } finally {
      setBusy(false);
    }
  };

  const onWidth = (w: number) => {
    setWidth(w);
    if (keepRatio && orig) setHeight(Math.round((w / orig.w) * orig.h));
  };
  const onHeight = (h: number) => {
    setHeight(h);
    if (keepRatio && orig) setWidth(Math.round((h / orig.h) * orig.w));
  };

  return (
    <div className="space-y-4">
      <FileDropzone
        accept="image/*"
        label="Déposez votre image à redimensionner"
        onFiles={async (files) => {
          const f = files[0];
          setFile(f);
          setResult(null);
          const img = await loadImage(f);
          setOrig({ w: img.naturalWidth, h: img.naturalHeight });
          setWidth(img.naturalWidth);
          setHeight(img.naturalHeight);
        }}
      />
      {orig && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Dimensions originales : {orig.w} × {orig.h} px
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Largeur (px)</span>
          <input type="number" value={width} min={1} onChange={(e) => onWidth(+e.target.value)} aria-label="Largeur en pixels"
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Hauteur (px)</span>
          <input type="number" value={height} min={1} onChange={(e) => onHeight(+e.target.value)} aria-label="Hauteur en pixels"
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
          <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} className="accent-blue-600" />
          Conserver les proportions
        </label>
      </div>
      <button
        onClick={() => file && resize(file, width, height)}
        disabled={!file || busy}
        className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {busy ? "Redimensionnement…" : "Redimensionner l'image"}
      </button>
      {result && (
        <ResultBox label={`Nouvelle taille : ${result.w} × ${result.h} px — ${formatBytes(result.blob.size)}`}>
          <img src={result.url} alt="Aperçu de l'image redimensionnée" className="max-w-full max-h-56 rounded-lg border border-gray-200" />
        </ResultBox>
      )}
      <div className="flex gap-2">
        <ClearButton onClick={() => { setFile(null); setOrig(null); setResult(null); }} />
        <DownloadButton
          disabled={!result}
          getBlob={() => result?.blob ?? null}
          filename={file ? `redim-${file.name}` : "image.jpg"}
          label="Télécharger l'image"
        />
      </div>
    </div>
  );
}
