import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins de fichiers
const BASE_PATH = path.join(__dirname, 'public', 'factions');
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'spellsIndex.json');

const spellsIndex = { factions: {} };

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

console.log("🚀 Extraction finale des sorts en cours...");

try {
  const allFiles = walkSync(BASE_PATH);
  console.log(`📂 ${allFiles.length} fichiers trouvés.`);

  allFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const factionKey = path.basename(filePath, '.html').toLowerCase();

    // 1. Isoler la zone "Spell Lore"
    const splitH2 = content.split(/<h2[^>]*>[\s\n]*Spell Lore[\s\n]*<\/h2>/i);
    if (splitH2.length < 2) return;
    const zoneH2 = splitH2[1].split(/<h2/i)[0];

    // 2. Découper par domaines de magie (H3)
    const loreSections = zoneH2.split(/<h3/i);
    const factionLores = {};
    loreSections.shift(); 

    loreSections.forEach(section => {
      // NETTOYAGE DU TITRE DU LORE
      const rawLoreTitle = section.split('</h3>')[0];
      const loreTitle = rawLoreTitle
        .replace(/<[^>]*>/g, '') // Supprime les balises HTML
        .replace(/class=["']h2_pge["']>/i, '') // Supprime le résidu de classe si présent
        .trim();

      if (!loreTitle || /Manifestation|Prayer|Invocation/i.test(loreTitle)) return;

      const spells = [];

      // 3. Découper par blocs d'aptitude (BreakInsideAvoid)
      const blocks = section.split(/class=["'][^"']*BreakInsideAvoid[^"']*["']/i);

      blocks.forEach(block => {
        // 4. Extraction de la Casting Value (CV)
        const cvMatch = block.match(/abSpellPointsN[^>]*>[\s\n]*(\d+)[\s\n]*</i);
        
        if (cvMatch) {
          const cv = cvMatch[1];
          
          // 5. Extraction du Nom du sort dans abBody
          const bodySplit = block.split(/abBody[^>]*>/i);
          if (bodySplit.length > 1) {
            const bodyContent = bodySplit[1];
            
            // On cherche le premier texte en gras (le nom du sort)
            const nameMatch = bodyContent.match(/<b>\s*([^<:]+?)\s*(?::|<span|<\/b>)/i);
            
            if (nameMatch) {
              const name = nameMatch[1].replace(/<[^>]*>/g, '').trim().toUpperCase();
              
              // Filtrage des mots techniques de structure
              const blacklist = ["DECLARE", "EFFECT", "TARGET", "SPELL", "CHOOSE", "OR", "CASTING ROLL", "HEAL"];
              if (name.length > 2 && !blacklist.includes(name)) {
                if (!spells.find(s => s.name === name)) {
                  spells.push({ name, castingValue: cv });
                }
              }
            }
          }
        }
      });

      if (spells.length > 0) {
        factionLores[loreTitle] = spells;
      }
    });

    if (Object.keys(factionLores).length > 0) {
      spellsIndex.factions[factionKey] = factionLores;
      console.log(`✅ ${factionKey.padEnd(15)} : indexé avec succès.`);
    }
  });

  // Création du dossier de sortie si nécessaire
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Écriture du JSON final
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spellsIndex, null, 2));

  console.log(`\n✨ Opération terminée !`);
  console.log(`📝 Fichier généré : ${OUTPUT_PATH}`);
  console.log(`📊 Nombre de factions : ${Object.keys(spellsIndex.factions).length}`);

} catch (err) {
  console.error("❌ Erreur critique lors de l'exécution :", err.message);
}