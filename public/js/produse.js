// js/produse.js

document.addEventListener("DOMContentLoaded", function() {

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
    inputPret.addEventListener("input", function() {
        valPret.innerText = this.value;
    });

    // ----------------------------------------------------
    // Bonus 6: Butoane vizibilitate
    // ----------------------------------------------------
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

            btnPastreaza.addEventListener('click', (e) => {
                e.stopPropagation();
                prod.classList.toggle("pastrat-permanent");
                btnPastreaza.classList.toggle("btn-success");
                btnPastreaza.classList.toggle("btn-light");
            });

            btnAscundeTemp.addEventListener('click', (e) => {
                e.stopPropagation();
                prod.classList.add("d-none", "ascuns-temporar");
                actualizeazaAfisare();
            });

            btnAscundeSesiune.addEventListener('click', (e) => {
                e.stopPropagation();
                prod.classList.add("d-none", "ascuns-sesiune");
                ascunseSesiune.push(id);
                sessionStorage.setItem('produseAscunse', JSON.stringify(ascunseSesiune));
                actualizeazaAfisare();
            });
        });
    }

    // ----------------------------------------------------
    // FUNCTIA DE FILTRARE
    // ----------------------------------------------------
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
            // Daca produsul e ascuns temporar sau pe sesiune, ignoram (cu exceptia pastrat-permanent care suprascrie temporar)
            if (prod.classList.contains("ascuns-sesiune")) return;
            if (prod.classList.contains("ascuns-temporar") && !prod.classList.contains("pastrat-permanent")) return;

            let show = true;

            const pNume = eliminaDiacritice(prod.dataset.nume);
            const pDescText = eliminaDiacritice(prod.querySelector('.descriere-produs').innerText);
            const pPret = parseFloat(prod.dataset.pret);
            const pLivrare = prod.querySelector('.val-livrare').innerText.toLowerCase();
            const pCateg = prod.dataset.categorie;
            const pCuloare = prod.querySelector('.list-group-item:nth-child(3)').innerText.split(':')[1].trim();
            const pMateriale = prod.querySelector('.list-group-item:nth-child(4)').innerText.split(':')[1].trim();
            const pComp = prod.querySelector('.val-competitie').innerText.toLowerCase();
            const isNou = prod.querySelector('.badge') !== null;

            if (vNume && !pNume.startsWith(vNume)) show = false;
            if (vDesc && !pDescText.includes(vDesc)) show = false;
            if (pPret > vPretMax) show = false;
            if (vLivrare && !pLivrare.includes(vLivrare)) show = false;
            if (vCateg !== "oricare" && pCateg !== vCateg) show = false;
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

            // Daca e pastrat permanent il aratam indiferent de filtre (suprascrie)
            if (prod.classList.contains("pastrat-permanent")) {
                show = true;
            }

            if (show) {
                produseFiltrate.push(prod);
            }
        });

        // Aplicare in UI
        currentPage = 1;
        actualizeazaAfisare();
    }

    // ----------------------------------------------------
    // Bonus 14: Cel mai ieftin
    // ----------------------------------------------------
    function marcheazaCelMaiIeftin(produse) {
        // Stergem marcajele vechi
        document.querySelectorAll('.ieftin-badge').forEach(b => b.remove());
        document.querySelectorAll('.card-img-top-container').forEach(c => c.style.border = 'none');

        const categoriiProduse = {};
        produse.forEach(p => {
            const c = p.dataset.categorie;
            if (!categoriiProduse[c]) categoriiProduse[c] = [];
            categoriiProduse[c].push(p);
        });

        for (let c in categoriiProduse) {
            let prds = categoriiProduse[c];
            prds.sort((a,b) => parseFloat(a.dataset.pret) - parseFloat(b.dataset.pret));
            const celMaiIeftin = prds[0];
            
            const imgContainer = celMaiIeftin.querySelector('.card-img-top-container');
            imgContainer.style.border = '3px solid #198754';
            imgContainer.innerHTML += '<span class="ieftin-badge badge bg-success position-absolute m-2 top-0 start-50 translate-middle-x z-index-2">CEL MAI IEFTIN</span>';
        }
    }

    // ----------------------------------------------------
    // Paginare si Afisare (Bonus 5, Bonus 15, Bonus 3)
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // Evenimente (Bonus 4 onchange)
    // ----------------------------------------------------
    const allInputs = [inputNume, inputDescriere, inputPret, inputLivrare, inputCategorie, inputCuloare, inputNoutati];
    document.querySelectorAll('.chk-material, input[name="rad-competitii"]').forEach(i => allInputs.push(i));

    allInputs.forEach(inp => {
        inp.addEventListener("change", filtreaza);
        if (inp.type === "text" || inp.tagName === "TEXTAREA") {
            inp.addEventListener("keyup", filtreaza);
        }
    });

    btnFiltrare.addEventListener("click", filtreaza);

    function suntInputuriValide() {
        if (inputNume.value.match(/^[0-9]+$/)) {
            inputNume.classList.add("is-invalid");
            alert("Nume invalid: nu poate contine doar cifre!");
            return false;
        }
        inputNume.classList.remove("is-invalid");
        return true;
    }

    // ----------------------------------------------------
    // SORTARE (Bonus 8 - 2 chei)
    // ----------------------------------------------------
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

            if (val1a === val1b) {
                const val2a = extrageValoare(a, c2);
                const val2b = extrageValoare(b, c2);
                if (val2a === val2b) return 0;
                return (val2a > val2b ? 1 : -1) * semn;
            }
            return (val1a > val1b ? 1 : -1) * semn;
        });

        // Reordonare DOM in grid
        produseFiltrate.forEach(p => produseGrid.appendChild(p));
        actualizeazaAfisare();
    }

    btnSortAsc.addEventListener("click", () => sorteaza(1));
    btnSortDesc.addEventListener("click", () => sorteaza(-1));

    // ----------------------------------------------------
    // CALCUL (Div plutitor creat dinamic)
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // RESETARE
    // ----------------------------------------------------
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
                const btnP = p.querySelector('.btn-pastreaza');
                if(btnP) {
                    btnP.classList.remove("btn-success");
                    btnP.classList.add("btn-light");
                }
            });

            // Reordonare originala DOM (sortam dupa id - indexare)
            produseInitiale.sort((a,b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
            produseInitiale.forEach(p => produseGrid.appendChild(p));

            produseFiltrate = [...produseInitiale];
            currentPage = 1;
            actualizeazaAfisare();
        }
    });

    // ----------------------------------------------------
    // BONUS 11: Modal la click pe container
    // ----------------------------------------------------
    produseInitiale.forEach(prod => {
        prod.addEventListener('click', (e) => {
            // Nu declansam modalul daca click-ul s-a facut pe butoanele de actiuni
            if(e.target.closest('button') || e.target.closest('a')) return;

            const modal = new bootstrap.Modal(document.getElementById('produsModal'));
            
            document.getElementById('modalNumeProdus').innerText = prod.dataset.nume;
            document.getElementById('modalImagine').src = prod.querySelector('.card-img-top').src;
            document.getElementById('modalPret').innerText = prod.dataset.pret;
            document.getElementById('modalDescriere').innerText = prod.querySelector('.descriere-produs').innerText;
            document.getElementById('modalCategorie').innerText = prod.dataset.categorie;
            document.getElementById('modalGreutate').innerText = prod.dataset.greutate;
            document.getElementById('modalCuloare').innerText = prod.querySelector('.list-group-item:nth-child(3)').innerText.split(':')[1].trim();
            document.getElementById('modalMateriale').innerText = prod.querySelector('.list-group-item:nth-child(4)').innerText.split(':')[1].trim();
            document.getElementById('modalLink').href = `/produs/${prod.id.split('-')[1]}`;

            modal.show();
        });
    });

    // Initializare
    initButoaneVizibilitate();
    actualizeazaAfisare();

});
