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
    var forslag = finnKategori(navn);
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
  // FORSIDE – LISTOVERSIKT
  // ==============================
  var alleLister = [];       // [{id, navn, opprettet}, ...]
  var aktivListeId = null;

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

  function lagreLister() {
    localStorage.setItem('matplan-lister', JSON.stringify(alleLister));
    if (database) {
      database.ref('lister-meta').set(alleLister).catch(function(err) {
        loggFeil('Lagre lister feil: ' + err.message, 'firebase', '');
      });
    }
  }

  function tegnForside() {
    var grid = document.getElementById('liste-grid');
    grid.innerHTML = '';
    if (alleLister.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:var(--muted);font-size:14px;padding:20px 0;">Ingen lister ennå. Opprett en ny!</p>';
      return;
    }
    alleLister.forEach(function(liste) {
      var div = document.createElement('div');
      div.className = 'liste-kort';
      // Tell varer i listen
      var data = localStorage.getItem('matplan-varer-' + liste.id);
      var antallVarer = 0;
      var antallGjenstår = 0;
      if (data) {
        try {
          var parsed = JSON.parse(data);
          var kats = ['kjott','fisk','meieri','frukt','brod','basis','husholdning','diverse'];
          kats.forEach(function(k) {
            if (parsed[k]) {
              antallVarer += parsed[k].length;
              antallGjenstår += parsed[k].filter(function(v) { return !v.huket; }).length;
            }
          });
        } catch(e) {}
      }
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

      div.addEventListener('click', function() {
        åpneListe(liste.id);
      });

      // Long press to rename
      var pressTimer;
      div.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(function() {
          åpneRedigerListeModal(liste.id, liste.navn);
        }, 600);
      });
      div.addEventListener('touchend', function() { clearTimeout(pressTimer); });
      div.addEventListener('touchmove', function() { clearTimeout(pressTimer); });

      // Right-click / long click on desktop
      div.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        åpneRedigerListeModal(liste.id, liste.navn);
      });

      grid.appendChild(div);
    });
  }

  function åpneNyListeModal() {
    document.getElementById('modal-tittel').textContent = 'Ny liste';
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
    alleLister.push({ id: nyId, navn: navn, type: type, opprettet: Date.now() });
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
    visBekreft('Slette «' + liste.navn + '»? Alle varer i listen forsvinner.', function() {
      alleLister = alleLister.filter(function(l) { return l.id !== id; });
      localStorage.removeItem('matplan-varer-' + id);
      localStorage.removeItem('matplan-basis-' + id);
      lagreLister();
      if (database) database.ref('lister/' + id).remove();
      tegnForside();
    });
  }

  function åpneListe(id) {
    var liste = alleLister.find(function(l) { return l.id === id; });
    if (!liste) return;
    aktivListeId = id;

    // Vis liste-container, skjul forside
    document.getElementById('forside-container').style.display = 'none';
    document.getElementById('liste-container').style.display = 'block';
    var typeInfo = listeTypeInfo(liste.type || 'mat');
    document.getElementById('aktiv-liste-tittel').textContent = typeInfo.ikon + ' ' + liste.navn;

    // Last inn data for denne listen
    lastInnListeData(id);

    // Koble Firebase til denne listen
    lyttPåListe(id);
  }

  function gåTilForside() {
    // Lagre og detach Firebase listener
    lagreAlt();
    if (aktivFirebaseLytter) {
      database && database.ref('lister/' + aktivListeId + '/varer').off('value', aktivFirebaseLytter);
      aktivFirebaseLytter = null;
    }
    aktivListeId = null;
    document.getElementById('liste-container').style.display = 'none';
    document.getElementById('forside-container').style.display = 'block';
    tegnForside();
  }

  var aktivFirebaseLytter = null;

  function lastInnListeData(id) {
    // Last inn varer
    var lagretVarer = localStorage.getItem('matplan-varer-' + id);
    if (lagretVarer) {
      byggListeFraData(JSON.parse(lagretVarer));
    } else {
      // Tom liste – tøm varer i alle kategorier (men behold DOM-strukturen for egne kategorier)
      ['kjott','fisk','meieri','frukt','brod','basis','husholdning','diverse'].forEach(function(k) {
        var ul = document.getElementById(k);
        if (ul) ul.innerHTML = '';
      });
      egneKategorier.forEach(function(k) {
        var ul = document.getElementById(k.id);
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
    if (!database) return;
    if (aktivFirebaseLytter) {
      database.ref('lister/' + (aktivListeId || id) + '/varer').off('value', aktivFirebaseLytter);
    }
    aktivFirebaseLytter = function(snap) {
      // snap.val() er null når listen er helt tom (Firebase pruner tomme verdier).
      // Vi må fortsatt oppdatere UI for å reflektere tømming fra annen enhet.
      var data = snap.val() || {};
      if (offlineKø.filter(function(e) { return e.type === 'handleliste'; }).length === 0) {
        migrerVarerData(data);
        byggListeFraData(data);
        localStorage.setItem('matplan-varer-' + id, JSON.stringify(data));
      }
    };
    database.ref('lister/' + id + '/varer').on('value', aktivFirebaseLytter);
    database.ref('lister/' + id + '/basis').on('value', function(snap) {
      // Samme null-håndtering for basis: en tom basisliste kommer som null fra Firebase.
      var data = snap.val();
      if (offlineKø.filter(function(e) { return e.type === 'basisliste'; }).length === 0) {
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
  var egneKategorier = [];

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
        '<button class="slett-kategori-knapp" onclick="event.stopPropagation();slettEgenKategori(\'' + id + '\')" title="Slett kategori">×</button>' +
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
    var selects = document.querySelectorAll('#velg-kategori, #basis-kat-velg');
    selects.forEach(function(sel) {
      var faste = ['kjott','fisk','meieri','frukt','brod','basis','husholdning','diverse'];
      while (sel.options.length > faste.length) sel.remove(sel.options.length - 1);
      egneKategorier.forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.navn;
        sel.appendChild(opt);
      });
    });
  }

  function lagreEgneKategorier() {
    localStorage.setItem('matplan-egne-kategorier', JSON.stringify(egneKategorier));
    if (typeof database !== 'undefined' && database && erKoblet) {
      database.ref('egne-kategorier').set(egneKategorier).catch(function(err) {
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
    localStorage.setItem('matplan-egne-kategorier', JSON.stringify(egneKategorier));
  }

  function lastInnEgneKategorier() {
    var lagret = localStorage.getItem('matplan-egne-kategorier');
    if (lagret) {
      egneKategorier = JSON.parse(lagret);
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
  var handleHistorikk = {}; // { 'Bananer': [{dato, kat}, ...], ... }
  var avvistForslag = [];

  function lastInnHistorikk() {
    var lagret = localStorage.getItem('matplan-historikk');
    if (lagret) handleHistorikk = JSON.parse(lagret);
    var avvist = localStorage.getItem('matplan-avvist-forslag');
    if (avvist) avvistForslag = JSON.parse(avvist);
  }

  function lagreHistorikk() {
    localStorage.setItem('matplan-historikk', JSON.stringify(handleHistorikk));
  }

  function loggHandlet(navn, kat) {
    if (!navn || navn.trim() === '') return;
    var gruppe = historikkNøkkel();
    var nøkkel = navn.trim().toLowerCase();
    if (!handleHistorikk[gruppe]) handleHistorikk[gruppe] = {};
    if (!handleHistorikk[gruppe][nøkkel]) handleHistorikk[gruppe][nøkkel] = [];
    handleHistorikk[gruppe][nøkkel].push({
      navn: navn.trim(),
      kat: kat || 'diverse',
      dato: Date.now()
    });
    // Behold kun de siste 12 ukene
    var grense = Date.now() - (12 * 7 * 24 * 60 * 60 * 1000);
    handleHistorikk[gruppe][nøkkel] = handleHistorikk[gruppe][nøkkel].filter(function(e) { return e.dato > grense; });
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
        '<button class="forslag-avvis" title="Ikke foreslå igjen">×</button>';
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
    basis:'🥫', husholdning:'🧹', diverse:'🛍️'
  };

  var aktivAutoIndex = -1;

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
      html += '<div class="autofullfør-valg" data-navn="' + o.navn.replace(/"/g, '&quot;') +
        '" data-kat="' + (o.kat || 'diverse') + '">'+
        '<span>' + o.navn + '</span>'+
        laartMerke +
        '<span class="kat-badge">' + (katEmoji[o.kat] || '') + '</span>'+
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
    if (document.getElementById('velg-kategori')) {
      document.getElementById('velg-kategori').value = kat;
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
  function visBekreft(tekst, jaFunksjon) {
    document.getElementById('bekreft-tekst').textContent = tekst;
    document.getElementById('bekreft-overlay').classList.add('synlig');
    document.getElementById('bekreft-ja').onclick = function() { lukkBekreft(); jaFunksjon(); };
  }
  function lukkBekreft() {
    document.getElementById('bekreft-overlay').classList.remove('synlig');
  }

  // ==============================
  // SKJUL TOMME KATEGORIER
  // ==============================
  var katIder = ['kjott','fisk','meieri','frukt','brod','basis','husholdning','diverse'];

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
    li.innerHTML =
      '<span class="sjekk" onclick="hukAv(this)"></span>' +
      '<span class="mengde-badge ' + (mengdeTekst ? '' : 'tom') + '">' + mengdeTekst + '</span>' +
      '<span class="vare-tekst">' + navn + '</span>' +
      '<button class="notat-knapp" onclick="toggleRediger(this)" title="Rediger mengde og merknad">📝</button>' +
      '<button class="flytt-knapp" onclick="åpneFlytt(this)" title="Flytt til annen kategori">⇄</button>' +
      '<button class="slett" onclick="slettVare(this)">×</button>' +
      '<div class="flytt-meny"></div>' +
      '<div class="rediger-panel">' +
        '<div class="rediger-rad">' +
          '<span class="rediger-etikett">Mengde:</span>' +
          '<input type="number" min="0.1" step="0.1" placeholder="Ant." value="' + (antall || '') + '">' +
          '<select>' + enhetOptions(enhet || '–') + '</select>' +
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
    panel.querySelector('select').value               = deler.length >= 2 ? deler[1] : '–';
    panel.querySelector('input[type="text"]').value   = notat ? notat.textContent : '';
    document.querySelectorAll('.rediger-panel.synlig').forEach(function(p) { if (p !== panel) p.classList.remove('synlig'); });
    document.querySelectorAll('.flytt-meny.synlig').forEach(function(m) { m.classList.remove('synlig'); });
    panel.classList.toggle('synlig');
    if (panel.classList.contains('synlig')) panel.querySelector('input[type="number"]').focus();
  }

  function lagreRediger(knapp) {
    var li    = knapp.closest('li');
    var panel = li.querySelector('.rediger-panel');
    var badge = li.querySelector('.mengde-badge');
    var antall  = panel.querySelector('input[type="number"]').value.trim();
    var enhet   = panel.querySelector('select').value;
    var mengde  = formatMengde(antall, enhet);
    badge.textContent = mengde;
    if (mengde) badge.classList.remove('tom'); else badge.classList.add('tom');
    var merknadVerdi = panel.querySelector('input[type="text"]').value.trim();
    var notat = li.querySelector('.notat-tekst');
    if (merknadVerdi) {
      if (!notat) { notat = document.createElement('span'); notat.className = 'notat-tekst'; li.insertBefore(notat, panel); }
      notat.textContent = merknadVerdi;
    } else if (notat) { notat.parentNode.removeChild(notat); }
    panel.classList.remove('synlig');
    lagreAlt();
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.rediger-panel') && !e.target.classList.contains('notat-knapp')) {
      document.querySelectorAll('.rediger-panel.synlig').forEach(function(p) { p.classList.remove('synlig'); });
    }
    if (!e.target.closest('.flytt-meny') && !e.target.classList.contains('flytt-knapp')) {
      document.querySelectorAll('.flytt-meny.synlig').forEach(function(m) { m.classList.remove('synlig'); });
    }
  });

  // ==============================
  // FLYTT TIL ANNEN KATEGORI
  // ==============================
  var alleKategorier = [
    { id:'kjott',       navn:'🥩 Kjøtt' },
    { id:'fisk',        navn:'🐟 Fisk og skalldyr' },
    { id:'meieri',      navn:'🥛 Meieriprodukter' },
    { id:'frukt',       navn:'🥦 Frukt og grønt' },
    { id:'brod',        navn:'🍞 Brød og bakevarer' },
    { id:'basis',       navn:'🥫 Basisvarer' },
    { id:'husholdning', navn:'🧹 Husholdning' },
    { id:'diverse',     navn:'🛍️ Diverse' }
  ];

  function åpneFlytt(knapp) {
    event.stopPropagation();
    var li   = knapp.closest('li');
    var meny = li.querySelector('.flytt-meny');
    var alleredeÅpen = meny.classList.contains('synlig');
    document.querySelectorAll('.flytt-meny.synlig').forEach(function(m) { m.classList.remove('synlig'); });
    document.querySelectorAll('.rediger-panel.synlig').forEach(function(p) { p.classList.remove('synlig'); });
    if (!alleredeÅpen) {
      var nåværende = li.closest('ul').id;
      var html = '<div class="flytt-meny-tittel">Flytt til:</div>';
      for (var k = 0; k < alleKategorier.length; k++) {
        if (alleKategorier[k].id !== nåværende)
          html += '<button onclick="flyttVare(this,\'' + alleKategorier[k].id + '\')">' + alleKategorier[k].navn + '</button>';
      }
      meny.innerHTML = html;
      meny.classList.add('synlig');
    }
  }

  function flyttVare(knapp, målKategori) {
    var li = knapp.closest('li');
    document.getElementById(målKategori).appendChild(li);
    li.querySelector('.flytt-meny').classList.remove('synlig');
    oppdaterTeller();
    oppdaterKategoriSynlighet();
    lagreAlt();
  }

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
  var kategoriOrdliste = {
    fisk:        ['laks','torsk','sei','reke','scampi','ørret','makrell','sild','tunfisk','fisk','hyse','kveite','steinbit','rødspette','brosme','akkar','blekksprut','krabbe','hummer','blåskjell','ansjos','klippfisk','røkelaks','gravlaks'],
    kjott:       ['kylling','biff','svin','kjøtt','kjøttdeig','pølse','bacon','skinke','ribbe','koteletter','lever','oksekjøtt','lammekjøtt','karbonader','medisterkaker','kjøttkaker','indrefilet','leverpostei','salami','spekeskinke','entrecôte'],
    meieri:      ['melk','smør','egg','rømme','fløte','yoghurt','ost','kvark','kesam','skyr','kremfløte','brunost','hvitost','jarlsberg','norvegia','gouda','brie','camembert','margarin'],
    frukt:       ['eple','banan','appelsin','sitron','lime','drue','jordbær','blåbær','bringebær','mango','ananas','melon','pære','plomme','kirsebær','avokado','tomat','agurk','brokkoli','blomkål','gulrot','paprika','løk','hvitløk','purre','spinat','salat','kål','mais','erter','bønner','sopp','squash','selleri','persille','basilikum','koriander','ingefær','chili','potet','søtpotet','reddik','nektarin','fersken'],
    brod:        ['brød','grovbrød','loff','baguette','ciabatta','rundstykke','bagel','knekkebrød','kneipp','pita','tortilla','lefse','wienerbrød','croissant','muffins','horn','polarbrød'],
    basis:       ['olje','olivenolje','solsikkeolje','salt','pepper','krydder','pasta','spaghetti','penne','fusilli','ris','mel','hvetemel','havregryn','sukker','melis','gjær','bakepulver','natron','vaniljesukker','sirup','hermetisk','buljong','kraft','saus','ketchup','majones','sennep','eddik','soya','honning','syltetøy','peanøttsmør','kaviar','nøtter','mandler','rosiner','sjokolade','kakao','kaffe','te','müsli','cornflakes','chips','popcorn','kjeks'],
    husholdning: ['toalettpapir','dopapir','kjøkkenpapir','oppvask','oppvaskmiddel','vaskemiddel','tøymiddel','skyllemiddel','rengjøring','søppelpose','søppelsekk','plastpose','aluminiumsfolie','bakepapir','svamp','skurekost','tannkrem','tannbørste','sjampo','balsam','såpe','dusjsåpe','deodorant','barbering','tamponger','bind','bleier','stearinlys','batterier','lyspære']
  };

  var katFullnavn = {
    kjott:'🥩 Kjøtt', fisk:'🐟 Fisk og skalldyr', meieri:'🥛 Meieriprodukter', frukt:'🥦 Frukt og grønt',
    brod:'🍞 Brød og bakevarer', basis:'🥫 Basisvarer', husholdning:'🧹 Husholdning', diverse:'🛍️ Diverse'
  };

  function finnKategori(navn) {
    var l = navn.toLowerCase();
    for (var kat in kategoriOrdliste) {
      var ord = kategoriOrdliste[kat];
      for (var i = 0; i < ord.length; i++) { if (l.indexOf(ord[i]) !== -1) return kat; }
    }
    return null;
  }

  // ==============================
  // FISK/KJØTT-MIGRASJON
  // Gamle data har fisk-varer lagret i 'kjott'-kategorien. Disse må flyttes til
  // den nye 'fisk'-kategorien. Funksjonene under brukes både ved oppstart (på
  // alle localStorage-nøkler) og i Firebase-listenere (på data fra sky).
  // ==============================
  function erFiskeNavn(navn) {
    var l = (navn || '').toLowerCase();
    var fiskOrd = kategoriOrdliste.fisk;
    for (var i = 0; i < fiskOrd.length; i++) {
      if (l.indexOf(fiskOrd[i]) !== -1) return true;
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
    var forslag = finnKategori(navn);
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
    hint.textContent = '💡 Foreslår: ' + katFullnavn[kategori] + ' – endre i nedtrekksmenyen om ønskelig';
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

  function leggTilVare() {
    var input = document.getElementById('ny-vare');
    var raaTekst = input.value.trim();
    if (!raaTekst || input.classList.contains('duplikat-felt')) return;

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

    // Hvis parsing endret navnet, sørg for at kategorien oppdateres på det rene navnet
    var kategori = document.getElementById('velg-kategori').value;
    if (parsed) {
      var nyKat = finnKategori(navn);
      if (nyKat) kategori = nyKat;
    }

    document.getElementById(kategori).appendChild(lagVareElement(navn, antall, enhet));
    input.value = '';
    document.getElementById('ny-antall').value = '';
    document.getElementById('ny-enhet').selectedIndex = 0;
    input.classList.remove('duplikat-felt');
    document.getElementById('duplikat-advarsel').classList.remove('synlig');
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

  var katNavn = { kjott:'🥩', fisk:'🐟', meieri:'🥛', frukt:'🥦', brod:'🍞', basis:'🥫', husholdning:'🧹', diverse:'🛍️' };

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
      // Vis emoji for predefinerte kategorier, navnet for egne kategorier
      var katEgen = egneKategorier.find(function(k) { return k.id === vare.kategori; });
      var katVis = katNavn[vare.kategori] || (katEgen ? katEgen.navn : '');
      // Mengde-badge hvis satt
      var mengdeTekst = vare.antall ? (vare.antall + ' ' + (vare.enhet || 'stk')) : '';
      div.innerHTML =
        '<span class="basis-sjekk" onclick="toggleBasis(this)"></span>' +
        '<span class="basis-vare-navn">' + vare.navn + '</span>' +
        (mengdeTekst ? '<span class="basis-mengde-badge">' + mengdeTekst + '</span>' : '') +
        '<span class="basis-kat">' + katVis + '</span>' +
        '<button class="basis-notat-knapp" onclick="toggleBasisRediger(this)" title="Rediger mengde og merknad">✏️</button>' +
        '<button class="basis-slett" onclick="fjernFraBasis(' + i + ')">×</button>' +
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
      kategori = finnKategori(navn) || document.getElementById('basis-kat-velg').value;
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
    var kategorier = ['kjott','fisk','meieri','frukt','brod','basis','husholdning','diverse'].concat(egneKategorier.map(function(k){return k.id;}));
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

  function byggListeFraData(data) {
    var kategorier = ['kjott','fisk','meieri','frukt','brod','basis','husholdning','diverse'].concat(egneKategorier.map(function(k){return k.id;}));
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

  function leggTilOfflineKø(type, data) {
    // Erstatt eventuell tidligere oppføring av samme type – bare siste versjon trengs
    offlineKø = offlineKø.filter(function(e) { return e.type !== type; });
    offlineKø.push({ type: type, data: data, tid: Date.now() });
    harUsynkedeEndringer = true;
    lagreOfflineKø();
    oppdaterSyncStatus();
  }

  function tømOfflineKø() {
    offlineKø = [];
    harUsynkedeEndringer = false;
    localStorage.removeItem('matplan-offline-kø');
    oppdaterSyncStatus();
  }

  function syncOfflineKø() {
    if (!database || !erKoblet || offlineKø.length === 0) return;
    var kø = offlineKø.slice();
    kø.forEach(function(entry) {
      if (entry.type === 'handleliste') {
        database.ref('lister/' + (aktivListeId || 'default') + '/varer').set(entry.data).then(function() {
          offlineKø = offlineKø.filter(function(e) { return e.type !== 'handleliste'; });
          lagreOfflineKø();
          oppdaterSyncStatus();
        }).catch(function(err) { loggFeil('Sync feilet: ' + err.message, 'firebase', ''); });
      }
      if (entry.type === 'basisliste') {
        database.ref('lister/' + (aktivListeId || 'default') + '/basis').set(entry.data).then(function() {
          offlineKø = offlineKø.filter(function(e) { return e.type !== 'basisliste'; });
          lagreOfflineKø();
          oppdaterSyncStatus();
        }).catch(function(err) { loggFeil('Sync feilet: ' + err.message, 'firebase', ''); });
      }
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
    } else if (offlineKø.length > 0) {
      status.textContent = '🟡 Syncer...';
      status.style.color = 'var(--green-dk)';
    } else {
      status.textContent = '🟢 Koblet til sky';
      status.style.color = 'var(--green)';
    }
  }

  function lagreAlt() {
    if (!aktivListeId) return;
    var data = hentData();

    // Alltid lagre lokalt først (per liste)
    localStorage.setItem('matplan-varer-' + aktivListeId, JSON.stringify(data));
    localStorage.setItem('matplan-basis-' + aktivListeId, JSON.stringify(basisVarer));
    localStorage.setItem('matplan-egne-kategorier', JSON.stringify(egneKategorier));

    if (erKoblet && database) {
      database.ref('lister/' + aktivListeId + '/varer').set(data).catch(function(err) {
        leggTilOfflineKø('handleliste', data);
        loggFeil('Firebase lagringsfeil: ' + err.message, 'firebase', '');
      });
      database.ref('lister/' + aktivListeId + '/basis').set(basisVarer).catch(function(err) {
        leggTilOfflineKø('basisliste', basisVarer);
        loggFeil('Firebase basisliste-feil: ' + err.message, 'firebase', '');
      });
    } else {
      leggTilOfflineKø('handleliste', data);
      leggTilOfflineKø('basisliste', basisVarer);
    }
  }

  function initFirebase() {
    try {
      var app = firebase.initializeApp({
        apiKey: "AIzaSyAc9X6ovcPQKnZyO_cTGIDVKNLvdYMx8PQ",
        authDomain: "matplan-42a33.firebaseapp.com",
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

      // Lytt på sky-endringer for lister-meta. Firebase er sannhetskilden – hvis en
      // liste er slettet på en enhet og borte fra Firebase, skal den også forsvinne
      // lokalt. Tidligere brukte vi en merge-strategi som beholdt slettede lister
      // og kunne skrive dem tilbake til Firebase ved neste lagring.
      database.ref('lister-meta').on('value', function(snap) {
        // Hvis vi har offline-endringer ventende, ikke overskriv lokal state -
        // vi venter med sync til offlineKø er tømt for å unngå data-tap.
        if (offlineKø.length > 0) return;
        var data = snap.val();
        var nye;
        if (Array.isArray(data)) nye = data;
        else if (data && typeof data === 'object') nye = Object.keys(data).map(function(k) { return data[k]; });
        else nye = [];
        // Bare oppdater hvis det er en faktisk endring
        if (JSON.stringify(alleLister) !== JSON.stringify(nye)) {
          alleLister = nye;
          localStorage.setItem('matplan-lister', JSON.stringify(alleLister));
          tegnForside();
        }
      });

      // Lytt på egne kategorier (synker mellom enheter)
      database.ref('egne-kategorier').on('value', function(snap) {
        if (ignorerEgneKategorierEko) { ignorerEgneKategorierEko = false; return; }
        var data = snap.val();
        // Firebase kan returnere array eller objekt - normaliser
        var nye = [];
        if (Array.isArray(data)) nye = data;
        else if (data && typeof data === 'object') nye = Object.keys(data).map(function(k) { return data[k]; });
        // Sjekk om noe faktisk endret seg før vi rebuilder DOM
        if (JSON.stringify(egneKategorier) !== JSON.stringify(nye)) {
          rebuildEgneKategorierFraData(nye);
        }
      });

      // Hvis vi har lokale egne kategorier som ikke er i sky enda, last dem opp
      if (egneKategorier.length > 0) {
        database.ref('egne-kategorier').once('value', function(snap) {
          if (!snap.val()) {
            database.ref('egne-kategorier').set(egneKategorier);
          }
        });
      }

    } catch(err) { loggFeil('Firebase init-feil: ' + err.message, 'firebase', ''); visKoblingStatus(false); }
  }

  // ==============================
  // OPPSTART
  // ==============================
  migrerFiskFraKjott();
  lastInnOfflineKø();
  lastInnHistorikk();
  lastInnEgneKategorier();
  lastInnLister();

  // Vis forside
  tegnForside();

  oppdaterTeller();
  oppdaterKategoriSynlighet();
  initFirebase();

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
