import fs from 'fs';
import * as cheerio from 'cheerio';

const HTML_PATH = './public/battletactics/battletactics.htm';
const OUTPUT_JSON = './src/data/battletactics.json';

const clean = (txt) => txt ? txt.trim().replace(/\s+/g, ' ') : "";

async function extract() {
    console.log("🚀 Extraction des Battle Tactics...");

    if (!fs.existsSync(HTML_PATH)) {
        console.error("❌ Fichier source introuvable : " + HTML_PATH);
        return;
    }

    try {
        const html = fs.readFileSync(HTML_PATH, 'utf8');
        const $ = cheerio.load(html);
        const battletactics = [];

        // On itère sur chaque titre de Battle Tactic
        $('h3.outline_header').each((i, el) => {
            const header = $(el);
            const name = clean(header.text());
            
            if (!name) return;

            // 1. Récupération de la description
            // On prend tous les éléments entre le h3 actuel et le div .BreakInsideAvoid
            let descriptionHtml = "";
            let nextEl = header.next();
            
            while (nextEl.length && !nextEl.hasClass('BreakInsideAvoid')) {
                // On clone pour ne pas modifier le DOM original pendant l'itérations
                let clone = nextEl.clone();
                
                // Nettoyage des liens <a> tout en gardant le texte
                clone.find('a').each((_, a) => {
                    $(a).replaceWith($(a).text());
                });

                descriptionHtml += $.html(clone);
                nextEl = nextEl.next();
            }

            // 2. Récupération du tableau spécifique
            // On cherche le tableau .customTable qui suit (souvent à l'intérieur ou juste après)
            const table = header.parent().find('table.customTable').first();
            let tableHtml = "";
            
            if (table.length > 0) {
                let tableClone = table.clone();
                
                // Nettoyage des liens dans le tableau
                tableClone.find('a').each((_, a) => {
                    $(a).replaceWith($(a).text());
                });

                tableHtml = $.html(tableClone);
            }

            battletactics.push({
                id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                name: name,
                description: descriptionHtml,
                rulesTable: tableHtml
            });

            console.log(`✅ Tactic extraite : ${name}`);
        });

        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(battletactics, null, 2));
        console.log(`\n✨ Terminé ! ${battletactics.length} tactiques enregistrées.`);

    } catch (error) {
        console.error("❌ Erreur :", error);
    }
}

extract();