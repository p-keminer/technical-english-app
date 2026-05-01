# Ablaufplan: Spielwelt-Umbau der Lernapp

## Dokumentziel
Dieses Dokument ist die feste Arbeitsgrundlage fuer den Spielwelt-Umbau der Lernapp. Wir setzen die Arbeitspakete einzeln um und verifizieren jedes Paket, bevor das naechste begonnen wird.

Wichtigste Regel: Ein Paket gilt erst als fertig, wenn es funktional geprueft wurde und keine offensichtlichen UI- oder Navigationsfehler offen sind.

## Grundentscheidungen
- Sichtbare Navigation: keine Bottom-Navbar mehr, die Welt ist die Hauptnavigation.
- Steuerung: D-pad.
- State Machine: eigene typisierte Reducer-Machine, keine XState-Dependency.
- Rendering-Ziel: `@shopify/react-native-skia` fuer eine echte 2.5D-Isometric-Tilemap mit Sprite-Atlas.
- Stil: eigene chunky Engineering-Quest-Welt mit blockigen Sprites, nicht Pokemon-IP und nicht Debug-UI.
- Bestehende Lernseiten bleiben erhalten und werden ueber Weltobjekte geoeffnet.

## Arbeitsprinzip
- Jedes Paket bekommt ein klares Ergebnis, eine manuelle Pruefung und technische Checks.
- Nach jedem visuellen Paket wird im In-App-Browser geprueft.
- Nach jedem Routing- oder State-Paket wird geprueft, ob Rueckwege stimmen.
- Keine grossen Refactors ohne Zwischenzustand, der lauffaehig ist.
- Wenn ein Paket visuell nicht gut wirkt, wird es erst verbessert, bevor wir weiterziehen.

## Status
- Neuer Qualitaetsplan ab 2026-04-28: erster Skia-Hub-Renderer-Slice umgesetzt, um einen PNG-Sprite-Overlay-Pass ergaenzt und mit zusammenhaengender Hub-Inseloberflaeche nachgebessert; technisch geprueft und bereit zur Verifikation.
- Arbeitspaket 0: bereit zur manuellen Verifikation
- Arbeitspaket 1: angepasst auf Start-Reiter und bereit zur manuellen Verifikation
- Arbeitspaket 2: bereit zur manuellen Verifikation
- Arbeitspaket 3: bereit zur manuellen Verifikation
- Arbeitspaket 4: bereit zur manuellen Verifikation
- Arbeitspaket 5: bereit zur manuellen Verifikation
- Arbeitspaket 6: korrigiert auf Abschnittswelten und bereit zur manuellen Verifikation
- Arbeitspaket 6b: Fokus-Routen getrennt, technisch geprueft und bereit zur manuellen Verifikation
- Arbeitspaket 7: Quiz-Gate mit Statuslogik technisch geprueft und bereit zur manuellen Verifikation
- Arbeitspaket 8: erste Quest-/Blockwelt-Optik technisch geprueft und bereit zur manuellen Verifikation
- Arbeitspakete 9-10: warten auf Freigabe nach Verifikation

## Arbeitspaket 0: Dokument und Statusbasis
Ziel: Den festen Ablaufplan im Repo verankern.

Umsetzung:
- `docs/game-world-implementation-plan.md` anlegen.
- Entscheidungen, Arbeitspakete, Verifikationsliste und offenen Status dokumentieren.
- Bestehenden `docs/mvp-verification-plan.md` nicht ersetzen, sondern ergaenzen.

Verifikation:
- Dokument ist im Repo vorhanden.
- Keine App-Funktion wurde ueber dieses Paket hinaus veraendert.
- `git diff` zeigt das neue Plan-Dokument.

## Neuer Qualitaetsplan: AP1 Art Direction Lock
Ziel: Die visuelle Richtung fuer die hochwertige Spielwelt verbindlich sperren, bevor weiterer Code geschrieben wird.

