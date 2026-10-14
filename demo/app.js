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
  danses: ["Danses", ""],
  chansons: ["Chansons", "Les musiques du répertoire, par ordre alphabétique."],
  artistes: ["Artistes", "Les chanteurs des musiques."],
  playlists: ["Listes de lecture", "Le classeur ne découpe pas les quatre séries d'environ 15 danses. Il contient seulement deux colonnes dont le titre porte « playlist »."],
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
    const blocs = { club: [], groupe: [], playlist: [] };
    for (const rep of listes) blocs[sorteListe(rep.nom)].push(rep);
    const titres = [["club", "Clubs"], ["groupe", "Groupes"], ["playlist", "Listes de lecture"]];
    for (const [cle, titre] of titres) {
      if (!blocs[cle].length) continue;
      box.append(el("h2", { class: "section" }, [`${titre} · ${blocs[cle].length}`]));
      const reps = el("div", { class: "listes" });
      for (const rep of blocs[cle]) {
        reps.append(el("button", { class: "liste", type: "button", onclick: () => { location.hash = `#/repertoire/${rep.id}`; } }, [rep.nom]));
      }
      box.append(reps);
    }
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

const coordonneesClubs = [
  { nom: "Les Rebelle's", adresse: "18 Route de Soiron, 4860 Pepinster", contact: "Josiane D'Herdt", telephone: "+32 496 18 74 68" },
  { nom: "Riverside Country Club", adresse: "Lundi à Maillen (Assesse) / Jeudi à Emptinne (Ciney)", contact: "Christine Lefebvre" },
  { nom: "Simply Dancers", adresse: "Centre Sportif de Tenneville, Champlon", contact: "Laurent Chalon" },
  { nom: "Addicted Country Dancers", adresse: "Rue des Chasseurs-Ardennais, 5377 Noiseux", telephone: "+32 498 70 44 49" },
  { nom: "JUMPERKE Line Dancers", adresse: "Lindenweg 5, 2590 Berlaar", contact: "Godelieva De Rijck", email: "godelieva@jumperke-linedancers.be" },
];

function ficheClub(nom) {
  const cle = foldClient(nom);
  return coordonneesClubs.find((club) => foldClient(club.nom) === cle) || null;
}

function blocCoordonnees(nom) {
  const club = ficheClub(nom);
  if (!club) return null;
  const bloc = el("div", { class: "coordonnees" });
  if (club.adresse) bloc.append(el("p", {}, [club.adresse]));
  if (club.contact) bloc.append(el("p", {}, [club.contact]));
  if (club.telephone) bloc.append(el("p", {}, [el("a", { href: `tel:${club.telephone.replace(/\s/g, "")}` }, [club.telephone])]));
  if (club.email) bloc.append(el("p", {}, [el("a", { href: `mailto:${club.email}` }, [club.email])]));
  return bloc;
}

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

function retourListe(nom) {
  const sorte = sorteListe(nom);
  if (sorte === "playlist") return "#/playlists";
  if (sorte === "groupe") return "#/groupes";
  return "#/clubs";
}

function libelleRetour(nom) {
  const sorte = sorteListe(nom);
  if (sorte === "playlist") return "Listes de lecture";
  if (sorte === "groupe") return "Groupes";
  return "Clubs";
}

