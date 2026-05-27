// js/tema.js
document.addEventListener("DOMContentLoaded", function() {
    const selTema = document.getElementById("select-tema");
    if(!selTema) return;

    let temaCurenta = localStorage.getItem("tema_site");
    if(!temaCurenta) temaCurenta = "light";

    aplicaTema(temaCurenta);
    selTema.value = temaCurenta;

    selTema.addEventListener("change", function() {
        const temaNoua = this.value;
        localStorage.setItem("tema_site", temaNoua);
        aplicaTema(temaNoua);
    });

    function aplicaTema(tema) {
        document.body.classList.remove("theme-light", "theme-dark", "theme-crossfit");
        document.body.classList.add("theme-" + tema);
    }
});
