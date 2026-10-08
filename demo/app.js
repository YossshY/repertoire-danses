const view = document.querySelector("#view");
const input = document.querySelector("#q");
const brand = document.querySelector("#brand");

const lienNom = { youtube: "Chorégraphie", copperknob: "Paroles", lonestar: "Lonestar" };
const libelleMaitrise = {
  maitrise: "Maîtrisée",
  moyenne: "Moyenne",
  aucune: "Pas du tout",
  laisser: "Pas envie",
};
const pagesCatalogue = {
  danses: ["Danses", "Vert : maîtrisée. Orange : moyenne. Rouge : pas du tout. Gris : pas envie de l'apprendre."],
  chansons: ["Chansons", "Les musiques du répertoire, par ordre alphabétique."],
  groupes: ["Groupes", "Les artistes et les groupes."],
  playlists: ["Playlists", "Quatre séries de 15 à 20 danses sont prévues pour chaque playlist. Le classeur ne les sépare pas encore."],
};

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (value != null) node.setAttribute(key, value);
  }
  for (const child of children || []) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}

function clear(node) {
  node.replaceChildren();
}

function frDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  if (!match) return value || "";
  const year = Number(match[1]);
  if (year < 1970 || year > 2035) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function nombre(value) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

async function api(path, options) {
  if (window.apercuApi) return window.apercuApi(path, options);
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Indisponible");
  return data;
}

function show(node) {
  clear(view);
  view.append(node);
}

function detailDanse(danse, club) {
  if (danse.date && frDate(danse.date)) return frDate(danse.date);
  const valeur = String(danse.valeur || "").replace(/\s+/g, " ").trim();
  const dejaLeNom = valeur && club && club.toLowerCase().includes(valeur.toLowerCase());
  const niveau = danse.niveau && danse.niveau !== "?" ? danse.niveau : "";
  if (!valeur || /^x$/i.test(valeur) || dejaLeNom) return niveau;
  return metaLine([valeur, niveau]);
}

function metaLine(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    if (!part || part === "?" || part === "." || part === "Inconnu") continue;
    const key = String(part).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out.join(" · ");
}

function badges(danse) {
  const labels = [];
  const seen = new Set();
  for (const part of [danse.niveau, danse.type, danse.genre]) {
    if (!part || part === "?" || part === "." || part === "Inconnu") continue;
    const key = String(part).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(part);
  }
  const nodes = labels.length
    ? labels.map((label, index) => el("span", { class: index === 0 ? "badge" : "badge quiet" }, [label]))
    : [el("span", { class: "badge quiet" }, ["Niveau non précisé"])];
  if (libelleMaitrise[danse.maitrise]) nodes.push(el("span", { class: `badge maitrise-${danse.maitrise}` }, [libelleMaitrise[danse.maitrise]]));
  return nodes;
}

function clubLisible(nom) {
  const n = String(nom || "").replace(/\s+/g, " ").trim();
  if (n.length < 3 || /^x$/i.test(n) || /colonne\s*\d+/i.test(n)) return false;
  if (/\bdate\b/i.test(n) || /derni[eè]re/i.test(n)) return false;
  if (/^\d{1,2}[./-]\d{1,2}/.test(n)) return false;
  return (n.match(/[A-Za-zÀ-ÿ]/g) || []).length >= 3;
}

function estColonneDate(rep) {
  return rep.interpretation === "date" || /\bdate\b|vu le/i.test(rep.nom || "");
}

function racineListe(nom) {
  return String(nom || "").replace(/\s+(date|vu le)\b.*$/i, "").replace(/\s+/g, " ").trim();
}

function memeListe(dateNom, listeNom) {
  const racine = foldClient(racineListe(dateNom));
  const nom = foldClient(listeNom);
  if (racine.length < 3 || nom.length < 3) return false;
  return nom === racine || nom.startsWith(`${racine} `) || racine.startsWith(`${nom} `);
}

