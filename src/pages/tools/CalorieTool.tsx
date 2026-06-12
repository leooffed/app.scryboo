import { useEffect, useMemo, useState } from "react";
import { Apple, BookOpen, ChevronDown, ChevronUp, Download, Loader2, MessageCircle, Plus, Search, Trash2, User, X } from "lucide-react";
import { ClearButton } from "../../components/tools/common";
import { useUsageGate } from "../../lib/auth";
import { useSEO } from "../../lib/seo";

/* ═══════════════════════════ BASE DE DONNÉES ═══════════════════════════ */
interface Food { name: string; cal: number; prot: number; carbs: number; fat: number; fiber: number; portion: string; cat: string }

const FOODS: Food[] = [
  // Féculents
  { name: "Riz blanc cuit", cal: 130, prot: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, portion: "100g", cat: "Féculents" },
  { name: "Foufou (manioc)", cal: 160, prot: 0.5, carbs: 38, fat: 0.3, fiber: 1.8, portion: "100g", cat: "Féculents" },
  { name: "Couscous", cal: 112, prot: 3.8, carbs: 23, fat: 0.2, fiber: 1.4, portion: "100g", cat: "Féculents" },
  { name: "Igname bouillie", cal: 118, prot: 1.5, carbs: 28, fat: 0.2, fiber: 3.9, portion: "100g", cat: "Féculents" },
  { name: "Plantain frit (alloco)", cal: 270, prot: 1.2, carbs: 36, fat: 14, fiber: 2.3, portion: "100g", cat: "Féculents" },
  { name: "Attiéké", cal: 120, prot: 0.6, carbs: 28, fat: 0.4, fiber: 1.6, portion: "100g", cat: "Féculents" },
  { name: "Spaghetti cuits", cal: 158, prot: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, portion: "100g", cat: "Féculents" },
  { name: "Pain blanc", cal: 265, prot: 9, carbs: 49, fat: 3.2, fiber: 2.7, portion: "100g", cat: "Féculents" },
  { name: "Pomme de terre", cal: 77, prot: 2, carbs: 17, fat: 0.1, fiber: 2.2, portion: "100g", cat: "Féculents" },
  { name: "Patate douce", cal: 86, prot: 1.6, carbs: 20, fat: 0.1, fiber: 3, portion: "100g", cat: "Féculents" },
  { name: "Mil / Sorgho", cal: 329, prot: 10, carbs: 67, fat: 3.9, fiber: 6.3, portion: "100g", cat: "Féculents" },
  { name: "Maïs bouilli", cal: 96, prot: 3.4, carbs: 21, fat: 1.5, fiber: 2.4, portion: "100g", cat: "Féculents" },
  // Protéines
  { name: "Poulet grillé", cal: 165, prot: 31, carbs: 0, fat: 3.6, fiber: 0, portion: "100g", cat: "Protéines" },
  { name: "Bœuf braisé", cal: 250, prot: 26, carbs: 0, fat: 15, fiber: 0, portion: "100g", cat: "Protéines" },
  { name: "Poisson grillé (tilapia)", cal: 128, prot: 26, carbs: 0, fat: 2.7, fiber: 0, portion: "100g", cat: "Protéines" },
  { name: "Œuf entier", cal: 78, prot: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, portion: "1 œuf (50g)", cat: "Protéines" },
  { name: "Sardine en boîte", cal: 208, prot: 25, carbs: 0, fat: 11, fiber: 0, portion: "100g", cat: "Protéines" },
  { name: "Haricots rouges cuits", cal: 127, prot: 8.7, carbs: 22, fat: 0.5, fiber: 6.4, portion: "100g", cat: "Protéines" },
  { name: "Lentilles cuites", cal: 116, prot: 9, carbs: 20, fat: 0.4, fiber: 7.9, portion: "100g", cat: "Protéines" },
  { name: "Arachides grillées", cal: 567, prot: 26, carbs: 16, fat: 49, fiber: 8.5, portion: "100g", cat: "Protéines" },
  { name: "Viande de chèvre", cal: 143, prot: 27, carbs: 0, fat: 3, fiber: 0, portion: "100g", cat: "Protéines" },
  { name: "Crevettes", cal: 99, prot: 24, carbs: 0.2, fat: 0.3, fiber: 0, portion: "100g", cat: "Protéines" },
  // Légumes & sauces
  { name: "Sauce tomate maison", cal: 50, prot: 1.2, carbs: 8, fat: 1.5, fiber: 1.5, portion: "100g", cat: "Légumes" },
  { name: "Sauce arachide", cal: 180, prot: 7, carbs: 8, fat: 14, fiber: 2, portion: "100g", cat: "Légumes" },
  { name: "Sauce gombo", cal: 45, prot: 2, carbs: 7, fat: 1, fiber: 3.2, portion: "100g", cat: "Légumes" },
  { name: "Ndolé", cal: 85, prot: 5, carbs: 4, fat: 6, fiber: 4, portion: "100g", cat: "Légumes" },
  { name: "Épinards cuits", cal: 23, prot: 2.9, carbs: 3.6, fat: 0.3, fiber: 2.4, portion: "100g", cat: "Légumes" },
  { name: "Salade verte", cal: 15, prot: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, portion: "100g", cat: "Légumes" },
  { name: "Tomate fraîche", cal: 18, prot: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, portion: "100g", cat: "Légumes" },
  { name: "Oignon", cal: 40, prot: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, portion: "100g", cat: "Légumes" },
  { name: "Carotte crue", cal: 41, prot: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, portion: "100g", cat: "Légumes" },
  // Fruits
  { name: "Banane", cal: 89, prot: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, portion: "1 moyenne (120g)", cat: "Fruits" },
  { name: "Mangue", cal: 60, prot: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, portion: "100g", cat: "Fruits" },
  { name: "Papaye", cal: 43, prot: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, portion: "100g", cat: "Fruits" },
  { name: "Orange", cal: 47, prot: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, portion: "1 moyenne", cat: "Fruits" },
  { name: "Ananas", cal: 50, prot: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, portion: "100g", cat: "Fruits" },
  { name: "Pastèque", cal: 30, prot: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, portion: "100g", cat: "Fruits" },
  { name: "Avocat", cal: 160, prot: 2, carbs: 9, fat: 15, fiber: 6.7, portion: "100g", cat: "Fruits" },
  { name: "Noix de coco fraîche", cal: 354, prot: 3.3, carbs: 15, fat: 33, fiber: 9, portion: "100g", cat: "Fruits" },
  // Boissons
  { name: "Jus d'orange frais", cal: 45, prot: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, portion: "200ml", cat: "Boissons" },
  { name: "Coca-Cola", cal: 42, prot: 0, carbs: 11, fat: 0, fiber: 0, portion: "100ml", cat: "Boissons" },
  { name: "Bissap (hibiscus)", cal: 35, prot: 0.2, carbs: 8, fat: 0, fiber: 0.1, portion: "200ml", cat: "Boissons" },
  { name: "Lait entier", cal: 61, prot: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, portion: "100ml", cat: "Boissons" },
  { name: "Café noir", cal: 2, prot: 0.3, carbs: 0, fat: 0, fiber: 0, portion: "200ml", cat: "Boissons" },
  { name: "Bière (33cl)", cal: 140, prot: 1.1, carbs: 11, fat: 0, fiber: 0, portion: "330ml", cat: "Boissons" },
  { name: "Eau", cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0, portion: "200ml", cat: "Boissons" },
  { name: "Gingembre (jus)", cal: 40, prot: 0.3, carbs: 9, fat: 0.1, fiber: 0.2, portion: "200ml", cat: "Boissons" },
  // Snacks
  { name: "Beignet (puff-puff)", cal: 320, prot: 5, carbs: 42, fat: 15, fiber: 1, portion: "100g", cat: "Snacks" },
  { name: "Chips", cal: 536, prot: 7, carbs: 53, fat: 35, fiber: 4.4, portion: "100g", cat: "Snacks" },
  { name: "Chocolat noir", cal: 546, prot: 5, carbs: 60, fat: 31, fiber: 7, portion: "100g", cat: "Snacks" },
  { name: "Biscuit sec", cal: 440, prot: 6, carbs: 68, fat: 16, fiber: 2, portion: "100g", cat: "Snacks" },
  // Plats complets
  { name: "Thiéboudiène", cal: 280, prot: 15, carbs: 35, fat: 9, fiber: 3, portion: "300g", cat: "Plats" },
  { name: "Poulet DG", cal: 320, prot: 20, carbs: 25, fat: 16, fiber: 3, portion: "300g", cat: "Plats" },
  { name: "Jollof rice", cal: 260, prot: 8, carbs: 40, fat: 8, fiber: 2, portion: "300g", cat: "Plats" },
  { name: "Garba (attiéké thon)", cal: 310, prot: 18, carbs: 32, fat: 12, fiber: 2, portion: "300g", cat: "Plats" },
  { name: "Eru & water fufu", cal: 350, prot: 12, carbs: 40, fat: 16, fiber: 5, portion: "300g", cat: "Plats" },
  { name: "Riz sauce légumes", cal: 240, prot: 6, carbs: 42, fat: 5, fiber: 3, portion: "300g", cat: "Plats" },
];

