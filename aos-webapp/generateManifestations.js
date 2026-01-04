const fs = require('fs');
const path = require('path');

// Chemin de base vers tes fichiers HTML
const BASE_PATH = './public/factions/';

const manifestationsIndex = {
  generics: {
    "Primal Energy": ["Burning Head", "Icy Shackles", "Emerald Lifeswarm", "Ravenak's Gnashing Jaws"],
    "Morbid Conjuration": ["Purple Sun of Shyish", "Suffocating Gravetide", "Lauchon the Soulseeker", "Soulsnare Shackles"],
    "Aetherwrought Machineries": ["Chronomantic Cogs", "Quicksilver Swords", "Umbral Spellportal"],
    "Twilit Sorceries": ["Geminids of Uhl-Gysh", "Malevolent Maelstrom", "Prismatic Palisade"],
    "Forbidden Power": ["Horrorghast", "Lauchon the Soulseeker", "Shards of Valagharr", "Soulsnare Shackles"],
    "Krondspine": ["Krondspine Incarnate of Ghur"]
  },
  factions: {}
};

// Fonction pour parcourir les dossiers récursivement
function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else if (file.endsWith('.html')) {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

console.log("🚀 Recherche des fichiers HTML dans " + BASE_PATH);

try {
  const allHtmlFiles = walkSync(BASE_PATH);

  allHtmlFiles.forEach(filePath => {
    // Le nom de la faction est le nom du fichier sans .html (ex: skaven)
    const factionKey = path.basename(filePath, '.html').toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔎 Scan : ${factionKey} (${filePath})`);
    
    const factionResults = [];
    // On sépare le contenu par boîte d'aptitude (BreakInsideAvoid est le conteneur Wahapedia)
    const blocks = content.split('BreakInsideAvoid');

    blocks.forEach(block => {
      // On cherche le bloc qui a le mot-clé SUMMON dans la zone abKeywordsBodyText
      const isSummonAbility = block.includes('SUMMON') && block.includes('abKeywordsBodyText');
      
      if (isSummonAbility) {
        // 1. Extraction de la Casting Value
        const cvMatch = block.match(/class=["']abSpellPointsN["'][^>]*>\s*(\d+)\s*</);
        
        // 2. Extraction du nom de la manifestation (après SUMMON dans le titre)
        // On cherche le texte en gras juste après SUMMON
        const nameMatch = block.match(/<b>SUMMON\s+([^<:]+)/i);

        if (cvMatch && nameMatch) {
          const name = nameMatch[1].trim();
          const cv = cvMatch[1];
          
          factionResults.push({
            name: name,
            castingValue: cv
          });
          console.log(`   ✅ Trouvé : ${name} (CV: ${cv})`);
        }
      }
    });

    if (factionResults.length > 0) {
      manifestationsIndex.factions[factionKey] = factionResults;
    }
  });

  // Sauvegarde dans src/data pour que ton application React puisse l'importer
  const outputPath = './src/data/manifestationsIndex.json';
  
  // Créer le dossier data s'il n'existe pas
  if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(manifestationsIndex, null, 2));
  console.log(`\n✨ Succès ! Fichier généré : ${outputPath}`);

} catch (error) {
  console.error("❌ Erreur lors du scan :", error.message);
}