function organiserListes(reps) {
  const dates = [];
  const listes = [];
  for (const rep of reps) {
    if (estColonneDate(rep)) dates.push(rep);
    else if (clubLisible(rep.nom)) listes.push(rep);
  }
  const passages = dates.flatMap((rep) => {
    const jour = frDate(rep.date);
    if (!jour) return [];
    const liee = listes.find((liste) => memeListe(rep.nom, liste.nom));
    return [{ id: rep.id, nom: liee ? liee.nom : racineListe(rep.nom), jour, iso: rep.date }];
  });
  listes.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
  passages.sort((a, b) => String(a.iso).localeCompare(String(b.iso)));
  return { listes, passages };
}

async function accueil() {
  const [data, reps] = await Promise.all([api("/api/accueil"), api("/api/repertoires")]);
  const clubs = reps.filter((rep) => clubLisible(rep.nom)).length;
  const box = el("section", { class: "hero" }, [
    el("p", { class: "eyebrow" }, ["Line dance"]),
    el("h1", {}, ["Le répertoire des danses country."]),
    el("p", { class: "lede" }, ["Retrouvez une danse par son nom, sa musique, son artiste ou son chorégraphe, puis voyez dans quels clubs elle se danse."]),
    el("div", { class: "figures" }, [
      el("div", { class: "figure" }, [el("strong", {}, [nombre(data.danses)]), el("span", {}, ["danses"])]),
      el("div", { class: "figure" }, [el("strong", {}, [nombre(clubs)]), el("span", {}, ["listes"])]),
    ]),
    el("div", { class: "row" }, [
      el("button", { class: "choice", type: "button", onclick: () => location.hash = "#/saisie" }, [
        el("strong", {}, ["Nouvelle danse"]),
        el("span", {}, ["Saisie avec suggestions"]),
      ]),
      el("button", { class: "choice", type: "button", onclick: lancerRecherche }, [
        el("strong", {}, ["Rechercher"]),
        el("span", {}, ["Nom, musique, artiste"]),
      ]),
      el("button", { class: "choice", type: "button", onclick: () => location.hash = "#/repertoires" }, [
        el("strong", {}, ["Listes"]),
        el("span", {}, ["Clubs et playlists"]),
      ]),
    ]),
    el("div", { class: "row" }, [
      el("button", { class: "choice", type: "button", onclick: () => location.hash = "#/danses" }, [el("strong", {}, ["Danses"]), el("span", {}, ["Ordre alphabétique"])]),
      el("button", { class: "choice", type: "button", onclick: () => location.hash = "#/chansons" }, [el("strong", {}, ["Chansons"]), el("span", {}, ["Musiques"])]),
      el("button", { class: "choice", type: "button", onclick: () => location.hash = "#/groupes" }, [el("strong", {}, ["Groupes"]), el("span", {}, ["Artistes"])]),
      el("button", { class: "choice", type: "button", onclick: () => location.hash = "#/playlists" }, [el("strong", {}, ["Playlists"]), el("span", {}, ["Séries à confirmer"])]),
    ]),
  ]);
  if (data.exemples.length) {
    box.append(el("p", { class: "small" }, ["Par exemple"]));
    box.append(el("div", { class: "row" }, data.exemples.map((item) => el("button", {
      class: "chip",
      type: "button",
      onclick: () => { location.hash = `#/danse/${item.id}`; },
    }, [item.nom]))));
  }
  show(box);
}

