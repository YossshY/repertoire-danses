import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { fold } from "./lib/text.mjs";

const root = process.cwd();
const db = new DatabaseSync(path.join(root, "data", "repertoire.db"), { readOnly: true });
const ecoutesPath = path.join(root, "data", "ecoutes.json");
const ecoutes = fs.existsSync(ecoutesPath) ? JSON.parse(fs.readFileSync(ecoutesPath, "utf8")) : {};
const maitrisesPath = path.join(root, "data", "maitrise.json");
const maitrises = fs.existsSync(maitrisesPath) ? JSON.parse(fs.readFileSync(maitrisesPath, "utf8")) : {};

const danses = db.prepare(`
  SELECT id, nom, nom_semantic, niveau_original AS niveau, niveau_semantic,
         type_original AS type, genre_original AS genre,
         pas, pas_original, murs, murs_original,
         tag, restart, numero, video_original AS video, valse_original AS valse,
         a_voir_original AS a_voir,
         date_premiere_vue, date_choregraphie, date_derniere_revision,
         choregraphe_original AS choregraphe, choregraphe_semantic,
         musique_originale AS musique, interprete_original AS interprete,
         search_text AS search, source_row
  FROM dances
  WHERE deleted_at IS NULL
`).all();

const parId = new Map(danses.map((danse) => {
  danse.maitrise = maitrises[danse.source_row] || "";
  delete danse.source_row;
  danse.musiques = [];
  danse.liens = [];
  danse.repertoires = [];
  danse.pays = null;
  return [danse.id, danse];
}));

for (const row of db.prepare(`
  SELECT dm.danse_id, m.titre, m.interprete
  FROM danse_musique dm
  JOIN musiques m ON m.id = dm.musique_id
  WHERE dm.deleted_at IS NULL
  ORDER BY dm.ordre
`).all()) {
  const url = ecoutes[`${fold(row.titre)}\t${fold(row.interprete)}`];
  const music = { titre: row.titre, interprete: row.interprete };
  if (url) music.ecoute = url;
  parId.get(row.danse_id)?.musiques.push(music);
}

for (const row of db.prepare(`
  SELECT danse_id, type, url, label, valeur_originale AS valeur
  FROM liens WHERE deleted_at IS NULL
  ORDER BY type
`).all()) {
  const danse = parId.get(row.danse_id);
  if (danse) danse.liens.push({ type: row.type, url: row.url, label: row.label, valeur: row.valeur });
}

for (const row of db.prepare(`
  SELECT dr.danse_id, r.id, r.nom, dr.valeur_originale AS valeur, dr.interpretation, dr.date_valeur AS date
  FROM danse_repertoire dr
  JOIN repertoires r ON r.id = dr.repertoire_id
  WHERE dr.deleted_at IS NULL AND r.deleted_at IS NULL
  ORDER BY r.nom
`).all()) {
  const danse = parId.get(row.danse_id);
  if (danse) danse.repertoires.push({ id: row.id, nom: row.nom, valeur: row.valeur, interpretation: row.interpretation, date: row.date });
}

for (const row of db.prepare(`
  SELECT dc.danse_id, p.nom AS pays
  FROM danse_choregraphe dc
  JOIN choregraphes c ON c.id = dc.choregraphe_id
  LEFT JOIN pays p ON p.id = c.pays_id
  WHERE dc.liaison = 'exacte' AND dc.deleted_at IS NULL AND p.nom IS NOT NULL
`).all()) {
  const danse = parId.get(row.danse_id);
  if (danse && !danse.pays) danse.pays = row.pays;
}

const clubs = db.prepare(`
  SELECT r.id, r.nom, COUNT(dr.id) AS danses
  FROM repertoires r
  JOIN danse_repertoire dr ON dr.repertoire_id = r.id AND dr.deleted_at IS NULL
  WHERE r.deleted_at IS NULL
  GROUP BY r.id
  ORDER BY danses DESC, r.nom
`).all();

const niveaux = db.prepare("SELECT nom AS label FROM niveaux WHERE actif = 1 ORDER BY ordre").all();
const types = db.prepare(`
  SELECT DISTINCT type_original AS label
  FROM dances
  WHERE deleted_at IS NULL AND type_semantic = 'renseigne' AND length(trim(type_original)) > 1
  ORDER BY 1
`).all();
const exemples = db.prepare(`
  SELECT id, nom, interprete_original AS interprete
  FROM dances
  WHERE deleted_at IS NULL AND nom IN ('Tush Push', 'Have It All', 'Have I Told You')
  GROUP BY nom
  ORDER BY nom
`).all();

const docs = path.join(root, "docs");
fs.mkdirSync(docs, { recursive: true });
for (const file of ["app.css", "app.js", "apercu.js"]) {
  fs.copyFileSync(path.join(root, "demo", file), path.join(docs, file));
}
fs.writeFileSync(path.join(docs, ".nojekyll"), "");
const payload = { danses, clubs, niveaux, types, exemples };
const json = JSON.stringify(payload);
fs.writeFileSync(path.join(docs, "data.js"), `window.APERCU=${json};\n`);
console.log(`danses ${danses.length}, listes ${clubs.length}, data.js ${(json.length / 1e6).toFixed(1)} Mo`);
