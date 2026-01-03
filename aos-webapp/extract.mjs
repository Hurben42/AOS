import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Configuration
const BASE_DIR = './public/factions';
const OUTPUT_FILE = './src/data/enhancements_index.json';

// Liste des factions à scanner (ajoute les tiennes ici)
const factions = [
  { alliance: 'death', name: 'nighthaunt' },
  { alliance: 'death', name: 'soulblight-gravelords' }
];

async function run() {
  const index = {};

  for (const faction of factions) {
    const filePath = path.join(BASE_DIR, faction.alliance, faction.name, `${faction.name}.html`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Introuvable : ${filePath}`);
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    index[faction.name] = { heroic_traits: [], artefacts_of_power: [] };

    // On cible les headers de section
    const headers = doc.querySelectorAll('.abHeader');
    headers.forEach(h => {
      const title = h.textContent.toLowerCase();
      const isTrait = title.includes('heroic traits');
      const isArtefact = title.includes('artefacts of power');

      if (isTrait || isArtefact) {
        // On cherche le bloc de contenu qui suit (généralement dans le même conteneur parent ou suivant)
        const parentTable = h.closest('table');
        const contentBox = parentTable ? parentTable.nextElementSibling : null;

        if (contentBox) {
          const names = Array.from(contentBox.querySelectorAll('b'))
            .map(b => b.textContent.replace(':', '').trim())
            .filter(n => n.length > 2 && !["Effect", "Declare", "Passive", "Target"].includes(n));

          if (isTrait) index[faction.name].heroic_traits.push(...names);
          else index[faction.name].artefacts_of_power.push(...names);
        }
      }
    });
    console.log(`✅ ${faction.name} : ${index[faction.name].heroic_traits.length} Traits, ${index[faction.name].artefacts_of_power.length} Artefacts`);
  }

  // Ecriture du fichier
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`\n🚀 Terminé ! Fichier généré : ${OUTPUT_FILE}`);
}

run();