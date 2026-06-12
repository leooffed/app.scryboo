export type ToolCategory = "texte" | "image" | "pdf" | "calculateurs" | "dev" | "ia";

export interface Tool {
  slug: string;
  category: ToolCategory;
  name: string;
  description: string;
  keywords: string[];
  icon: string;
  isNew?: boolean;
  isPopular?: boolean;
  usesAI?: boolean;
}

export const TOOLS_REGISTRY: Tool[] = [
  // TEXTE
  {
    slug: "compteur-mots",
    category: "texte",
    name: "Compteur de mots",
    description:
      "Comptez les mots, caractères, phrases et paragraphes de votre texte instantanément. Outil gratuit, sans inscription, sans limite.",
    keywords: ["compteur de mots", "compter mots en ligne", "nombre de mots", "compteur caractères gratuit"],
    icon: "FileText",
    isPopular: true,
  },
  {
    slug: "generateur-lorem",
    category: "texte",
    name: "Générateur Lorem Ipsum",
    description:
      "Générez du texte de remplissage Lorem Ipsum pour vos maquettes. Choisissez le nombre de paragraphes, mots ou phrases.",
    keywords: ["lorem ipsum générateur", "texte lorem ipsum", "faux texte maquette"],
    icon: "AlignLeft",
  },
  {
    slug: "convertisseur-casse",
    category: "texte",
    name: "Convertisseur de casse",
    description:
      "Convertissez votre texte en MAJUSCULES, minuscules, Titre, camelCase ou snake_case en un clic.",
    keywords: ["convertir majuscule minuscule", "changer casse texte", "uppercase lowercase français"],
    icon: "Type",
  },
  {
    slug: "supprimer-doublons",
    category: "texte",
    name: "Supprimer les doublons",
    description:
      "Supprimez les lignes en double d'une liste en un clic. Idéal pour nettoyer des listes d'emails, de noms ou d'URLs.",
    keywords: ["supprimer doublons liste", "enlever lignes dupliquées", "nettoyer liste en ligne"],
    icon: "Filter",
  },
  {
    slug: "extracteur-emails",
    category: "texte",
    name: "Extracteur d'emails",
    description:
      "Extrayez automatiquement toutes les adresses email d'un texte ou d'une page web. Résultat en un clic.",
    keywords: ["extraire emails texte", "trouver adresses email", "email extractor gratuit"],
    icon: "Mail",
  },
  {
    slug: "createur-cv",
    category: "texte",
    name: "Créateur de CV PDF",
    description:
      "Créez un CV professionnel en PDF gratuitement : 3 modèles au choix, couleurs personnalisables, export et partage instantanés. Sans inscription.",
    keywords: ["créer cv gratuit pdf", "créateur cv en ligne", "modèle cv professionnel", "faire son cv gratuit"],
    icon: "FileUser",
    isNew: true,
    isPopular: true,
  },
  // IMAGE
  {
    slug: "createur-logo",
    category: "image",
    name: "Créateur de logo",
    description:
      "Créez un logo professionnel gratuitement : 130+ icônes, texte, couleurs, dégradés et bordures personnalisables. Export PNG, SVG et PDF haute qualité.",
    keywords: ["créer logo gratuit", "créateur logo en ligne", "logo maker français", "générateur logo png svg"],
    icon: "PenTool",
    isNew: true,
    isPopular: true,
  },
  {
    slug: "createur-design",
    category: "image",
    name: "Créateur de design",
    description:
      "Créez des visuels professionnels gratuitement : flyers, bannières, affiches, tableaux déco. Texte, formes, images, export PNG HD.",
    keywords: ["créer flyer gratuit", "créateur affiche en ligne", "design graphique gratuit", "montage photo infographie"],
    icon: "Palette",
    isNew: true,
    isPopular: true,
  },
  {
    slug: "compresseur-image",
    category: "image",
    name: "Compresseur d'image",
    description:
      "Compressez vos images JPG et PNG gratuitement sans perte de qualité visible. Réduction jusqu'à 80% du poids.",
    keywords: ["compresser image en ligne gratuit", "réduire taille image", "compression jpg png"],
    icon: "ImageDown",
    isPopular: true,
  },
  {
    slug: "convertisseur-format",
    category: "image",
    name: "Convertisseur d'images",
    description:
      "Convertissez vos images JPG, PNG, WEBP gratuitement en ligne. Conversion instantanée, aucun logiciel requis.",
    keywords: ["convertir image jpg png", "conversion format image gratuit", "jpg vers png en ligne"],
    icon: "RefreshCw",
  },
  {
    slug: "redimensionneur",
    category: "image",
    name: "Redimensionneur d'images",
    description:
      "Redimensionnez vos images à n'importe quelle taille en pixels ou pourcentage. Gratuit, rapide, sans filigrane.",
    keywords: ["redimensionner image en ligne", "changer taille image gratuit", "resize image pixels"],
    icon: "Maximize2",
  },
  // PDF
  {
    slug: "fusionner-pdf",
    category: "pdf",
    name: "Fusionner des PDF",
    description:
      "Combinez plusieurs fichiers PDF en un seul document en quelques secondes. Gratuit, sécurisé, traitement dans votre navigateur.",
    keywords: ["fusionner pdf gratuit", "combiner pdf en ligne", "merger pdf sans logiciel"],
    icon: "Combine",
    isPopular: true,
  },
  {
    slug: "splitter-pdf",
    category: "pdf",
    name: "Diviser un PDF",
    description:
      "Séparez un fichier PDF en plusieurs documents. Choisissez les pages à extraire ou divisez par intervalles.",
    keywords: ["diviser pdf en ligne", "séparer pages pdf gratuit", "split pdf sans inscription"],
    icon: "Scissors",
  },
  {
    slug: "pdf-vers-word",
    category: "pdf",
    name: "PDF vers Word",
    description:
      "Convertissez vos fichiers PDF en documents Word (.doc) éditables. Conversion gratuite et rapide.",
    keywords: ["convertir pdf en word gratuit", "pdf vers docx en ligne", "pdf to word français"],
    icon: "FileOutput",
  },
  {
    slug: "modifier-pdf",
    category: "pdf",
    name: "Modifier un PDF",
    description:
      "Ajoutez du texte, des images et des annotations à un PDF. Modifiez la taille, la police et la couleur directement dans votre navigateur.",
    keywords: ["modifier pdf en ligne", "éditer pdf gratuit", "ajouter texte pdf", "annoter pdf"],
    icon: "PenLine",
    isNew: true,
  },
  {
    slug: "jpg-en-pdf",
    category: "pdf",
    name: "JPG en PDF",
    description:
      "Convertissez vos images JPG, PNG ou WEBP en un document PDF. Ajustez l'orientation et les marges.",
    keywords: ["jpg en pdf gratuit", "convertir image en pdf", "photo vers pdf en ligne"],
    icon: "FileImage",
  },
  {
    slug: "deverrouiller-pdf",
    category: "pdf",
    name: "Déverrouiller PDF",
    description:
      "Retirez le mot de passe de sécurité d'un PDF protégé pour l'utiliser librement. Traitement 100 % dans votre navigateur.",
    keywords: ["déverrouiller pdf gratuit", "enlever mot de passe pdf", "supprimer protection pdf"],
    icon: "Unlock",
  },
  {
    slug: "comparer-pdf",
    category: "pdf",
    name: "Comparer deux PDF",
    description:
      "Comparez deux documents PDF côte à côte et identifiez les différences entre les versions. Texte mis en évidence.",
    keywords: ["comparer pdf en ligne", "différences entre pdf", "comparateur pdf gratuit"],
    icon: "GitCompareArrows",
  },
  {
    slug: "organiser-pdf",
    category: "pdf",
    name: "Organiser PDF",
    description: "Réorganisez, supprimez ou dupliquez les pages de votre PDF par glisser-déposer. Aperçu visuel de chaque page.",
    keywords: ["organiser pages pdf", "réorganiser pdf gratuit", "supprimer page pdf en ligne"],
    icon: "LayoutList",
    isNew: true,
  },
  {
    slug: "numeros-pages",
    category: "pdf",
    name: "Numéros de pages",
    description: "Insérez des numéros de pages dans vos PDF. Position, taille, format et police personnalisables.",
    keywords: ["ajouter numéros pages pdf", "numéroter pdf gratuit", "pagination pdf en ligne"],
    icon: "ListOrdered",
  },
  {
    slug: "proteger-pdf",
    category: "pdf",
    name: "Protéger PDF",
    description: "Protégez vos fichiers PDF avec un mot de passe. Chiffrez vos documents pour empêcher les accès non autorisés.",
    keywords: ["protéger pdf mot de passe", "chiffrer pdf gratuit", "sécuriser pdf en ligne"],
    icon: "ShieldCheck",
  },
  {
    slug: "signer-pdf",
    category: "pdf",
    name: "Signer PDF",
    description: "Signez vos documents PDF avec une signature manuscrite dessinée ou tapée. Placez-la où vous voulez sur la page.",
    keywords: ["signer pdf en ligne gratuit", "signature électronique pdf", "ajouter signature pdf"],
    icon: "PenTool",
    isPopular: true,
  },
  {
    slug: "rogner-pdf",
    category: "pdf",
    name: "Rogner PDF",
    description: "Rognez les marges de vos documents PDF ou sélectionnez une zone à conserver. Applicable à toutes les pages.",
    keywords: ["rogner pdf en ligne", "recadrer pdf gratuit", "couper marges pdf"],
    icon: "Crop",
  },
  {
    slug: "reparer-pdf",
    category: "pdf",
    name: "Réparer PDF",
    description: "Réparez un fichier PDF endommagé ou corrompu. Récupérez le contenu lisible et créez un nouveau PDF propre.",
    keywords: ["réparer pdf endommagé", "restaurer pdf corrompu", "fixer pdf gratuit"],
    icon: "Wrench",
  },
  {
    slug: "html-en-pdf",
    category: "pdf",
    name: "HTML en PDF",
    description: "Convertissez du contenu HTML en PDF. Collez votre code HTML et obtenez un document PDF prêt à imprimer.",
    keywords: ["html en pdf gratuit", "convertir html pdf", "page web en pdf en ligne"],
    icon: "Code",
  },
  {
    slug: "compteur-calories",
    category: "calculateurs",
    name: "Compteur de calories",
    description: "Suivez vos repas et comptez les calories, protéines, glucides et lipides. Base de 200+ aliments africains et internationaux.",
    keywords: ["compteur calories gratuit", "calculer calories repas", "suivi nutritionnel en ligne"],
    icon: "Apple",
    isNew: true,
    isPopular: true,
  },
  {
    slug: "annuaire-apps",
    category: "dev",
    name: "Annuaire Apps & SaaS",
    description: "Découvrez les meilleurs sites web, applications et SaaS classés par catégorie. Soumettez vos trouvailles pour enrichir la communauté.",
    keywords: ["annuaire applications", "meilleurs saas gratuit", "liste outils en ligne", "répertoire apps utiles"],
    icon: "LayoutGrid",
    isNew: true,
    isPopular: true,
  },
  {
    slug: "comparateur-apps",
    category: "dev",
    name: "Comparateur d'applications",
    description: "Analysez et comparez les performances, le SEO, l'accessibilité et la sécurité de n'importe quel site web. Score détaillé sur 100.",
    keywords: ["analyser site web gratuit", "score performance site", "audit seo en ligne", "comparateur application"],
    icon: "BarChart3",
    isNew: true,
  },
  {
    slug: "constructeur-site",
    category: "dev",
    name: "Constructeur de site",
    description: "Créez un site web pour votre restaurant ou hôtel en drag & drop. Publiez sur votre-nom.scryboo.com en un clic.",
    keywords: ["créer site restaurant gratuit", "constructeur site hôtel", "site web drag drop", "wordpress alternatif gratuit"],
    icon: "Globe",
    isNew: true,
    isPopular: true,
  },
  // CALCULATEURS
  {
    slug: "imc",
    category: "calculateurs",
    name: "Calculateur IMC",
    description:
      "Calculez votre Indice de Masse Corporelle (IMC) et découvrez votre catégorie de poids. Résultat instantané.",
    keywords: ["calculateur imc gratuit", "calcul indice masse corporelle", "imc normal surpoids"],
    icon: "Activity",
    isPopular: true,
  },
  {
    slug: "simulateur-pret",
    category: "calculateurs",
    name: "Simulateur de prêt",
    description:
      "Calculez vos mensualités, le coût total et le tableau d'amortissement de votre prêt bancaire. Adapté aux banques africaines.",
    keywords: ["simulateur prêt bancaire", "calculer mensualité crédit", "tableau amortissement gratuit"],
    icon: "Banknote",
  },
  {
    slug: "convertisseur-devises",
    category: "calculateurs",
    name: "Convertisseur de devises",
    description:
      "Convertissez entre FCFA, Euro, Dollar et de nombreuses devises avec des taux de change actualisés.",
    keywords: ["convertir fcfa euro", "taux de change fcfa dollar", "convertisseur devises afrique"],
    icon: "DollarSign",
  },
  {
    slug: "calculateur-tva",
    category: "calculateurs",
    name: "Calculateur TVA",
    description:
      "Calculez le montant HT, TVA et TTC. Supporte les taux du Cameroun (19,25%), Côte d'Ivoire (18%), Sénégal (18%) et France (20%).",
    keywords: ["calculateur tva cameroun", "calcul tva afrique", "ht ttc tva gratuit"],
    icon: "Percent",
  },
  {
    slug: "generateur-facture",
    category: "calculateurs",
    name: "Générateur de facture PDF",
    description:
      "Créez et téléchargez une facture professionnelle en PDF gratuitement. Personnalisez client, articles et TVA.",
    keywords: ["créer facture pdf gratuit", "générateur facture en ligne", "modèle facture pdf"],
    icon: "Receipt",
  },
  {
    slug: "generateur-qrcode",
    category: "dev",
    name: "Générateur de QR Code",
    description:
      "Créez des QR codes personnalisés : Wi-Fi, site web, carte de visite, restaurant, localisation. Ajoutez votre logo, choisissez les couleurs et exportez en PNG, SVG ou JPG.",
    keywords: ["générateur qr code gratuit", "créer qr code wifi", "qr code personnalisé logo", "qr code restaurant menu"],
    icon: "QrCode",
    isNew: true,
    isPopular: true,
  },
  // DEV
  {
    slug: "encodeur-base64",
    category: "dev",
    name: "Encodeur / Décodeur Base64",
    description:
      "Encodez ou décodez du texte en Base64 instantanément dans votre navigateur. Support complet UTF-8.",
    keywords: ["encodeur base64 en ligne", "décoder base64 gratuit", "base64 encode decode"],
    icon: "Code",
  },
  {
    slug: "generateur-mot-de-passe",
    category: "dev",
    name: "Générateur de mot de passe",
    description:
      "Générez des mots de passe forts et sécurisés. Personnalisez la longueur, les majuscules, chiffres et symboles.",
    keywords: ["générateur mot de passe fort", "créer password sécurisé", "random password gratuit"],
    icon: "Lock",
    isPopular: true,
  },
  {
    slug: "formateur-json",
    category: "dev",
    name: "Formateur / Validateur JSON",
    description:
      "Formatez, indentez et validez votre JSON en un clic. Détection d'erreurs de syntaxe en temps réel.",
    keywords: ["formater json en ligne", "valider json gratuit", "json formatter beautifier"],
    icon: "Braces",
  },
  {
    slug: "convertisseur-couleur",
    category: "dev",
    name: "Convertisseur de couleurs",
    description:
      "Convertissez vos couleurs entre HEX, RGB, HSL et CMJN. Sélecteur visuel intégré.",
    keywords: ["convertir hex rgb gratuit", "convertisseur couleur hex hsl", "color picker converter"],
    icon: "Palette",
  },
  // IA
  {
    slug: "resumeur-texte",
    category: "ia",
    name: "Résumeur de texte IA",
    description:
      "Résumez n'importe quel texte long en quelques phrases clés grâce à l'intelligence artificielle. Gratuit, 3 résumés/jour.",
    keywords: ["résumer texte automatiquement", "résumé automatique ia", "résumeur texte gratuit"],
    icon: "Sparkles",
    usesAI: true,
    isPopular: true,
  },
  {
    slug: "correcteur-orthographe",
    category: "ia",
    name: "Correcteur orthographe IA",
    description:
      "Corrigez automatiquement les fautes d'orthographe et de typographie en français. Plus rapide qu'un correcteur classique.",
    keywords: ["correcteur orthographe gratuit", "corriger fautes automatique", "correcteur grammaire français"],
    icon: "SpellCheck",
    usesAI: true,
  },
  {
    slug: "generateur-bio",
    category: "ia",
    name: "Générateur de bio IA",
    description:
      "Créez une biographie professionnelle pour LinkedIn, Instagram ou votre CV en quelques secondes grâce à l'IA.",
    keywords: ["générer bio linkedin", "créer biographie professionnelle ia", "bio instagram générateur"],
    icon: "UserCheck",
    usesAI: true,
  },
  {
    slug: "generateur-nom-business",
    category: "ia",
    name: "Générateur de nom d'entreprise",
    description:
      "Trouvez le nom parfait pour votre business grâce à l'IA. Obtenez 10 suggestions créatives en quelques secondes.",
    keywords: ["trouver nom entreprise", "générateur nom business ia", "idées noms startup gratuit"],
    icon: "Building2",
    usesAI: true,
  },
];