function resultats(data, q) {
  const items = data.danses || [];
  const total = data.total ?? items.length;
  const compte = !items.length
    ? "Aucun résultat"
    : items.length < total
      ? `${items.length} premiers résultats sur ${nombre(total)}`
      : `${nombre(items.length)} résultat${items.length > 1 ? "s" : ""}`;
  const box = el("section", {}, [
    el("h1", { class: "section" }, [`« ${q} »`]),
    el("p", { class: "small" }, [compte]),
  ]);
  const list = el("div", { class: "panel list" });
  for (const item of items) {
    const titre = el("span", { class: "hit-title" }, [el("b", {}, [item.nom || "Sans nom"])]);
    if (item.niveau && item.niveau !== "?") titre.append(el("span", { class: "badge" }, [item.niveau]));
    if (libelleMaitrise[item.maitrise]) titre.append(el("span", { class: `badge maitrise-${item.maitrise}` }, [libelleMaitrise[item.maitrise]]));
    list.append(el("button", { class: "hit", type: "button", onclick: () => { location.hash = `#/danse/${item.id}`; } }, [
      titre,
      el("span", { class: "muted" }, [metaLine([item.interprete, item.choregraphe, item.type, item.numero ? `n° ${item.numero}` : ""]) || ""]),
    ]));
  }
  if (items.length) box.append(list);
  show(box);
}

function fiche(danse) {
  const musiques = danse.musiques.length ? danse.musiques : (
    danse.musique ? [{ titre: danse.musique, interprete: danse.interprete }] : []
  );
  const faits = [];
  if (danse.pas != null) faits.push(`${nombre(danse.pas)} pas`);
  else if (danse.pas_original && danse.pas_original !== "?") faits.push(`Pas ${danse.pas_original}`);
  if (danse.murs != null) faits.push(`${nombre(danse.murs)} mur${danse.murs > 1 ? "s" : ""}`);
  if (danse.numero) faits.push(`n° ${danse.numero}`);
  if (danse.tag) faits.push(`TAG ${danse.tag}`);
  if (danse.restart) faits.push(`Restart ${danse.restart}`);
  if (frDate(danse.date_premiere_vue)) faits.push(`Vue le ${frDate(danse.date_premiere_vue)}`);
  if (frDate(danse.date_choregraphie)) faits.push(`Chorée le ${frDate(danse.date_choregraphie)}`);
  if (frDate(danse.date_derniere_revision)) faits.push(`Révisée le ${frDate(danse.date_derniere_revision)}`);

  const box = el("article", { class: "fiche" }, [
    el("button", { class: "back", type: "button", onclick: () => history.back() }, ["Retour"]),
    danse.demo ? el("p", { class: "demo-note" }, ["Saisie de démonstration. Elle reste affichée pendant la visite et n'est pas écrite dans le classeur."]) : "",
    el("h1", {}, [danse.nom || "Sans nom"]),
    lectureDanse(danse.nom) ? el("p", { class: "sens" }, [lectureDanse(danse.nom)]) : "",
    el("div", { class: "badges" }, badges(danse)),
  ]);

  const musicCard = el("section", { class: "card" }, [el("h2", {}, ["Musique"])]);
  if (!musiques.length) musicCard.append(el("p", { class: "muted" }, ["Aucune musique renseignée"]));
  for (const music of musiques) {
    const ligne = [
      el("strong", {}, [music.titre || "Titre non précisé"]),
      document.createElement("br"),
      el("span", { class: "muted" }, [music.interprete || ""]),
    ];
    const ecoute = urlEcoute(music);
    if (ecoute) {
      ligne.push(document.createElement("br"), el("button", { class: "ecouter", type: "button", onclick: () => lancerLecture(music) }, ["Lecture"]));
    }
    musicCard.append(el("p", { class: "music" }, ligne));
  }
  const chore = el("section", { class: "card" }, [
    el("h2", {}, ["Chorégraphe"]),
    el("p", {}, [danse.choregraphe && danse.choregraphe_semantic === "renseigne" ? danse.choregraphe : "Non précisé"]),
  ]);
  if (danse.pays) chore.append(el("p", { class: "muted" }, [danse.pays]));

  box.append(el("div", { class: "grid" }, [musicCard, chore]));
  if (faits.length) box.append(el("div", { class: "facts" }, faits.map((fait) => el("span", { class: "fact" }, [fait]))));

  const visibles = liensVisibles(danse.liens);
  if (visibles.length) {
    const links = el("div", { class: "links" });
    box.append(el("h2", { class: "section" }, ["Liens"]));
    for (const lien of visibles) {
      const label = lienNom[lien.type] || lien.label || "Lien";
      if (lien.url) links.append(el("a", { class: "link", href: lien.url, target: "_blank", rel: "noreferrer" }, [label]));
      else if (lien.valeur && lien.valeur !== "?") links.append(el("span", { class: "link quiet" }, [`${label} · ${lien.valeur}`]));
    }
    box.append(links);
  }

  const { listes, passages } = organiserListes(danse.repertoires);
  if (passages.length) {
    box.append(el("h2", { class: "section" }, ["Dates notées"]));
    box.append(el("p", { class: "hint" }, ["Une date est un passage écrit dans le classeur, à côté d'une liste."]));
    const dates = el("div", { class: "passages" });
    for (const passage of passages) {
      dates.append(el("button", { class: "passage", type: "button", onclick: () => { location.hash = `#/repertoire/${passage.id}`; } }, [
        el("span", {}, [passage.nom]),
        el("span", { class: "muted" }, [passage.jour]),
      ]));
    }
    box.append(dates);
  }
  if (listes.length) {
    box.append(el("h2", { class: "section" }, [`Listes · ${listes.length}`]));
    box.append(el("p", { class: "hint" }, ["Chaque nom est une liste du classeur où la danse est inscrite : un club, un groupe ou une playlist."]));
    const reps = el("div", { class: "listes" });
    for (const rep of listes) {
      reps.append(el("button", { class: "liste", type: "button", onclick: () => { location.hash = `#/repertoire/${rep.id}`; } }, [rep.nom]));
    }
    box.append(reps);
  }
  show(box);
}

