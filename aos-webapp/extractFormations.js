const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configuration des chemins
const factionsBaseDir = path.join(__dirname, 'public/factions');
const outputFile = path.join(__dirname, 'src/data/formations_map.json');

const formationsMap = {};

// Alliances à parcourir
const alliances = ['order', 'chaos', 'death', 'destruction'];

alliances.forEach(alliance => {
  const alliancePath = path.join(factionsBaseDir, alliance);
  
  if (!fs.existsSync(alliancePath)) return;

  const factions = fs.readdirSync(alliancePath);

  factions.forEach(faction => {
    const factionFolderPath = path.join(alliancePath, faction);
    // On cherche le fichier html qui porte le même nom que le dossier (ex: gloomspite/gloomspite.html)
    const htmlPath = path.join(factionFolderPath, `${faction}.html`);

    if (fs.existsSync(htmlPath) && fs.lstatSync(htmlPath).isFile()) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      const $ = cheerio.load(html);
      
      const foundFormations = [];

      // 1. On trouve l'ancre Battle-Formations
      const anchor = $('a[name="Battle-Formations"]');
      
      if (anchor.length > 0) {
        // 2. On cherche le container .Columns2 qui suit cette ancre
        // On utilise nextAll pour chercher plus loin dans le DOM après l'ancre
        const columnsContainer = anchor.nextAll('.Columns2').first();

        if (columnsContainer.length > 0) {
          // 3. On récupère chaque h3.h2_pge à l'intérieur
          columnsContainer.find('h3.h2_pge').each((i, el) => {
            const name = $(el).text().trim();
            if (name) foundFormations.push(name);
          });
        }
      }

      // On stocke par nom de faction (clé unique)
      // On peut aussi normaliser le nom pour correspondre à factionDataMap
      formationsMap[faction.toLowerCase()] = foundFormations;
      console.log(`✅ [${alliance.toUpperCase()}] ${faction}: ${foundFormations.length} formations trouvées.`);
    }
  });
});

// Création du dossier data s'il n'existe pas
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(outputFile, JSON.stringify(formationsMap, null, 2));
console.log('\n🚀 Scraping terminé ! Fichier généré : src/data/formations_map.json');