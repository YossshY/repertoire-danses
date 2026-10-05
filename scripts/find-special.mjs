import ExcelJS from "exceljs";

const SRC = process.argv[2];
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);
const sheet = wb.worksheets[0];

const a = sheet.getCell("A2546");
console.log("A2546 value", JSON.stringify(a.value));
console.log("A2546 formula", a.formula, "type", a.type);

let formulaCount = 0;
const samples = [];
sheet.eachRow({ includeEmpty: false }, (row, n) => {
  row.eachCell({ includeEmpty: false }, (cell) => {
    const v = cell.value;
    if (v && typeof v === "object" && (v.formula || v.sharedFormula)) {
      formulaCount++;
      if (samples.length < 15) samples.push({ a: cell.address, v });
    }
  });
});
console.log("formulas", formulaCount);
console.log(JSON.stringify(samples, null, 2).slice(0, 2000));

const colonneRows = [];
sheet.eachRow({ includeEmpty: false }, (row, n) => {
  const w = row.getCell(23).value;
  const text = typeof w === "string" ? w : w && w.richText ? w.richText.map((t) => t.text).join("") : "";
  if (/^Colonne\d+$/i.test(String(text)) || String(text).startsWith("Colonne")) {
    colonneRows.push(n + " W=" + text);
  }
  // any cell exactly ColonneN
  row.eachCell({ includeEmpty: false }, (cell) => {
    const val = cell.value;
    if (typeof val === "string" && /^Colonne\d+$/.test(val)) {
      colonneRows.push(cell.address + "=" + val);
    }
  });
});
console.log("colonne hits", colonneRows.slice(0, 30), "count", colonneRows.length);

// compare V (22) and AJ (36)
let both = 0, differ = 0, onlyV = 0, onlyAJ = 0;
const diffs = [];
for (let r = 2; r <= sheet.rowCount; r++) {
  const v = sheet.getRow(r).getCell(22).value;
  const aj = sheet.getRow(r).getCell(36).value;
  const vs = v == null || v === "" ? "" : String(v);
  const ajs = aj == null || aj === "" ? "" : String(aj);
  if (!vs && !ajs) continue;
  if (vs && ajs) {
    both++;
    if (vs !== ajs) {
      differ++;
      if (diffs.length < 8) diffs.push({ r, vs, ajs });
    }
  } else if (vs) onlyV++;
  else onlyAJ++;
}
console.log({ both, differ, onlyV, onlyAJ, diffs });
