// ---------- Base64 ----------
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function decodeBase64(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ---------- Mot de passe ----------
export interface PasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/",
};
const AMBIGUOUS = "Il1O0o|`'\"";

export function generatePassword(opts: PasswordOptions): string {
  let pool = "";
  const required: string[] = [];
  (["upper", "lower", "digits", "symbols"] as const).forEach((k) => {
    if (opts[k]) {
      let set = SETS[k];
      if (opts.excludeAmbiguous) set = [...set].filter((c) => !AMBIGUOUS.includes(c)).join("");
      pool += set;
      required.push(set);
    }
  });
  if (!pool) return "";
  const rand = (max: number) => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  };
  const chars: string[] = [];
  required.forEach((set) => chars.push(set[rand(set.length)]));
  while (chars.length < opts.length) chars.push(pool[rand(pool.length)]);
  // mélange Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, opts.length).join("");
}

export function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: "Faible", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Moyen", color: "bg-amber-500" };
  return { score, label: "Fort", color: "bg-green-500" };
}

// ---------- JSON ----------
export function formatJSON(input: string, indent: number): { ok: true; result: string } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, result: JSON.stringify(parsed, null, indent) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JSON invalide" };
  }
}

export function minifyJSON(input: string): { ok: true; result: string } | { ok: false; error: string } {
  try {
    return { ok: true, result: JSON.stringify(JSON.parse(input)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JSON invalide" };
  }
}

// ---------- Couleurs ----------
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const k = 1 - Math.max(r, g, b) / 255;
  const c = (1 - r / 255 - k) / (1 - k);
  const m = (1 - g / 255 - k) / (1 - k);
  const y = (1 - b / 255 - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}
