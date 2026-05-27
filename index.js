const express = require('express');
const path = require('path');
const fs = require('fs');
const sass = require('sass');
const sharp = require('sharp');
const db = require('./util/db'); // Modul baza de date
const app = express();

// ============================================================
// INFORMAȚII DESPRE DIRECTOR ȘI CALE
// ============================================================
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);
console.log('process.cwd():', process.cwd());
console.log('__dirname === process.cwd():', __dirname === process.cwd());
console.log('Sunt __dirname și process.cwd() sempre același lucru? NU! Poți schimba process.cwd() cu process.chdir()');

// ============================================================
// CONFIGURARE EXPRESS
// ============================================================
const PORT = 8080;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views', 'pagini'));

// Static files cu prefix /resurse
app.use('/resurse', express.static(path.join(__dirname, 'public')));

// Verificare pentru /resurse fără fișier (TREBUIE DUPĂ express.static)
app.use('/resurse', (req, res, next) => {
  const caleRequest = decodeURIComponent(req.path);
  if (caleRequest.endsWith('/')) {
    afisareEroare(res, 403);
  } else {
    next();
  }
});

// ============================================================
// VARIABILĂ GLOBALĂ
// ============================================================
global.obGlobal = {
  obErori: null,
  folderScss: path.join(__dirname, 'public', 'css'),
  folderCss: path.join(__dirname, 'public', 'css'),
  folderBackup: path.join(__dirname, 'backup', 'css')
};

// ============================================================
// VECTOR FOLDERELOR DE CREAT
// ============================================================
const vect_foldere = ['temp', 'logs', 'backup', 'fisiere_uploadate'];

function creareFoldereNecesare() {
  vect_foldere.forEach(folder => {
    const carePath = path.join(__dirname, folder);
    if (!fs.existsSync(carePath)) {
      fs.mkdirSync(carePath, { recursive: true });
      console.log(`Folder creat: ${carePath}`);
    } else {
      console.log(`Folder există deja: ${carePath}`);
    }
  });

  const folderBackupCss = path.join(__dirname, 'backup', 'css');
  if (!fs.existsSync(folderBackupCss)) {
    fs.mkdirSync(folderBackupCss, { recursive: true });
    console.log(`Folder creat: ${folderBackupCss}`);
  }
}

// ============================================================
// FUNCȚIE PENTRU COMPILAREA SCSS ÎN CSS
// ============================================================
function compileazaScss(caleScss, caleCss = null) {
  try {
    const caleAbsolutaScss = path.isAbsolute(caleScss) 
      ? caleScss 
      : path.join(global.obGlobal.folderScss, caleScss);

    if (!fs.existsSync(caleAbsolutaScss)) return;

    let caleAbsolutaCss;
    if (caleCss === null || caleCss === undefined || caleCss === '') {
      const numeFisier = path.basename(caleAbsolutaScss, path.extname(caleAbsolutaScss));
      caleAbsolutaCss = path.join(global.obGlobal.folderCss, numeFisier + '.css');
    } else if (path.isAbsolute(caleCss)) {
      caleAbsolutaCss = caleCss;
    } else {
      caleAbsolutaCss = path.join(global.obGlobal.folderCss, caleCss);
    }

    const folderBackupResurseCss = path.join(__dirname, 'backup', 'resurse', 'css');
    if (!fs.existsSync(folderBackupResurseCss)) {
      fs.mkdirSync(folderBackupResurseCss, { recursive: true });
    }

    if (fs.existsSync(caleAbsolutaCss)) {
      const numeFisierBackup = path.basename(caleAbsolutaCss);
      const caleAbsolutaBackup = path.join(folderBackupResurseCss, numeFisierBackup);
      try {
        fs.copyFileSync(caleAbsolutaCss, caleAbsolutaBackup);
        console.log(`✅ Backup CSS: ${caleAbsolutaBackup}`);
      } catch (errBackup) {
        console.error(`❌ EROARE la copierea backup CSS: ${errBackup.message}`);
      }
    }

    const rezultat = sass.renderSync({
      file: caleAbsolutaScss,
      outputStyle: 'compressed',
      includePaths: [
        path.join(__dirname, 'node_modules'),
        path.join(__dirname, 'public', 'css')
      ]
    });

    fs.writeFileSync(caleAbsolutaCss, rezultat.css);
    console.log(`✅ Compilat: ${caleAbsolutaScss} -> ${caleAbsolutaCss}`);
  } catch (err) {
    console.error(`❌ EROARE la compilarea SCSS: ${err.message}`);
  }
}

