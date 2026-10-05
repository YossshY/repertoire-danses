import fs from "fs";
import crypto from "crypto";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import ExcelJS from "exceljs";
import { describeCell } from "./cell.mjs";
import { SHEET_STRATEGY, destinationFor, sheetRoleOf } from "./destinations.mjs";
import { colLetter, decimalLike, fold, integerLike, isTechnicalRow, nameKey } from "./text.mjs";

const SCHEMA = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
const LEVELS = ["Débutant", "Novice", "Intermédiaire", "Confirmé", "Avancé"];

function nid() {
  return crypto.randomUUID();
}

function openDatabase(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = OFF");
  db.exec(SCHEMA);
  return db;
}

function kept(described) {
  return described.text !== "" || described.formula || described.hyperlink || described.comment;
}

function collectRows(sheet) {
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells = [];
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const described = describeCell(cell);
      described.col = col;
      if (kept(described)) cells.push(described);
    });
    if (cells.length === 0) return;
    rows.push({ rowNumber, cells, technical: isTechnicalRow(cells) });
  });
  return rows;
}

function headerMap(rows) {
  const headers = new Map();
  const header = rows.find((row) => row.rowNumber === 1);
  if (!header) return headers;
  for (const cell of header.cells) headers.set(cell.col, cell.text);
  return headers;
}

function isMainSheet(headers) {
  for (const text of headers.values()) {
    if (fold(text).includes("danses")) return true;
  }
  return false;
}

