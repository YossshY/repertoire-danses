import { fold } from "./text.mjs";

/**
 * Destination de chaque colonne connue de la feuille principale.
 * Le contrôle headerIncludes empêche d'appliquer le mapping si l'en-tête a changé.
 * Dans ce cas la colonne retombe en « à analyser », mais ses cellules sont quand même stockées.
 */
const MAIN = {
  1: { role: "date_premiere_vue", dest: "dances.date_premiere_vue + date_premiere_vue_original", status: "compris", headerIncludes: "date" },
  6: {
    role: "lien",
    lien: "lonestar",
    dest: "liens (type lonestar) si une URL existe ; texte original toujours dans source_cells",
    status: "compris",
    headerIncludes: "lonestar",
    notes: "Certaines cellules valent « en mp4 », « Supprimé » ou « ? » sans URL. Elles sont conservées.",
  },
  9: {
    role: "lien",
    lien: "copperknob",
    dest: "liens (type copperknob) si une URL existe ; texte original dans source_cells",
    status: "compris",
    headerIncludes: "copperknob",
  },
  12: {
    role: "lien",
    lien: "youtube",
    dest: "liens (type youtube) si une URL existe ; texte original dans source_cells",
    status: "compris",
    headerIncludes: "youtube",
  },
  14: {
    role: "pdf_fr",
    dest: "dances.pdf_fr (texte original, pas une URL)",
    status: "compris",
    headerIncludes: "pdf",
    notes: "Valeurs observées : Fr, x, a, pp, xa, xx, v, rebel. Le code n'est pas traduit.",
  },
  22: { role: "type", dest: "types_danse + dances.type_original", status: "compris", headerIncludes: "type" },
  23: { role: "nom", dest: "dances.nom (texte original, y compris ?)", status: "compris", headerIncludes: "danses" },
  26: { role: "musique", dest: "musiques.titre + danse_musique ; titre original sur la danse", status: "compris", headerIncludes: "chansons" },
  27: { role: "interprete", dest: "musiques.interprete ; texte original sur la danse", status: "compris", headerIncludes: "interprete" },
  29: { role: "pas", dest: "dances.pas si le texte est un entier, sinon pas_original seul", status: "compris", headerIncludes: "pas" },
  30: { role: "murs", dest: "dances.murs si le texte est un entier, sinon murs_original seul", status: "compris", headerIncludes: "mur" },
  31: { role: "tag", dest: "dances.tag", status: "compris", headerIncludes: "tag" },
  32: { role: "restart", dest: "dances.restart", status: "compris", headerIncludes: "restart" },
  33: {
    role: "choregraphe",
    dest: "dances.choregraphe_original ; lien vers choregraphes seulement si le texte est identique",
    status: "compris",
    headerIncludes: "choregraph",
    notes: "Aucune fusion sur la ressemblance. Les propositions sont enregistrées à part.",
  },
  34: { role: "date_choregraphie", dest: "dances.date_choregraphie + original", status: "compris", headerIncludes: "chore" },
  35: { role: "niveau", dest: "niveaux si la valeur est un niveau connu ; sinon niveau_original seul", status: "compris", headerIncludes: "niveau" },
  36: {
    role: "type_doublon",
    dest: "source_cells uniquement. Le type métier est lu dans la colonne V.",
    status: "doublon_verifie",
    headerIncludes: "type",
    notes: "Doublon de la colonne V. Toute divergence est signalée. Les deux textes restent stockés.",
  },
  37: { role: "genre", dest: "genres + dances.genre_original", status: "compris", headerIncludes: "genre" },
  38: {
    role: "valse",
    dest: "dances.valse_original",
    status: "compris",
    headerIncludes: "valse",
    notes: "La valeur « A » n'est pas convertie en oui/non.",
  },
  39: { role: "numero", dest: "dances.numero (texte, doublons conservés)", status: "compris", headerIncludes: "n°" },
  40: {
    role: "a_voir",
    dest: "dances.a_voir_original",
    status: "compris",
    headerIncludes: "voir",
    notes: "La valeur « A » n'est pas convertie en booléen.",
  },
  41: { role: "revision", dest: "revisions si la cellule est une date ; texte original toujours conservé", status: "compris", headerIncludes: "revision" },
  43: {
    role: "video",
    dest: "dances.video_original",
    status: "compris",
    headerIncludes: "video",
    notes: "Marqueur texte, le plus souvent « V ». Ce n'est pas une URL.",
  },
};

