const view = document.querySelector("#view");
const input = document.querySelector("#q");
const brand = document.querySelector("#brand");

const lienNom = { youtube: "Chorégraphie", copperknob: "Paroles", lonestar: "Lonestar" };
const libelleMaitrise = {
  maitrise: "Acquise",
  moyenne: "En apprentissage",
  aucune: "Non apprise",
  laisser: "Exclue",
};
const pagesCatalogue = {
  danses: ["Danses", "Vert : acquise. Orange : en apprentissage. Rouge : non apprise. Gris : exclue."],
  chansons: ["Chansons", "Les musiques du répertoire, par ordre alphabétique."],
  groupes: ["Groupes", "Les artistes et les groupes."],
  playlists: ["Listes de lecture", "Quatre séries de 15 à 20 danses sont prévues pour chaque liste. Le classeur ne les sépare pas encore."],
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

function comparerNom(a, b) {
  return String(a.nom || a.label || "").localeCompare(String(b.nom || b.label || ""), "fr", { sensitivity: "base", numeric: true });
}

function resultats(data, q) {
  const items = [...(data.danses || [])].sort(comparerNom);
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
  if (danse.extraire) faits.push("Musique à extraire");
  if (danse.pdf_fr) faits.push("Feuille des pas en français");
  else if (danse.pdf_fr === null) faits.push("Feuille des pas dans une autre langue");
  if (frDate(danse.date_premiere_vue)) faits.push(`Vue le ${frDate(danse.date_premiere_vue)}`);
  if (frDate(danse.date_choregraphie)) faits.push(`Chorée le ${frDate(danse.date_choregraphie)}`);
  if (frDate(danse.date_derniere_revision)) faits.push(`Révisée le ${frDate(danse.date_derniere_revision)}`);

  const box = el("article", { class: "fiche" }, [
    el("button", { class: "back", type: "button", onclick: () => history.back() }, ["Retour"]),
    danse.demo ? el("p", { class: "demo-note" }, ["Saisie de démonstration. Elle reste affichée pendant la visite et n'est pas écrite dans le classeur."]) : "",
    el("h1", {}, [danse.nom || "Sans nom"]),
    lectureDanse(danse.nom) ? el("p", { class: "sens" }, [lectureDanse(danse.nom)]) : "",
    danse.videoDe ? el("p", { class: "sens" }, [`Vidéo de ${nomVideo(danse.videoDe)}`]) : "",
    lignePartenaire(danse) ? el("p", { class: "sens" }, [lignePartenaire(danse)]) : "",
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
  if (danse.tag) {
    const horloge = lireMurs(danse.tag);
    const lignes = ["Quelques temps supplémentaires entre deux murs ou deux sections."];
    if (/phras/i.test(danse.tag)) lignes.push("Phrasé : enchaînement divisé en parties, souvent A, B et C.");
    if (horloge) lignes.push(`${danse.tag} : ${horloge}.`);
    else if (!/phras/i.test(danse.tag) && danse.tag !== "?") lignes.push(danse.tag);
    box.append(el("p", { class: "hint" }, [lignes.join(" ")]));
  }
  if (danse.restart && danse.restart !== "?") {
    const horloge = lireMurs(danse.restart);
    box.append(el("p", { class: "hint" }, [
      `Reprise : la chorégraphie reprend depuis le début avant la fin des pas prévus pour le mur en cours.${horloge ? ` ${danse.restart} : ${horloge}.` : ` ${danse.restart}.`}`,
    ]));
  }

  const visibles = liensVisibles(danse.liens);
  if (visibles.length) {
    const links = el("div", { class: "links" });
    box.append(el("h2", { class: "section" }, ["Liens"]));
    for (const lien of visibles) {
      const label = lien.type === "copperknob"
        ? (danse.paroles === "fr" ? "Paroles · français" : "Paroles · autre langue")
        : (lienNom[lien.type] || lien.label || "Lien");
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

const annuaire = [
  { alias: ["Country Wind"], nom: "Country Wind", liens: ["https://www.facebook.com/profile.php?id=100057062017647"] },
  { alias: ["Lucky Jordan"], nom: "Lucky Jordan", liens: ["https://www.facebook.com/lucky.jordan.9"] },
  { alias: ["Matt Carson"], nom: "Matt Carson", liens: ["https://www.facebook.com/matt.carson.777"] },
  { alias: ["Carin Care"], nom: "Carin Care", liens: ["https://www.facebook.com/carincare"] },
  { alias: ["Texas Twixy"], nom: "Texas Twixy", liens: ["https://www.facebook.com/texas.twixy.2022"] },
  { alias: ["Country Duo Highway"], nom: "Country Duo Highway", liens: ["https://www.facebook.com/groups/676686454060031/"] },
  { alias: ["WILMA"], nom: "Wilma van de Bunt", liens: ["https://www.facebook.com/groups/1243660202349473"] },
  { alias: ["ELKE"], nom: "ELKE The Jillaroo", liens: ["https://www.facebook.com/jackandthejillaroos", "https://www.facebook.com/Elke.Joey"] },
  { alias: ["DUO Two Of A Kind"], nom: "Duo Two of a Kind", liens: ["https://www.facebook.com/WilmaenMarcoMassar"] },
  { alias: ["DUO RICKY PETRA"], nom: "Duo Ricky & Petra D", liens: ["https://www.facebook.com/RickyPetraD"] },
  { alias: ["DEX DYLAN"], nom: "Dex Dylan", liens: ["https://www.facebook.com/groups/1926334344351399", "https://www.facebook.com/danny.depauw.5"] },
  { alias: ["Daddy Redneck"], nom: "Daddy Redneck", liens: ["https://www.facebook.com/profile.php?id=100028139627958"] },
  { alias: ["CONNY LEE"], nom: "Conny Lee", liens: ["https://www.facebook.com/profile.php?id=100013831417702"] },
  { alias: ["TIN WHEEL COUNTRY BAND"], nom: "Tin Wheel Country Band", liens: ["https://www.facebook.com/groups/57871427372"] },
  { alias: ["MISTER P."], nom: "Mister P.", liens: ["https://www.facebook.com/misterpcountry/"] },
  { alias: ["Kris Robyan"], nom: "Kris Robyan", liens: ["https://www.facebook.com/KrisRobyan"] },
  { alias: ["Mrs McBright", "Mrs Mc Bright"], nom: "Mrs McBright", liens: ["https://www.facebook.com/mrsmcbright"] },
  { alias: ["Tim Nash"], nom: "Tim Nash", liens: ["https://www.facebook.com/TimNashBelgium"] },
  { alias: ["COUNTRY FEVER"], nom: "Country Fever", liens: ["https://www.facebook.com/groups/318230333875"] },
  { alias: ["BOB'S Country Band"], nom: "Bob's Country Band", liens: ["https://www.facebook.com/people/Bobs-Country-Band/100063571960155/"] },
  { alias: ["TRB Travelin' River Band", "TRB Travelin River Band"], nom: "Travelin' River Band", liens: ["https://www.facebook.com/TravelinRiverBand"] },
  { alias: ["BBC"], nom: "Beethovens' Boogie Country", liens: ["https://www.facebook.com/profile.php?id=100045474588851"] },
  { alias: ["Sundie"], nom: "Sundie Remy", liens: ["https://www.facebook.com/sundie.remy"] },
  { alias: ["Mimuzik"], nom: "Mimuzik", liens: ["https://www.facebook.com/mimuzik007/"] },
  { alias: ["ALL SHOOK UP"], nom: "All Shook Up", liens: ["https://www.facebook.com/Allshookupmusic"] },
  { alias: ["BACK WEST"], nom: "BackWest Country-Band", liens: ["https://www.facebook.com/backwest.countryband", "https://www.backwest.fr/playlist/"] },
  { alias: ["KRYSTEN HEATHER"], nom: "Krysten Heather", liens: ["https://www.facebook.com/krysten.heather", "https://krystenheather.wixsite.com/krysten-heather/playlist"] },
  { alias: ["Miss Lana"], nom: "Miss Lana - Country", liens: ["https://www.facebook.com/groups/1557586554558567", "https://www.facebook.com/MissLana1978", "https://www.facebook.com/lana.gorrebeeck"] },
  { alias: ["Silver", "SILVER"], nom: "Silver", liens: ["https://www.facebook.com/marnix.devriese.5"] },
  { alias: ["PAT CALAHAN"], nom: "Pat Calahan", liens: ["https://www.facebook.com/pat.calahan"] },
  { alias: ["TOLY"], nom: "Toly Christine Zammit", liens: ["https://www.facebook.com/tolyanimation", "https://tolyanimation.com/fiches-danses/", "https://tolyanimation.com/"] },
  { alias: ["Route 66"], nom: "Country Band Route 66", liens: ["https://route66countryband.wordpress.com/", "https://www.facebook.com/profile.php?id=100064116181534&sk=photos"] },
  { alias: ["Lies Van Goethem", "LIES VAN GOETHEM"], nom: "Lies Van Goethem", liens: ["https://www.facebook.com/lies.vangoethem"] },
  { alias: ["Enerj'Ane"], nom: "Anne De Paepe", liens: ["https://www.facebook.com/anne.depaepe.5", "https://www.facebook.com/profile.php?id=61556389834044"] },
  { alias: ["Tania & Marcel"], nom: "Tania Andre", liens: ["https://www.facebook.com/profile.php?id=1400160748", "https://www.facebook.com/groups/106003142775807"] },
];

function cleAnnuaire(valeur) {
  return foldClient(String(valeur || "")).replace(/['’.]/g, "").replace(/\s+/g, "");
}

function groupeConnu(nom) {
  const cle = cleAnnuaire(nom);
  let meilleur = null;
  for (const groupe of annuaire) {
    for (const alias of groupe.alias) {
      const mot = cleAnnuaire(alias);
      if (!mot || !(cle === mot || cle.startsWith(mot))) continue;
      if (!meilleur || mot.length > meilleur.mot) meilleur = { mot: mot.length, groupe };
    }
  }
  return meilleur ? meilleur.groupe : null;
}

function libellePage(url, nom, dejaPage) {
  if (!/facebook\.com/i.test(url)) return "Site";
  return dejaPage ? "Autre page" : nom;
}

function liensGroupe(nom) {
  const groupe = groupeConnu(nom);
  if (!groupe) return null;
  const bloc = el("div", { class: "hors" });
  if (cleAnnuaire(groupe.nom) !== cleAnnuaire(nom)) bloc.append(el("p", { class: "hint" }, [groupe.nom]));
  const liens = el("div", { class: "links" });
  let dejaPage = false;
  for (const url of groupe.liens) {
    const label = libellePage(url, groupe.nom, dejaPage);
    if (/facebook\.com/i.test(url)) dejaPage = true;
    liens.append(el("a", { class: "link quiet", href: url, target: "_blank", rel: "noreferrer" }, [label]));
  }
  bloc.append(liens);
  return bloc;
}

async function pageRepertoires() {
  const data = (await api("/api/repertoires")).filter((rep) => clubLisible(rep.nom));
  const box = el("section", {}, [el("h1", { class: "section" }, ["Listes"])]);
  const list = el("div", { class: "panel list" });
  for (const rep of data) {
    const groupe = groupeConnu(rep.nom);
    const detail = groupe && cleAnnuaire(groupe.nom) !== cleAnnuaire(rep.nom) ? `${groupe.nom} · ` : "";
    list.append(el("button", { class: "rep-hit", type: "button", onclick: () => { location.hash = `#/repertoire/${rep.id}`; } }, [
      el("b", {}, [rep.nom]),
      el("span", { class: "muted" }, [`${detail}${nombre(rep.danses)} danses`]),
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
    liensGroupe(data.nom) || "",
    el("p", { class: "small" }, [`${nombre(data.total)} danses${data.danses.length < data.total ? ` · ${data.danses.length} affichées` : ""}`]),
  ]);
  const list = el("div", { class: "panel list" });
  for (const danse of [...data.danses].sort(comparerNom)) {
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
  const maitrise = el("select", {}, [
    el("option", { value: "" }, ["Non précisé"]),
    ...Object.entries(libelleMaitrise).map(([value, label]) => el("option", { value }, [label])),
  ]);
  const partenaire = el("select", {}, [
    el("option", { value: "" }, ["Non précisé"]),
    el("option", { value: "apprise" }, ["Apprise"]),
    el("option", { value: "non" }, ["Non apprise"]),
  ]);
  const feuille = el("select", {}, [
    el("option", { value: "" }, ["Non précisé"]),
    el("option", { value: "fr" }, ["En français"]),
    el("option", { value: "autre" }, ["Autre langue"]),
  ]);
  const videoDe = el("input", { type: "text", autocomplete: "off" });
  const tag = el("input", { type: "text", autocomplete: "off" });
  const reprise = el("input", { type: "text", autocomplete: "off" });
  const extraire = el("input", { type: "checkbox" });
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
    champ("Maîtrise", maitrise),
    champ("Partenaire", partenaire),
    champ("Vidéo de", videoDe),
    champ("Feuille des pas", feuille),
    champ("Temps ajoutés", tag),
    champ("Reprise", reprise),
    champ("Musique à extraire", extraire),
    champ("Type", type),
    champ("Numéro", numero),
    champ("Pas", pas),
    champ("Murs", murs),
    champ("Chorégraphie", youtube, true),
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
          maitrise: maitrise.value,
          partenaire: partenaire.value,
          videoDe: videoDe.value,
          pdf: feuille.value,
          tag: tag.value,
          restart: reprise.value,
          extraire: extraire.checked,
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

function marquerMenu() {
  const hash = location.hash || "#/danses";
  for (const bouton of document.querySelectorAll(".menu [data-route]")) {
    const route = bouton.dataset.route;
    const liste = route === "#/repertoires" && hash.startsWith("#/repertoire/");
    const danse = route === "#/danses" && hash.startsWith("#/danse/");
    bouton.classList.toggle("on", hash === route || hash.startsWith(`${route}?`) || liste || danse);
  }
  document.querySelector("#nouvelle").classList.toggle("on", hash === "#/saisie");
}

async function route() {
  input._fermerSuggestions?.();
  if (!location.hash || location.hash === "#" || location.hash === "#/") {
    history.replaceState(null, "", `${location.pathname}${location.search}#/danses`);
  }
  marquerMenu();
  const hash = location.hash;
  try {
    if (hash.startsWith("#/recherche")) {
      const q = new URLSearchParams(hash.slice(hash.indexOf("?"))).get("q") || input.value.trim();
      input.value = q;
      if (foldClient(q).length < 2) return pageCatalogue("danses");
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
    return pageCatalogue("danses");
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

function lignePartenaire(danse) {
  if (danse.partenaireApprise && danse.partenaireNonApprise) return "Le classeur porte les deux marques : partenaire apprise et non apprise.";
  if (danse.partenaireNonApprise) return "Danse partenaire non apprise";
  if (danse.partenaireApprise) return "Danse partenaire apprise";
  return "";
}

function lectureDanse(nom) {
  const texte = String(nom || "");
  const mots = [];
  if (/\(P\)/i.test(texte)) mots.push("Partenaire");
  const code = texte.match(/\b(PG|PD)\s*(-\s*M)?\s*(-?\s*FF)?\b/i);
  if (!code) return mots.join(" · ");
  const gauche = code[1].toUpperCase() === "PG";
  const pied = gauche ? "pied gauche" : "pied droit";
  const autre = gauche ? "pied droit" : "pied gauche";
  let ligne = `Pied ${gauche ? "gauche" : "droit"}`;
  if (code[2]) ligne += ", miroir";
  if (code[3]) ligne += ", face à face";
  mots.push(ligne);
  const details = [mots.join(" · ")];
  if (code[2]) details.push(`L'homme démarre du ${pied} et la partenaire du ${autre}.`);
  if (code[3]) details.push("On démarre face à face, et non coude à coude.");
  return details.join(" ");
}

const videosDe = {
  "a.g.": "Agnès Gautier",
  "ag": "Agnès Gautier",
  "idj": "Ingeborg De Jonckere",
  "frederab": "Fred et Rabia",
  "chin.": "présenté par une Chinoise (LineDanceDallas)",
  "faur": "Jean-Claude Faur",
  "a & s": "Alan et Sonia Cole",
  "a&s": "Alan et Sonia Cole",
};

function nomVideo(valeur) {
  const texte = String(valeur || "").replace(/\s+/g, " ").trim();
  if (!texte) return "";
  return videosDe[foldClient(texte).replace(/\s+/g, " ")] || texte;
}

function lireMurs(valeur) {
  const texte = String(valeur || "");
  const morceaux = [];
  const re = /(?:M\s*)?(\d+)\s*-\s*(\d+)\s*h/gi;
  let match = re.exec(texte);
  while (match) {
    morceaux.push(`mur ${match[1]} à ${match[2]} heures`);
    match = re.exec(texte);
  }
  if (morceaux.length) return morceaux.join(", ");
  const simple = texte.match(/M\s*(\d+)/i);
  return simple ? `mur ${simple[1]}` : "";
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

const filtresDanse = [
  ["", "Toutes"],
  ["maitrise", "Acquise"],
  ["moyenne", "En apprentissage"],
  ["aucune", "Non apprise"],
  ["laisser", "Exclue"],
  ["p-oui", "Partenaire apprise"],
  ["p-non", "Partenaire non apprise"],
  ["fr", "Paroles en français"],
  ["extraire", "Musique à extraire"],
];

function gardeDanse(item, filtre) {
  if (filtre === "p-oui") return item.partenaireApprise && !item.partenaireNonApprise;
  if (filtre === "p-non") return item.partenaireNonApprise;
  if (filtre === "fr") return item.paroles === "fr";
  if (filtre === "extraire") return item.extraire;
  return item.maitrise === filtre;
}

function allerCatalogue(genre, lettre, filtre) {
  const params = new URLSearchParams();
  if (lettre) params.set("lettre", lettre);
  if (filtre) params.set("filtre", filtre);
  const query = params.toString();
  const next = `#/${genre}${query ? `?${query}` : ""}`;
  if (location.hash === next) route();
  else location.hash = next;
}

async function pageCatalogue(genre) {
  const [titre, hint] = pagesCatalogue[genre];
  const entrees = [...await api(`/api/catalogue?genre=${genre}`)].sort(comparerNom);
  const query = new URLSearchParams(location.hash.split("?")[1] || "");
  const filtre = genre === "danses" ? (query.get("filtre") || "") : "";
  const retenues = filtre ? entrees.filter((item) => gardeDanse(item, filtre)) : entrees;
  const index = retenues.length > 40;
  const lettre = (query.get("lettre") || "A").toUpperCase();
  const visibles = index ? retenues.filter((item) => lettreDe(item.label) === lettre) : retenues;
  const box = el("section", {}, [
    el("h1", { class: "section" }, [titre]),
    el("p", { class: "hint" }, [hint]),
  ]);
  if (genre === "danses") {
    const choix = el("div", { class: "lettres" });
    for (const [id, label] of filtresDanse) {
      choix.append(el("button", {
        type: "button",
        class: id === filtre ? "lettre on" : "lettre",
        onclick: () => allerCatalogue(genre, index ? lettre : "", id),
      }, [label]));
    }
    box.append(choix);
  }
  if (index) {
    const lettres = el("div", { class: "lettres" });
    for (const signe of [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"]) {
      lettres.append(el("button", {
        type: "button",
        class: signe === lettre ? "lettre on" : "lettre",
        onclick: () => allerCatalogue(genre, signe, filtre),
      }, [signe]));
    }
    box.append(lettres);
    box.append(el("p", { class: "small" }, [`${nombre(visibles.length)} sur ${nombre(retenues.length)}`]));
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
  else box.append(el("p", { class: "hint" }, ["Rien dans ce choix."]));
  show(box);
}

let videoEnCours = "";

function commandeLecteur(func) {
  document.querySelector("#yt")?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
}

function lancerLecture(music) {
  const id = idVideo(music.ecoute);
  if (!id) return;
  document.querySelector("#lecteur").hidden = false;
  document.querySelector("#lecteur-titre").textContent = [music.titre, music.interprete].filter(Boolean).join(" · ");
  if (videoEnCours === id) {
    commandeLecteur("playVideo");
    return;
  }
  videoEnCours = id;
  const origin = encodeURIComponent(location.origin);
  document.querySelector("#yt").src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1&origin=${origin}`;
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
for (const bouton of document.querySelectorAll(".menu [data-route]")) {
  bouton.addEventListener("click", () => {
    input.value = "";
    const next = bouton.dataset.route;
    if (location.hash === next) route();
    else location.hash = next;
  });
}
brand.addEventListener("click", () => {
  input.value = "";
  if (location.hash === "#/danses") route();
  else location.hash = "#/danses";
});
window.addEventListener("hashchange", route);
document.querySelector("#lecteur-play").addEventListener("click", () => commandeLecteur("playVideo"));
document.querySelector("#lecteur-pause").addEventListener("click", () => commandeLecteur("pauseVideo"));
document.querySelector("#lecteur-stop").addEventListener("click", () => commandeLecteur("stopVideo"));
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    input.focus();
    input.select();
  }
});
route();
