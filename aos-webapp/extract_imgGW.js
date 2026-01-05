const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

(async () => {
    // 1. On définit le chemin public de ton app React
    const downloadPath = path.resolve(__dirname, 'public/factions/images');
    
    // Création du dossier s'il n'existe pas
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
        console.log(`📁 Dossier créé : ${downloadPath}`);
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // On se fait passer pour un navigateur classique
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log("🔍 Récupération des liens de factions...");
    await page.goto('https://www.warhammer-community.com/en-gb/articles/mV6svI4q/warhammer-age-of-sigmar-faction-focus-fyreslayers/', { waitUntil: 'networkidle2' });

    const links = await page.evaluate(() => {
        const container = document.querySelector('.article-readMoreBlocks');
        if (!container) return [];
        return Array.from(container.querySelectorAll('a.btn-cover'))
                    .map(a => a.href)
                    .filter(href => href.includes('faction-focus'));
    });

    console.log(`🚀 ${links.length} factions trouvées. Début de l'extraction...`);

    for (const link of links) {
        try {
            await page.goto(link, { waitUntil: 'domcontentloaded' });

            const imageUrl = await page.evaluate(() => {
                // On cible le bloc spécifique que tu as mentionné
                const contentBlock = document.querySelector('.column.md\\:w-10\\/12.mx-auto.xl\\:w-6\\/12');
                if (!contentBlock) return null;
                // On prend la première image contenue dans un paragraphe
                const img = contentBlock.querySelector('p img');
                return img ? img.src : null;
            });

            if (imageUrl) {
                // On nettoie le nom pour avoir un truc propre genre "stormcast-eternals.png"
                const factionSlug = link.split('faction-focus-')[1].replace(/\/$/, "");
                const fileName = `${factionSlug}.png`;
                const filePath = path.join(downloadPath, fileName);

                const file = fs.createWriteStream(filePath);
                https.get(imageUrl, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✅ ${factionSlug} terminé`);
                    });
                });
            }
            
            // Petit temps de pause de 1s pour être discret
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            console.error(`❌ Erreur sur ${link}:`, err.message);
        }
    }

    await browser.close();
    console.log("\n✨ Travail terminé ! Tes images sont dans public/factions/images");
})();