export const CATEGORIES: Record<
  ToolCategory,
  { label: string; icon: string; color: string; tagline: string }
> = {
  texte: { label: "Texte & Écriture", icon: "FileText", color: "blue", tagline: "Comptez, nettoyez et transformez vos textes" },
  image: { label: "Image & Photo", icon: "Image", color: "green", tagline: "Compressez, convertissez et redimensionnez vos images" },
  pdf: { label: "PDF", icon: "FileType", color: "red", tagline: "Fusionnez, divisez et convertissez vos PDF" },
  calculateurs: { label: "Calculateurs", icon: "Calculator", color: "amber", tagline: "IMC, prêt, TVA, devises et factures" },
  dev: { label: "Dev & Tech", icon: "Code2", color: "purple", tagline: "Base64, JSON, mots de passe et couleurs" },
  ia: { label: "Outils IA", icon: "Sparkles", color: "teal", tagline: "Résumé, correction et génération assistés par IA" },
};

export const CATEGORY_ORDER: ToolCategory[] = ["texte", "image", "pdf", "calculateurs", "dev", "ia"];

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS_REGISTRY.filter((t) => t.category === category);
}

export function getTool(category: string, slug: string): Tool | undefined {
  return TOOLS_REGISTRY.find((t) => t.category === category && t.slug === slug);
}

export const COLOR_CLASSES: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", badge: "bg-green-100 text-green-700", border: "border-green-200" },
  red: { bg: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700", border: "border-red-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-100 text-amber-700", border: "border-amber-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100 text-purple-700", border: "border-purple-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", badge: "bg-teal-100 text-teal-700", border: "border-teal-200" },
};