// ============================================================
// FUNCȚIE PENTRU COMPILAREA INIȚIALĂ A TUTUROR SCSS-URILOR
// ============================================================
function compilareInitialaScss() {
  try {
    if (!fs.existsSync(global.obGlobal.folderScss)) return;
    const fisiere = fs.readdirSync(global.obGlobal.folderScss);
    const fisieriscss = fisiere.filter(f => f.endsWith('.scss'));
    console.log(`🔨 Compilare inițială a ${fisieriscss.length} fișier(e) SCSS...`);
    fisieriscss.forEach(fisier => compileazaScss(fisier));
  } catch (err) {
    console.error(`❌ EROARE la compilare inițială SCSS: ${err.message}`);
  }
}

// ============================================================
// FUNCȚIE PENTRU MONITORIZAREA SCHIMBĂRILOR SCSS
// ============================================================
function monitorizareScss() {
  try {
    if (!fs.existsSync(global.obGlobal.folderScss)) return;
    console.log(`👁️ Monitorizare SCSS activată: ${global.obGlobal.folderScss}`);
    fs.watch(global.obGlobal.folderScss, (eventType, filename) => {
      if (filename && filename.endsWith('.scss')) {
        setTimeout(() => compileazaScss(filename), 100);
      }
    });
  } catch (err) {
    console.error(`❌ EROARE la monitorizare SCSS: ${err.message}`);
  }
}

// ============================================================
// FUNCȚIE PENTRU VALIDARE ERORI.JSON
// ============================================================
function validareEroriJSON() {
  const caleErori = path.join(__dirname, 'config', 'erori.json');
  if (!fs.existsSync(caleErori)) process.exit(1);
  try {
    JSON.parse(fs.readFileSync(caleErori, 'utf-8'));
    console.log('✅ Validare erori.json: OK');
  } catch (err) {
    process.exit(1);
  }
}

// ============================================================
// FUNCȚIE PENTRU INIȚIALIZARE ERORI
// ============================================================
function initErori() {
  try {
    const caleErori = path.join(__dirname, 'config', 'erori.json');
    const obEroriJSON = JSON.parse(fs.readFileSync(caleErori, 'utf-8'));
    const obErori = {
      cale_baza: obEroriJSON.cale_baza,
      eroare_default: {
        titlu: obEroriJSON.eroare_default.titlu,
        text: obEroriJSON.eroare_default.text,
        imagine: obEroriJSON.cale_baza + obEroriJSON.eroare_default.imagine
      },
      informatiierori: {}
    };
    obEroriJSON.info_erori.forEach(eroare => {
      obErori.informatiierori[eroare.identificator] = {
        status: eroare.status,
        titlu: eroare.titlu,
        text: eroare.text,
        imagine: obEroriJSON.cale_baza + eroare.imagine
      };
    });
    global.obGlobal.obErori = obErori;
    console.log('✅ Erori inițializate');
  } catch (err) {
    process.exit(1);
  }
}

// ============================================================
// FUNCȚIE PENTRU AFIȘARE ERORI
// ============================================================
function afisareEroare(res, identificator = null, titluArg = null, textArg = null, imagineArg = null) {
  let titluEroare = global.obGlobal.obErori.eroare_default.titlu;
  let textEroare = global.obGlobal.obErori.eroare_default.text;
  let imagineEroare = global.obGlobal.obErori.eroare_default.imagine;
  let statusCode = 200;

  if (identificator && global.obGlobal.obErori.informatiierori[identificator]) {
    const info = global.obGlobal.obErori.informatiierori[identificator];
    titluEroare = info.titlu;
    textEroare = info.text;
    imagineEroare = info.imagine;
    if (info.status) statusCode = identificator;
  }

  if (titluArg) titluEroare = titluArg;
  if (textArg) textEroare = textArg;
  if (imagineArg) imagineEroare = imagineArg;

  res.status(statusCode).render('eroare', {
    identificatorEroare: identificator || 'Eroare',
    titluEroare, textEroare, imagineEroare,
    ipUtilizator: res.locals.ipUtilizator || '::1'
  });
}

