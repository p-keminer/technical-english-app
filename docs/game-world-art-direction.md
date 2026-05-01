# Art Direction: Engineering Quest World

## Ziel
Dieses Dokument sperrt die visuelle Richtung fuer den Spielwelt-Umbau. Es verhindert, dass wir wieder in eine Debug-Ansicht aus Rechtecken, Labels und Formular-Karten abrutschen.

Der Zielstil ist eine eigene, freundliche, blockige 2.5D-Engineering-Welt: isometrische Inseln, klare voxelartige Formen, kraeftige Farben, einfache Silhouetten und sofort lesbare Interaktionsobjekte.

## Referenzen
- Genehmigtes Konzeptbild: `assets/images/concepts/engineering-quest-art-direction.png`
- Abgenommener Hub-Slice: `assets/images/concepts/engineering-quest-hub-approved.png`
- Bisherige Map-Buehne aus dem Konzept: `assets/images/world/engineering-quest-map.png`
- Bisheriger Engineer-Crop: `assets/images/world/engineer-avatar.png`

Diese Dateien sind visuelle Referenzen, aber noch keine finale Produktionspipeline. Der naechste Umbau soll nicht ein grosses Hintergrundbild mit Hotspots sein, sondern eine echte Tilemap mit Sprites.

## Stilregeln
- Die Welt wirkt wie ein kleines spielbares Diorama, nicht wie eine App-Seite.
- Formen sind blockig, weich gerundet und chunky.
- Die Kamera ist fix isometrisch/2.5D, mit lesbarer Inselkante und klarer Hoehe.
- Objekte haben eine eigene Silhouette, nicht nur Text-Tokens.
- Texte bleiben ausserhalb des Playfields oder als kurze Spiel-Prompts.
- Die Lern-App bleibt Engineering-orientiert: Werkbank, Signalstation, Terminal, Toolbox, Blueprint, Funkmast, Laborobjekte.
- Keine Pokemon-Figuren, keine Logos, keine rekonstruierten oder kopierten Assets aus fremden Spielen.

## Kamera und Tile-Masse
- Viewpoint: feste isometrische Kamera von oben/vorne.
- Logisches Grid: quadratische Weltkoordinaten `x/y`.
- Renderprojektion: `screenX = (x - y) * tileWidth / 2`, `screenY = (x + y) * tileHeight / 2`.
- Startziel fuer Hub-Tiles: `tileWidth = 96`, `tileHeight = 56`.
- Blocktiefe fuer Insel-/Tile-Seiten: ca. `18-28` px bei 1x-Assetmass.
- Anchor fuer Figuren und Objekte: bottom-center auf dem Ziel-Tile.
- Z-Sort: nach `x + y`, danach Objektklasse und lokale Hoehe.

## Farbpalette
- Water bright: `#11B8EA`
- Water deep: `#0782B6`
- Grass top: `#8FEA67`
- Grass side: `#3FA34D`
- Path sand: `#F0C96D`
- Path side: `#B8782B`
- Engineering yellow: `#FFD43B`
- Safety orange: `#FF7A2E`
- Tech blue: `#2F7DF4`
- Terminal cyan: `#21C7D9`
- Ink/navy: `#0A2342`
- Cream UI: `#FFF3DE`

Die Palette ist bewusst kraeftig. Blasse Pastellflaechen sind fuer normale Cards okay, aber nicht fuer die Spielwelt.

## Hub-Slice: benoetigte Assets
Der erste hochwertige Slice ist nur der Hub. Er muss diese Assets besitzen:

- `tile.grass.center`
- `tile.grass.edge`
- `tile.path.center`
- `tile.water.decor`
- `avatar.engineer.idle.south`
- `avatar.engineer.idle.north`
- `avatar.engineer.idle.east`
- `avatar.engineer.idle.west`
- `object.vocab_notebook`
- `object.unit1_signal_station`
- `object.progress_terminal`
- `object.settings_toolbox`
- `ui.interaction_prompt`
- `ui.dpad`

Assets bekommen stabile Manifest-Keys. Dateinamen sind nicht die oeffentliche API des Renderers.

## Abgenommene Hub-Richtung
- Der Hub aus `assets/images/concepts/engineering-quest-hub-approved.png` ist die aktuelle Zielreferenz.
- Die Interaktionsobjekte sollen kleiner skalieren als in der ersten Konzeptvariante.
- Die Insel braucht sichtbaren begehbaren Raum zwischen den Objekten.
- Objekte wirken wie Props auf Tiles, nicht wie grosse Menue-Buttons.
- Diese Referenz definiert Proportionen, Sättigung, Lichtstimmung und Objektabstand fuer den ersten Skia-Slice.
- Die Referenz wird nicht als finaler Hotspot-Hintergrund verwendet; sie ist Vorlage fuer Tilemap, Sprite-Atlas und Objektpositionierung.

## Avatar-Regeln
- Der Engineer ist klein, blockig und freundlich.
- Gelber Helm, blauer oder dunkler Overall, orange/gelbe Engineering-Akzente.
- Lesbare Augen und Kopfhaltung auch bei kleiner Darstellung.
- Kein realistischer Mensch und kein generischer Emoji-/Icon-Stil.
- Idle reicht fuer den ersten Hub-Slice; Walk-Frames kommen spaeter.

## Objektregeln
- Jedes Objekt muss ohne Text unterscheidbar sein.
- Das Vokabelheft sieht wie ein blockiges Buch/Notizheft aus.
- Die Unit-1-Station wirkt wie Signalstation, Antenne oder Gate.
- Der Fortschritt wirkt wie Terminal/Monitor.
- Setup wirkt wie Toolbox/Werkzeugkiste.
- Statuslabels duerfen klein ergaenzen, aber nicht die Silhouette ersetzen.

## UI-Regeln
- Das Playfield hat Vorrang; keine grossen Erklaerkarten ueber der Welt.
- D-pad sitzt am Rand und verdeckt keine wichtigen Objekte.
- Interaktion ist ein kurzer Prompt wie `Interagieren: Vokabelheft`, kein langer Dialog.
- Debug-Informationen sind nur im Entwicklungsmodus sichtbar.
- Die normale Spielansicht hat keine Bottom-Navbar.

## No-Gos
- Keine grossen rechteckigen Karten als Weltobjekte.
- Keine Welt, die hauptsaechlich aus Textlabels besteht.
- Keine rein farbigen View-Boxen als finale Optik.
- Kein statisches Komplettbild mit unsichtbaren Hotspots als Endzustand.
- Keine automatische Implementierung mehrerer Arbeitspakete ohne Zwischenverifikation.

## Abnahmekriterien fuer AP1
- Dieses Dokument existiert im Repo.
- Der Ablaufplan verweist auf dieses Dokument.
- Keine App-Funktion wurde fuer AP1 geaendert.
- Der naechste technische Schritt ist klar: AP2 bereitet die Skia-Renderer-Grenze vor.
