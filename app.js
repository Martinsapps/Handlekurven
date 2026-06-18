// ============================================================
// Handlekurven – appens hovedlogikk
// Splittet ut fra index.html for å gjøre filen lettere å vedlikeholde
// ============================================================


  // ==============================
  // SIDEBAR FANER
  // ==============================
  function byttFane(fane) {
    ['basis','kategorier','skriv'].forEach(function(f) {
      document.getElementById('fane-' + f).classList.toggle('aktiv', f === fane);
      document.getElementById('fane-' + f + '-knapp').classList.toggle('aktiv', f === fane);
    });
    if (fane === 'basis') { tegnBasisListe(); tegnForslagListe(); }
    if (fane === 'kategorier') tegnEgneKategorierSidebar();
  }

  // ==============================
  // AUTO-KATEGORI FOR BASISLISTE
  // ==============================
  function foreslåBasisKategori(navn) {
    if (navn.trim().length < 2) return;
    var forslag = foreslåKategoriForNavn(navn);
    if (forslag) document.getElementById('basis-kat-velg').value = forslag;
  }



  // ==============================
  // LISTEKATEGORIER
  // ==============================
  var listeTyper = {
    mat:         { ikon: '🛒', navn: 'Mathandling',  bg: '#eef9f3', historikkGruppe: 'mat'        },
    arrangement: { ikon: '🎉', navn: 'Arrangement',  bg: '#fef0f8', historikkGruppe: 'arrangement' },
    hus:         { ikon: '🏠', navn: 'Hus og hjem',  bg: '#eef3ff', historikkGruppe: 'hus'         },
    bygg:        { ikon: '🔧', navn: 'Bygg/verktøy', bg: '#fff3e8', historikkGruppe: 'bygg'        },
    diverse:     { ikon: '📦', navn: 'Diverse',      bg: '#f5f5f5', historikkGruppe: 'diverse'     }
  };

  function listeTypeInfo(type) {
    return listeTyper[type] || listeTyper['mat'];
  }

  function velgListetype(el) {
    document.querySelectorAll('.listetype-boks').forEach(function(b) { b.classList.remove('valgt'); });
    el.classList.add('valgt');
  }

  function historikkNøkkel() {
    if (!aktivListeId) return 'mat';
    var liste = alleLister.find(function(l) { return l.id === aktivListeId; });
    return liste ? listeTypeInfo(liste.type || 'mat').historikkGruppe : 'mat';
  }

  // ==============================
  // STANDARDKATEGORIER PER LISTETYPE
  // ==============================
  // Hver listetype har sitt eget sett standardkategorier, slik at en
  // verktøyliste ikke viser Kjøtt og Meieri. 'diverse' finnes i alle typer
  // som sikkerhetsnett. Egne kategorier legges alltid til i tillegg.
  // Id-ene brukes som DOM-id og som nøkler i lagret data - kun ASCII.
  var standardKategorierPerType = {
    mat: [
      { id:'kjott',       navn:'🥩 Kjøtt' },
      { id:'fisk',        navn:'🐟 Fisk og skalldyr' },
      { id:'meieri',      navn:'🥛 Meieriprodukter' },
      { id:'frukt',       navn:'🥦 Frukt og grønt' },
      { id:'brod',        navn:'🍞 Brød og bakevarer' },
      { id:'basis',       navn:'🥫 Basisvarer' },
      { id:'husholdning', navn:'🧹 Husholdning' },
      { id:'diverse',     navn:'🛍️ Diverse' }
    ],
    arrangement: [
      { id:'drikke',      navn:'🥤 Drikke' },
      { id:'festmat',     navn:'🍽️ Mat' },
      { id:'snacks',      navn:'🍿 Snacks og godteri' },
      { id:'pynt',        navn:'🎈 Pynt og utstyr' },
      { id:'diverse',     navn:'🛍️ Diverse' }
    ],
    hus: [
      { id:'rengjoring',  navn:'🧹 Rengjøring' },
      { id:'interior',    navn:'🛋️ Interiør' },
      { id:'hage',        navn:'🪴 Hage og planter' },
      { id:'diverse',     navn:'🛍️ Diverse' }
    ],
    bygg: [
      { id:'verktoy',     navn:'🔨 Verktøy' },
      { id:'materialer',  navn:'🪵 Materialer' },
      { id:'festemidler', navn:'🔩 Skruer og festemidler' },
      { id:'maling',      navn:'🎨 Maling og overflate' },
      { id:'diverse',     navn:'🛍️ Diverse' }
    ],
    diverse: [
      { id:'diverse',     navn:'🛍️ Diverse' }
    ]
  };

  // Typen til listen som er åpen nå. Styrer hvilke kategorier som bygges,
  // hvilke ordlister auto-gjenkjenning bruker, og innholdet i nedtrekksmenyene.
  var aktivListeType = 'mat';
  var aktivStandardKategorier = standardKategorierPerType.mat;

  // Settes når listen åpnes med en annen type enn den dataen sist ble lagret
  // under (typebytte). Da prøver byggListeFraData å løfte varer ut av Diverse
  // til riktig kategori i den nye typen. Nullstilles ved lagring.
  var reKategoriserDiverse = false;

  function standardKategorierFor(type) {
    return standardKategorierPerType[type] || standardKategorierPerType.mat;
  }

  function aktiveStandardIder() {
    return aktivStandardKategorier.map(function(k) { return k.id; });
  }

  // Standard + egne kategorier - settet hentData/byggListeFraData jobber mot.
  function aktiveKategoriIder() {
    return aktiveStandardIder().concat(egneKategorier.map(function(k) { return k.id; }));
  }

  // Bygger kategori-DOM for en listetype. Kalles fra åpneListe FØR egne
  // kategorier og varedata lastes, slik at ul-elementene finnes når
  // byggListeFraData skal fylle dem.
  function byggStandardKategorierDOM(type) {
    aktivListeType = type || 'mat';
    aktivStandardKategorier = standardKategorierFor(aktivListeType);

    var container = document.getElementById('kategorier-container');
    if (!container) return;
    container.innerHTML = '';

    aktivStandardKategorier.forEach(function(kat, i) {
      var div = document.createElement('div');
      div.className = 'kategori';
      div.id = 'kat-' + kat.id;
      // 'basis' har avvikende pil-id pga. kollisjon med basisliste-panelet i
      // sidebar - pilIdMap i toggleKategori kjenner unntaket.
      var pilId = kat.id === 'basis' ? 'basis-kat-pil' : kat.id + '-pil';
      div.innerHTML =
        '<div class="kategori-header" onclick="toggleKategori(\'' + kat.id + '\')">' +
          '<p class="kategori-tittel" id="' + kat.id + '-header">' + kat.navn + '</p>' +
          '<span class="kategori-pil" id="' + pilId + '">▼</span>' +
          '<button class="sorter-knapp" onclick="event.stopPropagation(); sorterKategori(\'' + kat.id + '\')">A–Å</button>' +
        '</div>' +
        '<ul id="' + kat.id + '"></ul>';
      container.appendChild(div);
      // Skillelinje mellom kategoriene, men ikke etter siste (egne kategorier
      // bringer sin egen ledende linje).
      if (i < aktivStandardKategorier.length - 1) {
        var hr = document.createElement('hr');
        hr.className = 'skillelinje';
        hr.id = 'skille-' + kat.id;
        container.appendChild(hr);
      }
    });

    // Nullstill registrene til kun standard - egne kategorier re-registreres
    // av rebuildEgneKategorierFraData (kalles rett etter i åpneListe).
    katIder = aktiveStandardIder();
    alleKategorier = aktivStandardKategorier.slice();
    oppdaterKategoriVelgere();
  }

  // Navn for en kategori-id i gjeldende liste (standard eller egen).
  function katNavn(katId) {
    for (var i = 0; i < alleKategorier.length; i++) {
      if (alleKategorier[i].id === katId) return alleKategorier[i].navn;
    }
    return katId;
  }

  // ==============================
  // FORSIDE – LISTOVERSIKT
  // ==============================
  var alleLister = [];       // [{id, navn, opprettet}, ...]
  var aktivListeId = null;
  // Kontekst for aktiv liste: 'personlig' for personlige lister, eller husstandId
  // for husstand-lister. Brukes av kontekstSti() til å bygge riktig Firebase-path.
  var aktivListeKontekst = null;

  var listeIkoner = {
    standard: '🛒'
  };

  function lastInnLister() {
    var lagret = localStorage.getItem('matplan-lister');
    if (lagret) {
      alleLister = JSON.parse(lagret);
    } else {
      // Første gang: migrer eksisterende liste til ny struktur
      var eksisterendeData = localStorage.getItem('matplan-varer');
      var migrertId = 'liste-' + Date.now();
      alleLister = [{
        id: migrertId,
        navn: 'Min handleliste',
        opprettet: Date.now()
      }];
      if (eksisterendeData) {
        localStorage.setItem('matplan-varer-' + migrertId, eksisterendeData);
      }
      if (localStorage.getItem('matplan-basis')) {
        localStorage.setItem('matplan-basis-' + migrertId, localStorage.getItem('matplan-basis'));
      }
      lagreLister();
    }
  }

  // Hjelpefunksjon: strip kontekst-feltet før vi skriver til Firebase
  // (kontekst er klient-side info, ikke noe Firebase trenger å lagre).
  function utenKontekst(liste) {
    var k = Object.assign({}, liste);
    delete k.kontekst;
    return k;
  }

  function lagreLister() {
    localStorage.setItem('matplan-lister', JSON.stringify(alleLister));
    if (!database || !bruker) return;
    // Splitt alleLister etter kontekst og skriv hver gruppe til riktig path
    var personlig = [];
    var perHusstand = {};
    alleLister.forEach(function(l) {
      var k = l.kontekst || 'personlig';
      if (k === 'personlig') {
        personlig.push(utenKontekst(l));
      } else {
        if (!perHusstand[k]) perHusstand[k] = [];
        perHusstand[k].push(utenKontekst(l));
      }
    });
    database.ref(brukerSti('lister-meta')).set(personlig).catch(function(err) {
      loggFeil('Lagre personlige lister: ' + err.message, 'firebase', '');
    });
    Object.keys(perHusstand).forEach(function(hid) {
      database.ref('husstander/' + hid + '/lister-meta').set(perHusstand[hid]).catch(function(err) {
        loggFeil('Lagre husstand-lister: ' + err.message, 'firebase', '');
      });
    });
  }

  // Bygger ett listekort. Trekker ut den tidligere innebygde card-byggeren
  // som en separat funksjon så vi kan kalle den fra ulike seksjoner.
  function byggListekortDOM(liste) {
    var div = document.createElement('div');
    div.className = 'liste-kort';
    // Foretrukket: les tellinger fra lister-meta (synkronisert via Firebase
    // av lagreAlt → oppdaterListekortTelling). Da ser alle medlemmer samme
    // tall i sanntid uten å måtte åpne listen først.
    var antallVarer = 0;
    var antallGjenstaar = 0;
    if (typeof liste.antallVarer === 'number') {
      antallVarer = liste.antallVarer;
      antallGjenstaar = typeof liste.antallGjenstaar === 'number' ? liste.antallGjenstaar : 0;
    } else {
      // Fallback for gamle lister som ble opprettet før telling lå i meta -
      // disse blir oppdatert ved første lagreAlt og glir over til Firebase-veien.
      var data = localStorage.getItem('matplan-varer-' + liste.id);
      if (data) {
        try {
          var parsed = JSON.parse(data);
          // Teller alle kategorinøkler i dataen uansett listetype - settet
          // varierer per type, så vi kan ikke anta et fast kategorisett her.
          Object.keys(parsed).forEach(function(k) {
            if (Array.isArray(parsed[k])) {
              antallVarer += parsed[k].length;
              antallGjenstaar += parsed[k].filter(function(v) { return !v.huket; }).length;
            }
          });
        } catch(e) {}
      }
    }
    var antallGjenstår = antallGjenstaar; // beholder eksisterende variabelnavn i template under
    var typeInfo = listeTypeInfo(liste.type || 'mat');
    div.innerHTML =
      '<div class="liste-kort-ikon" style="background:' + typeInfo.bg + '">' + typeInfo.ikon + '</div>' +
      '<div class="liste-kort-info">' +
        '<div class="liste-kort-navn">' + liste.navn + '</div>' +
        '<div class="liste-kort-meta">' +
          typeInfo.navn + (antallVarer > 0 ? ' · ' + antallGjenstår + ' gjenstår' : ' · Tom') +
        '</div>' +
      '</div>' +
      '<span class="liste-kort-pil">›</span>';

    div.addEventListener('click', function() { åpneListe(liste.id); });

    // Long press / right-click → rediger
    var pressTimer;
    div.addEventListener('touchstart', function(e) {
      pressTimer = setTimeout(function() {
        åpneRedigerListeModal(liste.id, liste.navn);
      }, 600);
    });
    div.addEventListener('touchend', function() { clearTimeout(pressTimer); });
    div.addEventListener('touchmove', function() { clearTimeout(pressTimer); });
    div.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      åpneRedigerListeModal(liste.id, liste.navn);
    });

    return div;
  }

  // Sjekker om en seksjon er kollapset (lagret i localStorage)
  function erSeksjonKollapset(kontekst) {
    return localStorage.getItem('matplan-seksjon-kollapset-' + kontekst) === '1';
  }
  function settSeksjonKollapset(kontekst, kollapset) {
    if (kollapset) {
      localStorage.setItem('matplan-seksjon-kollapset-' + kontekst, '1');
    } else {
      localStorage.removeItem('matplan-seksjon-kollapset-' + kontekst);
    }
  }

  // Bygger en hel forside-seksjon (tittel + liste-grid + opprett-knapp).
  function byggForsideSeksjon(tittel, ikon, kontekst, lister) {
    var seksjon = document.createElement('div');
    seksjon.className = 'forside-seksjon';
    if (erSeksjonKollapset(kontekst)) seksjon.classList.add('kollapset');

    var tittelEl = document.createElement('div');
    tittelEl.className = 'forside-seksjon-tittel';
    tittelEl.innerHTML =
      '<span class="ikon">' + ikon + '</span>' +
      '<span class="navn">' + tittel + '</span>' +
      '<span class="antall">' + lister.length + '</span>' +
      '<span class="pil">▼</span>';
    tittelEl.addEventListener('click', function() {
      var nyTilstand = !seksjon.classList.contains('kollapset');
      seksjon.classList.toggle('kollapset', nyTilstand);
      settSeksjonKollapset(kontekst, nyTilstand);
    });
    seksjon.appendChild(tittelEl);

    var grid = document.createElement('div');
    grid.className = 'liste-grid';
    if (lister.length === 0) {
      var tom = document.createElement('div');
      tom.className = 'forside-seksjon-tom';
      tom.innerHTML = '<span class="ikon">🗒️</span> Ingen lister her ennå – trykk «+ Ny liste».';
      grid.appendChild(tom);
    } else {
      lister.forEach(function(l) { grid.appendChild(byggListekortDOM(l)); });
    }
    seksjon.appendChild(grid);

    var nyKnapp = document.createElement('button');
    nyKnapp.className = 'ny-liste-knapp';
    nyKnapp.innerHTML = '<span style="font-size:20px;line-height:1">+</span> Ny liste';
    nyKnapp.addEventListener('click', function() { åpneNyListeModal(kontekst); });
    seksjon.appendChild(nyKnapp);
    return seksjon;
  }

  function tegnForside() {
    var container = document.getElementById('forside-seksjoner');
    if (!container) return;
    container.innerHTML = '';

    // Personlig seksjon - alltid synlig
    var personlige = alleLister.filter(function(l) { return (l.kontekst || 'personlig') === 'personlig'; });
    container.appendChild(byggForsideSeksjon('Personlig', '👤', 'personlig', personlige));

    // Én seksjon per husstand brukeren er medlem av
    mineHusstander.forEach(function(h) {
      var husstandsLister = alleLister.filter(function(l) { return l.kontekst === h.id; });
      container.appendChild(byggForsideSeksjon(h.navn, '🏠', h.id, husstandsLister));
    });
  }

  // Kontekst for liste som skal opprettes (settes når brukeren klikker
  // en bestemt seksjons "+ Ny liste"-knapp).
  var nyListeKontekst = 'personlig';

  function åpneNyListeModal(kontekst) {
    nyListeKontekst = kontekst || 'personlig';
    // Vis husstand-navnet i modal-tittelen så brukeren vet hvor listen havner
    var tittelTekst = 'Ny liste';
    if (nyListeKontekst !== 'personlig') {
      var h = mineHusstander.find(function(x) { return x.id === nyListeKontekst; });
      if (h) tittelTekst = 'Ny liste i ' + h.navn;
    } else {
      tittelTekst = 'Ny personlig liste';
    }
    document.getElementById('modal-tittel').textContent = tittelTekst;
    document.getElementById('modal-lagre-knapp').textContent = 'Opprett';
    document.getElementById('ny-liste-navn').value = '';
    document.getElementById('listetype-felt').style.display = 'block';
    // Reset valgt type til mat
    document.querySelectorAll('.listetype-boks').forEach(function(b) { b.classList.remove('valgt'); });
    var matBoks = document.querySelector('.listetype-boks[data-type="mat"]');
    if (matBoks) matBoks.classList.add('valgt');
    redigerListeId = null;
    document.getElementById('modal-slett-knapp').style.display = 'none';
    document.getElementById('ny-liste-modal').classList.add('synlig');
    setTimeout(function() { document.getElementById('ny-liste-navn').focus(); }, 100);
  }

  var redigerListeId = null;

  function åpneRedigerListeModal(id, navn) {
    redigerListeId = id;
    document.getElementById('modal-tittel').textContent = 'Rediger liste';
    document.getElementById('modal-lagre-knapp').textContent = 'Lagre';
    document.getElementById('ny-liste-navn').value = navn;
    // Vis type-velger og pre-velg nåværende type
    document.getElementById('listetype-felt').style.display = 'block';
    var liste = alleLister.find(function(l) { return l.id === id; });
    var navarendeType = (liste && liste.type) ? liste.type : 'mat';
    document.querySelectorAll('.listetype-boks').forEach(function(b) {
      b.classList.toggle('valgt', b.dataset.type === navarendeType);
    });
    document.getElementById('modal-slett-knapp').style.display = 'block';
    document.getElementById('ny-liste-modal').classList.add('synlig');
    setTimeout(function() {
      var input = document.getElementById('ny-liste-navn');
      input.focus(); input.select();
    }, 100);
  }

  function slettListeFraModal() {
    if (!redigerListeId) return;
    var id = redigerListeId;
    lukkNyListeModal();
    slettListe(id);
  }

  function lukkNyListeModal() {
    document.getElementById('ny-liste-modal').classList.remove('synlig');
    document.getElementById('ny-liste-navn').value = '';
    redigerListeId = null;
  }

  function lagreNyListe() {
    var input = document.getElementById('ny-liste-navn');
    var navn  = input.value.trim();
    if (!navn) {
      input.style.borderColor = 'var(--red)';
      input.focus();
      setTimeout(function() { input.style.borderColor = ''; }, 1500);
      return;
    }
    var valgtType = document.querySelector('.listetype-boks.valgt');
    var type = valgtType ? valgtType.dataset.type : 'mat';
    var nyId = 'liste-' + Date.now();
    alleLister.push({
      id: nyId,
      navn: navn,
      type: type,
      opprettet: Date.now(),
      kontekst: nyListeKontekst
    });
    lagreLister();
    lukkNyListeModal();
    tegnForside();
  }

  function lagreRedigertListe() {
    var navn = document.getElementById('ny-liste-navn').value.trim();
    if (!navn || !redigerListeId) return;
    var valgtType = document.querySelector('.listetype-boks.valgt');
    var nyType = valgtType ? valgtType.dataset.type : 'mat';
    alleLister = alleLister.map(function(l) {
      if (l.id === redigerListeId) {
        l.navn = navn;
        l.type = nyType;
      }
      return l;
    });
    lagreLister();
    lukkNyListeModal();
    tegnForside();
    // Oppdater tittel + ikon hvis vi er inne i listen som ble endret
    if (aktivListeId === redigerListeId) {
      var typeInfo = listeTypeInfo(nyType);
      document.getElementById('aktiv-liste-tittel').textContent = typeInfo.ikon + ' ' + navn;
    }
  }

  function slettListe(id) {
    var liste = alleLister.find(function(l) { return l.id === id; });
    if (!liste) return;
    var kontekst = liste.kontekst || 'personlig';
    visBekreft('Slette «' + liste.navn + '»? Alle varer i listen forsvinner.', function() {
      alleLister = alleLister.filter(function(l) { return l.id !== id; });
      localStorage.removeItem('matplan-varer-' + id);
      localStorage.removeItem('matplan-basis-' + id);
      lagreLister();
      if (database && bruker) database.ref(kontekstSti(kontekst, 'lister/' + id)).remove();
      tegnForside();
    });
  }

  function åpneListe(id) {
    var liste = alleLister.find(function(l) { return l.id === id; });
    if (!liste) return;
    aktivListeId = id;
    aktivListeKontekst = liste.kontekst || 'personlig';

    // Vis liste-container, skjul forside
    document.getElementById('forside-container').style.display = 'none';
    document.getElementById('liste-container').style.display = 'block';
    var typeInfo = listeTypeInfo(liste.type || 'mat');
    document.getElementById('aktiv-liste-tittel').textContent = typeInfo.ikon + ' ' + liste.navn;

    // Bygg standardkategoriene for listens type (mat-liste får matkategorier,
    // verktøyliste får verktøykategorier osv.)
    byggStandardKategorierDOM(liste.type || 'mat');

    // Typebytte-deteksjon: markøren sier hvilken type dataen sist ble lagret
    // under. Avvik betyr at listen har byttet type → re-kategoriser Diverse.
    // Mangler markøren (pre-v29-data) antar vi 'mat', siden alle lister ble
    // rendret med mat-kategorier før typene fikk egne sett.
    var typeMarker = localStorage.getItem('matplan-kattype-' + id) || 'mat';
    reKategoriserDiverse = typeMarker !== aktivListeType;

    // Bytt til riktig sett av egne kategorier for denne konteksten
    // (personlige for personlige lister, husstandens for husstand-lister)
    bytteEgneKategorierKontekst(aktivListeKontekst);

    // Bytt til riktig handlehistorikk for konteksten (lærte forslag)
    bytteHistorikkKontekst(aktivListeKontekst);

    // Last inn data for denne listen (fra lokal cache – kan være tom/utdatert
    // til skyen har levert. Derfor markerer vi lista som ikke-hydrert ennå.)
    aktivListeHydrert = false;
    lastInnListeData(id);

    // Koble Firebase til denne listen
    lyttPåListe(id);
  }

  function gåTilForside() {
    // Lagre og detach Firebase listener
    lagreAlt();
    if (aktivFirebaseLytter) {
      if (database && bruker && aktivListeId) {
        database.ref(kontekstSti(aktivListeKontekst, 'lister/' + aktivListeId + '/varer')).off('value', aktivFirebaseLytter);
      }
      aktivFirebaseLytter = null;
    }
    aktivListeId = null;
    aktivListeKontekst = null;
    aktivListeHydrert = false;
    document.getElementById('liste-container').style.display = 'none';
    document.getElementById('forside-container').style.display = 'block';
    tegnForside();
  }

  var aktivFirebaseLytter = null;
  // True først når Firebase-lytteren har levert skyens versjon av den aktive
  // lista (mens vi var tilkoblet). lagreAlt skriver IKKE til skyen før dette, så
  // et tomt/utdatert øyeblikksbilde rett etter åpning aldri overskriver andres data.
  var aktivListeHydrert = false;

  function lastInnListeData(id) {
    // Last inn varer
    var lagretVarer = localStorage.getItem('matplan-varer-' + id);
    if (lagretVarer) {
      byggListeFraData(JSON.parse(lagretVarer));
    } else {
      // Tom liste – tøm varer i alle kategorier (men behold DOM-strukturen for egne kategorier)
      aktiveKategoriIder().forEach(function(k) {
        var ul = document.getElementById(k);
        if (ul) ul.innerHTML = '';
      });
      oppdaterTeller();
      oppdaterKategoriSynlighet();
    }
    // Last inn basisliste for denne listen
    var lagretBasis = localStorage.getItem('matplan-basis-' + id);
    if (lagretBasis) {
      basisVarer = JSON.parse(lagretBasis);
    } else {
      basisVarer = [];
    }
  }

  function lyttPåListe(id) {
    if (!database || !bruker) return;
    if (aktivFirebaseLytter) {
      database.ref(kontekstSti(aktivListeKontekst, 'lister/' + (aktivListeId || id) + '/varer')).off('value', aktivFirebaseLytter);
    }
    var kontekst = aktivListeKontekst;
    aktivFirebaseLytter = function(snap) {
      // snap.val() er null når listen er helt tom (Firebase pruner tomme verdier).
      // Vi må fortsatt oppdatere UI for å reflektere tømming fra annen enhet.
      // Et tilkoblet snapshot betyr at vi nå kjenner skyens versjon → hydrert.
      if (erKoblet) aktivListeHydrert = true;
      var data = snap.val() || {};
      // Ikke overskriv skjermen hvis vi har en ventende, usynket endring for nettopp
      // DENNE lista (vår lokale versjon er da nyere). Ventende endringer for andre
      // lister skal ikke blokkere oppdatering her.
      if (!ventendeForListe('handleliste', kontekst, id)) {
        migrerVarerData(data);
        byggListeFraData(data);
        localStorage.setItem('matplan-varer-' + id, JSON.stringify(data));
      }
    };
    database.ref(kontekstSti(kontekst, 'lister/' + id + '/varer')).on('value', aktivFirebaseLytter);
    database.ref(kontekstSti(kontekst, 'lister/' + id + '/basis')).on('value', function(snap) {
      // Samme null-håndtering for basis: en tom basisliste kommer som null fra Firebase.
      var data = snap.val();
      if (!ventendeForListe('basisliste', kontekst, id)) {
        basisVarer = data || [];
        migrerBasisData(basisVarer);
        localStorage.setItem('matplan-basis-' + id, JSON.stringify(basisVarer));
        // Re-render alltid – DOM-en eksisterer i sidebaren uansett om den er åpen eller ikke,
        // så det er trygt og enkelt å holde den oppdatert kontinuerlig.
        tegnBasisListe();
      }
    });
  }

  // ==============================
  // SIDEBAR
  // ==============================
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('åpen');
    document.getElementById('sidebar-overlay').classList.toggle('synlig');
    if (document.getElementById('sidebar').classList.contains('åpen')) {
      tegnBasisListe();
      tegnForslagListe();
      tegnEgneKategorierSidebar();
    }
  }

  function skrivUtHandleliste() {
    // Lukk sidebar slik at brukeren ikke sitter med den åpen etter print
    document.getElementById('sidebar').classList.remove('åpen');
    document.getElementById('sidebar-overlay').classList.remove('synlig');
    window.print();
  }

  // Sikre at sidebar/overlays er fullstendig usynlige i alle print-situasjoner
  // (iOS Safari respekterer ikke alltid @media print for position:fixed-elementer).
  // beforeprint kjøres uansett om print starter via knappen eller browser-meny.
  var printSkjul = ['sidebar', 'sidebar-overlay', 'ny-liste-modal', 'bekreft-overlay', 'feillogg-panel'];
  window.addEventListener('beforeprint', function() {
    printSkjul.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.dataset.prevDisplay = el.style.display || '';
        el.style.display = 'none';
      }
    });
  });
  window.addEventListener('afterprint', function() {
    printSkjul.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.display = el.dataset.prevDisplay || '';
        delete el.dataset.prevDisplay;
      }
    });
  });

  // ==============================
  // EGNE KATEGORIER
  // ==============================
  var fargeValg = [
    { bg: '#fde8e8', tekst: '#8b2020' },
    { bg: '#fde8d0', tekst: '#7a4010' },
    { bg: '#fdf5cc', tekst: '#7a5c10' },
    { bg: '#d0f0e0', tekst: '#1a6b40' },
    { bg: '#cce8f8', tekst: '#1a4a7a' },
    { bg: '#e0d0f8', tekst: '#3d1d80' },
    { bg: '#f8d0e8', tekst: '#7a1a50' },
    { bg: '#e0e0e0', tekst: '#444' }
  ];
  var valgtFargeIndeks = 0;
  // egneKategorier er den AKTIVE listen som vises i sidebar og brukes i UI.
  // egneKategorierByKontekst holder rede på alle kontekstenes data slik at
  // vi kan bytte raskt mellom personlige lister og husstand-lister uten å
  // miste data eller måtte vente på Firebase.
  var egneKategorier = [];
  var egneKategorierByKontekst = { 'personlig': [] };

  function byggFargeVelger() {
    var container = document.getElementById('farge-velger');
    container.innerHTML = '';
    fargeValg.forEach(function(f, i) {
      var boks = document.createElement('div');
      boks.className = 'farge-boks' + (i === valgtFargeIndeks ? ' valgt' : '');
      boks.style.background = f.bg;
      boks.style.borderColor = i === valgtFargeIndeks ? f.tekst : 'transparent';
      boks.onclick = function() { valgtFargeIndeks = i; byggFargeVelger(); };
      container.appendChild(boks);
    });
  }

  function toggleNyKategoriPanel() {
    var panel = document.getElementById('ny-kategori-panel');
    var synlig = panel.classList.toggle('synlig');
    if (synlig) { byggFargeVelger(); document.getElementById('ny-kat-navn').focus(); }
    else { document.getElementById('ny-kat-navn').value = ''; }
  }

  function opprettKategori() {
    var navn = document.getElementById('ny-kat-navn').value.trim();
    if (!navn) return;
    var farge = fargeValg[valgtFargeIndeks];
    var id = 'egn-' + Date.now();
    egneKategorier.push({ id: id, navn: navn, farge: farge });
    byggEgenKategoriDOM(id, navn, farge);
    oppdaterKategoriVelgere();
    lagreEgneKategorier();
    tegnEgneKategorierSidebar();
    toggleNyKategoriPanel();
  }

  function byggEgenKategoriDOM(id, navn, farge) {
    var container = document.getElementById('egne-kategorier-container');

    var hr = document.createElement('hr');
    hr.className = 'skillelinje';
    hr.id = 'skille-' + id;
    container.appendChild(hr);

    var div = document.createElement('div');
    div.className = 'kategori tom';
    div.id = 'kat-' + id;
    div.innerHTML =
      '<div class="kategori-header" onclick="toggleKategori(\'' + id + '\')">' +
        '<p class="kategori-tittel" id="' + id + '-header" style="background:' + farge.bg + ';color:' + farge.tekst + '">' + navn + '</p>' +
        '<span class="kategori-pil" id="' + id + '-pil">▼</span>' +
        '<button class="sorter-knapp" onclick="event.stopPropagation();sorterKategori(\'' + id + '\')">A–Å</button>' +
        '<button class="slett-kategori-knapp" onclick="event.stopPropagation();slettEgenKategori(\'' + id + '\')" aria-label="Slett kategori" title="Slett kategori">×</button>' +
      '</div>' +
      '<ul id="' + id + '"></ul>';
    container.appendChild(div);

    if (!katIder.includes(id)) katIder.push(id);
    alleKategorier.push({ id: id, navn: navn });
  }

  function slettEgenKategori(id) {
    var liste = document.getElementById(id);
    if (liste && liste.querySelectorAll('li').length > 0) {
      visBekreft('Kategorien har varer. Flytt dem til Diverse og slett?', function() {
        liste.querySelectorAll('li').forEach(function(li) {
          document.getElementById('diverse').appendChild(li);
        });
        fjernEgenKategoriDOM(id);
      });
    } else {
      fjernEgenKategoriDOM(id);
    }
  }

  function fjernEgenKategoriDOM(id) {
    var katDiv  = document.getElementById('kat-' + id);
    var skille  = document.getElementById('skille-' + id);
    if (katDiv)  katDiv.parentNode.removeChild(katDiv);
    if (skille)  skille.parentNode.removeChild(skille);
    katIder = katIder.filter(function(k) { return k !== id; });
    alleKategorier = alleKategorier.filter(function(k) { return k.id !== id; });
    egneKategorier = egneKategorier.filter(function(k) { return k.id !== id; });
    oppdaterKategoriVelgere();
    lagreEgneKategorier();
    tegnEgneKategorierSidebar();
    oppdaterTeller();
    oppdaterKategoriSynlighet();
    lagreAlt();
  }

  function oppdaterKategoriVelgere() {
    // Bygger nedtrekksmenyene helt på nytt fra gjeldende listetypes
    // standardkategorier + egne kategorier. Beholder valgt verdi hvis den
    // fortsatt finnes i det nye settet.
    var selects = document.querySelectorAll('#velg-kategori, #basis-kat-velg');
    selects.forEach(function(sel) {
      var tidligereValgt = sel.value;
      sel.innerHTML = '';
      aktivStandardKategorier.forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.navn;
        sel.appendChild(opt);
      });
      egneKategorier.forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.navn;
        sel.appendChild(opt);
      });
      sel.value = tidligereValgt;
      // Hvis tidligere valg ikke finnes i ny type, faller vi til første
      if (sel.value !== tidligereValgt || !sel.value) sel.selectedIndex = 0;
    });
  }

  function lagreEgneKategorier() {
    // Lagre i den konteksten brukeren er aktiv i. Hvis ingen liste er åpen
    // (aktivListeKontekst er null), defaulter vi til 'personlig' siden det
    // ikke gir mening å lagre i en husstand-kontekst uten å være i en husstand-liste.
    var kontekst = aktivListeKontekst || 'personlig';
    egneKategorierByKontekst[kontekst] = egneKategorier;
    localStorage.setItem('matplan-egne-kategorier-' + kontekst, JSON.stringify(egneKategorier));
    if (typeof database !== 'undefined' && database && erKoblet && bruker) {
      database.ref(kontekstSti(kontekst, 'egne-kategorier')).set(egneKategorier).catch(function(err) {
        loggFeil('Lagre egne kategorier: ' + err.message, 'firebase', '');
      });
    }
  }

  // Flagg som hindrer sync-loop: når listener mottar data fra sky, ikke skriv tilbake.
  var ignorerEgneKategorierEko = false;

  // Bygger DOM fra et helt nytt egneKategorier-array. Brukes når sky-data ankommer
  // og lokalt har avvik. Rydder eksisterende DOM først, så bygger opp på nytt.
  function rebuildEgneKategorierFraData(nyeKategorier) {
    // Fjern alle eksisterende egen-kategori-DOM-elementer
    egneKategorier.slice().forEach(function(k) {
      var katDiv = document.getElementById('kat-' + k.id);
      var skille = document.getElementById('skille-' + k.id);
      if (katDiv) katDiv.parentNode.removeChild(katDiv);
      if (skille) skille.parentNode.removeChild(skille);
      katIder = katIder.filter(function(x) { return x !== k.id; });
      alleKategorier = alleKategorier.filter(function(x) { return x.id !== k.id; });
    });
    egneKategorier = nyeKategorier || [];
    egneKategorier.forEach(function(k) {
      byggEgenKategoriDOM(k.id, k.navn, k.farge);
    });
    oppdaterKategoriVelgere();
    tegnEgneKategorierSidebar();
    // Cache per kontekst i localStorage (rask oppstart neste gang denne konteksten åpnes)
    var k = aktivListeKontekst || 'personlig';
    localStorage.setItem('matplan-egne-kategorier-' + k, JSON.stringify(egneKategorier));
  }

  // Oppdaterer cached data for en gitt kontekst. Hvis konteksten er den som vises
  // nå (basert på aktivListeKontekst), rebygger vi også DOM.
  function setEgneKategorierForKontekst(kontekst, raaData) {
    var nye = [];
    if (Array.isArray(raaData)) nye = raaData;
    else if (raaData && typeof raaData === 'object') nye = Object.keys(raaData).map(function(k) { return raaData[k]; });
    egneKategorierByKontekst[kontekst] = nye;
    localStorage.setItem('matplan-egne-kategorier-' + kontekst, JSON.stringify(nye));
    // Hvis dette er konteksten brukeren ser akkurat nå, oppdater DOM
    var aktiv = aktivListeKontekst || 'personlig';
    if (kontekst === aktiv) {
      if (JSON.stringify(egneKategorier) !== JSON.stringify(nye)) {
        rebuildEgneKategorierFraData(nye);
      }
    }
  }

  // Bytter visning til en bestemt kontekst (kalt fra åpneListe).
  function bytteEgneKategorierKontekst(kontekst) {
    var data = egneKategorierByKontekst[kontekst];
    if (data === undefined) {
      // Last fra localStorage hvis tilgjengelig
      var cache = localStorage.getItem('matplan-egne-kategorier-' + kontekst);
      data = cache ? JSON.parse(cache) : [];
      egneKategorierByKontekst[kontekst] = data;
    }
    rebuildEgneKategorierFraData(data);
  }

  function lastInnEgneKategorier() {
    // Last inn personlig kontekst først (default). Husstand-kategorier lastes
    // når brukeren åpner en husstand-liste (via bytteEgneKategorierKontekst).
    // Bakoverkompatibilitet: gammel localStorage-nøkkel 'matplan-egne-kategorier'
    // (uten kontekst-suffix) migreres til personlig hvis ny nøkkel mangler.
    var nyKey = 'matplan-egne-kategorier-personlig';
    var lagret = localStorage.getItem(nyKey);
    if (!lagret) {
      var gammel = localStorage.getItem('matplan-egne-kategorier');
      if (gammel) {
        lagret = gammel;
        localStorage.setItem(nyKey, gammel);
      }
    }
    if (lagret) {
      egneKategorier = JSON.parse(lagret);
      egneKategorierByKontekst['personlig'] = egneKategorier;
      egneKategorier.forEach(function(k) {
        byggEgenKategoriDOM(k.id, k.navn, k.farge);
      });
      oppdaterKategoriVelgere();
    }
    tegnEgneKategorierSidebar();
  }

  function tegnEgneKategorierSidebar() {
    var container = document.getElementById('sidebar-kat-liste');
    if (!container) return;
    container.innerHTML = '';
    if (egneKategorier.length === 0) {
      container.innerHTML = '<div class="sidebar-kat-tom">Ingen egne kategorier ennå</div>';
      return;
    }
    egneKategorier.forEach(function(k) {
      var div = document.createElement('div');
      div.className = 'sidebar-kat-rad';
      var badge = document.createElement('span');
      badge.className = 'sidebar-kat-badge';
      badge.style.background = k.farge.bg;
      badge.style.color = k.farge.tekst;
      badge.textContent = k.navn;
      var slett = document.createElement('button');
      slett.className = 'sidebar-kat-slett';
      slett.title = 'Slett kategori';
      slett.setAttribute('aria-label', 'Slett kategori');
      slett.textContent = '×';
      slett.addEventListener('click', function() { slettEgenKategori(k.id); });
      div.appendChild(badge);
      div.appendChild(slett);
      container.appendChild(div);
    });
  }

  // ==============================
  // HANDLEHISTORIKK
  // ==============================
  // Historikken følger listens kontekst (samme mønster som egne kategorier):
  // personlige lister lærer av dine egne avhukinger (synces mellom dine
  // enheter), husstand-lister av husstandens (deles mellom medlemmene).
  // Privat historikk lærer aldri opp husstand-lister, og omvendt.
  var handleHistorikk = {}; // aktiv kontekst: { gruppe: { 'bananer': [{dato, kat, navn}], ... } }
  var handleHistorikkByKontekst = { 'personlig': {} };
  var ignorerHistorikkEko = {}; // { kontekst: true } - hindrer sync-loop ved egne skriv
  var avvistForslag = [];

  function lastInnHistorikk() {
    // Bakoverkompatibilitet: gammel global nøkkel 'matplan-historikk'
    // migreres til personlig kontekst ved første oppstart.
    var nyKey = 'matplan-historikk-personlig';
    var lagret = localStorage.getItem(nyKey);
    if (!lagret) {
      var gammel = localStorage.getItem('matplan-historikk');
      if (gammel) {
        lagret = gammel;
        localStorage.setItem(nyKey, gammel);
        localStorage.removeItem('matplan-historikk');
      }
    }
    if (lagret) {
      try { handleHistorikk = JSON.parse(lagret); } catch (e) { handleHistorikk = {}; }
      handleHistorikkByKontekst['personlig'] = handleHistorikk;
    }
    var avvist = localStorage.getItem('matplan-avvist-forslag');
    if (avvist) avvistForslag = JSON.parse(avvist);
  }

  function lagreHistorikk() {
    var kontekst = aktivListeKontekst || 'personlig';
    handleHistorikkByKontekst[kontekst] = handleHistorikk;
    localStorage.setItem('matplan-historikk-' + kontekst, JSON.stringify(handleHistorikk));
    if (typeof database !== 'undefined' && database && erKoblet && bruker) {
      ignorerHistorikkEko[kontekst] = true;
      database.ref(kontekstSti(kontekst, 'historikk')).set(handleHistorikk).catch(function(err) {
        loggFeil('Lagre historikk: ' + err.message, 'firebase', '');
      });
    }
  }

  // Mottar historikk fra Firebase-lytter for en gitt kontekst.
  function setHistorikkForKontekst(kontekst, raaData) {
    if (ignorerHistorikkEko[kontekst]) { delete ignorerHistorikkEko[kontekst]; return; }
    var data = raaData || {};
    handleHistorikkByKontekst[kontekst] = data;
    localStorage.setItem('matplan-historikk-' + kontekst, JSON.stringify(data));
    var aktiv = aktivListeKontekst || 'personlig';
    if (kontekst === aktiv) handleHistorikk = data;
  }

  // Bytter aktiv historikk til riktig kontekst (kalles fra åpneListe).
  function bytteHistorikkKontekst(kontekst) {
    var data = handleHistorikkByKontekst[kontekst];
    if (data === undefined) {
      var cache = localStorage.getItem('matplan-historikk-' + kontekst);
      try { data = cache ? JSON.parse(cache) : {}; } catch (e) { data = {}; }
      handleHistorikkByKontekst[kontekst] = data;
    }
    handleHistorikk = data;
  }

  // Logger en handling på en vare. manuell=true betyr et bevisst valg
  // (flytting med 🔁) som lærer kategorien umiddelbart.
  function loggHandlet(navn, kat, manuell) {
    if (!navn || navn.trim() === '') return;
    var gruppe = historikkNøkkel();
    var nøkkel = navn.trim().toLowerCase();
    if (!handleHistorikk[gruppe]) handleHistorikk[gruppe] = {};
    if (!handleHistorikk[gruppe][nøkkel]) handleHistorikk[gruppe][nøkkel] = [];
    var oppføring = {
      navn: navn.trim(),
      kat: kat || 'diverse',
      dato: Date.now()
    };
    if (manuell) oppføring.manuell = true;
    handleHistorikk[gruppe][nøkkel].push(oppføring);
    // Behold de siste 10 oppføringene per vare - antallsbasert, ikke
    // tidsbasert, slik at kategori-læringen overlever sesongvarer
    // (grillkull i fjor sommer huskes til neste sommer). Frekvens-funksjonene
    // (⭐-forslag, favoritt-forslag) filtrerer selv på dato.
    var arr = handleHistorikk[gruppe][nøkkel];
    if (arr.length > 10) handleHistorikk[gruppe][nøkkel] = arr.slice(arr.length - 10);
    lagreHistorikk();
  }

  function finnUkerMedHandling(oppføringer) {
    // Returner antall unike uker (av siste 4) der varen er handlet
    var nå = Date.now();
    var ukerHandlet = new Set();
    for (var i = 0; i < 4; i++) {
      var ukeStart = nå - ((i + 1) * 7 * 24 * 60 * 60 * 1000);
      var ukeSlutt = nå - (i * 7 * 24 * 60 * 60 * 1000);
      var handletDenneUken = oppføringer.some(function(e) {
        return e.dato >= ukeStart && e.dato < ukeSlutt;
      });
      if (handletDenneUken) ukerHandlet.add(i);
    }
    return ukerHandlet.size;
  }

  function hentForslagFraHistorikk() {
    var forslag = [];
    var gruppe = historikkNøkkel();
    var gruppeData = handleHistorikk[gruppe] || {};

    // Finn hvilke varer som allerede er i basislisten
    var iBasisliste = basisVarer.map(function(v) { return v.navn.trim().toLowerCase(); });

    for (var nøkkel in gruppeData) {
      var oppføringer = gruppeData[nøkkel];
      if (!oppføringer || oppføringer.length === 0) continue;

      // Hopp over avviste forslag
      if (avvistForslag.indexOf(nøkkel) !== -1) continue;

      // Hopp over varer allerede i basislisten
      if (iBasisliste.indexOf(nøkkel) !== -1) continue;

      var uker = finnUkerMedHandling(oppføringer);
      if (uker >= 3) {
        var siste = oppføringer[oppføringer.length - 1];
        forslag.push({ nøkkel: nøkkel, navn: siste.navn, kat: siste.kat, uker: uker });
      }
    }

    forslag.sort(function(a, b) { return b.uker - a.uker; });
    return forslag;
  }

  function tegnForslagListe() {
    var container = document.getElementById('forslag-liste');
    var seksjon   = document.getElementById('forslag-seksjon');
    if (!container) return;

    var forslag = hentForslagFraHistorikk();

    if (forslag.length === 0) {
      seksjon.style.display = 'none';
      return;
    }

    seksjon.style.display = 'block';
    container.innerHTML = '';
    forslag.forEach(function(f) {
      var div = document.createElement('div');
      div.className = 'forslag-vare';
      div.innerHTML =
        '<span class="forslag-navn">' + f.navn + '</span>' +
        '<span class="forslag-frekvens">' + f.uker + '/4 uker</span>' +
        '<button class="forslag-legg-til">+ Basis</button>' +
        '<button class="forslag-avvis" title="Ikke foreslå igjen" aria-label="Ikke foreslå igjen">×</button>';
      (function(fRef) {
        div.querySelector('.forslag-legg-til').addEventListener('click', function() {
          leggForslagTilBasis(fRef.nøkkel, fRef.kat, fRef.navn);
        });
        div.querySelector('.forslag-avvis').addEventListener('click', function() {
          avvisForslagItem(fRef.nøkkel);
        });
      })(f);
      container.appendChild(div);
    });
  }

  function leggForslagTilBasis(nøkkel, kat, navn) {
    // Dekod HTML-entiteter
    var tmp = document.createElement('textarea');
    tmp.innerHTML = navn; navn = tmp.value;
    basisVarer.push({ navn: navn, kategori: kat });
    // Fjern fra avvistlisten hvis den var der
    avvistForslag = avvistForslag.filter(function(k) { return k !== nøkkel; });
    lagreAlt();
    tegnBasisListe();
    tegnForslagListe();
  }

  function avvisForslagItem(nøkkel) {
    if (avvistForslag.indexOf(nøkkel) === -1) avvistForslag.push(nøkkel);
    localStorage.setItem('matplan-avvist-forslag', JSON.stringify(avvistForslag));
    tegnForslagListe();
  }

  // ==============================
  // AUTOFULLFØR ORDLISTE
  // ==============================
  var ordliste = [
    // Kjøtt
    {navn:'Kyllingfilet',kat:'kjott'},{navn:'Kyllinglår',kat:'kjott'},{navn:'Kyllingbryst',kat:'kjott'},
    {navn:'Kjøttdeig',kat:'kjott'},{navn:'Biff',kat:'kjott'},{navn:'Svinekjøtt',kat:'kjott'},
    {navn:'Pølser',kat:'kjott'},{navn:'Bacon',kat:'kjott'},{navn:'Skinke',kat:'kjott'},
    {navn:'Ribbe',kat:'kjott'},{navn:'Lammekjøtt',kat:'kjott'},{navn:'Karbonader',kat:'kjott'},
    {navn:'Kjøttkaker',kat:'kjott'},{navn:'Medisterkaker',kat:'kjott'},{navn:'Koteletter',kat:'kjott'},
    {navn:'Svinefilet',kat:'kjott'},{navn:'Entrecôte',kat:'kjott'},{navn:'Indrefilet',kat:'kjott'},
    {navn:'Leverpostei',kat:'kjott'},{navn:'Salami',kat:'kjott'},{navn:'Spekeskinke',kat:'kjott'},
    {navn:'Kalkun',kat:'kjott'},{navn:'Kalkunfilet',kat:'kjott'},{navn:'Kalkunbryst',kat:'kjott'},
    {navn:'Kalvekjøtt',kat:'kjott'},{navn:'Reinsdyrkjøtt',kat:'kjott'},{navn:'Viltkjøtt',kat:'kjott'},
    {navn:'Hjortekjøtt',kat:'kjott'},{navn:'Lammekoteletter',kat:'kjott'},{navn:'Lammelår',kat:'kjott'},
    {navn:'Bayonneskinke',kat:'kjott'},{navn:'Kokt skinke',kat:'kjott'},{navn:'Servelat',kat:'kjott'},
    {navn:'Wienerpølse',kat:'kjott'},{navn:'Grillpølse',kat:'kjott'},{navn:'Chorizo',kat:'kjott'},
    {navn:'Pepperoni',kat:'kjott'},{navn:'Wienerschnitzel',kat:'kjott'},{navn:'Andebryst',kat:'kjott'},
    // Fisk og skalldyr
    {navn:'Laks',kat:'fisk'},{navn:'Laksefilet',kat:'fisk'},{navn:'Torsk',kat:'fisk'},
    {navn:'Sei',kat:'fisk'},{navn:'Reker',kat:'fisk'},{navn:'Ørret',kat:'fisk'},
    {navn:'Makrell',kat:'fisk'},{navn:'Sild',kat:'fisk'},{navn:'Scampi',kat:'fisk'},
    {navn:'Tunfisk',kat:'fisk'},{navn:'Fiskekaker',kat:'fisk'},{navn:'Fiskeboller',kat:'fisk'},
    {navn:'Fiskepudding',kat:'fisk'},{navn:'Fiskefilet',kat:'fisk'},{navn:'Fiskepinner',kat:'fisk'},
    {navn:'Hyse',kat:'fisk'},{navn:'Kveite',kat:'fisk'},{navn:'Steinbit',kat:'fisk'},
    {navn:'Rødspette',kat:'fisk'},{navn:'Brosme',kat:'fisk'},{navn:'Akkar',kat:'fisk'},
    {navn:'Blekksprut',kat:'fisk'},{navn:'Krabbe',kat:'fisk'},{navn:'Hummer',kat:'fisk'},
    {navn:'Blåskjell',kat:'fisk'},{navn:'Ansjos',kat:'fisk'},
    {navn:'Røkelaks',kat:'fisk'},{navn:'Gravlaks',kat:'fisk'},{navn:'Klippfisk',kat:'fisk'},
    {navn:'Hvit fisk',kat:'fisk'},{navn:'Sushi-laks',kat:'fisk'},{navn:'Pangasius',kat:'fisk'},
    {navn:'Tilapia',kat:'fisk'},{navn:'Kveitefilet',kat:'fisk'},{navn:'Sjøkreps',kat:'fisk'},
    {navn:'Krabbeklør',kat:'fisk'},{navn:'Lutefisk',kat:'fisk'},{navn:'Rakfisk',kat:'fisk'},
    {navn:'Surimi',kat:'fisk'},{navn:'Tunfiskboks',kat:'fisk'},{navn:'Reker i lake',kat:'fisk'},
    // Meieri
    {navn:'Melk',kat:'meieri'},{navn:'Lettmelk',kat:'meieri'},{navn:'Helmelk',kat:'meieri'},
    {navn:'Smør',kat:'meieri'},{navn:'Egg',kat:'meieri'},{navn:'Rømme',kat:'meieri'},
    {navn:'Fløte',kat:'meieri'},{navn:'Kremfløte',kat:'meieri'},{navn:'Yoghurt',kat:'meieri'},
    {navn:'Ost',kat:'meieri'},{navn:'Hvitost',kat:'meieri'},{navn:'Brunost',kat:'meieri'},
    {navn:'Jarlsberg',kat:'meieri'},{navn:'Norvegia',kat:'meieri'},{navn:'Brie',kat:'meieri'},
    {navn:'Camembert',kat:'meieri'},{navn:'Kvark',kat:'meieri'},{navn:'Kesam',kat:'meieri'},
    {navn:'Skyr',kat:'meieri'},{navn:'Margarin',kat:'meieri'},{navn:'Crème fraîche',kat:'meieri'},
    {navn:'Kulturmelk',kat:'meieri'},{navn:'Pultost',kat:'meieri'},
    {navn:'Cottage cheese',kat:'meieri'},{navn:'Mozzarella',kat:'meieri'},{navn:'Parmesan',kat:'meieri'},
    {navn:'Feta',kat:'meieri'},{navn:'Blåmuggost',kat:'meieri'},{navn:'Cheddar',kat:'meieri'},
    {navn:'Kefir',kat:'meieri'},{navn:'Vaniljeyoghurt',kat:'meieri'},{navn:'Naturell yoghurt',kat:'meieri'},
    {navn:'Pizzaost',kat:'meieri'},{navn:'Pinneost',kat:'meieri'},{navn:'Geitost',kat:'meieri'},
    {navn:'Laktosefri melk',kat:'meieri'},{navn:'Havremelk',kat:'meieri'},{navn:'Mandelmelk',kat:'meieri'},
    {navn:'Soyamelk',kat:'meieri'},{navn:'Crème fraîche',kat:'meieri'},{navn:'Matfløte',kat:'meieri'},
    {navn:'Vaniljeis',kat:'meieri'},{navn:'Iskrem',kat:'meieri'},{navn:'Saltkjeks',kat:'meieri'},
    // Frukt og grønt
    {navn:'Epler',kat:'frukt'},{navn:'Bananer',kat:'frukt'},{navn:'Appelsiner',kat:'frukt'},
    {navn:'Sitroner',kat:'frukt'},{navn:'Lime',kat:'frukt'},{navn:'Druer',kat:'frukt'},
    {navn:'Jordbær',kat:'frukt'},{navn:'Blåbær',kat:'frukt'},{navn:'Bringebær',kat:'frukt'},
    {navn:'Mango',kat:'frukt'},{navn:'Ananas',kat:'frukt'},{navn:'Melon',kat:'frukt'},
    {navn:'Pærer',kat:'frukt'},{navn:'Plommer',kat:'frukt'},{navn:'Avokado',kat:'frukt'},
    {navn:'Tomater',kat:'frukt'},{navn:'Agurk',kat:'frukt'},{navn:'Brokkoli',kat:'frukt'},
    {navn:'Blomkål',kat:'frukt'},{navn:'Gulrøtter',kat:'frukt'},{navn:'Paprika',kat:'frukt'},
    {navn:'Løk',kat:'frukt'},{navn:'Hvitløk',kat:'frukt'},{navn:'Purre',kat:'frukt'},
    {navn:'Spinat',kat:'frukt'},{navn:'Salat',kat:'frukt'},{navn:'Kål',kat:'frukt'},
    {navn:'Mais',kat:'frukt'},{navn:'Erter',kat:'frukt'},{navn:'Sopp',kat:'frukt'},
    {navn:'Squash',kat:'frukt'},{navn:'Selleri',kat:'frukt'},{navn:'Chili',kat:'frukt'},
    {navn:'Poteter',kat:'frukt'},{navn:'Søtpoteter',kat:'frukt'},{navn:'Reddik',kat:'frukt'},
    {navn:'Ingefær',kat:'frukt'},{navn:'Persille',kat:'frukt'},{navn:'Basilikum',kat:'frukt'},
    {navn:'Koriander',kat:'frukt'},{navn:'Nektariner',kat:'frukt'},{navn:'Fersken',kat:'frukt'},
    {navn:'Rødbeter',kat:'frukt'},{navn:'Asparges',kat:'frukt'},{navn:'Grønnkål',kat:'frukt'},
    {navn:'Honningmelon',kat:'frukt'},{navn:'Vannmelon',kat:'frukt'},{navn:'Kiwi',kat:'frukt'},
    {navn:'Klementiner',kat:'frukt'},{navn:'Mandarin',kat:'frukt'},{navn:'Granateple',kat:'frukt'},
    {navn:'Solbær',kat:'frukt'},{navn:'Tyttebær',kat:'frukt'},{navn:'Multebær',kat:'frukt'},
    {navn:'Stikkelsbær',kat:'frukt'},{navn:'Rabarbra',kat:'frukt'},{navn:'Rødløk',kat:'frukt'},
    {navn:'Vårløk',kat:'frukt'},{navn:'Sjalottløk',kat:'frukt'},{navn:'Sukkererter',kat:'frukt'},
    {navn:'Brokkolini',kat:'frukt'},{navn:'Rosenkål',kat:'frukt'},{navn:'Rødkål',kat:'frukt'},
    {navn:'Sukkerter',kat:'frukt'},{navn:'Ruccola',kat:'frukt'},{navn:'Isbergsalat',kat:'frukt'},
    {navn:'Romanosalat',kat:'frukt'},{navn:'Babyspinat',kat:'frukt'},{navn:'Aubergine',kat:'frukt'},
    {navn:'Sukkerbønner',kat:'frukt'},{navn:'Pastinakk',kat:'frukt'},{navn:'Knollselleri',kat:'frukt'},
    {navn:'Dill',kat:'frukt'},{navn:'Gressløk',kat:'frukt'},{navn:'Mynte',kat:'frukt'},
    {navn:'Sitrongress',kat:'frukt'},{navn:'Datterino-tomater',kat:'frukt'},{navn:'Cherrytomater',kat:'frukt'},
    // Brød
    {navn:'Grovbrød',kat:'brod'},{navn:'Loff',kat:'brod'},{navn:'Baguette',kat:'brod'},
    {navn:'Ciabatta',kat:'brod'},{navn:'Rundstykker',kat:'brod'},{navn:'Knekkebrød',kat:'brod'},
    {navn:'Kneipp',kat:'brod'},{navn:'Pita',kat:'brod'},{navn:'Tortilla',kat:'brod'},
    {navn:'Wienerbrød',kat:'brod'},{navn:'Croissant',kat:'brod'},{navn:'Polarbrød',kat:'brod'},
    {navn:'Lefse',kat:'brod'},{navn:'Bagel',kat:'brod'},{navn:'Horn',kat:'brod'},
    {navn:'Rugbrød',kat:'brod'},{navn:'Surdeigsbrød',kat:'brod'},{navn:'Fokaccia',kat:'brod'},
    {navn:'Pølsebrød',kat:'brod'},{navn:'Hamburgerbrød',kat:'brod'},{navn:'Brioche',kat:'brod'},
    {navn:'Frokostbrød',kat:'brod'},{navn:'Tebrød',kat:'brod'},{navn:'Skolebrød',kat:'brod'},
    {navn:'Berlinerbolle',kat:'brod'},{navn:'Boller',kat:'brod'},{navn:'Glutenfritt brød',kat:'brod'},
    {navn:'Sandwich-loff',kat:'brod'},{navn:'Toastbrød',kat:'brod'},{navn:'Pannekaker',kat:'brod'},
    // Basisvarer
    {navn:'Olivenolje',kat:'basis'},{navn:'Solsikkeolje',kat:'basis'},{navn:'Salt',kat:'basis'},
    {navn:'Pepper',kat:'basis'},{navn:'Pasta',kat:'basis'},{navn:'Spaghetti',kat:'basis'},
    {navn:'Penne',kat:'basis'},{navn:'Ris',kat:'basis'},{navn:'Hvetemel',kat:'basis'},
    {navn:'Havregryn',kat:'basis'},{navn:'Sukker',kat:'basis'},{navn:'Melis',kat:'basis'},
    {navn:'Gjær',kat:'basis'},{navn:'Bakepulver',kat:'basis'},{navn:'Vaniljesukker',kat:'basis'},
    {navn:'Hermetiske tomater',kat:'basis'},{navn:'Buljong',kat:'basis'},{navn:'Tomatpuré',kat:'basis'},
    {navn:'Ketchup',kat:'basis'},{navn:'Majones',kat:'basis'},{navn:'Sennep',kat:'basis'},
    {navn:'Soyasaus',kat:'basis'},{navn:'Honning',kat:'basis'},{navn:'Syltetøy',kat:'basis'},
    {navn:'Peanøttsmør',kat:'basis'},{navn:'Kaviar',kat:'basis'},{navn:'Nøtter',kat:'basis'},
    {navn:'Mandler',kat:'basis'},{navn:'Rosiner',kat:'basis'},{navn:'Sjokolade',kat:'basis'},
    {navn:'Kakao',kat:'basis'},{navn:'Kaffe',kat:'basis'},{navn:'Te',kat:'basis'},
    {navn:'Müsli',kat:'basis'},{navn:'Cornflakes',kat:'basis'},{navn:'Chips',kat:'basis'},
    {navn:'Kjeks',kat:'basis'},{navn:'Tomatboks',kat:'basis'},{navn:'Kokosmelk',kat:'basis'},
    {navn:'Popcorn',kat:'basis'},{navn:'Sirup',kat:'basis'},{navn:'Eddik',kat:'basis'},
    {navn:'Karri',kat:'basis'},{navn:'Paprikapulver',kat:'basis'},{navn:'Oregano',kat:'basis'},
    {navn:'Timian',kat:'basis'},{navn:'Rosmarin',kat:'basis'},{navn:'Kanel',kat:'basis'},
    {navn:'Couscous',kat:'basis'},{navn:'Quinoa',kat:'basis'},{navn:'Bulgur',kat:'basis'},
    {navn:'Linser',kat:'basis'},{navn:'Kikerter',kat:'basis'},{navn:'Kidneybønner',kat:'basis'},
    {navn:'Sorte bønner',kat:'basis'},{navn:'Hvite bønner',kat:'basis'},{navn:'Basmati ris',kat:'basis'},
    {navn:'Jasminris',kat:'basis'},{navn:'Fullkornsris',kat:'basis'},{navn:'Risottoris',kat:'basis'},
    {navn:'Lasagneplater',kat:'basis'},{navn:'Fusilli',kat:'basis'},{navn:'Tagliatelle',kat:'basis'},
    {navn:'Nudler',kat:'basis'},{navn:'Ramen',kat:'basis'},{navn:'Tortillalefser',kat:'basis'},
    {navn:'Tacoskall',kat:'basis'},{navn:'Tacokrydder',kat:'basis'},{navn:'Salsa',kat:'basis'},
    {navn:'Guacamole',kat:'basis'},{navn:'Hummus',kat:'basis'},{navn:'Tahini',kat:'basis'},
    {navn:'Sriracha',kat:'basis'},{navn:'Sambal oelek',kat:'basis'},{navn:'Worcestersaus',kat:'basis'},
    {navn:'Østerssaus',kat:'basis'},{navn:'Fiskesaus',kat:'basis'},{navn:'BBQ-saus',kat:'basis'},
    {navn:'Pesto',kat:'basis'},{navn:'Hvit balsamico',kat:'basis'},{navn:'Balsamicoeddik',kat:'basis'},
    {navn:'Rapsolje',kat:'basis'},{navn:'Kokosolje',kat:'basis'},{navn:'Sesamfrø',kat:'basis'},
    {navn:'Solsikkefrø',kat:'basis'},{navn:'Gresskarkjerner',kat:'basis'},{navn:'Chiafrø',kat:'basis'},
    {navn:'Linfrø',kat:'basis'},{navn:'Cashewnøtter',kat:'basis'},{navn:'Valnøtter',kat:'basis'},
    {navn:'Hasselnøtter',kat:'basis'},{navn:'Paranøtter',kat:'basis'},{navn:'Pistasjnøtter',kat:'basis'},
    {navn:'Tørket aprikos',kat:'basis'},{navn:'Dadler',kat:'basis'},{navn:'Spisesjokolade',kat:'basis'},
    {navn:'Smågodt',kat:'basis'},{navn:'Lakris',kat:'basis'},{navn:'Tyggegummi',kat:'basis'},
    {navn:'Energidrikk',kat:'basis'},{navn:'Brus',kat:'basis'},{navn:'Cola',kat:'basis'},
    {navn:'Solo',kat:'basis'},{navn:'Mineralvann',kat:'basis'},{navn:'Eplejuice',kat:'basis'},
    {navn:'Appelsinjuice',kat:'basis'},{navn:'Saft',kat:'basis'},{navn:'Vin',kat:'basis'},
    {navn:'Øl',kat:'basis'},{navn:'Smørbrødkjeks',kat:'basis'},{navn:'Maizena',kat:'basis'},
    {navn:'Speltmel',kat:'basis'},{navn:'Sammalt hvete',kat:'basis'},{navn:'Sammalt rug',kat:'basis'},
    {navn:'Spisskummen',kat:'basis'},{navn:'Karve',kat:'basis'},{navn:'Muskat',kat:'basis'},
    {navn:'Kardemomme',kat:'basis'},{navn:'Ingefærpulver',kat:'basis'},{navn:'Hvitløkspulver',kat:'basis'},
    {navn:'Løkpulver',kat:'basis'},{navn:'Chilipulver',kat:'basis'},{navn:'Garam masala',kat:'basis'},
    // Husholdning
    {navn:'Toalettpapir',kat:'husholdning'},{navn:'Kjøkkenpapir',kat:'husholdning'},
    {navn:'Oppvaskmiddel',kat:'husholdning'},{navn:'Vaskemiddel',kat:'husholdning'},
    {navn:'Skyllemiddel',kat:'husholdning'},{navn:'Søppelposer',kat:'husholdning'},
    {navn:'Aluminiumsfolie',kat:'husholdning'},{navn:'Bakepapir',kat:'husholdning'},
    {navn:'Svamp',kat:'husholdning'},{navn:'Tannkrem',kat:'husholdning'},
    {navn:'Sjampo',kat:'husholdning'},{navn:'Balsam',kat:'husholdning'},
    {navn:'Dusjsåpe',kat:'husholdning'},{navn:'Deodorant',kat:'husholdning'},
    {navn:'Stearinlys',kat:'husholdning'},{navn:'Batterier',kat:'husholdning'},
    {navn:'Bleieskift',kat:'husholdning'},{navn:'Rengjøringsmiddel',kat:'husholdning'},
    {navn:'Hansker',kat:'husholdning'},{navn:'Skurekrem',kat:'husholdning'},
    {navn:'Plastfolie',kat:'husholdning'},{navn:'Fryseposer',kat:'husholdning'},
    {navn:'Servietter',kat:'husholdning'},{navn:'Engangskopper',kat:'husholdning'},
    {navn:'Wc-rens',kat:'husholdning'},{navn:'Klorin',kat:'husholdning'},
    {navn:'Maskinoppvask',kat:'husholdning'},{navn:'Avkalker',kat:'husholdning'},
    {navn:'Mopp',kat:'husholdning'},{navn:'Vaskeklut',kat:'husholdning'},
    {navn:'Mikrofiberklut',kat:'husholdning'},{navn:'Stålull',kat:'husholdning'},
    {navn:'Tanntråd',kat:'husholdning'},{navn:'Munnskyll',kat:'husholdning'},
    {navn:'Barberblad',kat:'husholdning'},{navn:'Barberskum',kat:'husholdning'},
    {navn:'Solkrem',kat:'husholdning'},{navn:'Bodylotion',kat:'husholdning'},
    {navn:'Håndsåpe',kat:'husholdning'},{navn:'Vaskepulver',kat:'husholdning'},
    {navn:'Tørketrommel-ark',kat:'husholdning'},{navn:'Flekkfjerner',kat:'husholdning'},
    {navn:'Hundemat',kat:'husholdning'},{navn:'Kattemat',kat:'husholdning'},
    {navn:'Kattesand',kat:'husholdning'},{navn:'Lyspærer',kat:'husholdning'},
    // ============================================================
    // Hus og hjem - vises kun for liste-type 'hus'
    // ============================================================
    {navn:'Stearinlys',kat:'husholdning',for:['hus']},{navn:'Telys',kat:'husholdning',for:['hus']},
    {navn:'Fyrstikker',kat:'husholdning',for:['hus']},{navn:'Vase',kat:'diverse',for:['hus']},
    {navn:'Blomsterjord',kat:'diverse',for:['hus']},{navn:'Avskårne blomster',kat:'diverse',for:['hus']},
    {navn:'Potteplante',kat:'diverse',for:['hus']},{navn:'Sengetøy',kat:'diverse',for:['hus']},
    {navn:'Putetrekk',kat:'diverse',for:['hus']},{navn:'Dynetrekk',kat:'diverse',for:['hus']},
    {navn:'Håndklær',kat:'diverse',for:['hus']},{navn:'Badehåndkle',kat:'diverse',for:['hus']},
    {navn:'Kjøkkenhåndkle',kat:'diverse',for:['hus']},{navn:'Gryteklut',kat:'diverse',for:['hus']},
    {navn:'Vaskeklut',kat:'husholdning',for:['hus']},{navn:'Mikrofiberklut',kat:'husholdning',for:['hus']},
    {navn:'Klesklype',kat:'diverse',for:['hus']},{navn:'Kleshenger',kat:'diverse',for:['hus']},
    {navn:'Skohorn',kat:'diverse',for:['hus']},{navn:'Skopuss',kat:'diverse',for:['hus']},
    {navn:'Pyntegjenstand',kat:'diverse',for:['hus']},{navn:'Bilderamme',kat:'diverse',for:['hus']},
    {navn:'Bildelisting',kat:'diverse',for:['hus']},{navn:'Lyspære',kat:'husholdning',for:['hus','bygg']},
    {navn:'Sparepære',kat:'husholdning',for:['hus','bygg']},{navn:'LED-pære',kat:'husholdning',for:['hus','bygg']},
    {navn:'Lampeskjerm',kat:'diverse',for:['hus']},{navn:'Lampehus',kat:'diverse',for:['hus','bygg']},
    {navn:'Batterier',kat:'husholdning',for:['hus','bygg','diverse']},{navn:'AA-batterier',kat:'husholdning',for:['hus','bygg','diverse']},
    {navn:'AAA-batterier',kat:'husholdning',for:['hus','bygg','diverse']},{navn:'Knappcellebatteri',kat:'husholdning',for:['hus','bygg']},
    {navn:'Skjøteledning',kat:'diverse',for:['hus','bygg']},{navn:'Stikkontakt',kat:'diverse',for:['hus','bygg']},
    {navn:'Tape',kat:'diverse',for:['hus','bygg','diverse']},{navn:'Lim',kat:'diverse',for:['hus','bygg']},
    {navn:'Lommelykt',kat:'diverse',for:['hus','bygg']},{navn:'Lufterfrisker',kat:'husholdning',for:['hus']},
    // ============================================================
    // Bygg og verktøy - vises kun for liste-type 'bygg'
    // ============================================================
    {navn:'Skruer',kat:'diverse',for:['bygg']},{navn:'Treskruer',kat:'diverse',for:['bygg']},
    {navn:'Gipsskruer',kat:'diverse',for:['bygg']},{navn:'Spiker',kat:'diverse',for:['bygg']},
    {navn:'Mutre',kat:'diverse',for:['bygg']},{navn:'Bolter',kat:'diverse',for:['bygg']},
    {navn:'Plugger',kat:'diverse',for:['bygg']},{navn:'Hammer',kat:'diverse',for:['bygg']},
    {navn:'Skrutrekker',kat:'diverse',for:['bygg']},{navn:'Tang',kat:'diverse',for:['bygg']},
    {navn:'Sag',kat:'diverse',for:['bygg']},{navn:'Drill',kat:'diverse',for:['bygg']},
    {navn:'Borr-bit',kat:'diverse',for:['bygg']},{navn:'Sagblad',kat:'diverse',for:['bygg']},
    {navn:'Maling',kat:'diverse',for:['bygg']},{navn:'Hvitmaling',kat:'diverse',for:['bygg']},
    {navn:'Lakk',kat:'diverse',for:['bygg']},{navn:'Beis',kat:'diverse',for:['bygg']},
    {navn:'Pensel',kat:'diverse',for:['bygg']},{navn:'Malekost',kat:'diverse',for:['bygg']},
    {navn:'Malerull',kat:'diverse',for:['bygg']},{navn:'Malerbrett',kat:'diverse',for:['bygg']},
    {navn:'Maskeringsteip',kat:'diverse',for:['bygg']},{navn:'Sandpapir',kat:'diverse',for:['bygg']},
    {navn:'Sparkel',kat:'diverse',for:['bygg']},{navn:'Sparkelmasse',kat:'diverse',for:['bygg']},
    {navn:'Silikon',kat:'diverse',for:['bygg']},{navn:'Fugemasse',kat:'diverse',for:['bygg']},
    {navn:'Måleband',kat:'diverse',for:['bygg']},{navn:'Tommestokk',kat:'diverse',for:['bygg']},
    {navn:'Vater',kat:'diverse',for:['bygg']},{navn:'Vernebriller',kat:'diverse',for:['bygg']},
    {navn:'Arbeidshansker',kat:'diverse',for:['bygg']},{navn:'Hørselvern',kat:'diverse',for:['bygg']},
    {navn:'Presenning',kat:'diverse',for:['bygg']},{navn:'Sement',kat:'diverse',for:['bygg']},
    {navn:'Mørtel',kat:'diverse',for:['bygg']},{navn:'Sand',kat:'diverse',for:['bygg']},
    {navn:'Planker',kat:'diverse',for:['bygg']},{navn:'Lister',kat:'diverse',for:['bygg']},
    {navn:'Isolasjon',kat:'diverse',for:['bygg']},{navn:'Strips',kat:'diverse',for:['bygg','diverse']},
    // ============================================================
    // Diverse - vises kun for liste-type 'diverse'
    // ============================================================
    {navn:'Gavepapir',kat:'diverse',for:['diverse']},{navn:'Gavebånd',kat:'diverse',for:['diverse']},
    {navn:'Gavekort',kat:'diverse',for:['diverse']},{navn:'Bursdagskort',kat:'diverse',for:['diverse']},
    {navn:'Konvolutt',kat:'diverse',for:['diverse']},{navn:'Frimerker',kat:'diverse',for:['diverse']},
    {navn:'Notatbok',kat:'diverse',for:['diverse']},{navn:'Kulepenn',kat:'diverse',for:['diverse']},
    {navn:'Blyant',kat:'diverse',for:['diverse']},{navn:'Viskelær',kat:'diverse',for:['diverse']},
    {navn:'Mappe',kat:'diverse',for:['diverse']},{navn:'Plastlomme',kat:'diverse',for:['diverse']},
    {navn:'Engangskopper',kat:'husholdning',for:['diverse']},{navn:'Engangstallerken',kat:'husholdning',for:['diverse']},
    {navn:'Plastbestikk',kat:'husholdning',for:['diverse']},{navn:'Servietter',kat:'husholdning',for:['diverse']},
    {navn:'Plastpose',kat:'husholdning',for:['diverse']},{navn:'Tau',kat:'diverse',for:['diverse']},
    {navn:'Snøre',kat:'diverse',for:['diverse']},{navn:'Plaster',kat:'diverse',for:['diverse']},
    {navn:'Bandasje',kat:'diverse',for:['diverse']},{navn:'Solbriller',kat:'diverse',for:['diverse']},
    {navn:'Paraply',kat:'diverse',for:['diverse']},{navn:'Reisekoffert',kat:'diverse',for:['diverse']},
  ];

  var katEmoji = {
    kjott:'🥩', fisk:'🐟', meieri:'🥛', frukt:'🥦', brod:'🍞',
    basis:'🥫', husholdning:'🧹', diverse:'🛍️',
    drikke:'🥤', festmat:'🍽️', snacks:'🍿', pynt:'🎈',
    rengjoring:'🧹', interior:'🛋️', hage:'🪴',
    verktoy:'🔨', materialer:'🪵', festemidler:'🔩', maling:'🎨'
  };

  var aktivAutoIndex = -1;

  // Velger riktig kategori for et autofullfør-forslag i gjeldende listetype.
  // 1) Forslagets egen kategori hvis den finnes i typen (og ikke er diverse)
  // 2) Typens ordliste-gjenkjenning på navnet
  // 3) Forslagets kategori hvis gyldig, ellers Diverse
  // Rekkefølgen bevarer mat-oppførselen (taggene er mat-id-er) samtidig som
  // bygg/hus/arrangement får re-gjenkjenning mot sine egne ordlister.
  function autofullførKat(navn, kat) {
    // Lært kategori vinner alltid - også over ordliste-forslagets egen tag,
    // så 'Sjokolade' går til brukerens 'Lørdagsgodteri' når den er lært.
    var lært = lærtKategoriFor(navn || '');
    if (lært) return lært;
    var gyldige = aktiveKategoriIder();
    if (kat && kat !== 'diverse' && gyldige.indexOf(kat) !== -1) return kat;
    var treff = finnKategori(navn || '');
    if (treff) return treff;
    return (kat && gyldige.indexOf(kat) !== -1) ? kat : 'diverse';
  }

  // Henter varer fra brukerens handlehistorikk som er handlet 3+ ganger
  // de siste 3 månedene. Disse legges til autofullføringen som "lærte" forslag.
  function hentLaartOrdliste() {
    var gruppe = historikkNøkkel();
    var data = handleHistorikk[gruppe] || {};
    var grense = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000); // ~3 måneder
    var resultat = [];
    for (var nøkkel in data) {
      var oppføringer = (data[nøkkel] || []).filter(function(e) { return e.dato >= grense; });
      if (oppføringer.length >= 3) {
        var siste = oppføringer[oppføringer.length - 1];
        resultat.push({ navn: siste.navn, kat: siste.kat || 'diverse', laart: true });
      }
    }
    return resultat;
  }

  function visAutofullfør(verdi) {
    var liste = document.getElementById('autofullfør-liste');
    aktivAutoIndex = -1;
    if (verdi.trim().length < 1) { liste.classList.remove('synlig'); return; }

    var søk = verdi.toLowerCase();

    // Finn gjeldende listetype (mat/arrangement/hus/bygg/diverse).
    // Hver ordliste-entry har en 'for'-tag som sier hvilke listetyper den passer i.
    // Mangler 'for' → defaulter til mat+arrangement (matvarer).
    var gjeldendeType = 'mat';
    if (aktivListeId) {
      var aktivListe = alleLister.find(function(l) { return l.id === aktivListeId; });
      if (aktivListe && aktivListe.type) gjeldendeType = aktivListe.type;
    }

    // Søk i ordlisten – kun varer som passer gjeldende listetype
    var treff = ordliste.filter(function(o) {
      var gyldigFor = o['for'] || ['mat','arrangement'];
      if (gyldigFor.indexOf(gjeldendeType) === -1) return false;
      return o.navn.toLowerCase().indexOf(søk) === 0;
    });

    // Inkluder også lærte varer fra handlehistorikken (handlet 3+ ganger siste 3 mnd)
    hentLaartOrdliste().forEach(function(l) {
      if (l.navn.toLowerCase().indexOf(søk) === 0) {
        var finnes = treff.some(function(t) { return t.navn.toLowerCase() === l.navn.toLowerCase(); });
        if (!finnes) treff.push(l);
      }
    });

    // Søk også i eksisterende varer på listen (brukerens egne ord)
    document.querySelectorAll('.vare-tekst').forEach(function(el) {
      var n = el.textContent.trim();
      if (n.toLowerCase().indexOf(søk) === 0) {
        var finnes = treff.some(function(t) { return t.navn.toLowerCase() === n.toLowerCase(); });
        if (!finnes) treff.push({ navn: n, kat: el.closest('li') ? el.closest('li').closest('ul').id : 'diverse' });
      }
    });

    if (treff.length === 0) {
      // Ingen treff – skjul dropdownen helt så den ikke dekker kategori/mengde/enhet-feltene.
      // Brukeren legger til varen ved å trykke Enter eller '+ Legg til'-knappen som vanlig.
      liste.classList.remove('synlig');
      liste.innerHTML = '';
      return;
    }

    var html = '';
    treff.slice(0, 7).forEach(function(o, i) {
      var laartMerke = o.laart ? '<span class="kat-badge" title="Fra din handlehistorikk">⭐</span>' : '';
      // Normaliser kategorien mot gjeldende listetype: ordliste-tagger stammer
      // fra mat-settet, så i andre listetyper må vi re-gjenkjenne mot typens
      // ordlister (ellers havner f.eks. 'Skruer' i Diverse i en byggliste).
      var visKat = autofullførKat(o.navn, o.kat);
      html += '<div class="autofullfør-valg" data-navn="' + o.navn.replace(/"/g, '&quot;') +
        '" data-kat="' + visKat + '">'+
        '<span>' + o.navn + '</span>'+
        laartMerke +
        '<span class="kat-badge">' + (katEmoji[visKat] || '') + '</span>'+
        '</div>';
    });
    liste.innerHTML = html;
    // Bruk event delegation – ingen onclick i HTML-strengen
    liste.querySelectorAll('.autofullfør-valg').forEach(function(el) {
      el.addEventListener('click', function() {
        velgAutofullfør(this.dataset.navn, this.dataset.kat);
      });
    });
    liste.classList.add('synlig');
  }

  function velgAutofullfør(navn, kat) {
    // Dekod HTML-entiteter (f.eks. &#39; → ')
    var tmp = document.createElement('textarea');
    tmp.innerHTML = navn;
    navn = tmp.value;

    // Sett felt og kategori
    document.getElementById('ny-vare').value = navn;
    var sel = document.getElementById('velg-kategori');
    if (sel) {
      sel.value = kat;
      // Forslaget kan bære en kategori fra en annen listetype - prøv typens
      // gjenkjenning på navnet før vi faller til Diverse
      if (sel.value !== kat) sel.value = foreslåKategoriForNavn(navn) || 'diverse';
    }
    lukkAutofullfør();

    // Legg direkte til i listen
    leggTilVare();
  }

  function lukkAutofullfør() {
    var liste = document.getElementById('autofullfør-liste');
    if (liste) liste.classList.remove('synlig');
    aktivAutoIndex = -1;
  }

  function håndterAutoTast(e) {
    var liste = document.getElementById('autofullfør-liste');
    var valg = liste ? liste.querySelectorAll('.autofullfør-valg') : [];
    if (!liste || !liste.classList.contains('synlig')) {
      if (e.key === 'Enter') leggTilVare();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      aktivAutoIndex = Math.min(aktivAutoIndex + 1, valg.length - 1);
      oppdaterAktivValg(valg);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      aktivAutoIndex = Math.max(aktivAutoIndex - 1, -1);
      oppdaterAktivValg(valg);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (aktivAutoIndex >= 0 && valg[aktivAutoIndex]) {
        valg[aktivAutoIndex].click();
      } else {
        lukkAutofullfør();
        leggTilVare();
      }
    } else if (e.key === 'Escape') {
      lukkAutofullfør();
    }
  }

  function oppdaterAktivValg(valg) {
    valg.forEach(function(v, i) {
      v.classList.toggle('aktiv', i === aktivAutoIndex);
    });
  }

  // Lukk autocomplete når man klikker utenfor
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.autofullfør-wrapper')) lukkAutofullfør();
  });
  // Push-varsler er midlertidig fjernet – kommer inn igjen sammen med
  // Firebase Authentication når brukerkontoer er på plass.

  // ==============================
  // FEILLOGG
  // ==============================
  var feilListe = [];
  function loggFeil(melding, kilde, linje) {
    var tid = new Date().toLocaleTimeString('no-NO');
    feilListe.push({ melding: melding, kilde: kilde, linje: linje, tid: tid });
    oppdaterFeillogg();
    document.getElementById('feillogg-knapp').classList.add('aktiv');
  }
  function oppdaterFeillogg() {
    var innhold = document.getElementById('feillogg-innhold');
    if (!feilListe.length) { innhold.innerHTML = '<p class="feillogg-tom">Ingen feil registrert ✓</p>'; return; }
    var html = '';
    for (var i = feilListe.length - 1; i >= 0; i--) {
      var f = feilListe[i];
      html += '<div class="feil-melding"><div class="feil-tid">' + f.tid + (f.kilde ? ' · ' + f.kilde : '') + (f.linje ? ' · linje ' + f.linje : '') + '</div>' + f.melding + '</div>';
    }
    innhold.innerHTML = html;
  }
  function toggleFeillogg() { document.getElementById('feillogg-panel').classList.toggle('synlig'); }
  function tømFeillogg() {
    feilListe = [];
    oppdaterFeillogg();
    document.getElementById('feillogg-knapp').classList.remove('aktiv');
    document.getElementById('feillogg-panel').classList.remove('synlig');
  }

  // ==============================
  // TILBAKEMELDING (lagres i Firebase)
  // ==============================
  // Versjons-streng som følger med tilbakemeldinger – bumpes manuelt sammen
  // med CACHE_NAME i service-worker.js.
  var APP_VERSJON = 'matplan-v63-pervare-fase1';
  var valgtTilbakemeldingType = 'feil';

  // Selv-helbredende HTML-sync: app.js hentes alltid ferskt (no-cache), men på
  // iOS standalone-PWA kan selve index.html (app-skallet) serveres fra en gammel
  // snapshot - da blir statiske UI-elementer (knapper, modaler) hengende igjen.
  // window.HTML_VERSJON settes i index.html; matcher den ikke APP_VERSJON er
  // skallet utdatert, og vi tvinger ÉN reload (vakt mot loop via sessionStorage)
  // for å hente ferskt skall. Siden app.js når fram selv om skallet er gammelt,
  // er dette selv-helbredende.
  (function sjekkSkallVersjon() {
    try {
      if ((window.HTML_VERSJON || '') === APP_VERSJON) {
        sessionStorage.removeItem('matplan-skall-reload');
        return;
      }
      if (!sessionStorage.getItem('matplan-skall-reload')) {
        sessionStorage.setItem('matplan-skall-reload', '1');
        location.reload();
      }
    } catch (e) { /* sessionStorage kan være blokkert – ignorer */ }
  })();

  function åpneTilbakemeldingModal(forhåndsType, forhåndsMelding) {
    var type = forhåndsType || 'feil';
    valgtTilbakemeldingType = type;
    document.querySelectorAll('.tilbakemelding-type-chip').forEach(function(chip) {
      chip.classList.toggle('valgt', chip.dataset.type === type);
    });
    var textarea = document.getElementById('tilbakemelding-melding');
    textarea.value = forhåndsMelding || '';
    document.getElementById('tilbakemelding-suksess').classList.remove('synlig');
    var sendKnapp = document.getElementById('tilbakemelding-send-knapp');
    sendKnapp.disabled = false;
    sendKnapp.textContent = 'Send';
    document.getElementById('tilbakemelding-overlay').classList.add('synlig');
    setTimeout(function() { textarea.focus(); }, 100);
  }

  function lukkTilbakemeldingModal() {
    document.getElementById('tilbakemelding-overlay').classList.remove('synlig');
    document.getElementById('tilbakemelding-melding').value = '';
  }

  function velgTilbakemeldingType(el) {
    valgtTilbakemeldingType = el.dataset.type;
    document.querySelectorAll('.tilbakemelding-type-chip').forEach(function(chip) {
      chip.classList.toggle('valgt', chip === el);
    });
  }

  function sendTilbakemelding() {
    var melding = document.getElementById('tilbakemelding-melding').value.trim();
    var sendKnapp = document.getElementById('tilbakemelding-send-knapp');
    if (!melding) {
      var textarea = document.getElementById('tilbakemelding-melding');
      textarea.style.borderColor = 'var(--red)';
      textarea.focus();
      setTimeout(function() { textarea.style.borderColor = ''; }, 1500);
      return;
    }
    if (!database || !erKoblet) {
      sendKnapp.textContent = 'Du må være tilkoblet';
      setTimeout(function() { sendKnapp.textContent = 'Send'; }, 2500);
      return;
    }
    sendKnapp.disabled = true;
    sendKnapp.textContent = 'Sender...';
    // Bygg objektet – inkluderer kontekst-info så feil kan diagnostiseres
    var aktivListe = null;
    if (aktivListeId) {
      aktivListe = alleLister.find(function(l) { return l.id === aktivListeId; });
    }
    var rapport = {
      type: valgtTilbakemeldingType,
      melding: melding,
      feilkoder: feilListe.slice(),
      aktivListeId: aktivListeId || null,
      listeType: aktivListe ? (aktivListe.type || 'mat') : null,
      enhet: navigator.userAgent,
      appVersjon: APP_VERSJON,
      dato: new Date().toISOString()
    };
    database.ref('tilbakemeldinger').push(rapport).then(function() {
      document.getElementById('tilbakemelding-suksess').classList.add('synlig');
      sendKnapp.textContent = 'Sendt ✓';
      setTimeout(function() { lukkTilbakemeldingModal(); }, 1800);
    }).catch(function(err) {
      sendKnapp.disabled = false;
      sendKnapp.textContent = 'Feilet – prøv igjen';
      loggFeil('Tilbakemelding feilet: ' + err.message, 'firebase', '');
    });
  }

  function sendFeilSomRapport() {
    // Bygg en lesbar tekst-versjon av feilkodene som forhånds-utfylles i meldingen
    var feilTekst = '';
    if (feilListe.length === 0) {
      feilTekst = '(Ingen aktive feilkoder)';
    } else {
      feilTekst = 'Feilkoder fra appen:\n\n';
      for (var i = feilListe.length - 1; i >= 0; i--) {
        var f = feilListe[i];
        feilTekst += '[' + f.tid + '] ' + (f.kilde || '') + (f.linje ? ' linje ' + f.linje : '') + '\n' + f.melding + '\n\n';
      }
      feilTekst += '\n---\nHva gjorde du da feilen oppsto?\n';
    }
    document.getElementById('feillogg-panel').classList.remove('synlig');
    åpneTilbakemeldingModal('feil', feilTekst);
  }
  // Meldinger som skal ignoreres – ikke ekte feil
  var ignoreMeldinger = [
    'ServiceWorker', 'service-worker', 'InvalidStateError',
    'FCM', 'messaging', 'firebase-messaging',
    'console.log', 'Script error'
  ];

  function erEkteFeil(melding, kilde) {
    var m = (melding || '').toLowerCase();
    var k = (kilde || '').toLowerCase();
    for (var i = 0; i < ignoreMeldinger.length; i++) {
      var filter = ignoreMeldinger[i].toLowerCase();
      if (m.indexOf(filter) !== -1 || k.indexOf(filter) !== -1) return false;
    }
    return true;
  }

  window.onerror = function(melding, kilde, linje, kolonne, feil) {
    if (!erEkteFeil(melding, kilde)) return false;
    var fullMelding = melding;
    if (feil && feil.stack) fullMelding += '\n' + feil.stack.split('\n').slice(0,3).join('\n');
    loggFeil(fullMelding, kilde ? kilde.split('/').pop() : '', linje);
    return false;
  };

  window.addEventListener('unhandledrejection', function(e) {
    var melding = e.reason ? e.reason.toString() : 'Ukjent';
    if (!erEkteFeil(melding, '')) return;
    loggFeil('Promise-feil: ' + melding, '', '');
  });

  // Åpne feillogg ved å trykke 5 ganger på tittelen
  var titelTrykk = 0;
  var titelTimer = null;
  document.addEventListener('DOMContentLoaded', function() {
    var tittel = document.querySelector('h1');
    if (tittel) {
      tittel.addEventListener('click', function() {
        titelTrykk++;
        clearTimeout(titelTimer);
        titelTimer = setTimeout(function() { titelTrykk = 0; }, 2000);
        if (titelTrykk >= 5) {
          titelTrykk = 0;
          document.getElementById('feillogg-knapp').classList.add('aktiv');
          toggleFeillogg();
        }
      });
    }
  });
  // ==============================
  // BEKREFTELSEBOKS
  // ==============================
  function visBekreft(tekst, jaFunksjon, jaTekst) {
    document.getElementById('bekreft-tekst').textContent = tekst;
    var jaKnapp = document.getElementById('bekreft-ja');
    // jaTekst er valgfri; faller tilbake til "Ja, slett" som er det vanligste
    // bruksområdet (sletting). Send eksplisitt tekst for andre handlinger.
    jaKnapp.textContent = jaTekst || 'Ja, slett';
    document.getElementById('bekreft-overlay').classList.add('synlig');
    jaKnapp.onclick = function() { lukkBekreft(); jaFunksjon(); };
  }
  function lukkBekreft() {
    document.getElementById('bekreft-overlay').classList.remove('synlig');
  }

  // ==============================
  // SKJUL TOMME KATEGORIER
  // ==============================
  // Initialiseres til mat-settet; byggStandardKategorierDOM setter riktig
  // sett når en liste åpnes, og egne kategorier legges til/fjernes løpende.
  var katIder = standardKategorierPerType.mat.map(function(k) { return k.id; });

  function oppdaterKategoriSynlighet() {
    for (var k = 0; k < katIder.length; k++) {
      var id       = katIder[k];
      var liste    = document.getElementById(id);
      var katDiv   = document.getElementById('kat-' + id);
      var skille   = document.getElementById('skille-' + id);
      var alleLi   = liste ? liste.querySelectorAll('li') : [];
      var synlige  = 0;
      for (var j = 0; j < alleLi.length; j++) {
        // Teller varer som ikke er skjult
        if (!alleLi[j].classList.contains('skjult')) synlige++;
      }
      var erTom = synlige === 0;
      if (katDiv)  katDiv.classList.toggle('tom', erTom);
      if (skille)  skille.classList.toggle('tom', erTom);
    }
  }

  // ==============================
  // ENHETER
  // ==============================
  var enheter = ['–','stk','pk','kg','g','liter','dl','ml','pose','boks','flaske'];

  function enhetOptions(valgt) {
    var html = '';
    for (var i = 0; i < enheter.length; i++) {
      html += '<option value="' + enheter[i] + '"' + (enheter[i] === valgt ? ' selected' : '') + '>' + enheter[i] + '</option>';
    }
    return html;
  }

  function formatMengde(antall, enhet) {
    if (!antall) return '';
    return antall + ' ' + ((!enhet || enhet === '–') ? 'stk' : enhet);
  }

  // ==============================
  // LAG VARE-ELEMENT
  // ==============================
  function lagVareElement(navn, antall, enhet) {
    var mengdeTekst = formatMengde(antall, enhet);
    var li = document.createElement('li');
    li.dataset.id = nyVareId(); // overstyres av byggListeFraData for lagrede varer
    li.innerHTML =
      '<span class="sjekk" onclick="hukAv(this)"></span>' +
      '<span class="mengde-badge ' + (mengdeTekst ? '' : 'tom') + '">' + mengdeTekst + '</span>' +
      '<span class="vare-tekst">' + navn + '</span>' +
      '<button class="notat-knapp" onclick="toggleRediger(this)" title="Rediger vare" aria-label="Rediger vare">✏️</button>' +
      '<button class="slett" onclick="slettVare(this)" title="Slett vare" aria-label="Slett vare">×</button>' +
      '<div class="rediger-panel">' +
        '<div class="rediger-rad">' +
          '<span class="rediger-etikett">Mengde:</span>' +
          '<input type="number" min="0.1" step="0.1" placeholder="Ant." value="' + (antall || '') + '">' +
          '<select class="rediger-enhet">' + enhetOptions(enhet || '–') + '</select>' +
        '</div>' +
        '<div class="rediger-rad">' +
          '<span class="rediger-etikett">Kategori:</span>' +
          '<select class="rediger-kat"></select>' +
        '</div>' +
        '<div class="rediger-rad">' +
          '<span class="rediger-etikett">Merknad:</span>' +
          '<input type="text" placeholder="f.eks. kjøp lavfett...">' +
        '</div>' +
        '<button class="rediger-lagre" onclick="lagreRediger(this)">Lagre</button>' +
      '</div>';
    var inputs = li.querySelectorAll('.rediger-panel input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('keydown', function(e) {
        if (e.key === 'Enter') lagreRediger(this.closest('.rediger-panel').querySelector('.rediger-lagre'));
      });
    }
    return li;
  }

  // ==============================
  // REDIGER MENGDE + MERKNAD
  // ==============================
  function toggleRediger(knapp) {
    var li    = knapp.closest('li');
    var panel = li.querySelector('.rediger-panel');
    var badge = li.querySelector('.mengde-badge');
    var notat = li.querySelector('.notat-tekst');
    var deler = badge.textContent.trim().split(' ');
    panel.querySelector('input[type="number"]').value = deler.length >= 2 ? deler[0] : '';
    panel.querySelector('.rediger-enhet').value       = deler.length >= 2 ? deler[1] : '–';
    panel.querySelector('input[type="text"]').value   = notat ? notat.textContent : '';
    // Fyll kategori-velgeren med gjeldende kategorier og velg varens nåværende
    var katSel = panel.querySelector('.rediger-kat');
    if (katSel) {
      var nåId = li.closest('ul') ? li.closest('ul').id : '';
      katSel.innerHTML = alleKategorier.map(function(k) {
        return '<option value="' + k.id + '">' + k.navn + '</option>';
      }).join('');
      katSel.value = nåId;
    }
    document.querySelectorAll('.rediger-panel.synlig').forEach(function(p) { if (p !== panel) p.classList.remove('synlig'); });
    panel.classList.toggle('synlig');
    if (panel.classList.contains('synlig')) panel.querySelector('input[type="number"]').focus();
  }

  function lagreRediger(knapp) {
    var li    = knapp.closest('li');
    var panel = li.querySelector('.rediger-panel');
    var badge = li.querySelector('.mengde-badge');
    var antall  = panel.querySelector('input[type="number"]').value.trim();
    var enhet   = panel.querySelector('.rediger-enhet').value;
    var mengde  = formatMengde(antall, enhet);
    badge.textContent = mengde;
    if (mengde) badge.classList.remove('tom'); else badge.classList.add('tom');
    var merknadVerdi = panel.querySelector('input[type="text"]').value.trim();
    var notat = li.querySelector('.notat-tekst');
    if (merknadVerdi) {
      if (!notat) { notat = document.createElement('span'); notat.className = 'notat-tekst'; li.insertBefore(notat, panel); }
      notat.textContent = merknadVerdi;
    } else if (notat) { notat.parentNode.removeChild(notat); }

    // Kategori-endring: flytt varen til valgt kategori hvis den er en annen.
    // Manuell flytting er et bevisst valg → lær kategorien umiddelbart (manuell=true).
    var katSel = panel.querySelector('.rediger-kat');
    if (katSel) {
      var nåId  = li.closest('ul') ? li.closest('ul').id : '';
      var målId = katSel.value;
      if (målId && målId !== nåId && document.getElementById(målId)) {
        document.getElementById(målId).appendChild(li);
        var navnEl = li.querySelector('.vare-tekst');
        if (navnEl) loggHandlet(navnEl.textContent.trim(), målId, true);
      }
    }

    panel.classList.remove('synlig');
    oppdaterTeller();
    oppdaterKategoriSynlighet();
    lagreAlt();
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.rediger-panel') && !e.target.classList.contains('notat-knapp')) {
      document.querySelectorAll('.rediger-panel.synlig').forEach(function(p) { p.classList.remove('synlig'); });
    }
  });

  // ==============================
  // KATEGORIER FOR GJELDENDE LISTE
  // ==============================
  // Standard + egne kategorier for gjeldende liste. Settes av
  // byggStandardKategorierDOM ved åpning av liste; egne kategorier
  // legges til av byggEgenKategoriDOM. Brukes nå av kategori-velgeren i
  // rediger-panelet (flytting av vare skjer derfra, se lagreRediger).
  var alleKategorier = standardKategorierPerType.mat.slice();

  // ==============================
  // KOLLAPSE KATEGORIER
  // ==============================
  var pilIdMap = { basis: 'basis-kat-pil' };
  function toggleKategori(id) {
    document.getElementById(id).classList.toggle('lukket');
    var pilId = pilIdMap[id] || (id + '-pil');
    document.getElementById(pilId).classList.toggle('lukket');
  }

  // ==============================
  // SORTER A–Å
  // ==============================
  function sorterKategori(id) {
    var liste = document.getElementById(id);
    var varer = Array.prototype.slice.call(liste.querySelectorAll('li'));
    varer.sort(function(a, b) {
      return a.querySelector('.vare-tekst').textContent.trim()
        .localeCompare(b.querySelector('.vare-tekst').textContent.trim(), 'no');
    });
    varer.forEach(function(v) { liste.appendChild(v); });
  }

  // ==============================
  // TELLER
  // ==============================
  function oppdaterTeller() {
    var alleLi   = document.querySelectorAll('ul li');
    var alle     = alleLi.length;
    var handlede = 0;
    alleLi.forEach(function(li) { if (li.querySelector('.sjekk.huket')) handlede++; });
    document.getElementById('teller-tekst').textContent =
      (alle - handlede) + ' gjenstår · ' + handlede + ' handlet · ' + alle + ' totalt';

    // Tom-tilstand: vis vennlig plassholder når listen er helt tom, og skjul
    // teller-linja (0/0/0 er meningsløst) – ryddigere topp på en tom liste.
    var tomEl = document.getElementById('liste-tom');
    if (tomEl) tomEl.style.display = (alle === 0) ? 'block' : 'none';
    var tellerBar = document.querySelector('.teller-bar');
    if (tellerBar) tellerBar.style.display = (alle === 0) ? 'none' : '';

    // Per-kategori-teller: viser antall ikke-handlede varer som del av kategori-tittelen
    // (f.eks. "🥩 Kjøtt (3)"). Slik at man ser hva som er igjen selv når kategorien
    // er kollapset.
    katIder.forEach(function(id) {
      var ul = document.getElementById(id);
      if (!ul) return;
      var header = document.getElementById(id + '-header');
      if (!header) return;
      // Husker det originale tittel-navnet første gang funksjonen kjører
      if (!header.dataset.basenavn) {
        header.dataset.basenavn = header.textContent.trim();
      }
      var baseNavn = header.dataset.basenavn;
      var liElems = ul.querySelectorAll('li');
      var total = liElems.length;
      var igjen = 0;
      liElems.forEach(function(li) { if (!li.querySelector('.sjekk.huket')) igjen++; });
      if (total === 0) {
        header.textContent = baseNavn;
      } else if (igjen === 0) {
        header.textContent = baseNavn + ' (✓ ' + total + ')';
      } else if (igjen === total) {
        header.textContent = baseNavn + ' (' + total + ')';
      } else {
        header.textContent = baseNavn + ' (' + igjen + '/' + total + ')';
      }
    });
  }

  // ==============================
  // TØM HELE LISTEN
  // ==============================
  function tømHeleListen() {
    var lister = document.querySelectorAll('ul');
    var harVarer = false;
    lister.forEach(function(l) { if (l.children.length > 0) harVarer = true; });
    if (!harVarer) return;
    visBekreft('Er du sikker? Dette sletter alle varer fra listen.', function() {
      document.querySelectorAll('ul').forEach(function(l) { l.innerHTML = ''; });
      oppdaterTeller();
      oppdaterKategoriSynlighet();
      lagreAlt();
    });
  }

  // ==============================
  // SLETT HANDLEDE
  // ==============================
  function slettHandledeVarer() {
    var huket = Array.prototype.slice.call(document.querySelectorAll('ul li')).filter(function(li) {
      return li.querySelector('.sjekk.huket');
    });
    if (!huket.length) return;
    visBekreft('Slette ' + huket.length + ' handlede vare(r)?', function() {
      huket.forEach(function(li) { li.parentNode.removeChild(li); });
      oppdaterTeller();
      oppdaterKategoriSynlighet();
      lagreAlt();
    });
  }

  // ==============================
  // HUK AV / SLETT ENKELT VARE
  // ==============================
  var skjulModus = false;

  function hukAv(sjekk) {
    var vare = sjekk.parentElement;
    sjekk.classList.toggle('huket');
    sjekk.textContent = sjekk.classList.contains('huket') ? '✓' : '';
    vare.querySelector('.vare-tekst').classList.toggle('huket');
    if (skjulModus && sjekk.classList.contains('huket')) vare.classList.add('skjult');
    else vare.classList.remove('skjult');

    // Logg handlet vare til historikk
    if (sjekk.classList.contains('huket')) {
      var navn = vare.querySelector('.vare-tekst').textContent.trim();
      var kat  = vare.closest('ul') ? vare.closest('ul').id : 'diverse';
      loggHandlet(navn, kat);
    }

    oppdaterTeller();
    oppdaterKategoriSynlighet();
    lagreAlt();
  }

  function slettVare(knapp) {
    knapp.closest('li').parentNode.removeChild(knapp.closest('li'));
    oppdaterTeller();
    oppdaterKategoriSynlighet();
    lagreAlt();
  }

  function toggleSkjul() {
    skjulModus = !skjulModus;
    document.getElementById('bryter').classList.toggle('på', skjulModus);
    document.getElementById('skjul-tekst').textContent = skjulModus ? 'Vis handlede varer' : 'Skjul handlede varer';
    document.querySelectorAll('ul li').forEach(function(li) {
      if (li.querySelector('.sjekk.huket')) {
        if (skjulModus) li.classList.add('skjult'); else li.classList.remove('skjult');
      }
    });
    oppdaterKategoriSynlighet();
  }

  // ==============================
  // KATEGORI-GJENKJENNING
  // ==============================
  // Ordlister per listetype: auto-gjenkjenning matcher kun mot kategorier
  // som faktisk finnes i gjeldende listetype. Ukjente ord → null → Diverse.
  // Skriv ordene i entallsform: prefiks-treff dekker bøyninger
  // ('ballong' treffer 'ballonger') og suffiks-treff dekker sammensetninger
  // ('pølse' treffer 'grillpølse'). Ord under 4 tegn krever eksakt treff.
  var kategoriOrdlisterPerType = {
    mat: {
      fisk:        ['laks','torsk','sei','reke','scampi','ørret','makrell','sild','tunfisk','fisk','fiske','seifilet','hyse','kveite','steinbit','rødspette','brosme','akkar','blekksprut','krabbe','hummer','blåskjell','ansjos','klippfisk','røkelaks','gravlaks','sushi','kamskjell','breiflabb'],
      kjott:       ['kylling','biff','svin','kjøtt','kjøttdeig','pølse','bacon','skinke','ribbe','koteletter','lever','oksekjøtt','lammekjøtt','karbonader','medisterkaker','kjøttkaker','indrefilet','leverpostei','salami','spekeskinke','entrecôte','kalkun','vilt','hjort','elg','reinsdyr','fenalår','pinnekjøtt','spekepølse','svinekam','nakkekoteletter','chorizo','pepperoni','kebab','gyros'],
      meieri:      ['melk','smør','egg','rømme','fløte','yoghurt','ost','kvark','kesam','skyr','kremfløte','brunost','hvitost','jarlsberg','norvegia','gouda','brie','camembert','margarin','parmesan','mozzarella','feta','cheddar','snøfrisk','kremost','prim','biola','litago','sjokomelk','iskrem','fraiche','cottage'],
      frukt:       ['eple','banan','appelsin','sitron','lime','drue','jordbær','blåbær','bringebær','mango','ananas','melon','pære','plomme','kirsebær','avokado','tomat','agurk','brokkoli','blomkål','gulrot','paprika','løk','hvitløk','purre','spinat','salat','kål','mais','erter','bønner','sopp','squash','selleri','persille','basilikum','koriander','ingefær','chili','potet','søtpotet','reddik','nektarin','fersken','klementin','mandarin','kiwi','vannmelon','asparges','ruccola','grønnkål','rosenkål','sjalottløk','vårløk','rødløk','dadler','fiken','aprikos','frukt','bær'],
      brod:        ['brød','grovbrød','loff','baguette','ciabatta','rundstykke','bagel','knekkebrød','kneipp','pita','tortilla','lefse','wienerbrød','croissant','muffins','horn','polarbrød','bolle','skolebrød','toast','naan','focaccia','lompe','gjærbakst'],
      basis:       ['olje','olivenolje','solsikkeolje','salt','pepper','krydder','pasta','spaghetti','penne','fusilli','ris','mel','hvetemel','havregryn','sukker','melis','gjær','bakepulver','natron','vaniljesukker','sirup','hermetisk','buljong','kraft','saus','ketchup','majones','sennep','eddik','soya','honning','syltetøy','peanøttsmør','kaviar','nøtter','mandler','rosiner','sjokolade','kakao','kaffe','te','müsli','cornflakes','chips','popcorn','kjeks','potetgull','nudler','couscous','quinoa','bulgur','linser','kikerter','pesto','kokosmelk','tomatpure','tomatpuré','taco','granola'],
      husholdning: ['toalettpapir','dopapir','kjøkkenpapir','oppvask','oppvaskmiddel','vaskemiddel','tøymiddel','skyllemiddel','rengjøring','søppelpose','søppelsekk','plastpose','aluminiumsfolie','bakepapir','svamp','skurekost','tannkrem','tannbørste','sjampo','balsam','såpe','dusjsåpe','deodorant','barbering','tamponger','bind','bleier','stearinlys','batterier','lyspære','zalo','jif','klorin','serviett','folie','frysepose','matpapir','tørkerull','antibac']
    },
    arrangement: {
      drikke:  ['brus','cola','fanta','solo','sprite','øl','vin','champagne','prosecco','cider','saft','juice','eplemost','farris','vann','drikke','kaffe','te','isbiter','energidrikk','rusbrus','mineralvann','pepsi','urge','tonic','soda','iste','nektar','sider','akevitt','vodka','gin','whisky','likør','musserende','rødvin','hvitvin','lettøl','pils','alkoholfri','leskedrikk','smoothie'],
      festmat: ['pizza','grandiosa','pølse','hamburger','taco','grill','snitter','wraps','salat','kake','bløtkake','muffins','cupcake','gele','iskrem','pinnemat','spekemat','ostefat','kransekake','rundstykke','baguette','påsmurt','tapas','fingermat','kanapeer','spekefat','koldtbord','grillspyd','pai','quiche'],
      snacks:  ['chips','godteri','sjokolade','popcorn','nøtter','smågodt','twist','kjeks','dip','saltstenger','ostepop','skumgodt','lakris','seigmenn','potetgull','snacks','kvikklunsj','smash','marshmallows','vingummi','karamell','drops','pastiller','tyggegummi','popkorn'],
      pynt:    ['ballong','serviett','duk','pynt','konfetti','engangs','sugerør','kopper','tallerken','bestikk','gave','gavepapir','bånd','flagg','girlander','kakefat','telys','lys','invitasjon','duker','pappkrus','plastglass','bordkort','partyhatt','pinata','serpentiner','glitter','fakkel']
    },
    hus: {
      rengjoring: ['vaskemiddel','såpe','klut','mopp','bøtte','svamp','zalo','jif','klorin','omo','milo','comfort','tørkepapir','søppelpose','oppvask','støvsuger','rengjøring','kalkfjerner','vindusspray','grønnsåpe','toalettpapir','kjøkkenpapir','vask','salmiakk','toalett','støv','tøymykner','antibac','mikrofiber','avløpsåpner','rens'],
      interior:   ['pute','lysestake','ramme','bilde','vase','teppe','gardin','lampe','duk','dekorasjon','stearinlys','pledd','speil','sengetøy','håndkle','dyne','laken','kurv','oppbevaring','telys','dynetrekk','håndklær','duftlys','duftpinner','skål','mugge','karaffel','servise','glass','bestikk','gryte','stekepanne','panne','kjele','bakeform','ildfast','knagg','hylle','rye','lysslynge'],
      hage:       ['blomst','plante','jord','frø','gjødsel','potte','hageslange','gress','busk','hekk','spade','rive','trillebår','plen','krukke','blomsterløk','såjord','hage','ugress','sekatør','grill','grillkull','tennvæske','parasoll','utemøbler']
    },
    bygg: {
      verktoy:     ['hammer','sag','drill','skrutrekker','vater','målebånd','tang','kniv','bits','bor','slipemaskin','stige','meisel','skiftenøkkel','sekskantnøkkel','verktøy','høvel','batteridrill','sirkelsag','stikksag','baufil','slegge','kubein','brekkjern','vinkelsliper','skralle','pipenøkkel','momentnøkkel','hansker','vernebriller','hørselvern','skrumaskin'],
      materialer:  ['planke','plate','gips','isolasjon','list','lekt','kryssfiner','betong','sement','rør','terrassebord','panel','mdf','osb','fliser','trevirke','impregnert','finer','limtre','stolpe','bjelke','takstein','murstein','mørtel','armering','lecablokk','glava','rockwool','membran','vindsperre','dampsperre','rekkverk'],
      festemidler: ['skrue','spiker','plugg','bolt','mutter','beslag','vinkel','lim','teip','tape','strips','stift','krok','hengsle','festemasse','gjengestang','skive','monteringslim','trelim','kontaktlim','kramper'],
      maling:      ['maling','beis','lakk','sparkel','grunning','pensel','malerull','maskeringsteip','spirit','fugemasse','silikon','primer','malingsfjerner','terpentin','maskering','rulleskaft','malingsrull']
    },
    diverse: {}
  };

  // Mapping fra mat-kategorier til typens kategorier, slik at hele
  // matvokabularet (ordlister + autofullfør) gjenbrukes uten duplisering:
  // 'Bananer' i en arrangementsliste → frukt → 🍽️ Mat.
  // Typer uten mapping (bygg, diverse) sender ukjente matvarer til Diverse.
  var matKategoriMapping = {
    arrangement: { kjott:'festmat', fisk:'festmat', meieri:'festmat', frukt:'festmat', brod:'festmat', basis:'festmat', husholdning:'diverse' },
    hus:         { husholdning:'rengjoring' }
  };

  // Splitter et varenavn i ord (små bokstaver; norske tegn og vanlige
  // aksenter beholdes så 'entrecôte' forblir ett ord og ikke splittes
  // til 'entrec'+'te' med falskt te-treff)
  function ordINavn(navn) {
    return (navn || '').toLowerCase().split(/[^a-zæøåäöüéèêôàç]+/).filter(function(o) { return o.length > 0; });
  }

  // Scorer ett ordliste-ord mot varenavnets ord. Høyere score = bedre treff.
  // - Eksakt ordtreff: alltid lov, får stor bonus så det vinner over alt annet
  // - Prefiks ('ballong' → 'ballonger') og suffiks ('pølse' → 'grillpølse'):
  //   kun for ordliste-ord på 4+ tegn, så 'te' aldri treffer 'poTEtgull'
  // - Lengre ordliste-ord vinner over kortere ('potetgull' slår 'potet')
  function ordTreff(dictOrd, navnOrd) {
    for (var i = 0; i < navnOrd.length; i++) {
      var w = navnOrd[i];
      if (w === dictOrd) return dictOrd.length + 100;
      if (dictOrd.length >= 4) {
        if (w.indexOf(dictOrd) === 0) return dictOrd.length;
        if (w.length > dictOrd.length && w.lastIndexOf(dictOrd) === w.length - dictOrd.length) return dictOrd.length;
      }
    }
    return 0;
  }

  // Finner beste kategori i et sett ordlister, eller null.
  function finnKategoriITabell(navnOrd, ordlister) {
    var besteKat = null, besteScore = 0;
    for (var kat in ordlister) {
      var ord = ordlister[kat];
      for (var i = 0; i < ord.length; i++) {
        var s = ordTreff(ord[i], navnOrd);
        if (s > besteScore) { besteScore = s; besteKat = kat; }
      }
    }
    return besteKat;
  }

  function finnKategori(navn) {
    var navnOrd = ordINavn(navn);
    if (navnOrd.length === 0) return null;

    // 1) Typens egne ordlister har høyest prioritet
    //    ('chips' → Snacks i arrangement, selv om det også er mat-basis)
    var ordlister = kategoriOrdlisterPerType[aktivListeType] || kategoriOrdlisterPerType.mat;
    var treff = finnKategoriITabell(navnOrd, ordlister);
    if (treff) return treff;

    // 2) Gjenbruk matvokabularet via typens mapping
    var mapping = matKategoriMapping[aktivListeType];
    if (mapping) {
      var gyldige = aktiveKategoriIder();
      var matTreff = finnKategoriITabell(navnOrd, kategoriOrdlisterPerType.mat);
      if (matTreff && mapping[matTreff] && gyldige.indexOf(mapping[matTreff]) !== -1) {
        return mapping[matTreff];
      }
      // 2b) Autofullfør-listen har fulle varenavn med mat-kategori - sjekk
      //     eksakt navnetreff der også ('Hermetiske tomater' → basis → Mat)
      var lNavn = (navn || '').toLowerCase().trim();
      for (var i = 0; i < ordliste.length; i++) {
        if (ordliste[i].navn.toLowerCase() === lNavn) {
          var m = mapping[ordliste[i].kat];
          if (m && gyldige.indexOf(m) !== -1) return m;
        }
      }
    }
    return null;
  }

  // Lært kategori for et varenavn i gjeldende kontekst+gruppe. Varig minne -
  // ingen tidsutløp, så sesongvarer huskes til neste sesong. Nye signaler
  // overstyrer gamle:
  // - Manuell flytting (🔁) er et bevisst valg → lærer umiddelbart
  // - Avhukinger lærer når de TO siste er i samme kategori (konsistens),
  //   så en enkelt feilplassering ikke lærer appen noe galt
  // Kategorien må fortsatt finnes i listen (slettede egne kategorier ignoreres).
  function lærtKategoriFor(navn) {
    var gruppe = historikkNøkkel();
    var gruppeData = handleHistorikk[gruppe] || {};
    var oppføringer = gruppeData[(navn || '').trim().toLowerCase()];
    if (!oppføringer || !oppføringer.length) return null;

    var kat = null;
    var siste = oppføringer[oppføringer.length - 1];
    if (siste.manuell) {
      kat = siste.kat;
    } else if (oppføringer.length >= 2) {
      var nestSiste = oppføringer[oppføringer.length - 2];
      if (siste.kat && siste.kat === nestSiste.kat) kat = siste.kat;
    }
    return (kat && aktiveKategoriIder().indexOf(kat) !== -1) ? kat : null;
  }

  // Hovedinngangen for kategori-forslag: lært kategori vinner over ordlistene.
  function foreslåKategoriForNavn(navn) {
    return lærtKategoriFor(navn) || finnKategori(navn);
  }

  // ==============================
  // FISK/KJØTT-MIGRASJON
  // Gamle data har fisk-varer lagret i 'kjott'-kategorien. Disse må flyttes til
  // den nye 'fisk'-kategorien. Funksjonene under brukes både ved oppstart (på
  // alle localStorage-nøkler) og i Firebase-listenere (på data fra sky).
  // ==============================
  function erFiskeNavn(navn) {
    var navnOrd = ordINavn(navn);
    var fiskOrd = kategoriOrdlisterPerType.mat.fisk;
    for (var i = 0; i < fiskOrd.length; i++) {
      if (ordTreff(fiskOrd[i], navnOrd) > 0) return true;
    }
    return false;
  }

  function migrerVarerData(data) {
    // data har form { kjott: [...], fisk: [...], meieri: [...], ... }
    if (!data || !data.kjott || !Array.isArray(data.kjott)) return data;
    var beholdes = [];
    var flyttes = Array.isArray(data.fisk) ? data.fisk.slice() : [];
    var endret = false;
    data.kjott.forEach(function(vare) {
      if (vare && erFiskeNavn(vare.navn)) { flyttes.push(vare); endret = true; }
      else beholdes.push(vare);
    });
    if (endret) {
      data.kjott = beholdes;
      data.fisk  = flyttes;
    }
    return data;
  }

  function migrerBasisData(arr) {
    // arr har form [{ navn, kategori, ... }, ...]
    if (!Array.isArray(arr)) return arr;
    arr.forEach(function(item) {
      if (item && item.kategori === 'kjott' && erFiskeNavn(item.navn)) {
        item.kategori = 'fisk';
      }
    });
    return arr;
  }

  function migrerFiskFraKjott() {
    // Engangs-migrering ved oppstart for alle lagrede lister i localStorage.
    if (localStorage.getItem('matplan-fisk-migrert') === '1') return;
    var nokler = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && (k.indexOf('matplan-varer-') === 0 || k.indexOf('matplan-basis-') === 0)) {
        nokler.push(k);
      }
    }
    nokler.forEach(function(nokkel) {
      try {
        var raa = localStorage.getItem(nokkel);
        if (!raa) return;
        var data = JSON.parse(raa);
        if (nokkel.indexOf('matplan-varer-') === 0) {
          migrerVarerData(data);
        } else {
          migrerBasisData(data);
        }
        localStorage.setItem(nokkel, JSON.stringify(data));
      } catch (e) { /* hopper over ugyldig data */ }
    });
    localStorage.setItem('matplan-fisk-migrert', '1');
  }

  function foreslåKategori(navn) {
    if (navn.trim().length < 2) { skjulHint(); return; }
    var forslag = foreslåKategoriForNavn(navn);
    if (forslag) {
      document.getElementById('velg-kategori').value = forslag;
      visHint(forslag);
    } else {
      document.getElementById('velg-kategori').value = 'diverse';
      skjulHint();
    }
  }

  function visHint(kategori) {
    var hint = document.getElementById('kategori-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'kategori-hint';
      hint.style.cssText = 'font-size:12px;color:var(--green-dk);margin-bottom:10px;padding:6px 14px;background:var(--green-lt);border-radius:20px;border:1px solid var(--green-bd);';
      var boks = document.querySelector('.legg-til-boks');
      boks.parentNode.insertBefore(hint, boks.nextSibling);
    }
    hint.textContent = '💡 Foreslår: ' + katNavn(kategori) + ' – endre i nedtrekksmenyen om ønskelig';
    hint.style.display = 'block';
  }

  function skjulHint() {
    var hint = document.getElementById('kategori-hint');
    if (hint) hint.style.display = 'none';
  }

  // ==============================
  // LEGG TIL VARE
  // ==============================
  // Kjente norske enheter for parsing av input som "2l melk", "40g rosiner".
  // Inkluderer både korte og lange former samt vanlige variasjoner.
  // Hekto (= 100 g) er også med – konverteres til gram av byggResultat.
  var KJENTE_ENHETER = [
    'liter','l',
    'desiliter','dl',
    'milliliter','ml',
    'kilogram','kilo','kg',
    'hektogram','hekto','hg',
    'gram','g',
    'stk','stykk','stykker',
    'pk','pakke','pakker',
    'pose','poser',
    'boks','bokser',
    'flaske','flasker'
  ];

  function normaliserEnhet(raw) {
    var r = (raw || '').toLowerCase();
    if (r === 'liter' || r === 'l') return 'liter';
    if (r === 'desiliter' || r === 'dl') return 'dl';
    if (r === 'milliliter' || r === 'ml') return 'ml';
    if (r === 'kilogram' || r === 'kilo' || r === 'kg') return 'kg';
    if (r === 'gram' || r === 'g') return 'g';
    if (r === 'stykk' || r === 'stykker' || r === 'stk') return 'stk';
    if (r === 'pakke' || r === 'pakker' || r === 'pk') return 'pk';
    if (r === 'poser') return 'pose';
    if (r === 'bokser') return 'boks';
    if (r === 'flasker') return 'flaske';
    return r;
  }

  // Bygger det endelige parse-resultatet. Sjekker at navnet ikke er en enhet
  // (defensiv mot input som '2kg' alene), og konverterer 'hekto' til gram
  // (1 hekto = 100 g).
  function byggResultat(navn, antall, enhetRaw) {
    if (!navn) return null;
    if (KJENTE_ENHETER.indexOf(navn.toLowerCase()) !== -1) return null;
    var r = (enhetRaw || '').toLowerCase();
    var finalAntall = antall;
    var enhet;
    if (r === 'hekto' || r === 'hektogram' || r === 'hg') {
      // 1 hekto = 100 g, ganger opp og setter enhet til gram
      finalAntall = Math.round(antall * 100 * 10) / 10;
      enhet = 'g';
    } else if (r === '') {
      enhet = 'stk';
    } else {
      enhet = normaliserEnhet(r);
    }
    return { navn: kapitaliser(navn), antall: finalAntall, enhet: enhet };
  }

  function kapitaliser(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Parser inputstrenger som "2l melk", "40g rosiner", "8stk meloner",
  // "0,5l krem", "Melk 2l". Returnerer { navn, antall, enhet } eller null.
  function parseMengdeFraNavn(tekst) {
    var t = (tekst || '').trim();
    if (!t) return null;

    // Mønster A: <tall>[enhet] <navn>  (f.eks. "2l melk", "8 meloner", "40g rosiner")
    var m = t.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (m && m[2]) {
      var antall = parseFloat(m[1].replace(',', '.'));
      var rest = m[2].trim();
      var enhetRaw = '';
      var navn = rest;
      var spaceIdx = rest.indexOf(' ');
      if (spaceIdx > 0) {
        var førsteOrd = rest.substring(0, spaceIdx).toLowerCase();
        if (KJENTE_ENHETER.indexOf(førsteOrd) !== -1) {
          enhetRaw = førsteOrd;
          navn = rest.substring(spaceIdx + 1).trim();
        }
      } else {
        // Ingen mellomrom – kan være "2lmelk" (enhet rett etter tall) eller "8meloner" (ingen enhet)
        for (var i = 0; i < KJENTE_ENHETER.length; i++) {
          var u = KJENTE_ENHETER[i];
          var rl = rest.toLowerCase();
          if (rl.indexOf(u) === 0 && rl.length > u.length) {
            enhetRaw = u;
            navn = rest.substring(u.length).trim();
            break;
          }
        }
      }
      var res = byggResultat(navn, antall, enhetRaw);
      if (res) return res;
    }

    // Mønster B: <navn> <tall><enhet>  (f.eks. "Melk 2l", "Rosiner 40g")
    var m2 = t.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-ZøæåØÆÅ]*)$/);
    if (m2) {
      var navn2 = m2[1].trim();
      var antall2 = parseFloat(m2[2].replace(',', '.'));
      var enhetRaw2 = m2[3].toLowerCase();
      if (enhetRaw2 === '' || KJENTE_ENHETER.indexOf(enhetRaw2) !== -1) {
        var res2 = byggResultat(navn2, antall2, enhetRaw2);
        if (res2) return res2;
      }
    }

    return null;
  }

  // Tømmer skrivefeltene etter at en vare er lagt til / håndtert.
  // Rører IKKE duplikat-advarselen – den styres eksplisitt av kalleren slik at
  // en bekreftelses-/varselmelding kan bli stående.
  function tømVareFelt() {
    var input = document.getElementById('ny-vare');
    input.value = '';
    document.getElementById('ny-antall').value = '';
    document.getElementById('ny-enhet').selectedIndex = 0;
    input.classList.remove('duplikat-felt');
  }

  // Viser en melding i feltet over skrivelinja. variant 'info' = grønn
  // bekreftelse, ellers rød advarsel.
  function visVareMelding(html, variant) {
    var el = document.getElementById('duplikat-advarsel');
    el.innerHTML = html;
    el.classList.toggle('info', variant === 'info');
    el.classList.add('synlig');
  }

  function leggTilVare() {
    var input = document.getElementById('ny-vare');
    var raaTekst = input.value.trim();
    if (!raaTekst) return;

    var navn, antall, enhet;
    // Forsøk å trekke ut mengde + enhet fra navnefeltet (f.eks. "2l melk")
    var parsed = parseMengdeFraNavn(raaTekst);
    if (parsed) {
      navn = parsed.navn;
      antall = String(parsed.antall);
      enhet = parsed.enhet;
    } else {
      navn = kapitaliser(raaTekst);
      antall = document.getElementById('ny-antall').value.trim();
      enhet = document.getElementById('ny-enhet').value;
    }

    // DUPLIKAT-HÅNDTERING (eksakt samme navn finnes allerede):
    // - Ligger varen avhuket (handlet)? Sett den tilbake som «ikke handlet»
    //   i stedet for å duplisere. Vekker en avhuket framfor å lage dublett.
    // - Ligger den aktiv? Tillat dobbeltføring, men varsle brukeren.
    var navnLower = navn.trim().toLowerCase();
    var eksisterende = [];
    document.querySelectorAll('.vare-tekst').forEach(function(el) {
      if (el.textContent.trim().toLowerCase() === navnLower) {
        eksisterende.push(el.closest('li'));
      }
    });
    var dobbeltVarsel = false;
    if (eksisterende.length > 0) {
      var avhuket = eksisterende.find(function(li) {
        var s = li.querySelector('.sjekk');
        return s && s.classList.contains('huket');
      });
      if (avhuket) {
        // hukAv toggler av (oppdaterer teller, synlighet og lagrer)
        hukAv(avhuket.querySelector('.sjekk'));
        tømVareFelt();
        skjulHint();
        visVareMelding('↩️ <strong>' + navn + '</strong> lå avhuket – satt tilbake som «ikke handlet».', 'info');
        input.focus();
        return;
      }
      // Alle treff er aktive → vi dobbeltfører, men flagger varsel under.
      dobbeltVarsel = true;
    }

    // Hvis parsing endret navnet, sørg for at kategorien oppdateres på det rene navnet
    var kategori = document.getElementById('velg-kategori').value;
    if (parsed) {
      var nyKat = foreslåKategoriForNavn(navn);
      if (nyKat) kategori = nyKat;
    }

    // Defensiv: kategorien må finnes i gjeldende listetype. Kan mangle hvis
    // f.eks. et autofullfør-forslag bærer en kat fra en annen type. Prøv
    // gjenkjenning mot typens ordliste først, fall så til Diverse.
    if (!kategori || !document.getElementById(kategori)) {
      kategori = finnKategori(navn) || 'diverse';
      if (!document.getElementById(kategori)) kategori = 'diverse';
    }

    document.getElementById(kategori).appendChild(lagVareElement(navn, antall, enhet));
    tømVareFelt();
    if (dobbeltVarsel) {
      visVareMelding('⚠️ <strong>' + navn + '</strong> lå allerede på listen – la den til på nytt.');
    } else {
      document.getElementById('duplikat-advarsel').classList.remove('synlig');
    }
    skjulHint();
    oppdaterTeller();
    oppdaterKategoriSynlighet();
    // Behold skjul-modus – skjul handlede varer igjen hvis aktivert
    if (skjulModus) {
      document.querySelectorAll('ul li').forEach(function(li) {
        if (li.querySelector('.sjekk.huket')) li.classList.add('skjult');
      });
    }
    lagreAlt();
    input.focus();
  }

  // Enter-tast håndteres av håndterAutoTast()

  // ==============================
  // DUPLIKAT-SJEKK
  // ==============================
  // Levenshtein-distanse: antall tegn-endringer (innsetting, sletting, erstatning)
  // som skal til for å gjøre a om til b. Brukes til å oppdage typo-er og bøyninger.
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var prev = [];
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var curr = [i];
      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = curr;
    }
    return prev[b.length];
  }

  // Returnerer true hvis to ord er "like nok" til å foreslås som duplikat.
  // Begge må være 5+ tegn (kortere gir for mange falske positive).
  // Tillater 2 endringer for 5–9 tegn, 3 for 10+ tegn.
  function erLignende(a, b) {
    if (a.length < 5 || b.length < 5) return false;
    if (Math.abs(a.length - b.length) > 3) return false;
    var d = levenshtein(a, b);
    if (d === 0) return false;
    var grense = Math.max(a.length, b.length) >= 10 ? 3 : 2;
    return d <= grense;
  }

  function sjekkDuplikat(input) {
    var tekst    = input.value.trim().toLowerCase();
    var advarsel = document.getElementById('duplikat-advarsel');
    // Nullstill grønn bekreftelse fra forrige innlegging når brukeren skriver
    advarsel.classList.remove('info');
    if (tekst.length < 2) { advarsel.classList.remove('synlig'); input.classList.remove('duplikat-felt'); return; }
    // Hvilken kategori hører teksten til? 'diverse' = ukjent (typo eller uvanlig vare).
    // For ukjente ord tillater vi lignende-match for å fange typo-er.
    // For kjente ord krever vi samme kategori, slik at 'Mel' (basis) og 'Melk' (meieri)
    // ikke trigger varsel selv om de matcher som substring.
    var typedKat = finnKategori(tekst) || 'diverse';
    var eksakt = null, delvis = null;
    document.querySelectorAll('.vare-tekst').forEach(function(el) {
      var n = el.textContent.trim(), l = n.toLowerCase();
      if (l === tekst) { eksakt = n; return; }
      if (delvis) return;
      var ul = el.closest('ul');
      var listKat = ul ? ul.id : null;
      var sammeKategori = !listKat || typedKat === 'diverse' || typedKat === listKat;
      if (!sammeKategori) return;
      // Substring kun når det BRUKEREN skriver inneholder hele den eksisterende
      // varen (f.eks. 'Kjøttdeig 500g' når 'Kjøttdeig' ligger der). Vi gjør IKKE
      // motsatt retning, fordi det fyrer feilaktig under prefiks-skriving
      // (f.eks. 'kjøtt' fanger 'Kjøttdeig' selv om man er på vei mot 'Kjøttboller').
      // Levenshtein fanger fortsatt typo-er (Kjøtdeig→Kjøttdeig) og bøyninger
      // (Fiskekaker→Fiskekakene).
      if (tekst.length >= l.length && tekst.indexOf(l) !== -1) delvis = n;
      else if (erLignende(l, tekst)) delvis = n;
    });
    if (eksakt) {
      advarsel.innerHTML = '⚠️ <strong>' + eksakt + '</strong> er allerede på listen.';
      advarsel.classList.add('synlig'); input.classList.add('duplikat-felt');
    } else if (delvis) {
      advarsel.innerHTML = '💡 Du har <strong>' + delvis + '</strong> på listen – mente du det?';
      advarsel.classList.add('synlig'); input.classList.remove('duplikat-felt');
    } else {
      advarsel.classList.remove('synlig'); input.classList.remove('duplikat-felt');
    }
  }

  // ==============================
  // BASISLISTE
  // ==============================
  var basisVarer = [
    { navn:'Melk', kategori:'meieri' }, { navn:'Smør', kategori:'meieri' }, { navn:'Egg', kategori:'meieri' },
    { navn:'Grovbrød', kategori:'brod' }, { navn:'Gulrøtter', kategori:'frukt' }, { navn:'Bananer', kategori:'frukt' },
    { navn:'Kyllingfilet', kategori:'kjott' }, { navn:'Pasta', kategori:'basis' },
    { navn:'Hermetiske tomater', kategori:'basis' }, { navn:'Toalettpapir', kategori:'husholdning' }
  ];

  // Bygger HTML for enhets-options for basis-rediger-panel (samme enheter som hovedlisten)
  function basisEnhetOptions(valgt) {
    var enh = ['','stk','pk','kg','g','liter','dl','ml','pose','boks','flaske'];
    var html = '';
    for (var i = 0; i < enh.length; i++) {
      var label = enh[i] === '' ? '–' : enh[i];
      html += '<option value="' + enh[i] + '"' + (enh[i] === (valgt || '') ? ' selected' : '') + '>' + label + '</option>';
    }
    return html;
  }

  function tegnBasisListe() {
    var container = document.getElementById('basis-varer-liste');
    container.innerHTML = '';
    for (var i = 0; i < basisVarer.length; i++) {
      var vare = basisVarer[i];
      var div  = document.createElement('div');
      div.className = 'basis-vare';
      // Vis emoji for predefinerte kategorier, navnet for egne kategorier.
      // katEmoji er den globale tabellen og dekker alle listetypenes kategorier.
      var katEgen = egneKategorier.find(function(k) { return k.id === vare.kategori; });
      var katVis = katEmoji[vare.kategori] || (katEgen ? katEgen.navn : '');
      // Mengde-badge hvis satt
      var mengdeTekst = vare.antall ? (vare.antall + ' ' + (vare.enhet || 'stk')) : '';
      div.innerHTML =
        '<span class="basis-sjekk" onclick="toggleBasis(this)"></span>' +
        '<span class="basis-vare-navn">' + vare.navn + '</span>' +
        (mengdeTekst ? '<span class="basis-mengde-badge">' + mengdeTekst + '</span>' : '') +
        '<span class="basis-kat">' + katVis + '</span>' +
        '<button class="basis-notat-knapp" onclick="toggleBasisRediger(this)" title="Rediger mengde og merknad" aria-label="Rediger favoritt">✏️</button>' +
        '<button class="basis-slett" onclick="fjernFraBasis(' + i + ')" aria-label="Slett favoritt">×</button>' +
        (vare.merknad ? '<span class="basis-merknad-tekst">' + vare.merknad + '</span>' : '') +
        '<div class="basis-rediger-panel">' +
          '<div class="basis-rediger-rad">' +
            '<label>Mengde:</label>' +
            '<input type="number" class="bp-antall" min="0.1" step="0.1" placeholder="Ant." value="' + (vare.antall || '') + '">' +
            '<select class="bp-enhet">' + basisEnhetOptions(vare.enhet) + '</select>' +
          '</div>' +
          '<div class="basis-rediger-rad">' +
            '<label>Merknad:</label>' +
            '<input type="text" class="bp-merknad" placeholder="f.eks. lettmelk..." value="' + (vare.merknad || '') + '">' +
          '</div>' +
          '<button class="basis-rediger-lagre" onclick="lagreBasisRediger(this,' + i + ')">Lagre</button>' +
        '</div>';
      container.appendChild(div);
    }
    oppdaterBasisInfo();
  }

  function toggleBasisRediger(knapp) {
    var panel = knapp.closest('.basis-vare').querySelector('.basis-rediger-panel');
    // Lukk andre åpne basis-paneler først
    document.querySelectorAll('.basis-rediger-panel.synlig').forEach(function(p) {
      if (p !== panel) p.classList.remove('synlig');
    });
    panel.classList.toggle('synlig');
    if (panel.classList.contains('synlig')) {
      var inp = panel.querySelector('.bp-antall');
      if (inp) inp.focus();
    }
  }

  function lagreBasisRediger(knapp, i) {
    var panel = knapp.closest('.basis-rediger-panel');
    var antall = panel.querySelector('.bp-antall').value.trim();
    var enhet  = panel.querySelector('.bp-enhet').value;
    var merknad = panel.querySelector('.bp-merknad').value.trim();
    basisVarer[i].antall  = antall ? parseFloat(antall.replace(',', '.')) : '';
    basisVarer[i].enhet   = enhet || '';
    basisVarer[i].merknad = merknad;
    lagreAlt();
    tegnBasisListe();
  }

  // Bevart for bakoverkompatibilitet – brukes ikke lenger av ny rediger-panel,
  // men kan fortsatt være referert hvis noe gammelt kall finnes.
  function lagreBasisMerknad(input, i) {
    var verdi = input.value.trim();
    basisVarer[i].merknad = verdi;
    lagreAlt();
    tegnBasisListe();
  }

  function toggleBasis(boks) {
    boks.classList.toggle('valgt');
    boks.textContent = boks.classList.contains('valgt') ? '✓' : '';
    oppdaterBasisInfo();
  }

  function oppdaterBasisInfo() {
    var n = document.querySelectorAll('.basis-sjekk.valgt').length;
    document.getElementById('basis-info').textContent =
      n > 0 ? n + ' vare(r) klar til overføring' : 'Kryss av varene du trenger denne uken';
  }

  function toggleBasisliste() {
    toggleSidebar();
  }

  function leggTilBasisVare() {
    var input = document.getElementById('ny-basis-vare');
    var raaTekst = input.value.trim();
    if (!raaTekst) return;
    var navn, antall = '', enhet = '', kategori;
    // Smart parsing: '2l melk' → Melk + 2 + liter (samme som hovedlisten)
    var parsed = parseMengdeFraNavn(raaTekst);
    if (parsed) {
      navn = parsed.navn;
      antall = parsed.antall;
      enhet = parsed.enhet;
      kategori = foreslåKategoriForNavn(navn) || document.getElementById('basis-kat-velg').value;
    } else {
      navn = raaTekst.charAt(0).toUpperCase() + raaTekst.slice(1);
      kategori = document.getElementById('basis-kat-velg').value;
    }
    basisVarer.push({ navn: navn, kategori: kategori, antall: antall, enhet: enhet });
    input.value = '';
    lagreAlt();
    tegnBasisListe();
  }

  document.getElementById('ny-basis-vare').addEventListener('keydown', function(e) { if (e.key === 'Enter') leggTilBasisVare(); });

  function håndterModalLagre() {
    if (redigerListeId) lagreRedigertListe();
    else lagreNyListe();
  }
  document.getElementById('modal-lagre-knapp').addEventListener('click', håndterModalLagre);
  document.getElementById('modal-avbryt-knapp').addEventListener('click', lukkNyListeModal);
  document.getElementById('ny-liste-navn').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') håndterModalLagre();
  });



  function fjernFraBasis(i) { basisVarer.splice(i, 1); lagreAlt(); tegnBasisListe(); }

  function overførTilHovedliste() {
    var avkryssede = document.querySelectorAll('.basis-sjekk.valgt');
    if (!avkryssede.length) { document.getElementById('basis-info').textContent = 'Ingen varer er krysset av.'; return; }
    var overført = 0, reaktivert = 0, finnes = [];
    var divs = document.querySelectorAll('.basis-vare');
    avkryssede.forEach(function(boks) {
      var vareDiv  = boks.closest('.basis-vare');
      var navn     = vareDiv.querySelector('.basis-vare-navn').textContent.trim();
      var indeks   = Array.prototype.indexOf.call(divs, vareDiv);
      var kategori = basisVarer[indeks] ? basisVarer[indeks].kategori : 'diverse';
      // Defensive: kategori-DOM må finnes. Hvis ikke (slettet egen kategori, ikke synket,
      // o.l.) faller vi tilbake til Diverse for å unngå krasj.
      if (!document.getElementById(kategori)) {
        loggFeil('Basis-overføring: kategori ' + kategori + ' finnes ikke i DOM, bruker diverse', 'overfør', '');
        kategori = 'diverse';
        if (basisVarer[indeks]) basisVarer[indeks].kategori = 'diverse';
      }
      var merknadFelt = vareDiv.querySelector('.basis-merknad-input');
      var basisMerknad = merknadFelt ? merknadFelt.value.trim() : '';
      var eksisterendeLi = null;
      document.querySelectorAll('ul li').forEach(function(li) {
        if (!eksisterendeLi && li.querySelector('.vare-tekst').textContent.trim().toLowerCase() === navn.toLowerCase()) eksisterendeLi = li;
      });
      // Hent mengde fra selve basisvaren (lagret antall/enhet)
      var basisAntall = basisVarer[indeks] ? basisVarer[indeks].antall : '';
      var basisEnhet  = basisVarer[indeks] ? basisVarer[indeks].enhet  : '';
      if (eksisterendeLi) {
        var erHuket = eksisterendeLi.querySelector('.sjekk.huket') ? true : false;
        if (basisMerknad || basisAntall) {
          // Eksisterer allerede – legg til en ny linje med dagens mengde/merknad
          var nyLiM = lagVareElement(navn, basisAntall || '', basisEnhet || '');
          if (basisMerknad) {
            var notatM = document.createElement('span'); notatM.className = 'notat-tekst'; notatM.textContent = basisMerknad;
            nyLiM.insertBefore(notatM, nyLiM.querySelector('.rediger-panel'));
          }
          document.getElementById(kategori).appendChild(nyLiM); overført++;
        } else if (erHuket) {
          var sjekk = eksisterendeLi.querySelector('.sjekk');
          sjekk.classList.remove('huket'); sjekk.textContent = '';
          eksisterendeLi.querySelector('.vare-tekst').classList.remove('huket');
          eksisterendeLi.classList.remove('skjult'); reaktivert++;
        } else { finnes.push(navn); }
      } else {
        var nyVare = lagVareElement(navn, basisAntall || '', basisEnhet || '');
        if (basisMerknad) {
          var notatSpan = document.createElement('span'); notatSpan.className = 'notat-tekst'; notatSpan.textContent = basisMerknad;
          nyVare.insertBefore(notatSpan, nyVare.querySelector('.rediger-panel'));
        }
        document.getElementById(kategori).appendChild(nyVare); overført++;
      }
      // Nullstill mengde + merknad i basisvaren etter overføring (per brukerens ønske)
      if (basisVarer[indeks]) {
        basisVarer[indeks].merknad = '';
        basisVarer[indeks].antall = '';
        basisVarer[indeks].enhet = '';
      }
      boks.classList.remove('valgt'); boks.textContent = '';
    });
    var melding = '';
    if (overført > 0)   melding += overført + ' vare(r) lagt til. ';
    if (reaktivert > 0) melding += reaktivert + ' vare(r) reaktivert. ';
    if (finnes.length)  melding += finnes.join(', ') + ' var allerede på listen.';
    document.getElementById('basis-info').textContent = melding;
    oppdaterTeller();
    oppdaterKategoriSynlighet();
    lagreAlt();
    // Re-render basislisten så nullstilte mengder/merknader reflekteres i UI
    tegnBasisListe();
  }

  // ==============================
  // FIREBASE LAGRING
  // ==============================
  var database = null;
  var erKoblet = false;

  function visKoblingStatus(koblet) {
    erKoblet = koblet;
    oppdaterSyncStatus();
  }

  function hentData() {
    var kategorier = aktiveKategoriIder();
    var data = {};
    kategorier.forEach(function(id) {
      var liste = document.getElementById(id);
      if (!liste) return;
      var varer = [];
      liste.querySelectorAll('li').forEach(function(li) {
        var badge   = li.querySelector('.mengde-badge');
        var notat   = li.querySelector('.notat-tekst');
        varer.push({
          navn:    li.querySelector('.vare-tekst').textContent.trim(),
          mengde:  badge ? badge.textContent.trim() : '',
          merknad: notat ? notat.textContent.trim() : '',
          huket:   li.querySelector('.sjekk.huket') ? true : false
        });
      });
      data[id] = varer;
    });
    return data;
  }

  // Genererer en stabil vare-id (Firebase-nøkkel ved per-vare-skriving, Fase 2).
  function nyVareId() {
    return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  // Normaliserer en kategoris varer til en array med id, uavhengig av om Firebase
  // ga gammelt array-format eller nytt {vareId:{...}}-format. Bevarer rekkefølge.
  function normaliserVarer(katData) {
    if (Array.isArray(katData)) {
      return katData.map(function(v, i) {
        v = v || {};
        return { id: v.id || nyVareId(), navn: v.navn, mengde: v.mengde, merknad: v.merknad, huket: !!v.huket, o: i };
      });
    }
    if (katData && typeof katData === 'object') {
      return Object.keys(katData).map(function(k) {
        var v = katData[k] || {};
        return { id: k, navn: v.navn, mengde: v.mengde, merknad: v.merknad, huket: !!v.huket, o: (typeof v.o === 'number' ? v.o : 0) };
      }).sort(function(a, b) { return a.o - b.o; });
    }
    return [];
  }

  function byggListeFraData(data) {
    var kategorier = aktiveKategoriIder();
    data = data || {};
    // Fase 1 (per-vare-sync): les begge lagringsformater. Normaliser hver
    // kategori til en array med stabil id, så resten av funksjonen er uendret.
    Object.keys(data).forEach(function(key) { data[key] = normaliserVarer(data[key]); });

    // Migrering: varer lagret i kategorier som ikke finnes i denne listetypen
    // (typisk etter typebytte) re-kategoriseres mot den nye typens ordlister.
    // 'Melk' går til Meieri i en matliste, 'Hammer' til Verktøy i en byggliste.
    // Det vi ikke gjenkjenner havner i Diverse. Persisteres ved neste lagreAlt.
    Object.keys(data).forEach(function(key) {
      if (kategorier.indexOf(key) === -1 && Array.isArray(data[key]) && data[key].length > 0) {
        data[key].forEach(function(v) {
          var mål = finnKategori((v && v.navn) || '') || 'diverse';
          if (kategorier.indexOf(mål) === -1) mål = 'diverse';
          data[mål] = data[mål] || [];
          data[mål].push(v);
        });
        delete data[key];
      }
    });

    // Ved typebytte: prøv også å løfte varer ut av Diverse - de ble typisk
    // dumpet dit av en tidligere migrering under feil type. Kjøres KUN når
    // typen faktisk er byttet, så varer brukeren selv har plassert i Diverse
    // ikke flyttes i vanlig bruk.
    if (reKategoriserDiverse && Array.isArray(data.diverse)) {
      var blirIDiverse = [];
      data.diverse.forEach(function(v) {
        var mål = finnKategori((v && v.navn) || '');
        if (mål && mål !== 'diverse' && kategorier.indexOf(mål) !== -1) {
          data[mål] = data[mål] || [];
          data[mål].push(v);
        } else {
          blirIDiverse.push(v);
        }
      });
      data.diverse = blirIDiverse;
    }

    kategorier.forEach(function(id) {
      var liste = document.getElementById(id);
      if (!liste) return;
      liste.innerHTML = '';
      var varer = data[id] || [];
      varer.forEach(function(v) {
        var deler  = v.mengde ? v.mengde.split(' ') : [];
        var antall = deler.length >= 2 ? deler[0] : '';
        var enhet  = deler.length >= 2 ? deler[1] : '';
        var li = lagVareElement(v.navn, antall, enhet);
        li.dataset.id = v.id; // stabil id for per-vare-skriving (Fase 2)
        if (v.merknad) {
          var notat = document.createElement('span'); notat.className = 'notat-tekst'; notat.textContent = v.merknad;
          li.insertBefore(notat, li.querySelector('.rediger-panel'));
        }
        if (v.huket) {
          var sjekk = li.querySelector('.sjekk');
          sjekk.classList.add('huket'); sjekk.textContent = '✓';
          li.querySelector('.vare-tekst').classList.add('huket');
          if (skjulModus) li.classList.add('skjult');
        }
        liste.appendChild(li);
      });
    });
    oppdaterTeller();
    oppdaterKategoriSynlighet();
  }

  // ==============================
  // OFFLINE KØ OG SYNCING
  // ==============================
  var offlineKø = [];
  var harUsynkedeEndringer = false;

  function lastInnOfflineKø() {
    var lagret = localStorage.getItem('matplan-offline-kø');
    if (lagret) offlineKø = JSON.parse(lagret);
  }

  function lagreOfflineKø() {
    localStorage.setItem('matplan-offline-kø', JSON.stringify(offlineKø));
  }

  function leggTilOfflineKø(type, data, kontekst, listeId) {
    // Erstatt tidligere oppføring for SAMME liste+type – bare siste versjon trengs.
    // (Køen kan nå holde endringer for flere lister samtidig, så vi matcher på
    // liste-identitet, ikke bare type.)
    offlineKø = offlineKø.filter(function(e) {
      return !(e.type === type && e.kontekst === kontekst && e.listeId === listeId);
    });
    offlineKø.push({ type: type, data: data, kontekst: kontekst, listeId: listeId, tid: Date.now() });
    harUsynkedeEndringer = true;
    lagreOfflineKø();
    oppdaterSyncStatus();
  }

  // Finnes det en usynket endring i køen for en bestemt liste+type?
  function ventendeForListe(type, kontekst, listeId) {
    return offlineKø.some(function(e) {
      return e.type === type && e.kontekst === kontekst && e.listeId === listeId;
    });
  }

  function tømOfflineKø() {
    offlineKø = [];
    harUsynkedeEndringer = false;
    localStorage.removeItem('matplan-offline-kø');
    oppdaterSyncStatus();
  }

  function syncOfflineKø() {
    if (!database || !erKoblet || offlineKø.length === 0 || !bruker) return;
    var kø = offlineKø.slice();
    kø.forEach(function(entry) {
      // Gamle oppføringer (fra før køen fikk liste-identitet) forkastes trygt –
      // bedre enn å gjette og skrive dem til feil liste.
      if (!entry.listeId) {
        offlineKø = offlineKø.filter(function(e) { return e !== entry; });
        lagreOfflineKø();
        oppdaterSyncStatus();
        return;
      }
      var substi = entry.type === 'basisliste' ? '/basis' : '/varer';
      database.ref(kontekstSti(entry.kontekst, 'lister/' + entry.listeId + substi)).set(entry.data).then(function() {
        offlineKø = offlineKø.filter(function(e) { return e !== entry; });
        lagreOfflineKø();
        oppdaterSyncStatus();
      }).catch(function(err) { loggFeil('Sync feilet: ' + err.message, 'firebase', ''); });
    });
  }

  function oppdaterSyncStatus() {
    var status = document.getElementById('kobling-status');
    if (!status) return;
    if (!erKoblet) {
      var antall = offlineKø.length;
      status.textContent = antall > 0
        ? '🔴 Frakoblet – ' + antall + ' endring(er) venter på sync'
        : '🔴 Frakoblet – endringer lagres lokalt';
      status.style.color = 'var(--red)';
      status.style.display = '';
    } else if (offlineKø.length > 0) {
      status.textContent = '🟡 Syncer...';
      status.style.color = 'var(--green-dk)';
      status.style.display = '';
    } else {
      // Alt er bra → ikke vis noe (en statusindikator skal varsle om problemer,
      // ikke konstant bekrefte normaltilstand). Rydder en linje fra toppen.
      status.style.display = 'none';
    }
  }

  function lagreAlt() {
    if (!aktivListeId) return;
    var data = hentData();

    // Alltid lagre lokalt først (per liste)
    localStorage.setItem('matplan-varer-' + aktivListeId, JSON.stringify(data));
    localStorage.setItem('matplan-basis-' + aktivListeId, JSON.stringify(basisVarer));
    // Dataen er nå lagret under gjeldende type - oppdater typemarkøren og
    // skru av typebytte-migreringen så manuelt plasserte Diverse-varer
    // ikke flyttes ved senere re-render i samme økt.
    localStorage.setItem('matplan-kattype-' + aktivListeId, aktivListeType);
    reKategoriserDiverse = false;
    // egneKategorier lagres til kontekst-spesifikk localStorage-nøkkel via
    // lagreEgneKategorier(). lagreAlt skriver derfor ikke dette her lenger.

    // VIKTIG (datatap-vern): ikke skriv hele lista til skyen før vi har lastet
    // ned skyens versjon av nettopp DENNE lista i denne økten. Ellers kan et
    // tomt/utdatert øyeblikksbilde – typisk rett etter åpning før nedlasting –
    // overskrive andres data i en delt husstand. Lokalt er alt allerede lagret.
    if (!aktivListeHydrert) return;

    var kontekst = aktivListeKontekst, listeId = aktivListeId;
    if (erKoblet && database && bruker) {
      database.ref(kontekstSti(kontekst, 'lister/' + listeId + '/varer')).set(data).catch(function(err) {
        leggTilOfflineKø('handleliste', data, kontekst, listeId);
        loggFeil('Firebase lagringsfeil: ' + err.message, 'firebase', '');
      });
      database.ref(kontekstSti(kontekst, 'lister/' + listeId + '/basis')).set(basisVarer).catch(function(err) {
        leggTilOfflineKø('basisliste', basisVarer, kontekst, listeId);
        loggFeil('Firebase basisliste-feil: ' + err.message, 'firebase', '');
      });
    } else {
      leggTilOfflineKø('handleliste', data, kontekst, listeId);
      leggTilOfflineKø('basisliste', basisVarer, kontekst, listeId);
    }

    // Oppdater lister-meta med ny vare-telling så forsiden hos andre medlemmer
    // får live oppdatering uten å måtte åpne listen først.
    oppdaterListekortTelling(data);
  }

  // Beregner antall varer og antall gjenstående basert på data (resultat av
  // hentData()). Hvis tallene har endret seg fra forrige lagring, oppdaterer
  // vi alleLister[idx] og skriver hele lister-meta-arrayet til Firebase.
  // Andre medlemmer plukker opp endringen via sin lister-meta-listener og
  // forside-kortet re-rendres med oppdaterte tall.
  function oppdaterListekortTelling(data) {
    if (!aktivListeId) return;
    var idx = -1;
    for (var i = 0; i < alleLister.length; i++) {
      if (alleLister[i].id === aktivListeId) { idx = i; break; }
    }
    if (idx === -1) return;

    var antallVarer = 0;
    var antallGjenstaar = 0;
    Object.keys(data).forEach(function(kat) {
      if (!Array.isArray(data[kat])) return;
      data[kat].forEach(function(v) {
        antallVarer++;
        if (!v.huket) antallGjenstaar++;
      });
    });

    // Skipp Firebase-skriving hvis ingenting har endret seg - reduserer trafikk
    // betraktelig når brukeren bare scroller eller åpner/lukker varer uten å
    // faktisk endre noe som påvirker tallet.
    if (alleLister[idx].antallVarer === antallVarer &&
        alleLister[idx].antallGjenstaar === antallGjenstaar) return;

    alleLister[idx].antallVarer = antallVarer;
    alleLister[idx].antallGjenstaar = antallGjenstaar;
    lagreLister();
  }

  function initFirebase() {
    try {
      var app = firebase.initializeApp({
        apiKey: "AIzaSyAc9X6ovcPQKnZyO_cTGIDVKNLvdYMx8PQ",
        authDomain: "matplan-42a33.web.app",
        databaseURL: "https://matplan-42a33-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "matplan-42a33",
        storageBucket: "matplan-42a33.firebasestorage.app",
        messagingSenderId: "429921532031",
        appId: "1:429921532031:web:9deb776dc6f9195e07674a"
      });
      database = firebase.database();

      // Lytt på tilkoblingsstatus
      database.ref('.info/connected').on('value', function(snap) {
        var koblet = snap.val() === true;
        visKoblingStatus(koblet);
        if (koblet && offlineKø.length > 0) {
          // Nett er tilbake – sync køen
          oppdaterSyncStatus();
          setTimeout(syncOfflineKø, 500);
        }
      });

      // Listenere for brukerdata (lister-meta + egne-kategorier) settes opp
      // i aktiverDataListenereForBruker() når en bruker er innlogget. Vi
      // trenger brukerens UID for å bygge riktig Firebase-path.

    } catch(err) { loggFeil('Firebase init-feil: ' + err.message, 'firebase', ''); visKoblingStatus(false); }
  }

  // Setter opp Firebase-listenere på bruker-scoped paths. Kalles én gang
  // etter at bruker er bekreftet innlogget via onAuthStateChanged.
  var brukerListenereAktive = false;

  // Tar lister-meta-data fra en gitt kontekst (personlig eller husstand-id) og
  // oppdaterer alleLister: fjerner gamle entries fra den kontekst, legger til de nye.
  function oppdaterListerForKontekst(kontekst, nyeData) {
    var nyeLister = [];
    if (Array.isArray(nyeData)) nyeLister = nyeData;
    else if (nyeData && typeof nyeData === 'object') nyeLister = Object.keys(nyeData).map(function(k) { return nyeData[k]; });
    // Filtrer ut eksisterende entries fra denne konteksten, legg deretter til nye
    alleLister = alleLister.filter(function(l) { return (l.kontekst || 'personlig') !== kontekst; });
    nyeLister.forEach(function(l) {
      alleLister.push(Object.assign({}, l, { kontekst: kontekst }));
    });
    localStorage.setItem('matplan-lister', JSON.stringify(alleLister));
    tegnForside();
  }

  function aktiverDataListenereForBruker() {
    if (!database || !bruker || brukerListenereAktive) return;
    brukerListenereAktive = true;

    // Lytt på brukerens personlige lister-meta
    database.ref(brukerSti('lister-meta')).on('value', function(snap) {
      if (offlineKø.length > 0) return;
      oppdaterListerForKontekst('personlig', snap.val());
    });

    // Lytt på brukerens personlige egne kategorier
    database.ref(brukerSti('egne-kategorier')).on('value', function(snap) {
      if (ignorerEgneKategorierEko) { ignorerEgneKategorierEko = false; return; }
      setEgneKategorierForKontekst('personlig', snap.val());
    });

    // Lytt på brukerens personlige handlehistorikk (lærte forslag)
    database.ref(brukerSti('historikk')).on('value', function(snap) {
      setHistorikkForKontekst('personlig', snap.val());
    });

    // Lytt på egendefinert visningsnavn. Oppdaterer profil-sirkelen og re-publiserer
    // navnet i alle husstander (dekker både navneendring og kapp-løp mot
    // husstand-lytteren ved innlogging).
    database.ref(brukerSti('profil/navn')).on('value', function(snap) {
      egetProfilNavn = snap.val() || null;
      tegnProfilSirkel();
      republiserAlleMedlemsnavn();
    });
  }

  // ==============================
  // AUTHENTICATION (Google Sign-In via Firebase Auth)
  // ==============================
  // Aktuell innlogget bruker (firebase.User-objekt) - null hvis ikke innlogget
  var bruker = null;

  // Brukerens egendefinerte visningsnavn (brukere/{uid}/profil/navn). Lastes ved
  // innlogging og overstyrer Google-navnet, slik at en navneendring er varig og
  // ikke blir skrevet over neste gang Google leverer displayName.
  var egetProfilNavn = null;
  function egetVisningsnavn() {
    if (egetProfilNavn && egetProfilNavn.trim()) return egetProfilNavn.trim();
    if (bruker) return bruker.displayName || bruker.email || '';
    return '';
  }

  // Returnerer Firebase-sti for nåværende bruker. Brukes overalt der vi tidligere
  // skrev til globale paths som 'lister-meta', 'lister/{id}', 'egne-kategorier'.
  // Eksempel: brukerSti('lister-meta') → 'brukere/abc123/lister-meta'
  function brukerSti(sub) {
    if (!bruker || !bruker.uid) return null;
    return 'brukere/' + bruker.uid + (sub ? '/' + sub : '');
  }

  // Returnerer Firebase-sti for en gitt liste-kontekst (personlig eller husstand).
  // kontekst === 'personlig' → brukerSti(sub)
  // kontekst === husstandId  → 'husstander/{hid}/' + sub
  function kontekstSti(kontekst, sub) {
    if (!kontekst || kontekst === 'personlig') {
      return brukerSti(sub);
    }
    return 'husstander/' + kontekst + (sub ? '/' + sub : '');
  }

  // ==============================
  // HUSSTAND (delt mellom medlemmer)
  // ==============================
  // Liste over husstander brukeren er medlem av: [{id, navn, medlemmer:{}, opprettetAv}, ...]
  var mineHusstander = [];

  // Genererer en 6-sifret invitasjonskode (000000-999999)
  function genererKode() {
    return ('' + Math.floor(100000 + Math.random() * 900000));
  }

  // Holder rede på hvilke husstander vi har lytter på, så vi kan detache når brukeren forlater
  var husstandListenereAktive = {}; // { husstandId: true }

  // Lytt på brukerens husstand-medlemskap. Henter detaljer for hver husstand
  // og setter opp lister-meta-lyttere per husstand.
  function aktiverHusstandListener() {
    if (!database || !bruker) return;
    database.ref(brukerSti('husstander')).on('value', function(snap) {
      var husstandIder = snap.val() || {};
      var ider = Object.keys(husstandIder);

      // 1. Oppdater mineHusstander UMIDDELBART for å fjerne husstander brukeren
      //    ikke lenger er med i (UI oppdateres med en gang).
      mineHusstander = mineHusstander.filter(function(h) { return husstandIder[h.id]; });
      tegnHusstandDropdown();
      tegnForside();

      // 2. Detach Firebase-lyttere for husstander brukeren ikke lenger er med i
      Object.keys(husstandListenereAktive).forEach(function(hid) {
        if (!husstandIder[hid]) {
          database.ref('husstander/' + hid + '/lister-meta').off();
          database.ref('husstander/' + hid + '/egne-kategorier').off();
          database.ref('husstander/' + hid + '/historikk').off();
          database.ref('husstander/' + hid + '/medlemmer').off();
          database.ref('husstander/' + hid + '/medlemsnavn').off();
          database.ref('husstander/' + hid + '/opprettetAv').off();
          delete husstandListenereAktive[hid];
          delete egneKategorierByKontekst[hid];
          delete handleHistorikkByKontekst[hid];
          localStorage.removeItem('matplan-egne-kategorier-' + hid);
          localStorage.removeItem('matplan-historikk-' + hid);
          oppdaterListerForKontekst(hid, null);
        }
      });

      if (ider.length === 0) return;

      // 3. Last detaljer for husstander vi ikke allerede har i mineHusstander
      var nyeIder = ider.filter(function(id) {
        return !mineHusstander.find(function(h) { return h.id === id; });
      });
      if (nyeIder.length === 0) return;

      Promise.all(nyeIder.map(function(id) {
        return database.ref('husstander/' + id).once('value').then(function(s) {
          var data = s.val();
          return data ? Object.assign({ id: id }, data) : null;
        });
      })).then(function(resultater) {
        resultater.filter(function(h) { return h !== null; }).forEach(function(h) {
          mineHusstander.push(h);
        });
        tegnHusstandDropdown();
        tegnForside();

        // Sett opp lyttere på hver husstands lister-meta + egne-kategorier
        mineHusstander.forEach(function(h) {
          if (!husstandListenereAktive[h.id]) {
            husstandListenereAktive[h.id] = true;
            database.ref('husstander/' + h.id + '/lister-meta').on('value', function(s2) {
              if (offlineKø.length > 0) return;
              oppdaterListerForKontekst(h.id, s2.val());
            });
            database.ref('husstander/' + h.id + '/egne-kategorier').on('value', function(s2) {
              setEgneKategorierForKontekst(h.id, s2.val());
            });
            database.ref('husstander/' + h.id + '/historikk').on('value', function(s2) {
              setHistorikkForKontekst(h.id, s2.val());
            });
            // Medlemmer: hold antall/modal ferskt + oppdag om DU er fjernet
            database.ref('husstander/' + h.id + '/medlemmer').on('value', function(s2) {
              håndterMedlemmerEndring(h.id, s2.val());
            });
            // Medlemsnavn: hold navnene i modalen oppdatert
            database.ref('husstander/' + h.id + '/medlemsnavn').on('value', function(s2) {
              var hh = mineHusstander.find(function(x) { return x.id === h.id; });
              if (hh) hh.medlemsnavn = s2.val() || {};
              if (aktivHusstandModalId === h.id && hh) tegnHusstandMedlemmer(hh);
            });
            // Eierskap: oppdater modalens eier-avhengige UI live ved eierskifte
            database.ref('husstander/' + h.id + '/opprettetAv').on('value', function(s2) {
              var hh = mineHusstander.find(function(x) { return x.id === h.id; });
              if (hh) hh.opprettetAv = s2.val();
              if (aktivHusstandModalId === h.id && hh) oppdaterHusstandModalEierUI(hh);
            });
            // Publiser eget visningsnavn så andre medlemmer ser navnet
            publiserMedlemsnavn(h.id);
          }
        });
      });
    });
  }

  function opprettNyHusstand(navn) {
    if (!database || !bruker || !navn) return Promise.reject(new Error('Mangler info'));
    var nyId = 'h-' + Date.now();
    var kode = genererKode();
    var data = {
      navn: navn,
      opprettetAv: bruker.uid,
      opprettet: Date.now(),
      medlemmer: {},
      kode: kode
    };
    data.medlemmer[bruker.uid] = true;
    // Skriv husstanden + legg til i brukerens husstander-liste + registrer kode
    return Promise.all([
      database.ref('husstander/' + nyId).set(data),
      database.ref(brukerSti('husstander/' + nyId)).set(true),
      database.ref('invitasjonskoder/' + kode).set({ husstandId: nyId })
    ]).then(function() { return nyId; });
  }

  // Antall millisekunder for 4 ukers angrefrist
  var FIRE_UKER_MS = 4 * 7 * 24 * 60 * 60 * 1000;

  function forlatHusstand(husstandId, somSiste, nyEierId) {
    if (!database || !bruker) return Promise.reject(new Error('Ikke innlogget'));
    if (somSiste) {
      // Siste medlem: marker husstanden som tom og fjern medlemskap.
      // Husstanden + alle lister bevares i 4 uker. Husstandens permanente
      // kode brukes som gjenopprettingskode (er allerede lagret i husstanden,
      // genereres ved opprettelse via opprettNyHusstand eller ved første kall
      // av genererInvitasjonskode for eldre husstander).
      var nu = Date.now();
      // Først: sørg for at husstanden HAR en kode (bakoverkompatibilitet)
      return genererInvitasjonskode(husstandId).then(function(kode) {
        return Promise.all([
          database.ref('husstander/' + husstandId + '/tomtSiden').set(nu),
          database.ref('husstander/' + husstandId + '/medlemmer/' + bruker.uid).remove(),
          database.ref('husstander/' + husstandId + '/medlemsnavn/' + bruker.uid).remove(),
          database.ref(brukerSti('husstander/' + husstandId)).remove()
        ]).then(function() { return kode; });
      });
    }
    // Normalt: fjern medlemskap (+ publisert navn). Husstand + data forblir for
    // andre medlemmer. Var jeg eier, overføres eierskapet til et gjenværende
    // medlem så husstanden aldri blir eierløs (samme hybrid-logikk som ved
    // kontosletting).
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    var oppdateringer = {};
    oppdateringer['husstander/' + husstandId + '/medlemmer/' + bruker.uid] = null;
    oppdateringer['husstander/' + husstandId + '/medlemsnavn/' + bruker.uid] = null;
    oppdateringer[brukerSti('husstander/' + husstandId)] = null;
    if (husstand && husstand.opprettetAv === bruker.uid) {
      var andre = Object.keys(husstand.medlemmer || {}).filter(function(m) {
        return m !== bruker.uid;
      });
      if (andre.length > 0) {
        // Bruk eierens valg hvis gyldig, ellers første gjenværende medlem.
        var valgtEier = (nyEierId && andre.indexOf(nyEierId) !== -1) ? nyEierId : andre[0];
        oppdateringer['husstander/' + husstandId + '/opprettetAv'] = valgtEier;
      }
    }
    return database.ref().update(oppdateringer);
  }

  function genererInvitasjonskode(husstandId) {
    if (!database || !bruker) return Promise.reject(new Error('Ikke innlogget'));
    // Returner husstandens permanente kode. Hvis husstanden ble opprettet før vi
    // begynte å lagre 'kode' på husstand-objektet, generer og lagre én nå
    // (bakoverkompatibilitet) - så vil samme kode vises ved alle senere kall.
    return database.ref('husstander/' + husstandId + '/kode').once('value').then(function(snap) {
      var eksisterende = snap.val();
      if (eksisterende) return eksisterende;
      var nyKode = genererKode();
      return Promise.all([
        database.ref('husstander/' + husstandId + '/kode').set(nyKode),
        database.ref('invitasjonskoder/' + nyKode).set({ husstandId: husstandId })
      ]).then(function() { return nyKode; });
    });
  }

  function bliMedIHusstand(kode) {
    if (!database || !bruker) return Promise.reject(new Error('Ikke innlogget'));
    return database.ref('invitasjonskoder/' + kode).once('value').then(function(snap) {
      var data = snap.val();
      if (!data) throw new Error('Ugyldig kode');
      var husstandId = data.husstandId;
      // Sjekk at husstanden eksisterer
      return database.ref('husstander/' + husstandId).once('value').then(function(hsnap) {
        if (!hsnap.exists()) throw new Error('Husstanden finnes ikke lenger');
        var husstand = hsnap.val();
        // Hvis husstanden har vært tom i mer enn 4 uker, er den utløpt
        if (husstand.tomtSiden && (husstand.tomtSiden + FIRE_UKER_MS) < Date.now()) {
          throw new Error('Husstanden er utløpt (over 4 uker uten medlemmer)');
        }
        // Legg bruker som medlem, registrer husstanden hos bruker, og rydd
        // tomtSiden hvis det var en gjenopprettingsfrist på gang.
        // NB: Koden består - den er permanent for denne husstanden.
        return Promise.all([
          database.ref('husstander/' + husstandId + '/medlemmer/' + bruker.uid).set(true),
          database.ref(brukerSti('husstander/' + husstandId)).set(true),
          database.ref('husstander/' + husstandId + '/tomtSiden').remove()
        ]);
      }).then(function() { return husstandId; });
    });
  }

  // ==============================
  // UI for husstand-handlinger
  // ==============================
  function tegnHusstandDropdown() {
    var container = document.getElementById('husstand-liste');
    if (!container) return;
    container.innerHTML = '';
    if (mineHusstander.length === 0) {
      var tom = document.createElement('div');
      tom.className = 'profil-husstand-tom';
      tom.textContent = 'Du er ikke i en husstand ennå.';
      container.appendChild(tom);
      return;
    }
    mineHusstander.forEach(function(h) {
      var rad = document.createElement('div');
      rad.className = 'profil-husstand-rad';
      rad.style.cursor = 'pointer';
      var antall = Object.keys(h.medlemmer || {}).length;
      // Hele raden åpner husstand-modalen (medlemmer, kode, eier, forlat samlet)
      rad.onclick = function() { åpneHusstandModal(h.id); };
      rad.innerHTML =
        '<span class="ikon">🏠</span>' +
        '<span class="navn">' + h.navn + ' <span style="color:var(--muted);font-weight:normal">(' + antall + ')</span></span>' +
        '<span class="handling" title="Åpne husstand" aria-hidden="true" style="font-size:18px">›</span>';
      container.appendChild(rad);
    });
  }

  function åpneOpprettHusstand() {
    lukkHusstandDropdown();
    document.getElementById('ny-husstand-navn').value = '';
    document.getElementById('opprett-husstand-overlay').classList.add('synlig');
    setTimeout(function() { document.getElementById('ny-husstand-navn').focus(); }, 100);
  }
  function lukkOpprettHusstand() {
    document.getElementById('opprett-husstand-overlay').classList.remove('synlig');
  }
  function bekreftOpprettHusstand() {
    var navn = document.getElementById('ny-husstand-navn').value.trim();
    if (!navn) {
      var inp = document.getElementById('ny-husstand-navn');
      inp.style.borderColor = 'var(--red)';
      inp.focus();
      setTimeout(function() { inp.style.borderColor = ''; }, 1500);
      return;
    }
    opprettNyHusstand(navn).then(function() {
      lukkOpprettHusstand();
    }).catch(function(err) {
      loggFeil('Opprett husstand: ' + err.message, 'husstand', '');
    });
  }

  function åpneBliMedHusstand() {
    lukkHusstandDropdown();
    document.getElementById('kode-input').value = '';
    document.getElementById('kode-feilmelding').textContent = '';
    document.getElementById('bli-med-husstand-overlay').classList.add('synlig');
    setTimeout(function() { document.getElementById('kode-input').focus(); }, 100);
  }
  function lukkBliMedHusstand() {
    document.getElementById('bli-med-husstand-overlay').classList.remove('synlig');
  }
  function bekreftBliMedHusstand() {
    var kode = document.getElementById('kode-input').value.trim();
    var feilEl = document.getElementById('kode-feilmelding');
    if (!/^\d{6}$/.test(kode)) {
      feilEl.textContent = 'Koden må være 6 sifre.';
      return;
    }
    feilEl.textContent = '';
    bliMedIHusstand(kode).then(function() {
      lukkBliMedHusstand();
    }).catch(function(err) {
      feilEl.textContent = err.message;
    });
  }

  // Holder hvilken husstand modalen jobber mot (bytt-kode, fjern medlem, forlat),
  // slik at handlingene vet hvilken husstand uten å parse fra DOM.
  var aktivHusstandModalId = null;

  function åpneHusstandModal(husstandId) {
    lukkHusstandDropdown();
    aktivHusstandModalId = husstandId;
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });

    // Tittel = husstandens navn
    var tittelEl = document.getElementById('husstand-modal-tittel');
    if (tittelEl) tittelEl.textContent = '🏠 ' + (husstand ? husstand.navn : 'Husstand');

    // Medlemsliste + eier-avhengig UI (bytt kode, eier-info, gjør-til-eier/fjern)
    oppdaterHusstandModalEierUI(husstand);

    var kodeEl = document.getElementById('invitasjonskode-vis');
    if (kodeEl) kodeEl.textContent = 'Genererer…';

    document.getElementById('invitasjonskode-overlay').classList.add('synlig');
    genererInvitasjonskode(husstandId).then(function(kode) {
      if (kodeEl) kodeEl.textContent = kode;
    }).catch(function(err) {
      if (kodeEl) kodeEl.textContent = 'Feilet';
      loggFeil('Generer kode: ' + err.message, 'husstand', '');
    });
  }

  // Oppdaterer de delene av husstand-modalen som avhenger av hvem som er eier:
  // medlemslisten (med gjør-til-eier/fjern-knapper), bytt-kode-knappen og
  // eier-infoteksten. Vises kun for den som er eier (opprettetAv). Kalles både
  // ved åpning og live når opprettetAv endres.
  function oppdaterHusstandModalEierUI(husstand) {
    var erEier = husstand && bruker && husstand.opprettetAv === bruker.uid;
    var byttKnapp = document.getElementById('invitasjonskode-bytt-knapp');
    var eierInfo = document.getElementById('invitasjonskode-eier-info');
    if (byttKnapp) byttKnapp.style.display = erEier ? '' : 'none';
    if (eierInfo) eierInfo.style.display = erEier ? '' : 'none';
    tegnHusstandMedlemmer(husstand);
  }

  function lukkHusstandModal() {
    document.getElementById('invitasjonskode-overlay').classList.remove('synlig');
    aktivHusstandModalId = null;
  }

  // Render medlemslisten i husstand-modalen. Navn hentes fra medlemsnavn (som
  // hvert medlem publiserer om seg selv); markerer "deg"/"eier" og gir eieren
  // en fjern-knapp på andre medlemmer. Bygges med DOM-noder + textContent slik
  // at navn aldri tolkes som HTML.
  function tegnHusstandMedlemmer(husstand) {
    var liste = document.getElementById('husstand-medlemmer-liste');
    if (!liste) return;
    liste.innerHTML = '';
    if (!husstand || !husstand.medlemmer || Object.keys(husstand.medlemmer).length === 0) {
      var tom = document.createElement('div');
      tom.className = 'husstand-medlem-tom';
      tom.textContent = 'Ingen medlemmer.';
      liste.appendChild(tom);
      return;
    }
    var navnMap = husstand.medlemsnavn || {};
    var minUid = bruker && bruker.uid;
    var erEier = bruker && husstand.opprettetAv === bruker.uid;

    Object.keys(husstand.medlemmer).forEach(function(uid) {
      var visningsnavn = navnMap[uid] ||
        (uid === minUid ? (egetVisningsnavn() || 'Deg') : 'Medlem');

      var rad = document.createElement('div');
      rad.className = 'husstand-medlem-rad';

      var avatar = document.createElement('span');
      avatar.className = 'husstand-medlem-avatar';
      avatar.textContent = (visningsnavn.trim()[0] || '?').toUpperCase();
      rad.appendChild(avatar);

      var navnEl = document.createElement('span');
      navnEl.className = 'husstand-medlem-navn';
      navnEl.textContent = visningsnavn;
      rad.appendChild(navnEl);

      if (uid === minUid) {
        var merkeDeg = document.createElement('span');
        merkeDeg.className = 'husstand-medlem-merke';
        merkeDeg.textContent = 'deg';
        rad.appendChild(merkeDeg);
      } else if (uid === husstand.opprettetAv) {
        var merkeEier = document.createElement('span');
        merkeEier.className = 'husstand-medlem-merke';
        merkeEier.textContent = 'eier';
        rad.appendChild(merkeEier);
      }

      // Eieren kan gjøre andre til eier eller fjerne dem (ikke seg selv –
      // egen utmelding går via "Forlat husstand").
      if (erEier && uid !== minUid) {
        var gjørEier = document.createElement('button');
        gjørEier.className = 'husstand-medlem-eier';
        gjørEier.title = 'Gjør til eier';
        gjørEier.setAttribute('aria-label', 'Gjør til eier');
        gjørEier.textContent = '⭐';
        gjørEier.onclick = function() { bekreftGjørTilEier(husstand.id, uid, visningsnavn); };
        rad.appendChild(gjørEier);

        var fjern = document.createElement('button');
        fjern.className = 'husstand-medlem-fjern';
        fjern.title = 'Fjern fra husstand';
        fjern.setAttribute('aria-label', 'Fjern fra husstand');
        fjern.textContent = '✕';
        fjern.onclick = function() { bekreftFjernMedlem(husstand.id, uid, visningsnavn); };
        rad.appendChild(fjern);
      }

      liste.appendChild(rad);
    });
  }

  function bekreftFjernMedlem(husstandId, uid, navn) {
    visBekreft(
      'Fjerne ' + navn + ' fra husstanden? De mister umiddelbart tilgang til ' +
      'husstandens lister. Hvis koden er lekket, bør du også bytte den etterpå.',
      function() { fjernMedlem(husstandId, uid); },
      'Ja, fjern'
    );
  }

  // Eieren fjerner et medlem: sletter medlemskap + publisert navn. Den fjernede
  // brukerens egen peker (brukere/{uid}/husstander/{hid}) kan vi ikke røre –
  // den klienten rydder seg selv via medlemmer-lytteren (håndterMedlemmerEndring).
  function fjernMedlem(husstandId, uid) {
    if (!database || !bruker) return;
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    if (!husstand || husstand.opprettetAv !== bruker.uid) {
      loggFeil('Fjern medlem nektet: ikke eier', 'husstand', '');
      return;
    }
    if (uid === bruker.uid) return; // egen utmelding går via Forlat husstand
    var oppdateringer = {};
    oppdateringer['husstander/' + husstandId + '/medlemmer/' + uid] = null;
    oppdateringer['husstander/' + husstandId + '/medlemsnavn/' + uid] = null;
    database.ref().update(oppdateringer).then(function() {
      // Oppdater lokal kopi + UI umiddelbart (lytteren bekrefter like etter)
      if (husstand.medlemmer) delete husstand.medlemmer[uid];
      if (husstand.medlemsnavn) delete husstand.medlemsnavn[uid];
      tegnHusstandMedlemmer(husstand);
      tegnHusstandDropdown();
    }).catch(function(err) {
      loggFeil('Fjern medlem: ' + err.message, 'husstand', '');
    });
  }

  function bekreftGjørTilEier(husstandId, uid, navn) {
    visBekreft(
      'Gjøre ' + navn + ' til eier av husstanden? Du mister selv eier-rettighetene ' +
      '(bytte kode og fjerne medlemmer), men blir værende som medlem.',
      function() { gjørTilEier(husstandId, uid); },
      'Ja, gjør til eier'
    );
  }

  // Eieren overfører eierskapet til et annet medlem (opprettetAv). Den nye eieren
  // ser sine nye rettigheter live via opprettetAv-lytteren.
  function gjørTilEier(husstandId, uid) {
    if (!database || !bruker) return;
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    if (!husstand || husstand.opprettetAv !== bruker.uid) {
      loggFeil('Gjør til eier nektet: ikke eier', 'husstand', '');
      return;
    }
    if (!husstand.medlemmer || !husstand.medlemmer[uid]) return; // må være medlem
    database.ref('husstander/' + husstandId + '/opprettetAv').set(uid).then(function() {
      husstand.opprettetAv = uid;
      if (aktivHusstandModalId === husstandId) oppdaterHusstandModalEierUI(husstand);
    }).catch(function(err) {
      loggFeil('Gjør til eier: ' + err.message, 'husstand', '');
    });
  }

  // Forlat husstand fra modalen – gjenbruker eksisterende bekreft-flyt med
  // siste-medlem/gjenoppretting-logikk.
  function forlatFraHusstandModal() {
    var husstandId = aktivHusstandModalId;
    if (!husstandId) return;
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    var navn = husstand ? husstand.navn : '';
    lukkHusstandModal();
    bekreftForlatHusstand(husstandId, navn);
  }

  // Publiserer brukerens eget visningsnavn til husstanden så andre medlemmer ser
  // navn (ikke bare uid). Skriver kun ved endring for å spare writes.
  function publiserMedlemsnavn(husstandId) {
    if (!database || !bruker) return;
    var navn = egetVisningsnavn() || 'Medlem';
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    var eksisterende = husstand && husstand.medlemsnavn ? husstand.medlemsnavn[bruker.uid] : undefined;
    if (eksisterende === navn) return;
    database.ref('husstander/' + husstandId + '/medlemsnavn/' + bruker.uid).set(navn).catch(function(err) {
      loggFeil('Publiser medlemsnavn: ' + err.message, 'husstand', '');
    });
  }

  // Re-publiserer eget navn i alle husstander – kalles når visningsnavnet endres.
  function republiserAlleMedlemsnavn() {
    mineHusstander.forEach(function(h) { publiserMedlemsnavn(h.id); });
  }

  // Reagerer på endringer i en husstands medlemsliste. Hvis brukeren selv ikke
  // lenger er medlem (fjernet av eier), rydder den sin egen peker så husstanden
  // forsvinner fra forsiden. Ellers oppdateres antall + åpen modal.
  function håndterMedlemmerEndring(husstandId, medlemmer) {
    medlemmer = medlemmer || {};
    var hh = mineHusstander.find(function(x) { return x.id === husstandId; });
    if (hh) hh.medlemmer = medlemmer;

    if (bruker && !medlemmer[bruker.uid]) {
      // Jeg er fjernet (eller har nettopp forlatt) – lukk modal + fjern peker.
      if (aktivHusstandModalId === husstandId) lukkHusstandModal();
      var sti = brukerSti('husstander/' + husstandId);
      if (sti) database.ref(sti).remove().catch(function() {});
      return;
    }

    tegnHusstandDropdown();
    if (aktivHusstandModalId === husstandId && hh) tegnHusstandMedlemmer(hh);
  }

  // Bekreft før bytte (advarer brukeren om at den gamle koden blir ugyldig).
  function bekreftBytteInvitasjonskode() {
    var husstandId = aktivHusstandModalId;
    if (!husstandId) return;
    visBekreft(
      'Bytte invitasjonskode? Den gamle koden vil ikke lenger fungere, ' +
      'og du må dele den nye med medlemmer som mangler innlogging.',
      function() { byttInvitasjonskode(husstandId); },
      'Ja, bytt'
    );
  }

  // Bytt invitasjonskoden for en husstand. Atomisk: gammel kode fjernes fra
  // invitasjonskoder/, ny kode legges til, og husstand-objektet oppdateres -
  // alt i én Firebase-update slik at klienter aldri ser en mellomtilstand.
  function byttInvitasjonskode(husstandId) {
    if (!database || !bruker) return;
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    if (!husstand) return;
    // Defensiv sjekk - bør ikke skje fordi knappen kun vises for eieren,
    // men bedre å feile pent enn å la en ikke-eier prøve.
    if (husstand.opprettetAv !== bruker.uid) {
      loggFeil('Bytt kode nektet: ikke eier', 'husstand', '');
      return;
    }
    var kodeEl = document.getElementById('invitasjonskode-vis');
    if (kodeEl) kodeEl.textContent = 'Bytter…';

    // Hent gammel kode først så vi vet hvilken vi skal slette
    database.ref('husstander/' + husstandId + '/kode').once('value').then(function(snap) {
      var gammelKode = snap.val();
      var nyKode = genererKode();
      var oppdateringer = {};
      oppdateringer['husstander/' + husstandId + '/kode'] = nyKode;
      oppdateringer['invitasjonskoder/' + nyKode] = { husstandId: husstandId };
      if (gammelKode && gammelKode !== nyKode) {
        oppdateringer['invitasjonskoder/' + gammelKode] = null;
      }
      return database.ref().update(oppdateringer).then(function() { return nyKode; });
    }).then(function(nyKode) {
      if (kodeEl) kodeEl.textContent = nyKode;
      // Oppdater lokal kopi av husstand-objektet så neste visning er korrekt
      var h = mineHusstander.find(function(x) { return x.id === husstandId; });
      if (h) h.kode = nyKode;
    }).catch(function(err) {
      if (kodeEl) kodeEl.textContent = 'Feilet';
      loggFeil('Bytt kode: ' + err.message, 'husstand', '');
    });
  }

  function bekreftForlatHusstand(husstandId, husstandNavn) {
    lukkHusstandDropdown();
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    var medlemAntall = husstand ? Object.keys(husstand.medlemmer || {}).length : 0;

    if (medlemAntall <= 1) {
      // Brukeren er siste medlem - bevares i 4 uker med gjenopprettingskode
      visBekreft(
        'Du er det siste medlemmet i «' + husstandNavn + '». ' +
        'Hvis du forlater, bevares husstanden i 4 uker så du kan komme tilbake. ' +
        'Husstandens permanente invitasjonskode vises - lagre den nå. ' +
        'Etter 4 uker slettes alt permanent. Vil du fortsette?',
        function() {
          forlatHusstand(husstandId, true).then(function(kode) {
            visGjenopprettingsKode(kode, husstandNavn);
          }).catch(function(err) {
            loggFeil('Forlat (siste): ' + err.message, 'husstand', '');
          });
        }
      );
    } else {
      // Er du eier og det er flere medlemmer å velge mellom, skal du få velge
      // hvem som overtar eierskapet (i stedet for automatisk valg).
      var erEier = husstand && bruker && husstand.opprettetAv === bruker.uid;
      if (erEier && (medlemAntall - 1) >= 2) {
        åpneVelgEier(husstandId, husstandNavn);
        return;
      }
      visBekreft(
        'Forlate husstand «' + husstandNavn + '»? ' +
        'Du vil ikke lenger ha tilgang til delte lister i denne husstanden. ' +
        '(' + (medlemAntall - 1) + ' andre medlem(mer) beholder tilgangen.)',
        function() {
          forlatHusstand(husstandId, false).catch(function(err) {
            loggFeil('Forlat husstand: ' + err.message, 'husstand', '');
          });
        }
      );
    }
  }

  // ==============================
  // VELG NY EIER (når eier forlater og det er flere å velge mellom)
  // ==============================
  var aktivVelgEierHusstandId = null;
  var aktivVelgEierNavn = '';
  var valgtNyEierId = null;

  function åpneVelgEier(husstandId, husstandNavn) {
    var husstand = mineHusstander.find(function(h) { return h.id === husstandId; });
    if (!husstand) return;
    aktivVelgEierHusstandId = husstandId;
    aktivVelgEierNavn = husstandNavn;
    valgtNyEierId = null;

    var liste = document.getElementById('velg-eier-liste');
    liste.innerHTML = '';
    var navnMap = husstand.medlemsnavn || {};
    Object.keys(husstand.medlemmer || {}).forEach(function(uid) {
      if (uid === bruker.uid) return; // ikke deg selv
      var navn = navnMap[uid] || 'Medlem';
      var rad = document.createElement('button');
      rad.type = 'button';
      rad.className = 'velg-eier-rad';

      var avatar = document.createElement('span');
      avatar.className = 'husstand-medlem-avatar';
      avatar.textContent = (navn.trim()[0] || '?').toUpperCase();
      rad.appendChild(avatar);

      var navnEl = document.createElement('span');
      navnEl.className = 'husstand-medlem-navn';
      navnEl.textContent = navn;
      rad.appendChild(navnEl);

      rad.onclick = function() {
        valgtNyEierId = uid;
        liste.querySelectorAll('.velg-eier-rad').forEach(function(r) { r.classList.remove('valgt'); });
        rad.classList.add('valgt');
        var b = document.getElementById('velg-eier-bekreft');
        if (b) b.disabled = false;
      };
      liste.appendChild(rad);
    });

    var bekreft = document.getElementById('velg-eier-bekreft');
    if (bekreft) bekreft.disabled = true;
    document.getElementById('velg-eier-overlay').classList.add('synlig');
  }

  function lukkVelgEier() {
    document.getElementById('velg-eier-overlay').classList.remove('synlig');
    aktivVelgEierHusstandId = null;
    valgtNyEierId = null;
  }

  function bekreftVelgEier() {
    var husstandId = aktivVelgEierHusstandId;
    var nyEier = valgtNyEierId;
    if (!husstandId || !nyEier) return;
    lukkVelgEier();
    forlatHusstand(husstandId, false, nyEier).catch(function(err) {
      loggFeil('Forlat (velg eier): ' + err.message, 'husstand', '');
    });
  }

  function visGjenopprettingsKode(kode, husstandNavn) {
    document.getElementById('gjenoppretting-husstand-navn').textContent = husstandNavn;
    document.getElementById('gjenoppretting-kode-vis').textContent = kode;
    var utlop = new Date(Date.now() + FIRE_UKER_MS);
    document.getElementById('gjenoppretting-utlop').textContent =
      utlop.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('gjenoppretting-overlay').classList.add('synlig');
  }
  function lukkGjenopprettingsModal() {
    document.getElementById('gjenoppretting-overlay').classList.remove('synlig');
  }
  function kopierGjenopprettingsKode() {
    var kode = document.getElementById('gjenoppretting-kode-vis').textContent;
    var knapp = document.getElementById('kopier-gjenoppretting');
    var visBekreftet = function() {
      knapp.textContent = '✓ Kopiert';
      setTimeout(function() { knapp.textContent = '📋 Kopier kode'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(kode).then(visBekreftet);
    } else {
      // Fallback for eldre nettlesere
      var t = document.createElement('textarea');
      t.value = kode;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); visBekreftet(); }
      catch (e) { knapp.textContent = 'Kopier feilet'; }
      document.body.removeChild(t);
    }
  }

  // Sørger for at brukernoden finnes med basisinfo ved innlogging. (Den gamle
  // pre-auth-migrasjonen som leste globale rot-stier er fjernet: rot-stiene er
  // utilgjengelige under gjeldende sikkerhetsregler og dataene er for lengst
  // migrert. Forsøk på å lese dem ga bare permission_denied ved fersk innlogging.)
  function migrerGlobaltTilBrukerOmNodvendig() {
    if (!bruker || !database) return Promise.resolve();
    return database.ref('brukere/' + bruker.uid).once('value').then(function(snap) {
      if (!snap.exists()) {
        return database.ref('brukere/' + bruker.uid).set({
          opprettet: Date.now(),
          email: bruker.email,
          navn: bruker.displayName || ''
        });
      }
    });
  }

  function initAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      loggFeil('Auth: firebase.auth ikke lastet', 'auth', '');
      return;
    }
    // Håndter retur fra Google etter signInWithRedirect / reauthenticateWithRedirect
    firebase.auth().getRedirectResult().then(function(result) {
      // Returnerte vi fra en re-auth for kontosletting? (flagg satt før redirect,
      // med tidsstempel slik at et forlatt/avbrutt forsøk ikke trigger senere)
      var flagg = localStorage.getItem('matplan-slett-konto');
      if (result && result.user && flagg &&
          (Date.now() - Number(flagg)) < 10 * 60 * 1000) {
        utførSletting();
      } else if (flagg) {
        localStorage.removeItem('matplan-slett-konto');
      }
      // Ellers: vanlig innlogging via redirect – onAuthStateChanged håndterer resten.
    }).catch(function(err) {
      localStorage.removeItem('matplan-slett-konto');
      var statusEl = document.getElementById('login-status');
      if (statusEl) statusEl.textContent = 'Innlogging feilet: ' + err.message;
      loggFeil('getRedirectResult: ' + err.message, 'auth', '');
    });

    // Lytt på endringer i auth-tilstand. Fyrer både ved oppstart (med eventuell cached bruker)
    // og hver gang noen logger inn/ut.
    firebase.auth().onAuthStateChanged(function(user) {
      bruker = user;
      if (user) {
        // Innlogget - skjul login-skjerm, oppdater profil-sirkel, last brukerens data
        skjulLoginSkjerm();
        tegnProfilSirkel();
        // Migrer eksisterende globale data hvis aktuelt (engangsoperasjon),
        // deretter aktiver Firebase-listenere som lytter på brukerens path.
        migrerGlobaltTilBrukerOmNodvendig().then(function() {
          aktiverDataListenereForBruker();
          aktiverHusstandListener();
        }).catch(function(err) {
          loggFeil('Migrasjon/aktivering feilet: ' + err.message, 'auth', '');
          aktiverDataListenereForBruker();
          aktiverHusstandListener();
        });
      } else {
        // Ikke innlogget - vis login-skjerm og rens lokale brukerdata
        visLoginSkjerm();
        brukerListenereAktive = false;
        // Tøm in-memory brukerdata så neste bruker ikke ser forrige sine lister
        alleLister = [];
        egneKategorier = [];
        egneKategorierByKontekst = { 'personlig': [] };
        handleHistorikk = {};
        handleHistorikkByKontekst = { 'personlig': {} };
        basisVarer = [];
        mineHusstander = [];
        egetProfilNavn = null;
        // localStorage holder cache - tømmes nå så ny bruker får friskt grunnlag
        localStorage.removeItem('matplan-lister');
        localStorage.removeItem('matplan-egne-kategorier');
        localStorage.removeItem('matplan-historikk');
        // Rens også per-kontekst-cache for egne kategorier og historikk
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var key = localStorage.key(i);
          if (key && (key.indexOf('matplan-egne-kategorier-') === 0 ||
                      key.indexOf('matplan-historikk-') === 0)) {
            localStorage.removeItem(key);
          }
        }
      }
    });
  }

  function signInMedGoogle() {
    if (!firebase.auth) {
      loggFeil('signIn: firebase.auth ikke tilgjengelig', 'auth', '');
      return;
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    // Bruker popup som primær metode - mer pålitelig på cross-domain GitHub Pages.
    // Faller tilbake til redirect hvis popup blokkeres (typisk i iOS Safari standalone PWA).
    firebase.auth().signInWithPopup(provider).catch(function(err) {
      // Popup-spesifikke feilkoder → prøv redirect
      if (err.code === 'auth/popup-blocked' ||
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request' ||
          err.code === 'auth/operation-not-supported-in-this-environment') {
        firebase.auth().signInWithRedirect(provider).catch(function(redirectErr) {
          var statusEl = document.getElementById('login-status');
          if (statusEl) statusEl.textContent = 'Innlogging feilet: ' + redirectErr.message;
          loggFeil('signInWithRedirect fallback: ' + redirectErr.message, 'auth', '');
        });
        return;
      }
      var statusEl = document.getElementById('login-status');
      if (statusEl) statusEl.textContent = 'Innlogging feilet: ' + err.message;
      loggFeil('signInWithPopup: ' + err.message, 'auth', '');
    });
  }

  function loggUt() {
    if (!firebase.auth) return;
    firebase.auth().signOut().catch(function(err) {
      loggFeil('Logg ut feilet: ' + err.message, 'auth', '');
    });
    // onAuthStateChanged tar seg av UI-oppdatering
    lukkProfilDropdown();
  }

  // ==============================
  // SLETT KONTO
  // ==============================
  function bekreftSlettKonto() {
    lukkProfilDropdown();
    visBekreft(
      'Slette kontoen din permanent? Alle dine personlige lister, kategorier og ' +
      'historikk slettes for godt. Husstander der andre fortsatt er medlem ' +
      'beholdes (eierskap overføres ved behov); husstander der du er siste medlem ' +
      'slettes. Dette kan ikke angres.',
      function() { startSlettKonto(); },
      'Slett kontoen min'
    );
  }

  // Firebase krever "nylig innlogging" for å slette en konto. Vi re-autentiserer
  // derfor først. Popup på desktop; iOS standalone-PWA faller til redirect, og
  // slettingen fullføres når appen lastes på nytt (se getRedirectResult i initAuth).
  function startSlettKonto() {
    var bruker0 = firebase.auth && firebase.auth().currentUser;
    if (!bruker0 || !database) return;
    var provider = new firebase.auth.GoogleAuthProvider();
    bruker0.reauthenticateWithPopup(provider).then(function() {
      utførSletting();
    }).catch(function(err) {
      if (err.code === 'auth/popup-blocked' ||
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request' ||
          err.code === 'auth/operation-not-supported-in-this-environment') {
        // Redirect-vei: marker at sletting pågår (med tidsstempel mot stale flagg),
        // fullføres når appen kommer tilbake fra Google.
        localStorage.setItem('matplan-slett-konto', String(Date.now()));
        bruker0.reauthenticateWithRedirect(provider).catch(function(e2) {
          localStorage.removeItem('matplan-slett-konto');
          loggFeil('reauth redirect: ' + e2.message, 'auth', '');
        });
      } else {
        loggFeil('reauth popup: ' + err.message, 'auth', '');
      }
    });
  }

  // Selve slettingen – kjøres etter bekreftet re-autentisering. Rydder husstander
  // (overfør eierskap når andre er igjen / slett tomme), sletter alle personlige
  // data, og til slutt selve Auth-kontoen. onAuthStateChanged(null) tar UI-en til
  // login-skjermen.
  function utførSletting() {
    localStorage.removeItem('matplan-slett-konto'); // kjør kun én gang
    var bruker0 = firebase.auth && firebase.auth().currentUser;
    if (!bruker0 || !database) return;
    var uid = bruker0.uid;

    database.ref('brukere/' + uid + '/husstander').once('value').then(function(snap) {
      var hids = Object.keys(snap.val() || {});
      return Promise.all(hids.map(function(hid) {
        return database.ref('husstander/' + hid).once('value').then(function(s) {
          return { hid: hid, data: s.val() };
        });
      }));
    }).then(function(husstander) {
      var upd = {};
      husstander.forEach(function(h) {
        if (!h.data) return;
        var medlemmer = h.data.medlemmer || {};
        var andre = Object.keys(medlemmer).filter(function(m) { return m !== uid; });
        if (andre.length === 0) {
          // Siste medlem → slett hele husstanden (ingen angrefrist; kontoen er borte)
          upd['husstander/' + h.hid] = null;
          if (h.data.kode) upd['invitasjonskoder/' + h.data.kode] = null;
        } else {
          // Andre er igjen → fjern meg, og overfør eierskap hvis jeg var eier
          upd['husstander/' + h.hid + '/medlemmer/' + uid] = null;
          upd['husstander/' + h.hid + '/medlemsnavn/' + uid] = null;
          if (h.data.opprettetAv === uid) {
            upd['husstander/' + h.hid + '/opprettetAv'] = andre[0];
          }
        }
      });
      upd['brukere/' + uid] = null;
      return database.ref().update(upd);
    }).then(function() {
      return bruker0.delete();
    }).catch(function(err) {
      loggFeil('Slett konto: ' + err.message, 'auth', '');
    });
  }

  function visLoginSkjerm() {
    var overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.add('synlig');
    // Skjul også appens hovedinnhold så ingenting lekker bak login-overlayet
    var forside = document.getElementById('forside-container');
    var liste   = document.getElementById('liste-container');
    if (forside) forside.style.display = 'none';
    if (liste)   liste.style.display = 'none';
    var tilbakeknapp = document.getElementById('tilbakemelding-knapp');
    if (tilbakeknapp) tilbakeknapp.style.display = 'none';
  }

  function skjulLoginSkjerm() {
    var overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('synlig');
    // Vis forsiden - tegnForside ble allerede kalt ved oppstart, men container var skjult
    var forside = document.getElementById('forside-container');
    if (forside && !aktivListeId) forside.style.display = 'block';
    var tilbakeknapp = document.getElementById('tilbakemelding-knapp');
    if (tilbakeknapp) tilbakeknapp.style.display = 'flex';
  }

  function tegnProfilSirkel() {
    if (!bruker) return;
    var sirkel = document.getElementById('profil-sirkel');
    if (!sirkel) return;
    var displayName = egetVisningsnavn() || '?';
    // Kun første bokstav i sirkelen – holder den ren også for folk med mange navn
    var initialer = (displayName.trim()[0] || '?').toUpperCase();
    if (bruker.photoURL) {
      sirkel.style.backgroundImage = "url('" + bruker.photoURL + "')";
      sirkel.textContent = '';
    } else {
      sirkel.style.backgroundImage = '';
      sirkel.textContent = initialer;
    }
    // Oppdater også dropdown-info
    var navnEl = document.getElementById('profil-navn');
    var emailEl = document.getElementById('profil-email');
    if (navnEl)  navnEl.textContent  = displayName;
    if (emailEl) emailEl.textContent = bruker.email || '';
  }

  function toggleProfilDropdown() {
    lukkHusstandDropdown(); // bare én dropdown åpen om gangen
    var dd = document.getElementById('profil-dropdown');
    if (dd) dd.classList.toggle('synlig');
  }

  function lukkProfilDropdown() {
    var dd = document.getElementById('profil-dropdown');
    if (dd) dd.classList.remove('synlig');
  }

  function toggleHusstandDropdown() {
    lukkProfilDropdown(); // bare én dropdown åpen om gangen
    var dd = document.getElementById('husstand-dropdown');
    if (!dd) return;
    var skalÅpne = !dd.classList.contains('synlig');
    if (skalÅpne) tegnHusstandDropdown(); // ferskt innhold ved hver åpning
    dd.classList.toggle('synlig');
  }

  function lukkHusstandDropdown() {
    var dd = document.getElementById('husstand-dropdown');
    if (dd) dd.classList.remove('synlig');
  }

  // ==============================
  // ENDRE VISNINGSNAVN
  // ==============================
  function åpneEndreNavn() {
    lukkProfilDropdown();
    var input = document.getElementById('endre-navn-input');
    var feilEl = document.getElementById('endre-navn-feil');
    if (feilEl) feilEl.textContent = '';
    if (input) input.value = egetVisningsnavn();
    document.getElementById('endre-navn-overlay').classList.add('synlig');
    setTimeout(function() { if (input) { input.focus(); input.select(); } }, 100);
  }
  function lukkEndreNavn() {
    document.getElementById('endre-navn-overlay').classList.remove('synlig');
  }
  function lagreVisningsnavn() {
    var input  = document.getElementById('endre-navn-input');
    var feilEl = document.getElementById('endre-navn-feil');
    var navn   = input.value.trim();
    if (!navn) { feilEl.textContent = 'Navnet kan ikke være tomt.'; return; }
    if (navn.length > 40) { feilEl.textContent = 'Maks 40 tegn.'; return; }
    if (!bruker || !database) return;
    feilEl.textContent = '';

    // Lagre to steder: vår egen sti (varig, overstyrer Google) + Auth-profilen.
    // updateProfile feiler ikke flyten hvis den skulle slå feil – egen sti er
    // kilden vi faktisk leser fra via egetVisningsnavn().
    var oppgaver = [ database.ref(brukerSti('profil/navn')).set(navn) ];
    if (bruker.updateProfile) {
      oppgaver.push(bruker.updateProfile({ displayName: navn }).catch(function() {}));
    }
    Promise.all(oppgaver).then(function() {
      egetProfilNavn = navn;
      tegnProfilSirkel();
      republiserAlleMedlemsnavn();
      lukkEndreNavn();
    }).catch(function(err) {
      feilEl.textContent = 'Kunne ikke lagre. Prøv igjen.';
      loggFeil('Endre navn: ' + err.message, 'auth', '');
    });
  }

  // Lukk dropdownene når man klikker utenfor
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#profil-sirkel') && !e.target.closest('#profil-dropdown')) {
      lukkProfilDropdown();
    }
    if (!e.target.closest('#husstand-knapp') && !e.target.closest('#husstand-dropdown')) {
      lukkHusstandDropdown();
    }
  });

  // ==============================
  // OPPSTART
  // ==============================
  migrerFiskFraKjott();
  lastInnOfflineKø();
  lastInnHistorikk();
  lastInnEgneKategorier();
  lastInnLister();

  // Tegn forside (synlig DOM bygges, men container vises kun etter at auth er bekreftet)
  tegnForside();

  // Vis appversjon nederst på forsiden, slik at brukere enkelt kan sjekke
  // om de har fått siste oppdatering (uten å sende en tilbakemelding).
  // Viser kun "Versjon NN" - tallet trekkes ut av APP_VERSJON automatisk.
  var versjonEl = document.getElementById('app-versjon');
  if (versjonEl) {
    var vMatch = APP_VERSJON.match(/v(\d+)/);
    versjonEl.textContent = vMatch ? 'Versjon ' + vMatch[1] : APP_VERSJON;
  }

  oppdaterTeller();
  oppdaterKategoriSynlighet();
  initFirebase();
  initAuth();

// ============================================================
// Service worker-registrering
// ============================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./service-worker.js')
        .then(function(reg) { console.log('Service worker registrert:', reg.scope); })
        .catch(function(err) { console.log('Service worker feilet:', err); });
    });
  }
