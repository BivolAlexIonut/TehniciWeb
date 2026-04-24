const express = require('express');
const path = require('path');
const fs = require('fs');
const sass = require('sass');
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

// Static files cu prefix /public
app.use('/public', express.static(path.join(__dirname, 'public')));

// Verificare pentru /public fără fișier (TREBUIE DUPĂ express.static)
app.use('/public', (req, res, next) => {
  // Verific dacă cererea este la un folder (fără extensie de fișier)
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

  // Creare subdirectar backup/css
  const folderBackupCss = path.join(__dirname, 'backup', 'css');
  if (!fs.existsSync(folderBackupCss)) {
    fs.mkdirSync(folderBackupCss, { recursive: true });
    console.log(`Folder creat: ${folderBackupCss}`);
  } else {
    console.log(`Folder există deja: ${folderBackupCss}`);
  }
}

// ============================================================
// FUNCȚIE PENTRU COMPILAREA SCSS ÎN CSS
// ============================================================
function compileazaScss(caleScss, caleCss = null) {
  try {
    // Determinare cale absolută pentru fișierul scss
    const caleAbsolutaScss = path.isAbsolute(caleScss) 
      ? caleScss 
      : path.join(global.obGlobal.folderScss, caleScss);

    // Verificare existență fișier scss
    if (!fs.existsSync(caleAbsolutaScss)) {
      console.error(`❌ EROARE: Fișierul SCSS nu există: ${caleAbsolutaScss}`);
      return;
    }

    // Determinare cale absolută pentru fișierul css
    let caleAbsolutaCss;
    if (caleCss === null || caleCss === undefined || caleCss === '') {
      // Dacă nu se specifică cale css, se folosește folderul css cu același nume dar cu extensie .css
      const numeFisier = path.basename(caleAbsolutaScss, path.extname(caleAbsolutaScss));
      caleAbsolutaCss = path.join(global.obGlobal.folderCss, numeFisier + '.css');
    } else if (path.isAbsolute(caleCss)) {
      caleAbsolutaCss = caleCss;
    } else {
      caleAbsolutaCss = path.join(global.obGlobal.folderCss, caleCss);
    }

    // Faceă backup fișierului CSS vechi dacă există
    if (fs.existsSync(caleAbsolutaCss)) {
      const numeFisierBackup = path.basename(caleAbsolutaCss);
      const caleAbsolutaBackup = path.join(global.obGlobal.folderBackup, numeFisierBackup);
      
      // Creare folder backup dacă nu există
      if (!fs.existsSync(global.obGlobal.folderBackup)) {
        fs.mkdirSync(global.obGlobal.folderBackup, { recursive: true });
      }

      try {
        fs.copyFileSync(caleAbsolutaCss, caleAbsolutaBackup);
        console.log(`✅ Backup CSS: ${caleAbsolutaBackup}`);
      } catch (errBackup) {
        console.error(`❌ EROARE la copierea backup CSS: ${errBackup.message}`);
      }
    }

    // Compilare SCSS în CSS
    const rezultat = sass.renderSync({
      file: caleAbsolutaScss,
      outputStyle: 'compressed',
      includePaths: [
        path.join(__dirname, 'node_modules'),
        path.join(__dirname, 'resurse', 'css')
      ]
    });

    // Scriere fișier CSS
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
    if (!fs.existsSync(global.obGlobal.folderScss)) {
      console.log(`⚠️ AVERTISMENT: Folderul SCSS nu există: ${global.obGlobal.folderScss}`);
      return;
    }

    const fisiere = fs.readdirSync(global.obGlobal.folderScss);
    const fisieriscss = fisiere.filter(f => f.endsWith('.scss'));

    if (fisieriscss.length === 0) {
      console.log(`ℹ️ Nu au fost găsite fișiere SCSS în: ${global.obGlobal.folderScss}`);
      return;
    }

    console.log(`🔨 Compilare inițială a ${fisieriscss.length} fișier(e) SCSS...`);
    fisieriscss.forEach(fisier => {
      compileazaScss(fisier);
    });
  } catch (err) {
    console.error(`❌ EROARE la compilare inițială SCSS: ${err.message}`);
  }
}

// ============================================================
// FUNCȚIE PENTRU MONITORIZAREA SCHIMBĂRILOR SCSS
// ============================================================
function monitorizareScss() {
  try {
    if (!fs.existsSync(global.obGlobal.folderScss)) {
      console.log(`⚠️ AVERTISMENT: Folderul SCSS nu există: ${global.obGlobal.folderScss}`);
      return;
    }

    console.log(`👁️ Monitorizare SCSS activată: ${global.obGlobal.folderScss}`);
    
    fs.watch(global.obGlobal.folderScss, (eventType, filename) => {
      if (filename && filename.endsWith('.scss')) {
        console.log(`\n📝 DETECTAT: ${eventType} - ${filename}`);
        setTimeout(() => {
          compileazaScss(filename);
        }, 100);
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
  
  // Verificare existență fișier
  if (!fs.existsSync(caleErori)) {
    console.error('❌ EROARE: Fișierul erori.json nu există la:', caleErori);
    process.exit(1);
  }

  let obEroriJSON;
  let continutJSON = '';
  try {
    continutJSON = fs.readFileSync(caleErori, 'utf-8');
    obEroriJSON = JSON.parse(continutJSON);
  } catch (err) {
    console.error('❌ EROARE: Fișierul erori.json nu este valid JSON:', err.message);
    process.exit(1);
  }

  // Verificare proprietăți principale
  const proprietatiOblatorii = ['info_erori', 'cale_baza', 'eroare_default'];
  for (const prop of proprietatiOblatorii) {
    if (!obEroriJSON.hasOwnProperty(prop)) {
      console.error(`❌ EROARE: Fișierul erori.json nu conține proprietatea obligatorie: ${prop}`);
      process.exit(1);
    }
  }

  // Verificare proprietăți pentru eroarea default
  const proprietatiDefault = ['titlu', 'text', 'imagine'];
  for (const prop of proprietatiDefault) {
    if (!obEroriJSON.eroare_default.hasOwnProperty(prop)) {
      console.error(`❌ EROARE: eroare_default nu conține proprietatea obligatorie: ${prop}`);
      process.exit(1);
    }
  }

  // Verificare folder cale_baza
  const calebaza = obEroriJSON.cale_baza;
  const caleAbsoluta = path.join(__dirname, 'public', 'imagini', 'erori');
  // Notă: Cale baza este URL, nu cale fizică. Voi verifica dacă folderul există

  // Verificare existență fișiere imagini
  const vect_imagini_lipsa = [];
  obEroriJSON.info_erori.forEach(eroare => {
    const caleImagine = path.join(caleAbsoluta, eroare.imagine);
    if (!fs.existsSync(caleImagine)) {
      vect_imagini_lipsa.push({
        identificator: eroare.identificator,
        imagine: eroare.imagine,
        cale: caleImagine
      });
    }
  });

  if (vect_imagini_lipsa.length > 0) {
    console.warn('⚠️ AVERTISMENT: Următoarele fișiere imagine nu există:');
    vect_imagini_lipsa.forEach(img => {
      console.warn(`   - Eroare ${img.identificator}: ${img.cale}`);
    });
  }

  // Verificare duplicate de identificator
  const mapIdentificatori = new Map();
  obEroriJSON.info_erori.forEach(eroare => {
    if (mapIdentificatori.has(eroare.identificator)) {
      const eroariExistente = mapIdentificatori.get(eroare.identificator);
      eroariExistente.push(eroare);
      mapIdentificatori.set(eroare.identificator, eroariExistente);
    } else {
      mapIdentificatori.set(eroare.identificator, [eroare]);
    }
  });

  mapIdentificatori.forEach((erori, identificator) => {
    if (erori.length > 1) {
      console.warn(`⚠️ AVERTISMENT: Mai multe erori cu același identificator ${identificator}:`);
      erori.forEach(err => {
        console.warn(`   - Titlu: ${err.titlu}, Text prefix: ${err.text.substring(0, 50)}...`);
      });
    }
  });

  // Verificare proprietăți duplicate în fișier JSON
  verificareDuplicateProprietati(continutJSON);

  console.log('✅ Validare erori.json: OK');
}

// ============================================================
// FUNCȚIE BONIFUS: VERIFICARE PROPRIETĂȚI DUPLICATE
// ============================================================
function verificareDuplicateProprietati(continutJSON) {
  // Verific dacă sunt proprietăți duplicate în stringul JSON (înainte de parsare)
  const RegexProprietati = /"([^"]+)"\s*:/g;
  let match;
  const mapProp = new Map();
  let linie = 1;
  const linii = continutJSON.split('\n');

  linii.forEach((liniaText, indexLinie) => {
    let matchLoc;
    while ((matchLoc = RegexProprietati.exec(liniaText)) !== null) {
      const propName = matchLoc[1];
      if (mapProp.has(propName)) {
        const aparitii = mapProp.get(propName);
        aparitii.push(indexLinie + 1);
        mapProp.set(propName, aparitii);
      } else {
        mapProp.set(propName, [indexLinie + 1]);
      }
    }
  });

  mapProp.forEach((liniile, propName) => {
    if (liniile.length > 1) {
      console.warn(`⚠️ AVERTISMENT: Proprietatea "${propName}" apare de ${liniile.length} ori în fișierul JSON la liniile: ${liniile.join(', ')}`);
    }
  });
}

// ============================================================
// FUNCȚIE PENTRU INIȚIALIZARE ERORI
// ============================================================
function initErori() {
  try {
    const caleErori = path.join(__dirname, 'config', 'erori.json');
    const continut = fs.readFileSync(caleErori, 'utf-8');
    const obEroriJSON = JSON.parse(continut);

    // Creez un obiect cu structura erorilor
    const obErori = {
      cale_baza: obEroriJSON.cale_baza,
      eroare_default: {
        titlu: obEroriJSON.eroare_default.titlu,
        text: obEroriJSON.eroare_default.text,
        imagine: obEroriJSON.cale_baza + obEroriJSON.eroare_default.imagine
      },
      informatiierori: {}
    };

    // Adaug erorile în obiect cu cale URL
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
    console.error('❌ EROARE la inițializare erori:', err.message);
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
    if (info.status) {
      statusCode = identificator;
    }
  }

  // Prioritate pentru argumente
  if (titluArg) titluEroare = titluArg;
  if (textArg) textEroare = textArg;
  if (imagineArg) imagineEroare = imagineArg;

  res.status(statusCode).render('eroare', {
    identificatorEroare: identificator || 'Eroare',
    titluEroare: titluEroare,
    textEroare: textEroare,
    imagineEroare: imagineEroare,
    ipUtilizator: '::1' // localhost
  });
}

// ============================================================
// MIDDLEWARE PENTRU IP UTILIZATOR
// ============================================================
app.use((req, res, next) => {
  res.locals.ipUtilizator = req.ip || '::1';
  next();
});

// ============================================================
// RUTELE EXPRESS
// ============================================================

// Rută pentru pagina inițială (/, /index, /home)
app.get(['/', '/index', '/home'], (req, res) => {
  res.render('index', { ipUtilizator: res.locals.ipUtilizator }, (err, html) => {
    if (err) {
      console.error('❌ EROARE la randare index:', err.message);
      if (err.message.includes('Failed to lookup view')) {
        afisareEroare(res, 404);
      } else {
        afisareEroare(res);
      }
    } else {
      res.send(html);
    }
  });
});

// Rută pentru favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'imagini', 'favicon', 'favicon.ico'));
});

// Verificare pentru cereri .ejs
app.get(/.*\.ejs$/, (req, res) => {
  afisareEroare(res, 400);
});

// Rută pentru galerie
app.get('/galerie', (req, res) => {
  try {
    const caleGalerie = path.join(__dirname, 'config', 'galerie.json');
    const galerieData = JSON.parse(fs.readFileSync(caleGalerie, 'utf-8'));
    res.render('galerie', { ipUtilizator: res.locals.ipUtilizator, galerieData }, (err, html) => {
      if (err) {
        afisareEroare(res);
      } else {
        res.send(html);
      }
    });
  } catch (err) {
    console.error('Eroare la citirea galerie.json:', err);
    afisareEroare(res);
  }
});

// Rută generică pentru pagini
app.get('/:pagina', (req, res) => {
  const pagina = req.params.pagina;
  res.render(pagina, { ipUtilizator: res.locals.ipUtilizator }, (err, html) => {
    if (err) {
      if (err.message.includes('Failed to lookup view')) {
        afisareEroare(res, 404);
      } else {
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
  // Validare erori.json
  validareEroriJSON();
  
  // Creare folderele necesare
  creareFoldereNecesare();

  // Compilare inițială SCSS
  compilareInitialaScss();

  // Monitorizare SCSS
  monitorizareScss();
  
  // Inițializare erori
  initErori();

  app.listen(PORT, () => {
    console.log(`✅ Server pornit pe http://localhost:${PORT}`);
  });
}

// Pornire
pornireServer();
