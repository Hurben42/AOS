import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins de fichiers
const BASE_PATH = path.join(__dirname, 'public', 'factions');
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'prayersIndex.json');

const prayersIndex = { factions: {} };

/**
 * Parcourt récursivement les dossiers pour trouver tous les fichiers .html
 */
function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      filelist = walkSync(fullPath, filelist);
    } else if (file.endsWith('.html')) {
      filelist.push(fullPath);
    }
  });
  return filelist;
}

console.log("🚀 Extraction des Prières (Prayer Lore) en cours...");

try {
  const allFiles = walkSync(BASE_PATH);
  console.log(`📂 ${allFiles.length} fichiers trouvés.`);

  allFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const factionKey = path.basename(filePath, '.html').toLowerCase();

    // 1. Isoler la zone "Prayer Lore" (On cherche H2 Prayer Lore)
    const splitH2 = content.split(/<h2[^>]*>[\s\n]*Prayer Lore[\s\n]*<\/h2>/i);
    if (splitH2.length < 2) return;
    const zoneH2 = splitH2[1].split(/<h2/i)[0];

    // 2. Découper par domaines de prières (H3)
    const loreSections = zoneH2.split(/<h3/i);
    const factionLores = {};
    loreSections.shift(); 

    loreSections.forEach(section => {
      // Nettoyage du titre du domaine (ex: "Rites of Delusion")
      const rawLoreTitle = section.split('</h3>')[0];
      const loreTitle = rawLoreTitle
        .replace(/<[^>]*>/g, '') 
        .trim();

      if (!loreTitle || /Manifestation|Spell/i.test(loreTitle)) return;

      const prayers = [];

      // 3. Découper par blocs d'aptitude
      const blocks = section.split(/class=["'][^"']*BreakInsideAvoid[^"']*["']/i);

      blocks.forEach(block => {
        // 4. Extraction de la Chanting Value (classe CSS différente des sorts)
        const cvMatch = block.match(/abPrayerPointsN[^>]*>[\s\n]*(\d+)[\s\n]*</i);
        
        if (cvMatch) {
          const cv = cvMatch[1];
          
          // 5. Extraction du Nom de la prière
          const bodySplit = block.split(/abBody[^>]*>/i);
          if (bodySplit.length > 1) {
            const bodyContent = bodySplit[1];
            const nameMatch = bodyContent.match(/<b>\s*([^<:]+?)\s*(?::|<span|<\/b>)/i);
            
            if (nameMatch) {
              const name = nameMatch[1].replace(/<[^>]*>/g, '').trim().toUpperCase();
              
              // Filtrage
              const blacklist = ["DECLARE", "EFFECT", "TARGET", "PRAYER", "CHOOSE", "OR", "CHANTING ROLL"];
              if (name.length > 2 && !blacklist.includes(name)) {
                if (!prayers.find(p => p.name === name)) {
                  prayers.push({ name, chantingValue: cv });
                }
              }
            }
          }
        }
      });

      if (prayers.length > 0) {
        factionLores[loreTitle] = prayers;
      }
    });

    if (Object.keys(factionLores).length > 0) {
      prayersIndex.factions[factionKey] = factionLores;
      console.log(`✅ ${factionKey.padEnd(15)} : indexé (Prières).`);
    }
  });

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(prayersIndex, null, 2));

  console.log(`\n✨ Opération terminée !`);
  console.log(`📝 Fichier généré : ${OUTPUT_PATH}`);

} catch (err) {
  console.error("❌ Erreur critique :", err.message);
}
