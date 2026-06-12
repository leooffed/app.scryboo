import { useEffect, useRef, useState } from "react";
import { Camera, Download, Eye, EyeOff, GraduationCap, Briefcase, Languages, Loader2, Plus, Share2, Trash2, User, X } from "lucide-react";
import { ClearButton, ResultBox } from "../../components/tools/common";
import { useSEO } from "../../lib/seo";

/* ================= Types & état ================= */
interface Experience { role: string; company: string; period: string; desc: string }
interface Education { degree: string; school: string; period: string }
interface Language { name: string; level: string }

type PhotoShape = "circle" | "rounded" | "square";

interface CvData {
  template: "moderne" | "classique" | "minimal";
  accent: string;
  photo: string; // dataURL ou ""
  photoShape: PhotoShape;
  photoSize: number; // 60-140 (pt PDF)
  photoZoom: number; // 100-250 (%)
  photoX: number; // -50..50 (%)
  photoY: number; // -50..50 (%)
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string;
  languages: Language[];
  interests: string;
}

const PHOTO_SHAPES: { id: PhotoShape; label: string }[] = [
  { id: "circle", label: "Rond" },
  { id: "rounded", label: "Arrondi" },
  { id: "square", label: "Carré" },
];

const ACCENTS = [
  { id: "#2563eb", label: "Bleu" },
  { id: "#0d9488", label: "Teal" },
  { id: "#7c3aed", label: "Violet" },
  { id: "#9f1239", label: "Bordeaux" },
  { id: "#1f2937", label: "Anthracite" },
  { id: "#047857", label: "Vert" },
  { id: "#c2410c", label: "Orange" },
];

const TEMPLATES = [
  { id: "moderne", label: "Moderne", hint: "Bandeau coloré latéral" },
  { id: "classique", label: "Classique", hint: "En-tête centré, sobre" },
  { id: "minimal", label: "Minimal", hint: "Épuré, sans fioritures" },
] as const;

const LEVELS = ["Notions", "Intermédiaire", "Courant", "Bilingue", "Langue maternelle"];

const EMPTY: CvData = {
  template: "moderne",
  accent: "#2563eb",
  photo: "",
  photoShape: "circle",
  photoSize: 90,
  photoZoom: 100,
  photoX: 0,
  photoY: 0,
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  summary: "",
  experiences: [{ role: "", company: "", period: "", desc: "" }],
  education: [{ degree: "", school: "", period: "" }],
  skills: "",
  languages: [{ name: "Français", level: "Langue maternelle" }],
  interests: "",
};

const DRAFT_KEY = "scryboo-cv-draft";

/* ================= Photo : lecture + masquage par forme ================= */
function readPhotoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      // Réduction à 600 px max pour un brouillon léger
      const max = 600;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
    img.src = url;
  });
}

/** Produit un PNG carré masqué (rond / arrondi / carré) avec zoom et position appliqués. */
function processPhoto(cv: CvData, outSize = 360): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    if (!cv.photo) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = outSize;
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      // Masque selon la forme
      ctx.beginPath();
      if (cv.photoShape === "circle") {
        ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      } else if (cv.photoShape === "rounded") {
        const r = outSize * 0.18;
        ctx.roundRect(0, 0, outSize, outSize, r);
      } else {
        ctx.rect(0, 0, outSize, outSize);
      }
      ctx.clip();
      // Recadrage "cover" + zoom + déplacement
      const zoom = cv.photoZoom / 100;
      const cover = Math.max(outSize / img.naturalWidth, outSize / img.naturalHeight) * zoom;
      const dw = img.naturalWidth * cover;
      const dh = img.naturalHeight * cover;
      const dx = (outSize - dw) / 2 + (cv.photoX / 100) * outSize;
      const dy = (outSize - dh) / 2 + (cv.photoY / 100) * outSize;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(null);
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = cv.photo;
  });
}

