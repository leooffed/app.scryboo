import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { getTool, type Tool } from "../lib/tools-registry";
import { ToolLayout } from "../components/tools/ToolLayout";
import { FREE_LIMIT, useAuth, UsageGateProvider, useUsageGate } from "../lib/auth";
import {
  CompteurMots, GenerateurLorem, ConvertisseurCasse, SupprimerDoublons, ExtracteurEmails,
} from "./tools/TextTools";
import { CompresseurImage, ConvertisseurFormat, Redimensionneur } from "./tools/ImageTools";
import { FusionnerPdf, SplitterPdf, PdfVersWord } from "./tools/PdfTools";
import { ModifierPdf, JpgEnPdf, DeverrouillerPdf, ComparerPdf } from "./tools/PdfToolsExtra";
import { OrganiserPdf, NumerosPages, ProtegerPdf, SignerPdf, RognerPdf, ReparerPdf, HtmlEnPdf } from "./tools/PdfToolsPro";
import {
  CalculateurIMC, SimulateurPret, ConvertisseurDevises, CalculateurTVA, GenerateurFacture,
} from "./tools/CalcTools";
import { EncodeurBase64, GenerateurMotDePasse, FormateurJSON, ConvertisseurCouleur } from "./tools/DevTools";
import { GenerateurQrCode } from "./tools/QrCodeTool";
import { CompteurCalories } from "./tools/CalorieTool";
import { ComparateurApps } from "./tools/AppCompareTool";
import { ConstructeurSite } from "./tools/SiteBuilderTool";
import { AnnuaireApps } from "./tools/DirectoryTool";
import { ResumeurTexte, CorrecteurOrthographe, GenerateurBio, GenerateurNomBusiness } from "./tools/AiTools";
import { CreateurCV } from "./tools/CvTool";
import { CreateurLogo } from "./tools/LogoTool";
import { CreateurDesign } from "./tools/DesignTool";

import { useSEO } from "../lib/seo";

useSEO({
  title: "Outils en ligne gratuits - Scryboo",
  description: "Découvrez nos outils gratuits en ligne pour améliorer votre productivité.",
  canonical: "/tools",
});

const COMPONENTS: Record<string, React.ComponentType> = {
  "createur-cv": CreateurCV,
  "createur-logo": CreateurLogo,
  "createur-design": CreateurDesign,
  "compteur-mots": CompteurMots,
  "generateur-lorem": GenerateurLorem,
  "convertisseur-casse": ConvertisseurCasse,
  "supprimer-doublons": SupprimerDoublons,
  "extracteur-emails": ExtracteurEmails,
  "compresseur-image": CompresseurImage,
  "convertisseur-format": ConvertisseurFormat,
  "redimensionneur": Redimensionneur,
  "fusionner-pdf": FusionnerPdf,
  "splitter-pdf": SplitterPdf,
  "pdf-vers-word": PdfVersWord,
  "modifier-pdf": ModifierPdf,
  "jpg-en-pdf": JpgEnPdf,
  "deverrouiller-pdf": DeverrouillerPdf,
  "comparer-pdf": ComparerPdf,
  "organiser-pdf": OrganiserPdf,
  "numeros-pages": NumerosPages,
  "proteger-pdf": ProtegerPdf,
  "signer-pdf": SignerPdf,
  "rogner-pdf": RognerPdf,
  "reparer-pdf": ReparerPdf,
  "html-en-pdf": HtmlEnPdf,
  "imc": CalculateurIMC,
  "simulateur-pret": SimulateurPret,
  "convertisseur-devises": ConvertisseurDevises,
  "calculateur-tva": CalculateurTVA,
  "generateur-facture": GenerateurFacture,
  "encodeur-base64": EncodeurBase64,
  "generateur-mot-de-passe": GenerateurMotDePasse,
  "formateur-json": FormateurJSON,
  "convertisseur-couleur": ConvertisseurCouleur,
  "generateur-qrcode": GenerateurQrCode,
  "compteur-calories": CompteurCalories,
  "comparateur-apps": ComparateurApps,
  "constructeur-site": ConstructeurSite,
  "annuaire-apps": AnnuaireApps,
  "resumeur-texte": ResumeurTexte,
  "correcteur-orthographe": CorrecteurOrthographe,
  "generateur-bio": GenerateurBio,
  "generateur-nom-business": GenerateurNomBusiness,
};

