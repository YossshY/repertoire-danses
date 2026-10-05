import { isoDate, semanticOf } from "./text.mjs";

function commentText(note) {
  if (!note) return null;
  if (typeof note === "string") return note;
  if (Array.isArray(note.texts)) return note.texts.map((part) => part.text || "").join("");
  if (typeof note.text === "string") return note.text;
  if (Array.isArray(note)) return note.map((part) => part.text || String(part)).join("");
  try {
    return JSON.stringify(note);
  } catch {
    return String(note);
  }
}

function formatted(cell) {
  try {
    if (cell.text != null && String(cell.text) !== "") return String(cell.text);
  } catch {
    /* exceljs peut échouer sur une valeur vide */
  }
  return "";
}

function resultText(result) {
  if (result == null) return null;
  if (result instanceof Date) return isoDate(result);
  if (typeof result === "object") {
    if (result.richText) return result.richText.map((part) => part.text).join("");
    if (result.text) return String(result.text);
    return JSON.stringify(result);
  }
  return String(result);
}

/** Décrit une cellule sans rien interpréter comme donnée métier. */
export function describeCell(cell) {
  const value = cell.value;
  let kind = "vide";
  let text = "";
  let formula = null;
  let formulaResult = null;
  let hyperlink = null;
  let normalized = null;

  if (value == null || value === "") {
    kind = "vide";
  } else if (value instanceof Date) {
    kind = "date";
    text = formatted(cell) || isoDate(value) || "";
    normalized = isoDate(value);
  } else if (typeof value === "number") {
    kind = "nombre";
    text = formatted(cell) || String(value);
    normalized = String(value);
  } else if (typeof value === "boolean") {
    kind = "booleen";
    text = value ? "VRAI" : "FAUX";
    normalized = text;
  } else if (typeof value === "object") {
    if (value.formula || value.sharedFormula) {
      kind = "formule";
      formula = String(value.formula || value.sharedFormula);
      formulaResult = resultText(value.result);
      text = `=${formula}`;
    } else if (value.richText) {
      kind = "texte";
      text = value.richText.map((part) => part.text || "").join("");
    } else if (value.hyperlink || value.text != null) {
      kind = "hyperlien";
      hyperlink = value.hyperlink || null;
      text = typeof value.text === "string" ? value.text : formatted(cell);
    } else if (value.error) {
      kind = "erreur";
      text = String(value.error?.error || value.error);
    } else if (value.result !== undefined) {
      kind = "formule";
      formula = value.formula ? String(value.formula) : null;
      formulaResult = resultText(value.result);
      text = formula ? `=${formula}` : formatted(cell);
    } else {
      kind = "texte";
      text = formatted(cell) || JSON.stringify(value);
    }
  } else {
    kind = "texte";
    text = String(value);
  }

  if (!hyperlink && cell.hyperlink) {
    hyperlink = typeof cell.hyperlink === "string" ? cell.hyperlink : cell.hyperlink.target || cell.hyperlink.hyperlink || null;
    if (hyperlink && (kind === "texte" || kind === "nombre" || kind === "date")) kind = "hyperlien";
  }
  if (hyperlink && typeof hyperlink !== "string") hyperlink = String(hyperlink);

  if (kind === "texte" && /^https?:\/\//i.test(text.trim())) kind = "url";

  const comment = commentText(cell.note);
  const semantic = semanticOf(text, kind);
  const kept = text !== "" || formula || hyperlink || comment;
  return {
    col: cell.col,
    address: cell.address,
    text,
    kind,
    formula,
    formulaResult,
    hyperlink,
    comment,
    numFmt: cell.numFmt || null,
    normalized,
    semantic,
    kept,
  };
}

export function cellIsKept(described) {
  return Boolean(described.kept);
}
