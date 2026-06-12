import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Download, Loader2, Mail, MessageCircle, Plus, RefreshCw, Share2, Trash2 } from "lucide-react";
import {
  computeBMI,
  computeLoan,
  computeVAT,
  convertCurrency,
  CURRENCY_NAMES,
  FALLBACK_RATES,
  fetchRates,
  formatMoney,
  TVA_RATES,
} from "../../lib/tools/calculators";
import { ClearButton, CopyButton, NumberField, ResultBox, StatCard } from "../../components/tools/common";
import { useSEO } from "../../lib/seo";

/* ============ IMC ============ */
export function CalculateurIMC() {
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const res = useMemo(
    () => (weight && height ? computeBMI(Number(weight), Number(height)) : null),
    [weight, height]
  );

  useSEO({
    title: "Calculateur d'IMC - Scryboo",
    description: "Calculez rapidement votre Indice de Masse Corporelle avec notre outil en ligne gratuit.",
    canonical: "/tools/calc/imc",
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <NumberField label="Poids" value={weight} onChange={setWeight} min={10} max={400} suffix="kg" />
        <NumberField label="Taille" value={height} onChange={setHeight} min={50} max={260} suffix="cm" />
      </div>
      <div aria-live="polite">
        {res && (
          <ResultBox label="Votre résultat">
            <div className="text-center py-2">
              <p className="text-5xl font-bold text-gray-900">{res.bmi}</p>
              <p className={`text-lg font-semibold mt-2 ${res.color}`}>{res.category}</p>
              <p className="text-sm text-gray-500 mt-2">
                Poids idéal pour votre taille : entre <strong>{res.idealMin} kg</strong> et <strong>{res.idealMax} kg</strong>
              </p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-40% to-red-500 relative">
              <span
                className="absolute -top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-700 shadow"
                style={{ left: `${Math.min(96, Math.max(0, ((res.bmi - 14) / 26) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>14</span><span>18,5</span><span>25</span><span>30</span><span>40</span>
            </div>
          </ResultBox>
        )}
      </div>
      <ClearButton onClick={() => { setWeight(""); setHeight(""); }} />
    </div>
  );
}

/* ============ Simulateur de prêt ============ */
export function SimulateurPret() {
  const [amount, setAmount] = useState<number | "">(5000000);
  const [rate, setRate] = useState<number | "">(8);
  const [years, setYears] = useState<number | "">(5);
  const [showTable, setShowTable] = useState(false);
  const res = useMemo(
    () => (amount && years ? computeLoan(Number(amount), Number(rate || 0), Number(years)) : null),
    [amount, rate, years]
  );

  useSEO({
    title: "Simulateur de prêt - Scryboo",
    description: "Calculez rapidement les mensualités et le coût total de votre prêt avec notre outil de simulation en ligne gratuit.",
    canonical: "/tools/calc/loan",
  });

  const exportCsv = () => {
    if (!res) return;
    const header = "Mois;Mensualité;Intérêts;Capital;Restant dû";
    const lines = res.rows.map(
      (r) => `${r.month};${r.payment.toFixed(0)};${r.interest.toFixed(0)};${r.principal.toFixed(0)};${r.balance.toFixed(0)}`
    );
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amortissement-scryboo.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <NumberField label="Montant emprunté" value={amount} onChange={setAmount} min={0} suffix="FCFA / €" />
        <NumberField label="Taux annuel" value={rate} onChange={setRate} min={0} max={50} step={0.1} suffix="%" />
        <NumberField label="Durée" value={years} onChange={setYears} min={0.5} max={35} step={0.5} suffix="ans" />
      </div>
      <div aria-live="polite">
        {res && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Mensualité" value={formatMoney(res.monthly, 0)} />
              <StatCard label="Coût total du crédit" value={formatMoney(res.totalInterest, 0)} />
              <StatCard label="Total remboursé" value={formatMoney(res.totalPaid, 0)} />
            </div>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setShowTable(!showTable)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showTable ? "Masquer" : "Afficher"} le tableau d'amortissement ({res.n} mois)
              </button>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                <Download className="w-4 h-4" /> Exporter en CSV (Excel)
              </button>
            </div>
            {showTable && (
              <div className="mt-3 overflow-x-auto border border-gray-100 rounded-xl max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2">Mois</th>
                      <th className="px-3 py-2">Mensualité</th>
                      <th className="px-3 py-2">Intérêts</th>
                      <th className="px-3 py-2">Capital</th>
                      <th className="px-3 py-2">Restant dû</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.rows.map((r) => (
                      <tr key={r.month} className="border-t border-gray-50 tabular-nums">
                        <td className="px-3 py-1.5 text-gray-500">{r.month}</td>
                        <td className="px-3 py-1.5">{formatMoney(r.payment, 0)}</td>
                        <td className="px-3 py-1.5 text-red-500">{formatMoney(r.interest, 0)}</td>
                        <td className="px-3 py-1.5 text-green-600">{formatMoney(r.principal, 0)}</td>
                        <td className="px-3 py-1.5">{formatMoney(r.balance, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ============ Convertisseur de devises ============ */
function CurrencySelect({
  value,
  onChange,
  label,
  codes,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  codes: string[];
}) {
  return (
    <label className="block flex-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {codes.map((c) => (
          <option key={c} value={c}>{c} — {CURRENCY_NAMES[c] ?? c}</option>
        ))}
      </select>
    </label>
  );
}

export function ConvertisseurDevises() {
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [live, setLive] = useState<boolean | null>(null);
  const [amount, setAmount] = useState<number | "">(10000);
  const [from, setFrom] = useState("XAF");
  const [to, setTo] = useState("EUR");

  useSEO({
    title: "Convertisseur de devises - Scryboo",
    description: "Convertissez rapidement vos montants entre différentes devises avec notre outil de conversion en ligne gratuit.",
    canonical: "/tools/calc/currency",
  });

  useEffect(() => {
    fetchRates().then(({ rates, live }) => {
      setRates(rates);
      setLive(live);
    });
  }, []);

  const result = amount ? convertCurrency(Number(amount), from, to, rates) : 0;
  const unit = convertCurrency(1, from, to, rates);
  const codes = Object.keys(rates);

  return (
    <div className="space-y-4">
      <NumberField label="Montant" value={amount} onChange={setAmount} min={0} />
      <div className="flex flex-col sm:flex-row items-end gap-3">
        <CurrencySelect value={from} onChange={setFrom} label="De" codes={codes} />
        <button
          onClick={() => { setFrom(to); setTo(from); }}
          aria-label="Inverser les devises"
          className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 mb-0.5"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <CurrencySelect value={to} onChange={setTo} label="Vers" codes={codes} />
      </div>
      <div aria-live="polite">
        {amount !== "" && (
          <ResultBox label="Résultat de la conversion">
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              {formatMoney(result)} <span className="text-lg text-gray-500">{to}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">1 {from} = {formatMoney(unit, 6)} {to}</p>
          </ResultBox>
        )}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        {amount !== "" && (
          <CopyButton
            text={`${formatMoney(Number(amount))} ${from} = ${formatMoney(result)} ${to} (1 ${from} = ${formatMoney(unit, 6)} ${to})`}
            label="Copier le résultat"
          />
        )}
        <p className="text-xs text-gray-400">
          {live === null && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Chargement des taux…</span>}
          {live === true && "Taux de change actualisés (source : open.er-api.com)."}
          {live === false && "Taux indicatifs hors ligne — à titre informatif uniquement."}
        </p>
      </div>
    </div>
  );
}

/* ============ Calculateur TVA enrichi ============ */
interface TvaItem { label: string; amount: number | "" }

export function CalculateurTVA() {
  const [rate, setRate] = useState(19.25);
  const [custom, setCustom] = useState<number | "">("");
  const [direction, setDirection] = useState<"ht-to-ttc" | "ttc-to-ht">("ht-to-ttc");
  const [mode, setMode] = useState<"simple" | "multi">("simple");
  const [amount, setAmount] = useState<number | "">(100000);
  const [items, setItems] = useState<TvaItem[]>([{ label: "", amount: "" }]);
  const [currency, setCurrency] = useState("FCFA");
  const [history, setHistory] = useState<{ ht: number; tva: number; ttc: number; rate: number; cur: string; date: string }[]>([]);

  useSEO({
    title: "Calculateur de TVA - Scryboo",
    description: "Calculez rapidement les taxes sur votre facture avec notre outil de calcul de TVA en ligne gratuit.",
    canonical: "/tools/calc/vat",
  });

  const effRate = custom !== "" ? Number(custom) : Math.round(rate * 100) / 100;

  // Simple mode
  const res = mode === "simple" && amount !== "" ? computeVAT(Number(amount), effRate, direction) : null;

  // Multi mode
  const multiTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const multiRes = mode === "multi" && multiTotal > 0 ? computeVAT(multiTotal, effRate, direction) : null;
  const activeRes = mode === "simple" ? res : multiRes;

  const saveToHistory = () => {
    if (!activeRes) return;
    setHistory((h) => [{ ht: activeRes.ht, tva: activeRes.tva, ttc: activeRes.ttc, rate: effRate, cur: currency, date: new Date().toLocaleTimeString("fr-FR") }, ...h].slice(0, 20));
  };

  const exportCsv = () => {
    if (history.length === 0) return;
    const header = "Heure;HT;TVA;TTC;Taux;Devise";
    const lines = history.map((h) => `${h.date};${h.ht.toFixed(2)};${h.tva.toFixed(2)};${h.ttc.toFixed(2)};${h.rate}%;${h.cur}`);
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "historique-tva-scryboo.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Mode switch */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setMode("simple")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "simple" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Calcul simple</button>
          <button onClick={() => setMode("multi")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "multi" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Multi-produits</button>
        </div>
        <div className="flex gap-1 ml-auto">
          {(["ht-to-ttc", "ttc-to-ht"] as const).map((d) => (
            <button key={d} onClick={() => setDirection(d)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${direction === d ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {d === "ht-to-ttc" ? "HT → TTC" : "TTC → HT"}
            </button>
          ))}
        </div>
      </div>

      {/* Rate selection */}
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Pays / Taux de TVA</span>
          <select value={rate} onChange={(e) => { setRate(+e.target.value); setCustom(""); }}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {TVA_RATES.map((r) => <option key={r.label} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <NumberField label="Taux personnalisé (%)" value={custom} onChange={setCustom} min={0} max={60} step={0.01} suffix="%" />
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Devise</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["FCFA", "EUR", "USD", "MAD", "GNF", "NGN", "XOF"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {/* Simple mode */}
      {mode === "simple" && (
        <NumberField label={direction === "ht-to-ttc" ? `Montant HT (${currency})` : `Montant TTC (${currency})`} value={amount} onChange={setAmount} min={0} />
      )}

      {/* Multi mode */}
      {mode === "multi" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Produits / Prestations</p>
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={it.label} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                placeholder={`Produit ${i + 1}`} aria-label={`Libellé ${i + 1}`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" value={it.amount} min={0}
                onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, amount: e.target.value === "" ? "" : +e.target.value } : x))}
                placeholder="Montant" aria-label="Montant"
                className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length <= 1}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { label: "", amount: "" }])}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Plus className="w-4 h-4" /> Ajouter un produit
          </button>
          {multiTotal > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-500">Total {direction === "ht-to-ttc" ? "HT" : "TTC"} :</span>{" "}
              <strong className="text-gray-900 tabular-nums">{formatMoney(multiTotal, 0)} {currency}</strong>
              {items.filter((it) => Number(it.amount) > 0).length > 1 && (
                <span className="text-xs text-gray-400 ml-2">({items.filter((it) => Number(it.amount) > 0).length} lignes)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div aria-live="polite">
        {activeRes && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label={`Montant HT (${currency})`} value={formatMoney(activeRes.ht)} />
              <StatCard label={`TVA ${formatMoney(effRate, 2)} %`} value={formatMoney(activeRes.tva)} />
              <StatCard label={`Montant TTC (${currency})`} value={formatMoney(activeRes.ttc)} />
            </div>
            {mode === "multi" && items.filter((it) => Number(it.amount) > 0).length > 1 && (
              <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50"><tr className="text-left text-gray-500">
                    <th className="px-3 py-2">Produit</th>
                    <th className="px-3 py-2 text-right">{direction === "ht-to-ttc" ? "HT" : "TTC"}</th>
                    <th className="px-3 py-2 text-right">TVA</th>
                    <th className="px-3 py-2 text-right">{direction === "ht-to-ttc" ? "TTC" : "HT"}</th>
                  </tr></thead>
                  <tbody>
                    {items.filter((it) => Number(it.amount) > 0).map((it, i) => {
                      const r = computeVAT(Number(it.amount), effRate, direction);
                      return (
                        <tr key={i} className="border-t border-gray-50 tabular-nums">
                          <td className="px-3 py-1.5 text-gray-700">{it.label || `Produit ${i + 1}`}</td>
                          <td className="px-3 py-1.5 text-right">{formatMoney(r.ht, 0)}</td>
                          <td className="px-3 py-1.5 text-right text-amber-600">{formatMoney(r.tva, 0)}</td>
                          <td className="px-3 py-1.5 text-right font-medium">{formatMoney(r.ttc, 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {activeRes && (
          <>
            <CopyButton
              text={`HT : ${formatMoney(activeRes.ht)} ${currency} | TVA ${formatMoney(effRate, 2)}% : ${formatMoney(activeRes.tva)} ${currency} | TTC : ${formatMoney(activeRes.ttc)} ${currency}`}
              label="Copier"
            />
            <button onClick={saveToHistory}
              className="px-4 py-2.5 lg:py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all">
              📋 Sauvegarder
            </button>
          </>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase">Historique ({history.length})</p>
            <div className="flex gap-2">
              <button onClick={exportCsv} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Exporter CSV</button>
              <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-red-500">Vider</button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs tabular-nums">
                <span className="text-gray-400">{h.date}</span>
                <span>HT {formatMoney(h.ht, 0)} → <strong>TTC {formatMoney(h.ttc, 0)}</strong> ({h.rate}%) {h.cur}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Générateur de facture PDF ============ */
interface InvoiceItem { desc: string; qty: number; unit: string; price: number }

type BizType = "freelance" | "commerce" | "pme" | "service";

interface Party {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  taxId: string; // RCCM, NUI, SIRET, NIU…
}

const EMPTY_PARTY: Party = { name: "", address: "", city: "", phone: "", email: "", taxId: "" };

const BIZ_CONFIGS: Record<BizType, {
  label: string; emoji: string; hint: string;
  sellerPlaceholders: Party; clientPlaceholders: Party;
  defaultTva: number; defaultPayment: string; defaultDue: number;
  defaultUnit: string; taxIdLabel: string;
  defaultNotes: string;
}> = {
  freelance: {
    label: "Freelance / Indépendant", emoji: "💻", hint: "Pour les travailleurs indépendants, consultants, développeurs, graphistes…",
    sellerPlaceholders: { name: "Aïcha Diallo", address: "Quartier Bastos", city: "Yaoundé, Cameroun", phone: "+237 6XX XX XX XX", email: "aicha@freelance.cm", taxId: "NUI-XXXX" },
    clientPlaceholders: { name: "Client SA", address: "Boulevard de la Liberté", city: "Douala, Cameroun", phone: "+237 6XX XX XX XX", email: "client@exemple.com", taxId: "" },
    defaultTva: 19.25, defaultPayment: "Mobile Money", defaultDue: 14, defaultUnit: "forfait",
    taxIdLabel: "N° contribuable / NUI", defaultNotes: "Facture émise en tant que travailleur indépendant.\nPaiement attendu sous 14 jours.",
  },
  commerce: {
    label: "Commerce / Boutique", emoji: "🏪", hint: "Pour les commerces, boutiques en ligne, magasins, restaurants…",
    sellerPlaceholders: { name: "Boutique Mode Express", address: "Marché Central", city: "Abidjan, Côte d'Ivoire", phone: "+225 07 XX XX XX", email: "contact@modeexpress.ci", taxId: "RCCM-CI-ABJ-XXXX" },
    clientPlaceholders: { name: "M. / Mme Client", address: "", city: "Abidjan", phone: "+225 07 XX XX XX", email: "", taxId: "" },
    defaultTva: 18, defaultPayment: "Espèces", defaultDue: 0, defaultUnit: "pièce",
    taxIdLabel: "RCCM / Registre de commerce", defaultNotes: "Merci pour votre achat ! Échange possible sous 7 jours avec le reçu.",
  },
  pme: {
    label: "PME / Entreprise", emoji: "🏢", hint: "Pour les SARL, SA, SAS, associations avec comptabilité structurée…",
    sellerPlaceholders: { name: "Tech Solutions SARL", address: "Immeuble Rose, Plateau", city: "Dakar, Sénégal", phone: "+221 33 XXX XX XX", email: "compta@techsolutions.sn", taxId: "NINEA-XXXX-XXXX" },
    clientPlaceholders: { name: "Groupe Invest SA", address: "Zone Industrielle", city: "Dakar, Sénégal", phone: "+221 33 XXX XX XX", email: "finance@groupeinvest.sn", taxId: "NINEA-XXXX" },
    defaultTva: 18, defaultPayment: "Virement bancaire", defaultDue: 30, defaultUnit: "unité",
    taxIdLabel: "NINEA / RCCM / SIRET", defaultNotes: "Conditions : paiement à 30 jours fin de mois.\nPénalité de retard : 1,5% par mois.\nEscompte pour paiement anticipé : 2%.",
  },
  service: {
    label: "Prestation de services", emoji: "🔧", hint: "Pour les agences, cabinets, prestataires B2B, formations…",
    sellerPlaceholders: { name: "Agence Créa Digital", address: "Rue des Entrepreneurs", city: "Douala, Cameroun", phone: "+237 6XX XX XX XX", email: "devis@creadigital.cm", taxId: "NIU-XXXXXX" },
    clientPlaceholders: { name: "Entreprise Cliente", address: "Avenue de la Paix", city: "Douala, Cameroun", phone: "", email: "direction@client.cm", taxId: "" },
    defaultTva: 19.25, defaultPayment: "Virement bancaire", defaultDue: 15, defaultUnit: "prestation",
    taxIdLabel: "NIU / N° contribuable", defaultNotes: "Prestation réalisée conformément au devis n°XXX.\nPaiement attendu sous 15 jours à réception de facture.",
  },
};

const UNITS = ["unité", "pièce", "lot", "heure", "jour", "mois", "forfait", "kg", "m²", "prestation"];

function genInvoiceNumber(): string {
  const arr = new Uint32Array(2);
  crypto.getRandomValues(arr);
  const serial = (arr[0] % 90000) + 10000;
  const suffix = String.fromCharCode(65 + (arr[1] % 26)) + String.fromCharCode(65 + ((arr[1] >> 8) % 26));
  return `FAC-${new Date().getFullYear()}-${serial}-${suffix}`;
}

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function frDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const PAYMENT_METHODS = ["Mobile Money", "Virement bancaire", "Espèces", "Chèque", "Carte bancaire", "PayPal", "Orange Money", "Wave", "MTN MoMo"];
const CURRENCIES = ["FCFA", "EUR", "USD", "MAD", "GNF", "NGN", "GHS", "TND", "XOF"];

const inputCls =
  "w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function PartyFieldsV2({
  title,
  party,
  onChange,
  placeholders,
  taxIdLabel,
  showTaxId,
}: {
  title: string;
  party: Party;
  onChange: (p: Party) => void;
  placeholders: Party;
  taxIdLabel: string;
  showTaxId?: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Nom / Raison sociale *</span>
        <input value={party.name} onChange={(e) => onChange({ ...party, name: e.target.value })}
          placeholder={placeholders.name} aria-label={`Nom ${title}`} className={inputCls} />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Adresse</span>
          <input value={party.address} onChange={(e) => onChange({ ...party, address: e.target.value })}
            placeholder={placeholders.address} aria-label={`Adresse ${title}`} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Ville / Pays</span>
          <input value={party.city} onChange={(e) => onChange({ ...party, city: e.target.value })}
            placeholder={placeholders.city} aria-label={`Ville ${title}`} className={inputCls} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Téléphone</span>
          <input value={party.phone} onChange={(e) => onChange({ ...party, phone: e.target.value })}
            placeholder={placeholders.phone} aria-label={`Téléphone ${title}`} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input type="email" value={party.email} onChange={(e) => onChange({ ...party, email: e.target.value })}
            placeholder={placeholders.email} aria-label={`Email ${title}`} className={inputCls} />
        </label>
      </div>
      {showTaxId && (
        <label className="block">
          <span className="text-sm font-medium text-gray-700">{taxIdLabel}</span>
          <input value={party.taxId} onChange={(e) => onChange({ ...party, taxId: e.target.value })}
            placeholder={placeholders.taxId} aria-label={taxIdLabel} className={inputCls} />
        </label>
      )}
    </div>
  );
}

export function GenerateurFacture() {
  const [bizType, setBizType] = useState<BizType>("freelance");
  const cfg = BIZ_CONFIGS[bizType];
  const [number, setNumber] = useState(() => genInvoiceNumber());
  const [seller, setSeller] = useState<Party>(EMPTY_PARTY);
  const [client, setClient] = useState<Party>(EMPTY_PARTY);
  const [issueDate, setIssueDate] = useState(() => todayISO());
  const [dueDate, setDueDate] = useState(() => todayISO(cfg.defaultDue));
  const [currency, setCurrency] = useState("FCFA");
  const [tva, setTva] = useState(cfg.defaultTva);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState(cfg.defaultPayment);
  const [notes, setNotes] = useState(cfg.defaultNotes);
  const [items, setItems] = useState<InvoiceItem[]>([{ desc: "", qty: 1, unit: cfg.defaultUnit, price: 0 }]);
  const [docTitle, setDocTitle] = useState("FACTURE");
  const [showBankInfo, setShowBankInfo] = useState(false);
  const [bankInfo, setBankInfo] = useState("");
  const [busy, setBusy] = useState<null | "pdf" | "whatsapp" | "gmail" | "share">(null);
  const [info, setInfo] = useState("");

  useSEO({
    title: "Générateur de factures - Scryboo",
    description: "Créez rapidement des factures professionnelles avec notre outil de génération de factures en ligne gratuit.",
    canonical: "/tools/calc/invoice",
  });

  // Changer de type de business → adapter les valeurs par défaut
  const switchBiz = (biz: BizType) => {
    const c = BIZ_CONFIGS[biz];
    setBizType(biz);
    setTva(c.defaultTva);
    setPayment(c.defaultPayment);
    setDueDate(todayISO(c.defaultDue));
    setNotes(c.defaultNotes);
    if (items.length === 1 && !items[0].desc) {
      setItems([{ desc: "", qty: 1, unit: c.defaultUnit, price: 0 }]);
    }
  };

  const validItems = items.filter((i) => i.desc.trim() && i.price > 0 && i.qty > 0);
  const subtotal = validItems.reduce((s, it) => s + it.qty * it.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const base = subtotal - discountAmount;
  const tvaAmount = base * (tva / 100);
  const total = base + tvaAmount;
  const canExport = seller.name.trim().length > 0 && client.name.trim().length > 0 && validItems.length > 0;

  const update = (i: number, patch: Partial<InvoiceItem>) =>
    setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const shareText = [
    `🧾 ${docTitle} ${number}`,
    `De : ${seller.name || "—"}${seller.city ? ` (${seller.city})` : ""}`,
    `Pour : ${client.name || "—"}${client.city ? ` (${client.city})` : ""}`,
    `Montant TTC : ${formatMoney(total, 0)} ${currency}`,
    dueDate ? `Échéance : ${frDate(dueDate)}` : "",
    `Paiement : ${payment}`,
    ``,
    `Facture générée gratuitement sur tools.scryboo.com`,
  ].filter(Boolean).join("\n");

  /* ---------- Génération du PDF ---------- */
  const buildPdf = async (): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const blue = rgb(0.15, 0.39, 0.92);
    const dark = rgb(0.12, 0.16, 0.23);
    const gray = rgb(0.45, 0.45, 0.5);
    const lightGray = rgb(0.96, 0.97, 0.98);
    const white = rgb(1, 1, 1);

    // Helvetica (WinAnsi) supporte les accents latins — on ne retire que les caractères non encodables
    const clean = (s: string) =>
      s
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\u20AC/g, "EUR")
        .replace(/[^\x20-\x7EÀ-ÿ]/g, "");

    let page = doc.addPage([595, 842]); // A4
    let y = 0;

    const newPage = () => {
      page = doc.addPage([595, 842]);
      y = 790;
    };

    /* En-tête bandeau bleu */
    page.drawRectangle({ x: 0, y: 752, width: 595, height: 90, color: blue });
    page.drawText(clean(docTitle), { x: 50, y: 795, size: 28, font: bold, color: white });
    page.drawText(clean(seller.name || "Mon entreprise"), { x: 50, y: 772, size: 11, font, color: white });
    page.drawText("N° " + clean(number), { x: 380, y: 800, size: 12, font: bold, color: white });
    page.drawText("Date d'émission : " + frDate(issueDate), { x: 380, y: 783, size: 9, font, color: white });
    page.drawText("Date d'échéance : " + frDate(dueDate), { x: 380, y: 769, size: 9, font, color: white });

    /* Blocs émetteur / client */
    y = 720;
    page.drawText("ÉMETTEUR", { x: 50, y, size: 8, font: bold, color: gray });
    page.drawRectangle({ x: 310, y: y - 72, width: 235, height: 86, color: lightGray });
    page.drawText("FACTURÉ À", { x: 322, y, size: 8, font: bold, color: gray });
    y -= 16;

    const drawParty = (p: Party, x: number, startY: number) => {
      let yy = startY;
      const lines = [
        { t: p.name, f: bold, s: 11, c: dark },
        { t: p.address, f: font, s: 9, c: gray },
        { t: p.city, f: font, s: 9, c: gray },
        { t: p.phone ? "Tel : " + p.phone : "", f: font, s: 9, c: gray },
        { t: p.email, f: font, s: 9, c: gray },
        { t: p.taxId ? cfg.taxIdLabel + " : " + p.taxId : "", f: font, s: 8, c: gray },
      ];
      for (const l of lines) {
        if (!l.t) continue;
        page.drawText(clean(l.t).slice(0, 50), { x, y: yy, size: l.s, font: l.f, color: l.c });
        yy -= 13;
      }
    };
    drawParty(seller, 50, y);
    drawParty(client, 322, y);

    /* Tableau des articles */
    y = 610;
    const drawTableHeader = () => {
      page.drawRectangle({ x: 50, y: y - 6, width: 495, height: 24, color: blue });
      page.drawText("Description", { x: 58, y, size: 9, font: bold, color: white });
      page.drawText("Unite", { x: 310, y, size: 9, font: bold, color: white });
      page.drawText("Qte", { x: 365, y, size: 9, font: bold, color: white });
      page.drawText("P.U.", { x: 410, y, size: 9, font: bold, color: white });
      page.drawText("Montant", { x: 488, y, size: 9, font: bold, color: white });
      y -= 28;
    };
    drawTableHeader();

    validItems.forEach((it, idx) => {
      if (y < 200) {
        newPage();
        drawTableHeader();
      }
      if (idx % 2 === 1) {
        page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 19, color: lightGray });
      }
      page.drawText(clean(it.desc).slice(0, 42), { x: 58, y, size: 9, font, color: dark });
      page.drawText(clean(it.unit || ""), { x: 310, y, size: 8, font, color: gray });
      page.drawText(String(it.qty), { x: 365, y, size: 9, font, color: dark });
      page.drawText(formatMoney(it.price, 0), { x: 410, y, size: 9, font, color: dark });
      page.drawText(formatMoney(it.qty * it.price, 0), { x: 488, y, size: 9, font, color: dark });
      y -= 19;
    });

    /* Totaux */
    if (y < 160) newPage();
    y -= 12;
    page.drawLine({ start: { x: 330, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: gray });
    const totalLine = (label: string, value: string, opts?: { isBold?: boolean; color?: ReturnType<typeof rgb> }) => {
      const f = opts?.isBold ? bold : font;
      const c = opts?.color ?? dark;
      const size = opts?.isBold ? 12 : 10;
      page.drawText(label, { x: 340, y, size, font: f, color: c });
      page.drawText(value, { x: 545 - (opts?.isBold ? 7 : 5.2) * value.length, y, size, font: f, color: c });
      y -= opts?.isBold ? 22 : 16;
    };
    totalLine("Sous-total HT", `${formatMoney(subtotal, 0)} ${currency}`);
    if (discount > 0) totalLine(`Remise (${discount} %)`, `-${formatMoney(discountAmount, 0)} ${currency}`, { color: rgb(0.8, 0.2, 0.2) });
    totalLine(`TVA (${tva} %)`, `${formatMoney(tvaAmount, 0)} ${currency}`);
    page.drawRectangle({ x: 330, y: y - 6, width: 215, height: 24, color: blue });
    totalLine("TOTAL TTC", `${formatMoney(total, 0)} ${currency}`, { isBold: true, color: white });

    /* Paiement + notes */
    y -= 18;
    page.drawText("Mode de paiement : " + clean(payment), { x: 50, y, size: 10, font: bold, color: dark });
    y -= 16;
    if (notes.trim()) {
      page.drawText("Notes / Conditions :", { x: 50, y, size: 9, font: bold, color: gray });
      y -= 13;
      clean(notes).split("\n").slice(0, 4).forEach((l) => {
        page.drawText(l.slice(0, 95), { x: 50, y, size: 9, font, color: gray });
        y -= 12;
      });
    }

    if (showBankInfo && bankInfo.trim()) {
      y -= 8;
      page.drawText("Coordonnees bancaires :", { x: 50, y, size: 9, font: bold, color: gray });
      y -= 13;
      clean(bankInfo).split("\n").slice(0, 4).forEach((l) => {
        page.drawText(l.slice(0, 95), { x: 50, y, size: 9, font, color: gray });
        y -= 12;
      });
    }

    /* Pied de page */
    page.drawLine({ start: { x: 50, y: 56 }, end: { x: 545, y: 56 }, thickness: 0.5, color: lightGray });
    page.drawText(`${clean(docTitle)} ${clean(number)} - tools.scryboo.com`, {
      x: 50, y: 42, size: 8, font, color: gray,
    });

    const bytes = await doc.save();
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  };

  /* ---------- Actions ---------- */
  const exportPdf = async () => {
    setBusy("pdf");
    setInfo("");
    try {
      downloadBlob(await buildPdf(), `${number}.pdf`);
      setInfo("✅ Facture PDF téléchargée.");
    } finally {
      setBusy(null);
    }
  };

  // Partage natif (mobile) : envoie le vrai fichier PDF vers WhatsApp, Gmail, etc.
  const shareNative = async () => {
    setBusy("share");
    setInfo("");
    try {
      const blob = await buildPdf();
      const file = new File([blob], `${number}.pdf`, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Facture ${number}`, text: shareText });
        setInfo("✅ Facture partagée.");
      } else {
        downloadBlob(blob, `${number}.pdf`);
        setInfo("ℹ️ Le partage de fichier n'est pas disponible sur ce navigateur — le PDF a été téléchargé. Utilisez les boutons WhatsApp / Gmail ci-dessous.");
      }
    } catch {
      /* partage annulé par l'utilisateur */
    } finally {
      setBusy(null);
    }
  };

  const shareWhatsApp = async () => {
    setBusy("whatsapp");
    setInfo("");
    try {
      const blob = await buildPdf();
      const file = new File([blob], `${number}.pdf`, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      // Sur mobile : partage direct du PDF
      if (nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Facture ${number}`, text: shareText });
          setInfo("✅ Facture partagée.");
          return;
        } catch {
          return; // annulé
        }
      }
      // Sur desktop : téléchargement + ouverture de WhatsApp avec le récapitulatif
      downloadBlob(blob, `${number}.pdf`);
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
      setInfo("ℹ️ PDF téléchargé. WhatsApp s'est ouvert avec le récapitulatif — joignez le fichier téléchargé à votre message.");
    } finally {
      setBusy(null);
    }
  };

  const shareGmail = async () => {
    setBusy("gmail");
    setInfo("");
    try {
      const blob = await buildPdf();
      downloadBlob(blob, `${number}.pdf`);
      const su = encodeURIComponent(`Facture ${number} — ${seller.name}`);
      const bodyTxt = encodeURIComponent(
        `Bonjour ${client.name},\n\nVeuillez trouver ci-joint la facture ${number} d'un montant de ${formatMoney(total, 0)} ${currency} TTC, payable avant le ${frDate(dueDate)} (${payment}).\n\nCordialement,\n${seller.name}\n\n—\nFacture générée avec tools.scryboo.com`
      );
      const win = window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${su}&body=${bodyTxt}`, "_blank", "noopener");
      if (!win) window.location.href = `mailto:${client.email}?subject=${su}&body=${bodyTxt}`;
      setInfo("ℹ️ PDF téléchargé. Gmail s'est ouvert avec le message pré-rempli — joignez le fichier téléchargé avant l'envoi.");
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setSeller(EMPTY_PARTY);
    setClient(EMPTY_PARTY);
    setItems([{ desc: "", qty: 1, unit: cfg.defaultUnit, price: 0 }]);
    setNotes(cfg.defaultNotes);
    setDiscount(0);
    setIssueDate(todayISO());
    setDueDate(todayISO(cfg.defaultDue));
    setNumber(genInvoiceNumber());
    setShowBankInfo(false);
    setBankInfo("");
    setInfo("");
  };

  return (
    <div className="space-y-5">
      {/* Type de business */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Type d'activité</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(BIZ_CONFIGS) as [BizType, typeof cfg][]).map(([key, c]) => (
            <button key={key} onClick={() => switchBiz(key)} aria-pressed={bizType === key}
              className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                bizType === key ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <span className="text-lg">{c.emoji}</span>
              <span>
                <span className={`block text-xs font-semibold ${bizType === key ? "text-blue-700" : "text-gray-800"}`}>{c.label}</span>
                <span className="block text-[10px] text-gray-400 leading-snug mt-0.5">{c.hint.slice(0, 50)}…</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Type de document + numéro + dates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Type de document</span>
          <select value={docTitle} onChange={(e) => setDocTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["FACTURE", "DEVIS", "PROFORMA", "AVOIR", "REÇU", "NOTE D'HONORAIRES"].map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">N° de facture (généré automatiquement)</span>
          <div className="mt-1 flex gap-2">
            <input
              value={number}
              readOnly
              aria-label="Numéro de facture (non modifiable)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-100 text-gray-600 cursor-not-allowed select-all"
            />
            <button
              onClick={() => setNumber(genInvoiceNumber())}
              aria-label="Générer un nouveau numéro"
              title="Générer un nouveau numéro"
              className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Date d'émission</span>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
            aria-label="Date d'émission" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Date d'échéance</span>
          <input type="date" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)}
            aria-label="Date d'échéance" className={inputCls} />
        </label>
      </div>

      {/* Émetteur / client */}
      <div className="grid sm:grid-cols-2 gap-4">
        <PartyFieldsV2
          title="Émetteur (vous)"
          party={seller}
          onChange={setSeller}
          placeholders={cfg.sellerPlaceholders}
          taxIdLabel={cfg.taxIdLabel}
          showTaxId={bizType !== "commerce"}
        />
        <PartyFieldsV2
          title="Client"
          party={client}
          onChange={setClient}
          placeholders={cfg.clientPlaceholders}
          taxIdLabel={cfg.taxIdLabel}
          showTaxId={bizType === "pme" || bizType === "service"}
        />
      </div>

      {/* Paramètres */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Devise</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <NumberField label="Taux TVA (%)" value={tva} onChange={(v) => setTva(Number(v || 0))} min={0} max={60} step={0.01} />
        <NumberField label="Remise (%)" value={discount} onChange={(v) => setDiscount(Number(v || 0))} min={0} max={100} step={0.5} />
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Mode de paiement</span>
          <select value={payment} onChange={(e) => setPayment(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>

      {/* Articles */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Articles / Prestations</p>
        {items.map((it, i) => (
          <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2 relative">
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1} aria-label="Supprimer l'article"
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <input value={it.desc} onChange={(e) => update(i, { desc: e.target.value })} placeholder={`Article ${i + 1} — ex : Création site web`} aria-label={`Description article ${i + 1}`}
              className="w-full pr-8 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-4 gap-2">
              <label className="block">
                <span className="text-[10px] text-gray-400">Qté</span>
                <input type="number" value={it.qty} min={1} onChange={(e) => update(i, { qty: Math.max(1, +e.target.value) })} aria-label="Quantité"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="block">
                <span className="text-[10px] text-gray-400">Unité</span>
                <select value={it.unit} onChange={(e) => update(i, { unit: e.target.value })} aria-label="Unité"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] text-gray-400">Prix unitaire</span>
                <input type="number" value={it.price} min={0} onChange={(e) => update(i, { price: Math.max(0, +e.target.value) })} aria-label="Prix unitaire"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="block">
                <span className="text-[10px] text-gray-400">Total</span>
                <p className="px-2 py-1.5 text-sm font-semibold text-gray-800 tabular-nums">{formatMoney(it.qty * it.price, 0)}</p>
              </label>
            </div>
          </div>
        ))}
        <button onClick={() => setItems([...items, { desc: "", qty: 1, unit: cfg.defaultUnit, price: 0 }])}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-4 h-4" /> Ajouter un article
        </button>
      </div>

      {/* Coordonnées bancaires */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={showBankInfo} onChange={(e) => setShowBankInfo(e.target.checked)} className="accent-blue-600" />
          <span className="font-medium">Ajouter des coordonnées bancaires / Mobile Money</span>
        </label>
        {showBankInfo && (
          <textarea value={bankInfo} onChange={(e) => setBankInfo(e.target.value)}
            placeholder={"Banque : Afriland First Bank\nIBAN : CM21 XXXX XXXX XXXX\nCode SWIFT : CCEI CMCX\n\nOu : Orange Money +237 6XX XX XX XX"}
            aria-label="Coordonnées bancaires"
            className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      {/* Notes */}
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Notes / Conditions de paiement</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={cfg.defaultNotes}
          aria-label="Notes et conditions"
          className="w-full mt-1 h-20 p-3 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </label>

      {/* Récapitulatif */}
      <ResultBox label="Récapitulatif">
        <div className="text-sm space-y-1 tabular-nums">
          <p className="flex justify-between text-gray-600"><span>Sous-total HT</span><span>{formatMoney(subtotal, 0)} {currency}</span></p>
          {discount > 0 && (
            <p className="flex justify-between text-red-500"><span>Remise ({discount} %)</span><span>−{formatMoney(discountAmount, 0)} {currency}</span></p>
          )}
          <p className="flex justify-between text-gray-600"><span>TVA ({tva} %)</span><span>{formatMoney(tvaAmount, 0)} {currency}</span></p>
          <p className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200"><span>Total TTC</span><span>{formatMoney(total, 0)} {currency}</span></p>
          <p className="text-xs text-gray-400 pt-1">Échéance : {frDate(dueDate)} · {payment}</p>
        </div>
      </ResultBox>

      {!canExport && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Pour exporter : renseignez le nom de l'émetteur, le nom du client et au moins un article avec un prix.
        </p>
      )}

      {/* Actions : export + partage */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportPdf}
          disabled={!canExport || busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Télécharger la facture PDF
        </button>
        <button
          onClick={shareWhatsApp}
          disabled={!canExport || busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#25D366] text-white hover:bg-[#1eb858] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "whatsapp" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          Partager sur WhatsApp
        </button>
        <button
          onClick={shareGmail}
          disabled={!canExport || busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "gmail" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Envoyer par Gmail
        </button>
        <button
          onClick={shareNative}
          disabled={!canExport || busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Autres applis
        </button>
        <ClearButton onClick={reset} label="Nouvelle facture" />
      </div>

      {info && (
        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">
          {info}
        </p>
      )}
    </div>
  );
}
