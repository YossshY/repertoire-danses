/** Normalisation pour la recherche et les comparaisons. Ne remplace jamais la valeur stockée. */
export function fold(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function colLetter(index) {
  let n = index;
  let out = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    out = String.fromCharCode(65 + m) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

const UNKNOWN = new Set(["?", "??", "???", "inconnu", "inconnue", "n/a", "#n/a", "na"]);

/**
 * Distingue le sens sans effacer le texte.
 * non_applicable n'est jamais déduit : trop incertain.
 */
export function semanticOf(text, kind) {
  if (kind === "formule") return "formule";
  if (kind === "erreur") return "erreur";
  const raw = String(text ?? "").trim();
  if (!raw) return "non_renseigne";
  if (/^Colonne\d+$/i.test(raw)) return "technique";
  const key = fold(raw);
  if (UNKNOWN.has(key)) return "inconnu";
  if (key === "." || key === ".." || key === "..." || key === "-" || key === "—") return "incertain";
  return "renseigne";
}

export function isTechnicalRow(cells) {
  if (cells.length < 3) return false;
  return cells.every((cell) => {
    const text = String(cell.text ?? "").trim();
    if (/^Colonne\d+$/i.test(text)) return true;
    if (/^\d+$/.test(text) && Number(text) === cell.col) return true;
    return false;
  });
}

export function isoDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function integerLike(text) {
  const n = decimalLike(text);
  if (n == null || !Number.isInteger(n)) return null;
  return n;
}

export function decimalLike(text) {
  const raw = String(text ?? "").trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function nameKey(value) {
  return fold(String(value ?? "").replace(/\s*\([^)]*\)\s*$/, ""));
}

export function sheetKey(name) {
  return fold(name).replace(/[^a-z0-9]+/g, "");
}
