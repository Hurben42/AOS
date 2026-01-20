import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin racine : public/factions
const FACTIONS_ROOT = path.join(__dirname, 'public', 'factions');

const getAllHtmlFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllHtmlFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".html")) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
};

const extract = () => {
  console.log("🔍 Extraction des Manifestation Lores par étapes...");
  
  const files = getAllHtmlFiles(FACTIONS_ROOT);
  const results = new Set();

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // STEP 1 : Rechercher <h2 class="outline_header3">Manifestation Lore</h2>
      const sectionTag = '<h2 class="outline_header3">Manifestation Lore</h2>';
      const startIndex = content.indexOf(sectionTag);

      if (startIndex !== -1) {
        // STEP 2 : Recherche UNIQUEMENT le prochain <h3 class="h2_pge">
        // On coupe le contenu pour ne chercher que ce qui vient APRES le H2
        const contentAfterH2 = content.substring(startIndex + sectionTag.length);
        
        // Regex pour capturer le contenu du PREMIER h3 class="h2_pge"
        const h3Regex = /<h3[^>]*class="h2_pge"[^>]*>([\s\S]*?)<\/h3>/i;
        const match = contentAfterH2.match(h3Regex);

        if (match) {
          // Nettoyage du nom (enlève les balises HTML si présentes et espaces)
          const loreName = match[1].replace(/<[^>]*>?/gm, '').trim();
          
          if (loreName) {
            results.add(loreName);
            console.log(`✅ [${path.basename(file)}] : ${loreName}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ Erreur sur ${file}:`, err.message);
    }
  });

  // STEP 3 : Répéter sur chaque page (géré par la boucle forEach ci-dessus)

  const finalArray = Array.from(results).sort();
  fs.writeFileSync('extracted_manifestation_lores.json', JSON.stringify(finalArray, null, 2));
  
  console.log("\n--- RESULTATS ---");
  console.log(finalArray);
  console.log(`\n🚀 Terminé ! ${finalArray.length} noms extraits.`);
};

extract();