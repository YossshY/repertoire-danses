import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import ExcelJS from "exceljs";
import { DatabaseSync } from "node:sqlite";
import { migrate } from "./lib/migrate.mjs";
import { compareWorkbook } from "./lib/compare.mjs";

const REAL = process.env.REPERTOIRE_XLSX || "C:\\Users\\charl\\Desktop\\00 aa REPERTOIRE des DANSES 6.303 au 15-06-2026 Orig.xlsx";

function openRead(dbPath) {
  return new DatabaseSync(dbPath, { readOnly: true });
}

async function fixtureFile(dir) {
  const workbook = new ExcelJS.Workbook();
  const main = workbook.addWorksheet("Principal");
  const headers = {
    1: "DATE",
    12: "Lien YouTube",
    14: "PDF en FR",
    22: "Type de danse",
    23: "DANSES (Suggérées)",
    26: "CHANSONS",
    27: "INTERPRÈTES",
    29: "PAS",
    30: "MUR",
    33: "CHORÉGRAPHES",
    35: "NIVEAU",
    36: "Type de danse",
    39: "N°",
    45: "Riverside Club",
  };
  for (const [col, header] of Object.entries(headers)) main.getCell(1, Number(col)).value = header;
  main.getCell(2, 1).value = "Colonne1";
  main.getCell(2, 23).value = "Colonne23";
  main.getCell(2, 45).value = "Colonne45";

  main.getCell(3, 1).value = new Date(2020, 6, 14);
  main.getCell(3, 2).value = ".";
  main.getCell(3, 12).value = { text: "Voir", hyperlink: "https://youtu.be/abc" };
  main.getCell(3, 14).value = "Fr";
  main.getCell(3, 22).value = "Partner";
  main.getCell(3, 23).value = "Have It All";
  main.getCell(3, 26).value = "Good Hearted Woman";
  main.getCell(3, 27).value = "Willie Nelson";
  main.getCell(3, 29).value = 32;
  main.getCell(3, 30).value = 4;
  main.getCell(3, 33).value = "Inconnu";
  main.getCell(3, 35).value = "?";
  main.getCell(3, 36).value = "Partner";
  main.getCell(3, 39).value = 986;
  main.getCell(3, 45).value = "x";

  main.getCell(4, 23).value = "Have It All";
  main.getCell(4, 26).value = "Autre chanson";
  main.getCell(4, 29).value = "2n";
  main.getCell(4, 33).value = "Daisy Simons (BEL)";
  main.getCell(4, 35).value = "Novice";
  main.getCell(4, 39).value = 986;
  main.getCell(4, 45).value = "?";

  main.getCell(5, 23).value = { formula: "A5:AA5", result: "BOOM" };
  main.getCell(5, 45).value = 12;

  main.getCell(6, 23).value = "Exact Link";
  main.getCell(6, 29).value = 48.1;
  main.getCell(6, 33).value = "Daisy Simons";
  main.getCell(6, 45).value = new Date(2024, 0, 2);

  const people = workbook.addWorksheet("Chorégraphes");
  people.getCell(1, 1).value = 1;
  people.getCell(1, 2).value = 2;
  people.getCell(1, 3).value = 3;
  people.getCell(1, 4).value = 4;
  people.getCell(1, 5).value = 5;
  people.getCell(2, 1).value = "Daisy Simons";
  people.getCell(2, 2).value = "Daisy Simons";
  people.getCell(2, 3).value = "Belgique";
  people.getCell(2, 4).value = "BE";
  people.getCell(2, 5).value = "BEL";

  const file = path.join(dir, "mini.xlsx");
  await workbook.xlsx.writeFile(file);
  return file;
}