async function pageRepertoires() {
  const data = (await api("/api/repertoires")).filter((rep) => clubLisible(rep.nom));
  const box = el("section", {}, [el("h1", { class: "section" }, ["Listes"])]);
  const list = el("div", { class: "panel list" });
  for (const rep of data) {
    list.append(el("button", { class: "rep-hit", type: "button", onclick: () => { location.hash = `#/repertoire/${rep.id}`; } }, [
      el("b", {}, [rep.nom]),
      el("span", { class: "muted" }, [`${nombre(rep.danses)} danses`]),
    ]));
  }
  box.append(list);
  show(box);
}

async function pageRepertoire(id) {
  const data = await api(`/api/repertoires/${id}`);
  const box = el("section", {}, [
    el("button", { class: "back", type: "button", onclick: () => { location.hash = "#/repertoires"; } }, ["Toutes les listes"]),
    el("h1", { class: "section" }, [data.nom]),
    el("p", { class: "small" }, [`${nombre(data.total)} danses${data.danses.length < data.total ? ` · ${data.danses.length} affichées` : ""}`]),
  ]);
  const list = el("div", { class: "panel list" });
  for (const danse of data.danses) {
    const detail = detailDanse(danse, data.nom);
    list.append(el("button", { class: "hit", type: "button", onclick: () => { location.hash = `#/danse/${danse.id}`; } }, [
      el("b", {}, [danse.nom || "Sans nom"]),
      el("span", { class: "muted" }, [detail]),
      el("span", {}, [""]),
    ]));
  }
  box.append(list);
  show(box);
}

function champ(label, node, wide) {
  return el("label", { class: wide ? "field wide" : "field" }, [el("span", {}, [label]), node]);
}