Umsetzung:
- `docs/game-world-art-direction.md` anlegen.
- Genehmigte Referenzen, Palette, Kamera, Tile-Masse, Asset-Slots und No-Gos dokumentieren.
- Festhalten, dass der naechste technische Schritt Skia + Sprite-Manifest vorbereitet, statt React-Native-Views weiter zu stylen.

Verifikation:
- Art-Direction-Dokument ist vorhanden.
- Ablaufplan verweist auf den neuen Qualitaetsplan.
- Keine App-Funktion wurde veraendert.
- Der naechste Schritt ist eindeutig AP2: Renderer-Grenze und Skia-Vorbereitung.

## Neuer Qualitaetsplan: AP2 Renderer-Grenze und Skia-Vorbereitung
Ziel: Skia als Zielrenderer vorbereiten und die bestehende Weltansicht so entkoppeln, dass der sichtbare Renderer spaeter ausgetauscht werden kann.

Umsetzung:
- `@shopify/react-native-skia` als Expo-kompatible Dependency installieren.
- `src/world/renderer-contract.ts` als stabile Schnittstelle zwischen Simulation und Renderer anlegen.
- `WorldPlayfield` baut ein `WorldRendererMap`-, Entity- und Prompt-Modell.
- Der bisherige View-basierte Renderer bleibt als `LegacyIsometricWorldRenderer` erhalten, damit die App in AP2 visuell/funktional stabil bleibt.
- Bewegungen laufen ueber `onMove(direction)`, Interaktion ueber `onInteract()`.

Verifikation:
- App soll gleich aussehen und sich gleich bedienen lassen wie vor AP2.
- Hub/Unit/Section-Welten duerfen nicht kaputtgehen.
- `npm run typecheck`
- `npm run lint`

Technische Pruefung:
- `npm run typecheck`: bestanden
- `npm run lint`: bestanden

## Neuer Qualitaetsplan: AP3 Hub-Design-Slice statt abstrakter Tilemap
Ziel: Erst das konkrete Hub-Bildgefuehl abnehmen, bevor Tilemap-Parameter und Sprite-Slots hart festgelegt werden.

Umsetzung:
- Hub-Design per Image-Generation iterieren.
- Zweite Variante mit kleineren Interaktionsobjekten als Zielrichtung bestaetigen.
- Abgenommene Variante als `assets/images/concepts/engineering-quest-hub-approved.png` sichern.
- Art-Direction-Dokument um die abgenommene Hub-Richtung ergaenzen.

Verifikation:
- Hub wirkt wie eine spielbare 2.5D-Welt, nicht wie Debug-UI.
- Interaktionsobjekte sind kleiner skaliert und lassen begehbaren Raum.
- Datei ist im Projekt vorhanden.
- Naechster Schritt: Assets und Layout aus dieser Referenz extrahieren, nicht frei raten.

## Neuer Qualitaetsplan: AP4 Hub-Visual-Spec fuer Skia-Slice
Ziel: Aus dem abgenommenen Hub-Bild eine konkrete, code-nahe Render-Vorgabe ableiten.

Umsetzung:
- `src/world/hub-visual-spec.ts` anlegen.
- Approved Hub-Referenz, Skia-Ziel, Kamera, Palette und Layoutregeln festhalten.
- Stabile Asset-Keys fuer Hub-Tiles, Engineer, vier Hub-Objekte, Prompt und D-pad definieren.
- Fuer jedes Hub-Objekt Zielskalierung, Tile-Footprint, Hoehenhinweis und Anchor definieren.

Verifikation:
- App-Funktion bleibt unveraendert.
- Hub-Objekte sind fuer den kommenden Renderer kleiner als Menue-Buttons spezifiziert.
- Begehbarer Raum ist als Layoutregel festgehalten.
- `npm run typecheck`
- `npm run lint`

