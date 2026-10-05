import ExcelJS from "exceljs";

const SRC = process.argv[2];
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);
const sheet = wb.worksheets[0];

function show(n) {
  const row = sheet.getRow(n);
  const bits = [];
  for (let c = 45; c <= 90; c++) {
    const v = row.getCell(c).value;
    if (v == null || v === "") continue;
    const s = v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "object" ? JSON.stringify(v).slice(0, 40) : String(v);
    bits.push(c + ":" + s);
  }
  const name = row.getCell(23).value;
  console.log("ROW", n, "name=", typeof name === "string" ? name.slice(0, 40) : name);
  console.log(bits.join(" | ") || "(no repertoire marks 45-90)");
}

for (const n of [2, 3, 10, 100, 500, 2000, 3510, 3512, 3513, 4000, 5000, 6000, 6420]) show(n);

// How many columns equal "x" on row 2 vs row 4000
function xcount(n) {
  let x = 0, other = 0, empty = 0;
  const row = sheet.getRow(n);
  for (let c = 45; c <= 183; c++) {
    const v = row.getCell(c).value;
    if (v == null || v === "") empty++;
    else if (v === "x") x++;
    else other++;
  }
  return { n, x, other, empty };
}
console.log("x density", [2, 100, 1000, 3000, 3511, 3512, 3600, 4500, 5500, 6400].map(xcount));