// ============================================================
// FUNCȚIE PENTRU OBȚINERE DATE GALERIE
// ============================================================
function getGalerieData() {
  try {
    const caleJSON = path.join(__dirname, 'config', 'galerie.json');
    if (!fs.existsSync(caleJSON)) return [];
    
    const dateGalerie = JSON.parse(fs.readFileSync(caleJSON, 'utf8'));
    const acum = new Date(); 
    const oraCurenta = acum.getHours();

    let imaginiFiltrate = dateGalerie.imagini.filter(img => {
      return img.intervale_ore.some(interval => {
        const start = interval[0];
        const end = interval[1];
        return oraCurenta >= start && oraCurenta <= end;
      });
    });

    if (imaginiFiltrate.length % 2 !== 0) imaginiFiltrate.pop();

    const folderImagini = path.join(__dirname, 'public', 'imagini');
    const folderMic = path.join(folderImagini, 'mic');
    const folderMediu = path.join(folderImagini, 'mediu');

    imaginiFiltrate.forEach(img => {
      const caleAbsoluta = path.join(folderImagini, img.cale_relativa);
      const numeFisier = path.basename(img.cale_relativa);
      const caleMic = path.join(folderMic, numeFisier);
      const caleMediu = path.join(folderMediu, numeFisier);

      if (fs.existsSync(caleAbsoluta)) {
        if (!fs.existsSync(caleMic)) sharp(caleAbsoluta).resize(300).toFile(caleMic).catch(() => {});
        if (!fs.existsSync(caleMediu)) sharp(caleAbsoluta).resize(500).toFile(caleMediu).catch(() => {});
      }
      
      img.cale_mic = path.join(dateGalerie.cale_galerie, 'mic', numeFisier).replace(/\\/g, '/');
      img.cale_mediu = path.join(dateGalerie.cale_galerie, 'mediu', numeFisier).replace(/\\/g, '/');
      img.cale_mare = path.join(dateGalerie.cale_galerie, numeFisier).replace(/\\/g, '/');
    });

    return imaginiFiltrate;
  } catch (err) {
    return [];
  }
}

// ============================================================
// MIDDLEWARE PENTRU DATE GLOBALE
// ============================================================
app.use(async (req, res, next) => {
  res.locals.ipUtilizator = req.ip || '::1';
  res.locals.imaginiGalerie = getGalerieData();
  try {
      res.locals.optiuniMeniu = await db.getCategorii(); // Pentru meniul de produse
  } catch(e) {
      res.locals.optiuniMeniu = [];
  }
  next();
});

// ============================================================
// RUTELE EXPRESS
// ============================================================

app.get(['/', '/index', '/home'], async (req, res) => {
  try {
      const produse = await db.getProduse();
      // Produse noi (Bonus 18) - sortate invers cronologic
      const produseNoi = produse.sort((a, b) => new Date(b.data_adaugare) - new Date(a.data_adaugare)).slice(0, 3);
      
      res.render('index', {
          produseNoi: produseNoi
      }, (err, html) => {
          if (err) {
              console.error('❌ EROARE la randare index:', err);
              afisareEroare(res);
          } else {
              res.send(html);
          }
      });
  } catch(err) {
      console.error('Eroare pe ruta index:', err);
      afisareEroare(res, 500);
  }
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'imagini', 'favicon', 'favicon.ico'));
});

app.get(/.*\.ejs$/, (req, res) => {
  afisareEroare(res, 400);
});

// ============================================================
// RUTĂ PENTRU PAGINA DE PRODUSE
// ============================================================
app.get('/produse', async (req, res) => {
    try {
        let produse = await db.getProduse();
        
        // Logica pentru filtrare server-side (Bonus 10a/10b)
        // Daca exista query params, filtram:
        if (Object.keys(req.query).length > 0) {
            let nume = req.query.nume || '';
            let categorie = req.query.categorie || 'oricare';
            // Poti adauga mai multe filtre aici daca utilizatorul opteaza pentru filtrare backend
            produse = produse.filter(p => p.nume.toLowerCase().includes(nume.toLowerCase()));
            if (categorie !== 'oricare') {
                produse = produse.filter(p => p.categorie === categorie);
            }
        }

        // Extragere min/max pret pentru range input (Bonus 1)
        let minPret = 0, maxPret = 0;
        if (produse.length > 0) {
            minPret = Math.min(...produse.map(p => parseFloat(p.pret)));
            maxPret = Math.max(...produse.map(p => parseFloat(p.pret)));
        }

        res.render('produse', {
            produse: produse,
            minPret: minPret,
            maxPret: maxPret
        });
    } catch (err) {
        console.error('Eroare la preluare produse pentru ruta /produse', err);
        afisareEroare(res, 500, 'Eroare Baza de Date', 'Nu am putut prelua produsele din baza de date.');
    }
});