## Neuer Qualitaetsplan: AP5 Erster Skia-Hub-Renderer-Slice
Ziel: Nur den Hub mit Skia rendern, waehrend alle anderen Welten im Legacy-Renderer bleiben.

Umsetzung:
- `public/canvaskit.wasm` fuer die lokale Skia-Web-Vorschau bereitstellen.
- `src/components/skia-hub-world-renderer.tsx` anlegen.
- Hub-Wasser, Wasserlinien und isometrische Insel/Tiles mit Skia zeichnen.
- Engineer-Avatar und Hub-Objekte als transparente PNG-Sprites ueber dem Skia-Canvas platzieren, damit die Welt nicht wie reine Debug-Geometrie wirkt.
- D-pad und Interaktionsprompt bleiben als React-Native-Overlay, damit Input und Text nicht in den Canvas gezwungen werden.
- `WorldPlayfield` nutzt den Skia-Renderer nur fuer `worldId === 'hub'`; Unit- und Abschnittswelten bleiben unveraendert.

Verifikation:
- Start/Hub zeigt den neuen Skia-Slice.
- D-pad bewegt den Avatar weiter.
- Interagieren mit Vokabelheft, Unit-1-Station, Fortschritt und Setup funktioniert weiter.
- Unit- und Abschnittswelten bleiben sichtbar und bedienbar.
- `npm run typecheck`
- `npm run lint`

Technische Pruefung:
- `npm run typecheck`: bestanden
- `npm run lint`: bestanden
- `http://localhost:8082/`: HTTP 200 nach Server-Neustart
- Skia-Web-Ladereihenfolge korrigiert: CanvasKit wird im Browser vor dem Skia-Import geladen.
- Metro-Cache nach Skia-Web-Fix geleert und Server neu gestartet.
- Sprite-Overlay-Pass ergaenzt: `assets/images/world/sprites/` enthaelt erste transparente Hub-Sprites fuer Engineer, Vokabelheft, Unit-1-Station, Fortschrittsterminal und Setup-Toolbox.
- Inseloberflaeche nachgebessert: Gras wird nicht mehr als einzelne Debug-Kacheln gerendert, sondern als zusammenhaengende Inselmasse mit subtilen Details; Wege, Plattformen und aktive Interaktionsfelder bleiben als Orientierungsoverlays sichtbar.
- Hub-Boden nach Feedback bereinigt: Plattform-Overlays entfernt, weil sie wie fremde Hotspot-Pads wirkten; Innenwege wieder breit gezeichnet, aber Rand-Wegkacheln kleiner skaliert, damit sie nicht ueber die Inselkante hinausragen.
- Hub-Art-Slice klein begonnen: sichtbare Inselmasse deutlich groesser als internes Bewegungsgrid gemacht und erste blockige Randdetail-Cluster ergaenzt. Ziel ist eine Weltbuehne mit internem Grid, nicht ein sichtbares 7x6-Spielbrett.
- Erstes konkretes Randobjekt ergaenzt: kleiner blockiger Holzsteg am Inselrand als Test fuer Quest-artige Randdetails.
- Hub-Begehbarkeit korrigiert: internes Hub-Grid von 7x6 auf 9x8 erweitert, damit die groessere Insel nicht nur Dekoflaeche ist. Wegnetz auf das groessere Grid angepasst und der Holzsteg an einen echten Weganschluss unten links gekoppelt.

## Arbeitspaket 1: Start-Reiter als Spielwelt-Einstieg
Ziel: Den bestehenden Start-Reiter als stabilen Einstiegspunkt fuer den Spielwelt-Umbau nutzen, ohne Inhalte kaputtzumachen.

Umsetzung:
- Bestehende Tab-Struktur vorerst als stabile Huelle behalten.
- Start-Reiter zeigt vorerst den `Engineering Hub` Platzhalter.
- `/world` leitet zurueck auf den Start-Reiter, damit alte Test-URLs nicht brechen.
- Alte Lernseiten bleiben direkt erreichbar.

