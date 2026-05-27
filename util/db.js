const { Pool } = require('pg');

// Configurare conexiune la baza de date
// Se recomanda utilizarea variabilelor de mediu in productie, dar pentru proiect folosim hardcoded
const pool = new Pool({
  user: 'proiect_user',
  host: 'localhost',
  database: 'magazin_crossfit',
  password: 'proiect_pass',
  port: 5432,
});

// Verificare conectare (optional)
pool.connect()
  .then(() => console.log('✅ Conectat cu succes la baza de date PostgreSQL (magazin_crossfit).'))
  .catch(err => console.error('❌ EROARE la conectarea la baza de date:', err.stack));

// Functie pentru obtinerea categoriilor (pentru meniu)
async function getCategorii() {
    try {
        // Preluare enum categorie_produs din postgres
        const query = `
            SELECT unnest(enum_range(NULL::categorie_produs)) AS categorie;
        `;
        const res = await pool.query(query);
        return res.rows.map(row => row.categorie);
    } catch (err) {
        console.error('Eroare la preluarea categoriilor', err);
        return [];
    }
}

// Functie preluare produse
async function getProduse() {
    try {
        const res = await pool.query('SELECT * FROM produse ORDER BY id ASC');
        return res.rows;
    } catch (err) {
        console.error('Eroare la preluarea produselor', err);
        return [];
    }
}

// Functie preluare produs dupa ID
async function getProdusById(id) {
    try {
        const res = await pool.query('SELECT * FROM produse WHERE id = $1', [id]);
        return res.rows.length ? res.rows[0] : null;
    } catch (err) {
        console.error('Eroare la preluarea produsului by id', err);
        return null;
    }
}

// Functie preluare seturi pentru un produs
async function getSeturiPentruProdus(id_produs) {
    try {
        const res = await pool.query(`
            SELECT s.id, s.nume_set, s.descriere_set, 
                   (SELECT SUM(p2.pret) FROM asociere_set as2 JOIN produse p2 ON as2.id_produs = p2.id WHERE as2.id_set = s.id) as pret_total,
                   (SELECT COUNT(*) FROM asociere_set as3 WHERE as3.id_set = s.id) as numar_produse
            FROM seturi s
            JOIN asociere_set as1 ON s.id = as1.id_set
            WHERE as1.id_produs = $1
        `, [id_produs]);
        
        // Calcul reducere
        return res.rows.map(set => {
            let reducereProcent = Math.min(5, set.numar_produse) * 5;
            set.pret_redus = set.pret_total - (set.pret_total * reducereProcent / 100);
            return set;
        });
    } catch (err) {
        console.error('Eroare la preluarea seturilor', err);
        return [];
    }
}

// Functie preluare toate seturile cu produsele lor (Bonus 17)
async function getToateSeturile() {
    try {
        const querySeturi = `
            SELECT s.id, s.nume_set, s.descriere_set,
                   (SELECT SUM(p.pret) FROM asociere_set as1 JOIN produse p ON as1.id_produs = p.id WHERE as1.id_set = s.id) as pret_total,
                   (SELECT COUNT(*) FROM asociere_set as2 WHERE as2.id_set = s.id) as numar_produse
            FROM seturi s
            ORDER BY s.id ASC
        `;
        const resSeturi = await pool.query(querySeturi);
        const seturi = resSeturi.rows;

        for (let s of seturi) {
            let reducereProcent = Math.min(5, s.numar_produse) * 5;
            s.pret_redus = s.pret_total - (s.pret_total * reducereProcent / 100);

            // Produsele din set
            const queryProduse = `
                SELECT p.id, p.nume, p.imagine, p.pret, p.categorie
                FROM produse p
                JOIN asociere_set a ON p.id = a.id_produs
                WHERE a.id_set = $1
            `;
            const resProduse = await pool.query(queryProduse, [s.id]);
            s.produse = resProduse.rows;
        }

        return seturi;
    } catch (err) {
        console.error('Eroare la preluarea tuturor seturilor', err);
        return [];
    }
}

module.exports = {
    pool,
    getCategorii,
    getProduse,
    getProdusById,
    getSeturiPentruProdus,
    getToateSeturile
};
