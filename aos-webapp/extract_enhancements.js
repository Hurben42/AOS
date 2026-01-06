const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT_FILE = path.join(__dirname, 'src/data/factions_full_data.json');
const OUTPUT_FILE = path.join(__dirname, 'src/data/enhancements_detailed.json');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const finalEnhancements = {};

Object.keys(data).forEach(faction => {
    finalEnhancements[faction] = { heroic_traits: [], artefacts: [] };

    ['heroic_traits', 'artefacts'].forEach(category => {
        if (!data[faction][category]) return;

        data[faction][category].forEach(html => {
            const $ = cheerio.load(html);
            
            // On ignore les blocs qui ne contiennent que des titres H3 sans règle
            if ($('.abBody').length === 0 && $('table').length === 0) return;

            // Le vrai nom de la règle est TOUJOURS dans le premier <b> du corps de la règle
            let realName = $('.abBody b').first().text().replace(':', '').trim();
            
            // Si pas trouvé dans .abBody, on cherche le premier <b> tout court
            if (!realName) {
                realName = $('b').first().text().replace(':', '').trim();
            }

            if (realName && realName.length > 2) {
                finalEnhancements[faction][category].push({
                    name: realName,
                    html: sanitize(html)
                });
            }
        });
    });
    console.log(`✅ ${faction} : ${finalEnhancements[faction].heroic_traits.length} Traits, ${finalEnhancements[faction].artefacts.length} Artefacts.`);
});

function sanitize(html) {
    const $ = cheerio.load(html);
    // On enlève les images et les styles pour la conformité React
    $('img').remove();
    $('h3').remove(); // On enlève les titres de groupes qui polluent l'intérieur
    $('*').removeAttr('style').removeAttr('background').removeAttr('width');
    return $('body').html().trim().replace(/\s+/g, ' ');
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalEnhancements, null, 2));