Verifikation:
- Appstart zeigt im Start-Reiter den `Engineering Hub` Platzhalter.
- `/world` zeigt keinen Unmatched-Route-Fehler, sondern fuehrt zurueck zum Start-Reiter.
- `/vocab`, `/progress`, `/settings`, `/section/[sectionId]`, `/quiz/[unitId]` oeffnen weiterhin.
- Die Tabbar darf in AP1 noch sichtbar sein; ihre spaetere Entfernung wird erst nach stabiler Welt-Navigation entschieden.
- `npm run typecheck`
- `npm run lint`

## Arbeitspaket 2: World-State-Machine ohne UI
Ziel: Erst die Logik bauen, bevor wir sie schoen machen.

Umsetzung:
- Neue Typen fuer `WorldId`, `WorldPosition`, `WorldObject`, `WorldDestination`, `WorldState`, `WorldEvent`.
- Reducer mit Zustaenden: `hub.exploring`, `hub.interacting`, `unit.exploring`, `unit.interacting`, `openingRoute`.
- Events: `MOVE_UP`, `MOVE_DOWN`, `MOVE_LEFT`, `MOVE_RIGHT`, `INTERACT`, `ENTER_WORLD`, `EXIT_WORLD`, `OPEN_ROUTE`, `CANCEL`.
- Kollisionen und Spielfeldgrenzen beruecksichtigen.
- Bewegung nur erlauben, wenn Zustand `exploring` ist.

Verifikation:
- Kleine Debug-Ausgabe zeigt aktuelle Welt, Position und nahe Objekte.
- Bewegungen ausserhalb der Map werden blockiert.
- Interaktion geht nur neben oder auf einem erlaubten Objekt.
- `npm run typecheck`

## Arbeitspaket 3: Minimal spielbare Hub-Welt
Ziel: Ein erster begehbarer Screen, noch bewusst mit Platzhaltern.

Umsetzung:
- `/world` rendert eine einfache Hub-Map.
- Ingenieur-Avatar wird sichtbar auf einer Grid-Position dargestellt.
- D-pad bewegt den Avatar feldweise.
- Platzhalterobjekte: Vokabelheft, Unit-1-Signalstation, Fortschritts-Terminal, Werkzeugkiste.
- Ein kleiner Interaktionsprompt erscheint, wenn der Avatar an einem Objekt steht.

Verifikation:
- App startet direkt in der Welt.
- D-pad funktioniert auf Desktop-Web und Mobile-Viewport.
- Avatar verlaesst die Map nicht.
- Interaktionsprompt erscheint nur an passenden Positionen.
- Screenshot im In-App-Browser pruefen.

## Arbeitspaket 4: Hub-Objekte oeffnen bestehende Screens
Ziel: Die Welt ersetzt die Hauptnavigation funktional.

Umsetzung:
- Vokabelheft oeffnet `/vocab`.
- Fortschritts-Terminal oeffnet `/progress`.
- Werkzeugkiste oeffnet `/settings`.
- Rueckweg von diesen Screens fuehrt zurueck in die Hub-Welt.
- Weltposition bleibt beim Zurueckkommen erhalten.

Verifikation:
- Jede Hub-Interaktion oeffnet den richtigen Screen.
- Zurueck fuehrt in den Hub, nicht auf eine falsche Content-Seite.
- Die Bottom-Navbar bleibt ueberall verschwunden.
- Weltposition bleibt erhalten.
- `npm run typecheck`
- Browser-Klicktest im In-App-Browser.

## Arbeitspaket 5: Unit-1-Welt als eigene Map
Ziel: Unit 1 bekommt ihre eigene kleine thematische Welt.

Umsetzung:
- Unit-1-Signalstation im Hub wechselt in die Unit-1-Welt.
- Unit-1-Welt bekommt eigene Map, eigene Startposition und eigenes Farbschema.
- Platzhalterobjekte fuer 1A, 1B, 1C, 1D und Abschlussquiz.
- Ein Ausgangsobjekt fuehrt zurueck in den Hub.