const SHEET_COLUMNS = {
  choregraphes: {
    1: { role: "nom_court", dest: "choregraphes.nom_court", status: "compris" },
    2: { role: "nom_complet", dest: "choregraphes.nom_complet", status: "compris" },
    3: { role: "pays_nom", dest: "pays.nom (via le chorégraphe)", status: "compris" },
    4: { role: "iso2", dest: "pays.iso2 (code conservé tel quel, y compris UK)", status: "compris" },
    5: { role: "iso3", dest: "pays.iso3", status: "compris" },
  },
  revisions: {
    1: { role: "date", dest: "revisions.date_originale", status: "compris", notes: "Pas d'en-tête dans la feuille." },
    2: { role: "heritage", dest: "source_cells + revisions (colonne brute)", status: "a_analyser", notes: "Colonne peu remplie, sens non établi." },
    3: { role: "libelle", dest: "revisions.libelle_original ; danse liée seulement si le texte est identique à un seul nom", status: "compris" },
  },
  matt: {
    2: { role: "ordre", dest: "matt_lucky_lignes.col_b", status: "a_analyser", notes: "Numéro de ligne de la feuille. Sens métier non confirmé." },
    3: { role: "danse", dest: "matt_lucky_lignes.col_c ; lien danse seulement si correspondance exacte unique", status: "compris" },
    4: { role: "musique", dest: "matt_lucky_lignes.col_d", status: "compris" },
    5: { role: "interprete", dest: "matt_lucky_lignes.col_e", status: "compris" },
    7: { role: "nombre", dest: "matt_lucky_lignes.col_g", status: "a_analyser" },
    8: { role: "nombre", dest: "matt_lucky_lignes.col_h", status: "a_analyser" },
  },
  numero: {
    1: { role: "numero", dest: "numeros_historiques.valeur", status: "compris", headerIncludes: "n°" },
  },
  iso: {
    1: { role: "pays_nom", dest: "pays.nom", status: "compris" },
    2: { role: "iso2", dest: "pays.iso2", status: "compris" },
    3: { role: "iso3", dest: "pays.iso3", status: "compris" },
  },
  pays: {
    1: { role: "pays_nom", dest: "pays.nom ou nom_alternatif si le code existe déjà", status: "compris" },
    2: { role: "iso2", dest: "pays.iso2", status: "compris" },
    3: { role: "iso3", dest: "pays.iso3", status: "compris" },
  },
  resto: {
    1: { role: "evenement", dest: "restaurants.evenement", status: "compris" },
    2: { role: "maps", dest: "restaurants.google_maps_url + hyperlien", status: "compris" },
    3: { role: "adresse", dest: "restaurants.adresse_complete", status: "compris", notes: "Nom et adresse sont souvent dans la même cellule. Le texte complet est conservé. nom_suggere est indicatif." },
    4: { role: "code_postal", dest: "restaurants.code_postal", status: "compris" },
    5: { role: "ville", dest: "restaurants.ville", status: "a_analyser", notes: "Parfois la ville de l'événement, pas celle du restaurant." },
    6: { role: "autre_lieu", dest: "restaurants.autre_lieu", status: "a_analyser" },
    7: { role: "telephone", dest: "restaurants.telephone", status: "compris" },
  },
  feuil1: {
    1: { role: "annexe", dest: "annexes (Feuil1), visible plus tard dans l'administration", status: "a_analyser", notes: "Utilité non établie. Texte conservé." },
  },
  feuil3: {
    1: { role: "annexe", dest: "annexes (Feuil3). Pas de fusion avec les musiques.", status: "a_analyser", notes: "La colonne mélange des titres et des artistes. Aucun classement automatique." },
  },
};

