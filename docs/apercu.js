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
    if (a.nom < b.nom) return -1;
    if (a.nom > b.nom) return 1;
    return 0;
  }

  function trouve(q) {
    return data.danses.filter((danse) => contient(danse.search, q));
  }

  function brouillonsTrouves(q) {
    return [...brouillons.values()].filter((danse) => contient(
      [danse.nom, danse.musique, danse.interprete, danse.choregraphe, danse.numero].filter(Boolean).join(" "),
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
      search: fold([nom, body.musique, body.interprete, body.choregraphe, body.numero].join(" ")),
      demo: true,
    };
    if (danse.musique || danse.interprete) danse.musiques.push({ titre: danse.musique, interprete: danse.interprete });
    if (/^https?:\/\//i.test(youtube)) danse.liens.push({ type: "youtube", url: youtube, label: "YouTube", valeur: youtube });
    brouillons.set(danse.id, danse);
    parId.set(danse.id, danse);
    return danse;
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
    ].slice(0, 80);
    return { id: info.id, nom: info.nom, total: correspond.length + ajouts.length, danses };
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
    if (url.pathname === "/api/repertoires") return data.clubs;
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
