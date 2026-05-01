# MVP Verification Plan

## Ziel
Dieser Plan verifiziert den bisherigen Stand der lokalen iPhone-Lernapp nach dem Web-Umbau. Er trennt klar zwischen:

- `Build-Verifikation`
- `Repo-/Content-Sicherheit`
- `Web-Vorschau im integrierten Browser`
- `Native iPhone-Verifikation`
- `Didaktik- und Inhaltsabgleich`

## Aktueller Stand
Bereits erfolgreich geprüft:

- `npm run typecheck`
- `npm run lint`
- `npx expo export --platform web`
- integrierter Browser auf `http://localhost:8082/` zeigt jetzt den echten Unit-1-Startscreen statt des SQLite-Fehlers
- exportierter Web-Bundle enthält das lokale Unit-1-Seed statt des Stub-Moduls

Noch offen als wiederholbare QA:

- tiefer UI-Durchlauf aller Tabs
- vollständiger Section-Flow
- Audio-Verhalten in Web und Native
- Persistenz-Regressionen nach Interaktionen
- Native End-to-End-Test auf iPhone

## Testumgebungen

### 1. Web QA
- Quelle: statischer Export `dist/`
- Server: `python -m http.server 8082 -d dist`
- Zweck: schneller UI-, Routing- und State-Sanity-Check im integrierten Browser

### 2. Native QA
- Quelle: `npm run start`
- Ziel: Expo Go auf iPhone
- Zweck: echte Audio-, Touch- und Persistenzprüfung auf dem Hauptzielgerät

### 3. Repo Safety QA
- Quelle: Git-Worktree und Safety-Skript
- Zweck: sicherstellen, dass keine Buchinhalte versehentlich ins Repo wandern

## Arbeitspakete und Verifikation

### AP1: Grundgerüst und Navigation
Zu prüfen:
- App startet ohne Crash
- Tabs `Start`, `Unit 1`, `Review`, `Fortschritt`, `Setup` sind sichtbar
- Routing zu `/section/[sectionId]` funktioniert
- Zurücknavigation funktioniert

Checks:
- Startscreen im Browser laden
- Jeden Tab einmal öffnen
- Von `Start` und `Unit 1` in einen Abschnitt springen

Abnahme:
- kein roter Fehlerbildschirm
- alle Hauptscreens rendern
- keine leeren oder blockierten Routen

### AP2: Private-Content-Pipeline
Zu prüfen:
- `npm run content:build` erzeugt `private-content/generated/index.ts`
- Audio-Dateien sind den Track-Keys zugeordnet
- die Bridge-Datei zeigt lokal auf das generierte Seed

Checks:
- Build-Skript ausführen
- `src/private-content/runtime.ts` kontrollieren
- Stichprobe aus `private-content/generated/index.ts`

Abnahme:
- `hasPrivateContent = true`
- `unitSeedBundle` vorhanden
- alle `track-1-x` Assets auflösbar

### AP3: Repo- und Rechte-Schutz
Zu prüfen:
- `private-content/` ist untracked
- keine PDFs, ZIPs oder MP3s sind git-tracked
- die Bridge-Datei enthält keinen eigentlichen Buchinhalt

Checks:
- `npm run repo:safety`
- `git status --short`
- Sichtprüfung der Bridge-Datei

Abnahme:
- Safety-Skript grün
- keine privaten Lernmaterialien im Track-Set

### AP4: Persistenz und lokaler State
Zu prüfen:
- Dashboard, Review und Fortschritt werden aus Seed + Progress korrekt berechnet
- Web-Fallback speichert Lernstand lokal
- Native Provider lädt SQLite-Daten korrekt

Checks:
- eine Übung korrekt lösen
- eine Vokabel auf `review` setzen
- einen Track als gehört markieren
- App/Browser neu laden

Abnahme:
- Ergebnisse bleiben erhalten
- Kennzahlen auf `Start`, `Review` und `Fortschritt` ändern sich konsistent