test("fichier miniature : rien n'est perdu, rien n'est fusionné", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repertoire-"));
  const xlsx = await fixtureFile(dir);
  const dbPath = path.join(dir, "test.db");
  await migrate(xlsx, dbPath);
  const compare = await compareWorkbook(xlsx, dbPath);
  assert.equal(compare.lost, 0, JSON.stringify(compare.lostSamples));
  assert.equal(compare.mismatch, 0, JSON.stringify(compare.mismatchSamples));

  const db = openRead(dbPath);
  const dances = db.prepare("SELECT nom, nom_semantic, niveau_original, niveau_id, pas, pas_original, choregraphe_original, source_row FROM dances ORDER BY source_row").all();
  assert.equal(dances.filter((dance) => dance.nom === "Have It All").length, 2);
  assert.equal(dances.some((dance) => dance.nom === "BOOM"), false);
  const formulaDance = dances.find((dance) => dance.nom_semantic === "formule");
  assert.ok(formulaDance);
  assert.equal(formulaDance.nom, null);
  const novice = dances.find((dance) => dance.niveau_original === "Novice");
  assert.ok(novice.niveau_id);
  const unknownLevel = dances.find((dance) => dance.niveau_original === "?");
  assert.equal(unknownLevel.niveau_id, null);
  const oddSteps = dances.find((dance) => dance.pas_original === "2n");
  assert.equal(oddSteps.pas, null);
  assert.equal(oddSteps.pas_original, "2n");
  const decimalSteps = dances.find((dance) => dance.nom === "Exact Link");
  assert.ok(Math.abs(decimalSteps.pas - 48.1) < 1e-9);

  const dot = db.prepare("SELECT semantic, raw_text FROM source_cells WHERE raw_text = '.'").get();
  assert.equal(dot.semantic, "incertain");

  const formula = db.prepare("SELECT raw_text, formula_result FROM source_cells WHERE raw_kind = 'formule'").get();
  assert.match(formula.raw_text, /^=A5:AA5/);
  assert.equal(formula.formula_result, "BOOM");

  const link = db.prepare("SELECT url, label, valeur_originale FROM liens").get();
  assert.equal(link.url, "https://youtu.be/abc");
  assert.equal(link.label, "Voir");

  const exact = db.prepare(`
    SELECT liaison FROM danse_choregraphe dc
    JOIN dances d ON d.id = dc.danse_id
    WHERE d.nom = 'Exact Link'
  `).get();
  assert.equal(exact.liaison, "exacte");
  const similar = db.prepare(`
    SELECT COUNT(*) AS n FROM danse_choregraphe WHERE valeur_originale = 'Daisy Simons (BEL)' AND liaison = 'exacte'
  `).get();
  assert.equal(similar.n, 0);
  const proposal = db.prepare("SELECT COUNT(*) AS n FROM propositions WHERE type = 'choregraphe'").get();
  assert.ok(proposal.n >= 1);

  const values = db.prepare(`
    SELECT dr.valeur_originale, dr.interpretation, dr.nombre_valeur, dr.date_valeur
    FROM danse_repertoire dr
    JOIN repertoires r ON r.id = dr.repertoire_id
    WHERE r.nom = 'Riverside Club'
    ORDER BY dr.valeur_originale
  `).all();
  assert.ok(values.some((row) => row.valeur_originale === "x" && row.interpretation === "texte"));
  assert.ok(values.some((row) => row.valeur_originale === "?" && row.interpretation === "inconnu"));
  assert.ok(values.some((row) => row.interpretation === "nombre" && row.nombre_valeur === 12));
  assert.ok(values.some((row) => row.interpretation === "date" && row.date_valeur));

  const ignored = db.prepare("SELECT COUNT(*) AS n FROM source_columns WHERE status = 'ignore'").get();
  assert.equal(ignored.n, 0);
  const technical = db.prepare("SELECT COUNT(*) AS n FROM source_cells WHERE semantic = 'technique' AND raw_text = 'Colonne23'").get();
  assert.equal(technical.n, 1);
  db.close();
});

test("classeur réel : zéro cellule perdue", { timeout: 180000 }, async () => {
  if (!fs.existsSync(REAL)) return;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repertoire-reel-"));
  const dbPath = path.join(dir, "reel.db");
  const summary = await migrate(REAL, dbPath);
  const compare = await compareWorkbook(REAL, dbPath);
  assert.equal(compare.lost, 0, JSON.stringify(compare.lostSamples));
  assert.equal(compare.mismatch, 0, JSON.stringify(compare.mismatchSamples));
  assert.equal(summary.formulas, 0);
  assert.ok(summary.dances > 6000);
  assert.equal(compare.perSheet.length, 10);

  const db = openRead(dbPath);
  const row = db.prepare(`
    SELECT nom, interprete_original, musique_originale FROM dances WHERE source_row = 2546
  `).get();
  assert.equal(row.nom, "Have I Told You");
  assert.match(row.interprete_original, /Elizma/);
  const link = db.prepare(`
    SELECT url FROM liens l
    JOIN dances d ON d.id = l.danse_id
    WHERE d.source_row = 2546 AND l.type = 'youtube'
  `).get();
  assert.match(link.url, /6OAaQXh60WE/);
  const repeated = db.prepare("SELECT COUNT(*) AS n FROM dances WHERE nom = 'The Sway (P) PG'").get();
  assert.ok(repeated.n >= 50);
  const unknownNames = db.prepare("SELECT COUNT(*) AS n FROM dances WHERE nom = '?'").get();
  assert.ok(unknownNames.n > 200);
  const dots = db.prepare("SELECT COUNT(*) AS n FROM source_cells WHERE raw_text = '.'").get();
  assert.ok(dots.n > 0);
  const a2546 = db.prepare(`
    SELECT COUNT(*) AS n FROM source_cells c
    JOIN source_columns col ON col.id = c.column_id
    JOIN source_sheets sh ON sh.id = col.sheet_id
    WHERE sh.role = 'main' AND c.address = 'A2546'
  `).get();
  assert.equal(a2546.n, 0);
  const ignored = db.prepare("SELECT COUNT(*) AS n FROM source_columns WHERE status = 'ignore'").get();
  assert.equal(ignored.n, 0);
  const annexe = db.prepare("SELECT COUNT(*) AS n FROM annexes WHERE sheet = 'Feuil1'").get();
  assert.ok(annexe.n >= 1);
  const restos = db.prepare("SELECT COUNT(*) AS n FROM restaurants").get();
  assert.ok(restos.n >= 20);
  const matt = db.prepare("SELECT COUNT(*) AS n FROM matt_lucky_lignes").get();
  assert.ok(matt.n >= 40);
  db.close();
});
