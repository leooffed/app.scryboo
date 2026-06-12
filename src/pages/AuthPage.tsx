import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Infinity as InfinityIcon, Loader2, Lock, Mail, ShieldCheck, Sparkles, User as UserIcon, Wrench, Zap } from "lucide-react";
import { login, signup, useAuth } from "../lib/auth";
import { TOOLS_REGISTRY } from "../lib/tools-registry";
import { useSEO } from "../lib/seo";

useSEO({
  title: "Connexion ou inscription - Scryboo",
  description: "Accédez à votre compte Scryboo pour utiliser tous nos outils gratuitement.",
  canonical: "/auth",
});

type Mode = "login" | "signup";

const PERKS = [
  { icon: InfinityIcon, text: "Utilisation illimitée des 43 outils" },
  { icon: Zap, text: "Accès prioritaire aux nouveaux outils" },
  { icon: Sparkles, text: "Quota IA augmenté prochainement" },
  { icon: ShieldCheck, text: "Vos données restent dans votre navigateur" },
];

const inputWrapCls =
  "flex items-center gap-2.5 px-3.5 border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all";
const inputCls = "flex-1 py-3 text-sm focus:outline-none bg-transparent";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = mode === "signup"
      ? "Créer un compte gratuit — Scryboo Tools"
      : "Connexion — Scryboo Tools";
    window.scrollTo(0, 0);
  }, [mode]);

  // Déjà connecté → redirection
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    // Petite latence pour une UX fluide
    await new Promise((r) => setTimeout(r, 500));
    const res = mode === "signup" ? signup(name, email, password) : login(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-12">
      <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-gray-100 shadow-xl shadow-blue-600/5 bg-white">

        {/* ===== Panneau branding (gauche) ===== */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 text-white overflow-hidden">
          {/* Décor */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 lg:mb-12" aria-label="Retour à l'accueil">
              <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </span>
              <span className="font-bold text-lg">Scryboo <span className="text-blue-200">Tools</span></span>
            </Link>

            <p className="inline-block text-[11px] font-semibold uppercase tracking-wider bg-white/15 backdrop-blur px-3 py-1 rounded-full mb-4">
              Compte gratuit · Pour toujours
            </p>
            <h1 className="text-2xl lg:text-4xl font-bold leading-tight">
              Débloquez l'accès<br />illimité à vos outils
            </h1>
            <p className="text-blue-100/90 mt-3 text-sm lg:text-base max-w-sm">
              Sans compte, chaque outil est limité à 3 utilisations. Créez votre compte
              gratuit en 30 secondes et continuez sans interruption.
            </p>

            <ul className="mt-8 space-y-3.5">
              {PERKS.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                    <p.icon className="w-4 h-4" />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>

            <div className="hidden lg:flex items-center gap-6 mt-12 pt-8 border-t border-white/15">
              <div>
                <p className="text-2xl font-bold">{TOOLS_REGISTRY.length}</p>
                <p className="text-xs text-blue-200">outils gratuits</p>
              </div>
              <div>
                <p className="text-2xl font-bold">100 %</p>
                <p className="text-xs text-blue-200">traitement local</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0 FCFA</p>
                <p className="text-xs text-blue-200">pour toujours</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Formulaire (droite) ===== */}
        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Onglets */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7 max-w-xs">
            {([["signup", "Créer un compte"], ["login", "Connexion"]] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                aria-pressed={mode === m}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            {mode === "signup" ? "Bienvenue sur Scryboo 👋" : "Heureux de vous revoir 👋"}
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {mode === "signup"
              ? "Gratuit, sans carte bancaire, en 30 secondes."
              : "Connectez-vous pour retrouver votre accès illimité."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Nom complet</span>
                <div className={`${inputWrapCls} mt-1`}>
                  <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aïcha Diallo"
                    autoComplete="name"
                    className={inputCls}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Adresse email</span>
              <div className={`${inputWrapCls} mt-1`}>
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  required
                  className={inputCls}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Mot de passe</span>
              <div className={`${inputWrapCls} mt-1`}>
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "6 caractères minimum" : "Votre mot de passe"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5" aria-live="polite">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "signup" ? "Créer mon compte gratuit" : "Se connecter"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-5 flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
            Votre compte est stocké localement dans votre navigateur. Aucune donnée
            n'est transmise à un serveur — conforme RGPD par conception.
          </p>

          <p className="text-sm text-gray-500 mt-6 text-center">
            {mode === "signup" ? (
              <>Déjà un compte ?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="text-blue-600 font-medium hover:text-blue-700">
                  Connectez-vous
                </button>
              </>
            ) : (
              <>Pas encore de compte ?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} className="text-blue-600 font-medium hover:text-blue-700">
                  Inscrivez-vous gratuitement
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
