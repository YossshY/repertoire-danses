PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

CREATE TABLE source_files (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  sheet_count INTEGER,
  meta_json TEXT,
  defined_names_json TEXT
);

CREATE TABLE source_sheets (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL REFERENCES source_files(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  strategy TEXT NOT NULL,
  row_count INTEGER,
  column_count INTEGER,
  merges_json TEXT,
  formula_count INTEGER DEFAULT 0,
  hyperlink_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);

CREATE TABLE source_columns (
  id TEXT PRIMARY KEY,
  sheet_id TEXT NOT NULL REFERENCES source_sheets(id),
  col_index INTEGER NOT NULL,
  letter TEXT NOT NULL,
  header TEXT,
  filled INTEGER DEFAULT 0,
  empty_count INTEGER DEFAULT 0,
  distinct_count INTEGER DEFAULT 0,
  destination TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  kinds_json TEXT,
  UNIQUE (sheet_id, col_index)
);

CREATE TABLE source_cells (
  id INTEGER PRIMARY KEY,
  column_id TEXT NOT NULL REFERENCES source_columns(id),
  source_row INTEGER NOT NULL,
  address TEXT,
  raw_text TEXT,
  raw_kind TEXT,
  formula TEXT,
  formula_result TEXT,
  hyperlink TEXT,
  comment TEXT,
  num_fmt TEXT,
  semantic TEXT,
  normalized TEXT,
  entity_table TEXT,
  entity_id TEXT,
  UNIQUE (column_id, source_row)
);

CREATE INDEX idx_cells_entity ON source_cells(entity_table, entity_id);
CREATE INDEX idx_cells_semantic ON source_cells(semantic);

CREATE TABLE pays (
  id TEXT PRIMARY KEY,
  nom TEXT,
  nom_alternatif TEXT,
  iso2 TEXT,
  iso3 TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_pays_iso2 ON pays(iso2) WHERE iso2 IS NOT NULL;

CREATE TABLE niveaux (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  ordre INTEGER,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE types_danse (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE genres (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE choregraphes (
  id TEXT PRIMARY KEY,
  nom_court TEXT,
  nom_complet TEXT,
  pays_id TEXT REFERENCES pays(id),
  origine TEXT NOT NULL,
  source_sheet TEXT,
  source_row INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE dances (
  id TEXT PRIMARY KEY,
  nom TEXT,
  nom_semantic TEXT,
  date_premiere_vue TEXT,
  date_premiere_vue_original TEXT,
  date_premiere_vue_semantic TEXT,
  numero TEXT,
  numero_semantic TEXT,
  niveau_id TEXT REFERENCES niveaux(id),
  niveau_original TEXT,
  niveau_semantic TEXT,
  type_danse_id TEXT REFERENCES types_danse(id),
  type_original TEXT,
  type_semantic TEXT,
  genre_id TEXT REFERENCES genres(id),
  genre_original TEXT,
  genre_semantic TEXT,
  pas REAL,
  pas_original TEXT,
  pas_semantic TEXT,
  murs REAL,
  murs_original TEXT,
  murs_semantic TEXT,
  tag TEXT,
  tag_semantic TEXT,
  restart TEXT,
  restart_semantic TEXT,
  valse_original TEXT,
  valse_semantic TEXT,
  a_voir_original TEXT,
  a_voir_semantic TEXT,
  pdf_fr TEXT,
  pdf_fr_semantic TEXT,
  video_original TEXT,
  video_semantic TEXT,
  date_derniere_revision TEXT,
  date_derniere_revision_original TEXT,
  date_derniere_revision_semantic TEXT,
  date_choregraphie TEXT,
  date_choregraphie_original TEXT,
  date_choregraphie_semantic TEXT,
  choregraphe_original TEXT,
  choregraphe_semantic TEXT,
  musique_originale TEXT,
  musique_semantic TEXT,
  interprete_original TEXT,
  interprete_semantic TEXT,
  search_text TEXT,
  source_sheet TEXT,
  source_row INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_dances_source ON dances(source_sheet, source_row);
CREATE INDEX idx_dances_nom ON dances(nom);
CREATE INDEX idx_dances_numero ON dances(numero);
CREATE INDEX idx_dances_search ON dances(search_text);

CREATE TABLE danse_choregraphe (
  id TEXT PRIMARY KEY,
  danse_id TEXT NOT NULL REFERENCES dances(id),
  choregraphe_id TEXT NOT NULL REFERENCES choregraphes(id),
  valeur_originale TEXT,
  liaison TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE musiques (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  interprete TEXT NOT NULL DEFAULT '',
  titre_semantic TEXT,
  interprete_semantic TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (titre, interprete)
);
CREATE INDEX idx_musiques_titre ON musiques(titre);
CREATE INDEX idx_musiques_interprete ON musiques(interprete);

CREATE TABLE danse_musique (
  id TEXT PRIMARY KEY,
  danse_id TEXT NOT NULL REFERENCES dances(id),
  musique_id TEXT NOT NULL REFERENCES musiques(id),
  ordre INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE repertoires (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  lettre TEXT,
  col_index INTEGER,
  description TEXT,
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_repertoires_nom ON repertoires(nom);

CREATE TABLE danse_repertoire (
  id TEXT PRIMARY KEY,
  danse_id TEXT NOT NULL REFERENCES dances(id),
  repertoire_id TEXT NOT NULL REFERENCES repertoires(id),
  valeur_originale TEXT,
  interpretation TEXT,
  date_valeur TEXT,
  nombre_valeur INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_danse_rep ON danse_repertoire(repertoire_id, danse_id);

CREATE TABLE liens (
  id TEXT PRIMARY KEY,
  danse_id TEXT NOT NULL REFERENCES dances(id),
  type TEXT NOT NULL,
  url TEXT,
  label TEXT,
  valeur_originale TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  danse_id TEXT REFERENCES dances(id),
  date_revision TEXT,
  date_originale TEXT,
  statut TEXT,
  notes TEXT,
  libelle_original TEXT,
  source_sheet TEXT,
  source_row INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE matt_lucky_lignes (
  id TEXT PRIMARY KEY,
  source_row INTEGER,
  danse_id TEXT REFERENCES dances(id),
  col_b TEXT,
  col_c TEXT,
  col_d TEXT,
  col_e TEXT,
  col_g TEXT,
  col_h TEXT,
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE numeros_historiques (
  id TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  source_row INTEGER,
  raw_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE restaurants (
  id TEXT PRIMARY KEY,
  date_evenement TEXT,
  evenement TEXT,
  nom_suggere TEXT,
  adresse_complete TEXT,
  code_postal TEXT,
  ville TEXT,
  autre_lieu TEXT,
  telephone TEXT,
  google_maps_url TEXT,
  source_row INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE annexes (
  id TEXT PRIMARY KEY,
  sheet TEXT NOT NULL,
  source_row INTEGER,
  texte TEXT,
  suggestion TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE anomalies (
  id TEXT PRIMARY KEY,
  categorie TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  entity_table TEXT,
  entity_id TEXT,
  statut TEXT NOT NULL DEFAULT 'ouverte',
  created_at TEXT NOT NULL
);

CREATE TABLE propositions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  cle TEXT,
  statut TEXT NOT NULL DEFAULT 'ouverte',
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_value TEXT,
  new_value TEXT
);

CREATE TABLE journal_erreurs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT
);
