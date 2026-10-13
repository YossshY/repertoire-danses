export function notesParLigne(db) {
  const rows = db.prepare(`
    SELECT c.col_index AS col, s.source_row AS ligne, s.raw_text AS texte
    FROM source_cells s
    JOIN source_columns c ON c.id = s.column_id
    JOIN source_sheets sh ON sh.id = c.sheet_id
    WHERE sh.name LIKE '6.%' AND c.col_index IN (8, 11, 17, 18, 28)
  `).all();
  const notes = new Map();
  for (const row of rows) {
    const texte = String(row.texte || "").replace(/\s+/g, " ").trim();
    if (!texte || /^Colonne\d+$/.test(texte) || texte === "." || texte === "?") continue;
    const note = notes.get(row.ligne) || {};
    if (row.col === 8 && /^fr$/i.test(texte)) note.paroles = "fr";
    if (row.col === 11 && !/^(ok|v)$/i.test(texte)) note.videoDe = texte;
    if ((row.col === 17 || row.col === 18) && /^p$/i.test(texte)) note.partenaireApprise = true;
    if ((row.col === 17 || row.col === 18) && /^pp$/i.test(texte)) note.partenaireNonApprise = true;
    if (row.col === 28 && /^[aeqw]$/i.test(texte)) note.extraire = true;
    notes.set(row.ligne, note);
  }
  return notes;
}

export function appliquerNotes(danse, notes) {
  const note = notes.get(danse.source_row) || {};
  danse.videoDe = note.videoDe || "";
  danse.paroles = note.paroles || "";
  danse.partenaireApprise = Boolean(note.partenaireApprise);
  danse.partenaireNonApprise = Boolean(note.partenaireNonApprise);
  danse.extraire = Boolean(note.extraire);
}
