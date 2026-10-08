import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

const desktop = "C:\\Users\\charl\\Desktop";
const fichier = fs.readdirSync(desktop).find((name) => name.endsWith(".xlsx") && name.includes("modifi"));
const book = new ExcelJS.Workbook();
await book.xlsx.readFile(`${desktop}\\${fichier}`);
const sheet = book.worksheets[0];

function teinte(cell) {
  const fill = cell.fill;
  if (!fill || !fill.fgColor) return "";
  const color = fill.fgColor;
  if (color.argb) return color.argb.toUpperCase();
  if (color.theme != null) return `theme${color.theme}/${color.tint || 0}`;
  return "";
}

function sens(couleur) {
  if (couleur === "FFFF0000") return "aucune";
  if (couleur === "FFFFC000" || couleur === "FFFFCC00") return "moyenne";
  if (couleur === "FF92D050" || couleur === "FF00FF00") return "maitrise";
  if (couleur.startsWith("theme0/-")) return "laisser";
  return "";
}

const maitrises = {};
const compte = {};
sheet.eachRow({ includeEmpty: false }, (row) => {
  const cell = row.getCell(23);
  const valeur = sens(teinte(cell));
  if (!valeur) return;
  maitrises[row.number] = valeur;
  compte[valeur] = (compte[valeur] || 0) + 1;
});

const dest = path.join(process.cwd(), "data", "maitrise.json");
fs.writeFileSync(dest, JSON.stringify(maitrises));
console.log(JSON.stringify(compte));
