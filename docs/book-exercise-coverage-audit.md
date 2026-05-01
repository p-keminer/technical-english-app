# Buch-zu-App-Übungsabdeckung

Stand: 2026-05-01

## Ziel

Dieses Audit zählt pro Unit-Abschnitt, welche Hauptübungen aus dem Buch in der App referenziert sind.

Wichtig: Das ist die erste harte Coverage-Ebene. Sie zählt Hauptübungen wie `ex. 8`, nicht jede Unteraufgabe wie `8a`, `8b`, `8c`. Für die Klausur-App reicht diese Ebene noch nicht als endgültige Vollständigkeitsprüfung, aber sie zeigt sofort, welche Buchübungsnummern aktuell gar nicht in der App vorkommen.

Wiederholbarer Check:

```bash
npm run content:audit-coverage
```

## Ergebnis

Aktueller Stand: `0/40` Unit-Abschnitte haben mindestens eine fehlende Hauptübungsnummer.

| Unit | Section | Buch-Hauptübungen | App-Karten | Abgedeckt | Fehlt |
| --- | --- | ---: | ---: | --- | --- |
| unit-1 | Unit 1A | 5 | 5 | 1, 2, 3, 4, 5 | - |
| unit-1 | Unit 1B | 4 | 5 | 6, 7, 8, 9 | - |
| unit-1 | Unit 1C | 4 | 5 | 10, 11, 12, 13 | - |
| unit-1 | Unit 1D | 4 | 7 | 14, 15, 16, 17 | - |
| unit-2 | Unit 2A | 4 | 7 | 1, 2, 3, 4 | - |
| unit-2 | Unit 2B | 3 | 4 | 5, 6, 7 | - |
| unit-2 | Unit 2C | 4 | 4 | 8, 9, 10, 11 | - |
| unit-2 | Unit 2D | 5 | 7 | 12, 13, 14, 15, 16 | - |
| unit-3 | Unit 3A | 4 | 6 | 1, 2, 3, 4 | - |
| unit-3 | Unit 3B | 4 | 4 | 5, 6, 7, 8 | - |
| unit-3 | Unit 3C | 4 | 5 | 9, 10, 11, 12 | - |
| unit-3 | Unit 3D | 3 | 4 | 13, 14, 15 | - |
| unit-4 | Unit 4A | 5 | 7 | 1, 2, 3, 4, 5 | - |
| unit-4 | Unit 4B | 3 | 5 | 6, 7, 8 | - |
| unit-4 | Unit 4C | 4 | 6 | 9, 10, 11, 12 | - |
| unit-4 | Unit 4D | 2 | 4 | 13, 14 | - |
| unit-5 | Unit 5A | 4 | 7 | 1, 2, 3, 4 | - |
| unit-5 | Unit 5B | 3 | 5 | 5, 6, 7 | - |
| unit-5 | Unit 5C | 3 | 4 | 8, 9, 10 | - |
| unit-5 | Unit 5D | 5 | 6 | 11, 12, 13, 14, 15 | - |
| unit-6 | Unit 6A | 4 | 6 | 1, 2, 3, 4 | - |
| unit-6 | Unit 6B | 3 | 5 | 5, 6, 7 | - |
| unit-6 | Unit 6C | 3 | 6 | 8, 9, 10 | - |
| unit-6 | Unit 6D | 3 | 5 | 11, 12, 13 | - |
| unit-7 | Unit 7A | 4 | 6 | 1, 2, 3, 4 | - |
| unit-7 | Unit 7B | 3 | 4 | 5, 6, 7 | - |
| unit-7 | Unit 7C | 4 | 5 | 8, 9, 10, 11 | - |
| unit-7 | Unit 7D | 4 | 5 | 12, 13, 14, 15 | - |
| unit-8 | Unit 8A | 4 | 7 | 1, 2, 3, 4 | - |
| unit-8 | Unit 8B | 3 | 4 | 5, 6, 7 | - |
| unit-8 | Unit 8C | 3 | 6 | 8, 9, 10 | - |
| unit-8 | Unit 8D | 3 | 5 | 11, 12, 13 | - |
| unit-9 | Unit 9A | 3 | 4 | 1, 2, 3 | - |
| unit-9 | Unit 9B | 3 | 5 | 4, 5, 6 | - |
| unit-9 | Unit 9C | 5 | 6 | 7, 8, 9, 10, 11 | - |
| unit-9 | Unit 9D | 2 | 3 | 13, 14 | - |
| unit-10 | Unit 10A | 3 | 4 | 1, 2, 3 | - |
| unit-10 | Unit 10B | 1 | 3 | 4 | - |
| unit-10 | Unit 10C | 3 | 5 | 5, 6, 7 | - |
| unit-10 | Unit 10D | 2 | 6 | 8, 9 | - |

## Interpretation

- Die App ist aktuell nicht vollständig buchabdeckend.
- Einige App-Karten bündeln mehrere Unteraufgaben, deshalb ist `App-Karten >= Buch-Hauptübungen` nicht automatisch vollständig.
- Umgekehrt zeigt `Fehlt` harte Lücken: Diese Hauptübungsnummern tauchen aktuell in keiner App-Übung der jeweiligen Section auf.
- Als nächstes muss pro Section die fehlende Hauptübung bewertet werden: Lernrelevant, reine Partner-/Sprechübung, reine Schreibaufgabe oder bereits implizit in einer anderen App-Karte enthalten.

## Nächste Arbeitspakete

1. Audit auf Unteraufgaben-Ebene (`8a`, `8b`, `8c`) erweitern.
2. Pro Abschnitt prüfen, ob die App-Karten alle Unteraufgaben und Listening-Verweise sinnvoll abdecken.
3. Anschließend denselben Ablauf Unit für Unit wiederholen.
4. Nach jeder Unit `npm run content:audit-coverage` laufen lassen.
5. Wenn alle Hauptübungen abgedeckt sind, erweitern wir das Audit auf Unteraufgaben-Ebene (`8a`, `8b`, `8c`).