/* ================= Génération PDF ================= */
async function buildCvPdf(cv: CvData): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const hex = cv.accent.replace("#", "");
  const accent = rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255);
  const dark = rgb(0.13, 0.16, 0.22);
  const gray = rgb(0.45, 0.47, 0.52);
  const white = rgb(1, 1, 1);
  const light = rgb(0.95, 0.96, 0.97);

  const clean = (s: string) =>
    s
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[•·]/g, "-")
      .replace(/[^\x20-\x7EÀ-ÿ\n]/g, "");

  type F = typeof font;
  const wrap = (text: string, f: F, size: number, maxW: number): string[] => {
    const out: string[] = [];
    for (const raw of clean(text).split("\n")) {
      const words = raw.split(/\s+/).filter(Boolean);
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (f.widthOfTextAtSize(test, size) > maxW && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      out.push(line);
    }
    return out.length ? out : [""];
  };

  let page = doc.addPage([595, 842]);
  // Photo masquée (forme + zoom + position déjà appliqués)
  let photoImg: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  const photoBytes = await processPhoto(cv);
  if (photoBytes) photoImg = await doc.embedPng(photoBytes as unknown as ArrayBuffer);
  const PS = cv.photoSize;
  const skills = cv.skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const interests = cv.interests.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const exps = cv.experiences.filter((e) => e.role.trim() || e.company.trim());
  const edus = cv.education.filter((e) => e.degree.trim() || e.school.trim());
  const langs = cv.languages.filter((l) => l.name.trim());
  const contacts = [cv.email, cv.phone, cv.address, cv.website].filter((c) => c.trim());

  /* ---------- Modèle MODERNE : sidebar colorée ---------- */
  if (cv.template === "moderne") {
    const SW = 185; // largeur sidebar
    page.drawRectangle({ x: 0, y: 0, width: SW, height: 842, color: accent });

    // Sidebar
    let sy = 790;
    if (photoImg) {
      const px = (SW - PS) / 2;
      page.drawImage(photoImg, { x: px, y: 842 - 28 - PS, width: PS, height: PS });
      sy = 842 - 28 - PS - 26;
    }
    const sideTitle = (t: string) => {
      page.drawText(t.toUpperCase(), { x: 18, y: sy, size: 9.5, font: bold, color: white });
      page.drawLine({ start: { x: 18, y: sy - 5 }, end: { x: SW - 18, y: sy - 5 }, thickness: 0.7, color: rgb(1, 1, 1) });
      sy -= 20;
    };
    const sideText = (t: string, size = 8.5) => {
      for (const l of wrap(t, font, size, SW - 36)) {
        if (sy < 40) break;
        page.drawText(l, { x: 18, y: sy, size, font, color: white });
        sy -= 12;
      }
    };

    sideTitle("Contact");
    contacts.forEach((c) => { sideText(c); sy -= 2; });
    sy -= 14;
    if (skills.length) {
      sideTitle("Compétences");
      skills.forEach((s) => { sideText("- " + s); });
      sy -= 14;
    }
    if (langs.length) {
      sideTitle("Langues");
      langs.forEach((l) => { sideText(`${l.name} - ${l.level}`); });
      sy -= 14;
    }
    if (interests.length) {
      sideTitle("Intérêts");
      interests.forEach((i) => { sideText("- " + i); });
    }

    // Colonne principale
    const MX = SW + 28;
    const MW = 595 - MX - 40;
    let y = 786;
    const ensure = (need: number) => {
      if (y - need < 50) {
        page = doc.addPage([595, 842]);
        y = 790;
      }
    };

    page.drawText(clean(cv.fullName).toUpperCase(), { x: MX, y, size: 22, font: bold, color: dark });
    y -= 22;
    page.drawText(clean(cv.jobTitle), { x: MX, y, size: 12, font, color: accent });
    y -= 30;

    const mainSection = (t: string) => {
      ensure(40);
      page.drawText(t.toUpperCase(), { x: MX, y, size: 11, font: bold, color: accent });
      page.drawLine({ start: { x: MX, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 1, color: accent });
      y -= 22;
    };

    if (cv.summary.trim()) {
      mainSection("Profil");
      for (const l of wrap(cv.summary, font, 9.5, MW)) {
        ensure(14);
        page.drawText(l, { x: MX, y, size: 9.5, font, color: gray });
        y -= 13;
      }
      y -= 12;
    }
    if (exps.length) {
      mainSection("Expérience professionnelle");
      for (const e of exps) {
        ensure(50);
        page.drawText(clean(e.role), { x: MX, y, size: 10.5, font: bold, color: dark });
        if (e.period.trim()) {
          const pw = font.widthOfTextAtSize(clean(e.period), 8.5);
          page.drawText(clean(e.period), { x: 555 - pw, y, size: 8.5, font, color: gray });
        }
        y -= 13;
        if (e.company.trim()) {
          page.drawText(clean(e.company), { x: MX, y, size: 9.5, font, color: accent });
          y -= 13;
        }
        for (const l of wrap(e.desc, font, 9, MW)) {
          if (!l) continue;
          ensure(12);
          page.drawText(l, { x: MX, y, size: 9, font, color: gray });
          y -= 12;
        }
        y -= 10;
      }
      y -= 4;
    }
    if (edus.length) {
      mainSection("Formation");
      for (const e of edus) {
        ensure(30);
        page.drawText(clean(e.degree), { x: MX, y, size: 10, font: bold, color: dark });
        if (e.period.trim()) {
          const pw = font.widthOfTextAtSize(clean(e.period), 8.5);
          page.drawText(clean(e.period), { x: 555 - pw, y, size: 8.5, font, color: gray });
        }
        y -= 13;
        if (e.school.trim()) {
          page.drawText(clean(e.school), { x: MX, y, size: 9, font, color: gray });
          y -= 13;
        }
        y -= 6;
      }
    }
  } else {
    /* ---------- Modèles CLASSIQUE & MINIMAL : pleine largeur ---------- */
    const isClassic = cv.template === "classique";
    const X = 50;
    const W = 495;
    let y = 790;
    const ensure = (need: number) => {
      if (y - need < 50) {
        page = doc.addPage([595, 842]);
        y = 790;
      }
    };

    // En-tête
    if (isClassic) {
      if (photoImg) {
        page.drawImage(photoImg, { x: (595 - PS) / 2, y: 842 - 36 - PS, width: PS, height: PS });
        y = 842 - 36 - PS - 28;
      }
      const nw = bold.widthOfTextAtSize(clean(cv.fullName).toUpperCase(), 24);
      page.drawText(clean(cv.fullName).toUpperCase(), { x: (595 - nw) / 2, y, size: 24, font: bold, color: dark });
      y -= 24;
      const tw = font.widthOfTextAtSize(clean(cv.jobTitle), 12);
      page.drawText(clean(cv.jobTitle), { x: (595 - tw) / 2, y, size: 12, font, color: accent });
      y -= 18;
      const cline = contacts.map(clean).join("   |   ");
      for (const l of wrap(cline, font, 8.5, W)) {
        const lw = font.widthOfTextAtSize(l, 8.5);
        page.drawText(l, { x: (595 - lw) / 2, y, size: 8.5, font, color: gray });
        y -= 12;
      }
      y -= 8;
      page.drawLine({ start: { x: X, y }, end: { x: 545, y }, thickness: 1.2, color: accent });
      y -= 26;
    } else {
      // Minimal : photo en haut à droite, texte à gauche
      if (photoImg) {
        page.drawImage(photoImg, { x: 545 - PS, y: 842 - 40 - PS, width: PS, height: PS });
      }
      const maxTextW = photoImg ? 595 - X - PS - 70 : W;
      page.drawText(clean(cv.fullName), { x: X, y, size: 24, font: bold, color: dark });
      y -= 22;
      page.drawText(clean(cv.jobTitle), { x: X, y, size: 12, font, color: gray });
      y -= 16;
      for (const l of wrap(contacts.map(clean).join("  ·  "), font, 8.5, maxTextW).slice(0, 2)) {
        page.drawText(l, { x: X, y, size: 8.5, font, color: gray });
        y -= 12;
      }
      y -= 2;
      // La ligne de séparation passe sous la photo si nécessaire
      if (photoImg && y > 842 - 40 - PS - 10) y = 842 - 40 - PS - 10;
      page.drawLine({ start: { x: X, y }, end: { x: 545, y }, thickness: 0.5, color: rgb(0.85, 0.86, 0.88) });
      y -= 24;
    }

    const section = (t: string) => {
      ensure(40);
      if (isClassic) {
        page.drawRectangle({ x: X, y: y - 5, width: W, height: 20, color: light });
        page.drawText(t.toUpperCase(), { x: X + 8, y, size: 10.5, font: bold, color: accent });
      } else {
        page.drawText(t.toUpperCase(), { x: X, y, size: 10, font: bold, color: accent });
        page.drawLine({ start: { x: X, y: y - 5 }, end: { x: 545, y: y - 5 }, thickness: 0.5, color: rgb(0.85, 0.86, 0.88) });
      }
      y -= 24;
    };

    if (cv.summary.trim()) {
      section("Profil");
      for (const l of wrap(cv.summary, font, 9.5, W)) {
        ensure(14);
        page.drawText(l, { x: X, y, size: 9.5, font, color: gray });
        y -= 13;
      }
      y -= 12;
    }
    if (exps.length) {
      section("Expérience professionnelle");
      for (const e of exps) {
        ensure(50);
        page.drawText(clean(e.role), { x: X, y, size: 10.5, font: bold, color: dark });
        if (e.period.trim()) {
          const pw = font.widthOfTextAtSize(clean(e.period), 8.5);
          page.drawText(clean(e.period), { x: 545 - pw, y, size: 8.5, font, color: gray });
        }
        y -= 13;
        if (e.company.trim()) {
          page.drawText(clean(e.company), { x: X, y, size: 9.5, font, color: accent });
          y -= 13;
        }
        for (const l of wrap(e.desc, font, 9, W)) {
          if (!l) continue;
          ensure(12);
          page.drawText(l, { x: X, y, size: 9, font, color: gray });
          y -= 12;
        }
        y -= 10;
      }
      y -= 4;
    }
    if (edus.length) {
      section("Formation");
      for (const e of edus) {
        ensure(30);
        page.drawText(clean(e.degree), { x: X, y, size: 10, font: bold, color: dark });
        if (e.period.trim()) {
          const pw = font.widthOfTextAtSize(clean(e.period), 8.5);
          page.drawText(clean(e.period), { x: 545 - pw, y, size: 8.5, font, color: gray });
        }
        y -= 13;
        if (e.school.trim()) {
          page.drawText(clean(e.school), { x: X, y, size: 9, font, color: gray });
          y -= 13;
        }
        y -= 6;
      }
      y -= 8;
    }
    if (skills.length) {
      section("Compétences");
      for (const l of wrap(skills.join("  ·  "), font, 9.5, W)) {
        ensure(14);
        page.drawText(l, { x: X, y, size: 9.5, font, color: gray });
        y -= 13;
      }
      y -= 12;
    }
    if (langs.length) {
      section("Langues");
      for (const l of wrap(langs.map((lg) => `${lg.name} (${lg.level})`).join("  ·  "), font, 9.5, W)) {
        ensure(14);
        page.drawText(l, { x: X, y, size: 9.5, font, color: gray });
        y -= 13;
      }
      y -= 12;
    }
    if (interests.length) {
      section("Centres d'intérêt");
      for (const l of wrap(interests.join("  ·  "), font, 9.5, W)) {
        ensure(14);
        page.drawText(l, { x: X, y, size: 9.5, font, color: gray });
        y -= 13;
      }
    }
  }

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/* ================= Aperçu en direct (réplique fidèle du PDF) ================= */
function PhotoPreview({ cv, sizePct }: { cv: CvData; sizePct: number }) {
  if (!cv.photo) return null;
  const radius = cv.photoShape === "circle" ? "9999px" : cv.photoShape === "rounded" ? "18%" : "0";
  return (
    <div
      className="overflow-hidden mx-auto shrink-0"
      style={{ width: `${sizePct}%`, aspectRatio: "1", borderRadius: radius }}
    >
      <img
        src={cv.photo}
        alt="Photo de profil"
        className="w-full h-full object-cover"
        style={{
          transform: `scale(${cv.photoZoom / 100}) translate(${cv.photoX}%, ${cv.photoY}%)`,
        }}
      />
    </div>
  );
}

function CvPreview({ cv }: { cv: CvData }) {
  const skills = cv.skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const interests = cv.interests.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const exps = cv.experiences.filter((e) => e.role.trim() || e.company.trim());
  const edus = cv.education.filter((e) => e.degree.trim() || e.school.trim());
  const langs = cv.languages.filter((l) => l.name.trim());
  const contacts = [cv.email, cv.phone, cv.address, cv.website].filter((c) => c.trim());
  const name = cv.fullName || "Votre nom";
  const job = cv.jobTitle || "Poste recherché";

  const SectionM = ({ t }: { t: string }) => (
    <p className="text-[7px] font-bold uppercase tracking-wide pb-0.5 mb-1 border-b" style={{ color: cv.accent, borderColor: cv.accent }}>{t}</p>
  );

  const ExpBlock = ({ e }: { e: Experience }) => (
    <div className="mb-1.5">
      <div className="flex justify-between gap-1">
        <p className="text-[6.5px] font-bold text-gray-800 leading-tight">{e.role || "Poste"}</p>
        {e.period && <p className="text-[5.5px] text-gray-400 shrink-0">{e.period}</p>}
      </div>
      {e.company && <p className="text-[6px] leading-tight" style={{ color: cv.accent }}>{e.company}</p>}
      {e.desc && <p className="text-[5.5px] text-gray-500 leading-snug whitespace-pre-line line-clamp-3">{e.desc}</p>}
    </div>
  );

  const EduBlock = ({ e }: { e: Education }) => (
    <div className="mb-1">
      <div className="flex justify-between gap-1">
        <p className="text-[6.5px] font-bold text-gray-800 leading-tight">{e.degree || "Diplôme"}</p>
        {e.period && <p className="text-[5.5px] text-gray-400 shrink-0">{e.period}</p>}
      </div>
      {e.school && <p className="text-[6px] text-gray-500 leading-tight">{e.school}</p>}
    </div>
  );

  /* ----- Modèle MODERNE : sidebar colorée ----- */
  if (cv.template === "moderne") {
    return (
      <div className="w-full aspect-[210/297] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex text-left select-none">
        <div className="w-[32%] p-2 space-y-2 overflow-hidden" style={{ backgroundColor: cv.accent }}>
          <PhotoPreview cv={cv} sizePct={Math.round((cv.photoSize / 185) * 100)} />
          <div>
            <p className="text-[6px] font-bold uppercase text-white border-b border-white/60 pb-0.5 mb-1">Contact</p>
            {contacts.map((c) => <p key={c} className="text-[5.5px] text-white/90 leading-snug break-all mb-0.5">{c}</p>)}
          </div>
          {skills.length > 0 && (
            <div>
              <p className="text-[6px] font-bold uppercase text-white border-b border-white/60 pb-0.5 mb-1">Compétences</p>
              {skills.slice(0, 8).map((s) => <p key={s} className="text-[5.5px] text-white/90 leading-snug">- {s}</p>)}
            </div>
          )}
          {langs.length > 0 && (
            <div>
              <p className="text-[6px] font-bold uppercase text-white border-b border-white/60 pb-0.5 mb-1">Langues</p>
              {langs.map((l, i) => <p key={i} className="text-[5.5px] text-white/90 leading-snug">{l.name} - {l.level}</p>)}
            </div>
          )}
          {interests.length > 0 && (
            <div>
              <p className="text-[6px] font-bold uppercase text-white border-b border-white/60 pb-0.5 mb-1">Intérêts</p>
              {interests.slice(0, 5).map((i) => <p key={i} className="text-[5.5px] text-white/90 leading-snug">- {i}</p>)}
            </div>
          )}
        </div>
        <div className="flex-1 p-2.5 overflow-hidden">
          <p className="text-[10px] font-bold text-gray-900 uppercase leading-tight">{name}</p>
          <p className="text-[7px] mb-2" style={{ color: cv.accent }}>{job}</p>
          {cv.summary.trim() && (
            <><SectionM t="Profil" /><p className="text-[5.5px] text-gray-500 leading-snug mb-2 line-clamp-4">{cv.summary}</p></>
          )}
          {exps.length > 0 && (<><SectionM t="Expérience professionnelle" />{exps.slice(0, 4).map((e, i) => <ExpBlock key={i} e={e} />)}</>)}
          {edus.length > 0 && (<><SectionM t="Formation" />{edus.slice(0, 3).map((e, i) => <EduBlock key={i} e={e} />)}</>)}
        </div>
      </div>
    );
  }

  /* ----- Modèles CLASSIQUE / MINIMAL ----- */
  const isClassic = cv.template === "classique";
  const SectionF = ({ t }: { t: string }) =>
    isClassic ? (
      <p className="text-[6.5px] font-bold uppercase px-1 py-0.5 mb-1 bg-gray-100" style={{ color: cv.accent }}>{t}</p>
    ) : (
      <p className="text-[6.5px] font-bold uppercase pb-0.5 mb-1 border-b border-gray-200" style={{ color: cv.accent }}>{t}</p>
    );

  return (
    <div className="w-full aspect-[210/297] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-3 text-left select-none">
      {isClassic ? (
        <div className="text-center mb-2">
          <div className="mb-1"><PhotoPreview cv={cv} sizePct={Math.round((cv.photoSize / 595) * 100) * 3} /></div>
          <p className="text-[10px] font-bold text-gray-900 uppercase leading-tight">{name}</p>
          <p className="text-[7px]" style={{ color: cv.accent }}>{job}</p>
          {contacts.length > 0 && <p className="text-[5px] text-gray-400 leading-snug">{contacts.join("  |  ")}</p>}
          <div className="h-[1.5px] mt-1" style={{ backgroundColor: cv.accent }} />
        </div>
      ) : (
        <div className="mb-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-900 leading-tight">{name}</p>
              <p className="text-[7px] text-gray-500">{job}</p>
              {contacts.length > 0 && <p className="text-[5px] text-gray-400 leading-snug">{contacts.join("  ·  ")}</p>}
            </div>
            {cv.photo && (
              <div className="shrink-0" style={{ width: `${Math.round((cv.photoSize / 595) * 100) * 2.4}%` }}>
                <PhotoPreview cv={cv} sizePct={100} />
              </div>
            )}
          </div>
          <div className="h-px bg-gray-200 mt-1" />
        </div>
      )}
      {cv.summary.trim() && (<><SectionF t="Profil" /><p className="text-[5.5px] text-gray-500 leading-snug mb-1.5 line-clamp-3">{cv.summary}</p></>)}
      {exps.length > 0 && (<><SectionF t="Expérience professionnelle" />{exps.slice(0, 3).map((e, i) => <ExpBlock key={i} e={e} />)}</>)}
      {edus.length > 0 && (<><SectionF t="Formation" />{edus.slice(0, 2).map((e, i) => <EduBlock key={i} e={e} />)}</>)}
      {skills.length > 0 && (<><SectionF t="Compétences" /><p className="text-[5.5px] text-gray-500 leading-snug mb-1.5">{skills.join("  ·  ")}</p></>)}
      {langs.length > 0 && (<><SectionF t="Langues" /><p className="text-[5.5px] text-gray-500 leading-snug">{langs.map((l) => `${l.name} (${l.level})`).join("  ·  ")}</p></>)}
    </div>
  );
}

/* ================= Composant ================= */
const inputCls =
  "w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      <Icon className="w-4 h-4 text-blue-500" /> {label}
    </p>
  );
}

