# Content Quality Checklist

## Ziel
Dieses Dokument ist die feste Checkliste fuer die inhaltliche Abnahme der Lernapp. Die technische Basis ist vorhanden; jetzt geht es darum, jede Unit didaktisch sauber, konsistent und lernbar zu machen.

Wichtig: Wir pruefen klein und wiederholbar. Eine Unit gilt erst als inhaltlich abgenommen, wenn Grammatik, Vokabeln, Listening, Uebungen, Loesungen und Navigation im Browser stimmig sind.

## Grundregeln
- Unit 1 wird als Qualitaetsreferenz festgezogen.
- Unit 2-10 werden danach gegen dieselbe Referenz geprueft.
- Keine Originalseiten oder Volltexte aus dem Buch ins Repo uebernehmen.
- Private Seeds bleiben unter `private-content/` und werden nicht versioniert.
- App-Inhalte sollen nah am Buchfluss bleiben, aber als Lernflow funktionieren.
- Jede Section darf eine Uebung im Default-Flow nur einmal anzeigen.

## Abnahmestatus
| Unit | Status | Notizen |
|---|---|---|
| Unit 1 | offen | Referenzrunde starten |
| Unit 2 | offen | gegen Unit-1-Referenz angleichen |
| Unit 3 | offen | gegen Unit-1-Referenz angleichen |
| Unit 4 | offen | gegen Unit-1-Referenz angleichen |
| Unit 5 | offen | gegen Unit-1-Referenz angleichen |
| Unit 6 | offen | gegen Unit-1-Referenz angleichen |
| Unit 7 | offen | gegen Unit-1-Referenz angleichen |
| Unit 8 | offen | gegen Unit-1-Referenz angleichen |
| Unit 9 | offen | gegen Unit-1-Referenz angleichen |
| Unit 10 | offen | gegen Unit-1-Referenz angleichen |

## Unit-Check
Pro Unit pruefen:
- Die Unit-Auswahl zeigt Titel, Untertitel und Fortschritt eindeutig.
- Die Section-Reihenfolge entspricht der Buchlogik.
- Jede Section hat einen klaren Fokus und keine ueberfluessigen Erklaertexte.
- Die Lernbereiche `Grammatik`, `Vokabeln`, `Listening` und `Zuordnung` wirken getrennt und nicht doppelt.
- Der Zurueckweg aus Sections landet nachvollziehbar in der Unit.
- Der Unit-Index springt zur zuletzt gewaehlten Unit bzw. Section, wenn das gewuenscht ist.

## Section-Check
Pro Section pruefen:
- Grammatik erklaert genau das relevante Sprachmuster.
- Beispiele sind kurz, technisch passend und nicht generisch.
- Vokabeln sind als Karten gut scannbar und fachlich relevant.
- Listening erscheint nur einmal: Audio/Track plus zugehoerige Listening-Uebung im Bereich `Listening`.
- Zuordnungsuebungen stehen im Bereich `Zuordnung`, nicht zusaetzlich als Sammelduplikat.
- Cloze-Uebungen sind inline lesbar und nicht als lange Liste einzelner Eingabefelder.
- Nicht-auditive Cloze-/Grammatikuebungen zeigen die noetigen Einsatzwoerter direkt in der Karte.
- Feedback und Loesungshinweis sind hilfreich genug, aber nicht zu lang.

## Uebungsabdeckung
Pro Unit pruefen:
- Jede Section hat mindestens eine klare aktive Lernhandlung.
- Unteraufgaben wie `2a`, `2b`, `2c` werden einzeln gegen Buch und Answer Key geprueft, nicht nur als Hauptnummer `2`.
- Der Uebungstyp passt zum Inhalt: Listening-Cloze nur bei Audio, Matching nur bei Zuordnung, Cloze fuer Sprachmuster.
- Keine Uebung ist durch UI-Dopplung zweimal sichtbar.
- Wiederholen einer Uebung setzt nur den lokalen Versuch zurueck, nicht den bereits erreichten Fortschritt.
- Falsche Antworten zeigen eine sinnvolle Erklaerung.

## Vokabelqualitaet
Pro Unit pruefen:
- Vokabeln sind wirklich pruefungs- und buchrelevant.
- Vorderseite: Englisch + Deutsch.
- Rueckseite: kurze Erklaerung + englisches Beispiel + deutsche Bedeutung.
- Statuslogik funktioniert: neu, wiederholen, gemerkt.
- Unit-Abschlussquiz fragt die wichtigsten Vokabeln noch einmal ab.

## Listening-Qualitaet
Pro Unit pruefen:
- Alle verwendeten Tracks starten lokal.
- Track und Listening-Uebung sind im richtigen Abschnitt.
- Transcript-Reveal funktioniert.
- `Als gehoert` aktualisiert Fortschritt.
- Listening-Task und Audio-Karte wirken wie ein zusammenhaengender Block, nicht wie zwei getrennte Duplikate.

## Automatische Checks
Vor jeder inhaltlichen Abnahme ausfuehren:
```bash
npm run qa
npm run qa:routes
```

Erwartung:
- `content:check` meldet 10 Units ohne Fehler.
- `repo:safety` meldet keine privaten Inhalte im Git-Trackset.
- `typecheck` und `lint` sind gruen.
- `qa:routes` meldet alle Haupt-, Unit-, Section- und Quiz-Routen mit `200 OK`.

## Manuelle Referenzrunde fuer Unit 1
1. `/unit` oeffnen.
2. Unit 1 oeffnen.
3. Section 1A oeffnen.
4. Pruefen: Grammatik, Vokabeln, Listening, Zuordnung erscheinen jeweils genau einmal.
5. Eine Matching-Uebung loesen.
6. Eine Cloze- oder Listening-Cloze-Uebung loesen.
7. Eine Vokabelkarte umdrehen.
8. Zurueck zur Unit und eine zweite Section oeffnen.
9. Fortschritt pruefen.
10. Setup-Reset testen und Fortschritt erneut pruefen.

## Abnahmeregel
Wenn in einer Unit eine UI-Dopplung, ein falscher Rueckweg, eine unklare Uebung oder ein inhaltlicher Ausreisser auffaellt, wird das direkt in dieser Unit behoben. Erst danach geht die naechste Unit in die Pruefung.
