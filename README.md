# Technical English App

## Deutsche Version

Lokale `Expo + React Native` Lernapp fuer persoenliches Engineering-English-Lernen auf dem iPhone und in der Web-Vorschau.

### Repo-Umfang

Dieses Repository enthaelt nur:

- App-Quellcode, Navigation und UI-Komponenten
- lokale Persistenz, Uebungsrenderer und Fortschrittslogik
- Import- und Build-Skripte fuer private lokale Inhalte
- oeffentliche Dokumentation und Sicherheitschecks

Dieses Repository enthaelt bewusst nicht:

- Kursbuch-PDFs
- Audio-ZIP-Dateien oder MP3-Dateien
- extrahierte Buchseiten
- vollstaendige Transkripte
- Loesungsbuch- oder Answer-Key-Inhalte
- generierte private Seed-Bundles
- Screenshots, die aus dem Buch abgeleitete Lerninhalte zeigen

Private Lerndaten bleiben lokal unter `private-content/` und werden von Git ignoriert.

### Rechtlicher Hinweis und Content-Sicherheit

Diese App ist ein persoenliches Lernwerkzeug. Sie ist nicht mit einem Verlag, Autor, Rechteinhaber oder Markeninhaber verbunden, wird nicht von diesen unterstuetzt und nicht von diesen vertrieben.

Um echte Lerninhalte zu verwenden, musst du deine eigenen rechtmaessig erworbenen Kursmaterialien lokal bereitstellen. Committe oder veroeffentliche keine Originalbuecher, Audios, Transkripte, Loesungen, extrahierten Inhalte oder daraus generierten privaten Lerninhalte.

Bitte lies [LEGAL.md](./LEGAL.md), bevor du dieses Repository teilst oder veroeffentlichst.

### Lokales Setup

1. Abhaengigkeiten installieren:

```bash
npm install
```

2. Deine rechtmaessig vorhandenen privaten Lernmaterialien lokal auf deinem Rechner ablegen.

3. Das lokale Private-Content-Modul bauen:

```bash
npm run content:build
```

4. Die App starten:

```bash
npm run start
```

Ohne lokale private Inhalte bleibt das Repository eine Code-Huelle und liefert keine urheberrechtlich geschuetzten Kursmaterialien mit.

### Lokale Offline-PWA fuer iPhone

Fuer eine kostenlose iPhone-Homescreen-Version kann dieses Projekt einen lokalen PWA-Export in `dist/` erzeugen.

Unter Windows per Doppelklick starten:

```text
start-pwa-server.cmd
```

Das Skript:

- erzeugt ein lokales HTTPS-Zertifikat in `.local-https/`
- baut das lokale Private-Content-Bundle aus deinen lokalen Dateien neu
- exportiert die App fuer Web
- ergaenzt PWA-Metadaten, App-Icon, Offline-Seite und Service Worker
- stellt `dist/` per HTTPS im lokalen Netzwerk bereit, normalerweise auf Port `8443`
- stellt zusaetzlich das lokale Root-Zertifikatsprofil per HTTP bereit, normalerweise auf Port `8091`

Ersteinrichtung auf dem iPhone:

1. `start-pwa-server.cmd` doppelklicken.
2. Die angezeigte `Certificate install URL` auf dem iPhone in Safari oeffnen.
3. `local-root-ca.mobileconfig` herunterladen.
4. Das Profil unter `Einstellungen -> Allgemein -> VPN & Geraeteverwaltung` installieren.
5. Volles Vertrauen unter `Einstellungen -> Allgemein -> Info -> Zertifikatsvertrauenseinstellungen` aktivieren.
6. Die angezeigte HTTPS-`LAN URL for phone preview` oeffnen.
7. In Safari `Teilen -> Zum Home-Bildschirm` verwenden.
8. Die neue Homescreen-App einmal direkt mit laufendem Server und aktivem WLAN oeffnen.
9. Warten, bis die Startseite geladen ist. Danach kann der Flugmodus-/Offline-Test gemacht werden.

