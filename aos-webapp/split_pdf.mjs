import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

// Utilisation de fs.readFileSync pour charger le JSON sans erreur d'import
const battleplansData = JSON.parse(fs.readFileSync('./src/data/battleplans.json', 'utf8'));

async function splitPdf() {
    const pdfPath = './public/battleplans/LayoutAOSFF.pdf';
    const outputDir = './public/battleplans/layouts';

    // Vérification de l'existence du PDF source
    if (!fs.existsSync(pdfPath)) {
        console.error("❌ Erreur : Le fichier source LayoutAOSFF.pdf est introuvable dans /public/battleplans/");
        return;
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const mainPdfDoc = await PDFDocument.load(existingPdfBytes);
    const numberOfPages = mainPdfDoc.getPageCount();

    console.log(`📄 Document PDF chargé : ${numberOfPages} pages trouvées.`);
    console.log(`📋 Données JSON : ${battleplansData.length} battleplans trouvés.`);

    // On boucle sur les battleplans
    for (let i = 0; i < Math.min(battleplansData.length, numberOfPages); i++) {
        const bp = battleplansData[i];
        
        // Création d'un nouveau document PDF pour la page extraite
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(mainPdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);

        const pdfBytes = await newPdfDoc.save();
        
        // Utilisation du slug (id) du battleplan pour nommer le fichier
        const fileName = `${bp.id}.pdf`;
        fs.writeFileSync(`${outputDir}/${fileName}`, pdfBytes);
        
        console.log(`✅ Page ${i + 1} extraite vers : ${fileName} (${bp.name})`);
    }

    console.log("\n✨ Opération terminée avec succès !");
}

splitPdf().catch((err) => {
    console.error("❌ Une erreur est survenue pendant le découpage :", err);
});