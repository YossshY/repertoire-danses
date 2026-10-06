import http from "http";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { fold } from "./lib/text.mjs";

const root = process.cwd();
const dbPath = path.join(root, "data", "repertoire.db");
const port = Number(process.env.PORT || 4173);

if (!fs.existsSync(dbPath)) {
  console.error("Base introuvable. Lancez d'abord l'import.");
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: true });

const files = {
  "/": ["demo/index.html", "text/html; charset=utf-8"],
  "/app.css": ["demo/app.css", "text/css; charset=utf-8"],
  "/app.js": ["demo/app.js", "text/javascript; charset=utf-8"],
};

function like(value) {
  return `%${fold(value).replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function contient(texte, q) {
  return fold(String(texte || "")).includes(fold(q));
}

function texte(value, max = 180) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

if (!contient("Stéphane", "stephane") || contient("Riverside", "zz")) {
  throw new Error("La recherche de suggestions est cassée.");
}

const brouillons = new Map();
const ecoutesPath = path.join(root, "data", "ecoutes.json");
const ecoutes = fs.existsSync(ecoutesPath) ? JSON.parse(fs.readFileSync(ecoutesPath, "utf8")) : {};

function avecEcoute(music) {
  const url = ecoutes[`${fold(music.titre)}\t${fold(music.interprete)}`];
  return url ? { ...music, ecoute: url } : music;
}
const clubs = db.prepare(`
  SELECT r.id, r.nom
  FROM repertoires r
  JOIN danse_repertoire dr ON dr.repertoire_id = r.id AND dr.deleted_at IS NULL
  WHERE r.deleted_at IS NULL
  GROUP BY r.id
  ORDER BY COUNT(dr.id) DESC, r.nom
`).all();
const niveaux = db.prepare("SELECT nom AS label FROM niveaux WHERE actif = 1 ORDER BY ordre").all();
const types = db.prepare(`
  SELECT DISTINCT type_original AS label
  FROM dances
  WHERE deleted_at IS NULL AND type_semantic = 'renseigne' AND length(trim(type_original)) > 1
  ORDER BY 1
`).all();

function lireJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 20000) {
        reject(new Error("Trop volumineux"));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch { reject(new Error("Illisible")); }
    });
    req.on("error", reject);
  });
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

function json(res, value) {
  send(res, 200, JSON.stringify(value));
}

const accueil = () => ({
  danses: db.prepare("SELECT COUNT(*) AS n FROM dances WHERE deleted_at IS NULL").get().n,
  repertoires: db.prepare("SELECT COUNT(*) AS n FROM repertoires WHERE deleted_at IS NULL").get().n,
  exemples: db.prepare(`
    SELECT id, nom, interprete_original AS interprete
    FROM dances
    WHERE deleted_at IS NULL AND nom IN ('Tush Push', 'Have It All', 'Have I Told You')
    GROUP BY nom
    ORDER BY nom
  `).all(),
});

const ligneRecherche = (danse) => ({
  id: danse.id,
  nom: danse.nom,
  niveau: danse.niveau,
  type: danse.type,
  choregraphe: danse.choregraphe,
  musique: danse.musique,
  interprete: danse.interprete,
  numero: danse.numero,
});

const brouillonsTrouves = (q) => [...brouillons.values()].filter((danse) => contient(
  [danse.nom, danse.musique, danse.interprete, danse.choregraphe, danse.numero].filter(Boolean).join(" "),
  q,
));

const recherche = (q) => {
  const term = like(q);
  const where = "deleted_at IS NULL AND search_text LIKE $q ESCAPE '\\'";
  const total = db.prepare(`SELECT COUNT(*) AS n FROM dances WHERE ${where}`).get({ q: term }).n;
  const danses = db.prepare(`
    SELECT id, nom, niveau_original AS niveau, type_original AS type,
           choregraphe_original AS choregraphe, musique_originale AS musique,
           interprete_original AS interprete, numero
    FROM dances
    WHERE ${where}
    ORDER BY CASE WHEN nom_semantic = 'renseigne' THEN 0 ELSE 1 END, nom
    LIMIT 40
  `).all({ q: term });
  const ajouts = brouillonsTrouves(q).map(ligneRecherche);
  return { total: total + ajouts.length, danses: [...ajouts, ...danses].slice(0, 40) };
};

const rangSuggestion = (label, detail, q) => {
  const needle = fold(q);
  const titre = fold(label);
  const precis = fold(detail);
  if (titre.startsWith(needle)) return 0;
  if (titre.includes(needle)) return 1;
  if (precis.startsWith(needle)) return 2;
  if (precis.includes(needle)) return 3;
  return 4;
};

if (rangSuggestion("Tush Push", "", "tush") !== 0) throw new Error("La recherche de suggestions est cassée.");

const triSuggestions = (rows, q) => rows
  .sort((a, b) => rangSuggestion(a.label, a.detail, q) - rangSuggestion(b.label, b.detail, q))
  .slice(0, 8);

const suggestions = (champ, q) => {
  const needle = fold(q);
  if (needle.length < 2) return [];
  const term = like(q);
  if (champ === "recherche" || champ === "nom") {
    const demo = brouillonsTrouves(q).map((danse) => ({ id: danse.id, label: danse.nom, detail: danse.interprete || "" }));
    const rows = db.prepare(`
      SELECT id, nom AS label, interprete_original AS detail
      FROM dances
      WHERE deleted_at IS NULL AND nom_semantic = 'renseigne' AND search_text LIKE $q ESCAPE '\\'
      ORDER BY nom
      LIMIT 40
    `).all({ q: term });
    return triSuggestions([...demo, ...rows], q);
  }
  if (champ === "choregraphe") {
    const rows = db.prepare(`
      SELECT DISTINCT choregraphe_original AS label
      FROM dances
      WHERE deleted_at IS NULL AND choregraphe_semantic = 'renseigne' AND search_text LIKE $q ESCAPE '\\'
      LIMIT 40
    `).all({ q: term }).filter((row) => contient(row.label, q));
    return triSuggestions(rows, q);
  }
  if (champ === "musique" || champ === "interprete") {
    const rows = db.prepare(`
      SELECT DISTINCT m.titre, m.interprete
      FROM musiques m
      JOIN danse_musique dm ON dm.musique_id = m.id AND dm.deleted_at IS NULL
      JOIN dances d ON d.id = dm.danse_id AND d.deleted_at IS NULL
      WHERE m.deleted_at IS NULL AND d.search_text LIKE $q ESCAPE '\\'
      LIMIT 40
    `).all({ q: term }).filter((row) => contient(row.titre, q) || contient(row.interprete, q));
    const items = champ === "musique"
      ? rows.map((row) => ({ label: row.titre, detail: row.interprete }))
      : rows.map((row) => ({ label: row.interprete, detail: row.titre }));
    return triSuggestions(items, q);
  }
  if (champ === "repertoire") {
    return triSuggestions(clubs.filter((club) => contient(club.nom, q)).map((club) => ({ id: club.id, label: club.nom })), q);
  }
  if (champ === "niveau" || champ === "type") {
    return triSuggestions((champ === "niveau" ? niveaux : types).filter((item) => contient(item.label, q)), q);
  }
  return [];
};

const creerBrouillon = (body) => {
  const nom = texte(body.nom);
  if (fold(nom).length < 2) return { error: "Indiquez le nom de la danse." };
  const ids = new Set(Array.isArray(body.repertoires) ? body.repertoires : []);
  const repertoires = clubs.filter((club) => ids.has(club.id)).map((club) => ({
    id: club.id, nom: club.nom, valeur: "x", interpretation: "texte", date: null,
  }));
  const pas = texte(body.pas, 12).replace(",", ".");
  const murs = texte(body.murs, 12).replace(",", ".");
  const youtube = texte(body.youtube, 300);
  const danse = {
    id: crypto.randomUUID(),
    nom,
    nom_semantic: "renseigne",
    niveau: texte(body.niveau, 40),
    type: texte(body.type, 40),
    genre: null,
    pas: pas && Number.isFinite(Number(pas)) ? Number(pas) : null,
    pas_original: pas || null,
    murs: murs && Number.isFinite(Number(murs)) ? Number(murs) : null,
    murs_original: murs || null,
    numero: texte(body.numero, 40),
    tag: null,
    restart: null,
    choregraphe: texte(body.choregraphe),
    choregraphe_semantic: texte(body.choregraphe) ? "renseigne" : null,
    musique: texte(body.musique),
    interprete: texte(body.interprete),
    musiques: [],
    liens: [],
    repertoires,
    pays: null,
    demo: true,
  };
  if (danse.musique || danse.interprete) danse.musiques.push({ titre: danse.musique, interprete: danse.interprete });
  if (/^https?:\/\//i.test(youtube)) danse.liens.push({ type: "youtube", url: youtube, label: "YouTube", valeur: youtube });
  brouillons.set(danse.id, danse);
  return { danse };
};

const danse = (id) => {
  if (brouillons.has(id)) return brouillons.get(id);
  const row = db.prepare(`
    SELECT id, nom, nom_semantic, niveau_original AS niveau, niveau_semantic,
           type_original AS type, genre_original AS genre,
           pas, pas_original, murs, murs_original,
           tag, restart, numero, pdf_fr, video_original AS video, valse_original AS valse,
           a_voir_original AS a_voir,
           date_premiere_vue, date_choregraphie, date_derniere_revision,
           choregraphe_original AS choregraphe, choregraphe_semantic,
           musique_originale AS musique, interprete_original AS interprete
    FROM dances WHERE id = $id AND deleted_at IS NULL
  `).get({ id });
  if (!row) return null;
  row.musiques = db.prepare(`
    SELECT m.titre, m.interprete
    FROM danse_musique dm
    JOIN musiques m ON m.id = dm.musique_id
    WHERE dm.danse_id = $id AND dm.deleted_at IS NULL
    ORDER BY dm.ordre
  `).all({ id }).map(avecEcoute);
  row.liens = db.prepare(`
    SELECT type, url, label, valeur_originale AS valeur
    FROM liens WHERE danse_id = $id AND deleted_at IS NULL
    ORDER BY type
  `).all({ id });
  row.repertoires = db.prepare(`
    SELECT r.id, r.nom, dr.valeur_originale AS valeur, dr.interpretation,
           dr.date_valeur AS date, dr.nombre_valeur AS nombre
    FROM danse_repertoire dr
    JOIN repertoires r ON r.id = dr.repertoire_id
    WHERE dr.danse_id = $id AND dr.deleted_at IS NULL AND r.deleted_at IS NULL
    ORDER BY r.nom
  `).all({ id });
  const pays = db.prepare(`
    SELECT p.nom AS pays
    FROM danse_choregraphe dc
    JOIN choregraphes c ON c.id = dc.choregraphe_id
    LEFT JOIN pays p ON p.id = c.pays_id
    WHERE dc.danse_id = $id AND dc.liaison = 'exacte' AND dc.deleted_at IS NULL
    LIMIT 1
  `).get({ id });
  row.pays = pays?.pays || null;
  return row;
};

const repertoires = () => db.prepare(`
  SELECT r.id, r.nom, COUNT(dr.id) AS danses
  FROM repertoires r
  JOIN danse_repertoire dr ON dr.repertoire_id = r.id AND dr.deleted_at IS NULL
  WHERE r.deleted_at IS NULL
  GROUP BY r.id
  ORDER BY danses DESC, r.nom
`).all();

const repertoire = (id, q) => {
  const info = db.prepare("SELECT id, nom FROM repertoires WHERE id = $id AND deleted_at IS NULL").get({ id });
  if (!info) return null;
  const term = q ? like(q) : null;
  const danses = db.prepare(`
    SELECT d.id, d.nom, d.niveau_original AS niveau, dr.valeur_originale AS valeur, dr.date_valeur AS date
    FROM danse_repertoire dr
    JOIN dances d ON d.id = dr.danse_id
    WHERE dr.repertoire_id = $id AND dr.deleted_at IS NULL AND d.deleted_at IS NULL
      AND ($q IS NULL OR d.search_text LIKE $q ESCAPE '\\')
    ORDER BY CASE WHEN d.nom_semantic = 'renseigne' THEN 0 ELSE 1 END, d.nom
    LIMIT 80
  `).all({ id, q: term });
  const total = db.prepare(`
    SELECT COUNT(*) AS n
    FROM danse_repertoire dr
    JOIN dances d ON d.id = dr.danse_id
    WHERE dr.repertoire_id = $id AND dr.deleted_at IS NULL AND d.deleted_at IS NULL
      AND ($q IS NULL OR d.search_text LIKE $q ESCAPE '\\')
  `).get({ id, q: term }).n;
  const ajouts = [...brouillons.values()].filter((danse) => danse.repertoires.some((rep) => rep.id === id));
  return {
    ...info,
    total: total + ajouts.length,
    danses: [...ajouts.map((danse) => ({ id: danse.id, nom: danse.nom, niveau: danse.niveau, valeur: "x", date: null })), ...danses].slice(0, 80),
  };
};

const idOk = (value) => /^[0-9a-f-]{36}$/i.test(value || "");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const file = files[url.pathname];
  if (file) {
    send(res, 200, fs.readFileSync(path.join(root, file[0])), file[1]);
    return;
  }
  try {
    if (url.pathname === "/api/accueil") return json(res, accueil());
    if (url.pathname === "/api/recherche") {
      const q = url.searchParams.get("q") || "";
      if (fold(q).length < 2) return json(res, { total: 0, danses: [] });
      return json(res, recherche(q));
    }
    if (url.pathname === "/api/suggestions") {
      return json(res, suggestions(url.searchParams.get("champ") || "recherche", url.searchParams.get("q") || ""));
    }
    if (req.method === "POST" && url.pathname === "/api/danses") {
      const cree = creerBrouillon(await lireJson(req));
      if (cree.error) return send(res, 400, JSON.stringify({ message: cree.error }));
      return json(res, cree.danse);
    }
    if (url.pathname === "/api/repertoires") return json(res, repertoires());
    const danseMatch = url.pathname.match(/^\/api\/danses\/([^/]+)$/);
    if (danseMatch) {
      if (!idOk(danseMatch[1])) return send(res, 400, '{"message":"Identifiant invalide"}');
      const row = danse(danseMatch[1]);
      if (!row) return send(res, 404, '{"message":"Danse introuvable"}');
      return json(res, row);
    }
    const repMatch = url.pathname.match(/^\/api\/repertoires\/([^/]+)$/);
    if (repMatch) {
      if (!idOk(repMatch[1])) return send(res, 400, '{"message":"Identifiant invalide"}');
      const row = repertoire(repMatch[1], url.searchParams.get("q") || "");
      if (!row) return send(res, 404, '{"message":"Répertoire introuvable"}');
      return json(res, row);
    }
    send(res, 404, "Introuvable", "text/plain; charset=utf-8");
  } catch (error) {
    send(res, 500, JSON.stringify({ message: "Impossible d'afficher ces données.", details: String(error.message || error) }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Aperçu prêt : http://127.0.0.1:${port}`);
});