export function CreateurCV() {
  const [cv, setCv] = useState<CvData>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return { ...EMPTY, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return EMPTY;
  });
  const [busy, setBusy] = useState<null | "pdf" | "share">(null);
  const [info, setInfo] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: "Créateur de CV - Scryboo",
    description: "Créez facilement votre CV professionnel avec notre outil de création de CV en ligne gratuit.",
    canonical: "/tools/cv",
  });

  // Sauvegarde automatique du brouillon
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(cv)); } catch { /* ignore */ }
    }, 600);
    return () => clearTimeout(t);
  }, [cv]);

  const set = (patch: Partial<CvData>) => setCv((c) => ({ ...c, ...patch }));
  const canExport = cv.fullName.trim().length > 1 && cv.jobTitle.trim().length > 1;

  const filename = `CV-${(cv.fullName || "scryboo").trim().replace(/\s+/g, "-")}.pdf`;

  const exportPdf = async () => {
    setBusy("pdf");
    setInfo("");
    try {
      const blob = await buildCvPdf(cv);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setInfo("✅ CV téléchargé. Bonne chance pour vos candidatures !");
    } finally {
      setBusy(null);
    }
  };

  const sharePdf = async () => {
    setBusy("share");
    setInfo("");
    try {
      const blob = await buildCvPdf(cv);
      const file = new File([blob], filename, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `CV — ${cv.fullName}` });
        setInfo("✅ CV partagé.");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setInfo("ℹ️ Partage non disponible sur ce navigateur — le PDF a été téléchargé.");
      }
    } catch { /* annulé */ } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setCv({ ...EMPTY, template: cv.template, accent: cv.accent });
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setInfo("");
  };

  return (
    <div className="space-y-6">
      {/* Modèle + couleur */}
      <div className="space-y-3">
        <SectionTitle icon={User} label="Modèle de CV" />
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => set({ template: t.id })}
              aria-pressed={cv.template === t.id}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${
                cv.template === t.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Mini-aperçu du modèle */}
              <div className="h-14 rounded-md bg-white border border-gray-100 overflow-hidden flex mb-2">
                {t.id === "moderne" && (
                  <>
                    <div className="w-1/3 h-full" style={{ backgroundColor: cv.accent }} />
                    <div className="flex-1 p-1 space-y-1">
                      <div className="h-1.5 w-3/4 rounded bg-gray-300" />
                      <div className="h-1 w-1/2 rounded bg-gray-200" />
                      <div className="h-1 w-full rounded bg-gray-100" />
                    </div>
                  </>
                )}
                {t.id === "classique" && (
                  <div className="flex-1 p-1 space-y-1">
                    <div className="h-1.5 w-1/2 mx-auto rounded bg-gray-300" />
                    <div className="h-0.5 w-full rounded" style={{ backgroundColor: cv.accent }} />
                    <div className="h-1 w-full rounded bg-gray-100" />
                    <div className="h-1 w-5/6 rounded bg-gray-100" />
                  </div>
                )}
                {t.id === "minimal" && (
                  <div className="flex-1 p-1 space-y-1">
                    <div className="h-1.5 w-2/3 rounded bg-gray-300" />
                    <div className="h-1 w-1/3 rounded" style={{ backgroundColor: cv.accent }} />
                    <div className="h-1 w-full rounded bg-gray-100" />
                  </div>
                )}
              </div>
              <span className={`block text-sm font-medium ${cv.template === t.id ? "text-blue-700" : "text-gray-800"}`}>{t.label}</span>
              <span className="block text-[11px] text-gray-400">{t.hint}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Couleur :</span>
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => set({ accent: a.id })}
              aria-label={`Couleur ${a.label}`}
              aria-pressed={cv.accent === a.id}
              className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${
                cv.accent === a.id ? "border-gray-900 scale-110" : "border-white shadow"
              }`}
              style={{ backgroundColor: a.id }}
            />
          ))}
        </div>
      </div>

      {/* Photo de profil */}
      <div className="space-y-3">
        <SectionTitle icon={Camera} label="Photo de profil (optionnel)" />
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Aperçu de la photo avec sa forme */}
          <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0">
            <div
              className="w-28 h-28 overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center"
              style={{
                borderRadius: cv.photoShape === "circle" ? "9999px" : cv.photoShape === "rounded" ? "18%" : "0.5rem",
              }}
            >
              {cv.photo ? (
                <img
                  src={cv.photo}
                  alt="Aperçu de la photo de profil"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${cv.photoZoom / 100}) translate(${cv.photoX}%, ${cv.photoY}%)` }}
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                {cv.photo ? "Changer" : "Ajouter une photo"}
              </button>
              {cv.photo && (
                <button
                  onClick={() => set({ photo: "", photoZoom: 100, photoX: 0, photoY: 0 })}
                  aria-label="Supprimer la photo"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Choisir une photo de profil"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const dataUrl = await readPhotoFile(f);
                  set({ photo: dataUrl, photoZoom: 100, photoX: 0, photoY: 0 });
                } catch {
                  setInfo("⚠️ Impossible de lire cette image. Utilisez un fichier JPG ou PNG.");
                }
              }}
            />
          </div>

          {/* Réglages de la photo */}
          {cv.photo && (
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Forme :</span>
                {PHOTO_SHAPES.map((sh) => (
                  <button
                    key={sh.id}
                    onClick={() => set({ photoShape: sh.id })}
                    aria-pressed={cv.photoShape === sh.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      cv.photoShape === sh.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 border-[1.5px] ${cv.photoShape === sh.id ? "border-white" : "border-gray-400"}`}
                      style={{ borderRadius: sh.id === "circle" ? "9999px" : sh.id === "rounded" ? "3px" : "0" }}
                    />
                    {sh.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Taille sur le CV : {cv.photoSize} pt</span>
                  <input type="range" min={60} max={140} value={cv.photoSize}
                    onChange={(e) => set({ photoSize: +e.target.value })}
                    aria-label="Taille de la photo" className="w-full mt-1 accent-blue-600" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Zoom : {cv.photoZoom} %</span>
                  <input type="range" min={100} max={250} step={5} value={cv.photoZoom}
                    onChange={(e) => set({ photoZoom: +e.target.value })}
                    aria-label="Zoom de la photo" className="w-full mt-1 accent-blue-600" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Position horizontale : {cv.photoX}</span>
                  <input type="range" min={-50} max={50} value={cv.photoX}
                    onChange={(e) => set({ photoX: +e.target.value })}
                    aria-label="Position horizontale de la photo" className="w-full mt-1 accent-blue-600" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Position verticale : {cv.photoY}</span>
                  <input type="range" min={-50} max={50} value={cv.photoY}
                    onChange={(e) => set({ photoY: +e.target.value })}
                    aria-label="Position verticale de la photo" className="w-full mt-1 accent-blue-600" />
                </label>
              </div>
              <p className="text-[11px] text-gray-400">
                Recadrez avec le zoom et la position — la forme et le cadrage sont appliqués au PDF final.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Infos personnelles */}
      <div className="space-y-3">
        <SectionTitle icon={User} label="Informations personnelles" />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nom complet *</span>
            <input value={cv.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Aïcha Diallo" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Titre / Poste recherché *</span>
            <input value={cv.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} placeholder="Développeuse Web Full-Stack" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input type="email" value={cv.email} onChange={(e) => set({ email: e.target.value })} placeholder="aicha@exemple.com" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Téléphone</span>
            <input value={cv.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+221 77 XXX XX XX" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Ville / Pays</span>
            <input value={cv.address} onChange={(e) => set({ address: e.target.value })} placeholder="Dakar, Sénégal" className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Site web / LinkedIn</span>
            <input value={cv.website} onChange={(e) => set({ website: e.target.value })} placeholder="linkedin.com/in/aicha" className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Profil / Résumé (2-4 phrases)</span>
          <textarea value={cv.summary} onChange={(e) => set({ summary: e.target.value })}
            placeholder="Développeuse passionnée avec 4 ans d'expérience en création d'applications web. Rigoureuse, autonome et orientée résultats…"
            className="w-full mt-1 h-20 p-3 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
      </div>

      {/* Expériences */}
      <div className="space-y-3">
        <SectionTitle icon={Briefcase} label="Expérience professionnelle" />
        {cv.experiences.map((e, i) => (
          <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2 relative">
            <button
              onClick={() => set({ experiences: cv.experiences.filter((_, j) => j !== i) })}
              disabled={cv.experiences.length === 1}
              aria-label="Supprimer cette expérience"
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="grid sm:grid-cols-3 gap-2 pr-8">
              <input value={e.role} onChange={(ev) => set({ experiences: cv.experiences.map((x, j) => j === i ? { ...x, role: ev.target.value } : x) })}
                placeholder="Poste — ex : Chef de projet" aria-label={`Poste expérience ${i + 1}`}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={e.company} onChange={(ev) => set({ experiences: cv.experiences.map((x, j) => j === i ? { ...x, company: ev.target.value } : x) })}
                placeholder="Entreprise" aria-label="Entreprise"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={e.period} onChange={(ev) => set({ experiences: cv.experiences.map((x, j) => j === i ? { ...x, period: ev.target.value } : x) })}
                placeholder="2021 — 2024" aria-label="Période"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <textarea value={e.desc} onChange={(ev) => set({ experiences: cv.experiences.map((x, j) => j === i ? { ...x, desc: ev.target.value } : x) })}
              placeholder="Missions et réalisations clés (une par ligne)…" aria-label="Description des missions"
              className="w-full h-16 p-3 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        <button onClick={() => set({ experiences: [...cv.experiences, { role: "", company: "", period: "", desc: "" }] })}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-4 h-4" /> Ajouter une expérience
        </button>
      </div>

      {/* Formation */}
      <div className="space-y-3">
        <SectionTitle icon={GraduationCap} label="Formation" />
        {cv.education.map((e, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={e.degree} onChange={(ev) => set({ education: cv.education.map((x, j) => j === i ? { ...x, degree: ev.target.value } : x) })}
              placeholder="Diplôme — ex : Master Informatique" aria-label={`Diplôme ${i + 1}`}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={e.school} onChange={(ev) => set({ education: cv.education.map((x, j) => j === i ? { ...x, school: ev.target.value } : x) })}
              placeholder="École / Université" aria-label="Établissement"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={e.period} onChange={(ev) => set({ education: cv.education.map((x, j) => j === i ? { ...x, period: ev.target.value } : x) })}
              placeholder="2019" aria-label="Année"
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => set({ education: cv.education.filter((_, j) => j !== i) })}
              disabled={cv.education.length === 1} aria-label="Supprimer cette formation"
              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => set({ education: [...cv.education, { degree: "", school: "", period: "" }] })}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="w-4 h-4" /> Ajouter une formation
        </button>
      </div>

      {/* Compétences + langues + intérêts */}
      <div className="space-y-3">
        <SectionTitle icon={Languages} label="Compétences, langues & intérêts" />
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Compétences (séparées par des virgules)</span>
          <input value={cv.skills} onChange={(e) => set({ skills: e.target.value })}
            placeholder="React, Gestion de projet, Photoshop, Comptabilité…" className={inputCls} />
        </label>
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Langues</span>
          {cv.languages.map((l, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={l.name} onChange={(ev) => set({ languages: cv.languages.map((x, j) => j === i ? { ...x, name: ev.target.value } : x) })}
                placeholder="Anglais" aria-label={`Langue ${i + 1}`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={l.level} onChange={(ev) => set({ languages: cv.languages.map((x, j) => j === i ? { ...x, level: ev.target.value } : x) })}
                aria-label="Niveau"
                className="w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {LEVELS.map((lv) => <option key={lv}>{lv}</option>)}
              </select>
              <button onClick={() => set({ languages: cv.languages.filter((_, j) => j !== i) })}
                disabled={cv.languages.length === 1} aria-label="Supprimer cette langue"
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={() => set({ languages: [...cv.languages, { name: "", level: "Intermédiaire" }] })}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Plus className="w-4 h-4" /> Ajouter une langue
          </button>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Centres d'intérêt (optionnel)</span>
          <input value={cv.interests} onChange={(e) => set({ interests: e.target.value })}
            placeholder="Football, Lecture, Entrepreneuriat…" className={inputCls} />
        </label>
      </div>

      {/* Aperçu en direct */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPreview(!showPreview)}
          aria-expanded={showPreview}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu en direct"}
        </button>
        {showPreview && (
          <div aria-live="polite" className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-5">
            <div className="w-full max-w-[300px] sm:max-w-[340px] mx-auto">
              <CvPreview cv={cv} />
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              Aperçu indicatif du modèle {TEMPLATES.find((t) => t.id === cv.template)?.label} — le PDF final est plus détaillé
            </p>
          </div>
        )}
      </div>

      {/* Récap + export */}
      <ResultBox label="Aperçu du contenu">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong className="text-gray-900">{cv.fullName || "Votre nom"}</strong> — {cv.jobTitle || "Votre poste"}</p>
          <p className="text-xs text-gray-400">
            Modèle {TEMPLATES.find((t) => t.id === cv.template)?.label} ·{" "}
            {cv.experiences.filter((e) => e.role.trim()).length} expérience(s) ·{" "}
            {cv.education.filter((e) => e.degree.trim()).length} formation(s) ·{" "}
            {cv.skills.split(",").filter((s) => s.trim()).length} compétence(s) ·{" "}
            {cv.languages.filter((l) => l.name.trim()).length} langue(s)
          </p>
          <p className="text-xs text-green-600">💾 Brouillon sauvegardé automatiquement dans votre navigateur.</p>
        </div>
      </ResultBox>

      {!canExport && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Renseignez au minimum votre nom complet et le poste recherché pour exporter votre CV.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={exportPdf} disabled={!canExport || busy !== null}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Télécharger mon CV en PDF
        </button>
        <button onClick={sharePdf} disabled={!canExport || busy !== null}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {busy === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Partager (WhatsApp, Gmail…)
        </button>
        <ClearButton onClick={reset} label="Nouveau CV" />
      </div>

      {info && (
        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2" aria-live="polite">
          {info}
        </p>
      )}
    </div>
  );
}
