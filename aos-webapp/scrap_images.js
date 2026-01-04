const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Importation de tes données
const warscrollsData = require('./src/data/warscrolls.json');

chromium.use(stealth);

const BASE_DOMAIN = "https://www.warhammer.com";
const OUTPUT_DIR = path.join(__dirname, 'public/img/units');

// Création du dossier si inexistant
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 1. Préparation de la liste de recherche (Normalisation)
const allWarscrolls = [];
Object.values(warscrollsData).forEach(cat => {
    Object.values(cat).forEach(faction => {
        faction.forEach(unit => {
            allWarscrolls.push({ 
                name: unit.name.toLowerCase().trim(),
                // simpleName supprime tout ce qui n'est pas alphanumérique pour un match robuste
                simpleName: unit.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                slug: unit.slug 
            });
        });
    });
});

/**
 * Fonction de téléchargement de l'image
 */
async function downloadImage(url, filename) {
    const filePath = path.join(OUTPUT_DIR, `${filename}.webp`);
    
    // On ne télécharge pas si le fichier existe déjà
    if (fs.existsSync(filePath)) return;

    try {
        const response = await axios({ url, responseType: 'stream', timeout: 15000 });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`  ❌ Erreur image ${filename}: ${err.message}`);
    }
}

/**
 * Script Principal
 */
async function run() {
    console.log("🚀 Lancement du navigateur...");
    const browser = await chromium.launch({ headless: false }); // Mode visible pour surveiller
    const context = await browser.newContext({
        viewport: { width: 1600, height: 1000 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    page.setDefaultTimeout(90000); // 90 secondes pour les connexions lentes

    const URLs = [
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-destruction',
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-order',
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-death',
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-chaos'
    ];

    for (const url of URLs) {
        console.log(`\n🌐 Navigation vers : ${url}`);
        
        try {
            // On attend seulement que le DOM soit là (plus rapide)
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(5000); // Sécurité pour le JS

            // Gestion des Cookies (pour cliquer sur "Show More" sans gêne)
            try {
                const cookiesBtn = page.locator('#onetrust-accept-btn-handler');
                if (await cookiesBtn.isVisible()) await cookiesBtn.click();
            } catch (e) {}

            // 2. Déroulement de la page ("Show More")
            console.log("🖱️  Expansion de la liste de produits...");
            let hasMore = true;
            let safetyCounter = 0;
            
            while (hasMore && safetyCounter < 40) {
                const showMoreBtn = page.getByRole('button', { name: /Show More/i });
                if (await showMoreBtn.isVisible()) {
                    await showMoreBtn.scrollIntoViewIfNeeded();
                    await showMoreBtn.click();
                    await page.waitForTimeout(3500); // Attente du chargement des nouveaux items
                    safetyCounter++;
                } else {
                    // On scroll un peu pour déclencher l'apparition si besoin
                    await page.mouse.wheel(0, 500);
                    await page.waitForTimeout(1000);
                    if (!(await showMoreBtn.isVisible())) hasMore = false;
                }
            }

            // 3. Analyse et téléchargement
            const cards = page.locator('div[data-test="product-card"]');
            const count = await cards.count();
            console.log(`🔎 Analyse de ${count} produits trouvés...`);

            for (let i = 0; i < count; i++) {
                const card = cards.nth(i);
                const titleElement = card.locator('[data-testid="product-card-name"]');
                
                if (await titleElement.count() > 0) {
                    const fullTitle = (await titleElement.innerText()).toLowerCase();
                    const simpleTitle = fullTitle.replace(/[^a-z0-9]/g, '');

                    // Matching : On cherche si le nom d'un warscroll est contenu dans le titre produit
                    const match = allWarscrolls.find(ws => 
                        simpleTitle.includes(ws.simpleName) || ws.simpleName.includes(simpleTitle)
                    );

                    if (match) {
                        // Forcer le scroll sur la carte pour que l'image se charge (lazy-load)
                        await card.scrollIntoViewIfNeeded();
                        
                        const img = card.locator('img').first();
                        let imgSrc = await img.getAttribute('src');

                        // Si c'est un base64 ou vide, on attend 1s et on re-tente
                        if (!imgSrc || imgSrc.includes('data:image')) {
                            await page.waitForTimeout(500);
                            imgSrc = await img.getAttribute('src');
                        }

                        if (imgSrc && !imgSrc.includes('data:image')) {
                            const fullImgUrl = imgSrc.startsWith('http') ? imgSrc : BASE_DOMAIN + imgSrc;
                            // On enlève les paramètres de redimensionnement pour la HD
                            const cleanImgUrl = fullImgUrl.split('?')[0];

                            console.log(`  ✅ Match: [${match.slug}] pour "${fullTitle}"`);
                            await downloadImage(cleanImgUrl, match.slug);
                        }
                    }
                }
            }

        } catch (err) {
            console.error(`⚠️ Erreur sur la catégorie ${url}:`, err.message);
        }
    }

    console.log("\n✨ Terminé ! Toutes les images possibles ont été récupérées.");
    await browser.close();
}

run().catch(err => console.error("💥 Erreur fatale :", err));