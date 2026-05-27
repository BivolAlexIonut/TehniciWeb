const fs = require('fs');
const path = require('path');
const db = require('./db');

const ofertePath = path.join(__dirname, '..', 'config', 'oferte.json');
const backupPath = path.join(__dirname, '..', 'backup', 'resurse', 'css');

// Functie Bonus 12: Generare Oferte
async function genereazaOferta() {
    try {
        const categorii = await db.getCategorii();
        if (categorii.length === 0) return;

        let oferteObj = { oferte: [] };
        if (fs.existsSync(ofertePath)) {
            const data = fs.readFileSync(ofertePath, 'utf8');
            if (data) oferteObj = JSON.parse(data);
        }

        const reduceriPosibile = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        
        let categorieAleasa;
        // Asigurare ca nu e aceeasi categorie consecutiv
        let oldOferta = oferteObj.oferte.length > 0 ? oferteObj.oferte[0] : null;
        do {
            categorieAleasa = categorii[Math.floor(Math.random() * categorii.length)];
        } while (oldOferta && oldOferta.categorie === categorieAleasa && categorii.length > 1);

        const reducere = reduceriPosibile[Math.floor(Math.random() * reduceriPosibile.length)];
        
        const now = new Date();
        const start = now.getTime();
        // Setam oferta pentru 2 minute (120 secunde) ca sa fie usor de testat
        const durataT = 2 * 60 * 1000; 
        const end = start + durataT;

        const nouaOferta = {
            categorie: categorieAleasa,
            "data-incepere": start,
            "data-finalizare": end,
            reducere: reducere
        };

        oferteObj.oferte.unshift(nouaOferta);

        // Curatare oferte vechi (T2 = 5 minute in urma)
        const T2 = 5 * 60 * 1000;
        oferteObj.oferte = oferteObj.oferte.filter(o => (now.getTime() - o["data-finalizare"]) < T2);

        fs.writeFileSync(ofertePath, JSON.stringify(oferteObj, null, 2));
        console.log(`[Oferte] Oferta noua generata: ${reducere}% reducere la ${categorieAleasa}`);

    } catch(err) {
        console.error('Eroare la generare oferta', err);
    }
}

// Functie Bonus 13: Curatare fisiere backup mai vechi de T minute (ex: 5 min pt testare)
function curataBackup() {
    try {
        if (!fs.existsSync(backupPath)) return;
        
        const files = fs.readdirSync(backupPath);
        const now = Date.now();
        const T_minute = 5 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(backupPath, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > T_minute) {
                fs.unlinkSync(filePath);
                console.log(`[Backup] Fisier sters vechi: ${file}`);
            }
        });
    } catch(err) {
        console.error('Eroare la stergere backup-uri', err);
    }
}

function initIntervale() {
    // Apel initial
    genereazaOferta();
    curataBackup();

    // SetInterval pentru oferte (la fiecare 2 minute)
    setInterval(genereazaOferta, 2 * 60 * 1000);

    // SetInterval pentru curatare backup (la fiecare 5 minute)
    setInterval(curataBackup, 5 * 60 * 1000);
}

module.exports = {
    initIntervale
};
