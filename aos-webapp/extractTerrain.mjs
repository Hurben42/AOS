import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers public/factions
const BASE_PATH = path.join(__dirname, 'public', 'factions');
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'factionTerrainIndex.json');

const terrainIndex = {};

function generate() {
    try {
        const categories = fs.readdirSync(BASE_PATH);

        categories.forEach(category => {
            const categoryPath = path.join(BASE_PATH, category);
            if (!fs.statSync(categoryPath).isDirectory()) return;

            const factions = fs.readdirSync(categoryPath);

            factions.forEach(factionDir => {
                const factionPath = path.join(categoryPath, factionDir);
                if (!fs.statSync(factionPath).isDirectory()) return;

                // On cherche le fichier .html à l'intérieur du dossier (ex: khorne/khorne.html)
                const htmlFile = path.join(factionPath, `${factionDir}.html`);
                
                if (fs.existsSync(htmlFile)) {
                    const html = fs.readFileSync(htmlFile, 'utf8');

                    // REGEX MISE À JOUR :
                    // 1. Cherche la classe BatRole contenant "Faction Terrain"
                    // 2. Ignore les balises span et les classes intermédiaires
                    // 3. Capture le slug à la fin de l'URL du href et le nom dans le <a>
                    const regex = /class="BatRole">Faction Terrain<\/b>.*?<a\s+href=".*?\/([^/"]+)"\s+class="contentColor">(.*?)<\/a>/si;
                    
                    const match = html.match(regex);

                    if (match) {
                        const rawSlug = match[1];
                        const name = match[2].trim();
                        
                        // Nettoyage du slug (transformation de Skull-Altar en skull-altar)
                        const cleanSlug = rawSlug.toLowerCase();

                        terrainIndex[factionDir.toLowerCase()] = {
                            name: name,
                            slug: cleanSlug,
                            category: category
                        };
                        console.log(`📍 Trouvé pour ${factionDir} : ${name} (${cleanSlug})`);
                    }
                }
            });
        });

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(terrainIndex, null, 2));
        console.log(`\n✅ Index terminé : ${Object.keys(terrainIndex).length} terrains indexés.`);

    } catch (error) {
        console.error("❌ Erreur lors de l'extraction :", error);
    }
}

generate();