// SEO overrides
const SEO_OVERRIDES: Record<string, { howTo?: string; why?: string; faq?: { q: string; a: string }[] }> = {
  "modifier-pdf": {
    howTo: "Déposez votre PDF, sélectionnez la page cible, puis ajoutez du texte (taille, couleur, position personnalisables) ou des images (PNG/JPG). Chaque annotation est listée et peut être supprimée individuellement. Cliquez sur « Télécharger le PDF modifié » pour obtenir le résultat.",
    why: "Modifier un PDF sans logiciel coûteux comme Adobe Acrobat est souvent un casse-tête. Cet outil gratuit permet d'ajouter du texte et des images directement dans votre navigateur — idéal pour signer un document, ajouter un tampon ou compléter un formulaire.",
  },
  "jpg-en-pdf": {
    howTo: "Déposez une ou plusieurs images (JPG, PNG, WEBP). Choisissez l'orientation (portrait ou paysage), la marge et le mode d'ajustement. Chaque image devient une page du PDF. Cliquez pour télécharger.",
    why: "Convertir des photos ou des scans en un seul PDF est utile pour envoyer des documents par email, créer un portfolio ou archiver des reçus.",
  },
  "deverrouiller-pdf": {
    howTo: "Déposez le PDF protégé. Si le document nécessite un mot de passe pour s'ouvrir, saisissez-le. L'outil crée une copie du PDF sans aucune restriction (impression, copie, modification).",
    faq: [{ q: "Est-ce légal ?", a: "Oui, si vous êtes le propriétaire légitime du document ou si vous avez l'autorisation de l'utiliser." }],
  },
  "comparer-pdf": {
    howTo: "Déposez deux fichiers PDF (l'original et la version modifiée). L'outil extrait le texte de chaque page et compare mot par mot. Les pages identiques sont marquées en vert, les pages avec des différences en orange avec le texte des deux versions côte à côte.",
    why: "Comparer deux versions d'un contrat, d'un rapport ou d'un mémoire pour identifier les changements — sans logiciel payant.",
  },
  "createur-logo": {
    howTo: "Choisissez votre mode (icône seule, texte seul ou les deux), sélectionnez une icône parmi plus de 130 disponibles, personnalisez les couleurs avec la palette ou la pipette, ajustez le fond (uni, dégradé ou transparent), l'arrondi des coins et la bordure. L'aperçu se met à jour en temps réel. Téléchargez ensuite en PNG (512, 1024 ou 2048 px), en SVG vectoriel ou en PDF haute résolution pour l'impression.",
    why: "Un logo professionnel coûte souvent cher chez un graphiste. Ce créateur de logo gratuit permet aux entrepreneurs, PME et créateurs de contenu de concevoir un logo moderne en quelques minutes.",
    faq: [
      { q: "Quelle est la différence entre PNG et SVG ?", a: "Le PNG est une image classique (idéale pour les réseaux sociaux). Le SVG est vectoriel : il peut être agrandi à l'infini — recommandé pour l'impression." },
      { q: "Puis-je utiliser mon logo commercialement ?", a: "Oui. Les logos créés vous appartiennent et sont utilisables librement, y compris à des fins commerciales." },
    ],
  },
  "createur-cv": {
    howTo: "Choisissez un modèle (Moderne, Classique ou Minimal), personnalisez la couleur, ajoutez votre photo et remplissez toutes les sections. Votre brouillon est sauvegardé automatiquement. Cliquez sur « Télécharger mon CV en PDF » ou partagez-le directement.",
    why: "Un CV bien présenté multiplie vos chances de décrocher un entretien. Ce créateur génère un PDF professionnel A4, prêt à être envoyé aux recruteurs. Pas de filigrane, pas d'inscription obligatoire.",
    faq: [
      { q: "Mon CV est-il sauvegardé si je ferme la page ?", a: "Oui. Votre brouillon est enregistré automatiquement dans votre navigateur." },
      { q: "Puis-je créer un CV de plusieurs pages ?", a: "Oui, des pages supplémentaires sont ajoutées automatiquement si besoin." },
    ],
  },
  "createur-design": {
    howTo: "Choisissez un modèle prédéfini (flyer, bannière, affiche…) ou un canevas vierge. Ajoutez du texte, des formes et des images. Personnalisez chaque élément : couleur, taille, position, police. Exportez en PNG haute résolution.",
    why: "Créez des visuels professionnels sans logiciel coûteux : flyers, bannières Facebook, affiches, décorations intérieures et plus. Idéal pour les PME, commerçants et créateurs de contenu en Afrique francophone.",
    faq: [
      { q: "Quels formats d'export sont disponibles ?", a: "Export en PNG haute résolution (2x) prêt pour l'impression ou le web." },
      { q: "Puis-je importer mes propres images ?", a: "Oui, vous pouvez ajouter autant d'images que vous le souhaitez par glisser-déposer ou sélection de fichier." },
    ],
  },
  "compteur-mots": {
    howTo: "Collez ou tapez votre texte dans la zone ci-dessus. Le compteur analyse automatiquement votre contenu et affiche en temps réel le nombre de mots, de caractères, de phrases, de paragraphes et le temps de lecture.",
    why: "Le compteur de mots est indispensable pour les rédacteurs, étudiants et professionnels qui doivent respecter des contraintes de longueur.",
    faq: [{ q: "Y a-t-il une limite de taille ?", a: "Non. L'outil fonctionne avec des textes de toute taille." }],
  },
  "calculateur-tva": {
    why: "Ce calculateur TVA est pensé pour les entrepreneurs et PME d'Afrique francophone : taux officiels du Cameroun (19,25 %), Côte d'Ivoire (18 %), Sénégal (18 %), Gabon (18 %), RDC (16 %) et France (20 %).",
  },
  "convertisseur-devises": {
    why: "Convertissez instantanément le Franc CFA (XAF et XOF) vers l'Euro, le Dollar, le Naira et plus de 15 devises.",
    faq: [{ q: "Les taux sont-ils en temps réel ?", a: "Les taux sont actualisés quotidiennement via une API publique. Le taux FCFA/EUR est fixe (1 € = 655,957 FCFA) car arrimé à l'euro." }],
  },
  "fusionner-pdf": {
    howTo: "Déposez vos fichiers PDF dans la zone prévue. L'ordre d'ajout détermine l'ordre de fusion. Cliquez sur « Fusionner et télécharger ».",
    faq: [{ q: "Mes PDF sont-ils envoyés sur un serveur ?", a: "Non. La fusion est à 100 % dans votre navigateur." }],
  },
  "resumeur-texte": {
    faq: [{ q: "Pourquoi une limite de 3 résumés par jour ?", a: "Les outils IA ont un coût de traitement. Scryboo AI offre un accès illimité." }],
  },
};

