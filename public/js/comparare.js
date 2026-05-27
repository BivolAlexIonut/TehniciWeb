// js/comparare.js

document.addEventListener("DOMContentLoaded", function() {

    // ========================================================
    // BONUS 12: OFERTE SPECIALE
    // ========================================================
    function incarcaOferta() {
        fetch('/api/oferta')
            .then(r => r.json())
            .then(oferta => {
                const container = document.getElementById('oferta-container');
                if(!container) return; // nu suntem pe pagini unde exista oferta
                
                if (oferta) {
                    container.classList.remove('d-none');
                    document.getElementById('oferta-categorie').innerText = oferta.categorie;
                    document.getElementById('oferta-reducere').innerText = oferta.reducere;
                    
                    const elTimer = document.getElementById('oferta-timer');
                    
                    // Modificam preturile produselor din acea categorie pe pagina curenta
                    const produse = document.querySelectorAll('.produs');
                    produse.forEach(p => {
                        if(p.dataset.categorie === oferta.categorie) {
                            const valPretSpan = p.querySelector('.val-pret');
                            if(valPretSpan && !valPretSpan.classList.contains('pret-modificat')) {
                                const pretVechi = parseFloat(p.dataset.pret);
                                const pretNou = pretVechi - (pretVechi * oferta.reducere / 100);
                                valPretSpan.innerHTML = `<span class="text-muted text-decoration-line-through fs-6">${pretVechi.toFixed(2)}</span> <span class="text-danger fw-bold">${pretNou.toFixed(2)}</span>`;
                                valPretSpan.classList.add('pret-modificat');
                                // Suprascriem dataset pret ca filtrele sa o aplice? 
                                // Regulamentul zice "pretul vechi taiat si alaturi cel nou redus". Sortarea ramane ideal dupa pretul nou sau vechi (o setam dupa noul).
                                p.dataset.pret = pretNou; 
                            }
                        }
                    });

                    // Temporizator
                    const interval = setInterval(() => {
                        let now = new Date().getTime();
                        let distanta = oferta["data-finalizare"] - now;

                        if (distanta < 0) {
                            clearInterval(interval);
                            container.classList.add('d-none');
                            // Reincarcam oferte posibile noi
                            setTimeout(incarcaOferta, 2000);
                            return;
                        }

                        let ore = Math.floor((distanta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        let minute = Math.floor((distanta % (1000 * 60 * 60)) / (1000 * 60));
                        let secunde = Math.floor((distanta % (1000 * 60)) / 1000);

                        elTimer.innerText = `${ore}h ${minute}m ${secunde}s`;

                        if (distanta < 10000) {
                            elTimer.classList.add('text-danger', 'fa-beat'); // pulseaza ultimele 10 secunde
                        } else {
                            elTimer.classList.remove('text-danger', 'fa-beat');
                        }
                    }, 1000);
                } else {
                    container.classList.add('d-none');
                }
            })
            .catch(e => console.log('Nu am putut incarca oferta', e));
    }
    incarcaOferta();


    // ========================================================
    // BONUS 20: COMPARARE 2 PRODUSE
    // ========================================================
    let listaComparare = JSON.parse(localStorage.getItem('produseComparare') || '[]');
    let ultimaModificare = parseInt(localStorage.getItem('produseComparareTime') || '0');

    // Daca au trecut 24h (1 zi) de la ultima actiune de comparare, stergem din localstorage (Bonus 20 - 0.1)
    if (Date.now() - ultimaModificare > 24 * 60 * 60 * 1000) {
        listaComparare = [];
        localStorage.removeItem('produseComparare');
    }

    const container = document.getElementById('container-comparare');
    const divLista = document.getElementById('lista-comparare');
    const btnAfiseaza = document.getElementById('btn-afiseaza-comparare');

    function actualizeazaContainer() {
        if(!container) return; // Poate nu suntem pe o pagina de produs/produse

        if (listaComparare.length > 0) {
            container.classList.remove('d-none');
            divLista.innerHTML = '';
            listaComparare.forEach((p, idx) => {
                divLista.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>${idx + 1}. ${p.nume}</span>
                        <button class="btn btn-sm btn-danger btn-sterge-compara" data-id="${p.id}"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
            });

            // Dezactivam / Activam butoanele principale de compara de pe carduri
            const btnComparaToate = document.querySelectorAll('.btn-compara');
            btnComparaToate.forEach(btn => {
                if (listaComparare.length >= 2) {
                    btn.disabled = true;
                    btn.title = "Ștergeți un produs din lista de comparare";
                } else {
                    btn.disabled = false;
                    btn.title = "";
                }
            });

            // Evenimente pentru stergere
            document.querySelectorAll('.btn-sterge-compara').forEach(b => {
                b.addEventListener('click', (e) => {
                    const idStergere = e.currentTarget.dataset.id;
                    listaComparare = listaComparare.filter(item => item.id != idStergere);
                    localStorage.setItem('produseComparare', JSON.stringify(listaComparare));
                    localStorage.setItem('produseComparareTime', Date.now());
                    actualizeazaContainer();
                });
            });

            btnAfiseaza.disabled = listaComparare.length < 2;

        } else {
            container.classList.add('d-none');
            document.querySelectorAll('.btn-compara').forEach(btn => {
                btn.disabled = false;
                btn.title = "";
            });
        }
    }

    actualizeazaContainer();

    // Eveniment adaugare in comparare
    document.body.addEventListener('click', function(e) {
        if(e.target.classList.contains('btn-compara') || e.target.closest('.btn-compara')) {
            const btn = e.target.classList.contains('btn-compara') ? e.target : e.target.closest('.btn-compara');
            if(listaComparare.length >= 2) return;

            const id = btn.dataset.id;
            const nume = btn.dataset.nume;

            // Verificam sa nu adaugam de doua ori acelasi
            if(!listaComparare.some(item => item.id == id)) {
                listaComparare.push({id: id, nume: nume});
                localStorage.setItem('produseComparare', JSON.stringify(listaComparare));
                localStorage.setItem('produseComparareTime', Date.now());
                actualizeazaContainer();
            }
        }
    });

    // Fereastra noua pentru comparare paralela
    if(btnAfiseaza) {
        btnAfiseaza.addEventListener('click', () => {
            if(listaComparare.length === 2) {
                // Ca sa comparam, putem deschide o pagina paralela si facem fetch la detaliile produselor
                // Vom genera HTML in fereastra noua direct.
                
                const w = window.open("", "_blank", "width=800,height=600");
                w.document.write("<h2>Se încarcă compararea...</h2>");

                Promise.all([
                    fetch('/api/produs_complet/' + listaComparare[0].id).then(r=>r.json()),
                    fetch('/api/produs_complet/' + listaComparare[1].id).then(r=>r.json())
                ]).then(rezultate => {
                    const p1 = rezultate[0];
                    const p2 = rezultate[1];

                    w.document.open();
                    w.document.write(`
                        <html>
                        <head>
                            <title>Comparare Produse</title>
                            <link rel="stylesheet" href="/resurse/css/bootstrap.min.css">
                        </head>
                        <body class="p-4">
                            <h2 class="text-center mb-4">Comparație</h2>
                            <table class="table table-bordered table-striped text-center">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Caracteristică</th>
                                        <th>${p1.nume}</th>
                                        <th>${p2.nume}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="fw-bold">Imagine</td>
                                        <td><img src="${p1.imagine}" width="150"></td>
                                        <td><img src="${p2.imagine}" width="150"></td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Pret</td>
                                        <td class="text-success fw-bold">${p1.pret} RON</td>
                                        <td class="text-success fw-bold">${p2.pret} RON</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Categorie</td>
                                        <td>${p1.categorie}</td>
                                        <td>${p2.categorie}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Greutate</td>
                                        <td>${p1.greutate} kg</td>
                                        <td>${p2.greutate} kg</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Culoare</td>
                                        <td>${p1.culoare}</td>
                                        <td>${p2.culoare}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Aprobat competiții</td>
                                        <td>${p1.pentru_competitii ? 'Da' : 'Nu'}</td>
                                        <td>${p2.pentru_competitii ? 'Da' : 'Nu'}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Livrare</td>
                                        <td>${p1.tip_livrare}</td>
                                        <td>${p2.tip_livrare}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="text-center mt-4"><button class="btn btn-secondary" onclick="window.close()">Închide</button></div>
                        </body>
                        </html>
                    `);
                    w.document.close();
                });
            }
        });
    }

});
