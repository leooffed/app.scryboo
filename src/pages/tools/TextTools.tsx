import { useMemo, useState } from "react";
import {
  countText,
  convertCase,
  extractEmails,
  generateLorem,
  removeDuplicates,
  type CaseMode,
} from "../../lib/tools/text";
import { ClearButton, CopyButton, ResultBox, StatCard } from "../../components/tools/common";
import { useSEO } from "../../lib/seo";

useSEO({
  title: "Outils de texte - Scryboo",
  description: "Analysez, transformez et améliorez votre texte avec nos outils puissants.",
  canonical: "/tools/text",
});

/* ============ Compteur de mots ============ */
export function CompteurMots() {
  const [text, setText] = useState("");
  const stats = useMemo(() => countText(text), [text]);

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez ou tapez votre texte ici…"
        aria-label="Zone de texte à analyser"
        className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" aria-live="polite">
        <StatCard label="Mots" value={stats.words} />
        <StatCard label="Caractères" value={stats.chars} />
        <StatCard label="Sans espaces" value={stats.charsNoSpaces} />
        <StatCard label="Phrases" value={stats.sentences} />
        <StatCard label="Paragraphes" value={stats.paragraphs} />
        <StatCard label="Lecture" value={`${stats.readingTime} min`} />
      </div>
      <div className="flex gap-2">
        <ClearButton onClick={() => setText("")} />
        <CopyButton text={text} label="Copier le texte" />
      </div>
    </div>
  );
}

/* ============ Générateur Lorem Ipsum ============ */
export function GenerateurLorem() {
  const [paragraphs, setParagraphs] = useState(3);
  const [words, setWords] = useState(60);
  const [classic, setClassic] = useState(true);
  const result = useMemo(() => generateLorem(paragraphs, words, classic), [paragraphs, words, classic]);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Paragraphes : {paragraphs}</span>
          <input type="range" min={1} max={10} value={paragraphs} onChange={(e) => setParagraphs(+e.target.value)} className="w-full mt-2 accent-blue-600" aria-label="Nombre de paragraphes" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Mots / paragraphe : {words}</span>
          <input type="range" min={20} max={150} step={10} value={words} onChange={(e) => setWords(+e.target.value)} className="w-full mt-2 accent-blue-600" aria-label="Mots par paragraphe" />
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} className="accent-blue-600" />
          <span className="text-sm text-gray-700">Commencer par «&nbsp;Lorem ipsum…&nbsp;»</span>
        </label>
      </div>
      <ResultBox label="Texte généré">
        <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">{result}</p>
      </ResultBox>
      <CopyButton text={result} label="Copier le Lorem Ipsum" />
    </div>
  );
}

/* ============ Convertisseur de casse ============ */
const CASE_MODES: { mode: CaseMode; label: string }[] = [
  { mode: "upper", label: "MAJUSCULES" },
  { mode: "lower", label: "minuscules" },
  { mode: "title", label: "Titre De Mots" },
  { mode: "sentence", label: "Phrase normale" },
  { mode: "camel", label: "camelCase" },
  { mode: "snake", label: "snake_case" },
  { mode: "kebab", label: "kebab-case" },
];

export function ConvertisseurCasse() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("upper");
  const result = useMemo(() => (text ? convertCase(text, mode) : ""), [text, mode]);

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tapez ou collez votre texte…"
        aria-label="Texte à convertir"
        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {CASE_MODES.map((m) => (
          <button
            key={m.mode}
            onClick={() => setMode(m.mode)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              mode === m.mode ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResultBox label="Résultat">
        <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[3rem]">{result || "Le texte converti apparaîtra ici…"}</p>
      </ResultBox>
      <div className="flex gap-2">
        <ClearButton onClick={() => setText("")} />
        <CopyButton text={result} label="Copier le résultat" />
      </div>
    </div>
  );
}

/* ============ Supprimer les doublons ============ */
export function SupprimerDoublons() {
  const [text, setText] = useState("");
  const [trim, setTrim] = useState(true);
  const [ci, setCi] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const out = useMemo(
    () => removeDuplicates(text, { trim, caseInsensitive: ci, removeEmpty }),
    [text, trim, ci, removeEmpty]
  );

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Collez votre liste ici (une entrée par ligne)…\nexemple@mail.com\nexemple@mail.com\nautre@mail.com"}
        aria-label="Liste à nettoyer"
        className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
      />
      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <label className="flex items-center gap-2"><input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} className="accent-blue-600" /> Ignorer les espaces</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={ci} onChange={(e) => setCi(e.target.checked)} className="accent-blue-600" /> Ignorer la casse</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} className="accent-blue-600" /> Supprimer lignes vides</label>
      </div>
      {text && (
        <div className="grid grid-cols-2 gap-3" aria-live="polite">
          <StatCard label="Lignes conservées" value={out.kept} />
          <StatCard label="Doublons supprimés" value={out.removed} />
        </div>
      )}
      <ResultBox label="Liste nettoyée">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">{out.result || "Le résultat apparaîtra ici…"}</pre>
      </ResultBox>
      <div className="flex gap-2">
        <ClearButton onClick={() => setText("")} />
        <CopyButton text={out.result} label="Copier la liste" />
      </div>
    </div>
  );
}

/* ============ Extracteur d'emails ============ */
export function ExtracteurEmails() {
  const [text, setText] = useState("");
  const emails = useMemo(() => extractEmails(text), [text]);

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez n'importe quel texte contenant des adresses email…"
        aria-label="Texte source"
        className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <ResultBox label={`${emails.length} email${emails.length > 1 ? "s" : ""} trouvé${emails.length > 1 ? "s" : ""}`}>
        {emails.length === 0 ? (
          <p className="text-sm text-gray-400">Les adresses extraites apparaîtront ici…</p>
        ) : (
          <ul className="text-sm text-gray-800 font-mono space-y-1 max-h-48 overflow-y-auto">
            {emails.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </ResultBox>
      <div className="flex gap-2">
        <ClearButton onClick={() => setText("")} />
        <CopyButton text={emails.join("\n")} label="Copier les emails" />
      </div>
    </div>
  );
}
