# Handlekurven – prosjektbeskrivelse for Claude

## Hva er dette?

En norsk handleliste-app bygget som en PWA (Progressive Web App). Brukere kan opprette og dele handlelister i sanntid via Firebase, legge til egne kategorier, bruke en basisliste med faste varer, og motta push-varsler når noen oppdaterer listen.

App-navnet **Handlekurven** brukes i alle brukersynlige strenger. Internt (Firebase-prosjekt, localStorage-nøkler, service worker cache, disk-mappenavn) beholdes `matplan`-prefiks fra opprinnelig navngivning – disse er ikke synlige for brukere og endring ville risikert datatap. Når du legger til nye localStorage-nøkler eller Firebase-stier, hold deg til `matplan-*`-konvensjonen for konsistens med eksisterende kode.

## Filstruktur

```
Matplan/                        ← disk-mappe (beholdes som "Matplan")
├── CLAUDE.md                   ← denne filen
├── index.html                  ← hele appen (HTML + CSS + JS i én fil, ~2825 linjer)
├── manifest.json               ← PWA-manifest (app-navn, ikoner, display-modus)
├── service-worker.js           ← offline-støtte og bakgrunns-sync
├── firebase-messaging-sw.js    ← push-varsler via Firebase Cloud Messaging
├── icon-192.png                ← app-ikon (liten)
├── icon-512.png                ← app-ikon (stor)
├── testplan.html               ← print-vennlig testplan (ikke deploy)
├── deploy/                     ← speil av filer som skal til Netlify – oppdateres automatisk
└── _arkiv/                     ← gamle versjoner og backup-filer, ikke rediger
```

## Deploy-flyt: GitHub + GitHub Pages

Prosjektet ligger på GitHub: **https://github.com/Martinsapps/Handlekurven**
Hostes via GitHub Pages: **https://martinsapps.github.io/Handlekurven/**

**Hver endring du gjør skal automatisk pushes til GitHub.** Brukeren har bedt om dette eksplisitt – ingen manuell deploy lenger. Etter en logisk arbeidsenhet (en bug-fiks, en feature, en navneendring) skal du:

1. Oppdatere `deploy/`-mappen hvis du endret en av de deployerbare filene (`index.html`, `manifest.json`, `service-worker.js`, `firebase-messaging-sw.js`, `icon-192.png`, `icon-512.png`) – brukeren har valgt å beholde `deploy/`-strukturen for nå.
2. Stage og committe endringene med en beskrivende commit-melding på norsk.
3. `git push` til origin/main.

Git-identitet er konfigurert lokalt i repoet (`martinsapps` / `mnygaard1995@gmail.com`).

**Pages-kilde:** GitHub Pages støtter kun root eller `/docs`. Brukeren ønsker å serve fra `deploy/`, så her må de selv ha satt opp dette (enten via GitHub Action som publiserer `deploy/` til `gh-pages`-branch, eller ved å sette Pages-kilde til root – i sistnevnte tilfelle serves `index.html` fra rotmappen, ikke fra `deploy/`).

## Hovedfilen: index.html

All applogikk ligger i `index.html`. Filen er delt i tre seksjoner:

| Linjer (ca.) | Innhold |
|---|---|
| 1 – 770 | CSS-styling (variabler, dark mode, komponenter) |
| 771 – 1071 | HTML-struktur (forside, listevisning, sidebar, modaler) |
| 1072 – 2825 | JavaScript-logikk |

### Viktige visninger i HTML
- **Forside** (`#forside-container`): oversikt over alle lister
- **Listevisning** (`#liste-container`): aktiv handleliste med kategorier og varer
- **Sidebar** med fire faner: Basis, Kategorier, Skriv ut, Varsle

### Viktige JavaScript-funksjoner

| Funksjon | Hva den gjør |
|---|---|
| `lastInnLister()` / `lagreLister()` | Henter/lagrer listemeta fra Firebase |
| `tegnForside()` | Tegner forsiden med alle lister |
| `åpneListe(id)` | Bytter til listevisning for én liste |
| `hentData()` / `byggListeFraData()` | Henter og renderer en listes varer |
| `lyttPåListe(id)` | Setter opp Firebase-lytter for sanntidsoppdateringer |
| `leggTilVare()` | Legger til ny vare i aktiv liste |
| `hukAv(sjekk)` | Huker av/fra en vare |
| `lagreAlt()` | Lagrer all lokal state til Firebase |
| `syncOfflineKø()` | Synkroniserer ventende endringer når nett er tilbake |
| `initFirebase()` | Initialiserer Firebase-tilkobling |
| `lastInnEgneKategorier()` / `lagreEgneKategorier()` | Håndterer brukerdefin­erte kategorier |
| `hentForslagFraHistorikk()` | Genererer forslag basert på handlehistorikk |

## Firebase-oppsett

- **Database**: Firebase Realtime Database (`matplan-42a33`, region: europe-west1)
- **Lister lagres under**: `lister-meta` (metadata) og `lister/{id}` (varer)
- **Basisliste lagres under**: `lister/{id}/basis`
- Push-varsler via Firebase Cloud Messaging (konfig i `firebase-messaging-sw.js`)

## Teknisk stack

- Vanilla HTML/CSS/JavaScript (ingen bundler, ingen rammeverk)
- Firebase 9 (compat-versjon, lastes fra CDN)
- PWA med service worker og offline-kø
- Fungerer i nettleser og kan installeres som app på mobil

## Konvensjoner

- Norske variabel- og funksjonsnavn gjennomgående
- CSS-variabler i `:root` for farger – bruk disse ved nye stiler
- Dark mode via `@media (prefers-color-scheme: dark)`
- All Firebase-lagring er asynkron med `.set()` / `.on('value', ...)`
- Offline-endringer køes i `offlineKø[]` og synkroniseres via `syncOfflineKø()`

## Hva du IKKE skal røre

- `_arkiv/` – backup-filer, ikke rediger