function brancherSuggestions(field, kind, onPick) {
  const list = el("div", { class: "suggest", hidden: "hidden" });
  field.after(list);
  let items = [];
  let active = -1;
  let seq = 0;
  let timer = 0;
  function hide() {
    items = [];
    active = -1;
    list.replaceChildren();
    list.hidden = true;
  }
  function render() {
    list.replaceChildren();
    if (!items.length) { list.hidden = true; return; }
    list.hidden = false;
    items.forEach((item, index) => {
      list.append(el("button", {
        type: "button",
        class: index === active ? "on" : "",
        onmousedown: (event) => { event.preventDefault(); choisir(item); },
      }, [
        el("span", {}, [item.label]),
        el("span", { class: "muted" }, [item.detail || ""]),
      ]));
    });
  }
  function choisir(item) {
    hide();
    onPick(item);
  }
  field.addEventListener("input", () => {
    const q = field.value.trim();
    const ticket = ++seq;
    window.clearTimeout(timer);
    if (foldClient(q).length < 2) { hide(); return; }
    timer = window.setTimeout(async () => {
      try {
        const rows = await api(`/api/suggestions?champ=${encodeURIComponent(kind)}&q=${encodeURIComponent(q)}`);
        if (ticket !== seq) return;
        items = kind === "repertoire" ? rows.filter((row) => clubLisible(row.label)) : rows;
        active = -1;
        render();
      } catch { hide(); }
    }, 140);
  });
  field.addEventListener("keydown", (event) => {
    if (list.hidden) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      active = Math.min(items.length - 1, active + 1);
      render();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      active = Math.max(-1, active - 1);
      render();
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choisir(items[active]);
    } else if (event.key === "Escape") hide();
  }, true);
  field.addEventListener("blur", () => window.setTimeout(hide, 150));
  field._fermerSuggestions = hide;
}

function pageSaisie() {
  const nom = el("input", { type: "text", autocomplete: "off" });
  const musique = el("input", { type: "text", autocomplete: "off" });
  const interprete = el("input", { type: "text", autocomplete: "off" });
  const choregraphe = el("input", { type: "text", autocomplete: "off" });
  const niveau = el("input", { type: "text", autocomplete: "off" });
  const type = el("input", { type: "text", autocomplete: "off" });
  const numero = el("input", { type: "text", autocomplete: "off" });
  const pas = el("input", { type: "text", autocomplete: "off", inputmode: "decimal" });
  const murs = el("input", { type: "text", autocomplete: "off", inputmode: "decimal" });
  const youtube = el("input", { type: "text", autocomplete: "off", placeholder: "https://…" });
  const club = el("input", { type: "text", autocomplete: "off", placeholder: "Ajouter un club" });
  const choisis = [];
  const chips = el("div", { class: "chips" });
  const erreur = el("p", { class: "demo-note", hidden: "hidden" });
  const grid = el("div", { class: "form-grid" }, [
    champ("Danse", nom, true),
    champ("Musique", musique),
    champ("Artiste", interprete),
    champ("Chorégraphe", choregraphe),
    champ("Niveau", niveau),
    champ("Type", type),
    champ("Numéro", numero),
    champ("Pas", pas),
    champ("Murs", murs),
    champ("YouTube", youtube, true),
    champ("Répertoire", club, true),
  ]);
  function dessinerClubs() {
    chips.replaceChildren();
    for (const item of choisis) {
      chips.append(el("button", { class: "chip picked", type: "button", onclick: () => {
        const index = choisis.indexOf(item);
        if (index >= 0) choisis.splice(index, 1);
        dessinerClubs();
      } }, [`${item.label} ×`]));
    }
  }
  brancherSuggestions(nom, "nom", (item) => { nom.value = item.label; });
  brancherSuggestions(musique, "musique", (item) => {
    musique.value = item.label;
    if (item.detail) interprete.value = item.detail;
  });
  brancherSuggestions(interprete, "interprete", (item) => {
    interprete.value = item.label;
    if (item.detail && !musique.value.trim()) musique.value = item.detail;
  });
  brancherSuggestions(choregraphe, "choregraphe", (item) => { choregraphe.value = item.label; });
  brancherSuggestions(niveau, "niveau", (item) => { niveau.value = item.label; });
  brancherSuggestions(type, "type", (item) => { type.value = item.label; });
  brancherSuggestions(club, "repertoire", (item) => {
    if (!choisis.includes(item) && !choisis.some((connu) => connu.id === item.id)) choisis.push(item);
    club.value = "";
    dessinerClubs();
  });
  const form = el("form", { class: "panel", style: "padding:18px" }, [
    erreur,
    grid,
    chips,
    el("p", { style: "margin:16px 0 0" }, [el("button", { class: "go", type: "submit" }, ["Montrer la fiche"])]),
    el("p", { class: "small" }, ["Les suggestions viennent du répertoire. La fiche s'affiche ensuite, sans écrire dans le classeur."]),
  ]);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    erreur.hidden = true;
    try {
      const cree = await api("/api/danses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.value,
          musique: musique.value,
          interprete: interprete.value,
          choregraphe: choregraphe.value,
          niveau: niveau.value,
          type: type.value,
          numero: numero.value,
          pas: pas.value,
          murs: murs.value,
          youtube: youtube.value,
          repertoires: choisis.map((item) => item.id),
        }),
      });
      location.hash = `#/danse/${cree.id}`;
    } catch (error) {
      erreur.hidden = false;
      erreur.textContent = error.message;
    }
  });
  show(el("section", {}, [el("h1", { class: "section" }, ["Nouvelle danse"]), form]));
}