/* ============ Overlay de blocage (superposé sur l'outil) ============ */
function BlockOverlay({ tool }: { tool: Tool }) {
  const location = useLocation();
  return (
    <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="text-center px-5 py-8 max-w-sm">
        <span className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center shadow-lg shadow-blue-600/25 mb-4">
          <Lock className="w-6 h-6 text-white" />
        </span>
        <h3 className="text-lg font-bold text-gray-900">
          Limite de {FREE_LIMIT} utilisations atteinte
        </h3>
        <p className="text-sm text-gray-500 mt-1.5">
          Créez un compte gratuit en 30s pour débloquer l'accès illimité à «&nbsp;{tool.name}&nbsp;» et à tous les outils.
        </p>
        <ul className="inline-flex flex-col items-start gap-1.5 mt-4 text-xs text-gray-600">
          <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-500" /> Accès illimité à tous les outils</li>
          <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-500" /> 100 % gratuit, sans carte bancaire</li>
          <li className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-500" /> Données 100 % privées</li>
        </ul>
        <Link
          to="/auth"
          state={{ from: location.pathname }}
          className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 w-full"
        >
          Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/auth" state={{ from: location.pathname }} className="block mt-2 text-xs text-gray-400 hover:text-gray-600">
          J'ai déjà un compte — Connexion
        </Link>
      </div>
    </div>
  );
}

/* ============ Usage badge (affiché sous l'outil) ============ */
function UsageBadge() {
  const { remaining } = useUsageGate();
  const user = useAuth();
  if (user || remaining === null) return null;
  return (
    <p className="mt-4 text-[11px] text-gray-400 text-center" aria-live="polite">
      {remaining > 0
        ? <>Il vous reste <strong className="text-amber-600">{remaining}</strong> action{remaining > 1 ? "s" : ""} gratuite{remaining > 1 ? "s" : ""} sur cet outil · {" "}
            <Link to="/auth" className="text-blue-500 hover:text-blue-600 font-medium">Créez un compte</Link> pour un accès illimité</>
        : <>Dernière action gratuite épuisée · {" "}
            <Link to="/auth" className="text-blue-500 hover:text-blue-600 font-medium">Créez un compte gratuit</Link> pour continuer</>}
    </p>
  );
}

/* ============ Page outil ============ */
export function ToolPage() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const tool = category && slug ? getTool(category, slug) : undefined;
  const Component = slug ? COMPONENTS[slug] : undefined;

  if (!tool || !Component) return <Navigate to="/" replace />;

  return (
    <UsageGateProvider slug={tool.slug}>
      <ToolLayout tool={tool} seo={SEO_OVERRIDES[tool.slug]}>
        <ToolContent tool={tool} Component={Component} />
      </ToolLayout>
    </UsageGateProvider>
  );
}

function ToolContent({ tool, Component }: { tool: Tool; Component: React.ComponentType }) {
  const { showBlock } = useUsageGate();
  return (
    <>
      <div className="relative">
        <Component />
        {showBlock && <BlockOverlay tool={tool} />}
      </div>
      <UsageBadge />
    </>
  );
}
