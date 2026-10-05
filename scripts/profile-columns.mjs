/**
 * Profil compact des colonnes. Lecture seule.
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const SRC = process.argv[2];

function textOf(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.formula || v.sharedFormula) {
      return { formula: String(v.formula || v.sharedFormula).slice(0, 120), result: textOf(v.result) };
    }
    if (v.hyperlink || v.text) return { text: textOf(v.text), hyperlink: v.hyperlink ?? null };
    if (v.error) return { error: String(v.error) };
    if (typeof v.result !== "undefined") return textOf(v.result);
    return JSON.stringify(v).slice(0, 80);
  }
  if (typeof v === "string") return v.replace(/\s+/g, " ").trim();
  return v;
}

function kind(raw, shown) {
  if (raw && typeof raw === "object" && (raw.formula || raw.sharedFormula)) return "formula";
  if (raw && typeof raw === "object" && raw.hyperlink) return "hyperlink";
  if (raw instanceof Date) return "date";
  if (typeof shown === "number") return "number";
  if (typeof shown === "boolean") return "bool";
  if (shown && typeof shown === "object" && shown.hyperlink) return "hyperlink";
  if (typeof shown === "string" && /^https?:\/\//i.test(shown)) return "url";
  return "text";
}

function clip(v) {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 80 ? s.slice(0, 77) + "..." : s;
}

function profileSheet(sheet, { headerRow = 1, sampleFormulas = 3 } = {}) {
  const cols = new Map();
  const maxCol = sheet.actualColumnCount || sheet.columnCount;
  for (let c = 1; c <= maxCol; c++) {
    const headerCell = sheet.getRow(headerRow).getCell(c);
    cols.set(c, {
      col: c,
      letter: headerCell.address.replace(/[0-9]/g, ""),
      header: textOf(headerCell.value),
      filled: 0,
      formulas: 0,
      kinds: {},
      distinct: new Map(),
      formulaSamples: [],
    });
  }

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === headerRow) return;
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const p = cols.get(col);
      if (!p) return;
      const shown = textOf(cell.value);
      if (shown == null || shown === "") return;
      p.filled++;
      const k = kind(cell.value, shown);
      p.kinds[k] = (p.kinds[k] || 0) + 1;
      if (k === "formula") {
        p.formulas++;
        if (p.formulaSamples.length < sampleFormulas) {
          p.formulaSamples.push({ row: rowNumber, value: shown });
        }
      }
      const key = clip(shown);
      p.distinct.set(key, (p.distinct.get(key) || 0) + 1);
    });
  });

  return [...cols.values()].map((p) => {
    const top = [...p.distinct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, count }));
    return {
      col: p.col,
      letter: p.letter,
      header: typeof p.header === "string" ? p.header : p.header,
      filled: p.filled,
      distinct: p.distinct.size,
      formulas: p.formulas,
      kinds: p.kinds,
      top,
      formulaSamples: p.formulaSamples,
    };
  });
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);

const mainName = wb.worksheets[0].name;
const main = wb.getWorksheet(mainName);
const mainCols = profileSheet(main);

const others = {};
for (const sheet of wb.worksheets) {
  if (sheet.name === mainName) continue;
  others[sheet.name] = profileSheet(sheet);
}

const merges = main.model?.merges ?? [];
const row2546 = [];
const row = main.getRow(2546);
row.eachCell({ includeEmpty: false }, (cell, col) => {
  row2546.push({ col, address: cell.address, value: textOf(cell.value) });
});

const out = {
  mainSheet: mainName,
  merges: merges.slice(0, 80),
  mergeCount: merges.length,
  row2546,
  mainColumns: mainCols,
  otherSheets: others,
};

fs.mkdirSync("analysis", { recursive: true });
fs.writeFileSync("analysis/columns.json", JSON.stringify(out, null, 2));

console.log("main columns", mainCols.length, "filled headers", mainCols.filter((c) => c.header).length);
console.log("row2546 cells", row2546.length);
console.log("merges", merges.length);
for (const c of mainCols) {
  const h = c.header == null ? "" : String(c.header).replace(/\n/g, " ");
  console.log(
    `${String(c.col).padStart(3)} ${c.letter.padEnd(4)} f=${String(c.filled).padStart(5)} d=${String(c.distinct).padStart(5)} ${h.slice(0, 42)}`,
  );
}
