// js/produse.js

document.addEventListener("DOMContentLoaded", function () {

    // Helper: Eliminare diacritice (Bonus 7)
    function eliminaDiacritice(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    // Elemente
    const inputNume = document.getElementById("inp-nume");
    const inputDescriere = document.getElementById("inp-descriere");
    const inputPret = document.getElementById("inp-pret");
    const valPret = document.getElementById("val-pret");
    const inputLivrare = document.getElementById("inp-livrare");
    const inputCategorie = document.getElementById("inp-categorie");
    const inputCuloare = document.getElementById("inp-culoare");
    const inputNoutati = document.getElementById("chk-noutati");

    const btnFiltrare = document.getElementById("btn-filtrare");
    const btnFiltrareServer = document.getElementById("btn-filtrare-server");
    const btnReset = document.getElementById("btn-reset");
    const btnSortAsc = document.getElementById("btn-sort-asc");
    const btnSortDesc = document.getElementById("btn-sort-desc");
    const btnCalcul = document.getElementById("btn-calcul");

    let produseInitiale = Array.from(document.querySelectorAll(".produs"));
    const produseGrid = document.getElementById("produse-grid");
    const mesajLipsa = document.getElementById("mesaj-lipsa");
    const numarProduseContainer = document.getElementById("numar-produse");

    // Constante Paginare (Bonus 5)
    const ITEMS_PER_PAGE = 6;
    let produseFiltrate = [...produseInitiale]; // Copie ce se modifica la filtrare
    let currentPage = 1;

    // Actualizare pret range afisat
    inputPret.addEventListener("input", function () {
        valPret.innerText = this.value;
    });

    /**
     * Setari pentru vizibilitatea produselor (Bonus 6).
     */
    function initButoaneVizibilitate() {
        const ascunseSesiune = JSON.parse(sessionStorage.getItem('produseAscunse') || '[]');

        produseInitiale.forEach(prod => {
            const id = prod.id;

            if (ascunseSesiune.includes(id)) {
                prod.classList.add("d-none", "ascuns-sesiune");
            }

            const btnPastreaza = prod.querySelector('.btn-pastreaza');
            const btnAscundeTemp = prod.querySelector('.btn-ascunde-temp');
            const btnAscundeSesiune = prod.querySelector('.btn-ascunde-sesiune');

            if (btnPastreaza) {
                btnPastreaza.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isPinned = prod.classList.contains("pastrat-permanent");
                    if (isPinned) {
                        prod.classList.remove("pastrat-permanent");
                        btnPastreaza.classList.remove("btn-success", "text-white");
                        btnPastreaza.classList.add("btn-light");
                    } else {
                        prod.classList.add("pastrat-permanent");
                        btnPastreaza.classList.remove("btn-light");
                        btnPastreaza.classList.add("btn-success", "text-white");
                    }
                    filtreaza();
                });
            }

            if (btnAscundeTemp) {
                btnAscundeTemp.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prod.classList.add("ascuns-temporar");
                    filtreaza();
                });
            }

            if (btnAscundeSesiune) {
                btnAscundeSesiune.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prod.classList.add("ascuns-sesiune");
                    ascunseSesiune.push(id);
                    sessionStorage.setItem('produseAscunse', JSON.stringify(ascunseSesiune));
                    filtreaza();
                });
            }
        });
    }

    /**
     * Functia principala de filtrare a produselor.
     */
    function filtreaza() {
        // Validare inputuri
        if (inputNume.value.match(/^[0-9]+$/)) {
            inputNume.classList.add("is-invalid");
            return;
        } else {
            inputNume.classList.remove("is-invalid");
        }

        const vNume = eliminaDiacritice(inputNume.value);
        const vDesc = eliminaDiacritice(inputDescriere.value);
        const vPretMax = parseFloat(inputPret.value);
        const vLivrare = inputLivrare.value.toLowerCase();
        const vCateg = inputCategorie.value;
        const optsCuloare = Array.from(inputCuloare.selectedOptions).map(o => o.value);

        const radCompChecked = document.querySelector('input[name="rad-competitii"]:checked');
        const vComp = radCompChecked ? radCompChecked.value : "oricare";

        const bNoutati = inputNoutati.checked;

        const chkMateriale = Array.from(document.querySelectorAll('.chk-material:checked')).map(c => c.value);

        produseFiltrate = [];

        produseInitiale.forEach(prod => {
            try {
                // Daca produsul e ascuns temporar sau pe sesiune, ignoram (cu exceptia pastrat-permanent care suprascrie temporar)
                if (prod.classList.contains("ascuns-sesiune")) return;
                if (prod.classList.contains("ascuns-temporar") && !prod.classList.contains("pastrat-permanent")) return;

                let show = true;

                const pNume = eliminaDiacritice(prod.dataset.nume || '');
                const pDescEl = prod.querySelector('.descriere-produs');
                const pDescText = pDescEl ? eliminaDiacritice(pDescEl.innerText) : '';
                const pPret = parseFloat(prod.dataset.pret || 0);
                const pLivrareEl = prod.querySelector('.val-livrare');
                const pLivrare = pLivrareEl ? pLivrareEl.innerText.trim().toLowerCase() : '';
                const pCateg = prod.dataset.categorie || '';
                const pCuloareEl = prod.querySelector('.val-culoare');
                const pCuloare = pCuloareEl ? pCuloareEl.innerText.trim() : '';
                const pMaterialeEl = prod.querySelector('.val-materiale');
                const pMateriale = pMaterialeEl ? pMaterialeEl.innerText.trim() : '';
                const pCompEl = prod.querySelector('.val-competitie');
                const pComp = pCompEl ? pCompEl.innerText.trim().toLowerCase() : '';
                const isNou = prod.querySelector('.badge-nou') !== null;

                if (vNume && !pNume.startsWith(vNume)) show = false;
                if (vDesc && !pDescText.includes(vDesc)) show = false;
                if (pPret > vPretMax) show = false;
                if (vLivrare && !pLivrare.includes(vLivrare)) show = false;
                if (vCateg !== "oricare" && pCateg.trim().toLowerCase() !== vCateg.trim().toLowerCase()) show = false;
                if (optsCuloare.length > 0 && !optsCuloare.includes(pCuloare)) show = false;
                if (vComp !== "oricare") {
                    if (vComp === "da" && pComp !== "da") show = false;
                    if (vComp === "nu" && pComp !== "nu") show = false;
                }
                if (bNoutati && !isNou) show = false;

                if (chkMateriale.length > 0) {
                    let hasMat = chkMateriale.some(m => pMateriale.includes(m));
                    if (!hasMat) show = false;
                }

                // Salvam daca produsul a potrivit criteriile de filtrare
                prod.dataset.potrivesteFiltru = show ? "true" : "false";

                // Daca e pastrat permanent il aratam indiferent de filtre (suprascrie)
                if (prod.classList.contains("pastrat-permanent")) {
                    show = true;
                }

                if (show) {
                    produseFiltrate.push(prod);
                }
            } catch (err) {
                console.error("Eroare la filtrarea produsului:", prod, err);
            }
        });

        // Aplicare in UI
        currentPage = 1;
        actualizeazaAfisare();
    }

    /**
     * Evidentierea celui mai ieftin produs.
     * Gaseste produsul cu pretul cel mai mic si ii adauga un chenar verde.
     */
    function marcheazaCelMaiIeftin(produse) {
        try {
            // Stergem marcajele vechi
            document.querySelectorAll('.ieftin-badge').forEach(b => b.remove());
            document.querySelectorAll('.card-img-top-container').forEach(c => {
                if (c) c.style.border = 'none';
            });

            // Consideram doar produsele care se potrivesc cu filtrele curente (nu cele fortate doar prin 'pin')
            const produseValide = produse.filter(p => p && (p.dataset.potrivesteFiltru === undefined || p.dataset.potrivesteFiltru === "true"));

            if (produseValide.length === 0) return;

            // Sortam toate produsele valide crescator dupa pret
            produseValide.sort((a, b) => parseFloat(a.dataset.pret) - parseFloat(b.dataset.pret));
            const celMaiIeftin = produseValide[0];

            if (celMaiIeftin) {
                const imgContainer = celMaiIeftin.querySelector('.card-img-top-container');
                if (imgContainer) {
                    imgContainer.style.border = '3px solid #198754';
                    imgContainer.classList.add('position-relative');
                    imgContainer.insertAdjacentHTML('beforeend', '<span class="ieftin-badge badge bg-success position-absolute m-2 top-0 end-0 z-index-2">CEL MAI IEFTIN</span>');
                }
            }
        } catch (e) {
            console.error("Eroare in marcheazaCelMaiIeftin:", e);
        }
    }

    /**
     * Paginarea si afisarea finala (Bonus 5, Bonus 15, Bonus 3).
     */
    function actualizeazaAfisare() {
        produseInitiale.forEach(p => p.classList.add("d-none"));

        if (produseFiltrate.length === 0) {
            mesajLipsa.classList.remove("d-none");
            numarProduseContainer.innerText = 0;
            document.getElementById("paginare-container").innerHTML = "";
            return;
        } else {
            mesajLipsa.classList.add("d-none");
            numarProduseContainer.innerText = produseFiltrate.length;
            marcheazaCelMaiIeftin(produseFiltrate);
        }

        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const afisatePage = produseFiltrate.slice(startIdx, endIdx);

        afisatePage.forEach(p => p.classList.remove("d-none"));

        genereazaPaginare();
    }

    function genereazaPaginare() {
        const paginareContainer = document.getElementById("paginare-container");
        paginareContainer.innerHTML = "";

        const nPagini = Math.ceil(produseFiltrate.length / ITEMS_PER_PAGE);
        if (nPagini <= 1) return;

        for (let i = 1; i <= nPagini; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const a = document.createElement("a");
            a.className = "page-link";
            a.href = "#";
            a.innerText = i;
            a.onclick = (e) => {
                e.preventDefault();
                currentPage = i;
                actualizeazaAfisare();
            };
            li.appendChild(a);
            paginareContainer.appendChild(li);
        }
    }

    // Evenimente (Bonus 4 onchange)
    // Preluezz toate inputurile de filtrare
    const allInputs = [inputNume, inputDescriere, inputPret, inputLivrare, inputCategorie, inputCuloare, inputNoutati, ...document.querySelectorAll('.chk-material'), ...document.querySelectorAll('input[name="rad-competitii"]')];

    // Filtrare instanta (Bonus 4 onchange)
    allInputs.forEach(inp => {
        inp.addEventListener("change", filtreaza);
        if (inp.type === "text" || inp.tagName === "TEXTAREA") {
            inp.addEventListener("keyup", filtreaza);
        }
    });

    btnFiltrare.addEventListener("click", filtreaza);

    if (btnFiltrareServer) {
        btnFiltrareServer.addEventListener("click", async () => {
            if (!suntInputuriValide()) return;

            // 1. Colectare materiale bifate
            const materialeSelectate = Array.from(document.querySelectorAll('.chk-material:checked')).map(c => c.value);

            // 2. Colectare radio (pentru competitii)
            const radChecked = document.querySelector('input[name="rad-competitii"]:checked');
            const competitiiVal = radChecked ? radChecked.value : 'oricare';

            // 3. Colectare select culoare
            const culoriSelectate = Array.from(inputCuloare.selectedOptions).map(o => o.value);

            // 4. Construire Query String
            const params = new URLSearchParams({
                nume: inputNume.value,
                descriere: inputDescriere.value,
                pret: inputPret.value,
                categorie: inputCategorie.value,
                livrare: inputLivrare.value,
                competitii: competitiiVal
            });

            if (materialeSelectate.length > 0) {
                params.append('materiale', materialeSelectate.join(','));
            }

            culoriSelectate.forEach(c => {
                params.append('culoare', c);
            });

            try {
                // 5. Apel fetch (Bonus 10b)
                const response = await fetch(`/api/filtrare-server?${params.toString()}`);
                if (!response.ok) throw new Error("Filtrarea pe server a esuat.");
                const data = await response.json();

                // 6. Actualizare UI
                // Filtram elementele produseInitiale care corespund cu cele returnate de server
                const serverIds = new Set(data.map(p => `artc-${p.id}`));

                produseInitiale.forEach(pDOM => {
                    const matchesServer = serverIds.has(pDOM.id);
                    pDOM.dataset.potrivesteFiltru = matchesServer ? "true" : "false";
                });

                produseFiltrate = produseInitiale.filter(pDOM => {
                    // Daca e pastrat permanent il aratam indiferent de filtre (suprascrie)
                    if (pDOM.classList.contains("pastrat-permanent")) {
                        return true;
                    }
                    if (pDOM.classList.contains("ascuns-sesiune")) return false;
                    if (pDOM.classList.contains("ascuns-temporar")) return false;

                    return serverIds.has(pDOM.id);
                });
                currentPage = 1;
                actualizeazaAfisare();

            } catch (err) {
                console.error("Eroare la filtrare server:", err);
                alert("A aparut o eroare la filtrarea pe server: " + err.message);
            }
        });
    }

    function suntInputuriValide() {
        if (inputNume.value.match(/^[0-9]+$/)) {
            inputNume.classList.add("is-invalid");
            alert("Nume invalid: nu poate contine doar cifre!");
            return false;
        }
        inputNume.classList.remove("is-invalid");
        return true;
    }

    /**
     * Sortarea produselor (Bonus 8 - 2 criterii).
     * Rearanjeaza produsele in pagina in functie de cele doua filtre de sortare selectate (ex: pret si apoi nume).
     */
    function sorteaza(semn) {
        if (!suntInputuriValide()) return;

        const c1 = document.getElementById("sort-cheia1").value;
        const c2 = document.getElementById("sort-cheia2").value;

        function extrageValoare(prod, cheie) {
            if (cheie === "pret") return parseFloat(prod.dataset.pret);
            if (cheie === "greutate") return parseFloat(prod.dataset.greutate);
            if (cheie === "data") return new Date(prod.dataset.data).getTime();
            if (cheie === "nume") return eliminaDiacritice(prod.dataset.nume);
            if (cheie === "categorie") return prod.dataset.categorie;
            if (cheie === "raport") {
                const gr = parseFloat(prod.dataset.greutate);
                const pr = parseFloat(prod.dataset.pret);
                return gr / pr;
            }
            return prod.dataset[cheie];
        }

        produseFiltrate.sort((a, b) => {
            const val1a = extrageValoare(a, c1);
            const val1b = extrageValoare(b, c1);

            //in caz de produsele sunt identice se trece la sortarea secundara
            if (val1a === val1b) {
                const val2a = extrageValoare(a, c2);
                const val2b = extrageValoare(b, c2);
                if (val2a === val2b) return 0;
                return (val2a > val2b ? 1 : -1) * semn;
            }
            return (val1a > val1b ? 1 : -1) * semn;
        });

        // Rearanjare in pagina
        produseFiltrate.forEach(p => produseGrid.appendChild(p));
        actualizeazaAfisare();
    }

    btnSortAsc.addEventListener("click", () => sorteaza(1));
    btnSortDesc.addEventListener("click", () => sorteaza(-1));

    /**
     * Calcularea sumei (Div plutitor creat dinamic).
     */
    btnCalcul.addEventListener("click", () => {
        if (!suntInputuriValide()) return;

        let suma = 0;
        produseFiltrate.forEach(p => {
            suma += parseFloat(p.dataset.pret);
        });

        // Cerinta: Creare dinamica cu document.createElement
        const divCalcul = document.createElement("div");
        divCalcul.className = "alert alert-success fw-bold text-center position-fixed shadow-lg";
        divCalcul.style.bottom = "20px";
        divCalcul.style.left = "50%";
        divCalcul.style.transform = "translateX(-50%)";
        divCalcul.style.zIndex = "9999";
        divCalcul.style.minWidth = "300px";
        divCalcul.innerText = `Suma produselor afisate: ${suma.toFixed(2)} RON`;

        document.body.appendChild(divCalcul);

        setTimeout(() => {
            divCalcul.remove();
        }, 2000);
    });

    /**
     * Resetarea tuturor filtrelor.
     * Goleste casutele text, debifeaza optiunile si readuce toate produsele in starea si ordinea initiala.
     */
    btnReset.addEventListener("click", () => {
        if (confirm("Sunteți sigur că doriți resetarea filtrelor?")) {
            inputNume.value = "";
            inputDescriere.value = "";
            inputPret.value = inputPret.max;
            valPret.innerText = inputPret.max;
            inputLivrare.value = "";
            inputCategorie.value = "oricare";
            inputNoutati.checked = false;
            document.getElementById("rad-toate").checked = true;
            document.querySelectorAll(".chk-material").forEach(c => c.checked = false);
            Array.from(inputCuloare.options).forEach(o => o.selected = false);

            // Re-afisam si curatam perm/temp
            produseInitiale.forEach(p => {
                p.classList.remove("pastrat-permanent", "ascuns-temporar");
                delete p.dataset.potrivesteFiltru; // stergem starea de potrivire la reset
                const btnP = p.querySelector('.btn-pastreaza');
                if (btnP) {
                    btnP.classList.remove("btn-success");
                    btnP.classList.add("btn-light");
                }
            });

            // Reordonare originala DOM (sortam dupa id - indexare)
            produseInitiale.sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
            produseInitiale.forEach(p => produseGrid.appendChild(p));

            produseFiltrate = [...produseInitiale];
            currentPage = 1;
            actualizeazaAfisare();
        }
    });

    /**
     * Fereastra Modal la click (Bonus 11).
     */
    produseInitiale.forEach(prod => {
        prod.addEventListener('click', (e) => {
            // Nu declansam modalul daca click-ul s-a facut pe butoanele de actiuni
            if (e.target.closest('button') || e.target.closest('a')) return;

            const modal = new bootstrap.Modal(document.getElementById('produsModal'));

            document.getElementById('modalNumeProdus').innerText = prod.dataset.nume;
            document.getElementById('modalImagine').src = prod.querySelector('img.img-fluid').src;
            document.getElementById('modalPret').innerText = prod.dataset.pret;
            document.getElementById('modalDescriere').innerText = prod.querySelector('.descriere-produs').innerText;
            document.getElementById('modalCategorie').innerText = prod.dataset.categorie;
            document.getElementById('modalGreutate').innerText = prod.dataset.greutate;
            document.getElementById('modalCuloare').innerText = prod.querySelector('.val-culoare').innerText.trim();
            document.getElementById('modalMateriale').innerText = prod.querySelector('.val-materiale').innerText.trim();
            document.getElementById('modalLink').href = `/produs/${prod.id.split('-')[1]}`;

            modal.show();
        });
    });

    // Initializare
    initButoaneVizibilitate();
    actualizeazaAfisare();

});
