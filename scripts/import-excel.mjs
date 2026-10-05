import fs from "fs";
import path from "path";
import { backupIfExists, migrate } from "./lib/migrate.mjs";
import { compareWorkbook } from "./lib/compare.mjs";
import { writeReports } from "./lib/reports.mjs";

const root = process.cwd();
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const xlsx = args[0] || "C:\\Users\\charl\\Desktop\\00 aa REPERTOIRE des DANSES 6.303 au 15-06-2026 Orig.xlsx";
const replace = process.argv.includes("--remplacer");
const dataDir = path.join(root, "data");
const finalPath = path.join(dataDir, "repertoire.db");
const tempPath = path.join(dataDir, "repertoire.importing.db");

if (!fs.existsSync(xlsx)) {
  console.error("Fichier Excel introuvable.");
  process.exit(1);
}
if (fs.existsSync(finalPath) && !replace) {
  console.error("Une base existe déjà. Relancez avec --remplacer. Une sauvegarde sera créée avant de la remplacer.");
  process.exit(1);
}

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(root, "documents", "pdf"), { recursive: true });
fs.mkdirSync(path.join(root, "documents", "images"), { recursive: true });
fs.mkdirSync(path.join(root, "config"), { recursive: true });
const configPath = path.join(root, "config", "config.json");
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ backupRetention: 30 }, null, 2));
}
const sourceDir = path.join(root, "SOURCE");
fs.mkdirSync(sourceDir, { recursive: true });
const sourceCopy = path.join(sourceDir, path.basename(xlsx));
if (!fs.existsSync(sourceCopy)) fs.copyFileSync(xlsx, sourceCopy);

const backup = backupIfExists(finalPath, path.join(root, "backups"));
if (backup) console.log(`Sauvegarde : ${path.basename(backup)}`);
if (fs.existsSync(tempPath)) fs.rmSync(tempPath);

const summary = await migrate(xlsx, tempPath);
const compare = await compareWorkbook(xlsx, tempPath);
const report = writeReports(tempPath, compare, path.join(root, "docs"));

if (!compare.ok) {
  console.error(`Import non retenu : ${compare.lost} cellule(s) perdue(s), ${compare.mismatch} différente(s).`);
  console.error("La base temporaire est dans data/repertoire.importing.db");
  process.exit(1);
}

if (fs.existsSync(finalPath)) fs.rmSync(finalPath);
fs.renameSync(tempPath, finalPath);
for (const suffix of ["-wal", "-shm"]) {
  const side = tempPath + suffix;
  if (fs.existsSync(side)) fs.rmSync(side);
}

console.log(JSON.stringify({ ...summary, ...report, perdus: compare.lost, identiques: compare.identical }, null, 2));
