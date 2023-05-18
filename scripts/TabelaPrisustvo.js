let TabelaPrisustvo = function (divRef, podaci) {
    //privatni atributi modula
    //

    divRef.innerHTML = "";



    let dajPostotakPrisustvaStudenta = function (prisustva, brPredavanja, brVjezbi) {
        let zaPredmet = brPredavanja + brVjezbi;
        let zaStudenta = prisustva.predavanja + prisustva.vjezbe;
        return zaStudenta / zaPredmet * 100;
    }

    let dajPosljednjuUnesenuSedmicu = function (svaPrisustva) {
        let sedmica = 0;

        for (let i = 0; i < svaPrisustva.length; i++) {
            if (svaPrisustva[i].sedmica >= sedmica) {
                sedmica = svaPrisustva[i].sedmica;
            }
        }
        return sedmica;
    }

    let prebaciURimskiBroj = function (num) {
        var lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }, roman = '', i;
        for (i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    }



    var trenutnaSedmica = dajPosljednjuUnesenuSedmicu(podaci.prisustva);
    let crtajTabelu = function () {
        divRef.innerHTML = "";
        divRef.innerHTML += "<p> Naziv predmeta: " + podaci.predmet + "</p>";
        var tabela = "<table>";
        tabela += "<tr>" +
            "<th> Ime i prezime </th>" +
            "<th> Index </th>";

        for (let s = 1; s < 9; s++) {
            tabela += "<th>" + prebaciURimskiBroj(s) + "</th>";
        }
        tabela += "<th>" + prebaciURimskiBroj(trenutnaSedmica) + "</th>";
        tabela += "</tr>";

        for (let i = 0; i < podaci.studenti.length; i++) {
            tabela += "<tr>";
            tabela += "<td>" + podaci.studenti[i].ime + "</td>";
            tabela += "<td>" + podaci.studenti[i].index + "</td>";

            for (let j = 0; j < podaci.prisustva.length; j++) {
                if (podaci.prisustva[j].index == podaci.studenti[i].index) {
                    if (podaci.prisustva[j].sedmica == trenutnaSedmica) {
                        tabela += "<td class=\"prisustvo\">" +
                            "<table class=\"nesto\">" +
                            "<tr>";
                        let prisustvovaoP = podaci.prisustva[j].predavanja;
                        let prisustvovaoV = podaci.prisustva[j].vjezbe;

                        for (let brPredavanja = 1; brPredavanja <= podaci.brojPredavanjaSedmicno; brPredavanja++) {
                            tabela += "<td> P <br> " + brPredavanja + "</td>";
                        }
                        for (let brVjezbi = 1; brVjezbi <= podaci.brojVjezbiSedmicno; brVjezbi++) {
                            tabela += "<td> V <br> " + brVjezbi + "</td>";
                        }
                        tabela += "</tr>";
                        tabela += "<tr>";

                        for (let brPredavanja = 1; brPredavanja <= podaci.brojPredavanjaSedmicno; brPredavanja++) {
                            if (brPredavanja <= prisustvovaoP) {
                                tabela += "<td class=\"prisutan\"></td>";
                            } else {
                                tabela += "<td class=\"odsutan\"></td>";
                            }
                        }
                        for (let brVjezbi = 1; brVjezbi <= podaci.brojVjezbiSedmicno; brVjezbi++) {
                            if (brVjezbi <= prisustvovaoV) {
                                tabela += "<td class=\"prisutan\"></td>";
                            } else {
                                tabela += "<td class=\"odsutan\"></td>";
                            }
                        }
                        tabela += "</table>";
                        tabela += "</tr>";
                    } if (podaci.prisustva[j].sedmica < trenutnaSedmica) {
                        tabela += "<td>" + dajPostotakPrisustvaStudenta(podaci.prisustva[j], podaci.brojPredavanjaSedmicno, podaci.brojVjezbiSedmicno) + "%" + "</td>";

                    }
                }
            }



            tabela += "</tr>";
        }
        tabela += "</table>";

        divRef.innerHTML += tabela;


    }

    let validirajPodatke = function () {
        //Broj prisustva na predavanju/vježbi je veći od broja predavanja/vježbi sedmično
        //Broj prisustva je manji od nule

        var ok = true;

        for (let i = 0; i < podaci.prisustva.length; i++) {
            if (podaci.prisustva[i].predavanja > podaci.brojPredavanjaSedmicno ||
                podaci.prisustva[i].vjezbe > podaci.brojVjezbiSedmicno ||
                podaci.prisustva[i].predavanja < 0 || podaci.prisustva[i].vjezbe < 0)
                ok = false;
        }


        //Isti student ima dva ili više unosa prisustva za istu sedmicu
        for (let i = 0; i < podaci.prisustva.length; i++) {
            for (let j = i + 1; j < podaci.prisustva.length; j++) {
                if (podaci.prisustva[i].index == podaci.prisustva[j].index && podaci.prisustva[i].sedmica == podaci.prisustva[j].sedmica)
                    ok = false;
            }
        }


        //Postoje dva ili više studenata sa istim indeksom u listi studenata
        for (let i = 0; i < podaci.studenti.length; i++) {
            for (let j = i + 1; j < podaci.studenti.length; j++) {
                if (podaci.studenti[i].index == podaci.studenti[j].index)
                    ok = false;
            }
        }


        //Postoji prisustvo za studenta koji nije u listi studenata
        let indeksiStudenata = podaci.studenti.map(function (student) { return student.index });
        let indeksiUPrisustvima = podaci.prisustva.map(function (prisustvo) { return prisustvo.index });
        indeksiUPrisustvima = indeksiUPrisustvima.filter(function (i, index) { return indeksiUPrisustvima.indexOf(i) == index });
        if (indeksiStudenata.length != indeksiUPrisustvima.length)
            return falseok = false;

        /*Postoji sedmica, između dvije sedmice za koje je uneseno prisustvo bar jednom
        studentu, u kojoj nema unesenog prisustva. Npr. uneseno je prisustvo za sedmice 1 i 3
        ali nijedan student nema prisustvo za sedmicu 2*/

        let sedmicePrisustva = podaci.prisustva.map(function (prisustvo) { return prisustvo.sedmica });
        sedmicePrisustva = sedmicePrisustva.filter(function (i, sedmica) { return sedmicePrisustva.indexOf(i) == sedmica });


        for (let i = 0; i < sedmicePrisustva.length; i++) {
            for (let j = i + 1; j < sedmicePrisustva.length; j++) {
                if (sedmicePrisustva[i] > sedmicePrisustva[j]) {
                    let pom = sedmicePrisustva[i];
                    sedmicePrisustva[i] = sedmicePrisustva[j];
                    sedmicePrisustva[j] = pom;
                }
            }
        }

        for (let i = 0; i < sedmicePrisustva.length - 1; i++) {
            if (sedmicePrisustva[i + 1] - sedmicePrisustva[i] != 1) {
                ok = false;
                break;
            }
        }


        return ok;
    }






    var skripta = document.createElement('script');
    skripta.type = 'text/javascript';
    skripta.src = 'https://kit.fontawesome.com/b43fea0bec.js';
    document.body.appendChild(skripta);


    //implementacija metoda
    let sljedecaSedmica = function () {
        if (trenutnaSedmica < dajPosljednjuUnesenuSedmicu(podaci.prisustva)) {
            trenutnaSedmica++;
            crtajTabelu();
        }
    }

    let prethodnaSedmica = function () {
        trenutnaSedmica--;
        if (trenutnaSedmica < 1) trenutnaSedmica = 1;
        if (trenutnaSedmica > 0)
            crtajTabelu();
    }


    var dugmeLijevo = document.createElement("button");
    dugmeLijevo.onclick = prethodnaSedmica;
    dugmeLijevo.innerHTML = "<i class=\"fa-solid fa-arrow-left\"></i>";



    var dugmeDesno = document.createElement("button");
    dugmeDesno.onclick = sljedecaSedmica;
    dugmeDesno.innerHTML = "<i class=\"fa-solid fa-arrow-right\"></i>";


    let okValidacija = validirajPodatke();

    if (okValidacija) {
        document.body.appendChild(dugmeLijevo);
        document.body.appendChild(dugmeDesno);
        crtajTabelu();
    } else {
        divRef.innerHTML = "";
        divRef.innerHTML = "<p> Podaci o prisustvu nisu validni!</p>";
    }


    return {
        sljedecaSedmica: sljedecaSedmica,
        prethodnaSedmica: prethodnaSedmica
    }
};
