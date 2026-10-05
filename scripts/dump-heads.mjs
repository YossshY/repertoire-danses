import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(process.argv[2]);

function cellText(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.hyperlink || v.text) return `${v.text} -> ${v.hyperlink}`;
    return JSON.stringify(v).slice(0, 80);
  }
  return String(v).replace(/\n/g, " ");
}

function dump(name, n) {
  const s = wb.getWorksheet(name);
  console.log("\n==", name, "==");
  for (let r = 1; r <= n; r++) {
    const cells = [];
    s.getRow(r).eachCell({ includeEmpty: false }, (c, col) => {
      cells.push(`${col}:${cellText(c.value).slice(0, 90)}`);
    });
    console.log(r, cells.join(" | "));
  }
}

dump("Chorégraphes", 3);
dump("Révisions", 4);
dump("Révision Matt & Lucky", 3);
dump("Code ISO", 2);
dump("Pays", 2);
dump("Resto-Aires d'autoroutes", 4);
dump("Feuil3", 10);
dump("Feuil1", 2);
