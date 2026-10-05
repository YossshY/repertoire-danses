import path from "path";
import { compareWorkbook } from "./lib/compare.mjs";

const xlsx = process.argv[2] || "C:\\Users\\charl\\Desktop\\00 aa REPERTOIRE des DANSES 6.303 au 15-06-2026 Orig.xlsx";
const dbPath = process.argv[3] || path.join(process.cwd(), "data", "repertoire.db");
const result = await compareWorkbook(xlsx, dbPath);
console.log(JSON.stringify({
  identiques: result.identical,
  perdues: result.lost,
  differentes: result.mismatch,
  enTrop: result.extra,
  feuilles: result.perSheet,
  exemplesPerdus: result.lostSamples,
  exemplesDifferents: result.mismatchSamples,
}, null, 2));
process.exit(result.ok ? 0 : 1);
