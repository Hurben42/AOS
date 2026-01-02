const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Importation de vos données Warscrolls
const warscrollsData = require('./src/data/warscrolls.json');

chromium.use(stealth);

const BASE_DOMAIN = "https://www.warhammer.com";
const OUTPUT_DIR = path.join(__dirname, 'public/img/units');

// Création du dossier de destination
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Extraction de la liste des unités
const allWarscrolls = [];
Object.values(warscrollsData).forEach(cat => {
    Object.values(cat).forEach(faction => {
        faction.forEach(unit => {
            allWarscrolls.push({ 
                name: unit.name.toLowerCase().trim(), 
                slug: unit.slug 
            });
        });
    });
});

async function downloadImage(relativeUrl, filename) {
    const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : `${BASE_DOMAIN}${relativeUrl}`;
    const filePath = path.join(OUTPUT_DIR, `${filename}.jpg`);
    
    if (fs.existsSync(filePath)) return;

    try {
        const response = await axios({ url: fullUrl, responseType: 'stream', timeout: 15000 });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve) => {
            writer.on('finish', resolve);
            writer.on('error', resolve);
        });
    } catch (err) {
        console.error(`❌ Erreur téléchargement ${filename}: ${err.message}`);
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 200;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function run() {
    console.log("🚀 Lancement du navigateur...");
    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    // Timeout global de 60 secondes pour les pages lentes
    page.setDefaultTimeout(60000);

    const URLs = [
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-order',
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-death',
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-chaos',
        'https://www.warhammer.com/en-GB/shop/age-of-sigmar/grand-alliance-destruction'
    ];

    for (const url of URLs) {
        console.log(`\n🌐 Navigation vers : ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
        } catch (e) {
            console.log("⚠️ Timeout ou lenteur détectée, tentative de continuer...");
        }

        console.log("🛡️  VÉRIFICATION : Résolvez le captcha manuellement si besoin (Attente 15s)...");
        await page.waitForTimeout(15000); 

        // Cliquer sur "Show More" jusqu'à épuisement
        let hasMore = true;
        while (hasMore) {
            try {
                const btn = page.getByRole('button', { name: /Show More/i });
                if (await btn.isVisible()) {
                    console.log("🖱️  Clic 'Show More'...");
                    await btn.click();
                    await page.waitForTimeout(3000);
                } else {
                    hasMore = false;
                }
            } catch (e) {
                hasMore = false;
            }
        }

        console.log("📜 Défilement pour charger les images (Lazy-loading)...");
        await autoScroll(page);
        await page.waitForTimeout(2000);

        // Analyse des produits
        const cards = page.locator('div[data-test="product-card"]');
        const count = await cards.count();
        console.log(`🔎 Analyse de ${count} produits sur la page...`);

        for (let i = 0; i < count; i++) {
            const card = cards.nth(i);
            const titleElement = card.locator('[data-testid="product-card-name"]');
            
            if (await titleElement.count() > 0) {
                const title = await titleElement.innerText();
                const cleanTitle = title.toLowerCase().trim();
                
                const match = allWarscrolls.find(ws => cleanTitle.includes(ws.name));

                if (match) {
                    const imgElement = card.locator('picture img').first();
                    const imgSrc = await imgElement.getAttribute('src');

                    if (imgSrc) {
                        console.log(`  ✅ Trouvé : [${match.name}]`);
                        await downloadImage(imgSrc, match.slug);
                    }
                }
            }
        }
    }

    console.log("\n✨ Terminé !");
    await browser.close();
}

run().catch(err => console.error("💥 Erreur :", err));