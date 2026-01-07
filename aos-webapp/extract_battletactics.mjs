import fs from 'fs';
import * as cheerio from 'cheerio';

const HTML_PATH = './public/battletactics/battletactics.htm';
const OUTPUT_JSON = './src/data/battletactics.json';

const clean = (txt) => txt ? txt.trim().replace(/\s+/g, ' ') : "";

async function extract() {
    console.log("🚀 Extraction des règles détaillées...");
    if (!fs.existsSync(HTML_PATH)) return console.error("❌ Fichier introuvable");

    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const $ = cheerio.load(html);
    const battletactics = [];

    $('h3.outline_header').each((i, el) => {
        const header = $(el);
        const name = clean(header.text());
        if (!name || name.includes("Overview") || name.includes("2025")) return;

        const data = {
            id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
            name: name,
            affray: "", affray_rules: "",
            strike: "", strike_rules: "",
            domination: "", domination_rules: ""
        };

        const table = header.nextAll('.BreakInsideAvoid').first().find('table.customTable');
        
        if (table.length > 0) {
            table.find('tr').each((_, tr) => {
                const cell = $(tr).find('td').first();
                const fullText = cell.text();
                const boldTitle = clean(cell.find('b').first().text());
                
                // On récupère tout le contenu HTML de la cellule
                let cellHtml = cell.html();
                // On retire le label (ex: AFFRAY:) et le titre gras pour ne garder que la règle
                let rulesBody = cellHtml
                    .replace(/<span class="redfont">.*?<\/span>/i, '')
                    .replace(/<font.*?>.*?<\/font>/i, '')
                    .replace(/<b>.*?<\/b>/i, '')
                    .replace(/^<br>/i, '')
                    .trim();

                if (fullText.includes("AFFRAY:")) {
                    data.affray = boldTitle;
                    data.affray_rules = rulesBody;
                } else if (fullText.includes("STRIKE:")) {
                    data.strike = boldTitle;
                    data.strike_rules = rulesBody;
                } else if (fullText.includes("DOMINATION:")) {
                    data.domination = boldTitle;
                    data.domination_rules = rulesBody;
                }
            });
        }
        battletactics.push(data);
    });

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(battletactics, null, 2));
    console.log("✨ JSON mis à jour avec les descriptions de règles !");
}
extract();