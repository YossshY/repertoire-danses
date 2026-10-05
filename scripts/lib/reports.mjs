import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

function mdCell(value) {
  return String(value ?? "").replace(/\|/g, "/").replace(/\n/g, " ").slice(0, 180);
}

export function writeReports(dbPath, compareResult, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const one = (sql) => db.prepare(sql).get();
  const all = (sql) => db.prepare(sql).all();

  const counts = {
    danses: one("SELECT COUNT(*) AS n FROM dances").n,
    choregraphes: one("SELECT COUNT(*) AS n FROM choregraphes").n,
    musiques: one("SELECT COUNT(*) AS n FROM musiques").n,
    repertoires: one("SELECT COUNT(*) AS n FROM repertoires").n,
    liens: one("SELECT COUNT(*) AS n FROM liens").n,
    revisions: one("SELECT COUNT(*) AS n FROM revisions").n,
    restaurants: one("SELECT COUNT(*) AS n FROM restaurants").n,
    annexes: one("SELECT COUNT(*) AS n FROM annexes").n,
    matt: one("SELECT COUNT(*) AS n FROM matt_lucky_lignes").n,
    numeros: one("SELECT COUNT(*) AS n FROM numeros_historiques").n,
    pays: one("SELECT COUNT(*) AS n FROM pays").n,
    cellules: one("SELECT COUNT(*) AS n FROM source_cells").n,
    propositions: one("SELECT COUNT(*) AS n FROM propositions").n,
    anomalies: one("SELECT COUNT(*) AS n FROM anomalies").n,
    formules: one("SELECT COUNT(*) AS n FROM source_cells WHERE raw_kind = 'formule'").n,
  };
  const semantics = all("SELECT semantic, COUNT(*) AS n FROM source_cells GROUP BY semantic ORDER BY n DESC");
  const sheets = all("SELECT name, role, row_count, column_count, strategy FROM source_sheets");
  const columns = all(`
    SELECT sh.name AS feuille, col.letter, col.col_index, col.header, col.filled, col.empty_count,
           col.distinct_count, col.status, col.destination, col.notes
    FROM source_columns col
    JOIN source_sheets sh ON sh.id = col.sheet_id
    ORDER BY sh.rowid, col.col_index
  `);
  const ignored = columns.filter((column) => column.status === "ignore");
  const waiting = columns.filter((column) => column.status === "a_analyser");
  const numeroOnly = one(`
    SELECT COUNT(*) AS n FROM numeros_historiques h
    WHERE NOT EXISTS (SELECT 1 FROM dances d WHERE d.numero = h.valeur AND d.deleted_at IS NULL)
  `).n;
  const danceOnly = one(`
    SELECT COUNT(*) AS n FROM (
      SELECT DISTINCT numero FROM dances
      WHERE numero IS NOT NULL AND deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM numeros_historiques h WHERE h.valeur = dances.numero)
    )
  `).n;
  const numeroDup = all(`
    SELECT valeur, COUNT(*) AS n FROM numeros_historiques GROUP BY valeur HAVING n > 1 ORDER BY n DESC LIMIT 10
  `);

  const mapping = [];
  mapping.push("# Matrice Excel → application");
  mapping.push("");
  mapping.push("Chaque colonne a une destination. Le statut `a_analyser` signifie que la valeur est conservée et que son sens métier n'est pas encore figé. Aucune colonne n'est ignorée.");
  mapping.push("");
  mapping.push("| Feuille | Colonne | En-tête | Remplies | Distinctes | Statut | Destination |");
  mapping.push("| --- | --- | --- | ---: | ---: | --- | --- |");
  for (const column of columns) {
    mapping.push(
      `| ${mdCell(column.feuille)} | ${column.letter} | ${mdCell(column.header)} | ${column.filled} | ${column.distinct_count} | ${column.status} | ${mdCell(column.destination)} |`,
    );
  }
  if (waiting.length) {
    mapping.push("");
    mapping.push("## Colonnes encore à analyser");
    mapping.push("");
    for (const column of waiting) {
      mapping.push(`- ${column.feuille} ${column.letter} — ${mdCell(column.header) || "(sans en-tête)"} — ${mdCell(column.notes)}`);
    }
  }

  const rapport = [];
  rapport.push("# Rapport de migration");
  rapport.push("");
  rapport.push(`Feuilles analysées : ${sheets.length}/${sheets.length}`);
  rapport.push("");
  rapport.push("## Feuilles");
  rapport.push("");
  for (const sheet of sheets) {
    rapport.push(`- **${sheet.name}** (${sheet.role}, ${sheet.row_count} lignes × ${sheet.column_count} colonnes) — ${sheet.strategy}`);
  }
  rapport.push("");
  rapport.push("## Données importées");
  rapport.push("");
  rapport.push(`- Cellules sources : ${counts.cellules}`);
  rapport.push(`- Danses : ${counts.danses}`);
  rapport.push(`- Chorégraphes : ${counts.choregraphes}`);
  rapport.push(`- Musiques : ${counts.musiques}`);
  rapport.push(`- Répertoires (une colonne = une entrée, valeurs d'origine conservées) : ${counts.repertoires}`);
  rapport.push(`- Liens : ${counts.liens}`);
  rapport.push(`- Révisions : ${counts.revisions}`);
  rapport.push(`- Lignes Matt & Lucky : ${counts.matt}`);
  rapport.push(`- Numéros historiques : ${counts.numeros}`);
  rapport.push(`- Pays : ${counts.pays}`);
  rapport.push(`- Restaurants : ${counts.restaurants}`);
  rapport.push(`- Annexes (Feuil1, Feuil3) : ${counts.annexes}`);
  rapport.push(`- Propositions de rapprochement, sans fusion : ${counts.propositions}`);
  rapport.push(`- Anomalies : ${counts.anomalies}`);
  rapport.push(`- Formules : ${counts.formules}`);
  rapport.push("");
  rapport.push("## Sens des cellules");
  rapport.push("");
  for (const row of semantics) rapport.push(`- ${row.semantic} : ${row.n}`);
  rapport.push("");
  rapport.push("## Comparaison feuille Numéro / feuille principale");
  rapport.push("");
  rapport.push(`- Valeurs de la feuille Numéro absentes des fiches : ${numeroOnly}`);
  rapport.push(`- Numéros de fiches absents de la feuille Numéro : ${danceOnly}`);
  rapport.push(`- Valeurs répétées dans la feuille Numéro : ${numeroDup.map((row) => `${row.valeur} (${row.n})`).join(", ") || "aucune"}`);
  rapport.push("");
  rapport.push("La feuille Numéro est conservée. Elle n'est pas déclarée redondante.");
  rapport.push("");
  rapport.push("## Comparaison Excel / base");
  rapport.push("");
  rapport.push(`- Cellules identiques : ${compareResult.identical}`);
  rapport.push(`- Cellules différentes : ${compareResult.mismatch}`);
  rapport.push(`- Cellules perdues : ${compareResult.lost}`);
  rapport.push(`- Cellules en base sans équivalent relu : ${compareResult.extra}`);
  rapport.push("");
  rapport.push(compareResult.lost === 0 ? "Données perdues : 0" : `Données perdues : ${compareResult.lost}`);
  rapport.push(`Colonnes en attente d'interprétation : ${waiting.length}`);
  rapport.push(`Colonnes marquées ignore : ${ignored.length}`);
  rapport.push("");
  rapport.push("Les jetons `?`, `??`, `.` et `Inconnu` restent dans les cellules sources. Ils ne sont pas effacés.");
  rapport.push("Les lignes au même nom de danse restent des fiches séparées.");
  rapport.push("Les chorégraphes proches sont proposés, pas fusionnés.");

  const comparaison = [];
  comparaison.push("# Comparaison Excel / SQLite");
  comparaison.push("");
  comparaison.push(`Résultat : ${compareResult.ok ? "aucune perte" : "écart à corriger"}`);
  comparaison.push("");
  comparaison.push("| Feuille | Cellules non vides | Identiques | Perdues |");
  comparaison.push("| --- | ---: | ---: | ---: |");
  for (const sheet of compareResult.perSheet) {
    comparaison.push(`| ${mdCell(sheet.sheet)} | ${sheet.cellules} | ${sheet.identiques} | ${sheet.perdues} |`);
  }
  if (compareResult.lostSamples.length) {
    comparaison.push("");
    comparaison.push("## Exemples perdus");
    for (const sample of compareResult.lostSamples) comparaison.push(`- ${sample.sheet} ${sample.address} : ${mdCell(sample.text)}`);
  }
  if (compareResult.mismatchSamples.length) {
    comparaison.push("");
    comparaison.push("## Exemples différents");
    for (const sample of compareResult.mismatchSamples) {
      comparaison.push(`- ${sample.sheet} ${sample.address} : Excel « ${mdCell(sample.excel)} » / base « ${mdCell(sample.base)} »`);
    }
  }

  fs.writeFileSync(path.join(outDir, "mapping-excel.md"), mapping.join("\n"), "utf8");
  fs.writeFileSync(path.join(outDir, "rapport-migration.md"), rapport.join("\n"), "utf8");
  fs.writeFileSync(path.join(outDir, "comparaison.md"), comparaison.join("\n"), "utf8");
  db.close();
  return { counts, waiting: waiting.length, ignored: ignored.length, numeroOnly, danceOnly };
}
