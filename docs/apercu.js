/* Recherche locale pour la page publiée. Le serveur de démonstration ne charge pas ce fichier. */
(function () {
  const data = window.APERCU;
  if (!data) return;

  const brouillons = new Map();
  const parId = new Map(data.danses.map((danse) => [danse.id, danse]));

  function fold(value) {
    return String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function contient(texte, q) {
    return fold(texte).includes(fold(q));
  }

  function texte(value, max = 180) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function rang(label, detail, q) {
    const needle = fold(q);
    const titre = fold(label);
    const precis = fold(detail);
    if (titre.startsWith(needle)) return 0;
    if (titre.includes(needle)) return 1;
    if (precis.startsWith(needle)) return 2;
    if (precis.includes(needle)) return 3;
    return 4;
  }

  function tri(rows, q) {
    return rows.sort((a, b) => rang(a.label, a.detail, q) - rang(b.label, b.detail, q)).slice(0, 8);
  }

  function triNom(a, b) {
    const sa = a.nom_semantic === "renseigne" ? 0 : 1;
    const sb = b.nom_semantic === "renseigne" ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return String(a.nom || "").localeCompare(String(b.nom || ""), "fr", { sensitivity: "base", numeric: true });
  }

  function trouve(q) {
    return data.danses.filter((danse) => contient(danse.search, q) || contient(danse.videoDe, q));
  }

  function brouillonsTrouves(q) {
    return [...brouillons.values()].filter((danse) => contient(
      [danse.nom, danse.musique, danse.interprete, danse.choregraphe, danse.numero, danse.videoDe].filter(Boolean).join(" "),
      q,
    ));
  }

  function ligne(danse) {
    return {
      id: danse.id,
      nom: danse.nom,
      niveau: danse.niveau,
      type: danse.type,
      choregraphe: danse.choregraphe,
      musique: danse.musique,
      interprete: danse.interprete,
      numero: danse.numero,
      maitrise: danse.maitrise || "",
    };
  }

  function recherche(q) {
    const danses = trouve(q).sort(triNom).slice(0, 40);
    const ajouts = brouillonsTrouves(q).map(ligne);
    return { total: trouve(q).length + ajouts.length, danses: [...ajouts, ...danses].slice(0, 40) };
  }

  function suggestions(champ, q) {
    if (fold(q).length < 2) return [];
    if (champ === "recherche" || champ === "nom") {
      const demo = brouillonsTrouves(q).map((danse) => ({ id: danse.id, label: danse.nom, detail: danse.interprete || "" }));
      const rows = trouve(q)
        .filter((danse) => danse.nom_semantic === "renseigne")
        .sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0))
        .slice(0, 40)
        .map((danse) => ({ id: danse.id, label: danse.nom, detail: danse.interprete || "" }));
      return tri([...demo, ...rows], q);
    }
    if (champ === "choregraphe") {
      const labels = new Set();
      const rows = [];
      for (const danse of trouve(q)) {
        if (danse.choregraphe_semantic !== "renseigne" || !contient(danse.choregraphe, q) || labels.has(danse.choregraphe)) continue;
        labels.add(danse.choregraphe);
        rows.push({ label: danse.choregraphe });
      }
      return tri(rows, q);
    }
    if (champ === "musique" || champ === "interprete") {
      const vus = new Set();
      const rows = [];
      for (const danse of trouve(q)) {
        for (const music of danse.musiques) {
          if (!contient(music.titre, q) && !contient(music.interprete, q)) continue;
          const cle = `${music.titre}\t${music.interprete}`;
          if (vus.has(cle)) continue;
          vus.add(cle);
          rows.push(champ === "musique"
            ? { label: music.titre, detail: music.interprete }
            : { label: music.interprete, detail: music.titre });
        }
      }
      return tri(rows, q);
    }
    if (champ === "repertoire") {
      return tri(data.clubs.filter((club) => contient(club.nom, q)).map((club) => ({ id: club.id, label: club.nom })), q);
    }
    if (champ === "niveau" || champ === "type") {
      const source = champ === "niveau" ? data.niveaux : data.types;
      return tri(source.filter((item) => contient(item.label, q)), q);
    }
    return [];
  }

  function creer(body) {
    const nom = texte(body.nom);
    if (fold(nom).length < 2) {
      const error = new Error("Indiquez le nom de la danse.");
      error.status = 400;
      throw error;
    }
    const ids = new Set(Array.isArray(body.repertoires) ? body.repertoires : []);
    const repertoires = data.clubs.filter((club) => ids.has(club.id)).map((club) => ({
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
      tag: texte(body.tag, 80) || null,
      restart: texte(body.restart, 80) || null,
      choregraphe: texte(body.choregraphe),
      choregraphe_semantic: texte(body.choregraphe) ? "renseigne" : null,
      musique: texte(body.musique),
      interprete: texte(body.interprete),
      maitrise: ["maitrise", "moyenne", "aucune", "laisser"].includes(body.maitrise) ? body.maitrise : "",
      videoDe: texte(body.videoDe, 80),
      partenaireApprise: body.partenaire === "apprise",
      partenaireNonApprise: body.partenaire === "non",
      extraire: Boolean(body.extraire),
      paroles: body.pdf === "fr" ? "fr" : "",
      pdf_fr: body.pdf === "fr" ? "Fr" : body.pdf === "autre" ? null : undefined,
      musiques: [],
      liens: [],
      repertoires,
      pays: null,
      search: fold([nom, body.musique, body.interprete, body.choregraphe, body.numero].join(" ")),
      demo: true,
    };
    if (danse.musique || danse.interprete) danse.musiques.push({ titre: danse.musique, interprete: danse.interprete });
    if (/^https?:\/\//i.test(youtube)) danse.liens.push({ type: "youtube", url: youtube, label: "Chorégraphie", valeur: youtube });
    brouillons.set(danse.id, danse);
    parId.set(danse.id, danse);
    return danse;
  }

  function nomme(value) {
    const texte = fold(value);
    return texte.length > 2 && texte !== "inconnu" && texte !== "inconnue";
  }

  function catalogue(genre) {
    if (genre === "danses") {
      return data.danses
        .filter((danse) => danse.nom_semantic === "renseigne" && nomme(danse.nom))
        .map((danse) => ({
          id: danse.id,
          label: danse.nom,
          detail: danse.interprete || "",
          maitrise: danse.maitrise || "",
          partenaireApprise: Boolean(danse.partenaireApprise),
          partenaireNonApprise: Boolean(danse.partenaireNonApprise),
          paroles: danse.paroles || "",
          extraire: Boolean(danse.extraire),
        }));
    }
    if (genre === "chansons") {
      const vus = new Set();
      const rows = [];
      for (const danse of data.danses) {
        for (const music of danse.musiques) {
          if (!nomme(music.titre)) continue;
          const cle = `${fold(music.titre)}\t${fold(music.interprete)}`;
          if (vus.has(cle)) continue;
          vus.add(cle);
          rows.push({ id: danse.id, label: music.titre, detail: music.interprete || "" });
        }
      }
      return rows;
    }
    if (genre === "artistes" || genre === "groupes") {
      const vus = new Map();
      for (const danse of data.danses) {
        for (const music of danse.musiques) {
          if (!nomme(music.interprete)) continue;
          const cle = fold(music.interprete);
          const item = vus.get(cle) || { id: danse.id, label: music.interprete, titres: new Set() };
          item.titres.add(fold(music.titre));
          vus.set(cle, item);
        }
      }
      return [...vus.values()].map((item) => ({ id: item.id, label: item.label, detail: `${item.titres.size} chansons` }));
    }
    if (genre === "playlists") {
      return data.clubs
        .filter((club) => /playlist/i.test(club.nom))
        .map((club) => ({ id: club.id, label: club.nom, detail: `${club.danses} danses`, playlist: true }));
    }
    return [];
  }

  function fiche(id) {
    return parId.get(id) || null;
  }

  function repertoire(id, q) {
    const info = data.clubs.find((club) => club.id === id);
    if (!info) return null;
    const correspond = data.danses.filter((danse) => danse.repertoires.some((rep) => rep.id === id) && (!q || contient(danse.search, q)));
    const ajouts = [...brouillons.values()].filter((danse) => danse.repertoires.some((rep) => rep.id === id));
    const danses = [
      ...ajouts.map((danse) => ({ id: danse.id, nom: danse.nom, niveau: danse.niveau, valeur: "x", date: null })),
      ...correspond.sort(triNom).map((danse) => {
        const lien = danse.repertoires.find((rep) => rep.id === id);
        return { id: danse.id, nom: danse.nom, niveau: danse.niveau, valeur: lien.valeur, date: lien.date };
      }),
    ];
    return { id: info.id, nom: info.nom, total: correspond.length + ajouts.length, danses };
  }

  function ligneTableau(danse) {
    return {
      id: danse.id,
      nom: texte(danse.nom, 180),
      numero: texte(danse.numero, 40),
      musique: texte(danse.musique, 180),
      interprete: texte(danse.interprete, 180),
      choregraphe: texte(danse.choregraphe, 180),
      niveau: texte(danse.niveau, 40),
      maitrise: danse.maitrise || "",
      type: texte(danse.type, 40),
      pas: texte(danse.pas_original || (danse.pas == null ? "" : danse.pas), 12),
      murs: texte(danse.murs_original || (danse.murs == null ? "" : danse.murs), 12),
      tag: texte(danse.tag, 80),
      reprise: texte(danse.restart, 80),
      partenaireApprise: Boolean(danse.partenaireApprise),
      partenaireNonApprise: Boolean(danse.partenaireNonApprise),
      pdf_fr: danse.pdf_fr,
      extraire: Boolean(danse.extraire),
      premiere: danse.date_premiere_vue || "",
      choregraphie: danse.date_choregraphie || "",
      revision: danse.date_derniere_revision || "",
      associations: (danse.repertoires || []).map((rep) => {
        const type = typePointage(rep.valeur);
        const lien = { clubId: rep.id, nom: rep.nom, type };
        if (!type) {
          const marque = texte(rep.valeur, 40);
          if (marque) lien.marque = marque;
        }
        return lien;
      }),
    };
  }

  function typePointage(valeur) {
    const marque = String(valeur || "").trim();
    if (/^x$/i.test(marque)) return "ligne";
    if (/^pp?$/i.test(marque)) return "partenaire";
    return "";
  }

  function tableau() {
    const vus = new Set();
    const rows = [];
    for (const danse of [...brouillons.values(), ...data.danses]) {
      if (vus.has(danse.id)) continue;
      vus.add(danse.id);
      rows.push(ligneTableau(danse));
    }
    return rows;
  }

  window.apercuApi = (path, options) => {
    const url = new URL(path, "https://apercu.local");
    if (url.pathname === "/api/accueil") {
      return { danses: data.danses.length, repertoires: data.clubs.length, exemples: data.exemples };
    }
    if (url.pathname === "/api/recherche") {
      const q = url.searchParams.get("q") || "";
      if (fold(q).length < 2) return { total: 0, danses: [] };
      return recherche(q);
    }
    if (url.pathname === "/api/suggestions") return suggestions(url.searchParams.get("champ") || "recherche", url.searchParams.get("q") || "");
    if (url.pathname === "/api/niveaux") return data.niveaux;
    if (url.pathname === "/api/tableau") return tableau();
    if (url.pathname === "/api/repertoires") return data.clubs;
    if (url.pathname === "/api/catalogue") return catalogue(url.searchParams.get("genre") || "");
    if (options && options.method === "POST" && url.pathname === "/api/danses") return creer(JSON.parse(options.body || "{}"));
    const danseMatch = url.pathname.match(/^\/api\/danses\/([^/]+)$/);
    if (danseMatch) {
      const row = fiche(decodeURIComponent(danseMatch[1]));
      if (!row) throw new Error("Danse introuvable");
      return row;
    }
    const repMatch = url.pathname.match(/^\/api\/repertoires\/([^/]+)$/);
    if (repMatch) {
      const row = repertoire(decodeURIComponent(repMatch[1]), url.searchParams.get("q") || "");
      if (!row) throw new Error("Répertoire introuvable");
      return row;
    }
    throw new Error("Indisponible");
  };
})();
