import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On utilise un chemin relatif par rapport au script pour plus de sécurité
const BASE_PATH = path.join(__dirname, 'public/factions');
const OUTPUT_PATH = path.join(__dirname, 'src/data/faction_sections.json');

const alliances = ['chaos', 'death', 'destruction', 'order'];
const results = {};

console.log("🚀 Extraction des règles depuis 'Faction Rules'...");

alliances.forEach(alliance => {
    const alliancePath = path.join(BASE_PATH, alliance);
    if (!fs.existsSync(alliancePath)) return;

    const factions = fs.readdirSync(alliancePath);
    factions.forEach(faction => {
        const factionPath = path.join(alliancePath, faction);
        if (!fs.lstatSync(factionPath).isDirectory()) return;

        // CRUCIAL : On ignore Warscrolls.html et on prend le fichier qui porte le nom de la faction
        const targetFile = `${faction.toLowerCase()}.html`;
        const filePath = path.join(factionPath, targetFile);

        if (fs.existsSync(filePath)) {
            const html = fs.readFileSync(filePath, 'utf8');
            
            // 1. Délimitation de la zone "Faction Rules"
            const startMarker = /<h2[^>]*>Faction Rules<\/h2>/i;
            const endMarker = /<h2[^>]*>Warscrolls<\/h2>/i;

            const startMatch = html.match(startMarker);
            const endMatch = html.match(endMarker);

            if (startMatch) {
                const startIndex = startMatch.index + startMatch[0].length;
                const endIndex = endMatch ? endMatch.index : html.length;
                const zone = html.substring(startIndex, endIndex);

                const sections = [];
                // 2. Extraction des h2 outline_header3 dans cette zone uniquement
                const h2Regex = /<h2[^>]*class="outline_header3"[^>]*>([\s\S]*?)<\/h2>/gi;
                
                let match;
                while ((match = h2Regex.exec(zone)) !== null) {
                    let text = match[1]
                        .replace(/<[^>]*>/g, '') 
                        .replace(/&nbsp;/g, ' ')
                        .trim()
                        .toUpperCase();
                    
                    if (text && text.length > 2 && !sections.includes(text)) {
                        sections.push(text);
                    }
                }

                if (sections.length > 0) {
                    results[faction.toLowerCase()] = sections;
                    console.log(`✅ ${faction.toUpperCase()} : ${sections.length} sections trouvées.`);
                }
            } else {
                console.log(`⚠️ ${faction.toUpperCase()} : Balise 'Faction Rules' absente dans ${targetFile}`);
            }
        }
    });
});

// Sauvegarde
const dir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
console.log(`\n📂 Terminé ! Fichier généré : src/data/faction_sections.json`);