Verifikation:
- Hub -> Unit-1-Welt funktioniert.
- Unit-1-Welt -> Hub funktioniert.
- D-pad und Interaktion funktionieren unabhaengig in beiden Welten.
- State Machine kennt sauber `hub` und `unit-1`.
- Browser-Screenshot von Hub und Unit-Welt.

## Arbeitspaket 6: Abschnittswelten als dritte Ebene
Ziel: Die Unit-Welt fuehrt nicht direkt in Lerninhalte, sondern erst in eigene begehbare Abschnittswelten.

Umsetzung:
- 1A-Objekt betritt eine eigene 1A-Welt zum Thema GPS/Funktionen/Anwendungen.
- 1B-Objekt betritt eine eigene 1B-Welt zum Thema Space Elevator/Prozesse.
- 1C-Objekt betritt eine eigene 1C-Welt zum Thema technische Vorteile/Performance.
- 1D-Objekt betritt eine eigene 1D-Welt zum Thema vereinfachte technische Erklaerungen.
- Jede Abschnittswelt hat einen Rueckweg zur Unit-1-Welt.
- Jede Abschnittswelt zeigt zunaechst eigene Platzhalterobjekte fuer Grammatik, Vokabeln, Listening und Uebungen.
- Die konkreten Lerninhalte werden noch nicht aus den Abschnittswelten geoeffnet; das kommt im naechsten Paket.

Verifikation:
- Unit-1-Welt -> 1A-Welt funktioniert.
- Unit-1-Welt -> 1B-Welt funktioniert.
- Unit-1-Welt -> 1C-Welt funktioniert.
- Unit-1-Welt -> 1D-Welt funktioniert.
- Jede Abschnittswelt hat sichtbare thematische Platzhalterobjekte.
- Rueckweg aus jeder Abschnittswelt fuehrt in die Unit-1-Welt.
- D-pad und Interaktion funktionieren in allen Abschnittswelten.
- `npm run typecheck`
- `npm run lint`

## Arbeitspaket 6b: Abschnittswelt-Objekte oeffnen Lerninhalte
Ziel: Erst aus den Abschnittswelten heraus werden die bestehenden Lernseiten geoeffnet.

Umsetzung:
- Grammatik-/Intro-Objekt oeffnet nur Grammatikthemen und grammatikspezifische Uebungen.
- Vokabel-Objekt oeffnet nur die Vokabeln des Abschnitts.
- Listening-Objekt oeffnet nur Audio-Tracks und Listening-Uebungen des Abschnitts.
- EX-/Uebungs-Objekt oeffnet nur die Zuordnungsuebung (`matching`) des Abschnitts.
- Rueckweg aus dem Lerninhalt fuehrt zur jeweils aktiven Abschnittswelt, nicht direkt zur Unit-Welt.

Verifikation:
- Aus jeder Abschnittswelt laesst sich mindestens ein Lerninhalt oeffnen.
- Rueckweg fuehrt in die richtige Abschnittswelt.
- Position und Weltzustand bleiben beim Rueckweg erhalten.
- `npm run typecheck`
- `npm run lint`

## Arbeitspaket 7: Abschlussquiz-Objekt
Ziel: Das Unit-Quiz wird als Weltobjekt eingebunden.

Umsetzung:
- Quiz-Objekt zeigt Status: gesperrt, bereit, bestanden, uebersprungen.
- Wenn bereit, oeffnet es `/quiz/[unitId]`.
- Wenn gesperrt, zeigt es einen kurzen Dialog.
- Nach Bestehen oder Ueberspringen fuehrt der Rueckweg in die Unit-1-Welt.
- Reset in Setup setzt den Quizstatus zurueck, weil das Gate den bestehenden Lernstore-Status liest.

