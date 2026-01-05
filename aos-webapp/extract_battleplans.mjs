import fs from 'fs';
import * as cheerio from 'cheerio';

const HTML_PATH = './public/battleplans/GeneralHandbook.htm';
const OUTPUT_JSON = './src/data/battleplans.json';

const clean = (txt) => txt ? txt.trim().replace(/\s+/g, ' ') : "";

async function extract() {
    console.log("🚀 Nettoyage et extraction des Battleplans...");

    if (!fs.existsSync(HTML_PATH)) {
        console.error("❌ Erreur : Fichier source introuvable.");
        return;
    }

    try {
        const html = fs.readFileSync(HTML_PATH, 'utf8');
        const $ = cheerio.load(html);
        const battleplans = [];

        $('table.collapse').each((i, el) => {
            const table = $(el);
            const name = clean(table.find('h3.outline_header3').first().text());
            if (!name) return;

            const info = clean(table.find('.h2_ArmyOfRenown').first().text());

            // 1. Image principale (la carte)
            let imagePath = "";
            const imgTag = table.find('.img-opa img');
            if (imgTag.length > 0) {
                const src = imgTag.attr('src') || "";
                imagePath = `/battleplans/GeneralHandbook_files/${src.split('/').pop()}`;
            }

            // 2. Traitement du contenu HTML
            const contentClone = table.clone();
            contentClone.find('h3.outline_header3, .h2_ArmyOfRenown, .img-opa').remove();

            // --- NETTOYAGE SPÉCIFIQUE ---
            
            // A. Supprime l'attribut 'background' sur tous les <td>
            contentClone.find('td[background]').removeAttr('background');

            // B. Supprime les images <img> situées à l'intérieur des <div> avec la classe .abHeader
            contentClone.find('div.abHeader img').remove();

            // C. Correction des chemins pour les images restantes
            contentClone.find('img').each((idx, img) => {
                const currentSrc = $(img).attr('src');
                if (currentSrc && currentSrc.includes('GeneralHandbook_files')) {
                    const fileName = currentSrc.split('/').pop();
                    $(img).attr('src', `/battleplans/GeneralHandbook_files/${fileName}`);
                }
            });

            const descriptionHtml = contentClone.html();

            battleplans.push({
                id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                name,
                info,
                image: imagePath,
                description: descriptionHtml
            });
            
            console.log(`✅ ${name} nettoyé.`);
        });

        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(battleplans, null, 2));
        console.log(`\n✨ Terminé ! Données propres enregistrées.`);

    } catch (error) {
        console.error("❌ Erreur :", error);
    }
}

extract();