// ============================================================
// RUTĂ PENTRU PAGINA UNICĂ A UNUI PRODUS
// ============================================================
app.get('/produs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produs = await db.getProdusById(id);
        if (!produs) {
            afisareEroare(res, 404, 'Produs Inexistent', 'Produsul cerut nu a fost gasit in baza de date.');
            return;
        }

        const seturi = await db.getSeturiPentruProdus(id);
        
        // Produse similare (Bonus 16) - ex. produse din aceeasi categorie
        let produse = await db.getProduse();
        const produseSimilare = produse.filter(p => p.categorie === produs.categorie && p.id !== produs.id).slice(0, 3);

        res.render('produs', {
            produs: produs,
            seturi: seturi,
            produseSimilare: produseSimilare
        });
    } catch (err) {
        console.error('Eroare la preluare produs unic', err);
        afisareEroare(res, 500);
    }
});

// ============================================================
// RUTĂ API PENTRU OFERTA CURENTĂ (Bonus 12)
// ============================================================
app.get('/api/oferta', (req, res) => {
    const ofertePath = path.join(__dirname, 'config', 'oferte.json');
    if (fs.existsSync(ofertePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(ofertePath, 'utf8'));
            if (data && data.oferte && data.oferte.length > 0) {
                // Prima oferta este cea mai noua
                let oferta = data.oferte[0];
                let now = new Date().getTime();
                if (now < oferta["data-finalizare"]) {
                    return res.json(oferta);
                }
            }
        } catch(e) {}
    }
    res.json(null);
});

// ============================================================
// RUTĂ API PENTRU COMPARARE PRODUS (Bonus 20)
// ============================================================
app.get('/api/produs_complet/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produs = await db.getProdusById(id);
        res.json(produs || {});
    } catch(err) {
        res.json({});
    }
});

// ============================================================
// RUTĂ PENTRU PAGINA SETURI (Bonus 17)
// ============================================================
app.get('/seturi', async (req, res) => {
    try {
        const seturi = await db.getToateSeturile();
        res.render('seturi', {
            seturi: seturi
        });
    } catch (err) {
        console.error('Eroare la preluare seturi pentru ruta /seturi', err);
        afisareEroare(res, 500, 'Eroare Baza de Date', 'Nu am putut prelua seturile din baza de date.');
    }
});

app.get('/galerie', (req, res) => {
  res.render('galerie', (err, html) => {
    if (err) {
      console.error('❌ EROARE la randare galerie:', err);
      afisareEroare(res);
    } else {
      res.send(html);
    }
  });
});

app.get(/^\/(.*)$/, (req, res) => {
  let pagina = req.params[0];
  if (pagina === '' || pagina === undefined || pagina === '/') pagina = 'index';
  if (pagina.endsWith('/')) pagina = pagina.slice(0, -1);

  res.render(pagina, (err, html) => {
    if (err) {
      if (err.message.includes('Failed to lookup view')) {
        afisareEroare(res, 404);
      } else {
        console.error(`❌ EROARE la randare pagina ${pagina}:`, err);
        afisareEroare(res);
      }
    } else {
      res.send(html);
    }
  });
});

// ============================================================
// PORNIRE SERVER
// ============================================================
function pornireServer() {
  validareEroriJSON();
  creareFoldereNecesare();
  compilareInitialaScss();
  monitorizareScss();
  initErori();
  
  // Initiere intervale pentru oferte si curatare backup
  require('./util/oferte').initIntervale();

  app.listen(PORT, () => {
    console.log(`✅ Server pornit pe http://localhost:${PORT}`);
  });
}

pornireServer();