Verifikation:
- Gesperrter Zustand wird korrekt angezeigt.
- Quiz startet korrekt, wenn verfuegbar.
- Bestehen und Ueberspringen aktualisieren Status.
- Rueckwege bleiben korrekt.
- Reset in Setup setzt Quizstatus wieder zurueck.
- `npm run typecheck`
- `npm run lint`

## Arbeitspaket 8: Visuelle erste Ausbaustufe
Ziel: Aus dem funktionalen Prototyp wird eine erste schoene Spielwelt.

Art-Direction:
- Genehmigtes Zielbild: `assets/images/concepts/engineering-quest-art-direction.png`.
- Erste verwendete Map-Buehne: `assets/images/world/engineering-quest-map.png`.
- Zielstil: helle, blockige, isometrische Engineering-Inselwelt mit voxelartigen Objekten und einem blockigen Engineer-Avatar.

Umsetzung:
- Kraeftigere, spielerische Palette fuer Hub, Unit-Welt und Abschnittswelten.
- Chunky Platzhalterobjekte mit klarer Silhouette und Status-Tokens.
- Ingenieur-Avatar als einfache Figur mit Helm/Overall-Anmutung.
- Press-Feedback beim D-pad und bei Interaktion.
- Interaktionsdialoge als kompakte Spiel-UI, nicht als normale App-Karten.
- Alte AP-/Debugkarten werden aus der normalen Spielansicht entfernt.
- React-Native-Tile-Debugoptik wird durch echte generierte Map-Art als visuelle Buehne ersetzt.

Verifikation:
- Welt wirkt auf Mobile nicht wie ein Formularscreen.
- Objekte sind klar voneinander unterscheidbar.
- D-pad verdeckt keine wichtigen Objekte.
- Screenshots Hub, Unit-Welt, Dialog, Content-Rueckweg.
- Manuelle Designrunde vor dem naechsten Paket.

## Arbeitspaket 9: Persistenz und Komfort
Ziel: Die Welt fuehlt sich stabil an, auch nach Screenwechseln.

Umsetzung:
- Aktuelle Welt und Avatarposition waehrend App-Laufzeit im `WorldProvider` halten.
- Optional spaeter: letzte Welt/Position lokal speichern.
- "Zurueck" aus Content nutzt immer den zuletzt aktiven Weltkontext.
- Debug-Anzeige nur im Entwicklungsmodus.

Verifikation:
- Wechsel zwischen Welt und Content verliert die Position nicht.
- Reload/Neustart faellt mindestens sauber auf Hub-Startposition zurueck.
- Keine fehlerhaften Rueckspruenge auf alte Tabs oder Startseiten.

## Arbeitspaket 10: Gesamt-QA und Feinschliff
Ziel: Der Umbau ist stabil genug, um danach Inhalte und Assets schrittweise schoener zu machen.

Verifikation:
- Kompletter Flow: Appstart -> Hub -> Unit 1 -> 1A -> zurueck -> 1B -> zurueck -> Quiz -> Hub.
- Kompletter Flow: Hub -> Vokabeln -> zurueck -> Hub.
- Kompletter Flow: Hub -> Setup -> Reset -> Hub -> Fortschritt ist zurueckgesetzt.
- Keine Bottom-Navbar auf irgendeiner Seite.
- Keine kaputten Rueckwege.
- `npm run typecheck`
- `npm run lint`
- In-App-Browser-Review mit Mobile-Viewport.
- Optional danach iPhone/Expo-Go-Check, sofern SDK-Version kompatibel ist.

## Abnahmeregel
Wir gehen erst zum naechsten Arbeitspaket, wenn das vorherige funktional verifiziert ist. Wenn ein Paket zwar technisch laeuft, aber sich schlecht anfuehlt, wird es nicht durchgewunken, sondern direkt nachgebessert. Genau so verhindern wir, dass sich viele kleine Edgecases ansammeln.