function httpUrl(cell) {
  if (!cell) return null;
  for (const candidate of [cell.hyperlink, cell.text]) {
    const value = String(candidate || "").trim();
    if (/^https?:\/\//i.test(value)) return value;
  }
  return null;
}

function dateParts(cell) {
  if (!cell) return { iso: null, original: null, semantic: "non_renseigne" };
  if (cell.kind === "formule") return { iso: null, original: cell.text, semantic: "formule" };
  if (cell.semantic !== "renseigne") return { iso: null, original: cell.text, semantic: cell.semantic };
  if (cell.kind === "date" && cell.normalized) {
    return { iso: cell.normalized, original: cell.text, semantic: "renseigne" };
  }
  return { iso: null, original: cell.text, semantic: "incertain" };
}

function numberParts(cell) {
  if (!cell) return { n: null, original: null, semantic: "non_renseigne" };
  if (cell.kind === "formule") return { n: null, original: cell.text, semantic: "formule" };
  if (cell.semantic !== "renseigne") return { n: null, original: cell.text, semantic: cell.semantic };
  const source = cell.kind === "nombre" && cell.normalized != null ? cell.normalized : cell.text;
  const n = decimalLike(source);
  if (n == null) return { n: null, original: cell.text, semantic: "incertain" };
  return { n, original: cell.text, semantic: "renseigne" };
}

function textParts(cell) {
  if (!cell) return { text: null, semantic: "non_renseigne" };
  if (cell.kind === "formule") return { text: null, semantic: "formule" };
  return { text: cell.text, semantic: cell.semantic };
}

function interpretRepertoire(cell) {
  if (cell.kind === "formule") return { interpretation: "formule", date: null, nombre: null };
  if (cell.semantic === "inconnu" || cell.semantic === "incertain" || cell.semantic === "technique") {
    return { interpretation: cell.semantic, date: null, nombre: null };
  }
  if (cell.kind === "date" && cell.normalized) {
    return { interpretation: "date", date: cell.normalized, nombre: null };
  }
  const source = cell.kind === "nombre" && cell.normalized != null ? cell.normalized : cell.text;
  const n = integerLike(source);
  if (n != null) return { interpretation: "nombre", date: null, nombre: n };
  return { interpretation: "texte", date: null, nombre: null };
}

function createContext(db, now) {
  const ctx = {
    db,
    now,
    stats: {
      cells: 0,
      dances: 0,
      technicalRows: 0,
      formulas: 0,
      choregraphes: 0,
      musiques: 0,
      repertoires: 0,
      liens: 0,
      revisions: 0,
      restaurants: 0,
      annexes: 0,
      matt: 0,
      numeros: 0,
      pays: 0,
      paysDoublonsIso: 0,
    },
    anomalies: [],
    danceRows: [],
    choreRows: [],
    musicRows: [],
    byName: new Map(),
    choreExact: new Map(),
    paysByIso: new Map(),
    levelByFold: new Map(),
    typeByName: new Map(),
    genreByName: new Map(),
    musicByPair: new Map(),
    musicFold: new Set(),
    repertoireByCol: new Map(),
    numeroUses: new Map(),
    insertCell: db.prepare(`INSERT INTO source_cells (
      column_id, source_row, address, raw_text, raw_kind, formula, formula_result,
      hyperlink, comment, num_fmt, semantic, normalized, entity_table, entity_id
    ) VALUES (
      $column_id, $source_row, $address, $raw_text, $raw_kind, $formula, $formula_result,
      $hyperlink, $comment, $num_fmt, $semantic, $normalized, $entity_table, $entity_id
    )`),
    insertDance: null,
  };
  const danceFields = [
    "id", "nom", "nom_semantic", "date_premiere_vue", "date_premiere_vue_original", "date_premiere_vue_semantic",
    "numero", "numero_semantic", "niveau_id", "niveau_original", "niveau_semantic",
    "type_danse_id", "type_original", "type_semantic", "genre_id", "genre_original", "genre_semantic",
    "pas", "pas_original", "pas_semantic", "murs", "murs_original", "murs_semantic",
    "tag", "tag_semantic", "restart", "restart_semantic", "valse_original", "valse_semantic",
    "a_voir_original", "a_voir_semantic", "pdf_fr", "pdf_fr_semantic", "video_original", "video_semantic",
    "date_derniere_revision", "date_derniere_revision_original", "date_derniere_revision_semantic",
    "date_choregraphie", "date_choregraphie_original", "date_choregraphie_semantic",
    "choregraphe_original", "choregraphe_semantic", "musique_originale", "musique_semantic",
    "interprete_original", "interprete_semantic", "search_text", "source_sheet", "source_row",
    "created_at", "updated_at",
  ];
  ctx.insertDance = db.prepare(
    `INSERT INTO dances (${danceFields.join(",")}) VALUES (${danceFields.map((field) => `$${field}`).join(",")})`,
  );
  ctx.insertChore = db.prepare(`INSERT INTO choregraphes (
    id, nom_court, nom_complet, pays_id, origine, source_sheet, source_row, created_at, updated_at
  ) VALUES ($id, $nom_court, $nom_complet, $pays_id, $origine, $source_sheet, $source_row, $created_at, $updated_at)`);
  ctx.insertLinkChore = db.prepare(`INSERT INTO danse_choregraphe (
    id, danse_id, choregraphe_id, valeur_originale, liaison, created_at, updated_at
  ) VALUES ($id, $danse_id, $choregraphe_id, $valeur_originale, $liaison, $created_at, $updated_at)`);
  return ctx;
}

function addAnomaly(ctx, categorie, message, details, entityTable, entityId) {
  ctx.anomalies.push({ categorie, message, details, entityTable, entityId });
}

function insertSourceCell(ctx, columnId, rowNumber, cell, entityTable, entityId, semantic) {
  ctx.insertCell.run({
    column_id: columnId,
    source_row: rowNumber,
    address: cell.address,
    raw_text: cell.text,
    raw_kind: cell.kind,
    formula: cell.formula,
    formula_result: cell.formulaResult,
    hyperlink: cell.hyperlink,
    comment: cell.comment,
    num_fmt: cell.numFmt,
    semantic: semantic || cell.semantic,
    normalized: cell.normalized,
    entity_table: entityTable,
    entity_id: entityId,
  });
  ctx.stats.cells++;
  if (cell.formula) {
    ctx.stats.formulas++;
    addAnomaly(
      ctx,
      "formule",
      `Formule Excel en ${cell.address}. Elle n'est pas recopiée comme donnée métier.`,
      cell.text,
      entityTable,
      entityId,
    );
  }
}

function indexChoreExact(ctx, text, id) {
  const key = fold(text);
  if (!key) return;
  const previous = ctx.choreExact.get(key);
  if (!previous) ctx.choreExact.set(key, id);
  else if (previous !== id) ctx.choreExact.set(key, "AMBIGUOUS");
}

function rememberChore(ctx, id, label, origine) {
  ctx.choreRows.push({ id, label, origine, key: nameKey(label) });
}

function getNamed(ctx, cache, table, nom, ordre) {
  const trimmed = String(nom).trim();
  if (cache.has(trimmed)) return cache.get(trimmed);
  const id = nid();
  if (table === "niveaux") {
    ctx.db.prepare(`INSERT INTO niveaux (id, nom, ordre, actif, created_at, updated_at)
      VALUES ($id, $nom, $ordre, 1, $created_at, $updated_at)`).run({
      id, nom: trimmed, ordre: ordre ?? 50, created_at: ctx.now, updated_at: ctx.now,
    });
  } else if (table === "types_danse") {
    ctx.db.prepare(`INSERT INTO types_danse (id, nom, actif, created_at, updated_at)
      VALUES ($id, $nom, 1, $created_at, $updated_at)`).run({
      id, nom: trimmed, created_at: ctx.now, updated_at: ctx.now,
    });
  } else {
    ctx.db.prepare(`INSERT INTO genres (id, nom, actif, created_at, updated_at)
      VALUES ($id, $nom, 1, $created_at, $updated_at)`).run({
      id, nom: trimmed, created_at: ctx.now, updated_at: ctx.now,
    });
  }
  cache.set(trimmed, id);
  return id;
}

function seedLevels(ctx) {
  LEVELS.forEach((nom, index) => {
    const id = getNamed(ctx, ctx.levelByFold, "niveaux", nom, index + 1);
    ctx.levelByFold.set(fold(nom), id);
  });
  getNamed(ctx, new Map(), "niveaux", "Autre / inconnu", 99);
}

function upsertPays(ctx, nom, iso2, iso3) {
  const code = String(iso2 || "").trim();
  if (!/^[A-Za-z]{2}$/.test(code)) return null;
  const key = code.toUpperCase();
  const existing = ctx.paysByIso.get(key);
  if (!existing) {
    const id = nid();
    ctx.db.prepare(`INSERT INTO pays (id, nom, nom_alternatif, iso2, iso3, created_at, updated_at)
      VALUES ($id, $nom, NULL, $iso2, $iso3, $created_at, $updated_at)`).run({
      id,
      nom: nom || null,
      iso2: code,
      iso3: iso3 || null,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.paysByIso.set(key, { id, nom: nom || "", iso3: iso3 || "" });
    ctx.stats.pays++;
    return id;
  }
  ctx.stats.paysDoublonsIso++;
  const alts = new Set(String(existing.nomAlt || "").split(" | ").filter(Boolean));
  if (nom && fold(nom) !== fold(existing.nom)) alts.add(nom);
  if (iso3 && existing.iso3 && fold(iso3) !== fold(existing.iso3)) {
    const noteKey = `${key}:${iso3}`;
    if (!ctx.iso3Noted) ctx.iso3Noted = new Set();
    if (!ctx.iso3Noted.has(noteKey)) {
      ctx.iso3Noted.add(noteKey);
      addAnomaly(ctx, "pays", `Code ${code} : ISO3 différent (${existing.iso3} / ${iso3}). Les deux restent dans les cellules sources.`, iso3, "pays", existing.id);
    }
    alts.add(`ISO3 ${iso3}`);
  }
  if (alts.size) {
    const nomAlt = [...alts].join(" | ");
    existing.nomAlt = nomAlt;
    ctx.db.prepare("UPDATE pays SET nom_alternatif = $nom_alternatif, updated_at = $updated_at WHERE id = $id").run({
      nom_alternatif: nomAlt,
      updated_at: ctx.now,
      id: existing.id,
    });
  }
  return existing.id;
}

function ensureRepertoire(ctx, col, header, letter) {
  if (ctx.repertoireByCol.has(col)) return ctx.repertoireByCol.get(col);
  const id = nid();
  const nom = String(header || "").replace(/\s+/g, " ").trim() || `Colonne ${letter}`;
  ctx.db.prepare(`INSERT INTO repertoires (
    id, nom, lettre, col_index, description, actif, created_at, updated_at
  ) VALUES ($id, $nom, $lettre, $col_index, $description, 1, $created_at, $updated_at)`).run({
    id,
    nom,
    lettre: letter,
    col_index: col,
    description: `Colonne ${letter} du fichier Excel. Chaque valeur d'origine est conservée ; son sens n'est pas encore figé.`,
    created_at: ctx.now,
    updated_at: ctx.now,
  });
  ctx.repertoireByCol.set(col, id);
  ctx.stats.repertoires++;
  return id;
}

function ensureMusic(ctx, titre, interprete, titreSemantic, interpreteSemantic) {
  const key = `${titre}\0${interprete}`;
  if (ctx.musicByPair.has(key)) return ctx.musicByPair.get(key);
  const id = nid();
  ctx.db.prepare(`INSERT INTO musiques (
    id, titre, interprete, titre_semantic, interprete_semantic, created_at, updated_at
  ) VALUES ($id, $titre, $interprete, $titre_semantic, $interprete_semantic, $created_at, $updated_at)`).run({
    id,
    titre,
    interprete,
    titre_semantic: titreSemantic,
    interprete_semantic: interpreteSemantic,
    created_at: ctx.now,
    updated_at: ctx.now,
  });
  ctx.musicByPair.set(key, id);
  ctx.musicFold.add(fold(titre));
  ctx.musicFold.add(fold(interprete));
  ctx.musicRows.push({ id, titre, interprete });
  ctx.stats.musiques++;
  return id;
}

function linkChoregraphe(ctx, danceId, cell) {
  if (!cell || cell.semantic !== "renseigne") return;
  const exact = ctx.choreExact.get(fold(cell.text));
  let choreId = exact && exact !== "AMBIGUOUS" ? exact : null;
  let liaison = "exacte";
  if (exact === "AMBIGUOUS") {
    addAnomaly(ctx, "choregraphe", `« ${cell.text} » correspond à plusieurs fiches. Aucun lien automatique.`, cell.address, "dances", danceId);
    return;
  }
  if (!choreId) {
    choreId = nid();
    ctx.insertChore.run({
      id: choreId,
      nom_court: cell.text,
      nom_complet: cell.text,
      pays_id: null,
      origine: "danse",
      source_sheet: null,
      source_row: null,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.choregraphes++;
    indexChoreExact(ctx, cell.text, choreId);
    rememberChore(ctx, choreId, cell.text, "danse");
    liaison = "texte_source";
  }
  ctx.insertLinkChore.run({
    id: nid(),
    danse_id: danceId,
    choregraphe_id: choreId,
    valeur_originale: cell.text,
    liaison,
    created_at: ctx.now,
    updated_at: ctx.now,
  });
}

function levelId(ctx, cell) {
  if (!cell || cell.semantic !== "renseigne") return null;
  return ctx.levelByFold.get(fold(cell.text)) || null;
}

function searchBits(parts, cell) {
  if (!cell || cell.semantic !== "renseigne") return;
  const value = fold(cell.text);
  if (!value || value === "x" || value.length < 2) return;
  parts.push(value);
}

function importColumns(ctx, sheetId, role, rows, hasHeader, columnCount, rowCount) {
  const headers = hasHeader ? headerMap(rows) : new Map();
  let maxCol = columnCount || 1;
  const stats = new Map();
  for (const row of rows) {
    if (hasHeader && row.rowNumber === 1) continue;
    for (const cell of row.cells) {
      maxCol = Math.max(maxCol, cell.col);
      let stat = stats.get(cell.col);
      if (!stat) {
        stat = { filled: 0, distinct: new Set(), kinds: {} };
        stats.set(cell.col, stat);
      }
      stat.filled++;
      stat.distinct.add(cell.text);
      stat.kinds[cell.kind] = (stat.kinds[cell.kind] || 0) + 1;
    }
  }
  const dataSpan = Math.max(0, (rowCount || 0) - (hasHeader ? 1 : 0));
  const colIds = new Map();
  const destByCol = new Map();
  const insertCol = ctx.db.prepare(`INSERT INTO source_columns (
    id, sheet_id, col_index, letter, header, filled, empty_count, distinct_count,
    destination, status, notes, kinds_json
  ) VALUES (
    $id, $sheet_id, $col_index, $letter, $header, $filled, $empty_count, $distinct_count,
    $destination, $status, $notes, $kinds_json
  )`);
  for (let col = 1; col <= maxCol; col++) {
    const header = headers.get(col) || null;
    const dest = destinationFor(role, col, header);
    const stat = stats.get(col) || { filled: 0, distinct: new Set(), kinds: {} };
    const id = nid();
    insertCol.run({
      id,
      sheet_id: sheetId,
      col_index: col,
      letter: colLetter(col),
      header,
      filled: stat.filled,
      empty_count: Math.max(0, dataSpan - stat.filled),
      distinct_count: stat.distinct.size,
      destination: dest.dest,
      status: dest.status,
      notes: dest.notes || null,
      kinds_json: JSON.stringify(stat.kinds),
    });
    colIds.set(col, id);
    destByCol.set(col, dest);
  }
  return { colIds, destByCol, headers };
}

function storeRowCells(ctx, colIds, row, entityTable, entityId, semanticOverride) {
  for (const cell of row.cells) {
    const columnId = colIds.get(cell.col);
    if (!columnId) continue;
    insertSourceCell(ctx, columnId, row.rowNumber, cell, entityTable, entityId, semanticOverride);
  }
}

function importPaysSheet(ctx, sheetName, rows, colIds) {
  for (const row of rows) {
    if (row.rowNumber === 1 && false) continue;
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const nom = byCol.get(1)?.text || null;
    const iso2 = byCol.get(2)?.text || null;
    const iso3 = byCol.get(3)?.text || null;
    const paysId = upsertPays(ctx, nom, iso2, iso3);
    storeRowCells(ctx, colIds, row, paysId ? "pays" : null, paysId, null);
  }
  void sheetName;
}

function importChoreSheet(ctx, sheetName, rows, colIds) {
  for (const row of rows) {
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const court = textParts(byCol.get(1));
    const complet = textParts(byCol.get(2));
    if (court.semantic !== "renseigne" && complet.semantic !== "renseigne") {
      storeRowCells(ctx, colIds, row, null, null, null);
      continue;
    }
    const paysId = upsertPays(ctx, byCol.get(3)?.text || null, byCol.get(4)?.text || null, byCol.get(5)?.text || null);
    const id = nid();
    const label = complet.text || court.text;
    ctx.insertChore.run({
      id,
      nom_court: court.text,
      nom_complet: complet.text,
      pays_id: paysId,
      origine: "referentiel",
      source_sheet: sheetName,
      source_row: row.rowNumber,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.choregraphes++;
    indexChoreExact(ctx, court.text, id);
    indexChoreExact(ctx, complet.text, id);
    rememberChore(ctx, id, label, "referentiel");
    storeRowCells(ctx, colIds, row, "choregraphes", id, null);
  }
}

function importMainSheet(ctx, sheetName, rows, colIds, destByCol) {
  const updateSearch = ctx.db.prepare("UPDATE dances SET search_text = $search_text WHERE id = $id");
  const linkRep = ctx.db.prepare(`INSERT INTO danse_repertoire (
    id, danse_id, repertoire_id, valeur_originale, interpretation, date_valeur, nombre_valeur, created_at, updated_at
  ) VALUES (
    $id, $danse_id, $repertoire_id, $valeur_originale, $interpretation, $date_valeur, $nombre_valeur, $created_at, $updated_at
  )`);
  const linkMusic = ctx.db.prepare(`INSERT INTO danse_musique (
    id, danse_id, musique_id, ordre, created_at, updated_at
  ) VALUES ($id, $danse_id, $musique_id, 1, $created_at, $updated_at)`);
  const insertLien = ctx.db.prepare(`INSERT INTO liens (
    id, danse_id, type, url, label, valeur_originale, created_at, updated_at
  ) VALUES ($id, $danse_id, $type, $url, $label, $valeur_originale, $created_at, $updated_at)`);
  const insertRevision = ctx.db.prepare(`INSERT INTO revisions (
    id, danse_id, date_revision, date_originale, statut, notes, libelle_original, source_sheet, source_row, created_at, updated_at
  ) VALUES (
    $id, $danse_id, $date_revision, $date_originale, NULL, $notes, NULL, $source_sheet, $source_row, $created_at, $updated_at
  )`);

  for (const row of rows) {
    if (row.rowNumber === 1) {
      storeRowCells(ctx, colIds, row, null, null, "en_tete");
      continue;
    }
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const role = (col) => destByCol.get(col)?.role;
    const pick = (wanted) => {
      for (const [col, dest] of destByCol) if (dest.role === wanted) return byCol.get(col) || null;
      return null;
    };

    const nom = textParts(role(23) === "nom" ? byCol.get(23) : pick("nom"));
    const premiere = dateParts(role(1) === "date_premiere_vue" ? byCol.get(1) : null);
    const numero = textParts(role(39) === "numero" ? byCol.get(39) : null);
    const niveauCell = role(35) === "niveau" ? byCol.get(35) : null;
    const niveau = textParts(niveauCell);
    const typeCell = role(22) === "type" ? byCol.get(22) : null;
    const type = textParts(typeCell);
    const genreCell = role(37) === "genre" ? byCol.get(37) : null;
    const genre = textParts(genreCell);
    const pas = numberParts(role(29) === "pas" ? byCol.get(29) : null);
    const murs = numberParts(role(30) === "murs" ? byCol.get(30) : null);
    const tag = textParts(role(31) === "tag" ? byCol.get(31) : null);
    const restart = textParts(role(32) === "restart" ? byCol.get(32) : null);
    const valse = textParts(role(38) === "valse" ? byCol.get(38) : null);
    const aVoir = textParts(role(40) === "a_voir" ? byCol.get(40) : null);
    const pdf = textParts(role(14) === "pdf_fr" ? byCol.get(14) : null);
    const video = textParts(role(43) === "video" ? byCol.get(43) : null);
    const revision = dateParts(role(41) === "revision" ? byCol.get(41) : null);
    const choreDate = dateParts(role(34) === "date_choregraphie" ? byCol.get(34) : null);
    const choreCell = role(33) === "choregraphe" ? byCol.get(33) : null;
    const chore = textParts(choreCell);
    const musicCell = role(26) === "musique" ? byCol.get(26) : null;
    const music = textParts(musicCell);
    const artistCell = role(27) === "interprete" ? byCol.get(27) : null;
    const artist = textParts(artistCell);

    const danceId = nid();
    const typeCopy = role(36) === "type_doublon" ? byCol.get(36) : null;
    if (typeCell && typeCopy && typeCell.semantic !== "technique" && typeCopy.semantic !== "technique" && fold(typeCell.text) !== fold(typeCopy.text)) {
      addAnomaly(ctx, "divergence", `Colonnes type V et AJ différentes à la ligne ${row.rowNumber}.`, `${typeCell.text} ≠ ${typeCopy.text}`, "dances", danceId);
    }
    if (pas.semantic === "incertain") addAnomaly(ctx, "invalide", `Nombre de pas non numérique : « ${pas.original} ».`, `ligne ${row.rowNumber}`, "dances", danceId);
    if (murs.semantic === "incertain") addAnomaly(ctx, "invalide", `Nombre de murs non numérique : « ${murs.original} ».`, `ligne ${row.rowNumber}`, "dances", danceId);

    const parts = [];
    for (const cell of [byCol.get(23), musicCell, artistCell, choreCell, byCol.get(39), byCol.get(31), byCol.get(32)]) searchBits(parts, cell);

    ctx.insertDance.run({
      id: danceId,
      nom: nom.text,
      nom_semantic: nom.semantic,
      date_premiere_vue: premiere.iso,
      date_premiere_vue_original: premiere.original,
      date_premiere_vue_semantic: premiere.semantic,
      numero: numero.semantic === "non_renseigne" ? null : numero.text,
      numero_semantic: numero.semantic,
      niveau_id: levelId(ctx, niveauCell),
      niveau_original: niveau.text,
      niveau_semantic: niveau.semantic,
      type_danse_id: type.semantic === "renseigne" ? getNamed(ctx, ctx.typeByName, "types_danse", type.text) : null,
      type_original: type.text,
      type_semantic: type.semantic,
      genre_id: genre.semantic === "renseigne" ? getNamed(ctx, ctx.genreByName, "genres", genre.text) : null,
      genre_original: genre.text,
      genre_semantic: genre.semantic,
      pas: pas.n,
      pas_original: pas.original,
      pas_semantic: pas.semantic,
      murs: murs.n,
      murs_original: murs.original,
      murs_semantic: murs.semantic,
      tag: tag.semantic === "non_renseigne" ? null : tag.text,
      tag_semantic: tag.semantic,
      restart: restart.semantic === "non_renseigne" ? null : restart.text,
      restart_semantic: restart.semantic,
      valse_original: valse.text,
      valse_semantic: valse.semantic,
      a_voir_original: aVoir.text,
      a_voir_semantic: aVoir.semantic,
      pdf_fr: pdf.text,
      pdf_fr_semantic: pdf.semantic,
      video_original: video.text,
      video_semantic: video.semantic,
      date_derniere_revision: revision.iso,
      date_derniere_revision_original: revision.original,
      date_derniere_revision_semantic: revision.semantic,
      date_choregraphie: choreDate.iso,
      date_choregraphie_original: choreDate.original,
      date_choregraphie_semantic: choreDate.semantic,
      choregraphe_original: chore.text,
      choregraphe_semantic: chore.semantic,
      musique_originale: music.text,
      musique_semantic: music.semantic,
      interprete_original: artist.text,
      interprete_semantic: artist.semantic,
      search_text: parts.join(" "),
      source_sheet: sheetName,
      source_row: row.rowNumber,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.dances++;
    if (nom.semantic === "renseigne") {
      const key = fold(nom.text);
      const list = ctx.byName.get(key) || [];
      list.push(danceId);
      ctx.byName.set(key, list);
    }
    if (numero.semantic === "renseigne") {
      const uses = ctx.numeroUses.get(numero.text) || [];
      uses.push(danceId);
      ctx.numeroUses.set(numero.text, uses);
    }
    ctx.danceRows.push({
      id: danceId,
      nom: nom.text,
      musique: music.text,
      interprete: artist.text,
      choregraphe: chore.text,
      niveau: niveau.text,
      pas: pas.original,
      murs: murs.original,
      type: type.text,
      date: premiere.original,
    });

    linkChoregraphe(ctx, danceId, choreCell);
    if (music.semantic === "renseigne") {
      const interprete = artist.text && artist.semantic !== "non_renseigne" ? artist.text : "";
      const musicId = ensureMusic(ctx, music.text.trim(), interprete.trim(), music.semantic, artist.semantic);
      linkMusic.run({ id: nid(), danse_id: danceId, musique_id: musicId, created_at: ctx.now, updated_at: ctx.now });
    }
    for (const [col, dest] of destByCol) {
      if (dest.role !== "lien") continue;
      const cell = byCol.get(col);
      if (!cell || cell.semantic === "technique") continue;
      const url = httpUrl(cell);
      if (!url && cell.semantic === "non_renseigne") continue;
      insertLien.run({
        id: nid(),
        danse_id: danceId,
        type: dest.lien,
        url,
        label: cell.text || dest.lien,
        valeur_originale: cell.text,
        created_at: ctx.now,
        updated_at: ctx.now,
      });
      ctx.stats.liens++;
      if (!url && /https?:|www\./i.test(cell.text || "")) {
        addAnomaly(ctx, "invalide", `Lien ${dest.lien} illisible ligne ${row.rowNumber}.`, cell.text, "dances", danceId);
      }
    }
    if (revision.iso) {
      insertRevision.run({
        id: nid(),
        danse_id: danceId,
        date_revision: revision.iso,
        date_originale: revision.original,
        notes: "Colonne dernière révision",
        source_sheet: sheetName,
        source_row: row.rowNumber,
        created_at: ctx.now,
        updated_at: ctx.now,
      });
      ctx.stats.revisions++;
    }
    const extraSearch = [];
    for (const [col, dest] of destByCol) {
      if (dest.role !== "repertoire") continue;
      const cell = byCol.get(col);
      if (!cell) continue;
      const repertoireId = ensureRepertoire(ctx, col, dest.nom, colLetter(col));
      const meaning = interpretRepertoire(cell);
      linkRep.run({
        id: nid(),
        danse_id: danceId,
        repertoire_id: repertoireId,
        valeur_originale: cell.text,
        interpretation: meaning.interpretation,
        date_valeur: meaning.date,
        nombre_valeur: meaning.nombre,
        created_at: ctx.now,
        updated_at: ctx.now,
      });
      if (meaning.interpretation === "texte") searchBits(extraSearch, cell);
    }
    if (extraSearch.length) {
      updateSearch.run({
        search_text: `${parts.join(" ")} ${extraSearch.join(" ")}`.trim(),
        id: danceId,
      });
    }
    storeRowCells(ctx, colIds, row, "dances", danceId, null);
  }
}

function importRevisionSheet(ctx, sheetName, rows, colIds) {
  const insertRevision = ctx.db.prepare(`INSERT INTO revisions (
    id, danse_id, date_revision, date_originale, statut, notes, libelle_original, source_sheet, source_row, created_at, updated_at
  ) VALUES (
    $id, $danse_id, $date_revision, $date_originale, NULL, NULL, $libelle_original, $source_sheet, $source_row, $created_at, $updated_at
  )`);
  for (const row of rows) {
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const date = dateParts(byCol.get(1));
    const label = textParts(byCol.get(3));
    let danseId = null;
    if (label.semantic === "renseigne") {
      const hits = ctx.byName.get(fold(label.text)) || [];
      if (hits.length === 1) danseId = hits[0];
      else if (hits.length > 1) {
        addAnomaly(ctx, "revision", `Libellé « ${label.text} » : plusieurs danses, lien non fait.`, `ligne ${row.rowNumber}`, "revisions", null);
      }
    }
    const id = nid();
    insertRevision.run({
      id,
      danse_id: danseId,
      date_revision: date.iso,
      date_originale: date.original,
      libelle_original: label.text,
      source_sheet: sheetName,
      source_row: row.rowNumber,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.revisions++;
    storeRowCells(ctx, colIds, row, "revisions", id, null);
  }
}

function importMatt(ctx, sheetName, rows, colIds) {
  const insert = ctx.db.prepare(`INSERT INTO matt_lucky_lignes (
    id, source_row, danse_id, col_b, col_c, col_d, col_e, col_g, col_h, raw_json, created_at, updated_at
  ) VALUES (
    $id, $source_row, $danse_id, $col_b, $col_c, $col_d, $col_e, $col_g, $col_h, $raw_json, $created_at, $updated_at
  )`);
  for (const row of rows) {
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const label = byCol.get(3)?.text || null;
    let danseId = null;
    if (label && semanticSafe(byCol.get(3))) {
      const hits = ctx.byName.get(fold(label)) || [];
      if (hits.length === 1) danseId = hits[0];
    }
    const id = nid();
    insert.run({
      id,
      source_row: row.rowNumber,
      danse_id: danseId,
      col_b: byCol.get(2)?.text || null,
      col_c: label,
      col_d: byCol.get(4)?.text || null,
      col_e: byCol.get(5)?.text || null,
      col_g: byCol.get(7)?.text || null,
      col_h: byCol.get(8)?.text || null,
      raw_json: JSON.stringify(row.cells.map((cell) => ({ col: cell.col, text: cell.text, hyperlink: cell.hyperlink, formula: cell.formula }))),
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.matt++;
    storeRowCells(ctx, colIds, row, "matt_lucky_lignes", id, null);
  }
  void sheetName;
}

function semanticSafe(cell) {
  return cell && cell.semantic === "renseigne";
}

function importNumero(ctx, rows, colIds) {
  const insert = ctx.db.prepare(`INSERT INTO numeros_historiques (id, valeur, source_row, raw_json, created_at)
    VALUES ($id, $valeur, $source_row, $raw_json, $created_at)`);
  for (const row of rows) {
    if (row.rowNumber === 1) {
      storeRowCells(ctx, colIds, row, null, null, "en_tete");
      continue;
    }
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const id = nid();
    const valeur = byCol.get(1)?.text || "";
    if (valeur) {
      insert.run({
        id,
        valeur,
        source_row: row.rowNumber,
        raw_json: JSON.stringify(row.cells.map((cell) => ({ col: cell.col, text: cell.text }))),
        created_at: ctx.now,
      });
      ctx.stats.numeros++;
    }
    storeRowCells(ctx, colIds, row, valeur ? "numeros_historiques" : null, valeur ? id : null, null);
  }
}

function importResto(ctx, rows, colIds) {
  const insert = ctx.db.prepare(`INSERT INTO restaurants (
    id, date_evenement, evenement, nom_suggere, adresse_complete, code_postal, ville, autre_lieu,
    telephone, google_maps_url, source_row, created_at, updated_at
  ) VALUES (
    $id, $date_evenement, $evenement, $nom_suggere, $adresse_complete, $code_postal, $ville, $autre_lieu,
    $telephone, $google_maps_url, $source_row, $created_at, $updated_at
  )`);
  for (const row of rows) {
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const byCol = new Map(row.cells.map((cell) => [cell.col, cell]));
    const evenement = byCol.get(1)?.text || null;
    const adresse = byCol.get(3)?.text || null;
    const dateMatch = evenement && /^(\d{4}-\d{2}-\d{2})/.exec(evenement.trim());
    const id = nid();
    insert.run({
      id,
      date_evenement: byCol.get(1)?.normalized || dateMatch?.[1] || null,
      evenement,
      nom_suggere: adresse && adresse.includes(" - ") ? adresse.split(" - ")[0].trim() : null,
      adresse_complete: adresse,
      code_postal: byCol.get(4)?.text || null,
      ville: byCol.get(5)?.text || null,
      autre_lieu: byCol.get(6)?.text || null,
      telephone: byCol.get(7)?.text || null,
      google_maps_url: httpUrl(byCol.get(2)),
      source_row: row.rowNumber,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.restaurants++;
    storeRowCells(ctx, colIds, row, "restaurants", id, null);
  }
}

function importAnnexe(ctx, sheetName, rows, colIds) {
  const insert = ctx.db.prepare(`INSERT INTO annexes (
    id, sheet, source_row, texte, suggestion, created_at, updated_at
  ) VALUES ($id, $sheet, $source_row, $texte, $suggestion, $created_at, $updated_at)`);
  for (const row of rows) {
    if (row.technical) {
      storeRowCells(ctx, colIds, row, null, null, "technique");
      ctx.stats.technicalRows++;
      continue;
    }
    const texte = row.cells.map((cell) => cell.text).filter(Boolean).join(" | ");
    const id = nid();
    const folded = fold(texte);
    let suggestion = null;
    if (folded && ctx.musicFold.has(folded)) {
      suggestion = "Texte identique à un titre ou un interprète déjà présent. Aucune fusion faite.";
    }
    insert.run({
      id,
      sheet: sheetName,
      source_row: row.rowNumber,
      texte,
      suggestion,
      created_at: ctx.now,
      updated_at: ctx.now,
    });
    ctx.stats.annexes++;
    storeRowCells(ctx, colIds, row, "annexes", id, null);
  }
}

function importGeneric(ctx, rows, colIds) {
  for (const row of rows) {
    const semantic = row.technical ? "technique" : null;
    if (row.technical) ctx.stats.technicalRows++;
    storeRowCells(ctx, colIds, row, null, null, semantic);
  }
}

function finishPropositions(ctx) {
  const insertProp = ctx.db.prepare(`INSERT INTO propositions (
    id, type, cle, statut, details_json, created_at, updated_at
  ) VALUES ($id, $type, $cle, 'ouverte', $details_json, $created_at, $updated_at)`);
  const insertAnomaly = ctx.db.prepare(`INSERT INTO anomalies (
    id, categorie, message, details, entity_table, entity_id, statut, created_at
  ) VALUES ($id, $categorie, $message, $details, $entity_table, $entity_id, 'ouverte', $created_at)`);

  const groups = new Map();
  for (const dance of ctx.danceRows) {
    if (!dance.nom || semanticOfName(dance.nom) !== "renseigne") continue;
    const key = fold(dance.nom);
    const list = groups.get(key) || [];
    list.push(dance);
    groups.set(key, list);
  }
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    insertProp.run({
      id: nid(),
      type: "danse",
      cle: key,
      details_json: JSON.stringify({
        nom: list[0].nom,
        count: list.length,
        ids: list.slice(0, 30).map((item) => item.id),
        exemples: list.slice(0, 8).map((item) => ({
          id: item.id,
          musique: item.musique,
          interprete: item.interprete,
          choregraphe: item.choregraphe,
          niveau: item.niveau,
          pas: item.pas,
          murs: item.murs,
          type: item.type,
          date: item.date,
        })),
      }),
      created_at: ctx.now,
      updated_at: ctx.now,
    });
  }

  const choreGroups = new Map();
  for (const chore of ctx.choreRows) {
    if (!chore.key || chore.key.length < 3 || chore.key === "inconnu") continue;
    const list = choreGroups.get(chore.key) || [];
    list.push(chore);
    choreGroups.set(chore.key, list);
  }
  for (const [key, list] of choreGroups) {
    const labels = [...new Set(list.map((item) => item.label))];
    if (labels.length < 2) continue;
    insertProp.run({
      id: nid(),
      type: "choregraphe",
      cle: key,
      details_json: JSON.stringify({
        labels: labels.slice(0, 20),
        ids: list.slice(0, 30).map((item) => item.id),
        origines: [...new Set(list.map((item) => item.origine))],
      }),
      created_at: ctx.now,
      updated_at: ctx.now,
    });
  }

  const musicGroups = new Map();
  for (const music of ctx.musicRows) {
    const key = fold(music.titre);
    if (!key) continue;
    const list = musicGroups.get(key) || [];
    list.push(music);
    musicGroups.set(key, list);
  }
  for (const [key, list] of musicGroups) {
    const variants = [...new Set(list.map((item) => `${item.titre} — ${item.interprete}`))];
    if (variants.length < 2) continue;
    insertProp.run({
      id: nid(),
      type: "musique",
      cle: key,
      details_json: JSON.stringify({ variantes: variants.slice(0, 20), ids: list.slice(0, 30).map((item) => item.id) }),
      created_at: ctx.now,
      updated_at: ctx.now,
    });
  }

  for (const [valeur, ids] of ctx.numeroUses) {
    if (ids.length < 2) continue;
    insertAnomaly.run({
      id: nid(),
      categorie: "doublon",
      message: `Numéro ${valeur} utilisé ${ids.length} fois. Aucune fiche n'a été supprimée.`,
      details: ids.join(","),
      entity_table: "dances",
      entity_id: ids[0],
      created_at: ctx.now,
    });
  }

  for (const anomaly of ctx.anomalies) {
    insertAnomaly.run({
      id: nid(),
      categorie: anomaly.categorie,
      message: anomaly.message,
      details: anomaly.details || null,
      entity_table: anomaly.entityTable || null,
      entity_id: anomaly.entityId || null,
      created_at: ctx.now,
    });
  }
}

function semanticOfName(nom) {
  const key = fold(nom);
  if (!key) return "non_renseigne";
  if (key === "?" || key === "??" || key === "inconnu") return "inconnu";
  return "renseigne";
}

function headerOnly(sheet) {
  const headers = new Map();
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    headers.set(col, describeCell(cell).text);
  });
  return headers;
}

function sheetOrder(workbook) {
  const sheets = [...workbook.worksheets];
  const roleOf = (sheet) => {
    if (isMainSheet(headerOnly(sheet))) return "main";
    return sheetRoleOf(sheet.name);
  };
  const ranked = sheets.map((sheet) => ({ sheet, role: roleOf(sheet) }));
  const weight = { iso: 1, pays: 2, choregraphes: 3, main: 4 };
  ranked.sort((a, b) => (weight[a.role] || 5) - (weight[b.role] || 5));
  return ranked;
}

export async function migrate(xlsxPath, dbPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const db = openDatabase(dbPath);
  const now = new Date().toISOString();
  const fileId = nid();
  const ctx = createContext(db, now);
  db.exec("BEGIN");
  try {
    db.prepare(`INSERT INTO source_files (id, file_name, imported_at, sheet_count, meta_json, defined_names_json)
      VALUES ($id, $file_name, $imported_at, $sheet_count, $meta_json, $defined_names_json)`).run({
      id: fileId,
      file_name: path.basename(xlsxPath),
      imported_at: now,
      sheet_count: workbook.worksheets.length,
      meta_json: JSON.stringify({
        creator: workbook.creator || null,
        lastModifiedBy: workbook.lastModifiedBy || null,
        created: workbook.created ? String(workbook.created) : null,
        modified: workbook.modified ? String(workbook.modified) : null,
        title: workbook.title || null,
      }),
      defined_names_json: null,
    });
    seedLevels(ctx);
    const ranked = sheetOrder(workbook);
    for (const { sheet, role } of ranked) {
      console.log(`Lecture ${sheet.name} (${role})`);
      const rows = collectRows(sheet);
      const hasHeader = role === "main" || role === "numero";
      const sheetId = nid();
      const merges = sheet.model?.merges || [];
      db.prepare(`INSERT INTO source_sheets (
        id, source_file_id, name, role, strategy, row_count, column_count, merges_json
      ) VALUES ($id, $source_file_id, $name, $role, $strategy, $row_count, $column_count, $merges_json)`).run({
        id: sheetId,
        source_file_id: fileId,
        name: sheet.name,
        role,
        strategy: SHEET_STRATEGY[role] || SHEET_STRATEGY.autre,
        row_count: sheet.rowCount,
        column_count: sheet.columnCount,
        merges_json: JSON.stringify(merges),
      });
      const { colIds, destByCol } = importColumns(ctx, sheetId, role, rows, hasHeader, sheet.columnCount, sheet.rowCount);
      if (role === "iso" || role === "pays") importPaysSheet(ctx, sheet.name, rows, colIds);
      else if (role === "choregraphes") importChoreSheet(ctx, sheet.name, rows, colIds);
      else if (role === "main") importMainSheet(ctx, sheet.name, rows, colIds, destByCol);
      else if (role === "revisions") importRevisionSheet(ctx, sheet.name, rows, colIds);
      else if (role === "matt") importMatt(ctx, sheet.name, rows, colIds);
      else if (role === "numero") importNumero(ctx, rows, colIds);
      else if (role === "resto") importResto(ctx, rows, colIds);
      else if (role === "feuil1" || role === "feuil3") importAnnexe(ctx, sheet.name, rows, colIds);
      else importGeneric(ctx, rows, colIds);
    }
    finishPropositions(ctx);
    db.prepare(`INSERT INTO audit_log (id, date, action, table_name, record_id, old_value, new_value)
      VALUES ($id, $date, 'import', 'source_files', $record_id, NULL, $new_value)`).run({
      id: nid(),
      date: now,
      record_id: fileId,
      new_value: JSON.stringify({ fichier: path.basename(xlsxPath), danses: ctx.stats.dances, cellules: ctx.stats.cells }),
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }
  const summary = { ...ctx.stats, fileId };
  db.close();
  return summary;
}

export function backupIfExists(dbPath, backupDir) {
  if (!fs.existsSync(dbPath)) return null;
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dest = path.join(backupDir, `${stamp}_avant-import.db`);
  fs.copyFileSync(dbPath, dest);
  return dest;
}