function sorteListe(nom) {
  if (/playlist/i.test(nom || "")) return "playlist";
  if (groupeConnu(nom)) return "groupe";
  return "club";
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

async function pageListes(sorte) {
  const titre = sorte === "groupe" ? "Groupes" : "Clubs";
  const hint = sorte === "groupe"
    ? "Les personnes et les formations indiquées par le client."
    : "Les clubs, et les listes qui ne sont ni un groupe ni une playlist.";
  const data = (await api("/api/repertoires"))
    .filter((rep) => clubLisible(rep.nom) && sorteListe(rep.nom) === sorte)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
  const box = el("section", {}, [
    el("h1", { class: "section" }, [titre]),
    el("p", { class: "hint" }, [hint]),
  ]);
  const list = el("div", { class: "panel list" });
  for (const rep of data) {
    const groupe = groupeConnu(rep.nom);
    const detail = groupe && cleAnnuaire(groupe.nom) !== cleAnnuaire(rep.nom) ? `${groupe.nom} · ` : "";
    const fiche = ficheClub(rep.nom);
    const contact = fiche ? [fiche.contact, fiche.telephone, fiche.email].filter(Boolean).join(" · ") : "";
    list.append(el("button", { class: "rep-hit", type: "button", onclick: () => { location.hash = `#/repertoire/${rep.id}`; } }, [
      el("b", {}, [rep.nom]),
      el("span", { class: "muted" }, [`${detail}${nombre(rep.danses)} danses${contact ? ` · ${contact}` : ""}`]),
    ]));
  }
  if (data.length) box.append(list);
  else box.append(el("p", { class: "hint" }, ["Rien dans ce choix."]));
  show(box);
}

async function pageRepertoire(id) {
  const data = await api(`/api/repertoires/${id}`);
  const box = el("section", {}, [
    el("button", { class: "back", type: "button", onclick: () => { location.hash = retourListe(data.nom); } }, [libelleRetour(data.nom)]),
    el("h1", { class: "section" }, [data.nom]),
    blocCoordonnees(data.nom) || "",
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
  for (const bouton of document.querySelectorAll(".menu [data-route]")) {
    bouton.classList.toggle("on", bouton.dataset.route === retourListe(data.nom));
  }
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

async function pageSaisie() {
  const nom = el("input", { type: "text", autocomplete: "off" });
  const musique = el("input", { type: "text", autocomplete: "off" });
  const interprete = el("input", { type: "text", autocomplete: "off" });
  const choregraphe = el("input", { type: "text", autocomplete: "off" });
  const niveaux = await api("/api/niveaux").catch(() => []);
  const niveau = el("select", {}, [
    el("option", { value: "" }, ["Non précisé"]),
    ...niveaux.map((item) => el("option", { value: item.label }, [item.label])),
  ]);
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
  brancherSuggestions(type, "type", (item) => { type.value = item.label; });
  const clubs = (await api("/api/repertoires")).filter((rep) => clubLisible(rep.nom))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
  const listeClubs = el("div", { class: "suggest haut", hidden: "hidden" });
  club.after(listeClubs);
  function choisirClub(rep) {
    if (!choisis.some((item) => item.id === rep.id)) choisis.push({ id: rep.id, label: rep.nom });
    club.value = "";
    listeClubs.hidden = true;
    dessinerClubs();
  }
  function montrerClubs() {
    const q = foldClient(club.value);
    const visibles = clubs.filter((rep) => !q || foldClient(rep.nom).includes(q));
    listeClubs.replaceChildren();
    if (!visibles.length) { listeClubs.hidden = true; return; }
    listeClubs.hidden = false;
    for (const rep of visibles) {
      listeClubs.append(el("button", { type: "button", onmousedown: (event) => { event.preventDefault(); choisirClub(rep); } }, [rep.nom]));
    }
  }
  club.addEventListener("focus", montrerClubs);
  club.addEventListener("input", montrerClubs);
  club.addEventListener("blur", () => window.setTimeout(() => { listeClubs.hidden = true; }, 150));
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

const colonnesTableau = [
  { cle: "numero", label: "N°", pin: true, largeur: 72 },
  { cle: "nom", label: "Nom", pin: true, largeur: 280, teinte: true },
  { cle: "musique", label: "Musique", groupe: "infos", largeur: 220 },
  { cle: "interprete", label: "Artiste", groupe: "infos", largeur: 180 },
  { cle: "choregraphe", label: "Chorégraphe", groupe: "infos", largeur: 200 },
  { cle: "niveau", label: "Niveau", groupe: "infos", largeur: 140 },
  { cle: "maitrise", label: "Maîtrise", groupe: "infos", largeur: 150, teinte: true },
  { cle: "type", label: "Type", groupe: "technique", largeur: 110 },
  { cle: "pas", label: "Pas", groupe: "technique", largeur: 70 },
  { cle: "murs", label: "Murs", groupe: "technique", largeur: 70 },
  { cle: "tag", label: "Temps ajoutés", groupe: "technique", largeur: 150 },
  { cle: "reprise", label: "Reprise", groupe: "technique", largeur: 130 },
  { cle: "partenaire", label: "Partenaire", groupe: "technique", largeur: 150 },
  { cle: "feuille", label: "Feuille des pas", groupe: "technique", largeur: 160 },
  { cle: "extraire", label: "À extraire", groupe: "technique", largeur: 110 },
  { cle: "premiere", label: "Première vue", groupe: "historique", largeur: 130 },
  { cle: "choregraphie", label: "Chorégraphie", groupe: "historique", largeur: 140 },
  { cle: "revision", label: "Dernière révision", groupe: "historique", largeur: 150 },
  { cle: "pointage", label: "Clubs", groupe: "pointage", largeur: 360 },
];
const nomsGroupes = { infos: "Infos principales", technique: "Technique", historique: "Historique", pointage: "Pointage clubs" };
const teintesMaitrise = new Set(["maitrise", "moyenne", "aucune", "laisser"]);

function textePartenaire(ligne) {
  if (ligne.partenaireApprise && ligne.partenaireNonApprise) return "Les deux marques";
  if (ligne.partenaireNonApprise) return "Non apprise";
  if (ligne.partenaireApprise) return "Apprise";
  return "";
}

function texteFeuille(ligne) {
  if (ligne.pdf_fr) return "Français";
  if (ligne.pdf_fr === null) return "Autre langue";
  return "";
}

function valeurTableau(ligne, cle) {
  if (cle === "maitrise") return libelleMaitrise[ligne.maitrise] || "";
  if (cle === "partenaire") return textePartenaire(ligne);
  if (cle === "feuille") return texteFeuille(ligne);
  if (cle === "extraire") return ligne.extraire ? "Oui" : "";
  if (cle === "premiere" || cle === "choregraphie" || cle === "revision") return frDate(ligne[cle]);
  if (cle === "pointage") return (ligne.associations || []).filter((lien) => clubLisible(lien.nom)).map((lien) => lien.nom).join(" ");
  return ligne[cle] || "";
}

function libellePointage(lien) {
  if (lien.type === "partenaire") return `${lien.nom} · Partenaire`;
  if (lien.type === "ligne") return `${lien.nom} · Ligne`;
  return lien.marque ? `${lien.nom} · ${lien.marque}` : lien.nom;
}

async function pageTableau() {
  const brut = await api("/api/tableau");
  const toutes = [...brut];
  const lignes = [...toutes];
  const fermes = new Set();
  const tri = { cle: "nom", sens: 1 };
  const filtre = { clubId: "", pratique: "" };
  const clubs = new Map();
  for (const ligne of toutes) {
    for (const lien of ligne.associations || []) {
      if (!lien.clubId || !clubLisible(lien.nom) || clubs.has(lien.clubId)) continue;
      clubs.set(lien.clubId, lien.nom);
    }
  }
  const compte = el("p", { class: "small" });
  const choixClub = el("select", {
    onchange: (event) => { filtre.clubId = event.target.value; restreindre(); },
  }, [el("option", { value: "" }, ["Tous les clubs"])]);
  for (const [id, nom] of [...clubs.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr", { sensitivity: "base" }))) {
    choixClub.append(el("option", { value: id }, [nom]));
  }
  const choixPratique = el("select", {
    onchange: (event) => { filtre.pratique = event.target.value; restreindre(); },
  }, [
    el("option", { value: "" }, ["Toute pratique"]),
    el("option", { value: "ligne" }, ["Ligne seulement"]),
    el("option", { value: "partenaire" }, ["Partenaire seulement"]),
  ]);
  const page = el("section", { class: "tableau-page" }, [
    el("h1", { class: "section" }, ["Tableau"]),
    compte,
    el("div", { class: "t-filtres" }, [
      champ("Club", choixClub),
      champ("Pratique", choixPratique),
    ]),
  ]);
  const scroll = el("div", { class: "tableau-scroll" });
  const entete = el("div", { class: "t-bloc-entete" });
  const espace = el("div", { class: "t-espace" });
  const fenetre = el("div", { class: "t-fenetre" });
  espace.append(fenetre);
  scroll.append(entete, espace);
  page.append(scroll);

  let vuDebut = -1;
  let vuFin = -1;

  function colonnesActives() {
    const cols = [];
    let repli = "";
    for (const col of colonnesTableau) {
      if (col.pin || !fermes.has(col.groupe)) {
        repli = "";
        cols.push(col);
        continue;
      }
      if (repli !== col.groupe) {
        cols.push({ repli: true, groupe: col.groupe, cle: `repli-${col.groupe}`, label: "", largeur: 190 });
        repli = col.groupe;
      }
    }
    let left = 0;
    for (const col of cols) {
      if (!col.pin) continue;
      col.left = left;
      left += col.largeur;
    }
    return cols;
  }

  function comparerLigne(a, b) {
    const va = valeurTableau(a, tri.cle);
    const vb = valeurTableau(b, tri.cle);
    if (!va && vb) return 1;
    if (va && !vb) return -1;
    const ordre = String(va).localeCompare(String(vb), "fr", { sensitivity: "base", numeric: true });
    return tri.sens * (ordre || comparerNom(a, b));
  }

  function cellule(col, texte, teinte) {
    const pin = col.pin ? " t-pin" : "";
    const nom = col.cle === "nom" ? " t-nom" : "";
    const couleur = teinte && teintesMaitrise.has(teinte) ? ` teinte m-${teinte}` : "";
    return el("div", {
      class: `t-cell${pin}${nom}${couleur}`,
      style: col.pin ? `left:${col.left}px` : "",
      title: texte || "",
    }, [texte || ""]);
  }

  function dessinerEntete(cols) {
    const groupes = el("div", { class: "t-groupes" });
    const titres = el("div", { class: "t-colonnes" });
    let index = 0;
    while (index < cols.length) {
      const col = cols[index];
      if (col.pin) {
        groupes.append(cellule(col, ""));
        titres.append(boutonTri(col));
        index += 1;
        continue;
      }
      const groupe = col.groupe;
      let largeur = 0;
      while (index + largeur < cols.length && cols[index + largeur].groupe === groupe) largeur += 1;
      groupes.append(el("button", {
        type: "button",
        class: "t-groupe",
        style: `grid-column: span ${largeur}`,
        onclick: () => {
          if (fermes.has(groupe)) fermes.delete(groupe);
          else fermes.add(groupe);
          vuDebut = -1;
          preparer();
        },
      }, [`${fermes.has(groupe) ? "▸" : "▾"} ${nomsGroupes[groupe]}`]));
      for (let curseur = 0; curseur < largeur; curseur += 1) {
        const courante = cols[index + curseur];
        titres.append(courante.repli ? cellule(courante, "") : boutonTri(courante));
      }
      index += largeur;
    }
    entete.replaceChildren(groupes, titres);
  }

  function boutonTri(col) {
    const marque = tri.cle === col.cle ? (tri.sens === 1 ? " ↑" : " ↓") : "";
    const bouton = cellule(col, `${col.label}${marque}`);
    bouton.classList.add("t-tri");
    bouton.setAttribute("role", "button");
    bouton.tabIndex = 0;
    bouton.addEventListener("click", () => {
      tri.sens = tri.cle === col.cle ? -tri.sens : 1;
      tri.cle = col.cle;
      vuDebut = -1;
      preparer();
    });
    return bouton;
  }

  function cellulePointage(ligne) {
    let liens = (ligne.associations || []).filter((lien) => clubLisible(lien.nom));
    if (filtre.clubId) liens = liens.filter((lien) => lien.clubId === filtre.clubId && (!filtre.pratique || lien.type === filtre.pratique));
    const node = el("div", { class: "t-cell t-pointage", title: liens.map(libellePointage).join(" · ") });
    for (const lien of liens.slice(0, 2)) {
      const sorte = lien.type === "partenaire" ? "partenaire" : lien.type === "ligne" ? "ligne" : "marque";
      const texte = lien.type === "partenaire" ? `🤝 ${lien.nom}` : (lien.marque || lien.nom);
      node.append(el("span", { class: `pastille ${sorte}` }, [texte]));
    }
    if (liens.length > 2) node.append(el("span", { class: "pastille suite" }, [`+${liens.length - 2}`]));
    return node;
  }

  function dessinerLignes(cols) {
    const hauteur = 36;
    const tete = entete.offsetHeight;
    const debut = Math.max(0, Math.floor(scroll.scrollTop / hauteur) - 8);
    const fin = Math.min(lignes.length, Math.ceil((scroll.scrollTop + Math.max(0, scroll.clientHeight - tete)) / hauteur) + 8);
    if (debut === vuDebut && fin === vuFin) return;
    vuDebut = debut;
    vuFin = fin;
    espace.style.height = `${lignes.length * hauteur}px`;
    fenetre.style.top = `${debut * hauteur}px`;
    const fragment = document.createDocumentFragment();
    for (const ligne of lignes.slice(debut, fin)) {
      const row = el("div", {
        class: "t-ligne",
        role: "link",
        tabindex: "0",
        onclick: () => { location.hash = `#/danse/${ligne.id}`; },
        onkeydown: (event) => { if (event.key === "Enter") location.hash = `#/danse/${ligne.id}`; },
      });
      for (const col of cols) {
        row.append(col.cle === "pointage" ? cellulePointage(ligne) : cellule(col, col.repli ? "" : valeurTableau(ligne, col.cle), col.teinte ? ligne.maitrise : ""));
      }
      fragment.append(row);
    }
    fenetre.replaceChildren(fragment);
  }

  function ecrireCompte() {
    const texte = lignes.length === toutes.length
      ? `${nombre(toutes.length)} danses. Le nom reste à gauche, les groupes se replient.`
      : `${nombre(lignes.length)} danses sur ${nombre(toutes.length)}.`;
    compte.textContent = texte;
  }

  function garde(ligne) {
    if (!filtre.clubId && !filtre.pratique) return true;
    return (ligne.associations || []).some((lien) => {
      if (filtre.clubId && lien.clubId !== filtre.clubId) return false;
      if (filtre.pratique && lien.type !== filtre.pratique) return false;
      return true;
    });
  }

  function restreindre() {
    lignes.length = 0;
    for (const ligne of toutes) if (garde(ligne)) lignes.push(ligne);
    scroll.scrollTop = 0;
    vuDebut = -1;
    preparer();
  }

  function preparer() {
    lignes.sort(comparerLigne);
    const cols = colonnesActives();
    scroll.style.setProperty("--t-cols", cols.map((col) => `${col.largeur}px`).join(" "));
    dessinerEntete(cols);
    ecrireCompte();
    vuDebut = -1;
    dessinerLignes(cols);
    scroll._colonnes = cols;
  }

  let cadre = 0;
  scroll.addEventListener("scroll", () => {
    if (cadre) return;
    cadre = requestAnimationFrame(() => {
      cadre = 0;
      dessinerLignes(scroll._colonnes);
    });
  });
  preparer();
  show(page);
  dessinerLignes(scroll._colonnes);
}

function marquerMenu() {
  const hash = location.hash || "#/danses";
  for (const bouton of document.querySelectorAll(".menu [data-route]")) {
    const route = bouton.dataset.route;
    const danse = route === "#/danses" && hash.startsWith("#/danse/");
    bouton.classList.toggle("on", hash === route || hash.startsWith(`${route}?`) || danse);
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
    if (hash === "#/tableau") return pageTableau();
    if (hash === "#/clubs" || hash.startsWith("#/clubs?")) return pageListes("club");
    if (hash === "#/groupes" || hash.startsWith("#/groupes?")) return pageListes("groupe");
    if (hash === "#/repertoires") return pageListes("club");
    const catalogueMatch = hash.match(/^#\/(danses|chansons|artistes|playlists)/);
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
  const box = el("section", {}, [el("h1", { class: "section" }, [titre])]);
  if (hint) box.append(el("p", { class: "hint" }, [hint]));
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