async function route() {
  input._fermerSuggestions?.();
  const hash = location.hash || "#/";
  try {
    if (hash === "#/" || hash === "#") return accueil();
    if (hash.startsWith("#/recherche")) {
      const q = new URLSearchParams(hash.slice(hash.indexOf("?"))).get("q") || input.value.trim();
      input.value = q;
      if (foldClient(q).length < 2) return accueil();
      return resultats(await api(`/api/recherche?q=${encodeURIComponent(q)}`), q);
    }
    if (hash === "#/saisie") return pageSaisie();
    if (hash === "#/repertoires") return pageRepertoires();
    const catalogueMatch = hash.match(/^#\/(danses|chansons|groupes|playlists)/);
    if (catalogueMatch) return pageCatalogue(catalogueMatch[1]);
    const danseMatch = hash.match(/^#\/danse\/([0-9a-f-]{36})$/i);
    if (danseMatch) return fiche(await api(`/api/danses/${danseMatch[1]}`));
    const repMatch = hash.match(/^#\/repertoire\/([0-9a-f-]{36})$/i);
    if (repMatch) return pageRepertoire(repMatch[1]);
    return accueil();
  } catch {
    show(el("p", {}, ["Ces données ne s'affichent pas. Relancez l'aperçu."]));
  }
}

function idVideo(url) {
  const value = String(url || "");
  const court = value.match(/youtu\.be\/([\w-]{11})/);
  if (court) return court[1];
  const embed = value.match(/youtube\.com\/(?:embed|shorts)\/([\w-]{11})/);
  if (embed) return embed[1];
  const long = value.match(/[?&]v=([\w-]{11})/);
  return long ? long[1] : "";
}

function liensVisibles(liens) {
  const choregraphies = new Set((liens || []).map((lien) => lien.type === "youtube" ? idVideo(lien.url) : "").filter(Boolean));
  return (liens || []).filter((lien) => lien.type !== "lonestar" || !choregraphies.has(idVideo(lien.url)));
}

function lectureDanse(nom) {
  const texte = String(nom || "");
  const mots = [];
  if (/\(P\)/i.test(texte)) mots.push("Partenaire");
  const code = texte.match(/\b(PG|PD)\s*(-\s*M)?\s*(-?\s*FF)?\b/i);
  if (code) {
    const suite = [code[1].toUpperCase() === "PG" ? "Pied gauche" : "Pied droit"];
    if (code[2]) suite.push("miroir");
    if (code[3]) suite.push("face à face");
    mots.push(suite.join(", "));
  }
  return mots.join(" · ");
}

function lettreDe(label) {
  const lettre = foldClient(String(label || "")).replace(/^[^a-z0-9]+/, "")[0] || "#";
  return /[a-z]/.test(lettre) ? lettre.toUpperCase() : "#";
}

function ouvrirCatalogue(genre, item) {
  if (genre === "playlists") location.hash = `#/repertoire/${item.id}`;
  else if (genre === "danses") location.hash = `#/danse/${item.id}`;
  else {
    input.value = item.label;
    location.hash = `#/recherche?q=${encodeURIComponent(item.label)}`;
  }
}

async function pageCatalogue(genre) {
  const [titre, hint] = pagesCatalogue[genre];
  const entrees = [...await api(`/api/catalogue?genre=${genre}`)].sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  const index = entrees.length > 40;
  const lettre = (new URLSearchParams(location.hash.split("?")[1] || "").get("lettre") || "A").toUpperCase();
  const visibles = index ? entrees.filter((item) => lettreDe(item.label) === lettre) : entrees;
  const box = el("section", {}, [
    el("h1", { class: "section" }, [titre]),
    el("p", { class: "hint" }, [hint]),
  ]);
  if (index) {
    const lettres = el("div", { class: "lettres" });
    for (const signe of [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"]) {
      lettres.append(el("button", {
        type: "button",
        class: signe === lettre ? "lettre on" : "lettre",
        onclick: () => {
          const next = `#/${genre}?lettre=${encodeURIComponent(signe)}`;
          if (location.hash === next) route();
          else location.hash = next;
        },
      }, [signe]));
    }
    box.append(lettres);
    box.append(el("p", { class: "small" }, [`${nombre(visibles.length)} sur ${nombre(entrees.length)}`]));
  }
  const list = el("div", { class: "panel list" });
  for (const item of visibles) {
    const ligne = el("span", { class: "hit-title" }, [el("b", {}, [item.label])]);
    if (libelleMaitrise[item.maitrise]) ligne.append(el("span", { class: `badge maitrise-${item.maitrise}` }, [libelleMaitrise[item.maitrise]]));
    list.append(el("button", { class: "hit", type: "button", onclick: () => ouvrirCatalogue(genre, item) }, [
      ligne,
      el("span", { class: "muted" }, [item.detail || ""]),
      el("span", {}, [""]),
    ]));
  }
  if (visibles.length) box.append(list);
  show(box);
}

let lecteur = null;
let videoVoulue = "";

function lancerLecture(music) {
  const id = idVideo(music.ecoute);
  if (!id) return;
  videoVoulue = id;
  document.querySelector("#lecteur").hidden = false;
  document.body.classList.add("avec-lecteur");
  document.querySelector("#lecteur-titre").textContent = [music.titre, music.interprete].filter(Boolean).join(" · ");
  if (lecteur && lecteur.loadVideoById) {
    lecteur.loadVideoById(id);
    return;
  }
  if (window.onYouTubeIframeAPIReady) return;
  window.onYouTubeIframeAPIReady = () => {
    lecteur = new YT.Player("yt", {
      videoId: videoVoulue,
      width: "160",
      height: "90",
      playerVars: { rel: 0, playsinline: 1 },
      events: { onReady: (event) => event.target.playVideo() },
    });
  };
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  document.head.append(script);
}

function urlEcoute(music) {
  return /^https?:\/\//i.test(music.ecoute || "") ? music.ecoute : "";
}

function foldClient(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function lancerRecherche() {
  const q = input.value.trim();
  if (foldClient(q).length < 2) {
    input.focus();
    return;
  }
  const next = `#/recherche?q=${encodeURIComponent(q)}`;
  if (location.hash === next) route();
  else location.hash = next;
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  lancerRecherche();
});
input.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.defaultPrevented) return;
  event.preventDefault();
  lancerRecherche();
});
brancherSuggestions(input, "recherche", (item) => {
  input.value = item.label;
  location.hash = `#/danse/${item.id}`;
});
document.querySelector("#nouvelle").addEventListener("click", () => {
  if (location.hash === "#/saisie") route();
  else location.hash = "#/saisie";
});
brand.addEventListener("click", () => { input.value = ""; location.hash = "#/"; });
window.addEventListener("hashchange", route);
document.querySelector("#lecteur-play").addEventListener("click", () => lecteur?.playVideo());
document.querySelector("#lecteur-pause").addEventListener("click", () => lecteur?.pauseVideo());
document.querySelector("#lecteur-stop").addEventListener("click", () => lecteur?.stopVideo());
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    input.focus();
    input.select();
  }
});
route();