### AP5: Grammatik- und Vokabel-Lernlogik
Zu prüfen:
- Grammatikblöcke werden im richtigen Abschnitt angezeigt
- Vokabelstatus `new`, `review`, `learned` funktioniert
- Review-Liste zeigt passende Vokabeln

Checks:
- Abschnitt öffnen
- drei Vokabeln unterschiedlich markieren
- `Review` und `Fortschritt` gegenprüfen

Abnahme:
- Statuswechsel sofort sichtbar
- `learned` reduziert offene Wiederholungen
- Beispiele und deutsche Erläuterungen werden vollständig angezeigt

### AP6: Exercise Runner
Zu prüfen:
- alle sechs MVP-Typen rendern
- richtige Antworten werden als korrekt gespeichert
- falsche Antworten landen in der Review-Queue
- Lösungshinweis wird angezeigt

Checks:
- je Typ mindestens eine Aufgabe bearbeiten:
- `multiple_choice`
- `matching`
- `cloze`
- `ordering`
- `short_answer`
- `listening_cloze`

Abnahme:
- kein UI-Blocker beim Submit
- korrekt/falsch ist nachvollziehbar
- nach Reload bleibt `lastResult` erhalten

### AP7: Listening-Modul
Zu prüfen:
- Track-Karten rendern
- Transcript-Toggle funktioniert
- `Als gehört` aktualisiert Progress
- Native Audio spielt echte Dateien ab

Checks:
- Web: Transcript und Statusfluss prüfen
- Native: Play/Pause, Ende eines Tracks, erneutes Öffnen

Abnahme:
- Status wechselt auf `Gehört`
- Transcript bleibt lesbar
- Native Audio startet ohne Asset-Fehler

### AP8: Fortschritt und Tagesnutzung
Zu prüfen:
- `Heute weiter mit` zeigt sinnvollen Abschnitt
- Prozentanzeigen stimmen mit dem echten Stand überein
- Review-Zähler reagiert auf Fehler und Vokabelstatus

Checks:
- zuerst frischer Stand
- dann mehrere Interaktionen durchführen
- `Start`, `Review`, `Fortschritt` vergleichen

Abnahme:
- Zahlen sind konsistent über alle Screens
- Continue-Section springt nicht zufällig

### AP9: Setup- und Fallback-Verhalten
Zu prüfen:
- ohne lokales Seed erscheint der Setup-Screen
- mit Seed erscheint der echte Dashboard-Screen
- Web nutzt keinen SQLite-Pfad mehr als Hard-Blocker

Checks:
- optional Bridge lokal auf Stub zurückstellen
- Build erneut testen
- danach wieder Seed aktivieren

Abnahme:
- beide Zustände sind stabil
- kein `wa-sqlite.wasm`-Fehler mehr

## Edge-Case-Checkliste
- Reload mitten in einer Section
- mehrfaches schnelles Tippen auf Statusbuttons
- `matching` unvollständig lassen und dann abschicken
- `ordering` mehrmals hoch/runter verschieben
- Track als gehört markieren ohne Audio-Play
- falsche Übung später korrekt lösen
- Vokabel von `learned` zurück auf `new`
- Öffnen einer ungültigen `sectionId`

## Empfohlene Reihenfolge für die nächste Verifikation
1. Web Smoke-Test aller Tabs und einer kompletten Section
2. Web Persistenz-Test mit Reload
3. Native iPhone Smoke-Test
4. Native Audio-Test
5. Inhaltsabgleich gegen Buch, Answer Key und Audio-Transkripte
6. Abschluss mit `npm run repo:safety`

## Abnahmekriterium für den MVP
Der MVP ist abnehmbar, wenn:

- der komplette Unit-1-Flow ohne PDF-Wechsel nutzbar ist
- State, Review und Fortschritt nach Reload stabil bleiben
- Native Audio auf dem iPhone zuverlässig funktioniert
- der öffentliche Repo-Zustand keine privaten Buchmaterialien enthält
