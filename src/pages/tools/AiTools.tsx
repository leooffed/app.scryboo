import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  checkQuota,
  consumeQuota,
  correctText,
  generateBio,
  generateBusinessNames,
  summarizeText,
  type BioParams,
  type BusinessNameParams,
} from "../../lib/tools/ai-local";
import { ClearButton, CopyButton, ResultBox } from "../../components/tools/common";
import { useSEO } from "../../lib/seo";

/* ---------- Shared : quota + bouton IA ---------- */
function QuotaBadge({ slug }: { slug: string }) {
  const { remaining } = checkQuota(slug);
  return (
    <p className="text-xs text-gray-400">
      ✨ {remaining}/3 utilisations gratuites restantes aujourd'hui ·{" "}
      <span className="text-teal-600 font-medium">Passez à Scryboo AI pour un accès illimité</span>
    </p>
  );
}

function useAiRun(slug: string) {
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const run = async (fn: () => string) => {
    const { allowed } = checkQuota(slug);
    if (!allowed) {
      setBlocked(true);
      return null;
    }
    setBusy(true);
    // Simule la latence d'un appel API IA (1-2 s) pour une UX cohérente
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 800));
    const result = fn();
    consumeQuota(slug);
    setBusy(false);
    return result;
  };

  return { busy, blocked, run };
}

function BlockedMessage() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
      <p className="font-semibold">Limite quotidienne atteinte (3 utilisations gratuites/jour)</p>
      <p className="mt-1">
        Revenez demain, ou découvrez <strong>Scryboo AI</strong> pour un accès illimité aux outils
        d'intelligence artificielle. 🚀
      </p>
    </div>
  );
}

function AiButton({ onClick, disabled, busy, label }: { onClick: () => void; disabled?: boolean; busy: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      {busy ? "L'IA réfléchit…" : label}
    </button>
  );
}

