export function countText(text: string) {
  const trimmed = text.trim();
  if (!trimmed)
    return { words: 0, chars: 0, charsNoSpaces: 0, sentences: 0, paragraphs: 0, readingTime: 0 };

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = (trimmed.match(/[.!?]+/g) || []).length || 1;
  const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return { words, chars, charsNoSpaces, sentences, paragraphs, readingTime };
}

export type CaseMode = "upper" | "lower" | "title" | "sentence" | "camel" | "snake" | "kebab";

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/[\p{L}\p{N}][^\s]*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+)([\p{Ll}])/gu, (_, p, c) => p + c.toUpperCase());
    case "camel":
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9à-ÿ]+(.)/g, (_, c: string) => c.toUpperCase())
        .replace(/^[^a-zA-Z0-9à-ÿ]+/, "");
    case "snake":
      return text
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9à-ÿ_]/g, "");
    case "kebab":
      return text
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9à-ÿ-]/g, "");
  }
}

export function removeDuplicates(
  text: string,
  opts: { trim?: boolean; caseInsensitive?: boolean; removeEmpty?: boolean } = {}
): { result: string; removed: number; kept: number } {
  let lines = text.split("\n");
  if (opts.trim) lines = lines.map((l) => l.trim());
  if (opts.removeEmpty) lines = lines.filter((l) => l.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = opts.caseInsensitive ? line.toLowerCase() : line;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line);
    }
  }
  return { result: out.join("\n"), removed: lines.length - out.length, kept: out.length };
}

export function extractEmails(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(regex) || [])];
}

const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
    " "
  );

export function generateLorem(paragraphs = 3, wordsPerParagraph = 60, startClassic = true): string {
  const out: string[] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let p = 0; p < paragraphs; p++) {
    const words: string[] = [];
    if (p === 0 && startClassic) words.push("Lorem", "ipsum", "dolor", "sit", "amet,");
    while (words.length < wordsPerParagraph) {
      words.push(LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)]);
    }
    let sentence = words.join(" ");
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    // ponctuation pseudo-aléatoire
    sentence = sentence
      .split(" ")
      .map((w, i) => (i > 0 && i % 12 === 0 ? w + "." : i > 0 && i % 7 === 0 ? w + "," : w))
      .join(" ")
      .replace(/[,.]?$/, ".");
    out.push(sentence);
  }
  return out.join("\n\n");
}
