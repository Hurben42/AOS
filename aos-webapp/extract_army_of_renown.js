const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'src/data/factions_full_data.json');
const OUTPUT_FILE = path.join(__dirname, 'src/data/armies_of_renown_detailed.json');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const finalAor = {};

Object.keys(data).forEach(faction => {
    const aorList = data[faction].armies_of_renown;
    
    if (aorList && aorList.length > 0) {
        finalAor[faction] = [];
        const seenSignatures = new Set();

        aorList.forEach(army => {
            const processItems = (items) => {
                if (!items) return;

                items.forEach(html => {
                    // 1. On crée une signature basée uniquement sur le TEXTE ALPHA-NUMÉRIQUE
                    // On retire le HTML, la ponctuation, les espaces, les sauts de ligne
                    const textOnly = html.replace(/<[^>]*>/g, '');
                    const signature = textOnly.toLowerCase().replace(/[^a-z0-9]/g, '');

                    // Si c'est un titre de section vide ou déjà vu, on dégage
                    if (signature.length < 15 || seenSignatures.has(signature)) return;

                    seenSignatures.add(signature);

                    // 2. Extraction propre du nom (entre les premières balises <b>)
                    const nameMatch = html.match(/<b>([^<]+)/i);
                    const itemName = nameMatch ? nameMatch[1].replace(':', '').trim() : "Règle";

                    finalAor[faction].push({
                        name: `[${army.name}] ${itemName}`,
                        html: html
                    });
                });
            };

            processItems(army.battle_traits);
            processItems(army.enhancements);
        });
        
        console.log(`✅ ${faction.toUpperCase()} : ${finalAor[faction].length} règles uniques.`);
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalAor, null, 2));