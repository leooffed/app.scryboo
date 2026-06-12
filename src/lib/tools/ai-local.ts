// Moteur "IA" local — fonctionne 100 % dans le navigateur, sans clé API.
// En production, ces fonctions sont remplacées par des appels à l'API Anthropic Claude
// (voir lib/tools/ai.ts côté serveur) avec rate limiting 3 appels/jour/IP.

const STOPWORDS = new Set(
  "le la les un une des du de d l à au aux et ou où mais donc or ni car que qui quoi dont ce cet cette ces se sa son ses leur leurs nous vous ils elles il elle je tu on ne pas plus moins très bien tout tous toute toutes pour par avec sans sous sur dans en est sont était été être avoir a ont fait faire comme aussi alors si quand même autre autres entre vers chez peut peuvent the a an of to in and or is are was were be been it this that".split(
    " "
  )
);

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]+["»)\]]*|\S[^.!?]*$/g)
    ?.map((s) => s.trim())
    .filter((s) => s.length > 10) ?? [];
}

export function summarizeText(text: string, length: "court" | "moyen" | "long" = "moyen"): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return "";
  const target = { court: 3, moyen: 5, long: 10 }[length];
  if (sentences.length <= target) return sentences.join(" ");

  // Fréquence des mots significatifs
  const freq = new Map<string, number>();
  const words = text.toLowerCase().match(/[\p{L}]{3,}/gu) ?? [];
  for (const w of words) {
    if (!STOPWORDS.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  // Score de chaque phrase
  const scored = sentences.map((s, i) => {
    const ws = s.toLowerCase().match(/[\p{L}]{3,}/gu) ?? [];
    let score = 0;
    for (const w of ws) score += freq.get(w) ?? 0;
    score = ws.length ? score / Math.sqrt(ws.length) : 0;
    if (i === 0) score *= 1.5; // la première phrase est souvent clé
    return { s, i, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, target)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
    .join(" ");
}

const CORRECTIONS: [RegExp, string][] = [
  [/\bsa\s+va\b/gi, "ça va"],
  [/\bmalgrés\b/gi, "malgré"],
  [/\bparmis\b/gi, "parmi"],
  [/\bbiensur\b/gi, "bien sûr"],
  [/\bbien\s+sur\b/gi, "bien sûr"],
  [/\bcad\b/gi, "c'est-à-dire"],
  [/\bdaccord\b/gi, "d'accord"],
  [/\bquand\s+même\s+que\b/gi, "bien que"],
  [/\bcomme\s+même\b/gi, "quand même"],
  [/\bau\s+jour\s+d'aujourd'hui\b/gi, "aujourd'hui"],
  [/\bca\b/g, "ça"],
  [/\betre\b/gi, "être"],
  [/\bfrancais(e?s?)\b/gi, "français$1"],
  [/\ba\s+travers\b/gi, "à travers"],
  [/\bneanmoins\b/gi, "néanmoins"],
  [/\bdeja\b/gi, "déjà"],
  [/\btres\b/gi, "très"],
  [/\bapres\b/gi, "après"],
  [/\bmeme\b/g, "même"],
];

export function correctText(text: string): { corrected: string; changes: number } {
  let out = text;
  let changes = 0;

  // Corrections lexicales courantes
  for (const [re, rep] of CORRECTIONS) {
    out = out.replace(re, (m) => {
      changes++;
      return m === m.toUpperCase() && m.length > 2 ? rep.toUpperCase() : rep;
    });
  }

  // Typographie française
  const before = out;
  out = out
    .replace(/ {2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .replace(/([,.])(?=[\p{L}])/gu, "$1 ")
    .replace(/\s*([?!;:])/g, " $1")
    .replace(/'\s+/g, "'");
  if (before !== out) changes++;

  // Majuscules en début de phrase
  out = out.replace(/(^|[.!?]\s+)([\p{Ll}])/gu, (_, p: string, c: string) => {
    changes++;
    return p + c.toUpperCase();
  });

  return { corrected: out, changes };
}

export interface BioParams {
  name: string;
  profession: string;
  skills: string;
  tone: "professionnel" | "décontracté" | "inspirant";
  platform: "linkedin" | "instagram" | "cv";
}

export function generateBio(p: BioParams): string {
  const skills = p.skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const skillsTxt = skills.length > 1 ? skills.slice(0, -1).join(", ") + " et " + skills[skills.length - 1] : skills[0] ?? "";

  if (p.platform === "instagram") {
    const emoji = p.tone === "professionnel" ? "💼" : p.tone === "inspirant" ? "✨" : "👋";
    return `${emoji} ${p.profession}\n🚀 ${skills.slice(0, 3).join(" • ")}\n📩 Collaborations ouvertes — ${p.name}`;
  }

  if (p.platform === "cv") {
    if (p.tone === "professionnel")
      return `${p.profession} rigoureux(se) et orienté(e) résultats, ${p.name} maîtrise ${skillsTxt}. Habitué(e) à travailler en équipe comme en autonomie, avec un fort sens des priorités. Disponible pour mettre cette expertise au service de vos projets.`;
    if (p.tone === "inspirant")
      return `Passionné(e) par son métier de ${p.profession.toLowerCase()}, ${p.name} transforme chaque défi en opportunité grâce à ${skillsTxt}. Convaincu(e) que l'excellence naît de la curiosité, il/elle s'investit pleinement dans chaque mission. Prêt(e) à apporter énergie et impact à votre organisation.`;
    return `${p.name}, ${p.profession.toLowerCase()} qui aime les choses bien faites. À l'aise avec ${skillsTxt}, toujours partant(e) pour apprendre et relever de nouveaux défis. Simple, efficace, fiable.`;
  }

  // LinkedIn
  if (p.tone === "professionnel")
    return `${p.name} — ${p.profession}.\n\nFort(e) d'une expertise en ${skillsTxt}, j'accompagne les organisations dans l'atteinte de leurs objectifs avec rigueur et méthode. Mon approche : comprendre les enjeux métier, proposer des solutions concrètes et mesurer les résultats.\n\nCe qui me distingue : la fiabilité, le sens du détail et une vraie culture du résultat.\n\n📩 N'hésitez pas à me contacter pour échanger sur vos projets.`;
  if (p.tone === "inspirant")
    return `✨ ${p.name} — ${p.profession}\n\nJe crois que chaque projet est une occasion de créer de la valeur et de l'impact. Mon terrain de jeu : ${skillsTxt}.\n\nChaque jour, je m'efforce de repousser les limites, d'apprendre et de partager. Parce que la réussite n'est jamais un hasard, mais le fruit de la passion et de la persévérance.\n\n🚀 Construisons ensemble ce qui compte vraiment.`;
  return `👋 Moi c'est ${p.name}, ${p.profession.toLowerCase()}.\n\nMon quotidien ? ${skillsTxt} — et j'adore ça.\n\nJ'aime les projets concrets, les équipes sympas et les solutions simples qui marchent. Pas de jargon inutile, juste du travail bien fait.\n\n☕ Toujours partant(e) pour un échange — écrivez-moi !`;
}

export interface BusinessNameParams {
  activity: string;
  keywords: string;
  style: "moderne" | "classique" | "créatif";
}

const PREFIX = { moderne: ["Nova", "Zen", "Flux", "Kilo", "Neo", "Volt", "Pixa", "Swift"], classique: ["Maison", "Atelier", "Comptoir", "Groupe", "Cabinet", "Domaine"], créatif: ["Zébra", "Mango", "Koko", "Bantu", "Wazi", "Tika", "Yolo", "Simba"] };
const SUFFIX = { moderne: ["ly", "io", "ify", "Lab", "Hub", "Go", "X", "Up"], classique: [" & Co", " Excellence", " Premium", " Services", " Conseil", " Héritage"], créatif: ["oo", "zi", "ka", " Studio", " Factory", " Tribe", "verse"] };

export function generateBusinessNames(p: BusinessNameParams): string[] {
  const kws = (p.keywords + " " + p.activity)
    .split(/[\s,;]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 2)
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase());
  const base = kws.length ? kws : ["Brand"];
  const prefixes = PREFIX[p.style];
  const suffixes = SUFFIX[p.style];
  const names = new Set<string>();
  let i = 0;
  while (names.size < 10 && i < 100) {
    const kw = base[i % base.length];
    const mode = i % 4;
    if (mode === 0) names.add(prefixes[i % prefixes.length] + kw.toLowerCase());
    else if (mode === 1) names.add(kw + suffixes[i % suffixes.length]);
    else if (mode === 2) names.add(prefixes[(i + 3) % prefixes.length] + " " + kw);
    else names.add(kw.slice(0, Math.max(3, Math.ceil(kw.length / 2))) + suffixes[(i + 2) % suffixes.length]);
    i++;
  }
  return [...names].slice(0, 10);
}

// ---------- Quota gratuit : 3 utilisations / jour / outil ----------
const QUOTA = 3;

export function checkQuota(toolSlug: string): { allowed: boolean; remaining: number } {
  const key = `scryboo-quota-${toolSlug}`;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { date: today, count: 0 };
    if (data.date !== today) return { allowed: true, remaining: QUOTA };
    return { allowed: data.count < QUOTA, remaining: Math.max(0, QUOTA - data.count) };
  } catch {
    return { allowed: true, remaining: QUOTA };
  }
}

export function consumeQuota(toolSlug: string): void {
  const key = `scryboo-quota-${toolSlug}`;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { date: today, count: 0 };
    if (data.date !== today) {
      localStorage.setItem(key, JSON.stringify({ date: today, count: 1 }));
    } else {
      localStorage.setItem(key, JSON.stringify({ date: today, count: data.count + 1 }));
    }
  } catch {
    /* ignore */
  }
}
