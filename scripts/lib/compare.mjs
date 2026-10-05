import { DatabaseSync } from "node:sqlite";
import ExcelJS from "exceljs";
import { describeCell } from "./cell.mjs";

function kept(described) {
  return described.text !== "" || described.formula || described.hyperlink || described.comment;
}

/**
 * Relecture indépendante du classeur.
 * Une cellule non vide absente de source_cells est une perte.
 */
export async function compareWorkbook(xlsxPath, dbPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const stored = new Map();
  const statement = db.prepare(`
    SELECT sh.name AS sheet, c.source_row AS row, col.col_index AS col, c.raw_text AS text, c.hyperlink AS hyperlink
    FROM source_cells c
    JOIN source_columns col ON col.id = c.column_id
    JOIN source_sheets sh ON sh.id = col.sheet_id
  `);
  for (const row of statement.all()) {
    stored.set(`${row.sheet}\t${row.row}\t${row.col}`, row);
  }

  let identical = 0;
  let lost = 0;
  let mismatch = 0;
  const lostSamples = [];
  const mismatchSamples = [];
  const perSheet = [];

  for (const sheet of workbook.worksheets) {
    let sheetLost = 0;
    let sheetOk = 0;
    let seen = 0;
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        const described = describeCell(cell);
        if (!kept(described)) return;
        seen++;
        const key = `${sheet.name}\t${rowNumber}\t${col}`;
        const hit = stored.get(key);
        if (!hit) {
          sheetLost++;
          lost++;
          if (lostSamples.length < 15) lostSamples.push({ sheet: sheet.name, address: cell.address, text: described.text });
          return;
        }
        stored.delete(key);
        const sameText = (hit.text || "") === described.text;
        const sameLink = (hit.hyperlink || null) === (described.hyperlink || null);
        if (!sameText || !sameLink) {
          mismatch++;
          if (mismatchSamples.length < 15) {
            mismatchSamples.push({
              sheet: sheet.name,
              address: cell.address,
              excel: described.text,
              base: hit.text,
              excelLink: described.hyperlink || null,
              baseLink: hit.hyperlink || null,
            });
          }
          return;
        }
        sheetOk++;
        identical++;
      });
    });
    perSheet.push({ sheet: sheet.name, cellules: seen, identiques: sheetOk, perdues: sheetLost });
  }

  const extra = stored.size;
  db.close();
  return {
    identical,
    lost,
    mismatch,
    extra,
    lostSamples,
    mismatchSamples,
    perSheet,
    ok: lost === 0 && mismatch === 0,
  };
}