const CATEGORIES_FOOD = ["Tous", "Féculents", "Protéines", "Légumes", "Fruits", "Boissons", "Snacks", "Plats"];
const MEALS = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"] as const;
type Meal = typeof MEALS[number];

interface MealEntry { id: string; food: Food; qty: number; meal: Meal; note: string }

interface UserProfile { name: string; age: string; weight: string; height: string; gender: "homme" | "femme"; activity: "sedentaire" | "leger" | "modere" | "actif" | "intense"; goal: "perte" | "maintien" | "prise" }

const EMPTY_PROFILE: UserProfile = { name: "", age: "", weight: "", height: "", gender: "homme", activity: "modere", goal: "maintien" };

const STORAGE_KEY = "scryboo-calories-v2";
const PROFILE_KEY = "scryboo-calories-profile";

function calcGoal(p: UserProfile): number {
  const w = Number(p.weight) || 70, h = Number(p.height) || 170, a = Number(p.age) || 30;
  // Mifflin-St Jeor
  let bmr = p.gender === "homme" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const factors: Record<string, number> = { sedentaire: 1.2, leger: 1.375, modere: 1.55, actif: 1.725, intense: 1.9 };
  let tdee = bmr * (factors[p.activity] || 1.55);
  if (p.goal === "perte") tdee -= 400;
  if (p.goal === "prise") tdee += 400;
  return Math.round(tdee);
}

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

