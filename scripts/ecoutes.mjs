import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { fold } from "./lib/text.mjs";

const root = process.cwd();
const fichier = path.join(root, "data", "ecoutes.json");
const essai = process.argv.includes("--essai");

function cle(titre, interprete) {
  return `${fold(titre)}\t${fold(interprete)}`;
}

function choisir(text, titre, interprete) {
  const items = [];
  const re = /"videoId":"([\w-]{11})","watchEndpointMusicSupportedConfigs":\{"watchEndpointMusicConfig":\{"musicVideoType":"(MUSIC_VIDEO_TYPE_[A-Z0-9_]+)"\}/g;
  let match;
  while ((match = re.exec(text))) {
    const suite = text.slice(match.index, match.index + 3000);
    const label = suite.match(/"label":"Play ([^"]+)"/);
    items.push({ id: match[1], type: match[2], label: label ? label[1] : "" });
  }
  const titreFold = fold(titre);
  if (titreFold.length < 2) return "";
  const artist = fold(String(interprete || "").replace(/\([^)]*\)/g, " "));
  const token = artist.split(" ").find((mot) => mot.length > 2) || "";
  const danse = /line dance|choregraph|tutorial|copperknob|walkthrough/;
  const candidats = items.filter((item) => {
    const label = fold(item.label);
    if (!label.includes(titreFold) || danse.test(label)) return false;
    return item.type === "MUSIC_VIDEO_TYPE_ATV" || item.type === "MUSIC_VIDEO_TYPE_OMV";
  });
  const rang = (item) => {
    const label = fold(item.label);
    const artiste = token && label.includes(token) ? 0 : 2;
    const genre = item.type === "MUSIC_VIDEO_TYPE_ATV" ? 0 : 1;
    return artiste + genre;
  };
  candidats.sort((a, b) => rang(a) - rang(b));
  return candidats[0] ? `https://www.youtube.com/watch?v=${candidats[0].id}` : "";
}

async function chercher(titre, interprete) {
  const response = await fetch("https://music.youtube.com/youtubei/v1/search?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({
      context: { client: { clientName: "WEB_REMIX", clientVersion: "1.20251001.01.00", hl: "en", gl: "US" } },
      query: [titre, interprete].filter(Boolean).join(" "),
    }),
  });
  if (!response.ok) throw new Error(String(response.status));
  return choisir(await response.text(), titre, interprete);
}

if (essai) {
  const exemples = [
    ["Okie From Muskogee", "Merle Haggard & The Strangers"],
    ["Some Days You Gotta Dance", "The Chicks (Ex.: Dixie Chicks)"],
    ["4x4xU", "Lainey Wilson"],
  ];
  for (const [titre, interprete] of exemples) {
    const url = await chercher(titre, interprete);
    console.log(`${titre} — ${interprete}\n${url || "(aucun)"}\n`);
  }
  process.exit(0);
}

const db = new DatabaseSync(path.join(root, "data", "repertoire.db"), { readOnly: true });
const morceaux = db.prepare("SELECT titre, interprete FROM musiques WHERE deleted_at IS NULL").all()
  .filter((row) => fold(row.titre).length >= 2);
const connus = fs.existsSync(fichier) ? JSON.parse(fs.readFileSync(fichier, "utf8")) : {};
const reste = morceaux.filter((row) => !(cle(row.titre, row.interprete) in connus));
console.log(`${morceaux.length} musiques, ${Object.keys(connus).length} déjà cherchées, ${reste.length} à faire`);

let faites = 0;
async function une(row) {
  const key = cle(row.titre, row.interprete);
  for (let essai = 0; essai < 3; essai += 1) {
    try {
      connus[key] = await chercher(row.titre, row.interprete);
      break;
    } catch (error) {
      if (essai === 2) {
        connus[key] = "";
        console.error("échec", row.titre, error.message);
      } else await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  faites += 1;
  if (faites % 25 === 0) {
    fs.writeFileSync(fichier, JSON.stringify(connus));
    const trouvees = Object.values(connus).filter(Boolean).length;
    console.log(`${faites}/${reste.length} · ${trouvees} liens`);
  }
}

const largeur = 4;
let index = 0;
async function ouvrier() {
  while (index < reste.length) {
    const row = reste[index];
    index += 1;
    await une(row);
  }
}
try {
  await Promise.all(Array.from({ length: largeur }, ouvrier));
} catch (error) {
  console.error("arrêt", error);
}
fs.writeFileSync(fichier, JSON.stringify(connus));
const trouvees = Object.values(connus).filter(Boolean).length;
console.log(`terminé : ${trouvees} liens sur ${Object.keys(connus).length}`);
