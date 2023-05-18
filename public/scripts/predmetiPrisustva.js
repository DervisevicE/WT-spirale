window.onload = function () {
    PoziviAjax.getPredmeti(ispisiPredmete);
}

function ispisiPredmete(predmeti) {
    let listaPredmeta = document.getElementById("predmeti");

    for (let i = 0; i < predmeti.predmeti.length; i++) {
        /**let button = `<button class=\"predmeti\">${predmeti.predmeti[i]}</button><br>`;
        listaPredmeta.innerHTML += button; */
        let button = document.createElement("button");
        button.className = "predmeti";
        button.innerHTML = predmeti.predmeti[i];
        button.addEventListener("click", tabelaZaPredmet);
        listaPredmeta.appendChild(button);
    }
}

function tabelaZaPredmet() {
    var nazivPredmeta = this.innerHTML;
    PoziviAjax.getPredmet(nazivPredmeta, TabelaPrisustvo);
}

function promijeniPrisustvo(nazivPredmeta, indexStudenta, sedmica, predavanja, vjezbe) {
    console.log(nazivPredmeta, indexStudenta, sedmica, predavanja, vjezbe);
    //PoziviAjax.postPrisustvo(nazivPredmeta, indexStudenta, { sedmica, predavanja, vjezbe }, () => { });
    PoziviAjax.postPrisustvo(nazivPredmeta, indexStudenta, { sedmica, predavanja, vjezbe }, TabelaPrisustvo);
}