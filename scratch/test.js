const http = require('http');
http.get('http://localhost:8080/produse?categorie=Suplimente', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const count = (data.match(/<article class="col produs/g) || []).length;
        console.log('Articole gasite:', count);
        console.log(data.includes('Nu exista produse conform filtrarii curente.') ? 'Mesaj lipsa prezent' : 'Fara mesaj lipsa');
    });
});
