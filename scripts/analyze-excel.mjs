/**
 * Lecture seule du classeur source. N'écrit jamais dans le xlsx.
 * Produit analysis/overview.json
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const SRC = process.argv[2];
const OUT = path.resolve("analysis/overview.json");

function simplify(v, depth = 0) {
  if (v == null) return null;
  if (depth > 4) return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if (Array.isArray(v)) return v.map((x) => simplify(x, depth + 1));
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.formula || v.sharedFormula) {
      return {
        formula: v.formula || v.sharedFormula,
        result: simplify(v.result, depth + 1),
      };
    }
    if (v.hyperlink || v.text) {
      return { text: simplify(v.text, depth + 1), hyperlink: v.hyperlink ?? null };
    }
    if (v.error) return { error: String(v.error) };
    if (typeof v.result !== "undefined" && v.formula == null) {
      return simplify(v.result, depth + 1);
    }
  }
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return v;
  return String(v);
}

function previewRows(sheet, n) {
  const rows = [];
  const max = Math.min(n, sheet.rowCount || n);
  for (let r = 1; r <= max; r++) {
    const row = sheet.getRow(r);
    const cells = [];
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      cells.push({ col, address: cell.address, value: simplify(cell.value) });
    });
    rows.push({ r, cells });
  }
  return rows;
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);

const sheets = [];
for (const sheet of wb.worksheets) {
  const info = {
    name: sheet.name,
    rowCount: sheet.rowCount,
    columnCount: sheet.columnCount,
    actualRowCount: sheet.actualRowCount,
    actualColumnCount: sheet.actualColumnCount,
    preview: previewRows(sheet, 4),
  };
  sheets.push(info);
  console.log(
    `${sheet.name}\trows=${sheet.rowCount}\tcols=${sheet.columnCount}\tactual=${sheet.actualRowCount}x${sheet.actualColumnCount}`,
  );
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ file: path.basename(SRC), sheets }, null, 2));
console.log("wrote", OUT);
