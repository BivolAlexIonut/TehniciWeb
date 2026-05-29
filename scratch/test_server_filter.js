// scratch/test_server_filter.js
const http = require('http');

console.log("Querying /api/filtrare-server?categorie=Echipamente...");
http.get('http://localhost:8080/api/filtrare-server?categorie=Echipamente', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const JSONData = JSON.parse(data);
            console.log('✅ Success! Found products count:', JSONData.length);
            console.log('Products:', JSONData.map(p => ({ id: p.id, name: p.nume, category: p.categorie })));
        } catch (err) {
            console.error('❌ Failed to parse JSON response. Response was:', data);
        }
    });
}).on('error', (err) => {
    console.error('❌ Server is not running or error occurred:', err.message);
});