Wenn `Zertifikatsvertrauenseinstellungen` nur Trust-Store-Versionen zeigt, wurde das Profil noch nicht erfolgreich installiert. Oeffne die Zertifikats-URL erneut und pruefe, ob das `.mobileconfig`-Profil unter `VPN & Geraeteverwaltung` erscheint.

Wenn die Homescreen-App offline nur `Safari kann die Seite nicht oeffnen` zeigt, wurde sie wahrscheinlich angelegt, bevor der Service Worker fertig installiert war. Loesung: Server starten, iPhone wieder ins WLAN, Homescreen-App einmal online oeffnen und kurz warten. Falls das nicht reicht, die Homescreen-App loeschen, die HTTPS-URL in Safari neu oeffnen und erneut `Zum Home-Bildschirm` ausfuehren.

Fuer spaetere Updates: `start-pwa-server.cmd` erneut doppelklicken, die HTTPS-PWA einmal auf dem iPhone oeffnen und kurz warten, bis die neue Version geladen wurde.

Wichtige iOS-Einschraenkung: Offline-Caching per Service Worker braucht einen sicheren Kontext. `localhost` funktioniert nur auf demselben Geraet; ein iPhone braucht HTTPS mit einem vertrauten lokalen Zertifikat. Der generierte Ordner `dist/` und die Zertifikatsdateien in `.local-https/` werden von Git ignoriert und koennen private lokale Lerninhalte oder geraetespezifisches Vertrauensmaterial enthalten.

### Verhalten nach frischem Clone

Wenn jemand dieses Repository von GitHub klont und ohne private lokale Daten startet, zeigt die App einen Setup-Hinweis statt echter Lerneinheiten.

Der oeffentliche Clone enthaelt:

- App-Layout und Navigation
- leere Private-Content-Platzhalter
- Sicherheitschecks und Import-/Build-Skripte

Der oeffentliche Clone enthaelt nicht:

- echte Unit-Uebungen
- aus dem Kursbuch abgeleitete Vokabeln
- lokale Audios
- Transkripte
- Loesungen

Um aus der Huelle eine vollstaendige persoenliche Lernapp zu machen, muss die nutzende Person eigene rechtmaessig vorhandene Materialien lokal hinzufuegen und `private-content/` auf dem eigenen Rechner bauen.

### Checks vor Commit oder Push

Ausfuehren:

```bash
npm run repo:safety
npm run content:check
npm run typecheck
npm run lint
```

Fuer Route-Smoke-Tests, waehrend ein Expo- oder PWA-Server laeuft:

```bash
npm run qa:routes
```

### Architektur

- `src/app/`: Expo-Router-Screens
- `src/components/`: wiederverwendbare UI- und Uebungskomponenten
- `src/lib/`: Persistenz, Auswertung und Repository-Logik
- `src/providers/`: App-State-Provider
- `src/types/`: Content-Schema
- `scripts/content/`: private Build- und Repo-Safety-Skripte
- `scripts/pwa/`: Offline-PWA-Export, Zertifikatserzeugung und Checks
- `docs/`: Planungs- und Verifikationsdokumente

### Veroeffentlichungsregel

Nie pushen, bevor `npm run repo:safety` erfolgreich war. Ein oeffentlicher Clone darf keine privaten Lerninhalte enthalten und auch nicht genug extrahiertes Material, um das urspruengliche Kursmaterial zu rekonstruieren.

---

## English Version

Local `Expo + React Native` learning app for personal engineering-English study on iPhone and web preview.

### Repo Scope

This repository contains only:

- app source code, navigation and UI components
- local persistence, exercise rendering and progress logic
- private-content import/build scripts
- public documentation and safety checks

This repository intentionally does not contain:

- course-book PDFs
- audio ZIPs or MP3 files
- extracted book pages
- full transcripts
- answer-key content
- generated private seed bundles
- screenshots that reveal book-derived learning content

Private study data stays local under `private-content/` and is ignored by Git.

### Legal And Content Safety

