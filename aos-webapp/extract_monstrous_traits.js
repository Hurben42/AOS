const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT_FILE = path.join(__dirname, 'src/data/factions_full_data.json');
const OUTPUT_FILE = path.join(__dirname, 'src/data/monstrous_traits_detailed.json');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const results = {};

console.log("🦖 Extraction des Monstrous Traits...");

Object.keys(data).forEach(faction => {
    results[faction] = [];

    // On cherche dans la clé monstrous_traits du JSON source
    if (data[faction].monstrous_traits) {
        data[faction].monstrous_traits.forEach(html => {
            const $ = cheerio.load(html);
            
            // On ignore les blocs vides
            if ($('.abBody').length === 0 && $('table').length === 0) return;

            // Le nom est généralement dans le premier <b> du corps de la règle
            let name = $('.abBody b').first().text().replace(':', '').trim();
            
            if (!name) {
                name = $('b').first().text().replace(':', '').trim();
            }

            if (name && name.length > 2) {
                results[faction].push({
                    name: name,
                    html: sanitizeMonstrous(html)
                });
            }
        });
    }
    
    if (results[faction].length > 0) {
        console.log(`   ✅ ${faction.toUpperCase()} : ${results[faction].length} Monstrous Traits trouvés.`);
    }
});

function sanitizeMonstrous(html) {
    const $ = cheerio.load(html);
    $('.ShowFluff, .legend4, img, script, style').remove();
    $('*').removeAttr('style').removeAttr('background').removeAttr('width');
    $('span[data-tooltip-content]').each((i, el) => $(el).replaceWith($(el).text()));
    return $('body').html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
console.log(`\n🚀 Terminé ! Fichier généré : ${OUTPUT_FILE}`);