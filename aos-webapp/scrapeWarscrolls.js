const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// CHEMIN CORRIGÉ : pointant vers public/factions
const factionsDir = path.join(__dirname, "public", "factions");
const outputFile = path.join(__dirname, "src", "data", "warscrolls.json");

console.log(`📂 Recherche des factions dans : ${factionsDir}`);

if (!fs.existsSync(factionsDir)) {
  console.error(`❌ ERREUR : Le dossier est introuvable.`);
  process.exit(1);
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\n/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Fonction de normalisation pour la recherche (enlève tout : virgules, apostrophes, tirets)
function searchNormalize(text) {
  return text.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ""); 
}

function getFolders(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

const categories = getFolders(factionsDir);
const result = {};

categories.forEach((category) => {
  const categoryPath = path.join(factionsDir, category);
  const factions = getFolders(categoryPath);
  result[category] = {};

  factions.forEach((faction) => {
    const factionPath = path.join(categoryPath, faction);
    const warscrollFile = path.join(factionPath, "Warscrolls.html");

    if (!fs.existsSync(warscrollFile)) {
      result[category][faction] = [];
      return;
    }

    const htmlContent = fs.readFileSync(warscrollFile, "utf-8");
    const $ = cheerio.load(htmlContent);
    const warscrolls = [];

    $("div.datasheet").each((i, elem) => {
      const $elem = $(elem);
      const nameRaw = $elem.find(".wsHeaderIn").first().text();
      const name = nameRaw.replace(/\n/g, " ").trim();
      
      warscrolls.push({
        name,
        slug: slugify(name),
        searchSlug: searchNormalize(name), // "scourgeofghyransyllesske"
        html: $.html($elem),
      });
    });

    result[category][faction] = warscrolls;
    console.log(`✅ ${faction} (${warscrolls.length} unités)`);
  });
});

const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

console.log(`\n✨ JSON généré avec searchSlug dans : ${outputFile}`);