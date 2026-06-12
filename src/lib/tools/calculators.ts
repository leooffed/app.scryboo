// ---------- IMC ----------
export function computeBMI(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  if (!weightKg || !h) return null;
  const bmi = weightKg / (h * h);
  let category = "";
  let color = "";
  if (bmi < 16.5) { category = "Dénutrition"; color = "text-red-600"; }
  else if (bmi < 18.5) { category = "Insuffisance pondérale"; color = "text-amber-600"; }
  else if (bmi < 25) { category = "Corpulence normale"; color = "text-green-600"; }
  else if (bmi < 30) { category = "Surpoids"; color = "text-amber-600"; }
  else if (bmi < 35) { category = "Obésité modérée"; color = "text-orange-600"; }
  else if (bmi < 40) { category = "Obésité sévère"; color = "text-red-600"; }
  else { category = "Obésité morbide"; color = "text-red-700"; }
  const idealMin = 18.5 * h * h;
  const idealMax = 24.9 * h * h;
  return { bmi: Math.round(bmi * 10) / 10, category, color, idealMin: Math.round(idealMin), idealMax: Math.round(idealMax) };
}

// ---------- Prêt ----------
export interface AmortRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export function computeLoan(amount: number, annualRatePct: number, years: number) {
  const n = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  if (!amount || !n) return null;
  const monthly = r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));
  const totalPaid = monthly * n;
  const totalInterest = totalPaid - amount;
  const rows: AmortRow[] = [];
  let balance = amount;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const principal = monthly - interest;
    balance = Math.max(0, balance - principal);
    rows.push({ month: m, payment: monthly, interest, principal, balance });
  }
  return { monthly, totalPaid, totalInterest, n, rows };
}

// ---------- TVA ----------
export const TVA_RATES = [
  { label: "Cameroun — 19,25 %", value: 19.25 },
  { label: "Côte d'Ivoire — 18 %", value: 18 },
  { label: "Sénégal — 18 %", value: 18.0001 },
  { label: "Gabon — 18 %", value: 18.0002 },
  { label: "RD Congo — 16 %", value: 16 },
  { label: "France — 20 %", value: 20 },
  { label: "France réduit — 10 %", value: 10 },
  { label: "Maroc — 20 %", value: 20.0001 },
];

export function computeVAT(amount: number, ratePct: number, direction: "ht-to-ttc" | "ttc-to-ht") {
  const rate = ratePct / 100;
  if (direction === "ht-to-ttc") {
    const ht = amount;
    const tva = ht * rate;
    return { ht, tva, ttc: ht + tva };
  }
  const ttc = amount;
  const ht = ttc / (1 + rate);
  return { ht, tva: ttc - ht, ttc };
}

// ---------- Devises ----------
// Taux indicatifs (base : 1 USD), mis à jour si l'API répond.
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  XAF: 603.5, // FCFA (CEMAC)
  XOF: 603.5, // FCFA (UEMOA)
  GBP: 0.79,
  CHF: 0.88,
  CAD: 1.36,
  NGN: 1550,
  GHS: 15.4,
  MAD: 9.95,
  DZD: 134.5,
  TND: 3.11,
  EGP: 48.5,
  ZAR: 18.2,
  KES: 129,
  CNY: 7.24,
  JPY: 155,
  AED: 3.67,
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: "Dollar américain",
  EUR: "Euro",
  XAF: "Franc CFA (CEMAC)",
  XOF: "Franc CFA (UEMOA)",
  GBP: "Livre sterling",
  CHF: "Franc suisse",
  CAD: "Dollar canadien",
  NGN: "Naira nigérian",
  GHS: "Cedi ghanéen",
  MAD: "Dirham marocain",
  DZD: "Dinar algérien",
  TND: "Dinar tunisien",
  EGP: "Livre égyptienne",
  ZAR: "Rand sud-africain",
  KES: "Shilling kényan",
  CNY: "Yuan chinois",
  JPY: "Yen japonais",
  AED: "Dirham émirati",
};

export async function fetchRates(): Promise<{ rates: Record<string, number>; live: boolean }> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("api");
    const data = await res.json();
    if (data && data.rates) {
      const rates: Record<string, number> = {};
      for (const code of Object.keys(FALLBACK_RATES)) {
        rates[code] = data.rates[code] ?? FALLBACK_RATES[code];
      }
      return { rates, live: true };
    }
    throw new Error("bad");
  } catch {
    return { rates: FALLBACK_RATES, live: false };
  }
}

export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>) {
  if (!rates[from] || !rates[to]) return 0;
  return (amount / rates[from]) * rates[to];
}

export function formatMoney(n: number, decimals = 2): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