This app is a personal study tool. It is not affiliated with, endorsed by, or distributed by any textbook publisher, author, trademark owner or rights holder.

To use real study content, you must provide your own legally obtained course materials locally. Do not commit or publish any original book, audio, transcript, answer-key, extracted, or generated private learning content.

See [LEGAL.md](./LEGAL.md) before publishing or sharing this repository.

### Local Setup

1. Install dependencies:

```bash
npm install
```

2. Place your legally obtained private learning files locally on your machine.

3. Build the local private-content module:

```bash
npm run content:build
```

4. Start the app:

```bash
npm run start
```

Without local private content, the repo remains a code shell and does not provide the copyrighted course material.

### Local Offline PWA For iPhone

For a free iPhone home-screen version, this project can create a local PWA export in `dist/`.

On Windows, double-click:

```text
start-pwa-server.cmd
```

The script:

- creates a local HTTPS certificate in `.local-https/`
- rebuilds the local private-content bundle from your local files
- exports the app for web
- adds PWA metadata, an app icon, an offline page and a service worker
- serves `dist/` over HTTPS on your local network, usually on port `8443`
- also serves the local root certificate profile over HTTP, usually on port `8091`

First-time iPhone setup:

1. Double-click `start-pwa-server.cmd`.
2. Open the printed `Certificate install URL` on the iPhone in Safari.
3. Download `local-root-ca.mobileconfig`.
4. Install the profile under `Settings -> General -> VPN & Device Management`.
5. Enable full trust under `Settings -> General -> About -> Certificate Trust Settings`.
6. Open the printed HTTPS `LAN URL for phone preview`.
7. In Safari, use `Share -> Add to Home Screen`.
8. Open the new home-screen app once while the server is still running and Wi-Fi is active.
9. Wait until the start screen has loaded. After that, you can test airplane/offline mode.

If `Certificate Trust Settings` only shows trust-store versions, the profile was not installed successfully yet. Reopen the certificate install URL and make sure the `.mobileconfig` profile appears under `VPN & Device Management`.

If the home-screen app only shows `Safari cannot open the page` while offline, it was probably added before the service worker finished installing. Fix: start the server, put the iPhone back on Wi-Fi, open the home-screen app once online and wait briefly. If that is not enough, remove the home-screen app, open the HTTPS URL in Safari again and run `Add to Home Screen` again.

For later updates, double-click `start-pwa-server.cmd` again, open the HTTPS PWA once on the iPhone and wait for the update to load.

Important iOS limitation: service-worker offline caching requires a secure context. `localhost` works on the same machine, but an iPhone needs HTTPS with a trusted local certificate. The generated `dist/` folder and `.local-https/` certificate files are ignored by Git and may contain private local learning content or machine-specific trust material.

### Fresh Clone Behavior

If someone clones this repository from GitHub and starts it without private local data, the app opens with a setup notice instead of the real learning units.

The public clone contains:

- the app layout and navigation
- empty private-content placeholder wiring
- safety checks and import/build scripts

The public clone does not contain:

- real unit exercises
- vocabulary derived from the course book
- local audio
- transcripts
- answer keys

To turn the shell into a full personal study app, the user must add their own legally obtained materials locally and build `private-content/` on their own machine.

### Checks Before Any Commit Or Push

Run:

```bash
npm run repo:safety
npm run content:check
npm run typecheck
npm run lint
```

For route smoke testing while an Expo or PWA server is running:

```bash
npm run qa:routes
```

### Architecture

- `src/app/`: Expo Router screens
- `src/components/`: reusable UI and exercise components
- `src/lib/`: persistence, evaluation and repository logic
- `src/providers/`: app state providers
- `src/types/`: content schema
- `scripts/content/`: private build and repo-safety scripts
- `scripts/pwa/`: offline PWA export, certificate generation and checks
- `docs/`: planning and verification documents

### Publication Rule

Never push until `npm run repo:safety` passes. A public clone must not include private learning content or enough extracted material to reconstruct the original course material.