/* ============ Résumeur de texte ============ */
export function ResumeurTexte() {
  const [text, setText] = useState("");
  const [length, setLength] = useState<"court" | "moyen" | "long">("moyen");
  const [result, setResult] = useState("");
  const { busy, blocked, run } = useAiRun("resumeur-texte");

  useSEO({
    title: "Résumeur de texte - Scryboo",
    description: "Résumez rapidement vos textes longs en quelques clics avec notre outil de résumé d'IA.",
    canonical: "/tools/ai/summarize",
  });

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez votre texte long ici (article, rapport, cours…) — minimum 200 caractères"
        aria-label="Texte à résumer"
        className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Longueur :</span>
        {(["court", "moyen", "long"] as const).map((l) => (
          <button key={l} onClick={() => setLength(l)}
            className={`px-3 py-1.5 text-sm rounded-lg border capitalize transition-colors ${
              length === l ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {l}
          </button>
        ))}
      </div>
      {blocked && <BlockedMessage />}
      <AiButton
        busy={busy}
        disabled={text.trim().length < 200}
        label="Résumer le texte"
        onClick={async () => {
          const r = await run(() => summarizeText(text, length));
          if (r !== null) setResult(r);
        }}
      />
      {result && (
        <ResultBox label="Résumé généré">
          <p className="text-sm text-gray-800 leading-relaxed">{result}</p>
        </ResultBox>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <ClearButton onClick={() => { setText(""); setResult(""); }} />
          <CopyButton text={result} label="Copier le résumé" />
        </div>
        <QuotaBadge slug="resumeur-texte" />
      </div>
    </div>
  );
}

/* ============ Correcteur orthographe ============ */
export function CorrecteurOrthographe() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ corrected: string; changes: number } | null>(null);
  const { busy, blocked, run } = useAiRun("correcteur-orthographe");

  useSEO({
    title: "Correcteur orthographe - Scryboo",
    description: "Corrigez rapidement les fautes d'orthographe de votre texte avec notre outil d'IA.",
    canonical: "/tools/ai/correct",
  });

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez le texte français à corriger…"
        aria-label="Texte à corriger"
        className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
      {blocked && <BlockedMessage />}
      <AiButton
        busy={busy}
        disabled={!text.trim()}
        label="Corriger le texte"
        onClick={async () => {
          const r = await run(() => JSON.stringify(correctText(text)));
          if (r !== null) setResult(JSON.parse(r));
        }}
      />
      {result && (
        <ResultBox label={`Texte corrigé — ${result.changes} correction${result.changes > 1 ? "s" : ""} appliquée${result.changes > 1 ? "s" : ""}`}>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result.corrected}</p>
        </ResultBox>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <ClearButton onClick={() => { setText(""); setResult(null); }} />
          <CopyButton text={result?.corrected ?? ""} label="Copier le texte corrigé" />
        </div>
        <QuotaBadge slug="correcteur-orthographe" />
      </div>
    </div>
  );
}

/* ============ Générateur de bio ============ */
export function GenerateurBio() {
  const [params, setParams] = useState<BioParams>({
    name: "", profession: "", skills: "", tone: "professionnel", platform: "linkedin",
  });
  const [result, setResult] = useState("");
  const { busy, blocked, run } = useAiRun("generateur-bio");
  const set = (patch: Partial<BioParams>) => setParams({ ...params, ...patch });

  useSEO({
    title: "Générateur de bio - Scryboo",
    description: "Créez rapidement une biographie professionnelle avec notre outil de génération d'IA.",
    canonical: "/tools/ai/generate-bio",
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Votre nom</span>
          <input value={params.name} onChange={(e) => set({ name: e.target.value })} placeholder="Aïcha Diallo"
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Profession</span>
          <input value={params.profession} onChange={(e) => set({ profession: e.target.value })} placeholder="Développeuse web freelance"
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Compétences clés (séparées par des virgules)</span>
        <input value={params.skills} onChange={(e) => set({ skills: e.target.value })} placeholder="React, design UI, gestion de projet"
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Ton</span>
          <select value={params.tone} onChange={(e) => set({ tone: e.target.value as BioParams["tone"] })}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="professionnel">Professionnel</option>
            <option value="décontracté">Décontracté</option>
            <option value="inspirant">Inspirant</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Plateforme</span>
          <select value={params.platform} onChange={(e) => set({ platform: e.target.value as BioParams["platform"] })}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="cv">CV</option>
          </select>
        </label>
      </div>
      {blocked && <BlockedMessage />}
      <AiButton
        busy={busy}
        disabled={!params.name.trim() || !params.profession.trim()}
        label="Générer ma bio"
        onClick={async () => {
          const r = await run(() => generateBio(params));
          if (r !== null) setResult(r);
        }}
      />
      {result && (
        <ResultBox label="Votre biographie">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result}</p>
        </ResultBox>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CopyButton text={result} label="Copier la bio" />
        <QuotaBadge slug="generateur-bio" />
      </div>
    </div>
  );
}

/* ============ Générateur de noms d'entreprise ============ */
export function GenerateurNomBusiness() {
  const [params, setParams] = useState<BusinessNameParams>({ activity: "", keywords: "", style: "moderne" });
  const [names, setNames] = useState<string[]>([]);
  const { busy, blocked, run } = useAiRun("generateur-nom-business");

  useSEO({
    title: "Générateur de noms d'entreprise - Scryboo",
    description: "Créez rapidement des noms d'entreprise pertinents avec notre outil de génération d'IA.",
    canonical: "/tools/ai/generate-business-name",
  });

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Votre activité</span>
        <input value={params.activity} onChange={(e) => setParams({ ...params, activity: e.target.value })}
          placeholder="Livraison de repas à Dakar"
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Mots-clés (optionnel)</span>
          <input value={params.keywords} onChange={(e) => setParams({ ...params, keywords: e.target.value })}
            placeholder="rapide, local, saveur"
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Style</span>
          <select value={params.style} onChange={(e) => setParams({ ...params, style: e.target.value as BusinessNameParams["style"] })}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="moderne">Moderne</option>
            <option value="classique">Classique</option>
            <option value="créatif">Créatif</option>
          </select>
        </label>
      </div>
      {blocked && <BlockedMessage />}
      <AiButton
        busy={busy}
        disabled={!params.activity.trim()}
        label="Générer 10 noms"
        onClick={async () => {
          const r = await run(() => generateBusinessNames(params).join("\n"));
          if (r !== null) setNames(r.split("\n"));
        }}
      />
      {names.length > 0 && (
        <ResultBox label="Suggestions de noms">
          <ol className="grid sm:grid-cols-2 gap-2 text-sm text-gray-800">
            {names.map((n, i) => (
              <li key={n} className="bg-white border border-gray-100 rounded-lg px-3 py-2 font-medium">
                <span className="text-gray-400 mr-2">{i + 1}.</span>{n}
              </li>
            ))}
          </ol>
        </ResultBox>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CopyButton text={names.join("\n")} label="Copier la liste" />
        <QuotaBadge slug="generateur-nom-business" />
      </div>
    </div>
  );
}
