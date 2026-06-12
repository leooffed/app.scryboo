import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import React from "react";

/* =====================================================================
 * Authentification & limites d'utilisation — 100 % côté client (MVP).
 * ===================================================================== */

export interface User {
  name: string;
  email: string;
  createdAt: string;
}

const USERS_KEY = "scryboo-users";
const SESSION_KEY = "scryboo-session";
const USAGE_KEY = "scryboo-tool-actions";

/** Actions gratuites par outil avant connexion obligatoire */
export const FREE_LIMIT = 3;

/* ---------- Événement global ---------- */
const AUTH_EVENT = "scryboo-auth-change";
function emit() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/* ---------- Comptes (localStorage) ---------- */
interface StoredUser {
  name: string;
  email: string;
  pass: string;
  createdAt: string;
}

function getUsers(): Record<string, StoredUser> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function encode(pass: string): string {
  return btoa(unescape(encodeURIComponent("scryboo:" + pass)));
}

/* ---------- Session ---------- */
export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

function setSession(user: User | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
  emit();
}

/* ---------- Inscription / Connexion / Déconnexion ---------- */
export function signup(name: string, email: string, password: string): { ok: true } | { ok: false; error: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (name.trim().length < 2) return { ok: false, error: "Veuillez saisir votre nom complet." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return { ok: false, error: "Adresse email invalide." };
  if (password.length < 6) return { ok: false, error: "Le mot de passe doit contenir au moins 6 caractères." };

  const users = getUsers();
  if (users[cleanEmail]) return { ok: false, error: "Un compte existe déjà avec cet email. Connectez-vous." };

  const stored: StoredUser = { name: name.trim(), email: cleanEmail, pass: encode(password), createdAt: new Date().toISOString() };
  users[cleanEmail] = stored;
  saveUsers(users);
  setSession({ name: stored.name, email: stored.email, createdAt: stored.createdAt });
  return { ok: true };
}

export function login(email: string, password: string): { ok: true } | { ok: false; error: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const u = users[cleanEmail];
  if (!u) return { ok: false, error: "Aucun compte trouvé avec cet email. Créez un compte gratuit." };
  if (u.pass !== encode(password)) return { ok: false, error: "Mot de passe incorrect." };
  setSession({ name: u.name, email: u.email, createdAt: u.createdAt });
  return { ok: true };
}

export function logout() { setSession(null); }

/* ---------- Compteur d'ACTIONS par outil ---------- */
function getAllActions(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(USAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

export function getActionCount(slug: string): number {
  return getAllActions()[slug] ?? 0;
}

export function recordAction(slug: string) {
  const all = getAllActions();
  all[slug] = (all[slug] ?? 0) + 1;
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(all)); }
  catch { /* ignore */ }
  emit();
}

export function remainingActions(slug: string): number {
  return Math.max(0, FREE_LIMIT - getActionCount(slug));
}

/* ---------- Hook auth ---------- */
export function useAuth(): User | null {
  const [user, setUser] = useState<User | null>(() => getSession());
  useEffect(() => {
    const sync = () => setUser(getSession());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return user;
}

/* ---------- Contexte pour protéger les actions par outil ---------- */
interface UsageCtxValue {
  /** L'utilisateur est-il bloqué (limite atteinte, non connecté) ? */
  blocked: boolean;
  /** Nombre d'actions restantes (null si connecté = illimité) */
  remaining: number | null;
  /** 
   * Wrapper pour les actions. 
   * Appeler guard(fn) au lieu de fn() directement.
   * Si l'utilisateur est connecté ou qu'il reste des crédits, fn() s'exécute.
   * Sinon, on déclenche l'overlay de blocage.
   */
  guard: (fn: () => void) => void;
  /** Forcer l'affichage de l'overlay (pour les composants qui en ont besoin) */
  showBlock: boolean;
  /** Slug de l'outil courant */
  slug: string;
}

// Default : pas de gate (pour les composants utilisés hors contexte outil)
const UsageContext = createContext<UsageCtxValue>({
  blocked: false, remaining: null, guard: (fn) => fn(), showBlock: false, slug: "",
});

export function useUsageGate(): UsageCtxValue {
  return useContext(UsageContext);
}

export function UsageGateProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const user = useAuth();
  const [tick, setTick] = useState(0);
  const [showBlock, setShowBlock] = useState(false);

  // Re-sync quand l'auth change
  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  const count = getActionCount(slug);
  const isBlocked = !user && count >= FREE_LIMIT;
  const remaining = user ? null : Math.max(0, FREE_LIMIT - count);

  // Si l'utilisateur se connecte, fermer l'overlay
  useEffect(() => {
    if (user) setShowBlock(false);
  }, [user]);

  const guard = useCallback(
    (fn: () => void) => {
      if (user) {
        fn();
        return;
      }
      const current = getActionCount(slug);
      if (current >= FREE_LIMIT) {
        setShowBlock(true);
        return;
      }
      recordAction(slug);
      setTick((t) => t + 1);
      fn();
    },
    [user, slug, tick]
  );

  const value: UsageCtxValue = { blocked: isBlocked, remaining, guard, showBlock, slug };

  return React.createElement(UsageContext.Provider, { value }, children);
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