// redirect


/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export function CompteurCalories() {
  const { guard } = useUsageGate();

  useSEO({
    title: "Compteur de calories - Scryboo",
    description: "Suivez facilement votre apport calorique quotidien avec notre outil de comptage de calories en ligne gratuit.",
    canonical: "/tools/calories",
  });

  // Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try { const r = localStorage.getItem(PROFILE_KEY); return r ? { ...EMPTY_PROFILE, ...JSON.parse(r) } : EMPTY_PROFILE; } catch { return EMPTY_PROFILE; }
  });
  const [showProfile, setShowProfile] = useState(false);

  // Entries
  const [entries, setEntries] = useState<MealEntry[]>(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [activeMeal, setActiveMeal] = useState<Meal>("Déjeuner");

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tous");

  // Custom food
  const [showCustom, setShowCustom] = useState(false);
  const [customFood, setCustomFood] = useState<Food>({ name: "", cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0, portion: "100g", cat: "Plats" });

  // Misc
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [expandedMeal, setExpandedMeal] = useState<Meal | null>(null);

  // Persist
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {} }, [entries]);
  useEffect(() => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {} }, [profile]);

  const goal = calcGoal(profile);

  const filtered = useMemo(() => {
    let list = FOODS;
    if (catFilter !== "Tous") list = list.filter((f) => f.cat === catFilter);
    const q = search.toLowerCase().trim();
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q));
    return list;
  }, [search, catFilter]);

  const addFood = (food: Food) => {
    setEntries((e) => [...e, { id: uid(), food, qty: 1, meal: activeMeal, note: "" }]);
    setShowSearch(false);
    setSearch("");
  };

  const addCustom = () => {
    if (!customFood.name.trim() || customFood.cal <= 0) return;
    addFood({ ...customFood });
    setCustomFood({ name: "", cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0, portion: "100g", cat: "Plats" });
    setShowCustom(false);
  };

  const updateEntry = (id: string, patch: Partial<MealEntry>) =>
    setEntries((es) => es.map((e) => e.id === id ? { ...e, ...patch } : e));

  const totals = useMemo(() => {
    const t = { cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0 };
    entries.forEach((e) => {
      t.cal += e.food.cal * e.qty; t.prot += e.food.prot * e.qty;
      t.carbs += e.food.carbs * e.qty; t.fat += e.food.fat * e.qty;
      t.fiber += e.food.fiber * e.qty;
    });
    return t;
  }, [entries]);

  const mealTotals = (meal: Meal) => {
    let cal = 0, count = 0;
    entries.filter((e) => e.meal === meal).forEach((e) => { cal += e.food.cal * e.qty; count++; });
    return { cal, count };
  };

  const pct = goal > 0 ? Math.min(100, Math.round((totals.cal / goal) * 100)) : 0;

  /* ─── PDF Export ─── */
  const exportPdf = async () => {
    setBusy("pdf"); setInfo("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const blue = rgb(0.15, 0.39, 0.92);
      const dark = rgb(0.12, 0.16, 0.22);
      const gray = rgb(0.45, 0.47, 0.52);
      const white = rgb(1, 1, 1);
      const green = rgb(0.09, 0.64, 0.35);
      const clean = (s: string) => s.replace(/[^\x20-\x7EÀ-ÿ]/g, "");

      let page = doc.addPage([595, 842]);
      let y = 790;
      const newPg = () => { page = doc.addPage([595, 842]); y = 790; };

      // Header
      page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: blue });
      page.drawText("CARNET NUTRITIONNEL", { x: 50, y: 805, size: 22, font: bold, color: white });
      page.drawText(`Date : ${date} · Genere avec tools.scryboo.com`, { x: 50, y: 785, size: 9, font, color: white });
      if (profile.name) page.drawText(`Patient : ${clean(profile.name)}`, { x: 50, y: 770, size: 10, font: bold, color: white });

      // Profile summary
      y = 740;
      if (profile.weight || profile.height || profile.age) {
        page.drawText("PROFIL DU PATIENT", { x: 50, y, size: 9, font: bold, color: gray });
        y -= 16;
        const pLines = [
          profile.name ? `Nom : ${clean(profile.name)}` : "",
          profile.age ? `Age : ${profile.age} ans` : "",
          profile.gender === "homme" ? "Sexe : Homme" : "Sexe : Femme",
          profile.weight ? `Poids : ${profile.weight} kg` : "",
          profile.height ? `Taille : ${profile.height} cm` : "",
          `Objectif : ${profile.goal === "perte" ? "Perte de poids" : profile.goal === "prise" ? "Prise de masse" : "Maintien"}`,
          `Objectif calorique : ${goal} kcal/jour`,
        ].filter(Boolean);
        pLines.forEach((l) => { page.drawText(l, { x: 60, y, size: 9, font, color: dark }); y -= 13; });
        y -= 10;
      }

      // Daily summary
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 22, color: blue });
      page.drawText("RESUME DE LA JOURNEE", { x: 58, y, size: 9, font: bold, color: white });
      y -= 26;
      const summary = [
        `Calories : ${Math.round(totals.cal)} / ${goal} kcal (${pct}%)`,
        `Proteines : ${fmt(totals.prot)}g · Glucides : ${fmt(totals.carbs)}g · Lipides : ${fmt(totals.fat)}g · Fibres : ${fmt(totals.fiber)}g`,
        `Eau : ${waterGlasses} verre(s) (${waterGlasses * 250}ml)`,
      ];
      summary.forEach((l) => { page.drawText(l, { x: 58, y, size: 9, font, color: dark }); y -= 14; });
      y -= 14;

      // Meals detail
      for (const meal of MEALS) {
        const mealEntries = entries.filter((e) => e.meal === meal);
        if (mealEntries.length === 0) continue;
        if (y < 120) newPg();
        page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.95, 0.97, 0.98) });
        page.drawText(clean(meal.toUpperCase()), { x: 58, y, size: 9, font: bold, color: blue });
        const mt = mealTotals(meal);
        page.drawText(`${mt.cal} kcal`, { x: 480, y, size: 9, font: bold, color: dark });
        y -= 22;
        for (const e of mealEntries) {
          if (y < 60) newPg();
          page.drawText(`${clean(e.food.name)} (x${e.qty})`, { x: 68, y, size: 9, font, color: dark });
          page.drawText(`${Math.round(e.food.cal * e.qty)} kcal`, { x: 440, y, size: 9, font, color: gray });
          y -= 13;
          page.drawText(`P:${fmt(e.food.prot * e.qty)}g  G:${fmt(e.food.carbs * e.qty)}g  L:${fmt(e.food.fat * e.qty)}g  F:${fmt(e.food.fiber * e.qty)}g`, { x: 68, y, size: 7.5, font, color: gray });
          if (e.note) { y -= 11; page.drawText(`Note : ${clean(e.note).slice(0, 60)}`, { x: 68, y, size: 7.5, font, color: green }); }
          y -= 16;
        }
        y -= 6;
      }

      // Footer
      page.drawLine({ start: { x: 50, y: 56 }, end: { x: 545, y: 56 }, thickness: 0.5, color: gray });
      page.drawText("Document a usage medical — genere avec tools.scryboo.com", { x: 50, y: 42, size: 8, font, color: gray });

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `carnet-nutritionnel-${date}.pdf`; a.click();
      setInfo("✅ Carnet nutritionnel PDF téléchargé — prêt pour votre médecin.");
    } catch { setInfo("⚠️ Erreur lors de l'export."); }
    finally { setBusy(null); }
  };

  const exportCsv = () => {
    const header = "Date;Repas;Aliment;Portion;Quantité;Calories;Protéines(g);Glucides(g);Lipides(g);Fibres(g);Note";
    const lines = entries.map((e) => `${date};${e.meal};${e.food.name};${e.food.portion};${e.qty};${Math.round(e.food.cal * e.qty)};${fmt(e.food.prot * e.qty)};${fmt(e.food.carbs * e.qty)};${fmt(e.food.fat * e.qty)};${fmt(e.food.fiber * e.qty)};${e.note}`);
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `calories-${date}.csv`; a.click();
    setInfo("✅ CSV exporté.");
  };

  const shareWhatsApp = async () => {
    const text = [
      `📊 Carnet nutritionnel — ${date}`,
      `Patient : ${profile.name || "Non renseigné"}`,
      `Calories : ${Math.round(totals.cal)} / ${goal} kcal (${pct}%)`,
      `P: ${fmt(totals.prot)}g · G: ${fmt(totals.carbs)}g · L: ${fmt(totals.fat)}g`,
      `Eau : ${waterGlasses} verres`,
      "", ...MEALS.map((m) => {
        const me = entries.filter((e) => e.meal === m);
        if (!me.length) return "";
        return `🍽 ${m} (${mealTotals(m).cal} kcal)\n${me.map((e) => `  - ${e.food.name} x${e.qty} (${Math.round(e.food.cal * e.qty)} kcal)`).join("\n")}`;
      }).filter(Boolean),
      "", "Généré avec tools.scryboo.com",
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const inputCls = "w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      {/* ═══ PROFIL PATIENT ═══ */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl overflow-hidden">
        <button onClick={() => setShowProfile(!showProfile)}
          className="w-full flex items-center justify-between px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-800">{profile.name || "Mon profil"}</span>
            {profile.weight && <span className="text-xs text-gray-400">· {profile.weight}kg · Obj: {goal} kcal</span>}
          </div>
          {showProfile ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showProfile && (
          <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-green-100 pt-3">
            <label className="block"><span className="text-xs font-medium text-gray-600">Nom complet</span>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Pour le carnet médical" className={inputCls} /></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Âge</span>
              <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} placeholder="30" className={inputCls} /></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Poids (kg)</span>
              <input type="number" value={profile.weight} onChange={(e) => setProfile({ ...profile, weight: e.target.value })} placeholder="70" className={inputCls} /></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Taille (cm)</span>
              <input type="number" value={profile.height} onChange={(e) => setProfile({ ...profile, height: e.target.value })} placeholder="170" className={inputCls} /></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Sexe</span>
              <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value as UserProfile["gender"] })} className={inputCls + " bg-white"}>
                <option value="homme">Homme</option><option value="femme">Femme</option>
              </select></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Activité physique</span>
              <select value={profile.activity} onChange={(e) => setProfile({ ...profile, activity: e.target.value as UserProfile["activity"] })} className={inputCls + " bg-white"}>
                <option value="sedentaire">Sédentaire</option><option value="leger">Légère</option><option value="modere">Modérée</option><option value="actif">Active</option><option value="intense">Intense</option>
              </select></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Objectif</span>
              <select value={profile.goal} onChange={(e) => setProfile({ ...profile, goal: e.target.value as UserProfile["goal"] })} className={inputCls + " bg-white"}>
                <option value="perte">Perte de poids</option><option value="maintien">Maintien</option><option value="prise">Prise de masse</option>
              </select></label>
            <div className="flex items-end">
              <p className="text-xs text-green-700 bg-green-100 rounded-lg px-3 py-2 w-full text-center font-semibold">
                🎯 Objectif calculé : {goal} kcal/jour
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ DATE + BARRE DE PROGRESSION ═══ */}
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-sm font-bold text-gray-800 tabular-nums">{Math.round(totals.cal)} <span className="text-xs font-normal text-gray-400">/ {goal} kcal</span></p>
            <p className={`text-xs font-semibold ${pct >= 100 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-green-600"}`}>{pct}%</p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ═══ MACROS ═══ */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Protéines", val: totals.prot, unit: "g", color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "Glucides", val: totals.carbs, unit: "g", color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "Lipides", val: totals.fat, unit: "g", color: "text-red-500 bg-red-50 border-red-200" },
          { label: "Fibres", val: totals.fiber, unit: "g", color: "text-green-600 bg-green-50 border-green-200" },
          { label: "Eau", val: waterGlasses * 250, unit: "ml", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border p-2 text-center ${m.color}`}>
            <p className="text-lg font-bold tabular-nums">{fmt(m.val)}</p>
            <p className="text-[10px]">{m.unit} {m.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ EAU ═══ */}
      <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2.5">
        <span className="text-lg">💧</span>
        <span className="text-sm font-medium text-cyan-800 flex-1">Eau : {waterGlasses} verre{waterGlasses > 1 ? "s" : ""} ({waterGlasses * 250}ml)</span>
        <div className="flex gap-1">
          <button onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))} className="w-8 h-8 rounded-lg border border-cyan-300 text-cyan-700 flex items-center justify-center hover:bg-cyan-100 text-sm font-bold">−</button>
          <button onClick={() => setWaterGlasses(waterGlasses + 1)} className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 text-sm font-bold">+</button>
        </div>
      </div>

      {/* ═══ REPAS ═══ */}
      {MEALS.map((meal) => {
        const me = entries.filter((e) => e.meal === meal);
        const mt = mealTotals(meal);
        const isExpanded = expandedMeal === meal || activeMeal === meal;
        return (
          <div key={meal} className={`border rounded-2xl overflow-hidden transition-all ${activeMeal === meal ? "border-blue-300 shadow-sm" : "border-gray-200"}`}>
            <button onClick={() => { setActiveMeal(meal); setExpandedMeal(isExpanded && activeMeal === meal ? null : meal); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left ${activeMeal === meal ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{meal === "Petit-déjeuner" ? "🌅" : meal === "Déjeuner" ? "☀️" : meal === "Dîner" ? "🌙" : "🍪"}</span>
                <span className={`text-sm font-semibold ${activeMeal === meal ? "text-blue-700" : "text-gray-700"}`}>{meal}</span>
                {mt.count > 0 && <span className="text-xs text-gray-400">{mt.count} alim.</span>}
              </div>
              <div className="flex items-center gap-2">
                {mt.cal > 0 && <span className="text-sm font-bold tabular-nums text-gray-700">{mt.cal} kcal</span>}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
                {me.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5"><Apple className="w-4 h-4" /></span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.food.name}</p>
                        <span className="text-sm font-bold text-gray-700 tabular-nums shrink-0">{Math.round(e.food.cal * e.qty)} kcal</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{e.food.portion} · P:{fmt(e.food.prot * e.qty)}g G:{fmt(e.food.carbs * e.qty)}g L:{fmt(e.food.fat * e.qty)}g F:{fmt(e.food.fiber * e.qty)}g</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateEntry(e.id, { qty: Math.max(0.25, e.qty - 0.25) })}
                            className="w-6 h-6 rounded border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 text-xs">−</button>
                          <span className="text-xs font-medium tabular-nums w-8 text-center">{e.qty}</span>
                          <button onClick={() => updateEntry(e.id, { qty: e.qty + 0.25 })}
                            className="w-6 h-6 rounded border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 text-xs">+</button>
                        </div>
                        <input value={e.note} onChange={(ev) => updateEntry(e.id, { note: ev.target.value })}
                          placeholder="Note pour le médecin…" className="flex-1 px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button onClick={() => setEntries(entries.filter((x) => x.id !== e.id))}
                          className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {me.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Aucun aliment ajouté.</p>}
                <button onClick={() => { setActiveMeal(meal); setShowSearch(true); }}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-xs font-medium hover:bg-blue-50 flex items-center justify-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter un aliment
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* ═══ SEARCH MODAL ═══ */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowSearch(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">Ajouter au {activeMeal.toLowerCase()}</p>
                <button onClick={() => setShowSearch(false)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Rechercher… (riz, poulet, mangue…)"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {CATEGORIES_FOOD.map((c) => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${catFilter === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filtered.map((f, i) => (
                <button key={i} onClick={() => addFood(f)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{f.portion} · P:{f.prot}g G:{f.carbs}g L:{f.fat}g · {f.cat}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-600 tabular-nums shrink-0">{f.cal} kcal</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Aucun aliment trouvé.</p>}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button onClick={() => { setShowSearch(false); setShowCustom(true); }}
                className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Ajouter un aliment personnalisé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CUSTOM FOOD MODAL ═══ */}
      {showCustom && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCustom(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-gray-900">Ajouter un aliment personnalisé</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2"><span className="text-xs font-medium text-gray-600">Nom de l'aliment *</span>
                <input value={customFood.name} onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })} placeholder="Ex : Ma recette spéciale" className={inputCls} /></label>
              <label className="block"><span className="text-xs font-medium text-gray-600">Calories (kcal) *</span>
                <input type="number" value={customFood.cal || ""} onChange={(e) => setCustomFood({ ...customFood, cal: +e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-medium text-gray-600">Portion</span>
                <input value={customFood.portion} onChange={(e) => setCustomFood({ ...customFood, portion: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-medium text-gray-600">Protéines (g)</span>
                <input type="number" value={customFood.prot || ""} onChange={(e) => setCustomFood({ ...customFood, prot: +e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-medium text-gray-600">Glucides (g)</span>
                <input type="number" value={customFood.carbs || ""} onChange={(e) => setCustomFood({ ...customFood, carbs: +e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-medium text-gray-600">Lipides (g)</span>
                <input type="number" value={customFood.fat || ""} onChange={(e) => setCustomFood({ ...customFood, fat: +e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-medium text-gray-600">Fibres (g)</span>
                <input type="number" value={customFood.fiber || ""} onChange={(e) => setCustomFood({ ...customFood, fiber: +e.target.value })} className={inputCls} /></label>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addCustom} disabled={!customFood.name.trim() || customFood.cal <= 0}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">Ajouter</button>
              <button onClick={() => setShowCustom(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXPORT / PARTAGE ═══ */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Carnet nutritionnel — export & partage
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => guard(exportPdf)} disabled={busy !== null || entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 transition-all">
            {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Carnet PDF (médecin)
          </button>
          <button onClick={() => guard(exportCsv)} disabled={entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40 transition-all">
            <Download className="w-4 h-4" /> CSV (Excel)
          </button>
          <button onClick={() => guard(shareWhatsApp)} disabled={entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg bg-[#25D366] text-white hover:bg-[#1eb858] active:scale-[0.98] disabled:opacity-40 transition-all">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <ClearButton onClick={() => { setEntries([]); setWaterGlasses(0); setInfo(""); }} label="Vider la journée" />
        </div>
      </div>
      {info && <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">{info}</p>}
    </div>
  );
}
