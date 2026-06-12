import { useCallback, useRef, useState } from "react";
import { Check, Copy, Download, ThumbsDown, ThumbsUp, Upload } from "lucide-react";
import { useUsageGate } from "../../lib/auth";

/* ---------- CopyButton ---------- */
export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { guard } = useUsageGate();
  const copy = () => {
    guard(async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    });
  };
  return (
    <button
      onClick={copy}
      disabled={!text}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copié !" : label}
    </button>
  );
}

/* ---------- DownloadButton ---------- */
export function DownloadButton({
  getBlob,
  filename,
  label = "Télécharger",
  disabled,
}: {
  getBlob: () => Blob | Promise<Blob | null> | null;
  filename: string;
  label?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const { guard } = useUsageGate();
  const download = () => {
    guard(async () => {
      setBusy(true);
      try {
        const blob = await getBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } finally {
        setBusy(false);
      }
    });
  };
  return (
    <button
      onClick={download}
      disabled={disabled || busy}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      <Download className="w-4 h-4" />
      {busy ? "Préparation…" : label}
    </button>
  );
}

/* ---------- ClearButton ---------- */
export function ClearButton({ onClick, label = "Effacer" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 lg:py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all"
    >
      {label}
    </button>
  );
}

/* ---------- FileDropzone ---------- */
export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  label,
  hint,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        aria-label={label}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Upload className="w-8 h-8 mx-auto text-blue-500 mb-3" />
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      <p className="text-xs text-gray-400 mt-2">Glissez-déposez ou cliquez pour parcourir</p>
    </div>
  );
}

/* ---------- StatCard ---------- */
export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
      <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/* ---------- ResultBox ---------- */
export function ResultBox({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div aria-live="polite" className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      {label && <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>}
      {children}
    </div>
  );
}

/* ---------- ToolFeedback ---------- */
export function ToolFeedback({ slug }: { slug: string }) {
  const [voted, setVoted] = useState<null | "up" | "down">(null);
  const vote = (v: "up" | "down") => {
    setVoted(v);
    try {
      // Event Plausible personnalisé (no-op si Plausible absent)
      // @ts-expect-error plausible global
      window.plausible?.("tool-feedback", { props: { tool: slug, vote: v } });
    } catch {
      /* ignore */
    }
  };
  if (voted) {
    return <p className="text-sm text-green-600 font-medium">Merci pour votre retour ! 🙏</p>;
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Cet outil vous a été utile ?</span>
      <button
        onClick={() => vote("up")}
        aria-label="Outil utile"
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300 transition-colors"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => vote("down")}
        aria-label="Outil pas utile"
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------- Field helpers ---------- */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1 relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
        )}
      </div>
    </label>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
}