function heritage(notes) {
  return {
    role: "heritage",
    dest: "source_cells, affiché plus tard dans « Informations héritées d'Excel »",
    status: "a_analyser",
    notes: notes || "Sens non établi. Valeur originale conservée.",
  };
}

function repertoire(header) {
  const nom = header && String(header).trim() ? header.replace(/\s+/g, " ").trim() : null;
  return {
    role: "repertoire",
    nom,
    dest: nom
      ? `repertoires « ${nom} » + danse_repertoire.valeur_originale`
      : "repertoires (en-tête vide, nom provisoire = lettre de colonne) + valeur_originale",
    status: "a_analyser",
    notes: "Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».",
  };
}

function headerOk(spec, header) {
  if (!spec.headerIncludes) return true;
  const h = fold(header);
  if (h.includes(fold(spec.headerIncludes))) return true;
  if (spec.role === "numero" && /^n/.test(h) && h.length <= 3) return true;
  return false;
}

export function destinationFor(sheetRole, col, header) {
  if (sheetRole === "main") {
    const known = MAIN[col];
    if (known) {
      if (!headerOk(known, header)) {
        return heritage(`En-tête « ${header || ""} » inattendu pour la colonne ${col}. Mapping « ${known.role} » non appliqué.`);
      }
      return { ...known };
    }
    if (col >= 45 && col <= 182) {
      if (!header || !String(header).trim()) {
        return heritage("En-tête vide dans la zone des répertoires. Valeurs conservées dans source_cells.");
      }
      return repertoire(header);
    }
    if (col === 183) {
      return heritage("En-tête « x » et valeur « x » très répétée. Conservé. Pas traité comme un club.");
    }
    return heritage("Colonne de la feuille principale sans rôle métier confirmé.");
  }

  const table = SHEET_COLUMNS[sheetRole];
  if (table && table[col]) return { ...table[col] };
  if (sheetRole === "numero") {
    return heritage("Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.");
  }
  return heritage(`Colonne de la feuille « ${sheetRole} » non décrite à l'avance.`);
}

export function sheetRoleOf(name) {
  const key = fold(name).replace(/[^a-z0-9]+/g, "");
  if (key.includes("matt") && key.includes("lucky")) return "matt";
  if (key.includes("choregraphe")) return "choregraphes";
  if (key.includes("revision")) return "revisions";
  if (key.includes("numero")) return "numero";
  if (key.includes("codeiso") || key === "codeiso") return "iso";
  if (key.includes("pays")) return "pays";
  if (key.includes("resto") || key.includes("autoroute")) return "resto";
  if (key === "feuil1") return "feuil1";
  if (key === "feuil3") return "feuil3";
  return "autre";
}

export const SHEET_STRATEGY = {
  main: "Source des danses. Une ligne de données = une fiche. Aucune fusion des noms répétés.",
  choregraphes: "Référentiel. Une ligne = une personne ou un collectif, sans fusion par ressemblance.",
  revisions: "Historique / planning. Lien vers une danse seulement si le libellé correspond exactement à un seul nom.",
  matt: "Feuille conservée intégralement dans matt_lucky_lignes, en plus des cellules sources.",
  numero: "Historique de numéros conservé et comparé à la feuille principale. Rien n'est écarté avant cette comparaison.",
  iso: "Pays et codes. Fusion avec la feuille Pays uniquement quand le code ISO2 est identique.",
  pays: "Pays et codes. Un nom différent pour le même ISO2 est gardé comme nom alternatif.",
  resto: "Module restaurants, séparé des danses. Textes originaux conservés.",
  feuil1: "Note conservée dans annexes. Utilité encore ouverte.",
  feuil3: "Lignes conservées dans annexes. Ni titre ni artiste imposé.",
  autre: "Feuille imprévue : toutes les cellules sont stockées, statut à analyser.",
};
